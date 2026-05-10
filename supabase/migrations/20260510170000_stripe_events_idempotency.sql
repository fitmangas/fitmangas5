create table if not exists public.stripe_events (
  id text primary key,
  type text not null,
  received_at timestamptz not null default now()
);

comment on table public.stripe_events is
  'Idempotence des webhooks Stripe traités côté serveur.';
