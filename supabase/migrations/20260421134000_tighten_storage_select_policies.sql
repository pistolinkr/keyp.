-- Tighten storage.objects SELECT policies to avoid broad file listing.
-- Public bucket file delivery still works via public bucket URLs.

drop policy if exists "Public read avatars" on storage.objects;
drop policy if exists "Public read article images" on storage.objects;
drop policy if exists "Public read published posts" on storage.objects;

drop policy if exists "Authenticated read own avatar" on storage.objects;
create policy "Authenticated read own avatar"
on storage.objects
for select
to authenticated
using (
  bucket_id = 'avatars'
  and auth.uid() is not null
  and (storage.foldername(name))[1] = auth.uid()::text
);

drop policy if exists "Authenticated read own article images" on storage.objects;
create policy "Authenticated read own article images"
on storage.objects
for select
to authenticated
using (
  bucket_id = 'article-images'
  and auth.uid() is not null
  and (storage.foldername(name))[1] = auth.uid()::text
);

drop policy if exists "Authenticated read own published posts" on storage.objects;
create policy "Authenticated read own published posts"
on storage.objects
for select
to authenticated
using (
  bucket_id = 'published-posts'
  and auth.uid() is not null
  and (storage.foldername(name))[1] = auth.uid()::text
);
