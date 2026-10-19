# Propositions de migrations Supabase

Ce fichier contient uniquement des propositions à relire et valider avant application. Aucun SQL ci-dessous n’a été exécuté.

## 1. Sécuriser la table `profiles`

Risque simple : si une utilisatrice peut modifier elle-même des colonnes comme `role`, `customer_tier`, `subscription_status` ou `subscription_type`, elle pourrait se donner un rôle admin ou un abonnement qu’elle n’a pas payé.

Proposition : garder le droit de modifier ses informations personnelles simples, mais retirer aux clientes le droit de modifier les champs sensibles. Les mises à jour sensibles doivent passer par le serveur avec la `service_role` Supabase, par exemple après paiement Stripe confirmé.

```sql
begin;

alter table public.profiles enable row level security;

drop policy if exists "Mise à jour du profil par l’utilisateur" on public.profiles;
drop policy if exists "profiles_update_own_safe_columns" on public.profiles;

create policy "profiles_update_own_safe_columns"
  on public.profiles
  for update
  to authenticated
  using (auth.uid() = id)
  with check (auth.uid() = id);

revoke update on public.profiles from anon;
revoke update on public.profiles from authenticated;

grant update (
  first_name,
  last_name,
  avatar_url,
  birth_date,
  onboarding_completed,
  preferred_locale,
  preferred_blog_language,
  display_timezone,
  display_timezone_manual_locked,
  marketing_email_opt_in,
  marketing_email_opt_in_at
) on public.profiles to authenticated;

grant all on public.profiles to service_role;

commit;
```

## 2. Sécuriser `increment_replay_view()`

Risque simple : si la fonction incrémente le compteur sans vérifier l’accès, quelqu’un pourrait gonfler les vues d’un replay. La proposition ci-dessous vérifie que l’utilisatrice est connectée, que le replay est prêt/validé/publié, qu’elle a accès au cours, puis ne compte qu’une seule vue par utilisatrice et par replay.

```sql
begin;

create table if not exists public.replay_view_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  recording_id uuid not null references public.video_recordings(id) on delete cascade,
  viewed_at timestamptz not null default now(),
  unique (user_id, recording_id)
);

alter table public.replay_view_events enable row level security;

drop policy if exists "replay_view_events_select_own" on public.replay_view_events;
create policy "replay_view_events_select_own"
  on public.replay_view_events
  for select
  to authenticated
  using (user_id = auth.uid());

create or replace function public.increment_replay_view(p_recording_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  cid uuid;
  inserted_count integer := 0;
begin
  if auth.uid() is null then
    raise exception 'not authenticated';
  end if;

  select vr.course_id
  into cid
  from public.video_recordings vr
  join public.courses c on c.id = vr.course_id
  where vr.id = p_recording_id
    and vr.is_ready = true
    and coalesce(vr.validation_status, 'approved') = 'approved'
    and c.is_published = true
    and c.ends_at < now();

  if cid is null then
    raise exception 'recording not found or unavailable';
  end if;

  if public.course_access_level(auth.uid(), cid) <> 'full'::public.access_level then
    raise exception 'forbidden';
  end if;

  insert into public.replay_view_events (user_id, recording_id)
  values (auth.uid(), p_recording_id)
  on conflict (user_id, recording_id) do nothing;

  get diagnostics inserted_count = row_count;

  if inserted_count = 1 then
    update public.video_recordings
    set view_count = view_count + 1
    where id = p_recording_id;
  end if;
end;
$$;

revoke execute on function public.increment_replay_view(uuid) from public;
revoke execute on function public.increment_replay_view(uuid) from anon;
grant execute on function public.increment_replay_view(uuid) to authenticated;

commit;
```

## 3. Index pour le tri stable des articles de blog publiés

Contexte : la liste du blog trie par `published_at` décroissant, puis `created_at` décroissant, puis `id` décroissant en cas d’ex-aequo. Un index composite aligné sur ce tri peut accélérer les requêtes `/blog` et `/compte/blog` lorsque le volume d’articles augmente.

```sql
create index if not exists idx_blog_articles_published_list_order
  on public.blog_articles (published_at desc, created_at desc, id desc)
  where status = 'published' and published_at is not null;
```

## 4. Table optionnelle `blog_editorial_topics` (réserve de sujets)

Contexte : la production automatique du blog utilise aujourd’hui :

- un fichier versionné `data/blog-editorial-topics.json` (72 sujets de départ, 6 catégories) ;
- un marqueur `topic:ID` dans la colonne existante `seo_keywords` pour savoir quels sujets ont déjà été traités ;
- une génération Gemini ponctuelle de nouveaux briefs quand la réserve statique est épuisée.

Cela évite une migration immédiate. Si le volume d’articles dépasse plusieurs centaines et que vous souhaitez une réserve persistante côté base (historique, statistiques, régénération sans relire tout le blog), la table ci-dessous serait utile.

```sql
create table if not exists public.blog_editorial_topics (
  id text primary key,
  category_slug text not null,
  brief_fr text not null,
  source text not null default 'static',
  used_at timestamptz,
  article_id uuid references public.blog_articles(id) on delete set null,
  created_at timestamptz not null default now()
);

create index if not exists idx_blog_editorial_topics_unused
  on public.blog_editorial_topics (category_slug, used_at nulls first);

alter table public.blog_editorial_topics enable row level security;

-- Lecture/écriture réservées au service_role (crons serveur uniquement).
revoke all on public.blog_editorial_topics from anon, authenticated;
grant all on public.blog_editorial_topics to service_role;
```

**Avantage** : sujets dynamiques générés par l’IA conservés entre déploiements, sans dépendre uniquement du fichier JSON.

**Inconvénient** : une table de plus à maintenir ; le mécanisme actuel (`seo_keywords` + JSON) suffit pour démarrer l’autonomie sans migration.

## 5. Langue du cours (`course_language` sur `courses`)

