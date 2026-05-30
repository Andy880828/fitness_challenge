/**
 * Admin 運動證明管理 composable — 走 /api/admin/exercise-proofs。
 * 結構與 useAdminPhotos 對稱，因為兩者管理面行為幾乎一致。
 */

import type { BatchDeleteResult } from '#shared/types/admin'

export interface AdminExerciseProofRow {
  id: string
  participant_id: string
  date: string
  kind: 'photo' | 'note'
  note: string | null
  storage_path: string | null
  public_url: string | null
  size_bytes: number | null
  created_at: string
  participants?: { name: string; gender: 'M' | 'F' } | null
}

export interface ExerciseProofFilter {
  participantId?: string
  date?: string
  kind?: 'photo' | 'note'
}

export const useAdminExerciseProofs = () => {
  const list = async (filter: ExerciseProofFilter = {}): Promise<AdminExerciseProofRow[]> => {
    const params: Record<string, string> = {}
    if (filter.participantId) params.participantId = filter.participantId
    if (filter.date) params.date = filter.date
    if (filter.kind) params.kind = filter.kind
    return await $fetch<AdminExerciseProofRow[]>('/api/admin/exercise-proofs', { params })
  }

  const remove = async (id: string, reason: string): Promise<{ error: string | null }> => {
    if (!reason.trim()) return { error: '請填寫刪除原因' }
    try {
      await $fetch(`/api/admin/exercise-proofs/${id}`, {
        method: 'DELETE',
        body: { reason },
      })
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
    if (ids.length === 0) return { data: null, error: '未選擇證明' }
    if (!reason.trim()) return { data: null, error: '請填寫刪除原因' }
    try {
      const data = await $fetch<BatchDeleteResult>(
        '/api/admin/exercise-proofs/batch-delete',
        { method: 'POST', body: { ids, reason } },
      )
      return { data, error: null }
    } catch (err) {
      const message = err instanceof Error ? err.message : '批量刪除失敗'
      return { data: null, error: message }
    }
  }

  return { list, remove, batchRemove }
}
