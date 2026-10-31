/**
 * Arcovia: team section (Home, block 4), after a reference the user sent.
 *
 * A heading on the card column, the names down the left and a row of portrait
 * cards that moves sideways as you scroll down: the section pins (sticky stage)
 * for one stretch of scroll per card. Each card is a cast-concrete slab with a
 * window cut into it showing the portrait; as a card slides to the front it
 * covers the one before (which sinks back into shade) and its window opens until
 * only a thin concrete frame is left. Portraits are black and white and turn to
 * colour on hover. The names hang on one line in groups (after a timeline
 * reference): group names on the outer line, people one step in, the line
 * S-curving between them; the person under the cursor, else the one at the
 * front, gets a pill, an ink dot with a glow and the line into it in ink.
 * Clicking a name scrolls the page to that card. The last stop is a black card
 * leading on to the Team page: the team count, and square photos drifting in
 * two columns (it builds in once it is in view beside the last person).
 * Every frame comes from the scroll position alone, so scrolling back up plays
 * it in reverse. Desktop only (>=1200px) and not with reduced motion: there the
 * row simply scrolls sideways, which is also what the Framer canvas shows.
 *
 * Place it full width in the page stack. Its parents must not clip content
 * (overflow hidden stops the sticky stage from pinning).
 * Ported from site/team.js and site/sections/team.css on main.
 */
import * as React from "react"
import { addPropertyControls, ControlType } from "framer"
import { ASSETS, baseStyle, cssTag, sprite, useArcoviaScript, type Life } from "./ArcoviaBase.tsx"