Contexte : Alejandra souhaite indiquer, pour chaque séance, si elle sera donnée en **français** ou en **espagnol**. Côté cliente, un petit drapeau (🇫🇷 ou 🇲🇽) s’affiche dans le calendrier et dans la pop-up de détail — **uniquement** si une langue a été choisie. Les séances déjà créées sans langue restent sans drapeau.

Proposition : ajouter une colonne optionnelle `course_language` sur la table `courses`, avec seulement deux valeurs autorisées (`fr`, `es`) ou `NULL` (non défini).

```sql
begin;

alter table public.courses
  add column if not exists course_language text;

alter table public.courses
  drop constraint if exists courses_course_language_check;

alter table public.courses
  add constraint courses_course_language_check
  check (course_language is null or course_language in ('fr', 'es'));

comment on column public.courses.course_language is
  'Langue de la séance : fr (français), es (espagnol), ou NULL si non définie.';

commit;
```

**Ce que ça change concrètement :**
- Dans l’admin « Séances », le champ « Langue du cours » pourra enregistrer Français ou Espagnol.
- Dans le calendrier client, les clientes verront le drapeau correspondant à droite de l’encadré du cours.
- Tant que cette migration n’est pas appliquée, la création/édition de séances avec une langue choisie renverra une erreur Supabase (colonne absente) — le code est déjà prêt en attendant votre validation.

## 6. Vignettes extraites par vidéo (replays)

Contexte : le champ `thumbnail_url` existe déjà sur `video_recordings` et est enrichi à la volée via l’API Vimeo quand il manque. Aucune migration n’est requise pour afficher les vraies vignettes Vimeo.

Proposition future éventuelle (non appliquée) : job périodique de rafraîchissement des vignettes, ou colonne dédiée `cover_image_url` si on veut stocker une variante locale — inutile tant que Vimeo + `thumbnail_url` suffisent.

## 7. Colonne `is_hidden` sur `video_recordings` (masquage replays cours)

**Problème :** aujourd’hui, « Masquer » existe proprement sur `standalone_vimeo_videos` (`is_hidden`), mais pas sur les replays de séances (`video_recordings`). Sans migration, le code utilise la convention **`is_ready = false` + `validation_status = 'approved'`** pour masquer un replay validé côté cliente, et synchronise aussi le masquage Vimeo standalone → même `vimeo_video_id` sur `video_recordings`.

**Limite :** `is_ready=false` mélange « pas encore prêt / en transcodage » et « masqué volontairement », ce qui peut prêter à confusion en admin.

**Proposition (non appliquée — attendre GO écrit) :**

```sql
begin;

alter table public.video_recordings
  add column if not exists is_hidden boolean not null default false;

alter table public.video_recordings
  add column if not exists hidden_at timestamptz;

comment on column public.video_recordings.is_hidden is
  'Masquage admin : true = invisible côté espace cliente (indépendant de is_ready / validation_status).';

commit;
```

Ensuite : filtrer `.eq('is_hidden', false)` partout côté client, et remplacer le workaround `is_ready` pour le masquage volontaire.

## 8. Table `post_metrics` (boucle performance CM) — NON APPLIQUÉE

Contexte : les posts CM stockent déjà `metaExternalId` / `facebookExternalId`. Sans table de métriques, la génération reste aveugle. Le job `social-insights-sync` est prêt mais désactivé (`SOCIAL_INSIGHTS_SYNC_ENABLED=false`) tant que le token Meta n’est pas renouvelé.

**Ne pas appliquer sans GO écrit.**

```sql
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
```

**Minimum stocké si on reste en JSON** (`admin_settings.social_post_metrics_snapshot`) sans migration : mêmes champs, sans historique SQL.


---

## CM v4 — Observabilité notifications / emails (NE PAS APPLIQUER)

**Contexte :** la carte dashboard « Notifications & emails » s’appuie aujourd’hui sur `notification_log` + `user_notifications`. Manques connus (affichés explicitement dans l’UI, sans faux zéros) :
- Newsletters / offres Resend hors dispatcher → **non loguées**
- Pas de canal dédié `in_app` dans `notification_log.channel` (aujourd’hui `log` + `_delivered`)
- Pas de vue matérialisée pour agrégats mois / type

### Proposition A — étendre `notification_log.channel`

```sql
begin;

alter table public.notification_log
  drop constraint if exists notification_log_channel_check;

alter table public.notification_log
  add constraint notification_log_channel_check
  check (channel in ('email', 'push', 'whatsapp', 'digest', 'log', 'in_app'));

comment on column public.notification_log.channel is
  'email | push | whatsapp | digest | log | in_app — in_app = cloche cliente';

commit;
```

Puis adapter le dispatcher pour écrire `channel = 'in_app'` (au lieu de `log` + `_delivered`).

### Proposition B — table d’agrégats (optionnelle, pour perf dashboard)

```sql
begin;

create table if not exists public.notification_send_stats_daily (
  day date not null,
  channel text not null,
  category text not null,
  send_count integer not null default 0,
  last_sent_at timestamptz,
  primary key (day, channel, category)
);

alter table public.notification_send_stats_daily enable row level security;
revoke all on public.notification_send_stats_daily from anon, authenticated;
grant all on public.notification_send_stats_daily to service_role;

comment on table public.notification_send_stats_daily is
  'Agrégats journaliers pour la carte admin Notifications & emails.';

commit;
```

### Proposition C — log newsletter Resend (RECOMMANDÉE pour total complet)

> **STATUT : APPLIQUÉE (GO Kevin 2026-08-01)** — migration `20260801120000_notification_log_newsletter_index.sql` seule + code log Resend dans `newsletter-double-optin.ts`.

**Problème simple :** les emails newsletter (confirmation d’inscription + nouvel article) partaient via Resend dans `newsletter-double-optin.ts` **sans** passer par le dispatcher. Donc ils n’apparaissaient **pas** dans `notification_log` → le total dashboard était partiel.

