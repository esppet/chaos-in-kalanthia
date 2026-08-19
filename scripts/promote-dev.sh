#!/usr/bin/env bash
# Copy the developer game over the stable game.
# Usage: ./scripts/promote-dev.sh
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
STAMP="$(date +%Y%m%d-%H%M%S)"
"$ROOT/scripts/backup-web.sh" "before-promote-dev"
rm -rf "${ROOT}/web"
cp -a "${ROOT}/web-dev" "${ROOT}/web"
# Stable build should not keep the dev save key or tab title.
sed -i 's/chaos-in-kalanthia-dev-save/chaos-in-kalanthia-save/' "${ROOT}/web/js/engine.js"
sed -i 's/chaos-in-kalanthia-dev-music-muted/chaos-in-kalanthia-music-muted/' "${ROOT}/web/js/music.js"
sed -i 's/<title>Chaos in Kalanthia (dev)<\/title>/<title>Chaos in Kalanthia<\/title>/' "${ROOT}/web/index.html"
sed -i 's/Developer build/A point-and-click adventure/' "${ROOT}/web/index.html"
echo "Promoted web-dev/ → web/  (backup stamp ${STAMP})"
