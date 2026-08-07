#!/usr/bin/env bash
# finalize.sh — Jibri → Vimeo (TUS) → probe playable → ingest FitMangas → delete MP4
#
# SOURCE DE VÉRITÉ (dette §10) :
# - Supprimer le MP4 local UNIQUEMENT après confirmation Vimeo is_playable=true.
# - Si la probe échoue : garder le MP4, logger, ne rien supprimer.
# - Seuil disque 80 % = filet secondaire (anciens fichiers seulement).
# - Timeout TUS généreux pour MP4 ~1 Go (ne pas conclure « échec » trop tôt).
#
# Déploiement : copier sur le VPS Hetzner (Jibri). NE PAS exécuter depuis Cursor.
#
# Usage :
#   finalize.sh /chemin/vers/recording.mp4 [session-id]
#
# Env requises :
#   VIMEO_ACCESS_TOKEN
#   RECORDING_INGEST_SECRET
#   FITMANGAS_APP_URL   (défaut https://fitmangas.com)
# Optionnel :
#   VIMEO_USER_ID       (pour créer l’upload — défaut : /me)
#   RECORDINGS_DIR      (défaut : dossier du MP4)
#   DISK_THRESHOLD_PCT  (défaut 80)
#   PLAYABLE_MAX_WAIT_S (défaut 1800 = 30 min)
#   TUS_TIMEOUT_S       (défaut 7200 = 2 h)

set -euo pipefail

LOG_TAG="[finalize]"
log() { echo "$(date -u +%Y-%m-%dT%H:%M:%SZ) ${LOG_TAG} $*"; }
err() { echo "$(date -u +%Y-%m-%dT%H:%M:%SZ) ${LOG_TAG} ERROR $*" >&2; }

MP4_PATH="${1:-}"
SESSION_ID="${2:-}"

if [[ -z "${MP4_PATH}" || ! -f "${MP4_PATH}" ]]; then
  err "Usage: $0 /path/to/file.mp4 [session-id]"
  exit 2
fi

FILENAME="$(basename "${MP4_PATH}")"
RECORDINGS_DIR="${RECORDINGS_DIR:-$(dirname "${MP4_PATH}")}"
APP_URL="${FITMANGAS_APP_URL:-https://fitmangas.com}"
TOKEN="${VIMEO_ACCESS_TOKEN:?VIMEO_ACCESS_TOKEN requis}"
SECRET="${RECORDING_INGEST_SECRET:?RECORDING_INGEST_SECRET requis}"
DISK_THRESHOLD_PCT="${DISK_THRESHOLD_PCT:-80}"
PLAYABLE_MAX_WAIT_S="${PLAYABLE_MAX_WAIT_S:-1800}"
TUS_TIMEOUT_S="${TUS_TIMEOUT_S:-7200}"
VIMEO_API="https://api.vimeo.com"

FILE_SIZE="$(stat -c%s "${MP4_PATH}" 2>/dev/null || stat -f%z "${MP4_PATH}")"
log "start file=${FILENAME} size=${FILE_SIZE} session=${SESSION_ID:-none}"

# --- 1) Créer l’upload TUS ---
CREATE_RESP="$(curl -fsS -X POST "${VIMEO_API}/me/videos" \
  -H "Authorization: Bearer ${TOKEN}" \
  -H "Content-Type: application/json" \
  -H "Accept: application/vnd.vimeo.*+json;version=3.4" \
  -d "$(jq -n --argjson size "${FILE_SIZE}" --arg name "${FILENAME}" \
    '{upload:{approach:"tus",size:$size},name:$name}')")"

UPLOAD_LINK="$(echo "${CREATE_RESP}" | jq -r '.upload.upload_link // empty')"
VIMEO_URI="$(echo "${CREATE_RESP}" | jq -r '.uri // empty')"
VIMEO_ID="$(echo "${VIMEO_URI}" | grep -Eo '[0-9]+' | tail -1)"

if [[ -z "${UPLOAD_LINK}" || -z "${VIMEO_ID}" ]]; then
  err "création upload TUS échouée: ${CREATE_RESP}"
  exit 1
fi
log "tus created vimeoId=${VIMEO_ID}"

