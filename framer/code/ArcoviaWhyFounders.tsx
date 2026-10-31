/**
 * Arcovia: "Why founders choose Arcovia" (Home block 5, between the team and the map).
 *
 * After a reference the user sent (sunnybonnell.com speaking cards). A black
 * section with white stat cards; heading, chip and footnote in white. The stage
 * pins (position: sticky) for 360vh: the headline "Calm, precise and senior-led"
 * starts huge across the screen, its three lines staggered on the grid; the four
 * cards rise from below one at a time, 1.5x their size, into a stack in front of
 * it (each covers the last, whose figure still shows above it; older cards are
 * pushed up off the screen); then the stack spreads into a row while the cards
 * shrink to their normal size and the headline shrinks into place above it, one
 * line after the other, and the chip and footnote fade in. The settled layout is
 * the real page; the script only adds 2D transforms on top, so at rest nothing is
 * scaled and the text is native. Scrolling back up plays it in reverse.
 *
 * Desktop only (1200px and up), not with reduced motion and not on the Framer
 * canvas: there it is simply the settled layout. Keeps data-header-theme="dark",
 * so the header's type turns light over it. The Framer layer holding it must not
 * clip its content (the stage is sticky and the section grows by 360vh).
 * Ported from founders.js and sections/why-founders.css on main.
 */
import * as React from "react"
import { addPropertyControls, ControlType } from "framer"
import { baseStyle, cssTag, useArcoviaScript, type Life } from "./ArcoviaBase.tsx"

const WHY_FOUNDERS_CSS = `/* ==========================================================================
   SECTION: why-founders — Home, block 5 of the brief
   "Calm, precise and senior-led": four stat cards (figure, label, line)
   and a footnote. After the user's reference, founders.js pins the stage:
   the headline starts huge across the screen, the cards rise one at a time
   into a stack in front of it, each covering the last (whose figure still
   shows above it), then the stack spreads into a row while the headline
   shrinks into place above it as a normal heading. The cards are larger in
   the stack and shrink to their normal size as they settle.
   White cards on black (the user's choice); heading, chip and footnote in white.
   This file is the settled layout; founders.js only adds transforms on top.
   Uses shared tokens and the chip from styles.css.
   ========================================================================== */

.why-founders {
  --card-pad: 28px;
  --card-radius: var(--radius-l);
  --card-shade: rgba(21, 21, 21, 0.08);   /* veil over a card covered in the stack */
  position: relative;
  background: var(--color-black);
  color: var(--color-on-dark);
}

.why-founders__stage {
  padding-block: var(--space-10);
}

.why-founders__head {
  display: grid;
  justify-items: start;
  gap: var(--space-4);
  margin-bottom: var(--space-7);
}
.why-founders__chip { color: var(--color-on-dark); }

.why-founders__title {
  font-size: var(--fs-h2);
  font-weight: var(--weight-book);
  line-height: var(--lh-h2);
  letter-spacing: var(--ls-h2);
  color: var(--color-on-dark);
}
/* Each part of the headline moves on its own while it shrinks into place */
.why-founders__line {
  display: inline-block;
  transform-origin: 0 0;
}

.why-founders__cards {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: var(--grid-gap);
}

.why-founders__note {
  margin-top: var(--space-6);
  font-size: var(--fs-small);
  line-height: var(--lh-small);
  color: var(--color-on-dark);
}

/* ---------- Component: stat-card ---------- */
.stat-card {
  --shade: 0;
  position: relative;
  display: flex;
  flex-direction: column;
  aspect-ratio: 4 / 5;
  padding: var(--card-pad);
  border-radius: var(--card-radius);
  background: var(--color-white);
  /* On black the drop shadow only shows where a card lies over the one before, in the stack */
  box-shadow: var(--shadow-card);
  transform-origin: 0 0;
}
/* A card covered by the next one in the stack sinks back into shade */
.stat-card::after {
  content: "";
  position: absolute;
  inset: 0;
  border-radius: inherit;
  background: var(--card-shade);
  opacity: var(--shade);
  pointer-events: none;
}

.stat-card__figure {
  font-size: 60px;
  font-weight: var(--weight-book);
  line-height: 1;
  letter-spacing: -0.035em;
  color: var(--color-ink);
  white-space: nowrap;
}

.stat-card__label {
  max-width: 17em;
  margin-top: var(--space-4);
  font-size: var(--fs-body);
  font-weight: var(--weight-medium);
  line-height: 1.4;
  color: var(--color-ink);
}

.stat-card__line {
  margin-top: auto;
  padding-top: var(--space-5);
  font-size: 15px;
  line-height: 1.55;
  color: var(--color-text-muted);
}

/* Once settled, a card lifts a little under the cursor */
@media (hover: hover) {
  .why-founders.is-settled .stat-card,
  .why-founders:not(.why-founders--staged) .stat-card {
    transition: translate var(--dur-slow) var(--ease-out);
  }
  .why-founders.is-settled .stat-card:hover,
  .why-founders:not(.why-founders--staged) .stat-card:hover {
    translate: 0 -4px;
  }
}

/* ---------- Pinned stage (founders.js adds .why-founders--staged on desktop) ----------
   The section grows by --founders-travel of scrolling while the stage stays put.
   The top padding keeps the settled heading clear of the small header bar. */
.why-founders--staged {
  --founders-travel: 360vh;
  height: calc(100vh + var(--founders-travel));
}
.why-founders--staged .why-founders__stage {
  position: sticky;
  top: 0;
  display: flex;
  align-items: center;
  height: 100vh;
  padding-block: calc(var(--mh-labels) + var(--mh-compact)) var(--space-5);
  overflow: hidden;
  overflow: clip;
}
.why-founders--staged .why-founders__inner { width: 100%; }

/* ---------- Tablet and phone: the settled layout only (not reviewed yet) ---------- */
@media (max-width: 1199px) {
  .why-founders__cards { grid-template-columns: repeat(2, minmax(0, 1fr)); }
  .stat-card { aspect-ratio: auto; min-height: 320px; }
}
@media (max-width: 809px) {
  .why-founders__cards { grid-template-columns: 1fr; }
  .stat-card { min-height: 0; }
  .stat-card__figure { font-size: 48px; }
}

/* Framer: every Arcovia component renders the base stylesheet, so a component
   placed after this one re-declares .chip (and its colour) later in the page.
   Keep the chip white on black whatever follows. */
.arc-why-founders .why-founders__chip { color: var(--color-on-dark); }
`

