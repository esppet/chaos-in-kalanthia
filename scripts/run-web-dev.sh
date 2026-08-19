#!/usr/bin/env bash
# Serve the developer HTML5 game.
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
PORT="${1:-8766}"
cd "$ROOT/web-dev"

ips="$(hostname -I 2>/dev/null || true)"
echo "Chaos in Kalanthia (dev)"
echo "  this computer:  http://127.0.0.1:${PORT}/"
for ip in $ips; do
  [[ "$ip" == *:* ]] && continue
  echo "  other devices:  http://${ip}:${PORT}/"
done
echo "Ctrl+C to stop."
exec python3 -m http.server "$PORT" --bind 0.0.0.0
