-- Sprint B/C/D/E: tokens double opt-in, logs publication newsletter, logs cron.

create table if not exists public.newsletter_confirmation_tokens (
  id uuid primary key default gen_random_uuid(),
  subscription_id uuid not null references public.newsletter_subscriptions (id) on delete cascade,
  token text not null unique,
  expires_at timestamptz not null,
  used_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists idx_newsletter_tokens_subscription on public.newsletter_confirmation_tokens (subscription_id);
create index if not exists idx_newsletter_tokens_expires on public.newsletter_confirmation_tokens (expires_at);

create table if not exists public.blog_publication_events (
  id uuid primary key default gen_random_uuid(),
  article_id uuid not null references public.blog_articles (id) on delete cascade unique,
  published_at timestamptz not null,
  notifications_sent integer not null default 0,
  newsletter_targeted integer not null default 0,
  newsletter_sent integer not null default 0,
  newsletter_provider text,
  created_at timestamptz not null default now()
);

create table if not exists public.blog_cron_logs (
  id uuid primary key default gen_random_uuid(),
  cron_name text not null,
  status text not null check (status in ('ok', 'error')),
  message text,
  meta jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_blog_cron_logs_name_created on public.blog_cron_logs (cron_name, created_at desc);

alter table public.newsletter_confirmation_tokens enable row level security;
alter table public.blog_publication_events enable row level security;
alter table public.blog_cron_logs enable row level security;

drop policy if exists "newsletter_tokens_admin_only" on public.newsletter_confirmation_tokens;
create policy "newsletter_tokens_admin_only"
  on public.newsletter_confirmation_tokens for all to authenticated
  using (false)
  with check (false);

drop policy if exists "blog_publication_events_admin_only" on public.blog_publication_events;
create policy "blog_publication_events_admin_only"
  on public.blog_publication_events for all to authenticated
  using (false)
  with check (false);

drop policy if exists "blog_cron_logs_admin_only" on public.blog_cron_logs;
create policy "blog_cron_logs_admin_only"
  on public.blog_cron_logs for all to authenticated
  using (false)
  with check (false);
