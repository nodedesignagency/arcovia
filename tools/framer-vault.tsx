/**
 * Arcovia: the opening on Home, the sliding vault doors (the `?vault=doors` version
 * of `site/vault.js` + `site/sections/vault.css` on `claude/vigilant-hawking-vmkeam`).
 * Uploaded to Framer as ArcoviaVault.tsx; this file is its source.
 *
 * Two flat charcoal doors (#565656) with the A-mark debossed across them. The joint
 * runs down the middle, rounds the wheel's right side on the logo's own gap and runs
 * on down between the legs, so the whole circle leaves with the left door. First the
 * circle unlocks like a vault lock (graduations come up, it turns right, left, then
 * right to zero, with a click at each stop), light catches in the joint, then the
 * doors slide apart and light pours through the gap onto the hero. About 2.3 s.
 *
 * Plays when the site is opened or reloaded on Home, not when you come back to Home
 * from another page in the same visit (?vault=on always plays, ?vault=off never).
 * A scroll, key or tap starts it at once. Reduced motion: the doors fade.
 *
 * Before the first paint: a small inline script (rendered into the page's HTML, so it
 * runs while the page loads, like the head script on the HTML site) decides whether it
 * plays and sets html.vault-on; the CSS then paints the closed doors. On a client-side
 * visit to Home the same decision runs in a layout effect, before the browser paints.
 * The door is position: fixed on z-index 100, over the header. The component itself
 * is 0px tall, so it takes no room on the page; on the canvas it shows nothing unless
 * "On canvas" is set to Show.
 */
import * as React from "react"
import { addPropertyControls, ControlType } from "framer"
import { createLife, isStaticRender, type Life } from "./ArcoviaBase.tsx"

type Plays = "open" | "always" | "off"

interface Props {
    plays: Plays
    preview: boolean
    style?: React.CSSProperties
}

const DEFAULTS: Props = { plays: "open", preview: false }

const MIN_HOLD = 400 // ms the closed door is seen
const MAX_WAIT = 1600 // ms at most before it opens
const LATE = 3500 // ms after the first paint: past this, the door just fades

/* Decides whether the opening plays. Self-contained on purpose: it is also written into
   the page as the inline script (via toString), so it must not use anything outside it.
   initial: this is the page load itself (not a client-side visit to Home). */
function arcVaultDecide(initial: boolean, plays: string): boolean {
    try {
        var q = location.search
        if (/[?&]vault=off\b/.test(q) || plays === "off") return false
        if (/[?&]vault=(on|doors)\b/.test(q) || plays === "always") return true
        var seen = false
        try {
            seen = sessionStorage.getItem("arc-vault") === "1"
        } catch (e) {}
        // A visit to Home from another page of the site, inside the page: once a visit
        if (!initial) return !seen
        var nav: any = performance.getEntriesByType ? performance.getEntriesByType("navigation")[0] : null
        var type = nav ? nav.type : "navigate"
        if (type === "back_forward") return false
        var fromSite = false
        try {
            fromSite = !!document.referrer && new URL(document.referrer).origin === location.origin
        } catch (e) {}
        return !(type === "navigate" && fromSite && seen)
    } catch (e) {
        return false
    }
}

function inlineScript(plays: string) {
    return (
        "(function(){try{var d=(" + arcVaultDecide.toString() + ")(true," + JSON.stringify(plays) + ");" +
        "window.__arcVault={play:d};" +
        "if(d){document.documentElement.classList.add(\"vault-on\");" +
        // The browser's toolbar takes the door's charcoal while it is closed
        "var m=document.querySelector('meta[name=\"theme-color\"]');" +
        "if(m){m.setAttribute(\"data-base\",m.getAttribute(\"content\"));m.setAttribute(\"content\",\"#565656\")}}" +
        "}catch(e){}})()"
    )
}

/* The dial, in mark units round the wheel's centre: 60 ticks (every fifth longer) just
   inside the rim, a zero mark at the top (under the seam once it clicks home) */
