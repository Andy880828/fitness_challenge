/**
 * 量測（4 次 InBody）CRUD。
 * 索引固定 0..3 對映 [初始, 第4週, 第8週, 結算]。
 */

import type { Database } from '#shared/types/database'
import type {
  Measurement,
  MeasurementInput,
  MeasurementsByWeek,
  WeekIndex,
} from '#shared/types/measure'

type Row = Database['public']['Tables']['measurements']['Row']

const fromRow = (r: Row): Measurement => ({
  participantId: r.participant_id,
  weekIndex: r.week_index,
  weight: Number(r.weight),
  fatPct: Number(r.fat_pct),
  muscle: Number(r.muscle),
  measuredOn: r.measured_on,
  createdAt: r.created_at,
  updatedAt: r.updated_at,
})

export const useMeasures = () => {
  const supabase = useSupabaseClient<any>()

  const list = async (participantId: string): Promise<MeasurementsByWeek> => {
    const { data, error } = await supabase
      .from('measurements')
      .select('*')
      .eq('participant_id', participantId)
      .order('week_index', { ascending: true })
    if (error || !data) return {}
    const result: MeasurementsByWeek = {}
    for (const r of data) result[r.week_index as WeekIndex] = fromRow(r)
    return result
  }

  const upsert = async (
    participantId: string,
    weekIndex: WeekIndex,
    input: MeasurementInput,
  ): Promise<{ data: Measurement | null; error: string | null }> => {
    const { data, error } = await supabase
      .from('measurements')
      .upsert(
        {
          participant_id: participantId,
          week_index: weekIndex,
          weight: input.weight,
          fat_pct: input.fatPct,
          muscle: input.muscle,
          measured_on: input.measuredOn ?? new Date().toISOString().slice(0, 10),
        },
        { onConflict: 'participant_id,week_index' },
      )
      .select()
      .single()
    if (error || !data) return { data: null, error: error?.message ?? '量測寫入失敗' }
    return { data: fromRow(data), error: null }
  }

  return { list, upsert }
}
