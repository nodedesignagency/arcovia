/**
 * Arcovia: Home hero and statement, one pinned scroll stage.
 *
 * The hero: live carved concrete (WebGL, ArcoviaConcrete.tsx), a bracketed chip
 * over the headline, the lede and the one-button path picker ("Choose your path"
 * opens the three paths above it), a carved formwork seam and ARCOVIA carved
 * across the bottom.
 *
 * Scrolling pins the stage for 280vh. The hero text lifts away while a drill bores
 * into the O of ARCOVIA, throwing out chips and dust; the bore deepens, punches
 * through to light and the view flies down it into the statement, which rises
 * into place while its text writes itself in letter by letter ("Spreadsheets
 * validate data," stays pale on purpose). Every frame comes from the scroll
 * position alone, so scrolling back up plays it in reverse. The zoom and the hole
 * are drawn inside the WebGL slab, never as CSS transforms on the hero.
 * Without WebGL the hero just fades; with reduced motion nothing pins and the two
 * simply stack, which is also what the Framer canvas shows (scripts never run there).
 *
 * Place it at the top of Home, full width (the header sits above it in the
 * layout template), in a parent that does not clip (overflow visible), so the
 * pinned stage (position: sticky) works. The page itself scrolls.
 * Review switches kept from the HTML: ?fx=break, ?burn=mono, ?icons=none.
 *
 * Ported from site/index.html (SECTION:hero, SECTION:statement), sections/hero.css,
 * sections/statement.css, the path picker in styles.css, zoom.js and the path
 * picker and hero parts of main.js, on main.
 */
import * as React from "react"
import { addPropertyControls, ControlType } from "framer"
import { ASSETS, baseStyle, cssTag, sprite, isStaticRender, useArcoviaScript, type Life } from "./ArcoviaBase.tsx"
import { ConcreteSurface, type ConcreteView } from "./ArcoviaConcrete.tsx"

