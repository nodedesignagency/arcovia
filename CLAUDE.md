# Arcovia website

Website for Arcovia, an independent capital markets advisory (arcovia.io). Client contact: Lilla (marketing). CEO: Colin Pham. We are the design agency.

## How we work

- **Phase 1 is HTML**: fast static drafts in `/site` so we can review and change things quickly.
- **Phase 2 is Framer**, through the Framer MCP, only after the user confirms each page. Never touch Framer until the user says "move to Framer".
- Go section by section. Show each section before moving on. For key sections (hero, what we do, proof) offer 2 versions.
- Before handing anything over, check it in a browser at 1440, 810 and 390 wide and fix overflow, overlaps and broken wraps. Also check at 2x pixel density: the user reviews on a Retina Mac.

## Branches: `main` is approved work only

- **`main`** holds only sections the user has approved. It is what the client will see.
- **Every chat explores on its own branch** (the branch the session gives you). Explore freely there: different sections, different styles.
- **Never push to `main` unless the user explicitly approves a section** in this chat ("approve the hero", "push this to main"). Approval in another chat does not count.
- **To promote an approved section to `main`**:
  1. `git fetch origin main`, then work on a fresh checkout of `main` (a worktree is easiest).
  2. Copy across only that section: its HTML block between `<!-- SECTION:name START -->` and `<!-- SECTION:name END -->`, its `site/sections/name.css`, its `<link>` in the head, and any script it lists in its START marker.
  3. Only bring shared files (`styles.css`, `main.js`, assets) if the approved section needs those changes. Say which shared changes you carried over.
  4. Commit as `Approve <section> (from <branch>)`, push `main`, then tell the user what changed on `main`.
- To pick up newly approved work in an exploration branch, merge `origin/main` into it.

## After every push

End the message with the exact preview command and the commit the user should see:

```bash
cd ~/Desktop/arcovia-preview && ./preview.sh <branch>
```

`preview.sh` fetches, switches to the branch, pulls and opens `site/index.html`. The user's local clone is `~/Desktop/arcovia-preview`. With no branch name it opens `main`.

## Files

