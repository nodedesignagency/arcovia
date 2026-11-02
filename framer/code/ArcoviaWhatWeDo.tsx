/**
 * Arcovia: "What we do" (Home block 3, after the data blocks).
 *
 * After a section the user sent from the Harmon Digital site ("How It Works",
 * harmon-digital-site.zip, src/components/sections/HowItWorks.tsx), rebuilt in
 * Arcovia's tokens: Montserrat, the h2/h3/lede/body sizes, ink on white, and
 * concrete in place of Harmon's coloured tiles.
 *
 * A centred head (chip, two-line headline, one line under it), then two halves.
 * On the left a stage holds still in the middle of the screen: the service's
 * number, large and faint, and a square concrete tile carrying a small white
 * drawing of what that service produces (a paper, drawn like a technical sheet:
 * hairlines, dashed construction lines running off its edges, a small square at
 * each corner). On the right the six services scroll past normally. Whichever
 * one holds the middle of the screen is the current one: its words at full ink,
 * the others a step back. When the next one takes over, the number rolls up to
 * it and the next tile pushes the current one up and out of the frame.
 *
 * The headline is still: no text animation (the user does not want Harmon's two-bar wipe).
 *
 * Timing as in the original: the tiles and the number move in 700ms on
 * cubic-bezier(0.8, 0, 0.2, 1); the words fade in 500ms.
 *
 * The current service is the one with the most pixels on screen
 * (IntersectionObserver, thresholds 5% apart). The rows are half a screen tall
 * and the stage is one row tall, stuck a quarter-screen from the top, so the
 * tile's centre is the screen's centre and each service's words pass through it.
 *
 * On the Framer canvas, and with reduced motion, it is the still layout with the
 * first service current. Below 810px there is no stage: each service shows its
 * own number and the words are all at full ink (desktop is what the client
 * reviews for now). The Framer layer holding it must not clip its content (the
 * stage is sticky).
 */
import * as React from "react"
import { addPropertyControls, ControlType } from "framer"
import { ASSETS, baseStyle, cssTag, useArcoviaScript, type Life } from "./ArcoviaBase.tsx"

