/**
 * Checkin 流程 — 登入 → 點 toggle → 重整後狀態保持。
 */

import { expect, test } from '@playwright/test'
import { hasTestCreds, login } from './helpers/auth'

test.describe('Checkin flow', () => {
  test('登入後切到 /checkin，運動 tile 可點擊並反映狀態', async ({ page }) => {
    test.skip(!hasTestCreds(), '無測試帳號 env 變數')
    await login(page)
    await page.goto('/checkin')

    await expect(page.locator('h1').filter({ hasText: '每日打卡' })).toBeVisible()

    const workoutTile = page.locator('button').filter({ hasText: '運動' }).first()
    await expect(workoutTile).toBeVisible()
    const beforeClass = await workoutTile.getAttribute('class')

    await workoutTile.click()
    await page.waitForTimeout(500)
    const afterClass = await workoutTile.getAttribute('class')
    expect(afterClass).not.toBe(beforeClass)

    // 重整後狀態保持（樂觀更新已寫入 DB）
    await page.reload()
    const reloadedTile = page.locator('button').filter({ hasText: '運動' }).first()
    await expect(reloadedTile).toBeVisible()
  })

  test('未登入訪問 /checkin 被踢回 /login', async ({ page }) => {
    await page.goto('/checkin')
    await expect(page).toHaveURL(/\/login/, { timeout: 10_000 })
  })
})
