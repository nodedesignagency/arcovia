/**
 * Arcovia: the CTA, "Partner with us" (Home block 10, brief section 10).
 *
 * Laid out after the user's own earlier design: on the neutral ground straight
 * after the sectors line, a rounded box (11:5, at least 560px tall) with the text
 * on the left and the official lockup (A-mark over ARCOVIA) on the right.
 * The box is the client's sunrise wall (after the social assets she liked, a
 * little lighter): a concrete photo made with Magnific (ASSETS.ctaWall) lit live
 * by ConcreteSurface: a crisp beam of sunlight rises to the right at 22° and
 * sweeps across the wall and back every 18 s (easing at both ends), fading out
 * along its length before it reaches the text, with a faint glow either side and
 * fine dust turning in it; the wall is a little darker behind the text. The
 * lockup is carved into the wall, so the beam throws long shadows inside the cut
 * as it passes, and it presses in as the box comes up (scroll-linked: flush as it
 * enters at the bottom of the screen, fully carved by the time the page rests on
 * the box, lifting back out if you scroll up). The header turns light over the
 * box (data-header-theme="dark").
 * With reduced motion the beam stands still across the lockup, carved. Without
 * WebGL (and on the Framer canvas): the photo, a soft static beam and the lockup
 * debossed with the SVG filter #deboss.
 * Ported from closing.js and sections/closing.css on main.
 */
import * as React from "react"
import { addPropertyControls, ControlType } from "framer"
import { ASSETS, baseStyle, cssTag, sprite, useArcoviaScript, type Life } from "./ArcoviaBase.tsx"
import { ConcreteSurface } from "./ArcoviaConcrete.tsx"

