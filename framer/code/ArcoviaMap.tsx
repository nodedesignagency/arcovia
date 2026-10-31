/**
 * Arcovia: world map, Home "Where we are".
 *
 * The text on the left (chip, headline, body, an outlined pill), the concrete
 * globe on the right and a quiet index of the cities under the text. The globe
 * is WebGL: the hero's concrete wrapped round a sphere, land raised as stone
 * relief with a crisp coastline. Drag it (or use the arrow keys) to turn it; it
 * glides on when let go. Every time the map comes into view, arcs draw out from
 * the origin city (Los Angeles) one after another, each city's square marker
 * lands as its arc arrives, then short pulses keep running out along the arcs.
 * The offices are always labelled; any other city shows its label while its
 * marker or its row in the index is hovered or focused, and picking a row turns
 * the globe to it. Cities turned to the far side are hidden. Without WebGL the
 * globe falls back to flat grey dots on a pale disc.
 *
 * The city index is the map's data. It fills two columns of eight rows: with
 * the default order, column one holds the offices, the Americas and the Middle
 * East, column two Europe.
 *
 * On the Framer canvas the script does not run: the globe shows as the flat
 * fallback, still, with the arcs drawn and the offices labelled.
 * Ported from map.js and sections/map.css on main.
 */
import * as React from "react"
import { addPropertyControls, ControlType } from "framer"
import { ASSETS, baseStyle, cssTag, sprite, isStaticRender, useArcoviaScript, type Life } from "./ArcoviaBase.tsx"
import { LAND_DOTS } from "./ArcoviaLandDots.tsx"

const MAP_CSS = `/* ==========================================================================
   SECTION: map — Home, block 4 (where we are in the world)
   Laid out after Grok's offices section, on white: the text on the left
   (chip, headline, body, an outlined pill), the concrete globe on the right
   with SpaceXAI-style arcs and coordinate labels, and a quiet index of the
   fifteen cities under the text. map.js draws the globe (WebGL canvas), the
   arcs and markers (SVG) and the labels (HTML) from the index's data
   attributes. Desktop is two columns; tablet and phone stack text, globe,
   index.
   Uses shared tokens, the chip and the arrow icon from styles.css.
   ========================================================================== */

.map {
  padding-block: var(--space-11) var(--space-10);
  background: var(--color-white);
}

.map { overflow-x: clip; } /* arcs and labels may reach past the column while the globe turns */

/* ---------- Layout: text and index on the left, globe on the right ---------- */
.map__layout {
  display: grid;
  grid-template-columns: repeat(12, minmax(0, 1fr));
  column-gap: var(--grid-gap);
  row-gap: var(--space-7);
}
.map__head { grid-column: 1 / span 5; grid-row: 1; align-self: end; }
.map__cities { grid-column: 1 / span 5; grid-row: 2; align-self: start; }
.map__figure { grid-column: 6 / -1; grid-row: 1 / span 2; align-self: center; margin: 0; }

/* ---------- Head ---------- */
.map__head {
  display: grid;
  justify-items: start;
  gap: var(--space-5);
}
.map__title {
  max-width: 11em;
  margin-top: var(--space-1);
  text-wrap: balance;
  font-size: var(--fs-h2);
  font-weight: var(--weight-medium);
  line-height: var(--lh-h2);
  letter-spacing: var(--ls-h2);
  color: var(--color-ink);
}
.map__body {
  max-width: 30em;
  text-wrap: pretty;
  font-size: var(--fs-body);
  line-height: var(--lh-body);
  color: var(--color-text);
}
/* An outlined pill, as in the reference */
.map__more {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  height: 44px;
  margin-top: var(--space-2);
  padding: 0 20px;
  border: 1px solid rgba(43, 43, 43, 0.28);
  border-radius: var(--radius-pill);
  font-size: var(--fs-small);
  font-weight: var(--weight-medium);
  color: var(--color-ink);
  transition: border-color var(--dur-fast) var(--ease-out), background-color var(--dur-fast) var(--ease-out);
}
.map__arrow {
  flex: none;
  width: 14px;
  height: 14px;
  transition: transform var(--dur-base) var(--ease-out);
}
@media (hover: hover) {
  .map__more:hover { border-color: var(--color-ink); }
  .map__more:hover .map__arrow { transform: translateX(3px); }
}

/* ---------- Stage: globe, arcs and labels ---------- */
.map__figure { margin: var(--space-6) 0 0; }

/* The whole globe, its arcs and its shadow; arcs and labels may reach past
   the stage while it turns */
.map__stage {
  position: relative;
  height: 640px; /* set by map.js */
  cursor: grab;
  touch-action: pan-y; /* sideways drags turn the globe, up and down still scrolls */
  user-select: none;
  -webkit-user-select: none;
  outline-offset: 4px;
}
.is-turning .map__stage { cursor: grabbing; }
.map__globe,
.map__lines,
.map__labels {
  position: absolute;
  inset: 0;
}
.map__lines { overflow: visible; }
.map__globe { pointer-events: none; }
.map__labels { pointer-events: none; }

/* Arcs draw out from Los Angeles, one after another (map.js sets the dash) */
.map__arc {
  fill: none;
  stroke: rgba(43, 43, 43, 0.5);
  stroke-width: 1.1;
  stroke-linecap: round;
  transition: opacity var(--dur-base) var(--ease-out), stroke var(--dur-base) var(--ease-out);
}
/* A short pulse running out from Los Angeles along each arc */
.map__pulse {
  fill: none;
  stroke: var(--color-ink);
  stroke-width: 2.2;
  stroke-linecap: round;
  transition: opacity var(--dur-base) var(--ease-out);
}

/* Square markers, as in the references; each lands as its arc arrives */
.map__mark {
  fill: var(--color-ink);
  stroke: var(--color-white);
  stroke-width: 2;
  paint-order: stroke;
  opacity: 0;
  transform-box: fill-box;
  transform-origin: center;
  transform: scale(0.4);
  transition: opacity 360ms var(--ease-out), transform 420ms var(--ease-out);
}
.map__mark.is-landed { opacity: 1; transform: none; }

.map__hit { fill: transparent; pointer-events: all; }

/* Labels: city and coordinates; the offices in a thin box, always shown */
.map__label {
  position: absolute;
  left: 0;
  top: 0;
  display: grid;
  gap: 2px;
  padding: 4px 6px;
  background: rgba(255, 255, 255, 0.86); /* keeps the text clear of the dots */
  white-space: nowrap;
  opacity: 0;
  transition: opacity var(--dur-base) var(--ease-out);
}
.map__label-name {
  font-size: 11px;
  font-weight: var(--weight-semibold);
  letter-spacing: 0.08em;
  line-height: 1.3;
  text-transform: uppercase;
  color: var(--color-ink);
}
.map__label-meta {
  font-size: 11px;
  line-height: 1.3;
  font-variant-numeric: tabular-nums;
  color: var(--color-text-muted);
}
.map__label--office {
  padding: 8px 10px 9px;
  background: rgba(255, 255, 255, 0.94);
  border: 1px solid rgba(43, 43, 43, 0.22);
}
.map__label--office.is-landed { opacity: 1; transition-delay: 150ms; }
.is-compact .map__label--office:not(.is-active) { opacity: 0; }
.map__label.is-active { opacity: 1; }

/* Turned to the far side of the globe */
.map .map__mark.is-behind,
.map .map__label.is-behind { opacity: 0; transition-duration: 120ms; transition-delay: 0s; }

/* Hovering a city brings its arc forward and fades the others */
.has-focus .map__arc,
.has-focus .map__pulse { opacity: 0.3; }
.map__pulse.is-active { opacity: 1; }
.map__arc.is-active { opacity: 1; stroke: var(--color-ink); stroke-width: 1.6; }
.map__mark.is-active { transform: scale(1.35); }

/* Reduced motion: no transitions */
.is-instant .map__arc,
.is-instant .map__mark,
.is-instant .map__label { transition: none; }

/* ---------- City index: two columns of names, quiet; picking one turns the globe ---------- */
.map__cities {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  grid-template-rows: repeat(8, auto);
  grid-auto-flow: column;
  column-gap: var(--grid-gap);
  max-width: 30em;
  border-bottom: 1px solid var(--color-line);
}
.map__city {
  display: flex;
  align-items: center;
  gap: 10px;
  min-height: 38px;
  padding: 6px 4px;
  border-top: 1px solid var(--color-line);
  outline-offset: -2px;
  cursor: pointer;
  transition: background-color var(--dur-fast) var(--ease-out);
}
.map__city.is-active { background: var(--color-well); }
.map__city-name {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 15px;
  font-weight: var(--weight-medium);
  color: var(--color-ink);
}
/* The same square as on the map */
.map__city-name::before {
  content: "";
  flex: none;
  width: 7px;
  height: 7px;
  background: var(--color-ink);
}
.map__city-tag {
  margin-left: auto;
  font-size: 12px;
  color: var(--color-text-muted);
}

/* ---------- Tablet: text, globe, index, one under the other ---------- */
@container arc (max-width: 1199px) {
  .map { padding-block: var(--space-10) var(--space-9); }
  .map__layout { row-gap: var(--space-6); }
  .map__head,
  .map__figure,
  .map__cities { grid-column: 1 / -1; grid-row: auto; align-self: auto; }
  .map__title { max-width: 14em; }
  .map__cities { max-width: none; }
}

/* ---------- Phone ---------- */
@container arc (max-width: 809px) {
  .map { padding-block: var(--space-9) var(--space-8); }
  .map__head { gap: var(--space-4); }
  .map__body { font-size: 16px; }
  .map__layout { row-gap: var(--space-5); }
  .map__city-name { font-size: 14px; gap: 8px; }
}

/* Framer canvas only: the still globe follows the live compact map on phones, where the
   office labels show only for a picked city (the script's .is-compact) */
@container arc (max-width: 809px) {
  .map__label.map__label--still.is-landed { opacity: 0; }
}
`