const HERO_CSS = `/* ---------- Path picker: one button, three paths ---------- */
.path-picker { position: relative; display: inline-block; }

/* At rest the chevrons point outward (open a list); when the menu is open each turns over, pointing inward (close) */
.path-picker__chevrons { width: 16px; height: 16px; }
.path-picker__chev {
  fill: none;
  stroke: currentColor;
  stroke-width: 1.5;
  stroke-linecap: round;
  stroke-linejoin: round;
  transform-box: fill-box;
  transform-origin: center;
  transition: transform var(--dur-base) var(--ease-out);
}
.path-picker__trigger[aria-expanded="true"] .path-picker__chev--up { transform: translateY(1px) rotate(180deg); }
.path-picker__trigger[aria-expanded="true"] .path-picker__chev--down { transform: translateY(-1px) rotate(180deg); }

.path-picker__panel {
  position: absolute;
  left: 0;
  bottom: calc(100% + 14px);
  z-index: 20;
  /* As wide as the hero's right-hand column, so it lines up with the grid */
  width: var(--picker-w, 440px);
  padding: 10px;
  background: var(--color-white);
  border-radius: 24px;
  /* After the user's reference: a hairline border and a soft, wide, very light shadow */
  box-shadow: var(--shadow-menu);
  transform-origin: 28px 100%;
  opacity: 0;
  visibility: hidden;
  transform: translateY(6px) scale(0.97);
  transition: opacity var(--dur-fast) var(--ease-out), transform var(--dur-fast) var(--ease-out), visibility 0s linear var(--dur-fast);
}
.path-picker.is-open .path-picker__panel {
  opacity: 1;
  visibility: visible;
  transform: none;
  transition: opacity var(--dur-base) var(--ease-out), transform var(--dur-base) var(--ease-out), visibility 0s;
}

.path-picker__title {
  /* A hairline under the title, inset to line up with the rows */
  margin: 0 14px 8px;
  padding: 12px 0 14px;
  border-bottom: 1px solid rgba(17, 17, 17, 0.08);
  font-size: 12px;
  font-weight: var(--weight-medium);
  letter-spacing: 0.08em;
  line-height: 16px;
  text-transform: uppercase;
  color: var(--color-text-muted);
}

/* One row: the icon on the left (no tile), title and one line in the middle, a chevron on the right */
.path-picker__option {
  display: grid;
  grid-template-columns: 30px 1fr 16px;
  grid-template-rows: auto auto;
  column-gap: 16px;
  row-gap: 3px;
  align-items: center;
  padding: 14px;
  border-radius: 16px;
  transition: background-color var(--dur-fast) var(--ease-out);
}
.path-picker__icon {
  grid-row: 1 / span 2;
  display: grid;
  place-items: center;
  width: 30px;
  height: 30px;
  color: var(--color-text);
  transition: transform var(--dur-base) var(--ease-out);
}
.path-picker__icon svg { width: 30px; height: 30px; }
.path-picker__label {
  grid-column: 2;
  align-self: end;
  font-size: 18px;
  font-weight: var(--weight-medium);
  line-height: 1.3;
  color: var(--color-ink);
}
.path-picker__meta {
  grid-column: 2;
  align-self: start;
  font-size: 14px;
  line-height: 1.4;
  color: var(--color-text-muted);
}
.path-picker__arrow {
  grid-column: 3;
  grid-row: 1 / span 2;
  width: 16px;
  height: 16px;
  color: #a6a6a6;
  transition: transform var(--dur-base) var(--ease-out), color var(--dur-fast) var(--ease-out);
}
.path-picker__option:focus-visible { outline-offset: -2px; }
@media (hover: hover) {
  .path-picker__option:hover { background: #f6f6f5; }
  .path-picker__option:hover .path-picker__icon { transform: scale(1.06); }
  .path-picker__option:hover .path-picker__arrow { color: var(--color-ink); transform: translateX(2px); }
}

/* Without icons (?icons=none): title and line only */
.path-picker[data-icons="none"] .path-picker__icon { display: none; }
.path-picker[data-icons="none"] .path-picker__option { grid-template-columns: 1fr 16px; }
.path-picker[data-icons="none"] .path-picker__label,
.path-picker[data-icons="none"] .path-picker__meta { grid-column: 1; }
.path-picker[data-icons="none"] .path-picker__arrow { grid-column: 2; }

@container arc (max-width: 809px) {
  /* Full-width panel on phones; the button keeps its own width */
  .path-picker { display: block; justify-self: stretch; }
  .path-picker__panel { width: 100%; }
}


/* ==========================================================================
   SECTION: hero — Home, block 1
   Live carved concrete (concrete.js), a bracketed chip over the headline,
   one path button, a seam and ARCOVIA carved across the bottom.
   Sits under the expanded masthead (--header-h, set in styles.css).
   Shares a scroll stage with the statement (zoom.js): see the end of this file.
   Uses shared tokens and components from styles.css.
   ========================================================================== */

.hero {
  position: relative;
  isolation: isolate;
  min-height: 100vh;
  min-height: 100svh;
  overflow: hidden;
  /* Static fallback: no JS, no WebGL. A soft diagonal light band on concrete. */
  background-color: var(--color-concrete);
  background-image:
    linear-gradient(112deg, rgba(0, 0, 0, 0.06) 0%, rgba(0, 0, 0, 0.02) 38%, rgba(255, 255, 255, 0.22) 52%, rgba(255, 255, 255, 0.14) 66%, rgba(0, 0, 0, 0.05) 100%),
    url("${ASSETS.concrete}");
  background-size: auto, 1024px;
}

.hero__canvas {
  position: absolute;
  inset: 0;
  z-index: -1;
  width: 100%;
  height: 100%;
  opacity: 0;
  transition: opacity 900ms var(--ease-out);
}
.hero--gl .hero__canvas { opacity: 1; }

/* Chips and dust thrown out by the drill (zoom.js), over the slab, under the text */
.hero__debris {
  position: absolute;
  inset: 0;
  z-index: -1;
  width: 100%;
  height: 100%;
  pointer-events: none;
}

.hero__inner {
  position: relative;
  display: grid;
  grid-template-columns: repeat(12, minmax(0, 1fr));
  grid-template-rows: 1fr auto;
  column-gap: var(--grid-gap);
  min-height: inherit;
  padding-top: var(--header-h);
  padding-bottom: calc(var(--wordmark-visible, 160px) + var(--space-6));
}

/* Heading and path picker in one row on the page grid, bottoms aligned */
.hero__content {
  grid-column: 1 / -1;
  grid-row: 1;
  align-self: center;
  display: grid;
  grid-template-columns: subgrid;
  align-items: end;
}

.hero__heading {
  grid-column: 1 / span 7;
  display: grid;
  justify-items: start;
  gap: var(--space-6);
}

.hero__title {
  font-size: var(--fs-hero);
  font-weight: var(--weight-medium);
  line-height: var(--lh-hero);
  letter-spacing: var(--ls-hero);
  color: var(--color-ink);
}

.hero__aside {
  grid-column: 9 / span 4;
  display: grid;
  justify-items: start;
  gap: var(--space-6);
  /* Lift the button so its bottom sits on the headline's baseline, not the line box */
  margin-bottom: calc(var(--fs-hero) * 0.15);
}

/* The path menu is as wide as this column, so it lines up with the grid */
.hero__aside {
  --picker-w: calc((min(100cqw, var(--container-max)) - 2 * var(--gutter) - 11 * var(--grid-gap)) / 12 * 4 + 3 * var(--grid-gap));
}

.hero__lede {
  max-width: 22em;
  font-size: var(--fs-lede);
  line-height: var(--lh-lede);
  color: var(--color-text);
}

/* Giant carved wordmark, cut by the bottom edge */
/* Formwork seam above the carved wordmark, carved into the concrete when WebGL runs */
.hero__inner > .hero__seam { grid-column: 1 / -1; grid-row: 2; }
.hero--gl .hero__seam { background: transparent; box-shadow: none; }
.hero--gl .hero__seam .seam__hole { opacity: 0; }

.hero__wordmark-wrap {
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  pointer-events: none;
}
.hero__wordmark {
  display: block;
  width: max-content;
  font-size: var(--wordmark-size, 18cqw);
  font-weight: var(--weight-medium);
  line-height: 1;
  letter-spacing: 0.035em;
  margin-right: -0.035em;
  white-space: nowrap;
  /* Drops the baseline just below the edge so the slab seems to continue */
  transform: translateY(0.24em);
  color: rgba(0, 0, 0, 0.035);
  text-shadow: 1px 1px 1px rgba(255, 255, 255, 0.55), -1px -1px 1px rgba(0, 0, 0, 0.16);
  user-select: none;
}
.hero--gl .hero__wordmark { color: transparent; text-shadow: none; }

/* Load-in: text fades up once */
@media (prefers-reduced-motion: no-preference) {
  .hero [data-rise] {
    /* backwards, not both: once done it lets go, so zoom.js can fade the same elements */
    animation: rise 700ms var(--ease-out) backwards;
    animation-delay: calc(var(--rise, 0) * 80ms + 150ms);
  }
}
@keyframes rise {
  from { opacity: 0; transform: translateY(14px); }
  to { opacity: 1; transform: none; }
}

@container arc (max-width: 1199px) {
  .hero__inner { grid-template-rows: 1fr auto auto; }
  .hero__heading { grid-column: 1 / span 11; align-self: end; margin-bottom: var(--space-7); }
  .hero__aside { grid-column: 6 / span 7; grid-row: 2; align-self: start; padding-top: 0; margin-bottom: var(--space-8); }
  /* The path menu stays as wide as this column, which spans 7 columns here (4 on desktop) */
  .hero__aside { --picker-w: calc((min(100cqw, var(--container-max)) - 2 * var(--gutter) - 11 * var(--grid-gap)) / 12 * 7 + 6 * var(--grid-gap)); }
  .hero__inner > .hero__seam { grid-row: 3; }
}

@container arc (max-width: 809px) {
  .hero__heading { grid-column: 1 / -1; gap: var(--space-5); margin-bottom: var(--space-5); }
  .hero__aside { grid-column: 1 / -1; gap: var(--space-5); margin-bottom: var(--space-7); }
}


/* ---------- Zoom-through stage (zoom.js) ----------
   .zoom--on is added by zoom.js (not with reduced motion). The stage pins for
   --zoom-travel of scrolling while the hero flies through the O of ARCOVIA
   and the statement's words light up; then the page carries on. */
.zoom--on {
  --zoom-travel: 280vh;   /* the zoom starts with the first scroll, so it needs less room */
  position: relative;
  height: calc(100vh + var(--zoom-travel));
}
.zoom--on .zoom__stage {
  position: sticky;
  top: 0;
  height: 100vh;
  overflow: hidden;
}
.zoom--on .zoom__stage > .hero,
.zoom--on .zoom__stage > .statement {
  position: absolute;
  inset: 0;
  min-height: 0;
}
.zoom--on .hero { z-index: 2; }
/* The hero's own grid fills the stage (its min-height would otherwise collapse) */
.zoom--on .hero__inner { min-height: 100%; }
/* While zooming, the hole in the slab must show the statement, not the fallback background */
.hero--zooming { background: none; }


/* ==========================================================================
   SECTION: statement — Home, block 2
   A pure white room, seen through the hole burnt in the O of ARCOVIA
   (zoom.js), holding the brief's statement set like an editorial page:
   large regular type across the full grid, with a deep first-line indent. As you scroll the text
   writes itself in, letter by letter, with a soft fading front.
   "Spreadsheets validate data," stays grey on purpose.
   Uses shared tokens from styles.css.
   ========================================================================== */

.statement {
  --st-ink: var(--color-ink);
  --st-soft: #9e9e9e;        /* "Spreadsheets validate data," */
  position: relative;
  display: grid;
  align-items: center;
  min-height: 100vh;
  padding: var(--space-10) var(--gutter);
  /* Pure white: the light you see through the O */
  background: #ffffff;
  color: var(--st-ink);
  overflow: hidden;
}

/* On the page grid, lined up with the hero headline */
.statement__inner {
  width: 100%;
  max-width: calc(var(--container-max) - 2 * var(--gutter));
  margin-inline: auto;
  transform-origin: 30% 50%;
  /* one column of the 12-column grid, plus its gap */
  --col: calc((100% - 11 * var(--grid-gap)) / 12 + var(--grid-gap));
}

.statement__text {
  /* Full width of the page grid, so the right margin matches the left. The size is a share of
     the grid's width, so the lines break the same way at every desktop width. */
  font-size: calc((min(100cqw, var(--container-max)) - 2 * var(--gutter)) * 0.0445);
  font-weight: var(--weight-book);
  line-height: 1.12;
  letter-spacing: -0.025em;
  /* The editorial indent: the first line starts three columns in */
  text-indent: calc(var(--col) * 3);
}

.statement .w { white-space: nowrap; }
.statement__pale { color: var(--st-soft); }

/* With zoom.js each letter starts invisible; its opacity is set as you scroll */
.statement [data-reveal].is-split .c { opacity: 0; }

@container arc (max-width: 1199px) {
  .statement__text { font-size: 44px; }
}
@container arc (max-width: 809px) {
  .statement__text { font-size: 30px; line-height: 1.16; text-indent: calc(var(--col) * 2); }
}

/* ==========================================================================
   Framer port additions (everything above is unchanged from the HTML site)
   - ARCOVIA before the script fits it (the first paint) and on the Framer canvas,
     where scripts never run: sized at the share of the grid width the fit settles
     on (Montserrat 500), instead of 18vw, so it neither jumps nor overflows.
   - On the canvas, vw is the editor window, not the frame: there the widths come
     from the component itself (cqw), and the load-in animation is off so
     thumbnails never catch the text mid-fade.
   ========================================================================== */
.hero { --wordmark-fit: calc((min(100cqw, var(--container-max)) - 2 * var(--gutter)) * 0.2038); }
.hero__wordmark { font-size: var(--wordmark-size, var(--wordmark-fit)); }
.hero__inner { padding-bottom: calc(var(--wordmark-visible, calc(var(--wordmark-fit) * 0.6)) + var(--space-6)); }
.arc-hero[data-static] { container-type: inline-size; }
.arc-hero[data-static] .hero { --wordmark-fit: calc((min(100cqw, var(--container-max)) - 2 * var(--gutter)) * 0.2038); }
.arc-hero[data-static] [data-rise] { animation: none; }
@container arc (min-width: 1200px) {
  .arc-hero[data-static] .statement__text { font-size: calc((min(100cqw, var(--container-max)) - 2 * var(--gutter)) * 0.0445); }
}
`

