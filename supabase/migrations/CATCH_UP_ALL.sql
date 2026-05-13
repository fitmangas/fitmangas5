-- =============================================================================
-- FitMangas — rattrapage idempotent de toutes les migrations connues
-- À exécuter manuellement dans Supabase SQL Editor si l'historique CLI n'est pas
-- fiable. Le script vérifie/ajoute les objets manquants et peut être rejoué.
-- =============================================================================

create extension if not exists "pgcrypto";

-- Helpers de sécurité communs
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- 001_profiles.sql — profils liés à auth.users.
create table if not exists public.profiles (
  id uuid primary key references auth.users on delete cascade,
  first_name text,
  last_name text,
  role text not null default 'member' check (role in ('member', 'admin')),
  stripe_customer_id text,
  last_checkout_course_id text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.profiles enable row level security;
drop policy if exists "Lecture du profil par l’utilisateur" on public.profiles;
create policy "Lecture du profil par l’utilisateur" on public.profiles for select using (auth.uid() = id);
drop policy if exists "Mise à jour du profil par l’utilisateur" on public.profiles;
create policy "Mise à jour du profil par l’utilisateur" on public.profiles for update using (auth.uid() = id);

-- 002_access_control_calendar.sql — types, cours, abonnements, inscriptions, policies.
do $$ begin
  create type public.customer_tier as enum ('online_individual_monthly','online_group_monthly','onsite_group_single','onsite_individual_single');
exception when duplicate_object then null; end $$;
do $$ begin create type public.course_format as enum ('online','onsite'); exception when duplicate_object then null; end $$;
do $$ begin create type public.course_category as enum ('individual','group'); exception when duplicate_object then null; end $$;
do $$ begin create type public.access_level as enum ('full','preview','locked'); exception when duplicate_object then null; end $$;
do $$ begin create type public.subscription_status as enum ('active','past_due','canceled','paused','trialing'); exception when duplicate_object then null; end $$;
do $$ begin create type public.enrollment_status as enum ('booked','attended','canceled','waitlist'); exception when duplicate_object then null; end $$;

alter table public.profiles
  add column if not exists customer_tier public.customer_tier,
  add column if not exists onboarding_completed boolean not null default false;

create table if not exists public.courses (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  title text not null,
  description text,
  course_format public.course_format not null,
  course_category public.course_category not null,
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  timezone text not null default 'Europe/Paris',
  location text,
  live_url text,
  replay_url text,
  replay_external_id text,
  cover_image_url text,
  is_published boolean not null default true,
  auto_add_for_monthly boolean not null default false,
  created_by uuid references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.courses
  add column if not exists capacity_max integer,
  add column if not exists jitsi_link text,
  add column if not exists spotify_playlist_url text;
alter table public.courses drop constraint if exists courses_capacity_max_positive;
alter table public.courses add constraint courses_capacity_max_positive check (capacity_max is null or capacity_max > 0);
create index if not exists idx_courses_starts_at on public.courses(starts_at);
create index if not exists idx_courses_format_category on public.courses(course_format, course_category);
drop trigger if exists trg_courses_updated_at on public.courses;
create trigger trg_courses_updated_at before update on public.courses for each row execute function public.set_updated_at();

create table if not exists public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  tier public.customer_tier not null,
  status public.subscription_status not null default 'active',
  starts_at timestamptz not null default now(),
  ends_at timestamptz,
  price_cents integer not null default 0,
  currency text not null default 'eur',
  interval text not null default 'month',
  stripe_subscription_id text unique,
  stripe_customer_id text,
  auto_renews boolean not null default true,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists idx_subscriptions_user_status on public.subscriptions(user_id, status, ends_at);

create table if not exists public.enrollments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  course_id uuid not null references public.courses(id) on delete cascade,
  source text not null default 'single_purchase',
  status public.enrollment_status not null default 'booked',
  purchased_at timestamptz not null default now(),
  price_cents integer not null default 0,
  currency text not null default 'eur',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(user_id, course_id)
);
create index if not exists idx_enrollments_user_course on public.enrollments(user_id, course_id);
create index if not exists idx_enrollments_course on public.enrollments(course_id);

create table if not exists public.access_policies (
  id uuid primary key default gen_random_uuid(),
  tier public.customer_tier not null,
  course_format public.course_format not null,
  course_category public.course_category not null,
  access_level public.access_level not null,
  can_purchase_single boolean not null default false,
  upsell_tier public.customer_tier,
  cta_label text,
  cta_url text,
  note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(tier, course_format, course_category)
);

create table if not exists public.blocked_access_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete set null,
  course_id uuid references public.courses(id) on delete set null,
  tier public.customer_tier,
  reason text not null,
  context jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create or replace function public.current_customer_tier(target_user_id uuid)
returns public.customer_tier
language sql
stable
security definer
set search_path = public
as $$
  with active_sub as (
    select s.tier
    from public.subscriptions s
    where s.user_id = target_user_id
      and s.status in ('active', 'trialing')
      and (s.ends_at is null or s.ends_at > now())
    order by s.created_at desc
    limit 1
  )
  select coalesce((select tier from active_sub), (select p.customer_tier from public.profiles p where p.id = target_user_id));
$$;

create or replace function public.tier_is_online(t public.customer_tier)
returns boolean
language sql
immutable
as $$ select t in ('online_individual_monthly'::public.customer_tier, 'online_group_monthly'::public.customer_tier); $$;

create or replace function public.tier_is_onsite(t public.customer_tier)
returns boolean
language sql
immutable
as $$ select t in ('onsite_group_single'::public.customer_tier, 'onsite_individual_single'::public.customer_tier); $$;

create or replace function public.course_access_level(target_user_id uuid, target_course_id uuid)
returns public.access_level
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  user_tier public.customer_tier;
  enrollment_exists boolean;
  level public.access_level;
begin
  user_tier := public.current_customer_tier(target_user_id);
  if user_tier is null then return 'locked'; end if;
  select exists(select 1 from public.enrollments e where e.user_id = target_user_id and e.course_id = target_course_id and e.status in ('booked','attended')) into enrollment_exists;
  if enrollment_exists then return 'full'; end if;
  select ap.access_level into level
  from public.courses c
  join public.access_policies ap on ap.tier = user_tier and ap.course_format = c.course_format and ap.course_category = c.course_category
  where c.id = target_course_id;
  return coalesce(level, 'locked');
end;
$$;

alter table public.courses enable row level security;
alter table public.subscriptions enable row level security;
alter table public.enrollments enable row level security;
alter table public.access_policies enable row level security;
alter table public.blocked_access_logs enable row level security;

drop policy if exists "Users can read published courses" on public.courses;
create policy "Users can read published courses" on public.courses for select using (is_published = true and auth.uid() is not null);
drop policy if exists "Admins can manage courses" on public.courses;
create policy "Admins can manage courses" on public.courses for all using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin')) with check (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin'));
drop policy if exists "Users can read own subscriptions" on public.subscriptions;
create policy "Users can read own subscriptions" on public.subscriptions for select using (auth.uid() = user_id);
drop policy if exists "Admins can manage subscriptions" on public.subscriptions;
create policy "Admins can manage subscriptions" on public.subscriptions for all using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin')) with check (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin'));
drop policy if exists "Users can read own enrollments" on public.enrollments;
create policy "Users can read own enrollments" on public.enrollments for select using (auth.uid() = user_id);
drop policy if exists "Users can insert own enrollments" on public.enrollments;
create policy "Users can insert own enrollments" on public.enrollments for insert with check (auth.uid() = user_id);
drop policy if exists "Admins can manage enrollments" on public.enrollments;
create policy "Admins can manage enrollments" on public.enrollments for all using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin')) with check (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin'));
drop policy if exists "Authenticated users can read access policies" on public.access_policies;
create policy "Authenticated users can read access policies" on public.access_policies for select using (auth.uid() is not null);
drop policy if exists "Admins can manage access policies" on public.access_policies;
create policy "Admins can manage access policies" on public.access_policies for all using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin')) with check (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin'));
drop policy if exists "Users can insert own blocked logs" on public.blocked_access_logs;
create policy "Users can insert own blocked logs" on public.blocked_access_logs for insert with check (auth.uid() = user_id);
drop policy if exists "Admins can read blocked logs" on public.blocked_access_logs;
create policy "Admins can read blocked logs" on public.blocked_access_logs for select using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin'));