const CLOSING_CSS = `/* ==========================================================================
   SECTION: closing — Home, block 10 (brief section 10): the CTA
   After the user's own earlier design: on the neutral ground straight after
   the sectors line, a rounded box with the text on the left and the logo on
   the right (no frame marks: the user's reference had corner marks and ruler
   ticks, which were only part of the reference, not wanted here).
   The box is the client's sunrise wall (after the social assets she liked, a
   little lighter): a concrete photo (assets/cta-wall.jpg, made with Magnific)
   lit live by concrete.js (closing.js): a beam of sunlight sweeps across and
   back every 18 s with fine dust turning in it, and the official lockup is
   carved into the wall, so the beam catches its walls as it passes. The beam
   dims behind the text, which keeps its contrast.
   Without WebGL the photo shows with a soft static beam and the lockup is
   debossed with the SVG filter (#deboss).
   Uses shared tokens, the light button and the arrow icon from styles.css.
   ========================================================================== */

.closing {
  padding-bottom: 0;   /* the footer sets the space below the box */
  background: var(--color-neutral);
}

/* ---------- The box ---------- */
.closing__card {
  --card-pad: 96px;          /* text and logo inset from the box's edge */
  position: relative;
  isolation: isolate;
  overflow: hidden;
  display: grid;
  grid-template-columns: repeat(12, minmax(0, 1fr));
  column-gap: var(--grid-gap);
  align-items: center;
  aspect-ratio: 11 / 5;
  min-height: 560px;
  width: 100%;             /* not auto: with auto, min-height sets the width by the ratio (560 × 11/5 = 1232px) and the box overflows below 1312px */
  padding-inline: var(--card-pad);
  border-radius: var(--radius-l);
  color: var(--color-on-dark);
  /* Static fallback: the wall, a soft beam and the shade behind the text */
  background-color: #5d5d5d;
  background-image:
    linear-gradient(90deg, rgba(0, 0, 0, 0.32) 0%, rgba(0, 0, 0, 0.12) 45%, rgba(0, 0, 0, 0) 60%),
    linear-gradient(158deg, transparent 38%, rgba(255, 255, 255, 0.34) 46%, rgba(255, 255, 255, 0.34) 54%, transparent 62%),
    url("${ASSETS.ctaWall}");
  background-size: auto, auto, cover;
  background-position: center;
}

.closing__canvas {
  position: absolute;
  inset: 0;
  z-index: -1;
  width: 100%;
  height: 100%;
  opacity: 0;
  transition: opacity 700ms var(--ease-out);
}
.closing__card.is-live .closing__canvas { opacity: 1; }

/* ---------- Text ---------- */
.closing__content {
  grid-column: 1 / span 6;
  grid-row: 1;
  display: grid;
  justify-items: start;
  /* keeps it legible wherever the light falls */
  text-shadow: 0 1px 18px rgba(0, 0, 0, 0.18);
}
.closing__title {
  font-size: 64px;
  font-weight: var(--weight-medium);
  line-height: 1.05;
  letter-spacing: -0.026em;
  color: var(--color-on-dark);
}
.closing__body {
  max-width: 27em;
  margin-top: var(--space-5);
  text-wrap: pretty;
  font-size: var(--fs-lede);
  line-height: var(--lh-lede);
  color: rgba(244, 244, 243, 0.88);
}
.closing__btn { margin-top: var(--space-6); text-shadow: none; }
@media (hover: hover) {
  .closing__btn:hover .closing__arrow { transform: translateX(3px); }
}

/* ---------- The lockup, carved into the wall ---------- */
.closing__figure {
  grid-column: 8 / span 4;
  grid-row: 1;
  display: grid;
  place-items: center;
  height: 100%;
}
.closing__mark {
  width: auto;
  height: 64%;
  max-width: 100%;
  aspect-ratio: 1;
  fill: currentColor;
  color: #000;           /* only the shape counts: the filter turns it into a recess */
  filter: url("#deboss");
}
/* With live light the lockup is carved into the wall itself (concrete.js); the SVG only marks the place */
.closing__card.is-live .closing__mark { opacity: 0; filter: none; }

/* ---------- Narrow desktop (1200-1311): the heading needs seven columns to stay on one line ---------- */
@container arc (max-width: 1311px) {
  .closing__content { grid-column: 1 / span 7; }
}

/* ---------- Tablet and phone (to refine once desktop is approved) ---------- */
@container arc (max-width: 1199px) {
  .closing__card { --card-pad: 64px; aspect-ratio: auto; min-height: 520px; }
  .closing__content { grid-column: 1 / span 7; }
  .closing__figure { grid-column: 8 / -1; }
  .closing__title { font-size: 52px; }
}
@container arc (max-width: 809px) {
  .closing__card { --card-pad: 28px; grid-template-rows: auto auto; row-gap: var(--space-6); padding-block: var(--space-9); }
  .closing__figure { grid-column: 3 / span 8; grid-row: 1; height: 220px; }
  .closing__content { grid-column: 1 / -1; grid-row: 2; }
  .closing__title { font-size: 40px; }
}`

interface Props {
    title: string
    body: string
    buttonLabel: string
    buttonLink: string
    period: number
    style?: React.CSSProperties
}

const DEFAULTS: Props = {
    title: "Partner with us",
    body: "Tell us what you are building, or what you are looking for. We will tell you honestly whether we are the right partner.",
    buttonLabel: "Start a conversation",
    buttonLink: "/contact",
    period: 18,
}

/**
 * @framerSupportedLayoutWidth any-prefer-fixed
 * @framerSupportedLayoutHeight auto
 */
export default function ArcoviaClosing(incoming: Partial<Props>) {
    const p = { ...DEFAULTS, ...incoming }
    const period = typeof p.period === "number" && p.period > 0 ? p.period : DEFAULTS.period
    const ref = React.useRef<HTMLDivElement>(null)
    // Carve again whenever the copy changes (the shade behind the text follows it)
    const key = JSON.stringify([p.title, p.body, p.buttonLabel, period])
    useArcoviaScript(ref, (root, life) => initClosing(root, life, period), [key])

    return (
        <div className="arc arc-closing" ref={ref} style={p.style}>
            {baseStyle()}
            {cssTag("closing", CLOSING_CSS)}
            {sprite()}
            <section className="closing" aria-labelledby="closing-title">
                <div className="closing__inner container">
                    <div className="closing__card" data-closing="" data-header-theme="dark">
                        <canvas className="closing__canvas" aria-hidden="true"></canvas>
                        <div className="closing__content">
                            <h2 className="closing__title" id="closing-title">
                                {p.title}
                            </h2>
                            <p className="closing__body">{p.body}</p>
                            <a className="btn btn--light closing__btn" href={p.buttonLink || "#"}>
                                {p.buttonLabel}
                                <svg className="btn__icon closing__arrow" aria-hidden="true">
                                    <use href="#icon-arrow" />
                                </svg>
                            </a>
                        </div>

                        <div className="closing__figure" aria-hidden="true">
                            {/* The official lockup, carved into the wall by ConcreteSurface */}
                            <svg className="closing__mark" viewBox="0 0 72 72" data-carve="mark">
                                <use href="#lockup" />
                            </svg>
                        </div>
                    </div>
                </div>
            </section>
        </div>
    )
}