interface PathOption {
    title: string
    line: string
    link: string
}

interface Props {
    chip: string
    titleLine1: string
    titleLine2: string
    lede: string
    noBreak: string
    pickerTitle: string
    buttonLabel: string
    founders: PathOption
    investors: PathOption
    institutions: PathOption
    wordmark: string
    statementTitle: string
    statementBefore: string
    statementPale: string
    statementAfter: string
    style?: React.CSSProperties
}

const DEFAULTS: Props = {
    chip: "Independent capital markets advisory",
    titleLine1: "Where Capital",
    titleLine2: "Meets Conviction",
    lede: "For growth-stage founders, funds and foundations raising $5M–$500M+.",
    noBreak: "$5M–$500M+",
    pickerTitle: "Who are you?",
    buttonLabel: "Choose your path",
    founders: { title: "I’m raising capital", line: "Founders and funds raising $5M–$500M+", link: "/what-we-do#founders" },
    investors: { title: "I’m an investor", line: "Family offices, VCs, funds and LPs", link: "/what-we-do#investors" },
    institutions: { title: "I represent an institution", line: "Institutions and sovereign capital", link: "/what-we-do#institutions" },
    wordmark: "ARCOVIA",
    statementTitle: "Why story moves capital",
    statementBefore: "Today’s markets are flooded with funding but starved for differentiation.",
    statementPale: "Spreadsheets validate data,",
    statementAfter: "but only stories inspire action. Arcovia combines the science of financial stewardship with the art of narrative design, building investor conviction long before a term sheet is signed.",
}

/** The path icons stay fixed per position (the user's duotone icons in the sprite) */
const PATH_ICONS = ["icon-raise", "icon-invest", "icon-institution"]

/** "/team" and "https://…" pass through; Framer link values pass through too */
const href = (v: string | undefined) => v || "#"

/** Keeps one phrase (the "$5M–$500M+" range) on one line, as <span class="nowrap"> did in the HTML */
function withNoBreak(text: string, phrase: string): React.ReactNode {
    const i = phrase ? text.indexOf(phrase) : -1
    if (i < 0) return text
    return (
        <>
            {text.slice(0, i)}
            <span className="nowrap">{phrase}</span>
            {text.slice(i + phrase.length)}
        </>
    )
}

const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")

/**
 * The statement as HTML: the script wraps every letter in a span to write it in,
 * so React hands this paragraph over as a whole instead of managing its text nodes.
 */
function statementHTML(before: string, pale: string, after: string) {
    return [esc(before || ""), pale ? '<span class="statement__pale">' + esc(pale) + "</span>" : "", esc(after || "")].filter(Boolean).join(" ")
}

/**
 * @framerSupportedLayoutWidth any-prefer-fixed
 * @framerSupportedLayoutHeight auto
 */