const WHAT_WE_DO_CSS = `/* ==========================================================================
   SECTION: what-we-do — Home, block 3 of the brief
   Six services in a pinned scroll (after Harmon Digital's "How It Works"):
   a sticky stage on the left (number + concrete tile with a drawing), the
   services scrolling on the right. The script sets --step on the section and
   .is-current on the service holding the middle of the screen; the CSS does
   the moving. Uses shared tokens and the chip from the base.
   ========================================================================== */

.wwd {
  --wwd-tile: min(clamp(240px, 23.6cqi, 360px), 44svh);
  --wwd-ease: cubic-bezier(0.8, 0, 0.2, 1);   /* Harmon's tile and number move */
  --wwd-move: 700ms;
  --wwd-fade: 500ms;
  --wwd-dim: 0.25;                             /* services that are not current */
  --wwd-num-pale: rgba(21, 21, 21, 0.26);
  --step: 0;
  position: relative;
  padding-block: var(--space-10);
  background: var(--color-white);
  color: var(--color-text);
}

/* ---------- Head ---------- */
.wwd__head {
  display: grid;
  justify-items: center;
  gap: var(--space-4);
  text-align: center;
}
.wwd__title {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-1);
  font-size: var(--fs-h2);
  font-weight: var(--weight-medium);
  line-height: var(--lh-h2);
  letter-spacing: var(--ls-h2);
  color: var(--color-ink);
}
.wwd__line { display: block; }
.wwd__lede {
  max-width: 34em;
  margin-top: var(--space-2);
  font-size: var(--fs-lede);
  line-height: var(--lh-lede);
  color: var(--color-text);
  text-wrap: balance;
}

/* ---------- Body: stage on the left, services on the right ---------- */
.wwd__body {
  display: grid;
  grid-template-columns: repeat(12, minmax(0, 1fr));
  column-gap: var(--grid-gap);
  margin-top: var(--space-8);
}

.wwd__stage-cell { grid-column: 1 / span 6; }
.wwd__stage {
  position: sticky;
  top: 25svh;
  height: 50svh;
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: var(--space-7);
  padding-right: var(--space-8);
}

/* The number: "/" and two digits, each digit a strip of 0–9 that rolls.
   Fixed width (tabular figures), so the roll never shoves the tile sideways. */
.wwd__num {
  display: flex;
  flex: none;
  font-size: var(--fs-h2);
  font-weight: var(--weight-book);
  line-height: 1.1;
  letter-spacing: -0.02em;
  font-variant-numeric: tabular-nums;
  color: var(--wwd-num-pale);
  user-select: none;
}
.wwd__digit {
  display: block;
  height: 1.1em;
  overflow: hidden;
}
.wwd__strip {
  --d: 0;
  display: flex;
  flex-direction: column;
  transform: translateY(calc(var(--d) * -1.1em));
  transition: transform var(--wwd-move) var(--wwd-ease);
}
.wwd__strip > span { display: block; height: 1.1em; }

/* The tiles stand in a column inside a one-tile frame; the column moves up a
   tile per service, so the next tile pushes the current one up and out. */
.wwd__frame {
  position: relative;
  flex: none;
  width: var(--wwd-tile);
  height: var(--wwd-tile);
  overflow: hidden;
}
.wwd__tiles {
  display: flex;
  flex-direction: column;
  transform: translateY(calc(var(--step) * -1 * var(--wwd-tile)));
  transition: transform var(--wwd-move) var(--wwd-ease);
}
.wwd__tile {
  position: relative;
  flex: none;
  width: var(--wwd-tile);
  height: var(--wwd-tile);
  background-color: var(--color-concrete);
  background-image: url("${ASSETS.concrete}");
  background-size: 520px auto;
}
/* each tile shows its own patch of the slab, so the push reads as one cast surface */
.wwd__tile:nth-child(2n) { background-position: 37% 61%; }
.wwd__tile:nth-child(3n) { background-position: 72% 18%; }
.wwd__sheet {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 92%;
  height: auto;
  transform: translate(-50%, -50%);
  overflow: visible;
  font-family: var(--font-sans);
}

/* ---------- Services ---------- */
.wwd__steps { grid-column: 7 / span 6; }
.wwd__step {
  display: flex;
  flex-direction: column;
  justify-content: center;
  min-height: 50svh;
}
.wwd__step-num { display: none; }
.wwd__step-text {
  display: grid;
  gap: var(--space-4);
  opacity: var(--wwd-dim);
  transition: opacity var(--wwd-fade) ease;
}
.wwd__step.is-current .wwd__step-text { opacity: 1; }
.wwd__step-title {
  max-width: 20em;
  font-size: var(--fs-h3);
  font-weight: var(--weight-medium);
  line-height: var(--lh-h3);
  letter-spacing: var(--ls-h3);
  color: var(--color-ink);
}
.wwd__step-body {
  max-width: 28em;
  font-size: var(--fs-body);
  line-height: var(--lh-body);
  color: var(--color-text);
  text-wrap: pretty;
}

/* ---------- Tablet: the same, a smaller tile ---------- */
@container arc (max-width: 1199px) {
  .wwd__stage { gap: var(--space-6); padding-right: var(--space-6); }
}

/* ---------- Phone: no stage; each service carries its own number ---------- */
@container arc (max-width: 809px) {
  .wwd { padding-block: var(--space-9); }
  .wwd__body { display: block; margin-top: var(--space-7); }
  .wwd__stage-cell { display: none; }
  .wwd__step { min-height: 0; padding-block: var(--space-5); border-top: 1px solid var(--color-line); }
  .wwd__step-num {
    display: block;
    margin-bottom: var(--space-3);
    font-size: 32px;
    line-height: 1;
    font-variant-numeric: tabular-nums;
    color: var(--wwd-num-pale);
  }
  .wwd__step-text { opacity: 1; }
}

@media (prefers-reduced-motion: reduce) {
  .wwd__strip, .wwd__tiles, .wwd__step-text { transition: none; }
}
`

