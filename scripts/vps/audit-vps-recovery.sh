#!/usr/bin/env bash
# Audit complet VPS pour récupération replays — à lancer sur le Mac (mot de passe SSH).
#
# Usage :
#   bash scripts/vps/audit-vps-recovery.sh | tee vps-recovery-audit.txt

set -euo pipefail

HOST="${JIBRI_SSH_HOST:-root@178.104.206.202}"
BASE="/opt/docker-jitsi-meet/.jitsi-meet-cfg/web/jibri/recordings"

echo "========== AUDIT RÉCUPÉRATION VPS $(date) =========="
echo

run_remote() {
  ssh -o ConnectTimeout=20 "${HOST}" "$1"
}

echo "==> 1) Tous les MP4 (toute taille)"
run_remote "find '${BASE}' -type f -name '*.mp4' -exec ls -lh {} \; 2>/dev/null | sort -k5 -h"

echo
echo "==> 2) Fichiers ≥ 500 Mo (cours complets possibles)"
run_remote "find '${BASE}' -type f -name '*.mp4' -size +500M -exec ls -lh {} \; 2>/dev/null" || echo "(aucun)"

echo
echo "==> 3) Marqueurs finalize (.fitmangas-finalized) = ID Vimeo quand upload OK"
run_remote "find '${BASE}' -name '.fitmangas-finalized' 2>/dev/null | while read m; do echo \"--- \$m\"; cat \"\$m\"; ls -lh \"\$(dirname \"\$m\")\"/*.mp4 2>/dev/null || true; done"

echo
echo "==> 4) Dernières lignes finalize.log (historique uploads)"
run_remote "tail -200 '${BASE}/finalize.log' 2>/dev/null || tail -200 '${BASE}/../finalize.log' 2>/dev/null || echo 'log introuvable'"

echo
echo "==> 5) Espace disque"
run_remote "df -h '${BASE}' 2>/dev/null; du -sh '${BASE}' 2>/dev/null"

echo
echo "========== FIN AUDIT =========="
echo
echo "Si tu vois des MP4 ≥ 500 Mo ci-dessus → bash scripts/vps/pull-all-jibri-mp4.sh"
echo "Sinon → vérifie les sauvegardes Hetzner (console.hetzner.com → serveur → Backups)"
echo "       et/ou ouvre un ticket Vimeo Support avec scripts/export-vimeo-dead-ids-for-support.ts"
