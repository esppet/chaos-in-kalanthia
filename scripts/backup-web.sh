#!/usr/bin/env bash
# Snapshot web/ before changing the playable game.
# Usage: ./scripts/backup-web.sh [label]
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
STAMP="$(date +%Y%m%d-%H%M%S)"
LABEL="${1:-}"
NAME="web-${STAMP}"
if [[ -n "$LABEL" ]]; then
  NAME="${NAME}-${LABEL}"
fi
DEST="${ROOT}/backups/${NAME}"
mkdir -p "${ROOT}/backups"
cp -a "${ROOT}/web" "${DEST}"
echo "Backed up web/ → ${DEST}"
