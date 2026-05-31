# Audit UX / UI / logique — FitMangas (mai 2026)

Audit **code + parcours** (lecture du dépôt, pas de tests manuels device). Critère : logique Apple — chaque interaction doit être prévisible sans réfléchir.

**Légende gravité**
- 🔴 **Critique** — bloque, trompe, perte de données/revenus, ou rupture de confiance majeure
- 🟠 **Important** — friction forte, incohérence notable, fonctionnalité partielle
- 🟡 **Mineur** — polish, i18n, accessibilité, dette acceptable à court terme

---

## 🔴 Problèmes critiques

| # | Section | Page | Problème | Suggestion de fix |
|---|---------|------|----------|-----------------|
| C01 | Landing | `/?compte=connexion-requise` | Redirections auth (`/compte`, `/blog`, layout) envoient ce paramètre mais la **landing ne l’ouvre pas** (pas de modale connexion). | Lire `searchParams` sur la home et ouvrir `ClientLoginModal` + message. |
| C02 | Landing | `/` (segment Mexico) | Offres `m-coll` / `m-ind` affichées et cliquables mais **absentes** de `checkout-courses.ts` → checkout impossible (« Offre non reconnue »). | Ajouter prix Stripe Mexico ou masquer le segment jusqu’à support. |
| C03 | Landing | `/` + `SignupCheckoutModal` | `onboardingCourses` = visio + Nantes **uniquement** ; après sélection Mexico, le sélecteur de formule ne propose pas les offres Mexico. | Inclure `t.courses.mexico` dans `courseOptions` quand ville = Mexico. |
| C04 | Logique | Cron `runCourseCycles` | Email/notification « **cours manqué** » si inscription toujours `booked` le lendemain — **sans pointage** admin ni présence auto. | N’envoyer « missed » qu’après pointage ou délai + statut `attended` explicite. |
| C05 | Email | Rappels H-1 / H-2 | `course.visio.reminder_H-1` et `course.presential.reminder_H-2` **absents** du `TEMPLATE_REGISTRY` → fallback email brut avec `event_type` visible. | Ajouter templates ou mapper vers templates rappel existants. |
| C06 | Email | Dispatcher + `phase3` | En heures calmes (21h–8h), emails mis en `notification_digest_queue` mais `digest_frequency` défaut = **`off`** → **jamais flushés** (seuls daily/weekly traitent la file). | Envoyer le lendemain 8h même si digest off, ou défaut `daily`. |
| C07 | Logique | `/api/webhooks/stripe` | Si `resolveCheckoutUserId` échoue, l’événement est quand même marqué traité (`markStripeEventProcessed` en tête) → **pas de retry** automatique. | Marquer traité seulement après succès métier ou dead-letter. |
| C08 | Admin | Global (`AdminViewSwitch`) | Libellés **inversés** : en mode démo le bouton affiche « Vue client » alors que l’action **revient à l’admin** (et inversement). | Afficher la **destination** du clic, pas la vue actuelle. |
| C09 | SEO | `/sitemap.xml` + `/blog/[slug]` | Articles blog indexés dans le sitemap alors que `/blog` et articles exigent **auth + abonnement Visio** → URLs crawlables mais inutilisables. | Retirer articles du sitemap public ou publier des URLs teaser ouvertes. |
| C10 | SEO | `/blog` (metadata) | Titre/description SEO « blog public » alors que la liste redirige les non-connectés vers `/?compte=connexion-requise`. | Séparer blog marketing public vs espace membre, ou `noindex` sur routes membres. |

---

## 🟠 Problèmes importants

