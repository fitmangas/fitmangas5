#!/usr/bin/env bash
# Récupère les MP4 Jibri bloqués en upload Vimeo et prépare le re-upload.
#
# Prérequis :
#   - Clé SSH vers root@178.104.206.202 (live.fitmangas.com)
#   - .env.local avec VIMEO_ACCESS_TOKEN
#
# Usage :
#   chmod +x scripts/recover-jibri-stuck-replays.sh
#   ./scripts/recover-jibri-stuck-replays.sh
#
# Puis :
#   npx tsx --env-file=.env.local scripts/reupload-stuck-course-replays.ts

set -euo pipefail

HOST="${JIBRI_SSH_HOST:-root@178.104.206.202}"
REMOTE_DIR="${JIBRI_RECORDINGS_DIR:-/opt/docker-jitsi-meet/.jitsi-meet-cfg/jibri/recordings}"
LOCAL_DIR="${VIDEO_RECORDINGS_DIR:-$(pwd)/recordings-local/recover}"

NEEDLES=(
  "fitmangas-pilates-mat-202607161900"
  "fitmangas-renfo-core-202607151900"
  "fitmangas-pilates-mat-202607131830"
)

mkdir -p "$LOCAL_DIR"

echo "==> Liste distante : $HOST:$REMOTE_DIR"
ssh -o ConnectTimeout=15 "$HOST" "ls -lah '$REMOTE_DIR' | tail -80"

echo
echo "==> Recherche des MP4 cibles…"
for needle in "${NEEDLES[@]}"; do
  remote_path="$(ssh "$HOST" "find '$REMOTE_DIR' -type f -name '${needle}*.mp4' 2>/dev/null | head -1" || true)"
  if [[ -z "${remote_path}" ]]; then
    echo "MANQUANT: ${needle}*.mp4"
    continue
  fi
  base="$(basename "$remote_path")"
  echo "TROUVÉ: $remote_path"
  echo "  → scp vers $LOCAL_DIR/$base"
  scp "$HOST:$remote_path" "$LOCAL_DIR/$base"
done

echo
echo "==> Fichiers locaux:"
ls -lah "$LOCAL_DIR"
echo
echo "Ensuite: npx tsx --env-file=.env.local scripts/reupload-stuck-course-replays.ts"
