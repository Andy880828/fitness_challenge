/**
 * useParticipants — list / getById / getMine。
 */

import { ref } from 'vue'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { useParticipants } from '~/composables/useParticipants'
import { createMockSupabase } from '../helpers/supabase-mock'
import {
  leaderboardRowMale,
  leaderboardWithStats,
  maleParticipant,
  maleParticipantRow,
} from '../../fixtures/participants'

describe('useParticipants', () => {
  beforeEach(() => {
    
  })

  it('list 從 leaderboard_view 讀取並映射', async () => {
    const supabase = createMockSupabase({ data: [leaderboardRowMale], error: null })
    vi.stubGlobal('useSupabaseClient', () => supabase)
    vi.stubGlobal('useSupabaseUser', () => ref(null))

    const { list } = useParticipants()
    const result = await list()
    expect(result).toHaveLength(1)
    expect(result[0]).toEqual(leaderboardWithStats)
    expect(supabase.from).toHaveBeenCalledWith('leaderboard_view')
  })

  it('list with gender filter 加上 eq', async () => {
    const supabase = createMockSupabase({ data: [], error: null })
    vi.stubGlobal('useSupabaseClient', () => supabase)
    vi.stubGlobal('useSupabaseUser', () => ref(null))

    const { list } = useParticipants()
    await list('female')
    const ops = supabase.lastCalls[0]?.ops.map(o => o.method) ?? []
    expect(ops).toContain('eq')
  })

  it('list 錯誤時回空陣列', async () => {
    const supabase = createMockSupabase({ data: null, error: { message: 'fail' } })
    vi.stubGlobal('useSupabaseClient', () => supabase)
    vi.stubGlobal('useSupabaseUser', () => ref(null))
    const { list } = useParticipants()
    expect(await list()).toEqual([])
  })

  it('getById 找到', async () => {
    const supabase = createMockSupabase({ data: maleParticipantRow, error: null })
    vi.stubGlobal('useSupabaseClient', () => supabase)
    vi.stubGlobal('useSupabaseUser', () => ref(null))
    const { getById } = useParticipants()
    const p = await getById('p-male-1')
    expect(p).toEqual(maleParticipant)
  })

  it('getById 找不到回 null', async () => {
    const supabase = createMockSupabase({ data: null, error: { message: 'no row' } })
    vi.stubGlobal('useSupabaseClient', () => supabase)
    vi.stubGlobal('useSupabaseUser', () => ref(null))
    const { getById } = useParticipants()
    expect(await getById('missing')).toBeNull()
  })

  it('getMine 未登入回 null', async () => {
    const supabase = createMockSupabase({ data: null, error: null })
    vi.stubGlobal('useSupabaseClient', () => supabase)
    vi.stubGlobal('useSupabaseUser', () => ref(null))
    const { getMine } = useParticipants()
    expect(await getMine()).toBeNull()
  })

  it('getMine 已登入回 participant', async () => {
    const supabase = createMockSupabase({ data: maleParticipantRow, error: null })
    vi.stubGlobal('useSupabaseClient', () => supabase)
    vi.stubGlobal('useSupabaseUser', () => ref({ id: 'u-male-1' }))
    const { getMine } = useParticipants()
    const p = await getMine()
    expect(p?.id).toBe('p-male-1')
  })
})
