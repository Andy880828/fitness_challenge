/**
 * #supabase/server alias 的測試替身。
 * 真正的實作在 @nuxtjs/supabase 模組內，僅在 Nuxt 啟動時注入；
 * vitest 環境下 vi.mock('#supabase/server', ...) 會接管這些 export。
 */

import { vi } from 'vitest'

export const serverSupabaseUser = vi.fn()
export const serverSupabaseClient = vi.fn()
export const serverSupabaseServiceRole = vi.fn()