/* ==========================================================================
   The drawings: one white sheet per service, 240×168 on a 272×200 canvas
   (16 of margin for the construction lines). Monochrome: hairlines in the ink,
   concrete greys for what is selected, solid ink for the one thing that
   matters most. Decorative: the words beside them say everything.
   ========================================================================== */
type Drawing = "narrative" | "strategy" | "equity" | "debt" | "mna" | "fund"

const INK = "#151515"
const LINE = "rgba(21, 21, 21, 0.55)"
const FAINT = "rgba(21, 21, 21, 0.3)"
const GREY = "#e4e4e3" // a selected row
const STONE = "#d3d3d3" // concrete
const BAR = "rgba(21, 21, 21, 0.12)" // where a real paper would have text no one needs to read
const VW = 272
const VH = 200
const M = 16
const L = M + 12 // sheet's inner left
const R = VW - M - 12 // sheet's inner right

function T(p: { x: number; y: number; children: React.ReactNode; anchor?: "start" | "middle" | "end"; size?: number; fill?: string; muted?: boolean; weight?: number }) {
    return (
        <text x={p.x} y={p.y} fontSize={p.size ?? 8.2} fontWeight={p.weight ?? 500} textAnchor={p.anchor ?? "start"} fill={p.fill ?? INK} fillOpacity={p.muted ? 0.55 : 1}>
            {p.children}
        </text>
    )
}
function Caps(p: { x: number; y: number; children: string; anchor?: "start" | "middle" | "end"; muted?: boolean; fill?: string }) {
    return (
        <T x={p.x} y={p.y} size={6.6} anchor={p.anchor} muted={p.muted} fill={p.fill} weight={600}>
            <tspan letterSpacing="0.1em">{p.children.toUpperCase()}</tspan>
        </T>
    )
}
function Box(p: { x: number; y: number; w: number; h?: number; label?: string; fill?: string; ink?: boolean; dashed?: boolean; size?: number }) {
    const h = p.h ?? 20
    const fill = p.ink ? INK : p.fill ?? "#fff"
    return (
        <g>
            <rect x={p.x} y={p.y} width={p.w} height={h} fill={fill} stroke={p.ink ? INK : LINE} strokeWidth={0.6} strokeDasharray={p.dashed ? "2 2" : undefined} />
            {p.label ? (
                <T x={p.x + p.w / 2} y={p.y + h / 2 + 2.9} anchor="middle" size={p.size} fill={p.ink ? "#fff" : INK}>
                    {p.label}
                </T>
            ) : null}
        </g>
    )
}
function Dots(p: { d: string }) {
    return <path d={p.d} fill="none" stroke={LINE} strokeWidth={0.6} strokeDasharray="1.6 1.6" />
}
function Bar(p: { x: number; y: number; w: number }) {
    return <rect x={p.x} y={p.y} width={p.w} height={3.2} fill={BAR} />
}
function Legend(p: { label: string; ink?: boolean }) {
    return (
        <g>
            <rect x={L} y={VH - M - 15.5} width={5} height={5} fill={p.ink ? INK : STONE} stroke={p.ink ? INK : LINE} strokeWidth={0.5} />
            <Caps x={L + 9} y={VH - M - 11} muted>
                {p.label}
            </Caps>
        </g>
    )
}

/** Header icons, 10×10, drawn in the ink */
const ICONS: Record<Drawing, string> = {
    narrative: "M1.5 .5h5l2 2v7h-7zM3 4h4M3 6h4M3 8h2.5",
    strategy: "M.5 2h9M.5 5h9M.5 8h9M3 .8v2.4M7 3.8v2.4M4.5 6.8v2.4",
    equity: "M5 1.6a1.1 1.1 0 1 0 0 .01M1.8 8.4a1.1 1.1 0 1 0 0 .01M8.2 8.4a1.1 1.1 0 1 0 0 .01M4.4 2.6 2.4 7.4M5.6 2.6l2 4.8M2.9 8.5h4.2",
    debt: "M.5 2.5h9v1.6h-9zM.5 5.2h9v1.6h-9zM.5 7.9h9v1.6h-9z",
    mna: "M.5 3h8M6.5 1l2 2-2 2M9.5 7h-8M3.5 5l-2 2 2 2",
    fund: "M5 .5 9.5 3h-9zM1.5 4v4M3.8 4v4M6.2 4v4M8.5 4v4M.5 9.5h9",
}

