import type { Measurement, MeasurementsByWeek } from '#shared/types/measure'

export const measureRow = (
  weekIndex: 0 | 1 | 2 | 3,
  weight: number,
  fatPct: number,
  muscle: number,
) => ({
  participant_id: 'p-male-1',
  week_index: weekIndex,
  weight: String(weight),
  fat_pct: String(fatPct),
  muscle: String(muscle),
  measured_on: '2026-04-01',
  created_at: '2026-04-01T00:00:00Z',
  updated_at: '2026-04-01T00:00:00Z',
})

export const baseMeasure: Measurement = {
  participantId: 'p-male-1',
  weekIndex: 0,
  weight: 80,
  fatPct: 20,
  muscle: 30,
  measuredOn: '2026-04-01',
  createdAt: '2026-04-01T00:00:00Z',
  updatedAt: '2026-04-01T00:00:00Z',
}

export const fullMeasurements: MeasurementsByWeek = {
  0: { ...baseMeasure, weekIndex: 0, weight: 80, fatPct: 20, muscle: 30 },
  1: { ...baseMeasure, weekIndex: 1, weight: 78, fatPct: 18, muscle: 31 },
  2: { ...baseMeasure, weekIndex: 2, weight: 76, fatPct: 16, muscle: 32 },
  3: { ...baseMeasure, weekIndex: 3, weight: 74, fatPct: 14, muscle: 33 },
}
