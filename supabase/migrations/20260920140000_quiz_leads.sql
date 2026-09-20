-- Quiz leads (porte dure avant rapport) + enrichissement acq_contacts

alter table public.acq_contacts
  add column if not exists phone text,
  add column if not exists display_name text;

create index if not exists acq_contacts_phone_idx
  on public.acq_contacts (phone)
  where phone is not null;

create table if not exists public.quiz_leads (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  locale text not null check (locale in ('fr', 'es')),
  quiz_slug text not null,
  first_name text not null,
  email text not null,
  phone text not null,
  result_id text not null,
  secondary_id text,
  percents jsonb not null default '{}'::jsonb,
  answers jsonb not null default '{}'::jsonb,
  consent_at timestamptz not null default now(),
  source jsonb not null default '{}'::jsonb,
  acq_contact_id uuid references public.acq_contacts (id) on delete set null
);

create index if not exists quiz_leads_email_idx on public.quiz_leads (lower(email));
create index if not exists quiz_leads_slug_idx on public.quiz_leads (quiz_slug, created_at desc);
create index if not exists quiz_leads_created_idx on public.quiz_leads (created_at desc);

alter table public.quiz_leads enable row level security;

revoke all on public.quiz_leads from anon, authenticated;
grant all on public.quiz_leads to service_role;

comment on table public.quiz_leads is 'Leads quiz (porte dure avant rapport). Écriture service_role uniquement.';
comment on column public.acq_contacts.phone is 'Téléphone lead (WhatsApp / rappel).';
comment on column public.acq_contacts.display_name is 'Prénom / nom affiché (quiz, formulaires).';
