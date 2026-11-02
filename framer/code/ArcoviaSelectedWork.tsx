/**
 * Arcovia: "Selected work" (Home, right after the data section; brief section 6).
 *
 * Three cases as books on black, each a link to its case on Track Record, plus
 * "Full track record". After the "Before vs After" section of the user's template
 * (the outer words part to either side and fade away) and the user's book video:
 * the stage pins (position: sticky) for 200vh of scroll. "Selected" and "work" sit
 * together in the middle, then part 600px left and right and fade away while three
 * book spines rise in the middle (the middle one first, then the outer two). A
 * little more scroll turns all three books at once to face the front (timed, not
 * scrubbed, so no book rests half turned; scrolling back turns them back) while
 * they spread into their row. Only the books are left. Hover (and keyboard focus)
 * lifts a book and swings its cover open on the hinge, three leaves fanning out
 * behind it (after the user's S. Fischer poster). The covers rest straight on with
 * no transform, so their text stays crisp; "Covers: Angled" (or ?books=angle) rests
 * them 16 degrees turned instead.
 *
 * The book faces are photographed blank hardcovers generated with Magnific (cast
 * concrete, charcoal linen, white art paper), uploaded to this project; the copy
 * is real text on top. The A-mark is pressed into each cover by the sprite's
 * #deboss-light and #deboss-dark filters (lit from straight above, so both legs
 * shade alike).
 *
 * Every width. Below 1024px (tablet portrait and phones) the books end on a shelf
 * you swipe, lined up with the page's left edge, snapping book by book with the
 * next one peeking in (two show whole on a tablet, one on a phone); the script
 * keeps the shelf on the first book until the books have turned. Not with reduced
 * motion, not when the settled layout is taller than the window (landscape
 * phones), and not on the Framer canvas: there it is simply the settled layout.
 * Keeps data-header-theme="dark", so the header's type turns light over it. The
 * Framer layer holding it must not clip its content (the stage is sticky and the
 * section grows by 200vh).
 * Ported from books.js and sections/selected-work.css on main.
 */
import * as React from "react"
import { addPropertyControls, ControlType } from "framer"
import { baseStyle, cssTag, sprite, useArcoviaScript, type Life } from "./ArcoviaBase.tsx"

