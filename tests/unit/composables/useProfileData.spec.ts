/**
 * useProfileData — 聚合 measure / checkin / photo / score 的高階 composable。
 */

import { ref } from 'vue'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { useProfileData } from '~/composables/useProfileData'
import { createMockSupabase, type SupabaseResponse } from '../helpers/supabase-mock'
import { maleParticipant } from '../../fixtures/participants'
import { measureRow } from '../../fixtures/measurements'
import { sampleCheckins } from '../../fixtures/checkins'

describe('useProfileData', () => {
  beforeEach(() => {
    
    vi.stubGlobal('useSupabaseUser', () => ref(null))
  })

  it('load 並行抓 measures + checkins + photos 並算 score', async () => {
    const measureRows = [
      measureRow(0, 80, 20, 30),
      measureRow(3, 74, 14, 33),
    ]
    const photoRows = [
      {
        id: 'ph1',
        participant_id: maleParticipant.id,
        date: '2026-04-01',
        storage_path: 'x',
        public_url: 'y',
        size_bytes: 100,
        uploaded_at: '2026-04-01T00:00:00Z',
      },
    ]
    const supabase = createMockSupabase(({ table }) => {
      const responses: Record<string, SupabaseResponse> = {
        measurements: { data: measureRows, error: null },
        checkins: { data: sampleCheckins, error: null },
        photos: { data: photoRows, error: null },
      }
      return responses[table] ?? { data: null, error: null }
    })
    vi.stubGlobal('useSupabaseClient', () => supabase)

    const { load } = useProfileData()
    const data = await load(maleParticipant)

    expect(data.measurements[0]?.weight).toBe(80)
    expect(data.measurements[3]?.weight).toBe(74)
    expect(data.workoutDays).toBe(2)
    expect(data.dietDays).toBe(2)
    expect(data.photoDays).toBe(1)
    expect(data.score).toHaveProperty('total')
  })

  it('load 在無資料時不 throw', async () => {
    const supabase = createMockSupabase({ data: null, error: null })
    vi.stubGlobal('useSupabaseClient', () => supabase)
    const { load } = useProfileData()
    const data = await load(maleParticipant)
    expect(data.workoutDays).toBe(0)
    expect(data.photoDays).toBe(0)
    expect(data.measurements).toEqual({})
  })
})
