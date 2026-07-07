#!/usr/bin/env bash
# Tag and push a release — triggers GitHub Actions build
#
# Usage:
#   ./scripts/create-release.sh          # defaults to 0.1.0
#   ./scripts/create-release.sh 0.2.0

set -euo pipefail

VERSION="${1:-0.1.0}"
TAG="v${VERSION}"

cd "$(dirname "$0")/.."

if git rev-parse "$TAG" >/dev/null 2>&1; then
  echo "Tag $TAG already exists."
  exit 1
fi

echo "Creating release $TAG..."
git tag -a "$TAG" -m "Chaos in Kalanthia $TAG"
git push origin "$TAG"
echo "Pushed $TAG — GitHub Actions will build and publish the release."
echo "Track progress: https://github.com/esppet/chaos-in-kalanthia/actions"