insert into public.access_policies (tier, course_format, course_category, access_level, can_purchase_single, upsell_tier, cta_label, cta_url, note) values
  ('online_individual_monthly','online','individual','full',false,null,null,null,'Accès abonnement individuel'),
  ('online_individual_monthly','online','group','locked',false,'online_group_monthly','Débloquer le collectif en ligne','/#offers','Upsell collectif online'),
  ('online_individual_monthly','onsite','group','preview',true,null,'Réserver en présentiel','/#offers','Peut acheter à l’unité'),
  ('online_individual_monthly','onsite','individual','preview',true,null,'Réserver en présentiel','/#offers','Peut acheter à l’unité'),
  ('online_group_monthly','online','group','full',false,null,null,null,'Accès abonnement collectif'),
  ('online_group_monthly','online','individual','locked',false,'online_individual_monthly','Débloquer l’individuel en ligne','/#offers','Upsell individuel online'),
  ('online_group_monthly','onsite','group','preview',true,null,'Réserver en présentiel','/#offers','Peut acheter à l’unité'),
  ('online_group_monthly','onsite','individual','preview',true,null,'Réserver en présentiel','/#offers','Peut acheter à l’unité'),
  ('onsite_group_single','online','group','preview',false,'online_group_monthly','Passer en abonnement mensuel','/#offers','Vue grisée incitative'),
  ('onsite_group_single','online','individual','preview',false,'online_individual_monthly','Passer en abonnement mensuel','/#offers','Vue grisée incitative'),
  ('onsite_group_single','onsite','group','preview',true,null,'Acheter à l’unité','/#offers','Accès full via enrollment'),
  ('onsite_group_single','onsite','individual','locked',false,'online_individual_monthly','Découvrir les abonnements','/#offers','Bloqué'),
  ('onsite_individual_single','online','individual','preview',false,'online_individual_monthly','Débloquer avec abonnement','/#offers','Vue grisée incitative'),
  ('onsite_individual_single','online','group','preview',false,'online_group_monthly','Débloquer avec abonnement','/#offers','Vue grisée incitative'),
  ('onsite_individual_single','onsite','individual','preview',true,null,'Acheter à l’unité','/#offers','Accès full via enrollment'),
  ('onsite_individual_single','onsite','group','preview',true,null,'Acheter collectif présentiel','/#offers','Achat unité autorisé')
