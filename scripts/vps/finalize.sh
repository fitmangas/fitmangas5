#!/usr/bin/env bash
# finalize.sh — Jibri → Vimeo (TUS) → probe playable → ingest FitMangas → delete MP4
#
# SOURCE DE VÉRITÉ (dette §10) :
# - Supprimer le MP4 local UNIQUEMENT après confirmation Vimeo is_playable=true.
# - Si la probe échoue : garder le MP4, logger, ne rien supprimer.
# - Seuil disque 80 % = filet secondaire (anciens fichiers seulement).
# - Timeout TUS généreux pour MP4 ~2 Go (ne pas conclure « échec » trop tôt).
#
# Déploiement : copier sur le VPS Hetzner (Jibri). NE PAS exécuter depuis Cursor.
#
# Usage (cas NORMAL — Jibri) :
#   finalize.sh /config/recordings/{SESSION_ID}
# Usage (rétrocompat — fichier direct) :
#   finalize.sh /chemin/vers/recording.mp4 [session-id]
#
# Env : finalize.env (plusieurs chemins essayés) + variables ci-dessous.
# Logs : finalize.log à côté des recordings (ou FINALIZE_LOG)

set -euo pipefail

LOG_TAG="[finalize]"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Charge les secrets depuis le premier fichier trouvé (Docker /config OU host).
load_finalize_env() {
  local candidate
  for candidate in \
    "${FINALIZE_ENV:-}" \
    "/config/finalize.env" \
    "${SCRIPT_DIR}/finalize.env" \
    "/opt/docker-jitsi-meet/.jitsi-meet-cfg/jibri/finalize.env" \
    "/opt/docker-jitsi-meet/.jitsi-meet-cfg/web/jibri/finalize.env"; do
    if [[ -n "${candidate}" && -f "${candidate}" ]]; then
      # shellcheck source=/dev/null
      set -a
      # shellcheck disable=SC1090
      source "${candidate}"
      set +a
      echo "$(date -u +%Y-%m-%dT%H:%M:%SZ) ${LOG_TAG} env loaded from ${candidate}" >&2
      return 0
    fi
  done
  return 1
}

load_finalize_env || true

# Journal : override > /config > dossier recordings web > à côté du script
if [[ -z "${FINALIZE_LOG:-}" ]]; then
  if [[ -d /config/recordings ]]; then
    FINALIZE_LOG="/config/recordings/finalize.log"
  elif [[ -d /opt/docker-jitsi-meet/.jitsi-meet-cfg/web/jibri/recordings ]]; then
    FINALIZE_LOG="/opt/docker-jitsi-meet/.jitsi-meet-cfg/web/jibri/recordings/finalize.log"
  else
    FINALIZE_LOG="${SCRIPT_DIR}/finalize.log"
  fi
fi
LOG_FILE="${FINALIZE_LOG}"
mkdir -p "$(dirname "${LOG_FILE}")" 2>/dev/null || true
touch "${LOG_FILE}" 2>/dev/null || LOG_FILE="/tmp/finalize.log"

log() { echo "$(date -u +%Y-%m-%dT%H:%M:%SZ) ${LOG_TAG} $*" | tee -a "${LOG_FILE}"; }
err() { echo "$(date -u +%Y-%m-%dT%H:%M:%SZ) ${LOG_TAG} ERROR $*" | tee -a "${LOG_FILE}" >&2; }

RECORDING_INPUT="${1:-}"
SESSION_ID="${2:-}"

resolve_mp4_path() {
  local input="$1"
  if [[ -z "${input}" ]]; then
    return 1
  fi
  if [[ -f "${input}" ]]; then
    case "${input}" in
      *.mp4|*.MP4) echo "${input}"; return 0 ;;
      *) return 1 ;;
    esac
  fi
  if [[ -d "${input}" ]]; then
    local found
    found="$(find "${input}" -name '*.mp4' -type f 2>/dev/null | sort | tail -1)"
    if [[ -n "${found}" && -f "${found}" ]]; then
      echo "${found}"
      return 0
    fi
    return 1
  fi
  return 1
}

