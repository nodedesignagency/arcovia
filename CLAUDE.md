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
- `site/main.js`: small shared JS (header, menu, path picker, office clocks, wordmark fit, reveal on scroll for anything marked `data-reveal`).
- `site/concrete.js`: WebGL concrete for the hero (carved text and marks, drifting sunlight, cursor light). Built to become a Framer code component.
- `site/stack.js`: the data section's blocks that come down onto a stack as you scroll, each a 3D concrete box (drawn in an axonometric view: top and right end showing, faces flat so text stays crisp) turning a full circle on its vertical axis before it settles (sticky stage with the heading pinned). The motion is scroll-linked with light smoothing, no timers or bounce: each block owns one stretch of scroll, so blocks always come and go one at a time. Built to become a Framer code component.
- `site/map.js`: the compact world map (Home, "where we are"): a WebGL concrete globe you can turn (drag with a glide, arrow keys, or pick a city in the list), lit from the upper left with a soft shadow, land pressed in as pits drawn exactly in the shader from `land-dots.js`; arcs from Los Angeles and square markers in SVG, HTML labels; offices always labelled, other cities on hover or focus; far-side cities hide. Falls back to flat dots without WebGL. Built to become a Framer code component.
- `site/assets/`: concrete texture (seamless, 90 KB), cast-concrete texture for the data blocks (`concrete-cast.jpg`, seamless, made with Magnific), land dots for the globe (`land-dots.js`, 35 KB, generated once from Natural Earth 1:50m land), traced A-mark SVG (replace with the CM.SUPPLY master when it arrives).
- `review/`: screenshots and videos for review. Git-ignored; send them to the user, don't commit them.

Use the same class names everywhere. Reusable parts (nav, footer, buttons, section header, team card, track record row, map) must be built the way Framer will need them.

## Scope (V1)

Six pages plus legal: Home (with the world map), About, What We Do (Founders, Investors and Institutions are sections on this page, not separate pages), Track Record (simple static table, no filters), Team (grid plus one profile template), Contact (one form with a "Who are you?" dropdown: Founder, Investor, Institution, Press, Other; it will post to GoHighLevel, so keep field names clean). Plus Privacy and Terms.

Out of scope: Gatherings, Journal, Press. Never link to them.

Map: 8 points (Los Angeles, San Francisco, New York, San Juan, São Paulo, London, Paris, Abu Dhabi). Hover shows the city label. Arcs drawn out from Los Angeles. No filters.

## Design direction

- Feel: Mercury's calm, Stripe Press's editorial typography, Aman's space and restraint. Premium, quiet, confident. Not templated, not text after text: every section needs one idea that makes it worth scrolling to.
- The October pitch deck is the visual source: grey concrete, monochrome, the A-mark debossed into surfaces, white rounded cards floating on concrete, charcoal panels.
- Colours: monochrome only (concrete `#d3d3d3`, charcoal `#565656`, white cards). Body text must reach 4.5:1 contrast on concrete.
- Type: Montserrat stands in for Gotham (the client may license Gotham later).
- Breakpoints match Framer: desktop ≥1200, tablet 810–1199, phone ≤809.
- Things the user likes: the folding masthead header, built like defiant.vc (labels row with office clocks, big A-mark, wordmark, one line, two columns of link rows; folds into a thin bar with "Menu +" on scroll), the carved formwork seam with a round tie hole at each end (v2 look: carved into the concrete, not a flat CSS line), the bracketed chip (`.chip`, set in plain text brackets: `[ LABEL ]`), the carved ARCOVIA wordmark, the one-button path picker.
- Things the user has rejected: free-floating spaced-capitals eyebrow labels (they read as AI-generated), the charcoal logo tile, anything that only looks sharp under the cursor light (carving must look crisp at all times), a CTA button in the nav, seams/lines under the header.
- While exploring, the user reviews desktop (1440 and 1728 at 2x) first; tablet and phone get refined once a desktop direction is approved.

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
