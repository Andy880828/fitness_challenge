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

## 元件 auto-import：扁平命名

`nuxt.config.ts`：

```ts
components: [{ path: '~/components', pathPrefix: false }]
```

效果：所有 `app/components/**/*.vue` 註冊為扁平名（用檔名，忽略目錄）。

| 檔案路徑 | 註冊名稱 |
|----------|---------|
| `components/auth/LoginForm.vue` | `<LoginForm />` |
| `components/auth/RegisterForm.vue` | `<RegisterForm />` |
| `components/profile/StatCard.vue` | `<StatCard />` |
| `components/checkin/MonthCalendar.vue` | `<MonthCalendar />` |
| `components/layout/AuthMenu.vue` | `<AuthMenu />` |

⚠️ **檔名必須全域唯一**——若新增 `auth/Modal.vue` + `ui/Modal.vue` 同檔名，build 會 error。新增元件前先 `grep -r "ModalName.vue" app/components/` 確認無衝突。

預設 `pathPrefix: true` 會自動加目錄 prefix（`<AuthLoginForm />`）；本專案選擇關閉是因為現有元件都已用獨特檔名，扁平名更簡潔且與 page 端 markup 一致。

---

## auth layout 與 Profile 共用層

### auth.vue layout

`app/layouts/auth.vue` 是「需登入 + 需報名」頁面的共用骨架。它：

1. 內含 `AppHeader` / `AppFooter`（與 default layout 同樣外觀）
2. 透過 `provideParticipantContext()` 抓 `getMine()` 並 provide 給內部頁面
3. 統一渲染「載入中」「尚未報名請先 /register」error UI

頁面套用：

```ts
// app/pages/dashboard.vue / app/pages/checkin.vue
definePageMeta({ middleware: 'auth', layout: 'auth' })

const { participant, loading, error } = useParticipantContext()
```

不在 auth layout 之下呼叫 `useParticipantContext()` 會 throw，提早抓出誤用。

### ProfileView 元件 + useProfileData composable

`dashboard` 與 `profile/[id]` 兩頁原本各自寫一份「並行抓 measure / checkin / photo / 算分」邏輯，重複度 ~70%。現在統一：

- `app/composables/useProfileData.ts` — `load(participant)` 並行抓四種資料 + 算 score
- `app/components/profile/ProfileView.vue` — 顯示三欄佈局；`editable` prop 切換是否顯示 StatCard / 是否可編輯 MeasureBlock

```vue
<!-- dashboard.vue -->
<ProfileView
  :measurements :workout-days :diet-days :photo-days :score
  :editable="true"
  @save-measure="onSaveMeasure"
/>

<!-- profile/[id].vue -->
<ProfileView ... :editable="false" />
```

---

## 測試

```bash
pnpm test:unit          # 單元測試（composables / components / utils）
pnpm test:integration   # API endpoints（mock Supabase，無需 dev server）
pnpm test:e2e           # Playwright (會自動啟 dev server)
pnpm test:coverage      # 覆蓋率報告（threshold 80% lines / functions / statements、75% branches）
```

`vitest.config.ts` 內 `resolve.alias` 與 Nuxt runtime 對齊（`~` → `app/`、`#shared` → `shared/`、`#supabase/server` → `tests/stubs/supabase-server.ts`），spec 內可直接 `import from '#shared/utils/score'`。

### 目錄結構

```
tests/
├── setup.ts                          # 全域 mock：#supabase/server、pino、image-compress
│                                       stub Vue auto-imports（ref/computed/watch/...）
│                                       stub Nitro auto-imports（defineEventHandler/readBody/createError）
│                                       注入 composables 到 globalThis（解決跨 composable 引用）
├── stubs/
│   └── supabase-server.ts            # vitest config 用的 #supabase/server alias 替身
├── fixtures/
│   ├── participants.ts               # maleParticipant / leaderboardRowMale / ...
│   ├── measurements.ts               # measureRow / fullMeasurements
│   └── checkins.ts                   # sampleCheckins / checkinRow
├── unit/
│   ├── helpers/
│   │   └── supabase-mock.ts          # createMockSupabase() — Proxy chain 工廠
│   ├── composables/                  # 9 spec：useAuth / useChallenge / useParticipants /
│   │                                   useCheckins / useMeasures / usePhotos /
│   │                                   useScore / useProfileData
│   ├── components/                   # AuthMenu.spec.ts
│   └── utils/                        # date / score / logger / image-compress
├── integration/
│   └── api/                          # 4 spec：register / photos-post / photos-delete / settings-get
└── e2e/
    ├── helpers/auth.ts               # login() / logout() / testEmail() / hasTestCreds()
    ├── auth-flow.spec.ts             # register → 自動登入 → dashboard → 登出
    ├── login-flow.spec.ts            # 登入錯密碼 / 成功重導 / 未登入踢回
    ├── checkin-flow.spec.ts          # toggle workout/diet 持久化
    ├── header-nav.spec.ts            # 動態導覽列依登入切換
    └── leaderboard-flow.spec.ts      # 訪客可看 / row 點擊跳 profile/[id]
```

