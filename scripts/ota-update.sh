#!/usr/bin/env bash
# Publish a JS-only OTA update to the `production` channel (works headless on chewy).
# Usage: npm run update -- "what changed"
set -euo pipefail

cd "$(dirname "$0")/.."

MESSAGE="${1:-}"
if [ -z "$MESSAGE" ]; then
  echo "Aborted: message is required. Usage: npm run update -- \"what changed\"" >&2
  exit 1
fi

# The update bundles the working tree, not what's on main.
BRANCH="$(git rev-parse --abbrev-ref HEAD)"
if [ "$BRANCH" != "main" ]; then
  echo "Aborted: on '$BRANCH'. Publish from main (or a detached worktree of origin/main)." >&2
  exit 1
fi
if [ -n "$(git status --porcelain)" ]; then
  echo "Aborted: working tree has uncommitted changes; they would ship in the bundle." >&2
  exit 1
fi

echo "Publishing OTA to 'production' (runtime $(node -p "require('./app.json').expo.version")): $MESSAGE"

# CI=1: expo's export step refuses --non-interactive without a TTY.
# --environment: required non-interactively. Slate has no EXPO_PUBLIC_* vars.
CI=1 eas update --channel production --environment production --platform ios --message "$MESSAGE"
