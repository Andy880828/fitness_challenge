/**
 * Auth flow — register → 自動登入 → dashboard → 登出 → leaderboard。
 *
 * 注意：此測試會建立真實 Supabase 使用者；建議連到 test project 並在
 * 跑前清理（manual 或 cron）。Email 帶 timestamp 避免衝突。
 */

import { expect, test } from '@playwright/test'

const allowRegister = !!process.env.E2E_ALLOW_REGISTER

test.describe('Register → Login → Logout', () => {
  test('完整流程', async ({ page }) => {
    test.skip(!allowRegister, '需要 E2E_ALLOW_REGISTER=1（會建立真實帳號）')

    const stamp = Date.now()
    const email = `e2e-${stamp}@example.com`
    const password = 'e2e-pw-1234'

    await page.goto('/register')
    await page.locator('input[type="email"]').fill(email)
    await page.locator('input[type="password"]').fill(password)
    await page.getByLabel(/姓名/i).fill('E2E User')
    await page.getByLabel(/體重/i).first().fill('70')
    await page.getByLabel(/體脂/i).fill('20')
    await page.getByLabel(/肌肉/i).fill('30')

    await page.locator('button[type="submit"]').click()

    // 註冊完成自動登入後應跳到 dashboard
    await expect(page).toHaveURL(/\/dashboard/, { timeout: 15_000 })
    await expect(page.locator('[data-testid="auth-logout"]')).toBeVisible()

    // 登出回 leaderboard
    await page.locator('[data-testid="auth-logout"]').click()
    await expect(page).toHaveURL(/\/leaderboard/)
    await expect(page.locator('[data-testid="auth-login"]')).toBeVisible()
  })
})
