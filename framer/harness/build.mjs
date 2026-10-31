// Bundles Arcovia code components into a test page.
//   node build.mjs <out-dir> Header Hero Data ...   (names of framer/code/Arcovia<Name>.tsx, rendered top to bottom)
// The header (if listed) is wrapped in a fixed layer, the way it sits in the Framer layout template.
// Serve <out-dir> with python3 -m http.server and open page.html (add ?canvas=1 for the canvas render).
import { build } from "esbuild"
import fs from "fs"
import path from "path"
const here = path.dirname(new URL(import.meta.url).pathname)
const nm = process.env.HARNESS_NODE_MODULES || path.join(here, "node_modules")
const [out, ...names] = process.argv.slice(2)
fs.mkdirSync(out, { recursive: true })
const code = path.resolve(here, "../code")
const entry = `
import * as React from "react"
import { createRoot } from "react-dom/client"
${names.map((n) => `import C_${n} from ${JSON.stringify(path.join(code, `Arcovia${n}.tsx`))}`).join("\n")}
function Page() {
  return <>
    ${names.map((n) => n === "Header"
      ? `<div style={{ position: "fixed", top: 0, left: 0, right: 0, zIndex: 50 }}><C_Header style={{ width: "100%" }} /></div>`
      : `<C_${n} style={{ width: "100%" }} />`).join("\n    ")}
  </>
}
const root = createRoot(document.getElementById("root"))
root.render(<Page />)
// window.__unmount() unmounts everything, to check that scripts clean up after themselves
;(window as any).__unmount = () => root.unmount()
`
fs.writeFileSync(path.join(out, "entry.tsx"), entry)
await build({
  entryPoints: [path.join(out, "entry.tsx")],
  bundle: true,
  outfile: path.join(out, "bundle.js"),
  format: "iife",
  jsx: "automatic",
  loader: { ".tsx": "tsx", ".ts": "ts" },
  alias: { framer: path.join(here, "framer-stub.js") },
  nodePaths: nm ? [nm] : [],
  define: { "process.env.NODE_ENV": '"development"' },
  logLevel: "warning",
})
fs.writeFileSync(path.join(out, "page.html"), `<!doctype html><html lang="en"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Arcovia Framer components</title>
<style>html,body{margin:0}body{background:#d3d3d3}</style></head>
<body><div id="root"></div><script src="bundle.js"></script></body></html>`)
console.log("built", out)
