# CLAUDE.md — 專案開發管理

> 此檔由 Claude Code 在每次對話開頭自動載入，作為跨 session 的專案記憶。

---

## 專案總覽

**名稱**：12週減脂增肌挑戰賽 / FORGE
**目的**：12 週為期、男女分組、即時計分的減脂增肌活動平台
**現狀**：原 `fitness-challenge.html` (React + localStorage 雛形) 已重構為 **Nuxt 4** + Supabase 全端應用

### 技術棧

| 層 | 技術 |
|----|------|
| 框架 | **Nuxt 4** (Vue 3 Composition API) |
| 語言 | TypeScript (strict mode) |
| 樣式 | TailwindCSS + 原 HTML CSS variables |
| 資料 | Supabase (PostgreSQL + Auth + Storage) |
| 部署 | Vercel (前端 SSR + Nitro server) |
| 套件管理 | pnpm |
| 測試 | Vitest 3 (unit + integration) + Playwright (E2E) |
| Logger | pino + pino-roll (30 天輪替) |

---

## 開發指令

```bash
# 安裝依賴
pnpm install

# === 雲端 Supabase 模式（預設）===
# 一次性：登入 + 連結雲端 project（從 Dashboard URL 取 project-ref）
pnpm dlx supabase login
pnpm db:link

# 從雲端 schema 生成 TypeScript 型別（寫到 shared/types/database.ts）
pnpm db:gen-types

# Schema 變更：在 supabase/migrations/ 新增 .sql 後 push 到雲端
pnpm db:push

# === 本地 Docker 模式（選用，整合測試 / 離線開發）===
pnpm supabase:start              # 啟動本地 Postgres + Auth + Storage
pnpm db:reset:local              # 套用 migrations 到本地 DB
pnpm db:gen-types:local          # 從本地 schema 產 types

# === 通用 ===
pnpm dev                          # http://localhost:3000

pnpm test:unit                    # vitest 單元測試
pnpm test:integration             # API 整合測試
pnpm test:e2e                     # Playwright E2E
pnpm test:coverage                # 覆蓋率報告（目標 80%+）

pnpm build
pnpm typecheck
pnpm lint:fix
```

---

## Nuxt 4 三層目錄哲學

```
fitness_challenge/
├── app/        # ★ srcDir — client / SSR app code（Vue / Composition API）
├── shared/     # ★ 純 TS，client + server 共用，禁用 Vue / Nitro
├── server/     # Nitro server endpoints + utils（rootDir 下）
├── tests/      # Vitest + Playwright
├── docs/       # 設計與部署文件
└── public/
```

### Alias 速查

| Alias | 解析到 | 用法 |
|-------|--------|------|
| `~` / `@` | `app/`（srcDir） | client code 內部互引：`~/components/...`、`~/composables/...` |
| `~~` / `@@` | rootDir | 跨 app 邊界（少用） |
| `#shared` | `shared/` | 任何地方引用共用程式碼：`#shared/types/...`、`#shared/utils/...` |
| `#imports` | Nuxt auto-import | 不變 |

### 邊界規則（重要）

1. **`shared/` 內不可** import Vue (`vue`、`#imports` 內的 Vue API) 或 Nitro 程式碼。
   違反會破壞 client/server 共用，build 會在某個 boundary 噴錯。
2. **`shared/` 內檔案不會 auto-import**——必須**顯式** `import { ... } from '#shared/...'`。
   只有 `app/composables/`、`app/utils/`、`app/components/` 才會被 Nuxt auto-import。
3. **`server/utils/*` 在 server 內會 auto-import**（Nitro 行為），但跨檔顯式引用時請用相對路徑（`../utils/logger`），不要用 `~/server/...`，因為 `~` 在 Nuxt 4 已指向 `app/`。

---

## 架構原則

### 1. Composition API + Composables 集中業務邏輯

**規則**：頁面與元件 (`app/pages/*`, `app/components/*`) 只做「呈現」與「使用者互動處理」；所有業務邏輯（計分、API 呼叫、狀態管理）放在 `app/composables/use*.ts`。