on conflict (tier, course_format, course_category) do update
set access_level = excluded.access_level,
    can_purchase_single = excluded.can_purchase_single,
    upsell_tier = excluded.upsell_tier,
    cta_label = excluded.cta_label,
    cta_url = excluded.cta_url,
    note = excluded.note,
    updated_at = now();

-- 003_courses_capacity_max.sql — capacité max.
alter table public.courses add column if not exists capacity_max integer;
alter table public.courses drop column if exists capacity;

-- 004_courses_jitsi_link.sql — lien Jitsi.
alter table public.courses add column if not exists jitsi_link text;

-- 005_video_recordings.sql — replays Vimeo attachés aux cours.
create table if not exists public.video_recordings (
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null references public.courses(id) on delete cascade,
  vimeo_video_id text not null unique,
  vimeo_uri text,
  title text,
  description text,
  embed_url text,
  thumbnail_url text,
  duration_seconds integer,
  privacy_view text not null default 'unlisted',
  upload_status text not null default 'uploading',
  is_ready boolean not null default false,
  available_at timestamptz,
  metadata jsonb not null default '{}'::jsonb,
  created_by uuid references public.profiles(id) on delete set null,
  view_count bigint not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists idx_video_recordings_course_id on public.video_recordings(course_id);
create index if not exists idx_video_recordings_ready_available on public.video_recordings(is_ready, available_at);
alter table public.video_recordings enable row level security;
drop policy if exists "Users can read unlocked replays" on public.video_recordings;
create policy "Users can read unlocked replays" on public.video_recordings for select using (auth.uid() is not null and is_ready = true and exists (select 1 from public.courses c where c.id = course_id and c.is_published = true and c.ends_at < now()) and public.course_access_level(auth.uid(), course_id) = 'full');
drop policy if exists "Admins can manage video recordings" on public.video_recordings;
create policy "Admins can manage video recordings" on public.video_recordings for all using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin')) with check (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin'));