const SELECTED_WORK_CSS = `/* ==========================================================================
   SECTION: selected-work — Home, block 6 of the brief
   "Selected work": three cases as books on black, each a link to its case
   on the Track Record page. After the template's "Before vs After" and the
   user's book video, books.js pins the stage: "Selected" and "work" part
   left and right and fade away while three spines rise in the middle; a
   little more scroll turns all three at once to face the front, and only
   the books are left. Hover lifts a book.
   This file is the settled layout (the real page); books.js only adds
   transforms on top, and at rest the covers face the front with no
   transform at all, so their text stays crisp.
   Asset paths start with ../assets/ (see CLAUDE.md).
   ========================================================================== */

/* The book's size is worked out once, on the section, and handed down as a length.
   Each cover is a size container of its own (its text answers to its width), so a
   width unit left unresolved would measure the cover instead of the page there (the
   Framer component uses container units). */
@property --book-h { syntax: "<length>"; inherits: true; initial-value: 0px; }
@property --book-w { syntax: "<length>"; inherits: true; initial-value: 0px; }
@property --book-t { syntax: "<length>"; inherits: true; initial-value: 0px; }

.work {
  /* Book size follows the window: tall enough to read as books, small
     enough that heading, books and link fit on one screen */
  --book-gap: 72px;
  --book-h: min(540px, calc((100cqw - 2 * var(--gutter) - 2 * var(--book-gap)) / 3 / 0.72));
  --book-w: calc(var(--book-h) * 0.72);
  --book-t: calc(var(--book-w) * 0.24);   /* spine: the book's thickness (thick, as in the user's book video) */
  --book-lift: 10px;                       /* hover: the book rises a little ... */
  --book-open: -32deg;                     /* ... and its cover swings open on the hinge */
  --book-persp: 1800px;
  --book-paper: #f4f3ef;
  --book-radius: 2px 5px 5px 2px;          /* square at the spine, softer at the fore edge */
  /* The heading's size is a share of the grid's width, as in the statement */
  --work-fs: max(40px, calc((min(100cqw, var(--container-max)) - 2 * var(--gutter)) * 0.052));
  position: relative;
  background: var(--color-black);
  color: var(--color-on-dark);
}

.work__stage {
  padding-block: var(--space-10);
}

.work__inner {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-8);
}

/* The heading. Pinned (books.js), it sits over the middle of the stage and
   parts away; without motion it is a plain heading above the books */
.work__title {
  display: flex;
  justify-content: center;
  gap: 0.27em;
  align-self: stretch;
  font-size: var(--work-fs);
  font-weight: var(--weight-book);
  line-height: 1;
  letter-spacing: -0.03em;
  color: var(--color-on-dark);
}
.work__word {
  display: inline-block;
  white-space: nowrap;
}

.work__books {
  display: flex;
  justify-content: center;
  gap: var(--book-gap);
}

/* ---------- Component: book ---------- */
.book {
  flex: none;
  width: var(--book-w);
  height: var(--book-h);
}

.book__link {
  display: block;
  width: 100%;
  height: 100%;
  color: inherit;
  text-decoration: none;
  outline: none;
}

/* The hover lift lives on its own layer, so it never fights the turn. Each book has its
   own perspective, centred on it, for the cover opening on hover (and the turn) */
.book__lift {
  display: block;
  height: 100%;
  perspective: var(--book-persp);
  transition: transform 620ms var(--ease-out);
}

.book__body {
  position: relative;
  height: 100%;
  transform-style: preserve-3d;
}

/* Under the cover: the page block, and three leaves that fan out a little behind the cover
   when it opens. The boards overhang the pages by a few pixels, as on a real hardcover */
.book__pages,
.book__leaf {
  position: absolute;
  top: 3px;
  bottom: 3px;
  left: 3px;
  right: 5px;
  border-radius: 0 2px 2px 0;
  pointer-events: none;
}
.book__pages {
  background: var(--book-paper);
  /* the open cover throws a little shade into the gutter */
  box-shadow: inset 10px 0 16px -8px rgba(0, 0, 0, 0.35);
  transform: translateZ(-4px);
}
.book__leaf {
  background: linear-gradient(to right, #e6e5e1, var(--book-paper) 35%, #fbfaf8);
  box-shadow: inset -1px 0 0 rgba(0, 0, 0, 0.16); /* each leaf's fore-edge */
  transform-origin: left center;
  transform: translateZ(calc(-3px + var(--k) * 3px));
  transition: transform 720ms var(--ease-out);
}

/* The front cover */
.book__cover {
  position: absolute;
  inset: 0;
  container-type: inline-size; /* its text answers to the cover's own width */
  display: flex;
  flex-direction: column;
  padding: calc(var(--book-w) * 0.085) calc(var(--book-w) * 0.08) calc(var(--book-w) * 0.08) calc(var(--book-w) * 0.115);
  border-radius: var(--book-radius);
  /* A photographed blank hardcover (generated with Magnific): the material, the light and
     the hinge groove come from the image; the copy is printed on top as real text */
  background: var(--book-ink-bg) var(--book-cover) center / cover no-repeat;
  color: var(--book-ink);
  filter: brightness(var(--lit, 1));
  transform-origin: left center; /* the hinge */
  transition: transform 720ms var(--ease-out);
}

/* Hover (and keyboard focus): the book rises a little and its cover swings open on the
   hinge, the top leaves fanning out behind it, so it reads as a book you can open.
   Only once the books face the front */
@media (prefers-reduced-motion: no-preference) {
  .work:not(.work--staged) .book__link:is(:hover, :focus-visible) .book__lift,
  .work--staged .book__link:is(:hover, :focus-visible) .book__lift { transform: translateY(calc(-1 * var(--book-lift))); }
  .work:not(.work--staged) .book__link:is(:hover, :focus-visible) .book__cover,
  .work--staged.is-open .book__link:is(:hover, :focus-visible) .book__cover { transform: rotateY(var(--book-open)); }
  .work:not(.work--staged) .book__link:is(:hover, :focus-visible) .book__leaf,
  .work--staged.is-open .book__link:is(:hover, :focus-visible) .book__leaf {
    transform: translateZ(calc(-3px + var(--k) * 3px)) rotateY(calc(var(--book-open) * var(--k)));
  }
}
@media (hover: none) {
  .book__link:hover .book__lift,
  .book__link:hover .book__cover,
  .book__link:hover .book__leaf { transform: none; }
}
/* A hairline where the board's edge catches the light, so the darkest binding
   still lifts off the black */
.book__cover::after {
  content: "";
  position: absolute;
  inset: 0;
  border-radius: inherit;
  box-shadow: inset 0 0 0 1px var(--book-rim);
  pointer-events: none;
}

.book__top {
  display: flex;
  align-items: center;
  justify-content: space-between;
}
/* The A-mark pressed into the board, as in the deck: an SVG filter in the sprite
   (#deboss-light, #deboss-dark) darkens the floor of the recess, shades its top and
   left walls and lights its bottom and right walls. The fill only gives the shape */
.book__mark {
  width: calc(var(--book-w) * 0.12);
  height: auto;
  overflow: visible;
  fill: #000;
  filter: var(--book-deboss);
}
.book__index {
  font-size: 13px;
  font-weight: var(--weight-medium);
  letter-spacing: 0.04em;
  font-variant-numeric: tabular-nums;
  color: var(--book-ink-muted);
}

.book__figure {
  margin-top: calc(var(--book-w) * 0.2);
  font-size: calc(var(--book-w) * 0.2);
  font-weight: var(--weight-book);
  line-height: 1;
  letter-spacing: -0.035em;
  font-variant-numeric: tabular-nums;
}

.book__name {
  margin-top: auto;
  font-size: max(13px, calc(var(--book-w) * 0.064));
  font-weight: var(--weight-medium);
  line-height: 1.2;
  letter-spacing: -0.01em;
}
.book__line {
  margin-top: 10px;
  font-size: clamp(12px, calc(var(--book-w) * 0.046), 14px);
  line-height: 1.45;
  color: var(--book-ink-muted);
}
/* measured inside the cover's padding: about a 185px-wide cover (landscape phones) */
@container (max-width: 150px) {
  .book__line { display: none; }
}
/* The spine: only seen while the books stand closed (books.js) */
.book__spine,
.book__hit {
  display: none;
}

/* ---------- The three bindings: monochrome, from the deck ---------- */
.book--concrete {
  --book-cover: url("https://framerusercontent.com/images/xpd0ie0VyvOOMHZ5ZbYk7RoU2mg.jpg");
  --book-spine: url("https://framerusercontent.com/images/nCHtdPAQkNvKovnHsTwVkXOxkc.jpg");
  --book-ink-bg: #c2c2c2;
  --book-ink: var(--color-ink);
  --book-ink-muted: var(--color-text-muted);
  --book-rim: rgba(255, 255, 255, 0.12);
  --book-deboss: url(#deboss-light);
}
.book--charcoal {
  --book-cover: url("https://framerusercontent.com/images/11jleDdOmcfXbH7ZLPeCwffWYs.jpg");
  --book-spine: url("https://framerusercontent.com/images/yHIEGG2vYkh5xCE0mR4pUV2RzQ.jpg");
  --book-ink-bg: #323232;
  --book-ink: var(--color-on-dark);
  --book-ink-muted: rgba(244, 244, 243, 0.74);
  --book-rim: rgba(255, 255, 255, 0.07);
  --book-deboss: url(#deboss-dark);
}
.book--paper {
  --book-cover: url("https://framerusercontent.com/images/d3wIK5E061h9Kcp89ANg80Dq1U.jpg");
  --book-spine: url("https://framerusercontent.com/images/kwEEkcOyOPiK0op4ANkkpiXOI0.jpg");
  --book-ink-bg: #e2e2e2;
  --book-ink: var(--color-ink);
  --book-ink-muted: var(--color-text-muted);
  --book-rim: rgba(255, 255, 255, 0.2);
  --book-deboss: url(#deboss-light);
}

/* ---------- Link to the full track record (outlined pill, as on the map) ---------- */
.work__more {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  height: 44px;
  padding: 0 20px;
  border: 1px solid rgba(244, 244, 243, 0.3);
  border-radius: var(--radius-pill);
  font-size: var(--fs-small);
  font-weight: var(--weight-medium);
  color: var(--color-on-dark);
  transition: border-color var(--dur-fast) var(--ease-out);
}
.work__arrow {
  flex: none;
  width: 14px;
  height: 14px;
  transition: transform var(--dur-base) var(--ease-out);
}
@media (hover: hover) {
  .work__more:hover { border-color: var(--color-on-dark); }
  .work__more:hover .work__arrow { transform: translateX(3px); }
}
.work__more:focus-visible { outline: 2px solid var(--color-on-dark); outline-offset: 3px; }

/* ==========================================================================
   Staged (books.js, every width, no reduced motion): the stage pins and the
   books become 3D: a cover at the front and a spine down its left edge,
   the box reaching back from the cover by the book's thickness.
   ========================================================================== */
.work.work--staged {
  --book-h: min(52vh, 540px, calc((100cqw - 2 * var(--gutter) - 2 * var(--book-gap)) / 3 / 0.72));
  height: 300vh; /* 200vh of scroll: the words part and the spines rise (0–40%), a little more turns the books (47%), then a long rest */
}
.work--staged .work__stage {
  position: sticky;
  top: 0;
  height: 100vh;
  height: 100svh;
  overflow: clip;
  display: flex;
  align-items: center;
  padding-block: calc(var(--mh-labels) + var(--mh-compact)) var(--space-5);
}
.work--staged .work__inner {
  width: 100%;
}

.work--staged .work__title {
  position: absolute;
  inset: 0;
  align-items: center;
  pointer-events: none;
}
.work--staged .work__word { will-change: transform, opacity; }

/* Only the faces you can see take the pointer: a closed book's box is
   wider than its spine and would catch hovers meant for its neighbour */
.work--staged .book,
.work--staged .book__link,
.work--staged .book__lift,
.work--staged .book__body { pointer-events: none; }
.work--staged .book__cover,
.work--staged .book__spine,
.work--staged .book__pages,
.work--staged .book__leaf { pointer-events: auto; }
/* A little extra reach below each face, so a lifted book stays under the cursor */
.work--staged .book__hit {
  display: block;
  position: absolute;
  inset: auto 0 calc(-1 * var(--book-lift) - 6px) 0;
  height: calc(var(--book-lift) + 6px);
}

.work--staged .book__lift {
  perspective: var(--book-persp, 1800px);
}

.work--staged .book__body {
  transform-style: preserve-3d;
}

.work--staged .book__cover { backface-visibility: hidden; }

.work--staged .book__spine {
  position: absolute;
  top: 0;
  left: calc((var(--book-w) - var(--book-t)) / 2);
  width: var(--book-t);
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: calc(var(--book-t) * 0.42) 0 calc(var(--book-t) * 0.34);
  border-radius: 3px;
  /* The photographed spine: its rounding and light come from the image */
  background: var(--book-ink-bg) var(--book-spine) center / 100% 100% no-repeat;
  color: var(--book-ink);
  filter: brightness(var(--lit, 1));
  backface-visibility: hidden;
  /* On the left edge of the cover, facing left, reaching back by the book's thickness */
  transform: translateZ(calc(var(--book-t) / -2)) rotateY(-90deg) translateZ(calc(var(--book-w) / 2));
}
.work--staged.is-flat .book__spine { visibility: hidden; }

/* The spine's title runs top to bottom, as on a shelf */
.book__spine-text {
  flex: 1;
  min-height: 0;
  overflow: hidden;
  writing-mode: vertical-rl;
  font-size: max(10px, calc(var(--book-t) * 0.25));
  font-weight: var(--weight-book);
  line-height: 1;
  letter-spacing: 0.01em;
  white-space: nowrap;
}
.book__spine-figure {
  margin-bottom: 1.1em;
  font-weight: var(--weight-semibold);
}
.book__spine-mark {
  flex: none;
  width: calc(var(--book-t) * 0.4);
  height: auto;
  fill: currentColor;
}

/* Keyboard focus outlines the face you can see */
.book__link:focus-visible .book__cover { outline: 2px solid var(--color-on-dark); outline-offset: 4px; }
.work--staged:not(.is-open) .book__link:focus-visible .book__spine { outline: 2px solid var(--color-on-dark); outline-offset: 4px; }

/* ---------- Tablet (810–1199): the same sequence, smaller books ---------- */
@container arc (max-width: 1199px) {
  .work { --book-gap: 40px; }
}

/* ---------- Below 1024 (tablet portrait and phones): the books end on a shelf ----------
   A row of three would leave the books too small, so they sit on a shelf you swipe:
   it runs edge to edge, lines up with the page's left edge and snaps book by book,
   and the next book peeks in from the right (on a tablet two show whole). The whole
   section still fits one screen, so the stage can pin. Before the books turn, the
   shelf stays put (books.js also returns it to the first book whenever they turn
   back). */
@container arc (max-width: 1023px) {
  .work {
    --book-gap: 24px;
    --book-h: min(80svh, calc(min(44cqw, 360px) / 0.72)); /* a whole book always fits the screen (landscape phones) */
  }
  .work.work--staged { --book-h: min(52vh, calc(min(44cqw, 360px) / 0.72)); }
  .work__books {
    align-self: stretch;
    justify-content: flex-start;
    margin-inline: calc(-1 * var(--gutter));
    padding: 14px var(--gutter) 6px;
    scroll-padding-inline: var(--gutter);
    overflow-x: auto;
    overscroll-behavior-x: contain;
    scroll-snap-type: x mandatory;
    scrollbar-width: none;
  }
  .work__books::-webkit-scrollbar { display: none; }
  .book { scroll-snap-align: start; }
  /* No swiping or snapping until the books have turned: snapping would chase the moving books */
  .work--staged:not(.is-open) .work__books { overflow-x: hidden; scroll-snap-type: none; }
}

/* ---------- Phone (809 and below): one book at a time, the next peeking in ---------- */
@container arc (max-width: 809px) {
  .work {
    --book-gap: 20px;
    --book-h: min(80svh, calc(min(72cqw, 300px) / 0.72));
  }
  .work.work--staged { --book-h: min(48svh, calc(min(72cqw, 300px) / 0.72)); }
  .work__inner { gap: var(--space-6); }
}
`

