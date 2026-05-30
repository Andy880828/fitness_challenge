/**
 * useScore — 包裝層，注入 effectiveDays 與 AVG_SMM。
 * 公式邏輯本身已在 tests/unit/utils/score.spec.ts 測過，
 * 此處驗證包裝行為（avgSmm 整合、結構正確）。
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

  it('calc 回傳 ScoreBreakdown 全結構，包含 v2.0 新欄位', () => {
    const { calc } = useScore()
    const score = calc({
      gender: 'M',
      measurements: fullMeasurements,
      workoutDays: 60,
      dietDays: 50,
      photoDays: 40,
    })
    expect(score).toHaveProperty('total')
    expect(score).toHaveProperty('fatScore')
    expect(score).toHaveProperty('muscleScore')
    expect(score).toHaveProperty('processScore')
    // v2.0 新欄位
    expect(score).toHaveProperty('fatCoef')
    expect(score).toHaveProperty('musCoef')
    expect(score).toHaveProperty('weightedFat')
    expect(score).toHaveProperty('weightedMus')
    expect(score).toHaveProperty('fatNorm')
    expect(score).toHaveProperty('musNorm')
    expect(score).toHaveProperty('procNorm')
    expect(score).toHaveProperty('avgSmmReady')
    expect(typeof score.total).toBe('number')
  })

  it('calc 全空 measurements 不會 throw', () => {
    const { calc } = useScore()
    expect(() =>
      calc({
        gender: 'F',
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

  it('avgSmm 未 load 時 musCoef 退回 1、avgSmmReady=false', () => {
    const { calc } = useScore()
    const score = calc({
      gender: 'M',
      measurements: fullMeasurements,
      workoutDays: 0,
      dietDays: 0,
      photoDays: 0,
    })
    // 未 await loadAvgSmm()，因此 avgSmm.value = { M: 0, F: 0 }
    expect(score.avgSmmReady).toBe(false)
    expect(score.musCoef).toBe(1)
  })
})
