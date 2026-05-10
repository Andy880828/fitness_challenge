import type { Gender } from '#shared/types/participant'

export const TOTAL_DAYS = 84

export const MEASURE_WEEKS = [0, 4, 8, 12] as const
export const MEASURE_LABELS = ['初始', '第4週', '第8週', '結算'] as const

export const WEEKDAY_LABELS = ['日', '一', '二', '三', '四', '五', '六'] as const

export const SAFETY_FLOOR: Record<Gender, number> = { M: 10, F: 16 }

export const FAT_CAP = 15
export const MUSCLE_CAP = 8

export const SCORE_WEIGHTS = {
  fat: 0.4,
  muscle: 0.4,
  process: 0.2,
} as const

export const PHOTO_COMPRESS = {
  maxWidth: 800,
  jpegQuality: 0.8,
  maxBytes: 2 * 1024 * 1024,
} as const

export const PHOTO_COMPRESS_CLIENT = {
  maxWidth: 1920,
  jpegQuality: 0.85,
  maxBytes: 8 * 1024 * 1024,
} as const

export const PHOTO_COMPRESS_SERVER = {
  maxWidth: 1080,
  jpegQuality: 0.8,
} as const

export const STORAGE_BUCKET = 'food-photos' as const

export const DEFAULT_START_DATE = '2026-05-07' as const
