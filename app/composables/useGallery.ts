/**
 * useGallery — /gallery 頁面用。
 *
 * RLS 已將 photos / measurements / leaderboard_view 設為公開讀取，
 * 因此這裡直接走 Supabase client（無需 server endpoint）。
 *
 * - listRecentPhotos：跨全體參賽者依上傳時間倒序，附帶 owner 資訊
 * - listAllProgress：聚合每位參賽者的初始 / 最新量測 + 打卡天數，組進度卡資料
 */

import type { Database } from '#shared/types/database'
import type { PhotoWithOwner } from '#shared/types/photo'

type PhotoRow = Database['public']['Tables']['photos']['Row']
type MeasurementRow = Database['public']['Tables']['measurements']['Row']
type LeaderboardRow = Database['public']['Views']['leaderboard_view']['Row']

interface PhotoRowWithParticipant extends PhotoRow {
  participant: {
    id: string
    name: string
    gender: 'M' | 'F'
  } | null
}

export interface ParticipantProgress {
  id: string
  name: string
  gender: 'M' | 'F'
  startWeight: number
  startFatPct: number | null
  latestWeight: number | null
  latestFatPct: number | null
  weightDelta: number | null
  fatDelta: number | null
  weightTrend: number[]
  workoutDays: number
  dietDays: number
  photoDays: number
  totalPhotos: number
  measureCount: number
}

const fromPhotoRow = (r: PhotoRowWithParticipant): PhotoWithOwner | null => {
  if (!r.participant) return null
  return {
    id: r.id,
    participantId: r.participant_id,
    date: r.date,
    storagePath: r.storage_path,
    publicUrl: r.public_url,
    sizeBytes: r.size_bytes,
    uploadedAt: r.uploaded_at,
    owner: {
      id: r.participant.id,
      name: r.participant.name,
      gender: r.participant.gender,
    },
  }
}

export const useGallery = () => {
  const supabase = useSupabaseClient<any>()

  const listRecentPhotos = async (limit = 60, offset = 0): Promise<PhotoWithOwner[]> => {
    const { data, error } = await supabase
      .from('photos')
      .select('*, participant:participants(id, name, gender)')
      .order('uploaded_at', { ascending: false })
      .range(offset, offset + limit - 1)
    if (error || !data) return []
    return (data as PhotoRowWithParticipant[])
      .map(fromPhotoRow)
      .filter((p): p is PhotoWithOwner => p !== null)
  }

  const listAllProgress = async (): Promise<ParticipantProgress[]> => {
    const [boardRes, measureRes] = await Promise.all([
      supabase.from('leaderboard_view').select('*'),
      supabase.from('measurements').select('*').order('week_index', { ascending: true }),
    ])
    const board = (boardRes.data ?? []) as LeaderboardRow[]
    const measures = (measureRes.data ?? []) as MeasurementRow[]

    const byParticipant = new Map<string, MeasurementRow[]>()
    for (const m of measures) {
      const list = byParticipant.get(m.participant_id) ?? []
      list.push(m)
      byParticipant.set(m.participant_id, list)
    }

    return board.map((b) => {
      const ms = byParticipant.get(b.id) ?? []
      const initial = ms.find(m => m.week_index === 0) ?? null
      const latest = ms.length > 0 ? ms[ms.length - 1]! : null
      const startWeight = Number(b.start_weight)
      const initialWeight = initial ? Number(initial.weight) : startWeight
      const initialFat = initial ? Number(initial.fat_pct) : null
      const latestWeight = latest ? Number(latest.weight) : null
      const latestFat = latest ? Number(latest.fat_pct) : null
      const weightDelta = latestWeight !== null ? +(latestWeight - initialWeight).toFixed(1) : null
      const fatDelta =
        latestFat !== null && initialFat !== null ? +(latestFat - initialFat).toFixed(1) : null
      return {
        id: b.id,
        name: b.name,
        gender: b.gender as 'M' | 'F',
        startWeight,
        startFatPct: initialFat,
        latestWeight,
        latestFatPct: latestFat,
        weightDelta,
        fatDelta,
        weightTrend: ms.map(m => Number(m.weight)),
        workoutDays: b.workout_days,
        dietDays: b.diet_days,
        photoDays: b.photo_days,
        totalPhotos: b.total_photos,
        measureCount: b.measure_count,
      }
    })
  }

  return { listRecentPhotos, listAllProgress }
}