type Binding = "concrete" | "charcoal" | "paper"

interface Book {
    figure: string
    title: string
    line: string
    link: string
    binding: Binding
}

interface Props {
    word1: string
    word2: string
    books: Book[]
    moreLabel: string
    moreLink: string
    covers: "straight" | "angled"
    style?: React.CSSProperties
}

const DEFAULTS: Props = {
    // The heading, in two words that part on their own
    word1: "Selected",
    word2: "work",
    // Copy from the brief (section 6); figures from the deck
    books: [
        {
            figure: "$63M",
            title: "Brazil Telecom Tower Raise",
            line: "Equity and debt for a 1,360+ tower rollout.",
            link: "/track-record#brazil-telecom-tower-raise",
            binding: "concrete",
        },
        {
            figure: "$54M+",
            title: "Mandela Station",
            line: "Debt and equity for a multi-asset portfolio, now a long-term capital relationship.",
            link: "/track-record#mandela-station",
            binding: "charcoal",
        },
        {
            figure: "$35M",
            title: "VALR Energy Growth Round",
            line: "Growth capital to launch into a 50,000-store network.",
            link: "/track-record#valr-energy-growth-round",
            binding: "paper",
        },
    ],
    moreLabel: "Full track record",
    moreLink: "/track-record",
    covers: "straight",
}

