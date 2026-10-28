#!/bin/sh
# Preview a branch of the Arcovia site in your browser.
#   ./preview.sh                 opens main (approved work)
#   ./preview.sh <branch-name>   opens an exploration branch
set -e
cd "$(dirname "$0")"
branch="${1:-main}"
git fetch -q origin
git checkout -q "$branch"
git pull -q --ff-only origin "$branch"
echo "Showing $branch at $(git log --oneline -1)"
if command -v open >/dev/null 2>&1; then open site/index.html; else xdg-open site/index.html; fi
