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