type Side = "left" | "right" | "above" | "below"

interface City {
    name: string
    lat: number
    lon: number
    office: boolean
    side: Side
}

interface Props {
    chip: string
    title: string
    body: string
    linkLabel: string
    link: string
    cities: City[]
    origin: string
    centerLat: number
    centerLon: number
    style?: React.CSSProperties
}

const DEFAULTS: Props = {
    chip: "Where we are",
    title: "Rooted in Los Angeles and San Juan. Working across four regions.",
    body: "Our team and senior advisors work across North America, Europe, the Middle East and Asia-Pacific, with 3,000+ institutional relationships in more than 50 countries.",
    linkLabel: "Explore the map",
    link: "/about#map",
    // Column one: the offices, the Americas, the Middle East; column two: Europe
    cities: [
        { name: "Los Angeles", lat: 34.0522, lon: -118.2437, office: true, side: "left" },
        { name: "San Juan", lat: 18.4655, lon: -66.1057, office: true, side: "right" },
        { name: "San Francisco", lat: 37.7749, lon: -122.4194, office: false, side: "above" },
        { name: "New York", lat: 40.7128, lon: -74.006, office: false, side: "above" },
        { name: "Houston", lat: 29.7604, lon: -95.3698, office: false, side: "below" },
        { name: "São Paulo", lat: -23.5505, lon: -46.6333, office: false, side: "right" },
        { name: "Dubai", lat: 25.2048, lon: 55.2708, office: false, side: "above" },
        { name: "Abu Dhabi", lat: 24.4539, lon: 54.3773, office: false, side: "left" },
        { name: "London", lat: 51.5074, lon: -0.1278, office: false, side: "above" },
        { name: "Paris", lat: 48.8566, lon: 2.3522, office: false, side: "right" },
        { name: "Geneva", lat: 46.2044, lon: 6.1432, office: false, side: "left" },
        { name: "Zurich", lat: 47.3769, lon: 8.5417, office: false, side: "above" },
        { name: "Milan", lat: 45.4642, lon: 9.19, office: false, side: "right" },
        { name: "Monaco", lat: 43.7384, lon: 7.4246, office: false, side: "below" },
        { name: "Budapest", lat: 47.4979, lon: 19.0402, office: false, side: "right" },
    ],
    origin: "Los Angeles",
    centerLat: 30,
    centerLon: -26,
}

/** A city as the markup carries it: data-city is a slug of the name ("los-angeles") */
interface CityData {
    id: string
    name: string
    lat: number
    lon: number
    office: boolean
    side: Side
}

function slug(name: string) {
    return String(name || "")
        .normalize("NFD")
        .replace(/[̀-ͯ]/g, "")
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "")
}