const BINDINGS: Binding[] = ["concrete", "charcoal", "paper"]

/**
 * @framerSupportedLayoutWidth any-prefer-fixed
 * @framerSupportedLayoutHeight auto
 */
export default function ArcoviaSelectedWork(incoming: Partial<Props>) {
    const p = { ...DEFAULTS, ...incoming }
    const books = (p.books?.length ? p.books : DEFAULTS.books).slice(0, 3)
    const ref = React.useRef<HTMLDivElement>(null)
    // Measure again whenever the copy changes (the words and the books are measured)
    const key = JSON.stringify([p.word1, p.word2, books, p.moreLabel, p.covers])
    useArcoviaScript(ref, (root, life) => initBooks(root, life, p.covers === "angled"), [key])

    return (
        <div className="arc arc-selected-work" ref={ref} style={p.style}>
            {baseStyle()}
            {cssTag("selected-work", SELECTED_WORK_CSS)}
            {sprite()}
            <section className="work" id="selected-work" data-books="" data-header-theme="dark" aria-labelledby="work-title">
                <div className="work__stage">
                    <div className="work__inner container">
                        <h2 className="work__title" id="work-title" aria-label={p.word1 + " " + p.word2}>
                            <span className="work__word">{p.word1}</span> <span className="work__word">{p.word2}</span>
                        </h2>

                        {/* Component: book (figure, title, line; spine for the closed state) */}
                        <ul className="work__books">
                            {books.map((b, i) => {
                                const binding = BINDINGS.indexOf(b.binding) >= 0 ? b.binding : BINDINGS[i % 3]
                                return (
                                    <li className={"book book--" + binding} key={i}>
                                        <a className="book__link" href={b.link || "#"}>
                                            <div className="book__lift">
                                                <div className="book__body">
                                                    <div className="book__spine" aria-hidden="true">
                                                        <p className="book__spine-text">
                                                            <span className="book__spine-figure">{b.figure}</span>
                                                            {b.title}
                                                        </p>
                                                        <svg className="book__spine-mark" viewBox="0 0 72 57">
                                                            <use href="#a-mark" />
                                                        </svg>
                                                        <span className="book__hit"></span>
                                                    </div>
                                                    <span className="book__pages" aria-hidden="true"></span>
                                                    <span className="book__leaf" style={{ ["--k" as any]: 0.22 }} aria-hidden="true"></span>
                                                    <span className="book__leaf" style={{ ["--k" as any]: 0.44 }} aria-hidden="true"></span>
                                                    <span className="book__leaf" style={{ ["--k" as any]: 0.68 }} aria-hidden="true"></span>
                                                    <div className="book__cover">
                                                        <div className="book__top" aria-hidden="true">
                                                            <svg className="book__mark" viewBox="0 0 72 57">
                                                                <use href="#a-mark" />
                                                            </svg>
                                                            <span className="book__index">{String(i + 1).padStart(2, "0")}</span>
                                                        </div>
                                                        <p className="book__figure">{b.figure}</p>
                                                        <h3 className="book__name">{b.title}</h3>
                                                        <p className="book__line">{b.line}</p>
                                                        <span className="book__hit" aria-hidden="true"></span>
                                                    </div>
                                                </div>
                                            </div>
                                        </a>
                                    </li>
                                )
                            })}
                        </ul>

                        <a className="work__more" href={p.moreLink || "#"}>
                            {p.moreLabel}
                            <svg className="work__arrow" aria-hidden="true">
                                <use href="#icon-arrow" />
                            </svg>
                        </a>
                    </div>
                </div>
            </section>
        </div>
    )
}

