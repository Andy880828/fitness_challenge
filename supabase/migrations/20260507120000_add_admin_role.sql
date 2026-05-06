-- ============================================================
-- 加入管理員角色 + 打卡審核 + 操作稽核
-- ============================================================

-- 1. participants.is_admin
alter table public.participants
  add column if not exists is_admin boolean not null default false;

create index if not exists idx_participants_is_admin
  on public.participants (is_admin)
  where is_admin = true;

-- 2. checkins 審核欄位
alter table public.checkins
  add column if not exists reviewed_at timestamptz,
  add column if not exists reviewer_id uuid references auth.users(id);

-- 3. admin_audit_log
create table if not exists public.admin_audit_log (
  id              uuid primary key default gen_random_uuid(),
  actor_user_id   uuid not null references auth.users(id),
  action          text not null,
  target_table    text not null,
  target_id       text not null,
  before          jsonb,
  after           jsonb,
  metadata        jsonb,
  created_at      timestamptz not null default now()
);

create index if not exists idx_audit_actor
  on public.admin_audit_log (actor_user_id, created_at desc);
create index if not exists idx_audit_target
  on public.admin_audit_log (target_table, target_id);

alter table public.admin_audit_log enable row level security;

-- 4. 防越權：trigger 阻擋非 service_role 把自己 is_admin 改 true
create or replace function public.tg_block_is_admin_self_promotion()
returns trigger
language plpgsql
security definer
as $$
begin
  -- service_role bypass RLS 時 auth.uid() 為 NULL；其餘情境 (anon/authenticated) 都禁止改 is_admin
  if new.is_admin is distinct from old.is_admin and auth.uid() is not null then
    raise exception 'NOT_ALLOWED: cannot modify is_admin';
  end if;
  return new;
end;
$$;

drop trigger if exists block_is_admin_self_promotion on public.participants;
create trigger block_is_admin_self_promotion
  before update on public.participants
  for each row execute function public.tg_block_is_admin_self_promotion();

-- 5. RLS — admin 可改任何人 checkin / 刪任何照片
drop policy if exists "checkins_admin_update" on public.checkins;
create policy "checkins_admin_update"
  on public.checkins
  for update
  using (
    exists (
      select 1 from public.participants p
      where p.user_id = auth.uid() and p.is_admin = true
    )
  )
  with check (
    exists (
      select 1 from public.participants p
      where p.user_id = auth.uid() and p.is_admin = true
    )
  );

drop policy if exists "photos_admin_delete" on public.photos;
create policy "photos_admin_delete"
  on public.photos
  for delete
  using (
    exists (
      select 1 from public.participants p
      where p.user_id = auth.uid() and p.is_admin = true
    )
  );

-- 6. RLS — admin_audit_log 僅 admin 可讀寫
drop policy if exists "audit_admin_insert" on public.admin_audit_log;
create policy "audit_admin_insert"
  on public.admin_audit_log
  for insert
  with check (
    exists (
      select 1 from public.participants p
      where p.user_id = auth.uid() and p.is_admin = true
    )
  );

drop policy if exists "audit_admin_select" on public.admin_audit_log;
create policy "audit_admin_select"
  on public.admin_audit_log
  for select
  using (
    exists (
      select 1 from public.participants p
      where p.user_id = auth.uid() and p.is_admin = true
    )
  );

comment on table public.admin_audit_log is 'admin 後台操作稽核軌跡；以 service_role 寫入';
comment on column public.checkins.reviewed_at is 'admin 審核完成時間，null=未審核';
comment on column public.checkins.reviewer_id is '審核人 auth.users.id';
