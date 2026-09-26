-- Stats organiques riches (Meta Business Suite-like) — additif
begin;

create table if not exists public.organic_account_daily (
  metric_date date primary key,
  views integer,
  reach integer,
  accounts_engaged integer,
  total_interactions integer,
  likes integer,
  comments integer,
  shares integer,
  saves integer,
  profile_views integer,
  website_clicks integer,
  profile_links_taps integer,
  follows integer,
  unfollows integer,
  follower_gain integer,
  raw jsonb not null default '{}',
  synced_at timestamptz not null default now()
);

create table if not exists public.organic_audience_demographics (
  id uuid primary key default gen_random_uuid(),
  snapshot_date date not null,
  audience text not null check (audience in ('follower', 'engaged', 'reached')),
  dimension text not null check (dimension in ('age', 'gender', 'country', 'city')),
  dimension_key text not null,
  value integer not null default 0,
  created_at timestamptz not null default now(),
  unique (snapshot_date, audience, dimension, dimension_key)
);

create index if not exists organic_audience_demographics_date_idx
  on public.organic_audience_demographics (snapshot_date desc);

alter table public.organic_media_snapshots add column if not exists total_interactions integer;
alter table public.organic_media_snapshots add column if not exists profile_visits integer;
alter table public.organic_media_snapshots add column if not exists follows integer;
alter table public.organic_media_snapshots add column if not exists avg_watch_time_ms integer;
alter table public.organic_media_snapshots add column if not exists total_watch_time_ms bigint;

alter table public.organic_account_daily enable row level security;
alter table public.organic_audience_demographics enable row level security;

commit;
