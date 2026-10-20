create table if not exists public.client_followups (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles(id) on delete cascade,
  followed_at timestamptz not null default now(),
  channel text not null check (channel in ('whatsapp','email')),
  reason text,
  note text,
  author_id uuid references public.profiles(id) on delete set null
);
alter table public.client_followups enable row level security;
revoke all on public.client_followups from anon, authenticated;
grant select, insert on public.client_followups to service_role;

-- Noms boutique FR/ES éditables (sans changer le slug Printful)
create table if not exists public.printful_product_names (
  printful_product_id bigint primary key,
  name_fr text,
  name_es text,
  slug text unique,
  updated_at timestamptz not null default now()
);
alter table public.printful_product_names enable row level security;
revoke all on public.printful_product_names from anon, authenticated;
grant select, insert, update on public.printful_product_names to service_role;

create table if not exists public.acq_team_accounts (
  id uuid primary key default gen_random_uuid(),
  kind text not null check (kind in ('instagram', 'email', 'phone')),
  value text not null,
  created_at timestamptz not null default now()
);
alter table public.acq_team_accounts enable row level security;
revoke all on public.acq_team_accounts from anon, authenticated;
grant select, insert, update, delete on public.acq_team_accounts to service_role;
