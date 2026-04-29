/**
 * AuthMenu — Header 內顯示登入/登出按鈕的元件。
 * 測試重點：登入 / 未登入兩種狀態下渲染正確內容；登出按鈕觸發 signOut + redirect。
 */

import { computed, ref } from 'vue'
import { mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import AuthMenu from '~/components/layout/AuthMenu.vue'

describe('AuthMenu', () => {
  let userRef: ReturnType<typeof ref<{ id: string; email: string } | null>>
  let signOutMock: ReturnType<typeof vi.fn>
  let navigateMock: ReturnType<typeof vi.fn>

  beforeEach(() => {
    userRef = ref<{ id: string; email: string } | null>(null)
    signOutMock = vi.fn().mockResolvedValue({ error: null })
    navigateMock = vi.fn().mockResolvedValue(undefined)

    vi.stubGlobal('useAuth', () => ({
      user: userRef,
      isAuthenticated: computed(() => !!userRef.value),
      signOut: signOutMock,
    }))
    vi.stubGlobal('navigateTo', navigateMock)
  })

  // 預設 inheritAttrs: true 會把 data-testid 自動 forward 到 <a>
  const stubs = {
    NuxtLink: {
      props: ['to'],
      template: '<a :href="to"><slot /></a>',
    },
  }

  it('未登入時顯示登入 + 報名連結', () => {
    const wrapper = mount(AuthMenu, { global: { stubs } })
    expect(wrapper.find('[data-testid="auth-login"]').exists()).toBe(true)
    expect(wrapper.find('[data-testid="auth-register"]').exists()).toBe(true)
    expect(wrapper.find('[data-testid="auth-logout"]').exists()).toBe(false)
  })

  it('已登入時顯示登出 + email username', () => {
    userRef.value = { id: 'u1', email: 'alice@example.com' }
    const wrapper = mount(AuthMenu, { global: { stubs } })
    expect(wrapper.find('[data-testid="auth-logout"]').exists()).toBe(true)
    expect(wrapper.find('[data-testid="auth-login"]').exists()).toBe(false)
    expect(wrapper.find('[data-testid="auth-user"]').text()).toBe('alice')
  })

  it('點登出按鈕觸發 signOut + 導向 /leaderboard', async () => {
    userRef.value = { id: 'u1', email: 'alice@example.com' }
    const wrapper = mount(AuthMenu, { global: { stubs } })
    await wrapper.find('[data-testid="auth-logout"]').trigger('click')
    await new Promise(resolve => setTimeout(resolve, 0))
    expect(signOutMock).toHaveBeenCalled()
    expect(navigateMock).toHaveBeenCalledWith('/leaderboard')
  })

  it('signOut 失敗時不導向', async () => {
    userRef.value = { id: 'u1', email: 'a@b.c' }
    signOutMock.mockResolvedValueOnce({ error: 'network' })
    const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const wrapper = mount(AuthMenu, { global: { stubs } })
    await wrapper.find('[data-testid="auth-logout"]').trigger('click')
    await new Promise(resolve => setTimeout(resolve, 0))
    expect(navigateMock).not.toHaveBeenCalled()
    consoleSpy.mockRestore()
  })
})
