/**
 * useCheckins — listRange / countAll / toggle。
 */

import { ref } from 'vue'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { useCheckins } from '~/composables/useCheckins'
import { createMockSupabase } from '../helpers/supabase-mock'
import { sampleCheckins, checkinRow } from '../../fixtures/checkins'

describe('useCheckins', () => {
  beforeEach(() => {
    // 把 system time 鎖在 2026-05-11；測試案例用 '2026-05-10' 作 toggle 日期，
    // 落在「補打卡 3 天上限」窗內，避免測試環境真實時間漂移導致防呆搶先回傳 error。
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-05-11T00:00:00Z'))
    vi.stubGlobal('useSupabaseUser', () => ref(null))
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('listRange 將 rows 轉成 date-keyed map', async () => {
    const supabase = createMockSupabase({ data: sampleCheckins, error: null })
    vi.stubGlobal('useSupabaseClient', () => supabase)
    const { listRange } = useCheckins()
    const m = await listRange('p-male-1', '2026-04-01', '2026-04-30')
    expect(m['2026-04-01']).toEqual({ workout: true, diet: true })
    expect(m['2026-04-02']).toEqual({ workout: true, diet: false })
    expect(m['2026-04-04']).toEqual({ workout: false, diet: false })
  })

  it('listRange error 回空 map', async () => {
    const supabase = createMockSupabase({ data: null, error: { message: 'x' } })
    vi.stubGlobal('useSupabaseClient', () => supabase)
    const { listRange } = useCheckins()
    expect(await listRange('p-1', '2026-04-01', '2026-04-30')).toEqual({})
  })

  it('countAll 統計 workout 與 diet 天數', async () => {
    const supabase = createMockSupabase({ data: sampleCheckins, error: null })
    vi.stubGlobal('useSupabaseClient', () => supabase)
    const { countAll } = useCheckins()
    const c = await countAll('p-male-1')
    expect(c.workoutDays).toBe(2)
    expect(c.dietDays).toBe(2)
  })

  it('countAll error 回零', async () => {
    const supabase = createMockSupabase({ data: null, error: { message: 'x' } })
    vi.stubGlobal('useSupabaseClient', () => supabase)
    const { countAll } = useCheckins()
    expect(await countAll('p-1')).toEqual({ workoutDays: 0, dietDays: 0 })
  })

  it('toggle workout 保留 diet 現值', async () => {
    const row = checkinRow('2026-05-10', true, true)
    const supabase = createMockSupabase({ data: row, error: null })
    vi.stubGlobal('useSupabaseClient', () => supabase)
    const { toggle } = useCheckins()
    const res = await toggle('p-male-1', '2026-05-10', 'workout', true, {
      workout: false,
      diet: true,
    })
    expect(res.error).toBeNull()
    expect(res.data?.workout).toBe(true)
    expect(res.data?.diet).toBe(true)
  })

  it('toggle DB 失敗回 error', async () => {
    const supabase = createMockSupabase({ data: null, error: { message: 'rls denied' } })
    vi.stubGlobal('useSupabaseClient', () => supabase)
    const { toggle } = useCheckins()
    const res = await toggle('p-1', '2026-05-10', 'workout', true)
    expect(res.error).toBe('rls denied')
    expect(res.data).toBeNull()
  })

  it('toggle 拒絕未來日期且不呼叫 supabase', async () => {
    const supabase = createMockSupabase({ data: null, error: null })
    vi.stubGlobal('useSupabaseClient', () => supabase)
    const { toggle } = useCheckins()
    const res = await toggle('p-1', '2099-01-01', 'workout', true)
    expect(res.error).toBe('無法打未來的卡')
    expect(res.data).toBeNull()
    expect(supabase.from).not.toHaveBeenCalled()
  })

  it('toggle 拒絕超過 3 天前的日期且不呼叫 supabase', async () => {
    const supabase = createMockSupabase({ data: null, error: null })
    vi.stubGlobal('useSupabaseClient', () => supabase)
    const { toggle } = useCheckins()
    // 2000-01-01 必然超過 3 天前
    const res = await toggle('p-1', '2000-01-01', 'workout', true)
    expect(res.error).toBe('補打卡僅限近 3 天內')
    expect(res.data).toBeNull()
    expect(supabase.from).not.toHaveBeenCalled()
  })
})
