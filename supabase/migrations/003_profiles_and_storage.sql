-- Drawboard 003: user profiles + avatars bucket + ALL storage policies.
-- Self-contained: running this one file is enough (it supersedes 002).
-- Safe to re-run: every policy is dropped-if-exists before being created.

-- ---------- profiles ----------
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null default '',
  avatar_path text,
  updated_at timestamptz not null default now()
);
alter table public.profiles enable row level security;

drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own" on public.profiles
  for select using (auth.uid() = id);
drop policy if exists "profiles_insert_own" on public.profiles;
create policy "profiles_insert_own" on public.profiles
  for insert with check (auth.uid() = id);
drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own" on public.profiles
  for update using (auth.uid() = id) with check (auth.uid() = id);

-- ---------- buckets ----------
insert into storage.buckets (id, name, public) values ('avatars', 'avatars', true)
  on conflict (id) do nothing;

-- ---------- thumbnails policies (owner folder: <uid>/<drawing>.png) ----------
drop policy if exists "thumbnails_read_own" on storage.objects;
create policy "thumbnails_read_own" on storage.objects
  for select using (bucket_id = 'thumbnails' and (storage.foldername(name))[1] = auth.uid()::text);
drop policy if exists "thumbnails_insert_own" on storage.objects;
create policy "thumbnails_insert_own" on storage.objects
  for insert with check (bucket_id = 'thumbnails' and (storage.foldername(name))[1] = auth.uid()::text);
drop policy if exists "thumbnails_update_own" on storage.objects;
create policy "thumbnails_update_own" on storage.objects
  for update using (bucket_id = 'thumbnails' and (storage.foldername(name))[1] = auth.uid()::text);
drop policy if exists "thumbnails_delete_own" on storage.objects;
create policy "thumbnails_delete_own" on storage.objects
  for delete using (bucket_id = 'thumbnails' and (storage.foldername(name))[1] = auth.uid()::text);

-- ---------- avatars policies (public read via public URL; writes owner-only) ----------
drop policy if exists "avatars_read_all" on storage.objects;
create policy "avatars_read_all" on storage.objects
  for select using (bucket_id = 'avatars');
drop policy if exists "avatars_insert_own" on storage.objects;
create policy "avatars_insert_own" on storage.objects
  for insert with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);
drop policy if exists "avatars_update_own" on storage.objects;
create policy "avatars_update_own" on storage.objects
  for update using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);
drop policy if exists "avatars_delete_own" on storage.objects;
create policy "avatars_delete_own" on storage.objects
  for delete using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);
