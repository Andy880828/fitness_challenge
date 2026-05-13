# 資料庫設計文件 (Supabase / PostgreSQL)

> 本文件涵蓋「12週減脂增肌挑戰賽」應用的完整資料庫 schema、Row Level Security (RLS) 政策、Storage bucket 設定與部署流程。所有 SQL 可在 Supabase Studio → SQL Editor 直接貼上執行。

---

## 目錄

1. [架構總覽](#架構總覽)
2. [前置作業：建立 Supabase 專案](#前置作業建立-supabase-專案)
3. [Schema 建表 SQL](#schema-建表-sql)
4. [Row Level Security (RLS) 政策](#row-level-security-rls-政策)
5. [Storage Bucket 設定](#storage-bucket-設定)
6. [輔助 RPC / Functions](#輔助-rpc--functions)
7. [Seed Data（測試用）](#seed-data測試用)
8. [Schema 變更流程（Dashboard SQL Editor）](#schema-變更流程dashboard-sql-editor)
9. [型別生成](#型別生成)
10. [Deprecated triggers / 已移除物件](#deprecated-triggers--已移除物件)
11. [安全檢查清單](#安全檢查清單)

---

## 架構總覽

```
auth.users (Supabase 內建 — email/password)
    │
    │  1:1 (user_id FK)
    ▼
public.participants  (個人資料 + 性別 + 起始體重)
    │
    │  1:N (participant_id FK)
    ├──▶ public.measurements   (4 次 InBody 量測, week_index 0..3)
    ├──▶ public.checkins       (每日 workout/diet 勾選)
    └──▶ public.photos         (飲食照片 metadata)

public.challenge_settings (single-row, id=1)
    └── start_date, test_mode 由管理員管理
```

**關鍵設計選擇：**
- `participants.user_id` 為唯一索引（一個 auth user 對應一筆 participant）
- `measurements` 用 `(participant_id, week_index)` 複合主鍵 — 4 個欄位寫死、不可重複
- `checkins` 用 `(participant_id, date)` 複合主鍵 — 每天最多一筆
- `photos` 為一對多（一天可多張），用獨立 UUID 主鍵
- `challenge_settings` 用 `id = 1` check 約束強制只有一列

---

## 前置作業：建立 Supabase 專案

1. 前往 <https://supabase.com> 註冊 / 登入
2. New Project → 命名 `fitness-challenge`、選離您最近的 region（如 `Southeast Asia (Singapore)`）
3. 複製 Project URL 與 API Keys：
   - `Project Settings → API` → `Project URL`、`anon (public)`、`service_role (secret)`
4. 將以上三個值填入專案根目錄的 `.env`（對應 `NUXT_PUBLIC_SUPABASE_URL` / `NUXT_PUBLIC_SUPABASE_ANON_KEY` / `SUPABASE_SERVICE_ROLE_KEY`）

---

## Schema 建表 SQL

> 整段複製貼到 Supabase Studio → SQL Editor → Run。順序很重要，外鍵依賴前一張表。

```sql
-- ============================================================
-- 12週減脂增肌挑戰賽 — 完整 schema
-- ============================================================

-- 為了 gen_random_uuid()
create extension if not exists "pgcrypto";

-- ------------------------------------------------------------
-- 1. participants
-- ------------------------------------------------------------
create table if not exists public.participants (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null unique references auth.users(id) on delete cascade,
  name          text not null check (char_length(name) between 1 and 30),
  gender        char(1) not null check (gender in ('M', 'F')),
  age           int check (age is null or (age between 1 and 120)),
  height        numeric(5, 2) check (height is null or (height between 50 and 250)),
  start_weight  numeric(5, 2) not null check (start_weight between 20 and 300),
  joined_at     timestamptz not null default now()
);

create index if not exists idx_participants_gender on public.participants (gender);
create index if not exists idx_participants_joined_at on public.participants (joined_at desc);

comment on table public.participants is '參賽者基本資料；一筆對應一個 auth.users';
comment on column public.participants.gender is 'M=男 / F=女，分組計分用';

-- ------------------------------------------------------------
-- 2. measurements (4 次 InBody)
-- ------------------------------------------------------------
create table if not exists public.measurements (
  participant_id  uuid    not null references public.participants(id) on delete cascade,
  week_index      smallint not null check (week_index between 0 and 3),
  weight          numeric(5, 2) not null check (weight between 20 and 300),
  fat_pct         numeric(5, 2) not null check (fat_pct between 0 and 100),
  muscle          numeric(5, 2) not null check (muscle between 0 and 200),
  measured_on     date    not null,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  primary key (participant_id, week_index)
);

create index if not exists idx_measurements_participant on public.measurements (participant_id);

comment on column public.measurements.week_index is '0=初始 / 1=第4週 / 2=第8週 / 3=結算';

-- ------------------------------------------------------------
-- 3. checkins (每日勾選)
-- ------------------------------------------------------------
create table if not exists public.checkins (
  participant_id  uuid    not null references public.participants(id) on delete cascade,
  date            date    not null,
  workout         boolean not null default false,
  diet            boolean not null default false,
  updated_at      timestamptz not null default now(),
  primary key (participant_id, date)
);

create index if not exists idx_checkins_date on public.checkins (date);
create index if not exists idx_checkins_participant_date on public.checkins (participant_id, date);

-- ------------------------------------------------------------
-- 4. photos (飲食照片 metadata)
-- ------------------------------------------------------------
create table if not exists public.photos (
  id              uuid primary key default gen_random_uuid(),
  participant_id  uuid not null references public.participants(id) on delete cascade,
  date            date not null,
  storage_path    text not null,        -- 'food-photos/<user_id>/<date>/<uuid>.jpg'
  public_url      text not null,
  size_bytes      int  check (size_bytes is null or size_bytes > 0),
  uploaded_at     timestamptz not null default now()
);

create index if not exists idx_photos_participant_date on public.photos (participant_id, date);
create index if not exists idx_photos_uploaded_at on public.photos (uploaded_at desc);

comment on column public.photos.storage_path is 'Supabase Storage 內部路徑；刪 row 前由應用層呼叫 Storage REST API 同步刪檔（不可用 SQL trigger）';

-- ------------------------------------------------------------
-- 5. challenge_settings (single row)
-- ------------------------------------------------------------
create table if not exists public.challenge_settings (
  id          int primary key check (id = 1),
  start_date  date not null default '2026-05-07',
  test_mode   boolean not null default false,
  updated_at  timestamptz not null default now()
);

insert into public.challenge_settings (id)
values (1)
on conflict (id) do nothing;

-- ------------------------------------------------------------
-- 6. updated_at 自動更新 trigger
-- ------------------------------------------------------------
create or replace function public.tg_set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists set_updated_at on public.measurements;
create trigger set_updated_at
  before update on public.measurements
  for each row execute function public.tg_set_updated_at();

drop trigger if exists set_updated_at on public.checkins;
create trigger set_updated_at
  before update on public.checkins
  for each row execute function public.tg_set_updated_at();

drop trigger if exists set_updated_at on public.challenge_settings;
create trigger set_updated_at
  before update on public.challenge_settings
  for each row execute function public.tg_set_updated_at();

-- ------------------------------------------------------------
-- 7. （已移除）刪除照片 row 時自動刪除 Storage 檔
-- ------------------------------------------------------------
-- 原本有 trigger delete_photo_storage / function tg_delete_photo_storage()
-- 於 AFTER DELETE on public.photos 時 `delete from storage.objects ...`。
-- Supabase 已禁止 SQL 對 storage.objects 做 DELETE（error 42501），trigger 一觸發
-- 就讓整個 DELETE FROM photos rollback。
--
-- 現行做法：應用層 (server/api/{admin/,}photos/[id].delete.ts) 在 DELETE row
-- 之前先呼叫 sb.storage.from(BUCKET).remove([path])，由 Storage REST API 處理。
--
-- 移除 SQL 見 supabase/migrations/20260507130000_drop_photo_storage_trigger.sql。
-- 詳見下方「Deprecated triggers / 已移除物件」章節。
```

---

## Row Level Security (RLS) 政策

> RLS 是 PostgreSQL 行級安全；即便有 anon key，使用者也無法跨人寫入。**所有 public.* 表必須開啟 RLS。**

```sql
-- ============================================================
-- 啟用 RLS
-- ============================================================
alter table public.participants        enable row level security;
alter table public.measurements        enable row level security;
alter table public.checkins            enable row level security;
alter table public.photos              enable row level security;
alter table public.challenge_settings  enable row level security;

-- ============================================================
-- participants: 公開讀（排行榜需要）；本人寫
-- ============================================================
drop policy if exists "participants_public_read" on public.participants;
create policy "participants_public_read"
  on public.participants
  for select
  using (true);

drop policy if exists "participants_self_insert" on public.participants;
create policy "participants_self_insert"
  on public.participants
  for insert
  with check (auth.uid() = user_id);

drop policy if exists "participants_self_update" on public.participants;
create policy "participants_self_update"
  on public.participants
  for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- 不允許 delete（保留歷史）；如需要管理員可透過 service_role bypass

-- ============================================================
-- measurements: 公開讀；本人寫
-- ============================================================
drop policy if exists "measurements_public_read" on public.measurements;
create policy "measurements_public_read"
  on public.measurements
  for select
  using (true);

drop policy if exists "measurements_self_write" on public.measurements;
create policy "measurements_self_write"
  on public.measurements
  for all
  using (
    exists (
      select 1 from public.participants p
      where p.id = measurements.participant_id
        and p.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.participants p
      where p.id = measurements.participant_id
        and p.user_id = auth.uid()
    )
  );

-- ============================================================
-- checkins: 同上
-- ============================================================
drop policy if exists "checkins_public_read" on public.checkins;
create policy "checkins_public_read"
  on public.checkins
  for select
  using (true);

drop policy if exists "checkins_self_write" on public.checkins;
create policy "checkins_self_write"
  on public.checkins
  for all
  using (
    exists (
      select 1 from public.participants p
      where p.id = checkins.participant_id
        and p.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.participants p
      where p.id = checkins.participant_id
        and p.user_id = auth.uid()
    )
  );

-- ============================================================
-- photos: 同上
-- ============================================================
drop policy if exists "photos_public_read" on public.photos;
create policy "photos_public_read"
  on public.photos
  for select
  using (true);

drop policy if exists "photos_self_write" on public.photos;
create policy "photos_self_write"
  on public.photos
  for all
  using (
    exists (
      select 1 from public.participants p
      where p.id = photos.participant_id
        and p.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.participants p
      where p.id = photos.participant_id
        and p.user_id = auth.uid()
    )
  );

-- ============================================================
-- challenge_settings: 公開讀；只有 service_role 可寫
-- ============================================================
drop policy if exists "settings_public_read" on public.challenge_settings;
create policy "settings_public_read"
  on public.challenge_settings
  for select
  using (true);

-- 不建立 insert/update policy → 預設禁止；
-- 必要時用 service_role key 從伺服器端 API 寫入
```

---

## Storage Bucket 設定

### 建立 bucket

於 Supabase Studio → **Storage** → **New bucket**：

| 欄位 | 值 |
|------|-----|
| Name | `food-photos` |
| Public bucket | ✅ 是（依使用者選擇） |
| File size limit | `2 MB`（已壓縮後通常 < 200 KB） |
| Allowed MIME types | `image/jpeg, image/png, image/webp` |

### 或用 SQL 建立

```sql
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'food-photos',
  'food-photos',
  true,
  2 * 1024 * 1024,                     -- 2 MB
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do nothing;
```

### Storage 物件 RLS

```sql
-- 所有人可讀（bucket 為 public，但仍寫 policy 以防未來改 private）
drop policy if exists "storage_public_read" on storage.objects;
create policy "storage_public_read"
  on storage.objects
  for select
  using (bucket_id = 'food-photos');

-- 只有本人可上傳到自己的子資料夾
-- 路徑慣例：food-photos/<auth.uid()>/<date>/<uuid>.jpg
drop policy if exists "storage_self_upload" on storage.objects;
create policy "storage_self_upload"
  on storage.objects
  for insert
  with check (
    bucket_id = 'food-photos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "storage_self_delete" on storage.objects;
create policy "storage_self_delete"
  on storage.objects
  for delete
  using (
    bucket_id = 'food-photos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
```

---

## 輔助 RPC / Functions

### 1. `register_participant` — 註冊時原子性建立 participant + 初始 measurement

```sql
create or replace function public.register_participant(
  p_name         text,
  p_gender       char(1),
  p_age          int,
  p_height       numeric,
  p_start_weight numeric,
  p_start_fat    numeric,
  p_start_muscle numeric
)
returns public.participants
language plpgsql
security invoker      -- 以呼叫者身份執行（吃 RLS）
as $$
declare
  v_settings  public.challenge_settings%rowtype;
  v_new       public.participants%rowtype;
begin
  if auth.uid() is null then
    raise exception 'NOT_AUTHENTICATED';
  end if;

  select * into v_settings from public.challenge_settings where id = 1;

  insert into public.participants (user_id, name, gender, age, height, start_weight)
  values (auth.uid(), p_name, p_gender, p_age, p_height, p_start_weight)
  returning * into v_new;

  insert into public.measurements (participant_id, week_index, weight, fat_pct, muscle, measured_on)
  values (v_new.id, 0, p_start_weight, p_start_fat, p_start_muscle, v_settings.start_date);

  return v_new;
end;
$$;

grant execute on function public.register_participant(text, char, int, numeric, numeric, numeric, numeric) to authenticated;
```

### 2. `leaderboard_view` — 排行榜聚合視圖（避免前端 N+1 查詢）

```sql
create or replace view public.leaderboard_view as
select
  p.id,
  p.user_id,
  p.name,
  p.gender,
  p.start_weight,
  -- 量測資料聚合
  (select count(*) from public.measurements m where m.participant_id = p.id) as measure_count,
  (select fat_pct  from public.measurements m where m.participant_id = p.id and week_index = 0) as start_fat,
  (select muscle   from public.measurements m where m.participant_id = p.id and week_index = 0) as start_muscle,
  -- 打卡統計
  (select count(*) from public.checkins c where c.participant_id = p.id and c.workout) as workout_days,
  (select count(*) from public.checkins c where c.participant_id = p.id and c.diet)    as diet_days,
  -- 照片統計
  (select count(distinct date) from public.photos ph where ph.participant_id = p.id) as photo_days,
  (select count(*) from public.photos ph where ph.participant_id = p.id) as total_photos
from public.participants p;

-- view 繼承底層表的 RLS（無需額外 grant）
```

> 計分邏輯（含安全護欄）放在前端 `utils/score.ts` — 這樣可隨時調整公式不必改 DB。

---

## Seed Data（測試用）

```sql
-- 僅 local supabase / dev 環境用！production 勿執行
do $$
declare
  v_user_id_1 uuid := gen_random_uuid();
  v_user_id_2 uuid := gen_random_uuid();
begin
  insert into auth.users (id, email, encrypted_password, email_confirmed_at)
  values
    (v_user_id_1, 'alex@test.local', crypt('test1234', gen_salt('bf')), now()),
    (v_user_id_2, 'lisa@test.local', crypt('test1234', gen_salt('bf')), now());

  insert into public.participants (user_id, name, gender, age, height, start_weight)
  values
    (v_user_id_1, 'Alex',  'M', 28, 175, 78.5),
    (v_user_id_2, 'Lisa',  'F', 26, 162, 56.0);

  insert into public.measurements (participant_id, week_index, weight, fat_pct, muscle, measured_on)
  select id, 0, start_weight, 22.0, 32.0, '2026-05-07' from public.participants where name = 'Alex'
  union all
  select id, 0, start_weight, 28.0, 22.5, '2026-05-07' from public.participants where name = 'Lisa';
end $$;
```

---

## Schema 變更流程（Dashboard SQL Editor）

> 本專案目前**完全依賴雲端 Supabase Dashboard**，沒有本地 Docker、未連 Supabase CLI。
> 以下是每次 schema 變更的標準流程：

1. **新增 migration `.sql` 檔（純為留檔 / review）**
   路徑：`supabase/migrations/<YYYYMMDDHHMMSS>_<description>.sql`
   timestamp 用 UTC 14 碼整數即可，不需 CLI 產。

2. **複製 SQL → Supabase Dashboard → SQL Editor → Run**
   到對應位置（Tables / Triggers / Policies / Functions）目視確認結果。

3. **若變更包含 schema column 異動 → 更新型別**
   Dashboard 左側 → API Docs → 右上角「TypeScript」→ 複製整段，
   手動覆蓋 `shared/types/database.ts`。

4. **commit `.sql`（必要時連同 `database.ts`）進 PR**
   即使 SQL 是用 Dashboard 套用的，migration 檔仍是「我們對 schema 動過什麼」的單一事實來源；
   將來若啟用 CLI（`db:link` / `db:push`）也能無縫接回。

### CLI / 本地 Docker 模式（目前未啟用）

`package.json` 內 `supabase:start` / `db:reset:local` / `db:push` / `db:link` /
`db:gen-types(:local)` 等 script **保留作為將來選項**，但目前未測試也未使用。
啟用前需安裝 Docker Desktop 並登入 Supabase CLI（`pnpm dlx supabase login` + `pnpm db:link`）。

---

## 型別生成

目前路徑：**Dashboard → API Docs → TypeScript → 手動下載覆蓋 `shared/types/database.ts`**。

CLI 路徑（`pnpm db:gen-types`）目前未啟用，見上方說明。

`shared/types/database.ts` 會被 `@nuxtjs/supabase` 與專案各層 import，提供完整型別檢查。

---

## Deprecated triggers / 已移除物件

| 物件 | 移除日期 | Migration | 原因 |
|------|----------|-----------|------|
| `public.delete_photo_storage()` + trigger `delete_photo_storage` on `public.photos` | 2026-05-07 | `supabase/migrations/20260507130000_drop_photo_storage_trigger.sql` | Supabase 已禁止 SQL 對 `storage.objects` 做 DELETE（error 42501）。Trigger 一觸發即讓整個 `DELETE FROM photos` rollback。應用層 (`server/api/{admin/,}photos/[id].delete.ts`) 已先呼叫 Storage REST API 移除物件，trigger 變成純多餘的破壞者，故移除。 |

> 維護備忘：若未來想在 DB 層補一致性保證，正解是建一張 `pending_storage_deletes` 表 + cron + Edge Function 用 Storage REST 補刪，**不要**再寫直接動 `storage.objects` 的 trigger。

---

## 安全檢查清單

部署前逐項勾選：

- [ ] 所有 `public.*` 表的 RLS 已啟用
- [ ] `service_role` key 僅在 server 端使用，未進入 client bundle
- [ ] `food-photos` bucket 的 path 慣例強制以 `auth.uid()` 為第一段
- [ ] 上傳前端壓縮 800px / JPEG 0.8、後端再驗 size < 2MB
- [ ] `challenge_settings` 無 update policy（防一般使用者改測試模式）
- [ ] `register_participant` 為 `security invoker`，吃 RLS
- [ ] auth.users.email_confirm 已啟用（避免假 email 註冊）
- [ ] 速率限制：Supabase 預設 30 req/sec/IP，dashboard 可調

---

## 變更紀錄

| 日期 | 版本 | 變更 |
|------|------|------|
| 2026-04-28 | v0.1 | 初版 schema：5 張表 + RLS + Storage + 2 RPC |
| 2026-05-13 | v0.2 | 新增 `exercise_proofs` 表（運動打卡證明，kind = 'photo' \| 'note'）+ RLS；migration `20260513000000_add_exercise_proofs.sql` |

---

## v0.2 變更詳情：`exercise_proofs`

運動打卡證明（照片或文字）。一日可多筆。CHECK 約束確保 kind 與欄位 1:1 對應。

```sql
create table if not exists public.exercise_proofs (
  id              uuid primary key default gen_random_uuid(),
  participant_id  uuid not null references public.participants(id) on delete cascade,
  date            date not null,
  kind            text not null check (kind in ('photo', 'note')),
  note            text     check (note is null or char_length(note) between 1 and 500),
  storage_path    text,
  public_url      text,
  size_bytes      int      check (size_bytes is null or size_bytes > 0),
  created_at      timestamptz not null default now(),
  check (
    (kind = 'photo' and storage_path is not null and public_url is not null and note is null)
    or
    (kind = 'note'  and note is not null and storage_path is null and public_url is null)
  )
);
```

RLS：公開讀 + 本人寫（policy 同 `checkins_self_write` 結構）。

Storage：照片走既有 `food-photos` bucket，路徑慣例 `<user_id>/exercise/<date>/<uuid>.jpg`，沿用「第一段資料夾必須是 auth.uid()」的 storage RLS。
