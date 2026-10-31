/**
 * Arcovia: the data section, "A record to build on" (Home block 3).
 *
 * The four figures as 3D concrete blocks on a white wall, seen from above and
 * to the right, everything centred on one axis under the heading. The stage
 * stays pinned (position: sticky) while each block comes down turning a full
 * circle on its vertical axis and settles on the stack; the first figure is the
 * base, the last one tops the stack. Every frame follows the scroll position
 * (light exponential smoothing, no timers, no bounce), so scrolling back takes
 * the blocks off one at a time, top block first. The faces stay exactly flat,
 * so the text is crisp at rest.
 *
 * On the Framer canvas, without the script and with reduced motion, it is the
 * built stack. The Framer layer holding it must not clip its content (the stage
 * is sticky and the script makes the section taller).
 * Ported from stack.js and sections/data.css on main.
 */
import * as React from "react"
import { addPropertyControls, ControlType } from "framer"
import { ASSETS, baseStyle, cssTag, useArcoviaScript, type Life } from "./ArcoviaBase.tsx"

const DATA_CSS = `/* ==========================================================================
   SECTION: data — Home, block 2
   The four figures as 3D concrete blocks on white, seen from above and
   to the right, everything centred on one axis under the heading. The
   whole stage stays pinned while each block comes down turning a full
   circle on its vertical axis and settles on the stack (stack.js): the
   first figure is the base, the last one tops the stack. Text is printed
   flat on the concrete, never carved.
   Uses shared tokens and the chip from styles.css.
   ========================================================================== */

/* --depth: how deep each block is. --lean: how far that depth shifts up
   and to the right, per px (the axonometric view). --lean-x is the
   resulting overhang of the right ends: heading and footnote are pulled in
   by as much, so everything centres on the blocks' front faces. */
.data {
  --joint: 8px;
  --depth: 60px;
  --lean: 0.5;
  --lean-x: calc(var(--depth) * var(--lean));
  --block-h: min(120px, 12.5svh); /* shorter screens get lower blocks, so everything fits under the header */
  position: relative;
  background: var(--color-white);
}

/* The stage stays put while the blocks come down; stack.js makes the section taller */
.data__stage {
  position: sticky;
  top: 0;
  height: 100vh;
  height: 100svh;
  overflow: clip;
  display: flex;
  align-items: center;
  padding-top: var(--mh-compact);
}

/* Spacing follows the window height, so heading, stack and footnote fit on one screen */
.data__inner {
  display: grid;
  grid-template-columns: repeat(12, minmax(0, 1fr));
  column-gap: var(--grid-gap);
  row-gap: clamp(16px, 3.2svh, 40px);
}

/* One centred column: the heading at the top, then the stack, then the footnote */
.data__head,
.data__inner > .stack,
.data__note {
  grid-column: 4 / span 6;
  margin-right: var(--lean-x);
}

.data__head {
  display: grid;
  justify-items: center;
  gap: min(var(--space-4), 1.6svh);
  text-align: center;
}
.data__title {
  margin-top: var(--space-1);
  font-size: min(var(--fs-h2), 5.4svh);
  font-weight: var(--weight-medium);
  line-height: var(--lh-h2);
  letter-spacing: var(--ls-h2);
  color: var(--color-ink);
  text-wrap: balance;
}
.data__sub {
  max-width: 32em;
  text-wrap: balance;
  font-size: min(var(--fs-lede), 2.5svh);
  line-height: var(--lh-lede);
  color: var(--color-text);
}

/* Room above for the top block's top face */
.data__inner > .stack { margin-top: var(--lean-x); }

.data__note {
  text-align: center;
  text-wrap: balance;
  font-size: 13px;
  line-height: 1.5;
  color: var(--color-text-muted);
}
.data__note a {
  color: var(--color-ink);
  text-decoration: underline;
  text-decoration-thickness: 1px;
  text-underline-offset: 3px;
}

/* ---------- Stack (component: drop-stack) ----------
   Each block is a concrete box: the face with the text, a top and a right
   end (always drawn), plus a back and a left end for the turn. stack.js
   adds the sides. The stack is drawn in an axonometric view, seen from
   above and to the right, as in the deck's concrete renders: the view
   only shifts what lies behind the faces, so the faces themselves stay
   exactly flat and the text crisp. */
.stack {
  display: flex;
  flex-direction: column-reverse; /* first figure at the bottom */
  gap: var(--joint);
  transform-style: preserve-3d;
  transform: matrix3d(1, 0, 0, 0, 0, 1, 0, 0, calc(var(--lean) * -1), var(--lean), 1, 0, 0, 0, 0, 1);
}

.stack__block {
  position: relative;
  transform-style: preserve-3d;
}

/* The base stands on the floor with a soft contact shadow, fading in as it
   lands (--land, set by stack.js; 1 without JS) */
.stack__block:first-child::after {
  content: "";
  position: absolute;
  top: 100%;
  left: -1%;
  right: -3%;
  height: 22px;
  background: radial-gradient(50% 100% at 50% 0%, rgba(0, 0, 0, 0.18), rgba(0, 0, 0, 0) 70%);
  opacity: var(--land, 1);
}

/* The box turns around its own centre, half its depth behind the face */
.stack__body {
  position: relative;
  transform-style: preserve-3d;
  transform-origin: 50% 50% calc(var(--depth) / -2);
}

/* Cast concrete; each block shows a different patch */
.stack__face,
.stack__side {
  border-radius: 2px;
  background-color: #bdbdbd;
  background-image:
    linear-gradient(172deg, rgba(255, 255, 255, 0.14), rgba(255, 255, 255, 0) 38%, rgba(0, 0, 0, 0.04)),
    url("${ASSETS.concreteCast}");
  background-size: auto, 960px;
  background-position: 0 0, calc(var(--i, 0) * -331px) calc(var(--i, 0) * -197px);
  -webkit-backface-visibility: hidden;
  backface-visibility: hidden;
}

/* The figure on the left, its line on the right, on the face's own grid
   (--cols, the columns the stack spans) */
.stack__face {
  --cols: 6;
  position: relative;
  display: grid;
  grid-template-columns: repeat(var(--cols), minmax(0, 1fr));
  column-gap: var(--grid-gap);
  align-items: center;
  min-height: var(--block-h);
  /* crisp arrises: light catches the top edge, the bottom edge turns away */
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.55),
    inset 1px 0 0 rgba(255, 255, 255, 0.2),
    inset 0 -1px 0 rgba(0, 0, 0, 0.16),
    inset -1px 0 0 rgba(0, 0, 0, 0.1);
}

/* Light from the upper left: the top is brightest, the right end in shade */
.stack__side {
  position: absolute;
  top: 0;
  bottom: 0;
}
.stack__side--top {
  top: auto;
  bottom: 100%;
  left: 0;
  right: 0;
  height: var(--depth);
  transform-origin: 50% 100%;
  transform: rotateX(90deg);
  background-image:
    linear-gradient(rgba(255, 255, 255, 0.3), rgba(255, 255, 255, 0.2)),
    url("${ASSETS.concreteCast}");
}
/* Once a block sits on it, the top only shows in the joint, in shadow.
   --cover goes from 0 to 1 as the block above settles (set by stack.js;
   without JS every top but the highest is covered) */
.stack__side--top::after {
  content: "";
  position: absolute;
  inset: 0;
  border-radius: inherit;
  background: linear-gradient(rgba(20, 20, 20, 0.52), rgba(20, 20, 20, 0.42));
  opacity: var(--cover, 1);
}
.stack__block:last-child .stack__side--top::after { opacity: var(--cover, 0); }

.stack__side--right,
.stack__side--left {
  width: var(--depth);
  background-image:
    linear-gradient(90deg, rgba(0, 0, 0, 0.25), rgba(0, 0, 0, 0.33)),
    url("${ASSETS.concreteCast}");
}
.stack__side--right { left: 100%; transform-origin: 0 50%; transform: rotateY(90deg); }
.stack__side--left { right: 100%; transform-origin: 100% 50%; transform: rotateY(-90deg); }

/* The back and the left end never face us at rest: drawn only while the block turns */
.stack__side--back,
.stack__side--left { display: none; }
.stack__block.is-turning .stack__side--back,
.stack__block.is-turning .stack__side--left { display: block; }
.stack__side--back {
  left: 0;
  right: 0;
  transform: translateZ(calc(var(--depth) * -1)) rotateY(180deg);
  background-position: 0 0, calc(var(--i, 0) * -331px + 400px) calc(var(--i, 0) * -197px);
}

/* Flat ink on concrete: no emboss, no carving */
.stack__figure {
  grid-column: 1 / span 3;
  padding-left: 36px;
  font-size: var(--fig-size, min(60px, 6.6svh));
  font-weight: var(--weight-medium);
  line-height: 1;
  letter-spacing: -0.03em;
  font-variant-numeric: lining-nums;
  white-space: nowrap;
  color: var(--color-ink);
}
.stack__label {
  grid-column: 4 / span 3;
  padding-right: 28px;
  max-width: 21em;
  text-wrap: pretty;
  font-size: var(--label-size, min(17px, 2.2svh));
  line-height: 1.4;
  color: var(--color-ink);
}

/* ---------- Smaller desktops: a wider column, so the lines keep to two rows ---------- */
@media (min-width: 1200px) and (max-width: 1439px) {
  .data__head,
  .data__inner > .stack,
  .data__note { grid-column: 3 / span 8; }
  .stack__face { --cols: 8; }
  .stack__figure { grid-column: 1 / span 4; }
  .stack__label { grid-column: 5 / span 4; }
}

/* ---------- Tablet ---------- */
@media (max-width: 1199px) {
  .data { --depth: 52px; --block-h: min(116px, 11svh); }
  .data__head,
  .data__inner > .stack,
  .data__note { grid-column: 2 / span 10; }
  .stack__face { --cols: 10; }
  .stack__figure { --fig-size: 48px; grid-column: 1 / span 4; padding-left: 28px; }
  .stack__label { grid-column: 5 / span 6; padding-right: 24px; }
}

/* ---------- Phone ---------- */
@media (max-width: 809px) {
  .data { --joint: 6px; --depth: 32px; --block-h: 112px; }
  .data__inner { row-gap: var(--space-5); }
  .data__head,
  .data__inner > .stack,
  .data__note { grid-column: 1 / -1; }
  .data__head { gap: var(--space-3); }
  .data__sub { font-size: 15px; }
  /* the figure over its line */
  .stack__face {
    grid-template-columns: 1fr;
    align-content: center;
    row-gap: 6px;
    padding: 16px 18px 18px;
  }
  .stack__figure,
  .stack__label { grid-column: 1; padding: 0; }
  .stack__figure { --fig-size: 34px; }
  .stack__label { --label-size: 14px; line-height: 1.35; }
}

/* Short phones (iPhone SE and the like): everything has to fit under the header at once */
@media (max-width: 809px) and (max-height: 760px) {
  .data { --depth: 24px; --block-h: 98px; }
  .data__inner { row-gap: var(--space-3); }
  .data__head { gap: var(--space-2); }
  .data__title { font-size: 26px; }
  .data__sub { font-size: 14px; line-height: 1.45; }
  .stack__face { padding: 12px 16px 14px; row-gap: 4px; }
  .stack__figure { --fig-size: 30px; }
}
`

