export type Gender = 'M' | 'F'

export interface Participant {
  id: string
  userId: string
  name: string
  gender: Gender
  age: number | null
  height: number | null
  startWeight: number
  joinedAt: string
}

export interface ParticipantInsert {
  name: string
  gender: Gender
  age?: number | null
  height?: number | null
  startWeight: number
}

export interface ParticipantWithStats extends Participant {
  measureCount: number
  workoutDays: number
  dietDays: number
  photoDays: number
  totalPhotos: number
}
