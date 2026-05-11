/**
 * 打卡 — 月份範圍查詢 + upsert toggle。
 * 採不可變更新：toggle 後永遠回傳新的 CheckinsByDate 物件。
 */

import type { Database } from '#shared/types/database'
import type { Checkin, CheckinsByDate } from '#shared/types/checkin'
import { addDays, todayStr } from '#shared/utils/date'
import { CHECKIN_BACKFILL_DAYS } from '#shared/utils/constants'

type Row = Database['public']['Tables']['checkins']['Row']

const fromRow = (r: Row): Checkin => ({
  participantId: r.participant_id,
  date: r.date,
  workout: r.workout,
  diet: r.diet,
  updatedAt: r.updated_at,
})

export const useCheckins = () => {
  const supabase = useSupabaseClient<any>()

  const listRange = async (
    participantId: string,
    fromDate: string,
    toDate: string,
  ): Promise<CheckinsByDate> => {
    const { data, error } = await supabase
      .from('checkins')
      .select('*')
      .eq('participant_id', participantId)
      .gte('date', fromDate)
      .lte('date', toDate)
    if (error || !data) return {}
    const result: CheckinsByDate = {}
    for (const r of data) {
      result[r.date] = { workout: r.workout, diet: r.diet }
    }
    return result
  }

  const countAll = async (
    participantId: string,
  ): Promise<{ workoutDays: number; dietDays: number }> => {
    const { data, error } = await supabase
      .from('checkins')
      .select('workout, diet')
      .eq('participant_id', participantId)
    if (error || !data) return { workoutDays: 0, dietDays: 0 }
    let workoutDays = 0
    let dietDays = 0
    for (const r of data) {
      if (r.workout) workoutDays += 1
      if (r.diet) dietDays += 1
    }
    return { workoutDays, dietDays }
  }

  const toggle = async (
    participantId: string,
    date: string,
    field: 'workout' | 'diet',
    next: boolean,
    current: { workout: boolean; diet: boolean } = { workout: false, diet: false },
  ): Promise<{ data: Checkin | null; error: string | null }> => {
    const today = todayStr()
    if (date > today) {
      return { data: null, error: '無法打未來的卡' }
    }
    const earliest = addDays(today, -CHECKIN_BACKFILL_DAYS)
    if (date < earliest) {
      return { data: null, error: `補打卡僅限近 ${CHECKIN_BACKFILL_DAYS} 天內` }
    }
    const payload = {
      participant_id: participantId,
      date,
      workout: field === 'workout' ? next : current.workout,
      diet: field === 'diet' ? next : current.diet,
    }
    const { data, error } = await supabase
      .from('checkins')
      .upsert(payload, { onConflict: 'participant_id,date' })
      .select()
      .single()
    if (error || !data) return { data: null, error: error?.message ?? '打卡失敗' }
    return { data: fromRow(data), error: null }
  }

  return { listRange, countAll, toggle }
}
