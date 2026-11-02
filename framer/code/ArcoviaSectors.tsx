/**
 * Arcovia: the sectors line (Home block 9, brief section 9).
 *
 * The six sectors as one quiet line that runs slowly to the left, after the
 * user's marquee reference, on a flat neutral ground (after the user's Trove
 * reference: no concrete photo, all the depth kept).
 * - carved (default): carved into a plain neutral surface exactly like the
 *   hero (ConcreteSurface with the plain material: the same sky light, dark rim
 *   and inner shadow, light rim), 60px, between two formwork seams with a tie
 *   hole at each end, a tie hole between sectors, growing shallow towards both
 *   ends. The line is carved once into a strip and slid in the shader (no
 *   repaint per frame); the DOM line stays still and transparent, for screen
 *   readers and for measuring. Without WebGL the DOM line itself moves, with
 *   copies to fill the width, debossed with the SVG filter #deboss-soft.
 * - band (Version: Band, or ?sectors=band): a charcoal band edge to edge,
 *   white type, the A-mark between sectors.
 * It moves at a calm pace (44 px/s), slows to a stop under the pointer, picks
 * up a little while the page scrolls, pauses off-screen and in hidden tabs, and
 * stands still (wrapped, carved in place) with reduced motion.
 *
 * On the Framer canvas there is no script: the line stands still, debossed with
 * the SVG filter, cropped at the right with the soft ends.
 * Ported from sectors.js and sections/sectors.css on main.
 */
import * as React from "react"
import { addPropertyControls, ControlType } from "framer"
import { ASSETS, baseStyle, cssTag, sprite, useArcoviaScript, type Life } from "./ArcoviaBase.tsx"
import { ConcreteSurface } from "./ArcoviaConcrete.tsx"

