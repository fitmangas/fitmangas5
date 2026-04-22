# Publication programmée

## API

- **Programmer** : `PATCH /api/admin/vimeo/[id]/schedule` — corps `{ "scheduled_at": "<ISO UTC futur>" }`.
- **Annuler** : même route avec `{ "scheduled_at": null }` → retour `pending`.

## Cron

Endpoint : `GET /api/admin/vimeo/cron/publish-scheduled`

Autorisé si :

- Header `Authorization: Bearer <CRON_SECRET>`, ou  
- Query `?secret=<CRON_SECRET>` (pour tests rapides uniquement).

Configurer `CRON_SECRET` dans l’environnement du worker (Vercel Cron, cron Linux, GitHub Actions, etc.) avec une exécution **au moins chaque minute** pour des créneaux précis.

## Comportement serveur (`publishDueScheduledVideos`)

Sélection des lignes avec `validation_status = 'scheduled'` et `scheduled_publication_at <= now()`, puis mise à jour en `published` avec `published_at`, et appel au hook Phase 3 `notifyStandaloneVideoPublished`.

## Troubleshooting

- **Pas de publication automatique** : cron absent ou secret incorrect ; timezone des dates stockées en UTC (`timestamptz`).
- **400 date passée** : choisir une date strictement dans le futur depuis l’admin.
