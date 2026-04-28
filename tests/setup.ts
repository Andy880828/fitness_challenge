/**
 * Vitest 全域 setup — 跨所有 unit / integration 測試
 */

import { afterEach, vi } from 'vitest'

afterEach(() => {
  vi.clearAllMocks()
})

// 將 console.error 升級為 fail（測試中不應該有未捕捉的錯誤）
const originalError = console.error
console.error = (...args: unknown[]) => {
  originalError(...args)
  if (
    typeof args[0] === 'string' &&
    (args[0].includes('Vue warn') || args[0].includes('TypeError'))
  ) {
    throw new Error(`Unexpected console.error: ${args[0]}`)
  }
}
