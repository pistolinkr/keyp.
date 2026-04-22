-- Published posts assets bucket (separate from draft/article-images workspace bucket)

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'published-posts',
  'published-posts',
  true,
  10485760,
  array['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
on conflict (id) do update
set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Public read published posts" on storage.objects;
create policy "Public read published posts"
on storage.objects
for select
using (bucket_id = 'published-posts');

drop policy if exists "Authenticated upload own published posts" on storage.objects;
create policy "Authenticated upload own published posts"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'published-posts'
  and auth.uid() is not null
  and (storage.foldername(name))[1] = auth.uid()::text
);

drop policy if exists "Authenticated update own published posts" on storage.objects;
create policy "Authenticated update own published posts"
on storage.objects
for update
to authenticated
using (
  bucket_id = 'published-posts'
  and auth.uid() is not null
  and (storage.foldername(name))[1] = auth.uid()::text
)
with check (
  bucket_id = 'published-posts'
  and auth.uid() is not null
  and (storage.foldername(name))[1] = auth.uid()::text
);

drop policy if exists "Authenticated delete own published posts" on storage.objects;
create policy "Authenticated delete own published posts"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'published-posts'
  and auth.uid() is not null
  and (storage.foldername(name))[1] = auth.uid()::text
);
