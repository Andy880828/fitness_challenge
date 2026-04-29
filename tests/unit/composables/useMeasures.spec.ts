/**
 * useMeasures — list（4-week 索引）與 upsert。
 */

import { ref } from 'vue'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { useMeasures } from '~/composables/useMeasures'
import { createMockSupabase } from '../helpers/supabase-mock'
import { measureRow } from '../../fixtures/measurements'

describe('useMeasures', () => {
  beforeEach(() => {
    
    vi.stubGlobal('useSupabaseUser', () => ref(null))
  })

  it('list 將 rows 索引到 weekIndex', async () => {
    const rows = [
      measureRow(0, 80, 20, 30),
      measureRow(1, 78, 18, 31),
      measureRow(3, 74, 14, 33),
    ]
    const supabase = createMockSupabase({ data: rows, error: null })
    vi.stubGlobal('useSupabaseClient', () => supabase)
    const { list } = useMeasures()
    const m = await list('p-male-1')
    expect(m[0]?.weight).toBe(80)
    expect(m[1]?.weight).toBe(78)
    expect(m[2]).toBeUndefined()
    expect(m[3]?.weight).toBe(74)
  })

  it('list error 回空物件', async () => {
    const supabase = createMockSupabase({ data: null, error: { message: 'x' } })
    vi.stubGlobal('useSupabaseClient', () => supabase)
    const { list } = useMeasures()
    expect(await list('p-1')).toEqual({})
  })

  it('upsert 成功回轉型後 Measurement', async () => {
    const supabase = createMockSupabase({ data: measureRow(1, 78, 18, 31), error: null })
    vi.stubGlobal('useSupabaseClient', () => supabase)
    const { upsert } = useMeasures()
    const res = await upsert('p-male-1', 1, { weight: 78, fatPct: 18, muscle: 31 })
    expect(res.error).toBeNull()
    expect(res.data?.weight).toBe(78)
    expect(res.data?.weekIndex).toBe(1)
  })

  it('upsert DB 失敗回 error', async () => {
    const supabase = createMockSupabase({ data: null, error: { message: 'fail' } })
    vi.stubGlobal('useSupabaseClient', () => supabase)
    const { upsert } = useMeasures()
    const res = await upsert('p-1', 0, { weight: 80, fatPct: 20, muscle: 30 })
    expect(res.error).toBe('fail')
    expect(res.data).toBeNull()
  })
})
