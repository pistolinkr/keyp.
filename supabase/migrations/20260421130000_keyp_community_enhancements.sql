-- Keyp. community enhancements:
-- Remove legacy seasons; add upvotes, bookmarks, follows; sync counters; tighten comment RLS.

-- ─── 1. Remove seasons (product no longer uses seasons) ───

alter table public.articles
  drop constraint if exists articles_season_id_fkey;

drop index if exists idx_articles_season_id;

alter table public.articles
  drop column if exists season_id;

do $$
begin
  if to_regclass('public.seasons') is not null then
    execute 'drop policy if exists "seasons_select_all" on public.seasons';
  end if;
end
$$;

drop table if exists public.seasons;

-- ─── 2. Social: upvotes, bookmarks, follows ───

create table public.article_upvotes (
  article_id text not null references public.articles (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (article_id, user_id)
);

create index idx_article_upvotes_user_id on public.article_upvotes (user_id);

create table public.article_bookmarks (
  article_id text not null references public.articles (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (article_id, user_id)
);

create index idx_article_bookmarks_user_id on public.article_bookmarks (user_id);

create table public.follows (
  follower_id uuid not null references public.profiles (id) on delete cascade,
  following_id uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (follower_id, following_id),
  constraint follows_no_self check (follower_id <> following_id)
);

create index idx_follows_following_id on public.follows (following_id);

-- ─── 3. Counter triggers (keeps denormalized counts on articles accurate) ───

create or replace function public.tg_article_upvotes_refresh_count()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op = 'INSERT' then
    update public.articles
    set upvote_count = upvote_count + 1
    where id = new.article_id;
  elsif tg_op = 'DELETE' then
    update public.articles
    set upvote_count = greatest(0, upvote_count - 1)
    where id = old.article_id;
  end if;
  return null;
end;
$$;

drop trigger if exists tr_article_upvotes_refresh_count on public.article_upvotes;
create trigger tr_article_upvotes_refresh_count
  after insert or delete on public.article_upvotes
  for each row execute procedure public.tg_article_upvotes_refresh_count();

create or replace function public.tg_article_bookmarks_refresh_count()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op = 'INSERT' then
    update public.articles
    set bookmark_count = bookmark_count + 1
    where id = new.article_id;
  elsif tg_op = 'DELETE' then
    update public.articles
    set bookmark_count = greatest(0, bookmark_count - 1)
    where id = old.article_id;
  end if;
  return null;
end;
$$;

drop trigger if exists tr_article_bookmarks_refresh_count on public.article_bookmarks;
create trigger tr_article_bookmarks_refresh_count
  after insert or delete on public.article_bookmarks
  for each row execute procedure public.tg_article_bookmarks_refresh_count();

create or replace function public.tg_comments_refresh_article_count()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op = 'INSERT' then
    update public.articles
    set comment_count = comment_count + 1
    where id = new.article_id;
  elsif tg_op = 'DELETE' then
    update public.articles
    set comment_count = greatest(0, comment_count - 1)
    where id = old.article_id;
  end if;
  return null;
end;
$$;

drop trigger if exists tr_comments_refresh_article_count on public.comments;
create trigger tr_comments_refresh_article_count
  after insert or delete on public.comments
  for each row execute procedure public.tg_comments_refresh_article_count();

-- One-time realignment (safe if tables were seeded with manual counts)
update public.articles a
set upvote_count = coalesce((
  select count(*)::int from public.article_upvotes u where u.article_id = a.id
), 0);

update public.articles a
set bookmark_count = coalesce((
  select count(*)::int from public.article_bookmarks b where b.article_id = a.id
), 0);

update public.articles a
set comment_count = coalesce((
  select count(*)::int from public.comments c where c.article_id = a.id
), 0);

-- ─── 4. RLS: new tables ───

alter table public.article_upvotes enable row level security;
alter table public.article_bookmarks enable row level security;
alter table public.follows enable row level security;

create policy "article_upvotes_select_all"
  on public.article_upvotes for select
  using (true);

create policy "article_upvotes_insert_own"
  on public.article_upvotes for insert
  with check (
    auth.uid() = user_id
    and exists (
      select 1
      from public.articles a
      where a.id = article_id
        and a.status = 'published'
    )
  );

create policy "article_upvotes_delete_own"
  on public.article_upvotes for delete
  using (auth.uid() = user_id);

create policy "article_bookmarks_select_own"
  on public.article_bookmarks for select
  using (auth.uid() = user_id);

create policy "article_bookmarks_insert_own"
  on public.article_bookmarks for insert
  with check (
    auth.uid() = user_id
    and exists (
      select 1
      from public.articles a
      where a.id = article_id
        and a.status = 'published'
    )
  );

create policy "article_bookmarks_delete_own"
  on public.article_bookmarks for delete
  using (auth.uid() = user_id);

create policy "follows_select_all"
  on public.follows for select
  using (true);

create policy "follows_insert_own"
  on public.follows for insert
  with check (auth.uid() = follower_id);

create policy "follows_delete_own"
  on public.follows for delete
  using (auth.uid() = follower_id);

-- ─── 5. Comments: disallow on read-only posts; allow edit/delete by author ───

drop policy if exists "comments_insert_authenticated" on public.comments;

create policy "comments_insert_authenticated"
  on public.comments for insert
  with check (
    auth.uid() is not null
    and author_profile_id = auth.uid()
    and exists (
      select 1
      from public.articles a
      where a.id = comments.article_id
        and a.status = 'published'
        and not a.is_read_only
    )
  );

create policy "comments_update_own"
  on public.comments for update
  using (author_profile_id = auth.uid())
  with check (author_profile_id = auth.uid());

create policy "comments_delete_own"
  on public.comments for delete
  using (author_profile_id = auth.uid());
