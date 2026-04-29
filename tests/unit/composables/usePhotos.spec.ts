/**
 * usePhotos — listByParticipant / upload（壓縮 + $fetch）/ remove。
 */

import { ref } from 'vue'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { usePhotos } from '~/composables/usePhotos'
import { createMockSupabase } from '../helpers/supabase-mock'

const photoRow = (date: string, id = 'ph1') => ({
  id,
  participant_id: 'p-male-1',
  date,
  storage_path: `path/${id}.jpg`,
  public_url: `http://x/${id}.jpg`,
  size_bytes: 1024,
  uploaded_at: `${date}T00:00:00Z`,
})

describe('usePhotos', () => {
  beforeEach(() => {
    
    vi.stubGlobal('useSupabaseUser', () => ref(null))
  })

  it('listByParticipant 依 date 分組', async () => {
    const supabase = createMockSupabase({
      data: [photoRow('2026-04-01', 'a'), photoRow('2026-04-01', 'b'), photoRow('2026-04-02', 'c')],
      error: null,
    })
    vi.stubGlobal('useSupabaseClient', () => supabase)
    const { listByParticipant } = usePhotos()
    const m = await listByParticipant('p-male-1')
    expect(m['2026-04-01']).toHaveLength(2)
    expect(m['2026-04-02']).toHaveLength(1)
  })

  it('listByParticipant error 回空 map', async () => {
    const supabase = createMockSupabase({ data: null, error: { message: 'x' } })
    vi.stubGlobal('useSupabaseClient', () => supabase)
    const { listByParticipant } = usePhotos()
    expect(await listByParticipant('p-1')).toEqual({})
  })

  it('upload 檔案過大直接回 error 不打 API', async () => {
    const supabase = createMockSupabase({ data: null, error: null })
    vi.stubGlobal('useSupabaseClient', () => supabase)
    const fetchMock = vi.fn()
    vi.stubGlobal('$fetch', fetchMock)

    const huge = new File([new Uint8Array(3 * 1024 * 1024)], 'big.jpg', { type: 'image/jpeg' })
    const { upload } = usePhotos()
    const res = await upload('p-1', '2026-04-01', huge)
    expect(res.error).toMatch(/超過/)
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('upload 壓縮 + 打 /api/photos', async () => {
    const supabase = createMockSupabase({ data: null, error: null })
    vi.stubGlobal('useSupabaseClient', () => supabase)
    const fetchMock = vi.fn().mockResolvedValue({
      id: 'ph1',
      participantId: 'p-male-1',
      date: '2026-04-01',
      storagePath: 'x',
      publicUrl: 'y',
      sizeBytes: 100,
      uploadedAt: 'z',
    })
    vi.stubGlobal('$fetch', fetchMock)

    const file = new File([new Uint8Array(100)], 'a.jpg', { type: 'image/jpeg' })
    const { upload } = usePhotos()
    const res = await upload('p-male-1', '2026-04-01', file)
    expect(res.error).toBeNull()
    expect(res.data?.id).toBe('ph1')
    expect(fetchMock).toHaveBeenCalledWith('/api/photos', expect.objectContaining({ method: 'POST' }))
  })

  it('remove 呼叫 DELETE endpoint', async () => {
    const supabase = createMockSupabase({ data: null, error: null })
    vi.stubGlobal('useSupabaseClient', () => supabase)
    const fetchMock = vi.fn().mockResolvedValue({})
    vi.stubGlobal('$fetch', fetchMock)
    const { remove } = usePhotos()
    const res = await remove('ph1')
    expect(res.error).toBeNull()
    expect(fetchMock).toHaveBeenCalledWith('/api/photos/ph1', { method: 'DELETE' })
  })

  it('remove 失敗回 error message', async () => {
    const supabase = createMockSupabase({ data: null, error: null })
    vi.stubGlobal('useSupabaseClient', () => supabase)
    vi.stubGlobal('$fetch', vi.fn().mockRejectedValue(new Error('forbidden')))
    const { remove } = usePhotos()
    const res = await remove('ph1')
    expect(res.error).toBe('forbidden')
  })
})