interface Figure {
    figure: string
    label: string
}

interface Props {
    chip: string
    title: string
    sub: string
    figures: Figure[]
    note: string
    noteLinkLabel: string
    noteLink: string
    style?: React.CSSProperties
}

const DEFAULTS: Props = {
    // [COPY NEEDED] Draft chip, heading and subheading, to confirm with Lilla
    chip: "Track record",
    title: "A record to build on",
    sub: "What the Arcovia team and our senior advisors bring to every mandate.",
    figures: [
        { figure: "24", label: "transactions closed by the Arcovia team" },
        { figure: "$330M+", label: "capital raised" },
        { figure: "3,000+", label: "institutional relationships across 50+ countries" },
        { figure: "$68B+", label: "combined transaction experience of our senior advisors" },
    ],
    note: "Advisor figures include experience at prior firms. See",
    noteLinkLabel: "Disclosures",
    noteLink: "#", // [TO CONFIRM] Disclosures page or section
}

/** The top, back and both ends of each box (stack.js added these; here they are markup, so the canvas shows the built stack) */
const SIDES = ["top", "back", "left", "right"]

/**
 * @framerSupportedLayoutWidth any-prefer-fixed
 * @framerSupportedLayoutHeight auto
 */
export default function ArcoviaData(incoming: Partial<Props>) {
    const p = { ...DEFAULTS, ...incoming }
    const figures = p.figures?.length ? p.figures : DEFAULTS.figures
    const ref = React.useRef<HTMLDivElement>(null)
    // Measure again whenever the copy changes (the blocks' heights follow the text)
    const key = JSON.stringify([p.chip, p.title, p.sub, figures, p.note, p.noteLinkLabel])
    useArcoviaScript(ref, (root, life) => initData(root, life), [key])

    return (
        <div className="arc arc-data" ref={ref} style={p.style}>
            {baseStyle()}
            {cssTag("data", DATA_CSS)}
            <section className="data" data-stack="" aria-labelledby="data-title">
                <div className="data__stage">
                    <div className="data__inner container">
                        {/* [COPY NEEDED] Draft chip, heading and subheading, to confirm with Lilla */}
                        <div className="data__head">
                            <p className="chip">{p.chip}</p>
                            <h2 className="data__title" id="data-title">{p.title}</h2>
                            <p className="data__sub">{p.sub}</p>
                        </div>
                        <ul className="stack">
                            {figures.map((f, i) => (
                                <li className="stack__block" style={{ ["--i" as any]: i }} key={i}>
                                    <div className="stack__body">
                                        <div className="stack__face">
                                            <p className="stack__figure">{f.figure}</p>
                                            <p className="stack__label">{f.label}</p>
                                        </div>
                                        {SIDES.map((s) => (
                                            <span className={"stack__side stack__side--" + s} aria-hidden="true" key={s}></span>
                                        ))}
                                    </div>
                                </li>
                            ))}
                        </ul>
                        <p className="data__note">
                            {p.note}
                            {p.noteLinkLabel ? (
                                <>
                                    {" "}
                                    <a href={p.noteLink || "#"} data-todo={!p.noteLink || p.noteLink === "#" ? "Disclosures page or section [TO CONFIRM]" : undefined}>
                                        {p.noteLinkLabel}
                                    </a>
                                    .
                                </>
                            ) : null}
                        </p>
                    </div>
                </div>
            </section>
        </div>
    )
}