const DIAL = (() => {
    const CX = 36.201,
        CY = 8.0109
    const t: Record<string, string> = { minor: "", major: "", zero: "" }
    for (let i = 0; i < 60; i++) {
        const a = (i / 60) * Math.PI * 2,
            sx = Math.sin(a),
            sy = -Math.cos(a) // 0 at the top, clockwise
        const kind = i === 0 ? "zero" : i % 5 === 0 ? "major" : "minor"
        const r0 = kind === "zero" ? 5.5 : kind === "major" ? 6.25 : 6.85,
            r1 = 7.45
        t[kind] +=
            "M" + (CX + sx * r0).toFixed(3) + " " + (CY + sy * r0).toFixed(3) +
            "L" + (CX + sx * r1).toFixed(3) + " " + (CY + sy * r1).toFixed(3)
    }
    return t
})()

/* The official brandmark (viewBox 72 × 57), the vault door's deboss (light from above, in
   units of the mark's own box so the walls scale with it), and the doors' shapes in mark
   units: the joint runs down the middle (x 36.201, the wheel's centre), rounds the wheel's
   right side on a ring of radius 8.555 (half-way between the wheel, r 8.014, and the tops
   of the legs, 9.10 from its centre) and runs on down between the legs */
function defs(u: string) {
    return (
        `<symbol id="vault-mark-${u}" viewBox="0 0 72 57"><path d="M12.0606 45.653L6.4043 56.272L9.58059 56.3005C11.096 56.3148 12.4458 56.3605 14.1267 56.2321L35.0366 17.4288C32.9219 16.7924 31.1725 15.7479 29.6286 14.4009L12.0606 45.653Z"/><path d="M62.5327 50.738L42.9184 14.1807C41.2461 15.8616 39.5509 16.9432 37.3164 17.1743L57.8439 56.243H65.3551C64.3192 54.3652 63.3831 52.7499 62.5327 50.738Z"/><path d="M36.201 16.0215C40.6267 16.0215 44.2145 12.4351 44.2145 8.0109C44.2145 3.58674 40.6267 0.000244141 36.201 0.000244141C31.7753 0.000244141 28.1875 3.58674 28.1875 8.0109C28.1875 12.4351 31.7753 16.0215 36.201 16.0215Z"/></symbol>` +
        `<filter id="vault-deboss-${u}" x="-5%" y="-5%" width="110%" height="110%" primitiveUnits="objectBoundingBox" color-interpolation-filters="sRGB">` +
        `<feFlood flood-color="#000" flood-opacity="0.22"/><feComposite in2="SourceAlpha" operator="in" result="floor"/>` +
        `<feOffset in="SourceAlpha" dx="0" dy="0.00965" result="o1"/><feGaussianBlur in="o1" stdDeviation="0.00306 0.00386" result="b1"/>` +
        `<feComposite in="SourceAlpha" in2="b1" operator="out" result="e1"/>` +
        `<feFlood flood-color="#000" flood-opacity="0.6"/><feComposite in2="e1" operator="in" result="shade"/>` +
        `<feOffset in="SourceAlpha" dx="0" dy="-0.00561" result="o2"/><feGaussianBlur in="o2" stdDeviation="0.00208 0.00263" result="b2"/>` +
        `<feComposite in="SourceAlpha" in2="b2" operator="out" result="e2"/>` +
        `<feFlood flood-color="#fff" flood-opacity="0.22"/><feComposite in2="e2" operator="in" result="light"/>` +
        `<feMerge><feMergeNode in="floor"/><feMergeNode in="shade"/><feMergeNode in="light"/></feMerge></filter>` +
        `<path id="vault-joint-${u}" d="M36.201 -2000V-0.544A8.555 8.555 0 0 1 36.201 16.566V2000" vector-effect="non-scaling-stroke"/>` +
        `<path id="vault-shape-left-${u}" d="M-2000 -2000H36.201V-0.544A8.555 8.555 0 0 1 36.201 16.566V2000H-2000Z"/>` +
        `<path id="vault-shape-right-${u}" d="M2000 -2000H36.201V-0.544A8.555 8.555 0 0 1 36.201 16.566V2000H2000Z"/>` +
        `<clipPath id="vault-clip-left-${u}"><use href="#vault-shape-left-${u}"/></clipPath>` +
        `<clipPath id="vault-clip-right-${u}"><use href="#vault-shape-right-${u}"/></clipPath>`
    )
}

const EASE_OUT = "cubic-bezier(0.22, 1, 0.36, 1)" // --ease-out

