#!/bin/sh
# Preview a branch of the Arcovia site in your browser.
#   ./preview.sh                         opens main (approved work)
#   ./preview.sh <branch-name>           opens an exploration branch
#   ./preview.sh <branch-name> <page>    opens another page of it, e.g. versions/final-1/index.html
set -e
cd "$(dirname "$0")"
branch="${1:-main}"
page="${2:-index.html}"
git fetch -q origin
git checkout -q "$branch"
git pull -q --ff-only origin "$branch"
echo "Showing $branch at $(git log --oneline -1)"
if command -v open >/dev/null 2>&1; then open "site/$page"; else xdg-open "site/$page"; fi