**Choix retenu :** réutiliser la table **existante** `notification_log` (pas de nouvelle table). Après chaque envoi Resend réussi, le code écrit une ligne avec `event_type` `newsletter.confirm` / `newsletter.article_published` et `channel = 'email'`.

**Ce que ça touche :**
- Table **déjà existante** `public.notification_log` — aucune colonne ajoutée.
- Index partiel pour les requêtes admin.

```sql
-- CM v5 — Proposition C (appliquée)
begin;

create index if not exists notification_log_newsletter_event_created_idx
  on public.notification_log (created_at desc)
  where event_type like 'newsletter.%';

comment on index public.notification_log_newsletter_event_created_idx is
  'CM v5 — filtre rapide des envois newsletter.* pour /admin/notifications';

commit;
```

**Côté code :** dans `src/lib/blog/newsletter-double-optin.ts`, après un `sendEmailViaResend` OK, `insert` dans `notification_log` :
- `channel = 'email'`
- `event_type = 'newsletter.confirm'` ou `'newsletter.article_published'`
- `idempotency_key` unique (`newsletter.confirm:{email}:{token}` / `newsletter.article_published:{articleId}:{email}`)
- pas de colonne `status` (schéma actuel : pas de champ status)

**Alternative (non retenue) :** table dédiée `newsletter_send_log`.

## CM Reels — limite taille bucket `avatars` (200 Mo)

**Statut :** proposition (pas exécutée). Le code tente déjà `storage.updateBucket('avatars', { fileSizeLimit: 209715200 })` à chaque signature d’upload. Si Supabase refuse encore les MP4 > ~50 Mo, appliquer manuellement :

```sql
-- Remonter la limite fichier du bucket public utilisé pour social/reels/*
update storage.buckets
set file_size_limit = 209715200  -- 200 Mo
where id = 'avatars';
```

**Pourquoi :** import MP4 monté en direct navigateur → Supabase (contourne le plafond body Vercel 4,5 Mo). Pas de ré-encodage.

## Téléphone client (`profiles.phone`)

**Statut :** proposition (pas exécutée). En attendant, le téléphone est stocké dans `auth.users.raw_user_meta_data.phone` (inscription + sync Stripe Checkout) et affiché sur `/admin/clients/[id]`.

**Pourquoi :** fiche admin, contact support/cours ; colonne dédiée plus propre que metadata seule, éditable depuis le compte cliente.

```sql
begin;

alter table public.profiles
  add column if not exists phone text;

comment on column public.profiles.phone is
  'Téléphone de contact (inscription / Stripe / profil). Affiché admin.';

-- Autoriser la cliente à mettre à jour son téléphone (policy colonnes sûres).
grant update (
  first_name,
  last_name,
  avatar_url,
  birth_date,
  phone,
  onboarding_completed,
  preferred_locale,
  preferred_blog_language,
  display_timezone,
  display_timezone_manual_locked,
  marketing_email_opt_in,
  marketing_email_opt_in_at
) on public.profiles to authenticated;

-- Copier le téléphone depuis metadata à la création du profil.
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
  phone_raw text;
begin
  begin
    bd := nullif(trim(coalesce(new.raw_user_meta_data->>'birth_date', '')), '')::date;
  exception
    when others then
      bd := null;
  end;

  detected_locale := lower(nullif(trim(coalesce(new.raw_user_meta_data->>'preferred_locale', '')), ''));
  if detected_locale not in ('fr', 'es') then
    detected_locale := 'fr';
  end if;

  detected_timezone := nullif(trim(coalesce(new.raw_user_meta_data->>'display_timezone', '')), '');
  if detected_timezone is null then
    detected_timezone := 'Europe/Paris';
  end if;

  phone_raw := nullif(trim(coalesce(new.raw_user_meta_data->>'phone', '')), '');

  insert into public.profiles (
    id,
    first_name,
    last_name,
    birth_date,
    phone,
    preferred_locale,
    display_timezone,
    display_timezone_manual_locked
  )
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'first_name', ''),
    coalesce(new.raw_user_meta_data->>'last_name', ''),
    bd,
    phone_raw,
    detected_locale,
    detected_timezone,
    false
  )
  on conflict (id) do nothing;

  return new;
end;
$$;

commit;
```

**Côté code (après GO) :** lire `profiles.phone` en priorité sur la fiche admin ; permettre l’édition dans Mon profil.

---

## 9. Module Acquisition — CRM léger + inbox + workflows — APPLIQUÉE (2026-08-30)

**Contexte :** module `/admin/croissance` (onglets Acquisition + Publications + SEO). Messaging séparé du CM publication. En SANDBOX (`MESSAGING_MODE=sandbox`), aucun appel Meta réel — journal visible en UI.

**Migration repo :** `supabase/migrations/20260830180000_acquisition_module.sql`