const VAULT_CSS = `/* ==========================================================================
   The opening: sliding vault doors (site/sections/vault.css, ?vault=doors)
   ========================================================================== */

/* The component takes no room; no containment of its own, so the door's
   position: fixed is the screen's */
.arc-vault { position: relative; height: 0; container-type: normal; }
.arc-vault .vault__sprite { position: absolute; width: 0; height: 0; overflow: hidden; pointer-events: none; }

/* On the root so the hero's text can time itself by them too; the script reads them */
html.vault-on {
  --vault-unlock: 1100ms;                         /* the circle turns through its combination */
  --vault-delay: 180ms;                           /* then the light catches in the joint */
  --vault-open: 900ms;                            /* then the doors travel */
  --vault-start: calc(var(--vault-unlock) + var(--vault-delay));
  --vault-ease: cubic-bezier(0.76, 0, 0.24, 1);   /* heavy: slow to start, slow to stop */
}

.vault { display: none; }
.vault-on .vault {
  display: block;
  position: fixed;
  inset: 0;
  z-index: 100;
  container-type: size;            /* the mark is sized from the door's own box */
  /* Failsafe: if the script never runs, the door steps aside after 5 s */
  animation: vault-failsafe 1ms linear 5s forwards;
}
@keyframes vault-failsafe { to { visibility: hidden; pointer-events: none; } }

/* Opening: the page underneath takes clicks straight away, and the failsafe stands down */
.vault-open .vault { pointer-events: none; animation: none; }
/* Reduced motion (or a late start): nothing slides, the door fades */
.vault.is-fading { pointer-events: none; animation: vault-fade 360ms ${EASE_OUT} forwards; }
@keyframes vault-fade { to { opacity: 0; } }
.vault.is-gone { display: none; }

/* The canvas, with "On canvas: Show": the closed doors over the top of the page */
.vault.is-preview {
  display: block;
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 800px;
  z-index: 100;
  container-type: size;
}

/* ---------- Behind the door ---------- */
/* The hero's text waits, then rises as the doors part */
.vault-on:not(.vault-open) .hero [data-rise] { animation-play-state: paused; }
.vault-on.vault-open .hero [data-rise] { animation-delay: calc(var(--rise, 0) * 90ms + var(--vault-unlock) + 560ms); }
.vault-on.vault-open.vault-quick .hero [data-rise] { animation-delay: calc(var(--rise, 0) * 90ms + 60ms); }
/* The live concrete is there the moment the doors part (it fades in as usual if it comes later) */
.vault-on:not(.vault-open) .hero__canvas { transition: none; }

/* ---------- The doors ---------- */
.vault__doors {
  --vault-h: min(50cqh, calc(70cqw * 57 / 72));   /* half the height, at most 70% wide */
  /* each door travels its half plus the wheel's tab, so the tab clears the edge too */
  --vault-travel: calc(50cqw + var(--vault-h) * 0.150088 + 2px);
  position: absolute;
  inset: 0;
  overflow: hidden;
}

/* Charcoal behind the closed doors: where the two leaves meet on an anti-aliased edge, the hero
   would show through as a light hairline. It goes as the doors start to move */
.vault__backing {
  position: absolute;
  inset: 0;
  background: #565656;
}
.vault.is-opening .vault__backing { animation: vault-joint 1ms linear var(--vault-start) forwards; }

/* A leaf: an SVG over the mark's box (wheel centre on the middle, mark centre 48% down),
   painting its door shape far beyond it */
.vault__leaf {
  position: absolute;
  left: 50%;
  top: 48%;
  height: var(--vault-h);
  width: auto;
  aspect-ratio: 72 / 57;
  overflow: visible;
  transform: translate(-50.28%, -50%);
  pointer-events: none;
}

.vault__door {
  position: absolute;
  inset: 0;
  overflow: hidden;               /* the leaf's shape is cut to the screen */
  will-change: transform;
}
.vault__face { fill: #565656; }
.vault__deboss { fill: #000; color: #000; }       /* only the shape counts: the deboss filter presses it in */
/* Each door's leading edge catches a little light (under the joint while closed) */
.vault__lip { fill: none; stroke: rgba(255, 255, 255, 0.1); stroke-width: 2px; }

/* The joint while closed: a fine groove, dark on the left door's side, a light lip on the right
   door's (a 2px line cut by each door's shape: 1px on each side) */
.vault__groove { fill: none; stroke-width: 2px; }
.vault__groove--dark { stroke: rgba(0, 0, 0, 0.3); }
.vault__groove--light { stroke: rgba(255, 255, 255, 0.08); }

/* Light catching in the joint as the doors unlatch: a bright core in a soft glow */
.vault__catch { opacity: 0; }
.vault__glow { fill: none; stroke: #fff; stroke-linejoin: round; }
.vault__glow--1 { stroke-width: 16px; stroke-opacity: 0.05; }
.vault__glow--2 { stroke-width: 8px; stroke-opacity: 0.1; }
.vault__glow--3 { stroke-width: 3.5px; stroke-opacity: 0.28; }
.vault__glow--core { stroke-width: 1.4px; stroke-opacity: 0.9; }

/* ---------- The lock: the circle is the dial ----------
   An SVG over the wheel (viewBox = the circle's box in mark units, so it lines up exactly),
   inside the left door so it leaves with it, on its own layer so it turns on the compositor.
   60 fine ticks, every fifth longer, and a zero mark that comes to rest under the seam.
   Hidden until the unlock, so the closed door is the plain logo */
.vault__dial {
  position: absolute;
  left: 50%;
  top: calc(48% - var(--vault-h) * 0.359458);     /* the wheel's centre: y 8.0109 of 57 */
  width: calc(var(--vault-h) * 0.281179);         /* its diameter: 16.027 of 57 */
  height: calc(var(--vault-h) * 0.281179);
  overflow: visible;
  opacity: 0;
  transform: translate(-50%, -50%) rotate(-200deg);
  will-change: transform, opacity;
}
.vault__ticks { fill: none; stroke: #fff; }
.vault__ticks--minor { stroke-width: 1px; stroke-opacity: 0.16; }
.vault__ticks--major { stroke-width: 1.25px; stroke-opacity: 0.3; }
.vault__ticks--zero { stroke-width: 2px; stroke-opacity: 0.62; }
.vault__ticks--hub { stroke-width: 1px; stroke-opacity: 0.16; }

/* The click at each stop: a small glint where the dial's top meets the seam (the index) */
.vault__glint {
  position: absolute;
  left: 50%;
  top: calc(48% - var(--vault-h) * 0.5047);       /* y -0.27 of 57: between the dial and the seam */
  width: 28px;
  height: 28px;
  margin: -14px 0 0 -14px;
  border-radius: 50%;
  background: radial-gradient(closest-side, rgba(255, 255, 255, 0.95), rgba(255, 255, 255, 0.22) 38%, rgba(255, 255, 255, 0));
  opacity: 0;
  will-change: opacity;
}

.vault.is-opening .vault__dial {
  animation: vault-dial var(--vault-unlock) linear forwards,
             vault-dial-in 220ms ${EASE_OUT} forwards;
}
.vault.is-opening .vault__glint {
  animation: vault-click var(--vault-unlock) linear forwards,
             vault-click-out 420ms ${EASE_OUT} var(--vault-unlock) forwards;
}
/* The combination: right, left, then right to zero. Each turn eases in and out like a heavy
   dial; each stop overshoots a hair and settles back (the detent), and clicks */
@keyframes vault-dial {
  0% { transform: translate(-50%, -50%) rotate(-200deg); animation-timing-function: cubic-bezier(0.55, 0, 0.3, 1); }
  42% { transform: translate(-50%, -50%) rotate(93deg); animation-timing-function: ease-out; }
  46%, 50% { transform: translate(-50%, -50%) rotate(90deg); animation-timing-function: cubic-bezier(0.55, 0, 0.3, 1); }
  73% { transform: translate(-50%, -50%) rotate(-62.5deg); animation-timing-function: ease-out; }
  76%, 80% { transform: translate(-50%, -50%) rotate(-60deg); animation-timing-function: cubic-bezier(0.45, 0, 0.25, 1); }
  95% { transform: translate(-50%, -50%) rotate(1.5deg); animation-timing-function: ease-out; }
  100% { transform: translate(-50%, -50%) rotate(0deg); }
}
@keyframes vault-dial-in { to { opacity: 1; } }
@keyframes vault-click {
  0%, 41% { opacity: 0; }
  43% { opacity: 0.45; }
  49%, 72% { opacity: 0; }
  74% { opacity: 0.45; }
  80%, 94% { opacity: 0; }
  96%, 100% { opacity: 1; }
}
@keyframes vault-click-out { from { opacity: 1; } to { opacity: 0; } }

/* The doors' shadow on the hero: each door's silhouette, blurred, under both doors (so it only
   shows in the gap); taller than the screen so the blur has no edge at the top or bottom */
.vault__cast {
  position: absolute;
  inset: -80px 0;
  overflow: hidden;
  filter: drop-shadow(0 0 30px rgba(0, 0, 0, 0.55));
  opacity: 0;
  will-change: transform, opacity;
}
.vault__cast .vault__leaf { top: calc(48cqh + 80px); fill: #000; }

/* Light pouring through the gap: under the doors, so it only brightens the hero between them;
   it widens with the gap, then goes */
.vault__light {
  position: absolute;
  top: 0;
  bottom: 0;
  left: 50%;
  width: 160px;
  margin-left: -80px;
  background: linear-gradient(90deg, rgba(255, 255, 255, 0), rgba(255, 255, 255, 0.55) 50%, rgba(255, 255, 255, 0));
  opacity: 0;
  transform: scaleX(0.02);
}

/* ---------- Opening (the script adds .is-opening) ---------- */
.vault.is-opening .vault__door--left { animation: vault-left var(--vault-open) var(--vault-ease) var(--vault-start) forwards; }
.vault.is-opening .vault__door--right { animation: vault-right var(--vault-open) var(--vault-ease) var(--vault-start) forwards; }
.vault.is-opening .vault__cast--left {
  animation: vault-left var(--vault-open) var(--vault-ease) var(--vault-start) forwards,
             vault-shade var(--vault-open) linear var(--vault-start) forwards;
}
.vault.is-opening .vault__cast--right {
  animation: vault-right var(--vault-open) var(--vault-ease) var(--vault-start) forwards,
             vault-shade var(--vault-open) linear var(--vault-start) forwards;
}
.vault.is-opening .vault__cut { animation: vault-joint 120ms linear calc(var(--vault-unlock) + 140ms) forwards; }
.vault.is-opening .vault__catch { animation: vault-catch 460ms linear var(--vault-unlock) forwards; }
.vault.is-opening .vault__light { animation: vault-light var(--vault-open) ${EASE_OUT} var(--vault-start) forwards; }

@keyframes vault-left { to { transform: translate3d(calc(-1 * var(--vault-travel)), 0, 0); } }
@keyframes vault-right { to { transform: translate3d(var(--vault-travel), 0, 0); } }
@keyframes vault-shade {
  0%, 30% { opacity: 0; }
  50% { opacity: 1; }
  85% { opacity: 0.5; }
  100% { opacity: 0; }
}
@keyframes vault-joint { to { opacity: 0; } }   /* gone before the gap is wider than the joint */
@keyframes vault-catch { 0% { opacity: 0; } 30%, 40% { opacity: 1; } 100% { opacity: 0; } }
@keyframes vault-light {
  0% { opacity: 0; transform: scaleX(0.02); }
  12% { opacity: 1; transform: scaleX(0.06); }
  45% { opacity: 0.6; transform: scaleX(1); }
  70%, 100% { opacity: 0; transform: scaleX(2.4); }
}
`

