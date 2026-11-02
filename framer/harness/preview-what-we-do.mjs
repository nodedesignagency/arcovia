// Builds a review page for the What we do code component into site/previews/what-we-do/,
// so it opens with preview.sh like the HTML drafts:
//   ./preview.sh <branch> previews/what-we-do/index.html   (options: "...index.html?one=window-1&frame=none", "?tiles=drawings")
// Rebuild after changing framer/code/ArcoviaWhatWeDo.tsx:
//   node framer/harness/preview-what-we-do.mjs
// The photos are the chosen generated silhouettes in site/previews/what-we-do/img.
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

// The chosen silhouettes (generated in Magnific), and four takes on 01 without the plain white screen
const PHOTOS = ["01-narrative", "02-strategy", "03-equity", "04-debt", "05-mna", "06-fund"].map((n) => "img/" + n + ".jpg")
const ONE = [
  ["slide-1", "Slide 1"],
  ["slide-2", "Slide 2"],
  ["window-1", "Window 1"],
  ["window-2", "Window 2"],
  ["original", "Original"],
]
const SERVICES = [
  ["Investor Narrative & Positioning", "Memo, teaser and deck built as one positioning system, stress-tested against real investor objections.", "narrative"],
  ["Capital Strategy", "Round sizing, valuation anchoring, structure and the closing sequence.", "strategy"],
  ["Equity Raising", "Growth equity, PIPEs and registered directs, through 3,000+ institutional relationships.", "equity"],
  ["Debt Advisory & Placement", "Venture debt, growth lending, unitranche, mezzanine and subordinated debt.", "debt"],
  ["M&A and Project Finance", "Sell-side, buy-side and cross-border mandates, and milestone-based project finance.", "mna"],
  ["Fund Formation & Partnerships", "Emerging managers, LP strategy, fund-to-fund and co-investment partnerships.", "fund"],
]
const param = (k, fallback, allowed) => {
  const v = new URLSearchParams(location.search).get(k)
  return allowed.includes(v) ? v : fallback
}

function Group({ label, options, value, onChange }) {
  return (
    <div className="switch__group" role="group" aria-label={label}>
      <span className="switch__label">{label}</span>
      {options.map(([k, title]) => (
        <button key={k} aria-pressed={value === k} onClick={() => onChange(k)}>{title}</button>
      ))}
    </div>
  )
}

function Page() {
  const [tiles, setTiles] = React.useState(param("tiles", "photos", ["photos", "drawings"]))
  const [one, setOne] = React.useState(param("one", "window-2", ONE.map((o) => o[0])))
  const [frame, setFrame] = React.useState(param("frame", "none", ["concrete", "none"]))
  const services = SERVICES.map(([title, text, drawing], i) => ({
    title, text, drawing,
    photo: i === 0 && one !== "original" ? "img/01-narrative-" + one + ".jpg" : PHOTOS[i],
  }))
  return <>
    <div style={{ height: 120 }} />
    <WhatWeDo style={{ width: "100%" }} art={tiles} frame={frame === "concrete"} services={services} />
    <div style={{ height: "60vh" }} />
    <div className="switch">
      <Group label="Tiles" value={tiles} onChange={setTiles} options={[["photos", "Photos"], ["drawings", "Drawings"]]} />
      {tiles === "photos" ? <>
        <Group label="01" value={one} onChange={setOne} options={ONE} />
        <Group label="Frame" value={frame} onChange={setFrame} options={[["concrete", "Concrete"], ["none", "None"]]} />
      </> : null}
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
    display: flex; flex-wrap: wrap; justify-content: center; gap: 4px 14px; padding: 6px 10px; border-radius: 22px; background: #fff;
    box-shadow: 0 0 0 1px rgba(17,17,17,.08), 0 12px 32px -4px rgba(17,17,17,.14);
    font: 500 13px/1 Montserrat, "Helvetica Neue", Arial, sans-serif; max-width: calc(100vw - 24px); }
  .switch__group { display: flex; align-items: center; gap: 2px; }
  .switch__label { color: #8a8a8a; font-size: 11px; letter-spacing: .08em; text-transform: uppercase; margin-right: 6px; }
  .switch button { font: inherit; border: 0; background: none; color: #3a3a3a; padding: 9px 12px; border-radius: 999px; cursor: pointer; white-space: nowrap; }
  .switch button[aria-pressed="true"] { background: #151515; color: #fff; }
  @media (max-width: 700px) { .switch { font-size: 11px; } .switch button { padding: 8px 8px; } }
</style>
</head>
<body>
<div id="root"></div>
<script src="bundle.js"></script>
</body>
</html>
`)
console.log("built", out)