function Sheet(p: { kind: Drawing; label: string; right: string; children: React.ReactNode }) {
    const x2 = VW - M
    const y2 = VH - M
    return (
        <svg className="wwd__sheet" viewBox={`0 0 ${VW} ${VH}`} aria-hidden="true" focusable="false">
            {/* construction lines and corner marks */}
            <g stroke={FAINT} strokeWidth={0.5} strokeDasharray="2 2">
                <line x1={0} x2={VW} y1={M} y2={M} />
                <line x1={0} x2={VW} y1={y2} y2={y2} />
                <line x1={M} x2={M} y1={0} y2={VH} />
                <line x1={x2} x2={x2} y1={0} y2={VH} />
            </g>
            <rect x={M} y={M} width={VW - 2 * M} height={VH - 2 * M} fill="#fff" stroke={LINE} strokeWidth={0.6} />
            {[
                [M, M],
                [x2, M],
                [M, y2],
                [x2, y2],
            ].map(([cx, cy], i) => (
                <rect key={i} x={cx - 1.6} y={cy - 1.6} width={3.2} height={3.2} fill={INK} />
            ))}
            {/* header */}
            <path d={ICONS[p.kind]} transform={`translate(${L} ${M + 8})`} fill="none" stroke={INK} strokeWidth={0.8} strokeLinecap="round" strokeLinejoin="round" />
            <Caps x={L + 15} y={M + 15.6}>
                {p.label}
            </Caps>
            <Caps x={R} y={M + 15.6} anchor="end" muted>
                {p.right}
            </Caps>
            <line x1={M} x2={x2} y1={M + 26} y2={M + 26} stroke={FAINT} strokeWidth={0.5} />
            {p.children}
        </svg>
    )
}

function DrawingNarrative() {
    const cols = [64, 136, 208]
    return (
        <Sheet kind="narrative" label="Positioning" right="One system">
            <Box x={L} y={56} w={R - L} label="Core narrative" ink />
            <Dots d={`M136 76v10M64 86h144M64 86v10M136 86v10M208 86v10`} />
            {cols.map((c, i) => (
                <g key={i}>
                    <Box x={c - 32} y={96} w={64} label={["Memo", "Teaser", "Deck"][i]} fill={STONE} />
                    <Bar x={c - 28} y={124} w={56} />
                    <Bar x={c - 28} y={132} w={44} />
                    <Bar x={c - 28} y={140} w={50} />
                </g>
            ))}
            <Legend label="Stress-tested with investors" />
        </Sheet>
    )
}

function DrawingStrategy() {
    const rows = ["Round size", "Valuation anchor", "Structure", "Closing sequence"]
    return (
        <Sheet kind="strategy" label="Capital strategy" right="Sequence">
            <rect x={M + 0.3} y={75} width={VW - 2 * M - 0.6} height={24} fill={GREY} />
            <Dots d="M38 64v84" />
            {rows.map((r, i) => {
                const y = 63 + i * 24
                const last = i === rows.length - 1
                return (
                    <g key={r}>
                        <circle cx={38} cy={y} r={5} fill={last ? INK : "#fff"} stroke={last ? INK : LINE} strokeWidth={0.6} />
                        <T x={38} y={y + 2.3} anchor="middle" size={6.2} fill={last ? "#fff" : INK}>
                            {String(i + 1)}
                        </T>
                        <T x={52} y={y + 2.9}>
                            {r}
                        </T>
                        <Bar x={176} y={y - 1.6} w={i === 1 ? 52 : 40 + ((i * 7) % 14)} />
                    </g>
                )
            })}
            <Legend label="Sized, anchored, sequenced" ink />
        </Sheet>
    )
}

