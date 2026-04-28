/**
 * 參賽者列表與單一查詢。
 * 列表透過 leaderboard_view（已聚合 measure / checkin / photo 統計）讀取，
 * 排行榜只需此 view 即可組合分數。
 */

import type { Database } from '#shared/types/database'
import type { Participant, ParticipantWithStats, Gender } from '#shared/types/participant'

type ParticipantRow = Database['public']['Tables']['participants']['Row']
type LeaderboardRow = Database['public']['Views']['leaderboard_view']['Row']

const fromRow = (r: ParticipantRow): Participant => ({
  id: r.id,
  userId: r.user_id,
  name: r.name,
  gender: r.gender,
  age: r.age,
  height: r.height,
  startWeight: Number(r.start_weight),
  joinedAt: r.joined_at,
})

const fromLeaderboardRow = (r: LeaderboardRow): ParticipantWithStats => ({
  id: r.id,
  userId: r.user_id,
  name: r.name,
  gender: r.gender,
  age: null,
  height: null,
  startWeight: Number(r.start_weight),
  joinedAt: '',
  measureCount: r.measure_count,
  workoutDays: r.workout_days,
  dietDays: r.diet_days,
  photoDays: r.photo_days,
  totalPhotos: r.total_photos,
})

export const useParticipants = () => {
  const supabase = useSupabaseClient<any>()
  const user = useSupabaseUser()

  const list = async (gender?: Gender): Promise<ParticipantWithStats[]> => {
    let q = supabase.from('leaderboard_view').select('*')
    if (gender) q = q.eq('gender', gender)
    const { data, error } = await q
    if (error || !data) return []
    return data.map(fromLeaderboardRow)
  }

  const getById = async (id: string): Promise<Participant | null> => {
    const { data, error } = await supabase
      .from('participants')
      .select('*')
      .eq('id', id)
      .single()
    if (error || !data) return null
    return fromRow(data)
  }

  const getMine = async (): Promise<Participant | null> => {
    if (!user.value) return null
    const { data, error } = await supabase
      .from('participants')
      .select('*')
      .eq('user_id', user.value.id)
      .maybeSingle()
    if (error || !data) return null
    return fromRow(data)
  }

  return { list, getById, getMine }
}
