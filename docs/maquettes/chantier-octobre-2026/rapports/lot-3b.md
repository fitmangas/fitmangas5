# Lot 3b — Programmes : espace client

Date : 19/10/2026. Branche `chantier-oct-2026` (commit local, pas de push).

## Items non faits ou partiels

- **Tables absentes** (GO lot 3a) : catalogue, pages et aperçus `/dev/apercu` fonctionnent sur le JSON + données fictives. Démarrer un vrai programme, progression réelle, certificat nominatif et « Mon programme » actif restent bloqués jusqu’à SQL + import.
- **Email de félicitations** : gabarit v2 + lien de téléchargement du PDF (pas de pièce jointe). Option prudente : pas d’envoi réel (`EMAIL_SAFE_MODE`) ; pièce jointe reportée.
- **Relance douce 4 jours** (SPEC §4.2) : non câblée. Seule « Ta séance du jour » (A07) est enqueued à l’heure choisie, fuseau **Europe/Paris** (Mexico non joint au profil — prudent).
- **« tu y étais » / compteur de lives** : masqué (visites live toujours à 0, diagnostic lot 2a). Texte live : « Pas encore au planning : tu recevras le rappel la veille dès qu’il sera publié. »
- **Certificat / story nominatifs** : routes 404 si ni propriétaire ni admin ; `enrollmentId=apercu` seulement si `DEV_PREVIEW=1`. Le prénom réel n’est pas encore lu depuis `profiles` (exemple Margaux en aperçu).
- **Pixel-perfect 390 px** : captures desktop des maquettes B01–B07 / D08 / B04 ; mobile catalogue approximatif (émulation navigateur).
- **Story B09 PNG** : route `GET /api/programmes/story/apercu` répond `image/png` 200 en local ; fichier non joint (timeout curl pendant le build).
- **Deux « Difficile » d’affilée → autre programme** : texte B05 + lien « Version plus douce » ; bascule automatique d’inscription non faite (prudent sans tables).

## Décisions prudentes

- Tout derrière `NEXT_PUBLIC_FEATURE_PROGRAMMES` (off) : pages `/compte/programmes/*`, `/test-niveau`, rail et barre mobile **404 / masqués**. Production inchangée.
- `start_program` : le slug du catalogue est résolu en UUID avant le RPC (la modale envoie le slug).
- Lien email « Décaler à demain » **n’écrit rien** : ouvre `?decaler=1` + bouton de confirmation (`postponed_until`, colonne ajoutée au SQL Lot 3 **non appliqué**).
- Rappels programme : no-op si drapeaux off ou tables absentes ; `program.session` exempté du mode silence (déjà lot 2a).
- Catalogue JSON commité dans `src/lib/programmes/catalogue.json` (Vercel n’a pas `docs/maquettes/`).
- Fuseau des rappels séance = Paris jusqu’à lecture du fuseau profil.

---

## 1. Navigation

Item « Programmes » (icône Route) après Planning dans `CompteSidebar` et `CompteMobileBottomNav`, masqué si drapeau off. Labels FR/ES/EN.

## 2. Composants

`src/components/Programmes/` : LevelPill, ProgramCard, ProgressRing, WeekDots, WeekTimeline, SegmentBar, FeelingPicker, StartProgramModal (B04, bottom sheet mobile, test de départ, pause), CompletionStats, TestsTable, CatalogClient (une rangée d’objectifs), ProgramDetailClient (B02/B03 même URL), SessionPlayer, ProgramDone, MonProgrammeCard.

## 3. Pages

| Maquette | Route / aperçu |
|---|---|
| B01 catalogue | `/compte/programmes` · `/dev/apercu/programmes-catalogue` |
| B02 / B03 | `/compte/programmes/[slug]` selon inscription |
| B04 | modale sur B03 |
| B05 | `/compte/programmes/[slug]/seance/[step]` |
| B06 | bloc dashboard **sous** « Bonjour », compact, état vide = « Configure ton programme… » |
| B07 | `/compte/programmes/[slug]/termine` |
| B08 | `/api/programmes/certificat/[id]` (`@react-pdf/renderer`, polices `.woff`) |
| B09 | `/api/programmes/story/[id]` (`next/og` 1080×1920) |
| D08 | `/test-niveau` public, cookie slug, GA4 `level_test_complete` |
| A07 | `v2-templates` + cron hourly |

Captures : `rapports/captures/lot-3b/`.

## 4. Lecteur B05

`@vimeo/player` `dnt`, `setCurrentTime` après `loaded`, pause à `end_s`, `getPlayed()` croisé avec l’extrait toutes les 15 s, validation 80 %, ressenti, séance préc./suiv., « Pose-la à Alejandra » = `fm-open-support`.

## 5. Rappels

`enqueueProgramSessionReminders` dans `/api/admin/cron/hourly` (try/catch isolé). A07 + « Décaler à demain ».

## Tests

`npx vitest run src/lib/programmes/level-test.test.ts src/lib/programmes/progress.test.ts` → **7/7**.

## Build

`NODE_OPTIONS=--max-old-space-size=4096 npm run build` → **vert** (~7 min). Route `/test-niveau` présente.

## Mise en production

1. GO Kevin → SQL Lot 3 (dont `postponed_until`) **puis** `FM_IMPORT_APPLY=1 npx tsx scripts/import-programmes.ts --apply`.
2. Déployer le code **drapeau off** : rien n’apparaît (404, rail masqué, cron no-op).
3. Allumer `NEXT_PUBLIC_FEATURE_PROGRAMMES=1` (et `.env.local`) **après** relecture Alejandra des textes ES et du catalogue.
4. `NEXT_PUBLIC_FEATURE_NOTIF_V2=1` si on veut A07 réellement envoyé (toujours `EMAIL_SAFE_MODE` hors prod).
5. Sans ces prérequis : le lot ne casse rien.
