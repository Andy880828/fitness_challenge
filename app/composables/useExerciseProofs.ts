/**
 * 運動打卡證明（照片 / 文字）— list / addPhoto / addNote / remove。
 *
 * - addPhoto：兩階段壓縮（前端 canvas + 後端 sharp）+ 上傳進度，同 usePhotos.upload。
 * - addNote：純文字 POST，不走 XHR progress（payload 極小）。
 * - listRecent：跨全體參賽者依日期倒序，附帶 owner（gallery 運動 tab 用）。
 */

import type { Database } from '#shared/types/database'
import type {
  ExerciseProof,
  ExerciseProofWithOwner,
} from '#shared/types/exercise'
import { compressImage } from '~/utils/image-compress'
import { PHOTO_COMPRESS_CLIENT } from '#shared/utils/constants'
import {
  postWithProgress,
  type UploadProgressHandlers,
} from '~/composables/_internal/uploadXhr'

type Row = Database['public']['Tables']['exercise_proofs']['Row']

interface RowWithParticipant extends Row {
  participant: {
    id: string
    name: string
    gender: 'M' | 'F'
  } | null
}

const fromRow = (r: Row): ExerciseProof => ({
  id: r.id,
  participantId: r.participant_id,
  date: r.date,
  kind: r.kind,
  note: r.note,
  storagePath: r.storage_path,
  publicUrl: r.public_url,
  sizeBytes: r.size_bytes,
  createdAt: r.created_at,
})

const fromRowWithOwner = (r: RowWithParticipant): ExerciseProofWithOwner | null => {
  if (!r.participant) return null
  return {
    ...fromRow(r),
    owner: {
      id: r.participant.id,
      name: r.participant.name,
      gender: r.participant.gender,
    },
  }
}

export const useExerciseProofs = () => {
  const supabase = useSupabaseClient<any>()

  const listByParticipantDate = async (
    participantId: string,
    date: string,
  ): Promise<ExerciseProof[]> => {
    const { data, error } = await supabase
      .from('exercise_proofs')
      .select('*')
      .eq('participant_id', participantId)
      .eq('date', date)
      .order('created_at', { ascending: false })
    if (error || !data) return []
    return (data as Row[]).map(fromRow)
  }

  const countDaysByParticipant = async (
    participantId: string,
  ): Promise<Set<string>> => {
    const { data, error } = await supabase
      .from('exercise_proofs')
      .select('date')
      .eq('participant_id', participantId)
    if (error || !data) return new Set()
    return new Set((data as { date: string }[]).map(r => r.date))
  }

  const listRecent = async (
    limit = 60,
    offset = 0,
  ): Promise<ExerciseProofWithOwner[]> => {
    const { data, error } = await supabase
      .from('exercise_proofs')
      .select('*, participant:participants(id, name, gender)')
      .order('date', { ascending: false })
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)
    if (error || !data) return []
    return (data as RowWithParticipant[])
      .map(fromRowWithOwner)
      .filter((r): r is ExerciseProofWithOwner => r !== null)
  }

  const addPhoto = async (
    participantId: string,
    date: string,
    file: File,
    handlers: UploadProgressHandlers = {},
  ): Promise<{ data: ExerciseProof | null; error: string | null }> => {
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
      formData.append('kind', 'photo')
      formData.append('file', blob, `${date}.jpg`)
      const data = await postWithProgress<ExerciseProof>(
        '/api/exercise-proofs',
        formData,
        handlers.onUploadProgress,
      )
      return { data, error: null }
    } catch (err) {
      const message = err instanceof Error ? err.message : '上傳失敗'
      return { data: null, error: message }
    }
  }

  const addNote = async (
    participantId: string,
    date: string,
    note: string,
  ): Promise<{ data: ExerciseProof | null; error: string | null }> => {
    const trimmed = note.trim()
    if (!trimmed) return { data: null, error: '文字證明不可為空' }
    if (trimmed.length > 500) return { data: null, error: '文字證明上限 500 字' }
    try {
      const data = await $fetch<ExerciseProof>('/api/exercise-proofs', {
        method: 'POST',
        body: (() => {
          const fd = new FormData()
          fd.append('participantId', participantId)
          fd.append('date', date)
          fd.append('kind', 'note')
          fd.append('note', trimmed)
          return fd
        })(),
      })
      return { data, error: null }
    } catch (err) {
      const message = err instanceof Error ? err.message : '寫入失敗'
      return { data: null, error: message }
    }
  }

  const remove = async (id: string): Promise<{ error: string | null }> => {
    try {
      await $fetch(`/api/exercise-proofs/${id}`, { method: 'DELETE' })
      return { error: null }
    } catch (err) {
      const message = err instanceof Error ? err.message : '刪除失敗'
      return { error: message }
    }
  }

  return {
    listByParticipantDate,
    countDaysByParticipant,
    listRecent,
    addPhoto,
    addNote,
    remove,
  }
}
