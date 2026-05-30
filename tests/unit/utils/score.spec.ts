import { describe, it, expect } from 'vitest'
import { computeScore, computeAvgSmm } from '#shared/utils/score'
import type { Measurement, MeasurementsByWeek } from '#shared/types/measure'
import type { AvgSmm } from '#shared/types/score'

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

// 規格實際參考平均（男 33.883 kg、女 22.76 kg）
const AVG: AvgSmm = { M: 33.883, F: 22.76 }

describe('utils/score · computeScore (v2.0)', () => {
  it('無量測資料 → 體脂/增肌為 0，過程分仍可累積', () => {
    const result = computeScore({
      gender: 'M',
      measurements: {},
      workoutDays: 30,
      dietDays: 30,
      photoDays: 30,
      effectiveDays: 90, // expectedCheckins = 270；procNorm = 90/270*100 = 33.33
      avgSmm: AVG,
    })
    expect(result.fatScore).toBe(0)
    expect(result.muscleScore).toBe(0)
    expect(result.start).toBeNull()
    expect(result.latest).toBeNull()
    expect(result.processScore).toBeCloseTo(6.67, 1) // 33.33 * 0.2
    expect(result.avgSmmReady).toBe(true)
  })

  it('驗算範例：男 B (13.1%→11.8%, sm 43.1→43.5) → composite ≈ 57.84', () => {
    const measurements: MeasurementsByWeek = {
      0: mkMeasure({ weekIndex: 0, weight: 80, fatPct: 13.1, muscle: 43.1 }),
      3: mkMeasure({ weekIndex: 3, weight: 78, fatPct: 11.8, muscle: 43.5 }),
    }
    // 出勤率 90% → procNorm = 90 → procScore = 18
    const checks = Math.round(252 * 0.9) // 227
    const result = computeScore({
      gender: 'M',
      measurements,
      workoutDays: checks,
      dietDays: 0,
      photoDays: 0,
      effectiveDays: 84,
      avgSmm: AVG,
    })

    expect(result.fatCoef).toBeCloseTo(2.137, 2)
    expect(result.weightedFat).toBeCloseTo(21.21, 1)
    expect(result.fatScore).toBeCloseTo(33.94, 1)

    expect(result.musCoef).toBeCloseTo(1.272, 2)
    expect(result.weightedMus).toBeCloseTo(1.181, 2)
    expect(result.muscleScore).toBeCloseTo(5.9, 1)

    expect(result.processScore).toBeCloseTo(18, 0)
    expect(result.total).toBeCloseTo(57.84, 0)
  })

  it('驗算範例：男 A (24.9%→20.0%, sm 27.5→28.5) → composite ≈ 68.16', () => {
    const measurements: MeasurementsByWeek = {
      0: mkMeasure({ weekIndex: 0, weight: 85, fatPct: 24.9, muscle: 27.5 }),
      3: mkMeasure({ weekIndex: 3, weight: 78, fatPct: 20.0, muscle: 28.5 }),
    }
    const checks = Math.round(252 * 0.9)
    const result = computeScore({
      gender: 'M',
      measurements,
      workoutDays: checks,
      dietDays: 0,
      photoDays: 0,
      effectiveDays: 84,
      avgSmm: AVG,
    })

    expect(result.fatCoef).toBeCloseTo(1.124, 2)
    expect(result.fatScore).toBeCloseTo(35.4, 1)
    expect(result.musCoef).toBeCloseTo(0.812, 2)
    expect(result.muscleScore).toBeCloseTo(14.76, 1)
    expect(result.total).toBeCloseTo(68.16, 0)
  })

  it('體脂上升 → fatChange 為負，但 weightedFat 取 max(0, …) → fatScore = 0', () => {
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
      avgSmm: AVG,
    })
    expect(result.fatChange).toBeLessThan(0)
    expect(result.weightedFat).toBe(0)
    expect(result.fatScore).toBe(0)
  })

  it('加權減脂超過 FAT_CAP=25 → fatNorm 封頂在 100，fatScore = 40', () => {
    // 男性 bf0=20 → fatCoef = 28/20 = 1.4；要 weightedFat ≥ 25 → rawFatLoss ≥ 17.86
    const measurements: MeasurementsByWeek = {
      0: mkMeasure({ weekIndex: 0, weight: 90, fatPct: 20, muscle: 30 }),
      3: mkMeasure({ weekIndex: 3, weight: 70, fatPct: 10, muscle: 30 }),
    }
    const result = computeScore({
      gender: 'M',
      measurements,
      workoutDays: 0,
      dietDays: 0,
      photoDays: 0,
      effectiveDays: 84,
      avgSmm: AVG,
    })
    // rawFatLoss = 50, weightedFat = 70 → fatNorm 封頂 100 → fatScore = 40
    expect(result.weightedFat).toBeGreaterThan(25)
    expect(result.fatNorm).toBe(100)
    expect(result.fatScore).toBe(40)
  })

  it('女性使用 F_REF=33', () => {
    const measurements: MeasurementsByWeek = {
      0: mkMeasure({ weekIndex: 0, weight: 55, fatPct: 33, muscle: 22.76 }),
      3: mkMeasure({ weekIndex: 3, weight: 53, fatPct: 30, muscle: 22.76 }),
    }
    const result = computeScore({
      gender: 'F',
      measurements,
      workoutDays: 0,
      dietDays: 0,
      photoDays: 0,
      effectiveDays: 84,
      avgSmm: AVG,
    })
    // fatCoef = 33/33 = 1（剛好等於 F_REF）
    expect(result.fatCoef).toBeCloseTo(1, 2)
    expect(result.musCoef).toBeCloseTo(1, 2) // 22.76 / 22.76
  })

  it('AVG_SMM 該性別為 0 → musCoef 退回 1、avgSmmReady=false', () => {
    const measurements: MeasurementsByWeek = {
      0: mkMeasure({ weekIndex: 0, weight: 80, fatPct: 25, muscle: 30 }),
      3: mkMeasure({ weekIndex: 3, weight: 78, fatPct: 22, muscle: 31 }),
    }
    const result = computeScore({
      gender: 'M',
      measurements,
      workoutDays: 0,
      dietDays: 0,
      photoDays: 0,
      effectiveDays: 84,
      avgSmm: { M: 0, F: 0 },
    })
    expect(result.avgSmmReady).toBe(false)
    expect(result.musCoef).toBe(1)
    // rawMusGain = 1/30*100 = 3.33；weightedMus = 3.33 × 1 = 3.33
    expect(result.weightedMus).toBeCloseTo(3.33, 1)
  })

  it('過程分計算正確', () => {
    const result = computeScore({
      gender: 'M',
      measurements: {},
      workoutDays: 30,
      dietDays: 25,
      photoDays: 20,
      effectiveDays: 30,
      avgSmm: AVG,
    })
    // (30+25+20) / (30*3) * 100 = 75/90*100 ≈ 83.33 → procScore = 16.67
    expect(result.procNorm).toBeCloseTo(83.33, 1)
    expect(result.processScore).toBeCloseTo(16.67, 1)
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
      avgSmm: AVG,
    })
    expect(result.latest?.fatPct).toBe(20)
    expect(result.measureCount).toBe(2)
  })
})

describe('utils/score · computeAvgSmm', () => {
  it('依性別分別取算術平均', () => {
    const avg = computeAvgSmm([
      { gender: 'M', muscle: 30 },
      { gender: 'M', muscle: 40 },
      { gender: 'F', muscle: 20 },
      { gender: 'F', muscle: 24 },
    ])
    expect(avg.M).toBe(35)
    expect(avg.F).toBe(22)
  })

  it('該性別 0 人或全部 muscle <= 0 → 該性別回 0', () => {
    const avg = computeAvgSmm([
      { gender: 'M', muscle: 30 },
      { gender: 'F', muscle: 0 },
    ])
    expect(avg.M).toBe(30)
    expect(avg.F).toBe(0)
  })
})
