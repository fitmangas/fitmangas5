-- Parrainage : suivi sans avantage (qui amène qui) + suggestions calendrier éditorial marketing.

-- ---------------------------------------------------------------------------
-- Code de parrainage sur le profil (lien ?ref=CODE)
-- ---------------------------------------------------------------------------

alter table public.profiles
  add column if not exists referral_code text;

create unique index if not exists idx_profiles_referral_code_unique
  on public.profiles (referral_code)
  where referral_code is not null;

create or replace function public.generate_unique_referral_code(p_first_name text)
returns text
language plpgsql
as $$
declare
  base text;
  rnd text;
  candidate text;
  tries int := 0;
begin
  base := upper(regexp_replace(coalesce(nullif(trim(p_first_name), ''), 'FM'), '[^A-Z0-9]', '', 'g'));
  if length(base) > 16 then
    base := left(base, 16);
  end if;
  if base = '' then
    base := 'FM';
  end if;
  loop
    tries := tries + 1;
    rnd := lpad((floor(random() * 10000))::int::text, 4, '0');
    candidate := base || '-' || rnd;
    exit when not exists (select 1 from public.profiles p where p.referral_code = candidate);
    exit when tries > 80;
  end loop;
  return candidate;
end;
$$;

create or replace function public.trg_profiles_set_referral_code()
returns trigger
language plpgsql
as $$
begin
  if new.referral_code is null or trim(new.referral_code) = '' then
    new.referral_code := public.generate_unique_referral_code(new.first_name);
  end if;
  return new;
end;
$$;

drop trigger if exists trg_profiles_set_referral_code on public.profiles;
create trigger trg_profiles_set_referral_code
  before insert on public.profiles
  for each row
  execute function public.trg_profiles_set_referral_code();

-- Profils existants : remplir referral_code manquant
update public.profiles p
set referral_code = public.generate_unique_referral_code(p.first_name)
where p.referral_code is null;

-- ---------------------------------------------------------------------------
-- Filleules enregistrées
-- ---------------------------------------------------------------------------

create table if not exists public.referrals (
  id uuid primary key default gen_random_uuid(),
  referrer_user_id uuid not null references public.profiles (id) on delete cascade,
  referral_code text not null,
  referred_email text not null,
  referred_user_id uuid references public.profiles (id) on delete set null,
  status text not null default 'pending' check (status in ('pending', 'signed_up', 'subscribed')),
  created_at timestamptz not null default now(),
  converted_at timestamptz
);

create unique index if not exists idx_referrals_referrer_email
  on public.referrals (referrer_user_id, referred_email);

create index if not exists idx_referrals_referrer on public.referrals (referrer_user_id);
create index if not exists idx_referrals_referred_user on public.referrals (referred_user_id);

comment on table public.referrals is 'Suivi de parrainage : pas de réduction ; rattache une invitée à son ambassadrice.';

alter table public.referrals enable row level security;

create policy "referrals_select_own_as_referrer"
  on public.referrals
  for select
  to authenticated
  using (referrer_user_id = auth.uid());

create policy "referrals_select_admin"
  on public.referrals
  for select
  to authenticated
  using (
    exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin')
  );

-- Pas d’insert / update côté client : service role (API) uniquement.

-- ---------------------------------------------------------------------------
-- Suggestions sujets éditoriaux (Gemini) — admin
-- ---------------------------------------------------------------------------

create table if not exists public.marketing_editorial_suggestions (
  id uuid primary key default gen_random_uuid(),
  suggestion_fr text not null,
  suggestion_es text,
  topics_hint text,
  created_at timestamptz not null default now(),
  created_by uuid references public.profiles (id) on delete set null
);

comment on table public.marketing_editorial_suggestions is 'Historique des sujets d’articles proposés depuis /admin/marketing.';

alter table public.marketing_editorial_suggestions enable row level security;

create policy "marketing_editorial_suggestions_admin_all"
  on public.marketing_editorial_suggestions
  for all
  to authenticated
  using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin'))
  with check (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin'));

grant select on public.referrals to authenticated;
grant select, insert, update, delete on public.marketing_editorial_suggestions to authenticated;