```vue
<!-- ❌ 不要在元件內直接呼叫 supabase -->
<script setup>
const supabase = useSupabaseClient()
const { data } = await supabase.from('participants').select()
</script>

<!-- ✅ 透過 composable -->
<script setup>
const { participants, refresh } = await useParticipants()
</script>
```

### 2. 不可變資料模式 (Immutability)

絕不直接 mutate `state.value`，永遠回傳新物件：

```ts
// ❌ store.checkins[userId][date] = ...
// ✅ const updated = { ...store.checkins, [userId]: { ...store.checkins[userId], [date]: newValue } }
```

### 3. 檔案大小規範

- 元件 / 模組：**< 400 行**為佳，**< 800 行**為硬上限
- 函式：**< 50 行**
- 巢狀層級：**≤ 4 層**

### 4. 錯誤處理

- API 邊界（`server/api/*`）使用 `createError({ statusCode, statusMessage })` 並 logger 紀錄
- Composable 內捕捉錯誤後回傳 `{ data, error }` 結構
- 不可吞錯（empty catch block）

### 5. 型別安全

- `tsconfig.json` 已開 strict + noUnusedLocals/Parameters
- 所有 API 回應、composable 回傳必須有明確 TS 介面
- 從 `shared/types/database.ts` 引用 supabase 生成型別

### 6. auth layout 與 Profile 共用層

- `app/layouts/auth.vue` — 「需登入 + 需報名」頁面（dashboard / checkin）共用骨架
  - 內含 AppHeader / AppFooter
  - 透過 `provideParticipantContext()` 提供 participant ref 給內部頁面
  - 統一渲染「載入中」「尚未報名請先 /register」error UI
- `app/composables/useParticipantContext.ts` — provide/inject pair
  - layout 端 `provideParticipantContext()`；page 端 `useParticipantContext()`
  - 不在 auth layout 內呼叫會 throw（防止誤用）
- `app/components/profile/ProfileView.vue` — dashboard 與 profile/[id] 共用
  - props：`measurements / counts / score / editable`
  - `editable=true` 時顯示三張 StatCard + 可編輯 MeasureBlock
- `app/composables/useProfileData.ts` — 並行抓 measure / checkin / photo + 算 score

頁面套用方式：

```ts
// dashboard.vue / checkin.vue
definePageMeta({ middleware: 'auth', layout: 'auth' })

const { participant } = useParticipantContext()  // 由 auth layout 提供
```

### 7. Header AuthMenu 與動態導覽

- `app/components/layout/AuthMenu.vue` — 右側登入/登出/使用者 email 顯示
- `AppHeader.vue` 的 `navItems` 為 computed：
  - 未登入 → 排行榜、規則
  - 已登入 → 排行榜、每日打卡、我的儀表板、規則
- 元件內部讀同一個 `useAuth().isAuthenticated` ref，登入/登出後 UI 自動切換無需重整。

### 8. 元件命名慣例

`nuxt.config.ts` 設 `components: [{ path: '~/components', pathPrefix: false }]`，
所有 `app/components/**` 採**扁平命名**，不依目錄加 prefix。

| 檔案路徑 | 註冊名稱 |
|----------|---------|
| `components/auth/LoginForm.vue` | `<LoginForm />`（**不是** `<AuthLoginForm />`） |
| `components/profile/StatCard.vue` | `<StatCard />` |

⚠️ 檔名必須**全域唯一**——若新增 `auth/Modal.vue` + `ui/Modal.vue` 同檔名，build 會 error。
新增元件前先 `grep` 一下檔名是否衝突。

---

## 資料庫變更流程（雲端 Supabase）

**所有 schema 變更必須透過 migration**，不可在 Supabase Studio UI 直接改後忘了同步——
否則本地產出的 types 會與雲端真實 schema drift。

### 初次 setup（每位開發者一次）

```bash
pnpm dlx supabase login          # 用瀏覽器授權 CLI
pnpm db:link                     # 互動模式輸入 Dashboard 上的 project-ref
```

### 一般變更流程