/* ==========================================================================
   Behaviour (books.js): the heading parts and goes, three books turn to face you.
   The section pins (sticky stage) while:
     0.00–0.34  "Selected" and "work" part left and right and fade away,
                scrubbed by scroll, exactly as in the template
     0.10–0.40  three book spines rise into the middle as the words open: the
                middle one first, then the outer two (spines facing you)
     0.47       a little more scroll and all three books turn at once to face
                the front while they spread into their row. Only the books are
                left. The turn plays on its own once started (scrolling back
                above 0.42 turns them back), so a book is never left half turned.
     to 1.00    rest on the settled layout
   The settled layout is the real page (the CSS above); this only adds transforms
   on top. At rest the covers face straight ahead with no transform at all, so
   their text stays crisp. Each book has its own perspective, centred on it, so
   the outer books never look skewed. Every width: on a phone or a portrait
   tablet the books end on a shelf you swipe (CSS), which this keeps on the first
   book until they have turned. Not with reduced motion, and not when the settled
   layout is taller than the window: there the section is simply the settled layout.
   ========================================================================== */
const PART = [0, 0.34] // the words part and fade (linear, as in the template)
const SPREAD = 600 // how far each word travels, px (the template's value)
const RISE_AT = 0.1 // the middle spine starts to rise
const RISE = 0.22 // each spine's rise
const STAGGER = 0.08 // then the outer two, together
const OPEN_AT = 0.47 // the books turn to face the front
const CLOSE_AT = 0.42 // and back, a little earlier, so it never flickers
const TURN_MS = 1100 // the turn, played on its own once triggered
const BACK_MS = 850

