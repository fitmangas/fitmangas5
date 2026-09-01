#!/usr/bin/env bash
# Récupère TOUS les MP4 Jibri restants sur le VPS (sessions non finalisées ou échec upload).
# Demande le mot de passe SSH root@178.104.206.202 (comme deploy-from-mac.sh).
#
# Usage :
#   bash scripts/vps/pull-all-jibri-mp4.sh
# Puis :
#   npx tsx --env-file=.env.local scripts/recover-dead-replays-from-mp4.ts --upload

set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
HOST="${JIBRI_SSH_HOST:-root@178.104.206.202}"
REMOTE_DIR="${JIBRI_RECORDINGS_DIR:-/opt/docker-jitsi-meet/.jitsi-meet-cfg/web/jibri/recordings}"
LOCAL_DIR="${VIDEO_RECORDINGS_DIR:-${ROOT}/recordings-local}/recover"
MIN_BYTES="${MIN_MP4_BYTES:-52428800}"

mkdir -p "${LOCAL_DIR}"

echo "==> Scan VPS ${HOST}:${REMOTE_DIR}"
REMOTE_LIST="$(mktemp)"
ssh -o ConnectTimeout=20 "${HOST}" \
  "find '${REMOTE_DIR}' -type f -name 'fitmangas-*.mp4' -size +${MIN_BYTES}c 2>/dev/null | sort" > "${REMOTE_LIST}" || true

COUNT=0
while IFS= read -r remote || [[ -n "${remote}" ]]; do
  [[ -z "${remote}" ]] && continue
  COUNT=$((COUNT + 1))
done < "${REMOTE_LIST}"

if [[ "${COUNT}" -eq 0 ]]; then
  echo "Aucun MP4 fitmangas ≥ $(( MIN_BYTES / 1024 / 1024 )) Mo trouvé sur le VPS."
  echo "Les replays uploadés avec succès ont été effacés du disque après envoi Vimeo (normal)."
  rm -f "${REMOTE_LIST}"
  exit 0
fi

echo "Trouvés: ${COUNT} fichier(s)"
while IFS= read -r remote || [[ -n "${remote}" ]]; do
  [[ -z "${remote}" ]] && continue
  base="$(basename "${remote}")"
  dest="${LOCAL_DIR}/${base}"
  if [[ -f "${dest}" ]]; then
    echo "SKIP (déjà local): ${base}"
    continue
  fi
  echo "SCP ${base}…"
  scp "${HOST}:${remote}" "${dest}"
done < "${REMOTE_LIST}"
rm -f "${REMOTE_LIST}"

echo
echo "==> Local ${LOCAL_DIR}:"
ls -lah "${LOCAL_DIR}/"*.mp4 2>/dev/null || true
echo
echo "Ensuite :"
echo "  npx tsx --env-file=.env.local scripts/recover-dead-replays-from-mp4.ts --dry-run"
echo "  npx tsx --env-file=.env.local scripts/recover-dead-replays-from-mp4.ts --upload --limit=1"
echo "  npx tsx --env-file=.env.local scripts/recover-dead-replays-from-mp4.ts --upload"