interface StatCard {
    figure: string
    label: string
    line: string
}

interface Props {
    chip: string
    line1: string
    line2: string
    line3: string
    cards: StatCard[]
    note: string
    style?: React.CSSProperties
}

const DEFAULTS: Props = {
    chip: "Why founders choose Arcovia",
    // The headline, in three parts that move on their own (left, flush right, one column in)
    line1: "Calm,",
    line2: "precise and",
    line3: "senior-led",
    // Copy and figures from the brief
    cards: [
        {
            figure: "18 days",
            label: "to the first qualified investor conversation",
            line: "Every mandate starts with investor thesis alignment and narrative architecture, matched to the investors most likely to commit.",
        },
        {
            figure: "200+",
            label: "active LP and family office relationships",
            line: "With a dedicated senior team on every mandate.",
        },
        {
            figure: "20–25%",
            label: "faster execution than the industry average",
            line: "Qualified meetings in weeks, without compromising selectivity.",
        },
        {
            figure: "600M+",
            label: "organic views generated for partners",
            line: "Creative partners and cultural strategy that help investors see the full story, not only the spreadsheet.",
        },
    ],
    note: "Performance metrics are based on internal data and management estimates.",
}

/**
 * @framerSupportedLayoutWidth any-prefer-fixed
 * @framerSupportedLayoutHeight auto
 */
