create table if not exists public.auth_email_challenges (
  id bigserial primary key,
  email text not null,
  code_hash text not null,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null,
  consumed_at timestamptz,
  attempt_count integer not null default 0 check (attempt_count >= 0),
  magic_link_sent_at timestamptz
);

create index if not exists idx_auth_email_challenges_email_created_at
  on public.auth_email_challenges (email, created_at desc);

alter table public.auth_email_challenges enable row level security;
