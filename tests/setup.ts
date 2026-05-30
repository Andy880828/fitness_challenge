/**
 * Vitest 全域 setup — 跨所有 unit / integration 測試
 *
 * 任務：
 * 1. clearAllMocks 確保測試彼此不污染
 * 2. console.error 升級為 throw（避免靜默 Vue warnings）
 * 3. Stub Nuxt auto-imports（ref/computed/watch/useState）成全域，
 *    讓 composables 可以在不啟動完整 Nuxt 環境下測試
 */

import { afterEach, vi } from 'vitest'
import { computed, reactive, ref, watch, watchEffect } from 'vue'

// 必須在任何 composable import 之前 mock — 因為 setup 內 import usePhotos 會評估它的依賴。
// compressImage 用 Canvas API；happy-dom 沒有完整 Canvas 實作會 hang。
// Server 端依賴 mock — 避免測試環境啟動 pino transport workers / 找不到 #supabase/server alias
vi.mock('#supabase/server', () => ({
  serverSupabaseUser: vi.fn(),
  serverSupabaseClient: vi.fn(),
  serverSupabaseServiceRole: vi.fn(),
}))

vi.mock('pino', () => {
  const noop = () => undefined
  const child = () => ({
    info: noop, warn: noop, error: noop, debug: noop, child,
  })
  const fn = () => ({ info: noop, warn: noop, error: noop, debug: noop, child })
  fn.stdTimeFunctions = { isoTime: () => '' }
  return { default: fn }
})

// sharp 是原生 binding，測試環境直接 mock 為「壓縮後體積為原 buffer 的一半」
vi.mock('sharp', () => {
  const make = (input: Buffer) => {
    const finalBuf = Buffer.alloc(Math.max(8, Math.floor(input.length / 2)))
    const chain = {
      rotate: () => chain,
      resize: () => chain,
      jpeg: () => chain,
      toBuffer: () => Promise.resolve(finalBuf),
    }
    return chain
  }
  return { default: make }
})

vi.mock('~/utils/image-compress', () => ({
  compressImage: vi.fn(async (file: File) => ({
    blob: new Blob([file], { type: 'image/jpeg' }),
    width: 800,
    height: 600,
    bytes: file.size,
  })),
}))

import { useChallenge } from '~/composables/useChallenge'
import { useParticipants } from '~/composables/useParticipants'
import { useCheckins } from '~/composables/useCheckins'
import { useMeasures } from '~/composables/useMeasures'
import { usePhotos } from '~/composables/usePhotos'
import { useExerciseProofs } from '~/composables/useExerciseProofs'
import { useAdminExerciseProofs } from '~/composables/useAdminExerciseProofs'
import { useScore } from '~/composables/useScore'
import { useAvgSmm } from '~/composables/useAvgSmm'
import { useAuth } from '~/composables/useAuth'
import { useChangelog } from '~/composables/useChangelog'

afterEach(() => {
  vi.clearAllMocks()
})

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

vi.stubGlobal('ref', ref)
vi.stubGlobal('computed', computed)
vi.stubGlobal('watch', watch)
vi.stubGlobal('watchEffect', watchEffect)
vi.stubGlobal('reactive', reactive)

// 把 composables 設成 globalThis，讓 cross-composable auto-import 行為在測試環境可用
// （Nuxt 在 runtime 自動 import；vitest 不會跑 auto-import scanner）
// Nitro server auto-imports — 讓 server/api/* handlers 在測試環境可載入
vi.stubGlobal('defineEventHandler', <T>(h: T) => h)
vi.stubGlobal('readBody', vi.fn())
vi.stubGlobal('readMultipartFormData', vi.fn())
vi.stubGlobal('getRouterParam', vi.fn())
vi.stubGlobal('getRequestHeader', vi.fn())
vi.stubGlobal('useRuntimeConfig', () => ({}))
vi.stubGlobal('createError', (opts: { statusCode?: number; statusMessage?: string }) => {
  const err = new Error(opts.statusMessage ?? 'error') as Error & {
    statusCode?: number
    statusMessage?: string
  }
  err.statusCode = opts.statusCode
  err.statusMessage = opts.statusMessage
  return err
})

vi.stubGlobal('useChallenge', useChallenge)
vi.stubGlobal('useParticipants', useParticipants)
vi.stubGlobal('useCheckins', useCheckins)
vi.stubGlobal('useMeasures', useMeasures)
vi.stubGlobal('usePhotos', usePhotos)
vi.stubGlobal('useExerciseProofs', useExerciseProofs)
vi.stubGlobal('useAdminExerciseProofs', useAdminExerciseProofs)
vi.stubGlobal('useScore', useScore)
vi.stubGlobal('useAvgSmm', useAvgSmm)
vi.stubGlobal('useAuth', useAuth)
vi.stubGlobal('useChangelog', useChangelog)
vi.stubGlobal('readonly', <T>(v: T) => v)

const stateMap = new Map<string, unknown>()
vi.stubGlobal('useState', <T>(key: string, init?: () => T) => {
  if (!stateMap.has(key)) {
    stateMap.set(key, ref(init?.()))
  }
  return stateMap.get(key)
})

afterEach(() => {
  stateMap.clear()
})
