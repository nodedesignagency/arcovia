// Bundles Framer's compiled ArcoviaContact module as it is: ArcoviaBase from the local copy, "framer" from a stub.
import * as esbuild from "esbuild";
import path from "node:path";
const here = path.dirname(new URL(import.meta.url).pathname);
await esbuild.build({
  entryPoints: [path.join(here, "entry.jsx")], bundle: true, format: "esm", outfile: path.join(here, "www/bundle.js"),
  jsx: "automatic", define: { "process.env.NODE_ENV": '"production"' }, logLevel: "warning",
  plugins: [{ name: "local-modules", setup(b) {
    b.onResolve({ filter: /^https:\/\/framerusercontent\.com\/modules\/.*\/ArcoviaBase\.js$/ }, () => ({ path: path.join(here, "mod/ArcoviaBase.js") }));
    b.onResolve({ filter: /^framer$/ }, () => ({ path: path.join(here, "framer-stub.js") }));
  } }],
});
console.log("built www/bundle.js");
