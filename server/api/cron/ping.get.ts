/**
 * Supabase keep-alive ping。
 *
 * Supabase free tier 連續 7 天無流量會 pause project；恢復需手動 Restore。
 * 由 Vercel Cron 定期觸發此 endpoint，對 challenge_settings 做一次極小 SELECT，
 * 即可重置 inactivity 計時器。
 *
 * 由 Vercel Cron 觸發時會自動帶 `Authorization: Bearer ${CRON_SECRET}`。
 * 沒帶或不對的請求一律回 401，避免被外部濫用變成免費的健康檢查端點。
 */

import { childLogger } from '../../utils/logger'
import { useSupabaseServer } from '../../utils/supabase-server'

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const expected = config.cronSecret

  // 開發環境若未設 CRON_SECRET，允許本地呼叫（方便 curl 測試）；
  // production 必須設定，否則直接拒絕。
  if (expected) {
    const auth = getRequestHeader(event, 'authorization')
    if (auth !== `Bearer ${expected}`) {
      throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
    }
  } else if (process.env.NODE_ENV === 'production') {
    throw createError({ statusCode: 500, statusMessage: 'CRON_SECRET 未設定' })
  }

  const log = childLogger({ route: '/api/cron/ping' })
  const sb = useSupabaseServer(event)

  const start = Date.now()
  const { error } = await sb
    .from('challenge_settings')
    .select('id')
    .eq('id', 1)
    .single()
  const elapsed = Date.now() - start

  if (error) {
    log.error({ err: error, elapsed }, 'keep-alive ping 失敗')
    throw createError({ statusCode: 500, statusMessage: 'ping 失敗' })
  }

  log.info({ elapsed }, 'keep-alive ping 成功')
  return { ok: true, elapsed, at: new Date().toISOString() }
})