function DrawingEquity() {
    const dots: React.ReactNode[] = []
    const lit = new Set([3, 9, 16, 22, 27, 34, 41, 45, 52, 58, 66, 71, 79, 86, 90, 97, 103, 110])
    let k = 0
    for (let row = 0; row < 7; row++) {
        for (let col = 0; col < 18; col++) {
            const on = lit.has(k)
            dots.push(<circle key={k} cx={L + 6 + col * 12} cy={90 + row * 10} r={on ? 1.9 : 1.1} fill={INK} fillOpacity={on ? 1 : 0.22} />)
            k++
        }
    }
    return (
        <Sheet kind="equity" label="Equity" right="3,000+ relationships">
            <Box x={L} y={56} w={68} label="Growth equity" fill={STONE} />
            <Box x={L + 74} y={56} w={40} label="PIPEs" />
            <Box x={L + 120} y={56} w={R - L - 120} label="Registered directs" />
            {dots}
            <Legend label="Institutions on the shortlist" ink />
        </Sheet>
    )
}

function DrawingDebt() {
    const layers = ["Subordinated", "Mezzanine", "Venture debt", "Growth lending", "Unitranche"]
    const fills = ["#fff", "#f4f4f3", GREY, STONE, INK]
    return (
        <Sheet kind="debt" label="Capital stack" right="Debt">
            {layers.map((name, i) => {
                const y = 54 + i * 22
                const ink = i === layers.length - 1
                return (
                    <g key={name}>
                        <rect x={L} y={y} width={R - L} height={18} fill={fills[i]} stroke={ink ? INK : LINE} strokeWidth={0.6} />
                        <T x={L + 8} y={y + 11.9} fill={ink ? "#fff" : INK}>
                            {name}
                        </T>
                        <rect x={R - 58} y={y + 7.4} width={50 - i * 4} height={3.2} fill={ink ? "rgba(255,255,255,0.35)" : BAR} />
                    </g>
                )
            })}
            <Caps x={R} y={VH - M - 11} anchor="end" muted>
                Senior at the base
            </Caps>
            <Legend label="Placed" ink />
        </Sheet>
    )
}

function DrawingMna() {
    const xs = [40, 104, 168, 232]
    return (
        <Sheet kind="mna" label="Mandate" right="Cross-border">
            <Box x={L} y={56} w={84} label="Sell-side" fill={STONE} />
            <Box x={R - 84} y={56} w={84} label="Buy-side" />
            <Dots d={`M${L + 84} 66H${R - 84}`} />
            <circle cx={136} cy={66} r={3} fill={INK} />
            <Caps x={L} y={106} muted>
                Project finance
            </Caps>
            <line x1={xs[0]} x2={xs[3]} y1={128} y2={128} stroke={FAINT} strokeWidth={0.8} />
            <line x1={xs[0]} x2={xs[2]} y1={128} y2={128} stroke={INK} strokeWidth={1.2} />
            {xs.map((x, i) => (
                <g key={x}>
                    <rect x={x - 4} y={124} width={8} height={8} transform={`rotate(45 ${x} 128)`} fill={i < 2 ? INK : i === 2 ? STONE : "#fff"} stroke={i < 3 ? INK : LINE} strokeWidth={0.6} />
                    <Bar x={x - 14} y={142} w={28} />
                </g>
            ))}
            <Legend label="Released at each milestone" ink />
        </Sheet>
    )
}

function DrawingFund() {
    const lps = [52, 136, 220]
    return (
        <Sheet kind="fund" label="Fund formation" right="Partnerships">
            <Box x={102} y={52} w={68} label="Manager" />
            <Dots d="M136 72v10" />
            <Box x={102} y={82} w={68} label="Fund" ink />
            <Box x={L} y={82} w={68} label="Fund-to-fund" dashed size={7.4} />
            <Box x={R - 68} y={82} w={68} label="Co-invest" dashed size={7.4} />
            <Dots d={`M${L + 68} 92H102M170 92H${R - 68}M136 102v12M52 114h168M52 114v10M136 114v10M220 114v10`} />
            {lps.map((x) => (
                <Box key={x} x={x - 24} y={124} w={48} label="LP" fill={STONE} />
            ))}
            <Legend label="LP strategy" />
        </Sheet>
    )
}

const DRAWINGS: Record<Drawing, () => React.ReactElement> = {
    narrative: DrawingNarrative,
    strategy: DrawingStrategy,
    equity: DrawingEquity,
    debt: DrawingDebt,
    mna: DrawingMna,
    fund: DrawingFund,
}
const DRAWING_KEYS = Object.keys(DRAWINGS) as Drawing[]

