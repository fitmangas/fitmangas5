-- Cockpit admin : promo codes, vues replay, RPC incrément vues.

alter table public.video_recordings
  add column if not exists view_count bigint not null default 0;

comment on column public.video_recordings.view_count is 'Cumul des lectures replay (incrément côté app).';

create table if not exists public.promo_codes (
  id uuid primary key default gen_random_uuid(),
  code text not null,
  description text,
  discount_percent numeric(5, 2) not null check (discount_percent >= 0 and discount_percent <= 100),
  max_redemptions integer,
  redeemed_count integer not null default 0 check (redeemed_count >= 0),
  valid_from timestamptz not null default now(),
  valid_until timestamptz,
  active boolean not null default true,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists promo_codes_code_ci_unique on public.promo_codes (lower(trim(code)));

drop trigger if exists trg_promo_codes_updated_at on public.promo_codes;
create trigger trg_promo_codes_updated_at
before update on public.promo_codes
for each row execute function public.set_updated_at();

alter table public.promo_codes enable row level security;

drop policy if exists "Admins manage promo codes" on public.promo_codes;
create policy "Admins manage promo codes"
  on public.promo_codes
  for all
  using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role = 'admin'
    )
  )
  with check (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role = 'admin'
    )
  );

comment on table public.promo_codes is 'Codes promo gérés depuis l’admin (intégration checkout Stripe à brancher).';

-- Incrément vues replay (authenticated), bypass RLS update via security definer.
create or replace function public.increment_replay_view(p_recording_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.video_recordings
  set view_count = view_count + 1
  where id = p_recording_id;
end;
$$;

grant execute on function public.increment_replay_view(uuid) to authenticated;