```bash
# 1. 建立新 migration
supabase migration new <description>

# 2. 編輯 supabase/migrations/<timestamp>_<description>.sql

# 3.（選用）若有 Docker，本地先測 — 沒有就跳過
pnpm supabase:start
pnpm db:reset:local

# 4. Push 到雲端
pnpm db:push

# 5. 從雲端最新 schema 產 types
pnpm db:gen-types
```

**緊急 hotfix（不走 migration，直接在 Dashboard SQL Editor 改）**——
事後**務必**補一個 migration 對應該變更，並在下個 PR 把 `pnpm db:gen-types` 結果一併 commit，
否則別人 reset 時會缺那條變更。

完整 schema 與 RLS 政策見 [docs/DATABASE.md](./docs/DATABASE.md)。

---

## Logging 規範

**Server (Nitro endpoints)**：
```ts
// server/utils/logger 在 server 內會 auto-import；跨檔顯式引用時走相對路徑
import { logger } from '../utils/logger'

export default defineEventHandler(async (event) => {
  logger.info({ userId, action: 'checkin' }, '使用者打卡')
  // ...
})
```

**Client (composables / components)**：
```ts
const { $log } = useNuxtApp()
$log.warn({ component: 'PhotoGrid' }, '圖片壓縮失敗，使用原圖')
```

**等級指引**：
- `error` — 錯誤導致請求失敗或資料遺失
- `warn` — 不致命但需注意（fallback、降級）
- `info` — 正常業務事件（登入、打卡、量測）
- `debug` — 開發用，production 預設不輸出

**輪替**：
- 本地：`logs/app-YYYY-MM-DD.log` 每日輪替，保留 30 天
- Vercel：直接寫 stdout，由平台收集

---

## Coding Rules 摘要

完整規則見 `~/.claude/rules/`，本專案重點：

### TDD 工作流
1. 先寫測試（RED）
2. 實作至測試通過（GREEN）
3. 重構（IMPROVE）
4. 覆蓋率 ≥ 80%

### 安全
- 永不 commit `.env` / API keys
- 所有使用者輸入經 schema 驗證
- 開啟 RLS、最小權限原則
- 上傳檔案：前端壓縮 + 後端 size/MIME 驗證

### Git
- Conventional commits: `feat:`, `fix:`, `refactor:`, `docs:`, `test:`, `chore:`
- 安全敏感變更前必跑 security-reviewer agent

---

## Agent 使用建議

| 情境 | 使用 Agent |
|------|-----------|
| 新功能規劃 | `planner` |
| 撰寫 / 修改 程式碼後 | `code-reviewer` |
| 認證 / Storage / RLS 相關 | `security-reviewer` |
| 新功能 / Bug 修復 | `tdd-guide`（先寫測試） |
| Build 失敗 | `build-error-resolver` |
| 關鍵流程驗證 | `e2e-runner` |
| 複雜架構決策 | `architect` |

並行使用範例：建立新 API endpoint 後，同時並行：
- `code-reviewer` 檢查程式品質
- `security-reviewer` 檢查 RLS / 輸入驗證

---

## 專案結構（Nuxt 4）

