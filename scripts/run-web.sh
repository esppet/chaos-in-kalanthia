#!/usr/bin/env bash
# Serve the HTML5 game (ES modules need http, not file://).
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
PORT="${1:-8765}"
cd "$ROOT/web"

ips="$(hostname -I 2>/dev/null || true)"
echo "Chaos in Kalanthia"
echo "  this computer:  http://127.0.0.1:${PORT}/"
for ip in $ips; do
  [[ "$ip" == *:* ]] && continue
  echo "  other devices:  http://${ip}:${PORT}/"
done
echo "Ctrl+C to stop."
exec python3 -m http.server "$PORT" --bind 0.0.0.0
