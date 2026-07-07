#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
GAME_DIR="$ROOT/game"

if ! command -v scummvm &>/dev/null; then
  echo "ScummVM is not installed."
  echo "Install it with: sudo apt install scummvm"
  echo "Or download from: https://www.scummvm.org/downloads/"
  exit 1
fi

if [[ ! -f "$GAME_DIR/resource.map" ]]; then
  echo "Game data not found at $GAME_DIR"
  exit 1
fi

exec scummvm --path="$GAME_DIR"