import type { Measurement } from './measure'

export interface AvgSmm {
  M: number
  F: number
}

export interface ScoreInput {
  gender: 'M' | 'F'
  measurements: Measurement[]
  workoutDays: number
  dietDays: number
  photoDays: number
  effectiveDays: number
  avgSmm: AvgSmm
}

export interface ScoreBreakdown {
  // 顯示用最終分數（0–40 / 0–40 / 0–20）
  fatScore: number
  muscleScore: number
  processScore: number
  total: number

  // 原始相對變化率 (%)
  fatChange: number
  muscleChange: number

  // 打卡統計
  workoutDays: number
  dietDays: number
  photoDays: number
  measureCount: number

  // 加權中間量（規則頁 / ScoreBreakdown 顯示用）
  fatCoef: number // F_REF / bf0
  musCoef: number // sm0 / AVG_SMM（avgSmmReady=false 時退回 1）
  weightedFat: number // max(0, rawFatLoss) * fatCoef
  weightedMus: number // max(0, rawMusGain) * musCoef
  fatNorm: number // 0–100
  musNorm: number // 0–100
  procNorm: number // 0–100
  avgSmmReady: boolean

  start: Pick<Measurement, 'weight' | 'fatPct' | 'muscle'> | null
  latest: Pick<Measurement, 'weight' | 'fatPct' | 'muscle'> | null
}
