#!/usr/bin/env bash
# Run a compiled AGS game with the bundled Linux runtime

set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
AGS_BIN="$ROOT/tools/ags-editor/Linux/ags64"
AGS_LIB="$ROOT/tools/ags-editor/Linux/lib64"

if [[ ! -x "$AGS_BIN" ]]; then
  echo "AGS runtime not found. Run: ./scripts/install-ags-linux.sh --local"
  exit 1
fi

export LD_LIBRARY_PATH="$AGS_LIB${LD_LIBRARY_PATH:+:$LD_LIBRARY_PATH}"

# Prefer compiled output
for dir in "$ROOT/game/Compiled/Linux" "$ROOT/game/Compiled" "$ROOT/game"; do
  if [[ -d "$dir" ]]; then
    for bin in "$dir"/chaos-in-kalanthia "$dir"/*.exe "$dir"/*; do
      if [[ -f "$bin" && -x "$bin" && "$bin" != "$AGS_BIN" ]]; then
        exec "$AGS_BIN" --path "$dir"
      fi
    done
    # Run by directory if game data files are present
    if [[ -f "$dir/Game.agf" || -f "$dir/chaos-in-kalanthia.exe" ]]; then
      exec "$AGS_BIN" --path "$dir"
    fi
  fi
done

echo "No compiled game found."
echo "Build first in AGS Editor: File → Open game/Game.agf, then Build → Build EXE(s)"
exit 1