-- 006_cockpit_admin.sql — codes promo + compteur vues replay.
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
alter table public.promo_codes enable row level security;
drop policy if exists "Admins manage promo codes" on public.promo_codes;
create policy "Admins manage promo codes" on public.promo_codes for all using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin')) with check (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin'));
create or replace function public.increment_replay_view(p_recording_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$ begin update public.video_recordings set view_count = view_count + 1 where id = p_recording_id; end; $$;
grant execute on function public.increment_replay_view(uuid) to authenticated;

-- 007_client_premium.sql — favoris/progression replay, notifications, avatars.
alter table public.profiles add column if not exists avatar_url text;
create table if not exists public.replay_favorites (
  user_id uuid not null references public.profiles(id) on delete cascade,
  recording_id uuid not null references public.video_recordings(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, recording_id)
);
create table if not exists public.replay_playback_progress (
  user_id uuid not null references public.profiles(id) on delete cascade,
  recording_id uuid not null references public.video_recordings(id) on delete cascade,
  position_seconds integer not null default 0 check (position_seconds >= 0 and position_seconds <= 864000),
  updated_at timestamptz not null default now(),
  primary key (user_id, recording_id)
);
create table if not exists public.user_notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  kind text not null,
  title text not null,
  body text,
  read_at timestamptz,
  created_at timestamptz not null default now()
);
create index if not exists idx_user_notifications_user_created on public.user_notifications(user_id, created_at desc);
alter table public.replay_favorites enable row level security;
alter table public.replay_playback_progress enable row level security;
alter table public.user_notifications enable row level security;
drop policy if exists "Users manage own replay favorites" on public.replay_favorites;
create policy "Users manage own replay favorites" on public.replay_favorites for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
drop policy if exists "Users read own replay progress" on public.replay_playback_progress;
create policy "Users read own replay progress" on public.replay_playback_progress for select using (auth.uid() = user_id);
drop policy if exists "Users read own notifications" on public.user_notifications;
create policy "Users read own notifications" on public.user_notifications for select using (auth.uid() = user_id);
drop policy if exists "Users update own notifications" on public.user_notifications;
create policy "Users update own notifications" on public.user_notifications for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

create or replace function public.upsert_replay_progress(p_recording_id uuid, p_seconds integer)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then raise exception 'not authenticated'; end if;
  insert into public.replay_playback_progress (user_id, recording_id, position_seconds, updated_at)
  values (auth.uid(), p_recording_id, least(greatest(coalesce(p_seconds, 0), 0), 864000), now())
  on conflict (user_id, recording_id) do update set position_seconds = excluded.position_seconds, updated_at = now();
end;
$$;
grant execute on function public.upsert_replay_progress(uuid, integer) to authenticated;

-- 008_automation_gamification.sql — gamification, naissance, visites live.
alter table public.profiles
  add column if not exists birth_date date,
  add column if not exists gamification_points integer not null default 0,
  add column if not exists gamification_grade text not null default 'debutant',
  add column if not exists onsite_presence_count integer not null default 0,
  add column if not exists total_replay_watch_seconds bigint not null default 0,
  add column if not exists live_visit_count integer not null default 0;
create table if not exists public.live_course_daily_visits (
  user_id uuid not null references public.profiles(id) on delete cascade,
  course_id uuid not null references public.courses(id) on delete cascade,
  visit_date date not null,
  created_at timestamptz not null default now(),
  primary key (user_id, course_id, visit_date)
);
alter table public.live_course_daily_visits enable row level security;
create or replace function public.record_live_course_visit(p_course_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$ begin
  if auth.uid() is null then raise exception 'not authenticated'; end if;
  insert into public.live_course_daily_visits (user_id, course_id, visit_date)
  values (auth.uid(), p_course_id, (timezone('Europe/Paris', now()))::date)
  on conflict (user_id, course_id, visit_date) do nothing;
end; $$;
grant execute on function public.record_live_course_visit(uuid) to authenticated;

-- 009_business_stats_daily.sql — snapshots KPI admin.
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
create index if not exists idx_business_stats_daily_date_desc on public.business_stats_daily(stat_date desc);

-- 010/011/012/018/020 — bibliothèque Vimeo standalone, dossiers, programmation, favoris, masquage.
create table if not exists public.standalone_vimeo_videos (
  id uuid primary key default gen_random_uuid(),
  vimeo_video_id text not null unique,
  vimeo_uri text,
  title text,
  description text,
  thumbnail_url text,
  duration_seconds integer,
  embed_url text,
  validation_status text not null default 'pending',
  published_at timestamptz,
  webhook_payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.standalone_vimeo_videos
  add column if not exists vimeo_folder_name text,
  add column if not exists scheduled_publication_at timestamptz,
  add column if not exists rejection_reason text,
  add column if not exists coach_id uuid references public.profiles(id) on delete set null,
  add column if not exists is_hidden boolean not null default false,
  add column if not exists hidden_at timestamptz;
alter table public.standalone_vimeo_videos drop constraint if exists standalone_vimeo_validation_chk;
alter table public.standalone_vimeo_videos add constraint standalone_vimeo_validation_chk check (validation_status in ('pending','scheduled','published','rejected'));
create index if not exists idx_standalone_vimeo_status_created on public.standalone_vimeo_videos(validation_status, created_at desc);
create index if not exists idx_standalone_vimeo_folder_name on public.standalone_vimeo_videos(vimeo_folder_name);
create index if not exists idx_standalone_vimeo_scheduled_at on public.standalone_vimeo_videos(scheduled_publication_at) where scheduled_publication_at is not null;
create index if not exists idx_standalone_vimeo_visible_published on public.standalone_vimeo_videos(published_at desc) where validation_status = 'published' and is_hidden = false;
alter table public.standalone_vimeo_videos enable row level security;
drop policy if exists "Admins manage standalone vimeo videos" on public.standalone_vimeo_videos;
create policy "Admins manage standalone vimeo videos" on public.standalone_vimeo_videos for all using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin')) with check (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin'));
drop policy if exists "Online subscribers read published standalone videos" on public.standalone_vimeo_videos;
create policy "Online subscribers read published standalone videos" on public.standalone_vimeo_videos for select using (validation_status = 'published' and is_hidden = false and auth.uid() is not null and public.tier_is_online(public.current_customer_tier(auth.uid())));