export default function ArcoviaHero(incoming: Partial<Props>) {
    const p = { ...DEFAULTS, ...incoming }
    const paths = [
        { ...DEFAULTS.founders, ...p.founders },
        { ...DEFAULTS.investors, ...p.investors },
        { ...DEFAULTS.institutions, ...p.institutions },
    ]
    const ref = React.useRef<HTMLDivElement>(null)
    const uid = React.useId().replace(/:/g, "")
    const ids = { title: uid + "-hero-title", options: uid + "-path-options", pathTitle: uid + "-path-title", statement: uid + "-statement-title" }
    const isStatic = isStaticRender()
    const html = statementHTML(p.statementBefore, p.statementPale, p.statementAfter)

    // Copy changes move the carvings and the O: start the script again on the new layout
    const copyKey = JSON.stringify([p.chip, p.titleLine1, p.titleLine2, p.lede, p.noBreak, p.buttonLabel, p.wordmark, html])
    useArcoviaScript(ref, initHero, [copyKey])

    return (
        <div className="arc arc-hero" ref={ref} style={{ ...p.style }} data-static={isStatic ? "" : undefined}>
            {baseStyle()}
            {cssTag("hero", HERO_CSS)}
            {sprite()}
            {/* Hero and statement share one scroll stage: scrolling opens the O of ARCOVIA
                into a hole through the concrete and flies through it into the statement.
                Without the script (canvas) or with reduced motion they simply stack. */}
            <div className="zoom" data-zoom="">
                <div className="zoom__stage">
                    <section className="hero" data-hero="" aria-labelledby={ids.title}>
                        <canvas className="hero__canvas" aria-hidden="true"></canvas>
                        <canvas className="hero__debris" aria-hidden="true"></canvas>

                        <div className="hero__inner container">
                            {/* Heading and path picker share a row, aligned at the bottom: the button sits on the headline's baseline */}
                            <div className="hero__content">
                                <div className="hero__heading" data-rise="" data-zoom-fade="" style={{ ["--rise" as any]: 0 }}>
                                    <p className="chip">{p.chip}</p>
                                    <h1 className="hero__title" id={ids.title}>
                                        {p.titleLine1}
                                        <br /> {p.titleLine2}
                                    </h1>
                                </div>

                                <div className="hero__aside" data-rise="" data-zoom-fade="" style={{ ["--rise" as any]: 1 }}>
                                    <p className="hero__lede">{withNoBreak(p.lede, p.noBreak)}</p>

                                    {/* Path picker: one button; the three paths open above it, each with
                                        an icon, a title, one line and a chevron. ?icons=none previews it without icons. */}
                                    <div className="path-picker" data-path-picker="">
                                        <div className="path-picker__panel" id={ids.options} role="group" aria-labelledby={ids.pathTitle} aria-hidden="true">
                                            {/* set in capitals by CSS */}
                                            <p className="path-picker__title" id={ids.pathTitle}>{p.pickerTitle}</p>
                                            {paths.map((o, i) => (
                                                <a className="path-picker__option" href={href(o.link)} key={i}>
                                                    <span className="path-picker__icon" aria-hidden="true">
                                                        <svg><use href={"#" + PATH_ICONS[i]} /></svg>
                                                    </span>
                                                    <span className="path-picker__label">{o.title}</span>
                                                    <span className="path-picker__meta">{withNoBreak(o.line, p.noBreak)}</span>
                                                    <svg className="path-picker__arrow" aria-hidden="true"><use href="#icon-chevron-right" /></svg>
                                                </a>
                                            ))}
                                        </div>
                                        <button className="btn btn--primary path-picker__trigger" type="button" aria-expanded="false" aria-controls={ids.options}>
                                            {p.buttonLabel}
                                            {/* Up-down chevrons: "pick one of several". Inline so each chevron can turn: inward = close */}
                                            <svg className="btn__icon path-picker__chevrons" viewBox="0 0 16 16" aria-hidden="true">
                                                <path className="path-picker__chev path-picker__chev--up" d="M5 6.25 8 3.25l3 3" />
                                                <path className="path-picker__chev path-picker__chev--down" d="M5 9.75l3 3 3-3" />
                                            </svg>
                                        </button>
                                    </div>
                                </div>
                            </div>

                            <div className="seam hero__seam" data-carve="seam" aria-hidden="true">
                                <span className="seam__hole seam__hole--start" data-carve="hole"></span>
                                <span className="seam__hole seam__hole--end" data-carve="hole"></span>
                            </div>
                        </div>

                        <div className="hero__wordmark-wrap container" aria-hidden="true">
                            <span className="hero__wordmark" data-carve="text">{p.wordmark}</span>
                        </div>
                    </section>

                    {/* Statement (Home block 2). Seen through the O, then its words write themselves in as you scroll. */}
                    <section className="statement" data-statement="" aria-labelledby={ids.statement}>
                        <div className="statement__inner">
                            <h2 className="visually-hidden" id={ids.statement}>{p.statementTitle}</h2>
                            <p className="statement__text" data-reveal="" dangerouslySetInnerHTML={{ __html: html }} />
                        </div>
                    </section>
                </div>
            </div>
        </div>
    )
}

/* ---------- Behaviour ---------- */
function initHero(host: HTMLElement, life: Life) {
    initPicker(host, life)

    const hero = host.querySelector<HTMLElement>("[data-hero]")
    if (!hero) return

    /* main.js, Hero: fit the carved ARCOVIA to the container width */
    const mark = hero.querySelector<HTMLElement>(".hero__wordmark")
    const wrap = hero.querySelector<HTMLElement>(".hero__wordmark-wrap")
    function fitWordmark() {
        if (!mark || !wrap) return
        const cs = getComputedStyle(wrap)
        const target = wrap.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight)
        mark.style.fontSize = "100px"
        // offsetWidth ignores transforms, so this stays right during the zoom-through
        const w = mark.offsetWidth - 0.035 * 100
        const size = Math.floor(((100 * target) / w) * 100) / 100
        mark.style.fontSize = ""
        hero!.style.setProperty("--wordmark-size", size + "px")
        hero!.style.setProperty("--wordmark-visible", Math.round(size * 0.6) + "px")
    }
    fitWordmark()
    if (document.fonts && document.fonts.ready)
        document.fonts.ready.then(() => {
            if (!life.dead) fitWordmark()
        })
    let fitQueued = false
    life.on(window, "resize", () => {
        if (fitQueued) return
        fitQueued = true
        life.raf(() => {
            fitQueued = false
            fitWordmark()
        })
    })
    life.add(() => {
        hero.style.removeProperty("--wordmark-size")
        hero.style.removeProperty("--wordmark-visible")
    })

    /* Live concrete. Review switch: ?burn=mono burns with white heat only, no fire colours */
    const mono = /[?&]burn=mono\b/.test(location.search)
    const concrete = new ConcreteSurface(hero, { canvas: ".hero__canvas", burnWarmth: mono ? 0 : 1, texture: ASSETS.concrete, scope: host })
    life.add(() => concrete.destroy())
    const concreteReady = concrete.init()

    const zoom = initZoom(host, life, () => (concrete.ready ? concrete : null))

    /* The component can mount long after page load, before or after Montserrat
       arrives: whenever a font finishes loading, fit ARCOVIA again and re-carve */
    if (document.fonts && (document.fonts as any).addEventListener) {
        life.on(document.fonts as any, "loadingdone", () => {
            fitWordmark()
            concrete.queueLayout()
            zoom.remeasure()
        })
    }
    // The slab loads its texture asynchronously; redraw the zoom once it's ready
    concreteReady.then((ok) => {
        if (ok && !life.dead) zoom.remeasure()
    })
}