if ! MP4_PATH="$(resolve_mp4_path "${RECORDING_INPUT}")"; then
  if [[ -n "${RECORDING_INPUT}" && -d "${RECORDING_INPUT}" ]]; then
    err "aucun fichier .mp4 dans le dossier d'enregistrement: ${RECORDING_INPUT}"
    exit 3
  fi
  err "Usage: $0 /config/recordings/{SESSION_ID} [session-id]"
  err "       $0 /path/to/file.mp4 [session-id]"
  exit 2
fi

if [[ -z "${SESSION_ID}" && -d "${RECORDING_INPUT}" ]]; then
  SESSION_ID="$(basename "${RECORDING_INPUT}")"
fi

FILENAME="$(basename "${MP4_PATH}")"
RECORDINGS_DIR="${RECORDINGS_DIR:-$(dirname "${MP4_PATH}")}"
if [[ -d "${RECORDING_INPUT}" ]]; then
  SESSION_DIR="${RECORDING_INPUT}"
else
  SESSION_DIR="$(dirname "${MP4_PATH}")"
fi
UPLOAD_MARKER="${SESSION_DIR}/.fitmangas-vimeo-upload"
FINALIZED_MARKER="${SESSION_DIR}/.fitmangas-finalized"

if [[ -f "${FINALIZED_MARKER}" ]]; then
  log "skip session déjà finalisée vimeoId=$(tr -d '[:space:]' < "${FINALIZED_MARKER}") dir=${SESSION_DIR}"
  exit 0
fi

APP_URL="${FITMANGAS_APP_URL:-https://fitmangas.com}"
TOKEN="${VIMEO_ACCESS_TOKEN:?VIMEO_ACCESS_TOKEN requis — vérifie finalize.env}"
SECRET="${RECORDING_INGEST_SECRET:?RECORDING_INGEST_SECRET requis — vérifie finalize.env}"
DISK_THRESHOLD_PCT="${DISK_THRESHOLD_PCT:-80}"
PLAYABLE_MAX_WAIT_S="${PLAYABLE_MAX_WAIT_S:-1800}"
TUS_TIMEOUT_S="${TUS_TIMEOUT_S:-7200}"
VIMEO_API="https://api.vimeo.com"

FILE_SIZE="$(stat -c%s "${MP4_PATH}" 2>/dev/null || stat -f%z "${MP4_PATH}")"
log "start input=${RECORDING_INPUT} file=${FILENAME} size=${FILE_SIZE} session=${SESSION_ID:-none}"

# --- 1) Créer l’upload TUS (ou reprendre sans re-upload) ---
if [[ -f "${UPLOAD_MARKER}" ]]; then
  VIMEO_ID="$(tr -d '[:space:]' < "${UPLOAD_MARKER}")"
  VIMEO_URI="/videos/${VIMEO_ID}"
  log "reprise sans re-upload vimeoId=${VIMEO_ID} (marker ${UPLOAD_MARKER})"
else
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
echo "${VIMEO_ID}" > "${UPLOAD_MARKER}"
log "tus created vimeoId=${VIMEO_ID}"

# --- 2) Upload TUS (streaming disque → réseau, pas de chargement RAM complet) ---
if ! curl -fS --max-time "${TUS_TIMEOUT_S}" \
  -X PATCH \
  -T "${MP4_PATH}" \
  -H "Tus-Resumable: 1.0.0" \
  -H "Upload-Offset: 0" \
  -H "Content-Type: application/offset+octet-stream" \
  "${UPLOAD_LINK}"; then
  err "upload TUS échoué ou timeout (${TUS_TIMEOUT_S}s) — MP4 CONSERVÉ: ${MP4_PATH}"
  exit 1
fi
log "tus upload OK (stream) vimeoId=${VIMEO_ID} size=${FILE_SIZE}"
fi

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
echo "${VIMEO_ID}" > "${FINALIZED_MARKER}"
rm -f "${UPLOAD_MARKER}"
log "MP4 deleted after playable confirm: ${FILENAME}"

# --- 6) Filet disque 80 % (secondaire) ---
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