| # | Section | Page | Problème | Suggestion de fix |
|---|---------|------|----------|-----------------|
| I01 | Landing | `/?offer=v-coll` | Lien depuis `/checkout/abandoned` ; la landing **ne gère pas** `offer` pour pré-sélectionner l’offre. | Ouvrir la modale avec `courseId` depuis query `offer`. |
| I02 | Landing | `/` + inscription | `effectiveSegment` = VISIO si `v-*`, sinon **NANTES** → inscriptions Mexico enregistrées comme Nantes dans metadata. | Dériver `MEXICO` / `NANTES` / `VISIO` selon préfixe `m-` / `n-` / `v-`. |
| I03 | Landing | `/` + modal | Badge segment affiche **« Nantes »** pour les offres Mexico (`m-*`). | Afficher la ville réelle (Mexico / Nantes / Visio). |
| I04 | Landing | `/` (section blog) | Clic article / CTA blog ouvre la **modale d’abonnement** (`v-coll`), pas le contenu blog — promesse trompeuse. | Lien vers `/compte/blog` si connecté, sinon copy explicite « s’inscrire pour lire ». |
| I05 | Landing | `/` (footer) | Icône cadenas → `/login` = **connexion admin**, pas espace client. | Pointer vers modale client ou `/connexion`. |
| I06 | Landing | `/` + calendrier compte | CTAs `cta_url: '/#offers'` (`access-control`, modales) — **pas d’`id="offers"`** sur la landing. | Ajouter `id="offers"` sur la grille offres ou remplacer par `/?offer=v-coll`. |
| I07 | Client | `/compte` | `resolveFirstName` retombe sur **« Alejandra »** si prénom absent → « Bonjour Alejandra » pour les membres. | Fallback neutre (« Bonjour ») ou prénom depuis email. |
| I08 | Client | `/compte` | Badge notifications : consulte la page **sans** marquer lu ; badge persiste jusqu’à action manuelle. | Marquer lues à l’ouverture de `/compte/notifications` ou UX plus explicite. |
| I09 | Client | `/compte` vs `/compte/planning` | Nav = `#planning` sur dashboard ; page `/compte/planning` existe mais **hors menu** ; badges live effacés seulement sur `/compte/planning`. | Unifier entrée nav + logique badges (hash ou route unique). |
| I10 | Client | Sidebar / mobile nav | **Pas d’entrée Notifications** dans la navigation principale (seulement menu avatar). | Ajouter lien `/compte/notifications` avec badge optionnel. |
| I11 | Client | `/compte/notifications` | Texte « X non lue(s) » **toujours en français** (labels partiels EN/ES). | i18n complète du composant inbox. |
| I12 | Client | `/compte` + `VisioLock` | Membres `lang === 'en'` : overlay **FR uniquement** (`VisioLock` ne gère que `fr` \| `es`). | Ajouter locale `en` + copy anglais. |
| I13 | Client | `/compte` + `VisioLock` | Échec `/api/checkout` : bouton se réactive **sans message d’erreur**. | Afficher toast/erreur API + `credentials: 'include'`. |
| I14 | Client | `/compte/blog` | Hero « Dernier article » = `displayArticles[0]` après **tri/filtre** (views, rating, favoris), pas le plus récent publié. | Hero = article `order('published_at').limit(1)` indépendant des filtres. |
| I15 | Client | `/compte/blog` | Colonnes `title_en` chargées mais **`pickLocalized` = fr \| es** — anglais ignoré. | Supporter `en` ou retirer colonnes EN. |
| I16 | Client | `/compte/blog` | Pas de branche **anglaise** dans les textes UI (FR/ES seulement). | Ajouter copy `en` comme sur replays. |
| I17 | Client | `/compte/replays` | Sous-titre « replay en vedette » mais hero = **premier élément trié**, pas dernier publié. | Définir hero = dernier replay publié hors filtres liste. |
| I18 | Client | `/compte/replays` | Favoris replay : lien `/live/${courseId}` (page **live**) au lieu d’URL replay dédiée. | Lien vers enregistrement/replay URL. |
| I19 | Client | `/compte/profil` | Langue : UI **FR/ES seulement** alors que `getClientLang` peut retourner **`en`**. | Proposer EN ou mapper `en` → locale supportée. |
| I20 | Client | `/compte/preferences` | `PreferencesLang` = **`es` \| `fr`** — utilisateurs EN voient préférences en français. | Étendre i18n préférences à `en`. |
| I21 | Client | `/compte/parrainage` | Copy **FR/ES uniquement** (pas de `en`). | Ajouter bloc anglais ou fallback documenté. |
| I22 | Client | Calendrier modales | Libellés statut « Accès complet / Accès limité » en **français** dans modales EN/ES. | Localiser `status_label` selon `lang`. |
| I23 | Admin | `/admin` (nav) | **Pas de lien Clients** dans sidebar / bottom nav (accès via KPI seulement). | Ajouter `/admin/clients` dans la navigation. |
| I24 | Admin | `/admin` (KPI Health) | Lien `?health=all` **invalide** (filtre accepte `new\|watch\|green\|orange\|red` seulement). | Remplacer par `/admin/clients` sans param erroné. |
| I25 | Admin | `/admin` (KPI Boutique) | Clic KPI boutique → `/boutique` (site public) au lieu de **`/admin/boutique`**. | Corriger href vers admin boutique. |
| I26 | Admin | `/admin` (mobile) | Barre du haut : **8 icônes** serrées → cibles tactiles difficiles (375px). | Menu « Plus » ou réduire les entrées. |
| I27 | Admin | Global | `checkIsAdmin` : admin par **email OU role** ; `canUseAdminViewSwitch` exige **les deux** → incohérence ops. | Aligner les règles (role + email liste). |
| I28 | Admin | `/admin` (table clients) | « Derniers clients » : tous profils `archived=false`, **pas filtrés `role=member`** (admins possibles). | `.eq('role', 'member')` comme sur `/admin/clients`. |
| I29 | Admin | `/admin/clients/[id]` | Colonnes `archived`, `subscription_status`, `subscription_type` requièrent **migration 028** non appliquée → erreurs SQL possibles. | Appliquer migration ou requêtes tolérantes. |
| I30 | Email | `base-template.ts` | Logo header figé `https://fitmangas.com/logo.png` ; photo utilise `base` — **incohérence** env/staging. | `logoUrl = \`${getEmailPublicBaseUrl()}/logo.png\``. |
| I31 | Email | `email.ts` (fallback) | `event_type` sans template → email expose **métadonnées techniques** au client. | Fallback générique sans `event_type` / locale bruts. |
| I32 | Email | `email.ts` | `RESEND_API_KEY` absent → envoi **silencieusement ignoré** (`console.warn` seulement). | Alerte monitorée + log structuré. |
| I33 | Logique | `/api/webhooks/stripe` | `findUserIdByEmail` : `listUsers` **page 1, 50 max** — échec probable à l’échelle. | Index email ou lookup Stripe customer → profil. |
| I34 | Logique | Webhook | `customer.subscription.deleted` : `course_id` défaut **`v-coll`** si metadata absente → mauvais tier annulé. | Lire tier depuis `subscriptions` en base. |
| I35 | Logique | `/compte?checkout=success` | Succès Stripe affiché avant confirmation webhook ; si webhook échoue, **abo absent** en base temporairement. | Polling statut session ou sync côté `checkout-success`. |
| I36 | Logique | `/auth/checkout-success` | Même gap pour parcours **sans cookie** post-inscription. | Idem I35 après magic link. |
| I37 | Logique | Cron rappels | Corps/titres rappels cours en **français** même si `preferred_locale=es`. | Templates localisés pour tous les rappels. |
| I38 | SEO | `/robots.txt` | `allow: /` sans `disallow` pour `/admin`, `/compte`, `/api`. | Exclure zones privées et API. |
| I39 | Perf | `/` (`LandingPage`) | Hero + images offres via **Dropbox externe** lourd ; peu d’optimisation Next Image. | Héberger dans `/public` + `next/image` + tailles. |
| I40 | Mobile | `/checkout/abandoned` | Texte **FR + ES mélangés** sur la même page (« No pasa nada » + français). | Une langue par rendu ou détection locale. |
| I41 | Mobile | `/compte` (menu avatar) | Badge rouge positionné sur `<details>` : risque de **toggle menu** au lieu de navigation selon zone de tap. | Badge en sibling avec `z-index` (partiellement corrigé récemment — vérifier en device). |