```sql
begin;

-- ── Contacts (CRM léger) ──
create table if not exists public.acq_contacts (
  id uuid primary key default gen_random_uuid(),
  channel text not null check (channel in ('instagram', 'facebook', 'whatsapp', 'email', 'blog_seo', 'referral', 'other')),
  handle text,
  email text,
  opt_in boolean not null default false,
  lifecycle_stage text not null default 'new'
    check (lifecycle_stage in ('new', 'qualified', 'trial', 'paid', 'member')),
  tags text[] not null default '{}',
  source_attribution text,
  profile_id uuid references public.profiles(id) on delete set null,
  external_ids jsonb not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists acq_contacts_channel_idx on public.acq_contacts (channel);
create index if not exists acq_contacts_lifecycle_idx on public.acq_contacts (lifecycle_stage);
create index if not exists acq_contacts_email_idx on public.acq_contacts (lower(email)) where email is not null;

-- ── Conversations (inbox unifiée) ──
create table if not exists public.acq_conversations (
  id uuid primary key default gen_random_uuid(),
  contact_id uuid not null references public.acq_contacts(id) on delete cascade,
  channel text not null check (channel in ('instagram', 'facebook', 'whatsapp', 'email', 'blog_seo', 'referral', 'other')),
  status text not null default 'open' check (status in ('open', 'waiting', 'closed', 'escalated')),
  lifecycle_stage text not null default 'new'
    check (lifecycle_stage in ('new', 'qualified', 'trial', 'paid', 'member')),
  subject text,
  external_thread_id text,
  last_message_at timestamptz,
  last_message_preview text,
  assigned_to text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists acq_conversations_contact_idx on public.acq_conversations (contact_id);
create index if not exists acq_conversations_last_msg_idx on public.acq_conversations (last_message_at desc nulls last);

-- ── Messages ──
create table if not exists public.acq_messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.acq_conversations(id) on delete cascade,
  direction text not null check (direction in ('inbound', 'outbound', 'system')),
  body text not null,
  provider text,
  external_message_id text,
  sandbox boolean not null default false,
  metadata jsonb not null default '{}',
  created_at timestamptz not null default now()
);

create index if not exists acq_messages_conversation_idx on public.acq_messages (conversation_id, created_at);

-- ── Workflows configurables ──
create table if not exists public.acq_workflows (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  enabled boolean not null default true,
  trigger_type text not null check (trigger_type in (
    'ig_comment_keyword', 'ig_dm_inbound', 'ig_story_reply',
    'messenger_inbound', 'whatsapp_inbound', 'email_inbound'
  )),
  trigger_config jsonb not null default '{}',
  conditions jsonb not null default '{}',
  actions jsonb not null default '[]',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ── Exécutions workflow (audit) ──
create table if not exists public.acq_workflow_runs (
  id uuid primary key default gen_random_uuid(),
  workflow_id uuid references public.acq_workflows(id) on delete set null,
  contact_id uuid references public.acq_contacts(id) on delete set null,
  conversation_id uuid references public.acq_conversations(id) on delete set null,
  status text not null check (status in ('ok', 'error', 'partial')),
  log jsonb not null default '[]',
  created_at timestamptz not null default now()
);

create index if not exists acq_workflow_runs_created_idx on public.acq_workflow_runs (created_at desc);

-- ── Intentions de réservation (liées au système de cours existant) ──
create table if not exists public.acq_booking_intents (
  id uuid primary key default gen_random_uuid(),
  contact_id uuid not null references public.acq_contacts(id) on delete cascade,
  course_type text not null check (course_type in ('visio_collectif', 'nantes_presentiel')),
  course_id uuid references public.courses(id) on delete set null,
  note text,
  status text not null default 'pending' check (status in ('pending', 'confirmed', 'cancelled')),
  created_at timestamptz not null default now()
);

-- ── Relances différées ──
create table if not exists public.acq_followups (
  id uuid primary key default gen_random_uuid(),
  contact_id uuid not null references public.acq_contacts(id) on delete cascade,
  conversation_id uuid references public.acq_conversations(id) on delete set null,
  action_type text not null,
  run_at timestamptz not null,
  status text not null default 'scheduled' check (status in ('scheduled', 'sent', 'cancelled', 'error')),
  payload jsonb not null default '{}',
  created_at timestamptz not null default now()
);

create index if not exists acq_followups_run_at_idx on public.acq_followups (run_at) where status = 'scheduled';

-- RLS : admin serveur uniquement (service_role)
alter table public.acq_contacts enable row level security;
alter table public.acq_conversations enable row level security;
alter table public.acq_messages enable row level security;
alter table public.acq_workflows enable row level security;
alter table public.acq_workflow_runs enable row level security;
alter table public.acq_booking_intents enable row level security;
alter table public.acq_followups enable row level security;

revoke all on public.acq_contacts from anon, authenticated;
revoke all on public.acq_conversations from anon, authenticated;
revoke all on public.acq_messages from anon, authenticated;
revoke all on public.acq_workflows from anon, authenticated;
revoke all on public.acq_workflow_runs from anon, authenticated;
revoke all on public.acq_booking_intents from anon, authenticated;
revoke all on public.acq_followups from anon, authenticated;

grant all on public.acq_contacts to service_role;
grant all on public.acq_conversations to service_role;
grant all on public.acq_messages to service_role;
grant all on public.acq_workflows to service_role;
grant all on public.acq_workflow_runs to service_role;
grant all on public.acq_booking_intents to service_role;
grant all on public.acq_followups to service_role;

comment on table public.acq_contacts is 'CRM Acquisition — contacts multi-canal (module /admin/acquisition).';
comment on table public.acq_conversations is 'Inbox unifiée Acquisition (IG DM, Messenger, WhatsApp, email).';

commit;
```

**Seed workflows par défaut (optionnel, après création tables) :**

```sql
insert into public.acq_workflows (id, name, enabled, trigger_type, trigger_config, actions)
values
  (
    '00000000-0000-4000-8000-000000000001',
    'Commentaire IG « ESSAI » → lien essai',
    true,
    'ig_comment_keyword',
    '{"keyword":"essai"}'::jsonb,
    '[{"type":"send_message","config":{"body":"Merci ! Voici ton essai 7 jours FitMangas :"}},{"type":"send_trial_link"},{"type":"set_lifecycle_stage","config":{"stage":"trial"}}]'::jsonb
  ),
  (
    '00000000-0000-4000-8000-000000000002',
    'Nouveau DM → qualifier + réponse concierge',
    true,
    'ig_dm_inbound',
    '{}'::jsonb,
    '[{"type":"qualify_intent"},{"type":"send_message"}]'::jsonb
  )
on conflict (id) do nothing;
```

**Note :** les UUID fixes ci-dessus nécessitent que `acq_workflows.id` accepte les inserts explicites (déjà le cas). Adapter les IDs si conflit.

---

# Chantier octobre 2026

> Rien de ce qui suit n’a été exécuté. Chaque bloc attend le **GO écrit de Kevin**. Ordre conseillé : migration → déploiement → drapeau.

## Lot 1 — Sécurité, conformité

### L1-a. RLS sur les 8 tables publicité / organique (fuite constatée)

