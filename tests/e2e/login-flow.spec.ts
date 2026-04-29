/**
 * Login 流程 — 表單錯誤訊息 + 成功重導。
 */

import { expect, test } from '@playwright/test'
import { hasTestCreds, login, testEmail, testPassword } from './helpers/auth'

test.describe('Login flow', () => {
  test('錯誤密碼顯示 error 訊息，不重導', async ({ page }) => {
    await page.goto('/login')
    await page.locator('input[type="email"]').fill('not-a-user@example.com')
    await page.locator('input[type="password"]').fill('wrongpw')
    await page.locator('button[type="submit"]').click()

    await expect(page.locator('p').filter({ hasText: /^(?!.*登入中).+/ })).toBeVisible({ timeout: 10_000 })
    await expect(page).toHaveURL(/\/login/)
  })

  test('正確帳密登入後導向 dashboard', async ({ page }) => {
    test.skip(!hasTestCreds(), '無測試帳號 env 變數')
    await login(page, testEmail(), testPassword())
    await expect(page).toHaveURL(/\/dashboard|\/leaderboard/)
  })

  test('未登入訪問 /dashboard 被 middleware 踢回 /login', async ({ page }) => {
    await page.goto('/dashboard')
    await expect(page).toHaveURL(/\/login/, { timeout: 10_000 })
  })
})