---

## 🟡 Problèmes mineurs

| # | Section | Page | Problème | Suggestion de fix |
|---|---------|------|----------|-----------------|
| M01 | Landing | `/` | Stats « cours donnés » : `baseDate` fixée au **10 mars 2026** — dérive si date système différente. | Config centralisée ou date dynamique documentée. |
| M02 | Landing | `/` (ES) | « + de 25h disponibles » — calque FR (« de ») en espagnol. | Formulation ES naturelle. |
| M03 | Landing | `/` | Deux balises `<h1>` dans le hero (SEO / a11y). | Un seul `h1`, second en `h2`. |
| M04 | Landing | `/` (preview blog) | `key={article.titleFr}` — collision si titres identiques. | Clé stable (`slug` / `id`). |
| M05 | Client | `/compte` | Avatar `alt="Coach IA"` — libellé incorrect. | « Photo de profil » ou prénom utilisateur. |
| M06 | Client | Sidebar | Icône planning desktop = **Clapperboard**, mobile = **CalendarDays**. | Harmoniser l’icône calendrier. |
| M07 | Client | `NotificationBell` | Composant avec textes FR en dur ; **non monté** dans le layout actuel (dette). | i18n ou suppression si mort. |
| M08 | Client | `/compte/notifications` | Dates formatées **`fr-FR`** pour tous les profils. | `toLocaleString` selon langue. |
| M09 | Client | `/compte` (cartes verrouillées) | Liens « Ma bibliothèque » / « Ouvrir mon blog » **sous l’overlay** VisioLock — secondaires inutilisables. | Retirer liens sous overlay ou les désactiver. |
| M10 | Client | `/compte/profil` | Deux boutons Stripe postent vers la **même** action billing portal. | Deep-link factures vs abonnement ou un seul bouton. |
| M11 | Client | `/compte/profil` | Clés i18n « Parcours », facturation détaillée **non rendues** (copy mort). | Afficher blocs ou nettoyer i18n. |
| M12 | Client | `/compte` (dashboard) | `replayCount`, `remainingToGoal` calculés mais **non affichés**. | Afficher KPI ou supprimer calcul. |
| M13 | Client | `/compte/actions.ts` | `markNotificationReadAction` ne revalide pas `/compte/notifications`. | Ajouter `revalidatePath`. |
| M14 | Client | `/compte/replays` | `formatFrenchSessionDate` toujours **`fr-FR`**. | Locale dynamique. |
| M15 | Client | `/compte/replays` (ES) | Bouton `play: 'Lectura'` — **faux ami** (lire un livre). | « Reproducir » / « Ver replay ». |
| M16 | Client | `/compte/blog` | Liens articles → `/blog/[slug]` (parcours public) vs espace client — **double parcours**. | Route `/compte/blog/[slug]` optionnelle. |
| M17 | Admin | `/admin` | Accueil admin en **espagnol** (« Hola ») sur UI majoritairement FR. | Harmoniser langue admin. |
| M18 | Admin | `/admin` (calendrier) | En-têtes `L M M J V S D` — **deux M** ambigus. | `Lu Ma Me Je Ve Sa Di`. |
| M19 | Admin | `/admin` (mobile) | Pas de badge Vimeo pending sur bottom nav (présent desktop). | Réutiliser fetch pending count. |
| M20 | Admin | `/admin` | Double entrée « Démo élève » (menu avatar + `AdminViewSwitch`). | Un seul point d’entrée. |
| M21 | Admin | Global | `AdminViewSwitch` `z-[220]` peut chevaucher FAB WhatsApp. | Ajuster offset / z-index. |
| M22 | Admin | `/admin/notifications/settings` | Libellés ES définis mais `lang` forcé **`fr`**. | Dériver langue admin. |
| M23 | Admin | `/admin/notifications/settings` | Page **lecture seule** (env) sans édition ni test envoi. | Formulaire ou lien doc ops. |
| M24 | Admin | `/login` vs `/connexion` | Admin → `/login` ; sitemap liste `/connexion` — **deux parcours**. | Unifier redirects. |
| M25 | Admin | `/api/demo-mode/enable` | Bascule démo via **GET** (lien) — prefetch accidentel possible. | POST + formulaire. |
| M26 | Admin | `/admin/clients` | Libellé KPI « Health » en anglais vs « Santé » ailleurs. | Uniformiser FR. |
| M27 | Admin | Health | Règles « Nouveau / À surveiller » peu **visibles** en UI (pas de légende). | Tooltip ou légende sur page clients. |
| M28 | Email | `onboarding-day0` (ES) | Tutoiement FR (« ton abonnement ») dans variante ES ; fallback prénom `'toi'`. | Copy ES cohérent + fallback `'amiga'`. |
| M29 | Email | `phase2` onboarding | J+3 / J+7 : titres génériques peu différenciés. | Titres/corps spécifiques par jour. |
| M30 | Email | Tous | `NEWSLETTER_FROM_EMAIL` pour **toutes** les notifs transactionnelles. | Adresse `NOTIFICATIONS_FROM` dédiée. |
| M31 | Logique | `VisioLock` | CTA checkout toujours **`v-coll`** même pour cible individuel. | Choisir offre selon contexte. |
| M32 | Logique | Mode démo | Simule tier collectif + inscriptions auto — peut **masquer** bugs d’accès réels. | Profils démo multiples ou bandeau explicite. |
| M33 | Logique | Health (récent) | Nouveaux comptes &lt; 7 j corrigés en code ; **migration 028** + données historiques peuvent encore afficher incohérences. | Backfill `subscription_*` + appliquer migration. |
| M34 | SEO | `/sitemap.xml` | `lastModified: now` sur pages statiques à chaque build. | Dates réelles par contenu. |
| M35 | SEO | `/` | `APP_URL` défaut `localhost` dans `page.tsx` OG vs `fitmangas.com` dans `layout.tsx`. | Source unique `metadataBase`. |
| M36 | SEO | `/blog/[slug]` | OG `featured_image_url` externe sans garantie dimensions 1200×630. | Image OG dédiée absolue. |
| M37 | Perf | `/admin` | `alejandra.png` via `<img>` brut sans `next/image`. | Optimiser avec Next Image. |
| M38 | Perf | `layout.tsx` | GA4 + Meta Pixel sur **toutes** les routes dont `/admin` et `/compte`. | Charger scripts seulement routes marketing. |
| M39 | Perf | Emails | `alejandra.png` chargée depuis le site à chaque ouverture mail. | Asset léger / CDN email. |
| M40 | Mobile | Formulaires inscription | Modale signup : nombreux champs — vérifier **clavier mobile** ne masque pas le CTA (non testé device). | `scrollIntoView` sur focus + padding bas. |
| M41 | Mobile | Tableaux admin | Tables « Derniers clients », clients, marketing — **scroll horizontal** présent mais dense sur petit écran. | Colonnes prioritaires ou vue carte mobile. |