Constat du 19/10/2026 (lecture seule avec la clé publique `anon`) : `ad_campaigns`, `ad_creatives`, `ads_sync_runs`, `organic_account_snapshots`, `organic_media_snapshots` **renvoient des lignes** à n’importe quel visiteur ; `ad_breakdowns_daily`, `ad_insights_daily`, `ad_metrics_daily` répondent 200 (vides aujourd’hui). Aucune RLS dans les migrations `20260924140000` et `20260924180000`.
Vérifié : tout le code qui lit/écrit ces tables (`src/lib/acquisition/ads/repository.ts`, `intelligence-repository.ts`, `sync-intelligence.ts`) passe par `createAdminClient()` (service_role, qui ignore la RLS) → rien ne casse.

```sql
begin;
do $$
declare t text;
begin
  foreach t in array array[
    'ad_breakdowns_daily','ad_campaigns','ad_creatives','ad_insights_daily',
    'ad_metrics_daily','ads_sync_runs','organic_account_snapshots','organic_media_snapshots'
  ] loop
    execute format('alter table public.%I enable row level security', t);
    execute format('revoke all on public.%I from anon', t);
    execute format('revoke all on public.%I from authenticated', t);
    execute format('grant all on public.%I to service_role', t);
    execute format('drop policy if exists %I on public.%I', t || '_admin_select', t);
    execute format(
      'create policy %I on public.%I for select to authenticated using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = ''admin''))',
      t || '_admin_select', t
    );
  end loop;
end $$;
-- La politique admin ne sert que si un écran lit un jour ces tables avec la session (aujourd’hui : service_role).
grant select on public.ad_breakdowns_daily, public.ad_campaigns, public.ad_creatives, public.ad_insights_daily,
  public.ad_metrics_daily, public.ads_sync_runs, public.organic_account_snapshots, public.organic_media_snapshots
  to authenticated;
commit;
```

Vérification après application (doit renvoyer `[]` ou 401) :
`curl "$SUPABASE_URL/rest/v1/ad_campaigns?select=id&limit=1" -H "apikey: $ANON" -H "Authorization: Bearer $ANON"`

### L1-b. Supprimer la politique « Users can insert own enrollments »

Vérifié : aucune insertion d’inscription depuis le navigateur. Les seules écritures (`src/lib/notifications/phase2.ts` → appelée par le webhook Stripe, `src/app/admin/attendance/actions.ts`) utilisent service_role.

```sql
drop policy if exists "Users can insert own enrollments" on public.enrollments;
```

(Destructif au sens « suppression de politique » : GO écrit requis.)

### L1-c. Table `rate_limits` (IP hachées, purge 24 h)

Utilisée par `src/lib/security/rate-limit.ts` quand `RATE_LIMIT_ENABLED=1`. Sans la table, le drapeau reste off (le code renvoie une erreur explicite côté serveur et laisse passer : la limite n’est pas appliquée, c’est journalisé).

```sql
create table if not exists public.rate_limits (
  id bigserial primary key,
  scope text not null,
  ip_hash text not null,
  created_at timestamptz not null default now()
);
create index if not exists rate_limits_scope_ip_created on public.rate_limits (scope, ip_hash, created_at desc);
alter table public.rate_limits enable row level security;
revoke all on public.rate_limits from anon, authenticated;
grant all on public.rate_limits to service_role;
grant usage, select on sequence public.rate_limits_id_seq to service_role;

-- Purge : lignes de plus de 24 h (pg_cron, toutes les heures)
select cron.schedule('rate_limits_purge', '17 * * * *',
  $$delete from public.rate_limits where created_at < now() - interval '24 hours'$$);
```

### L1-d. Opt-in marketing : défaut à `false` + correction des profils sans preuve

Comptes du 19/10/2026 (lecture seule) : **15 profils**, dont **14** avec `marketing_email_opt_in = true`. **Avec preuve** (`marketing_email_opt_in_at` renseignée) : **0**. **Sans preuve** : **14**. Origine : migrations `20260521120000` / `20260522140000` qui ont mis tout le monde à `true` sans consentement.
Code déjà modifié (lot 1) : défaut applicatif à `false` (`DEFAULT_MARKETING_EMAIL_OPT_IN`, page profil). Quand une cliente coche, `marketing_email_opt_in_at` est daté (`src/app/compte/preferences/actions.ts`).

```sql
-- 1) Nouveaux profils : non par défaut
alter table public.profiles alter column marketing_email_opt_in set default false;

-- 2) Contrôle avant correction (doit afficher 14 / 0 au 19/10)
select
  count(*) filter (where marketing_email_opt_in and marketing_email_opt_in_at is null)  as sans_preuve,
  count(*) filter (where marketing_email_opt_in and marketing_email_opt_in_at is not null) as avec_preuve
from public.profiles;

-- 3) Correction (UPDATE en masse → GO écrit)
update public.profiles
set marketing_email_opt_in = false
where marketing_email_opt_in = true
  and marketing_email_opt_in_at is null;
```

### L1-e. Bucket `avatars` : fichiers `text/html` (proposition, non appliquée)

Voir le rapport du lot 1 (§10) : le bucket public `avatars` sert aussi au montage des Reels (`social-cm/…`), dont des fichiers `text/html`. Proposition : bucket privé `cm-private` + URL signées 1 h pour les `text/html` ; `avatars` limité à `image/jpeg, image/png, image/webp, video/mp4` côté stockage.

```sql
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('cm-private', 'cm-private', false, 209715200, array['text/html','application/json'])
on conflict (id) do nothing;
-- Seulement APRÈS bascule du code CM sur cm-private + URL signées :
-- update storage.buckets set allowed_mime_types = array['image/jpeg','image/png','image/webp','video/mp4','image/gif']
-- where id = 'avatars';
```

## Lot 2 — Notifications (moteur)

> Rien de ce bloc n’a été exécuté. `NOTIF_V2_CUTOFF` à poser au moment du GO (horodatage du déploiement). Cron-job.org appelle encore `course-reminders` (GET) : le couper **le jour de la bascule** pg_cron, sinon double déclencheur.

