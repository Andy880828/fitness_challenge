/**
 * 報名 — 一次完成：建立 auth user、participant、measurements[0]。
 * 採 service role 確保 atomic：失敗時逐步回滾。
 */

import type { ParticipantInsert } from '#shared/types/participant'
import type { MeasurementInput } from '#shared/types/measure'
import { childLogger } from '../../utils/logger'
import { useSupabaseServer } from '../../utils/supabase-server'

interface Body {
  email: string
  password: string
  participant: ParticipantInsert
  startMeasure: MeasurementInput
}

const isValid = (body: Partial<Body>): body is Body => {
  return Boolean(
    body.email &&
      body.password &&
      body.participant?.name &&
      (body.participant.gender === 'M' || body.participant.gender === 'F') &&
      typeof body.participant.startWeight === 'number' &&
      body.startMeasure &&
      typeof body.startMeasure.weight === 'number' &&
      typeof body.startMeasure.fatPct === 'number' &&
      typeof body.startMeasure.muscle === 'number',
  )
}

export default defineEventHandler(async (event) => {
  const body = await readBody<Partial<Body>>(event)
  if (!isValid(body)) {
    throw createError({ statusCode: 400, statusMessage: '欄位不完整' })
  }
  const log = childLogger({ route: '/api/participants/register' })
  const sb = useSupabaseServer(event)

  // 1) 建立 auth user
  const { data: authData, error: authErr } = await sb.auth.admin.createUser({
    email: body.email,
    password: body.password,
    email_confirm: true,
  })
  if (authErr || !authData.user) {
    log.warn({ err: authErr }, '建立 auth user 失敗')
    throw createError({ statusCode: 400, statusMessage: authErr?.message ?? '註冊失敗' })
  }
  const userId = authData.user.id

  // 2) 建立 participant
  const { data: participant, error: pErr } = await sb
    .from('participants')
    .insert({
      user_id: userId,
      name: body.participant.name,
      gender: body.participant.gender,
      age: body.participant.age ?? null,
      height: body.participant.height ?? null,
      start_weight: body.participant.startWeight,
    })
    .select()
    .single()
  if (pErr || !participant) {
    await sb.auth.admin.deleteUser(userId).catch(() => undefined)
    log.error({ err: pErr }, '建立 participant 失敗，已回滾 auth user')
    throw createError({ statusCode: 500, statusMessage: '建立參賽者失敗' })
  }

  // 3) 建立 measurement[0]
  const { error: mErr } = await sb.from('measurements').insert({
    participant_id: participant.id,
    week_index: 0,
    weight: body.startMeasure.weight,
    fat_pct: body.startMeasure.fatPct,
    muscle: body.startMeasure.muscle,
    measured_on: body.startMeasure.measuredOn ?? new Date().toISOString().slice(0, 10),
  })
  if (mErr) {
    await sb.from('participants').delete().eq('id', participant.id)
    await sb.auth.admin.deleteUser(userId).catch(() => undefined)
    log.error({ err: mErr }, '建立初始量測失敗，已回滾')
    throw createError({ statusCode: 500, statusMessage: '建立初始量測失敗' })
  }

  log.info({ participantId: participant.id, userId }, '註冊成功')

  return {
    id: participant.id,
    userId: participant.user_id,
    name: participant.name,
    gender: participant.gender,
    age: participant.age,
    height: participant.height,
    startWeight: Number(participant.start_weight),
    joinedAt: participant.joined_at,
  }
})
