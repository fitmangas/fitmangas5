# Calendar Setup

## Fichiers principaux

- Composant: `src/components/Calendar/SmartCalendar.tsx`
- Intégration client: `src/app/compte/page.tsx`
- Service métier: `src/lib/access-control.ts`
- Fenêtre 14 jours (UTC): `src/lib/calendar-window.ts`
- APIs:
  - `src/app/api/calendar/events/route.ts`
  - `src/app/api/calendar/export-ical/route.ts`
  - `src/app/api/courses/list/route.ts`
  - `src/app/api/courses/[id]/access/route.ts`

## Installation / migration

1. Installer dépendances:
   - `npm install`
2. Appliquer migration:
   - `npm run db:push`
3. (Optionnel mais recommandé) injecter données de test:
   - `npm run seed:test-data`

## Variables d'environnement

Configurer dans `.env.local`:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY` (seed uniquement)
- `ADMIN_EMAILS` (accès dashboard admin)

## Fonctionnement UX

- Affichage fixe sur **14 jours** à partir du jour UTC courant (grille 7+7), sans navigation mois suivant (plus de grille vide).
- Filtrage serveur dans `GET /api/calendar/events` + exclusion des cours déjà terminés (`ends_at` dans le passé).
- Cours `full`: carte active + actions live/replay pour les séances à venir.
- Cours `preview`/`locked`: carte grisée, modal "Débloquer".
- Bouton "Ajouter à Google Calendar" disponible seulement pour tiers mensuels.

## Export iCal

- Endpoint: `GET /api/calendar/export-ical`
- Retour: fichier `.ics` compatible Google Calendar/Apple Calendar.
- Filtre: `access_type=full`, fenêtre **14 jours** identique au calendrier, séances non terminées.
- Sécurité: utilisateur authentifié + tier mensuel obligatoire.

## Test manuel rapide

1. Se connecter avec chaque profil seed.
2. Ouvrir `/compte`.
3. Vérifier:
   - statuts visuels différents selon profil,
   - modal de blocage,
   - export iCal actif/inactif selon tier,
   - aucun accès sensible exposé côté client sans API auth.
