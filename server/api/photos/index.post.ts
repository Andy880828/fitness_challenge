/**
 * 上傳飲食照片：multipart → sharp 二次壓縮 → Supabase Storage → photos 資料表。
 * 驗證已登入 user 與 participant 對應，避免越權上傳。
 *
 * 兩段式壓縮：
 *   1. 前端 Canvas 預壓 (PHOTO_COMPRESS_CLIENT) — 確保手機端流量在 8MB 以內
 *   2. 後端 sharp 二次壓 (PHOTO_COMPRESS_SERVER) — 1080px / quality 80 mozjpeg
 */

import sharp from 'sharp'
import {
  STORAGE_BUCKET,
  PHOTO_COMPRESS_CLIENT,
  PHOTO_COMPRESS_SERVER,
} from '#shared/utils/constants'
import { serverSupabaseUser } from '#supabase/server'
import { childLogger } from '../../utils/logger'
import { useSupabaseServer } from '../../utils/supabase-server'

const ALLOWED_MIME = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif'])

export default defineEventHandler(async (event) => {
  const user = await serverSupabaseUser(event)
  if (!user) throw createError({ statusCode: 401, message: '未登入' })

  const form = await readMultipartFormData(event)
  if (!form) throw createError({ statusCode: 400, message: '空表單' })

  const fields: Record<string, string> = {}
  let fileBuf: Buffer | null = null
  let fileType = 'image/jpeg'
  for (const part of form) {
    if (!part.name) continue
    if (part.name === 'file' && part.data) {
      fileBuf = part.data
      fileType = part.type ?? 'image/jpeg'
    } else if (part.data) {
      fields[part.name] = part.data.toString('utf8')
    }
  }
  if (!fileBuf) throw createError({ statusCode: 400, message: '檔案缺失' })
  if (fileBuf.length > PHOTO_COMPRESS_CLIENT.maxBytes) {
    throw createError({ statusCode: 413, message: '檔案過大' })
  }
  if (!ALLOWED_MIME.has(fileType)) {
    throw createError({ statusCode: 400, message: '不支援的圖片格式' })
  }
  const participantId = fields.participantId
  const date = fields.date
  if (!participantId || !date) {
    throw createError({ statusCode: 400, message: '欄位不完整' })
  }

  const log = childLogger({ route: '/api/photos', userId: user.id })
  const sb = useSupabaseServer(event)

  const { data: p, error: pErr } = await sb
    .from('participants')
    .select('id, user_id')
    .eq('id', participantId)
    .single()
  if (pErr || !p || p.user_id !== user.id) {
    log.warn({ participantId }, '越權上傳被拒')
    throw createError({ statusCode: 403, message: '無權上傳此參賽者照片' })
  }

  const originalSize = fileBuf.length
  let processedBuf: Buffer
  try {
    processedBuf = await sharp(fileBuf)
      .rotate()
      .resize({ width: PHOTO_COMPRESS_SERVER.maxWidth, withoutEnlargement: true })
      .jpeg({ quality: Math.round(PHOTO_COMPRESS_SERVER.jpegQuality * 100), mozjpeg: true })
      .toBuffer()
  } catch (err) {
    log.warn({ err, fileType, originalSize }, 'sharp 解析失敗')
    throw createError({ statusCode: 400, message: '圖片解析失敗' })
  }

  const fileId = crypto.randomUUID()
  const storagePath = `${user.id}/${date}/${fileId}.jpg`

  const { error: upErr } = await sb.storage
    .from(STORAGE_BUCKET)
    .upload(storagePath, processedBuf, { contentType: 'image/jpeg', upsert: false })
  if (upErr) {
    log.error({ err: upErr }, 'Storage 上傳失敗')
    throw createError({ statusCode: 500, message: '上傳失敗' })
  }

  const { data: publicUrlData } = sb.storage.from(STORAGE_BUCKET).getPublicUrl(storagePath)
  const publicUrl = publicUrlData.publicUrl

  const { data: photo, error: dbErr } = await sb
    .from('photos')
    .insert({
      participant_id: participantId,
      date,
      storage_path: storagePath,
      public_url: publicUrl,
      size_bytes: processedBuf.length,
    })
    .select()
    .single()
  if (dbErr || !photo) {
    await sb.storage.from(STORAGE_BUCKET).remove([storagePath])
    log.error({ err: dbErr }, 'photos DB 寫入失敗，已清理 storage')
    throw createError({ statusCode: 500, message: '寫入失敗' })
  }

  log.info(
    { photoId: photo.id, originalSize, finalSize: processedBuf.length },
    '上傳成功',
  )

  return {
    id: photo.id,
    participantId: photo.participant_id,
    date: photo.date,
    storagePath: photo.storage_path,
    publicUrl: photo.public_url,
    sizeBytes: photo.size_bytes,
    uploadedAt: photo.uploaded_at,
  }
})