### L2-a. Préférences (défauts SPEC §3.8)

```sql
alter table public.notification_preferences
  add column if not exists live_eve_email boolean not null default true,
  add column if not exists live_eve_inapp boolean not null default true,
  add column if not exists live_eve_push boolean not null default false,
  add column if not exists live_hour_email boolean not null default true,
  add column if not exists live_hour_inapp boolean not null default true,
  add column if not exists live_hour_push boolean not null default false,
  add column if not exists live_other_language boolean not null default false,
  add column if not exists program_session_email boolean not null default true,
  add column if not exists program_session_inapp boolean not null default true,
  add column if not exists program_session_push boolean not null default false,
  add column if not exists program_nudge_email boolean not null default true,
  add column if not exists program_nudge_inapp boolean not null default true,
  add column if not exists content_replay_email boolean not null default true,
  add column if not exists content_replay_inapp boolean not null default true,
  add column if not exists content_replay_push boolean not null default false,
  add column if not exists blog_email boolean not null default false,
  add column if not exists blog_inapp boolean not null default true,
  add column if not exists blog_push boolean not null default false,
  add column if not exists weekly_digest_email boolean not null default true,
  add column if not exists silence_mode_hours boolean not null default true;

-- miroir aussi sur le profil (filtre destinataires lives)
alter table public.profiles
  add column if not exists live_other_language boolean not null default false;
```

`Offres et nouveautés` = colonne existante `profiles.marketing_email_opt_in` (défaut false, lot 1). Ne pas dupliquer.

### L2-b. `user_notifications` (centre A08)

```sql
alter table public.user_notifications
  add column if not exists category text,
  add column if not exists action_url text,
  add column if not exists action_label text,
  add column if not exists meta jsonb not null default '{}'::jsonb,
  add column if not exists group_key text;

create unique index if not exists user_notifications_group_key_uniq
  on public.user_notifications (user_id, group_key)
  where group_key is not null;
```

### L2-c. Heartbeats + anti-doublon

`notification_log.idempotency_key` est **déjà unique**. Rien à ajouter.

```sql
create table if not exists public.cron_heartbeats (
  job text primary key,
  last_run_at timestamptz not null default now(),
  meta jsonb not null default '{}'::jsonb
);
alter table public.cron_heartbeats enable row level security;
revoke all on public.cron_heartbeats from anon, authenticated;
grant all on public.cron_heartbeats to service_role;
create policy cron_heartbeats_admin_select on public.cron_heartbeats
  for select to authenticated
  using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin'));
grant select on public.cron_heartbeats to authenticated;
```

### L2-d. Style de live (SPEC §3.10)

Le type de cours admin sert déjà de style (titre). Colonne additive optionnelle :

```sql
alter table public.courses
  add column if not exists live_style text;
```

Le code du lot 2a **n’écrit pas** cette colonne tant qu’elle n’existe pas.

### L2-e. Cutoff file digest

```sql
-- À renseigner au GO (horodatage UTC du déploiement notif v2), ex. :
-- insert into public.admin_settings (key, value) values ('NOTIF_V2_CUTOFF', '"2026-10-20T00:00:00.000Z"')
-- on conflict (key) do update set value = excluded.value;
-- Variable d’environnement équivalente : NOTIF_V2_CUTOFF (lue par le code).
```

Comptage backlog (lecture, `/admin/sante` au lot 2b) :

```sql
select digest_bucket,
       coalesce(payload->>'event_type', '—') as event_type,
       count(*) as n
from public.notification_digest_queue
where processed_at is null
group by 1, 2
order by n desc;
```

Archivage **sans envoi** (GO écrit obligatoire) :

```sql
update public.notification_digest_queue
set processed_at = now(),
    payload = coalesce(payload, '{}'::jsonb) || jsonb_build_object('archived_reason', 'archived_backlog')
where processed_at is null
  and created_at < :cutoff_timestamptz;
```

### L2-f. Supabase Cron (pg_cron + pg_net)

Prérequis : extension `pg_cron` + `pg_net` ; secret `CRON_SECRET` dans **Vault** (nom `cron_secret`). Couper cron-job.org le jour J. Routes : GET **et** POST exportées.

```sql
create extension if not exists pg_cron;
create extension if not exists pg_net;

-- Rappels lives (toutes les 10 min)
select cron.schedule(
  'fitmangas-course-reminders',
  '*/10 * * * *',
  $$
  select net.http_post(
    url := 'https://fitmangas.com/api/admin/cron/course-reminders',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || (select decrypted_secret from vault.decrypted_secrets where name = 'cron_secret' limit 1)
    ),
    body := '{}'::jsonb,
    timeout_milliseconds := 60000
  );
  $$
);

-- Publication sociale (toutes les 10 min) — séparée
select cron.schedule(
  'fitmangas-social',
  '*/10 * * * *',
  $$
  select net.http_post(
    url := 'https://fitmangas.com/api/admin/cron/social',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || (select decrypted_secret from vault.decrypted_secrets where name = 'cron_secret' limit 1)
    ),
    body := '{}'::jsonb,
    timeout_milliseconds := 60000
  );
  $$
);

-- Récapitulatifs (toutes les heures à :05)
select cron.schedule(
  'fitmangas-hourly',
  '5 * * * *',
  $$
  select net.http_post(
    url := 'https://fitmangas.com/api/admin/cron/hourly',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || (select decrypted_secret from vault.decrypted_secrets where name = 'cron_secret' limit 1)
    ),
    body := '{}'::jsonb,
    timeout_milliseconds := 60000
  );
  $$
);
```

### L2-g. Visites de live — diagnostic (aucune écriture)

Cause probable (voir rapport lot-2a) : RPC `record_live_course_visit` exige `auth.uid()`, cours publié, et `course_access_level = full` ; les erreurs sont avalées côté client. Table sans policy SELECT cliente. Correctif proposé **hors zone interdite** si Kevin le décide : journaliser l’échec RPC (hors `LiveVisitRecorder`) ou assouplir `course_access_level` — **non appliqué**.

