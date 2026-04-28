/**
 * 取得挑戰賽全域設定（公開讀取）。
 * Composables 也可直接從 client 讀取此表，這個 endpoint 主要供
 * plugins/pollChallengeSettings.client.ts 與 SSR 場景使用。
 */

import { useSupabaseServer } from '../../utils/supabase-server'

export default defineEventHandler(async (event) => {
  const sb = useSupabaseServer(event)
  const { data, error } = await sb
    .from('challenge_settings')
    .select('start_date, test_mode, updated_at')
    .eq('id', 1)
    .single()

  if (error || !data) {
    throw createError({ statusCode: 500, statusMessage: '無法讀取設定' })
  }
  return {
    startDate: data.start_date,
    testMode: data.test_mode,
    updatedAt: data.updated_at,
  }
})
