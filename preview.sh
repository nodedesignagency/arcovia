#!/bin/sh
# Preview a branch of the Arcovia site in your browser.
#   ./preview.sh                         opens main (approved work)
#   ./preview.sh <branch-name>           opens an exploration branch
#   ./preview.sh <branch-name> <page>    opens another page of it, e.g. versions/final-1/index.html
#   ./preview.sh <branch-name> "index.html?picker=glass"   with a review switch
set -e
cd "$(dirname "$0")"
branch="${1:-main}"
page="${2:-index.html}"
git fetch -q origin
git checkout -q "$branch"
git pull -q --ff-only origin "$branch"
echo "Showing $branch at $(git log --oneline -1)"

file="${page%%\?*}"
if [ ! -f "site/$file" ]; then
  echo "No such page: site/$file"
  exit 1
fi

opener="xdg-open"
command -v open >/dev/null 2>&1 && opener="open"

case "$page" in
  *\?*)
    # Opening a file can't carry "?…" options, so open a tiny page that redirects to it with them
    query="${page#*\?}"
    tmp="${TMPDIR:-/tmp}/arcovia-preview.html"
    printf '<!doctype html><meta charset="utf-8"><script>location.replace(encodeURI("file://%s/site/%s") + "?%s")</script>\n' "$(pwd)" "$file" "$query" > "$tmp"
    "$opener" "$tmp"
    ;;
  *)
    "$opener" "site/$file"
    ;;
esac
