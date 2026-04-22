-- Realtime + Edge engagement flow foundation
-- Covers: posted-time refresh surface, comments, bookmarks, upvotes

-- 1) Ensure key social tables are part of realtime publication.
do $$
begin
  if not exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'articles'
  ) then
    alter publication supabase_realtime add table public.articles;
  end if;

  if not exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'comments'
  ) then
    alter publication supabase_realtime add table public.comments;
  end if;

  if not exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'article_upvotes'
  ) then
    alter publication supabase_realtime add table public.article_upvotes;
  end if;

  if not exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'article_bookmarks'
  ) then
    alter publication supabase_realtime add table public.article_bookmarks;
  end if;
end
$$;

-- 2) Optional event stream table for Edge-side audit and future fan-out.
create table if not exists public.engagement_events (
  id bigserial primary key,
  article_id text not null references public.articles (id) on delete cascade,
  actor_id uuid not null references public.profiles (id) on delete cascade,
  event_type text not null check (event_type in ('upvote_toggle', 'bookmark_toggle', 'comment_create')),
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_engagement_events_article_id_created_at
  on public.engagement_events (article_id, created_at desc);

alter table public.engagement_events enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'engagement_events'
      and policyname = 'engagement_events_select_own_or_related'
  ) then
    create policy "engagement_events_select_own_or_related"
      on public.engagement_events for select
      using (
        actor_id = auth.uid()
        or exists (
          select 1
          from public.articles a
          where a.id = engagement_events.article_id
            and a.author_profile_id = auth.uid()
        )
      );
  end if;
end
$$;
