-- Onboarding: profiles.is_onboarded + user_onboarding_survey

-- Existing rows: treat as already onboarded. New signups keep default false (trigger insert omits column).
alter table public.profiles
  add column if not exists is_onboarded boolean;

update public.profiles
set is_onboarded = true
where is_onboarded is null;

alter table public.profiles
  alter column is_onboarded set default false;

alter table public.profiles
  alter column is_onboarded set not null;

create table if not exists public.user_onboarding_survey (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  question_key text not null,
  answer text not null,
  created_at timestamptz not null default now(),
  constraint user_onboarding_survey_user_question unique (user_id, question_key)
);

create index if not exists idx_user_onboarding_survey_user_id on public.user_onboarding_survey (user_id);

alter table public.user_onboarding_survey enable row level security;

create policy "user_onboarding_survey_select_own"
  on public.user_onboarding_survey for select
  using (auth.uid() = user_id);

create policy "user_onboarding_survey_insert_own"
  on public.user_onboarding_survey for insert
  with check (auth.uid() = user_id);

create policy "user_onboarding_survey_update_own"
  on public.user_onboarding_survey for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "user_onboarding_survey_delete_own"
  on public.user_onboarding_survey for delete
  using (auth.uid() = user_id);
