export type ExerciseProofKind = 'photo' | 'note'

export interface ExerciseProof {
  id: string
  participantId: string
  date: string
  kind: ExerciseProofKind
  note: string | null
  storagePath: string | null
  publicUrl: string | null
  sizeBytes: number | null
  createdAt: string
}

export interface ExerciseProofOwner {
  id: string
  name: string
  gender: 'M' | 'F'
}

export interface ExerciseProofWithOwner extends ExerciseProof {
  owner: ExerciseProofOwner
}

export type ExerciseProofsByDate = Record<string, ExerciseProof[]>
