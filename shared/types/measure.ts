export type WeekIndex = 0 | 1 | 2 | 3

export interface Measurement {
  participantId: string
  weekIndex: WeekIndex
  weight: number
  fatPct: number
  muscle: number
  measuredOn: string
  createdAt: string
  updatedAt: string
}

export interface MeasurementInput {
  weight: number
  fatPct: number
  muscle: number
  measuredOn?: string
}

export type MeasurementsByWeek = Partial<Record<WeekIndex, Measurement>>
