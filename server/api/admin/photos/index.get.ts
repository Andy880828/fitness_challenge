/**
 * Admin — 列出照片，支援依參賽者 / 日期篩選。
 */

import { requireAdmin } from '../../../utils/require-admin'
import { useSupabaseServer } from '../../../utils/supabase-server'

export default defineEventHandler(async (event) => {
  await requireAdmin(event)

  const q = getQuery(event)
  const participantId = typeof q.participantId === 'string' ? q.participantId : undefined
  const date = typeof q.date === 'string' ? q.date : undefined

  const sb = useSupabaseServer(event)
  let query = sb
    .from('photos')
    .select('id, participant_id, date, storage_path, public_url, size_bytes, uploaded_at, participants(name, gender)')
    .order('uploaded_at', { ascending: false })
    .limit(500)

  if (participantId) query = query.eq('participant_id', participantId)
  if (date) query = query.eq('date', date)

  const { data, error } = await query
  if (error) throw createError({ statusCode: 500, statusMessage: error.message })

  return data ?? []
})
