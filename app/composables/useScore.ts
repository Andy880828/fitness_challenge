/**
 * 將計分公式包成 composable，自動帶入 effectiveDays（依挑戰賽設定）。
 * 純前端計算（utils/score.ts），不打 DB——分數可隨時依 UI 即時刷新。
 */

import type { Gender } from '#shared/types/participant'
import type { MeasurementsByWeek } from '#shared/types/measure'
import type { ScoreBreakdown } from '#shared/types/score'
import { computeScore } from '#shared/utils/score'

export interface UseScoreInput {
  gender: Gender
  measurements: MeasurementsByWeek
  workoutDays: number
  dietDays: number
  photoDays: number
}

export const useScore = () => {
  const { effectiveDays } = useChallenge()

  const calc = (input: UseScoreInput): ScoreBreakdown =>
    computeScore({
      gender: input.gender,
      measurements: input.measurements,
      workoutDays: input.workoutDays,
      dietDays: input.dietDays,
      photoDays: input.photoDays,
      effectiveDays: effectiveDays.value,
    })

  return { calc, effectiveDays }
}
