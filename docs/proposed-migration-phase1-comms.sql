-- =============================================================================
-- PROPOSITION Phase 1 — Communications / préférences / logs / caps push
-- STATUT : EN REVUE UNIQUEMENT — NE PAS EXÉCUTER TANT QUE LE FONDATEUR N'A PAS VALIDÉ
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

create index if not exists idx_notification_log_user_created
  on public.notification_log (user_id, created_at desc);

create index if not exists idx_notification_log_event_created
  on public.notification_log (event_type, created_at desc);

create index if not exists idx_notification_log_created
  on public.notification_log (created_at desc);

comment on table public.notification_log is
  'Journal dispatcher : envois, erreurs, événements (ex. subscription.checkout_abandoned). '
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
-- D) notification_preferences — la cliente lit / met à jour les siennes
--     INSERT : défaut au signup via trigger (pas d’INSERT direct client)
-- -----------------------------------------------------------------------------
create table if not exists public.notification_preferences (
  user_id uuid primary key references public.profiles (id) on delete cascade,
  digest_email_enabled boolean not null default true,
  updated_at timestamptz not null default now()
);

comment on table public.notification_preferences is
  'Préférences notifications non sensibles (digest, etc.). Étendre en colonnes/json si besoin v1.1.';

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
  insert into public.notification_preferences (user_id)
  values (new.id)
  on conflict (user_id) do nothing;
  return new;
end;
$$;

comment on function public.ensure_notification_preferences_for_profile() is
  'Crée une ligne notification_preferences à la création du profil (signup).';

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
-- G) Optionnel : CHECK sur event_type — après stabilisation du dispatcher
-- -----------------------------------------------------------------------------

-- -----------------------------------------------------------------------------
-- H) Profils déjà existants avant déploiement de ce script : backfill manuel
--     (à exécuter une fois si besoin, hors transaction idempotente du trigger)
-- -----------------------------------------------------------------------------
-- insert into public.notification_preferences (user_id)
-- select p.id from public.profiles p
-- where not exists (select 1 from public.notification_preferences np where np.user_id = p.id)
-- on conflict (user_id) do nothing;