---

## Synthèse par zone (vue rapide)

### Landing (`/`)
Points bloquants : **Mexico non checkoutable**, **param `compte=connexion-requise` ignoré**, ancres `/#offers` mortes. Frictions : blog → signup, footer admin login, segment/metadata Mexico incorrects.

### Espace client (`/compte/*`)
Points forts : parcours replanning/blog/replays structurés, VisioLock présent, page `/compte/notifications` ajoutée. Frictions : **badges notifications** (pas auto-lu), **hero blog/replay ≠ plus récent**, i18n **EN partielle**, nav planning dupliquée, pas de notifications dans la sidebar.

### Espace admin (`/admin/*`)
Points forts : KPIs, health scoring enrichi, fiches clients avec archivage. Frictions : **nav clients absente**, **AdminViewSwitch inversé**, KPI boutique mal ciblée, mobile dense, dépendance migration 028.

### Emails
Template base **côte à côte** (logo + photo) en place ; reste : **templates H-1/H-2 manquants**, **file digest heures calmes**, logo URL hardcodée, prénom (MArtinez) corrigé en code si `first_name` en majuscules — pas si nom de famille stocké dans `first_name`.

### Logique métier
Stripe webhook enrichi mais **résolution user fragile** et **idempotence trop agressive**. Onboarding J0 via webhook OK ; **« missed »** et **digest off** sont les risques majeurs côté notifications email.

### Responsive mobile (revue code)
Barre mobile compte en **haut** (8 icônes) ; pas de bottom tab « Notifications ». Landing modales full-screen OK en structure. Tests device 375px **recommandés** pour valider tap targets et clavier.

### Performance & SEO
Priorités : **sitemap blog derrière auth**, **robots trop permissif**, **images Dropbox landing**, scripts analytics partout.

---

## Vérifications recommandées (hors scope audit code)

1. Parcours complet **inscription → Stripe test → /compte** (cookie + sans cookie).
2. **Mexico** : soit masquer, soit checkout bout-en-bout.
3. **Notifications** : recevoir une notif → ouvrir inbox → vérifier badge avatar + sidebar.
4. **375px** : menu compte haut, modale signup, tableaux admin.
5. Ouvrir un email onboarding en clients mail (Gmail iOS / Apple Mail) — header logo + photo.
6. Appliquer **`028_profiles_archived_subscription.sql`** en prod avant d’utiliser archivage / champs abonnement profil.

---

*Document généré le 16 mai 2026 — audit statique du dépôt `fitmangas5`, branche de travail courante.*