# --- 2) Upload TUS (timeout long pour ~1 Go) ---
# PATCH unique pour fichiers typiques ; pour très gros fichiers, Vimeo accepte un seul PATCH body.
if ! curl -fS --max-time "${TUS_TIMEOUT_S}" \
  -X PATCH "${UPLOAD_LINK}" \
  -H "Tus-Resumable: 1.0.0" \
  -H "Upload-Offset: 0" \
  -H "Content-Type: application/offset+octet-stream" \
  --data-binary @"${MP4_PATH}"; then
  err "upload TUS échoué ou timeout (${TUS_TIMEOUT_S}s) — MP4 CONSERVÉ: ${MP4_PATH}"
  exit 1
fi
log "tus upload OK vimeoId=${VIMEO_ID}"

# --- 3) Probe playable (boucle) — delete INTERDIT tant que false ---
wait_until_playable() {
  local id="$1"
  local deadline=$(( $(date +%s) + PLAYABLE_MAX_WAIT_S ))
  local attempt=0
  while (( $(date +%s) < deadline )); do
    attempt=$((attempt + 1))
    local body
    local code
    body="$(curl -sS -w '\n%{http_code}' \
      -H "Authorization: Bearer ${TOKEN}" \
      -H "Accept: application/json" \
      "${VIMEO_API}/videos/${id}?fields=status,is_playable,transcode.status,duration" || true)"
    code="$(echo "${body}" | tail -1)"
    body="$(echo "${body}" | sed '$d')"

    if [[ "${code}" == "404" ]]; then
      err "probe 404 — vidéo absente, MP4 CONSERVÉ"
      return 1
    fi
    if [[ "${code}" != "200" ]]; then
      log "probe http=${code} attempt=${attempt} — on réessaie (MP4 gardé)"
      sleep 20
      continue
    fi

    local is_playable status transcode
    is_playable="$(echo "${body}" | jq -r '.is_playable // false')"
    status="$(echo "${body}" | jq -r '.status // empty')"
    transcode="$(echo "${body}" | jq -r '.transcode.status // empty')"

    if [[ "${is_playable}" == "true" ]] || \
       { [[ "${status}" == "available" ]] && { [[ "${transcode}" == "complete" ]] || [[ -z "${transcode}" ]]; }; }; then
      log "playable CONFIRMED vimeoId=${id} status=${status} transcode=${transcode} attempt=${attempt}"
      return 0
    fi

    log "not playable yet status=${status} is_playable=${is_playable} transcode=${transcode} attempt=${attempt}"
    sleep 20
  done
  err "timeout probe playable (${PLAYABLE_MAX_WAIT_S}s) — MP4 CONSERVÉ: ${MP4_PATH}"
  return 1
}

if ! wait_until_playable "${VIMEO_ID}"; then
  exit 1
fi

# --- 4) Ingest FitMangas (après playable) ---
INGEST_PAYLOAD="$(jq -n \
  --arg f "${FILENAME}" \
  --arg v "${VIMEO_ID}" \
  --arg s "${SESSION_ID}" \
  '{fileName:$f, vimeoId:$v} + (if ($s|length)>0 then {sessionId:$s} else {} end)')"

if ! curl -fsS -X POST "${APP_URL}/api/internal/recordings/ingest" \
  -H "Authorization: Bearer ${SECRET}" \
  -H "Content-Type: application/json" \
  -d "${INGEST_PAYLOAD}"; then
  err "ingest API échoué — MP4 CONSERVÉ (Vimeo playable OK, à relancer ingest)"
  exit 1
fi
log "ingest OK"

# --- 5) Delete MP4 UNIQUEMENT ici (playable + ingest OK) ---
rm -f "${MP4_PATH}"
log "MP4 deleted after playable confirm: ${FILENAME}"

# --- 6) Filet disque 80 % (secondaire) — jamais le fichier courant (déjà parti) ---
disk_usage_pct() {
  df -P "${RECORDINGS_DIR}" | awk 'NR==2 {gsub(/%/,"",$5); print $5}'
}

USAGE="$(disk_usage_pct || echo 0)"
if (( USAGE >= DISK_THRESHOLD_PCT )); then
  log "disk ${USAGE}% >= ${DISK_THRESHOLD_PCT}% — cleanup anciens .mp4 (>7j) dans ${RECORDINGS_DIR}"
  find "${RECORDINGS_DIR}" -maxdepth 1 -type f -name '*.mp4' -mtime +7 -print -delete || true
else
  log "disk ${USAGE}% — pas de cleanup secondaire"
fi

log "done vimeoId=${VIMEO_ID}"
exit 0
