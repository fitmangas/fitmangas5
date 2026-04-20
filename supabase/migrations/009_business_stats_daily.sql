-- Snapshots business quotidiens pour le dashboard admin.

create table if not exists public.business_stats_daily (
  stat_date date primary key,
  mrr_eur numeric(12, 2) not null default 0,
  active_subscribers integer not null default 0,
  new_subscribers_30d integer not null default 0,
  unsubscribed_30d integer not null default 0,
  churn_rate_30d numeric(6, 2) not null default 0,
  replay_completion_rate_30d numeric(6, 2) not null default 0,
  live_show_up_rate_30d numeric(6, 2) not null default 0,
  health_green_count integer not null default 0,
  health_orange_count integer not null default 0,
  health_red_count integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_business_stats_daily_date_desc
  on public.business_stats_daily(stat_date desc);

drop trigger if exists trg_business_stats_daily_updated_at on public.business_stats_daily;
create trigger trg_business_stats_daily_updated_at
before update on public.business_stats_daily
for each row execute function public.set_updated_at();

comment on table public.business_stats_daily is 'Snapshot quotidien des métriques business (MRR, churn, engagement, santé client).';

create or replace function public.refresh_business_stats_daily(p_stat_date date default (now() at time zone 'utc')::date)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  day_start timestamptz := p_stat_date::timestamptz;
  mrr numeric := 0;
  active_count integer := 0;
  new_subs_30d integer := 0;
  unsubs_30d integer := 0;
  churn_30d numeric := 0;
  replay_completion_30d numeric := 0;
  live_show_up_30d numeric := 0;
  health_green integer := 0;
  health_orange integer := 0;
  health_red integer := 0;
begin
  -- MRR + abonnés actifs (source DB).
  select
    coalesce(sum(
      case
        when s.interval = 'year' then round(coalesce(s.price_cents, 0)::numeric / 12)
        else coalesce(s.price_cents, 0)::numeric
      end
    ) / 100, 0),
    count(distinct s.user_id)
  into mrr, active_count
  from public.subscriptions s
  where s.status in ('active', 'trialing')
    and (s.ends_at is null or s.ends_at > day_start);

  -- Entrées / sorties 30 jours.
  select count(*)
  into new_subs_30d
  from public.subscriptions s
  where s.created_at >= (day_start - interval '30 days')
    and s.created_at < day_start + interval '1 day';

  select count(*)
  into unsubs_30d
  from public.subscriptions s
  where s.status = 'canceled'
    and s.updated_at >= (day_start - interval '30 days')
    and s.updated_at < day_start + interval '1 day';

  if active_count > 0 then
    churn_30d := round((unsubs_30d::numeric / active_count::numeric) * 100, 2);
  else
    churn_30d := 0;
  end if;

  -- Completion replay 30 jours.
  select coalesce(round(avg(
    least(greatest(rp.position_seconds::numeric / nullif(vr.duration_seconds::numeric, 0), 0), 1)
  ) * 100, 2), 0)
  into replay_completion_30d
  from public.replay_playback_progress rp
  join public.video_recordings vr on vr.id = rp.recording_id
  where rp.updated_at >= (day_start - interval '30 days')
    and rp.updated_at < day_start + interval '1 day'
    and vr.duration_seconds is not null
    and vr.duration_seconds > 0;

  -- Show-up live (online) 30 jours.
  with enrolls as (
    select e.status
    from public.enrollments e
    join public.courses c on c.id = e.course_id
    where c.course_format = 'online'
      and c.starts_at >= (day_start - interval '30 days')
      and c.starts_at < day_start + interval '1 day'
      and e.status in ('booked', 'attended')
  )
  select coalesce(round(
    (count(*) filter (where status = 'attended'))::numeric
    / nullif(count(*)::numeric, 0) * 100, 2
  ), 0)
  into live_show_up_30d
  from enrolls;

  -- Health score : vert (<4j), orange (4-10j), rouge (>10j sans session).
  with member_ids as (
    select p.id
    from public.profiles p
    where p.role = 'member'
  ),
  last_live as (
    select e.user_id, max(c.starts_at) as last_live_at
    from public.enrollments e
    join public.courses c on c.id = e.course_id
    where e.status = 'attended'
    group by e.user_id
  ),
  last_replay as (
    select rp.user_id, max(rp.updated_at) as last_replay_at
    from public.replay_playback_progress rp
    group by rp.user_id
  ),
  merged as (
    select
      m.id as user_id,
      greatest(
        coalesce(ll.last_live_at, 'epoch'::timestamptz),
        coalesce(lr.last_replay_at, 'epoch'::timestamptz)
      ) as last_activity_at
    from member_ids m
    left join last_live ll on ll.user_id = m.id
    left join last_replay lr on lr.user_id = m.id
  )
  select
    count(*) filter (where last_activity_at >= (day_start - interval '4 days')),
    count(*) filter (
      where last_activity_at < (day_start - interval '4 days')
        and last_activity_at >= (day_start - interval '10 days')
    ),
    count(*) filter (where last_activity_at < (day_start - interval '10 days'))
  into health_green, health_orange, health_red
  from merged;

  insert into public.business_stats_daily (
    stat_date,
    mrr_eur,
    active_subscribers,
    new_subscribers_30d,
    unsubscribed_30d,
    churn_rate_30d,
    replay_completion_rate_30d,
    live_show_up_rate_30d,
    health_green_count,
    health_orange_count,
    health_red_count
  )
  values (
    p_stat_date,
    coalesce(mrr, 0),
    coalesce(active_count, 0),
    coalesce(new_subs_30d, 0),
    coalesce(unsubs_30d, 0),
    coalesce(churn_30d, 0),
    coalesce(replay_completion_30d, 0),
    coalesce(live_show_up_30d, 0),
    coalesce(health_green, 0),
    coalesce(health_orange, 0),
    coalesce(health_red, 0)
  )
  on conflict (stat_date) do update
  set
    mrr_eur = excluded.mrr_eur,
    active_subscribers = excluded.active_subscribers,
    new_subscribers_30d = excluded.new_subscribers_30d,
    unsubscribed_30d = excluded.unsubscribed_30d,
    churn_rate_30d = excluded.churn_rate_30d,
    replay_completion_rate_30d = excluded.replay_completion_rate_30d,
    live_show_up_rate_30d = excluded.live_show_up_rate_30d,
    health_green_count = excluded.health_green_count,
    health_orange_count = excluded.health_orange_count,
    health_red_count = excluded.health_red_count,
    updated_at = now();
end;
$$;

grant execute on function public.refresh_business_stats_daily(date) to service_role;