/* ---------- main.js: path picker, one button, three paths ---------- */
function initPicker(host: HTMLElement, life: Life) {
    // Review switch: ?icons=none shows the menu without icons
    const pickerIcons = (location.search.match(/[?&]icons=(\w+)/) || [])[1]
    host.querySelectorAll<HTMLElement>("[data-path-picker]").forEach((picker) => {
        if (pickerIcons) picker.setAttribute("data-icons", pickerIcons)
        const trigger = picker.querySelector<HTMLElement>(".path-picker__trigger")
        const panel = picker.querySelector<HTMLElement>(".path-picker__panel")
        if (!trigger || !panel) return
        const options = panel.querySelectorAll<HTMLElement>(".path-picker__option")

        function set(open: boolean, focusFirst?: boolean) {
            picker.classList.toggle("is-open", open)
            trigger!.setAttribute("aria-expanded", String(open))
            panel!.setAttribute("aria-hidden", String(!open))
            options.forEach((a) => {
                a.tabIndex = open ? 0 : -1
            })
            if (open && focusFirst && options[0]) options[0].focus()
        }

        life.on(trigger, "click", (e: MouseEvent) => {
            // Keyboard and screen-reader users land on the first path; mouse users stay on the button
            set(!picker.classList.contains("is-open"), e.detail === 0)
        })
        life.on(picker, "keydown", (e: KeyboardEvent) => {
            if (e.key === "Escape" && picker.classList.contains("is-open")) {
                set(false)
                trigger.focus()
            }
            if (e.key === "ArrowDown" || e.key === "ArrowUp") {
                if (!picker.classList.contains("is-open")) return
                e.preventDefault()
                const list = Array.prototype.slice.call(options) as HTMLElement[]
                const i = list.indexOf(document.activeElement as HTMLElement)
                const next = e.key === "ArrowDown" ? (i + 1) % list.length : (i - 1 + list.length) % list.length
                list[next].focus()
            }
        })
        life.on(document, "pointerdown", (e: PointerEvent) => {
            if (!picker.contains(e.target as Node)) set(false)
        })
        life.on(picker, "focusout", (e: FocusEvent) => {
            if (e.relatedTarget && !picker.contains(e.relatedTarget as Node)) set(false)
        })
        set(false)
        life.add(() => {
            set(false)
            options.forEach((a) => a.removeAttribute("tabindex"))
            picker.removeAttribute("data-icons")
        })
    })
}

/* ---------- zoom.js: the zoom-through, hero → statement ----------
   Scroll progress p (0 → 1) over the pinned stage:
     0.00–0.12  hero text fades and lifts; the zoom starts at the same time
     0.03–0.30  the drill bores into the O: a small point at the centre that widens to
                fill the O (0.035–0.24) while it deepens; chips and dust fly
     0.28–0.40  it punches through: light breaks through the bottom of the bore
     0.00–0.60  the camera moves in, down the bore and out through the back
     0.00–0.60  zoom: the O drifts to the centre and the view flies through
     0.30–0.58  the statement rises from below into place (depth)
     0.36–0.96  its text writes itself in, letter by letter
   (?fx=break shows the earlier version, where the concrete cracks and breaks away.) */