const TEAM_CSS = `/* ==========================================================================
   SECTION: team — Home, the people
   After a reference the user sent: a heading, the names down the left and a
   row of portrait cards that moves sideways as you scroll down.
   Each card (component: team-card) is a slab of cast concrete with a window
   cut into it, showing the portrait. In team.js the section pins; each card
   slides in from the right and comes to rest at the front, on top of the
   one before, while its window opens until only a thin concrete frame is
   left around the portrait.
   team.js drives four numbers on each .team__item:
     --a  how far the window has opened (0 a window in the slab, 1 open to the frame)
     --t  the text's colour: ink on concrete (0) or white on the photo (1)
     --o  the text's opacity: it fades out while the window's edge passes
          under it, switches colour, and fades back in
     --d  how far the card has been covered by the next one (it sinks back)
   The last card in the row (team-more) is black and leads on to the Team
   page: the team count, and square photos drifting in two columns.
   Without JS, below desktop or with reduced motion the row scrolls sideways
   on its own and every card keeps its window.
   Portraits are black and white and turn to colour on hover (the user's call:
   the only colour on the site).
   The names on the left hang on one line in groups, after a timeline
   reference the user sent (see the names block below).
   Uses shared tokens and the chip from styles.css.
   ========================================================================== */

.team {
  --team-pale: #8a8a8a;         /* heading's second line: 3.4:1 on white, for large text only */
  --team-name: #767676;         /* names not at the front: 4.5:1 on white */
  --card-gap: 12px;
  /* window cut into the slab, as a share of the card (from the reference) */
  --win-x: 17.5%;
  --win-y: 19%;
  /* concrete left around the portrait once the window is fully open */
  --frame: 6px;
  position: relative;
  padding-block: var(--space-10);
  /* The white room carries on from the statement */
  background: var(--color-white);
}

/* Heading on the card column; the names under it, to the left of the cards */
.team__inner {
  display: grid;
  grid-template-columns: repeat(12, minmax(0, 1fr));
  column-gap: var(--grid-gap);
  align-items: start;
}

.team__head {
  grid-column: 4 / -1;
  display: grid;
  justify-items: start;
  gap: var(--space-5);
  margin-bottom: var(--space-8);
}
.team__title {
  max-width: 18em;
  font-size: var(--fs-h2);
  font-weight: var(--weight-medium);
  line-height: var(--lh-h2);
  letter-spacing: var(--ls-h2);
  color: var(--color-ink);
  text-wrap: balance;
}
.team__title-pale { display: block; color: var(--team-pale); }

/* ---------- Names: groups on one line, after the user's timeline reference ----------
   Group names sit on the outer line and people one step in; the line curves
   between the two. One person is selected: the one under the cursor (or
   keyboard focus), else the one at the front of the row. They get a soft pill
   behind their row, their dot in the accent with a glow, and the stretch of
   line leading into it in the accent. team.js draws the line and dots in
   .team__line and moves the pill and the glow; dots and lines fade over. */
.team__names {
  --row: 40px;
  --accent: var(--color-ink); /* the reference uses pink; the site stays monochrome */
  grid-column: 1 / span 3;
  grid-row: 2;
  position: relative;
  margin-top: -10px;          /* first row's text lines up with the top of the cards */
}

.team__group-name {
  display: flex;
  align-items: center;
  height: var(--row);
  padding-left: 22px;
  font-size: var(--fs-nav);
  font-weight: var(--weight-semibold);
  color: var(--color-ink);
}
.team__name {
  position: relative;
  display: flex;
  align-items: center;
  width: 100%;
  height: var(--row);
  padding: 0 12px 0 42px;
  font-size: var(--fs-nav);
  font-weight: var(--weight-book);
  color: var(--team-name);
  text-align: left;
  white-space: nowrap;
  transition: color var(--dur-base) var(--ease-out);
}
.team__name.is-selected { color: var(--color-text); }
/* The last stop, "See other members", sits back on the outer line */
.team__name--more { padding-left: 22px; }
.team__name:focus-visible { outline-offset: -2px; border-radius: 10px; }

.team__pill {
  position: absolute;
  top: 0;
  left: -12px;
  right: 0;
  height: calc(var(--row) - 6px);
  border-radius: 10px;
  background: #efefef;
  opacity: 0;
  pointer-events: none;
  transition: transform 380ms var(--ease-out), opacity var(--dur-base) var(--ease-out);
}
.team__names.is-drawn .team__pill { opacity: 1; }

.team__line {
  position: absolute;
  top: 0;
  left: 0;
  width: 32px;
  height: 100%;
  overflow: visible;
  pointer-events: none;
}
.team__line .rail { fill: none; stroke: #d9d9d9; stroke-width: 1.25; }
.team__line .lead { fill: none; stroke-width: 1.5; stroke-linecap: round; opacity: 0; transition: opacity 380ms var(--ease-out); }
.team__line .lead.is-on { opacity: 1; }
.team__line stop { stop-color: var(--accent); }
.team__line .dot { fill: #c2c2c2; transition: fill 380ms var(--ease-out); }
.team__line .dot.is-on { fill: var(--accent); }
.team__line .glow { fill: var(--accent); opacity: 0.14; transition: transform 380ms var(--ease-out); }

/* Without team.js: plain dots */
.team__names:not(.is-drawn) .team__name::before {
  content: "";
  position: absolute;
  left: 21px;
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: #c2c2c2;
}

/* ---------- The row of cards ---------- */
.team__viewport {
  grid-column: 4 / -1;
  grid-row: 2;
  /* card sizes come from this box's width: 4 of its 9 grid columns */
  container-type: inline-size;
  /* No JS: a row that scrolls sideways; room underneath for the shadows */
  overflow-x: auto;
  scroll-snap-type: x mandatory;
  scrollbar-width: none;
  padding-bottom: var(--space-7);
  margin-bottom: calc(var(--space-7) * -1);
}
.team__viewport::-webkit-scrollbar { display: none; }

.team__track {
  --card-w: calc((100cqw - 8 * var(--grid-gap)) / 9 * 4 + 3 * var(--grid-gap));
  --card-h: min(calc(var(--card-w) * 1.18), calc(100vh - 380px));
  display: flex;
  gap: var(--card-gap);
}
.team__item {
  --a: 0;
  --t: 0;
  --o: 1;
  --d: 0;
  flex: none;
  scroll-snap-align: start;
  transform-origin: 50% 60%;
  will-change: transform;
}

/* ---------- Component: team-card ---------- */
.team-card {
  position: relative;
  isolation: isolate;
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
  width: var(--card-w);
  height: max(var(--card-h), 420px);
  padding: 24px 24px 26px 26px;
  overflow: hidden;
  /* cast concrete, the same as the data and service blocks; each card shows another patch */
  background-color: #bdbdbd;
  background-image:
    linear-gradient(172deg, rgba(255, 255, 255, 0.16), rgba(255, 255, 255, 0) 40%, rgba(0, 0, 0, 0.04)),
    url("${ASSETS.concreteCast}");
  background-size: auto, 960px;
  background-position: 0 0, calc(var(--i, 0) * -271px - 120px) calc(var(--i, 0) * -413px - 60px);
  box-shadow:
    inset 1px 0 0 rgba(255, 255, 255, 0.2),
    inset 0 -1px 0 rgba(0, 0, 0, 0.16),
    0 2px 4px -2px rgba(0, 0, 0, 0.16),
    0 24px 48px -24px rgba(0, 0, 0, 0.42);
}

/* The portrait, seen through the window. The photo always covers the whole card,
   so opening the window only reveals more of it; it settles from a slight zoom. */
.team-card__media {
  position: absolute;
  inset: 0;
  z-index: -1;
  overflow: hidden;
  background: #6f6f6f;
  clip-path: inset(
    calc(var(--win-y) * (1 - var(--a)) + var(--frame) * var(--a))
    calc(var(--win-x) * (1 - var(--a)) + var(--frame) * var(--a))
  );
}
.team-card__photo {
  width: 100%;
  height: 100%;
  object-fit: cover;
  object-position: 50% 30%;
  filter: grayscale(1) contrast(1.04);
  transform: scale(calc(1.08 - 0.08 * var(--a)));
  transform-origin: 50% 40%;
  transition: filter 700ms var(--ease-out);
}
/* Colour comes up under the cursor (or keyboard focus) */
.team-card:has(.team-card__link:focus-visible) .team-card__photo { filter: grayscale(0) contrast(1); }
@media (hover: hover) {
  .team-card:hover .team-card__photo { filter: grayscale(0) contrast(1); }
}
/* Shade along the bottom so white type reads on any photo */
.team-card__media::after {
  content: "";
  position: absolute;
  inset: 0;
  background: linear-gradient(to top, rgba(0, 0, 0, 0.7), rgba(0, 0, 0, 0.32) 26%, rgba(0, 0, 0, 0.1) 42%, rgba(0, 0, 0, 0) 58%);
  opacity: var(--a);
}

/* The window's edge, cut into the slab: shadow on the upper and left walls,
   light on the lower lip. It stays (a little softer) around the open frame. */
.team-card__rim {
  position: absolute;
  inset:
    calc(var(--win-y) * (1 - var(--a)) + var(--frame) * var(--a))
    calc(var(--win-x) * (1 - var(--a)) + var(--frame) * var(--a));
  z-index: -1;
  pointer-events: none;
  box-shadow:
    inset 0 0 0 1px rgba(0, 0, 0, 0.22),
    inset 3px 4px 7px rgba(0, 0, 0, 0.42),
    0 1px 0 rgba(255, 255, 255, 0.42),
    1px 0 0 rgba(255, 255, 255, 0.2);
  opacity: calc(1 - 0.35 * var(--a));
}

/* Covered by the next card: it sinks back into shade */
.team-card::after {
  content: "";
  position: absolute;
  inset: 0;
  z-index: 3;
  background: #000;
  opacity: calc(var(--d) * 0.32);
  pointer-events: none;
}

/* Name and title: ink on the concrete, white once the portrait fills the card */
.team-card__body {
  display: grid;
  gap: 2px;
  padding-right: 60px;      /* clear of the LinkedIn button */
  opacity: var(--o);
}
.team-card__name {
  font-size: 18px;
  font-weight: var(--weight-medium);
  line-height: 1.35;
  letter-spacing: -0.005em;
  color: color-mix(in srgb, var(--color-white) calc(var(--t) * 100%), var(--color-ink));
}
.team-card__role {
  font-size: 15px;
  line-height: 1.4;
  color: color-mix(in srgb, rgba(255, 255, 255, 0.8) calc(var(--t) * 100%), var(--color-text-muted));
}
/* The whole card opens the profile; the LinkedIn button sits above that link */
.team-card__link::after {
  content: "";
  position: absolute;
  inset: 0;
  z-index: 1;
}
.team-card__link:focus-visible { outline: none; }
.team-card:has(.team-card__link:focus-visible) { outline: 2px solid var(--color-ink); outline-offset: 4px; }

/* LinkedIn: a small rounded square, after a reference the user sent. On the
   concrete it is a dark tile like the primary button; over the photo it turns
   to dark glass with a fine light edge. It switches (--t) while it is faded
   out with the text (--o). */
.team-card__social {
  position: absolute;
  right: 22px;
  bottom: 22px;
  z-index: 2;
  display: grid;
  place-items: center;
  width: 42px;
  height: 42px;
  border-radius: 11px;
  color: var(--color-on-dark);
  background-color: color-mix(in srgb, rgba(255, 255, 255, 0.08) calc(var(--t) * 100%), var(--btn-dark));
  box-shadow:
    inset 0 0 0 1px color-mix(in srgb, rgba(255, 255, 255, 0.14) calc(var(--t) * 100%), rgba(255, 255, 255, 0.06)),
    inset 0 1px 0 rgba(255, 255, 255, 0.1),
    0 1px 2px rgba(0, 0, 0, calc(0.2 - 0.2 * var(--t)));
  -webkit-backdrop-filter: blur(12px);
  backdrop-filter: blur(12px);
  opacity: var(--o);
  transition: background-color var(--dur-fast) var(--ease-out), transform var(--dur-fast) var(--ease-out);
}
.team-card__social svg { width: 20px; height: 20px; fill: currentColor; }
.team-card__social:active { transform: scale(0.95); }
@media (hover: hover) {
  .team-card__social:hover { background-color: color-mix(in srgb, rgba(255, 255, 255, 0.16) calc(var(--t) * 100%), #3b3b3b); }
}

/* ---------- Last card: on to the Team page ----------
   Black, no shadow. Built on the user's sketch: a big team count top left
   with "Team members" under it, "View all team members" at the bottom, and
   on the right two columns of square photos drifting past each other in a
   slow vertical marquee (one up, one down; after a reference the user
   sent). The marquee fades out at the top, the bottom and towards the
   text, so the photos never run into it. It builds in once the card is in
   view beside the last person (.is-in, team.js): the columns rise in, the
   count runs up, and only then do the columns start to move. Without
   team.js everything is simply there and moving. Photos are black and
   white, colour on hover. The underline redraws on hover. */
.team-more {
  position: relative;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  align-items: flex-start;
  width: var(--card-w);
  height: max(var(--card-h), 420px);
  padding: 26px 26px 28px;
  overflow: hidden;
  color: var(--color-on-dark);
  background: #121212;
}
.team-more:focus-visible { outline-offset: 4px; }

.team-more__count {
  position: relative;
  z-index: 2;
  font-size: calc(var(--card-w) * 0.22);
  font-weight: var(--weight-medium);
  line-height: 1;
  letter-spacing: -0.035em;
  transition: opacity 500ms var(--ease-out);
}
.team-more__what {
  display: block;
  margin-top: 12px;
  font-size: calc(var(--card-w) * 0.052);
  font-weight: var(--weight-book);
  letter-spacing: -0.01em;
}

/* The marquee: two columns on the right, masked soft at the top, the bottom
   and its left edge (towards the text) */
.team-more__marquee {
  --sq: calc(var(--card-w) * 0.26);
  --gap: 10px;
  position: absolute;
  top: 0;
  bottom: 0;
  right: 12px;
  display: flex;
  gap: var(--gap);
  /* Eased fades: a straight ramp reads as no fade at all on bright photos */
  -webkit-mask-image:
    linear-gradient(to bottom, transparent, rgba(0, 0, 0, 0.25) 10%, #000 30%, #000 70%, rgba(0, 0, 0, 0.25) 90%, transparent),
    linear-gradient(to right, transparent, rgba(0, 0, 0, 0.1) 14%, rgba(0, 0, 0, 0.55) 28%, #000 42%);
  -webkit-mask-composite: source-in;
  mask-image:
    linear-gradient(to bottom, transparent, rgba(0, 0, 0, 0.25) 10%, #000 30%, #000 70%, rgba(0, 0, 0, 0.25) 90%, transparent),
    linear-gradient(to right, transparent, rgba(0, 0, 0, 0.1) 14%, rgba(0, 0, 0, 0.55) 28%, #000 42%);
  mask-composite: intersect;
}
.team-more__col {
  width: var(--sq);
  transition: opacity 600ms var(--ease-out), transform 800ms var(--ease-out);
}
.team-more__col--down { transition-delay: 120ms; }
/* Each track holds its photos twice; moving it by half loops without a seam */
.team-more__track {
  display: flex;
  flex-direction: column;
  animation: team-drift-up 28s linear infinite;
}
.team-more__col--down .team-more__track { animation-name: team-drift-down; animation-duration: 32s; }
@keyframes team-drift-up { from { transform: translateY(0); } to { transform: translateY(-50%); } }
@keyframes team-drift-down { from { transform: translateY(-50%); } to { transform: translateY(0); } }

.team-more__photo {
  flex: none;
  width: var(--sq);
  height: var(--sq);
  margin-bottom: var(--gap);
  border-radius: 12px;
  overflow: hidden;
  background: #2a2a2a;
}
.team-more__photo img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  object-position: var(--fx, 50%) var(--fy, 40%);
  transform: scale(var(--zoom, 1));
  transform-origin: var(--fx, 50%) var(--fy, 40%);
  filter: grayscale(1) brightness(var(--tone, 1));
  transition: filter 700ms var(--ease-out);
}
.team-more:focus-visible .team-more__photo img { filter: brightness(var(--tone, 1)); }
@media (hover: hover) {
  .team-more:hover .team-more__photo img { filter: brightness(var(--tone, 1)); }
}

/* "View all team members": its underline slides away and draws back in on hover */
.team-more__link {
  position: relative;
  z-index: 2;
  padding-bottom: 5px;
  font-size: 15px;
  font-weight: var(--weight-medium);
  line-height: 1.3;
  white-space: nowrap;
}
.team-more__link::after {
  content: "";
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  height: 1px;
  background: currentColor;
}
@media (hover: hover) {
  .team-more:hover .team-more__link::after { animation: team-redraw 700ms var(--ease-out); }
}
@keyframes team-redraw {
  0% { transform: scaleX(1); transform-origin: right; }
  45% { transform: scaleX(0); transform-origin: right; }
  46% { transform: scaleX(0); transform-origin: left; }
  100% { transform: scaleX(1); transform-origin: left; }
}

/* Build-in (team.js adds .is-in once the card is in view); going out is quick.
   The columns hold still until then. */
.js .team-more:not(.is-in) .team-more__col {
  opacity: 0;
  transform: translateY(28px);
  transition-duration: 240ms;
  transition-delay: 0s;
}
.js .team-more:not(.is-in) .team-more__track { animation-play-state: paused; }
.js .team-more:not(.is-in) .team-more__count { opacity: 0; }
@media (prefers-reduced-motion: reduce) {
  .team-more__track { animation-name: none; }
}

/* ---------- Pinned: the row moves sideways as you scroll (team.js, desktop) ----------
   .team--on is added by team.js; --team-travel is the scroll it pins for. */
.team--on {
  height: calc(100vh + var(--team-travel, 300vh));
  padding-block: 0;
}
.team--on .team__stage {
  position: sticky;
  top: 0;
  height: 100vh;
  display: flex;
  flex-direction: column;
  justify-content: center;
  /* room for the small header bar when it comes back */
  padding: 112px 0 48px;
  overflow: hidden;
}
.team--on .team__viewport {
  overflow: visible;
  padding-bottom: 0;
  margin-bottom: 0;
}

/* ---------- Below desktop (to refine once desktop is approved) ---------- */
@media (max-width: 1199px) {
  .team__head { grid-column: 1 / -1; }
  .team__names { display: none; }
  .team__viewport { grid-column: 1 / -1; }
  .team__track { --card-w: min(420px, 72vw); --card-h: calc(var(--card-w) * 1.18); }
}
`