function clamp(v: number, a: number, b: number) {
    return v < a ? a : v > b ? b : v
}
function ramp(a: number, b: number, x: number) {
    return clamp((x - a) / (b - a), 0, 1)
}
function lerp(a: number, b: number, t: number) {
    return a + (b - a) * t
}
function easeOut(t: number) {
    return 1 - Math.pow(1 - t, 3)
}
function easeInOut(t: number) {
    return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2
}
function move(x: number, y: number) {
    return "translate(" + x.toFixed(2) + "px," + y.toFixed(2) + "px)"
}

interface BookBox {
    cx: number
    closed: number
}

interface Geo {
    W: number
    T: number
    dy: number
    spread: number
    b: BookBox[]
    rise: number
    fits: boolean
}

function initBooks(root: HTMLElement, life: Life, angled: boolean) {
    const sec = root.querySelector<HTMLElement>("[data-books]")
    if (!sec) return
    const stage = sec.querySelector<HTMLElement>(".work__stage")
    const inner = sec.querySelector<HTMLElement>(".work__inner")
    const title = sec.querySelector<HTMLElement>(".work__title")
    const words = Array.prototype.slice.call(sec.querySelectorAll(".work__word")) as HTMLElement[]
    const books = Array.prototype.slice.call(sec.querySelectorAll(".book")) as HTMLElement[]
    const bodies = books.map((b) => b.querySelector(".book__body") as HTMLElement)
    const covers = books.map((b) => b.querySelector(".book__cover") as HTMLElement)
    const spines = books.map((b) => b.querySelector(".book__spine") as HTMLElement)
    const more = sec.querySelector<HTMLElement>(".work__more")
    const shelf = sec.querySelector<HTMLElement>(".work__books")
    const n = books.length
    if (!stage || !inner || !title || words.length !== 2 || n < 1) return

    const REST = angled || /[?&]books=angle\b/.test(location.search) ? 16 : 0 // resting angle, degrees
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)")

    let on = false
    let geo: Geo | null = null
    let p = 0
    let target = 0
    let q = 0
    let qTarget = 0
    let last = 0
    let raf = 0
    let lastW = 0
    let lastH = 0

    function clear() {
        words.concat(books, bodies).forEach((el) => {
            el.style.transform = ""
        })
        words.forEach((el) => {
            el.style.opacity = ""
        })
        books.forEach((el) => {
            el.style.opacity = ""
        })
        covers.concat(spines).forEach((el) => el.style.removeProperty("--lit"))
        if (more) more.style.opacity = ""
    }

    /* ---------- Where everything sits: start, parted and settled ---------- */
    function measure(): Geo {
        clear()
        if (shelf) shelf.scrollLeft = 0 // measured from the first book (the shelf below 1024px)
        const s = stage!.getBoundingClientRect()
        function rel(el: Element) {
            const r = el.getBoundingClientRect()
            return { x: r.left - s.left, y: r.top - s.top, w: r.width, h: r.height }
        }
        const vw = s.width
        const vh = s.height
        const w = words.map(rel)
        const b = books.map(rel)
        const W = b[0].w
        const T = spines[0].offsetWidth || W * 0.24
        const cy = b[0].y + b[0].h / 2

        // The two words sit together in the middle of the stage (CSS); bring them level with the books
        const dy = cy - (w[0].y + w[0].h / 2)
        const spineGap = Math.max(20, T * 0.5)
        const group = n * T + (n - 1) * spineGap

        // Each book's centre: closed, side by side in the middle; open, in its place in the row
        const boxes = b.map((c, i) => ({
            cx: c.x + c.w / 2,
            closed: vw / 2 - group / 2 + T / 2 + i * (T + spineGap),
        }))

        const ss = getComputedStyle(stage!)
        const room = vh - parseFloat(ss.paddingTop) - parseFloat(ss.paddingBottom)
        return { W, T, dy, spread: Math.max(SPREAD, vw * 0.4), b: boxes, rise: vh * 0.32, fits: inner!.offsetHeight <= room + 1 }
    }

    /* ---------- One frame, from the scroll progress p and the turn q ---------- */
    function draw() {
        const g = geo!
        const part = ramp(PART[0], PART[1], p)
        const e = easeInOut(q)
        // The books spread a little ahead of the turn, so a widening cover never runs into
        // its neighbour
        const spread = easeInOut(ramp(0, 0.8, q))
        const turn = easeInOut(ramp(0.1, 1, q))
        const open = q >= 1
        const flat = open && REST === 0
        sec!.classList.toggle("is-open", open)
        sec!.classList.toggle("is-flat", flat)
        // Until the books have turned, the shelf rests on the first book (they turn back
        // from wherever it was swiped to)
        if (!open && shelf && shelf.scrollLeft) shelf.scrollLeft = 0

        // The words part to either side and fade away, as in the template; only the books stay
        words.forEach((el, i) => {
            el.style.transform = move((i ? 1 : -1) * g.spread * part, g.dy)
            el.style.opacity = (1 - part).toFixed(3)
        })

        // The turn: 90° shows the spine, 0° the cover. The box turns about its own middle,
        // and is drawn back as it turns so the face you see stays at the same depth (no swelling)
        const deg = lerp(90, REST, turn)
        const rad = (deg * Math.PI) / 180
        const depth = -((g.W - g.T) / 2) * Math.sin(rad)
        const spin = "translateZ(" + (depth - g.T / 2).toFixed(2) + "px) rotateY(" + deg.toFixed(3) + "deg) translateZ(" + (g.T / 2).toFixed(2) + "px)"
        // Light from the front left: the cover dims as it turns away, the spine as it turns in
        const coverLit = clamp(0.72 + 0.28 * (Math.cos(rad) - 0.55 * Math.sin(rad)), 0.55, 1)
        const spineLit = clamp(0.72 + 0.28 * (Math.sin(rad) + 0.55 * Math.cos(rad)), 0.55, 1)

        books.forEach((el, i) => {
            const c = g.b[i]
            // The gap opens from the middle, so the middle spine rises first, then its neighbours
            const order = Math.abs(i - (n - 1) / 2)
            const r = easeOut(ramp(RISE_AT + order * STAGGER, RISE_AT + order * STAGGER + RISE, p))
            const dx = lerp(c.closed, c.cx, spread) - c.cx
            const dy = (1 - r) * g.rise
            el.style.transform = Math.abs(dx) < 0.01 && dy < 0.01 ? "" : move(dx, dy)
            el.style.opacity = r >= 1 ? "" : clamp(r * 1.4, 0, 1).toFixed(3)
            el.style.visibility = r <= 0 ? "hidden" : ""
            bodies[i].style.transform = flat ? "" : spin
            if (flat) {
                covers[i].style.removeProperty("--lit")
            } else {
                covers[i].style.setProperty("--lit", coverLit.toFixed(3))
                spines[i].style.setProperty("--lit", spineLit.toFixed(3))
            }
        })

        if (more) more.style.opacity = open ? "" : ramp(0.55, 1, e).toFixed(3)
    }

    /* ---------- Scroll → progress (lightly smoothed); the turn runs on time ---------- */
    function read() {
        const r = sec!.getBoundingClientRect()
        const travel = r.height - window.innerHeight
        target = travel > 0 ? clamp(-r.top / travel, 0, 1) : 0
        if (target >= OPEN_AT) qTarget = 1
        else if (target < CLOSE_AT) qTarget = 0
    }

    function tick(now: number) {
        raf = 0
        if (!on) return
        if (!geo) geo = measure()
        const dt = last ? Math.min(64, now - last) : 16
        last = now
        const d = target - p
        p = Math.abs(d) < 0.0004 ? target : p + d * 0.2
        if (q !== qTarget) {
            q = qTarget > q ? Math.min(1, q + dt / TURN_MS) : Math.max(0, q - dt / BACK_MS)
        }
        draw()
        if (p !== target || q !== qTarget) raf = life.raf(tick)
        else last = 0
    }

    function queue() {
        if (!on) return
        read()
        if (!raf) raf = life.raf(tick)
    }

    function setMode() {
        if (life.dead) return
        lastW = window.innerWidth
        lastH = window.innerHeight
        let want = !reduced.matches
        sec!.classList.toggle("work--staged", want)
        sec!.classList.remove("is-open", "is-flat")
        geo = null
        if (want) {
            // The settled layout must fit on one screen, or the section just scrolls
            geo = measure()
            if (!geo.fits) {
                want = false
                sec!.classList.remove("work--staged")
            }
        }
        on = want
        if (!on) {
            if (raf) life.cancelRaf(raf)
            raf = 0
            clear()
            books.forEach((el) => {
                el.style.visibility = ""
            })
            return
        }
        read()
        p = target
        q = qTarget = p >= OPEN_AT ? 1 : 0
        draw()
    }

    // A phone's toolbar showing or hiding changes only the height a little: not worth
    // measuring again mid-scroll (the sizes follow svh and vh, which stay put)
    function resized() {
        if (window.innerWidth === lastW && Math.abs(window.innerHeight - lastH) < 160) return
        setMode()
    }

    life.on(window, "scroll", queue, { passive: true })
    life.on(window, "resize", resized)
    // (older Safari has no addEventListener on media queries)
    if (typeof reduced.addEventListener === "function") life.on(reduced, "change", setMode)
    // The words are measured from the real font, so measure again once it's in. The
    // component can mount after the page has loaded, before its font has started
    // loading, so also listen for later font loads.
    const fonts = (document as any).fonts
    if (fonts) {
        if (fonts.ready) fonts.ready.then(setMode)
        if (fonts.addEventListener) life.on(fonts, "loadingdone", setMode)
    }
    // Leave the section clean when it unmounts
    life.add(() => {
        clear()
        books.forEach((el) => {
            el.style.visibility = ""
        })
        sec!.classList.remove("work--staged", "is-open", "is-flat")
    })
    setMode()
}

