create or replace function public.increment_article_view_count(p_article_id text)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_next integer;
begin
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

grant execute on function public.increment_article_view_count(text) to anon, authenticated;
