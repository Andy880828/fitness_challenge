# Development Guide — Nuxt 4 + Supabase

## 本地啟動（雲端 Supabase 模式 — 推薦）

```bash
# 1. 安裝依賴
pnpm install

# 2. 在雲端建立 Supabase project
#    https://supabase.com → New Project
#    從 Project Settings → API 抓三把 key

# 3. 複製環境變數並填入
cp .env.example .env
# 必填：
#   NUXT_PUBLIC_SUPABASE_URL          ← Project URL
#   NUXT_PUBLIC_SUPABASE_ANON_KEY     ← anon public key
#   SUPABASE_SERVICE_ROLE_KEY         ← service_role secret（保密！）

# 4. 在 Supabase Dashboard → SQL Editor 套用 docs/DATABASE.md 內 SQL
#    （建表、RLS、Storage bucket 一次完成）

# 5. (選擇性) 連結 CLI 與雲端 project，之後可從 schema 自動產 types
pnpm dlx supabase login              # 一次性、用瀏覽器授權
pnpm db:link                          # 互動模式輸入 project-ref（從 Dashboard URL 取得）
pnpm db:gen-types                     # 對著雲端 schema 產 shared/types/database.ts

# 6. 啟動 Nuxt dev server
pnpm dev   # http://localhost:3000
```

> **取得 project-ref**：Supabase Dashboard URL `https://supabase.com/dashboard/project/<這串就是>` —— 通常是 20 字元的英數字串。

## 本地啟動（本地 Docker 模式 — 選用，整合測試或離線開發時）