/** A ControlType.ResponsiveImage value */
interface ImageValue {
    src: string
    srcSet?: string
    alt?: string
}

interface Person {
    name: string
    role: string
    /** Consecutive people with the same group form a group under that name */
    group: string
    photo?: ImageValue
    link: string
    linkedIn: string
}

interface Props {
    chip: string
    title: string
    titlePale: string
    people: Person[]
    moreLabel: string
    count: number
    countLabel: string
    allLabel: string
    allLink: string
    photosUp: ImageValue[]
    photosDown: ImageValue[]
    style?: React.CSSProperties
}

const DEFAULTS: Props = {
    // [COPY NEEDED] Draft chip, heading and line, to confirm with Lilla
    chip: "Team",
    title: "Leadership",
    titlePale: "Senior people on every mandate",
    // [COPY NEEDED] Names, titles, LinkedIn URLs and photos for the rest of the team, and their
    // group's name. Profile pages (CMS template) [TO BUILD]; LinkedIn URLs [TO CONFIRM]
    people: [
        { name: "Colin Pham", role: "Founder & CEO", group: "Founders", link: "/team", linkedIn: "" },
        { name: "Caroline Farah Lembck", role: "Co-Founder & Managing Principal, Capital Markets", group: "Founders", link: "/team", linkedIn: "" },
        // [PHOTO NEEDED] Portrait of Team member 03
        { name: "Team member 03", role: "Title to come", group: "Senior advisors", link: "/team", linkedIn: "" },
        // [PHOTO NEEDED] Portrait of Team member 04
        { name: "Team member 04", role: "Title to come", group: "Senior advisors", link: "/team", linkedIn: "" },
    ],
    moreLabel: "See other members",
    // [COPY NEEDED] The team count: 12 is a placeholder from the user's sketch, not from the deck
    count: 12,
    countLabel: "Team members",
    allLabel: "View all team members",
    allLink: "/team",
    // [PHOTO NEEDED] Photos of the wider team (empty: the current arrangement below)
    photosUp: [],
    photosDown: [],
}