create table if not exists public.standalone_vimeo_favorites (
  id uuid primary key default gen_random_uuid(),
  video_id uuid not null references public.standalone_vimeo_videos(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique(video_id, user_id)
);
alter table public.standalone_vimeo_favorites enable row level security;
drop policy if exists "standalone_vimeo_favorites_select_own" on public.standalone_vimeo_favorites;
create policy "standalone_vimeo_favorites_select_own" on public.standalone_vimeo_favorites for select to authenticated using (auth.uid() = user_id);
drop policy if exists "standalone_vimeo_favorites_insert_own" on public.standalone_vimeo_favorites;
create policy "standalone_vimeo_favorites_insert_own" on public.standalone_vimeo_favorites for insert to authenticated with check (auth.uid() = user_id);
drop policy if exists "standalone_vimeo_favorites_delete_own" on public.standalone_vimeo_favorites;
create policy "standalone_vimeo_favorites_delete_own" on public.standalone_vimeo_favorites for delete to authenticated using (auth.uid() = user_id);

-- 013/014 — sync calendrier et éligibilité feed.
alter table public.profiles
  add column if not exists calendar_sync_enabled boolean not null default false,
  add column if not exists calendar_sync_token text unique;
create or replace function public.customer_calendar_feed_eligible(target_user_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$ select public.current_customer_tier(target_user_id) is not null or exists (select 1 from public.enrollments e join public.courses c on c.id = e.course_id where e.user_id = target_user_id and e.status in ('booked','attended') and c.ends_at > now()); $$;
grant execute on function public.customer_calendar_feed_eligible(uuid) to authenticated;
grant execute on function public.customer_calendar_feed_eligible(uuid) to service_role;

-- 015/016/017/022 — blog, favoris, double opt-in, logs, RLS visio.
alter table public.profiles add column if not exists preferred_blog_language text not null default 'fr';
do $$ begin create type public.blog_article_status as enum ('draft','validated','published','archived'); exception when duplicate_object then null; end $$;
create table if not exists public.blog_categories (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  label_fr text not null,
  label_en text,
  label_es text,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);
create table if not exists public.blog_articles (
  id uuid primary key default gen_random_uuid(),
  coach_id uuid not null references public.profiles(id) on delete restrict,
  title_fr text not null,
  title_en text,
  title_es text,
  slug_fr text not null,
  slug_en text,
  slug_es text,
  description_fr text,
  description_en text,
  description_es text,
  content_fr text not null,
  content_en text,
  content_es text,
  featured_image_url text,
  category_id uuid references public.blog_categories(id) on delete set null,
  scheduled_publication_at timestamptz not null,
  published_at timestamptz,
  status public.blog_article_status not null default 'draft',
  coach_notes text,
  view_count integer not null default 0,
  average_rating numeric(3, 2),
  rating_count integer not null default 0,
  average_scroll_percentage integer not null default 0,
  average_time_spent_seconds integer not null default 0,
  share_count integer not null default 0,
  seo_keywords text,
  meta_description_fr text,
  meta_description_en text,
  meta_description_es text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create unique index if not exists idx_blog_articles_slug_fr on public.blog_articles(slug_fr);
create unique index if not exists idx_blog_articles_slug_en on public.blog_articles(slug_en) where slug_en is not null;
create unique index if not exists idx_blog_articles_slug_es on public.blog_articles(slug_es) where slug_es is not null;
create index if not exists idx_blog_articles_status on public.blog_articles(status);
create index if not exists idx_blog_articles_published_at on public.blog_articles(published_at desc);

create table if not exists public.blog_article_ratings (
  id uuid primary key default gen_random_uuid(),
  article_id uuid not null references public.blog_articles(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  rating integer not null check (rating >= 1 and rating <= 5),
  comment text,
  rated_at timestamptz not null default now(),
  unique(article_id, user_id)
);
create table if not exists public.blog_article_translations (
  id uuid primary key default gen_random_uuid(),
  article_id uuid not null references public.blog_articles(id) on delete cascade,
  language text not null check (language in ('fr','en','es')),
  title text not null,
  description text,
  content text not null,
  meta_description text,
  slug text,
  auto_translated boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(article_id, language)
);
create table if not exists public.blog_scroll_tracking (
  id uuid primary key default gen_random_uuid(),
  article_id uuid not null references public.blog_articles(id) on delete cascade,
  user_id uuid references public.profiles(id) on delete set null,
  scroll_percentage_max integer,
  time_spent_seconds integer not null default 0,
  device_type text,
  traffic_source text,
  tracked_at timestamptz not null default now()
);
create table if not exists public.blog_heatmap_data (
  id uuid primary key default gen_random_uuid(),
  article_id uuid not null references public.blog_articles(id) on delete cascade,
  section_bucket integer not null,
  scroll_hits integer not null default 0,
  average_time_spent_seconds integer not null default 0,
  updated_at timestamptz not null default now(),
  unique(article_id, section_bucket)
);
create table if not exists public.newsletter_subscriptions (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  coach_id uuid not null references public.profiles(id) on delete cascade,
  subscribed_from_article_id uuid references public.blog_articles(id) on delete set null,
  confirmed boolean not null default false,
  confirmed_at timestamptz,
  unsubscribed boolean not null default false,
  subscribed_at timestamptz not null default now(),
  unique(email, coach_id)
);
create table if not exists public.admin_article_validations (
  id uuid primary key default gen_random_uuid(),
  article_id uuid not null references public.blog_articles(id) on delete cascade,
  coach_id uuid not null references public.profiles(id) on delete cascade,
  month_year text not null,
  status text not null default 'pending',
  validated_at timestamptz,
  notes text,
  created_at timestamptz not null default now(),
  unique(article_id, month_year)
);
create table if not exists public.blog_article_favorites (
  id uuid primary key default gen_random_uuid(),
  article_id uuid not null references public.blog_articles(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique(article_id, user_id)
);
create table if not exists public.newsletter_confirmation_tokens (
  id uuid primary key default gen_random_uuid(),
  subscription_id uuid not null references public.newsletter_subscriptions(id) on delete cascade,
  token text not null unique,
  expires_at timestamptz not null,
  used_at timestamptz,
  created_at timestamptz not null default now()
);
create table if not exists public.blog_publication_events (
  id uuid primary key default gen_random_uuid(),
  article_id uuid not null references public.blog_articles(id) on delete cascade unique,
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
  status text not null check (status in ('ok','error')),
  message text,
  meta jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

alter table public.blog_categories enable row level security;
alter table public.blog_articles enable row level security;
alter table public.blog_article_ratings enable row level security;
alter table public.blog_scroll_tracking enable row level security;
alter table public.blog_article_favorites enable row level security;
alter table public.newsletter_confirmation_tokens enable row level security;
alter table public.blog_publication_events enable row level security;
alter table public.blog_cron_logs enable row level security;
drop policy if exists "blog_categories_read_all" on public.blog_categories;
create policy "blog_categories_read_all" on public.blog_categories for select to anon, authenticated using (true);
drop policy if exists "blog_articles_read_published" on public.blog_articles;
create policy "blog_articles_read_published" on public.blog_articles for select to authenticated using (status = 'published'::public.blog_article_status and (public.tier_is_online(public.current_customer_tier(auth.uid())) or exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin')));
drop policy if exists "blog_favorites_select_own" on public.blog_article_favorites;
create policy "blog_favorites_select_own" on public.blog_article_favorites for select to authenticated using (auth.uid() = user_id);
drop policy if exists "blog_favorites_insert_own" on public.blog_article_favorites;
create policy "blog_favorites_insert_own" on public.blog_article_favorites for insert to authenticated with check (auth.uid() = user_id);
drop policy if exists "blog_favorites_delete_own" on public.blog_article_favorites;
create policy "blog_favorites_delete_own" on public.blog_article_favorites for delete to authenticated using (auth.uid() = user_id);

-- 019_printful_product_sort_order.sql — tri produits boutique.
create table if not exists public.printful_product_sort_order (
  product_id bigint primary key,
  sort_order integer not null default 1000,
  updated_at timestamptz not null default now()
);
create index if not exists printful_product_sort_order_sort_order_idx on public.printful_product_sort_order(sort_order asc);

-- 20260430143000_phase1_comms_foundation.sql — préférences/logs/caps/push.
alter table public.profiles
  add column if not exists preferred_locale text not null default 'fr',
  add column if not exists display_timezone text not null default 'Europe/Paris',
  add column if not exists display_timezone_manual_locked boolean not null default false,
  add column if not exists marketing_email_opt_in boolean not null default false,
  add column if not exists marketing_email_opt_in_at timestamptz;
create table if not exists public.notification_log (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete set null,
  event_type text not null,
  channel text not null default 'log',
  payload jsonb not null default '{}'::jsonb,
  idempotency_key text unique,
  created_at timestamptz not null default now()
);
create table if not exists public.notification_digest_queue (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  digest_bucket text not null,
  payload jsonb not null default '{}'::jsonb,
  scheduled_for timestamptz not null,
  processed_at timestamptz,
  created_at timestamptz not null default now()
);
create table if not exists public.notification_preferences (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  courses_inapp_enabled boolean not null default true,
  courses_email_enabled boolean not null default true,
  courses_push_enabled boolean not null default false,
  content_inapp_enabled boolean not null default true,
  content_email_enabled boolean not null default false,
  content_push_enabled boolean not null default false,
  shop_inapp_enabled boolean not null default true,
  shop_email_enabled boolean not null default true,
  shop_push_enabled boolean not null default false,
  community_inapp_enabled boolean not null default true,
  community_email_enabled boolean not null default true,
  community_push_enabled boolean not null default false,
  silence_mode_enabled boolean not null default false,
  digest_frequency text not null default 'off',
  updated_at timestamptz not null default now()
);
create table if not exists public.push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  endpoint text not null,
  p256dh text not null,
  auth text not null,
  user_agent text,
  created_at timestamptz not null default now(),
  unique(user_id, endpoint)
);
create table if not exists public.notification_frequency_cap (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  channel text not null,
  scope_key text not null,
  sent_count integer not null default 0,
  window_expires_at timestamptz not null,
  updated_at timestamptz not null default now(),
  unique(user_id, channel, scope_key)
);
alter table public.notification_log enable row level security;
alter table public.notification_digest_queue enable row level security;
alter table public.notification_preferences enable row level security;
alter table public.push_subscriptions enable row level security;
alter table public.notification_frequency_cap enable row level security;
drop policy if exists "notification_log_deny_authenticated" on public.notification_log;
create policy "notification_log_deny_authenticated" on public.notification_log for all to authenticated using (false) with check (false);
drop policy if exists "notification_digest_queue_deny_authenticated" on public.notification_digest_queue;
create policy "notification_digest_queue_deny_authenticated" on public.notification_digest_queue for all to authenticated using (false) with check (false);
drop policy if exists "notification_preferences_select_own" on public.notification_preferences;
create policy "notification_preferences_select_own" on public.notification_preferences for select to authenticated using (auth.uid() = user_id);
drop policy if exists "notification_preferences_update_own" on public.notification_preferences;
create policy "notification_preferences_update_own" on public.notification_preferences for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
drop policy if exists "push_subs_own_select" on public.push_subscriptions;
create policy "push_subs_own_select" on public.push_subscriptions for select to authenticated using (auth.uid() = user_id);
drop policy if exists "push_subs_own_insert" on public.push_subscriptions;
create policy "push_subs_own_insert" on public.push_subscriptions for insert to authenticated with check (auth.uid() = user_id);
drop policy if exists "push_subs_own_delete" on public.push_subscriptions;
create policy "push_subs_own_delete" on public.push_subscriptions for delete to authenticated using (auth.uid() = user_id);
drop policy if exists "notification_frequency_cap_deny_authenticated" on public.notification_frequency_cap;
create policy "notification_frequency_cap_deny_authenticated" on public.notification_frequency_cap for all to authenticated using (false) with check (false);

-- 20260430210000_try_reserve_email_slot.sql — réservation atomique cap email.
create or replace function public.try_reserve_email_slot(p_user_id uuid, p_scope_key text, p_max integer)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare v_dummy int;
begin
  update public.notification_frequency_cap set sent_count = sent_count + 1, updated_at = now(), window_expires_at = now() + interval '25 hours'
  where user_id = p_user_id and channel = 'email' and scope_key = p_scope_key and sent_count < p_max returning sent_count into v_dummy;
  if found then return true; end if;
  begin
    insert into public.notification_frequency_cap(user_id, channel, scope_key, sent_count, window_expires_at, updated_at)
    values (p_user_id, 'email', p_scope_key, 1, now() + interval '25 hours', now());
    return true;
  exception when unique_violation then
    update public.notification_frequency_cap set sent_count = sent_count + 1, updated_at = now(), window_expires_at = now() + interval '25 hours'
    where user_id = p_user_id and channel = 'email' and scope_key = p_scope_key and sent_count < p_max returning sent_count into v_dummy;
    return found;
  end;
end;
$$;
grant execute on function public.try_reserve_email_slot(uuid, text, integer) to service_role;

-- 20260501120000_ensure_notification_prefs_row.sql — garantit les préférences.
create or replace function public.ensure_notification_prefs_row(p_user_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$ begin
  insert into public.notification_preferences(user_id) values (p_user_id) on conflict (user_id) do nothing;
end; $$;
grant execute on function public.ensure_notification_prefs_row(uuid) to authenticated;
grant execute on function public.ensure_notification_prefs_row(uuid) to service_role;

-- 20260510120000_enable_realtime_user_notifications.sql — publication realtime.
do $$
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime')
     and not exists (
       select 1 from pg_publication_tables
       where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'user_notifications'
     ) then
    alter publication supabase_realtime add table public.user_notifications;
  end if;
end $$;

-- 20260510130000_signup_locale_timezone_detection.sql — trigger signup locale/fuseau.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  bd date;
  detected_locale text;
  detected_timezone text;
begin
  begin bd := nullif(trim(coalesce(new.raw_user_meta_data->>'birth_date', '')), '')::date; exception when others then bd := null; end;
  detected_locale := lower(nullif(trim(coalesce(new.raw_user_meta_data->>'preferred_locale', '')), ''));
  if detected_locale not in ('fr', 'es') then detected_locale := 'fr'; end if;
  detected_timezone := nullif(trim(coalesce(new.raw_user_meta_data->>'display_timezone', '')), '');
  if detected_timezone is null then detected_timezone := 'Europe/Paris'; end if;
  insert into public.profiles(id, first_name, last_name, birth_date, preferred_locale, display_timezone, display_timezone_manual_locked)
  values (new.id, coalesce(new.raw_user_meta_data->>'first_name', ''), coalesce(new.raw_user_meta_data->>'last_name', ''), bd, detected_locale, detected_timezone, false)
  on conflict (id) do nothing;
  return new;
end;
$$;
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users for each row execute function public.handle_new_user();

-- 20260510170000_stripe_events_idempotency.sql + 021_launch_security_rls.sql.
create table if not exists public.stripe_events (
  id text primary key,
  type text not null,
  received_at timestamptz not null default now()
);
alter table public.stripe_events enable row level security;
drop policy if exists "Deny client access to stripe events" on public.stripe_events;
create policy "Deny client access to stripe events" on public.stripe_events for all using (false) with check (false);
alter table public.business_stats_daily enable row level security;
drop policy if exists "Admins read business stats daily" on public.business_stats_daily;
create policy "Admins read business stats daily" on public.business_stats_daily for select using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin'));

-- 020_vimeo_granular_sync_hidden.sql — état de sync Vimeo.
create table if not exists public.app_sync_state (
  key text primary key,
  last_success_at timestamptz,
  updated_at timestamptz not null default now()
);
alter table public.app_sync_state enable row level security;
drop policy if exists "Admins manage app sync state" on public.app_sync_state;
create policy "Admins manage app sync state" on public.app_sync_state for all using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin')) with check (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin'));

-- Backfills légers nécessaires si des profils existaient avant Phase 1.
insert into public.notification_preferences(user_id)
select p.id from public.profiles p
where not exists (select 1 from public.notification_preferences np where np.user_id = p.id)
on conflict (user_id) do nothing;

-- Fin du rattrapage.
