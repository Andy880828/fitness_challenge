/**
 * useChangelog — 管理「使用者上次讀到的版本」狀態。
 *
 * 行為：
 * - SSR 初始 lastSeenVersion = null，避免 hydration mismatch（hasUnread 預設 false）
 * - onMounted 時讀 localStorage 同步真實值
 * - markRead() 寫入當前 LATEST_VERSION，hasUnread 立刻變 false
 *
 * 用相等比對（!== LATEST_VERSION）而非語意化版本——避免字串排序陷阱（"1.10" < "1.2"）。
 */

import { CHANGELOG_STORAGE_KEY, LATEST_VERSION } from '#shared/data/changelog'

const STATE_KEY = 'changelog:lastSeen'

export const useChangelog = () => {
  const lastSeenVersion = useState<string | null>(STATE_KEY, () => null)

  const hasUnread = computed(() => {
    if (lastSeenVersion.value === null) return false
    return lastSeenVersion.value !== LATEST_VERSION
  })

  const syncFromStorage = () => {
    if (typeof window === 'undefined') return
    try {
      const stored = window.localStorage.getItem(CHANGELOG_STORAGE_KEY)
      lastSeenVersion.value = stored ?? ''
    } catch {
      lastSeenVersion.value = ''
    }
  }

  const markRead = () => {
    if (typeof window === 'undefined') return
    try {
      window.localStorage.setItem(CHANGELOG_STORAGE_KEY, LATEST_VERSION)
    } catch {
      // 忽略：localStorage 可能被使用者禁用 / 隱私模式
    }
    lastSeenVersion.value = LATEST_VERSION
  }

  return {
    lastSeenVersion: readonly(lastSeenVersion),
    hasUnread,
    syncFromStorage,
    markRead,
    latestVersion: LATEST_VERSION,
  }
}
