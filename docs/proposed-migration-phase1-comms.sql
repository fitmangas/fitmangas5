-- =============================================================================
-- Phase 1 — Communications / préférences / logs / caps push (référence doc)
-- Déployé via : supabase/migrations/20260430143000_phase1_comms_foundation.sql
-- =============================================================================
--
-- RLS & service_role (règle Supabase) :
--   Le rôle « service_role » (clé service) **contourne RLS** : toutes les opérations
--   INSERT / UPDATE / SELECT / DELETE côté API serveur avec cette clé sont possibles.
--   Les policies ci-dessous restreignent **authenticated** et **anon** uniquement.
--
-- Répartition demandée :
--   • notification_log           → aucun accès client ; tout via service_role
--   • notification_digest_queue → idem (worker interne uniquement)
--   • notification_preferences  → SELECT + UPDATE pour auth.uid() ; INSERT ligne
--                                   défaut au signup via trigger SECURITY DEFINER
--   • push_subscriptions        → SELECT + INSERT + DELETE pour auth.uid() ;
--                                   **pas** de UPDATE (changement d’appareil = delete + insert)
--   • notification_frequency_cap → aucun accès client ; tout via service_role
--   • profiles (colonnes ajoutées) → suit les policies existantes sur public.profiles
--
-- notification_log.event_type : text libre — **pas** de CHECK SQL ; liste blanche /
--   évolution gérée par le **dispatcher** applicatif (évolutivité). Inclut les
--   événements checkout documentés dans docs/communications-matrix.md §9.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- A) Profils : locale UI, fuseau IANA, verrou manuel fuseau, opt-in marketing
-- -----------------------------------------------------------------------------
alter table public.profiles
  add column if not exists preferred_locale text not null default 'fr'
    check (preferred_locale in ('fr', 'es'));

comment on column public.profiles.preferred_locale is
  'Langue UI / emails client hors blog : fr|es (v1). Distinct de preferred_blog_language.';

alter table public.profiles
  add column if not exists display_timezone text not null default 'Europe/Paris';

comment on column public.profiles.display_timezone is
  'Fuseau IANA pour affichage digest / calendrier client (ex. Europe/Paris, America/Mexico_City).';

alter table public.profiles
  add column if not exists display_timezone_manual_locked boolean not null default false;

comment on column public.profiles.display_timezone_manual_locked is
  'Si true : ne pas écraser display_timezone avec la détection navigateur à la connexion.';

alter table public.profiles
  add column if not exists marketing_email_opt_in boolean not null default false;

comment on column public.profiles.marketing_email_opt_in is
  'Opt-in explicite communications marketing / lifecycle (hors transactionnel obligatoire).';

alter table public.profiles
  add column if not exists marketing_email_opt_in_at timestamptz;

-- -----------------------------------------------------------------------------
-- B) notification_log — interne, pas de lecture cliente (RGPD / dispatcher)
-- -----------------------------------------------------------------------------
create table if not exists public.notification_log (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles (id) on delete set null,
  event_type text not null,
  channel text not null default 'log' check (channel in ('email', 'push', 'whatsapp', 'digest', 'log')),
  payload jsonb not null default '{}'::jsonb,
  idempotency_key text unique,
  created_at timestamptz not null default now()
);

comment on column public.notification_log.event_type is
  'Types validés côté application (dispatcher). Ex. subscription.checkout_initiated, '
  'subscription.checkout_abandoned_explicit, subscription.checkout_abandoned_timeout, '
  'subscription.checkout_async_payment_failed, envois email, etc.';

create index if not exists idx_notification_log_user_created
  on public.notification_log (user_id, created_at desc);

create index if not exists idx_notification_log_event_created
  on public.notification_log (event_type, created_at desc);

create index if not exists idx_notification_log_created
  on public.notification_log (created_at desc);

