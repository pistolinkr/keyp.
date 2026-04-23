-- Deduplicate article view increments per viewer (logged-in or anonymous) within a cooldown window.

create table if not exists public.article_view_cooldown (
  article_id text not null references public.articles (id) on delete cascade,
  viewer_key text not null,
  last_counted_at timestamptz not null default now(),
  primary key (article_id, viewer_key)
);

create index if not exists idx_article_view_cooldown_last_counted
  on public.article_view_cooldown (last_counted_at);

alter table public.article_view_cooldown enable row level security;

-- Replace single-arg RPC with version that respects per-viewer cooldown.
drop function if exists public.increment_article_view_count (text);

create or replace function public.increment_article_view_count (
  p_article_id text,
  p_anon_viewer_key text default null
)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_viewer text;
  v_last timestamptz;
  v_next integer;
  v_cooldown constant interval := interval '24 hours';
begin
  if auth.uid() is not null then
    v_viewer := 'u:' || auth.uid()::text;
  elsif
    p_anon_viewer_key is not null
    and p_anon_viewer_key ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
  then
    v_viewer := 'a:' || lower(trim(p_anon_viewer_key));
  else
    select view_count into v_next
    from public.articles
    where id = p_article_id;
    return coalesce(v_next, 0);
  end if;

  perform pg_advisory_xact_lock (hashtext (p_article_id), hashtext (v_viewer));

  select last_counted_at into v_last
  from public.article_view_cooldown
  where article_id = p_article_id
    and viewer_key = v_viewer;

  if v_last is not null and v_last >= now() - v_cooldown then
    select view_count into v_next
    from public.articles
    where id = p_article_id;
    return coalesce(v_next, 0);
  end if;

  if v_last is null then
    insert into public.article_view_cooldown (article_id, viewer_key, last_counted_at)
    values (p_article_id, v_viewer, now());
  else
    update public.article_view_cooldown
    set last_counted_at = now()
    where article_id = p_article_id
      and viewer_key = v_viewer;
  end if;

  update public.articles
  set view_count = view_count + 1,
      updated_at = now()
  where id = p_article_id
    and status = 'published'
  returning view_count into v_next;

  if v_next is null then
    select view_count into v_next
    from public.articles
    where id = p_article_id;
  end if;

  return coalesce(v_next, 0);
end;
$$;

grant execute on function public.increment_article_view_count (text, text) to anon, authenticated;
