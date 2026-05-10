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

export interface PhotoOwner {
  id: string
  name: string
  gender: 'M' | 'F'
}

export interface PhotoWithOwner extends Photo {
  owner: PhotoOwner
}