const SECTORS_CSS = `/* ==========================================================================
   SECTION: sectors — Home, block 9 (brief section 9)
   The sectors as one quiet line that runs across the page, after the user's
   marquee reference, on a flat neutral ground (after the user's Trove
   reference: no concrete photo, but all the depth kept).
   Two versions on the same markup (sectors.js sets data-variant):
   - carved (default): the line carved into a plain neutral surface with the
     hero's own carving (concrete.js, plain material: same light, rims and
     inner shadow), between two formwork seams with a tie hole at each end, a
     tie hole between sectors; the line grows shallow towards both ends.
     The line is carved once into a strip and slid in the shader. Without
     WebGL: SVG filter #deboss-soft and the CSS seam.
   - band (?sectors=band): a charcoal band running edge to edge, white type
     and the A-mark between sectors; a fine groove along both edges.
   The track moves with a transform set by sectors.js; with reduced motion
   (.is-static) the line stands still and wraps.
   Uses shared tokens, the seam and the A-mark from styles.css / the sprite.
   ========================================================================== */

.sectors {
  --sectors-fs: 60px;          /* sector names */
  --sectors-gap: 0.8em;        /* space either side of a separator */
  position: relative;
  isolation: isolate;
  /* Less below: the CTA box follows straight after, as in the user's design */
  padding-block: var(--space-10) var(--space-8);
  background: var(--color-neutral);
  overflow-x: clip;
}

/* The live surface (concrete.js, plain material) */
.sectors__canvas {
  position: absolute;
  inset: 0;
  z-index: -1;
  width: 100%;
  height: 100%;
  opacity: 0;
  transition: opacity 600ms var(--ease-out);
}
.sectors.is-live .sectors__canvas { opacity: 1; }
/* Once the surface carves them, the CSS look steps aside (as in the hero) */
.sectors.is-live .sectors__list { color: transparent; filter: none; }
.sectors.is-live .sectors__viewport { -webkit-mask-image: none; mask-image: none; }
.sectors.is-live .sectors__seam { background: transparent; box-shadow: none; }
.sectors.is-live .sectors__seam .seam__hole { opacity: 0; }

/* ---------- The line ---------- */
.sectors__viewport {
  position: relative;
  overflow: hidden;
  padding-block: var(--space-7);
  /* Soft ends, so the line seems to run on under the surface */
  -webkit-mask-image: linear-gradient(90deg, transparent, #000 72px, #000 calc(100% - 72px), transparent);
  mask-image: linear-gradient(90deg, transparent, #000 72px, #000 calc(100% - 72px), transparent);
}
.sectors__track {
  display: flex;
  width: max-content;
  will-change: transform;
}
/* The filter sits on each (still) list and the movement on the track, so the carving is drawn once and slides */
.sectors__list {
  display: flex;
  align-items: center;
  flex: none;
  color: #000; /* only the shape counts: the filter turns it into a recess */
  filter: url("#deboss-soft");
}
.sectors__item {
  flex: none;
  font-size: var(--sectors-fs);
  font-weight: var(--weight-medium);
  line-height: 1.2;
  letter-spacing: -0.01em;
  white-space: nowrap;
}
.sectors__sep {
  flex: none;
  display: grid;
  place-items: center;
  margin-inline: var(--sectors-gap);
  font-size: var(--sectors-fs);
}
/* A tie hole between sectors (the brief's "·"), the same circle as the head of the A */
.sectors__sep::before {
  content: "";
  width: 0.2em;
  height: 0.2em;
  border-radius: 50%;
  background: currentColor;
}
.sectors__mark { display: none; } /* the A-mark separator belongs to the band */

/* ---------- Band (?sectors=band) ----------
   Charcoal with the concrete's grain multiplied in, so it reads as an inlay,
   not a flat stripe. Edge to edge, white type, the A-mark between sectors. */
.sectors[data-variant="band"] { --sectors-fs: 56px; --sectors-gap: 0.95em; }
.sectors[data-variant="band"] .sectors__canvas { display: none; }
.sectors[data-variant="band"] .sectors__band {
  background-color: var(--color-charcoal);
  background-image: url("${ASSETS.concrete}");
  background-size: 1024px;
  background-blend-mode: multiply;
  color: var(--color-on-dark);
  box-shadow:
    0 -1px 0 rgba(0, 0, 0, 0.16),
    0 1px 0 rgba(255, 255, 255, 0.5),
    inset 0 1px 0 rgba(255, 255, 255, 0.07),
    inset 0 -1px 0 rgba(0, 0, 0, 0.22);
}
.sectors[data-variant="band"] .sectors__frame { max-width: none; padding-inline: 0; }
.sectors[data-variant="band"] .sectors__seam { display: none; }
.sectors[data-variant="band"] .sectors__viewport { padding-block: 30px; -webkit-mask-image: none; mask-image: none; }
.sectors[data-variant="band"] .sectors__list { color: inherit; filter: none; }
.sectors[data-variant="band"] .sectors__item { letter-spacing: -0.02em; }
.sectors[data-variant="band"] .sectors__sep::before { display: none; }
.sectors[data-variant="band"] .sectors__mark {
  display: block;
  width: 0.78em;
  height: auto;
  fill: currentColor;
  color: rgba(244, 244, 243, 0.55);
}

/* ---------- Standing still (reduced motion) ---------- */
.sectors.is-static .sectors__track { width: auto; justify-content: center; }
.sectors.is-static .sectors__viewport { -webkit-mask-image: none; mask-image: none; }
.sectors.is-static .sectors__list {
  flex: auto;
  flex-wrap: wrap;
  justify-content: center;
  gap: 0.1em 0.9em;
  padding-inline: var(--gutter);
  font-size: calc(var(--sectors-fs) * 0.8);
}
.sectors.is-static .sectors__item { font-size: inherit; }
/* Wrapped lines would start with a separator: drop them and let the spacing do the work */
.sectors.is-static .sectors__sep { display: none; }

/* ---------- Tablet and phone (to refine once desktop is approved) ---------- */
@container arc (max-width: 1199px) {
  .sectors { --sectors-fs: 46px; padding-block: var(--space-9); }
  .sectors[data-variant="band"] { --sectors-fs: 44px; }
}
@container arc (max-width: 809px) {
  .sectors { --sectors-fs: 34px; padding-block: var(--space-8); }
  .sectors[data-variant="band"] { --sectors-fs: 32px; }
  .sectors[data-variant="band"] .sectors__viewport { padding-block: 20px; }
}`

type Variant = "carved" | "band"

interface Props {
    title: string
    sectors: string[]
    variant: Variant
    speed: number
    style?: React.CSSProperties
}

const DEFAULTS: Props = {
    title: "Sectors we work in",
    sectors: ["Technology & AI", "Energy & Natural Resources", "Infrastructure", "Healthcare & Life Sciences", "Real Estate", "Media & Entertainment"],
    variant: "carved",
    speed: 44,
}

/**
 * @framerSupportedLayoutWidth any-prefer-fixed
 * @framerSupportedLayoutHeight auto
 */
