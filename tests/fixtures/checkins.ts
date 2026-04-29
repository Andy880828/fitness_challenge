export const checkinRow = (
  date: string,
  workout: boolean,
  diet: boolean,
  participantId = 'p-male-1',
) => ({
  participant_id: participantId,
  date,
  workout,
  diet,
  updated_at: `${date}T00:00:00Z`,
})

export const sampleCheckins = [
  checkinRow('2026-04-01', true, true),
  checkinRow('2026-04-02', true, false),
  checkinRow('2026-04-03', false, true),
  checkinRow('2026-04-04', false, false),
]
