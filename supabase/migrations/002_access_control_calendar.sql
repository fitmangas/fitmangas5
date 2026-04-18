-- Phase 1: matrice d'accès + calendrier intelligent.
-- Cette migration s'appuie sur public.profiles créée en 001_profiles.sql.

create extension if not exists "pgcrypto";

create type public.customer_tier as enum (
  'online_individual_monthly',
  'online_group_monthly',
  'onsite_group_single',
  'onsite_individual_single'
);

create type public.course_format as enum ('online', 'onsite');
create type public.course_category as enum ('individual', 'group');
create type public.access_level as enum ('full', 'preview', 'locked');
create type public.subscription_status as enum ('active', 'past_due', 'canceled', 'paused', 'trialing');
create type public.enrollment_status as enum ('booked', 'attended', 'canceled', 'waitlist');

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
  capacity integer,
  location text,
  live_url text,
  replay_url text,
  replay_external_id text,
  cover_image_url text,
  is_published boolean not null default true,
  auto_add_for_monthly boolean not null default false,
  created_by uuid references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint courses_ends_after_starts check (ends_at > starts_at),
  constraint courses_capacity_positive check (capacity is null or capacity > 0)
);

create index if not exists idx_courses_starts_at on public.courses(starts_at);
create index if not exists idx_courses_format_category on public.courses(course_format, course_category);

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
  updated_at timestamptz not null default now(),
  constraint subscriptions_price_non_negative check (price_cents >= 0),
  constraint subscriptions_interval check (interval in ('month', 'year'))
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
  unique(user_id, course_id),
  constraint enrollments_price_non_negative check (price_cents >= 0)
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

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_courses_updated_at on public.courses;
create trigger trg_courses_updated_at
before update on public.courses
for each row execute function public.set_updated_at();

drop trigger if exists trg_subscriptions_updated_at on public.subscriptions;
create trigger trg_subscriptions_updated_at
before update on public.subscriptions
for each row execute function public.set_updated_at();

drop trigger if exists trg_enrollments_updated_at on public.enrollments;
create trigger trg_enrollments_updated_at
before update on public.enrollments
for each row execute function public.set_updated_at();

drop trigger if exists trg_access_policies_updated_at on public.access_policies;
create trigger trg_access_policies_updated_at
before update on public.access_policies
for each row execute function public.set_updated_at();

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
  select coalesce(
    (select tier from active_sub),
    (select p.customer_tier from public.profiles p where p.id = target_user_id)
  );
$$;

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
  if user_tier is null then
    return 'locked';
  end if;

  select exists(
    select 1
    from public.enrollments e
    where e.user_id = target_user_id
      and e.course_id = target_course_id
      and e.status in ('booked', 'attended')
  ) into enrollment_exists;

  if enrollment_exists then
    return 'full';
  end if;

  select ap.access_level
    into level
  from public.courses c
  join public.access_policies ap
    on ap.tier = user_tier
   and ap.course_format = c.course_format
   and ap.course_category = c.course_category
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
create policy "Users can read published courses"
  on public.courses
  for select
  using (is_published = true and auth.uid() is not null);

drop policy if exists "Admins can manage courses" on public.courses;
create policy "Admins can manage courses"
  on public.courses
  for all
  using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid()
        and p.role = 'admin'
    )
  )
  with check (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid()
        and p.role = 'admin'
    )
  );

drop policy if exists "Users can read own subscriptions" on public.subscriptions;
create policy "Users can read own subscriptions"
  on public.subscriptions
  for select
  using (auth.uid() = user_id);

drop policy if exists "Admins can manage subscriptions" on public.subscriptions;
create policy "Admins can manage subscriptions"
  on public.subscriptions
  for all
  using (
    exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin')
  )
  with check (
    exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin')
  );

drop policy if exists "Users can read own enrollments" on public.enrollments;
create policy "Users can read own enrollments"
  on public.enrollments
  for select
  using (auth.uid() = user_id);

drop policy if exists "Users can insert own enrollments" on public.enrollments;
create policy "Users can insert own enrollments"
  on public.enrollments
  for insert
  with check (auth.uid() = user_id);

