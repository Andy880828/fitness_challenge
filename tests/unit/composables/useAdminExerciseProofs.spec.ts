/**
 * useAdminExerciseProofs — 對稱於 useAdminPhotos 的驗證邏輯。
 */

import { beforeEach, describe, expect, it, vi } from 'vitest'
import { useAdminExerciseProofs } from '~/composables/useAdminExerciseProofs'

describe('useAdminExerciseProofs', () => {
  beforeEach(() => {
    vi.stubGlobal('$fetch', vi.fn())
  })

  it('remove 缺 reason 回 error，不打 API', async () => {
    const fetchSpy = vi.fn()
    vi.stubGlobal('$fetch', fetchSpy)
    const { remove } = useAdminExerciseProofs()
    const r = await remove('ep-1', '   ')
    expect(r.error).toBe('請填寫刪除原因')
    expect(fetchSpy).not.toHaveBeenCalled()
  })

  it('batchRemove 空陣列回 error', async () => {
    const fetchSpy = vi.fn()
    vi.stubGlobal('$fetch', fetchSpy)
    const { batchRemove } = useAdminExerciseProofs()
    const r = await batchRemove([], '違規')
    expect(r.error).toBe('未選擇證明')
    expect(fetchSpy).not.toHaveBeenCalled()
  })

  it('batchRemove 無 reason 回 error', async () => {
    const fetchSpy = vi.fn()
    vi.stubGlobal('$fetch', fetchSpy)
    const { batchRemove } = useAdminExerciseProofs()
    const r = await batchRemove(['a'], '')
    expect(r.error).toBe('請填寫刪除原因')
    expect(fetchSpy).not.toHaveBeenCalled()
  })

  it('remove 成功回 { error: null }', async () => {
    const fetchSpy = vi.fn().mockResolvedValue({ success: true })
    vi.stubGlobal('$fetch', fetchSpy)
    const { remove } = useAdminExerciseProofs()
    const r = await remove('ep-1', '違規')
    expect(r.error).toBeNull()
    expect(fetchSpy).toHaveBeenCalledWith('/api/admin/exercise-proofs/ep-1', {
      method: 'DELETE',
      body: { reason: '違規' },
    })
  })

  it('list 帶 kind 參數', async () => {
    const fetchSpy = vi.fn().mockResolvedValue([])
    vi.stubGlobal('$fetch', fetchSpy)
    const { list } = useAdminExerciseProofs()
    await list({ kind: 'note', participantId: 'p-1' })
    expect(fetchSpy).toHaveBeenCalledWith('/api/admin/exercise-proofs', {
      params: { participantId: 'p-1', kind: 'note' },
    })
  })

  it('batchRemove 成功回 deleted/failed', async () => {
    const fetchSpy = vi.fn().mockResolvedValue({ deleted: ['a'], failed: [] })
    vi.stubGlobal('$fetch', fetchSpy)
    const { batchRemove } = useAdminExerciseProofs()
    const r = await batchRemove(['a'], '違規')
    expect(r.error).toBeNull()
    expect(r.data?.deleted).toEqual(['a'])
  })
})