comment on table public.notification_log is
  'Journal dispatcher : envois, erreurs, événements checkout / analytics. '
  'INSERT/UPDATE/SELECT uniquement côté serveur (service_role). La cliente ne lit pas son log. '
  'Purge recommandée > 24 mois.';

alter table public.notification_log enable row level security;

drop policy if exists "notification_log_deny_authenticated" on public.notification_log;
create policy "notification_log_deny_authenticated"
  on public.notification_log for all to authenticated
  using (false) with check (false);

drop policy if exists "notification_log_deny_anon" on public.notification_log;
create policy "notification_log_deny_anon"
  on public.notification_log for all to anon
  using (false) with check (false);

-- -----------------------------------------------------------------------------
-- C) notification_digest_queue — worker / service_role uniquement
-- -----------------------------------------------------------------------------
create table if not exists public.notification_digest_queue (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  digest_bucket text not null,
  payload jsonb not null default '{}'::jsonb,
  scheduled_for timestamptz not null,
  processed_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists idx_digest_queue_scheduled
  on public.notification_digest_queue (scheduled_for)
  where processed_at is null;

comment on table public.notification_digest_queue is
  'File digest (cron / worker). Aucun accès authenticated / anon — uniquement service_role.';

alter table public.notification_digest_queue enable row level security;

drop policy if exists "notification_digest_queue_deny_authenticated" on public.notification_digest_queue;
create policy "notification_digest_queue_deny_authenticated"
  on public.notification_digest_queue for all to authenticated
  using (false) with check (false);

drop policy if exists "notification_digest_queue_deny_anon" on public.notification_digest_queue;
create policy "notification_digest_queue_deny_anon"
  on public.notification_digest_queue for all to anon
  using (false) with check (false);

-- -----------------------------------------------------------------------------
-- D) notification_preferences — matrice catégories × canaux (prompt maître §8.2)
--     INSERT : défaut au signup via trigger ; compte / paiement = non désactivables côté prefs (code)
-- -----------------------------------------------------------------------------
create table if not exists public.notification_preferences (
  user_id uuid primary key references public.profiles (id) on delete cascade,

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

  digest_frequency text not null default 'off'
    check (digest_frequency in ('off', 'daily', 'weekly')),

  updated_at timestamptz not null default now()
);

comment on table public.notification_preferences is
  'Préférences notifications par catégorie (cours, contenu, boutique, communauté) × canaux. '
  'Compte / sécurité / paiement : forcés par le code, pas de colonnes ici.';

comment on column public.notification_preferences.shop_email_enabled is
  'Emails liés aux commandes boutique (transactionnel côté métier).';

alter table public.notification_preferences enable row level security;

drop policy if exists "notification_preferences_select_own" on public.notification_preferences;
create policy "notification_preferences_select_own"
  on public.notification_preferences for select to authenticated
  using (auth.uid() = user_id);

drop policy if exists "notification_preferences_update_own" on public.notification_preferences;
create policy "notification_preferences_update_own"
  on public.notification_preferences for update to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Pas de policy INSERT / DELETE pour authenticated : INSERT par trigger ; DELETE en cascade avec profiles.

create or replace function public.ensure_notification_preferences_for_profile()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.notification_preferences (
    user_id,
    courses_inapp_enabled,
    courses_email_enabled,
    courses_push_enabled,
    content_inapp_enabled,
    content_email_enabled,
    content_push_enabled,
    shop_inapp_enabled,
    shop_email_enabled,
    shop_push_enabled,
    community_inapp_enabled,
    community_email_enabled,
    community_push_enabled,
    silence_mode_enabled,
    digest_frequency
  )
  values (
    new.id,
    true,
    true,
    false,
    true,
    false,
    false,
    true,
    true,
    false,
    true,
    true,
    false,
    false,
    'off'
  )
  on conflict (user_id) do nothing;
  return new;
end;
$$;

comment on function public.ensure_notification_preferences_for_profile() is
  'Crée une ligne notification_preferences à la création du profil (signup), avec défauts produit.';

