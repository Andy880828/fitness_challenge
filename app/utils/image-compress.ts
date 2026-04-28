/**
 * 圖片壓縮 — Canvas API。沿用 fitness-challenge.html 邏輯，
 * 但回傳 Blob（用於 Supabase Storage 上傳），而非 base64。
 * 僅在瀏覽器執行；Node 環境呼叫會 throw。
 */

import { PHOTO_COMPRESS } from '#shared/utils/constants'

export interface CompressOptions {
  maxWidth?: number
  jpegQuality?: number
  mimeType?: 'image/jpeg' | 'image/webp'
}

export interface CompressResult {
  blob: Blob
  width: number
  height: number
  sizeBytes: number
}

export const compressImage = (
  file: File | Blob,
  opts: CompressOptions = {},
): Promise<CompressResult> => {
  if (typeof window === 'undefined') {
    return Promise.reject(new Error('compressImage 僅可在瀏覽器執行'))
  }

  const maxWidth = opts.maxWidth ?? PHOTO_COMPRESS.maxWidth
  const quality = opts.jpegQuality ?? PHOTO_COMPRESS.jpegQuality
  const mimeType = opts.mimeType ?? 'image/jpeg'

  return new Promise<CompressResult>((resolve, reject) => {
    const reader = new FileReader()

    reader.onerror = () => reject(new Error('讀取檔案失敗'))
    reader.onload = (e) => {
      const dataUrl = e.target?.result
      if (typeof dataUrl !== 'string') {
        reject(new Error('讀取結果非字串'))
        return
      }

      const img = new Image()
      img.onerror = () => reject(new Error('圖片解碼失敗'))
      img.onload = () => {
        const scale = Math.min(1, maxWidth / img.width)
        const w = Math.round(img.width * scale)
        const h = Math.round(img.height * scale)

        const canvas = document.createElement('canvas')
        canvas.width = w
        canvas.height = h

        const ctx = canvas.getContext('2d')
        if (!ctx) {
          reject(new Error('Canvas 2D 不支援'))
          return
        }
        ctx.drawImage(img, 0, 0, w, h)

        canvas.toBlob(
          (blob) => {
            if (!blob) {
              reject(new Error('壓縮輸出 Blob 失敗'))
              return
            }
            resolve({ blob, width: w, height: h, sizeBytes: blob.size })
          },
          mimeType,
          quality,
        )
      }
      img.src = dataUrl
    }

    reader.readAsDataURL(file)
  })
}
