import type { Participant, ParticipantWithStats } from '#shared/types/participant'

export const maleParticipant: Participant = {
  id: 'p-male-1',
  userId: 'u-male-1',
  name: 'Alice',
  gender: 'male',
  age: 30,
  height: 175,
  startWeight: 80,
  joinedAt: '2026-04-01T00:00:00Z',
}

export const femaleParticipant: Participant = {
  id: 'p-female-1',
  userId: 'u-female-1',
  name: 'Bobbi',
  gender: 'female',
  age: 28,
  height: 165,
  startWeight: 60,
  joinedAt: '2026-04-01T00:00:00Z',
}

export const maleParticipantRow = {
  id: maleParticipant.id,
  user_id: maleParticipant.userId,
  name: maleParticipant.name,
  gender: maleParticipant.gender,
  age: maleParticipant.age,
  height: maleParticipant.height,
  start_weight: String(maleParticipant.startWeight),
  joined_at: maleParticipant.joinedAt,
}

export const leaderboardRowMale = {
  id: maleParticipant.id,
  user_id: maleParticipant.userId,
  name: maleParticipant.name,
  gender: maleParticipant.gender,
  start_weight: String(maleParticipant.startWeight),
  measure_count: 4,
  workout_days: 60,
  diet_days: 50,
  photo_days: 40,
  total_photos: 100,
}

export const leaderboardWithStats: ParticipantWithStats = {
  ...maleParticipant,
  age: null,
  height: null,
  joinedAt: '',
  measureCount: 4,
  workoutDays: 60,
  dietDays: 50,
  photoDays: 40,
  totalPhotos: 100,
}
