# Lot 3a — Programmes : données et admin

Date : 19/10/2026. Branche `chantier-oct-2026` (commit local, pas de push).

## Items non faits ou partiels

- **Migration non appliquée** (SPEC) : tables, RLS, `start_program`, séquence certificat. SQL dans `PROPOSITIONS_MIGRATIONS.md` section Lot 3.
- **Import `--apply`** : implémenté mais **refusé** sans `FM_IMPORT_APPLY=1` (Kevin après GO). Dry-run joint : 67/68 titres exacts, 1 introuvable.
- **Lecteur « Repérer dans la vidéo »** : modale présente, branchement `@vimeo/player` + temps courant renvoyé après import (lot 3b / après `--apply`).
- **Stats réelles** (inscrites, taux de fin, abandon) : structure B10 avec chiffres d’exemple tant que les tables n’existent pas.
- **Compteur « utilisée dans N programmes »** : affiché sur le sélecteur (démo) ; calcul SQL après import.
- **Création « Nouveau programme »** : bouton maquette, pas encore d’insert vide (import JSON = source principale).
- **Enregistrement auto des champs** : publier/dépublier et `video_id` branchés ; thème / consignes / objectif restent locaux tant que les tables manquent.

## Décisions prudentes

- `standalone_vimeo_videos.id` = **uuid** → FK uuid (pas de changement de type).
- `--apply` exige en plus `FM_IMPORT_APPLY=1` (double garde).
- Reprendre une inscription `paused` met d’abord l’éventuel `active` en pause (index « un seul actif »).
- Rail admin « Programmes » (icône Route) **masqué** si `NEXT_PUBLIC_FEATURE_PROGRAMMES` off. `/admin/programmes` → 404 si drapeau off.
- Écritures cliente uniquement via actions serveur + `service_role` après vérifs visio + propriété.

---

## 1. SQL (non appliqué)

Tables `programs`, `program_weeks`, `program_steps`, `program_enrollments` (+ index unique un actif), `program_step_progress`, `program_test_results`, `program_feedback` ; séquence `program_certificate_seq` ; RLS SELECT ; fonctions `start_program` et `nextval_program_certificate` (`service_role` seulement).

## 2. Import dry-run

`scripts/import-programmes.ts` (défaut = lecture). Rapport : `rapports/import-programmes-dry-run.md`.

- 12 programmes, 68 titres uniques, **67 exacts**, **0 ambigu**, **1 introuvable** : `FIT DANCE 30’ – Cardio Latino + Small Weights` (apostrophe typographique probable).

## 3. Couvertures

12 photos `cover_suggestion` copiées dans `public/programmes/` (même nom de fichier).

## 4. Actions serveur

`src/app/compte/programmes/actions.ts` + `src/lib/programmes/actions-core.ts` : démarrer, pause, reprendre, abandonner, recommencer, temps regardé, ressenti, tests, terminer (numéro `FM-AAAA-MMJJ-NNNN`), avis. Tests unitaires propriété / un actif / 80 %.

## 5. Admin B10

`/admin/programmes` + aperçu `/dev/apercu/admin-programmes`. Liste, filtres, éditeur, stats, onglets, étapes glissables, sélecteur vidéo, extrait mm:ss, alerte `segment_to_validate`, mot d’Alejandra, « Voir comme une cliente », publier/dépublier. **Pas de bouton d’import.**

Captures : `rapports/captures/lot-3a/admin-programmes.png`, `admin-programmes-picker.png`.

## Tests

`npx vitest run src/lib/programmes/normalize-title.test.ts src/lib/programmes/progress.test.ts` → 7/7.

## Build

`NODE_OPTIONS=--max-old-space-size=4096 npm run build` → **vert** (~4 min 45 s). Route `/admin/programmes` présente.

## Mise en production

1. GO Kevin → appliquer SQL Lot 3 (additif).
2. Déployer le code (drapeau **off** : rien n’apparaît côté client/admin).
3. Kevin : `FM_IMPORT_APPLY=1 npx tsx scripts/import-programmes.ts --apply` (crée seulement les slugs absents, statut brouillon).
4. Relier à la main le titre introuvable (Fit Dance) dans l’admin.
5. Allumer `NEXT_PUBLIC_FEATURE_PROGRAMMES=1` **après** le lot 3b (écrans cliente) et relecture Alejandra des textes ES.
6. Sans ces prérequis : le lot ne casse rien (404 admin, actions refusées, rail masqué).
