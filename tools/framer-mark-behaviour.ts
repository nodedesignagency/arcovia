/* ==========================================================================
   Behaviour (mark-v2.js): the drawing driven by scroll, the carved mark and the beam.
   The section is 400vh with a sticky stage; its progress p (0 -> 1 while the
   stage is pinned) drives everything, lightly smoothed, no timers:
     1  p 0.00-0.24  frame, left construction lines, left outline, "Capital"
     2  p 0.24-0.48  right construction lines, right outline, "Creative"
     3  p 0.48-0.70  axis, circle, x in the corner cells, "One idea"
     4  p 0.70-1.00  the drawing fades, the mark presses into the wall, the
                     beam comes up, the closing line comes in
   The wall is a ConcreteSurface on the stage (as The mark's on the HTML site):
   sun 0 and paused while the logo is drawn, then the CTA's beam fitted to the
   mark; the mark is carved by it (mark depth 0 -> 1 with scroll).
   Below 1200 the stage is not pinned (read from its CSS position, so it
   follows the container queries): the finished state.
   (Kept in tools/framer-mark-behaviour.ts; tools/framer-about.py pastes it into
   ArcoviaMark.tsx.)
   ========================================================================== */
function initMark(host: HTMLElement, life: Life) {
    const root = host.querySelector<HTMLElement>("[data-mark-v2]")
    const stage = root && root.querySelector<HTMLElement>(".mark-v2__stage")
    const svg = root && root.querySelector<SVGSVGElement>(".mark-v2__svg")
    if (!root || !stage || !svg) return
    const NS = "http://www.w3.org/2000/svg"
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)")
    const SMOOTHING = 0.12 // seconds: how long the drawing takes to catch up with the scroll
    const DIM = 0.45 // an earlier note, once the next step starts
    const OVERLAY = [0.74, 0.7] // the CSS overlay (no WebGL), before and after the mark is pressed in
    const ANCHOR = 3.5 // anchor point radius, px
    const POP = 2.5 // an anchor grows in over this much of the line (mark units)

    // Where everything happens, in p
    const T: Record<string, number[]> = {
        grid: [0.0, 0.08],
        consL: [0.06, 0.1], left: [0.09, 0.17], lead1: [0.16, 0.19], note1: [0.17, 0.21],
        consR: [0.25, 0.29], right: [0.28, 0.37], lead2: [0.37, 0.4], note2: [0.38, 0.42],
        axis: [0.48, 0.51], circle: [0.5, 0.59],
        cross: [0.59, 0.63], lead3: [0.6, 0.63], note3: [0.61, 0.65],
        sketchOut: [0.71, 0.77], press: [0.73, 0.84], light: [0.8, 0.92], closing: [0.82, 0.9],
    }

    const clamp01 = (x: number) => (x < 0 ? 0 : x > 1 ? 1 : x)
    const smooth = (t: number) => t * t * (3 - 2 * t)
    const at = (p: number, a: number, b: number) => {
        const t = clamp01((p - a) / (b - a))
        if (reduced.matches) return t > 0.5 ? 1 : 0 // no drawing: parts appear whole
        return smooth(t)
    }
    const atR = (p: number, r: number[]) => at(p, r[0], r[1])

    // ---------- Elements ----------
    const q = (s: string) => root.querySelector(s) as any
    const qa = (s: string) => Array.prototype.slice.call(root.querySelectorAll(s)) as any[]
    const overlay = q(".mark-v2__overlay")
    const sketch = q(".mark-v2__sketch")
    const floor = q(".mark-v2__floor")
    const walls = q(".mark-v2__walls")
    const lip = q(".mark-v2__lip")
    const light = q(".mark-v2__light")
    const closing = q("[data-closing]")
    const tag = q("[data-tag]")
    const cross = q("[data-cross]")
    const rules = qa("[data-rule]")
    const cons = { left: qa('[data-cons="left"]'), right: qa('[data-cons="right"]'), axis: qa('[data-cons="axis"]') }
    const leaders = [q('[data-leader="1"]'), q('[data-leader="2"]'), q('[data-leader="3"]')]
    const dots = [q('[data-dot="1"]'), q('[data-dot="2"]'), null]
    const notes = [q('[data-note="1"]'), q('[data-note="2"]'), q('[data-note="3"]')]
    const anchorLayer = q("[data-anchor-layer]")
    if (!sketch || !anchorLayer) return

    // The three outlines and their anchor points (made here from data-anchors)
    const draws = ["left", "right", "circle"].map((k) => {
        const el = q('[data-draw="' + k + '"]') as SVGPathElement
        const pts = (el.getAttribute("data-anchors") || "").trim().split(/\s+/).map((s) => {
            const xy = s.split(",")
            return { x: +xy[0], y: +xy[1] }
        })
        const anchors = pts.map((pt) => {
            const c = document.createElementNS(NS, "circle")
            c.setAttribute("class", "mark-v2__anchor")
            c.setAttribute("cx", String(pt.x))
            c.setAttribute("cy", String(pt.y))
            c.setAttribute("r", "0")
            anchorLayer.appendChild(c)
            return { el: c as any, x: pt.x, y: pt.y, at: 0 }
        })
        return { key: k, el: el as any, anchors, len: 0 }
    })
    life.add(() => {
        while (anchorLayer.firstChild) anchorLayer.removeChild(anchorLayer.firstChild)
    })

    // ---------- Measuring ----------
    const lens = new Map<any, number>()
    let anchorR = 0.6
    const lineLength = (el: any) => {
        const dx = +el.getAttribute("x2") - +el.getAttribute("x1")
        const dy = +el.getAttribute("y2") - +el.getAttribute("y1")
        return Math.sqrt(dx * dx + dy * dy)
    }
    const prepDash = (el: any, L: number) => {
        lens.set(el, L)
        el.style.strokeDasharray = L + " " + L
    }
    const measure = () => {
        rules.concat(cons.left, cons.right, cons.axis, leaders).forEach((el) => prepDash(el, lineLength(el)))
        draws.forEach((d) => {
            d.len = d.el.getTotalLength()
            prepDash(d.el, d.len)
            // How far along the outline each anchor is: the first is the start; the others are found in order
            const N = 600
            let from = 0
            d.anchors.forEach((a, i) => {
                if (i === 0) {
                    a.at = 0
                    return
                }
                let best = Infinity
                let bestL = from
                for (let s = 0; s <= N; s++) {
                    const L = (d.len * s) / N
                    if (L < from) continue
                    const pt = d.el.getPointAtLength(L)
                    const dist = (pt.x - a.x) * (pt.x - a.x) + (pt.y - a.y) * (pt.y - a.y)
                    if (dist < best) {
                        best = dist
                        bestL = L
                    }
                }
                a.at = bestL
                from = bestL
            })
        })
        // Lines true to the pixel whatever the mark's size: 1px lines, 7px anchors
        const w = svg.getBoundingClientRect().width || 420
        const k = 72 / w
        root.style.setProperty("--mv2-px", (1 * k).toFixed(4))
        anchorR = ANCHOR * k
    }

    // ---------- Writing only what changes ----------
    let cache = new WeakMap<any, Record<string, any>>()
    const put = (el: any, key: string, val: any, apply: () => void) => {
        if (!el) return
        let c = cache.get(el)
        if (!c) {
            c = {}
            cache.set(el, c)
        }
        if (c[key] === val) return
        c[key] = val
        apply()
    }
    const set = (el: any, prop: string, val: string) => put(el, prop, val, () => (el.style[prop] = val))
    const attr = (el: any, name: string, val: string) => put(el, "@" + name, val, () => el.setAttribute(name, val))
    const cls = (el: any, name: string, on: boolean) => put(el, "." + name, on, () => el.classList.toggle(name, on))
    const f = (x: number) => x.toFixed(3)

    // A line or outline drawn from its start to t
    const drawn = (el: any, t: number) => {
        const L = lens.get(el) || 0
        set(el, "strokeDashoffset", f(L * (1 - t)))
        set(el, "opacity", t > 0 ? "1" : "0")
    }
    // An outline with its anchors: each anchor grows in as the line reaches it;
    // the last one placed stays filled until the outline closes
    const drawOutline = (d: (typeof draws)[number], t: number) => {
        drawn(d.el, t)
        const reached = t * d.len
        let last = -1
        d.anchors.forEach((a, i) => {
            let g = t > 0 ? clamp01((reached - a.at) / POP + (i === 0 ? 1 : 0)) : 0
            if (reduced.matches) g = g > 0 ? 1 : 0
            if (g > 0) last = i
            const e = 1 - Math.pow(1 - g, 3)
            attr(a.el, "r", f(anchorR * (0.35 + 0.65 * e)))
            set(a.el, "opacity", f(e))
        })
        d.anchors.forEach((a, i) => cls(a.el, "is-current", t > 0 && t < 1 && i === last))
    }
    const noteState = (el: any, inT: number, dimT: number, outT: number) => {
        set(el, "opacity", f(inT * (1 - (1 - DIM) * dimT) * (1 - outT)))
        set(el, "transform", "translateY(" + f((1 - inT) * 8) + "px)")
    }

    // ---------- The wall and the beam of sunlight (concrete.js) ----------
    const SUN = 1.0
    const DUST = 0.4
    const TONE = [0.42, 0.45] // the wall before and after the press
    const beam = { angle: 22, width: 80, soft: 26, from: -300, to: 300, fadeFrom: -900, fadeTo: -400 }
    let beamOn = false
    let lightNow = [-1, -1]
    let surface: any = new ConcreteSurface(stage, {
        canvas: ".mark-v2__canvas",
        texture: ASSETS.concrete,
        scope: host,
        tone: TONE[0], // a dark wall
        bevel: 2.2, // wide walls: a deep cut
        vignette: 0.42,
        sun: 0, // no light until the logo is drawn
        cursor: 0,
        period: 18, // across and back, in seconds (the CTA's)
        staticBand: 0.5, // with reduced motion: across the middle of the mark
        beam: beam,
        dust: 0, // no shade box: the beam fades out before the feet, clear of the closing line
        smooth: true,
    } as any)
    surface.markDepth = 0 // flush, so invisible, until the last step presses it in
    surface.setPaused(true)
    life.add(() => {
        if (surface) surface.destroy()
        surface = null
        root.classList.remove("is-gl")
    })

    // The beam measured on the mark: as wide as the CTA's beam on its lockup, sweeping from across
    // the circle down to the lower legs, clear of the closing line, full from the left leg on
    const fitLight = () => {
        if (!surface) return
        const hr = stage.getBoundingClientRect()
        const r = svg.getBoundingClientRect()
        if (!r.width) return
        const mw = r.width
        const mh = r.height
        const cx = r.left - hr.left + mw / 2 - hr.width / 2 // the mark's centre, from the slab's centre
        const cy = r.top - hr.top + mh / 2 - hr.height / 2
        const a = (beam.angle * Math.PI) / 180
        const nx = Math.sin(a), ny = Math.cos(a) // across the beam (y down)
        const dx = Math.cos(a), dy = -Math.sin(a) // along it, towards the upper right
        const across = cx * nx + cy * ny
        const half = (mw / 2) * nx + (mh / 2) * ny
        beam.width = mh * 0.17
        beam.soft = mh * 0.055
        beam.from = across - half * 0.66
        beam.to = across + half * 0.42
        const along = cx * dx + cy * dy
        beam.fadeFrom = along - mw * 0.72
        beam.fadeTo = along - mw * 0.18
        surface.needsFrame = true
        surface.kick()
    }

    // li: how far the light has come up (0-1); pr: how far the mark is pressed in
    const setLight = (li: number, pr: number) => {
        if (li === lightNow[0] && pr === lightNow[1]) return
        lightNow = [li, pr]
        if (!surface || !surface.ready) return
        const o = surface.opts
        const on = li > 0
        // Each time the light comes in, the beam starts a quarter of the way across, moving down the mark
        if (on && !beamOn) surface.t0 = performance.now() - (o.period * 1000) / 6
        beamOn = on
        o.sun = SUN * li
        o.dust = DUST * li
        o.tone = TONE[0] + (TONE[1] - TONE[0]) * pr
        surface.markDepth = pr // the carved mark presses in
        surface.needsFrame = true
        surface.setPaused(!on) // nothing moves while the logo is drawn
        surface.kick()
    }

    // ---------- One frame of the drawing at progress p ----------
    const render = (p: number) => {
        const gStep = (T.grid[1] - T.grid[0] - 0.04) / Math.max(1, rules.length - 1)
        rules.forEach((el, i) => drawn(el, at(p, T.grid[0] + i * gStep, T.grid[0] + i * gStep + 0.04)))
        cons.left.forEach((el) => drawn(el, atR(p, T.consL)))
        cons.right.forEach((el) => drawn(el, atR(p, T.consR)))
        cons.axis.forEach((el) => drawn(el, atR(p, T.axis)))

        drawOutline(draws[0], atR(p, T.left))
        drawOutline(draws[1], atR(p, T.right))
        drawOutline(draws[2], atR(p, T.circle))

        const x = atR(p, T.cross)
        const out = atR(p, T.sketchOut)
        set(cross, "opacity", f(x))
        set(tag, "opacity", f(x * (1 - out)))
        ;[T.lead1, T.lead2, T.lead3].forEach((r, i) => {
            const t = atR(p, r)
            drawn(leaders[i], t)
            if (dots[i]) set(dots[i], "opacity", f(clamp01(t * 4)))
        })

        // Notes: in, dimmed once the next step starts, out with the drawing
        noteState(notes[0], atR(p, T.note1), atR(p, T.lead2), out)
        noteState(notes[1], atR(p, T.note2), atR(p, T.lead3), out)
        noteState(notes[2], atR(p, T.note3), 0, out)
        set(sketch, "opacity", f(1 - out))

        // Step 4: pressed into the concrete (carved by concrete.js; without WebGL, the SVG deboss)
        const pr = atR(p, T.press)
        set(floor, "opacity", f(0.28 * pr))
        set(walls, "opacity", f(pr))
        set(lip, "opacity", f(pr))
        set(overlay, "opacity", f(OVERLAY[0] + (OVERLAY[1] - OVERLAY[0]) * pr))
        const li = atR(p, T.light)
        set(light, "opacity", f(li))
        setLight(li, pr)
        const c = atR(p, T.closing)
        set(closing, "opacity", f(c))
        set(closing, "transform", "translateY(" + f((1 - c) * 8) + "px)")
    }

    // ---------- Scroll -> progress, lightly smoothed ----------
    let target = 0
    let shown = -1
    let last = 0
    let raf = 0
    let live = false
    const progress = () => {
        const r = root.getBoundingClientRect()
        const run = root.offsetHeight - window.innerHeight
        return run > 0 ? clamp01(-r.top / run) : 1
    }
    const frame = (now: number) => {
        raf = 0
        const dt = last ? Math.min(0.1, (now - last) / 1000) : 1 / 60
        last = now
        if (shown < 0 || reduced.matches) shown = target
        else shown += (target - shown) * (1 - Math.exp(-dt / SMOOTHING))
        if (Math.abs(target - shown) < 0.0004) shown = target
        render(shown)
        if (shown !== target) raf = life.raf(frame)
        else last = 0
    }
    const queue = () => {
        if (!live) return
        target = progress()
        if (!raf) raf = life.raf(frame)
    }

    // Below 1200 the stage is not pinned (the CSS says so): the finished state, simply there
    const pinned = () => getComputedStyle(stage).position === "sticky"
    const still = () => {
        render(1)
        notes.concat([closing, tag]).forEach((el) => {
            if (!el) return
            el.style.opacity = ""
            el.style.transform = ""
            cache.delete(el)
        })
    }
    const setMode = () => {
        const on = pinned()
        if (on === live) return
        live = on
        root.classList.toggle("is-live", on)
        measure()
        life.raf(fitLight)
        if (on) {
            shown = -1
            queue()
        } else {
            if (raf) {
                life.cancelRaf(raf)
                raf = 0
            }
            still()
        }
    }

    life.on(window, "scroll", queue, { passive: true })
    life.on(window, "resize", () => {
        measure()
        life.raf(fitLight)
        if (live) {
            shown = -1
            queue()
        }
    })
    life.observe(new ResizeObserver(() => setMode())).observe(root)
    if (typeof reduced.addEventListener === "function")
        life.on(reduced, "change", () => {
            shown = -1
            queue()
        })
    // The component can mount before Montserrat has loaded: measure and lay the slab out again once it is in
    const fonts = (document as any).fonts
    if (fonts && fonts.addEventListener)
        life.on(fonts, "loadingdone", () => {
            measure()
            if (surface) surface.queueLayout()
            life.raf(fitLight)
        })

    surface.init().then((ok: boolean) => {
        if (life.dead) return
        if (!ok) {
            surface = null
            return
        }
        fitLight()
        root.classList.add("is-gl")
        const l = lightNow
        lightNow = [-1, -1]
        setLight(Math.max(0, l[0]), Math.max(0, l[1]))
    })

    measure()
    setMode()
    if (!live) still()

    life.add(() => {
        cache = new WeakMap()
        root.classList.remove("is-live")
        ;[...rules, ...cons.left, ...cons.right, ...cons.axis, ...leaders, ...draws.map((d) => d.el)].forEach((el) => {
            if (el) el.removeAttribute("style")
        })
        ;[overlay, sketch, floor, walls, lip, light, closing, tag, cross, ...dots, ...notes].forEach((el) => {
            if (el) el.removeAttribute("style")
        })
        root.style.removeProperty("--mv2-px")
    })
}
