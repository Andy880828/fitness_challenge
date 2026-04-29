/**
 * useAuth — Supabase Auth 包裝 + 註冊委派 server endpoint。
 */

import { ref } from 'vue'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { useAuth } from '~/composables/useAuth'
import { createMockSupabase } from '../helpers/supabase-mock'
import { maleParticipant } from '../../fixtures/participants'

describe('useAuth', () => {
  beforeEach(() => {
    // 不要 unstubAllGlobals — 會把 setup.ts 的 ref/computed/composables 一起清掉。
  })

  it('signIn 成功', async () => {
    const supabase = createMockSupabase({ data: null, error: null })
    supabase.auth.signInWithPassword = vi.fn().mockResolvedValue({
      data: { user: { id: 'u1' }, session: {} },
      error: null,
    })
    vi.stubGlobal('useSupabaseClient', () => supabase)
    vi.stubGlobal('useSupabaseUser', () => ref(null))

    const { signIn } = useAuth()
    const res = await signIn('a@b.c', 'pw')
    expect(res.error).toBeNull()
    expect(supabase.auth.signInWithPassword).toHaveBeenCalledWith({
      email: 'a@b.c',
      password: 'pw',
    })
  })

  it('signIn 失敗回傳 error message', async () => {
    const supabase = createMockSupabase({ data: null, error: null })
    supabase.auth.signInWithPassword = vi.fn().mockResolvedValue({
      data: null,
      error: { message: 'Invalid login credentials' },
    })
    vi.stubGlobal('useSupabaseClient', () => supabase)
    vi.stubGlobal('useSupabaseUser', () => ref(null))

    const { signIn } = useAuth()
    const res = await signIn('a@b.c', 'wrong')
    expect(res.error).toBe('Invalid login credentials')
    expect(res.data).toBeNull()
  })

  it('signOut 回傳 error null on success', async () => {
    const supabase = createMockSupabase({ data: null, error: null })
    supabase.auth.signOut = vi.fn().mockResolvedValue({ error: null })
    vi.stubGlobal('useSupabaseClient', () => supabase)
    vi.stubGlobal('useSupabaseUser', () => ref(null))

    const { signOut } = useAuth()
    const res = await signOut()
    expect(res.error).toBeNull()
  })

  it('isAuthenticated 反映 user ref', () => {
    const supabase = createMockSupabase({ data: null, error: null })
    const userRef = ref<{ id: string } | null>(null)
    vi.stubGlobal('useSupabaseClient', () => supabase)
    vi.stubGlobal('useSupabaseUser', () => userRef)

    const { isAuthenticated } = useAuth()
    expect(isAuthenticated.value).toBe(false)
    userRef.value = { id: 'u1' }
    expect(isAuthenticated.value).toBe(true)
  })

  it('register 委派 $fetch + 自動登入', async () => {
    const supabase = createMockSupabase({ data: null, error: null })
    supabase.auth.signInWithPassword = vi.fn().mockResolvedValue({ data: {}, error: null })
    vi.stubGlobal('useSupabaseClient', () => supabase)
    vi.stubGlobal('useSupabaseUser', () => ref(null))
    const fetchMock = vi.fn().mockResolvedValue(maleParticipant)
    vi.stubGlobal('$fetch', fetchMock)

    const { register } = useAuth()
    const res = await register({
      email: 'new@x.com',
      password: 'pw1234',
      participant: {
        userId: '',
        name: 'New',
        gender: 'male',
        age: 30,
        height: 175,
        startWeight: 80,
      },
      startMeasure: { weight: 80, fatPct: 20, muscle: 30 },
    })
    expect(res.error).toBeNull()
    expect(res.data).toEqual(maleParticipant)
    expect(fetchMock).toHaveBeenCalledWith('/api/participants/register', {
      method: 'POST',
      body: expect.objectContaining({ email: 'new@x.com' }),
    })
    expect(supabase.auth.signInWithPassword).toHaveBeenCalled()
  })

  it('register 失敗回 error message', async () => {
    const supabase = createMockSupabase({ data: null, error: null })
    vi.stubGlobal('useSupabaseClient', () => supabase)
    vi.stubGlobal('useSupabaseUser', () => ref(null))
    vi.stubGlobal('$fetch', vi.fn().mockRejectedValue(new Error('email taken')))

    const { register } = useAuth()
    const res = await register({
      email: 'dup@x.com',
      password: 'pw',
      participant: {
        userId: '',
        name: '',
        gender: 'male',
        age: 0,
        height: 0,
        startWeight: 0,
      },
      startMeasure: { weight: 0, fatPct: 0, muscle: 0 },
    })
    expect(res.data).toBeNull()
    expect(res.error).toBe('email taken')
  })
})
