export interface Photo {
  id: string
  participantId: string
  date: string
  storagePath: string
  publicUrl: string
  sizeBytes: number | null
  uploadedAt: string
}

export interface PhotoUploadResult {
  photo: Photo
}

export type PhotosByDate = Record<string, Photo[]>
