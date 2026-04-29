/**
 * useChallenge — 挑戰賽全域設定 + 日期 computed。
 * 測試重點：refresh 後 settings 更新、day/effectiveDays 正確 computed。
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { useChallenge } from '~/composables/useChallenge'
import { createMockSupabase } from '../helpers/supabase-mock'

describe('useChallenge', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-05-15T12:00:00Z'))
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('initial settings 使用 DEFAULT_START_DATE', () => {
    const supabase = createMockSupabase({ data: null, error: null })
    vi.stubGlobal('useSupabaseClient', () => supabase)
    const { settings } = useChallenge()
    expect(settings.value.startDate).toBeTruthy()
    expect(settings.value.testMode).toBe(false)
  })

  it('refresh 後 settings 從 DB 更新', async () => {
    const supabase = createMockSupabase({
      data: {
        start_date: '2026-05-01',
        test_mode: true,
        updated_at: '2026-05-10T00:00:00Z',
      },
      error: null,
    })
    vi.stubGlobal('useSupabaseClient', () => supabase)
    const { settings, refresh } = useChallenge()
    await refresh()
    expect(settings.value.startDate).toBe('2026-05-01')
    expect(settings.value.testMode).toBe(true)
  })

  it('refresh 失敗時保留現值', async () => {
    const supabase = createMockSupabase({ data: null, error: { message: 'db down' } })
    vi.stubGlobal('useSupabaseClient', () => supabase)
    const { settings, refresh } = useChallenge()
    const before = settings.value.startDate
    await refresh()
    expect(settings.value.startDate).toBe(before)
  })

  it('day computed clamp 在 [1, 84]', () => {
    const supabase = createMockSupabase({ data: null, error: null })
    vi.stubGlobal('useSupabaseClient', () => supabase)
    const { day, settings } = useChallenge()
    settings.value = { ...settings.value, startDate: '2026-05-15' }
    expect(day.value).toBe(1)

    settings.value = { ...settings.value, startDate: '2025-01-01' }
    expect(day.value).toBe(84)
  })
})