/* ==========================================================================
   Behaviour (stack.js: DropStack). Concrete blocks that come down onto a stack
   as you scroll.
   - The section becomes a tall scroll track around a sticky stage. Each block
     owns one stretch of that track, one after another: across its stretch it
     comes down from above the stage, turning one full circle on its vertical
     axis, and settles on the stack. Scrolling back plays the same stretch in
     reverse, so blocks always leave one at a time, top block first.
   - Everything follows the scroll position itself (no timers, no bounce),
     eased by a light exponential smoothing so wheel and trackpad steps glide
     instead of jumping.
   - While a block turns it drops the stack's slant and turns in plain
     perspective; over the last stretch it eases back into the slanted view and
     the perspective flattens out, so the face lands exactly flat and the text
     crisp.
   - The joint under a block darkens as the block above settles on it, and the
     base's contact shadow fades in as it lands.
   - With reduced motion the stack is simply built.
   ========================================================================== */
const PERSPECTIVE = 1200 // css px
const SMOOTHING = 0.14 // seconds: how long the motion takes to catch up with the scroll

function clamp01(x: number) {
    return x < 0 ? 0 : x > 1 ? 1 : x
}
function smoothstep(a: number, b: number, x: number) {
    const t = clamp01((x - a) / (b - a))
    return t * t * (3 - 2 * t)
}
// Starts from rest, gathers speed gently and slows into place: no sudden starts or stops
function settle(t: number) {
    return (1 - Math.cos(Math.PI * t)) / 2
}

