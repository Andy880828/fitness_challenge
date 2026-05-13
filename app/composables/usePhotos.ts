/**
 * 飲食照片 — 列表、上傳（透過 server endpoint 處理 storage + DB）、刪除。
 *
 * 上傳流程（雙階段壓縮）：
 *   1. 前端 Canvas 預壓 (compressImage)         → onProgress(0..100) 階段一
 *   2. XMLHttpRequest 上傳，可監聽 upload.progress → onProgress(0..100) 階段二
 *
 * onProgress callback 由 page 層自行決定如何映射兩階段（例如：壓縮 stage / 上傳 stage）。
 */

import type { Database } from '#shared/types/database'
import type { Photo, PhotosByDate } from '#shared/types/photo'
import { compressImage } from '~/utils/image-compress'
import { PHOTO_COMPRESS_CLIENT } from '#shared/utils/constants'
import { postWithProgress, type UploadProgressHandlers } from '~/composables/_internal/uploadXhr'

export type { UploadProgressHandlers }

type Row = Database['public']['Tables']['photos']['Row']

const fromRow = (r: Row): Photo => ({
  id: r.id,
  participantId: r.participant_id,
  date: r.date,
  storagePath: r.storage_path,
  publicUrl: r.public_url,
  sizeBytes: r.size_bytes,
  uploadedAt: r.uploaded_at,
})

export const usePhotos = () => {
  const supabase = useSupabaseClient<any>()

  const listByParticipant = async (participantId: string): Promise<PhotosByDate> => {
    const { data, error } = await supabase
      .from('photos')
      .select('*')
      .eq('participant_id', participantId)
      .order('uploaded_at', { ascending: false })
    if (error || !data) return {}
    const result: PhotosByDate = {}
    for (const r of data) {
      const list = result[r.date] ?? []
      result[r.date] = [...list, fromRow(r)]
    }
    return result
  }

  const upload = async (
    participantId: string,
    date: string,
    file: File,
    handlers: UploadProgressHandlers = {},
  ): Promise<{ data: Photo | null; error: string | null }> => {
    if (file.size > PHOTO_COMPRESS_CLIENT.maxBytes) {
      return {
        data: null,
        error: `檔案超過 ${PHOTO_COMPRESS_CLIENT.maxBytes / 1024 / 1024} MB`,
      }
    }
    try {
      const { blob } = await compressImage(file, { onProgress: handlers.onCompressProgress })
      const formData = new FormData()
      formData.append('participantId', participantId)
      formData.append('date', date)
      formData.append('file', blob, `${date}.jpg`)
      const data = await postWithProgress<Photo>('/api/photos', formData, handlers.onUploadProgress)
      return { data, error: null }
    } catch (err) {
      const message = err instanceof Error ? err.message : '上傳失敗'
      return { data: null, error: message }
    }
  }

  const remove = async (
    photoId: string,
  ): Promise<{ error: string | null }> => {
    try {
      await $fetch(`/api/photos/${photoId}`, { method: 'DELETE' })
      return { error: null }
    } catch (err) {
      const message = err instanceof Error ? err.message : '刪除失敗'
      return { error: message }
    }
  }

  return { listByParticipant, upload, remove }
}
