/**
 * 啟動時讀取挑戰賽設定（startDate / testMode）。
 * 客戶端 plugin，避免 SSR 時佔用 Supabase 連線。
 */

export default defineNuxtPlugin(async () => {
  const { refresh } = useChallenge()
  await refresh()
})
