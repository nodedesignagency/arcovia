/**
 * Arcovia: "Who we raise from" on What We Do (the brief's section 6, between
 * GENESIS and the sectors line).
 *
 * The brief: headline "3,000+ institutional relationships across 50+ countries",
 * seven figures in a row, and the footnote on relationship counts.
 * On the neutral ground, so it reads as one room with the sectors line under it.
 * The one idea: a thin bar split into the seven investor groups, each part as
 * wide as its count, and a fine arc from each part down to its figure, landing
 * on the hairline of that figure's column (the arc between places, as on the
 * map). The arcs draw in once and the figures count up once as the section
 * comes into view (still with reduced motion and on the canvas). Hovering a
 * figure darkens its part, its arc and its hairline.
 * Tablet and phone: the figures only, four and two to a row (no bar, no arcs).
 * Declares its ground (data-bg="neutral") for the page's changing background.
 */
import * as React from "react"
import { addPropertyControls, ControlType } from "framer"
import { baseStyle, cssTag, useArcoviaScript, type Life } from "./ArcoviaBase.tsx"

const RAISE_CSS = `/* ==========================================================================
   SECTION: raise-from — What We Do, block 6 (the brief's "Who we raise from")
   Neutral ground; heading like GENESIS; a thin segmented bar (one part per
   investor group, as wide as its count), arcs from each part to its figure,
   then the seven figures in a row behind hairlines, then the footnote.
   ========================================================================== */

.raise {
  --raise-line: rgba(21, 21, 21, 0.22);
  --raise-fs: calc((min(100cqw, var(--container-max)) - 2 * var(--gutter)) * 0.04);
  background: var(--color-neutral);
  padding-block: var(--space-10);
}

.raise__head {
  display: grid;
  justify-items: start;
  gap: var(--space-5);
  margin-bottom: var(--space-9);
}
.raise__title {
  max-width: 15em;
  font-size: var(--raise-fs);
  font-weight: var(--weight-medium);
  line-height: 1.08;
  letter-spacing: var(--ls-h2);
  color: var(--color-ink);
  text-wrap: balance;
}

/* The bar: one part per group, as wide as its count, 2px apart, fully rounded */
.raise__bar {
  display: flex;
  gap: 2px;
  height: 8px;
}
.raise__seg {
  flex: var(--w) 1 0px;
  min-width: 3px;
  border-radius: var(--radius-pill);
  background: var(--color-charcoal);
  transition: background-color var(--dur-base) var(--ease-out);
}
.raise__seg.is-active { background: var(--color-ink); }

/* The arcs, from the middle of each part to the top of its column's hairline */
.raise__links {
  display: block;
  width: 100%;
  height: 96px;
  overflow: visible;
}
.raise__link {
  fill: none;
  stroke: var(--raise-line);
  stroke-width: 1;
  transition: stroke var(--dur-base) var(--ease-out);
}
.raise__link.is-active { stroke: var(--color-ink); }

/* Drawn in once (the script arms them only when the section is still below the fold) */
.raise.is-armed .raise__link { stroke-dasharray: 1; stroke-dashoffset: 1; }
.raise.is-armed.is-in .raise__link {
  stroke-dashoffset: 0;
  transition:
    stroke-dashoffset 1100ms var(--ease-out) calc(var(--i, 0) * 70ms),
    stroke var(--dur-base) var(--ease-out);
}

/* Seven figures in a row, each behind its hairline */
.raise__list {
  display: grid;
  grid-template-columns: repeat(var(--n, 7), minmax(0, 1fr));
}
.raise__item {
  padding: var(--space-3) var(--space-4) var(--space-2);
  border-left: 1px solid var(--raise-line);
  transition: border-color var(--dur-base) var(--ease-out);
}
.raise__item.is-active { border-left-color: var(--color-ink); }
.raise__figure {
  font-size: min(44px, 2.9cqw);
  font-weight: var(--weight-medium);
  line-height: 1;
  letter-spacing: -0.03em;
  font-variant-numeric: tabular-nums lining-nums;
  white-space: nowrap;
  color: var(--color-ink);
}
.raise__label {
  margin-top: var(--space-3);
  max-width: 11em;
  font-size: 15px;
  line-height: 1.4;
  color: var(--color-text);
  text-wrap: balance;
}

.raise__note {
  margin-top: var(--space-8);
  max-width: 60em;
  font-size: var(--fs-small);
  line-height: var(--lh-small);
  color: var(--color-text-muted);
}

/* Tablet: the figures only, four to a row */
@container arc (max-width: 1199px) {
  .raise { --raise-fs: var(--fs-h2); padding-block: var(--space-9); }
  .raise__head { margin-bottom: var(--space-8); }
  .raise__bar, .raise__links { display: none; }
  .raise__list { grid-template-columns: repeat(4, minmax(0, 1fr)); row-gap: var(--space-7); }
  .raise__figure { font-size: 36px; }
}
/* Phone: two to a row */
@container arc (max-width: 809px) {
  .raise { padding-block: var(--space-8); }
  .raise__head { margin-bottom: var(--space-7); }
  .raise__list { grid-template-columns: repeat(2, minmax(0, 1fr)); row-gap: var(--space-6); }
  .raise__item { padding-inline: var(--space-3); }
  .raise__figure { font-size: 30px; }
  .raise__label { font-size: 14px; }
  .raise__note { margin-top: var(--space-7); }
}
`

