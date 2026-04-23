-- Legacy rows may have author_username set but author_profile_id null; owners could not edit.

update public.articles a
set author_profile_id = p.id
from public.profiles p
where a.author_profile_id is null
  and lower(trim(a.author_username)) = lower(trim(p.username));

drop policy if exists "articles_update_owner" on public.articles;

create policy "articles_update_owner"
  on public.articles for update
  using (
    (
      author_profile_id is not null
      and author_profile_id = auth.uid()
    )
    or (
      author_profile_id is null
      and exists (
        select 1
        from public.profiles pr
        where pr.id = auth.uid()
          and lower(trim(pr.username)) = lower(trim(articles.author_username))
      )
    )
  )
  with check (
    author_profile_id = auth.uid()
  );
