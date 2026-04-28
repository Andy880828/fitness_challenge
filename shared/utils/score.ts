/**
 * 計分公式 — 1:1 對映自 fitness-challenge.html 的 computeScore
 * 三項加權：減脂 40 + 增肌 40 + 過程 20 = 100
 */

import { FAT_CAP, MUSCLE_CAP, SAFETY_FLOOR, SCORE_WEIGHTS } from './constants'
import type { Gender } from '#shared/types/participant'
import type { Measurement, MeasurementsByWeek, WeekIndex } from '#shared/types/measure'
import type { ScoreBreakdown } from '#shared/types/score'

export interface ScoreContext {
  gender: Gender
  measurements: MeasurementsByWeek
  workoutDays: number
  dietDays: number
  photoDays: number
  effectiveDays: number
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

export const computeScore = (ctx: ScoreContext): ScoreBreakdown => {
  const start = ctx.measurements[0] ?? null
  const latest = pickLatestValid(ctx.measurements)

  let fatChange = 0
  let muscleChange = 0

  if (start && latest && start.fatPct > 0) {
    const floor = SAFETY_FLOOR[ctx.gender]
    const effEnd = Math.max(latest.fatPct, floor)
    fatChange = ((start.fatPct - effEnd) / start.fatPct) * 100
  }

  if (start && latest && start.muscle > 0) {
    muscleChange = ((latest.muscle - start.muscle) / start.muscle) * 100
  }

  const totalCheckins = ctx.workoutDays + ctx.dietDays + ctx.photoDays
  const expectedCheckins = ctx.effectiveDays * 3
  const processScore =
    expectedCheckins > 0 ? Math.min(100, (totalCheckins / expectedCheckins) * 100) : 0

  const fatNorm = Math.min(100, (Math.max(0, fatChange) / FAT_CAP) * 100)
  const muscleNorm = Math.min(100, (Math.max(0, muscleChange) / MUSCLE_CAP) * 100)

  const total =
    fatNorm * SCORE_WEIGHTS.fat +
    muscleNorm * SCORE_WEIGHTS.muscle +
    processScore * SCORE_WEIGHTS.process

  const measureCount = (Object.values(ctx.measurements) as Measurement[]).filter(
    (m): m is Measurement => m != null && m.fatPct != null,
  ).length

  return {
    fatScore: fatNorm,
    muscleScore: muscleNorm,
    processScore,
    total,
    fatChange,
    muscleChange,
    workoutDays: ctx.workoutDays,
    dietDays: ctx.dietDays,
    photoDays: ctx.photoDays,
    measureCount,
    start: start
      ? { weight: start.weight, fatPct: start.fatPct, muscle: start.muscle }
      : null,
    latest: latest
      ? { weight: latest.weight, fatPct: latest.fatPct, muscle: latest.muscle }
      : null,
  }
}
