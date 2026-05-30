/**
 * v2.0 計分公式：難度係數加權 + 性別常數封頂歸一化。
 *
 * 三項加權：減脂 (max 40) + 增肌 (max 40) + 過程 (max 20) = 100
 *
 * 與 v1.x 的差別：
 *  - 引入難度係數：fatCoef = F_REF / bf0、musCoef = sm0 / AVG_SMM（線性、不開根號）
 *  - 加權後依性別常數封頂歸一化到 0–100：FAT_CAP=25、MUS_CAP=8
 *  - 過程分仍是 max(checks / effectiveDays*3, 0..100)；活動結束時等價於 84 天 × 3 = 252 個勾的滿分分母
 *
 * 為了讓單元測試可獨立餵 avgSmm，本函式保持純函式，
 * 跨參賽者依賴交給 `useAvgSmm` composable 在 client 層處理。
 */

import { SCORE_CONST, SCORE_WEIGHTS } from './constants'
import type { Gender } from '#shared/types/participant'
import type { Measurement, MeasurementsByWeek, WeekIndex } from '#shared/types/measure'
import type { AvgSmm, ScoreBreakdown } from '#shared/types/score'

export interface ScoreContext {
  gender: Gender
  measurements: MeasurementsByWeek
  workoutDays: number
  dietDays: number
  photoDays: number
  effectiveDays: number
  avgSmm: AvgSmm
}

const pickLatestValid = (m: MeasurementsByWeek): Measurement | null => {
  const keys = (Object.keys(m) as unknown as WeekIndex[])
    .map(Number)
    .filter((n): n is WeekIndex => [0, 1, 2, 3].includes(n as WeekIndex))
    .sort((a, b) => b - a) as WeekIndex[]
  for (const k of keys) {
    const entry = m[k]
    if (entry && entry.fatPct != null) return entry
  }
  return null
}

const emptyBreakdown = (
  workoutDays: number,
  dietDays: number,
  photoDays: number,
  measureCount: number,
  start: Measurement | null,
  latest: Measurement | null,
  procNorm: number,
  avgSmmReady: boolean,
): ScoreBreakdown => ({
  fatScore: 0,
  muscleScore: 0,
  processScore: procNorm * SCORE_WEIGHTS.process,
  total: procNorm * SCORE_WEIGHTS.process,
  fatChange: 0,
  muscleChange: 0,
  workoutDays,
  dietDays,
  photoDays,
  measureCount,
  fatCoef: 0,
  musCoef: 0,
  weightedFat: 0,
  weightedMus: 0,
  fatNorm: 0,
  musNorm: 0,
  procNorm,
  avgSmmReady,
  start: start ? { weight: start.weight, fatPct: start.fatPct, muscle: start.muscle } : null,
  latest: latest
    ? { weight: latest.weight, fatPct: latest.fatPct, muscle: latest.muscle }
    : null,
})

export const computeScore = (ctx: ScoreContext): ScoreBreakdown => {
  const start = ctx.measurements[0] ?? null
  const latest = pickLatestValid(ctx.measurements)
  const measureCount = (Object.values(ctx.measurements) as Measurement[]).filter(
    (m): m is Measurement => m != null && m.fatPct != null,
  ).length

  // 過程分（即使沒量測也算）
  const totalCheckins = ctx.workoutDays + ctx.dietDays + ctx.photoDays
  const expectedCheckins = ctx.effectiveDays * 3
  const procNorm =
    expectedCheckins > 0 ? Math.min(100, (totalCheckins / expectedCheckins) * 100) : 0

  const genderAvg = ctx.avgSmm[ctx.gender] ?? 0
  const avgSmmReady = genderAvg > 0

  // 缺初始 / 結束 / bf0 無效 → 體脂與肌肉分歸零（只剩過程分）
  if (!start || !latest || !(start.fatPct > 0) || !(start.muscle > 0)) {
    return emptyBreakdown(
      ctx.workoutDays,
      ctx.dietDays,
      ctx.photoDays,
      measureCount,
      start,
      latest,
      procNorm,
      avgSmmReady,
    )
  }

  const c = SCORE_CONST[ctx.gender]

  // 步驟一：原始變化率
  const rawFatLoss = ((start.fatPct - latest.fatPct) / start.fatPct) * 100
  const rawMusGain = ((latest.muscle - start.muscle) / start.muscle) * 100

  // 步驟二：難度係數（avgSmm 尚未 ready 時 musCoef 退回 1，避免分數爆炸）
  const fatCoef = c.F_REF / start.fatPct
  const musCoef = avgSmmReady ? start.muscle / genderAvg : 1

  // 步驟三：加權（負成績歸零）
  const weightedFat = Math.max(0, rawFatLoss) * fatCoef
  const weightedMus = Math.max(0, rawMusGain) * musCoef

  // 步驟四：歸一化（0–100）
  const fatNorm = Math.min(100, (weightedFat / c.FAT_CAP) * 100)
  const musNorm = Math.min(100, (weightedMus / c.MUS_CAP) * 100)

  // 步驟五：綜合分
  const fatScore = fatNorm * SCORE_WEIGHTS.fat
  const muscleScore = musNorm * SCORE_WEIGHTS.muscle
  const processScore = procNorm * SCORE_WEIGHTS.process
  const total = fatScore + muscleScore + processScore

  return {
    fatScore,
    muscleScore,
    processScore,
    total,
    fatChange: rawFatLoss,
    muscleChange: rawMusGain,
    workoutDays: ctx.workoutDays,
    dietDays: ctx.dietDays,
    photoDays: ctx.photoDays,
    measureCount,
    fatCoef,
    musCoef,
    weightedFat,
    weightedMus,
    fatNorm,
    musNorm,
    procNorm,
    avgSmmReady,
    start: { weight: start.weight, fatPct: start.fatPct, muscle: start.muscle },
    latest: { weight: latest.weight, fatPct: latest.fatPct, muscle: latest.muscle },
  }
}

/**
 * 從一批參賽者第 0 週量測算出 AVG_SMM（依性別）。
 * 該性別 0 人或皆無 week-0 量測 → 該性別回 0（呼叫端視為 not ready）。
 */
export const computeAvgSmm = (
  rows: ReadonlyArray<{ gender: Gender; muscle: number }>,
): AvgSmm => {
  const sum = { M: 0, F: 0 }
  const n = { M: 0, F: 0 }
  for (const r of rows) {
    if (!(r.muscle > 0)) continue
    sum[r.gender] += r.muscle
    n[r.gender] += 1
  }
  return {
    M: n.M > 0 ? sum.M / n.M : 0,
    F: n.F > 0 ? sum.F / n.F : 0,
  }
}