drop trigger if exists trg_profiles_ensure_notification_preferences on public.profiles;
create trigger trg_profiles_ensure_notification_preferences
  after insert on public.profiles
  for each row
  execute function public.ensure_notification_preferences_for_profile();

-- -----------------------------------------------------------------------------
-- E) push_subscriptions — SELECT / INSERT / DELETE pour la propriétaire ; pas d’UPDATE
-- -----------------------------------------------------------------------------
create table if not exists public.push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  endpoint text not null,
  p256dh text not null,
  auth text not null,
  user_agent text,
  created_at timestamptz not null default now(),
  unique (user_id, endpoint)
);

create index if not exists idx_push_subs_user on public.push_subscriptions (user_id);

comment on table public.push_subscriptions is
  'Web Push : mutation côté cliente = insert ou delete uniquement (pas de UPDATE).';

alter table public.push_subscriptions enable row level security;

drop policy if exists "push_subs_own_select" on public.push_subscriptions;
create policy "push_subs_own_select"
  on public.push_subscriptions for select to authenticated
  using (auth.uid() = user_id);

drop policy if exists "push_subs_own_insert" on public.push_subscriptions;
create policy "push_subs_own_insert"
  on public.push_subscriptions for insert to authenticated
  with check (auth.uid() = user_id);

drop policy if exists "push_subs_own_delete" on public.push_subscriptions;
create policy "push_subs_own_delete"
  on public.push_subscriptions for delete to authenticated
  using (auth.uid() = user_id);

-- Aucune policy « for update » → UPDATE refusé pour authenticated (service_role peut mettre à jour si besoin métier).

-- -----------------------------------------------------------------------------
-- F) notification_frequency_cap — anti-surcharge, service_role uniquement
-- -----------------------------------------------------------------------------
create table if not exists public.notification_frequency_cap (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  channel text not null,
  scope_key text not null,
  sent_count integer not null default 0,
  window_expires_at timestamptz not null,
  updated_at timestamptz not null default now(),
  unique (user_id, channel, scope_key)
);

create index if not exists idx_notification_frequency_cap_user on public.notification_frequency_cap (user_id);

comment on table public.notification_frequency_cap is
  'Compteurs internes anti-surcharge (email/push/digest). Lecture/écriture service_role uniquement.';

alter table public.notification_frequency_cap enable row level security;

drop policy if exists "notification_frequency_cap_deny_authenticated" on public.notification_frequency_cap;
create policy "notification_frequency_cap_deny_authenticated"
  on public.notification_frequency_cap for all to authenticated
  using (false) with check (false);

drop policy if exists "notification_frequency_cap_deny_anon" on public.notification_frequency_cap;
create policy "notification_frequency_cap_deny_anon"
  on public.notification_frequency_cap for all to anon
  using (false) with check (false);

-- -----------------------------------------------------------------------------
-- G) notification_log.event_type — pas de CHECK SQL (voir en-tête fichier).
-- -----------------------------------------------------------------------------

-- -----------------------------------------------------------------------------
-- H) Backfill obligatoire : tous les profils existants ont une ligne prefs.
-- -----------------------------------------------------------------------------
insert into public.notification_preferences (
  user_id,
  courses_inapp_enabled,
  courses_email_enabled,
  courses_push_enabled,
  content_inapp_enabled,
  content_email_enabled,
  content_push_enabled,
  shop_inapp_enabled,
  shop_email_enabled,
  shop_push_enabled,
  community_inapp_enabled,
  community_email_enabled,
  community_push_enabled,
  silence_mode_enabled,
  digest_frequency
)
select
  p.id,
  true,
  true,
  false,
  true,
  false,
  false,
  true,
  true,
  false,
  true,
  true,
  false,
  false,
  'off'
from public.profiles p
where not exists (
  select 1 from public.notification_preferences np where np.user_id = p.id
)
on conflict (user_id) do nothing;