```
fitness_challenge/
├── app/                          # srcDir
│   ├── app.vue
│   ├── layouts/
│   │   ├── default.vue           # 公開頁面（leaderboard / login / register / rules）
│   │   └── auth.vue              # 需登入 + 需報名頁面（dashboard / checkin）
│   ├── pages/                    # 路由（file-based）
│   │   ├── index.vue
│   │   ├── leaderboard.vue
│   │   ├── register.vue
│   │   ├── login.vue
│   │   ├── checkin.vue           # uses layout: 'auth'
│   │   ├── dashboard.vue         # uses layout: 'auth'
│   │   ├── rules.vue
│   │   └── profile/[id].vue
│   ├── components/               # 按 feature 分子目錄；扁平註冊（pathPrefix: false）
│   │   ├── auth/                 # LoginForm, RegisterForm
│   │   ├── checkin/              # MonthCalendar, CheckinTile, PhotoUploadButton, PhotoGrid
│   │   ├── layout/               # AppHeader, AppFooter, AuthMenu
│   │   ├── leaderboard/          # LeaderboardTabs, LeaderboardTable, LeaderboardRow
│   │   ├── profile/              # ProfileView (★ dashboard 與 profile/[id] 共用),
│   │   │                           StatCard, MeasureBlock, ScoreBreakdown, Sparkline
│   │   └── ui/                   # Badge, ProgressBar, PulseDot, Toggle, Lightbox
│   ├── composables/              # 業務邏輯 hooks（auto-import）
│   │   ├── useAuth.ts  useChallenge.ts  useParticipants.ts
│   │   ├── useCheckins.ts  useMeasures.ts  usePhotos.ts  useScore.ts
│   │   ├── useParticipantContext.ts   # ★ auth layout 注入點
│   │   └── useProfileData.ts          # ★ dashboard / profile 共用資料抓取
│   ├── middleware/auth.ts        # 路由守衛
│   ├── plugins/                  # Nuxt plugins
│   ├── assets/styles/            # tokens.css + main.css
│   └── utils/                    # client-only utils（auto-import）
│       └── image-compress.ts     # ★ Canvas API（瀏覽器專用）
│
├── shared/                       # client + server 共用（純 TS）
│   ├── types/
│   │   ├── database.ts           # supabase gen 型別
│   │   ├── participant.ts  measure.ts  checkin.ts
│   │   ├── photo.ts  score.ts  settings.ts
│   └── utils/
│       ├── constants.ts          # TOTAL_DAYS, MEASURE_WEEKS, FAT_CAP...
│       ├── date.ts               # todayStr / addDays / dayDiff / ...
│       ├── score.ts              # computeScore（計分公式 source of truth）
│       └── logger.ts             # client logger + 環境偵測 entry
│
├── server/                       # Nitro server
│   ├── api/
│   │   ├── participants/register.post.ts
│   │   ├── photos/{index.post,[id].delete}.ts
│   │   └── settings/index.get.ts
│   ├── utils/
│   │   ├── logger.ts             # pino + pino-roll
│   │   └── supabase-server.ts    # service role client
│   └── middleware/log-requests.ts
│
├── tests/
│   ├── setup.ts                  # 全域 mock：#supabase/server, pino, image-compress;
│   │                               stub Vue / Nitro auto-imports
│   ├── stubs/supabase-server.ts  # #supabase/server alias 替身
│   ├── fixtures/                 # participants / measurements / checkins
│   ├── unit/
│   │   ├── helpers/supabase-mock.ts   # createMockSupabase Proxy 工廠
│   │   ├── composables/          # 9 spec：useAuth/useChallenge/.../useProfileData
│   │   ├── components/           # AuthMenu.spec.ts
│   │   └── utils/                # date / score / logger / image-compress
│   ├── integration/api/          # 4 spec：register / photos-post / photos-delete / settings-get
│   └── e2e/
│       ├── helpers/auth.ts       # login() / hasTestCreds() / testEmail()
│       └── 5 spec：auth-flow / login-flow / checkin-flow / leaderboard-flow / header-nav
│
├── docs/                         # 設計文件
│   ├── DATABASE.md  DEVELOPMENT.md
│
├── logs/                         # pino-roll 輸出（gitignore）
├── public/
├── nuxt.config.ts  tsconfig.json  vitest.config.ts
├── tailwind.config.ts  playwright.config.ts
├── package.json  CLAUDE.md  README.md
└── fitness-challenge.html        # 原始 React 雛形（保留為視覺參考）
```

---

## 部署 (Vercel)

### 前置設定（一次性）

1. `vercel link` 連結專案到 Vercel project（Hobby 即可）
2. Vercel Dashboard → Settings → Environment Variables 設定（**每個都要選 Production / Preview / Development 三個 scope**）：

