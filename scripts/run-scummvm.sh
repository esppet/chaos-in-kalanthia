#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"

if ! command -v scummvm &>/dev/null; then
  echo "ScummVM is not installed."
  echo "Install it with: sudo apt install scummvm"
  echo "Or download from: https://www.scummvm.org/downloads/"
  exit 1
fi

# Prefer compiled game output; fall back to game source folder
for dir in "$ROOT/game/Compiled" "$ROOT/game"; do
  if compgen -G "$dir"/*.exe &>/dev/null || [[ -f "$dir/chaos-in-kalanthia" ]]; then
    exec scummvm --path="$dir"
  fi
done

echo "No compiled game found."
echo "Build the game in AGS Editor (Build → Build EXE(s)), then run this script again."
exit 1