/* ========================================================================== */

interface Service {
    title: string
    text: string
    drawing: Drawing
}

interface Props {
    chip: string
    line1: string
    line2: string
    lede: string
    services: Service[]
    style?: React.CSSProperties
}

const DEFAULTS: Props = {
    chip: "What we do",
    // The headline from the brief, in two lines
    line1: "Capital advisory",
    line2: "built around conviction",
    // [COPY NEEDED] Draft line under the headline
    lede: "Six disciplines, one senior team, from the first investor conversation to the close.",
    services: [
        {
            title: "Investor Narrative & Positioning",
            text: "Memo, teaser and deck built as one positioning system, stress-tested against real investor objections.",
            drawing: "narrative",
        },
        {
            title: "Capital Strategy",
            text: "Round sizing, valuation anchoring, structure and the closing sequence.",
            drawing: "strategy",
        },
        {
            title: "Equity Raising",
            text: "Growth equity, PIPEs and registered directs, through 3,000+ institutional relationships.",
            drawing: "equity",
        },
        {
            title: "Debt Advisory & Placement",
            text: "Venture debt, growth lending, unitranche, mezzanine and subordinated debt.",
            drawing: "debt",
        },
        {
            title: "M&A and Project Finance",
            text: "Sell-side, buy-side and cross-border mandates, and milestone-based project finance.",
            drawing: "mna",
        },
        {
            title: "Fund Formation & Partnerships",
            text: "Emerging managers, LP strategy, fund-to-fund and co-investment partnerships.",
            drawing: "fund",
        },
    ],
}

function pad2(n: number) {
    return String(n).padStart(2, "0").slice(-2)
}

/** Hyphenated words ("stress-tested", "co-investment") never break at the hyphen */
function Unbroken({ text }: { text: string }) {
    const parts = text.split(/(\S*\w-\w\S*)/)
    return (
        <>
            {parts.map((part, i) =>
                i % 2 ? (
                    <span className="nowrap" key={i}>
                        {part}
                    </span>
                ) : (
                    part
                )
            )}
        </>
    )
}

/**
 * @framerSupportedLayoutWidth any-prefer-fixed
 * @framerSupportedLayoutHeight auto
 */
export default function ArcoviaWhatWeDo(incoming: Partial<Props>) {
    const p = { ...DEFAULTS, ...incoming }
    const services = p.services?.length ? p.services : DEFAULTS.services
    const ref = React.useRef<HTMLDivElement>(null)
    const key = String(services.length)
    useArcoviaScript(ref, (root, life) => initWhatWeDo(root, life), [key])

    const first = pad2(1)
    const lines = [p.line1, p.line2].filter((l) => l && l.trim())

    return (
        <div className="arc arc-what-we-do" ref={ref} style={p.style}>
            {baseStyle()}
            {cssTag("what-we-do", WHAT_WE_DO_CSS)}
            <section className="wwd" data-wwd="" aria-labelledby="wwd-title">
                <div className="container">
                    <div className="wwd__head">
                        <p className="chip">{p.chip}</p>
                        <h2 className="wwd__title" id="wwd-title">
                            {lines.map((line, i) => (
                                <React.Fragment key={i}>
                                    {i ? " " : null}
                                    <span className="wwd__line">{line}</span>
                                </React.Fragment>
                            ))}
                        </h2>
                        {p.lede ? <p className="wwd__lede">{p.lede}</p> : null}
                    </div>

                    <div className="wwd__body">
                        {/* The stage. Its cell runs the full height of the list beside it and the
                            stage is sticky inside it, so the pin lasts exactly as long as there are
                            services to scroll past. Decorative: the list says everything it shows. */}
                        <div className="wwd__stage-cell" aria-hidden="true">
                            <div className="wwd__stage">
                                <div className="wwd__num">
                                    <span>/</span>
                                    {[0, 1].map((k) => (
                                        <span className="wwd__digit" key={k}>
                                            <span className="wwd__strip" style={{ ["--d" as any]: first[k] }}>
                                                {"0123456789".split("").map((d) => (
                                                    <span key={d}>{d}</span>
                                                ))}
                                            </span>
                                        </span>
                                    ))}
                                </div>
                                <div className="wwd__frame">
                                    <div className="wwd__tiles">
                                        {services.map((s, i) => {
                                            const D = DRAWINGS[s.drawing] || DRAWINGS[DRAWING_KEYS[i % DRAWING_KEYS.length]]
                                            return (
                                                <div className="wwd__tile" key={i}>
                                                    <D />
                                                </div>
                                            )
                                        })}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Component: service row (number on phone, title, line) */}
                        <ol className="wwd__steps">
                            {services.map((s, i) => (
                                <li className={"wwd__step" + (i === 0 ? " is-current" : "")} key={i}>
                                    <span className="wwd__step-num" aria-hidden="true">
                                        /{pad2(i + 1)}
                                    </span>
                                    <div className="wwd__step-text">
                                        <h3 className="wwd__step-title">{s.title}</h3>
                                        <p className="wwd__step-body">
                                            <Unbroken text={s.text} />
                                        </p>
                                    </div>
                                </li>
                            ))}
                        </ol>
                    </div>
                </div>
            </section>
        </div>
    )
}