/** Portraits for the people whose photos we have, used while the photo control is empty */
const KNOWN_PHOTOS: Record<string, string> = {
    "Colin Pham": ASSETS.colin,
    "Caroline Farah Lembck": ASSETS.caroline,
}

/** The marquee's current arrangement: five photos per column ([PHOTO NEEDED] for the placeholders) */
const DEFAULT_UP = [ASSETS.colin, ASSETS.portraitPlaceholder, ASSETS.portraitPlaceholder, ASSETS.portraitPlaceholder, ASSETS.portraitPlaceholder]
const DEFAULT_DOWN = [ASSETS.portraitPlaceholder, ASSETS.caroline, ASSETS.portraitPlaceholder, ASSETS.portraitPlaceholder, ASSETS.portraitPlaceholder]

/** Framing per photo (--fx/--fy focus, --zoom, --tone brightness), cycled by position in the column */
const FRAMING_UP: Array<Record<string, string | number>> = [
    { "--fx": "50%", "--fy": "34%" },
    { "--fx": "50%", "--fy": "40%", "--zoom": 1.3, "--tone": 0.94 },
    { "--fx": "46%", "--fy": "38%", "--zoom": 1.5, "--tone": 1.08 },
    { "--fx": "54%", "--fy": "42%", "--zoom": 1.2, "--tone": 0.9 },
    { "--fx": "50%", "--fy": "42%", "--zoom": 1.35, "--tone": 1.14 },
]
const FRAMING_DOWN: Array<Record<string, string | number>> = [
    { "--fx": "50%", "--fy": "40%", "--zoom": 1.4, "--tone": 1.12 },
    { "--fx": "46%", "--fy": "28%", "--zoom": 1.25 },
    { "--fx": "48%", "--fy": "44%", "--zoom": 1.25, "--tone": 0.98 },
    { "--fx": "52%", "--fy": "38%", "--zoom": 1.45, "--tone": 1.04 },
    { "--fx": "47%", "--fy": "40%", "--zoom": 1.3, "--tone": 0.92 },
]

