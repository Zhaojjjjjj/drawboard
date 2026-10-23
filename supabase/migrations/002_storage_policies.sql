-- Drawboard 002: storage policies for the thumbnails bucket
-- Path convention: thumbnails/<owner_uid>/<drawing_id>.png — users can only
-- read/write objects inside their own folder. Run once in Supabase SQL Editor.
create policy "thumbnails read own" on storage.objects
  for select using (bucket_id = 'thumbnails' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "thumbnails insert own" on storage.objects
  for insert with check (bucket_id = 'thumbnails' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "thumbnails update own" on storage.objects
  for update using (bucket_id = 'thumbnails' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "thumbnails delete own" on storage.objects
  for delete using (bucket_id = 'thumbnails' and (storage.foldername(name))[1] = auth.uid()::text);
