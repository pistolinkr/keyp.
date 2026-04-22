-- Create storage buckets required by KEYP platform.
-- - avatars: profile images
-- - article-images: post/cover/editor images

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('avatars', 'avatars', true, 5242880, array['image/jpeg', 'image/png', 'image/webp']),
  ('article-images', 'article-images', true, 10485760, array['image/jpeg', 'image/png', 'image/webp', 'image/gif'])
on conflict (id) do update
set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Public read avatars" on storage.objects;
create policy "Public read avatars"
on storage.objects
for select
using (bucket_id = 'avatars');

drop policy if exists "Public read article images" on storage.objects;
create policy "Public read article images"
on storage.objects
for select
using (bucket_id = 'article-images');

drop policy if exists "Authenticated upload own avatar" on storage.objects;
create policy "Authenticated upload own avatar"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'avatars'
  and auth.uid() is not null
  and (storage.foldername(name))[1] = auth.uid()::text
);

drop policy if exists "Authenticated update own avatar" on storage.objects;
create policy "Authenticated update own avatar"
on storage.objects
for update
to authenticated
using (
  bucket_id = 'avatars'
  and auth.uid() is not null
  and (storage.foldername(name))[1] = auth.uid()::text
)
with check (
  bucket_id = 'avatars'
  and auth.uid() is not null
  and (storage.foldername(name))[1] = auth.uid()::text
);

drop policy if exists "Authenticated delete own avatar" on storage.objects;
create policy "Authenticated delete own avatar"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'avatars'
  and auth.uid() is not null
  and (storage.foldername(name))[1] = auth.uid()::text
);

drop policy if exists "Authenticated upload own article images" on storage.objects;
create policy "Authenticated upload own article images"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'article-images'
  and auth.uid() is not null
  and (storage.foldername(name))[1] = auth.uid()::text
);

drop policy if exists "Authenticated update own article images" on storage.objects;
create policy "Authenticated update own article images"
on storage.objects
for update
to authenticated
using (
  bucket_id = 'article-images'
  and auth.uid() is not null
  and (storage.foldername(name))[1] = auth.uid()::text
)
with check (
  bucket_id = 'article-images'
  and auth.uid() is not null
  and (storage.foldername(name))[1] = auth.uid()::text
);

drop policy if exists "Authenticated delete own article images" on storage.objects;
create policy "Authenticated delete own article images"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'article-images'
  and auth.uid() is not null
  and (storage.foldername(name))[1] = auth.uid()::text
);
