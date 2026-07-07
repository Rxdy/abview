#!/bin/bash
# Vérifie à distance (SSH/Tailscale) qu'un déploiement AbView tourne réellement :
# conteneurs Docker, healthchecks HTTP, process Chromium, et une capture d'écran
# de ce qui est réellement affiché sur le kiosk.
set -uo pipefail

HOST="${1:-rp-meliodas}"
SSH_KEY="$HOME/.ssh/id_ed25519_merlin"
SSH_USER="rudya"
SSH_CMD=(ssh -i "$SSH_KEY" -o ConnectTimeout=10 "$SSH_USER@$HOST")
OUT_DIR="./deploy-checks"
TIMESTAMP=$(date +%Y%m%d-%H%M%S)

mkdir -p "$OUT_DIR"

echo "=== Vérification du déploiement AbView sur $HOST ==="

echo ""
echo "--- Conteneurs Docker ---"
"${SSH_CMD[@]}" "docker compose -f ~/abview/docker-compose.prod.yml ps" \
    || echo "⚠️  Impossible de lister les conteneurs (chemin ~/abview correct ?)"

echo ""
echo "--- Healthchecks HTTP ---"
"${SSH_CMD[@]}" "curl -sf -o /dev/null -w 'frontend (8082): HTTP %{http_code}\n' http://localhost:8082 \
    || echo 'frontend (8082): injoignable'"
"${SSH_CMD[@]}" "curl -sf -o /dev/null -w 'backend  (3333): HTTP %{http_code}\n' http://localhost:3333 \
    || echo 'backend  (3333): injoignable'"

echo ""
echo "--- Process Chromium (kiosk) ---"
"${SSH_CMD[@]}" "pgrep -a chromium 2>/dev/null || pgrep -a chromium-browser 2>/dev/null" \
    || echo "⚠️  Chromium ne semble pas tourner"

echo ""
echo "--- Capture d'écran du kiosk ---"
REMOTE_PNG="/tmp/kiosk-check.png"
"${SSH_CMD[@]}" "
    rm -f $REMOTE_PNG
    export DISPLAY=\"\${DISPLAY:-:0}\"
    if command -v grim >/dev/null 2>&1; then
        grim $REMOTE_PNG 2>/dev/null && echo 'capturé via grim (Wayland)'
    fi
    if [ ! -s $REMOTE_PNG ] && command -v scrot >/dev/null 2>&1; then
        scrot $REMOTE_PNG 2>/dev/null && echo 'capturé via scrot (X11)'
    fi
    if [ ! -s $REMOTE_PNG ] && command -v import >/dev/null 2>&1; then
        import -window root $REMOTE_PNG 2>/dev/null && echo 'capturé via import (X11/ImageMagick)'
    fi
    if [ ! -s $REMOTE_PNG ] && command -v raspi2png >/dev/null 2>&1; then
        raspi2png -p $REMOTE_PNG 2>/dev/null && echo 'capturé via raspi2png'
    fi
    [ -s $REMOTE_PNG ] || echo 'ÉCHEC: aucun outil de capture trouvé (scrot/import/grim/raspi2png)'
"

LOCAL_PNG="$OUT_DIR/kiosk-$HOST-$TIMESTAMP.png"
if "${SSH_CMD[@]}" "[ -s $REMOTE_PNG ]" 2>/dev/null; then
    scp -i "$SSH_KEY" -o ConnectTimeout=10 "$SSH_USER@$HOST:$REMOTE_PNG" "$LOCAL_PNG" >/dev/null 2>&1 \
        && echo "✅ Screenshot récupéré : $LOCAL_PNG" \
        || echo "❌ Échec du rapatriement du screenshot."
else
    echo "❌ Pas de screenshot disponible côté Pi."
fi
