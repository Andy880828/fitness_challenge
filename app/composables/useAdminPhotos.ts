/**
 * Admin 照片管理 composable — 走 /api/admin/photos。
 */

import type { BatchDeleteResult } from '#shared/types/admin'

export interface AdminPhotoRow {
  id: string
  participant_id: string
  date: string
  storage_path: string
  public_url: string
  size_bytes: number | null
  uploaded_at: string
  participants?: { name: string; gender: 'M' | 'F' } | null
}

export interface PhotoFilter {
  participantId?: string
  date?: string
}

export const useAdminPhotos = () => {
  const list = async (filter: PhotoFilter = {}): Promise<AdminPhotoRow[]> => {
    const params: Record<string, string> = {}
    if (filter.participantId) params.participantId = filter.participantId
    if (filter.date) params.date = filter.date
    return await $fetch<AdminPhotoRow[]>('/api/admin/photos', { params })
  }

  const remove = async (id: string, reason: string): Promise<{ error: string | null }> => {
    if (!reason.trim()) return { error: '請填寫刪除原因' }
    try {
      await $fetch(`/api/admin/photos/${id}`, { method: 'DELETE', body: { reason } })
      return { error: null }
    } catch (err) {
      const message = err instanceof Error ? err.message : '刪除失敗'
      return { error: message }
    }
  }

  const batchRemove = async (
    ids: string[],
    reason: string,
  ): Promise<{ data: BatchDeleteResult | null; error: string | null }> => {
    if (ids.length === 0) return { data: null, error: '未選擇照片' }
    if (!reason.trim()) return { data: null, error: '請填寫刪除原因' }
    try {
      const data = await $fetch<BatchDeleteResult>('/api/admin/photos/batch-delete', {
        method: 'POST',
        body: { ids, reason },
      })
      return { data, error: null }
    } catch (err) {
      const message = err instanceof Error ? err.message : '批量刪除失敗'
      return { data: null, error: message }
    }
  }

  return { list, remove, batchRemove }
}