/** Place names of more than one word stay on one line, with any punctuation after them ("San Juan.") */
function keepNamesTogether(title: string, names: string[]): React.ReactNode {
    const multi = names
        .map((n) => (n || "").trim())
        .filter((n) => /\s/.test(n))
        .sort((a, b) => b.length - a.length)
    if (!multi.length || !title) return title
    const esc = multi.map((n) => n.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"))
    // Two capture groups: [text, name, punctuation, text, name, punctuation, …, text]
    const parts = title.split(new RegExp("(" + esc.join("|") + ")([.,;:!?]*)"))
    const out: React.ReactNode[] = []
    for (let i = 0; i < parts.length; i += 3) {
        if (parts[i]) out.push(parts[i])
        if (i + 1 < parts.length)
            out.push(
                <span className="nowrap" key={i}>
                    {parts[i + 1] + (parts[i + 2] || "")}
                </span>
            )
    }
    return out
}

/** "Concrete globe with arcs from Los Angeles to San Juan, …, Monaco and Budapest. Drag, …" */
function stageLabel(cities: CityData[], origin: CityData | undefined) {
    const to = cities.filter((c) => c !== origin).map((c) => c.name)
    const list = to.length > 1 ? to.slice(0, -1).join(", ") + " and " + to[to.length - 1] : to.join("")
    return "Concrete globe with arcs from " + (origin ? origin.name : "") + " to " + list + ". Drag, or use the arrow keys, to turn it."
}

/**
 * @framerSupportedLayoutWidth any-prefer-fixed
 * @framerSupportedLayoutHeight auto
 */
export default function ArcoviaMap(incoming: Partial<Props>) {
    const p = { ...DEFAULTS, ...incoming }
    const list = (p.cities?.length ? p.cities : DEFAULTS.cities).filter((c) => c && c.name)
    const cities: CityData[] = list.map((c) => ({
        id: slug(c.name),
        name: c.name,
        lat: Number(c.lat) || 0,
        lon: Number(c.lon) || 0,
        office: !!c.office,
        side: c.side || "right",
    }))
    const originId = slug(p.origin)
    const origin = cities.filter((c) => c.id === originId)[0] || cities[0]
    // As map.js reads them (a blank centre falls back to 20, -35)
    const home = { lat: parseFloat(String(p.centerLat)) || 20, lon: parseFloat(String(p.centerLon)) || -35 }

    const ref = React.useRef<HTMLDivElement>(null)
    const titleId = "map-title-" + React.useId().replace(/[^a-zA-Z0-9_-]/g, "")
    // The script starts again (on a fresh canvas) whenever the map's data changes
    const key = JSON.stringify([cities, originId, home])
    const isStatic = isStaticRender()
    const still = React.useMemo(() => (isStatic ? stillGlobe(cities, originId, home) : null), [isStatic, key])

    useArcoviaScript(ref, (root, life) => initMap(root, life), [key])

    return (
        <div className="arc arc-map" ref={ref} style={p.style}>
            {baseStyle()}
            {cssTag("map", MAP_CSS)}
            {sprite()}
            <section className="map" data-world-map="" data-origin={originId} data-center-lat={home.lat} data-center-lon={home.lon} aria-labelledby={titleId}>
                <div className="map__layout container">
                    <div className="map__head">
                        <p className="chip">{p.chip}</p>
                        <h2 className="map__title" id={titleId}>
                            {keepNamesTogether(p.title, cities.map((c) => c.name))}
                        </h2>
                        <p className="map__body">{p.body}</p>
                        <a className="map__more" href={p.link || "#"}>
                            {p.linkLabel}
                            <svg className="map__arrow" aria-hidden="true">
                                <use href="#icon-arrow" />
                            </svg>
                        </a>
                    </div>

                    <figure className="map__figure">
                        {/* The script draws the globe, arcs, markers and labels from the city index; drag to turn it, pick a city to turn to it. */}
                        <div
                            className="map__stage"
                            tabIndex={0}
                            role="img"
                            aria-label={stageLabel(cities, origin)}
                            style={still ? { height: "auto", aspectRatio: still.w + " / " + still.h } : undefined}
                        >
                            <canvas className="map__globe" key={key}></canvas>
                            {still ? (
                                <svg className="map__lines" aria-hidden="true" viewBox={"0 0 " + still.w + " " + still.h} width="100%" height="100%">
                                    <circle cx={still.cx} cy={still.cy} r={still.R} fill="#eeeeee" />
                                    {still.dots.map((g, i) => (
                                        <path key={i} d={g.d} fill="none" stroke="#8f8f8f" strokeWidth={g.w} strokeOpacity={g.o} strokeLinecap="round" />
                                    ))}
                                    <g>
                                        {still.arcs.map((d, i) => (
                                            <path key={i} className="map__arc" d={d} />
                                        ))}
                                    </g>
                                    <g>
                                        {still.marks.map((m, i) => (
                                            <rect key={i} className={"map__mark is-landed" + (m.origin ? " map__mark--origin" : "")} x={m.x} y={m.y} width={m.s} height={m.s} />
                                        ))}
                                    </g>
                                </svg>
                            ) : (
                                <svg className="map__lines" aria-hidden="true"></svg>
                            )}
                            <div className="map__labels">
                                {still
                                    ? still.labels.map((l, i) => (
                                          <div key={i} className="map__label map__label--office map__label--still is-landed" aria-hidden="true" style={{ left: l.x + "%", top: l.y + "%", transform: STILL_SHIFT[l.side] }}>
                                              <span className="map__label-name">{l.name}</span>
                                              <span className="map__label-meta">{l.meta}</span>
                                          </div>
                                      ))
                                    : null}
                            </div>
                        </div>
                    </figure>

                    {/* City index: the map's data (coordinates, label side); pick a city to turn the globe to it.
                        Column one: the offices, the Americas, the Middle East; column two: Europe. */}
                    <ul className="map__cities" aria-label="Cities">
                        {cities.map((c, i) => (
                            <li
                                className="map__city"
                                tabIndex={0}
                                key={i}
                                data-city={c.id}
                                data-name={c.name}
                                data-lat={c.lat}
                                data-lon={c.lon}
                                data-office={c.office ? "" : undefined}
                                data-side={c.side}
                            >
                                <span className="map__city-name">{c.name}</span>
                                {c.office ? <span className="map__city-tag">Office</span> : null}
                            </li>
                        ))}
                    </ul>
                </div>
            </section>
        </div>
    )
}

/* ---------- Canvas (static render): the flat fallback globe, still, at its 1440 size ---------- */
const STILL_W = 784 // the globe's column at 1440 wide
const STILL_SHIFT: Record<string, string> = {
    left: "translate(calc(-100% - 12px), -50%)",
    right: "translate(12px, -50%)",
    above: "translate(-50%, calc(-100% - 12px))",
    below: "translate(-50%, 12px)",
}

function stillGlobe(list: CityData[], originId: string, home: { lat: number; lon: number }) {
    // The map's own maths (project, arcPoints, arcTop) on a globe laid out as layout() does on desktop
    const m: any = Object.create(WorldMap.prototype)
    m.cities = list.map((c) => ({ ...c, v: toVec(c.lat, c.lon) }))
    m.origin = m.cities.filter((c: any) => c.id === originId)[0] || m.cities[0]
    m.home = home
    m.center = { lat: home.lat, lon: home.lon }
    const w = STILL_W
    m.R = Math.min(w * 0.34, 320)
    m.cx = w - m.R * 1.3
    m.cy = 0
    const top = Math.max(m.R * 0.2, Math.ceil(-m.arcTop()) + 20)
    m.cy = top
    const h = Math.round(top + m.R * 1.22)
    const size = m.R > 250 ? 5 : 4

    // drawFlat()'s dots, grouped by depth into a few paths (a zero-length line with round caps is a dot)
    const base = Math.max(1.05, m.R / 260)
    const BANDS = 8
    const groups: string[] = new Array(BANDS).fill("")
    parseDots(LAND_DOTS).forEach((d) => {
        const q = m.project(toVec(d[0], d[1]))
        if (q[2] <= 0.02) return
        groups[Math.min(BANDS - 1, Math.floor(q[2] * BANDS))] += "M" + q[0].toFixed(1) + " " + q[1].toFixed(1) + "h0"
    })
    const dots = groups
        .map((d, i) => {
            const z = (i + 0.5) / BANDS
            return { d, w: 2 * base * (0.55 + 0.45 * z), o: 0.25 + 0.75 * Math.sqrt(z) }
        })
        .filter((g) => g.d)

    const arcs: string[] = []
    const marks: Array<{ x: number; y: number; s: number; origin: boolean }> = []
    const labels: Array<{ name: string; meta: string; x: number; y: number; side: string }> = []
    m.cities.forEach((c: any) => {
        const q = m.project(c.v)
        if (q[2] >= 0.03) {
            const s = size + (c === m.origin ? 3 : c.office ? 2 : 0)
            marks.push({ x: +(q[0] - s / 2).toFixed(1), y: +(q[1] - s / 2).toFixed(1), s, origin: c === m.origin })
            if (c.office) labels.push({ name: c.name, meta: "Office · " + coords(c.lat, c.lon), x: (q[0] / w) * 100, y: (q[1] / h) * 100, side: c.side })
        }
        if (c === m.origin) return
        let d = ""
        let pen = false
        m.arcPoints(m.origin.v, c.v).forEach((a: any[]) => {
            if (a[3]) {
                d += (pen ? "L" : "M") + a[0].toFixed(1) + " " + a[1].toFixed(1)
                pen = true
            } else pen = false
        })
        if (d) arcs.push(d)
    })
    return { w, h, R: +m.R.toFixed(1), cx: +m.cx.toFixed(1), cy: +m.cy.toFixed(1), dots, arcs, marks, labels }
}

/* ==========================================================================
   Behaviour: map.js (WorldMap), ported. Shaders, maths and timings verbatim.
   Changes: listeners, frames and the observer go through `life`; the land
   dots are imported; the textures load from ASSETS (crossOrigin, for WebGL);
   destroy() stops everything, frees the GL context and removes what build()
   added.
   ========================================================================== */
function initMap(host: HTMLElement, life: Life) {
    host.querySelectorAll<HTMLElement>("[data-world-map]").forEach((el) => {
        const map = new WorldMap(el, life)
        life.add(() => map.destroy())
        map.init()
    })
}

const NS = "http://www.w3.org/2000/svg"
const RAD = Math.PI / 180
const LAT_RANGE = [-35, 65] // how far the globe tilts north and south
// Arcs: each draws out from Los Angeles in DRAW ms, the next one STAGGER ms later;
// then a pulse runs out along each arc (TRAVEL ms) every PERIOD ms
const DELAY = 250,
    STAGGER = 130,
    DRAW = 1300,
    TRAVEL = 1500,
    PERIOD = 4200,
    PULSE = 26

const VERT = "attribute vec2 aPos; void main(){ gl_Position = vec4(aPos, 0.0, 1.0); }"

const FRAG = [
    "precision highp float;",
    "uniform vec2 uRes;", // device px
    "uniform float uScale;", // device px per css px
    "uniform vec2 uCenter;", // globe centre, css px from the top left
    "uniform float uR;", // radius, css px
    "uniform vec3 uE;", // the view's right, up and toward-viewer axes in world space
    "uniform vec3 uN;",
    "uniform vec3 uC;",
    "uniform sampler2D uTex;", // concrete, seamless
    "uniform sampler2D uLand;", // coastline: land coverage, equirectangular
    "uniform sampler2D uRelief;", // height: a bevel along the coast plus land elevation
    "const vec2 TEXEL = vec2(1.0 / 2048.0, 1.0 / 1024.0);",
    "const float TEXEL_DEG = 360.0 / 2048.0;",
    "const float PI = 3.14159265;",
    "",
    "float tex(vec2 uv){ return texture2D(uTex, uv).r; }",
    "float height(vec2 uv){ return texture2D(uRelief, uv).r; }",
    "",
    "void main(){",
    "  vec2 p = vec2(gl_FragCoord.x, uRes.y - gl_FragCoord.y) / uScale;",
    "  vec2 d = (p - uCenter) / uR;",
    "  float r = length(d);",
    "  float px = 1.0 / (uR * uScale);",
    "",
    "  // Soft shadow on the white, down and to the right of the light",
    "  vec2 sd = (p - uCenter) / uR - vec2(0.09, 0.14);",
    "  float sh = 0.13 * (1.0 - smoothstep(0.7, 1.12, length(sd)));",
    "  // and fades out before the canvas ends, so it never shows an edge",
    "  vec2 css = uRes / uScale;",
    "  sh *= smoothstep(0.0, 28.0, min(min(p.x, css.x - p.x), min(p.y, css.y - p.y)));",
    "  float inside = 1.0 - smoothstep(1.0 - px, 1.0 + px, r);",
    "  if (inside <= 0.0) { gl_FragColor = vec4(0.0, 0.0, 0.0, sh); return; }",
    "",
    "  float x = d.x, y = -d.y;",
    "  float z = sqrt(max(0.0, 1.0 - x * x - y * y));",
    "  vec3 P = x * uE + y * uN + z * uC;",
    "  float lat = asin(clamp(P.z, -1.0, 1.0));",
    "  float lon = atan(P.y, P.x);",
    "  vec2 uv = vec2(lon / (2.0 * PI) + 0.5, 0.5 - lat / PI);",
    "  vec3 east = vec3(-sin(lon), cos(lon), 0.0);",
    "  vec3 north = vec3(-sin(lat) * cos(lon), -sin(lat) * sin(lon), cos(lat));",
    "",
    "  // Concrete, wrapped in world space (tri-planar) so it turns with the globe",
    "  vec3 w = pow(abs(P), vec3(4.0)); w /= (w.x + w.y + w.z);",
    "  float k = 0.9;",
    "  float t = tex(P.yz * k + 0.31) * w.x + tex(P.xz * k + 0.57) * w.y + tex(P.xy * k) * w.z;",
    "  float grit = tex(P.yz * 2.3 + 0.7) * w.x + tex(P.xz * 2.3 + 0.2) * w.y + tex(P.xy * 2.3 + 0.45) * w.z;",
    "",
    "  // Land: crisp coastline from the coverage, at any size",
    "  float pxDeg = degrees(px) / max(z, 0.2);",
    "  float edge = clamp(0.5 * pxDeg / TEXEL_DEG, 0.03, 0.5);",
    "  float land = smoothstep(0.5 - edge, 0.5 + edge, texture2D(uLand, uv).r);",
    "",
    "  // Relief: the surface normal follows the height map (coastal bevel and terrain)",
    "  float h = height(uv);",
    "  float hE = height(uv + vec2(TEXEL.x, 0.0)) - height(uv - vec2(TEXEL.x, 0.0));",
    "  float hN = height(uv - vec2(0.0, TEXEL.y)) - height(uv + vec2(0.0, TEXEL.y));",
    "  float dE = hE / (2.0 * TEXEL.x * 2.0 * PI * max(cos(lat), 0.05));",
    "  float dN = hN / (2.0 * TEXEL.y * PI);",
    "  vec3 Nw = normalize(P - 0.013 * (dE * east + dN * north));",
    "",
    "  // Contours: thin engraved lines across the higher ground",
    "  float levels = 9.0;",
    "  float q = (h - 0.32) / 0.68 * levels;",
    "  float gradPx = length(vec2(hE, hN)) * 0.5 / (TEXEL_DEG / pxDeg) * levels / 0.68;",
    "  float dist = abs(fract(q + 0.5) - 0.5) / max(gradPx, 1e-4);",
    "  // (from the second level up, so the lowlands stay calm)",
    "  float contour = (1.0 - smoothstep(0.35, 0.95, dist)) * smoothstep(0.6, 0.9, q) * land * smoothstep(0.25, 0.5, z);",
    "",
    "  // Light: soft, from the upper left and in front",
    "  vec3 L = normalize(vec3(-0.38, 0.48, 0.8));",
    "  vec3 Lw = L.x * uE + L.y * uN + L.z * uC;",
    "  float diff = max(dot(Nw, Lw), 0.0);",
    "  float flat_ = max(dot(P, Lw), 0.0);",
    "  float lit = (0.64 + 0.4 * diff) * mix(0.86, 1.0, z);",
    "  vec3 H = normalize(Lw + uC);",
    "  float spec = pow(max(dot(Nw, H), 0.0), 40.0) * 0.05;",
    "",
    "  // Sea: smooth and a shade darker; land: lighter stone with a finer grit",
    "  float sea = 0.8 * (1.0 + (t / 0.765 - 1.0) * 0.9);",
    "  float stone = 0.9 * (1.0 + (t / 0.765 - 1.0) * 0.6 + (grit / 0.765 - 1.0) * 0.5);",
    "  float albedo = mix(sea, stone, land) * (1.0 - 0.1 * contour);",
    "  float c = albedo * lit + spec;",
    "  gl_FragColor = vec4(vec3(c) * inside, inside + sh * (1.0 - inside));",
    "}",
].join("\n")

function parseDots(str: string) {
    const out: number[][] = []
    ;(str || "").split(";").forEach((row) => {
        const parts = row.split(":")
        const lat = parseInt(parts[0], 10) / 10
        parts[1].split(",").forEach((lon) => {
            out.push([lat, parseInt(lon, 10) / 10])
        })
    })
    return out
}

function toVec(lat: number, lon: number) {
    const p = lat * RAD,
        l = lon * RAD
    return [Math.cos(p) * Math.cos(l), Math.cos(p) * Math.sin(l), Math.sin(p)]
}

function coords(lat: number, lon: number) {
    return Math.abs(lat).toFixed(2) + "°" + (lat >= 0 ? "N" : "S") + ", " + Math.abs(lon).toFixed(2) + "°" + (lon >= 0 ? "E" : "W")
}

function clampLat(v: number) {
    return Math.max(LAT_RANGE[0], Math.min(LAT_RANGE[1], v))
}
function wrapLon(v: number) {
    return ((v + 540) % 360) - 180
}
function ease(t: number) {
    return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2
}

class WorldMap {
    [k: string]: any

    constructor(root: HTMLElement, life: Life) {
        this.root = root
        this.life = life
        this.stage = root.querySelector(".map__stage")
        this.canvas = root.querySelector(".map__globe")
        this.svg = root.querySelector(".map__lines")
        this.labelLayer = root.querySelector(".map__labels")
        this.cities = Array.prototype.slice.call(root.querySelectorAll("[data-city]")).map((el: HTMLElement) => ({
            id: el.getAttribute("data-city"),
            name: el.getAttribute("data-name"),
            lat: parseFloat(el.getAttribute("data-lat") as string),
            lon: parseFloat(el.getAttribute("data-lon") as string),
            office: el.hasAttribute("data-office"),
            side: el.getAttribute("data-side") || "right",
            row: el,
        }))
        this.origin = this.cities.filter((c: any) => c.id === root.getAttribute("data-origin"))[0] || this.cities[0]
        this.home = { lat: parseFloat(root.getAttribute("data-center-lat") as string) || 20, lon: parseFloat(root.getAttribute("data-center-lon") as string) || -35 }
        this.center = { lat: this.home.lat, lon: this.home.lon }
        this.dots = parseDots(LAND_DOTS)
        this.t0 = null // when the arcs started drawing; null: not drawn (off screen)
        this.visible = false
        this.loop = null
        this.reduced = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches
        this.texture = ASSETS.concrete
    }

    init() {
        const self = this
        this.build()
        this.gl = this.initGL()
        this.layout()
        this.bindTurning()

        let width = window.innerWidth
        this.life.on(window, "resize", () => {
            if (window.innerWidth === width) return
            width = window.innerWidth
            self.layout()
        })

        // layout() measures the labels. On the HTML page Montserrat was linked in <head> and
        // ready by then; here its stylesheet arrives with the component, so measure again once it loads.
        const fonts = (document as any).fonts
        if (fonts) {
            const again = () => {
                if (!self.life.dead) self.layout()
            }
            this.life.on(fonts, "loadingdone", again)
            if (fonts.ready) fonts.ready.then(again)
        }

        // With reduced motion the arcs are simply there; otherwise they draw out every
        // time the map comes into view, and reset once it has left the screen
        if (this.reduced || !("IntersectionObserver" in window)) {
            this.instant = true
            this.root.classList.add("is-instant")
            this.paint()
            return
        }
        const io = this.life.observe(
            new IntersectionObserver(
                (entries) => {
                    const e = entries[0]
                    self.visible = e.isIntersecting
                    if (!e.isIntersecting) {
                        self.t0 = null
                        self.stop()
                        self.paint()
                        return
                    }
                    if (self.t0 === null && e.intersectionRatio >= 0.3) self.t0 = performance.now()
                    self.start()
                },
                { threshold: [0, 0.3] }
            )
        )
        io.observe(this.stage)
    }

    /* Stops everything, frees the GL context and takes out what build() added */
    destroy() {
        this.stop()
        this.stopMotion()
        if (this.gl) {
            const lose = this.gl.getExtension("WEBGL_lose_context")
            if (lose) lose.loseContext()
            this.gl = null
        }
        if (this.arcGroup) this.arcGroup.remove()
        if (this.markGroup) this.markGroup.remove()
        this.cities.forEach((c: any) => {
            if (c.label) c.label.remove()
            c.row.classList.remove("is-active")
        })
        this.root.classList.remove("is-turning", "has-focus", "is-compact", "is-instant", "map--gl")
    }

    /* ---------- Arcs drawing out from Los Angeles, then pulses ---------- */
    start() {
        const self = this
        if (this.loop) return
        const tick = () => {
            self.paint()
            self.loop = self.visible ? self.life.raf(tick) : null
        }
        this.loop = this.life.raf(tick)
    }

    stop() {
        if (this.loop) this.life.cancelRaf(this.loop)
        this.loop = null
    }

    // Each arc's progress and pulse at this moment; markers land as their arc arrives
    paint() {
        const self = this
        const el = this.instant ? Infinity : this.t0 === null ? -1 : performance.now() - this.t0
        this.cities.forEach((c: any) => {
            let landed = el >= 0
            if (c.arc) {
                const start = DELAY + c.n * STAGGER
                const p = el === Infinity ? 1 : ease(Math.max(0, Math.min(1, (el - start) / DRAW)))
                landed = p >= 0.98
                c.arc.style.visibility = p > 0 ? "" : "hidden"
                c.arc.style.strokeDasharray = p >= 1 ? "none" : (c.len * p).toFixed(1) + " " + (c.len + 2).toFixed(1)

                // The pulse: a short dash running from Los Angeles out to the hub
                let q = -1
                if (!self.instant && p >= 1) {
                    const since = el - start - DRAW - 300
                    if (since >= 0) q = (since % PERIOD) / TRAVEL
                }
                if (q >= 0 && q < 1 && c.len > PULSE) {
                    const span = c.len + PULSE
                    c.pulse.style.visibility = ""
                    c.pulse.style.strokeDasharray = PULSE + " " + (span + PULSE)
                    c.pulse.style.strokeDashoffset = (PULSE - q * span).toFixed(1)
                    c.pulse.setAttribute("stroke-opacity", Math.sin(Math.PI * q).toFixed(3))
                } else c.pulse.style.visibility = "hidden"
            }
            c.mark.classList.toggle("is-landed", landed)
            c.label.classList.toggle("is-landed", landed)
        })
    }

    // Markers, arcs, hit areas and labels, one set per city
    build() {
        const self = this
        const life: Life = this.life
        this.arcGroup = document.createElementNS(NS, "g")
        this.markGroup = document.createElementNS(NS, "g")
        this.svg.appendChild(this.arcGroup)
        this.svg.appendChild(this.markGroup)

        let n = 0
        this.cities.forEach((c: any) => {
            c.v = toVec(c.lat, c.lon)
            if (c !== self.origin) {
                c.n = n++
                c.arc = document.createElementNS(NS, "path")
                c.arc.setAttribute("class", "map__arc")
                c.arc.style.visibility = "hidden"
                self.arcGroup.appendChild(c.arc)
                c.pulse = document.createElementNS(NS, "path")
                c.pulse.setAttribute("class", "map__pulse")
                c.pulse.style.visibility = "hidden"
                self.arcGroup.appendChild(c.pulse)
            }
            c.mark = document.createElementNS(NS, "rect")
            c.mark.setAttribute("class", "map__mark" + (c === self.origin ? " map__mark--origin" : ""))
            self.markGroup.appendChild(c.mark)

            c.hit = document.createElementNS(NS, "circle")
            c.hit.setAttribute("class", "map__hit")
            c.hit.setAttribute("r", 11) // small: the European hubs sit close together
            self.markGroup.appendChild(c.hit)

            c.label = document.createElement("div")
            c.label.className = "map__label" + (c.office ? " map__label--office" : "")
            c.label.setAttribute("aria-hidden", "true")
            c.label.innerHTML = '<span class="map__label-name"></span><span class="map__label-meta"></span>'
            c.label.firstChild.textContent = c.name
            c.label.lastChild.textContent = (c.office ? "Office · " : "") + coords(c.lat, c.lon)
            self.labelLayer.appendChild(c.label)

            const on = () => {
                if (!self.drag) self.focus(c)
            }
            const off = () => {
                if (!self.drag) self.focus(null)
            }
            life.on(c.hit, "pointerenter", on)
            life.on(c.hit, "pointerleave", off)
            life.on(c.row, "pointerenter", on)
            life.on(c.row, "pointerleave", off)
            life.on(c.row, "focus", on)
            life.on(c.row, "blur", off)
            // Picking a city turns the globe to it
            life.on(c.row, "click", () => {
                self.turnTo(c.lat, c.lon)
            })
            life.on(c.row, "keydown", (e: KeyboardEvent) => {
                if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault()
                    self.turnTo(c.lat, c.lon)
                }
            })
        })
    }

    /* ---------- WebGL globe ---------- */
    initGL() {
        let gl: WebGLRenderingContext | null = null
        try {
            gl = this.canvas.getContext("webgl", { premultipliedAlpha: true, antialias: false })
        } catch (e) {
            gl = null
        }
        if (!gl || gl.isContextLost()) return null
        const g = gl
        const self = this
        const compile = (type: number, src: string) => {
            const s = g.createShader(type) as WebGLShader
            g.shaderSource(s, src)
            g.compileShader(s)
            if (!g.getShaderParameter(s, g.COMPILE_STATUS)) {
                console.warn(g.getShaderInfoLog(s))
                return null
            }
            return s
        }
        const v = compile(g.VERTEX_SHADER, VERT),
            f = compile(g.FRAGMENT_SHADER, FRAG)
        if (!v || !f) return null
        const prog = g.createProgram() as WebGLProgram
        g.attachShader(prog, v)
        g.attachShader(prog, f)
        g.linkProgram(prog)
        if (!g.getProgramParameter(prog, g.LINK_STATUS)) {
            console.warn(g.getProgramInfoLog(prog))
            return null
        }
        g.useProgram(prog)
        this.prog = prog

        const buf = g.createBuffer()
        g.bindBuffer(g.ARRAY_BUFFER, buf)
        g.bufferData(g.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), g.STATIC_DRAW)
        const loc = g.getAttribLocation(prog, "aPos")
        g.enableVertexAttribArray(loc)
        g.vertexAttribPointer(loc, 2, g.FLOAT, false, 0, 0)

        this.u = {}
        ;["uRes", "uScale", "uCenter", "uR", "uE", "uN", "uC", "uTex", "uLand", "uRelief"].forEach((n) => {
            self.u[n] = g.getUniformLocation(prog, n)
        })
        g.uniform1i(this.u.uTex, 0)
        g.uniform1i(this.u.uLand, 1)
        g.uniform1i(this.u.uRelief, 2)

        // A texture per unit: flat until its image arrives
        const blank = (unit: number, v: number) => {
            const t = g.createTexture()
            g.activeTexture(g.TEXTURE0 + unit)
            g.bindTexture(g.TEXTURE_2D, t)
            g.texImage2D(g.TEXTURE_2D, 0, g.RGBA, 1, 1, 0, g.RGBA, g.UNSIGNED_BYTE, new Uint8Array([v, v, v, 255]))
            return t
        }
        const upload = (unit: number, t: WebGLTexture | null, img: HTMLImageElement, mipmaps: boolean) => {
            if (self.gl !== g) return // destroyed meanwhile
            g.activeTexture(g.TEXTURE0 + unit)
            g.bindTexture(g.TEXTURE_2D, t)
            g.texImage2D(g.TEXTURE_2D, 0, g.RGBA, g.RGBA, g.UNSIGNED_BYTE, img)
            // The land and relief maps skip mipmaps: their seam at the date line would show as a line
            if (mipmaps) g.generateMipmap(g.TEXTURE_2D)
            g.texParameteri(g.TEXTURE_2D, g.TEXTURE_MIN_FILTER, mipmaps ? g.LINEAR_MIPMAP_LINEAR : g.LINEAR)
            g.texParameteri(g.TEXTURE_2D, g.TEXTURE_MAG_FILTER, g.LINEAR)
            g.texParameteri(g.TEXTURE_2D, g.TEXTURE_WRAP_S, g.REPEAT)
            g.texParameteri(g.TEXTURE_2D, g.TEXTURE_WRAP_T, mipmaps ? g.REPEAT : g.CLAMP_TO_EDGE)
            self.drawGlobe()
        }
        // Images from framerusercontent.com, which allows cross-origin use (WebGL needs it)
        const image = (url: string, done: (img: HTMLImageElement) => void) => {
            const img = new Image()
            img.crossOrigin = "anonymous"
            img.onload = () => {
                if (!self.life.dead) done(img)
            }
            img.src = url
        }
        const landTex = blank(1, 0),
            reliefTex = blank(2, 0)
        image(ASSETS.globeLand, (img) => upload(1, landTex, img, false))
        image(ASSETS.globeRelief, (img) => upload(2, reliefTex, img, false))

        // Concrete: as the hero's
        const concrete = blank(0, 195)
        image(this.texture, (img) => upload(0, concrete, img, true))

        this.root.classList.add("map--gl")
        return g
    }

    // The view's axes in world space: right (east at the centre), up (north), toward the viewer
    basis() {
        const p0 = this.center.lat * RAD,
            l0 = this.center.lon * RAD
        return {
            e: [-Math.sin(l0), Math.cos(l0), 0],
            n: [-Math.sin(p0) * Math.cos(l0), -Math.sin(p0) * Math.sin(l0), Math.cos(p0)],
            c: [Math.cos(p0) * Math.cos(l0), Math.cos(p0) * Math.sin(l0), Math.sin(p0)],
        }
    }

    drawGlobe() {
        if (!this.gl) {
            this.drawFlat()
            return
        }
        const gl: WebGLRenderingContext = this.gl,
            b = this.basis()
        gl.viewport(0, 0, this.canvas.width, this.canvas.height)
        gl.uniform2f(this.u.uRes, this.canvas.width, this.canvas.height)
        gl.uniform1f(this.u.uScale, this.dpr)
        gl.uniform2f(this.u.uCenter, this.cx, this.cy)
        gl.uniform1f(this.u.uR, this.R)
        gl.uniform3fv(this.u.uE, b.e)
        gl.uniform3fv(this.u.uN, b.n)
        gl.uniform3fv(this.u.uC, b.c)
        gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4)
    }

    // Fallback without WebGL: flat grey dots on a pale disc
    drawFlat() {
        const g: CanvasRenderingContext2D | null = this.canvas.getContext("2d")
        if (!g) return // the canvas already holds a (lost) WebGL context
        g.setTransform(this.dpr, 0, 0, this.dpr, 0, 0)
        g.clearRect(0, 0, this.w, this.h)
        g.fillStyle = "#eeeeee"
        g.beginPath()
        g.arc(this.cx, this.cy, this.R, 0, Math.PI * 2)
        g.fill()
        const base = Math.max(1.05, this.R / 260)
        g.fillStyle = "#8f8f8f"
        for (let i = 0; i < this.dots.length; i++) {
            const p = this.project(toVec(this.dots[i][0], this.dots[i][1]))
            if (p[2] <= 0.02) continue
            g.globalAlpha = 0.25 + 0.75 * Math.sqrt(p[2])
            g.beginPath()
            g.arc(p[0], p[1], base * (0.55 + 0.45 * p[2]), 0, Math.PI * 2)
            g.fill()
        }
        g.globalAlpha = 1
    }

    /* ---------- Turning ---------- */
    bindTurning() {
        const self = this,
            stage: HTMLElement = this.stage,
            life: Life = this.life
        const deg = () => 180 / Math.PI / self.R // degrees per px of drag at the centre

        life.on(stage, "pointerdown", (e: PointerEvent) => {
            if (e.button !== 0) return
            self.stopMotion()
            self.drag = { x: e.clientX, y: e.clientY, lat: self.center.lat, lon: self.center.lon, t: performance.now(), vx: 0, vy: 0, moved: false }
            try {
                stage.setPointerCapture(e.pointerId)
            } catch (err) {}
        })
        life.on(stage, "pointermove", (e: PointerEvent) => {
            const d = self.drag
            if (!d) return
            const now = performance.now(),
                dt = Math.max(1, now - d.t)
            const dx = e.clientX - d.x,
                dy = e.clientY - d.y
            if (!d.moved && Math.abs(dx) + Math.abs(dy) < 3) return
            if (!d.moved) {
                d.moved = true
                self.root.classList.add("is-turning")
                self.focus(null)
            }
            const lon = self.center.lon,
                lat = self.center.lat
            self.center.lon = wrapLon(d.lon - dx * deg())
            self.center.lat = clampLat(d.lat + dy * deg())
            // Velocity in degrees per ms, smoothed, for the glide after letting go
            d.vx = 0.7 * d.vx + 0.3 * (wrapLon(self.center.lon - lon) / dt)
            d.vy = 0.7 * d.vy + 0.3 * ((self.center.lat - lat) / dt)
            d.t = now
            // Re-anchor, so a drag held against the tilt limit responds as soon as it turns back
            d.lat = self.center.lat - dy * deg()
            self.render()
        })
        const end = () => {
            const d = self.drag
            if (!d) return
            self.drag = null
            self.root.classList.remove("is-turning")
            if (d.moved && !self.reduced) self.glide(d.vx, d.vy)
        }
        life.on(stage, "pointerup", end)
        life.on(stage, "pointercancel", end)

        const KEYS: Record<string, number[]> = { ArrowLeft: [0, -20], ArrowRight: [0, 20], ArrowUp: [10, 0], ArrowDown: [-10, 0] }
        life.on(stage, "keydown", (e: KeyboardEvent) => {
            const k = KEYS[e.key]
            if (!k) return
            e.preventDefault()
            self.turnTo(self.center.lat + k[0], self.center.lon + k[1])
        })
    }

    stopMotion() {
        if (this.motion) this.life.cancelRaf(this.motion)
        this.motion = null
    }

    // Keep turning after a drag, slowing down
    glide(vx: number, vy: number) {
        const self = this
        let last = performance.now()
        if (Math.abs(vx) + Math.abs(vy) < 0.005) return
        const step = (now: number) => {
            const dt = Math.min(40, now - last)
            last = now
            self.center.lon = wrapLon(self.center.lon + vx * dt)
            self.center.lat = clampLat(self.center.lat + vy * dt)
            const f = Math.exp(-dt / 320)
            vx *= f
            vy *= f
            self.render()
            self.motion = Math.abs(vx) + Math.abs(vy) > 0.0008 ? self.life.raf(step) : null
        }
        this.motion = this.life.raf(step)
    }

    // Turn smoothly to face a point
    turnTo(lat: number, lon: number) {
        const self = this
        this.stopMotion()
        const from = { lat: this.center.lat, lon: this.center.lon }
        const to = { lat: clampLat(lat), lon: lon }
        const dl = wrapLon(to.lon - from.lon)
        if (this.reduced) {
            this.center = { lat: to.lat, lon: wrapLon(from.lon + dl) }
            this.render()
            return
        }
        const dur = 700 + 4 * Math.min(180, Math.abs(dl) + Math.abs(to.lat - from.lat)),
            t0 = performance.now()
        const step = (now: number) => {
            const k = Math.min(1, (now - t0) / dur),
                e = ease(k)
            self.center.lat = from.lat + (to.lat - from.lat) * e
            self.center.lon = wrapLon(from.lon + dl * e)
            self.render()
            self.motion = k < 1 ? self.life.raf(step) : null
        }
        this.motion = this.life.raf(step)
    }

    /* ---------- Layout and drawing ---------- */
    // Project a unit vector (scaled by r) into the view: [x, y, z] in px, z > 0 faces us
    project(v: number[], r?: number): any[] {
        const b = this.basis()
        const R = this.R * (r || 1)
        const x = v[0] * b.e[0] + v[1] * b.e[1] + v[2] * b.e[2]
        const y = v[0] * b.n[0] + v[1] * b.n[1] + v[2] * b.n[2]
        const z = v[0] * b.c[0] + v[1] * b.c[1] + v[2] * b.c[2]
        return [this.cx + R * x, this.cy - R * y, z]
    }

    // Points along the great circle from a to b, lifted off the surface in
    // proportion to its length: [x, y, z, visible]
    arcPoints(o: number[], v: number[]) {
        const ang = Math.acos(Math.max(-1, Math.min(1, o[0] * v[0] + o[1] * v[1] + o[2] * v[2])))
        const lift = 0.26 * (ang / Math.PI)
        const pts: any[][] = [],
            steps = 72
        for (let k = 0; k <= steps; k++) {
            const t = k / steps
            const a = Math.sin((1 - t) * ang) / Math.sin(ang),
                b = Math.sin(t * ang) / Math.sin(ang)
            const q = this.project([a * o[0] + b * v[0], a * o[1] + b * v[1], a * o[2] + b * v[2]], 1 + lift * Math.sin(Math.PI * t))
            q.push(q[2] > 0 || Math.hypot(q[0] - this.cx, q[1] - this.cy) > this.R)
            pts.push(q)
        }
        return pts
    }

    // How high above the globe's centre the highest arc reaches in the home view, in px (negative is up)
    arcTop() {
        const self = this
        let min = -this.R
        this.cities.forEach((c: any) => {
            if (c === self.origin) return
            self.arcPoints(self.origin.v, c.v).forEach((q) => {
                if (q[3]) min = Math.min(min, q[1])
            })
        })
        return min
    }

    layout() {
        const w = this.stage.clientWidth
        const phone = w < 600
        const wide = window.matchMedia("(min-width: 1200px)").matches
        // On phones the city index right below names the offices; their callouts show on tap like the rest
        this.root.classList.toggle("is-compact", phone)
        // The whole globe. On desktop it sits to the right of its column, which leaves
        // room on its left for the Los Angeles callout; stacked, it is centred.
        this.R = Math.min(w * (phone ? 0.42 : wide ? 0.34 : 0.3), 320)
        this.cx = wide ? w - this.R * 1.3 : w / 2
        // Room above for the highest arc in the home view (and some more, as arcs
        // rise higher when the globe is turned), and below for the shadow
        const saved = this.center
        this.center = { lat: this.home.lat, lon: this.home.lon }
        this.cy = 0
        const top = Math.max(this.R * 0.2, Math.ceil(-this.arcTop()) + 20)
        this.center = saved
        this.cy = top
        const h = Math.round(top + this.R * 1.22)
        this.stage.style.height = h + "px"
        this.w = w
        this.h = h

        this.dpr = Math.min(window.devicePixelRatio || 1, 2)
        this.canvas.width = Math.round(w * this.dpr)
        this.canvas.height = Math.round(h * this.dpr)
        this.canvas.style.width = w + "px"
        this.canvas.style.height = h + "px"
        this.svg.setAttribute("viewBox", "0 0 " + w + " " + h)
        this.svg.setAttribute("width", w)
        this.svg.setAttribute("height", h)
        // Hubs small enough for the European cluster to stay apart; offices a size up, Los Angeles another
        this.size = this.R > 250 ? 5 : 4
        this.cities.forEach((c: any) => {
            c.lw = c.label.offsetWidth
            c.lh = c.label.offsetHeight
        })
        this.render()
    }

    render() {
        this.drawGlobe()
        this.drawLines()
    }

    drawLines() {
        const self = this
        this.cities.forEach((c: any) => {
            const p = self.project(c.v)
            c.x = p[0]
            c.y = p[1]
            const behind = p[2] < 0.03
            c.mark.classList.toggle("is-behind", behind)
            c.label.classList.toggle("is-behind", behind)
            c.hit.style.display = behind ? "none" : ""
            const s = self.size + (c === self.origin ? 3 : c.office ? 2 : 0)
            c.mark.setAttribute("x", (p[0] - s / 2).toFixed(1))
            c.mark.setAttribute("y", (p[1] - s / 2).toFixed(1))
            c.mark.setAttribute("width", s)
            c.mark.setAttribute("height", s)
            c.hit.setAttribute("cx", p[0].toFixed(1))
            c.hit.setAttribute("cy", p[1].toFixed(1))
            self.placeLabel(c)
            if (!c.arc) return

            // Great circle from the origin; parts behind the globe are left out
            let d = "",
                pen = false
            self.arcPoints(self.origin.v, c.v).forEach((q) => {
                if (q[3]) {
                    d += (pen ? "L" : "M") + q[0].toFixed(1) + " " + q[1].toFixed(1)
                    pen = true
                } else pen = false
            })
            c.arc.setAttribute("d", d)
            c.pulse.setAttribute("d", d)
            c.len = d ? c.arc.getTotalLength() : 0
        })
        this.paint()
    }

    // Beside the marker, kept inside the stage
    placeLabel(c: any) {
        const gap = 12,
            w = c.lw,
            h = c.lh
        let side = c.side
        // No room on the preferred side: use the other one rather than cover the marker
        if (side === "left" && c.x - gap - w < 4) side = "right"
        else if (side === "right" && c.x + gap + w > this.w - 4) side = "left"
        let x = side === "left" ? c.x - gap - w : c.x + gap
        let y = c.y - h / 2
        if (side === "above") {
            x = c.x - w / 2
            y = c.y - gap - h
        }
        if (side === "below") {
            x = c.x - w / 2
            y = c.y + gap
        }
        x = Math.max(4, Math.min(this.w - w - 4, x))
        y = Math.max(4, Math.min(this.h - h - 4, y))
        c.label.style.transform = "translate(" + Math.round(x) + "px, " + Math.round(y) + "px)"
    }

    focus(city: any) {
        // Los Angeles is where every arc starts: focusing it keeps them all
        this.root.classList.toggle("has-focus", !!city && city !== this.origin)
        this.cities.forEach((c: any) => {
            const on = c === city
            c.row.classList.toggle("is-active", on)
            c.label.classList.toggle("is-active", on)
            c.mark.classList.toggle("is-active", on)
            if (c.arc) {
                c.arc.classList.toggle("is-active", on)
                c.pulse.classList.toggle("is-active", on)
            }
        })
    }
}

