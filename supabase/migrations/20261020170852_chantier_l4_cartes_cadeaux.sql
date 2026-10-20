create table if not exists public.gift_cards (
  id uuid primary key default gen_random_uuid(),
  code text unique not null,
  months smallint not null check (months in (1,3,6,12)),
  amount_cents int not null, currency text not null default 'eur', locale text not null default 'fr',
  stripe_checkout_session_id text unique, stripe_payment_intent_id text,
  buyer_name text not null, buyer_email text not null, buyer_timezone text,
  recipient_name text not null, recipient_email text,
  message text check (char_length(message) <= 250),
  delivery text not null check (delivery in ('email','print')),
  send_at timestamptz, buyer_email_sent_at timestamptz, recipient_email_sent_at timestamptz,
  status text not null default 'paid' check (status in ('paid','scheduled','sent','activated','expired','refunded')),
  expires_at timestamptz not null,
  activation_mode text check (activation_mode in ('new_trial','existing_no_access','balance_credit','trial_extension')),
  activated_by uuid references public.profiles(id) on delete set null, activated_at timestamptz, access_ends_at timestamptz,
  stripe_subscription_id text,
  reminder_14_sent_at timestamptz, reminder_3_sent_at timestamptz, converted_at timestamptz,
  refunded_at timestamptz, refund_amount_cents int,
  created_at timestamptz not null default now()
);
alter table public.gift_cards enable row level security;
revoke all on public.gift_cards from anon, authenticated;
grant select, insert, update on public.gift_cards to service_role;

create index if not exists gift_cards_scheduled_idx on public.gift_cards (send_at) where status = 'scheduled';
create index if not exists gift_cards_subscription_idx on public.gift_cards (stripe_subscription_id) where stripe_subscription_id is not null;
