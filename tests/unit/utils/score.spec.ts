import { describe, it, expect } from 'vitest'
import { computeScore } from '#shared/utils/score'
import type { Measurement, MeasurementsByWeek } from '#shared/types/measure'

const mkMeasure = (
  partial: Partial<Measurement> & Pick<Measurement, 'weight' | 'fatPct' | 'muscle'>,
): Measurement => ({
  participantId: 'p1',
  weekIndex: 0,
  measuredOn: '2026-05-07',
  createdAt: '2026-05-07T00:00:00Z',
  updatedAt: '2026-05-07T00:00:00Z',
  ...partial,
})

describe('utils/score · computeScore', () => {
  it('無量測資料 → 全為 0', () => {
    const result = computeScore({
      gender: 'M',
      measurements: {},
      workoutDays: 0,
      dietDays: 0,
      photoDays: 0,
      effectiveDays: 1,
    })
    expect(result.total).toBe(0)
    expect(result.fatScore).toBe(0)
    expect(result.muscleScore).toBe(0)
    expect(result.processScore).toBe(0)
    expect(result.start).toBeNull()
    expect(result.latest).toBeNull()
  })

  it('完整 4 次量測 + 全勤 84 天 → 趨近滿分', () => {
    const measurements: MeasurementsByWeek = {
      0: mkMeasure({ weekIndex: 0, weight: 80, fatPct: 25, muscle: 30 }),
      1: mkMeasure({ weekIndex: 1, weight: 78, fatPct: 22, muscle: 31 }),
      2: mkMeasure({ weekIndex: 2, weight: 76, fatPct: 20, muscle: 32 }),
      3: mkMeasure({ weekIndex: 3, weight: 73, fatPct: 18, muscle: 33 }),
    }
    const result = computeScore({
      gender: 'M',
      measurements,
      workoutDays: 84,
      dietDays: 84,
      photoDays: 84,
      effectiveDays: 84,
    })
    expect(result.processScore).toBe(100)
    expect(result.fatChange).toBeCloseTo(28, 1)
    expect(result.muscleChange).toBeCloseTo(10, 1)
    expect(result.fatScore).toBe(100)
    expect(result.muscleScore).toBe(100)
    expect(result.total).toBeCloseTo(100, 1)
  })

  it('安全護欄 — 男性體脂從 12% 降到 8% 不再加分（floor=10）', () => {
    const measurements: MeasurementsByWeek = {
      0: mkMeasure({ weekIndex: 0, weight: 70, fatPct: 12, muscle: 35 }),
      3: mkMeasure({ weekIndex: 3, weight: 68, fatPct: 8, muscle: 35 }),
    }
    const result = computeScore({
      gender: 'M',
      measurements,
      workoutDays: 0,
      dietDays: 0,
      photoDays: 0,
      effectiveDays: 84,
    })
    // floor=10，effEnd=max(8,10)=10，fatChange=(12-10)/12*100 ≈ 16.67
    expect(result.fatChange).toBeCloseTo(16.67, 1)
  })

  it('安全護欄 — 女性 floor=16', () => {
    const measurements: MeasurementsByWeek = {
      0: mkMeasure({ weekIndex: 0, weight: 55, fatPct: 20, muscle: 22 }),
      3: mkMeasure({ weekIndex: 3, weight: 52, fatPct: 14, muscle: 22 }),
    }
    const result = computeScore({
      gender: 'F',
      measurements,
      workoutDays: 0,
      dietDays: 0,
      photoDays: 0,
      effectiveDays: 84,
    })
    // floor=16，effEnd=max(14,16)=16，fatChange=(20-16)/20*100 = 20
    expect(result.fatChange).toBe(20)
  })

  it('體脂上升 → fatChange 為負，但 fatScore 取 max(0, ...) → 0', () => {
    const measurements: MeasurementsByWeek = {
      0: mkMeasure({ weekIndex: 0, weight: 70, fatPct: 20, muscle: 30 }),
      3: mkMeasure({ weekIndex: 3, weight: 72, fatPct: 22, muscle: 30 }),
    }
    const result = computeScore({
      gender: 'M',
      measurements,
      workoutDays: 0,
      dietDays: 0,
      photoDays: 0,
      effectiveDays: 84,
    })
    expect(result.fatChange).toBeLessThan(0)
    expect(result.fatScore).toBe(0)
  })

  it('FAT_CAP 上限 — 減脂率超過 15% 也只計 100 分', () => {
    const measurements: MeasurementsByWeek = {
      0: mkMeasure({ weekIndex: 0, weight: 90, fatPct: 30, muscle: 30 }),
      3: mkMeasure({ weekIndex: 3, weight: 75, fatPct: 18, muscle: 30 }),
    }
    const result = computeScore({
      gender: 'M',
      measurements,
      workoutDays: 0,
      dietDays: 0,
      photoDays: 0,
      effectiveDays: 84,
    })
    // fatChange=(30-18)/30*100=40，超過 cap 15 → fatScore=100
    expect(result.fatChange).toBeCloseTo(40, 1)
    expect(result.fatScore).toBe(100)
  })

  it('過程分計算正確', () => {
    const result = computeScore({
      gender: 'M',
      measurements: {},
      workoutDays: 30,
      dietDays: 25,
      photoDays: 20,
      effectiveDays: 30,
    })
    // (30+25+20) / (30*3) * 100 = 75/90*100 ≈ 83.33
    expect(result.processScore).toBeCloseTo(83.33, 1)
  })

  it('latest 取最大 weekIndex 的有效量測', () => {
    const measurements: MeasurementsByWeek = {
      0: mkMeasure({ weekIndex: 0, weight: 80, fatPct: 25, muscle: 30 }),
      2: mkMeasure({ weekIndex: 2, weight: 76, fatPct: 20, muscle: 32 }),
    }
    const result = computeScore({
      gender: 'M',
      measurements,
      workoutDays: 0,
      dietDays: 0,
      photoDays: 0,
      effectiveDays: 84,
    })
    expect(result.latest?.fatPct).toBe(20)
    expect(result.measureCount).toBe(2)
  })
})