/* ==========================================================================
   Behaviour (closing.js): the CTA's sunrise wall.
   A ConcreteSurface on the CTA box with the wall photo mapped once over it:
   the beam sweeps across and back, dims behind the text, and the carved
   lockup is pressed in as the box comes up.
   ========================================================================== */
function initClosing(host: HTMLElement, life: Life, period: number) {
    const card = host.querySelector<HTMLElement>("[data-closing]")
    if (!card) return
    const mark = card.querySelector<HTMLElement>(".closing__mark")
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)")

    const surface = new ConcreteSurface(card, {
        canvas: ".closing__canvas",
        texture: ASSETS.ctaWall,
        photo: true,
        albedo: 1, // the photo as it is
        vignette: 0.28, // the wall falls into shade towards its edges, as in the social assets
        sun: 0.82, // the beam: bright, with the concrete still showing through
        cursor: 0.1,
        period: period, // across and back, in seconds
        staticBand: 0.6, // with reduced motion: across the lockup
        // rises to the right; fades in along its length, so it is full over the lockup and gone before the text
        beam: { angle: 22, width: 72, soft: 22, from: -330, to: 400, fadeFrom: -420, fadeTo: 60 },
        dust: 0.4,
        shade: ".closing__content", // and the wall is a little darker behind the text
        shadeStrength: 0.5,
        shadeFeather: 180,
        smooth: true,
        scope: host,
    })
    life.add(() => surface.destroy())

    // 0 while the lockup's top edge enters at the bottom of the screen, 1 once its centre is two thirds
    // of the way down (so where the page comes to rest on the box, it is always fully carved)
    const depth = () => {
        if (reduced.matches || !mark) return 1
        const r = mark.getBoundingClientRect()
        const vh = window.innerHeight
        const p = Math.max(0, Math.min(1, (vh - r.top) / (vh * 0.34 + r.height / 2)))
        return p * p * (3 - 2 * p)
    }

    let queued = false
    const update = () => {
        queued = false
        surface.setMarkDepth(depth())
    }
    const queue = () => {
        if (queued) return
        queued = true
        life.raf(update)
    }

    surface.markDepth = depth()
    surface.init().then((ok) => {
        if (!ok || life.dead) return
        card.classList.add("is-live")
        update()
        life.on(window, "scroll", queue, { passive: true })
        life.on(window, "resize", queue)
        if (typeof reduced.addEventListener === "function") life.on(reduced, "change", queue)
    })
    // The component can mount before Montserrat has loaded: measure the text box again once it is in
    const fonts = (document as any).fonts
    if (fonts && fonts.addEventListener) life.on(fonts, "loadingdone", () => surface.queueLayout())

    life.add(() => card.classList.remove("is-live"))
}

addPropertyControls(ArcoviaClosing, {
    title: { type: ControlType.String, title: "Heading", defaultValue: DEFAULTS.title },
    body: { type: ControlType.String, title: "Text", displayTextArea: true, defaultValue: DEFAULTS.body },
    buttonLabel: { type: ControlType.String, title: "Button", defaultValue: DEFAULTS.buttonLabel },
    buttonLink: { type: ControlType.Link, title: "Button link", defaultValue: DEFAULTS.buttonLink },
    period: { type: ControlType.Number, title: "Beam period", min: 8, max: 40, step: 1, unit: "s", defaultValue: DEFAULTS.period },
})
