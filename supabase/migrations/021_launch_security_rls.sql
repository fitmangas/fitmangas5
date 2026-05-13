-- Durcissement pré-lancement : tables internes non lisibles côté client.

alter table if exists public.stripe_events enable row level security;

drop policy if exists "Deny client access to stripe events" on public.stripe_events;
create policy "Deny client access to stripe events"
  on public.stripe_events
  for all
  using (false)
  with check (false);

alter table if exists public.business_stats_daily enable row level security;

drop policy if exists "Admins read business stats daily" on public.business_stats_daily;
create policy "Admins read business stats daily"
  on public.business_stats_daily
  for select
  using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role = 'admin'
    )
  );