function initZoom(host: HTMLElement, life: Life, surface: () => ConcreteSurface | null) {
    const none = { remeasure() {} }
    const zoom = host.querySelector<HTMLElement>("[data-zoom]")
    if (!zoom) return none
    const hero = zoom.querySelector<HTMLElement>("[data-hero]")
    const statement = zoom.querySelector<HTMLElement>("[data-statement]")
    const mark = hero && hero.querySelector<HTMLElement>(".hero__wordmark")
    if (!hero || !statement || !mark) return none

    const fades = hero.querySelectorAll<HTMLElement>("[data-zoom-fade]")
    const inner = statement.querySelector<HTMLElement>(".statement__inner")
    const reveal = statement.querySelector<HTMLElement>("[data-reveal]")
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)")
    const revealHTML = reveal ? reveal.innerHTML : ""
    const chars = splitChars(reveal)
    const FX = /[?&]fx=break\b/.test(location.search) ? "break" : "drill"
    const DRILL_K = 1.2 // slab thickness, relative to the camera's starting distance

    /* ---------- Debris: chips and dust thrown out by the drill ----------
       Drawn on a 2D canvas over the slab. Every particle's state comes from the scroll
       position alone, so scrolling back up pulls the chips back in. */
    const debris = hero.querySelector<HTMLCanvasElement>(".hero__debris")
    const dctx = debris && debris.getContext ? debris.getContext("2d") : null
    const particles = (function () {
        let seed = 7
        function rnd() {
            seed = (seed * 16807) % 2147483647
            return (seed - 1) / 2147483646
        }
        function chip(launch: number, burst: boolean) {
            const verts: number[] = [],
                n = 5 + Math.floor(rnd() * 4)
            for (let i = 0; i < n; i++) verts.push(0.35 + rnd() * 0.65)
            return {
                kind: "chip", launch: launch, life: 0.045 + rnd() * 0.04,
                ang: rnd() * Math.PI * 2, from: burst ? rnd() * 0.4 : 0.55 + rnd() * 0.45,
                speed: burst ? 1.4 + rnd() * 1.4 : 0.6 + rnd() * 1.0, fall: 0.4 + rnd() * 0.9,
                size: burst ? 2.5 + rnd() * 5 : 1.2 + rnd() * 3, grow: burst ? 3.5 : 1.6,
                rot: rnd() * 6.28, spin: (rnd() - 0.5) * 14, verts: verts,
                tone: Math.round(140 + rnd() * 70),
            }
        }
        const out: any[] = []
        let i: number
        for (i = 0; i < 80; i++) out.push(chip(0.05 + rnd() * 0.24, false)) // while drilling
        for (i = 0; i < 34; i++) out.push(chip(0.28 + rnd() * 0.06, true)) // the punch-through
        for (i = 0; i < 110; i++)
            out.push({
                // fine dust
                kind: "dust", launch: 0.04 + rnd() * 0.3, life: 0.08 + rnd() * 0.08,
                ang: rnd() * Math.PI * 2, from: 0.6 + rnd() * 0.5, speed: 0.3 + rnd() * 0.7,
                fall: -0.1 + rnd() * 0.3, size: 0.7 + rnd() * 1.3, tone: Math.round(200 + rnd() * 40),
            })
        for (i = 0; i < 10; i++)
            out.push({
                // puffs of dust at the lip
                kind: "puff", launch: 0.04 + rnd() * 0.26, life: 0.1 + rnd() * 0.06,
                ang: rnd() * Math.PI * 2, from: 0.9 + rnd() * 0.3, speed: 0.2 + rnd() * 0.3, fall: -0.15, size: 40 + rnd() * 50,
            })
        return out
    })()

    function drawDebris(p: number, vw: number, vh: number, ox: number, oy: number, s: number, boreR: number) {
        if (!dctx || !debris) return
        const dpr = Math.min(window.devicePixelRatio || 1, 2)
        if (debris.width !== Math.round(vw * dpr) || debris.height !== Math.round(vh * dpr)) {
            debris.width = Math.round(vw * dpr)
            debris.height = Math.round(vh * dpr)
        }
        dctx.setTransform(1, 0, 0, 1, 0, 0)
        dctx.clearRect(0, 0, debris.width, debris.height)
        if (p < 0.04 || p > 0.52) return
        dctx.setTransform(dpr, 0, 0, dpr, 0, 0)
        const rim = boreR * Math.min(geo!.rx, geo!.ry) * Math.min(s, 40) // the bore's radius on screen
        particles.forEach((q) => {
            const age = (p - q.launch) / q.life
            if (age <= 0 || age >= 1) return
            const fade = Math.min(1, age / 0.08) * (1 - Math.max(0, (age - 0.6) / 0.4))
            const dist = rim * q.from + age * q.speed * (110 + rim * 0.6)
            const x = ox + Math.cos(q.ang) * dist
            const y = oy + Math.sin(q.ang) * dist + age * age * q.fall * 160
            if (q.kind === "puff") {
                const r = q.size * (0.6 + age * 1.6) * Math.sqrt(Math.min(s, 6))
                const g = dctx.createRadialGradient(x, y, 0, x, y, r)
                g.addColorStop(0, "rgba(236,236,234," + (0.38 * fade).toFixed(3) + ")")
                g.addColorStop(1, "rgba(236,236,234,0)")
                dctx.fillStyle = g
                dctx.fillRect(x - r, y - r, r * 2, r * 2)
                return
            }
            const size = q.size * (1 + q.grow * age) * Math.sqrt(Math.min(s, 6))
            dctx.globalAlpha = fade * (q.kind === "dust" ? 0.55 : 1)
            dctx.fillStyle = "rgb(" + q.tone + "," + q.tone + "," + (q.tone - 2) + ")"
            if (q.kind === "dust") {
                dctx.beginPath()
                dctx.arc(x, y, size, 0, Math.PI * 2)
                dctx.fill()
            } else {
                // A chip of concrete: a jagged little fragment, tumbling, its far side in shadow
                const rot = q.rot + age * q.spin
                const path = function (ox2: number, oy2: number, k: number) {
                    dctx.beginPath()
                    q.verts.forEach((v: number, i: number) => {
                        const a = rot + (i / q.verts.length) * Math.PI * 2
                        const px = x + ox2 + Math.cos(a) * size * v * k,
                            py = y + oy2 + Math.sin(a) * size * v * k
                        if (i === 0) dctx.moveTo(px, py)
                        else dctx.lineTo(px, py)
                    })
                    dctx.closePath()
                }
                const base = dctx.globalAlpha
                dctx.globalAlpha = base * 0.22 // a faint blur of motion behind it
                dctx.fillStyle = "rgb(120,120,118)"
                path(-Math.cos(q.ang) * size * 1.4, -Math.sin(q.ang) * size * 1.4, 0.8)
                dctx.fill()
                dctx.globalAlpha = base
                dctx.fillStyle = "rgb(" + (q.tone - 55) + "," + (q.tone - 55) + "," + (q.tone - 57) + ")"
                path(size * 0.18, size * 0.22, 1) // shadow side
                dctx.fill()
                dctx.fillStyle = "rgb(" + q.tone + "," + q.tone + "," + (q.tone - 2) + ")"
                path(0, 0, 0.9) // lit face
                dctx.fill()
            }
        })
        dctx.globalAlpha = 1
    }

    let geo: { cx: number; cy: number; rx: number; ry: number } | null = null // the O's counter, in hero coordinates
    let lastP = -1
    let lastSurface: ConcreteSurface | null = null
    let queued = false

    function clamp(x: number, a: number, b: number) {
        return x < a ? a : x > b ? b : x
    }
    function smooth(a: number, b: number, x: number) {
        const t = clamp((x - a) / (b - a), 0, 1)
        return t * t * (3 - 2 * t)
    }
    function ramp(a: number, b: number, x: number) {
        return clamp((x - a) / (b - a), 0, 1)
    }

    /* Find the counter (the inside) of the O, in hero coordinates.
       The glyph is drawn in a canvas to find its inner edges, then placed where
       the browser laid out the O in the wordmark. */
    function measure() {
        const text = mark!.firstChild as Text | null
        const i = text && text.nodeType === 3 ? text.data.indexOf("O") : -1
        if (!text || i < 0) return null

        const cs = getComputedStyle(mark!)
        const size = parseFloat(cs.fontSize)
        const base = 200
        const c = document.createElement("canvas")
        let ctx = c.getContext("2d")!
        const font = cs.fontWeight + " " + base + "px " + cs.fontFamily
        ctx.font = font
        const m = ctx.measureText("O")
        const pad = 20
        c.width = Math.ceil(m.actualBoundingBoxLeft + m.actualBoundingBoxRight) + pad * 2
        c.height = Math.ceil(m.actualBoundingBoxAscent + m.actualBoundingBoxDescent) + pad * 2
        ctx = c.getContext("2d")!
        ctx.font = font
        const x0 = pad + m.actualBoundingBoxLeft
        const y0 = pad + m.actualBoundingBoxAscent
        ctx.fillText("O", x0, y0)
        const data = ctx.getImageData(0, 0, c.width, c.height).data
        const a = function (x: number, y: number) {
            return data[(y * c.width + x) * 4 + 3]
        }

        const gx = Math.round(x0 + (m.actualBoundingBoxRight - m.actualBoundingBoxLeft) / 2)
        const gy = Math.round(y0 - (m.actualBoundingBoxAscent - m.actualBoundingBoxDescent) / 2)
        let x: number, y: number
        for (x = 0; x < c.width && a(x, gy) < 128; x++);
        for (; x < c.width && a(x, gy) >= 128; x++);
        const inL = x
        for (x = c.width - 1; x > 0 && a(x, gy) < 128; x--);
        for (; x > 0 && a(x, gy) >= 128; x--);
        const inR = x
        for (y = 0; y < c.height && a(gx, y) < 128; y++);
        for (; y < c.height && a(gx, y) >= 128; y++);
        const inT = y
        for (y = c.height - 1; y > 0 && a(gx, y) < 128; y--);
        for (; y > 0 && a(gx, y) >= 128; y--);
        const inB = y

        const k = size / base
        const range = document.createRange()
        range.setStart(text, i)
        range.setEnd(text, i + 1)
        const r = range.getBoundingClientRect()
        const h = hero!.getBoundingClientRect()
        const asc = (m.fontBoundingBoxAscent || base * 0.968) * k
        const desc = (m.fontBoundingBoxDescent || base * 0.251) * k
        const baseline = r.top - h.top + (r.height - (asc + desc)) / 2 + asc

        return {
            cx: r.left - h.left + ((inL + inR) / 2 - x0) * k,
            cy: baseline + ((inT + inB) / 2 - y0) * k,
            rx: ((inR - inL) / 2) * k,
            ry: ((inB - inT) / 2) * k,
        }
    }

    function clearDebris() {
        if (dctx && debris) dctx.clearRect(0, 0, debris.width, debris.height)
    }

    function reset() {
        hero!.classList.remove("hero--zooming")
        hero!.style.opacity = ""
        hero!.style.visibility = ""
        clearDebris()
        fades.forEach((el) => {
            el.style.opacity = ""
            el.style.transform = ""
        })
        if (inner) {
            inner.style.transform = ""
            inner.style.opacity = ""
        }
        chars.forEach((c) => {
            c.q = -1
            paintChar(c, 1)
        })
        const sfc = surface()
        if (sfc) {
            sfc.setPaused(false)
            sfc.setView({ ox: 0, oy: 0, tx: 0, ty: 0, s: 1, burn: null, shatter: null, drill: null })
        }
    }

    function update() {
        queued = false
        if (!zoom!.classList.contains("zoom--on")) return
        const vw = document.documentElement.clientWidth
        const vh = window.innerHeight
        const rect = zoom!.getBoundingClientRect()
        const travel = rect.height - vh
        const p = travel > 0 ? clamp(-rect.top / travel, 0, 1) : 0
        const sfc = surface()
        if (p === lastP && sfc === lastSurface) return
        lastP = p
        lastSurface = sfc
        if (!geo) geo = measure()
        if (!geo) return

        // 1. Hero text lifts away, while the wordmark already starts to grow (below)
        const f = smooth(0, 0.12, p)
        fades.forEach((el) => {
            el.style.opacity = f ? String(1 - f) : ""
            el.style.transform = f ? "translateY(" + (-28 * f).toFixed(1) + "px)" : ""
        })

        const t = smooth(0, 0.42, p) // the O drifts to the centre of the screen
        const tx = (vw / 2 - geo.cx) * t,
            ty = (vh / 2 - geo.cy) * t
        const z = ramp(0, 0.6, p)
        const through = z >= 1
        hero!.classList.toggle("hero--zooming", p > 0)
        hero!.style.visibility = through ? "hidden" : ""
        const view: ConcreteView = { ox: geo.cx, oy: geo.cy, tx: tx, ty: ty, s: 1 }
        let debrisArgs: [number, number, number, number, number, number, number] | null = null

        if (FX === "break") {
            // 2. The O cracks, light leaks through, and the concrete breaks away, centre first
            const BREAK_END = 5.2,
                HOLE_MIN = 1.9
            const crack = Math.pow(ramp(0.02, 0.36, p), 0.85) * 3.2
            const brk = Math.pow(ramp(0.12, 0.54, p), 1.15) * BREAK_END
            const halfDiag = Math.sqrt(vw * vw + vh * vh) / 2
            const scaleEnd = (halfDiag * 1.08) / (HOLE_MIN * Math.min(geo.rx, geo.ry))
            view.s = Math.pow(scaleEnd, Math.pow(z, 1.6))
            view.shatter = crack > 0 ? { cx: geo.cx, cy: geo.cy, rx: geo.rx, ry: geo.ry, crack: crack, brk: brk, light: smooth(0.08, 0.2, p) } : null
        } else {
            // 2. A drill bores into the O, punches through, and the camera flies down the bore.
            //    The camera moves at a steady pace in depth, so the zoom is true perspective:
            //    slow at first, then the rim rushes past and the light at the far end opens up.
            const cam = 1 - (1 + DRILL_K) * Math.pow(z, 1.6)
            const depth = DRILL_K * smooth(0.03, 0.3, p)
            // The bore starts as a small drill point at the centre and widens until it fills the O
            const boreR = 0.97 * (0.1 + 0.9 * smooth(0.035, 0.24, p))
            view.s = cam > 0.02 ? 1 / cam : 50
            view.drill =
                depth > 0
                    ? {
                          cx: geo.cx, cy: geo.cy, rx: geo.rx, ry: geo.ry,
                          cam: cam, depth: depth, light: smooth(0.28, 0.4, p),
                          dust: smooth(0.03, 0.08, p) * (1 - smooth(0.36, 0.5, p)),
                          k: DRILL_K, r: boreR, spin: p * 60, thick: 2.2,
                      }
                    : null
            debrisArgs = [p, vw, vh, geo.cx + tx, geo.cy + ty, view.s, boreR]
        }

        if (sfc) {
            sfc.setPaused(through)
            if (!through) sfc.setView(view)
            if (debrisArgs) {
                try {
                    drawDebris.apply(null, debrisArgs)
                } catch (e) {
                    /* debris is decoration only */
                }
            }
        } else {
            // No WebGL: nothing to drill through, so the hero simply fades away
            hero!.style.opacity = String(1 - smooth(0.1, 0.45, p))
        }

        // 4. The statement rises from below into place after half the zoom, for depth
        const rise = smooth(0.3, 0.58, p)
        if (inner) {
            inner.style.transform = rise < 1 ? "translate3d(0," + ((1 - rise) * 42).toFixed(2) + "vh,0) scale(" + (0.94 + 0.06 * rise).toFixed(4) + ")" : ""
            inner.style.opacity = rise < 1 ? (0.25 + 0.75 * rise).toFixed(3) : ""
        }

        // 5. The text writes itself in, letter by letter, as the room arrives
        const front = ramp(0.36, 0.96, p) * (chars.length + FRONT)
        chars.forEach((c, i) => {
            paintChar(c, (front - i) / FRONT)
        })
    }

    function queue() {
        if (queued) return
        queued = true
        life.raf(update)
    }

    function setMode() {
        const on = !reduced.matches
        zoom!.classList.toggle("zoom--on", on)
        geo = null
        lastP = -1
        if (on) queue()
        else reset()
    }

    function remeasure() {
        geo = null
        lastP = -1
        queue()
    }

    life.on(window, "scroll", queue, { passive: true })
    life.on(window, "resize", remeasure)
    if (typeof reduced.addEventListener === "function") life.on(reduced, "change", setMode)
    // The O is measured from the real font, so wait for it
    if (document.fonts && document.fonts.ready)
        document.fonts.ready.then(() => {
            if (!life.dead) remeasure()
        })
    setMode()

    // Unmount: put the DOM back the way React rendered it
    life.add(() => {
        zoom.classList.remove("zoom--on")
        hero.classList.remove("hero--zooming")
        hero.style.opacity = ""
        hero.style.visibility = ""
        clearDebris()
        fades.forEach((el) => {
            el.style.opacity = ""
            el.style.transform = ""
        })
        if (inner) {
            inner.style.transform = ""
            inner.style.opacity = ""
        }
        if (reveal) {
            // Unless React has already put new copy in, take the letters back out of their spans
            if (reveal.querySelector(".c")) reveal.innerHTML = revealHTML
            reveal.classList.remove("is-split")
        }
    })

    return { remeasure }
}

