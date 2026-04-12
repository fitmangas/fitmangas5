-- Profils liés à auth.users + champs métier (Stripe, dernière offre payée).
-- Exécuter dans le SQL Editor Supabase ou via CLI `supabase db push`.

create table if not exists public.profiles (
  id uuid primary key references auth.users on delete cascade,
  first_name text,
  last_name text,
  role text not null default 'member' check (role in ('member', 'admin')),
  stripe_customer_id text,
  last_checkout_course_id text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "Lecture du profil par l’utilisateur"
  on public.profiles
  for select
  using (auth.uid() = id);

create policy "Mise à jour du profil par l’utilisateur"
  on public.profiles
  for update
  using (auth.uid() = id);

-- Service role / webhooks : pas de policy insert publique ; le trigger ci-dessous insère en security definer.

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, first_name, last_name)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'first_name', ''),
    coalesce(new.raw_user_meta_data->>'last_name', '')
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;

create trigger on_auth_user_created
  after insert on auth.users
  for each row
  execute function public.handle_new_user();
