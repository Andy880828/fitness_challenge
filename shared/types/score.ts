import type { Measurement } from './measure'

export interface ScoreInput {
  gender: 'M' | 'F'
  measurements: Measurement[]
  workoutDays: number
  dietDays: number
  photoDays: number
  effectiveDays: number
}

export interface ScoreBreakdown {
  fatScore: number
  muscleScore: number
  processScore: number
  total: number
  fatChange: number
  muscleChange: number
  workoutDays: number
  dietDays: number
  photoDays: number
  measureCount: number
  start: Pick<Measurement, 'weight' | 'fatPct' | 'muscle'> | null
  latest: Pick<Measurement, 'weight' | 'fatPct' | 'muscle'> | null
}
