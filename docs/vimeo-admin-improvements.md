# Admin Vimeo — synthèse des améliorations

## Fonctionnalités livrées

| Zone | Détail |
|------|--------|
| Lecteur | Modale `VideoModal` au clic sur une carte **publiée** (iframe Vimeo + titre / durée / dossier / description). |
| Webhook | `POST /api/webhooks/vimeo` — signature HMAC, rate-limit IP, création ou mise à jour métadonnées sans régresser `published` / `rejected`, conservation du statut `scheduled` si déjà planifiée. Coach : `VIMEO_DEFAULT_COACH_ID`. |
| Validation | Section **En attente** : vidéos `pending` ou `scheduled` avec Valider / Rejeter / Programmer ; routes `PATCH /api/admin/vimeo/[id]/validate`. |
| Groupes | Composant `GroupCollapse` : titre cliquable, chevron ▼ / ▶, état persisté dans `localStorage` (`vimeo-admin-folder-open`). |
| Scheduling | Modale date/heure locale ; `PATCH /api/admin/vimeo/[id]/schedule` ; cron `GET /api/admin/vimeo/cron/publish-scheduled` avec `CRON_SECRET`. |

## Flux des statuts

```
pending ── Programmer ──► scheduled ──► (cron date due) ──► published
   │                                                    ▲
   └── Valider ─────────────────────────────────────────┘
   └── Rejeter ──► rejected
```

La synchro **manuelle** (`sync-all`) publie encore les vidéos déjà **publiées** ou nouvellement importées sans ligne en attente, mais **ne modifie pas** les lignes `pending` ou `scheduled`.

## Variables d’environnement

Voir `.env.example` : `VIMEO_WEBHOOK_SECRET`, `VIMEO_DEFAULT_COACH_ID`, `CRON_SECRET`.

## Migration DB

Appliquer `012_standalone_vimeo_scheduling_coach.sql` avant production.
