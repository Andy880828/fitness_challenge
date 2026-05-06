/**
 * Admin — 列出打卡，支援依參賽者 / 日期範圍 / 已審核狀態篩選。
 */

import { requireAdmin } from '../../../utils/require-admin'
import { useSupabaseServer } from '../../../utils/supabase-server'

export default defineEventHandler(async (event) => {
  await requireAdmin(event)

  const q = getQuery(event)
  const participantId = typeof q.participantId === 'string' ? q.participantId : undefined
  const from = typeof q.from === 'string' ? q.from : undefined
  const to = typeof q.to === 'string' ? q.to : undefined
  const reviewed = q.reviewed === 'true' ? true : q.reviewed === 'false' ? false : undefined

  const sb = useSupabaseServer(event)
  let query = sb
    .from('checkins')
    .select('participant_id, date, workout, diet, updated_at, reviewed_at, reviewer_id, participants(name, gender)')
    .order('date', { ascending: false })
    .limit(500)

  if (participantId) query = query.eq('participant_id', participantId)
  if (from) query = query.gte('date', from)
  if (to) query = query.lte('date', to)
  if (reviewed === true) query = query.not('reviewed_at', 'is', null)
  if (reviewed === false) query = query.is('reviewed_at', null)

  const { data, error } = await query
  if (error) throw createError({ statusCode: 500, statusMessage: error.message })

  return data ?? []
})