function initData(root: HTMLElement, life: Life) {
    root.querySelectorAll<HTMLElement>("[data-stack]").forEach((section) => dropStack(section, life))
}

function dropStack(section: HTMLElement, life: Life) {
    const stage = section.querySelector<HTMLElement>(".data__stage")
    const stack = section.querySelector<HTMLElement>(".stack")
    const blocks = Array.prototype.slice.call(section.querySelectorAll(".stack__block")) as HTMLElement[]
    const bodies = blocks.map((el) => el.querySelector(".stack__body") as HTMLElement)
    if (!stage || !stack || !blocks.length || bodies.some((b) => !b)) return
    const rise: number[] = []
    let progress = 0 // shown, in blocks: 2.5 = two blocks down, the third halfway
    let target = 0 // where the scroll says it should be
    let running = false
    let lean = 0
    let depth = 0
    let start = 0
    let step = 1

    // The top, back and both ends of each box (already in the markup; added here only if missing)
    bodies.forEach((body) => {
        if (body.querySelector(".stack__side")) return
        SIDES.forEach((side) => {
            const s = document.createElement("span")
            s.className = "stack__side stack__side--" + side
            s.setAttribute("aria-hidden", "true")
            body.appendChild(s)
        })
    })

    // How far each block falls, and where the scroll track starts and how long it is
    const measure = () => {
        const vh = window.innerHeight

        // Measure the resting places with every block in place
        blocks.forEach((el, i) => {
            el.style.transform = ""
            bodies[i].style.transform = ""
        })
        const stageTop = stage.getBoundingClientRect().top
        blocks.forEach((el, i) => {
            rise[i] = el.getBoundingClientRect().bottom - stageTop + 48 // starts just above the stage
        })

        const cs = getComputedStyle(stack)
        lean = parseFloat(cs.getPropertyValue("--lean")) || 0
        depth = parseFloat(cs.getPropertyValue("--depth")) || 0

        // The base starts down while the section is still coming up the screen;
        // each block then gets the same stretch of scroll, and the built stack holds a while
        start = -vh * 0.25
        step = Math.max(240, vh * 0.42)
        const hold = vh * 0.45
        const track = Math.max(0, start + blocks.length * step + hold)
        section.style.height = stage.offsetHeight + track + "px"
    }

    // Where the scroll is, in blocks. stack.js kept the section's page offset from the
    // last measure (window.scrollY - top); reading it live gives the same number and
    // stays right when components above this one change height after it measured.
    const read = () => {
        const p = (-section.getBoundingClientRect().top - start) / step
        return Math.max(0, Math.min(blocks.length, p))
    }

    // The box at t (0 above the stage, 1 settled): one full turn on its vertical
    // axis around the middle of the box, done by 85%. While it turns it cancels
    // the stack's slant (a turning box swept through the slant reads as a beam
    // swinging diagonally); from 70% it eases back into the slant and the
    // perspective flattens out, so it lands exactly flat.
    const turnAt = (t: number) => {
        const angle = 360 * smoothstep(0.05, 0.85, t)
        const s = smoothstep(0.7, 1, t)
        const u = 1 - s
        const l = lean * u
        const shift = ((lean * depth) / 2) * u
        const d = PERSPECTIVE / Math.max(0.001, u * u)
        return (
            "translate(" + (-shift).toFixed(2) + "px, " + shift.toFixed(2) + "px) " +
            "matrix3d(1,0,0,0, 0,1,0,0, " + l.toFixed(4) + "," + (-l).toFixed(4) + ",1,0, 0,0,0,1) " +
            "perspective(" + d.toFixed(0) + "px) rotateY(" + angle.toFixed(2) + "deg)"
        )
    }

    const render = () => {
        const n = blocks.length
        for (let i = 0; i < n; i++) {
            const t = clamp01(progress - i)
            const el = blocks[i]
            const body = bodies[i]

            // The joint under this block darkens as the block above settles on it;
            // the base's contact shadow fades in as it lands
            const above = i + 1 < n ? clamp01(progress - i - 1) : 0
            el.style.setProperty("--cover", smoothstep(0.82, 1, above).toFixed(3))
            if (i === 0) el.style.setProperty("--land", smoothstep(0.75, 1, t).toFixed(3))

            el.classList.toggle("is-turning", t > 0 && t < 1)
            if (t >= 1) {
                el.style.transform = ""
                body.style.transform = ""
                continue
            }

            el.style.transform = "translate3d(0, " + (-rise[i] * (1 - settle(t))).toFixed(2) + "px, 0)"
            body.style.transform = turnAt(t)
        }
    }

    // Catch up with the scroll, frame by frame, until there
    const kick = () => {
        target = read()
        if (running) return
        running = true
        let last = performance.now()
        const frame = (now: number) => {
            const dt = Math.min(0.1, (now - last) / 1000)
            last = now
            progress += (target - progress) * (1 - Math.exp(-dt / SMOOTHING))
            if (Math.abs(target - progress) < 0.0005) progress = target
            render()
            if (progress !== target) life.raf(frame)
            else running = false
        }
        life.raf(frame)
    }

    const relayout = () => {
        if (life.dead) return
        measure()
        progress = target = read()
        render()
    }

    if (window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
        progress = blocks.length
        render()
        return
    }

    measure()
    progress = target = read() // a reload halfway down the page starts in place
    render()

    life.on(window, "scroll", kick, { passive: true })

    let width = window.innerWidth
    life.on(window, "resize", () => {
        // Phones resize the height as the address bar moves; only a new width changes the layout
        if (window.innerWidth === width) return
        width = window.innerWidth
        relayout()
    })
    // Measure again once Montserrat is in. The component can mount after the page has
    // loaded, before its font has started loading, so also listen for later font loads.
    const fonts = (document as any).fonts
    if (fonts) {
        if (fonts.ready) fonts.ready.then(relayout)
        if (fonts.addEventListener) life.on(fonts, "loadingdone", relayout)
    }
}

addPropertyControls(ArcoviaData, {
    chip: { type: ControlType.String, title: "Chip", defaultValue: DEFAULTS.chip },
    title: { type: ControlType.String, title: "Heading", defaultValue: DEFAULTS.title },
    sub: { type: ControlType.String, title: "Subheading", displayTextArea: true, defaultValue: DEFAULTS.sub },
    figures: {
        type: ControlType.Array,
        title: "Figures",
        maxCount: 4,
        control: {
            type: ControlType.Object,
            controls: {
                figure: { type: ControlType.String, title: "Figure" },
                label: { type: ControlType.String, title: "Label", displayTextArea: true },
            },
        },
        defaultValue: DEFAULTS.figures,
    },
    note: { type: ControlType.String, title: "Note", displayTextArea: true, defaultValue: DEFAULTS.note },
    noteLinkLabel: { type: ControlType.String, title: "Note link", defaultValue: DEFAULTS.noteLinkLabel },
    noteLink: { type: ControlType.Link, title: "Note URL", defaultValue: DEFAULTS.noteLink },
})