/* Wrap every letter of the statement in a span (inside a span per word, so
   words never break), remembering which belong to the pale phrase */
interface Char {
    el: HTMLElement
    pale: boolean
    q: number
}
function splitChars(el: HTMLElement | null): Char[] {
    const out: Char[] = []
    if (!el) return out
    const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT)
    const nodes: Text[] = []
    while (walker.nextNode()) nodes.push(walker.currentNode as Text)
    nodes.forEach((node) => {
        const parent = node.parentNode as Element
        const pale = !!(parent.closest && parent.closest(".statement__pale"))
        const frag = document.createDocumentFragment()
        node.data.split(/(\s+)/).forEach((part) => {
            if (!part) return
            if (/^\s+$/.test(part)) {
                frag.appendChild(document.createTextNode(part))
                return
            }
            const word = document.createElement("span")
            word.className = "w"
            Array.prototype.forEach.call(part, (ch: string) => {
                const span = document.createElement("span")
                span.className = "c"
                span.textContent = ch
                word.appendChild(span)
                out.push({ el: span, pale: pale, q: -1 })
            })
            frag.appendChild(word)
        })
        parent.replaceChild(frag, node)
    })
    el.classList.add("is-split")
    return out
}

/* One letter's state: invisible → fading in → solid. The front is soft, a few
   words wide, so the text seems to write itself rather than switch on. */