addPropertyControls(ArcoviaSelectedWork, {
    word1: { type: ControlType.String, title: "Word 1", defaultValue: DEFAULTS.word1 },
    word2: { type: ControlType.String, title: "Word 2", defaultValue: DEFAULTS.word2 },
    books: {
        type: ControlType.Array,
        title: "Books",
        maxCount: 3,
        control: {
            type: ControlType.Object,
            controls: {
                figure: { type: ControlType.String, title: "Figure" },
                title: { type: ControlType.String, title: "Title" },
                line: { type: ControlType.String, title: "Line", displayTextArea: true },
                link: { type: ControlType.Link, title: "Link" },
                binding: {
                    type: ControlType.Enum,
                    title: "Binding",
                    options: ["concrete", "charcoal", "paper"],
                    optionTitles: ["Concrete", "Charcoal linen", "White paper"],
                },
            },
        },
        defaultValue: DEFAULTS.books,
    },
    moreLabel: { type: ControlType.String, title: "Link label", defaultValue: DEFAULTS.moreLabel },
    moreLink: { type: ControlType.Link, title: "Link", defaultValue: DEFAULTS.moreLink },
    covers: {
        type: ControlType.Enum,
        title: "Covers",
        options: ["straight", "angled"],
        optionTitles: ["Straight", "Angled"],
        displaySegmentedControl: true,
        defaultValue: DEFAULTS.covers,
    },
})
