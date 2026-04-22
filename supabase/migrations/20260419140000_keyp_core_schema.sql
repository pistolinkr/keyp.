-- Keyp. core schema: profiles, articles (bilingual), comments + RLS + new-user profile

-- ─── TABLES ───

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  username text not null unique,
  display_name text not null,
  display_name_en text not null default '',
  avatar_url text,
  bio text default '',
  bio_en text default '',
  level int not null default 1,
  xp int not null default 0,
  joined_season text, -- optional legacy label; unused in product UI
  post_count int not null default 0,
  comment_count int not null default 0,
  is_verified boolean not null default false,
  tags text[] not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.articles (
  id text primary key,
  slug text not null unique,
  category text not null,
  author_profile_id uuid references public.profiles (id) on delete set null,
  legacy_author_id text,
  author_username text not null,
  author_display_name text not null,
  author_display_name_en text not null,
  author_avatar_url text not null,
  author_level int not null default 1,
  author_xp int not null default 0,
  author_joined_season text,
  author_is_verified boolean not null default false,
  author_tags text[] not null default '{}',
  status text not null default 'draft',
  featured_image text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  published_at timestamptz,
  seo_title text,
  seo_description text,
  episode int not null default 0, -- legacy ordering field; UI does not surface
  original_lang text not null,
  read_time int not null default 5,
  view_count int not null default 0,
  upvote_count int not null default 0,
  comment_count int not null default 0,
  bookmark_count int not null default 0,
  is_read_only boolean not null default false,
  is_featured boolean not null default false,
  difficulty text not null,
  constraint articles_status_chk check (status in ('draft', 'review', 'published')),
  constraint articles_lang_chk check (original_lang in ('ko', 'en')),
  constraint articles_diff_chk check (difficulty in ('beginner', 'intermediate', 'advanced'))
);

create table public.article_contents (
  article_id text not null references public.articles (id) on delete cascade,
  locale text not null,
  title text not null,
  summary text not null,
  content text not null,
  primary key (article_id, locale),
  constraint article_contents_locale_chk check (locale in ('ko', 'en'))
);

create table public.article_tags (
  article_id text not null references public.articles (id) on delete cascade,
  locale text not null,
  tag text not null,
  primary key (article_id, locale, tag),
  constraint article_tags_locale_chk check (locale in ('ko', 'en'))
);

create table public.comments (
  id uuid primary key default gen_random_uuid(),
  article_id text not null references public.articles (id) on delete cascade,
  parent_id uuid references public.comments (id) on delete cascade,
  author_profile_id uuid references public.profiles (id) on delete set null,
  author_username text not null,
  author_display_name text not null,
  author_display_name_en text not null,
  author_avatar_url text not null,
  author_level int not null default 1,
  author_is_verified boolean not null default false,
  content_ko text not null,
  content_en text not null,
  original_lang text not null,
  upvote_count int not null default 0,
  depth int not null default 0,
  created_at timestamptz not null default now(),
  is_read_only boolean not null default false,
  constraint comments_lang_chk check (original_lang in ('ko', 'en'))
);

create index idx_articles_published_at on public.articles (published_at desc nulls last);
create index idx_articles_status on public.articles (status);
create index idx_comments_article_id on public.comments (article_id);

-- ─── RLS ───

alter table public.profiles enable row level security;
alter table public.articles enable row level security;
alter table public.article_contents enable row level security;
alter table public.article_tags enable row level security;
alter table public.comments enable row level security;

create policy "profiles_select_all"
  on public.profiles for select
  using (true);

create policy "profiles_update_own"
  on public.profiles for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

create policy "articles_select"
  on public.articles for select
  using (
    status = 'published'
    or (
      author_profile_id is not null
      and author_profile_id = auth.uid()
    )
  );

create policy "articles_insert_authenticated"
  on public.articles for insert
  with check (
    auth.uid() is not null
    and author_profile_id = auth.uid()
  );

create policy "articles_update_owner"
  on public.articles for update
  using (
    author_profile_id is not null
    and author_profile_id = auth.uid()
  )
  with check (
    author_profile_id is not null
    and author_profile_id = auth.uid()
  );

create policy "articles_delete_owner"
  on public.articles for delete
  using (
    author_profile_id is not null
    and author_profile_id = auth.uid()
  );

create policy "article_contents_select"
  on public.article_contents for select
  using (
    exists (
      select 1
      from public.articles a
      where a.id = article_contents.article_id
      and (
        a.status = 'published'
        or (
          a.author_profile_id is not null
          and a.author_profile_id = auth.uid()
        )
      )
    )
  );

create policy "article_contents_insert_owner"
  on public.article_contents for insert
  with check (
    exists (
      select 1
      from public.articles a
      where a.id = article_contents.article_id
      and a.author_profile_id = auth.uid()
    )
  );

create policy "article_contents_update_owner"
  on public.article_contents for update
  using (
    exists (
      select 1
      from public.articles a
      where a.id = article_contents.article_id
      and a.author_profile_id = auth.uid()
    )
  );

create policy "article_contents_delete_owner"
  on public.article_contents for delete
  using (
    exists (
      select 1
      from public.articles a
      where a.id = article_contents.article_id
      and a.author_profile_id = auth.uid()
    )
  );

create policy "article_tags_select"
  on public.article_tags for select
  using (
    exists (
      select 1
      from public.articles a
      where a.id = article_tags.article_id
      and (
        a.status = 'published'
        or (
          a.author_profile_id is not null
          and a.author_profile_id = auth.uid()
        )
      )
    )
  );

create policy "article_tags_insert_owner"
  on public.article_tags for insert
  with check (
    exists (
      select 1
      from public.articles a
      where a.id = article_tags.article_id
      and a.author_profile_id = auth.uid()
    )
  );

create policy "article_tags_update_owner"
  on public.article_tags for update
  using (
    exists (
      select 1
      from public.articles a
      where a.id = article_tags.article_id
      and a.author_profile_id = auth.uid()
    )
  );

create policy "article_tags_delete_owner"
  on public.article_tags for delete
  using (
    exists (
      select 1
      from public.articles a
      where a.id = article_tags.article_id
      and a.author_profile_id = auth.uid()
    )
  );

create policy "comments_select"
  on public.comments for select
  using (
    exists (
      select 1
      from public.articles a
      where a.id = comments.article_id
      and (
        a.status = 'published'
        or (
          a.author_profile_id is not null
          and a.author_profile_id = auth.uid()
        )
      )
    )
  );

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
    )
  );

-- ─── AUTH: auto-create profile (runs as definer; not for RLS decisions) ───

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  uname text;
begin
  uname := coalesce(
    nullif(trim(new.raw_user_meta_data ->> 'username'), ''),
    nullif(split_part(coalesce(new.email, ''), '@', 1), ''),
    'user_' || substr(replace(new.id::text, '-', ''), 1, 12)
  );
  insert into public.profiles (id, username, display_name, display_name_en, avatar_url)
  values (
    new.id,
    uname,
    coalesce(nullif(trim(new.raw_user_meta_data ->> 'full_name'), ''), uname),
    coalesce(nullif(trim(new.raw_user_meta_data ->> 'full_name'), ''), uname),
    nullif(trim(new.raw_user_meta_data ->> 'avatar_url'), '')
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