/* ==========================================================================
   Behaviour
   ========================================================================== */
const THRESHOLDS = Array.from({ length: 21 }, (_, i) => i / 20)

function initWhatWeDo(root: HTMLElement, life: Life) {
    const sec = root.querySelector<HTMLElement>("[data-wwd]")
    if (!sec) return
    const rows = Array.prototype.slice.call(sec.querySelectorAll(".wwd__step")) as HTMLElement[]
    const strips = Array.prototype.slice.call(sec.querySelectorAll(".wwd__strip")) as HTMLElement[]

    /* ---------- The current service: number, tile and ink follow it ---------- */
    let current = -1
    function setCurrent(i: number) {
        if (i === current) return
        current = i
        sec!.style.setProperty("--step", String(i))
        const digits = pad2(i + 1)
        strips.forEach((s, k) => s.style.setProperty("--d", digits[k]))
        rows.forEach((r, k) => r.classList.toggle("is-current", k === i))
    }
    setCurrent(0)

    if (rows.length && "IntersectionObserver" in window) {
        const seen = new Map<Element, number>()
        const io = life.observe(
            new IntersectionObserver(
                (entries) => {
                    for (const e of entries) seen.set(e.target, e.isIntersecting ? e.intersectionRect.height : 0)
                    // Most pixels on screen wins; ties go to the later row, so a service takes
                    // over the moment it covers as much as the one before.
                    let next = -1
                    let most = 0
                    rows.forEach((r, k) => {
                        const px = seen.get(r) || 0
                        if (px > 0 && px >= most) {
                            most = px
                            next = k
                        }
                    })
                    if (next >= 0) setCurrent(next)
                },
                { threshold: THRESHOLDS }
            )
        )
        rows.forEach((r) => io.observe(r))
    }
}

addPropertyControls(ArcoviaWhatWeDo, {
    chip: { type: ControlType.String, title: "Chip", defaultValue: DEFAULTS.chip },
    line1: { type: ControlType.String, title: "Headline 1", defaultValue: DEFAULTS.line1 },
    line2: { type: ControlType.String, title: "Headline 2", defaultValue: DEFAULTS.line2 },
    lede: { type: ControlType.String, title: "Line", displayTextArea: true, defaultValue: DEFAULTS.lede },
    services: {
        type: ControlType.Array,
        title: "Services",
        maxCount: 12,
        control: {
            type: ControlType.Object,
            controls: {
                title: { type: ControlType.String, title: "Title" },
                text: { type: ControlType.String, title: "Line", displayTextArea: true },
                drawing: {
                    type: ControlType.Enum,
                    title: "Drawing",
                    options: DRAWING_KEYS,
                    optionTitles: ["Narrative", "Strategy", "Equity", "Debt", "M&A", "Fund"],
                    defaultValue: "narrative",
                },
            },
        },
        defaultValue: DEFAULTS.services,
    },
})
