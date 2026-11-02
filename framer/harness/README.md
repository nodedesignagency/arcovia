# Arcovia Framer components: local harness

Builds the code components in `framer/code/` into a plain test page, with a small
stand-in for the `framer` module, so they can be checked in Chromium before they
go into Framer.

```bash
npm i --prefix /tmp/arcovia-harness esbuild@0.24.0 react@18.3.1 react-dom@18.3.1
ln -sfn /tmp/arcovia-harness/node_modules framer/harness/node_modules   # build.mjs is ESM: it finds esbuild only here (git-ignored)
node framer/harness/build.mjs /tmp/arcovia-out Header Hero Data WhatWeDo Team WhyFounders Map
cd /tmp/arcovia-out && python3 -m http.server 8090   # open page.html, or page.html?canvas=1
```
