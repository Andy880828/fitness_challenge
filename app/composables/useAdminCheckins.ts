/**
 * Admin 打卡管理 composable — 走 /api/admin/checkins，由 service_role 執行。
 */

export interface AdminCheckinRow {
  participant_id: string
  date: string
  workout: boolean
  diet: boolean
  updated_at: string
  reviewed_at: string | null
  reviewer_id: string | null
  participants?: { name: string; gender: 'M' | 'F' } | null
}

export interface CheckinFilter {
  participantId?: string
  from?: string
  to?: string
  reviewed?: boolean
}

export interface UpdatePatch {
  workout?: boolean
  diet?: boolean
  markReviewed?: boolean
}

export const useAdminCheckins = () => {
  const list = async (filter: CheckinFilter = {}): Promise<AdminCheckinRow[]> => {
    const params: Record<string, string> = {}
    if (filter.participantId) params.participantId = filter.participantId
    if (filter.from) params.from = filter.from
    if (filter.to) params.to = filter.to
    if (typeof filter.reviewed === 'boolean') params.reviewed = String(filter.reviewed)
    return await $fetch<AdminCheckinRow[]>('/api/admin/checkins', { params })
  }

  const update = async (
    participantId: string,
    date: string,
    patch: UpdatePatch,
  ): Promise<{ data: AdminCheckinRow | null; error: string | null }> => {
    try {
      const data = await $fetch<AdminCheckinRow>('/api/admin/checkins/update', {
        method: 'POST',
        body: { participantId, date, ...patch },
      })
      return { data, error: null }
    } catch (err) {
      const message = err instanceof Error ? err.message : '更新失敗'
      return { data: null, error: message }
    }
  }

  return { list, update }
}