const ROOT_CLASSES = ["vault-on", "vault-open", "vault-quick", "vault-done"]

function restoreTint() {
    const meta = document.querySelector('meta[name="theme-color"]')
    if (meta && meta.getAttribute("data-base")) meta.setAttribute("content", meta.getAttribute("data-base") as string)
}

function ms(css: CSSStyleDeclaration, name: string, fallback: number) {
    const v = parseFloat(css.getPropertyValue(name))
    return isFinite(v) ? v : fallback
}

/* vault.js (?vault=doors): waits for the hero's live concrete, starts the opening
   (.is-opening, all CSS from there) and clears it away */
function runDoors(vault: HTMLElement, life: Life, initial: boolean) {
    const root = document.documentElement
    // Seen in this visit: coming back to Home from another page skips it
    try {
        sessionStorage.setItem("arc-vault", "1")
    } catch (e) {
        /* private mode: plays again, fine */
    }

    let t0 = performance.now()
    if (initial) {
        try {
            const paint = performance.getEntriesByName("first-contentful-paint")[0]
            if (paint) t0 = paint.startTime // the door has been on screen since the first paint
        } catch (e) {}
    }
    const reduce = !!window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches
    const css = getComputedStyle(root)
    const SLIDE = ms(css, "--vault-unlock", 1100) + ms(css, "--vault-delay", 180) + ms(css, "--vault-open", 900)
    const hero = document.querySelector<HTMLElement>(".hero[data-hero]")

    let slid = false
    const slide = (quick?: boolean) => {
        if (slid) return
        slid = true
        const fade = reduce || !!quick
        if (quick) root.classList.add("vault-quick")
        root.classList.add("vault-open")
        restoreTint()
        vault.classList.add(fade ? "is-fading" : "is-opening")
        life.timeout(
            () => {
                vault.classList.add("is-gone")
                root.classList.add("vault-done")
                // Once the hero's text has risen, the page is back to normal
                life.timeout(() => root.classList.remove(...ROOT_CLASSES), 1200)
            },
            fade ? 420 : SLIDE + 120
        )
    }

    // Loaded so late that the door has stood there a while: it just fades
    if (performance.now() - t0 > LATE) {
        slide(true)
        return
    }

    const start = () => slide()
    ;["wheel", "touchstart", "keydown", "pointerdown"].forEach((type) =>
        life.on(window, type, start, { capture: true, passive: true })
    )
    const wait = () => {
        if (slid) return
        const waited = performance.now() - t0
        if ((waited >= MIN_HOLD && (!hero || hero.classList.contains("hero--gl"))) || waited >= MAX_WAIT) slide()
        else life.raf(wait)
    }
    wait()
}

