/**
 * 路由守衛 — 非 admin 跳回首頁。
 * 直接查 DB 而非讀 useAuth 的 cached isAdmin，避免 SSR / 冷啟動時 cache 未就緒的競態。
 */

export default defineNuxtRouteMiddleware(async () => {
  const user = useSupabaseUser()
  if (!user.value) return navigateTo('/login')

  const supabase = useSupabaseClient<any>()
  const { data } = await supabase
    .from('participants')
    .select('is_admin')
    .eq('user_id', user.value.id)
    .maybeSingle()

  if (data?.is_admin !== true) {
    return navigateTo('/')
  }
})
