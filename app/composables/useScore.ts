/**
 * 將計分公式包成 composable，自動帶入 effectiveDays 與 AVG_SMM。
 * 純函式計算（utils/score.ts），不打 DB——分數可隨時依 UI 即時刷新。
 *
 * AVG_SMM 由 useAvgSmm 在背景 load；若呼叫端尚未 await load()，
 * 此 calc 仍會回傳合理結果（musCoef=1 + avgSmmReady=false），
 * 待 useAvgSmm load 完後下一次 reactive 重算即可。
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
  const { value: avgSmm, ready: avgSmmReady, load } = useAvgSmm()

  const calc = (input: UseScoreInput): ScoreBreakdown =>
    computeScore({
      gender: input.gender,
      measurements: input.measurements,
      workoutDays: input.workoutDays,
      dietDays: input.dietDays,
      photoDays: input.photoDays,
      effectiveDays: effectiveDays.value,
      avgSmm: avgSmm.value,
    })

  return { calc, effectiveDays, avgSmm, avgSmmReady, loadAvgSmm: load }
}
