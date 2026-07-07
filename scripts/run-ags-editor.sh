#!/usr/bin/env bash
# Launch AGS Editor via Wine on Linux

set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
AGS_DIR="$ROOT/tools/ags-editor"
EDITOR="$AGS_DIR/AGSEditor.exe"

export WINEPREFIX="${WINEPREFIX:-$HOME/.wine-ags}"
export WINEARCH=win32

if [[ ! -f "$EDITOR" ]]; then
  echo "AGS Editor not found. Run: ./scripts/install-ags-linux.sh --local"
  exit 1
fi

if ! command -v wine &>/dev/null; then
  echo "Wine is not installed."
  echo "Install it with: sudo apt install wine winetricks"
  echo "Then run: ./scripts/install-ags-linux.sh"
  exit 1
fi

cd "$AGS_DIR"
if [[ $# -gt 0 ]]; then
  exec wine "$EDITOR" "$@"
else
  exec wine "$EDITOR"
fi