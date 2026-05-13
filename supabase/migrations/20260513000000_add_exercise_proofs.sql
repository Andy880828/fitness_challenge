-- ============================================================
-- 運動打卡證明（照片或文字）
-- ============================================================
-- 一日可多筆。kind = 'photo' 走 storage_path + public_url；
-- kind = 'note' 走 note（純文字，1–500 字）。
-- CHECK 約束強制兩種 kind 與欄位 1:1 對應。
-- ============================================================

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

create index if not exists idx_exercise_proofs_participant_date
  on public.exercise_proofs (participant_id, date desc);
create index if not exists idx_exercise_proofs_date
  on public.exercise_proofs (date desc);
create index if not exists idx_exercise_proofs_created_at
  on public.exercise_proofs (created_at desc);

comment on table public.exercise_proofs is '運動打卡證明：照片或文字，作為自由心證制度下的可信度依據；不計入 score。';
comment on column public.exercise_proofs.kind is 'photo = 照片證明；note = 文字證明';

-- ============================================================
-- Row Level Security
-- ============================================================
alter table public.exercise_proofs enable row level security;

drop policy if exists "exercise_proofs_public_read" on public.exercise_proofs;
create policy "exercise_proofs_public_read"
  on public.exercise_proofs
  for select
  using (true);

drop policy if exists "exercise_proofs_self_write" on public.exercise_proofs;
create policy "exercise_proofs_self_write"
  on public.exercise_proofs
  for all
  using (
    exists (
      select 1 from public.participants p
      where p.id = exercise_proofs.participant_id
        and p.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.participants p
      where p.id = exercise_proofs.participant_id
        and p.user_id = auth.uid()
    )
  );