const useBeforePaint = typeof window !== "undefined" ? React.useLayoutEffect : React.useEffect

/**
 * The opening: sliding vault doors. Put it first on Home.
 *
 * @framerSupportedLayoutWidth any
 * @framerSupportedLayoutHeight auto
 */
export default function ArcoviaVault(incoming: Partial<Props>) {
    const p = { ...DEFAULTS, ...incoming }
    const ref = React.useRef<HTMLDivElement>(null)
    const isStatic = isStaticRender()
    // One set of ids per copy (Framer can render a copy per breakpoint into the page)
    const u = "v" + React.useId().replace(/[^a-zA-Z0-9_-]/g, "")
    const plays: Plays = p.plays === "always" || p.plays === "off" ? p.plays : "open"

    useBeforePaint(() => {
        if (isStaticRender()) return
        const vault = ref.current && ref.current.querySelector<HTMLElement>("[data-vault]")
        if (!vault) return
        const root = document.documentElement
        const w = window as any

        let play: boolean
        let initial: boolean
        if (!w.__arcVaultMounted && w.__arcVault && !w.__arcVault.used) {
            // The inline script decided while the page loaded (and set html.vault-on)
            w.__arcVault.used = true
            play = !!w.__arcVault.play
            initial = true
        } else {
            // No inline script ran: the first mount of this page load, or a client-side visit to Home
            let loadPath = ""
            try {
                const nav: any = performance.getEntriesByType("navigation")[0]
                loadPath = nav ? new URL(nav.name).pathname : ""
            } catch (e) {}
            initial = !w.__arcVaultMounted && (!loadPath || loadPath === location.pathname)
            play = arcVaultDecide(initial, plays)
        }
        w.__arcVaultMounted = true

        if (!play) {
            root.classList.remove(...ROOT_CLASSES)
            vault.classList.add("is-gone")
            return
        }
        root.classList.add("vault-on")
        const life = createLife()
        try {
            runDoors(vault, life, initial)
        } catch (e) {
            console.error("[Arcovia]", e)
            vault.classList.add("is-gone")
            root.classList.remove(...ROOT_CLASSES)
        }
        return () => {
            life.dispose()
            root.classList.remove(...ROOT_CLASSES)
            restoreTint()
        }
    }, [])

    const joint = `#vault-joint-${u}`
    const deboss = (
        <g className="vault__deboss" filter={`url(#vault-deboss-${u})`}>
            <rect width="72" height="57" fill="none" />
            <use href={`#vault-mark-${u}`} width="72" height="57" />
        </g>
    )

    return (
        <div className="arc-vault" ref={ref} style={{ ...p.style }} aria-hidden="true">
            <style data-arcovia="vault" dangerouslySetInnerHTML={{ __html: VAULT_CSS }} />
            {/* Decides before the first paint whether the opening plays (sets html.vault-on) */}
            {!isStatic && <script dangerouslySetInnerHTML={{ __html: inlineScript(plays) }} />}
            <svg className="vault__sprite" focusable="false" dangerouslySetInnerHTML={{ __html: defs(u) }} />
            {/* Two flat charcoal doors slide apart; the joint rounds the wheel, so the whole circle
                leaves with the left door (with the left leg) and the right leg with the right door.
                Each leaf is drawn in mark units, so the cut stays exact */}
            <div className={"vault" + (isStatic && p.preview ? " is-preview" : "")} data-vault="">
                <div className="vault__doors">
                    <span className="vault__backing"></span>
                    <span className="vault__light"></span>
                    <div className="vault__cast vault__cast--left">
                        <svg className="vault__leaf" viewBox="0 0 72 57">
                            <use href={`#vault-shape-left-${u}`} />
                        </svg>
                    </div>
                    <div className="vault__cast vault__cast--right">
                        <svg className="vault__leaf" viewBox="0 0 72 57">
                            <use href={`#vault-shape-right-${u}`} />
                        </svg>
                    </div>
                    <div className="vault__door vault__door--left">
                        <svg className="vault__leaf" viewBox="0 0 72 57">
                            <use className="vault__face" href={`#vault-shape-left-${u}`} />
                            <g clipPath={`url(#vault-clip-left-${u})`}>
                                {deboss}
                                <use className="vault__lip" href={joint} />
                            </g>
                        </svg>
                        {/* The lock: the circle as a dial, turning on its own layer */}
                        <svg className="vault__dial" viewBox="28.1874 -0.0027 16.0272 16.0272">
                            <path className="vault__ticks vault__ticks--minor" d={DIAL.minor} vectorEffect="non-scaling-stroke" />
                            <path className="vault__ticks vault__ticks--major" d={DIAL.major} vectorEffect="non-scaling-stroke" />
                            <path className="vault__ticks vault__ticks--zero" d={DIAL.zero} vectorEffect="non-scaling-stroke" />
                            <circle className="vault__ticks vault__ticks--hub" cx="36.201" cy="8.0109" r="1.05" vectorEffect="non-scaling-stroke" />
                        </svg>
                    </div>
                    <div className="vault__door vault__door--right">
                        <svg className="vault__leaf" viewBox="0 0 72 57">
                            <use className="vault__face" href={`#vault-shape-right-${u}`} />
                            <g clipPath={`url(#vault-clip-right-${u})`}>
                                {deboss}
                                <use className="vault__lip" href={joint} />
                            </g>
                        </svg>
                    </div>
                    <svg className="vault__leaf vault__cut" viewBox="0 0 72 57">
                        <use className="vault__groove vault__groove--dark" href={joint} clipPath={`url(#vault-clip-left-${u})`} />
                        <use className="vault__groove vault__groove--light" href={joint} clipPath={`url(#vault-clip-right-${u})`} />
                    </svg>
                    <svg className="vault__leaf vault__catch" viewBox="0 0 72 57">
                        <use className="vault__glow vault__glow--1" href={joint} />
                        <use className="vault__glow vault__glow--2" href={joint} />
                        <use className="vault__glow vault__glow--3" href={joint} />
                        <use className="vault__glow vault__glow--core" href={joint} />
                    </svg>
                    <span className="vault__glint"></span>
                </div>
            </div>
        </div>
    )
}

ArcoviaVault.displayName = "Arcovia Vault"

addPropertyControls(ArcoviaVault, {
    plays: {
        type: ControlType.Enum,
        title: "Plays",
        options: ["open", "always", "off"],
        optionTitles: ["When the site opens", "Every visit to Home", "Off"],
        defaultValue: DEFAULTS.plays,
        description: "When the site opens: on opening or reloading Home, not when coming back to Home from another page. ?vault=on / ?vault=off in the URL override it.",
    },
    preview: {
        type: ControlType.Boolean,
        title: "On canvas",
        enabledTitle: "Show",
        disabledTitle: "Hide",
        defaultValue: DEFAULTS.preview,
    },
})
