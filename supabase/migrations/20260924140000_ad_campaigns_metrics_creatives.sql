-- Ads / Publicité Croissance — tables additives (aucune donnée inventée)
begin;

create table if not exists public.ad_campaigns (
  id uuid primary key default gen_random_uuid(),
  channel text not null check (channel in ('meta', 'tiktok', 'pinterest', 'google')),
  name text not null,
  objective text not null check (objective in ('cold_quiz', 'warm_retarget', 'hot_trial', 'brand_search', 'other')),
  status text not null default 'draft'
    check (status in ('draft', 'paused', 'active', 'archived')),
  daily_budget_cents integer,
  currency text not null default 'EUR',
  meta_campaign_id text,
  meta_adset_id text,
  meta_ad_id text,
  notes text,
  created_by text,
  activated_at timestamptz,
  activated_by text,
  metadata jsonb not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists ad_campaigns_channel_idx on public.ad_campaigns (channel);
create index if not exists ad_campaigns_status_idx on public.ad_campaigns (status);
create index if not exists ad_campaigns_objective_idx on public.ad_campaigns (objective);

create table if not exists public.ad_metrics_daily (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid not null references public.ad_campaigns(id) on delete cascade,
  metric_date date not null,
  spend_cents integer not null default 0,
  impressions integer not null default 0,
  clicks integer not null default 0,
  leads integer not null default 0,
  trial_starts integer not null default 0,
  paid_conversions integer not null default 0,
  ctr numeric(8, 4),
  cpl_cents integer,
  cac_cents integer,
  raw jsonb not null default '{}',
  created_at timestamptz not null default now(),
  unique (campaign_id, metric_date)
);

create index if not exists ad_metrics_daily_date_idx on public.ad_metrics_daily (metric_date desc);
create index if not exists ad_metrics_daily_campaign_idx on public.ad_metrics_daily (campaign_id);

create table if not exists public.ad_creatives (
  id uuid primary key default gen_random_uuid(),
  channel text not null check (channel in ('meta', 'tiktok', 'pinterest', 'google', 'organic_reel')),
  title text not null,
  angle text not null,
  copy_fr text not null,
  copy_es text not null,
  media_path text,
  media_kind text not null default 'image'
    check (media_kind in ('image', 'video', 'carousel')),
  campaign_objective text
    check (campaign_objective is null or campaign_objective in ('cold_quiz', 'warm_retarget', 'hot_trial', 'brand_search', 'other')),
  compliance_notes text,
  active boolean not null default true,
  metadata jsonb not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists ad_creatives_channel_idx on public.ad_creatives (channel);
create index if not exists ad_creatives_active_idx on public.ad_creatives (active) where active = true;

commit;
