-- post_metrics : snapshots IG Insights pour la boucle performance CM
-- GO Kevin 2026-07-28 — création seule, aucun ALTER sur tables existantes

begin;

create table if not exists public.post_metrics (
  id uuid primary key default gen_random_uuid(),
  post_id text not null,
  ig_media_id text,
  permalink text,
  published_at timestamptz,
  reach integer,
  saved integer,
  shares integer,
  views integer,
  avg_watch_time numeric,
  fetched_at timestamptz not null default now(),
  locale text,
  format text,
  pilier text,
  hook text,
  image_source text
);

create unique index if not exists post_metrics_post_fetched_uidx
  on public.post_metrics (post_id, fetched_at);

create index if not exists post_metrics_pilier_format_idx
  on public.post_metrics (pilier, format);

alter table public.post_metrics enable row level security;

revoke all on public.post_metrics from anon, authenticated;
grant all on public.post_metrics to service_role;

comment on table public.post_metrics is
  'Snapshots IG Insights liés aux posts CM (admin_settings social_comms_board).';

commit;