/** Each column's set must stay taller than the card, so it holds at least five photos */
const MIN_PER_COLUMN = 5

/** "/team" and "https://…" pass through; Framer link values pass through too */
const href = (v: string | undefined, fallback = "#") => v || fallback

function photoFor(person: Person) {
    return (person.photo && person.photo.src) || KNOWN_PHOTOS[person.name] || ASSETS.portraitPlaceholder
}

function columnPhotos(images: ImageValue[] | undefined, fallback: string[]) {
    const list = images && images.length ? images.map((img) => (img && img.src) || ASSETS.portraitPlaceholder) : fallback
    const set: string[] = []
    while (set.length < Math.max(MIN_PER_COLUMN, list.length)) set.push(list[set.length % list.length])
    return set
}

/**
 * @framerSupportedLayoutWidth any-prefer-fixed
 * @framerSupportedLayoutHeight auto
 */
export default function ArcoviaTeam(incoming: Partial<Props>) {
    const p = { ...DEFAULTS, ...incoming }
    const people = p.people && p.people.length ? p.people : DEFAULTS.people
    const count = typeof p.count === "number" && isFinite(p.count) ? Math.round(p.count) : DEFAULTS.count
    const up = columnPhotos(p.photosUp, DEFAULT_UP)
    const down = columnPhotos(p.photosDown, DEFAULT_DOWN)
    const ref = React.useRef<HTMLDivElement>(null)

    // Consecutive people with the same group form one group
    const groups: Array<{ name: string; members: Array<{ person: Person; k: number }> }> = []
    people.forEach((person, k) => {
        const name = person.group || ""
        const g = groups[groups.length - 1]
        if (g && g.name === name) g.members.push({ person, k })
        else groups.push({ name, members: [{ person, k }] })
    })

    // Start again when the row's structure changes (the script holds on to the rows and cards)
    const shape = people.length + "|" + groups.map((g) => (g.name ? "g" : "") + g.members.length).join(",") + "|" + count
    useArcoviaScript(ref, (root, life) => initTeam(root, life), [shape])

    // The same photos twice, so the loop has no seam
    const marqueeColumn = (photos: string[], framing: Array<Record<string, string | number>>) =>
        photos.concat(photos).map((src, i) => (
            <span className="team-more__photo" style={framing[(i % photos.length) % framing.length] as React.CSSProperties} key={i}>
                <img src={src} alt="" loading="lazy" />
            </span>
        ))

    return (
        <div className="arc arc-team" ref={ref} style={p.style}>
            {baseStyle()}
            {cssTag("team", TEAM_CSS)}
            {sprite()}
            <section className="team" id="team" data-team="" aria-labelledby="team-title">
                <div className="team__stage">
                    <div className="team__inner container">
                        {/* [COPY NEEDED] Draft chip, heading and line, to confirm with Lilla */}
                        <div className="team__head">
                            <p className="chip">{p.chip}</p>
                            <h2 className="team__title" id="team-title">
                                {p.title} <span className="team__title-pale">{p.titlePale}</span>
                            </h2>
                        </div>

                        {/* Names in groups, on one line (the script draws it) */}
                        <div className="team__names">
                            <span className="team__pill" aria-hidden="true"></span>
                            <svg className="team__line" aria-hidden="true" focusable="false"></svg>
                            <ul className="team__groups" aria-label="People">
                                {groups.map((g, gi) => (
                                    <li className="team__group" key={gi}>
                                        {g.name ? <p className="team__group-name">{g.name}</p> : null}
                                        <ol className="team__names-list">
                                            {g.members.map(({ person, k }) => (
                                                <li key={k}>
                                                    <button className="team__name" type="button" data-team-go={k} aria-current={k === 0 ? "true" : undefined}>
                                                        {person.name}
                                                    </button>
                                                </li>
                                            ))}
                                        </ol>
                                    </li>
                                ))}
                                <li className="team__group">
                                    <button className="team__name team__name--more" type="button" data-team-go={people.length}>
                                        {p.moreLabel}
                                    </button>
                                </li>
                            </ul>
                        </div>

                        <div className="team__viewport">
                            <ul className="team__track" data-team-track="">
                                {people.map((person, k) => (
                                    <li className="team__item" key={k}>
                                        {/* Component: team-card (becomes a CMS-driven Framer component) */}
                                        <article className="team-card" style={{ ["--i" as any]: k }}>
                                            <div className="team-card__media">
                                                <img className="team-card__photo" src={photoFor(person)} alt="" loading="lazy" />
                                            </div>
                                            <span className="team-card__rim" aria-hidden="true"></span>
                                            <div className="team-card__body">
                                                <h3 className="team-card__name">
                                                    <a className="team-card__link" href={href(person.link, "/team")}>{person.name}</a>
                                                </h3>
                                                <p className="team-card__role">{person.role}</p>
                                            </div>
                                            <a
                                                className="team-card__social"
                                                href={href(person.linkedIn)}
                                                target={person.linkedIn ? "_blank" : undefined}
                                                rel={person.linkedIn ? "noopener" : undefined}
                                                aria-label={person.name + " on LinkedIn"}
                                            >
                                                <svg aria-hidden="true"><use href="#icon-linkedin" /></svg>
                                            </a>
                                        </article>
                                    </li>
                                ))}
                                {/* Last in the row: on to the Team page. A black card: a big team count and
                                    "Team members" on the left, and two columns of square photos on the right
                                    drifting past each other (one up, one down), fading out at the top, the bottom
                                    and towards the text so they never run into it. It builds in once the card is
                                    in view beside the last person (script).
                                    [COPY NEEDED] The team count (12 is a placeholder from the user's sketch, not
                                    from the deck) and photos of the wider team */}
                                <li className="team__item team__item--more">
                                    <a className="team-more" href={href(p.allLink, "/team")} aria-label={p.allLabel}>
                                        <span className="team-more__count"><span className="team-more__num" data-count={count}>{count}</span>+<span className="team-more__what">{p.countLabel}</span></span>
                                        <span className="team-more__marquee" aria-hidden="true">
                                            <span className="team-more__col team-more__col--up">
                                                <span className="team-more__track">{marqueeColumn(up, FRAMING_UP)}</span>
                                            </span>
                                            <span className="team-more__col team-more__col--down">
                                                <span className="team-more__track">{marqueeColumn(down, FRAMING_DOWN)}</span>
                                            </span>
                                        </span>
                                        <span className="team-more__link">{p.allLabel}</span>
                                    </a>
                                </li>
                            </ul>
                        </div>
                    </div>
                </div>
            </section>
        </div>
    )
}

