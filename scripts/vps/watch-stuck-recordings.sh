#!/usr/bin/env bash
# watch-stuck-recordings.sh — filet automatique FitMangas
#
# Toutes les X minutes (cron) :
# 1. Cherche les dossiers de session Jibri qui contiennent encore un .mp4
# 2. Attend que le fichier soit « stable » (plus modifié depuis MIN_AGE_MIN)
# 3. Lance finalize.sh → Vimeo → ingest → EN ATTENTE sur /admin/replays
#
# Ainsi, même si le hook Jibri ne déclenche pas finalize, les replays remontent seuls.
#
# Installé par : scripts/vps/install-auto-finalize.sh

set -euo pipefail

RECORDINGS_ROOT="${RECORDINGS_ROOT:-/opt/docker-jitsi-meet/.jitsi-meet-cfg/web/jibri/recordings}"
FINALIZE_SH="${FINALIZE_SH:-/opt/docker-jitsi-meet/.jitsi-meet-cfg/web/jibri/finalize.sh}"
ENV_FILE="${ENV_FILE:-/opt/docker-jitsi-meet/.jitsi-meet-cfg/jibri/finalize.env}"
LOG_FILE="${WATCH_LOG:-${RECORDINGS_ROOT}/watch-stuck.log}"
LOCK_FILE="${LOCK_FILE:-/tmp/fitmangas-watch-stuck.lock}"
# Attendre que Jibri ait fini d’écrire le MP4 (minutes)
MIN_AGE_MIN="${MIN_AGE_MIN:-8}"
# Taille mini (évite les fichiers encore vides / coupés)
MIN_BYTES="${MIN_BYTES:-5000000}"

mkdir -p "$(dirname "${LOG_FILE}")" 2>/dev/null || true
touch "${LOG_FILE}" 2>/dev/null || LOG_FILE="/tmp/fitmangas-watch-stuck.log"

log() { echo "$(date -u +%Y-%m-%dT%H:%M:%SZ) [watch] $*" | tee -a "${LOG_FILE}"; }

# Un seul watch à la fois
exec 9>"${LOCK_FILE}"
if ! flock -n 9; then
  log "déjà en cours — skip"
  exit 0
fi

if [[ ! -x "${FINALIZE_SH}" ]]; then
  log "ERROR finalize.sh introuvable ou non exécutable: ${FINALIZE_SH}"
  exit 1
fi
if [[ ! -f "${ENV_FILE}" ]]; then
  log "ERROR finalize.env introuvable: ${ENV_FILE}"
  exit 1
fi
if [[ ! -d "${RECORDINGS_ROOT}" ]]; then
  log "ERROR dossier recordings absent: ${RECORDINGS_ROOT}"
  exit 1
fi

NOW_EPOCH="$(date +%s)"
MIN_AGE_SEC=$((MIN_AGE_MIN * 60))
FOUND=0
DONE=0
FAIL=0

log "scan ${RECORDINGS_ROOT} (age>=${MIN_AGE_MIN}min size>=${MIN_BYTES})"

# Dossiers session UUID avec au moins un mp4
while IFS= read -r -d '' session_dir; do
  mp4="$(find "${session_dir}" -maxdepth 1 -type f -name '*.mp4' 2>/dev/null | sort | tail -1 || true)"
  [[ -n "${mp4}" && -f "${mp4}" ]] || continue

  size="$(stat -c%s "${mp4}" 2>/dev/null || echo 0)"
  mtime="$(stat -c%Y "${mp4}" 2>/dev/null || echo 0)"
  age=$((NOW_EPOCH - mtime))

  if (( size < MIN_BYTES )); then
    log "skip trop petit (${size}o): ${mp4}"
    continue
  fi
  if (( age < MIN_AGE_SEC )); then
    log "skip trop récent (${age}s): $(basename "${mp4}")"
    continue
  fi

  if [[ -f "${session_dir}/.fitmangas-finalized" ]]; then
    log "skip déjà finalisé: $(basename "${session_dir}")"
    continue
  fi

  FOUND=$((FOUND + 1))
  log "finalize → $(basename "${session_dir}") / $(basename "${mp4}") (${size}o, age=${age}s)"

  set +e
  FINALIZE_LOG="${RECORDINGS_ROOT}/finalize.log" \
    "${FINALIZE_SH}" "${session_dir}" >>"${LOG_FILE}" 2>&1
  rc=$?
  set -e

  if [[ "${rc}" -eq 0 ]]; then
    DONE=$((DONE + 1))
    log "OK session=$(basename "${session_dir}")"
  else
    FAIL=$((FAIL + 1))
    log "FAIL rc=${rc} session=$(basename "${session_dir}") — MP4 conservé"
  fi
done < <(find "${RECORDINGS_ROOT}" -mindepth 1 -maxdepth 1 -type d -print0 2>/dev/null)

log "fin found=${FOUND} ok=${DONE} fail=${FAIL}"
exit 0