export default function ArcoviaSectors(incoming: Partial<Props>) {
    const p = { ...DEFAULTS, ...incoming }
    const sectors = (p.sectors || []).filter((s) => s && s.trim())
    const list = sectors.length ? sectors : DEFAULTS.sectors
    const variant: Variant = p.variant === "band" ? "band" : "carved"
    const speed = typeof p.speed === "number" && p.speed > 0 ? p.speed : DEFAULTS.speed
    const ref = React.useRef<HTMLDivElement>(null)
    // Start again whenever the line changes (it is measured and carved once)
    const key = JSON.stringify([list, variant, speed])
    useArcoviaScript(ref, (root, life) => initSectors(root, life, speed), [key])

    const seam = (
        <div className="seam sectors__seam" data-carve="seam" aria-hidden="true">
            <span className="seam__hole seam__hole--start" data-carve="hole"></span>
            <span className="seam__hole seam__hole--end" data-carve="hole"></span>
        </div>
    )

    return (
        <div className="arc arc-sectors" ref={ref} style={p.style}>
            {baseStyle()}
            {cssTag("sectors", SECTORS_CSS)}
            {sprite()}
            <section className="sectors" data-sectors="" data-variant={variant} aria-labelledby="sectors-title">
                <canvas className="sectors__canvas" aria-hidden="true"></canvas>
                <h2 className="visually-hidden" id="sectors-title">
                    {p.title}
                </h2>
                {/* Only the charcoal band is dark under the header */}
                <div className="sectors__band" data-header-theme={variant === "band" ? "dark" : undefined}>
                    <div className="sectors__frame container">
                        {seam}
                        <div className="sectors__viewport" data-carve-clip="72">
                            {/* Component: marquee. The first list is the content; the script adds copies (aria-hidden) to fill the width. */}
                            <div className="sectors__track" data-sectors-track="">
                                <ul className="sectors__list" data-carve-slide="">
                                    {list.map((name, i) => (
                                        <React.Fragment key={i}>
                                            <li className="sectors__item" data-carve="text">
                                                {name}
                                            </li>
                                            <li className="sectors__sep" data-carve="hole" aria-hidden="true">
                                                <svg className="sectors__mark" viewBox="0 0 72 57">
                                                    <use href="#a-mark" />
                                                </svg>
                                            </li>
                                        </React.Fragment>
                                    ))}
                                </ul>
                            </div>
                        </div>
                        {seam}
                    </div>
                </div>
            </section>
        </div>
    )
}

/* ==========================================================================
   Behaviour (sectors.js): a slow marquee.
   Moves the line left at a calm, steady pace. Under the pointer it slows to
   a stop, so a sector can be read; while the page scrolls it picks up a
   little, then settles back. Pauses off-screen and in hidden tabs. With
   reduced motion it stands still.
   carved: a ConcreteSurface with the plain material carves the seams, tie
   holes and the line exactly like the hero; the line is carved once into a
   strip ([data-carve-slide]) and only its offset changes each frame.
   ========================================================================== */
