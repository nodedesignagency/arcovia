#!/usr/bin/env bash
# Tests the Contact form exactly as Framer compiled it, with every request to Airtable caught
# in the browser and answered locally: nothing is sent. Only the investor path for now.
#   1. In a Framer program: await api.components.url("codeFile/xAzCtO5:default")  -> framer.com/m/ArcoviaContact-….js@<version>
#   2. tools/framer/contact-test/run.sh <that URL> [workdir]
# Optional: CONTACT_ENDPOINT=<the instance's Webhook URL> (any airtable.com URL is caught either way).
# Writes screenshots (2x) and the caught payloads (investor-filled.json, investor-empty.json) to <workdir>/out.
set -euo pipefail
HERE=$(cd "$(dirname "$0")" && pwd)
MODULE_URL=$1; W=${2:-$(mktemp -d)}
mkdir -p "$W/mod" "$W/www" "$W/out"
cp "$HERE"/build.mjs "$HERE"/framer-stub.js "$HERE"/entry.jsx "$HERE"/test.cjs "$W"/
cp "$HERE"/index.html "$W/www/"
cd "$W"
if [ ! -d node_modules/esbuild ]; then npm init -y >/dev/null; npm install --no-audit --no-fund react@18.3.1 react-dom@18.3.1 esbuild@0.24.2 >/dev/null; fi
CONTACT=$(curl -sS "$MODULE_URL" | grep -o 'https://framerusercontent.com/modules/[^"]*/ArcoviaContact.js' | head -1)
curl -sS -o mod/ArcoviaContact.js "$CONTACT"
BASE=$(grep -o 'https://framerusercontent.com/modules/[^"]*/ArcoviaBase.js' mod/ArcoviaContact.js | head -1)
curl -sS -o mod/ArcoviaBase.js "$BASE"
echo "ArcoviaContact: $CONTACT"
node build.mjs
python3 -m http.server 8765 --bind 127.0.0.1 --directory www >/dev/null 2>&1 & SERVER=$!
trap 'kill $SERVER' EXIT
sleep 1
node test.cjs http://127.0.0.1:8765 "$W/out" filled
node test.cjs http://127.0.0.1:8765 "$W/out" empty
echo "Screenshots and payloads: $W/out"