需要先安裝 [Docker Desktop](https://www.docker.com/products/docker-desktop/)。

```bash
# 1. 一次性初始化（建立 supabase/ + config.toml）
supabase init

# 2. 啟動本地 Supabase 全套（Postgres + Auth + Storage + Studio）
pnpm supabase:start
# Terminal 會直接印 URL + anon key + service_role key + DB URL

# 3. 把這些值填到 .env（取代雲端值，或建另一份 .env.local）
# 4. 套用 schema
pnpm db:reset:local
# 5. 產 types
pnpm db:gen-types:local
# 6. 啟動
pnpm dev
```

---

## 目錄哲學（Nuxt 4 三層分離）

Nuxt 4 把專案明確分成三個邊界：

```
app/        — Vue / SSR client code（會被 hydrate 到瀏覽器）
shared/     — 純 TypeScript，client 與 server 都可 import
server/     — Nitro server endpoints（只在伺服器執行）
```

### 為何要分 shared/

Nuxt 3 時期的 `utils/` 與 `types/` 混在 root，工具會被 client 與 server 都 bundle，但**沒有編譯期的邊界檢查**。誤把 server-only API（如 `pino` instance）放進 client bundle，要等 runtime 才會炸。

Nuxt 4 用三層 + TypeScript Project References 強制：

- 在 `shared/` 內 import `vue` 或 `#imports` 的 Vue API → **編譯期失敗**
- 在 `shared/` 內 import `pino`、`fs` 等 Node-only 套件 → **編譯期失敗**
- 從 `app/` 內 import `server/` → **編譯期失敗**

換句話說，TypeScript 變成「邊界守衛」，省下大量 runtime 排查時間。

---

## Alias 速查表

| Alias | 解析到 | 用法 | 範例 |
|-------|--------|------|------|
| `~` / `@` | `app/` | client code 內部 | `import X from '~/components/X.vue'` |
| `~~` / `@@` | rootDir | 跨 app 邊界 | 罕用，僅特殊場景 |
| `#shared` | `shared/` | 任何地方引用共用程式碼 | `import { computeScore } from '#shared/utils/score'` |
| `#imports` | Nuxt auto-imports | 顯式取用 auto-imported API | `import { ref, computed } from '#imports'` |
| `#supabase/server` | @nuxtjs/supabase | server endpoint 內 | `import { serverSupabaseUser } from '#supabase/server'` |

### 一張圖看 import 規則

```
┌─────────────────────────────────────────────────────────┐
│                       app/                              │
│  ────────────────────────                               │
│  ✅ '~/components/...'    ← 自己的 components           │
│  ✅ '#shared/types/...'   ← 共用型別                    │
│  ✅ '#shared/utils/score' ← 共用純函式                  │
│  ❌ 不可 import server/                                 │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│                      shared/                            │
│  ────────────────────────                               │
│  ✅ 純 TypeScript / 標準庫                              │
│  ✅ 同一 shared 內的相對 import: './constants'          │
│  ❌ 不可 import 'vue' / Vue API                         │
│  ❌ 不可 import 'pino' / Node-only 套件                 │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│                      server/                            │
│  ────────────────────────                               │
│  ✅ '#shared/types/...'   ← 共用型別                    │
│  ✅ '../utils/logger'     ← 同 server 內相對引用        │
│  ✅ '#supabase/server'    ← @nuxtjs/supabase 提供       │
│  ❌ 不要用 '~/server/...'（~ 已指 app/）                │
└─────────────────────────────────────────────────────────┘
```

---

## Auto-import 行為差異

| 目錄 | Auto-imported by Nuxt? |
|------|------------------------|
| `app/components/**` | ✅ 元件名稱對應 |
| `app/composables/*` | ✅ 函式名稱直接可用 |
| `app/utils/*` | ✅ |
| `shared/types/*` | ❌ 必須顯式 `import from '#shared/types/...'` |
| `shared/utils/*` | ❌ 必須顯式 `import from '#shared/utils/...'` |
| `server/utils/*` | ✅（僅 server 內） |
| `server/api/*` | 不適用（route handler） |

> **常見坑**：從 Nuxt 3 升上來，原本 `utils/score.ts` 因為在 root，會被 auto-import；搬到 `shared/` 後**不再 auto-import**。如果某處看到 `computeScore is not defined`，先檢查有無加 `import { computeScore } from '#shared/utils/score'`。

---

## 測試

```bash
pnpm test:unit          # vitest 單元測試
pnpm test:integration   # 需先 supabase start
pnpm test:e2e           # Playwright (需先 pnpm dev)
pnpm test:coverage      # 覆蓋率報告
```

`vitest.config.ts` 內 `resolve.alias` 與 Nuxt runtime 的 alias 對齊（`~` → `app/`、`#shared` → `shared/`），所以 spec 內可直接 `import from '#shared/utils/score'`。

---

## Type 變化偵測流程

當 supabase schema 變動：

1. 跑 `pnpm db:reset` 套用最新 migrations
2. 跑 `pnpm db:gen-types`（會覆寫 `shared/types/database.ts`）
3. 跑 `pnpm typecheck` —— 任何因型別變動而壞掉的程式碼會在這裡被抓出

---

## 常見問題

### Q：為什麼我加了一個 `shared/utils/foo.ts`，元件用不到？
A：`shared/` 不會 auto-import。在元件內顯式 `import { foo } from '#shared/utils/foo'`。

### Q：為什麼 `server/api/foo.ts` 內 `import from '~/utils/...'` 失敗？
A：在 Nuxt 4 中 `~` 指向 `app/`，server 不能 import client code。改用 `#shared/utils/...`（共用）或相對路徑（同 server 內）。

### Q：`useFetch` data 變成 `null` 而不是 `undefined`？
A：這是 Nuxt 4 行為。改用 `data.value ?? defaultValue` 或 `if (data.value)` 判斷。

### Q：Build 時跳出 "shared/ cannot import vue"？
A：你在 `shared/` 內某檔案 import 了 Vue API（如 `ref`、`computed`）。把該檔案搬到 `app/composables/` 或 `app/utils/`。

### Q：peer dependency 警告？
A：所有依賴都對齊到 Nuxt 4 / vitest 3 系列。若仍出現，跑 `pnpm install --force` 重建 lock，然後檢查是否有第三方套件未跟上。
