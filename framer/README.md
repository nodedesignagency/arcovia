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
- `code/ArcoviaWhatWeDo.tsx`: "What we do" as a pinned scroll after the Harmon
  Digital "How It Works" section the user sent (no text animation on the headline:
  the user does not use Harmon's two-bar wipe). On Home in Framer, after Data.
  Tablet and phone follow the user's "Our approach" reference instead of the pin:
  number top left with the tile on the right, then title and line; 2 columns / 1.
  Review it locally with `./preview.sh <branch> previews/what-we-do/index.html`
  (built by `node framer/harness/preview-what-we-do.mjs`; rebuild after every change).
  Tile photos: the user chose silhouettes, generated in Magnific (Nano Banana 2.1),
  one scene per service, in `site/previews/what-we-do/img/`: presenting to
  investors, a diagram on the window, a corridor of meeting rooms, a staircase
  through stacked floors, a handshake with cranes outside, partners at a window.
  Same building, backlight and grain throughout. The user disliked the plain white
  screen in 01: `01-narrative-slide-1|2` (a soft out-of-focus slide) and
  `-window-1|2` (a window instead) are the options. "Photo frame" switches the
  concrete window around the photo off (photo fills the tile).
  Final (user's choice, live in Framer): 01 window-2, 02-06 as in the folder, no
  frame. The six are uploaded to the Framer project (`PHOTOS` in the component) and
  are the component's defaults; a service's own Photo control overrides its photo.
- `code/ArcoviaSelectedWork.tsx`: "Selected work" (approved on main; on Home in Framer
  right after Data, before What we do). Ported from `books.js` and
  `sections/selected-work.css`: the words part 600px and fade (the Mahadeva "Before vs
  After"), three book spines rise, a little more scroll turns the books to face the
  front (timed turn), hover opens a cover on its hinge. Controls: the two words, three
  books (figure, title, line, link, binding: concrete / charcoal linen / white paper),
  the link label and URL, and Covers: Straight (default) or Angled. Fully responsive:
  the sequence runs from 810px up (a swipeable shelf on portrait tablets); phones get the
  heading over a column of books, no motion (see CLAUDE.md). Its CSS is generated from `site/sections/selected-work.css` (asset
  URLs swapped, every `vw` to `cqw`, width `@media` queries (ranges too) to `@container arc`, the pinned
  stage's top padding as in the other pinned sections); regenerate rather than edit it
  by hand. Framer's type check reports "Cannot find module './ArcoviaBase.tsx'" on this
  file as on every Arcovia file: a false positive (without the extension the module does
  not resolve at all). The six book faces
  (generated with Magnific) are uploaded to the project; their URLs are in the
  component's CSS. Width rules answer to the component (`cqw`, `@container arc`); the
  book height follows the window only while pinned. Needs `#deboss-light` and
  `#deboss-dark` in the base sprite: they were added to the live `ArcoviaBase.tsx`
  (same markup as the sprite in `site/index.html` on main).
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

## Unapproved work in Framer

Branching is not included in this Framer project's plan (`createBranch` fails), so
edits land on Framer's main. Put sections the user has not approved on a **draft
page** (`draft: true`, layout template "Site"): drafts never publish and can be
previewed in Framer. Move a section onto Home only once the user approves it.

## Live files are the source for the base

The copies of `ArcoviaBase.tsx` and the other components on the Framer-phase branches
are older than the live files in Framer (sectors, CTA and footer were added in Framer
directly). Before editing a shared file, read the live one from Framer
(`api.files.read`), never upload an older copy over it. This branch keeps only the
Selected work component; to run the harness, put the live `ArcoviaBase.tsx` next to it.
