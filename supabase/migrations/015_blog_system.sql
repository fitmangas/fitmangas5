-- Blog Pilates : articles, ratings, tracking, newsletter, validations mensuelles.

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------------
-- Langue préférée lecture blog (persistée profil + fallback localStorage client)
-- ---------------------------------------------------------------------------

alter table public.profiles
  add column if not exists preferred_blog_language text not null default 'fr'
    check (preferred_blog_language in ('fr', 'en', 'es'));

comment on column public.profiles.preferred_blog_language is 'Langue d''affichage préférée pour le blog (fr|en|es).';

-- ---------------------------------------------------------------------------
-- Catégories
-- ---------------------------------------------------------------------------

create table if not exists public.blog_categories (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  label_fr text not null,
  label_en text,
  label_es text,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

insert into public.blog_categories (slug, label_fr, label_en, label_es, sort_order)
values
  ('technique', 'Technique', 'Technique', 'Técnica', 1),
  ('respiration', 'Respiration', 'Breathing', 'Respiración', 2),
  ('posture', 'Posture & alignement', 'Posture & alignment', 'Postura y alineación', 3),
  ('renforcement', 'Renforcement', 'Strengthening', 'Fortalecimiento', 4),
  ('bien-etre', 'Bien-être', 'Well-being', 'Bienestar', 5),
  ('nutrition', 'Nutrition légère', 'Light nutrition', 'Nutrición', 6)
on conflict (slug) do nothing;

-- ---------------------------------------------------------------------------
-- Articles
-- ---------------------------------------------------------------------------

create type public.blog_article_status as enum (
  'draft',
  'validated',
  'published',
  'archived'
);

create table if not exists public.blog_articles (
  id uuid primary key default gen_random_uuid(),
  coach_id uuid not null references public.profiles (id) on delete restrict,

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

  category_id uuid references public.blog_categories (id) on delete set null,

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
  updated_at timestamptz not null default now(),

  constraint blog_articles_rating_avg_range check (
    average_rating is null or (average_rating >= 1 and average_rating <= 5)
  ),
  constraint blog_articles_scroll_pct check (
    average_scroll_percentage >= 0 and average_scroll_percentage <= 100
  )
);

create unique index if not exists idx_blog_articles_slug_fr on public.blog_articles (slug_fr);
create unique index if not exists idx_blog_articles_slug_en on public.blog_articles (slug_en) where slug_en is not null;
create unique index if not exists idx_blog_articles_slug_es on public.blog_articles (slug_es) where slug_es is not null;

create index if not exists idx_blog_articles_status on public.blog_articles (status);
create index if not exists idx_blog_articles_published_at on public.blog_articles (published_at desc);
create index if not exists idx_blog_articles_scheduled on public.blog_articles (scheduled_publication_at);
create index if not exists idx_blog_articles_category on public.blog_articles (category_id);

drop trigger if exists trg_blog_articles_updated_at on public.blog_articles;
create trigger trg_blog_articles_updated_at
  before update on public.blog_articles
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Ratings
-- ---------------------------------------------------------------------------

create table if not exists public.blog_article_ratings (
  id uuid primary key default gen_random_uuid(),
  article_id uuid not null references public.blog_articles (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  rating integer not null check (rating >= 1 and rating <= 5),
  comment text,
  rated_at timestamptz not null default now(),
  unique (article_id, user_id)
);

create index if not exists idx_blog_ratings_article on public.blog_article_ratings (article_id);

-- Traductions optionnelles (historique / surcouche — les colonnes *_en *_es restent la source principale)
create table if not exists public.blog_article_translations (
  id uuid primary key default gen_random_uuid(),
  article_id uuid not null references public.blog_articles (id) on delete cascade,
  language text not null check (language in ('fr', 'en', 'es')),
  title text not null,
  description text,
  content text not null,
  meta_description text,
  slug text,
  auto_translated boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (article_id, language)
);

drop trigger if exists trg_blog_trans_updated_at on public.blog_article_translations;
create trigger trg_blog_trans_updated_at
  before update on public.blog_article_translations
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Scroll & heatmap
-- ---------------------------------------------------------------------------

create table if not exists public.blog_scroll_tracking (
  id uuid primary key default gen_random_uuid(),
  article_id uuid not null references public.blog_articles (id) on delete cascade,
  user_id uuid references public.profiles (id) on delete set null,
  scroll_percentage_max integer check (scroll_percentage_max is null or (scroll_percentage_max >= 0 and scroll_percentage_max <= 100)),
  time_spent_seconds integer not null default 0 check (time_spent_seconds >= 0),
  device_type text,
  traffic_source text,
  tracked_at timestamptz not null default now()
);

create index if not exists idx_blog_scroll_article on public.blog_scroll_tracking (article_id);
create index if not exists idx_blog_scroll_tracked on public.blog_scroll_tracking (tracked_at desc);

create table if not exists public.blog_heatmap_data (
  id uuid primary key default gen_random_uuid(),
  article_id uuid not null references public.blog_articles (id) on delete cascade,
  section_bucket integer not null check (section_bucket >= 0 and section_bucket <= 19),
  scroll_hits integer not null default 0,
  average_time_spent_seconds integer not null default 0,
  updated_at timestamptz not null default now(),
  unique (article_id, section_bucket)
);

create index if not exists idx_blog_heatmap_article on public.blog_heatmap_data (article_id);

-- ---------------------------------------------------------------------------
-- Newsletter
-- ---------------------------------------------------------------------------

create table if not exists public.newsletter_subscriptions (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  coach_id uuid not null references public.profiles (id) on delete cascade,
  subscribed_from_article_id uuid references public.blog_articles (id) on delete set null,
  confirmed boolean not null default false,
  confirmed_at timestamptz,
  unsubscribed boolean not null default false,
  subscribed_at timestamptz not null default now(),
  unique (email, coach_id)
);

create index if not exists idx_newsletter_email on public.newsletter_subscriptions (email);
create index if not exists idx_newsletter_coach on public.newsletter_subscriptions (coach_id);

-- ---------------------------------------------------------------------------
-- Validation mensuelle (batch par mois)
-- ---------------------------------------------------------------------------

create table if not exists public.admin_article_validations (
  id uuid primary key default gen_random_uuid(),
  article_id uuid not null references public.blog_articles (id) on delete cascade,
  coach_id uuid not null references public.profiles (id) on delete cascade,
  month_year text not null,
  status text not null default 'pending' check (status in ('pending', 'validated', 'rejected')),
  validated_at timestamptz,
  notes text,
  created_at timestamptz not null default now(),
  unique (article_id, month_year)
);

create index if not exists idx_validations_month on public.admin_article_validations (month_year);

-- ---------------------------------------------------------------------------
-- Agrégats rating (trigger)
-- ---------------------------------------------------------------------------

create or replace function public.blog_refresh_article_rating_stats(p_article_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  avg_r numeric;
  cnt integer;
begin
  select round(avg(r.rating)::numeric, 2), count(*)::integer
    into avg_r, cnt
  from public.blog_article_ratings r
  where r.article_id = p_article_id;

  update public.blog_articles a
  set
    average_rating = case when cnt > 0 then avg_r else null end,
    rating_count = coalesce(cnt, 0),
    updated_at = now()
  where a.id = p_article_id;
end;
$$;

create or replace function public.trg_blog_rating_after_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op = 'DELETE' then
    perform public.blog_refresh_article_rating_stats(old.article_id);
    return old;
  end if;
  perform public.blog_refresh_article_rating_stats(new.article_id);
  return new;
end;
$$;

drop trigger if exists trg_blog_rating_change on public.blog_article_ratings;
create trigger trg_blog_rating_change
  after insert or update or delete on public.blog_article_ratings
  for each row execute function public.trg_blog_rating_after_change();

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------

alter table public.blog_categories enable row level security;
alter table public.blog_articles enable row level security;
alter table public.blog_article_ratings enable row level security;
alter table public.blog_article_translations enable row level security;
alter table public.blog_scroll_tracking enable row level security;
alter table public.blog_heatmap_data enable row level security;
alter table public.newsletter_subscriptions enable row level security;
alter table public.admin_article_validations enable row level security;

drop policy if exists "blog_categories_read_all" on public.blog_categories;
create policy "blog_categories_read_all"
  on public.blog_categories for select to anon, authenticated using (true);

drop policy if exists "blog_articles_read_published" on public.blog_articles;
create policy "blog_articles_read_published"
  on public.blog_articles for select to anon, authenticated
  using (status = 'published'::public.blog_article_status);

drop policy if exists "blog_ratings_read_own_and_published" on public.blog_article_ratings;
create policy "blog_ratings_select_own"
  on public.blog_article_ratings for select to authenticated
  using (auth.uid() = user_id);

drop policy if exists "blog_ratings_insert_own" on public.blog_article_ratings;
create policy "blog_ratings_insert_own"
  on public.blog_article_ratings for insert to authenticated
  with check (auth.uid() = user_id);

drop policy if exists "blog_ratings_update_own" on public.blog_article_ratings;
create policy "blog_ratings_update_own"
  on public.blog_article_ratings for update to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Tracking : insertion par utilisateur connecté uniquement (API assure cohérence)
drop policy if exists "blog_scroll_insert_own" on public.blog_scroll_tracking;
create policy "blog_scroll_insert_own"
  on public.blog_scroll_tracking for insert to authenticated
  with check (user_id is not null and auth.uid() = user_id);

grant usage on schema public to anon, authenticated;

grant select on public.blog_categories to anon, authenticated;
grant select on public.blog_articles to anon, authenticated;
grant select, insert, update on public.blog_article_ratings to authenticated;
grant insert on public.blog_scroll_tracking to authenticated;

-- ---------------------------------------------------------------------------
-- Réengagement agrégé après chaque événement scroll
-- ---------------------------------------------------------------------------

create or replace function public.blog_refresh_article_engagement_stats(p_article_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.blog_articles a
  set
    average_scroll_percentage = coalesce(
      (
        select round(avg(t.scroll_percentage_max))::integer
        from public.blog_scroll_tracking t
        where t.article_id = p_article_id
          and t.scroll_percentage_max is not null
      ),
      0
    ),
    average_time_spent_seconds = coalesce(
      (
        select round(avg(t.time_spent_seconds))::integer
        from public.blog_scroll_tracking t
        where t.article_id = p_article_id
      ),
      0
    ),
    updated_at = now()
  where a.id = p_article_id;
end;
$$;

create or replace function public.trg_blog_scroll_after_insert()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  perform public.blog_refresh_article_engagement_stats(new.article_id);
  return new;
end;
$$;

drop trigger if exists trg_blog_scroll_engagement on public.blog_scroll_tracking;
create trigger trg_blog_scroll_engagement
  after insert on public.blog_scroll_tracking
  for each row execute function public.trg_blog_scroll_after_insert();
