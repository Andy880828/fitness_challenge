/**
 * 共用 multipart POST helper：用 XHR 以便監聽 upload.progress。
 * usePhotos 與 useExerciseProofs 共用，避免兩份重複維護。
 *
 * iOS Safari 對 fetch upload progress 支援不穩 → XMLHttpRequest 是最可靠的跨瀏覽器方案。
 */

export const postWithProgress = <T>(
  url: string,
  formData: FormData,
  onProgress?: (pct: number) => void,
): Promise<T> =>
  new Promise<T>((resolve, reject) => {
    const xhr = new XMLHttpRequest()
    xhr.open('POST', url)
    xhr.responseType = 'text'
    xhr.withCredentials = true
    xhr.upload.addEventListener('progress', (e) => {
      if (e.lengthComputable && onProgress) {
        onProgress(Math.round((e.loaded / e.total) * 100))
      }
    })
    xhr.onload = () => {
      const ok = xhr.status >= 200 && xhr.status < 300
      let body: unknown = null
      try {
        body = xhr.responseText ? JSON.parse(xhr.responseText) : null
      } catch {
        body = xhr.responseText
      }
      if (ok) {
        resolve(body as T)
        return
      }
      const msg =
        (body && typeof body === 'object' && 'message' in body && typeof (body as { message: unknown }).message === 'string'
          ? (body as { message: string }).message
          : null) ??
        (body && typeof body === 'object' && 'statusMessage' in body && typeof (body as { statusMessage: unknown }).statusMessage === 'string'
          ? (body as { statusMessage: string }).statusMessage
          : null) ??
        `HTTP ${xhr.status}`
      reject(new Error(msg))
    }
    xhr.onerror = () => reject(new Error('網路錯誤'))
    xhr.onabort = () => reject(new Error('上傳已取消'))
    xhr.send(formData)
  })

export interface UploadProgressHandlers {
  onCompressProgress?: (pct: number) => void
  onUploadProgress?: (pct: number) => void
}
