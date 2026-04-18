# Access Control Guide

## Audit rapide du repo

- Stack actuel: `Next.js App Router` + `React 19` + `TypeScript` + `Tailwind` + `Supabase`.
- Auth: Supabase Auth déjà branché (`src/lib/supabase/*`, callback, signout).
- Espace client existant: `src/app/compte/page.tsx`.
- Base admin existante: `/login`, `/admin`.
- Cette phase ajoute la fondation droits/calendrier sans casser les routes existantes.

## Matrice de droits

### Customer tiers

- `online_individual_monthly` (Type 1)
- `online_group_monthly` (Type 2)
- `onsite_group_single` (Type 3)
- `onsite_individual_single` (Type 4)

### Access levels

- `full`: accès complet (live/replay/interaction).
- `preview`: visible mais limité (grisé + CTA).
- `locked`: bloqué (grisé/flou + modal incentive).

## Schéma DB (texte)

- `profiles` (existant, enrichi): `customer_tier`, `onboarding_completed`.
- `courses`: événements calendrier et métadonnées live/replay.
- `subscriptions`: abonnements mensuels.
- `enrollments`: achats à l'unité (relation user-course).
- `access_policies`: matrice explicite tier x format x catégorie.
- `blocked_access_logs`: logs de tentative d'accès bloqué.

### Relations

- `profiles (1) -> (N) subscriptions`
- `profiles (1) -> (N) enrollments`
- `courses (1) -> (N) enrollments`
- `access_policies` pilotent la visibilité par type de client.

## RLS

- Toutes les tables sensibles sont en RLS.
- Lecture utilisateur limitée à ses propres `subscriptions` et `enrollments`.
- Gestion `courses`, `subscriptions`, `enrollments`, `access_policies` réservée au `role=admin`.
- `courses` publiés lisibles par utilisateur authentifié.

## Service d'accès

Fichier: `src/lib/access-control.ts`

- `canAccessCourse(userId, courseId) -> boolean`
- `getCoursesForUser(userId) -> SmartCourse[]`
- `getAccessType(userId, courseId) -> 'full' | 'preview' | 'locked'`
- `getUserTier(userId)`
- `logBlockedAccess(...)`

La logique est validée côté serveur via:

- fonctions SQL `current_customer_tier(...)` et `course_access_level(...)`
- appels API qui exigent l'authentification Supabase.

## APIs ajoutées

- `GET /api/courses/list`
- `GET /api/courses/[id]/access`
- `GET /api/calendar/events?from=<iso>&to=<iso>`
- `GET /api/calendar/export-ical`

## Tester les 4 profils

1. Appliquer migrations:
   - `npm run db:push`
2. Seeder:
   - `npm run seed:test-data`
3. Connexion avec comptes seed:
   - `type1.individual@fitmangas.local`
   - `type2.group@fitmangas.local`
   - `type3.onsitegroup@fitmangas.local`
   - `type4.onsiteindividual@fitmangas.local`
   - mot de passe par défaut: `Password123!`
4. Ouvrir `/compte`:
   - vérifier cours colorés (full) vs grisés (preview/locked)
   - cliquer un cours bloqué -> modal incitative
   - pour type 1/2, tester export iCal

## Hypothèses documentées

- App Router Next.js (routes `route.ts`).
- Auth user IDs en UUID Supabase.
- Upsell CTA redirige vers `/#offers` en phase 1.
- Sync Google temps réel sera phase 2 (iCal export déjà prêt).
