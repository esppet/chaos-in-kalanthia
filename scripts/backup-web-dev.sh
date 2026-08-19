#!/usr/bin/env bash
# Snapshot web-dev/ before changing the developer game.
# Usage: ./scripts/backup-web-dev.sh [label]
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
STAMP="$(date +%Y%m%d-%H%M%S)"
LABEL="${1:-}"
NAME="web-dev-${STAMP}"
if [[ -n "$LABEL" ]]; then
  NAME="${NAME}-${LABEL}"
fi
DEST="${ROOT}/backups/${NAME}"
mkdir -p "${ROOT}/backups"
cp -a "${ROOT}/web-dev" "${DEST}"
echo "Backed up web-dev/ → ${DEST}"