drop policy if exists "Admins can manage enrollments" on public.enrollments;
create policy "Admins can manage enrollments"
  on public.enrollments
  for all
  using (
    exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin')
  )
  with check (
    exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin')
  );

drop policy if exists "Authenticated users can read access policies" on public.access_policies;
create policy "Authenticated users can read access policies"
  on public.access_policies
  for select
  using (auth.uid() is not null);

drop policy if exists "Admins can manage access policies" on public.access_policies;
create policy "Admins can manage access policies"
  on public.access_policies
  for all
  using (
    exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin')
  )
  with check (
    exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin')
  );

drop policy if exists "Users can insert own blocked logs" on public.blocked_access_logs;
create policy "Users can insert own blocked logs"
  on public.blocked_access_logs
  for insert
  with check (auth.uid() = user_id);

drop policy if exists "Admins can read blocked logs" on public.blocked_access_logs;
create policy "Admins can read blocked logs"
  on public.blocked_access_logs
  for select
  using (
    exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin')
  );

insert into public.access_policies (
  tier, course_format, course_category, access_level, can_purchase_single, upsell_tier, cta_label, cta_url, note
) values
  -- TYPE 1: abonnement individuel online
  ('online_individual_monthly', 'online', 'individual', 'full', false, null, null, null, 'Accès abonnement individuel'),
  ('online_individual_monthly', 'online', 'group', 'locked', false, 'online_group_monthly', 'Débloquer le collectif en ligne', '/#offers', 'Upsell collectif online'),
  ('online_individual_monthly', 'onsite', 'group', 'preview', true, null, 'Réserver en présentiel', '/#offers', 'Peut acheter à l’unité'),
  ('online_individual_monthly', 'onsite', 'individual', 'preview', true, null, 'Réserver en présentiel', '/#offers', 'Peut acheter à l’unité'),

  -- TYPE 2: abonnement collectif online
  ('online_group_monthly', 'online', 'group', 'full', false, null, null, null, 'Accès abonnement collectif'),
  ('online_group_monthly', 'online', 'individual', 'locked', false, 'online_individual_monthly', 'Débloquer l’individuel en ligne', '/#offers', 'Upsell individuel online'),
  ('online_group_monthly', 'onsite', 'group', 'preview', true, null, 'Réserver en présentiel', '/#offers', 'Peut acheter à l’unité'),
  ('online_group_monthly', 'onsite', 'individual', 'preview', true, null, 'Réserver en présentiel', '/#offers', 'Peut acheter à l’unité'),

  -- TYPE 3: achat unitaire collectif présentiel
  ('onsite_group_single', 'online', 'group', 'preview', false, 'online_group_monthly', 'Passer en abonnement mensuel', '/#offers', 'Vue grisée incitative'),
  ('onsite_group_single', 'online', 'individual', 'preview', false, 'online_individual_monthly', 'Passer en abonnement mensuel', '/#offers', 'Vue grisée incitative'),
  ('onsite_group_single', 'onsite', 'group', 'preview', true, null, 'Acheter à l’unité', '/#offers', 'Accès full via enrollment'),
  ('onsite_group_single', 'onsite', 'individual', 'locked', false, 'online_individual_monthly', 'Découvrir les abonnements', '/#offers', 'Bloqué'),

  -- TYPE 4: achat unitaire individuel présentiel
  ('onsite_individual_single', 'online', 'individual', 'preview', false, 'online_individual_monthly', 'Débloquer avec abonnement', '/#offers', 'Vue grisée incitative'),
  ('onsite_individual_single', 'online', 'group', 'preview', false, 'online_group_monthly', 'Débloquer avec abonnement', '/#offers', 'Vue grisée incitative'),
  ('onsite_individual_single', 'onsite', 'individual', 'preview', true, null, 'Acheter à l’unité', '/#offers', 'Accès full via enrollment'),
  ('onsite_individual_single', 'onsite', 'group', 'preview', true, null, 'Acheter collectif présentiel', '/#offers', 'Achat unité autorisé')
on conflict (tier, course_format, course_category) do update
set access_level = excluded.access_level,
    can_purchase_single = excluded.can_purchase_single,
    upsell_tier = excluded.upsell_tier,
    cta_label = excluded.cta_label,
    cta_url = excluded.cta_url,
    note = excluded.note,
    updated_at = now();