/* ---------- Behaviour (team.js) ---------- */
let instances = 0

interface NameNode {
    person: boolean
    x: number
    y: number
    top: number
    lead?: SVGElement
    dot?: SVGElement
}

function initTeam(host: HTMLElement, life: Life) {
    const team = host.querySelector<HTMLElement>("[data-team]")
    if (!team) return
    const stage = team.querySelector<HTMLElement>(".team__stage")
    const viewport = team.querySelector<HTMLElement>(".team__viewport")
    const items = Array.prototype.slice.call(team.querySelectorAll(".team__item")) as HTMLElement[]
    const names = Array.prototype.slice.call(team.querySelectorAll("[data-team-go]")) as HTMLElement[]
    const list = team.querySelector<HTMLElement>(".team__names")
    const line = team.querySelector<SVGSVGElement>(".team__line")
    const pill = team.querySelector<HTMLElement>(".team__pill")
    const n = items.length
    if (!stage || !viewport || n < 2) return

    // The stylesheet holds the last card back until it builds in (".js .team-more:not(.is-in)").
    // On the HTML site .js sat on <html>; here it marks this component while its script runs.
    host.classList.add("js")
    life.add(() => host.classList.remove("js"))

    const PER_CARD = 0.8 // scroll for each card, in viewport heights
    const REST = 0.3 // share of each card's stretch it spends resting at the front
    const SINK = 0.06 // how much a covered card shrinks back
    const desktop = window.matchMedia("(min-width: 1200px)")
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)")

    let on = false
    let step = 0 // one card plus the gap, in px
    let pos = 0 // which card is at the front: 0 … n-1, fractional in between
    let target = 0
    let intro = 0 // the first card's window opens as the section comes up
    let introTarget = 0
    let current = -1 // the person at the front
    let still = 0 // without the pinned row: the card scrolled to
    let hover = -1 // name under the cursor or keyboard focus, -1 for none
    let raf = 0
    let last = 0

    function clamp(v: number, a: number, b: number) {
        return v < a ? a : v > b ? b : v
    }
    function smooth(e0: number, e1: number, x: number) {
        const t = clamp((x - e0) / (e1 - e0), 0, 1)
        return t * t * (3 - 2 * t)
    }

    /* ---------- Scroll → which card is at the front ---------- */
    function read() {
        const vh = window.innerHeight
        const r = team!.getBoundingClientRect()
        const travel = r.height - vh
        const p = travel > 0 ? clamp(-r.top / travel, 0, 1) : 0
        // Between two cards: rest, slide, rest. Each card rests for REST of its stretch.
        const t = p * (n - 1)
        const i = Math.min(Math.floor(t), n - 2)
        const f = t - i
        target = i + smooth(REST / 2, 1 - REST / 2, f)
        // The first window opens over the last 70% of a screen before the stage pins
        introTarget = smooth(0.7 * vh, 0, r.top)
    }

    /* ---------- Draw: every card's place, window and shade ---------- */
    function drawCards() {
        items.forEach((item, k) => {
            const past = clamp(pos - k, 0, 1) // 1 once the next card fully covers it
            const x = -Math.min(pos, k) * step // cards at or past the front stay there
            let a = clamp(1 - (k - pos), 0, 1) // window opens on the way to the front
            if (k === 0) a *= intro
            item.style.transform = "translate3d(" + x.toFixed(2) + "px,0,0) scale(" + (1 - SINK * past).toFixed(4) + ")"
            a = a * a * (3 - 2 * a)
            item.style.setProperty("--a", a.toFixed(4))
            // The text fades out while the window's edge passes under it, turns white, fades back in
            item.style.setProperty("--t", a < 0.5 ? "0" : "1")
            item.style.setProperty("--o", (1 - smooth(0.08, 0.28, a) + smooth(0.72, 0.92, a)).toFixed(4))
            item.style.setProperty("--d", past.toFixed(4))
            // Once the next card fully covers it, fade it out so its shadow doesn't show round
            // the edges of the one on top (it stays focusable)
            const gone = smooth(0.85, 1, past)
            item.style.opacity = gone ? (1 - gone).toFixed(3) : ""
        })
        setFront(Math.round(pos))
        // The last card builds in once it is fully in view, beside the last person
        showMore(pos > n - 2.2)
    }

    /* ---------- Names: groups on one line ---------- */
    const NS = "http://www.w3.org/2000/svg"
    const OUTER = 6
    const INNER = 24 // x of the group names' dots and the people's dots
    const leadId = "team-lead-" + ++instances + "-" // gradient ids, unique per instance on the page
    let people: NameNode[] = [] // per person: where their dot sits, their dot and lead-in
    let glow: SVGElement | null = null
    let selected = -1

    function el(parent: Element, tag: string, attrs: Record<string, string | number>) {
        const e = document.createElementNS(NS, tag)
        for (const a in attrs) e.setAttribute(a, String(attrs[a]))
        return parent.appendChild(e) as SVGElement
    }
    // Straight on, or an S-curve where the line steps between the two columns
    function seg(p: NameNode, q: NameNode) {
        if (p.x === q.x) return "L" + q.x + " " + q.y
        const mid = (p.y + q.y) / 2
        return "C" + p.x + " " + mid + " " + q.x + " " + mid + " " + q.x + " " + q.y
    }

    // Lay the line out from where the rows actually sit (again after fonts load and on resize)
    function layoutNames() {
        if (!line || !list) return
        while (line.firstChild) line.removeChild(line.firstChild)
        const nodes: NameNode[] = Array.prototype.map.call(list.querySelectorAll(".team__group-name, .team__name"), (row: HTMLElement) => {
            const person = row.classList.contains("team__name")
            const inner = person && !row.classList.contains("team__name--more")
            return { person, x: inner ? INNER : OUTER, y: row.offsetTop + row.offsetHeight / 2, top: row.offsetTop }
        }) as NameNode[]
        if (!nodes.length) return
        const defs = el(line, "defs", {})
        let d = "M" + nodes[0].x + " " + nodes[0].y
        for (let i = 1; i < nodes.length; i++) d += seg(nodes[i - 1], nodes[i])
        el(line, "path", { class: "rail", d })

        people = []
        nodes.forEach((node, i) => {
            if (!node.person) return
            const k = people.length
            // (a first group without a name has no row above its first person)
            const prev = nodes[i - 1] || node
            // The stretch of line leading into this person: faint at the row above, full at the dot
            const g = el(defs, "linearGradient", { id: leadId + k, gradientUnits: "userSpaceOnUse", x1: 0, y1: prev.y, x2: 0, y2: node.y })
            el(g, "stop", { offset: "0", "stop-opacity": "0.25" })
            el(g, "stop", { offset: "1", "stop-opacity": "1" })
            node.lead = el(line, "path", { class: "lead", d: "M" + prev.x + " " + prev.y + seg(prev, node), stroke: "url(#" + leadId + k + ")" })
            people.push(node)
        })
        glow = el(line, "circle", { class: "glow", r: "8", cx: "0", cy: "0" })
        nodes.forEach((node) => {
            const dot = el(line, "circle", { class: "dot", cx: node.x, cy: node.y, r: node.x === INNER ? 3.5 : 3.75 })
            if (node.person) node.dot = dot
        })
        list.classList.add("is-drawn")
        const keep = selected
        selected = -1
        select(keep < 0 ? Math.max(current, 0) : keep, true)
    }

    function select(k: number, instant?: boolean) {
        if (!people.length) return
        k = clamp(k, 0, people.length - 1)
        if (k === selected) return
        selected = k
        people.forEach((p, i) => {
            p.lead!.classList.toggle("is-on", i === k)
            p.dot!.classList.toggle("is-on", i === k)
        })
        names.forEach((b, i) => b.classList.toggle("is-selected", i === k))
        const p = people[k]
        const moving = [glow, pill].filter(Boolean) as Array<HTMLElement | SVGElement>
        if (instant) moving.forEach((e) => (e.style.transition = "none"))
        glow!.style.transform = "translate(" + p.x + "px," + p.y + "px)"
        if (pill) pill.style.transform = "translate3d(0," + (p.top + 3) + "px,0)"
        if (instant) {
            // Let the jump land before the transitions come back
            void list!.offsetHeight
            moving.forEach((e) => (e.style.transition = ""))
        }
    }
    // The name under the cursor wins; otherwise the person at the front
    function refreshNames() {
        select(hover >= 0 ? hover : current)
    }

    function setFront(k: number) {
        k = clamp(k, 0, n - 1)
        if (k === current) return
        current = k
        names.forEach((b, i) => {
            if (i === k) b.setAttribute("aria-current", "true")
            else b.removeAttribute("aria-current")
        })
        refreshNames()
    }

    /* ---------- Last card: builds in once it is in view beside the last person ----------
       The photo columns rise in and start to drift (CSS, on .is-in) and the team count
       runs up. Going away it clears quickly, ready to build in again. */
    const moreCard = team.querySelector<HTMLElement>(".team-more")
    const countEl = moreCard && moreCard.querySelector<HTMLElement>("[data-count]")
    const countTo = countEl ? +(countEl.getAttribute("data-count") || 0) : 0
    let shown: boolean | null = null
    let countRaf = 0
    function showMore(v: boolean) {
        v = !!v
        if (!moreCard || v === shown) return
        shown = v
        moreCard.classList.toggle("is-in", v)
        if (!countEl) return
        life.cancelRaf(countRaf)
        if (!v || reduced.matches) {
            countEl.textContent = String(v ? countTo : 0)
            return
        }
        let t0 = 0
        const run = (now: number) => {
            if (!t0) t0 = now
            const u = clamp((now - t0 - 150) / 900, 0, 1)
            countEl.textContent = String(Math.round(countTo * (1 - Math.pow(1 - u, 3))))
            if (u < 1) countRaf = life.raf(run)
        }
        countRaf = life.raf(run)
    }
    // Without the pinned row: build in once the card scrolls into view
    if (moreCard && "IntersectionObserver" in window) {
        life.observe(
            new IntersectionObserver(
                (entries) => {
                    if (!on && !reduced.matches) showMore(entries[0].isIntersecting)
                },
                { threshold: 0.6 }
            )
        ).observe(moreCard)
    }

    /* Light smoothing so the row glides; stops once it has caught up */
    function frame(now: number) {
        const dt = Math.min(64, now - (last || now))
        last = now
        const k = 1 - Math.exp(-dt / 90)
        pos += (target - pos) * k
        intro += (introTarget - intro) * k
        if (Math.abs(target - pos) < 0.0005 && Math.abs(introTarget - intro) < 0.001) {
            pos = target
            intro = introTarget
            raf = 0
            last = 0
        } else {
            raf = life.raf(frame)
        }
        drawCards()
    }
    function onScroll() {
        if (!on) return
        read()
        if (!raf) raf = life.raf(frame)
    }

    function measure() {
        // offsetLeft ignores transforms, so this stays right mid-slide
        step = items[1].offsetLeft - items[0].offsetLeft
    }

    function setOn(v: boolean) {
        on = v
        team!.classList.toggle("team--on", v)
        if (v) {
            team!.style.setProperty("--team-travel", ((n - 1) * PER_CARD * 100).toFixed(2) + "vh")
            measure()
            read()
            pos = target
            intro = introTarget
            drawCards()
        } else {
            team!.style.removeProperty("--team-travel")
            items.forEach((item) => {
                item.style.transform = ""
                item.style.opacity = ""
                ;["--a", "--t", "--o", "--d"].forEach((p) => item.style.removeProperty(p))
            })
            setFront(still)
        }
        // Start the last card as it should be: built in if it is already in view
        shown = null
        showMore(v ? pos > n - 2.2 : reduced.matches)
    }
    function update() {
        setOn(desktop.matches && !reduced.matches)
    }

    /* ---------- Names: bring that person's card to the front ---------- */
    function scrollToCard(k: number, instant?: boolean) {
        if (!on) {
            viewport!.scrollTo({ left: items[k].offsetLeft - items[0].offsetLeft, behavior: reduced.matches || instant ? "auto" : "smooth" })
            return
        }
        const r = team!.getBoundingClientRect()
        const travel = r.height - window.innerHeight
        const y = window.scrollY + r.top + travel * (k / (n - 1))
        window.scrollTo({ top: Math.round(y), behavior: instant ? "auto" : "smooth" })
    }
    names.forEach((b, k) => {
        life.on(b, "click", () => scrollToCard(k))
        // Hovering (or tabbing onto) a name selects it while the pointer or focus is there
        life.on(b, "pointerenter", () => {
            hover = k
            refreshNames()
        })
        life.on(b, "focus", () => {
            if (b.matches(":focus-visible")) {
                hover = k
                refreshNames()
            }
        })
        life.on(b, "blur", () => {
            if (hover === k) {
                hover = -1
                refreshNames()
            }
        })
    })
    if (list)
        life.on(list, "pointerleave", () => {
            hover = -1
            refreshNames()
        })

    // Without the pinned row the cards scroll sideways; the names follow that instead
    life.on(
        viewport,
        "scroll",
        () => {
            if (on) return
            const w = items[1].offsetLeft - items[0].offsetLeft
            still = clamp(Math.round(viewport.scrollLeft / w), 0, n - 1)
            setFront(still)
        },
        { passive: true }
    )

    // Tabbing onto a card brings it to the front. The browser may also have scrolled the
    // clipped stage sideways to show it; put that back, the transforms do the moving.
    life.on(team, "focusin", (e: FocusEvent) => {
        if (!on) return
        stage.scrollLeft = 0
        viewport.scrollLeft = 0
        for (let k = 0; k < n; k++) {
            if (items[k].contains(e.target as Node)) {
                if (k !== current) scrollToCard(k, true)
                break
            }
        }
    })

    life.on(window, "scroll", onScroll, { passive: true })
    life.on(window, "resize", () => {
        layoutNames()
        if (on) {
            measure()
            onScroll()
        }
    })
    ;[desktop, reduced].forEach((mq) => {
        if ((mq as any).addEventListener) life.on(mq, "change", update)
        else if ((mq as any).addListener) {
            ;(mq as any).addListener(update)
            life.add(() => (mq as any).removeListener(update))
        }
    })
    layoutNames()
    update()
    // Mounted after page load, Montserrat may already be in or may only land now: lay out again either way
    const afterFonts = () => {
        if (life.dead) return
        layoutNames()
        if (on) {
            measure()
            drawCards()
        }
    }
    const fonts = (document as any).fonts
    if (fonts && fonts.ready) fonts.ready.then(afterFonts)
    if (fonts && fonts.addEventListener) life.on(fonts, "loadingdone", afterFonts)
}

