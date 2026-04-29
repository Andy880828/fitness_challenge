/**
 * useScore — 包裝層，注入 effectiveDays。
 * 公式邏輯本身已在 tests/unit/utils/score.spec.ts 測過，
 * 此處只驗證包裝行為（effectiveDays 注入、結構正確）。
 */

import { ref } from 'vue'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { useScore } from '~/composables/useScore'
import { createMockSupabase } from '../helpers/supabase-mock'
import { fullMeasurements } from '../../fixtures/measurements'

describe('useScore', () => {
  beforeEach(() => {
    
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-06-01T00:00:00Z'))
    const supabase = createMockSupabase({ data: null, error: null })
    vi.stubGlobal('useSupabaseClient', () => supabase)
    vi.stubGlobal('useSupabaseUser', () => ref(null))
  })

  it('calc 回傳 ScoreBreakdown 全結構', () => {
    const { calc } = useScore()
    const score = calc({
      gender: 'male',
      measurements: fullMeasurements,
      workoutDays: 60,
      dietDays: 50,
      photoDays: 40,
    })
    expect(score).toHaveProperty('total')
    expect(score).toHaveProperty('fatScore')
    expect(score).toHaveProperty('muscleScore')
    expect(score).toHaveProperty('processScore')
    expect(typeof score.total).toBe('number')
  })

  it('calc 全空 measurements 不會 throw', () => {
    const { calc } = useScore()
    expect(() =>
      calc({
        gender: 'female',
        measurements: {},
        workoutDays: 0,
        dietDays: 0,
        photoDays: 0,
      }),
    ).not.toThrow()
  })

  it('effectiveDays 是 ref，可被讀取', () => {
    const { effectiveDays } = useScore()
    expect(typeof effectiveDays.value).toBe('number')
    expect(effectiveDays.value).toBeGreaterThanOrEqual(0)
  })
})