export default function ArcoviaWhyFounders(incoming: Partial<Props>) {
    const p = { ...DEFAULTS, ...incoming }
    const cards = p.cards?.length ? p.cards : DEFAULTS.cards
    const ref = React.useRef<HTMLDivElement>(null)
    // Measure again whenever the copy changes (the headline and the cards are measured from the text)
    const key = JSON.stringify([p.chip, p.line1, p.line2, p.line3, cards, p.note])
    useArcoviaScript(ref, (root, life) => initFounders(root, life), [key])

    return (
        <div className="arc arc-why-founders" ref={ref} style={p.style}>
            {baseStyle()}
            {cssTag("why-founders", WHY_FOUNDERS_CSS)}
            <section className="why-founders" id="why-founders" data-founders="" data-header-theme="dark" aria-labelledby="why-founders-title">
                <div className="why-founders__stage">
                    <div className="why-founders__inner container">
                        <div className="why-founders__head">
                            <p className="chip why-founders__chip">{p.chip}</p>
                            <h2 className="why-founders__title" id="why-founders-title">
                                <span className="why-founders__line">{p.line1}</span>{" "}
                                <span className="why-founders__line">{p.line2}</span>{" "}
                                <span className="why-founders__line">{p.line3}</span>
                            </h2>
                        </div>

                        {/* Component: stat-card (figure, label, line) */}
                        <ul className="why-founders__cards">
                            {cards.map((c, i) => (
                                <li className="stat-card" key={i}>
                                    <p className="stat-card__figure">{c.figure}</p>
                                    <h3 className="stat-card__label">{c.label}</h3>
                                    <p className="stat-card__line">{c.line}</p>
                                </li>
                            ))}
                        </ul>

                        <p className="why-founders__note">{p.note}</p>
                    </div>
                </div>
            </section>
        </div>
    )
}

/* ==========================================================================
   Behaviour (founders.js): cards stack, then settle into a row.
   The section pins (sticky stage) while:
     0.00–0.05  the headline stands alone, huge, its lines staggered on the grid
     0.05–0.64  the four cards rise from below, one at a time, larger than in the
                row, into a stack in front of it; each covers the one before, whose
                figure still shows above it, and older cards are pushed up off the
                screen (as in the reference)
     0.68–0.90  the stack spreads into a row and the cards shrink to their normal
                size, while the headline shrinks into place above it as a normal
                heading; the chip and footnote fade in
     0.90–1.00  rest on the settled layout
   The settled layout is the real page (the CSS above); this only adds transforms on
   top, so at the end nothing is scaled and the text is native. Every frame comes
   from the scroll position alone (with light smoothing), so scrolling back up plays
   it in reverse. Desktop only (>=1200px), and not with reduced motion: there the
   section is simply the settled layout.
   ========================================================================== */
const HOLD = 0.05 // the headline alone
const RISE = 0.125 // each card's rise
const EACH = 0.15 // from one card's start to the next
const SPREAD = [0.68, 0.9] // the stack spreads and the headline settles
const STACK_SCALE = 1.5 // cards are larger in the stack, and shrink as they settle
const BIG = 0.148 // the big headline's size, as a share of the grid's width
const LEAD = 0.96 // its line spacing
const INDENT = [0, 12, 1] // where each of its lines starts, in grid columns (12: flush right)
const LAG = 0.14 // each headline line starts settling a little after the one before

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

interface Box {
    x: number
    y: number
    w: number
    h: number
    bx?: number
    by?: number
}

interface Geo {
    vw: number
    vh: number
    k: number
    heads: Box[]
    cards: Box[]
    sc: number
    step: number
    cardH: number
    sx: number
    fits: boolean
}

