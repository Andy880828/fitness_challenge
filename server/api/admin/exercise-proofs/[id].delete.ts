/**
 * Admin — 刪除單筆運動證明；body 必須含 reason，寫入 audit metadata。
 * kind=photo 才有 storage 檔；kind=note 只刪 row。
 */

import { STORAGE_BUCKET } from '#shared/utils/constants'
import { childLogger } from '../../../utils/logger'
import { requireAdmin } from '../../../utils/require-admin'
import { writeAudit } from '../../../utils/audit'
import { useSupabaseServer } from '../../../utils/supabase-server'

interface DeleteBody {
  reason?: string
}

export default defineEventHandler(async (event) => {
  const { userId } = await requireAdmin(event)
  const id = getRouterParam(event, 'id')
  if (!id) throw createError({ statusCode: 400, statusMessage: '缺少 id' })

  const body = (await readBody(event).catch(() => ({}))) as DeleteBody
  const reason = (body?.reason ?? '').trim()
  if (!reason) throw createError({ statusCode: 400, statusMessage: '請填寫刪除原因' })

  const sb = useSupabaseServer(event)
  const log = childLogger({ route: '/api/admin/exercise-proofs/:id', actor: userId })

  const { data: proof, error: fetchErr } = await sb
    .from('exercise_proofs')
    .select('*')
    .eq('id', id)
    .single()
  if (fetchErr || !proof) throw createError({ statusCode: 404, statusMessage: '證明不存在' })

  if (proof.kind === 'photo' && proof.storage_path) {
    await sb.storage.from(STORAGE_BUCKET).remove([proof.storage_path as string])
  }
  const { error: delErr } = await sb.from('exercise_proofs').delete().eq('id', id)
  if (delErr) {
    log.error({ err: delErr, id }, '刪除運動證明失敗')
    throw createError({ statusCode: 500, statusMessage: '刪除失敗' })
  }

  await writeAudit(event, {
    actorUserId: userId,
    action: 'exercise_proof.delete',
    targetTable: 'exercise_proofs',
    targetId: id,
    before: proof,
    metadata: { reason },
  })

  log.info({ id, kind: proof.kind, reason }, 'admin 刪除運動證明')
  return { success: true }
})
