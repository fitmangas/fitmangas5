# Ingestion replays Jibri → Vimeo → Supabase

Pipeline cible : **Jibri** enregistre le MP4 → **finalize.sh** upload Vimeo (TUS) → **POST /api/internal/recordings/ingest** lie la vidéo au cours → validation admin `/admin/replays` → `dispatchReplayReady`.

L’app Next (Vercel) **ne lit pas** le disque Jibri : seul le `vimeoId` + le `fileName` sont envoyés.

## Variable d’environnement

```env
RECORDING_INGEST_SECRET=   # secret partagé avec finalize.sh (Bearer)
```

Définir aussi côté app : `VIMEO_*` (utilisés par `syncVideoRecording` / metadata).

## Nom de fichier Jibri

```
fitmangas-{slug}-{YYYYMMDDHHMM}_{timestamp}.mp4
```

Exemple :

```
fitmangas-renfo-core-202605312000_2026-05-31-20-02-08.mp4
```

- `slug` : slug cours (`courses.slug`) ou slugifié du titre
- `YYYYMMDDHHMM` : début séance en **Europe/Paris**
- `{timestamp}` : horodatage fin d’enregistrement (ignoré pour le matching)

## Route

```
POST /api/internal/recordings/ingest
Authorization: Bearer <RECORDING_INGEST_SECRET>
Content-Type: application/json

{
  "fileName": "fitmangas-renfo-core-202605312000_2026-05-31-20-02-08.mp4",
  "vimeoId": "1234567890",
  "sessionId": "optional-jibri-session-id"
}
```

### Réponses

| Code | Signification |
|------|----------------|
| 200 | Ligne `video_recordings` créée/mise à jour (`validation_status=pending`, `is_ready=false`) |
| 400 | JSON / vimeoId / fileName invalide |
| 401 | Secret Bearer incorrect |
| 404 | Cours non trouvé (slug + fenêtre ±10 min sur `starts_at`) |
| 429 | Rate limit (30 req/min/IP) |
| 503 | `RECORDING_INGEST_SECRET` absent |

## Exemple finalize.sh (après upload Vimeo TUS)

```bash
#!/usr/bin/env bash
set -euo pipefail

FILENAME="$1"          # ex. fitmangas-renfo-core-202605312000_....mp4
VIMEO_ID="$2"          # ID numérique retourné par l’upload TUS
SESSION_ID="${3:-}"
APP_URL="${FITMANGAS_APP_URL:-https://fitmangas.com}"
SECRET="${RECORDING_INGEST_SECRET:?}"

curl -fsS -X POST "${APP_URL}/api/internal/recordings/ingest" \
  -H "Authorization: Bearer ${SECRET}" \
  -H "Content-Type: application/json" \
  -d "$(jq -n --arg f "$FILENAME" --arg v "$VIMEO_ID" --arg s "$SESSION_ID" \
    '{fileName:$f, vimeoId:$v, sessionId:($s|select(length>0))}')"
```

## Fichiers code

| Fichier | Rôle |
|---------|------|
| `src/app/api/internal/recordings/ingest/route.ts` | Route API |
| `src/lib/jibri-recording-filename.ts` | Parser + recherche cours |
| `src/lib/vimeo.ts` | `syncVideoRecording` (existant) |
| `src/lib/replay-admin.ts` | Validation admin (inchangé) |
