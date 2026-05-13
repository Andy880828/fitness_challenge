/**
 * 新增運動打卡證明：
 *   - kind = 'photo'：multipart → sharp 二次壓縮 → Supabase Storage → exercise_proofs 表
 *   - kind = 'note'：純文字 1–500 字 → 直接 insert
 * 驗證已登入 user 與 participant 對應，避免越權上傳。
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
const NOTE_MAX_LEN = 500

export default defineEventHandler(async (event) => {
  const user = await serverSupabaseUser(event)
  if (!user) throw createError({ statusCode: 401, statusMessage: '未登入' })

  const form = await readMultipartFormData(event)
  if (!form) throw createError({ statusCode: 400, statusMessage: '空表單' })

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

  const participantId = fields.participantId
  const date = fields.date
  const kind = fields.kind
  if (!participantId || !date || !kind) {
    throw createError({ statusCode: 400, statusMessage: '欄位不完整' })
  }
  if (kind !== 'photo' && kind !== 'note') {
    throw createError({ statusCode: 400, statusMessage: 'kind 必須是 photo 或 note' })
  }

  const log = childLogger({ route: '/api/exercise-proofs', userId: user.id, kind })
  const sb = useSupabaseServer(event)

  const { data: p, error: pErr } = await sb
    .from('participants')
    .select('id, user_id')
    .eq('id', participantId)
    .single()
  if (pErr || !p || p.user_id !== user.id) {
    log.warn({ participantId }, '越權新增運動證明被拒')
    throw createError({ statusCode: 403, statusMessage: '無權新增此參賽者證明' })
  }

  if (kind === 'note') {
    const raw = (fields.note ?? '').trim()
    if (!raw) throw createError({ statusCode: 400, statusMessage: '文字證明不可為空' })
    if (raw.length > NOTE_MAX_LEN) {
      throw createError({ statusCode: 400, statusMessage: `文字證明上限 ${NOTE_MAX_LEN} 字` })
    }

    const { data: row, error: dbErr } = await sb
      .from('exercise_proofs')
      .insert({
        participant_id: participantId,
        date,
        kind: 'note',
        note: raw,
      })
      .select()
      .single()
    if (dbErr || !row) {
      log.error({ err: dbErr }, 'exercise_proofs note insert 失敗')
      throw createError({ statusCode: 500, statusMessage: '寫入失敗' })
    }
    log.info({ id: row.id, length: raw.length }, '新增文字證明')
    return toResponse(row)
  }

  // kind === 'photo'
  if (!fileBuf) throw createError({ statusCode: 400, statusMessage: '檔案缺失' })
  if (fileBuf.length > PHOTO_COMPRESS_CLIENT.maxBytes) {
    throw createError({ statusCode: 413, statusMessage: '檔案過大' })
  }
  if (!ALLOWED_MIME.has(fileType)) {
    throw createError({ statusCode: 400, statusMessage: '不支援的圖片格式' })
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
    throw createError({ statusCode: 400, statusMessage: '圖片解析失敗' })
  }

  const fileId = crypto.randomUUID()
  const storagePath = `${user.id}/exercise/${date}/${fileId}.jpg`

  const { error: upErr } = await sb.storage
    .from(STORAGE_BUCKET)
    .upload(storagePath, processedBuf, { contentType: 'image/jpeg', upsert: false })
  if (upErr) {
    log.error({ err: upErr }, 'Storage 上傳失敗')
    throw createError({ statusCode: 500, statusMessage: '上傳失敗' })
  }

  const { data: publicUrlData } = sb.storage.from(STORAGE_BUCKET).getPublicUrl(storagePath)
  const publicUrl = publicUrlData.publicUrl

  const { data: row, error: dbErr } = await sb
    .from('exercise_proofs')
    .insert({
      participant_id: participantId,
      date,
      kind: 'photo',
      storage_path: storagePath,
      public_url: publicUrl,
      size_bytes: processedBuf.length,
    })
    .select()
    .single()
  if (dbErr || !row) {
    await sb.storage.from(STORAGE_BUCKET).remove([storagePath])
    log.error({ err: dbErr }, 'exercise_proofs photo insert 失敗，已清理 storage')
    throw createError({ statusCode: 500, statusMessage: '寫入失敗' })
  }

  log.info({ id: row.id, originalSize, finalSize: processedBuf.length }, '新增照片證明')
  return toResponse(row)
})

const toResponse = (row: {
  id: string
  participant_id: string
  date: string
  kind: 'photo' | 'note'
  note: string | null
  storage_path: string | null
  public_url: string | null
  size_bytes: number | null
  created_at: string
}) => ({
  id: row.id,
  participantId: row.participant_id,
  date: row.date,
  kind: row.kind,
  note: row.note,
  storagePath: row.storage_path,
  publicUrl: row.public_url,
  sizeBytes: row.size_bytes,
  createdAt: row.created_at,
})
