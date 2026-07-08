#!/usr/bin/env bash
# Install AGS on Ubuntu/Debian Linux
#
# Components:
#   1. Wine          — run the Windows AGS Editor
#   2. AGS Editor    — extracted to tools/ags-editor/ (no sudo needed)
#   3. AGS runtime   — tools/ags-editor/Linux/ags64 (run compiled games)
#   4. ScummVM       — optional, for testing ScummVM-compatible builds
#
# Usage:
#   ./scripts/install-ags-linux.sh          # full install (needs sudo for wine/scummvm)
#   ./scripts/install-ags-linux.sh --local  # editor + runtime only, no sudo

set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
AGS_ZIP_URL="https://github.com/adventuregamestudio/ags/releases/download/v3.6.1.14/AGS-3.6.1.14-Beta15.zip"
AGS_DIR="$ROOT/tools/ags-editor"
LOCAL_ONLY=false

if [[ "${1:-}" == "--local" ]]; then
  LOCAL_ONLY=true
fi

echo "==> Chaos in Kalanthia — AGS Linux setup"
echo "    Project: $ROOT"
echo

# --- AGS Editor + runtime (no root) ---
echo "==> [1/3] AGS Editor 3.6.1.14 + Linux runtime (ScummVM-compatible)"
mkdir -p "$ROOT/tools"
TMP_ZIP="$(mktemp /tmp/ags-XXXXXX.zip)"
trap 'rm -f "$TMP_ZIP"' EXIT

if [[ -x "$AGS_DIR/AGSEditor.exe" ]]; then
  echo "    AGS Editor already present at tools/ags-editor/"
else
  echo "    Downloading AGS 3.6.1.14..."
  curl -fsSL -o "$TMP_ZIP" "$AGS_ZIP_URL"
  echo "    Extracting..."
  rm -rf "$AGS_DIR"
  unzip -q -o "$TMP_ZIP" -d "$AGS_DIR"
fi

chmod +x "$AGS_DIR/Linux/ags64" "$AGS_DIR/Linux/ags32" 2>/dev/null || true
echo "    Editor:  $AGS_DIR/AGSEditor.exe"
echo "    Runtime: $AGS_DIR/Linux/ags64"
echo

# --- System packages (needs sudo) ---
if $LOCAL_ONLY; then
  echo "==> [2/3] Skipping system packages (--local)"
  echo "    Install Wine manually to use the editor:"
  echo "      sudo apt install wine winetricks"
  echo
else
  echo "==> [2/3] System packages (Wine + ScummVM)"
  if ! command -v sudo &>/dev/null; then
    echo "    ERROR: sudo not found. Run with --local or install wine manually."
    exit 1
  fi

  sudo apt-get update -qq
  sudo DEBIAN_FRONTEND=noninteractive apt-get install -y \
    wine \
    winetricks \
    scummvm \
    unzip \
    curl

  echo "    Wine:    $(wine --version 2>/dev/null || echo 'installed')"
  echo "    ScummVM: $(scummvm --version 2>/dev/null | head -1 || echo 'installed')"
  echo

  # --- Wine prefix + dependencies for AGS Editor ---
  echo "==> [3/3] Wine prefix for AGS Editor"
  export WINEPREFIX="${WINEPREFIX:-$HOME/.wine-ags}"
  export WINEARCH=win32

  if [[ ! -d "$WINEPREFIX" ]]; then
    echo "    Creating 32-bit Wine prefix at $WINEPREFIX"
    wineboot --init 2>/dev/null || true
    sleep 3
  else
    echo "    Using existing Wine prefix: $WINEPREFIX"
  fi

  echo "    Installing .NET Framework 4.5 (required by AGS Editor)..."
  echo "    This may take several minutes."
  winetricks -q dotnet45 2>&1 | tail -5 || {
    echo "    WARNING: dotnet45 install may have failed."
    echo "    Try manually: WINEPREFIX=$WINEPREFIX winetricks dotnet45"
  }
fi

echo
echo "=== Setup complete ==="
echo
echo "Open the AGS Editor:"
echo "  ./scripts/run-ags-editor.sh"
echo
echo "Open this project directly:"
echo "  ./scripts/run-ags-editor.sh \"$ROOT/game/Game.agf\""
echo
echo "Run a compiled game (after Build in editor):"
echo "  ./scripts/run-ags-game.sh"
echo
echo "Test in ScummVM (after building):"
echo "  ./scripts/run-scummvm.sh"