```sql
-- Lecture seule
select count(*) as n_30j
from public.live_course_daily_visits
where visit_date >= current_date - 30;

select course_id, count(*) as n
from public.live_course_daily_visits
where visit_date >= current_date - 30
group by 1
order by n desc
limit 20;
```

Présence = `created_at` (pas `visit_date`) entre 15 min avant `courses.starts_at` et `courses.ends_at`, calculée à la lecture.

## Lot 3 — Programmes

> Rien de ce bloc n’a été exécuté. Import `--apply` : Kevin seulement, après GO. `standalone_vimeo_videos.id` = **uuid** (migration `010_standalone_vimeo_library.sql`) → FK uuid OK.

### L3-a. Tables

```sql
create table if not exists public.programs (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  status text not null default 'draft' check (status in ('draft','published','archived')),
  level smallint not null check (level between 0 and 3),
  track text not null,
  goals text[] not null default '{}',
  intensity smallint, impact text, live_style text,
  title jsonb not null, promise jsonb, for_who jsonb, not_for jsonb, coach_note jsonb,
  benefits jsonb not null default '[]', equipment jsonb not null default '[]', tests jsonb not null default '[]',
  weeks smallint not null, sessions_per_week smallint not null, minutes_range text,
  cover_url text, next_program_id uuid references public.programs(id),
  sort_order int not null default 0,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);

create table if not exists public.program_weeks (
  id uuid primary key default gen_random_uuid(),
  program_id uuid not null references public.programs(id) on delete cascade,
  week smallint not null, focus jsonb not null, cues jsonb not null default '[]',
  unique (program_id, week)
);

create table if not exists public.program_steps (
  id uuid primary key default gen_random_uuid(),
  program_id uuid not null references public.programs(id) on delete cascade,
  week smallint not null, position smallint not null,
  kind text not null check (kind in ('video','live')),
  video_id uuid references public.standalone_vimeo_videos(id) on delete restrict,
  start_s int, end_s int, segment_to_validate boolean not null default false,
  minutes smallint, objective jsonb, objective_long jsonb, live_style text,
  unique (program_id, week, position)
);

create sequence if not exists public.program_certificate_seq;

create table if not exists public.program_enrollments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  program_id uuid not null references public.programs(id),
  status text not null default 'active' check (status in ('active','paused','completed','abandoned')),
  start_date date not null,
  chosen_days smallint[] not null default '{1,3,5}',
  reminder_time time not null default '18:00',
  reminder_email boolean not null default true,
  reminder_inapp boolean not null default true,
  reminder_push boolean not null default false,
  paused_at timestamptz, completed_at timestamptz, certificate_number text unique,
  postponed_until date,
  created_at timestamptz not null default now()
);
create unique index if not exists program_enrollments_one_active
  on public.program_enrollments(user_id) where status = 'active';

create table if not exists public.program_step_progress (
  id uuid primary key default gen_random_uuid(),
  enrollment_id uuid not null references public.program_enrollments(id) on delete cascade,
  step_id uuid not null references public.program_steps(id) on delete cascade,
  watched_s int not null default 0, completed_at timestamptz,
  feeling text check (feeling in ('easy','right','hard')),
  unique (enrollment_id, step_id)
);

create table if not exists public.program_test_results (
  id uuid primary key default gen_random_uuid(),
  enrollment_id uuid not null references public.program_enrollments(id) on delete cascade,
  phase text not null check (phase in ('start','end')),
  results jsonb not null, created_at timestamptz not null default now(),
  unique (enrollment_id, phase)
);

create table if not exists public.program_feedback (
  id uuid primary key default gen_random_uuid(),
  enrollment_id uuid not null references public.program_enrollments(id) on delete cascade,
  rating smallint check (rating between 1 and 5), message text,
  publish_consent boolean not null default false, consent_withdrawn_at timestamptz,
  created_at timestamptz not null default now()
);
```

### L3-b. RLS — SELECT cliente seulement, écritures via service_role

```sql
alter table public.programs enable row level security;
alter table public.program_weeks enable row level security;
alter table public.program_steps enable row level security;
alter table public.program_enrollments enable row level security;
alter table public.program_step_progress enable row level security;
alter table public.program_test_results enable row level security;
alter table public.program_feedback enable row level security;

revoke all on public.programs, public.program_weeks, public.program_steps,
  public.program_enrollments, public.program_step_progress,
  public.program_test_results, public.program_feedback from anon;
revoke insert, update, delete on public.programs, public.program_weeks, public.program_steps,
  public.program_enrollments, public.program_step_progress,
  public.program_test_results, public.program_feedback from authenticated;

grant select on public.programs, public.program_weeks, public.program_steps to authenticated;
grant select on public.program_enrollments, public.program_step_progress,
  public.program_test_results, public.program_feedback to authenticated;
grant all on public.programs, public.program_weeks, public.program_steps,
  public.program_enrollments, public.program_step_progress,
  public.program_test_results, public.program_feedback to service_role;
grant usage, select on sequence public.program_certificate_seq to service_role;

create policy programs_select_published on public.programs
  for select to authenticated
  using (
    status = 'published'
    or exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin')
  );
create policy program_weeks_select on public.program_weeks
  for select to authenticated
  using (
    exists (select 1 from public.programs pr where pr.id = program_id and pr.status = 'published')
    or exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin')
  );
create policy program_steps_select on public.program_steps
  for select to authenticated
  using (
    exists (select 1 from public.programs pr where pr.id = program_id and pr.status = 'published')
    or exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin')
  );
create policy enrollments_select_own on public.program_enrollments
  for select to authenticated using (user_id = auth.uid());
create policy progress_select_own on public.program_step_progress
  for select to authenticated
  using (exists (select 1 from public.program_enrollments e where e.id = enrollment_id and e.user_id = auth.uid()));
create policy tests_select_own on public.program_test_results
  for select to authenticated
  using (exists (select 1 from public.program_enrollments e where e.id = enrollment_id and e.user_id = auth.uid()));
create policy feedback_select_own on public.program_feedback
  for select to authenticated
  using (exists (select 1 from public.program_enrollments e where e.id = enrollment_id and e.user_id = auth.uid()));
```

