/**
 * Admin — 刪除單張照片；body 必須含 reason，寫入 audit metadata。
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
  const log = childLogger({ route: '/api/admin/photos/:id', actor: userId })

  const { data: photo, error: fetchErr } = await sb
    .from('photos')
    .select('*')
    .eq('id', id)
    .single()
  if (fetchErr || !photo) throw createError({ statusCode: 404, statusMessage: '照片不存在' })

  await sb.storage.from(STORAGE_BUCKET).remove([photo.storage_path as string])
  const { error: delErr } = await sb.from('photos').delete().eq('id', id)
  if (delErr) {
    log.error({ err: delErr, id }, '刪除照片失敗')
    throw createError({ statusCode: 500, statusMessage: '刪除失敗' })
  }

  await writeAudit(event, {
    actorUserId: userId,
    action: 'photo.delete',
    targetTable: 'photos',
    targetId: id,
    before: photo,
    metadata: { reason },
  })

  log.info({ id, reason }, 'admin 刪除照片')
  return { success: true }
})
