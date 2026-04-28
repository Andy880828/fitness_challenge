/**
 * Server-only Supabase client（service role）封裝。
 * 透過 @nuxtjs/supabase 內建的 serverSupabaseServiceRole 取得，不需另外安裝 @supabase/supabase-js。
 *
 * 注意：目前使用 untyped client。等執行過 `pnpm db:gen-types` 產出真實型別後，
 * 可改回 `serverSupabaseServiceRole<Database>(event)` 取得 column-level 型別推斷。
 *   理由：placeholder Database 不滿足 supabase-js v2.45+ 對 `Relationships` 欄位的要求，
 *   會讓 typed query builder 退化為 never；自動產生的版本則完全相容。
 */

import type { H3Event } from 'h3'
import { serverSupabaseServiceRole } from '#supabase/server'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const useSupabaseServer = (event: H3Event) => serverSupabaseServiceRole<any>(event)