### Supabase chain mock

`tests/unit/helpers/supabase-mock.ts` 用 Proxy 攔截 chain method（`.from().select().eq().single()` 等）：

```ts
// 簡單情境：所有 query 都回同一 response
const sb = createMockSupabase({ data: rows, error: null })

// 複雜情境：依 table / ops 動態回應
const sb = createMockSupabase(({ table, ops }) => {
  if (table === 'participants') return { data: pRow, error: null }
  if (table === 'photos' && ops.includes('insert')) return { data: photoRow, error: null }
  return { data: null, error: null }
})

vi.stubGlobal('useSupabaseClient', () => sb)
```

避免每個 spec 各自手寫 5 層 mock chain。

### Cross-composable auto-import

Nuxt runtime 自動 import composables；vitest 不會。`tests/setup.ts` 透過 `vi.stubGlobal` 把所有 composables 注入 globalThis，讓 `useScore()` 內部呼叫 `useChallenge()` 在測試環境照常運作。

> 副作用：在 spec 內 `vi.unstubAllGlobals()` 會把 setup.ts 注入的 stubs 一併清掉，導致 `ref is not defined`。需要重置時改用 `vi.clearAllMocks()`（已在 `afterEach` 自動跑）。

### Server endpoint 整合測試

server endpoints 的 default export 是 `defineEventHandler(...)` 包裝。setup.ts 把它 stub 成 identity function，所以可直接呼叫：

```ts
import handler from '~~/server/api/settings/index.get'
const result = await handler(mockEvent)
```

不必啟動 Nitro 環境。Supabase service role 透過 mock `useSupabaseServer`（`vi.mock('~~/server/utils/supabase-server')`）注入 `createMockSupabase` instance。

### E2E 環境變數

`tests/e2e/helpers/auth.ts` 從 env 讀測試帳號：

| 變數 | 用途 | 沒設的後果 |
|------|------|-----------|
| `NUXT_PUBLIC_TEST_EMAIL` / `E2E_TEST_EMAIL` | 登入測試帳號 | 需登入的 spec 自動 skip |
| `NUXT_PUBLIC_TEST_PASSWORD` / `E2E_TEST_PASSWORD` | 對應密碼 | 同上 |
| `E2E_ALLOW_REGISTER` | 啟用註冊測試 | `auth-flow` spec skip（避免污染真實 DB） |

⚠️ 註冊測試會建立**真實** Supabase 使用者；建議連到測試 project 而非 prod。建議建第二個 Supabase free tier project 當測試環境。

---

## 部署到 Vercel

### 一次性設定

1. **Vercel CLI 連結**：

   ```bash
   pnpm dlx vercel login
   pnpm dlx vercel link
   ```

2. **環境變數**（Dashboard → Settings → Environment Variables，每個都勾 Production / Preview / Development）：

   | 變數 | 用途 | Sensitive |
   |------|------|-----------|
   | `NUXT_PUBLIC_SUPABASE_URL` | Supabase project URL（前端可見） | 否 |
   | `NUXT_PUBLIC_SUPABASE_ANON_KEY` | anon public key（前端可見） | 否 |
   | `SUPABASE_SERVICE_ROLE_KEY` | service_role key（**僅 server**） | **是** |
   | `CRON_SECRET` | Vercel Cron 觸發 ping 用的共享密鑰 | **是** |
   | `NUXT_PUBLIC_CHALLENGE_START_DATE` | 例 `2026-05-07` | 否 |
   | `NUXT_LOG_LEVEL` | production 建議 `info` | 否 |

   產生 `CRON_SECRET` 隨機值：

   ```bash
   openssl rand -hex 32
   # 或在 PowerShell：
   # [Convert]::ToHexString((1..32 | ForEach-Object { Get-Random -Max 256 }))
   ```

3. **部署**：

   ```bash
   pnpm dlx vercel --prod
   # 或推 main 分支讓 Vercel 自動觸發
   ```

### vercel.json 結構

```json
{
  "framework": "nuxtjs",
  "buildCommand": "pnpm build",
  "installCommand": "pnpm install --frozen-lockfile",
  "crons": [
    { "path": "/api/cron/ping", "schedule": "0 3 * * 1,4" }
  ],
  "headers": [
    { "source": "/(.*)", "headers": [
        { "key": "X-Content-Type-Options", "value": "nosniff" },
        { "key": "X-Frame-Options", "value": "SAMEORIGIN" },
        { "key": "Referrer-Policy", "value": "strict-origin-when-cross-origin" },
        { "key": "Permissions-Policy", "value": "camera=(self), microphone=(), geolocation=()" }
    ] },
    { "source": "/api/(.*)", "headers": [
        { "key": "Cache-Control", "value": "no-store" }
    ] }
  ]
}
```

