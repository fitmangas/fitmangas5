-- Récompense parrainage (5 filleules Visio Collectif actives) + tickets support client.

alter table public.profiles
  add column if not exists referral_reward_active boolean not null default false;

comment on column public.profiles.referral_reward_active is
  'Abonnement offert tant que 5+ filleules Visio Collectif (v-coll) actives.';

-- ---------------------------------------------------------------------------
-- Tickets support (espace client)
-- ---------------------------------------------------------------------------

create table if not exists public.support_tickets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  type text not null check (type in ('bug', 'question', 'suggestion', 'other')),
  message text not null,
  status text not null default 'open' check (status in ('open', 'resolved')),
  created_at timestamptz not null default now(),
  resolved_at timestamptz
);

create index if not exists idx_support_tickets_user_created
  on public.support_tickets (user_id, created_at desc);

create index if not exists idx_support_tickets_status_created
  on public.support_tickets (status, created_at desc);

comment on table public.support_tickets is 'Remontées clientes depuis l’espace compte (bouton aide).';

alter table public.support_tickets enable row level security;

drop policy if exists "support_tickets_insert_own" on public.support_tickets;
create policy "support_tickets_insert_own"
  on public.support_tickets
  for insert
  to authenticated
  with check (user_id = auth.uid());

drop policy if exists "support_tickets_select_own" on public.support_tickets;
create policy "support_tickets_select_own"
  on public.support_tickets
  for select
  to authenticated
  using (user_id = auth.uid());

drop policy if exists "support_tickets_admin_all" on public.support_tickets;
create policy "support_tickets_admin_all"
  on public.support_tickets
  for all
  to authenticated
  using (
    exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin')
  )
  with check (
    exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin')
  );

grant select, insert on public.support_tickets to authenticated;
grant update on public.support_tickets to authenticated;
