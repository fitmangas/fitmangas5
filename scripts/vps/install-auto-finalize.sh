#!/usr/bin/env bash
# install-auto-finalize.sh — à exécuter SUR le VPS (une fois)
#
# Installe :
# 1. finalize.sh à jour (2 emplacements)
# 2. finalize.env aussi sous web/jibri (pour que le script le trouve)
# 3. watch-stuck-recordings.sh + cron toutes les 10 min
#
# Usage (depuis le Mac, après scp des 3 fichiers) :
#   ssh root@178.104.206.202
#   bash /tmp/fitmangas-vps/install-auto-finalize.sh

set -euo pipefail

SRC_DIR="${1:-/tmp/fitmangas-vps}"
JIBRI_CFG="/opt/docker-jitsi-meet/.jitsi-meet-cfg/jibri"
WEB_JIBRI="/opt/docker-jitsi-meet/.jitsi-meet-cfg/web/jibri"
RECORDINGS="${WEB_JIBRI}/recordings"

echo "==> Vérifications"
[[ -d "${JIBRI_CFG}" ]] || { echo "ERREUR: ${JIBRI_CFG} absent"; exit 1; }
[[ -d "${WEB_JIBRI}" ]] || { echo "ERREUR: ${WEB_JIBRI} absent"; exit 1; }
[[ -f "${SRC_DIR}/finalize.sh" ]] || { echo "ERREUR: ${SRC_DIR}/finalize.sh manquant — scp d’abord"; exit 1; }
[[ -f "${SRC_DIR}/watch-stuck-recordings.sh" ]] || { echo "ERREUR: watch-stuck manquant"; exit 1; }
[[ -f "${JIBRI_CFG}/finalize.env" ]] || { echo "ERREUR: ${JIBRI_CFG}/finalize.env manquant"; exit 1; }

echo "==> Backup des anciens scripts"
ts="$(date +%Y%m%d-%H%M%S)"
[[ -f "${WEB_JIBRI}/finalize.sh" ]] && cp -a "${WEB_JIBRI}/finalize.sh" "${WEB_JIBRI}/finalize.sh.backup-${ts}"
[[ -f "${JIBRI_CFG}/finalize.sh" ]] && cp -a "${JIBRI_CFG}/finalize.sh" "${JIBRI_CFG}/finalize.sh.backup-${ts}"

echo "==> Copie finalize.sh"
cp -a "${SRC_DIR}/finalize.sh" "${WEB_JIBRI}/finalize.sh"
cp -a "${SRC_DIR}/finalize.sh" "${JIBRI_CFG}/finalize.sh"
chmod +x "${WEB_JIBRI}/finalize.sh" "${JIBRI_CFG}/finalize.sh"

echo "==> Copie finalize.env aussi dans web/jibri (lecture auto)"
cp -a "${JIBRI_CFG}/finalize.env" "${WEB_JIBRI}/finalize.env"
chmod 600 "${WEB_JIBRI}/finalize.env"

echo "==> Install watch-stuck-recordings.sh"
mkdir -p /usr/local/bin
cp -a "${SRC_DIR}/watch-stuck-recordings.sh" /usr/local/bin/fitmangas-watch-stuck-recordings.sh
chmod +x /usr/local/bin/fitmangas-watch-stuck-recordings.sh

echo "==> Cron toutes les 10 minutes"
CRON_LINE="*/10 * * * * root /usr/local/bin/fitmangas-watch-stuck-recordings.sh >/dev/null 2>&1"
# cron.d (fiable sur Ubuntu)
echo "${CRON_LINE}" > /etc/cron.d/fitmangas-watch-recordings
chmod 644 /etc/cron.d/fitmangas-watch-recordings

# Si un cron utilisateur existe déjà avec l’ancienne ligne, on ne touche pas

echo "==> Premier scan immédiat (filet pour MP4 déjà présents)"
/usr/local/bin/fitmangas-watch-stuck-recordings.sh || true

echo "==> Indice config Jibri (hook natif, informatif)"
grep -Rni "finalize" /opt/docker-jitsi-meet/.jitsi-meet-cfg/jibri/ /opt/docker-jitsi-meet/.jitsi-meet-cfg/web/jibri/ 2>/dev/null \
  | grep -viE "\.mp4|backup|finalize\.(log|sh|env)|watch" | head -20 || true

echo
echo "✅ Install OK"
echo "   - finalize: ${WEB_JIBRI}/finalize.sh"
echo "   - watch:    /usr/local/bin/fitmangas-watch-stuck-recordings.sh"
echo "   - cron:     /etc/cron.d/fitmangas-watch-recordings (toutes les 10 min)"
echo "   - logs:     ${RECORDINGS}/finalize.log  et  ${RECORDINGS}/watch-stuck.log"
echo
echo "Après chaque cours : attendre ~15–30 min → le replay apparaît dans"
echo "https://fitmangas.com/admin/replays  (EN ATTENTE) → tu prévisualises et tu valides."
