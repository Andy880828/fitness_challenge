# 12週減脂增肌挑戰賽 / FORGE

12 週為期、男女分組、即時計分的減脂增肌活動平台。Nuxt 4 + Supabase + Vercel。

**最新版本：v2.0**（2026-05-30）— 計分公式改版：引入難度係數加權（`fatCoef = F_REF / bf0`、`musCoef = sm0 / AVG_SMM`），加權後封頂歸一化到 0–100，依性別套用不同參考值。完整紀錄於 `shared/data/changelog.ts`，使用者可在右下角懸浮鈕查看。

## 技術棧

- **Framework**：[Nuxt 4](https://nuxt.com)（Vue 3 Composition API）
- **TypeScript**：strict mode
- **Styling**：TailwindCSS + CSS variables
- **Backend**：Supabase（PostgreSQL + Auth + Storage）
- **Deploy**：Vercel
- **Testing**：Vitest 3 + Playwright
- **Logger**：pino + pino-roll（30 天輪替）

## 快速開始（雲端 Supabase）

```bash
pnpm install

# 1. 在 https://supabase.com 建立 Project，從 Settings → API 抓 URL 與 keys
cp .env.example .env
# 填入：NUXT_PUBLIC_SUPABASE_URL / NUXT_PUBLIC_SUPABASE_ANON_KEY / SUPABASE_SERVICE_ROLE_KEY

# 2. 在雲端 Dashboard SQL Editor 套用 docs/DATABASE.md 內 schema

# 3.（選用）連結 CLI 與雲端 project，自動產 types
pnpm dlx supabase login
pnpm db:link
pnpm db:gen-types

# 4. 啟動
pnpm dev                   # http://localhost:3000
```

需要本地 Docker 模式（離線開發 / integration tests），參見 [`docs/DEVELOPMENT.md`](./docs/DEVELOPMENT.md)。

## 跑測試

```bash
pnpm test:unit          # 單元測試（composables、components、utils）
pnpm test:integration   # API endpoints（mock Supabase）
pnpm test:e2e           # Playwright 瀏覽器自動化（需 dev server）
pnpm test:coverage      # 覆蓋率報告（目標 80%+）
```

E2E 需要 Supabase 已存在的測試帳號，在 `.env` 加：

```bash
NUXT_PUBLIC_TEST_EMAIL=test@example.com
NUXT_PUBLIC_TEST_PASSWORD=your-test-password
# 啟用註冊測試（會建立真實使用者，預設 skip）：
E2E_ALLOW_REGISTER=1
```

沒設這些變數時，需登入的 spec 會自動 skip，不影響 CI 穩定。

## 部署

主機：**Vercel**（Hobby 即可）。`vercel.json` 已含：

- `framework: nuxtjs` + `pnpm build/install`
- 每週一、四 UTC 03:00 戳 `/api/cron/ping` 防 Supabase free tier 7 天無流量休眠
- 全站 security headers（X-Frame-Options、Referrer-Policy 等）

完整步驟（CLI 連結 / env vars / `CRON_SECRET` / 部署後驗證）見 [`docs/DEVELOPMENT.md`](./docs/DEVELOPMENT.md) 的「部署到 Vercel」章節。

## 文件

- [`CLAUDE.md`](./CLAUDE.md) — 專案開發管理（架構原則、agent 使用、決策紀錄、Changelog 同步規則）
- [`docs/DEVELOPMENT.md`](./docs/DEVELOPMENT.md) — Nuxt 4 結構、alias 速查、測試基建、Vercel 部署
- [`docs/DATABASE.md`](./docs/DATABASE.md) — Supabase schema、RLS、Storage 設定
- [`shared/data/changelog.ts`](./shared/data/changelog.ts) — 版本更新紀錄（顯示在 UI 右下角懸浮鈕）

## 計分公式（v2.0）

```
fatCoef     = F_REF / bf0                          // 男 F_REF=28、女 F_REF=33
musCoef     = sm0  / AVG_SMM                       // 同性別第 0 週骨骼肌量平均
weightedFat = max(0, rawFatLoss) × fatCoef
weightedMus = max(0, rawMusGain) × musCoef
fatNorm     = min(100, weightedFat / 25 × 100)     // FAT_CAP = 25
musNorm     = min(100, weightedMus / 8  × 100)     // MUS_CAP = 8
procNorm    = min(100, checks / 252 × 100)         // 84 天 × 3 勾 = 252

總分 = fatNorm × 40% + musNorm × 40% + procNorm × 20%   // 滿分 100
```

詳見 `shared/utils/score.ts` 與 `/rules` 頁面。
