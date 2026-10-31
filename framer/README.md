# Arcovia in Framer (Phase 2)

The Framer project: https://framer.com/projects/Arcovia--RFEDuRP4Fh8vSw2PNagp-1JOC5

The approved sections on `main` (`site/`) are the source of truth. Their scripted
parts become Framer code components; the files here are exactly what goes into
Framer, so changes are made here first, checked in the harness, then uploaded.

## Files

- `code/ArcoviaBase.tsx`: tokens, scoped resets, shared parts (chip, buttons, logo,
  seam), Montserrat, the icon sprite, asset URLs and the script lifecycle helpers.
  Generated from `site/styles.css` (tokens + base + shared components).
- `code/ArcoviaHeader.tsx`: masthead, full-screen menu, office clock. Sits in the
  layout template as a fixed layer.
- `code/Arcovia<Section>.tsx`: one per approved Home section.
- `harness/`: bundles the components into a plain page with a stand-in `framer`
  module, for checking in Chromium next to the HTML original.

## Conventions for every component

- Root: `<div className="arc arc-<name>" ref={ref} style={props.style}>`, then
  `{baseStyle()}`, `{cssTag("<name>", CSS)}` (the section's own CSS from
  `site/sections/<name>.css`, unchanged apart from asset URLs), `{sprite()}` if it
  uses `<use href="#…">` icons, then the section markup as JSX with the same class
  names as the HTML.
- Copy and images are property controls whose defaults are the current copy, so the
  text stays editable in Framer. `[COPY NEEDED]` notes stay as comments.
- Behaviour: the section's script, ported into `init(root, life)` and started with
  `useArcoviaScript(ref, init)`. It queries only inside `root`; every listener,
  frame, timer and observer goes through `life` so unmounting stops it all. It never
  runs on the Framer canvas (`isStaticRender()`), so the canvas shows the settled,
  static layout.
- Imports: only `react`, `react-dom`, `framer`, `framer-motion` and sibling files
  (`./ArcoviaBase.tsx`).
- Assets: `ASSETS` in the base (images uploaded to the Framer project).
- Desktop first: the user reviews at 1440, and 1728 at 2x.
