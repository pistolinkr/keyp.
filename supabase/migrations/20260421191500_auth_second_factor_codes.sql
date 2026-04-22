create table if not exists public.auth_second_factor_codes (
  id bigserial primary key,
  user_id uuid not null references auth.users (id) on delete cascade,
  email text not null,
  code_hash text not null,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null,
  consumed_at timestamptz,
  attempt_count integer not null default 0 check (attempt_count >= 0),
  sent_via text not null default 'email'
);

create index if not exists idx_auth_second_factor_codes_user_active
  on public.auth_second_factor_codes (user_id, created_at desc);

alter table public.auth_second_factor_codes enable row level security;

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'auth_second_factor_codes'
      and policyname = 'auth_second_factor_codes_select_own'
  ) then
    create policy "auth_second_factor_codes_select_own"
      on public.auth_second_factor_codes for select
      using (auth.uid() = user_id);
  end if;
end
$$;
