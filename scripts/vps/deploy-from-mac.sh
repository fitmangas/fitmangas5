#!/usr/bin/env bash
# deploy-from-mac.sh — une seule commande pour mettre à jour le VPS replays
#
# Usage (depuis le Mac, dans le dossier fitmangas5) :
#   bash scripts/vps/deploy-from-mac.sh
#
# Demande le mot de passe SSH root@178.104.206.202 une fois.

set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
VPS="root@178.104.206.202"
REMOTE="/tmp/fitmangas-vps"

echo "==> Copie des scripts vers le VPS"
ssh "${VPS}" "mkdir -p ${REMOTE}"
scp \
  "${ROOT}/scripts/vps/finalize.sh" \
  "${ROOT}/scripts/vps/watch-stuck-recordings.sh" \
  "${ROOT}/scripts/vps/install-auto-finalize.sh" \
  "${VPS}:${REMOTE}/"

echo "==> Installation + premier scan"
ssh "${VPS}" "bash ${REMOTE}/install-auto-finalize.sh ${REMOTE}"

echo
echo "✅ VPS à jour. Après chaque cours, le replay remonte seul en ~15–30 min."
echo "   Logs : ssh ${VPS} 'tail -40 /opt/docker-jitsi-meet/.jitsi-meet-cfg/web/jibri/recordings/watch-stuck.log'"