addPropertyControls(ArcoviaTeam, {
    chip: { type: ControlType.String, title: "Chip", defaultValue: DEFAULTS.chip },
    title: { type: ControlType.String, title: "Title", defaultValue: DEFAULTS.title },
    titlePale: { type: ControlType.String, title: "Title (pale)", defaultValue: DEFAULTS.titlePale },
    people: {
        type: ControlType.Array,
        title: "People",
        control: {
            type: ControlType.Object,
            controls: {
                name: { type: ControlType.String, title: "Name" },
                role: { type: ControlType.String, title: "Role" },
                group: { type: ControlType.String, title: "Group" },
                photo: { type: ControlType.ResponsiveImage, title: "Photo" },
                link: { type: ControlType.Link, title: "Profile" },
                linkedIn: { type: ControlType.Link, title: "LinkedIn" },
            },
        },
        defaultValue: DEFAULTS.people,
        description: "Next to each other with the same group, people form a group under that name.",
    },
    moreLabel: { type: ControlType.String, title: "More row", defaultValue: DEFAULTS.moreLabel },
    count: { type: ControlType.Number, title: "Team count", defaultValue: DEFAULTS.count, min: 0, step: 1, displayStepper: true },
    countLabel: { type: ControlType.String, title: "Count label", defaultValue: DEFAULTS.countLabel },
    allLabel: { type: ControlType.String, title: "All label", defaultValue: DEFAULTS.allLabel },
    allLink: { type: ControlType.Link, title: "All link", defaultValue: DEFAULTS.allLink },
    photosUp: {
        type: ControlType.Array,
        title: "Photos (up)",
        control: { type: ControlType.ResponsiveImage },
        description: "Left column of the last card. Empty: the current photos.",
    },
    photosDown: {
        type: ControlType.Array,
        title: "Photos (down)",
        control: { type: ControlType.ResponsiveImage },
        description: "Right column of the last card. Empty: the current photos.",
    },
})
