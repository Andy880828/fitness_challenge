/**
 * E2E auth helper — 共用登入流程。
 *
 * 預期 env：
 *   NUXT_PUBLIC_TEST_EMAIL — 已存在的測試帳號 email
 *   NUXT_PUBLIC_TEST_PASSWORD — 對應密碼
 * 或：
 *   E2E_TEST_EMAIL / E2E_TEST_PASSWORD（CI 慣例）
 */

import { expect, type Page } from '@playwright/test'

export const testEmail = (): string =>
  process.env.NUXT_PUBLIC_TEST_EMAIL ?? process.env.E2E_TEST_EMAIL ?? ''

export const testPassword = (): string =>
  process.env.NUXT_PUBLIC_TEST_PASSWORD ?? process.env.E2E_TEST_PASSWORD ?? ''

export const hasTestCreds = (): boolean => !!testEmail() && !!testPassword()

/**
 * 走 /login 表單登入指定帳號，登入後等待 dashboard 載入。
 */
export async function login(
  page: Page,
  email: string = testEmail(),
  password: string = testPassword(),
): Promise<void> {
  await page.goto('/login')
  await page.locator('input[type="email"]').fill(email)
  await page.locator('input[type="password"]').fill(password)
  await page.locator('button[type="submit"]').click()
  await expect(page).toHaveURL(/\/(dashboard|leaderboard)/, { timeout: 10_000 })
}

/**
 * 透過 Header 登出按鈕登出。
 */
export async function logout(page: Page): Promise<void> {
  await page.locator('[data-testid="auth-logout"]').click()
  await expect(page).toHaveURL(/\/leaderboard/, { timeout: 10_000 })
}
