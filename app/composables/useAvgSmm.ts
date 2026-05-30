/**
 * useAvgSmm — 同性別第 0 週骨骼肌量平均（AVG_SMM）。
 *
 * 屬於跨參賽者依賴：個人分數的 musCoef = sm0 / AVG_SMM 需要這個值。
 * 為避免每頁重抓，存進 Nuxt useState 共用；首次任一頁 await load() 即可。
 *
 * 名單或量測異動後，可呼叫 refresh() 重算（例如 LeaderboardTabs 切換、報名新人）。
 */

import type { AvgSmm } from '#shared/types/score'
import type { Gender } from '#shared/types/participant'
import { computeAvgSmm } from '#shared/utils/score'

interface AvgSmmState extends AvgSmm {
  ready: boolean
}

export const useAvgSmm = () => {
  const supabase = useSupabaseClient<any>()
  const state = useState<AvgSmmState>('score:avg-smm', () => ({
    M: 0,
    F: 0,
    ready: false,
  }))

  const load = async (force = false): Promise<void> => {
    if (state.value.ready && !force) return

    // 直接從 measurements 抓 week_index=0，join participants 取性別。
    // 用 leaderboard_view 雖然有 measure_count 但沒拆 week-0 muscle，所以走兩步：
    //   1) 抓 measurements (week_index=0)
    //   2) 抓 participants gender 對應
    const [measuresRes, participantsRes] = await Promise.all([
      supabase.from('measurements').select('participant_id, muscle').eq('week_index', 0),
      supabase.from('participants').select('id, gender'),
    ])

    const measures = measuresRes.data ?? []
    const participants = participantsRes.data ?? []

    const genderById = new Map<string, Gender>()
    for (const p of participants) {
      if (p?.id && (p.gender === 'M' || p.gender === 'F')) {
        genderById.set(p.id, p.gender)
      }
    }

    const rows = measures
      .map((m: { participant_id: string; muscle: string | number }) => {
        const gender = genderById.get(m.participant_id)
        if (!gender) return null
        const muscle = Number(m.muscle)
        if (!(muscle > 0)) return null
        return { gender, muscle }
      })
      .filter((r): r is { gender: Gender; muscle: number } => r !== null)

    const avg = computeAvgSmm(rows)
    state.value = {
      M: avg.M,
      F: avg.F,
      ready: avg.M > 0 || avg.F > 0,
    }
  }

  const value = computed<AvgSmm>(() => ({ M: state.value.M, F: state.value.F }))
  const ready = computed(() => state.value.ready)

  return { state: readonly(state), value, ready, load, refresh: () => load(true) }
}
