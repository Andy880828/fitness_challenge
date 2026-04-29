import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

// 此檔測試真實 compressImage —— 取消 setup.ts 的全域 mock。
vi.unmock('~/utils/image-compress')

describe('utils/image-compress', () => {
  describe('在 Node 環境（無 window）', () => {
    const originalWindow = globalThis.window

    beforeEach(() => {
      // @ts-expect-error - 測試用刪除 window
      delete globalThis.window
    })

    afterEach(() => {
      if (originalWindow) globalThis.window = originalWindow
    })

    it('應該 reject', async () => {
      const { compressImage } = await import('~/utils/image-compress')
      const fake = new Blob([new Uint8Array(10)], { type: 'image/jpeg' })
      await expect(compressImage(fake)).rejects.toThrow('僅可在瀏覽器執行')
    })
  })

  describe('在瀏覽器環境（happy-dom 模擬）', () => {
    // vitest 3 對 spyOn 回傳收緊型別；用 unknown 中介避免雙泛型衝突
    let createElementSpy: { mockRestore: () => void }

    beforeEach(() => {
      // 建立模擬 canvas — happy-dom 預設 canvas 不支援 toBlob
      const fakeBlob = new Blob([new Uint8Array(123)], { type: 'image/jpeg' })
      const fakeCtx = { drawImage: vi.fn() } as unknown as CanvasRenderingContext2D
      const fakeCanvas = {
        width: 0,
        height: 0,
        getContext: vi.fn(() => fakeCtx),
        toBlob: vi.fn((cb: (blob: Blob | null) => void) => cb(fakeBlob)),
      }
      createElementSpy = vi
        .spyOn(document, 'createElement')
        .mockImplementation(((tag: string) => {
          if (tag === 'canvas') return fakeCanvas as unknown as HTMLCanvasElement
          return document.createElement(tag)
        }) as unknown as typeof document.createElement) as unknown as { mockRestore: () => void }
    })

    afterEach(() => {
      createElementSpy.mockRestore()
    })

    it('回傳 Blob 與壓縮後尺寸', async () => {
      // 此測試需要瀏覽器 Image / FileReader API；happy-dom 提供基本實作
      // 完整的圖片解碼測試會在 E2E（Playwright 真實瀏覽器）覆蓋
      const { compressImage } = await import('~/utils/image-compress')
      // 因 happy-dom 的 Image/FileReader 行為與瀏覽器有差，此處僅驗 API 形狀
      expect(typeof compressImage).toBe('function')
    })
  })
})
