-- Ads intelligence — snapshots metrics, breakdowns, organique, sync runs (additif)
begin;

create table if not exists public.ads_sync_runs (
  id uuid primary key default gen_random_uuid(),
  source text not null check (source in ('cron', 'manual', 'probe')),
  ok boolean not null default false,
  detail jsonb not null default '{}',
  ran_at timestamptz not null default now()
);

create index if not exists ads_sync_runs_ran_at_idx on public.ads_sync_runs (ran_at desc);

create table if not exists public.ad_insights_daily (
  id uuid primary key default gen_random_uuid(),
  metric_date date not null,
  level text not null check (level in ('account', 'campaign', 'adset', 'ad')),
  entity_id text not null,
  entity_name text,
  spend_cents integer not null default 0,
  impressions integer not null default 0,
  reach integer not null default 0,
  frequency numeric(10, 4),
  clicks integer not null default 0,
  ctr numeric(10, 4),
  cpc_cents integer,
  cpm_cents integer,
  leads integer not null default 0,
  cpl_cents integer,
  inline_link_clicks integer not null default 0,
  video_thruplay integer not null default 0,
  raw jsonb not null default '{}',
  created_at timestamptz not null default now(),
  unique (metric_date, level, entity_id)
);

create index if not exists ad_insights_daily_date_idx on public.ad_insights_daily (metric_date desc);
create index if not exists ad_insights_daily_level_idx on public.ad_insights_daily (level);

create table if not exists public.ad_breakdowns_daily (
  id uuid primary key default gen_random_uuid(),
  metric_date date not null,
  breakdown_type text not null
    check (breakdown_type in ('age', 'gender', 'publisher_platform', 'country', 'hour')),
  breakdown_key text not null,
  spend_cents integer not null default 0,
  impressions integer not null default 0,
  clicks integer not null default 0,
  ctr numeric(10, 4),
  leads integer not null default 0,
  raw jsonb not null default '{}',
  created_at timestamptz not null default now(),
  unique (metric_date, breakdown_type, breakdown_key)
);

create index if not exists ad_breakdowns_daily_date_idx on public.ad_breakdowns_daily (metric_date desc);

create table if not exists public.organic_media_snapshots (
  id uuid primary key default gen_random_uuid(),
  snapshot_date date not null,
  ig_media_id text not null,
  media_type text,
  media_product_type text,
  caption text,
  permalink text,
  thumbnail_url text,
  published_at timestamptz,
  like_count integer not null default 0,
  comments_count integer not null default 0,
  reach integer,
  views integer,
  saved integer,
  shares integer,
  score numeric(10, 2) not null default 0,
  boost_badge boolean not null default false,
  insights_available boolean not null default false,
  raw jsonb not null default '{}',
  created_at timestamptz not null default now(),
  unique (snapshot_date, ig_media_id)
);

create index if not exists organic_media_snapshots_date_idx on public.organic_media_snapshots (snapshot_date desc);
create index if not exists organic_media_snapshots_score_idx on public.organic_media_snapshots (score desc);

create table if not exists public.organic_account_snapshots (
  id uuid primary key default gen_random_uuid(),
  snapshot_date date not null unique,
  followers_count integer,
  media_count integer,
  profile_views integer,
  reach integer,
  website_clicks integer,
  insights_available boolean not null default false,
  missing_permission text,
  raw jsonb not null default '{}',
  created_at timestamptz not null default now()
);

commit;
