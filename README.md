# 12週減脂增肌挑戰賽 / FORGE

12 週為期、男女分組、即時計分的減脂增肌活動平台。Nuxt 4 + Supabase + Vercel。

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

## 文件

- [`CLAUDE.md`](./CLAUDE.md) — 專案開發管理（架構原則、agent 使用、決策紀錄）
- [`docs/DEVELOPMENT.md`](./docs/DEVELOPMENT.md) — Nuxt 4 結構、alias 速查、常見問題
- [`docs/DATABASE.md`](./docs/DATABASE.md) — Supabase schema、RLS、Storage 設定

## 計分公式

```
總分 = 減脂 × 40% + 增肌 × 40% + 過程 × 20%
```

詳見 `shared/utils/score.ts` 與 `/rules` 頁面。
