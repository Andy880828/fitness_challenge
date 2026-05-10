/**
 * useGallery — listRecentPhotos / listAllProgress。
 */

import { ref } from 'vue'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { useGallery } from '~/composables/useGallery'
import { createMockSupabase } from '../helpers/supabase-mock'

const photoRow = (id: string, date: string, ownerName: string) => ({
  id,
  participant_id: `p-${id}`,
  date,
  storage_path: `path/${id}.jpg`,
  public_url: `http://x/${id}.jpg`,
  size_bytes: 1024,
  uploaded_at: `${date}T10:00:00Z`,
  participant: { id: `p-${id}`, name: ownerName, gender: 'M' as const },
})

const measureRow = (
  participantId: string,
  weekIndex: 0 | 1 | 2 | 3,
  weight: number,
  fatPct: number,
) => ({
  participant_id: participantId,
  week_index: weekIndex,
  weight,
  fat_pct: fatPct,
  muscle: 30,
  measured_on: '2026-01-01',
  created_at: '2026-01-01T00:00:00Z',
  updated_at: '2026-01-01T00:00:00Z',
})

const boardRow = (id: string, name: string, gender: 'M' | 'F' = 'M') => ({
  id,
  user_id: `u-${id}`,
  name,
  gender,
  start_weight: 80,
  measure_count: 2,
  workout_days: 10,
  diet_days: 8,
  photo_days: 5,
  total_photos: 12,
})

describe('useGallery', () => {
  beforeEach(() => {
    vi.stubGlobal('useSupabaseUser', () => ref(null))
  })

  it('listRecentPhotos 過濾 owner 為 null 的列', async () => {
    const supabase = createMockSupabase({
      data: [photoRow('a', '2026-04-01', '凱文'), { ...photoRow('b', '2026-04-02', '艾莉'), participant: null }],
      error: null,
    })
    vi.stubGlobal('useSupabaseClient', () => supabase)
    const { listRecentPhotos } = useGallery()
    const res = await listRecentPhotos(60, 0)
    expect(res).toHaveLength(1)
    expect(res[0]?.owner.name).toBe('凱文')
  })

  it('listRecentPhotos error 回空陣列', async () => {
    const supabase = createMockSupabase({ data: null, error: { message: 'rls' } })
    vi.stubGlobal('useSupabaseClient', () => supabase)
    const { listRecentPhotos } = useGallery()
    expect(await listRecentPhotos()).toEqual([])
  })

  it('listAllProgress 計算 weight / fat delta', async () => {
    const board = [boardRow('p-1', '凱文')]
    const measures = [
      measureRow('p-1', 0, 80, 22),
      measureRow('p-1', 1, 76, 19),
    ]
    const supabase = createMockSupabase(({ table }) => {
      if (table === 'leaderboard_view') return { data: board, error: null }
      if (table === 'measurements') return { data: measures, error: null }
      return { data: null, error: null }
    })
    vi.stubGlobal('useSupabaseClient', () => supabase)
    const { listAllProgress } = useGallery()
    const res = await listAllProgress()
    expect(res).toHaveLength(1)
    expect(res[0]?.weightDelta).toBe(-4)
    expect(res[0]?.fatDelta).toBe(-3)
    expect(res[0]?.weightTrend).toEqual([80, 76])
  })

  it('listAllProgress 無量測時 delta 為 null', async () => {
    const board = [boardRow('p-2', '艾莉', 'F')]
    const supabase = createMockSupabase(({ table }) => {
      if (table === 'leaderboard_view') return { data: board, error: null }
      if (table === 'measurements') return { data: [], error: null }
      return { data: null, error: null }
    })
    vi.stubGlobal('useSupabaseClient', () => supabase)
    const { listAllProgress } = useGallery()
    const res = await listAllProgress()
    expect(res[0]?.weightDelta).toBeNull()
    expect(res[0]?.fatDelta).toBeNull()
    expect(res[0]?.weightTrend).toEqual([])
  })
})
