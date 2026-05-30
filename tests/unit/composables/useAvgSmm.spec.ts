/**
 * useAvgSmm — 抓 participants + week_index=0 measurements，
 * 依性別算骨骼肌量平均，存進 useState 共用。
 */

import { ref } from 'vue'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { useAvgSmm } from '~/composables/useAvgSmm'
import { createMockSupabase } from '../helpers/supabase-mock'

describe('useAvgSmm', () => {
  beforeEach(() => {
    vi.stubGlobal('useSupabaseUser', () => ref(null))
  })

  it('load 後依性別正確計算 AVG_SMM', async () => {
    const supabase = createMockSupabase(({ table }) => {
      if (table === 'measurements') {
        return {
          data: [
            { participant_id: 'p1', muscle: '30' },
            { participant_id: 'p2', muscle: '40' },
            { participant_id: 'p3', muscle: '20' },
          ],
          error: null,
        }
      }
      if (table === 'participants') {
        return {
          data: [
            { id: 'p1', gender: 'M' },
            { id: 'p2', gender: 'M' },
            { id: 'p3', gender: 'F' },
          ],
          error: null,
        }
      }
      return { data: null, error: null }
    })
    vi.stubGlobal('useSupabaseClient', () => supabase)

    const { value, ready, load } = useAvgSmm()
    await load()

    expect(ready.value).toBe(true)
    expect(value.value.M).toBe(35)
    expect(value.value.F).toBe(20)
  })

  it('該性別 0 人 → 該性別回 0', async () => {
    const supabase = createMockSupabase(({ table }) => {
      if (table === 'measurements') {
        return { data: [{ participant_id: 'p1', muscle: '30' }], error: null }
      }
      if (table === 'participants') {
        return { data: [{ id: 'p1', gender: 'M' }], error: null }
      }
      return { data: null, error: null }
    })
    vi.stubGlobal('useSupabaseClient', () => supabase)

    const { value, load } = useAvgSmm()
    await load()

    expect(value.value.M).toBe(30)
    expect(value.value.F).toBe(0)
  })

  it('已 ready 後再 load 不會重抓（除非 force=true）', async () => {
    const supabase = createMockSupabase(({ table }) => {
      if (table === 'measurements') {
        return { data: [{ participant_id: 'p1', muscle: '30' }], error: null }
      }
      if (table === 'participants') {
        return { data: [{ id: 'p1', gender: 'M' }], error: null }
      }
      return { data: null, error: null }
    })
    vi.stubGlobal('useSupabaseClient', () => supabase)

    const { load, refresh } = useAvgSmm()
    await load()
    const firstCallCount = supabase.from.mock.calls.length

    await load()
    expect(supabase.from.mock.calls.length).toBe(firstCallCount) // no extra calls

    await refresh()
    expect(supabase.from.mock.calls.length).toBeGreaterThan(firstCallCount)
  })
})
