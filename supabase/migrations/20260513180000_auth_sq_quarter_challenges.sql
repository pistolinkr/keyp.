-- Secured Quarter (SQ) 2FA gate: server stores expected color + hashed code only.
create table if not exists public.auth_sq_quarter_challenges (
  id uuid primary key default gen_random_uuid (),
  email text not null,
  solution_color_key text not null check (
    solution_color_key = any (
      array[
        'sapphire'::text,
        'emerald'::text,
        'ruby'::text,
        'amber'::text,
        'violet'::text
      ]
    )
  ),
  code_hash text not null,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null,
  consumed_at timestamptz,
  attempt_count integer not null default 0 check (attempt_count >= 0)
);

create index if not exists idx_auth_sq_quarter_email_created
  on public.auth_sq_quarter_challenges (email, created_at desc);

alter table public.auth_sq_quarter_challenges enable row level security;