function initFounders(root: HTMLElement, life: Life) {
    const sec = root.querySelector<HTMLElement>("[data-founders]")
    if (!sec) return
    const stage = sec.querySelector<HTMLElement>(".why-founders__stage")
    const inner = sec.querySelector<HTMLElement>(".why-founders__inner")
    const title = sec.querySelector<HTMLElement>(".why-founders__title")
    const lines = Array.prototype.slice.call(sec.querySelectorAll(".why-founders__line")) as HTMLElement[]
    const cards = Array.prototype.slice.call(sec.querySelectorAll(".stat-card")) as HTMLElement[]
    const chip = sec.querySelector<HTMLElement>(".why-founders__chip")
    const note = sec.querySelector<HTMLElement>(".why-founders__note")
    const n = cards.length
    if (!stage || !inner || !title || !lines.length || n < 2) return

    const desktop = window.matchMedia("(min-width: 1200px)")
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)")

    let on = false
    let geo: Geo | null = null
    let p = 0
    let target = 0
    let raf = 0

    function clear() {
        lines.concat(cards).forEach((el) => {
            el.style.transform = ""
        })
        cards.forEach((el) => el.style.removeProperty("--shade"))
        ;[chip, note].forEach((el) => {
            if (el) el.style.opacity = ""
        })
    }

    /* ---------- Where everything sits: settled, big and stacked ---------- */
    function measure(): Geo {
        clear()
        const s = stage!.getBoundingClientRect()
        const vw = s.width
        const vh = s.height
        function rel(el: Element): Box {
            const r = el.getBoundingClientRect()
            return { x: r.left - s.left, y: r.top - s.top, w: r.width, h: r.height }
        }
        const cs = getComputedStyle(inner!)
        const gap = parseFloat(getComputedStyle(document.documentElement).getPropertyValue("--grid-gap")) || 24
        const ir = rel(inner!)
        const gridL = ir.x + parseFloat(cs.paddingLeft)
        const gridW = ir.w - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight)
        const col = (gridW - 11 * gap) / 12 + gap

        // The big headline: each line keeps its own place on the grid, the block centred on the screen
        const small = parseFloat(getComputedStyle(title!).fontSize)
        const big = gridW * BIG
        const k = big / small
        const heads = lines.map(rel)
        const blockH = big * LEAD * (lines.length - 1) + heads[heads.length - 1].h * k
        const top = (vh - blockH) / 2
        heads.forEach((h, i) => {
            const x = gridL + (INDENT[i] || 0) * col
            h.bx = Math.min(x, gridL + gridW - h.w * k)
            h.by = top + i * big * LEAD
        })

        // The stack: centred, each card a figure's height below the one before
        const natural = cards.map(rel)
        const fig = cards[0].querySelector(".stat-card__figure")
        const figBottom = fig ? fig.getBoundingClientRect().bottom - cards[0].getBoundingClientRect().top : 90
        const cardH = Math.max.apply(null, natural.map((c) => c.h))
        const peek = figBottom + 18 // how much of the card before shows above, at normal size
        // The newest card and the figure of the one before must fit on screen, so shorter
        // windows get a smaller stack
        const sc = Math.min(STACK_SCALE, (vh - 48) / (cardH + peek))
        const step = peek * sc
        const ss = getComputedStyle(stage!)
        return {
            vw: vw,
            vh: vh,
            k: k,
            heads: heads,
            cards: natural,
            sc: sc,
            step: step,
            cardH: cardH * sc,
            sx: (vw - natural[0].w * sc) / 2,
            fits: ir.h <= vh - parseFloat(ss.paddingTop) - parseFloat(ss.paddingBottom) + 1,
        }
    }

    /* ---------- One frame, from the progress p alone ---------- */
    function draw() {
        const g = geo!
        // How far each card has risen, and how many sit on the stack. The newest card stays in
        // the middle with the figure of the one before above it; older cards move up off the screen.
        const rise = cards.map((c, i) => easeOut(ramp(HOLD + i * EACH, HOLD + i * EACH + RISE, p)))
        const landed = rise.reduce((a, b) => a + b, 0)
        const above = Math.min(Math.max(0, landed - 1), 1) * g.step
        const newest = (g.vh - (g.cardH + above)) / 2 + above
        const stackTop = newest - Math.max(0, landed - 1) * g.step
        const spread = ramp(SPREAD[0], SPREAD[1], p)
        const f = easeInOut(spread)

        cards.forEach((el, i) => {
            const c = g.cards[i]
            const yStack = stackTop + i * g.step
            let y = lerp(g.vh + 40, yStack, rise[i])
            const x = lerp(g.sx, c.x, f)
            y = lerp(y, c.y, f)
            const sc = lerp(g.sc, 1, f)
            const still = f >= 1
            // A 2D transform keeps the card painted (not cached as a bitmap), so its text stays sharp
            el.style.transform = still ? "" : "translate(" + (x - c.x).toFixed(2) + "px," + (y - c.y).toFixed(2) + "px) scale(" + sc.toFixed(4) + ")"
            const shade = i < n - 1 ? rise[i + 1] * (1 - f) : 0
            if (shade > 0.001) el.style.setProperty("--shade", shade.toFixed(3))
            else el.style.removeProperty("--shade")
        })

        // The headline shrinks into place as the cards spread, one line after the other, so each
        // line finds its place in the sentence before the next comes up beside it. The scale is
        // eased in log space, so the shrinking feels even.
        const last = g.heads.length - 1
        g.heads.forEach((h, i) => {
            const t = easeInOut(ramp(i * LAG, 1 - (last - i) * LAG, spread))
            const x = lerp(h.bx!, h.x, t)
            const y = lerp(h.by!, h.y, t)
            const k = Math.exp(lerp(Math.log(g.k), 0, t))
            lines[i].style.transform = t >= 1 ? "" : "translate(" + (x - h.x).toFixed(2) + "px," + (y - h.y).toFixed(2) + "px) scale(" + k.toFixed(4) + ")"
        })

        if (chip) chip.style.opacity = f >= 1 ? "" : ramp(0.5, 1, f).toFixed(3)
        if (note) note.style.opacity = f >= 1 ? "" : ramp(0.6, 1, f).toFixed(3)
        sec!.classList.toggle("is-settled", f >= 1)
    }

    /* ---------- Scroll → progress, lightly smoothed ---------- */
    function read() {
        const r = sec!.getBoundingClientRect()
        const travel = r.height - window.innerHeight
        target = travel > 0 ? clamp(-r.top / travel, 0, 1) : 0
    }

    function tick() {
        raf = 0
        if (!on) return
        if (!geo) geo = measure()
        const d = target - p
        p = Math.abs(d) < 0.0004 ? target : p + d * 0.2
        draw()
        if (p !== target) raf = life.raf(tick)
    }

    function queue() {
        if (!on) return
        read()
        if (!raf) raf = life.raf(tick)
    }

    function setMode() {
        if (life.dead) return
        let want = desktop.matches && !reduced.matches
        sec!.classList.toggle("why-founders--staged", want)
        geo = null
        if (want) {
            // The settled layout must fit on one screen, or the section just scrolls
            geo = measure()
            if (!geo.fits) {
                want = false
                sec!.classList.remove("why-founders--staged")
            }
        }
        on = want
        if (!on) {
            if (raf) life.cancelRaf(raf)
            raf = 0
            clear()
            sec!.classList.remove("is-settled")
            return
        }
        read()
        p = target
        draw()
    }

    life.on(window, "scroll", queue, { passive: true })
    life.on(window, "resize", setMode)
    // (older Safari has no addEventListener on media queries)
    if (typeof desktop.addEventListener === "function") life.on(desktop, "change", setMode)
    if (typeof reduced.addEventListener === "function") life.on(reduced, "change", setMode)
    // The headline is measured from the real font, so measure again once it's in. The
    // component can mount after the page has loaded, before its font has started
    // loading, so also listen for later font loads.
    const fonts = (document as any).fonts
    if (fonts) {
        if (fonts.ready) fonts.ready.then(setMode)
        if (fonts.addEventListener) life.on(fonts, "loadingdone", setMode)
    }
    setMode()
}

addPropertyControls(ArcoviaWhyFounders, {
    chip: { type: ControlType.String, title: "Chip", defaultValue: DEFAULTS.chip },
    line1: { type: ControlType.String, title: "Headline 1", defaultValue: DEFAULTS.line1 },
    line2: { type: ControlType.String, title: "Headline 2", defaultValue: DEFAULTS.line2 },
    line3: { type: ControlType.String, title: "Headline 3", defaultValue: DEFAULTS.line3 },
    cards: {
        type: ControlType.Array,
        title: "Cards",
        maxCount: 4,
        control: {
            type: ControlType.Object,
            controls: {
                figure: { type: ControlType.String, title: "Figure" },
                label: { type: ControlType.String, title: "Label", displayTextArea: true },
                line: { type: ControlType.String, title: "Line", displayTextArea: true },
            },
        },
        defaultValue: DEFAULTS.cards,
    },
    note: { type: ControlType.String, title: "Footnote", displayTextArea: true, defaultValue: DEFAULTS.note },
})