- `site/index.html`: one HTML file per page (only Home so far). Sections are wrapped in `SECTION:name START/END` markers.
- `site/styles.css`: **all tokens** (colour, type scale, spacing, radius, shadows, motion) plus shared components: buttons, logo, header, menu, path picker, seam.
- `site/sections/<name>.css`: one stylesheet per section. Asset paths in these files start with `../assets/` (don't use `var(--texture-concrete)` here: its URL resolves relative to the section file and breaks).
- `site/main.js`: small shared JS (header, menu, path picker, office clocks, wordmark fit).
- `site/zoom.js`: the hero → statement zoom-through (pinned scroll stage).
- `site/concrete.js`: WebGL concrete for the hero (carved text and marks, drifting sunlight, cursor light). Built to become a Framer code component.
- `site/assets/`: concrete texture (seamless, 90 KB), traced A-mark SVG (replace with the CM.SUPPLY master when it arrives).
- `site/versions/<name>/`: frozen snapshots the user asked to keep for comparison (e.g. `final-1`). Never edit them and never promote them to `main`; open with `./preview.sh <branch> versions/<name>/index.html`.
- `review/`: screenshots and videos for review. Git-ignored; send them to the user, don't commit them.

Use the same class names everywhere. Reusable parts (nav, footer, buttons, section header, team card, track record row, map) must be built the way Framer will need them.

## Scope (V1)

Six pages plus legal: Home (with the world map), About, What We Do (Founders, Investors and Institutions are sections on this page, not separate pages), Track Record (simple static table, no filters), Team (grid plus one profile template), Contact (one form with a "Who are you?" dropdown: Founder, Investor, Institution, Press, Other; it will post to GoHighLevel, so keep field names clean). Plus Privacy and Terms.

Out of scope: Gatherings, Journal, Press. Never link to them. The brief lists 12 pages; ignore that, V1 is only the six above plus legal. Navigation links only to these pages (Home is the logo); Founders, Investors and Institutions are anchors on What We Do, never nav items.

Map: 8 points (Los Angeles, San Francisco, New York, San Juan, São Paulo, London, Paris, Abu Dhabi). Hover shows the city label. Arcs drawn out from Los Angeles. No filters.

## Design direction

- Feel: Mercury's calm, Stripe Press's editorial typography, Aman's space and restraint. Premium, quiet, confident. Not templated, not text after text: every section needs one idea that makes it worth scrolling to.
- The October pitch deck is the visual source: grey concrete, monochrome, the A-mark debossed into surfaces, white rounded cards floating on concrete, charcoal panels.
- Colours: monochrome only (concrete `#d3d3d3`, charcoal `#565656`, white cards). Body text must reach 4.5:1 contrast on concrete.
- Text uses a deep ink (`#151515` / `#222` / `#3a3a3a`) so it doesn't sink into the concrete. The earlier softer greys are kept as `:root[data-ink="soft"]` (preview with `?ink=soft`) in case the client prefers them.
- Type: Montserrat stands in for Gotham (the client may license Gotham later).
- Breakpoints match Framer: desktop ≥1200, tablet 810–1199, phone ≤809.
- Things the user likes: the masthead header, built like defiant.vc (labels row: Los Angeles, San Juan, one clock that swaps city on hover, "Site map"; then big A-mark, wordmark, one line, and two columns of three link rows: Site map (What We Do, Track Record, Team) and Company (About, Contact, Legal)). Scrolling down folds it into a small bar ("Menu +") and slides it away; scrolling up brings the small bar back with the labels row; the top of the page opens it again. No background colour (only an untinted blur mid-page); type turns light over sections marked `data-header-theme="dark"`. the carved formwork seam with a round tie hole at each end (v2 look: carved into the concrete, not a flat CSS line), the chip as plain text in square brackets, `[ INDEPENDENT CAPITAL MARKETS ADVISORY ]` (`.chip`; drawn bracket shapes looked bad), the carved ARCOVIA wordmark, the one-button path picker.
- Primary button (`.btn--primary`) uses the depth from the user's Framer reference: #292929 with a soft grey top sheen, a 1px 5% ring, a 4px 2% drop shadow, a white 16% inner top highlight and a dark inner bottom rim (tokens `--btn-dark`, `--shadow-btn`).
- Things the user has rejected: free-floating spaced-capitals eyebrow labels (they read as AI-generated), the charcoal logo tile, anything that only looks sharp under the cursor light (carving must look crisp at all times), a CTA button in the nav, seams/lines under the header.
- Hero → statement transition (`site/zoom.js`, after a reference the user sent): scrolling pins the stage; hero text lifts away, the O of the carved ARCOVIA opens into a hole through the concrete, the view flies through it into the statement, then the statement's words light up one by one. "Spreadsheets validate data," stays pale on purpose. The statement is pure white (the user rejected the dark room and the black hole: the hole must read as light). **Final 1** (`site/versions/final-1/`) keeps the clean white hole. The live version burns through instead, like paper catching fire (after a reference the user sent): the zoom starts with the very first scroll while the hero text fades; an ember catches in the O and burns outwards into a ragged hole whose edge glows like the reference: white-hot at the edge, light gold through the band, golden at the fringe, only a faint soot ring (glow must always be brighter than the concrete, never muddy); no star rays or lens flare (the user found them unnatural). `?burn=mono` shows white heat only. 280vh of scroll. The statement rises from below after half the zoom while its text writes itself in letter by letter with a soft fading front (after a px-push reference; the user rejected the diagonal halftone sweep). Statement layout is editorial: large regular type, first line indented three grid columns. The zoom and the hole are rendered inside the WebGL slab (`ConcreteSurface.setView`), never as CSS transforms or masks on the hero: scaling the hero in CSS glitched on scroll-up and blurred the carving.
- **Desktop only until the client approves.** The user reviews desktop (1440, and 1728 at 2x) and does not want tablet or phone work or checks yet; don't spend time on them.

## Copy

- Use the real copy from the client's brief. It is not in this repo, so if you need it and don't have it, ask the user to attach the brief PDF.
- If copy is missing, write a short placeholder and mark it `[COPY NEEDED]`. No lorem ipsum.
- Every number must come from the October deck. No fees, no live deals, no fund marketing.
- Tone: calm, direct, precise, warm. Plain international English. Avoid hype, "elevating", finance-bro language, FOMO and empty superlatives.

## Phase 2 (Framer) rules, only once the user says "move to Framer"

- Work only in the Framer project the user names. Never touch their other Framer projects.
- Order: text and colour styles from the tokens first, then components (nav, footer, buttons, cards), then pages.
- Team profiles go in a CMS collection with one template page. The map and the concrete hero become code components.
- Contact form: build it with the dropdown, and leave the GoHighLevel webhook as the last step (the user will give the URL).
- Tell the user before anything destructive, like deleting pages or overwriting styles.

## Checking pages in the container

Chromium and Playwright are pre-installed. Serve `site/` with `python3 -m http.server`, then launch Chromium with `--use-angle=swiftshader --enable-unsafe-swiftshader --ignore-gpu-blocklist` so WebGL renders headless.
