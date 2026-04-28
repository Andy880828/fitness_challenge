/**
 * 日期工具 — 全部使用 ISO date string (YYYY-MM-DD) 為單一格式
 * 沒有任何依賴，可在 client / server / Edge runtime 共用
 */

import { TOTAL_DAYS } from './constants'

export const todayStr = (now: Date = new Date()): string => {
  return now.toISOString().slice(0, 10)
}

export const addDays = (dateStr: string, n: number): string => {
  const d = new Date(dateStr)
  d.setUTCDate(d.getUTCDate() + n)
  return d.toISOString().slice(0, 10)
}

export const dayDiff = (a: string, b: string): number => {
  const ms = new Date(b).getTime() - new Date(a).getTime()
  return Math.floor(ms / 86_400_000)
}

export const formatDateZh = (dateStr: string): string => {
  const d = new Date(dateStr)
  return `${d.getUTCFullYear()}/${d.getUTCMonth() + 1}/${d.getUTCDate()}`
}

export const measureDates = (startDate: string): string[] => {
  return [0, 4, 8, 12].map(w => addDays(startDate, w * 7))
}

export interface EffectiveDaysOptions {
  startDate: string
  testMode?: boolean
  now?: string
}

/**
 * 計算「自開始日至今的有效天數」(1..TOTAL_DAYS)。
 * - testMode=true → 直接回傳 TOTAL_DAYS（解除日期限制）
 * - 開始日之前 → 1 (避免除以 0)
 * - 結束日之後 → TOTAL_DAYS
 */
export const effectiveDaysSinceStart = (opts: EffectiveDaysOptions): number => {
  if (opts.testMode) return TOTAL_DAYS
  const today = opts.now ?? todayStr()
  const diff = dayDiff(opts.startDate, today) + 1
  return Math.max(1, Math.min(TOTAL_DAYS, diff))
}