function initSectors(host: HTMLElement, life: Life, SPEED: number) {
    const root = host.querySelector<HTMLElement>("[data-sectors]")
    if (!root) return

    // Review switch: ?sectors=band shows the charcoal band
    const given = root.getAttribute("data-variant")
    const variant = (location.search.match(/[?&]sectors=(\w+)/) || [])[1] || given || "carved"
    root.setAttribute("data-variant", variant)
    const band = root.querySelector<HTMLElement>(".sectors__band")
    const bandTheme = band ? band.getAttribute("data-header-theme") : null
    if (variant === "band" && band) band.setAttribute("data-header-theme", "dark")

    const viewport = root.querySelector<HTMLElement>(".sectors__viewport")
    const track = root.querySelector<HTMLElement>("[data-sectors-track]")
    const list = track && track.querySelector<HTMLElement>(".sectors__list")
    if (!viewport || !track || !list) return

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)")
    let x = 0 // offset, css px (0 … -loop)
    let loop = 0 // width of one list, separator included
    let speed = SPEED
    let boost = 0 // extra speed from scrolling, decays
    let hover = false
    let visible = false
    let running = false
    let last = 0
    let surface: ConcreteSurface | null = null // the live carving, once WebGL is up

    const removeClones = () => track.querySelectorAll("[data-clone]").forEach((n) => n.remove())

    function build() {
        removeClones()
        const still = reduced.matches
        root!.classList.toggle("is-static", still)
        // Standing still, the line wraps and is carved in place; moving, it is carved into the sliding strip
        if (still) list!.removeAttribute("data-carve-slide")
        else list!.setAttribute("data-carve-slide", "")
        if (surface) surface.queueLayout()
        if (still) {
            track!.style.transform = ""
            stop()
            return
        }
        // Fractional width, so the loop wraps to the sub-pixel
        loop = list!.getBoundingClientRect().width
        if (loop < 1) return
        if (!surface) {
            // Without the live surface the DOM line moves, with copies to fill the width
            const copies = Math.ceil(viewport!.clientWidth / loop) + 1
            for (let i = 0; i < copies; i++) {
                const c = list!.cloneNode(true) as HTMLElement
                c.setAttribute("aria-hidden", "true")
                c.setAttribute("data-clone", "")
                c.removeAttribute("data-carve-slide")
                c.querySelectorAll("[data-carve]").forEach((n) => n.removeAttribute("data-carve"))
                track!.appendChild(c)
            }
        }
        x = ((x % loop) - loop) % loop
        paint()
        start()
    }

    function paint() {
        if (surface) {
            track!.style.transform = ""
            surface.setSlide(-x)
        } else {
            track!.style.transform = "translate3d(" + x.toFixed(2) + "px, 0, 0)"
        }
    }

    function frame(now: number) {
        if (!running) return
        const dt = Math.min(0.05, (now - (last || now)) / 1000)
        last = now
        const target = hover ? 0 : SPEED * (1 + boost)
        // Ease towards the target: a gentle stop under the pointer, a softer pick-up after
        speed += (target - speed) * (1 - Math.exp(-dt * (hover ? 4 : 2.2)))
        boost *= Math.exp(-dt * 1.8)
        x -= speed * dt
        if (x <= -loop) x += loop
        paint()
        life.raf(frame)
    }

    function start() {
        if (running || !visible || document.hidden || reduced.matches || loop < 1) return
        running = true
        last = 0
        life.raf(frame)
    }
    function stop() {
        running = false
    }

    const io = life.observe(
        new IntersectionObserver(
            (entries) => {
                visible = entries[0].isIntersecting
                if (visible) start()
                else stop()
            },
            { rootMargin: "120px 0px" }
        )
    )
    io.observe(root)

    life.on(document, "visibilitychange", () => {
        if (document.hidden) stop()
        else start()
    })

    // Slow to a stop under a mouse pointer (touch would leave it stuck)
    life.on(viewport, "pointerenter", (e: PointerEvent) => {
        if (e.pointerType === "mouse") hover = true
    })
    life.on(viewport, "pointerleave", () => {
        hover = false
    })

    // Scrolling nudges it along: a little faster, never backwards
    let lastY = window.scrollY
    life.on(
        window,
        "scroll",
        () => {
            const dy = Math.abs(window.scrollY - lastY)
            lastY = window.scrollY
            if (running) boost = Math.min(2.4, Math.max(boost, dy / 14))
        },
        { passive: true }
    )

    let queued = false
    function rebuild() {
        if (queued || life.dead) return
        queued = true
        life.raf(() => {
            queued = false
            build()
        })
    }
    life.on(window, "resize", rebuild)
    if (typeof reduced.addEventListener === "function") life.on(reduced, "change", rebuild)
    // The component can mount before Montserrat has loaded: measure and carve again once it is in
    const fonts = (document as any).fonts
    if (fonts) {
        if (fonts.ready) fonts.ready.then(rebuild)
        if (fonts.addEventListener) life.on(fonts, "loadingdone", rebuild)
    }
    build()

    // The carved version: carve it into a plain neutral surface, exactly like the hero
    if (variant !== "band" && root.querySelector(".sectors__canvas")) {
        const s = new ConcreteSurface(root, {
            canvas: ".sectors__canvas",
            texture: ASSETS.concrete,
            plain: true,
            albedo: 1.21, // the flat ground lands on --color-neutral (#efefee)
            sun: 0, // no drifting sunlight: the ground stays perfectly flat; the rims come from the sky light
            cursor: 0.06, // a faint light that follows the pointer
            scope: host,
        })
        life.add(() => s.destroy())
        s.init().then((ok) => {
            if (!ok || life.dead) return
            surface = s
            root.classList.add("is-live")
            build()
        })
    }

    // Unmounting (or new copy): put the markup back as React rendered it
    life.add(() => {
        stop()
        removeClones()
        track.style.transform = ""
        list.setAttribute("data-carve-slide", "")
        root.classList.remove("is-live", "is-static")
        if (given) root.setAttribute("data-variant", given)
        if (band) {
            if (bandTheme) band.setAttribute("data-header-theme", bandTheme)
            else band.removeAttribute("data-header-theme")
        }
    })
}

addPropertyControls(ArcoviaSectors, {
    title: { type: ControlType.String, title: "Heading (hidden)", defaultValue: DEFAULTS.title },
    sectors: {
        type: ControlType.Array,
        title: "Sectors",
        control: { type: ControlType.String },
        defaultValue: DEFAULTS.sectors,
    },
    variant: {
        type: ControlType.Enum,
        title: "Version",
        options: ["carved", "band"],
        optionTitles: ["Carved", "Band"],
        defaultValue: DEFAULTS.variant,
    },
    speed: { type: ControlType.Number, title: "Speed", min: 10, max: 160, step: 1, unit: "px/s", defaultValue: DEFAULTS.speed },
})