interface Item {
    figure: string
    label: string
}

interface Props {
    chip: string
    title: string
    items: Item[]
    note: string
    style?: React.CSSProperties
}

const DEFAULTS: Props = {
    chip: "Who we raise from",
    title: "3,000+ institutional relationships across 50+ countries",
    items: [
        { figure: "1,000+", label: "Private equity" },
        { figure: "550+", label: "Family offices" },
        { figure: "450+", label: "Hedge funds" },
        { figure: "300+", label: "Asset managers" },
        { figure: "200+", label: "Pensions and endowments" },
        { figure: "180+", label: "Strategics" },
        { figure: "20+", label: "Sovereign funds" },
    ],
    note: "Relationship counts are estimates based on the team’s professional relationships and do not guarantee participation.",
}

const GAP = 2 // px between the bar's parts (matches .raise__bar gap)
const LINK_H = 96 // px, the arcs' height (matches .raise__links)

/** "1,000+" -> { prefix "", value 1000, suffix "+", grouped true } */
function parseFigure(f: string) {
    const m = /^(\D*)([\d][\d,.]*)(.*)$/.exec((f || "").trim())
    if (!m) return null
    const value = parseFloat(m[2].replace(/,/g, ""))
    if (!isFinite(value)) return null
    return { prefix: m[1], value, suffix: m[3], grouped: m[2].indexOf(",") >= 0, decimals: (m[2].split(".")[1] || "").length }
}

/** Where each part sits on a bar W px wide, and where its arc lands (its column's left hairline) */
function geometry(weights: number[], W: number) {
    const n = weights.length
    const total = weights.reduce((a, b) => a + b, 0) || 1
    const free = Math.max(0, W - GAP * (n - 1))
    let x = 0
    return weights.map((v, i) => {
        const w = (free * v) / total
        const mid = x + w / 2
        x += w + GAP
        return { mid, end: (W * i) / n + 0.5 }
    })
}

/**
 * @framerSupportedLayoutWidth any-prefer-fixed
 * @framerSupportedLayoutHeight auto
 */
export default function ArcoviaRaiseFrom(incoming: Partial<Props>) {
    const p = { ...DEFAULTS, ...incoming }
    const items = Array.isArray(p.items) && p.items.length ? p.items : DEFAULTS.items
    const weights = items.map((it) => {
        const f = parseFigure(it.figure)
        return f && f.value > 0 ? f.value : 1
    })
    const ref = React.useRef<HTMLDivElement>(null)
    const barRef = React.useRef<HTMLDivElement>(null)
    const [W, setW] = React.useState(1360) // the bar's width at 1440, until measured
    const [active, setActive] = React.useState(-1)

    // The arcs follow the bar's real width
    React.useEffect(() => {
        const bar = barRef.current
        if (!bar || typeof ResizeObserver === "undefined") return
        const update = () => {
            const w = bar.getBoundingClientRect().width
            if (w > 0) setW(Math.round(w))
        }
        update()
        const ro = new ResizeObserver(update)
        ro.observe(bar)
        return () => ro.disconnect()
    }, [])

    const key = JSON.stringify(items)
    useArcoviaScript(ref, (root, life) => initRaise(root, life), [key])

    const geo = geometry(weights, W)

    return (
        <div className="arc arc-raise" ref={ref} style={p.style}>
            {baseStyle()}
            {cssTag("raise", RAISE_CSS)}
            <section className="raise" data-bg="neutral" id="who-we-raise-from" data-raise="" aria-labelledby="raise-title">
                <div className="raise__inner container">
                    <div className="raise__head">
                        {p.chip ? <p className="chip">{p.chip}</p> : null}
                        <h2 className="raise__title" id="raise-title">
                            {p.title}
                        </h2>
                    </div>

                    <div className="raise__bar" ref={barRef} aria-hidden="true">
                        {items.map((it, i) => (
                            <span className={"raise__seg" + (active === i ? " is-active" : "")} style={{ ["--w" as any]: weights[i] }} key={i}></span>
                        ))}
                    </div>
                    <svg className="raise__links" viewBox={"0 0 " + W + " " + LINK_H} preserveAspectRatio="none" aria-hidden="true" focusable="false">
                        {geo.map((g, i) => (
                            <path
                                className={"raise__link" + (active === i ? " is-active" : "")}
                                style={{ ["--i" as any]: i }}
                                pathLength={1}
                                d={"M" + g.mid.toFixed(1) + " 0 C" + g.mid.toFixed(1) + " " + LINK_H * 0.55 + " " + g.end.toFixed(1) + " " + LINK_H * 0.45 + " " + g.end.toFixed(1) + " " + LINK_H}
                                key={i}
                            />
                        ))}
                    </svg>

                    <ul className="raise__list" style={{ ["--n" as any]: items.length }}>
                        {items.map((it, i) => (
                            <li
                                className={"raise__item" + (active === i ? " is-active" : "")}
                                onMouseEnter={() => setActive(i)}
                                onMouseLeave={() => setActive(-1)}
                                key={i}
                            >
                                <p className="raise__figure" data-count={it.figure}>
                                    {it.figure}
                                </p>
                                <p className="raise__label">{it.label}</p>
                            </li>
                        ))}
                    </ul>

                    {p.note ? <p className="raise__note">{p.note}</p> : null}
                </div>
            </section>
        </div>
    )
}

