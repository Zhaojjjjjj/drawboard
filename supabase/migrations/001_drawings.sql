-- Drawboard v1: drawings + versions + RLS + thumbnails bucket
create extension if not exists pgcrypto;

create table if not exists public.drawings (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  title text not null default '未命名画板',
  scene jsonb not null default '{"elements":[],"appState":{},"files":{}}'::jsonb,
  thumbnail_path text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists drawings_owner_updated_idx on public.drawings(owner_id, updated_at desc);

create table if not exists public.drawing_versions (
  id uuid primary key default gen_random_uuid(),
  drawing_id uuid not null references public.drawings(id) on delete cascade,
  scene jsonb not null,
  created_at timestamptz not null default now()
);
create index if not exists versions_drawing_created_idx on public.drawing_versions(drawing_id, created_at desc);

alter table public.drawings enable row level security;
alter table public.drawing_versions enable row level security;

create policy "own drawings" on public.drawings
  for all using (owner_id = auth.uid()) with check (owner_id = auth.uid());

create policy "own versions" on public.drawing_versions
  for all using (exists (select 1 from public.drawings d where d.id = drawing_id and d.owner_id = auth.uid()))
  with check (exists (select 1 from public.drawings d where d.id = drawing_id and d.owner_id = auth.uid()));

insert into storage.buckets (id, name, public) values ('thumbnails','thumbnails', false)
on conflict (id) do nothing;
