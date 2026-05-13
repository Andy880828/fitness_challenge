/**
 * 刪除運動打卡證明 — 驗證擁有者後同時清掉 storage（kind=photo）與 row。
 */

import { STORAGE_BUCKET } from '#shared/utils/constants'
import { serverSupabaseUser } from '#supabase/server'
import { childLogger } from '../../utils/logger'
import { useSupabaseServer } from '../../utils/supabase-server'

export default defineEventHandler(async (event) => {
  const user = await serverSupabaseUser(event)
  if (!user) throw createError({ statusCode: 401, statusMessage: '未登入' })

  const id = getRouterParam(event, 'id')
  if (!id) throw createError({ statusCode: 400, statusMessage: '缺少 id' })

  const sb = useSupabaseServer(event)
  const log = childLogger({ route: '/api/exercise-proofs/:id', userId: user.id })

  const { data: proof, error } = await sb
    .from('exercise_proofs')
    .select('id, kind, storage_path, participant_id, participants(user_id)')
    .eq('id', id)
    .single()

  if (error || !proof) throw createError({ statusCode: 404, statusMessage: '證明不存在' })

  const ownerId =
    (proof.participants as unknown as { user_id: string } | null)?.user_id ?? null
  if (ownerId !== user.id) {
    log.warn({ id }, '越權刪除被拒')
    throw createError({ statusCode: 403, statusMessage: '無權刪除' })
  }

  if (proof.kind === 'photo' && proof.storage_path) {
    await sb.storage.from(STORAGE_BUCKET).remove([proof.storage_path])
  }
  await sb.from('exercise_proofs').delete().eq('id', id)
  log.info({ id, kind: proof.kind }, '已刪除運動證明')
  return { success: true }
})
