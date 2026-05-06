/**
 * useAdminPhotos — 純驗證邏輯（reason 必填、ids 不可為空）。
 * $fetch 由 Nuxt magic auto-import；此處 stub 為 spy 即可。
 */

import { beforeEach, describe, expect, it, vi } from 'vitest'
import { useAdminPhotos } from '~/composables/useAdminPhotos'

describe('useAdminPhotos', () => {
  beforeEach(() => {
    vi.stubGlobal('$fetch', vi.fn())
  })

  it('remove 缺 reason 回 error，不打 API', async () => {
    const fetchSpy = vi.fn()
    vi.stubGlobal('$fetch', fetchSpy)
    const { remove } = useAdminPhotos()
    const r = await remove('ph-1', '   ')
    expect(r.error).toBe('請填寫刪除原因')
    expect(fetchSpy).not.toHaveBeenCalled()
  })

  it('batchRemove 空陣列回 error', async () => {
    const fetchSpy = vi.fn()
    vi.stubGlobal('$fetch', fetchSpy)
    const { batchRemove } = useAdminPhotos()
    const r = await batchRemove([], '違規')
    expect(r.error).toBe('未選擇照片')
    expect(fetchSpy).not.toHaveBeenCalled()
  })

  it('batchRemove 無 reason 回 error', async () => {
    const fetchSpy = vi.fn()
    vi.stubGlobal('$fetch', fetchSpy)
    const { batchRemove } = useAdminPhotos()
    const r = await batchRemove(['a'], '')
    expect(r.error).toBe('請填寫刪除原因')
    expect(fetchSpy).not.toHaveBeenCalled()
  })

  it('remove 成功回 { error: null }', async () => {
    const fetchSpy = vi.fn().mockResolvedValue({ success: true })
    vi.stubGlobal('$fetch', fetchSpy)
    const { remove } = useAdminPhotos()
    const r = await remove('ph-1', '違規')
    expect(r.error).toBeNull()
    expect(fetchSpy).toHaveBeenCalledWith('/api/admin/photos/ph-1', {
      method: 'DELETE',
      body: { reason: '違規' },
    })
  })

  it('batchRemove 成功回 deleted/failed', async () => {
    const fetchSpy = vi.fn().mockResolvedValue({ deleted: ['a'], failed: [] })
    vi.stubGlobal('$fetch', fetchSpy)
    const { batchRemove } = useAdminPhotos()
    const r = await batchRemove(['a'], '違規')
    expect(r.error).toBeNull()
    expect(r.data?.deleted).toEqual(['a'])
  })
})
