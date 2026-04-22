# Flux de validation des vidéos standalone

## Statuts (`validation_status`)

| Valeur | Visible clients (RLS actuelle) | Visible admin « En attente » |
|--------|----------------|------------------------------|
| `pending` | Non | Oui |
| `scheduled` | Non | Oui (avec date + compte à rebours) |
| `published` | Oui (abonnés online) | Liste « Publiées » |
| `rejected` | Non | Section « Rejetées » si présentes |

## Routes

| Méthode | Route | Corps |
|---------|-------|-------|
| PATCH | `/api/admin/vimeo/[id]/validate` | `{ "action": "approve" \| "reject", "rejection_reason"?: string }` |
| PATCH | `/api/admin/vimeo/[id]/schedule` | `{ "scheduled_at": string \| null }` |
| PATCH | `/api/admin/standalone-videos/[id]` | Ancienne API `{ "action": "publish" \| "reject" }` — même logique métier |

Toutes ces routes nécessitent une session admin (`requireAdminApi`).

## Notifications Phase 3

Les appels à `notifyStandaloneVideoPublished` sont déclenchés lors :

- validation immédiate **Valider** ;
- passage automatique `scheduled` → `published` par le cron.
