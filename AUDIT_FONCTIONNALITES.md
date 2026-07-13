# Audit fonctionnel FitMangas

Audit réalisé en lecture seule à partir du code du projet (`src/app`, `src/components`, `src/lib`, routes API, migrations Supabase, docs d'intégration et configuration).  
Objectif : inventorier les fonctionnalités réellement présentes et qualifier leur maturité.

Légende :

- ✅ Complet : fonctionnalité réellement câblée, utilisable si les variables d'environnement et services externes sont configurés.
- 🟡 Partiel : fonctionnalité présente mais dépendante d'une configuration externe, d'un flux manuel, d'une hypothèse fragile, ou avec une partie non branchée.
- 🔴 Placeholder ou inactif : écran/flux de compatibilité, état vide, redirection legacy, code mort ou fonctionnalité annoncée mais non pleinement branchée.

## 1. Vue d'ensemble

### Stack technique réelle

- ✅ Frontend : Next.js 15 App Router, React 19, TypeScript, Tailwind CSS, composants client/serveur mixtes.
- ✅ Backend applicatif : routes API Next.js sous `src/app/api`, Server Actions, Supabase SSR (`@supabase/ssr`).
- ✅ Base de données et auth : Supabase Auth + PostgreSQL + RLS + RPC `security definer`.
- ✅ Paiement : Stripe Checkout, Billing Portal, webhooks Stripe.
- ✅ Lives : Jitsi auto-hébergé via External API iframe, JWT Jitsi côté serveur, Jibri attendu côté infra.
- ✅ Replays et VOD : Vimeo API, Vimeo Player, webhooks Vimeo, tables de validation.
- ✅ Emails/notifications : Resend, notifications in-app, push web, digest queue, dispatcher central.
- ✅ Boutique : Printful products/orders/webhooks.
- ✅ IA/marketing : Gemini (`@google/genai`), Google Analytics Data API, Google Search Console API, Meta Pixel/GA4 public.

### Structure du projet

- `src/app` : 43 pages `page.tsx`, 64 routes `route.ts`, 23 fichiers `actions*.ts`, 4 layouts.
- `src/components` : environ 98 composants, structurés par domaines (`Compte`, `Admin`, `Calendar`, `Replay`, `Blog`, `Jitsi`, `Marketing`, `Premium`, `Support`, `ui`).
- `src/lib` : environ 155 fichiers de logique métier et intégrations.
- `supabase/migrations` : 43 fichiers (incluant `CATCH_UP_ALL.sql`), couvrant profils, accès cours, replays, blog, notifications, Printful, Vimeo, parrainage, support, marketing.

### Architecture

- ✅ Auth : Supabase Auth avec sessions SSR, callback OAuth/email, pages `/connexion` et `/login`.
- ✅ Rôles : `profiles.role` (`member`/`admin`) + liste `ADMIN_EMAILS`. Certaines fonctions admin exigent à la fois rôle et email listé pour la "Vue Client".
- ✅ SSR/CSR : pages sensibles en SSR avec `createClient()`, UI interactive en composants client.
- ✅ Accès membres : calcul par `current_customer_tier()`, `course_access_level()`, `getCoursesForUser()`, `hasVisioClientAccess()`.
- ✅ Admin : layout protégé par `requireAdmin()`, API admin protégée par `requireAdminApi` ou vérification équivalente.
- 🟡 Migrations : couverture large, mais historique prod incertain selon `docs/supabase-migrations.md`; `CATCH_UP_ALL.sql` diverge de certaines migrations finales.

## 2. Espace membre, page par page

### `/compte` — Dashboard membre

État : ✅ Complet

Fonctions :

- Affiche salutation personnalisée, avatar, badge de niveau, progression mensuelle, prochain live, replays/bibliothèque, blog, planning, notifications non lues.
- Lit `profiles`, `user_notifications`, `enrollments`, `courses`, `video_recordings`, `standalone_vimeo_videos`, marketing settings.
- Utilise `getNextAppointment()`, `getMonthlyProgress()`, `getReplayLibraryForUser()`, `getStandaloneVimeoLibraryForUser()`.
- Actions : navigation vers profil, notifications, planning, replays, blog, live, signout.
- Tracking achat post-checkout via `CheckoutPurchaseTracker` (GA/Meta si configurés).

Observations :

- `VisioLock` protège replays/blog/bibliothèque selon accès Visio.
- Les widgets sont réels, pas statiques.

### `/compte/planning` — Planning client

État : ✅ Complet

Fonctions :

- Affiche `SmartCalendar` sur 14 jours.
- Lit `/api/calendar/events`, affiche cours avec accès `full`, `preview`, `locked`.
- Ouvre une modale cours (`CalendarCourseModal`), permet d'accéder au live/replay selon droits.
- Marque les notifications live/planning comme lues.
- Propose une synchronisation mobile/webcal via `/api/calendar/mobile-sync`.

Observations :

- La synchronisation calendrier dépend des champs profil et d'un token feed.
- Les états d'accès sont branchés sur la matrice Supabase.

### `/live/[courseId]` — Live ou replay de cours

État : ✅ Complet côté app, 🟡 dépendant de l'infra Jitsi/Jibri

Fonctions :

- Vérifie auth, UUID cours, accès, rôle admin, mode Vue Client.
- Affiche Jitsi si cours à venir/en cours, Vimeo si replay approuvé prêt, ou "Replay en préparation".
- Génère un token Jitsi via `/api/jitsi/token`.
- Enregistre une visite live via `record_live_course_visit`.
- Suit vues replay (`increment_replay_view`) et progression Vimeo (`upsert_replay_progress`).
- Gère Spotify playlist si renseignée.

Jitsi :

- Toolbar modérateur avec micro, caméra, `toggle-camera`, fullscreen, participants, desktop, etc.
- Toolbar client sans micro.
- Clients démarrent micro coupé (`startWithAudioMuted`, `startAudioMuted`).
- Modérateur active la modération audio (`toggleModeration`) et lance l'enregistrement Jibri automatiquement.
- Replay coach-only tenté via `setTileView(false)`, `pinParticipant(coachId)`, `setFollowMe(true, true)`.
- Plein écran navigateur app + bouton fullscreen Jitsi.

Risques :

- Le contrôle fin des micros dépend d'AV moderation côté serveur Jitsi.
- Le replay coach-only dépend du support Jitsi de `setFollowMe(..., recorderOnly=true)` et de Jibri côté infra.
- Jibri/finalize.sh ne sont pas dans ce repo.

### `/compte/replays` — Replays et bibliothèque

État : ✅ Complet

Fonctions :

- Replays de cours via `video_recordings` approuvés et prêts.
- Vidéos standalone Vimeo via `standalone_vimeo_videos`.
- Recherche, tri, onglet favoris, pagination.
- Hero dernier replay, historique, favoris.
- Lecture des replays de cours via `/live/[courseId]`.
- Lecture des vidéos standalone en modal Vimeo.
- Favoris replays et standalone.

Données :

- `video_recordings`, `replay_favorites`, `replay_playback_progress`.
- `standalone_vimeo_videos`, `standalone_vimeo_favorites`.

Observations :

- Accès protégé par `hasVisioClientAccess()` et RLS.
- Les vidéos standalone sans dossier ou non visibles sont filtrées.

### `/compte/blog` — Blog membre

État : ✅ Complet

Fonctions :

- Liste articles publiés, dernier article en vedette, filtres catégorie/recherche/tri.
- Favoris blog (`blog_article_favorites`).
- Verrou Visio si non éligible.
- Marque notifications blog comme lues.

Observations :

- Un `console.log('[compte/blog] hero')` reste dans le code : bruit de debug, non bloquant.

### `/blog` et `/blog/[slug]` — Blog

État : ✅ Complet mais 🟡 pas vraiment public

Fonctions :

- `/blog` liste les articles publiés, catégories, recherche, pagination, CTA newsletter.
- `/blog/[slug]` affiche l'article, langue FR/ES, favori, note, tracking vue/scroll/heatmap.
- Métadonnées SEO dynamiques côté article.

Important :

- Le blog public exige une session et un accès Visio (`hasVisioClientAccess`) ; sinon redirection.
- Cela contredit partiellement l'idée marketing d'un blog public servant d'acquisition SEO.

### `/compte/progression` — Progression, badges, statistiques

État : 🟡 Partiel

Fonctions :

- Affiche heures live/replay du mois, rythme mensuel, engagement, badge courant, prochains paliers.
- Lit `profiles`, `enrollments`, `replay_playback_progress`.
- Calcule localement des métriques : lives, heures replay, semaines/mois actifs, objectifs mensuels.

Incohérence :

- SQL stocke `gamification_grade` (`debutant`, `confirme`, `expert`) via points.
- La page progression calcule localement des paliers `debutant`, `confirmee`, `experte` avec règles différentes.
- Risque d'écart entre badge affiché dashboard et page progression.

### `/compte/profil` — Profil, préférences, facturation

État : ✅ Complet

Fonctions :

- Avatar, date de naissance, email.
- Langue, timezone, lock manuel.
- Préférences notifications/email/push, silence mode, catégories.
- Marketing opt-in.
- Accès Billing Portal Stripe.
- Lien commandes boutique.

Données :

- `profiles`, `notification_preferences`, `push_subscriptions`.

### `/compte/preferences`

État : ✅ Compatibilité

- Redirige vers `/compte/profil#notifications`.

### `/compte/notifications`

État : ✅ Complet

Fonctions :

- Liste les 50 dernières notifications.
- Marque les non lues comme lues au chargement.
- UI `NotificationsInbox` avec actions de lecture.

### `/compte/parrainage`

État : 🟡 Partiel business, complet côté UI

Fonctions :

- Affiche code de parrainage, lien `?ref=CODE`, partage WhatsApp.
- Liste filleules et statuts (`pending`, `signed_up`, `subscribed`).
- Affiche progression vers récompense si programme éligible.

Limites :

- La récompense est logique métier (`referral_reward_active`, coupon Stripe) mais dépend de `STRIPE_REFERRAL_REWARD_COUPON_ID` et des helpers Stripe.
- Programme réservé aux offres Visio selon code.

### `/compte/boutique`

État : 🟡 Partiel à risque business

Fonctions :

- Catalogue Printful, détails produits/variantes, panier local, formulaire adresse.
- Création commande via `/api/printful/orders/create`.

Risque majeur :

- La route crée une commande Printful confirmée (`confirm: true`) sans étape de paiement Stripe boutique visible. Cela peut créer une commande fournisseur sans paiement client dédié.

### `/compte/boutique/commandes` et `/compte/boutique/en-cours`

État : ✅ Complet si Printful configuré

Fonctions :

- Liste commandes Printful filtrées par email utilisateur.
- Détails : statut, adresse, items, prix, facture, tracking si disponible.
- État vide propre.

### Support membre

État : ✅ Complet

Fonctions :

- Bouton flottant support dans layout compte.
- Création `support_tickets`.
- Notification cliente + email via dispatcher.
- Notification admin in-app.

## 3. Lives & cours en direct

État global : 🟡 App complète, infra externe critique

### Cours

- ✅ CRUD admin de cours : titre, description, format (`online`/`onsite`), catégorie (`individual`/`group`), dates, timezone, capacité, lieu, Jitsi, replay, playlist Spotify, publication.
- ✅ Calendrier client sur 14 jours.
- ✅ Accès calculé via `access_policies`, `subscriptions`, `enrollments`.
- ✅ Achats présentiels peuvent créer des `enrollments`.
- ✅ Pointage admin via `/admin/courses/[courseId]/attendance`.

### Réservation / accès

- ✅ Abonnements online donnent accès selon matrice.
- ✅ Achats unitaires présentiels liés au prochain cours concret si trouvé.
- 🟡 Risque DB : `course_access_level()` retourne `locked` si `current_customer_tier()` est `null` avant de considérer l'enrollment ; à vérifier pour one-shot présentiel sans `customer_tier`.

### Jitsi

- ✅ External API iframe dans `JitsiRoom`.
- ✅ JWT Jitsi (`createJitsiJwtToken`) avec claim moderator.
- ✅ Token API vérifie accès.
- ✅ Admin/modérateur peut lancer automatiquement l'enregistrement.
- ✅ Plein écran, toolbar mobile `toggle-camera`, clients muets par défaut.
- 🟡 Audio moderation fine dépend de config serveur Jitsi.

### Enregistrement et replay

- ✅ `startRecording` côté modérateur.
- ✅ Convention d'ingestion Jibri : nom de fichier parsé, matching cours par slug/date.
- ✅ `/api/internal/recordings/ingest` protégé par `RECORDING_INGEST_SECRET`.
- ✅ Sync Vimeo vers `video_recordings`.
- ✅ Validation admin avant publication cliente.
- 🟡 Jibri/finalize.sh sont externes au repo.
- 🟡 Replay coach-only est piloté côté app, mais dépend de Jitsi/Jibri serveur.

## 4. Bibliothèque & contenu à la demande

État global : ✅ Complet côté app, 🟡 dépend de Vimeo et validation admin

### Replays de cours

- Tables : `video_recordings`, `replay_favorites`, `replay_playback_progress`.
- États : `pending`, `approved`, `rejected`; `is_ready`; `upload_status`.
- Admin : `/admin/replays` pour valider/rejeter.
- Client : `/compte/replays`, `/live/[courseId]`.
- Tracking : vues + position vidéo Vimeo.

### Vidéos standalone Vimeo

- Table : `standalone_vimeo_videos`.
- Admin : `/admin/vimeo`, sync all/new, validation, rejet, scheduling, masquage.
- Client : bibliothèque regroupée par dossier Vimeo, modal player, favoris.
- RLS : abonnés online/admin, `validation_status='published'`, `is_hidden=false`.

### Durée catalogue

- Le dashboard client calcule les heures disponibles à partir de `duration_seconds`.
- Pas de durée totale fixe dans le code ; elle dépend des lignes Vimeo en base.

## 5. Progression, niveaux & gamification

État global : 🟡 Partiel / incohérent

### Gamification SQL

- `profiles.gamification_points`, `gamification_grade`, `onsite_presence_count`, `total_replay_watch_seconds`, `live_visit_count`.
- `refresh_user_gamification()` :
  - présence onsite x30 ;
  - minutes replay plafonnées à 600 x2 ;
  - visites live x15 ;
  - `<80` débutant, `<250` confirmé, sinon expert.
- Triggers/RPC :
  - `upsert_replay_progress()` ;
  - `record_live_course_visit()` ;
  - `trg_enrollment_attended_gamification()`.

### UI progression

- Page `/compte/progression` recalcule ses propres paliers :
  - Débutant : 4 lives, 2h replay, 2 semaines actives.
  - Confirmée : 12 lives, 10h replay, 6 semaines actives, 2 mois à 70%+.
  - Experte : 30 lives, 25h replay, 4 mois actifs, 3 mois à 85%+.

### Maturité

- 🟡 Les données et écrans existent.
- 🟡 Les règles SQL et UI ne sont pas alignées, ce qui peut produire des badges contradictoires.

## 6. Monétisation implémentée

### Offres Stripe

État : ✅ Complet si variables Stripe configurées

Offres dans `checkout-courses.ts` :

- `v-coll` : abonnement Visio collectif, 39 €/mois, Stripe subscription.
- `v-ind` : abonnement Visio individuel, 269 €/mois, Stripe subscription.
- `n-coll` : Nantes collectif, 10 €, paiement ponctuel.
- `n-ind` : Nantes individuel, 50 €, paiement ponctuel.

Flux :

- Landing/checkout modal → `/api/checkout` ou `/api/checkout/post-signup`.
- Stripe Checkout session serveur.
- Webhook Stripe signé en production.
- Sync `profiles`, `subscriptions`, `enrollments`.
- Billing Portal client.
- Notifications activation, renouvellement, paiement échoué, annulation, win-back.

Ce qui rapporte réellement de l'argent aujourd'hui :

- ✅ Abonnements Visio Stripe.
- ✅ Paiements ponctuels Nantes Stripe.
- 🟡 Boutique Printful : création commande existe, mais paiement client boutique non visible dans le code.
- 🟡 Parrainage : peut réduire/offrir via coupon Stripe, mais dépend d'un coupon env et de règles qualification.
- 🔴 Promos admin : stockées en base, UI présente, mais non branchées à Stripe Promotion Codes selon l'UI/commentaires.

### Accès payants

- ✅ Replays, bibliothèque Vimeo et blog complet verrouillés par Visio.
- ✅ Planning/lives filtrés par accès.
- ✅ Upsells via `VisioLock` et access policies.

## 7. Communauté & social

État global : 🟡 Partiel

Fonctionnalités présentes :

- ✅ Parrainage avec code/lien, statut filleules et progression récompense.
- ✅ Support ticket membre/admin.
- ✅ Favoris blog, favoris replays, favoris vidéos standalone.
- ✅ Notes d'articles (ratings).
- ✅ Newsletter blog double opt-in.
- 🟡 WhatsApp flottant public et liens de partage parrainage.
- 🔴 Pas de groupes internes, commentaires, forum, chat communautaire, classement public ou feed social.
- 🔴 Checklist marketing mentionne "groupe WhatsApp créé", mais ce n'est pas une fonctionnalité app.

## 8. Emails & notifications

État global : ✅ Complet, avec dégradation si Resend/VAPID absents

### Dispatcher

- Centralisé dans `notifications/dispatcher.ts`.
- Canaux : in-app, email, push, digest.
- Préférences par catégorie.
- Quiet hours, silence mode, caps journaliers, idempotence.
- Logs dans `notification_log`.

### Templates emails

Environ 30 event types/templates :

- Onboarding J0/J1/J3/J7.
- Abonnement activé, renouvelé, annulé, paiement échoué, win-back.
- Rappels cours visio J-1/H-1.
- Rappels présentiel J-1/H-2.
- Cours annulé, manqué, replay prêt.
- Achat présentiel, achat présentiel sans cours planifié.
- Blog publié.
- Boutique commande payée/expédiée.
- Anniversaire.
- Digest.
- Support ticket reçu.
- Récompense parrainage.
- Checkout abandonné.

### Notifications in-app

- Table `user_notifications`.
- Bell compte/admin, pages inbox, lecture, mark all read.
- Supabase realtime activé via migration dédiée.

### Push

- Table `push_subscriptions`, VAPID.
- Composant opt-in.
- Envoi via `web-push`.
- 🟡 Dépend de variables absentes de `.env.example` (`NEXT_PUBLIC_VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`).

## 9. Intégrations tierces

État par intégration :

- ✅ Supabase : Auth, DB, Storage, Realtime, service role.
- ✅ Stripe : checkout, webhooks, subscriptions, portal, coupons parrainage.
- ✅ Vimeo : metadata, upload serveur TUS, sync compte, webhook, player, scheduling.
- 🟡 Jitsi : embed/JWT complet côté app ; serveur auto-hébergé requis.
- 🟡 Jibri : conventions et ingestion, mais infra hors repo.
- ✅ Resend : emails transactionnels/newsletter si env.
- 🟡 Printful : produits, commandes, webhooks, mais paiement boutique à clarifier.
- ✅ Gemini : génération blog, traduction, advisors admin.
- 🟡 OpenAI : fallback env mentionné, usage limité/à vérifier selon chemins IA.
- ✅ Google Analytics Data API : dashboard marketing live via service account.
- ✅ Google Search Console : dashboard marketing live via service account.
- ✅ GA4/Meta Pixel : injection publique via `admin_settings`.
- 🟡 Unsplash : images blog via clé env si génération.
- ✅ WhatsApp/Instagram : liens publics/config landing.

Variables lues mais absentes/incomplètes dans `.env.example` :

- `JITSI_APP_ID`, `JITSI_APP_SECRET`, `JITSI_JWT_AUD`, `JITSI_JWT_ISS`, `JITSI_JWT_SUB`, `JITSI_JWT_KID`, `NEXT_PUBLIC_JITSI_DOMAIN`.
- `PRINTFUL_WEBHOOK_SECRET`.
- `GSC_SITE_URL`.
- `NEXT_PUBLIC_SHOW_MEXICO`, `NEXT_PUBLIC_WHATSAPP_E164`.
- `NEXT_PUBLIC_VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`.
- `NOTIFICATION_EMAIL_DAILY_CAP`, `NOTIFICATION_INAPP_UNREAD_DAILY_CAP`, `NOTIFICATION_QUIET_HOURS_START`, `NOTIFICATION_QUIET_HOURS_END`.
- `NEXT_PUBLIC_MONTHLY_SESSION_GOAL`, `INACTIVITY_DAYS_THRESHOLD`.

## 10. Analytics, SEO & tracking

État global : ✅ Complet côté instrumentation, 🟡 stratégie SEO blog verrouillée

### SEO

- Metadata globale Next.
- Metadata landing.
- Sitemap dynamique incluant articles publiés.
- Robots disallow `/admin`, `/compte`, `/api`, `/auth`, `/live`, `/login`, `/connexion`.
- JSON-LD LocalBusiness sur landing.
- Blog avec slugs FR/ES, meta descriptions, images, catégories.

Limite :

- Le blog est verrouillé aux membres Visio ; effet SEO externe limité malgré sitemap.

### Analytics

- GA4 public injecté sur routes publiques si `admin_settings.google_analytics_id`.
- Meta Pixel injecté sur routes publiques si `admin_settings.meta_pixel_id`.
- Tracking achat GA/Meta après checkout success.
- Dashboard `/admin/marketing` lit GA4 et Search Console via service account.
- Blog tracking : vues, scroll, temps, heatmap, rating.
- Business stats daily calculées en DB.

## 11. Comptes, rôles & sécurité

État global : 🟡 Solide mais points critiques à vérifier en prod

### Comptes

- Supabase Auth.
- `handle_new_user()` crée profil.
- Détection locale/timezone à l'inscription.
- Confirmation email possible via webhook Stripe.
- Post-login redirect admin/compte selon rôle.

### Rôles

- Admin si email dans `ADMIN_EMAILS` ou rôle `profiles.role='admin'`.
- Pour "Vue Client" admin : exige rôle admin + email listé.
- Mode demo client via cookie `fm_demo_client`.

### RLS

Points solides :

- RLS activée sur la majorité des tables sensibles.
- Tables internes notifications et `stripe_events` deny côté client.
- Replays et vidéos standalone filtrés.
- Blog réservé online/admin après migration.

Risques :

- 🟡 Policy `profiles` update propriétaire potentiellement trop large : si les grants réels autorisent l'update client, un utilisateur pourrait modifier des colonnes sensibles (`role`, `customer_tier`, etc.). À vérifier en base réelle.
- 🟡 `increment_replay_view()` exécutable par authenticated sans vérification d'accès : risque spam métrique.
- 🟡 Favoris standalone ne revalident pas l'accessibilité de la vidéo au moment de l'insert.
- 🟡 `CATCH_UP_ALL.sql` ne doit pas être considéré comme source de vérité prod.

## 12. Parcours clés

### Nouvel utilisateur : inscription → abonnement → première séance

État : ✅ Parcours principal complet

Parcours réel :

1. Landing `/` : offres, langue FR/ES, contenus Vimeo/blog en preview, CTA inscription.
2. `SignupCheckoutModal` : création compte Supabase et checkout post-signup.
3. `/api/checkout/post-signup` : vérifie userId/email via service role, crée session Stripe.
4. Stripe Checkout.
5. Webhook `checkout.session.completed` :
   - confirme email si besoin ;
   - crée/synchronise abonnement ou achat présentiel ;
   - attache referral ;
   - déclenche notifications.
6. Redirection `/compte?checkout=success`.
7. Dashboard : accès planning, replays, blog, progression.
8. Planning : cours accessibles selon tier.
9. Live : Jitsi pour cours online ou replay après validation.

Friction / manques :

- 🟡 Si webhook Stripe échoue, l'accès peut ne pas être accordé malgré paiement.
- 🟡 Achat présentiel sans cours concret disponible déclenche une notification "pending", mais UX de choix manuel de date à clarifier.
- 🟡 Boutique ne suit pas un parcours paiement classique.
- 🟡 Blog présenté marketing mais verrouillé, ce qui peut limiter acquisition.

### Admin : créer cours → live → replay

État : ✅ Complet côté app, 🟡 infra externe

1. Admin crée cours dans `/admin/courses`.
2. Client le voit dans calendrier selon accès.
3. Admin ouvre live en animateur.
4. Jitsi démarre, Jibri enregistre.
5. `finalize.sh` externe upload Vimeo.
6. `/api/internal/recordings/ingest` lie Vimeo au cours.
7. `/admin/replays` valide.
8. Client voit replay dans `/live/[courseId]` et `/compte/replays`.

Limites :

- Dépend de Jibri, naming fichiers et secrets.
- Validation humaine requise.

### Admin : vidéo standalone Vimeo → bibliothèque

État : ✅ Complet

1. Vimeo webhook ou sync admin.
2. Vidéo entre `pending`.
3. Admin valide, rejette, programme ou masque.
4. Cron publie les scheduled.
5. Clients online voient la vidéo en bibliothèque.

### Admin : blog → publication

État : ✅ Complet mais complexe

1. Génération article SEO via Gemini.
2. Édition/assistant SEO.
3. Traduction ES.
4. Validation mensuelle.
5. Publication programmée par cron dans fenêtre coach.
6. Notifications membres + newsletter.
7. Stats/heatmap/rating.

Limites :

- Plusieurs garde-fous existent sur contenu faible/traductions.
- Debug logs et règles de dédup calendrier visibles.

## 13. Synthèse technique honnête

### Points forts

- Plateforme très riche pour un produit solo : membre, live, replay, blog, boutique, admin, marketing, notifications, monétisation.
- Architecture Supabase/Next cohérente, avec service role réservé aux actions sensibles.
- RLS et fonctions SQL couvrent beaucoup de règles métier.
- Stripe et Vimeo sont bien intégrés.
- Admin très complet : cours, clients, replays, Vimeo, blog, marketing, boutique, inbox.
- Notifications multi-canal particulièrement avancées.
- Parcours Visio payant → accès membre → live/replay réellement implémenté.

### Points faibles / risques

- Historique migrations prod incertain ; `CATCH_UP_ALL.sql` diverge des migrations finales.
- Certaines fonctionnalités produit sont plus avancées côté UI que côté robustesse métier (boutique Printful sans paiement Stripe dédié, promos non branchées Stripe).
- Gamification incohérente entre SQL et UI.
- Blog verrouillé aux abonnés, contradiction avec l'objectif SEO/acquisition.
- Variables env réellement utilisées non toutes documentées dans `.env.example`.
- Dépendance forte à des infrastructures externes non versionnées : Jibri, finalize.sh, config Jitsi serveur.
- Sécurité à vérifier sur `profiles` update propriétaire.
- Certains endpoints webhook/cron sont solides, mais Printful accepte sans signature si secret absent.

### Fonctionnalités à moitié faites ou inactives

- 🟡 Promos : CRUD interne, pas connecté à Stripe Promotion Codes.
- 🟡 Boutique : Printful réel, paiement boutique à clarifier.
- 🟡 Jibri : app prête, infra externe.
- 🟡 Push : code présent, env/doc à compléter.
- 🟡 Mexico : feature flag `NEXT_PUBLIC_SHOW_MEXICO`.
- 🟡 Blog public SEO : techniquement présent mais accès membre verrouillé.
- 🔴 Anciennes routes : `/admin/videos`, `/admin/support`, `/admin/notifications/settings`, `/compte/preferences` sont des redirects legacy.

### Ce qui manque pour un produit "complet" de ce type

- Clarifier et sécuriser le parcours boutique : paiement, marge, confirmation, webhook Printful obligatoire.
- Alignement unique des règles gamification/badges.
- Durcir les grants/policies `profiles`.
- Fiabiliser l'historique migrations Supabase et supprimer l'ambiguïté `CATCH_UP_ALL`.
- Documenter toutes les variables env nécessaires.
- Définir si le blog doit être public SEO ou réservé membres, puis aligner RLS/UX/sitemap.
- Monitoring opérationnel des webhooks Stripe/Vimeo/Printful/Jibri.
- Tests end-to-end des parcours clés : signup+Stripe, live+replay, vidéo standalone, Printful order, notifications.

