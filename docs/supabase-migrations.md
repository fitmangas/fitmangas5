# Migrations Supabase

Ce document sert de guide pour remettre la base de production à niveau et pour utiliser la CLI Supabase sur les prochaines migrations.

## État connu production

- Les migrations de **Phase 1 communications** ont été appliquées manuellement sur Supabase prod.
- Les migrations `020_vimeo_granular_sync_hidden.sql`, `021_launch_security_rls.sql` et `022_blog_visio_only_rls.sql` n'ont pas encore été appliquées sur Supabase prod.
- Pour les migrations entre Phase 1 et `020`, aucun log d'application prod fiable n'a été trouvé dans les docs. Leur statut prod doit donc être confirmé par inspection SQL.

## Inventaire chronologique

- `001_profiles.sql` : crée `profiles`, les policies utilisateur et le trigger de création de profil. Mentionnée dans la chaîne historique initiale, statut prod probable : appliquée si l'app actuelle fonctionne.
- `002_access_control_calendar.sql` : crée les enums d'offres, cours, abonnements, inscriptions, policies d'accès et matrice d'accès. Mentionnée dans `docs/access-control-guide.md`, statut prod probable : appliquée.
- `003_courses_capacity_max.sql` : remplace `capacity` par `capacity_max` sur les cours. Non mentionnée comme appliquée ; statut prod probable : appliquée si l'admin cours actuel fonctionne.
- `004_courses_jitsi_link.sql` : ajoute `courses.jitsi_link` pour les lives. Commit lié à Jitsi visible dans l'historique ; statut prod probable : appliquée.
- `005_video_recordings.sql` : crée `video_recordings` et les policies de lecture replay. Non mentionnée comme appliquée ; statut prod probable : appliquée si les replays historiques fonctionnent.
- `006_cockpit_admin.sql` : ajoute `promo_codes`, `view_count` et `increment_replay_view`. Non mentionnée comme appliquée ; statut prod incertain.
- `007_client_premium.sql` : ajoute avatar, favoris/progression replay, notifications in-app et bucket avatars. Non mentionnée comme appliquée ; statut prod probable : appliquée si l'espace client premium est actif.
- `008_automation_gamification.sql` : ajoute gamification, date de naissance, visites live et fonctions de rapports. Non mentionnée comme appliquée ; statut prod incertain.
- `009_business_stats_daily.sql` : crée les snapshots business quotidiens et la fonction de refresh. Non mentionnée comme appliquée ; statut prod incertain.
- `010_standalone_vimeo_library.sql` : crée la bibliothèque Vimeo autonome avec validation admin. Non mentionnée comme appliquée ; statut prod probable : appliquée si l'admin Vimeo autonome fonctionne.
- `011_standalone_vimeo_folder.sql` : ajoute `vimeo_folder_name`. Non mentionnée comme appliquée ; statut prod probable : appliquée si les dossiers Vimeo s'affichent.
- `012_standalone_vimeo_scheduling_coach.sql` : ajoute programmation, rejet et `coach_id` Vimeo. `docs/vimeo-admin-improvements.md` indique de l'appliquer avant production ; statut prod incertain.
- `013_profiles_calendar_sync.sql` : ajoute `calendar_sync_enabled` et `calendar_sync_token`. Non mentionnée comme appliquée ; statut prod incertain.
- `014_calendar_sync_eligibility.sql` : crée `customer_calendar_feed_eligible`. Non mentionnée comme appliquée ; statut prod incertain.
- `015_blog_system.sql` : crée le système blog, traductions, ratings, newsletter, validations et RLS de base. Mentionnée dans `docs/blog-setup.md` comme migration à appliquer ; statut prod probable : appliquée si le blog admin existe en prod.
- `016_blog_favorites.sql` : ajoute les favoris blog client. Non mentionnée comme appliquée ; statut prod incertain.
- `017_blog_ops_newsletter_analytics.sql` : ajoute tokens double opt-in, logs publication et logs cron blog. Non mentionnée comme appliquée ; statut prod incertain.
- `018_standalone_vimeo_favorites.sql` : ajoute les favoris Vimeo autonomes. Non mentionnée comme appliquée ; statut prod incertain.
- `019_printful_product_sort_order.sql` : ajoute le tri manuel des produits Printful. Non mentionnée comme appliquée ; statut prod incertain.
- `20260430143000_phase1_comms_foundation.sql` : fondation communications, préférences, logs, push et caps. Les migrations Phase 1 sont connues comme appliquées manuellement en prod.
- `20260430210000_try_reserve_email_slot.sql` : réserve atomiquement les slots email pour le cap journalier. Suite Phase 1 ; statut prod probable : appliquée avec Phase 1 ou à confirmer.
- `20260501120000_ensure_notification_prefs_row.sql` : garantit une ligne `notification_preferences` pour un profil. Suite Phase 1 ; statut prod probable : appliquée avec la page préférences ou à confirmer.
- `20260510120000_enable_realtime_user_notifications.sql` : ajoute `user_notifications` à la publication Realtime. Commit realtime visible dans l'historique ; statut prod probable : appliquée.
- `20260510130000_signup_locale_timezone_detection.sql` : met à jour le trigger signup pour langue et fuseau. Commit signup/resend visible dans l'historique ; statut prod probable : appliquée.
- `20260510170000_stripe_events_idempotency.sql` : crée `stripe_events` pour l'idempotence Stripe. Statut prod incertain ; important à vérifier avant webhooks prod.
- `020_vimeo_granular_sync_hidden.sql` : ajoute `app_sync_state`, `is_hidden`, `hidden_at` et RLS Vimeo visible uniquement. Connue comme non appliquée en prod.
- `021_launch_security_rls.sql` : durcit RLS pour `stripe_events` et `business_stats_daily`. Connue comme non appliquée en prod.
- `022_blog_visio_only_rls.sql` : réserve la lecture blog aux abonnés Visio et admins. Connue comme non appliquée en prod.

## Script de vérification et rattrapage

Le fichier `supabase/migrations/CATCH_UP_ALL.sql` regroupe les migrations connues en SQL idempotent.

Utilisation recommandée :

1. Ouvrir le Dashboard Supabase du projet prod.
2. Aller dans SQL Editor.
3. Coller le contenu de `supabase/migrations/CATCH_UP_ALL.sql`.
4. Exécuter une première fois.
5. Relancer une deuxième fois uniquement si nécessaire pour vérifier l'idempotence.

Le script ne remplace pas un historique de migrations CLI propre. Il sert de rattrapage quand la base a reçu des migrations manuelles ou partielles.

## Configuration Supabase CLI

Installer la CLI Supabase :

```bash
npm install -g supabase
```

Se connecter :

```bash
npx supabase login
```

Lier le projet prod :

```bash
npx supabase link --project-ref csamqilppttijrpnadtr
```

Pousser les migrations futures :

```bash
npx supabase db push
```

Commandes utiles :

```bash
npx supabase migration list
npx supabase db diff
```

À partir du moment où le projet est lié, ne pas utiliser `--project-ref` avec `db push` si la version locale de la CLI ne supporte pas ce flag.

## Variables utiles

Les variables suivantes sont documentées dans `.env.example` :

- `SUPABASE_PROJECT_REF` : référence du projet, ici `csamqilppttijrpnadtr` en prod.
- `SUPABASE_ACCESS_TOKEN` : optionnel pour CI/CD non interactif.
- `SUPABASE_DB_PASSWORD` : optionnel si la CLI le demande lors du link/push.
- `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` et `SUPABASE_SERVICE_ROLE_KEY` : déjà nécessaires à l'application, sans exposition de la clé service côté client.