addPropertyControls(ArcoviaMap, {
    chip: { type: ControlType.String, title: "Chip", defaultValue: DEFAULTS.chip },
    title: { type: ControlType.String, title: "Title", displayTextArea: true, defaultValue: DEFAULTS.title },
    body: { type: ControlType.String, title: "Body", displayTextArea: true, defaultValue: DEFAULTS.body },
    linkLabel: { type: ControlType.String, title: "Link label", defaultValue: DEFAULTS.linkLabel },
    link: { type: ControlType.Link, title: "Link", defaultValue: DEFAULTS.link },
    cities: {
        type: ControlType.Array,
        title: "Cities",
        control: {
            type: ControlType.Object,
            controls: {
                name: { type: ControlType.String, title: "Name", defaultValue: "" },
                lat: { type: ControlType.Number, title: "Latitude", min: -90, max: 90, step: 0.0001, displayStepper: false, defaultValue: 0 },
                lon: { type: ControlType.Number, title: "Longitude", min: -180, max: 180, step: 0.0001, displayStepper: false, defaultValue: 0 },
                office: { type: ControlType.Boolean, title: "Office", defaultValue: false },
                side: {
                    type: ControlType.Enum,
                    title: "Label side",
                    options: ["left", "right", "above", "below"],
                    optionTitles: ["Left", "Right", "Above", "Below"],
                    defaultValue: "right",
                },
            },
        },
        defaultValue: DEFAULTS.cities,
    },
    origin: { type: ControlType.String, title: "Arcs from", defaultValue: DEFAULTS.origin },
    centerLat: { type: ControlType.Number, title: "View latitude", min: -35, max: 65, step: 1, displayStepper: true, defaultValue: DEFAULTS.centerLat },
    centerLon: { type: ControlType.Number, title: "View longitude", min: -180, max: 180, step: 1, displayStepper: true, defaultValue: DEFAULTS.centerLon },
})
