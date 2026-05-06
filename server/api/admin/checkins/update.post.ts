/**
 * Admin — 修改打卡資料 + 可選擇同時標記已審核。
 * Body: { participantId, date, workout?, diet?, markReviewed? }
 */

import { childLogger } from '../../../utils/logger'
import { requireAdmin } from '../../../utils/require-admin'
import { writeAudit } from '../../../utils/audit'
import { useSupabaseServer } from '../../../utils/supabase-server'

interface UpdateBody {
  participantId?: string
  date?: string
  workout?: boolean
  diet?: boolean
  markReviewed?: boolean
}

export default defineEventHandler(async (event) => {
  const { userId } = await requireAdmin(event)
  const body = (await readBody(event)) as UpdateBody

  if (!body?.participantId || !body?.date) {
    throw createError({ statusCode: 400, statusMessage: 'participantId 與 date 必填' })
  }

  const sb = useSupabaseServer(event)
  const log = childLogger({ route: '/api/admin/checkins/update', actor: userId })

  // 取舊資料供 audit
  const { data: before } = await sb
    .from('checkins')
    .select('*')
    .eq('participant_id', body.participantId)
    .eq('date', body.date)
    .maybeSingle()

  const next = {
    participant_id: body.participantId,
    date: body.date,
    workout: body.workout ?? before?.workout ?? false,
    diet: body.diet ?? before?.diet ?? false,
    reviewed_at: body.markReviewed ? new Date().toISOString() : before?.reviewed_at ?? null,
    reviewer_id: body.markReviewed ? userId : before?.reviewer_id ?? null,
  }

  const { data: after, error } = await sb
    .from('checkins')
    .upsert(next, { onConflict: 'participant_id,date' })
    .select()
    .single()

  if (error || !after) {
    log.error({ err: error }, '修改打卡失敗')
    throw createError({ statusCode: 500, statusMessage: '修改失敗' })
  }

  await writeAudit(event, {
    actorUserId: userId,
    action: body.markReviewed ? 'checkin.review' : 'checkin.update',
    targetTable: 'checkins',
    targetId: `${body.participantId}:${body.date}`,
    before,
    after,
  })

  log.info({ participantId: body.participantId, date: body.date }, '打卡已更新')
  return after
})
