/**
 * Admin — 批量刪除照片；逐筆獨立 try/catch 並各自寫 audit。
 * Body: { ids: string[], reason: string }
 */

import { STORAGE_BUCKET } from '#shared/utils/constants'
import { childLogger } from '../../../utils/logger'
import { requireAdmin } from '../../../utils/require-admin'
import { writeAudit } from '../../../utils/audit'
import { useSupabaseServer } from '../../../utils/supabase-server'

interface BatchBody {
  ids?: string[]
  reason?: string
}

interface BatchResult {
  deleted: string[]
  failed: { id: string; error: string }[]
}

export default defineEventHandler(async (event): Promise<BatchResult> => {
  const { userId } = await requireAdmin(event)
  const body = (await readBody(event)) as BatchBody

  const ids = Array.isArray(body?.ids) ? body.ids.filter((x) => typeof x === 'string') : []
  const reason = (body?.reason ?? '').trim()
  if (ids.length === 0) throw createError({ statusCode: 400, statusMessage: 'ids 為空' })
  if (!reason) throw createError({ statusCode: 400, statusMessage: '請填寫刪除原因' })

  const sb = useSupabaseServer(event)
  const log = childLogger({ route: '/api/admin/photos/batch-delete', actor: userId })

  const result: BatchResult = { deleted: [], failed: [] }
  for (const id of ids) {
    try {
      const { data: photo, error: fetchErr } = await sb
        .from('photos')
        .select('*')
        .eq('id', id)
        .single()
      if (fetchErr || !photo) {
        result.failed.push({ id, error: '不存在' })
        continue
      }
      await sb.storage.from(STORAGE_BUCKET).remove([photo.storage_path as string])
      const { error: delErr } = await sb.from('photos').delete().eq('id', id)
      if (delErr) {
        result.failed.push({ id, error: delErr.message })
        continue
      }
      await writeAudit(event, {
        actorUserId: userId,
        action: 'photo.batch_delete',
        targetTable: 'photos',
        targetId: id,
        before: photo,
        metadata: { reason, batchSize: ids.length },
      })
      result.deleted.push(id)
    } catch (err) {
      const msg = err instanceof Error ? err.message : '未知錯誤'
      result.failed.push({ id, error: msg })
    }
  }

  log.info(
    { total: ids.length, deleted: result.deleted.length, failed: result.failed.length },
    'admin 批量刪除照片完成',
  )
  return result
})
