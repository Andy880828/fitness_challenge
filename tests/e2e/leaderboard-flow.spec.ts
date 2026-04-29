/**
 * 排行榜流程 — 訪客可看 + 點 row 跳 profile/[id]。
 */

import { expect, test } from '@playwright/test'

test.describe('Leaderboard', () => {
  test('訪客可看排行榜頁面結構', async ({ page }) => {
    await page.goto('/leaderboard')
    // 標題或 tab 至少有一個顯示
    await expect(page.locator('h1, h2').first()).toBeVisible()
  })

  test('排行榜 row 點擊跳 profile/[id]', async ({ page }) => {
    await page.goto('/leaderboard')

    const firstRow = page.locator('a[href^="/profile/"]').first()
    const rowExists = await firstRow.count()
    test.skip(rowExists === 0, 'leaderboard 無資料，無法測點擊')

    await firstRow.click()
    await expect(page).toHaveURL(/\/profile\//, { timeout: 10_000 })
    await expect(page.getByText(/PARTICIPANT PROFILE|參賽者|回排行榜/).first()).toBeVisible()
  })
})
