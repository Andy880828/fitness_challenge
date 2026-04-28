/**
 * 刪除飲食照片 — 驗證擁有者後同時清掉 storage 與 photos 資料表。
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
  const log = childLogger({ route: '/api/photos/:id', userId: user.id })

  const { data: photo, error } = await sb
    .from('photos')
    .select('id, storage_path, participant_id, participants(user_id)')
    .eq('id', id)
    .single()

  if (error || !photo) throw createError({ statusCode: 404, statusMessage: '照片不存在' })

  const ownerId =
    (photo.participants as unknown as { user_id: string } | null)?.user_id ?? null
  if (ownerId !== user.id) {
    log.warn({ id }, '越權刪除被拒')
    throw createError({ statusCode: 403, statusMessage: '無權刪除' })
  }

  await sb.storage.from(STORAGE_BUCKET).remove([photo.storage_path])
  await sb.from('photos').delete().eq('id', id)
  log.info({ id }, '已刪除')
  return { success: true }
})
