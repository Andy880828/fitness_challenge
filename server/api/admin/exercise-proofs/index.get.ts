/**
 * Admin — 列出運動打卡證明，支援依參賽者 / 日期 / kind 篩選。
 */

import { requireAdmin } from '../../../utils/require-admin'
import { useSupabaseServer } from '../../../utils/supabase-server'

export default defineEventHandler(async (event) => {
  await requireAdmin(event)

  const q = getQuery(event)
  const participantId = typeof q.participantId === 'string' ? q.participantId : undefined
  const date = typeof q.date === 'string' ? q.date : undefined
  const kind = q.kind === 'photo' || q.kind === 'note' ? q.kind : undefined

  const sb = useSupabaseServer(event)
  let query = sb
    .from('exercise_proofs')
    .select(
      'id, participant_id, date, kind, note, storage_path, public_url, size_bytes, created_at, participants(name, gender)',
    )
    .order('created_at', { ascending: false })
    .limit(500)

  if (participantId) query = query.eq('participant_id', participantId)
  if (date) query = query.eq('date', date)
  if (kind) query = query.eq('kind', kind)

  const { data, error } = await query
  if (error) throw createError({ statusCode: 500, statusMessage: error.message })

  return data ?? []
})
