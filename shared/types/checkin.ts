export interface Checkin {
  participantId: string
  date: string
  workout: boolean
  diet: boolean
  updatedAt: string
}

export interface CheckinInput {
  date: string
  workout: boolean
  diet: boolean
}

export type CheckinsByDate = Record<string, Pick<Checkin, 'workout' | 'diet'>>
