// Builds a review page for the What we do code component into site/previews/what-we-do/,
// so it opens with preview.sh like the HTML drafts:
//   ./preview.sh <branch> previews/what-we-do/index.html          (or "...index.html?tiles=b" / "?tiles=drawings")
// Rebuild after changing framer/code/ArcoviaWhatWeDo.tsx:
//   node framer/harness/preview-what-we-do.mjs
// The photos are the generated silhouettes in site/previews/what-we-do/img (sets A and B).
import { build } from "esbuild"
import fs from "fs"
import path from "path"
const here = path.dirname(new URL(import.meta.url).pathname)
const out = path.resolve(here, "../../site/previews/what-we-do")
fs.mkdirSync(out, { recursive: true })
const entry = path.join(out, ".entry.tsx")
fs.writeFileSync(entry, `
import * as React from "react"
import { createRoot } from "react-dom/client"
import WhatWeDo from ${JSON.stringify(path.resolve(here, "../code/ArcoviaWhatWeDo.tsx"))}

// Silhouettes, generated in Magnific (Nano Banana 2.1), two versions per service
const NAMES = ["narrative", "strategy", "equity", "debt", "mna", "fund"]
const set = (v) => NAMES.map((n, i) => ["img/" + String(i + 1).padStart(2, "0") + "-" + n + "-" + v + ".jpg", "50% 50%"])
const STYLES = {
  a: { title: "Silhouettes A", photos: set("a") },
  b: { title: "Silhouettes B", photos: set("b") },
}
const SERVICES = [
  ["Investor Narrative & Positioning", "Memo, teaser and deck built as one positioning system, stress-tested against real investor objections.", "narrative"],
  ["Capital Strategy", "Round sizing, valuation anchoring, structure and the closing sequence.", "strategy"],
  ["Equity Raising", "Growth equity, PIPEs and registered directs, through 3,000+ institutional relationships.", "equity"],
  ["Debt Advisory & Placement", "Venture debt, growth lending, unitranche, mezzanine and subordinated debt.", "debt"],
  ["M&A and Project Finance", "Sell-side, buy-side and cross-border mandates, and milestone-based project finance.", "mna"],
  ["Fund Formation & Partnerships", "Emerging managers, LP strategy, fund-to-fund and co-investment partnerships.", "fund"],
]
const OPTIONS = [["drawings", "Drawings"], ...Object.entries(STYLES).map(([k, v]) => [k, v.title])]

function Page() {
  const initial = (location.search.match(/[?&]tiles=(\\w+)/) || [])[1] || "a"
  const [tiles, setTiles] = React.useState(initial in STYLES || initial === "drawings" ? initial : "drawings")
  const style = STYLES[tiles]
  const services = SERVICES.map(([title, text, drawing], i) => ({
    title, text, drawing,
    photo: style ? style.photos[i][0] : undefined,
    focus: style ? style.photos[i][1] : undefined,
  }))
  return <>
    <div style={{ height: 120 }} />
    <WhatWeDo key={tiles} style={{ width: "100%" }} art={style ? "photos" : "drawings"} services={services} />
    <div style={{ height: "60vh" }} />
    <div className="switch" role="group" aria-label="Tiles">
      {OPTIONS.map(([k, label]) => (
        <button key={k} aria-pressed={tiles === k} onClick={() => setTiles(k)}>{label}</button>
      ))}
    </div>
  </>
}
createRoot(document.getElementById("root")).render(<Page />)
`)
await build({
  entryPoints: [entry],
  bundle: true,
  minify: true,
  outfile: path.join(out, "bundle.js"),
  format: "iife",
  jsx: "automatic",
  loader: { ".tsx": "tsx" },
  alias: { framer: path.join(here, "framer-stub.js") },
  nodePaths: [path.join(here, "node_modules")],
  define: { "process.env.NODE_ENV": '"production"' },
  logLevel: "warning",
})
fs.rmSync(entry)
fs.writeFileSync(path.join(out, "index.html"), `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>What we do: review</title>
<link rel="icon" href="../../assets/a-mark.svg">
<style>
  html, body { margin: 0; background: #fff; }
  .switch { position: fixed; left: 50%; bottom: 20px; transform: translateX(-50%); z-index: 10;
    display: flex; gap: 4px; padding: 4px; border-radius: 999px; background: #fff;
    box-shadow: 0 0 0 1px rgba(17,17,17,.08), 0 12px 32px -4px rgba(17,17,17,.14);
    font: 500 13px/1 Montserrat, "Helvetica Neue", Arial, sans-serif; }
  .switch button { font: inherit; border: 0; background: none; color: #3a3a3a; padding: 10px 14px; border-radius: 999px; cursor: pointer; white-space: nowrap; }
  .switch button[aria-pressed="true"] { background: #151515; color: #fff; }
  @media (max-width: 560px) { .switch { font-size: 11px; } .switch button { padding: 9px 9px; } }
</style>
</head>
<body>
<div id="root"></div>
<script src="bundle.js"></script>
</body>
</html>
`)
console.log("built", out)
