/**
 * Header 導覽列依登入狀態切換。不需 DB seed。
 */

import { expect, test } from '@playwright/test'
import { hasTestCreds, login } from './helpers/auth'

test.describe('Header navigation', () => {
  test('未登入時顯示公開連結 + 登入/報名按鈕', async ({ page }) => {
    await page.goto('/leaderboard')
    await expect(page.locator('[data-testid="auth-login"]')).toBeVisible()
    await expect(page.locator('[data-testid="auth-register"]')).toBeVisible()
    await expect(page.locator('[data-testid="auth-logout"]')).toHaveCount(0)

    const nav = page.locator('[data-testid="main-nav"]')
    await expect(nav).toContainText('排行榜')
    await expect(nav).toContainText('規則')
    await expect(nav).not.toContainText('每日打卡')
    await expect(nav).not.toContainText('我的儀表板')
  })

  test('登入後 nav 出現 checkin / dashboard，登出後恢復', async ({ page }) => {
    test.skip(!hasTestCreds(), '無測試帳號 env 變數')
    await login(page)

    await expect(page.locator('[data-testid="auth-logout"]')).toBeVisible()
    await expect(page.locator('[data-testid="auth-user"]')).toBeVisible()
    const nav = page.locator('[data-testid="main-nav"]')
    await expect(nav).toContainText('每日打卡')
    await expect(nav).toContainText('我的儀表板')

    await page.locator('[data-testid="auth-logout"]').click()
    await expect(page).toHaveURL(/\/leaderboard/)
    await expect(page.locator('[data-testid="auth-login"]')).toBeVisible()
  })
})
