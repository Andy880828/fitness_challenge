/**
 * useProfileData — 集中 dashboard 與 profile/[id] 共用的資料抓取邏輯。
 * 給定 participant，並行抓 measurements + checkin counts + photo days，
 * 用 useScore.calc 算出 ScoreBreakdown。
 */

import type { Participant } from '#shared/types/participant'
import type { MeasurementsByWeek } from '#shared/types/measure'
import type { ScoreBreakdown } from '#shared/types/score'

export interface ProfileData {
  measurements: MeasurementsByWeek
  workoutDays: number
  dietDays: number
  photoDays: number
  score: ScoreBreakdown
}

export const useProfileData = () => {
  const { list: listMeasures } = useMeasures()
  const { countAll } = useCheckins()
  const { listByParticipant } = usePhotos()
  const { calc } = useScore()

  const load = async (participant: Participant): Promise<ProfileData> => {
    const [measurements, counts, photos] = await Promise.all([
      listMeasures(participant.id),
      countAll(participant.id),
      listByParticipant(participant.id),
    ])
    const photoDays = Object.keys(photos).length
    const score = calc({
      gender: participant.gender,
      measurements,
      workoutDays: counts.workoutDays,
      dietDays: counts.dietDays,
      photoDays,
    })
    return {
      measurements,
      workoutDays: counts.workoutDays,
      dietDays: counts.dietDays,
      photoDays,
      score,
    }
  }

  return { load }
}
