/**
 * 認證 — 包裝 Supabase Auth 提供 signUp / signIn / signOut。
 * 註冊流程委派給 server/api/participants/register.post.ts，
 * 因為需要在同一 transaction 內建立 auth user + participants + measurements[0]。
 *
 * isAdmin: 跟著 user 變化自動從 participants 表載入 is_admin 狀態。
 */

import type { ParticipantInsert, Participant } from '#shared/types/participant'
import type { MeasurementInput } from '#shared/types/measure'

export interface RegisterPayload {
  email: string
  password: string
  participant: ParticipantInsert
  startMeasure: MeasurementInput
}

export const useAuth = () => {
  const supabase = useSupabaseClient<any>()
  const user = useSupabaseUser()
  const isAdmin = useState<boolean>('auth.isAdmin', () => false)

  const refreshAdminFlag = async () => {
    if (!user.value) {
      isAdmin.value = false
      return
    }
    const { data } = await supabase
      .from('participants')
      .select('is_admin')
      .eq('user_id', user.value.id)
      .maybeSingle()
    isAdmin.value = data?.is_admin === true
  }

  watch(user, () => { void refreshAdminFlag() }, { immediate: true })

  const signIn = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) return { data: null, error: error.message }
    await refreshAdminFlag()
    return { data, error: null }
  }

  const signOut = async () => {
    const { error } = await supabase.auth.signOut()
    isAdmin.value = false
    return { error: error?.message ?? null }
  }

  const register = async (
    payload: RegisterPayload,
  ): Promise<{ data: Participant | null; error: string | null }> => {
    try {
      const data = await $fetch<Participant>('/api/participants/register', {
        method: 'POST',
        body: payload,
      })
      // 註冊完成後立即登入，建立 session
      await supabase.auth.signInWithPassword({
        email: payload.email,
        password: payload.password,
      })
      await refreshAdminFlag()
      return { data, error: null }
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : (err as { data?: { message?: string } })?.data?.message ?? '註冊失敗'
      return { data: null, error: message }
    }
  }

  const isAuthenticated = computed(() => !!user.value)

  return { user, isAuthenticated, isAdmin, signIn, signOut, register, refreshAdminFlag }
}