| 變數 | 值 | Sensitive? |
|------|-----|------------|
| `NUXT_PUBLIC_SUPABASE_URL` | Supabase project URL | 否 |
| `NUXT_PUBLIC_SUPABASE_ANON_KEY` | anon public key | 否 |
| `SUPABASE_SERVICE_ROLE_KEY` | service_role key | **是** |
| `CRON_SECRET` | 自產隨機字串（如 `openssl rand -hex 32`） | **是** |
| `NUXT_PUBLIC_CHALLENGE_START_DATE` | `2026-05-07` 或實際開賽日 | 否 |
| `NUXT_LOG_LEVEL` | `info`（production 建議） | 否 |

3. 部署：`vercel --prod` 或 push 到 main 自動觸發

### 防 Supabase 自動休眠

Free tier 連續 7 天無流量 project 會 pause。`vercel.json` 已設 cron 每週一/週四 03:00 UTC 戳 `/api/cron/ping`，跑一次 `SELECT id FROM challenge_settings WHERE id=1`，重置 inactivity 計時器。

- Cron 由 Vercel 自動帶 `Authorization: Bearer ${CRON_SECRET}` 觸發；endpoint 驗證 token，未授權回 401
- 端點：`server/api/cron/ping.get.ts`
- Schedule 最大間隔 4 天（週四 → 隔週一），離 7 天 pause 門檻有 3 天緩衝
- 監看：Vercel Dashboard → Deployments → Functions → `/api/cron/ping` 的 invocation log

### 部署前 checklist

- [ ] `pnpm typecheck` exit 0
- [ ] `pnpm test:unit && pnpm test:integration` 全綠
- [ ] `pnpm build` 本地成功（驗證 Nuxt 4 + nitro vercel preset）
- [ ] 所有 env vars 在 Vercel Dashboard 設好（含 `CRON_SECRET`）
- [ ] Supabase Dashboard 已套用 `docs/DATABASE.md` 的 schema + RLS + Storage bucket
- [ ] `vercel.json` cron schedule 與 token 驗證已 commit

---

## 已知決策紀錄

| 決策 | 採用方案 | 替代方案 | 原因 |
|------|---------|---------|------|
| 框架 | **Nuxt 4** | Nuxt 3 + compatibilityVersion | 正式版避免 peer dep 漂移；獲得三層目錄分隔 |
| Auth | Supabase Email + Password | PIN, Magic Link | 安全性最佳、實作最直接 |
| 照片 Bucket | 公開 | 私有 + Signed URL | 排行榜需 SEO 友善 + 簡化 API |
| 即時更新 | Polling / 手動 refresh | Realtime WebSocket | 12 週活動規模不需要 |
| Logger | pino + pino-roll | winston, console | 效能最佳、serverless 友善 |
| 計分公式 | shared/utils/score.ts | DB function | 可隨時調整、不需 migration；client + server 共用 |
| 元件 auto-import | `pathPrefix: false` 扁平命名 | 預設目錄 prefix（`AuthLoginForm`） | 小專案檔名已唯一；扁平名閱讀更直覺 |
| auth layout | provide/inject 共用 participant | 各頁自抓 | 消除 dashboard / checkin 的重複載入邏輯與 error UI |
| Profile 共用 | ProfileView + useProfileData | dashboard 與 profile/[id] 各自寫一份 | 兩頁原本 70% 重複；抽出後修一處兩頁同步 |
| 防 Supabase pause | Vercel Cron 戳 `/api/cron/ping`（週一/四） | GitHub Actions / Supabase pg_cron / 真實流量 | 與部署平台同管道、無需額外 repo；pg_cron 在 pause 後自己也停（反向死鎖） |

---

## 未來工作（非本次範圍）

- [ ] 管理員後台（編輯 startDate、開關 testMode、管理參賽者）
- [ ] 推播通知（量測日提醒）
- [ ] 個人匯出 PDF 戰績報告
- [ ] 社群留言 / 互相加油
- [ ] iOS / Android PWA
- [ ] 補上 supabase/migrations/*.sql（目前 schema 在 docs/DATABASE.md）
- [x] ~~integration / e2e 測試補齊~~（unit 72 / integration 19 已完成；E2E 5 spec 待 Supabase 測試 project 啟用）