- `framework: nuxtjs` 讓 Vercel 自動套 nitro vercel preset；不需在 nuxt.config 額外指定
- `installCommand` 加 `--frozen-lockfile` 確保 production build 用 lockfile 鎖定版本，避免 dep drift
- security headers 套全站（含靜態資源）；`/api/*` 多加 `Cache-Control: no-store` 避免 CDN 快取 API 回應

### 防 Supabase 自動休眠

Supabase free tier 連續 **7 天** 無 API 呼叫 / auth event / DB query 會把 project pause；恢復需手動點 Dashboard「Restore」（約 1 分鐘）。

**解法**：Vercel Cron 定期戳 `/api/cron/ping`，做一次極小 SELECT 重置 inactivity 計時器。

| 配置點 | 內容 |
|--------|------|
| 端點 | `server/api/cron/ping.get.ts` |
| Schedule | `0 3 * * 1,4`（每週一、四 UTC 03:00） |
| 最大間隔 | 4 天（週四 → 隔週一），離 7 天門檻 3 天緩衝 |
| 授權 | `Authorization: Bearer ${CRON_SECRET}` header；Vercel Cron 自動帶 |
| Cost | 每次 ~50ms / `SELECT id FROM challenge_settings WHERE id=1` |

**為什麼不用 pg_cron / Supabase Edge Function**：project 被 pause 後，pg_cron 與 Edge Function 也停止運行——形成反向死鎖。**必須由外部觸發**才有意義。

**為什麼不用 GitHub Actions**：可以，但本專案已部署到 Vercel；用 Vercel Cron 設定就在同一份 vercel.json，無需另開 workflow repo。

### 部署前 checklist

```bash
pnpm typecheck                # 0 TS 錯
pnpm test:unit                # 全綠
pnpm test:integration         # 全綠
pnpm build                    # 本地驗證 nitro vercel preset 能 bundle
```

Dashboard / config 確認：
- [ ] Supabase Dashboard：schema + RLS policies + storage bucket（`food-photos`）已套
- [ ] Vercel Dashboard：6 個 env vars 都設好（特別注意 `CRON_SECRET` 與 `SUPABASE_SERVICE_ROLE_KEY` 標記為 Sensitive）
- [ ] `vercel.json` 與最新程式碼一起 commit
- [ ] 第一次 deploy 後到 Functions 分頁確認 `/api/cron/ping` 被列出且 schedule 生效

### 部署後驗證

```bash
# 手動觸發一次 ping（需 CRON_SECRET）：
curl -H "Authorization: Bearer $CRON_SECRET" https://your-app.vercel.app/api/cron/ping
# 期待回應：{"ok":true,"elapsed":50,"at":"..."}

# 沒帶 token 應該 401：
curl -i https://your-app.vercel.app/api/cron/ping
# HTTP/2 401
```

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

### Q：頁面寫了 `<LoginForm />` 但 render 出 0×0 空元素 + `[Vue warn]: Failed to resolve component`？
A：檢查 `nuxt.config.ts` 是否有 `components: [{ path: '~/components', pathPrefix: false }]`。沒有的話 Nuxt 會把 `auth/LoginForm.vue` 註冊成 `<AuthLoginForm />`。修完設定要**重啟 dev server**（Ctrl+C → `pnpm dev`）才生效。

### Q：`useParticipantContext()` throws「必須在 auth layout 之下使用」？
A：頁面忘了在 `definePageMeta` 加 `layout: 'auth'`。或者你想在公開頁面（leaderboard 等）讀 participant——那邊應該用 `useParticipants().getMine()` 直接抓，而不是走 layout 注入。

### Q：跑 unit test 出現 `ref is not defined` / `useChallenge is not defined`？
A：spec 裡呼叫了 `vi.unstubAllGlobals()`——這會把 `tests/setup.ts` 注入的 Vue/composable stubs 一起清掉。改用 `vi.clearAllMocks()`（清 mock 行為但保留 stub 函式本身）。

### Q：E2E 測試一啟動就全 skip？
A：沒設 `NUXT_PUBLIC_TEST_EMAIL` / `NUXT_PUBLIC_TEST_PASSWORD` 時 helper 自動 skip。在 `.env` 加好且該帳號存在於 Supabase 後重跑。註冊流程要額外加 `E2E_ALLOW_REGISTER=1` 才會跑。

### Q：密碼存在哪？我要建 password 欄位嗎？
A：**不需要**。Supabase Auth 內建 `auth.users` 表（在 `auth` schema，public schema 看不到），密碼以 bcrypt hash 儲存。你的 `participants` 表只存 `user_id`（FK 指向 `auth.users.id`）+ profile 資料。Dashboard 左側「Authentication → Users」可看註冊過的帳號。
