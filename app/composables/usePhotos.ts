/**
 * 飲食照片 — 列表、上傳（透過 server endpoint 處理 storage + DB）、刪除。
 * 上傳前先在 client 端壓縮（utils/image-compress.ts）以減少流量。
 */

import type { Database } from '#shared/types/database'
import type { Photo, PhotosByDate } from '#shared/types/photo'
import { compressImage } from '~/utils/image-compress'
import { PHOTO_COMPRESS } from '#shared/utils/constants'

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
  ): Promise<{ data: Photo | null; error: string | null }> => {
    if (file.size > PHOTO_COMPRESS.maxBytes) {
      return { data: null, error: `檔案超過 ${PHOTO_COMPRESS.maxBytes / 1024 / 1024} MB` }
    }
    try {
      const { blob } = await compressImage(file)
      const formData = new FormData()
      formData.append('participantId', participantId)
      formData.append('date', date)
      formData.append('file', blob, `${date}.jpg`)
      const data = await $fetch<Photo>('/api/photos', { method: 'POST', body: formData })
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