const FRONT = 28,
    STEPS = 24 // letters in the fading front; opacity steps
function paintChar(c: Char, v: number) {
    const q = v <= 0 ? 0 : v >= 1 ? STEPS : Math.min(STEPS - 1, Math.max(1, Math.round(v * STEPS)))
    if (q === c.q) return
    c.q = q
    c.el.style.opacity = q === STEPS ? "1" : Math.pow(q / STEPS, 1.4).toFixed(3)
}

addPropertyControls(ArcoviaHero, {
    chip: { type: ControlType.String, title: "Chip", defaultValue: DEFAULTS.chip },
    titleLine1: { type: ControlType.String, title: "Headline 1", defaultValue: DEFAULTS.titleLine1 },
    titleLine2: { type: ControlType.String, title: "Headline 2", defaultValue: DEFAULTS.titleLine2 },
    lede: { type: ControlType.String, title: "Lede", displayTextArea: true, defaultValue: DEFAULTS.lede },
    noBreak: { type: ControlType.String, title: "Keep together", description: "Never broken across lines (lede and path lines)", defaultValue: DEFAULTS.noBreak },
    buttonLabel: { type: ControlType.String, title: "Button", defaultValue: DEFAULTS.buttonLabel },
    pickerTitle: { type: ControlType.String, title: "Menu title", defaultValue: DEFAULTS.pickerTitle },
    founders: {
        type: ControlType.Object,
        title: "Path 1",
        controls: {
            title: { type: ControlType.String, title: "Title", defaultValue: DEFAULTS.founders.title },
            line: { type: ControlType.String, title: "Line", defaultValue: DEFAULTS.founders.line },
            link: { type: ControlType.Link, title: "Link", defaultValue: DEFAULTS.founders.link },
        },
    },
    investors: {
        type: ControlType.Object,
        title: "Path 2",
        controls: {
            title: { type: ControlType.String, title: "Title", defaultValue: DEFAULTS.investors.title },
            line: { type: ControlType.String, title: "Line", defaultValue: DEFAULTS.investors.line },
            link: { type: ControlType.Link, title: "Link", defaultValue: DEFAULTS.investors.link },
        },
    },
    institutions: {
        type: ControlType.Object,
        title: "Path 3",
        controls: {
            title: { type: ControlType.String, title: "Title", defaultValue: DEFAULTS.institutions.title },
            line: { type: ControlType.String, title: "Line", defaultValue: DEFAULTS.institutions.line },
            link: { type: ControlType.Link, title: "Link", defaultValue: DEFAULTS.institutions.link },
        },
    },
    wordmark: { type: ControlType.String, title: "Carved word", description: "Needs an O: the drill goes through it", defaultValue: DEFAULTS.wordmark },
    statementTitle: { type: ControlType.String, title: "Statement title", description: "For screen readers only", defaultValue: DEFAULTS.statementTitle },
    statementBefore: { type: ControlType.String, title: "Statement", displayTextArea: true, defaultValue: DEFAULTS.statementBefore },
    statementPale: { type: ControlType.String, title: "Pale phrase", defaultValue: DEFAULTS.statementPale },
    statementAfter: { type: ControlType.String, title: "Statement end", displayTextArea: true, defaultValue: DEFAULTS.statementAfter },
})
