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
- `site/stack.js`: the data section (Home block 3, "A record to build on"): four 3D concrete blocks on white come down onto a stack as you scroll, each turning a full circle on its vertical axis before it settles (sticky stage with the heading pinned; axonometric view, top and right end showing, faces flat so text stays crisp). Scroll-linked with light smoothing, no timers or bounce: each block owns one stretch of scroll, so blocks always come and go one at a time. Built to become a Framer code component.
- `site/team.js`: the team section's sideways row (pinned stage; cards slide to the front and their windows open). Built to become a Framer code component.
- `site/assets/`: concrete texture (seamless, 90 KB); cast-concrete texture for the data blocks and the team cards (`concrete-cast.jpg`, seamless, made with Magnific); `logo/` holds the client's official logo SVGs (brandmark, wordmark, lockup, parts; white fills as delivered). The sprite in `index.html` inlines the brandmark (`#a-mark`, viewBox 0 0 72 57) and wordmark (`#wordmark`, 0 0 72 11) with `currentColor`; `a-mark.svg` is the favicon. `team/` holds the founders' photos and `portrait-placeholder.svg`, which stands in for the rest of the team (it has colour so the hover can be seen). Use these, never a typeset "ARCOVIA", for the logo.
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
- "Choose your path" button icon: up-down chevrons (the "pick one of several" selector icon), never a directional arrow (the user found an up arrow at rest poor UX); when open, each chevron turns over and they meet as a small ×.
- Path picker menu: flat white (the user chose it over glass; glass is removed), after the user's reference: a hairline border and a soft, wide, very light shadow (`--shadow-menu`), "WHO ARE YOU?" in small capitals, a hairline under the title, rows with the icon on its own (no tile, 30px; the client asked for it bigger and more in focus), title (18px) and one line (14px), a chevron on every row; the menu is exactly as wide as the hero's right-hand column (`--picker-w`). Icons are the user's own duotone SVGs (`site/assets/icons/path-*.svg`, inlined in the sprite with `currentColor`): bar chart (raising capital), hand with cash (investor), vault (institution). Keep icons; `?icons=none` still previews without them.
- Masthead sizes after client feedback ("nav a bit small"): links and "Menu +" 18px (`--fs-masthead`), 40px rows, labels 12px, clock 13px, the one line 16px, official brandmark 116px wide, wordmark 16px tall.
- Primary button (`.btn--primary`) uses the depth from the user's Framer reference: #292929 with a soft grey top sheen, a 1px 5% ring, a 4px 2% drop shadow, a white 16% inner top highlight and a dark inner bottom rim (tokens `--btn-dark`, `--shadow-btn`).
- Things the user has rejected: free-floating spaced-capitals eyebrow labels (they read as AI-generated), the charcoal logo tile, anything that only looks sharp under the cursor light (carving must look crisp at all times), a CTA button in the nav, seams/lines under the header.
- Hero → statement transition (`site/zoom.js`, after a reference the user sent): scrolling pins the stage; hero text lifts away, the O of the carved ARCOVIA opens into a hole through the concrete, the view flies through it into the statement, then the statement's words light up one by one. "Spreadsheets validate data," stays pale on purpose. The statement is pure white (the user rejected the dark room and the black hole: the hole must read as light). **Final 1** (`site/versions/final-1/`) keeps the clean white hole. The live version burns through instead, like paper catching fire (after a reference the user sent): the zoom starts with the very first scroll while the hero text fades; an ember catches in the O and burns outwards into a ragged hole whose edge glows like the reference: white-hot at the edge, light gold through the band, golden at the fringe, only a faint soot ring (glow must always be brighter than the concrete, never muddy); no star rays or lens flare (the user found them unnatural). `?burn=mono` shows white heat only. 280vh of scroll. The statement rises from below after half the zoom while its text writes itself in letter by letter with a soft fading front (after a px-push reference; the user rejected the diagonal halftone sweep). Statement layout is editorial: large regular type across the full 12-column grid (right margin matches the left), first line indented three grid columns; the font size is a share of the grid width so lines break identically at every desktop width. The user called this version "a winner"; it is saved as **Final 2** (`site/versions/final-2/`, the golden burn). **Final 3** (the live `site/`) keeps everything from Final 2 but swaps the burn for drilling (the user found the crack-and-shatter version read like paper tearing; it is still available with `?fx=break`): a drill bores into the O's counter, starting as a small drill point at the centre and widening until it fills the O while it deepens (the user disliked the whole counter changing at once). The bore is drawn in true perspective in the WebGL slab (`drill` in `ConcreteSurface.setView`): the camera moves at a steady pace in depth (cam 1 → 0 at the face → -K out through the back), so the rim rushes past and the walls (concrete, darker deeper in, faint score rings, dust turning inside) stream by; the floor deepens, light breaks through it, and the light at the end of the bore opens onto the statement. Chips of concrete and dust fly out of the bore on a 2D canvas (`.hero__debris`), all driven by scroll so it reverses. Use direction vectors, not atan angles, for anything mapped around the bore (angles leave a seam). The zoom and the hole are rendered inside the WebGL slab (`ConcreteSurface.setView`), never as CSS transforms or masks on the hero: scaling the hero in CSS glitched on scroll-up and blurred the carving.
- Team section (Home block 4, after the data section; `site/sections/team.css`, `site/team.js`), after a reference the user sent: heading on the card column, names with dots down the left, and a row of portrait cards that moves sideways as you scroll down (pinned stage, one stretch of scroll per person, each resting at the front for a moment). Each card (`.team-card`) is a cast-concrete slab with a window cut into it showing the portrait; as a card slides to the front it covers the one before (which sinks back into shade) and its window opens until only a thin concrete frame (`--frame`, 6px) is left round the photo (the user wants that frame, not full bleed), while the name fades out, turns white and fades back in. Portraits are black and white and turn to colour on hover (the user asked for this: the one exception to monochrome). LinkedIn is a rounded square (after the user's reference): a dark tile on the concrete, dark glass over the photo. The names copy the user's timeline reference closely (the user rejected a looser take that bent the line out and shifted names): group names (semibold, ink) on an outer line, people one step in, the line S-curving between the two; the selected person (name under the cursor, else the person at the front) gets a soft grey pill across the column, an ink dot with a glow and the line leading into it in ink (the reference is pink; the user wants it monochrome). The last row, "See other members", sits back on the outer line and brings the last card forward. Clicking a name brings that card forward. The last stop in the row (it comes to the front like a person) is a black card (`#121212`, no shadow) leading to the Team page, built on the user's own sketch (they rejected, in turn: a gathering-faces ring with a "+", a light grey card, a concrete tile, a ring of tiles round the count, and a tile collage): a big team count top left with "Team members" under it, "View all team members" underlined at the bottom (the line slides away and draws back on hover), and on the right two columns of square photos drifting past each other in a slow vertical marquee (one up, one down; after an ad-gallery reference the user sent, with two columns instead of three). The marquee is masked: eased fades at the top and bottom and towards the text on the left, so the photos never run into the text (straight-line fades read as no fade on bright photos). Each column holds five photos twice, so the loop has no seam; each set must stay taller than the card. It builds in once the card is in view beside the last person (the columns rise in, the count runs up, then they start to move) and clears when you scroll away; reduced motion holds the columns still. Photos are black and white, colour on hover. Sentence case, not the sketch's capitals (spaced capitals were rejected before). The count "12" is a placeholder from the sketch, not from the deck: [COPY NEEDED]. Real so far: Colin Pham (Founder & CEO) and Caroline Farah Lembck (Co-Founder & Managing Principal, Capital Markets), in a "Founders" group, with photos the user sent (`assets/team/`, Caroline cropped round her from a stage shot). Their bios from the user (for the profile pages): Colin: sets Arcovia's direction, capital and investor strategy, leads the firm's major relationships and mandates; led $330M+ in capital raised across 24 transactions, architect of the GENESIS outreach system; founded a media company generating 600M+ organic views for Google, Microsoft, PepsiCo and Mercedes-Benz. Caroline: CEO of LemVega Capital ($1B AUM) across hedge funds, VC, PE and real estate; began her career at Genmab ($40B global biotech) in business development; building LemVega International Bank, equity partner at Solid Rep IP. The other two people in the row, their group name ("Senior advisors" for now), the team count and the wider team's photos for the last card (eight placeholders for now) and all LinkedIn URLs are [COPY NEEDED].
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
