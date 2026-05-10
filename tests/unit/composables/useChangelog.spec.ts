/**
 * useChangelog — localStorage 互動 + hasUnread / markRead 行為。
 */

import { describe, expect, it, vi } from 'vitest'
import { useChangelog } from '~/composables/useChangelog'
import { CHANGELOG_STORAGE_KEY, LATEST_VERSION } from '#shared/data/changelog'

const stubLocalStorage = (initial: Record<string, string> = {}) => {
  const store: Record<string, string> = { ...initial }
  const ls = {
    getItem: vi.fn((k: string) => store[k] ?? null),
    setItem: vi.fn((k: string, v: string) => {
      store[k] = v
    }),
    removeItem: vi.fn((k: string) => { delete store[k] }),
    clear: vi.fn(() => { for (const k of Object.keys(store)) delete store[k] }),
  }
  vi.stubGlobal('window', { localStorage: ls })
  return { store, ls }
}

describe('useChangelog', () => {
  it('SSR 初始（lastSeenVersion=null）時 hasUnread 為 false', () => {
    const { hasUnread } = useChangelog()
    expect(hasUnread.value).toBe(false)
  })

  it('syncFromStorage 讀到舊版本 → hasUnread 為 true', () => {
    stubLocalStorage({ [CHANGELOG_STORAGE_KEY]: '1.0' })
    const { hasUnread, syncFromStorage } = useChangelog()
    syncFromStorage()
    expect(hasUnread.value).toBe(true)
  })

  it('syncFromStorage 讀到 LATEST_VERSION → hasUnread 為 false', () => {
    stubLocalStorage({ [CHANGELOG_STORAGE_KEY]: LATEST_VERSION })
    const { hasUnread, syncFromStorage } = useChangelog()
    syncFromStorage()
    expect(hasUnread.value).toBe(false)
  })

  it('syncFromStorage 讀到 null（從未讀過） → hasUnread 為 true', () => {
    stubLocalStorage({})
    const { hasUnread, syncFromStorage } = useChangelog()
    syncFromStorage()
    expect(hasUnread.value).toBe(true)
  })

  it('markRead 寫入 LATEST_VERSION 並使 hasUnread 變 false', () => {
    const { ls } = stubLocalStorage({})
    const { hasUnread, syncFromStorage, markRead } = useChangelog()
    syncFromStorage()
    expect(hasUnread.value).toBe(true)
    markRead()
    expect(ls.setItem).toHaveBeenCalledWith(CHANGELOG_STORAGE_KEY, LATEST_VERSION)
    expect(hasUnread.value).toBe(false)
  })
})