/* Behaviour: when the section is still below the fold, arm it (arcs hidden, figures at 0),
   then draw the arcs and count the figures up once as it comes into view. */
function initRaise(root: HTMLElement, life: Life) {
    const section = root.querySelector<HTMLElement>("[data-raise]")
    if (!section || !("IntersectionObserver" in window)) return
    if (window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches) return
    if (section.getBoundingClientRect().top < window.innerHeight * 0.85) return // already in view: leave it built

    const figures = Array.prototype.slice.call(section.querySelectorAll("[data-count]")) as HTMLElement[]
    const parsed = figures.map((el) => parseFigure(el.getAttribute("data-count") || ""))
    const format = (f: ReturnType<typeof parseFigure>, v: number) => {
        if (!f) return ""
        const num = f.grouped ? v.toLocaleString("en-US", { maximumFractionDigits: f.decimals }) : v.toFixed(f.decimals)
        return f.prefix + num + f.suffix
    }
    section.classList.add("is-armed")
    figures.forEach((el, i) => {
        if (parsed[i]) el.textContent = format(parsed[i], 0)
    })
    life.add(() => {
        section.classList.remove("is-armed", "is-in")
        figures.forEach((el) => (el.textContent = el.getAttribute("data-count") || ""))
    })

    const run = () => {
        section.classList.add("is-in")
        const start = performance.now()
        const dur = 1200
        const frame = (now: number) => {
            const t = Math.min(1, (now - start) / dur)
            const e = 1 - Math.pow(1 - t, 3)
            figures.forEach((el, i) => {
                const f = parsed[i]
                if (!f) return
                el.textContent = t >= 1 ? el.getAttribute("data-count") || "" : format(f, Math.round(f.value * e * Math.pow(10, f.decimals)) / Math.pow(10, f.decimals))
            })
            if (t < 1) life.raf(frame)
        }
        life.raf(frame)
    }

    const io = life.observe(
        new IntersectionObserver(
            (entries) => {
                if (entries.some((e) => e.isIntersecting)) {
                    io.disconnect()
                    run()
                }
            },
            { threshold: 0.35 }
        )
    )
    io.observe(section)
}

addPropertyControls(ArcoviaRaiseFrom, {
    chip: { type: ControlType.String, title: "Chip", defaultValue: DEFAULTS.chip },
    title: { type: ControlType.String, title: "Heading", displayTextArea: true, defaultValue: DEFAULTS.title },
    items: {
        type: ControlType.Array,
        title: "Figures",
        maxCount: 8,
        control: {
            type: ControlType.Object,
            controls: {
                figure: { type: ControlType.String, title: "Figure" },
                label: { type: ControlType.String, title: "Label" },
            },
        },
        defaultValue: DEFAULTS.items,
        description: "Largest first. The bar's parts follow the figures.",
    },
    note: { type: ControlType.String, title: "Footnote", displayTextArea: true, defaultValue: DEFAULTS.note },
})