### L3-c. Fonction atomique « démarrer un programme »

Met en pause l’inscription `active` éventuelle, puis crée la nouvelle. `security definer` réservé à `service_role` (actions serveur).

```sql
create or replace function public.start_program(
  p_user_id uuid,
  p_program_id uuid,
  p_start_date date,
  p_chosen_days smallint[],
  p_reminder_time time,
  p_reminder_email boolean,
  p_reminder_inapp boolean,
  p_reminder_push boolean
) returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  new_id uuid;
begin
  update public.program_enrollments
    set status = 'paused', paused_at = now()
    where user_id = p_user_id and status = 'active';

  insert into public.program_enrollments (
    user_id, program_id, status, start_date, chosen_days,
    reminder_time, reminder_email, reminder_inapp, reminder_push
  ) values (
    p_user_id, p_program_id, 'active', p_start_date, p_chosen_days,
    p_reminder_time, p_reminder_email, p_reminder_inapp, p_reminder_push
  ) returning id into new_id;

  return new_id;
end;
$$;

revoke all on function public.start_program(uuid, uuid, date, smallint[], time, boolean, boolean, boolean) from public, anon, authenticated;
grant execute on function public.start_program(uuid, uuid, date, smallint[], time, boolean, boolean, boolean) to service_role;

create or replace function public.nextval_program_certificate()
returns bigint
language sql
security definer
set search_path = public
as $$ select nextval('public.program_certificate_seq'); $$;
revoke all on function public.nextval_program_certificate() from public, anon, authenticated;
grant execute on function public.nextval_program_certificate() to service_role;
```

## Lot 4 — Cartes cadeaux

Non appliqué. Lecture admin ; écritures `service_role` uniquement.

```sql
create table if not exists public.gift_cards (
  id uuid primary key default gen_random_uuid(),
  code text unique not null,
  months smallint not null check (months in (1,3,6,12)),
  amount_cents int not null, currency text not null default 'eur', locale text not null default 'fr',
  stripe_checkout_session_id text unique, stripe_payment_intent_id text,
  buyer_name text not null, buyer_email text not null, buyer_timezone text,
  recipient_name text not null, recipient_email text,
  message text check (char_length(message) <= 250),
  delivery text not null check (delivery in ('email','print')),
  send_at timestamptz, buyer_email_sent_at timestamptz, recipient_email_sent_at timestamptz,
  status text not null default 'paid' check (status in ('paid','scheduled','sent','activated','expired','refunded')),
  expires_at timestamptz not null,
  activation_mode text check (activation_mode in ('new_trial','existing_no_access','balance_credit','trial_extension')),
  activated_by uuid references public.profiles(id), activated_at timestamptz, access_ends_at timestamptz,
  stripe_subscription_id text,
  reminder_14_sent_at timestamptz, reminder_3_sent_at timestamptz, converted_at timestamptz,
  refunded_at timestamptz, refund_amount_cents int,
  created_at timestamptz not null default now()
);
alter table public.gift_cards enable row level security;
revoke all on public.gift_cards from anon, authenticated;
grant select, insert, update on public.gift_cards to service_role;
```

## Lot 5 — Conversion et expérience

Non appliqué.

```sql
create table if not exists public.client_followups (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles(id),
  followed_at timestamptz not null default now(),
  channel text not null check (channel in ('whatsapp','email')),
  reason text,
  note text,
  author_id uuid references public.profiles(id)
);
alter table public.client_followups enable row level security;
revoke all on public.client_followups from anon, authenticated;
grant select, insert on public.client_followups to service_role;

-- Noms boutique FR/ES éditables (sans changer le slug Printful)
create table if not exists public.printful_product_names (
  printful_product_id bigint primary key,
  name_fr text,
  name_es text,
  slug text unique,
  updated_at timestamptz not null default now()
);
alter table public.printful_product_names enable row level security;
revoke all on public.printful_product_names from anon, authenticated;
grant select, insert, update on public.printful_product_names to service_role;
```

## Lot 7 — Croissance

Non appliqué. **Aucun SQL obligatoire pour allumer le code** (overlay mémoire derrière `CROISSANCE_V2`).

Réglage « comptes de l’équipe » (Instagram, e-mails, téléphones à ignorer dans les compteurs, SPEC §12.1) — table proposée, GO Kevin :

```sql
create table if not exists public.acq_team_accounts (
  id uuid primary key default gen_random_uuid(),
  kind text not null check (kind in ('instagram', 'email', 'phone')),
  value text not null,
  created_at timestamptz not null default now()
);
alter table public.acq_team_accounts enable row level security;
revoke all on public.acq_team_accounts from anon, authenticated;
grant select, insert, update, delete on public.acq_team_accounts to service_role;
```

Sans cette table : interrupteur « Inclure les tests » masque seulement les handles démo déjà connus ; la liste équipe n’est pas encore persistée.

---

## Lot 6 — Fonction d'accès unique

Non appliqué. **Aucun SQL obligatoire.** ACCESS_V2 lit `subscriptions` (status active/trialing, `sub_…`, `ends_at`, `livemode` via Stripe si clé live).

Activation bloquée tant que le comparatif `scripts/chantier-oct/compare-access-v2.ts` affiche des écarts (lot 1 : 3 profils `active` sans subscription active, 2 `customer_tier` orphelins). Correction des **données** = GO Kevin, pas une migration de schéma.

```sql
-- Optionnel, après GO : mémoriser livemode pour ne plus dépendre d'un retrieve Stripe
-- alter table public.subscriptions add column if not exists livemode boolean;
```

