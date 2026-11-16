/* ==========================================================================
   Arcovia · HeroZoom (Framer code component)
   Home blocks 1 and 2 in one scroll stage, ported from site/ (concrete.js,
   zoom.js, sections/hero.css, sections/statement.css).

   - Live carved concrete in WebGL: drifting sunlight, cursor light, the
     carved seam with a tie hole at each end and ARCOVIA carved across the
     bottom (crisp at all times).
   - Chip, headline, lede and the one-button path picker (flat white menu).
   - Scrolling pins the stage: the hero text lifts away, a drill bores into
     the O of ARCOVIA, punches through to light and the view flies down the
     bore into the white statement, whose text writes itself in.
   - On the Framer canvas, with reduced motion or without WebGL, hero and
     statement simply stack.

   Generated from framer/src/HeroZoom.template.tsx by framer/build.py (the
   shader is copied from site/concrete.js). Edit the template, not the output.
   ========================================================================== */
import * as React from "react"
import { useEffect, useRef, useState } from "react"
import { addPropertyControls, ControlType, RenderTarget } from "framer"

const TEXTURE_URL = "__TEXTURE_URL__"
const FONT_CSS = "https://fonts.googleapis.com/css2?family=Montserrat:wght@400;500;600&display=swap"
const FONT = '"Montserrat", "Montserrat Placeholder", "Helvetica Neue", Arial, sans-serif'

/* ---------- WebGL concrete (from site/concrete.js) ---------- */

const VERT = "attribute vec2 aPos;\nvoid main(){ gl_Position = vec4(aPos, 0.0, 1.0); }"

const FRAG = [
__FRAG__
].join("\n")

const UNIFORMS = ["uRes", "uScale", "uTime", "uBand", "uMouse", "uMouseAmt", "uSun", "uCursor", "uTex", "uTexSize", "uHeight", "uHTexel", "uOrigin", "uShift", "uZoom", "uBurn", "uBurnP", "uBreak", "uBreakP", "uDrill", "uDrillP", "uDrillQ"]

class ConcreteSurface {
    host: any; canvas: any; opts: any; mouse: any; view: any; carves: any[]; visible = true; running = false
    t0 = performance.now(); last = 0; reduced: any; gl: any; prog: any; u: any = {}; heightCanvas: any; sharpCanvas: any
    heightTex: any; dpr = 1; w = 1; h = 1; heightDirty = true; needsFrame = true; hTexel = [1, 1]; ready = false
    paused = false; layoutQueued = false; loop: any; dead = false; still: boolean; cleanups: any[] = []

    constructor(host: HTMLElement, canvas: HTMLCanvasElement, opts: any) {
        this.host = host
        this.canvas = canvas
        this.opts = Object.assign({ texture: TEXTURE_URL, textureSize: 1024, period: 34, sun: 0.2, cursor: 0.22, staticBand: 0.6, burnWarmth: 1 }, opts || {})
        this.mouse = { x: -9999, y: -9999, tx: -9999, ty: -9999, amt: 0, tamt: 0 }
        this.view = { ox: 0, oy: 0, tx: 0, ty: 0, s: 1, burn: null, shatter: null, drill: null }
        this.carves = []
        this.reduced = window.matchMedia("(prefers-reduced-motion: reduce)")
        this.still = !!this.opts.still
    }

    init(): Promise<boolean> {
        const gl = this.canvas.getContext("webgl", { antialias: false, alpha: true, premultipliedAlpha: true, depth: false, stencil: false, powerPreference: "low-power", preserveDrawingBuffer: false })
        if (!gl) return Promise.resolve(false)
        this.gl = gl
        const prog = this.program(VERT, FRAG)
        if (!prog) return Promise.resolve(false)
        this.prog = prog
        gl.useProgram(prog)
        const buf = gl.createBuffer()
        gl.bindBuffer(gl.ARRAY_BUFFER, buf)
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW)
        const loc = gl.getAttribLocation(prog, "aPos")
        gl.enableVertexAttribArray(loc)
        gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0)
        UNIFORMS.forEach((n) => (this.u[n] = gl.getUniformLocation(prog, n)))

        this.heightCanvas = document.createElement("canvas")
        this.sharpCanvas = document.createElement("canvas")
        this.heightTex = gl.createTexture()
        gl.activeTexture(gl.TEXTURE1)
        gl.bindTexture(gl.TEXTURE_2D, this.heightTex)
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR)
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR)
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE)
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)

        return Promise.all([this.loadTexture(), fontsReady()])
            .then(() => {
                if (this.dead) return false
                this.layout()
                this.bind()
                this.ready = true
                this.host.classList.add("arc-hero--gl")
                this.kick()
                return true
            })
            .catch(() => false)
    }

    program(vs: string, fs: string) {
        const gl = this.gl
        const compile = (type: number, src: string) => {
            const s = gl.createShader(type)
            gl.shaderSource(s, src)
            gl.compileShader(s)
            if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) { console.warn(gl.getShaderInfoLog(s)); return null }
            return s
        }
        const v = compile(gl.VERTEX_SHADER, vs), f = compile(gl.FRAGMENT_SHADER, fs)
        if (!v || !f) return null
        const p = gl.createProgram()
        gl.attachShader(p, v)
        gl.attachShader(p, f)
        gl.linkProgram(p)
        if (!gl.getProgramParameter(p, gl.LINK_STATUS)) { console.warn(gl.getProgramInfoLog(p)); return null }
        return p
    }

    loadTexture() {
        const gl = this.gl
        return new Promise<void>((resolve, reject) => {
            const img = new Image()
            img.crossOrigin = "anonymous"
            img.onload = () => {
                if (this.dead) return resolve()
                const tex = gl.createTexture()
                gl.activeTexture(gl.TEXTURE0)
                gl.bindTexture(gl.TEXTURE_2D, tex)
                gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img)
                gl.generateMipmap(gl.TEXTURE_2D)
                gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR)
                gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR)
                gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT)
                gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT)
                resolve()
            }
            img.onerror = reject
            img.src = this.opts.texture
        })
    }

    /* The Framer canvas draws components scaled: positions are divided by this */
    scaleK() {
        const r = this.host.getBoundingClientRect()
        return this.host.offsetWidth ? r.width / this.host.offsetWidth : 1
    }

    layout() {
        const gl = this.gl
        const w = Math.max(1, this.host.offsetWidth), h = Math.max(1, this.host.offsetHeight)
        const coarse = window.matchMedia("(pointer: coarse)").matches
        let dpr = Math.min(window.devicePixelRatio || 1, 2)
        const maxPx = coarse ? 3.6e6 : 7.2e6
        if (w * h * dpr * dpr > maxPx) dpr = Math.sqrt(maxPx / (w * h))
        this.dpr = dpr
        this.w = w
        this.h = h
        this.canvas.width = Math.round(w * dpr)
        this.canvas.height = Math.round(h * dpr)
        gl.viewport(0, 0, this.canvas.width, this.canvas.height)
        this.carves = this.collect()
        this.heightDirty = true
        this.needsFrame = true
    }

    /* Read every [data-carve] element into drawing instructions, in slab coordinates */
    collect() {
        const origin = this.host.getBoundingClientRect()
        const k = this.scaleK()
        const order: any = { panel: 0, seam: 1, hole: 2, mark: 3, text: 4 }
        const out: any[] = []
        Array.prototype.slice
            .call(this.host.querySelectorAll("[data-carve]"))
            .sort((a: any, b: any) => order[a.getAttribute("data-carve")] - order[b.getAttribute("data-carve")])
            .forEach((el: any) => {
                const r = el.getBoundingClientRect()
                const x = (r.left - origin.left) / k, y = (r.top - origin.top) / k
                const kind = el.getAttribute("data-carve")
                if (kind === "text") out.push(textGlyphs(el, origin, k))
                else out.push({ kind, x, y, w: r.width / k, h: r.height / k })
            })
        return out
    }

    /* Height map for the current view: red = surface height, green = charcoal inlay */
    paintHeight() {
        const gl = this.gl, hc = this.heightCanvas, sc = this.sharpCanvas, d = this.dpr, v = this.view
        const W = this.canvas.width, H = this.canvas.height
        if (hc.width !== W || hc.height !== H) { hc.width = sc.width = W; hc.height = sc.height = H }
        const ctx = sc.getContext("2d")
        ctx.setTransform(1, 0, 0, 1, 0, 0)
        ctx.fillStyle = "rgb(255,0,0)"
        ctx.fillRect(0, 0, W, H)
        ctx.setTransform(d * v.s, 0, 0, d * v.s, d * (v.ox + v.tx - v.ox * v.s), d * (v.oy + v.ty - v.oy * v.s))
        const panels: any[] = []
        this.carves.forEach((c: any) => {
            if (c.kind === "panel") {
                panels.push(c)
                ctx.strokeStyle = "rgb(120,0,0)"
                ctx.lineWidth = 1.5
                ctx.strokeRect(c.x - 0.75, c.y - 0.75, c.w + 1.5, c.h + 1.5)
            } else if (c.kind === "seam") {
                // Formwork joint: a fine, shallow groove along the element's long side
                ctx.fillStyle = "rgb(70,0,0)"
                if (c.w >= c.h) ctx.fillRect(c.x, c.y + c.h / 2 - 0.6, c.w, 1.2)
                else ctx.fillRect(c.x + c.w / 2 - 0.6, c.y, 1.2, c.h)
            } else if (c.kind === "hole") {
                // Formwork tie hole: a small round recess
                ctx.fillStyle = "rgb(0,0,0)"
                ctx.beginPath()
                ctx.arc(c.x + c.w / 2, c.y + c.h / 2, c.w / 2, 0, Math.PI * 2)
                ctx.fill()
            } else if (c.kind === "text") {
                ctx.font = c.font
                ctx.fillStyle = "rgb(0,0,0)"
                ctx.textBaseline = "alphabetic"
                c.glyphs.forEach((g: any) => ctx.fillText(g.ch, g.x, g.y))
            }
        })
        // Soften every edge into a sloped wall (the bevel). The wall widens a little as you zoom in.
        const hctx = hc.getContext("2d")
        const blur = 0.9 * d * Math.min(v.s, 2.2)
        hctx.setTransform(1, 0, 0, 1, 0, 0)
        if (typeof hctx.filter === "string") {
            hctx.filter = "blur(" + blur.toFixed(2) + "px)"
            hctx.drawImage(sc, 0, 0)
            hctx.filter = "none"
        } else {
            hctx.globalAlpha = 1 / 9
            for (let dx = -1; dx <= 1; dx++) for (let dy = -1; dy <= 1; dy++) hctx.drawImage(sc, dx * blur, dy * blur)
            hctx.globalAlpha = 1
        }
        if (panels.length) {
            hctx.save()
            hctx.globalCompositeOperation = "lighter"
            hctx.fillStyle = "rgb(0,255,0)"
            hctx.setTransform(d * v.s, 0, 0, d * v.s, d * (v.ox + v.tx - v.ox * v.s), d * (v.oy + v.ty - v.oy * v.s))
            panels.forEach((c) => hctx.fillRect(c.x, c.y, c.w, c.h))
            hctx.restore()
        }
        gl.activeTexture(gl.TEXTURE1)
        gl.bindTexture(gl.TEXTURE_2D, this.heightTex)
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, hc)
        this.hTexel = [1 / W, 1 / H]
        this.heightDirty = false
    }

    /* Zoom the slab and drill or break through it (see site/concrete.js for the fields) */
    setView(view: any) {
        this.view = view
        this.heightDirty = true
        this.needsFrame = true
        if (this.ready && !document.hidden) {
            this.render((performance.now() - this.t0) / 1000, !this.running)
            this.last = performance.now()
        }
    }

    bind() {
        const ro = new ResizeObserver(() => this.queueLayout())
        ro.observe(this.host)
        this.host.querySelectorAll("[data-carve]").forEach((el: any) => ro.observe(el))
        const io = new IntersectionObserver((entries) => { this.visible = entries[0].isIntersecting; this.kick() }, { rootMargin: "100px" })
        io.observe(this.host)
        const onVis = () => this.kick()
        document.addEventListener("visibilitychange", onVis)
        const onMove = (e: PointerEvent) => {
            if (e.pointerType !== "mouse") return
            const r = this.host.getBoundingClientRect(), k = this.scaleK()
            this.mouse.tx = (e.clientX - r.left) / k
            this.mouse.ty = (e.clientY - r.top) / k
            if (this.mouse.amt < 0.01) { this.mouse.x = this.mouse.tx; this.mouse.y = this.mouse.ty }
            this.mouse.tamt = 1
            this.kick()
        }
        const onLeave = () => { this.mouse.tamt = 0 }
        this.host.addEventListener("pointermove", onMove)
        this.host.addEventListener("pointerleave", onLeave)
        this.cleanups.push(() => {
            ro.disconnect()
            io.disconnect()
            document.removeEventListener("visibilitychange", onVis)
            this.host.removeEventListener("pointermove", onMove)
            this.host.removeEventListener("pointerleave", onLeave)
        })
    }

    queueLayout() {
        if (this.layoutQueued) return
        this.layoutQueued = true
        requestAnimationFrame(() => {
            this.layoutQueued = false
            if (this.dead) return
            this.layout()
            this.kick()
        })
    }

    setPaused(paused: boolean) {
        paused = !!paused
        if (this.paused === paused) return
        this.paused = paused
        if (this.ready) this.kick()
    }

    animates() {
        return this.visible && !this.paused && !document.hidden && !this.reduced.matches && !this.still
    }

    kick() {
        if (!this.ready || this.dead) return
        if (this.animates() && !this.running) {
            this.running = true
            this.loop = this.loop || this.frame.bind(this)
            requestAnimationFrame(this.loop)
        } else if (!this.animates() && this.needsFrame && this.visible) {
            this.render(this.reduced.matches || this.still ? 0 : (performance.now() - this.t0) / 1000, true)
        }
    }

    frame(now: number) {
        if (this.dead || !this.animates()) { this.running = false; return }
        const dt = Math.min(0.1, (now - (this.last || now)) / 1000)
        const m = this.mouse
        const ease = 1 - Math.exp(-dt * 7)
        m.x += (m.tx - m.x) * ease
        m.y += (m.ty - m.y) * ease
        m.amt += (m.tamt - m.amt) * (1 - Math.exp(-dt * 3))
        // The sun moves slowly; without the cursor, 30 fps is plenty
        const idle = m.amt < 0.01 && m.tamt === 0
        if (!idle || now - this.last > 32 || this.needsFrame) {
            this.render((now - this.t0) / 1000, false)
            this.last = now
        }
        requestAnimationFrame(this.loop)
    }

    render(t: number, still: boolean) {
        const gl = this.gl, u = this.u, o = this.opts, v = this.view
        if (this.heightDirty) this.paintHeight()
        const band = still && (this.reduced.matches || this.still) ? o.staticBand : 0.55 + 0.45 * Math.sin((t / o.period) * Math.PI * 2 + 0.2)
        gl.uniform2f(u.uRes, this.canvas.width, this.canvas.height)
        gl.uniform1f(u.uScale, this.dpr)
        gl.uniform1f(u.uTime, t)
        gl.uniform1f(u.uBand, band)
        gl.uniform2f(u.uMouse, this.mouse.x, this.mouse.y)
        gl.uniform1f(u.uMouseAmt, this.mouse.amt)
        gl.uniform1f(u.uSun, o.sun)
        gl.uniform1f(u.uCursor, o.cursor)
        gl.uniform1i(u.uTex, 0)
        gl.uniform1f(u.uTexSize, o.textureSize)
        gl.uniform1i(u.uHeight, 1)
        gl.uniform2f(u.uHTexel, this.hTexel[0], this.hTexel[1])
        gl.uniform2f(u.uOrigin, v.ox, v.oy)
        gl.uniform2f(u.uShift, v.ox + v.tx, v.oy + v.ty)
        gl.uniform1f(u.uZoom, v.s)
        const b = v.burn
        gl.uniform4f(u.uBurn, b ? b.cx : 0, b ? b.cy : 0, b ? b.rx : 0, b ? b.ry : 0)
        gl.uniform3f(u.uBurnP, b ? b.r : 0, b ? b.heat : 0, o.burnWarmth)
        const k = v.shatter
        gl.uniform4f(u.uBreak, k ? k.cx : 0, k ? k.cy : 0, k ? k.rx : 0, k ? k.ry : 0)
        gl.uniform3f(u.uBreakP, k ? k.crack : 0, k ? k.brk : 0, k ? k.light : 0)
        const dr = v.drill
        gl.uniform4f(u.uDrill, dr ? dr.cx : 0, dr ? dr.cy : 0, dr ? dr.rx : 0, dr ? dr.ry : 0)
        gl.uniform4f(u.uDrillP, dr ? dr.cam : 1, dr ? dr.depth : 0, dr ? dr.light : 0, dr ? dr.dust : 0)
        gl.uniform4f(u.uDrillQ, dr ? dr.k : 1, dr ? dr.r : 1, dr ? dr.spin : 0, dr ? dr.thick : 2)
        gl.drawArrays(gl.TRIANGLES, 0, 3)
        this.needsFrame = false
    }

    destroy() {
        this.dead = true
        this.running = false
        this.cleanups.forEach((f) => f())
        this.cleanups = []
        try { const ext = this.gl && this.gl.getExtension("WEBGL_lose_context"); if (ext) ext.loseContext() } catch (e) {}
        this.host.classList.remove("arc-hero--gl")
    }
}

function fontsReady(): Promise<any> {
    const d: any = document
    if (!d.fonts || !d.fonts.load) return Promise.resolve()
    return Promise.all([d.fonts.load('500 100px "Montserrat"'), d.fonts.load('400 40px "Montserrat"')]).then(() => d.fonts.ready).catch(() => undefined)
}

// Where the browser laid out each glyph of an element's text, so the carving matches it exactly
function textGlyphs(el: any, origin: any, k: number) {
    const out: any = { kind: "text", font: "", glyphs: [] }
    const node = el.firstChild
    if (!node || node.nodeType !== 3) return out
    const cs = getComputedStyle(el)
    const size = parseFloat(cs.fontSize)
    out.font = cs.fontWeight + " " + size + "px " + cs.fontFamily
    const ctx: any = document.createElement("canvas").getContext("2d")
    ctx.font = out.font
    const m = ctx.measureText(node.data)
    const asc = m.fontBoundingBoxAscent || size * 0.968
    const desc = m.fontBoundingBoxDescent || size * 0.251
    const range = document.createRange()
    for (let i = 0; i < node.data.length; i++) {
        range.setStart(node, i)
        range.setEnd(node, i + 1)
        const r = range.getBoundingClientRect()
        // A glyph's client rect is the font's content area, so the baseline sits one ascent down
        out.glyphs.push({ ch: node.data[i], x: (r.left - origin.left) / k, y: (r.top - origin.top) / k + (r.height / k - (asc + desc)) / 2 + asc })
    }
    return out
}

/* ---------- Zoom-through (from site/zoom.js) ---------- */

function clamp(x: number, a: number, b: number) { return x < a ? a : x > b ? b : x }
function smooth(a: number, b: number, x: number) { const t = clamp((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t) }
function ramp(a: number, b: number, x: number) { return clamp((x - a) / (b - a), 0, 1) }

/* Chips and dust thrown out by the drill. Every particle's state comes from the scroll
   position alone, so scrolling back up pulls the chips back in. */
function makeParticles() {
    let seed = 7
    const rnd = () => { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646 }
    const chip = (launch: number, burst: boolean) => {
        const verts: number[] = [], n = 5 + Math.floor(rnd() * 4)
        for (let i = 0; i < n; i++) verts.push(0.35 + rnd() * 0.65)
        return {
            kind: "chip", launch, life: 0.045 + rnd() * 0.04,
            ang: rnd() * Math.PI * 2, from: burst ? rnd() * 0.4 : 0.55 + rnd() * 0.45,
            speed: burst ? 1.4 + rnd() * 1.4 : 0.6 + rnd() * 1.0, fall: 0.4 + rnd() * 0.9,
            size: burst ? 2.5 + rnd() * 5 : 1.2 + rnd() * 3, grow: burst ? 3.5 : 1.6,
            rot: rnd() * 6.28, spin: (rnd() - 0.5) * 14, verts, tone: Math.round(140 + rnd() * 70),
        }
    }
    const out: any[] = []
    let i
    for (i = 0; i < 80; i++) out.push(chip(0.05 + rnd() * 0.24, false))
    for (i = 0; i < 34; i++) out.push(chip(0.28 + rnd() * 0.06, true))
    for (i = 0; i < 110; i++) out.push({ kind: "dust", launch: 0.04 + rnd() * 0.3, life: 0.08 + rnd() * 0.08, ang: rnd() * Math.PI * 2, from: 0.6 + rnd() * 0.5, speed: 0.3 + rnd() * 0.7, fall: -0.1 + rnd() * 0.3, size: 0.7 + rnd() * 1.3, tone: Math.round(200 + rnd() * 40) })
    for (i = 0; i < 10; i++) out.push({ kind: "puff", launch: 0.04 + rnd() * 0.26, life: 0.1 + rnd() * 0.06, ang: rnd() * Math.PI * 2, from: 0.9 + rnd() * 0.3, speed: 0.2 + rnd() * 0.3, fall: -0.15, size: 40 + rnd() * 50 })
    return out
}

function drawDebris(debris: HTMLCanvasElement, dctx: any, particles: any[], geo: any, p: number, vw: number, vh: number, ox: number, oy: number, s: number, boreR: number) {
    const dpr = Math.min(window.devicePixelRatio || 1, 2)
    if (debris.width !== Math.round(vw * dpr) || debris.height !== Math.round(vh * dpr)) {
        debris.width = Math.round(vw * dpr)
        debris.height = Math.round(vh * dpr)
    }
    dctx.setTransform(1, 0, 0, 1, 0, 0)
    dctx.clearRect(0, 0, debris.width, debris.height)
    if (p < 0.04 || p > 0.52) return
    dctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    const rim = boreR * Math.min(geo.rx, geo.ry) * Math.min(s, 40)
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
            const path = (ox2: number, oy2: number, k: number) => {
                dctx.beginPath()
                q.verts.forEach((v: number, i: number) => {
                    const a = rot + (i / q.verts.length) * Math.PI * 2
                    const px = x + ox2 + Math.cos(a) * size * v * k, py = y + oy2 + Math.sin(a) * size * v * k
                    if (i === 0) dctx.moveTo(px, py)
                    else dctx.lineTo(px, py)
                })
                dctx.closePath()
            }
            const base = dctx.globalAlpha
            dctx.globalAlpha = base * 0.22
            dctx.fillStyle = "rgb(120,120,118)"
            path(-Math.cos(q.ang) * size * 1.4, -Math.sin(q.ang) * size * 1.4, 0.8)
            dctx.fill()
            dctx.globalAlpha = base
            dctx.fillStyle = "rgb(" + (q.tone - 55) + "," + (q.tone - 55) + "," + (q.tone - 57) + ")"
            path(size * 0.18, size * 0.22, 1)
            dctx.fill()
            dctx.fillStyle = "rgb(" + q.tone + "," + q.tone + "," + (q.tone - 2) + ")"
            path(0, 0, 0.9)
            dctx.fill()
        }
    })
    dctx.globalAlpha = 1
}

/* The counter (the inside) of the O of the carved wordmark, in hero coordinates */
function measureO(mark: HTMLElement, hero: HTMLElement) {
    const text: any = mark.firstChild
    const i = text && text.nodeType === 3 ? text.data.indexOf("O") : -1
    if (i < 0) return null
    const cs = getComputedStyle(mark)
    const size = parseFloat(cs.fontSize)
    const base = 200
    const c = document.createElement("canvas")
    let ctx: any = c.getContext("2d")
    const font = cs.fontWeight + " " + base + "px " + cs.fontFamily
    ctx.font = font
    const m = ctx.measureText("O")
    const pad = 20
    c.width = Math.ceil(m.actualBoundingBoxLeft + m.actualBoundingBoxRight) + pad * 2
    c.height = Math.ceil(m.actualBoundingBoxAscent + m.actualBoundingBoxDescent) + pad * 2
    ctx = c.getContext("2d")
    ctx.font = font
    const x0 = pad + m.actualBoundingBoxLeft
    const y0 = pad + m.actualBoundingBoxAscent
    ctx.fillText("O", x0, y0)
    const data = ctx.getImageData(0, 0, c.width, c.height).data
    const a = (x: number, y: number) => data[(y * c.width + x) * 4 + 3]
    const gx = Math.round(x0 + (m.actualBoundingBoxRight - m.actualBoundingBoxLeft) / 2)
    const gy = Math.round(y0 - (m.actualBoundingBoxAscent - m.actualBoundingBoxDescent) / 2)
    let x, y
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
    const h = hero.getBoundingClientRect()
    const asc = (m.fontBoundingBoxAscent || base * 0.968) * k
    const desc = (m.fontBoundingBoxDescent || base * 0.251) * k
    const baseline = r.top - h.top + (r.height - (asc + desc)) / 2 + asc
    return { cx: r.left - h.left + ((inL + inR) / 2 - x0) * k, cy: baseline + ((inT + inB) / 2 - y0) * k, rx: ((inR - inL) / 2) * k, ry: ((inB - inT) / 2) * k }
}

/* ---------- Component ---------- */

/**
 * @framerSupportedLayoutWidth fixed
 * @framerSupportedLayoutHeight auto
 * @framerIntrinsicWidth 1440
 * @framerIntrinsicHeight 1800
 * @framerDisableUnlink
 */
export default function HeroZoom(props: any) {
    const {
        chip, titleLine1, titleLine2, lede, buttonLabel, pickerTitle, showIcons,
        path1Title, path1Text, path1Link, path2Title, path2Text, path2Link, path3Title, path3Text, path3Link,
        wordmark, statementStart, statementPale, statementEnd, effect, travel, headerOffset, texture, sun, cursorLight, style,
    } = props

    const isCanvas = RenderTarget.current() === RenderTarget.canvas
    const zoomRef = useRef<HTMLDivElement>(null)
    const heroRef = useRef<HTMLElement>(null)
    const canvasRef = useRef<HTMLCanvasElement>(null)
    const debrisRef = useRef<HTMLCanvasElement>(null)
    const markRef = useRef<HTMLSpanElement>(null)
    const statementRef = useRef<HTMLElement>(null)
    const innerRef = useRef<HTMLDivElement>(null)
    const revealRef = useRef<HTMLParagraphElement>(null)
    const pickerRef = useRef<HTMLDivElement>(null)
    const surfaceRef = useRef<any>(null)
    const [open, setOpen] = useState(false)
    const [zoomOn, setZoomOn] = useState(false)

    // Montserrat stands in for Gotham
    useEffect(() => {
        if (document.querySelector('link[data-arc-font]')) return
        const l = document.createElement("link")
        l.rel = "stylesheet"
        l.href = FONT_CSS
        l.setAttribute("data-arc-font", "")
        document.head.appendChild(l)
    }, [])

    // Zoom only on the live site, and never with reduced motion
    useEffect(() => {
        if (isCanvas) return
        const mq = window.matchMedia("(prefers-reduced-motion: reduce)")
        const set = () => setZoomOn(!mq.matches)
        set()
        mq.addEventListener ? mq.addEventListener("change", set) : mq.addListener(set)
        return () => { mq.removeEventListener ? mq.removeEventListener("change", set) : mq.removeListener(set) }
    }, [isCanvas])

    // Fit the carved ARCOVIA to the container width
    useEffect(() => {
        const hero = heroRef.current, mark = markRef.current
        if (!hero || !mark) return
        const wrap = mark.parentElement as HTMLElement
        const fit = () => {
            const cs = getComputedStyle(wrap)
            const target = wrap.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight)
            mark.style.fontSize = "100px"
            const w = mark.offsetWidth - 0.035 * 100
            const size = Math.floor(((100 * target) / w) * 100) / 100
            mark.style.fontSize = ""
            hero.style.setProperty("--wordmark-size", size + "px")
            hero.style.setProperty("--wordmark-visible", Math.round(size * 0.6) + "px")
        }
        fit()
        fontsReady().then(fit)
        const ro = new ResizeObserver(() => requestAnimationFrame(fit))
        ro.observe(wrap)
        return () => ro.disconnect()
    }, [wordmark])

    // Live concrete
    useEffect(() => {
        const hero = heroRef.current, canvas = canvasRef.current
        if (!hero || !canvas) return
        const sfc = new ConcreteSurface(hero, canvas, { texture: (texture && texture.src) || TEXTURE_URL, sun, cursor: cursorLight, still: isCanvas })
        surfaceRef.current = sfc
        sfc.init()
        return () => { sfc.destroy(); surfaceRef.current = null }
    }, [texture && texture.src, sun, cursorLight, isCanvas, wordmark, titleLine1, titleLine2])

    // The zoom-through, computed from the scroll position alone (so it reverses)
    useEffect(() => {
        const zoom = zoomRef.current, hero = heroRef.current, statement = statementRef.current, mark = markRef.current
        const inner = innerRef.current, reveal = revealRef.current, debris = debrisRef.current
        if (!zoomOn || !zoom || !hero || !statement || !mark) return
        const fades = Array.prototype.slice.call(hero.querySelectorAll("[data-zoom-fade]"))
        const chars = Array.prototype.slice.call(reveal ? reveal.querySelectorAll(".arc-c") : []).map((el: any) => ({ el, q: -1 }))
        const dctx: any = debris && debris.getContext ? debris.getContext("2d") : null
        const particles = makeParticles()
        const DRILL_K = 1.2
        const FRONT = 28, STEPS = 24
        let geo: any = null, lastP = -1, lastSurface: any = null, queued = false, raf = 0

        const paintChar = (c: any, v: number) => {
            const q = v <= 0 ? 0 : v >= 1 ? STEPS : Math.min(STEPS - 1, Math.max(1, Math.round(v * STEPS)))
            if (q === c.q) return
            c.q = q
            c.el.style.opacity = q === STEPS ? "1" : Math.pow(q / STEPS, 1.4).toFixed(3)
        }
        const surface = () => { const s = surfaceRef.current; return s && s.ready ? s : null }

        const update = () => {
            queued = false
            const vw = hero.clientWidth, vh = hero.clientHeight
            const rect = zoom.getBoundingClientRect()
            const span = rect.height - window.innerHeight
            const p = span > 0 ? clamp(-rect.top / span, 0, 1) : 0
            const sfc = surface()
            if (p === lastP && sfc === lastSurface) return
            lastP = p
            lastSurface = sfc
            if (!geo) geo = measureO(mark, hero)
            if (!geo) return

            // 1. Hero text lifts away, while the wordmark already starts to grow
            const f = smooth(0, 0.12, p)
            fades.forEach((el: any) => {
                el.style.opacity = f ? String(1 - f) : ""
                el.style.transform = f ? "translateY(" + (-28 * f).toFixed(1) + "px)" : ""
                el.style.pointerEvents = f > 0.5 ? "none" : ""
            })
            if (f > 0.5) setOpen(false)

            const t = smooth(0, 0.42, p)
            const tx = (vw / 2 - geo.cx) * t, ty = (vh / 2 - geo.cy) * t
            const z = ramp(0, 0.6, p)
            const through = z >= 1
            hero.classList.toggle("arc-hero--zooming", p > 0)
            hero.style.visibility = through ? "hidden" : ""
            const view: any = { ox: geo.cx, oy: geo.cy, tx, ty, s: 1 }
            let debrisArgs: any = null

            if (effect === "break") {
                // The O cracks, light leaks through, and the concrete breaks away, centre first
                const BREAK_END = 5.2, HOLE_MIN = 1.9
                const crack = Math.pow(ramp(0.02, 0.36, p), 0.85) * 3.2
                const brk = Math.pow(ramp(0.12, 0.54, p), 1.15) * BREAK_END
                const halfDiag = Math.sqrt(vw * vw + vh * vh) / 2
                const scaleEnd = (halfDiag * 1.08) / (HOLE_MIN * Math.min(geo.rx, geo.ry))
                view.s = Math.pow(scaleEnd, Math.pow(z, 1.6))
                view.shatter = crack > 0 ? { cx: geo.cx, cy: geo.cy, rx: geo.rx, ry: geo.ry, crack, brk, light: smooth(0.08, 0.2, p) } : null
            } else {
                // A drill bores into the O, punches through, and the camera flies down the bore
                const cam = 1 - (1 + DRILL_K) * Math.pow(z, 1.6)
                const depth = DRILL_K * smooth(0.03, 0.3, p)
                const boreR = 0.97 * (0.1 + 0.9 * smooth(0.035, 0.24, p))
                view.s = cam > 0.02 ? 1 / cam : 50
                view.drill = depth > 0 ? { cx: geo.cx, cy: geo.cy, rx: geo.rx, ry: geo.ry, cam, depth, light: smooth(0.28, 0.4, p), dust: smooth(0.03, 0.08, p) * (1 - smooth(0.36, 0.5, p)), k: DRILL_K, r: boreR, spin: p * 60, thick: 2.2 } : null
                debrisArgs = [p, vw, vh, geo.cx + tx, geo.cy + ty, view.s, boreR]
            }

            if (sfc) {
                sfc.setPaused(through)
                if (!through) sfc.setView(view)
                if (debrisArgs && dctx && debris) {
                    try { drawDebris(debris, dctx, particles, geo, debrisArgs[0], debrisArgs[1], debrisArgs[2], debrisArgs[3], debrisArgs[4], debrisArgs[5], debrisArgs[6]) } catch (e) {}
                }
            } else {
                // No WebGL: nothing to drill through, so the hero simply fades away
                hero.style.opacity = String(1 - smooth(0.1, 0.45, p))
            }

            // The statement rises from below into place after half the zoom
            const rise = smooth(0.3, 0.58, p)
            if (inner) {
                inner.style.transform = rise < 1 ? "translate3d(0," + ((1 - rise) * 42).toFixed(2) + "vh,0) scale(" + (0.94 + 0.06 * rise).toFixed(4) + ")" : ""
                inner.style.opacity = rise < 1 ? (0.25 + 0.75 * rise).toFixed(3) : ""
            }
            // Its text writes itself in, letter by letter
            const front = ramp(0.36, 0.96, p) * (chars.length + FRONT)
            chars.forEach((c: any, i: number) => paintChar(c, (front - i) / FRONT))
        }
        const queue = () => { if (queued) return; queued = true; raf = requestAnimationFrame(update) }
        const onResize = () => { geo = null; lastP = -1; queue() }
        window.addEventListener("scroll", queue, { passive: true })
        window.addEventListener("resize", onResize)
        fontsReady().then(onResize)
        const wait = setInterval(() => { if (surface()) { clearInterval(wait); lastP = -1; queue() } }, 100)
        const stopWait = setTimeout(() => clearInterval(wait), 15000)
        queue()
        return () => {
            window.removeEventListener("scroll", queue)
            window.removeEventListener("resize", onResize)
            cancelAnimationFrame(raf)
            clearInterval(wait)
            clearTimeout(stopWait)
            hero.classList.remove("arc-hero--zooming")
            hero.style.opacity = ""
            hero.style.visibility = ""
            fades.forEach((el: any) => { el.style.opacity = ""; el.style.transform = ""; el.style.pointerEvents = "" })
            if (inner) { inner.style.transform = ""; inner.style.opacity = "" }
            chars.forEach((c: any) => (c.el.style.opacity = ""))
            if (dctx && debris) dctx.clearRect(0, 0, debris.width, debris.height)
            const s = surfaceRef.current
            if (s && s.ready) { s.setPaused(false); s.setView({ ox: 0, oy: 0, tx: 0, ty: 0, s: 1, burn: null, shatter: null, drill: null }) }
        }
    }, [zoomOn, effect, statementStart, statementPale, statementEnd])

    // Path picker: close on outside click and Escape; arrows move between paths
    useEffect(() => {
        const picker = pickerRef.current
        if (!picker) return
        const down = (e: any) => { if (!picker.contains(e.target)) setOpen(false) }
        document.addEventListener("pointerdown", down)
        return () => document.removeEventListener("pointerdown", down)
    }, [])
    const onPickerKey = (e: any) => {
        const picker = pickerRef.current
        if (!picker) return
        if (e.key === "Escape" && open) { setOpen(false); (picker.querySelector(".arc-picker__trigger") as any)?.focus() }
        if ((e.key === "ArrowDown" || e.key === "ArrowUp") && open) {
            e.preventDefault()
            const list = Array.prototype.slice.call(picker.querySelectorAll(".arc-picker__option"))
            const i = list.indexOf(document.activeElement)
            const next = e.key === "ArrowDown" ? (i + 1) % list.length : (i - 1 + list.length) % list.length
            list[next].focus()
        }
    }
    const onTrigger = (e: any) => {
        const willOpen = !open
        setOpen(willOpen)
        // Keyboard and screen-reader users land on the first path; mouse users stay on the button
        if (willOpen && e.detail === 0) setTimeout(() => (pickerRef.current?.querySelector(".arc-picker__option") as any)?.focus(), 0)
    }
    const onPickerBlur = (e: any) => { if (e.relatedTarget && pickerRef.current && !pickerRef.current.contains(e.relatedTarget)) setOpen(false) }

    const paths = [
        { title: path1Title, text: path1Text, link: path1Link, icon: ICONS.raise },
        { title: path2Title, text: path2Text, link: path2Link, icon: ICONS.invest },
        { title: path3Title, text: path3Text, link: path3Link, icon: ICONS.institution },
    ]

    const rootClass = ["arc-root", zoomOn ? "arc-zoom--on" : "", isCanvas ? "arc-is-canvas" : ""].join(" ")

    return (
        <div ref={zoomRef} className={rootClass} style={{ ...style, ["--zoom-travel" as any]: (travel || 280) + "vh", ["--header-h" as any]: (headerOffset || 0) + "px", fontFamily: FONT }}>
            <style>{CSS}</style>
            <div className="arc-zoom__stage">
                <section ref={heroRef as any} className="arc-hero" aria-labelledby="arc-hero-title">
                    <canvas ref={canvasRef} className="arc-hero__canvas" aria-hidden="true" />
                    <canvas ref={debrisRef} className="arc-hero__debris" aria-hidden="true" />
                    <div className="arc-hero__inner arc-container">
                        <div className="arc-hero__content">
                            <div className="arc-hero__heading arc-rise" data-zoom-fade style={{ ["--rise" as any]: 0 }}>
                                <p className="arc-chip">{chip}</p>
                                <h1 className="arc-hero__title" id="arc-hero-title">
                                    {titleLine1}
                                    <br /> {titleLine2}
                                </h1>
                            </div>
                            <div className="arc-hero__aside arc-rise" data-zoom-fade style={{ ["--rise" as any]: 1 }}>
                                <p className="arc-hero__lede">{noWrapMoney(lede)}</p>
                                <div ref={pickerRef} className={"arc-picker" + (open ? " is-open" : "") + (showIcons ? "" : " arc-picker--no-icons")} onKeyDown={onPickerKey} onBlur={onPickerBlur}>
                                    <div className="arc-picker__panel" id="arc-path-options" role="group" aria-labelledby="arc-path-title" aria-hidden={!open}>
                                        <p className="arc-picker__title" id="arc-path-title">{pickerTitle}</p>
                                        {paths.map((pth, i) => (
                                            <a key={i} className="arc-picker__option" href={pth.link || "#"} tabIndex={open ? 0 : -1}>
                                                <span className="arc-picker__icon" aria-hidden="true">{pth.icon}</span>
                                                <span className="arc-picker__label">{pth.title}</span>
                                                <span className="arc-picker__meta">{noWrapMoney(pth.text)}</span>
                                                <svg className="arc-picker__arrow" viewBox="0 0 16 16" aria-hidden="true"><path d="M6 3.5 10.5 8 6 12.5" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
                                            </a>
                                        ))}
                                    </div>
                                    <button className="arc-btn arc-btn--primary arc-picker__trigger" type="button" aria-expanded={open} aria-controls="arc-path-options" onClick={onTrigger}>
                                        {buttonLabel}
                                        {/* Up-down chevrons: "pick one of several". When open, each turns over and they meet as a small × */}
                                        <svg className="arc-picker__chevrons" viewBox="0 0 16 16" aria-hidden="true">
                                            <path className="arc-picker__chev arc-picker__chev--up" d="M5 6.25 8 3.25l3 3" />
                                            <path className="arc-picker__chev arc-picker__chev--down" d="M5 9.75l3 3 3-3" />
                                        </svg>
                                    </button>
                                </div>
                            </div>
                        </div>
                        <div className="arc-seam arc-hero__seam" data-carve="seam" aria-hidden="true">
                            <span className="arc-seam__hole arc-seam__hole--start" data-carve="hole" />
                            <span className="arc-seam__hole arc-seam__hole--end" data-carve="hole" />
                        </div>
                    </div>
                    <div className="arc-hero__wordmark-wrap arc-container" aria-hidden="true">
                        <span ref={markRef} className="arc-hero__wordmark" data-carve="text">{wordmark}</span>
                    </div>
                </section>

                <section ref={statementRef as any} className="arc-statement" aria-label="Statement">
                    <div ref={innerRef} className="arc-statement__inner">
                        <p ref={revealRef} className={"arc-statement__text" + (zoomOn ? " is-split" : "")}>
                            {splitWords(statementStart, false)} <span className="arc-statement__pale">{splitWords(statementPale, true)}</span> {splitWords(statementEnd, false)}
                        </p>
                    </div>
                </section>
            </div>
        </div>
    )
}

/* Letters in spans (inside a span per word, so words never break) for the write-in */
function splitWords(text: string, pale: boolean) {
    const parts = String(text || "").split(/(\s+)/)
    return parts.map((part, i) => {
        if (!part) return null
        if (/^\s+$/.test(part)) return part
        return (
            <span key={i} className="arc-w">
                {Array.prototype.map.call(part, (ch: string, j: number) => (
                    <span key={j} className="arc-c">{ch}</span>
                ))}
            </span>
        )
    })
}

/* Keep amounts like "$5M–$500M+" on one line */
function noWrapMoney(text: string) {
    const parts = String(text || "").split(/(\$\S*[0-9]\S*?)(?=[.,;:]?(?:\s|$))/)
    return parts.map((part, i) => (i % 2 ? <span key={i} style={{ whiteSpace: "nowrap" }}>{part}</span> : part))
}

/* The user's duotone path icons (site/assets/icons/), recoloured with currentColor */
const ICONS = {
    raise: (
        <svg viewBox="0 0 24 24">
            <path opacity="0.2" d="M12 22C7.28595 22 4.92893 22 3.46447 20.5355C2 19.0711 2 16.714 2 12C2 7.28595 2 4.92893 3.46447 3.46447C4.92893 2 7.28595 2 12 2C16.714 2 19.0711 2 20.5355 3.46447C22 4.92893 22 7.28595 22 12C22 16.714 22 19.0711 20.5355 20.5355C19.0711 22 16.714 22 12 22Z" fill="currentColor" />
            <path d="M7 14.25C7.41421 14.25 7.75 14.5858 7.75 15V18C7.75 18.4142 7.41421 18.75 7 18.75C6.58579 18.75 6.25 18.4142 6.25 18V15C6.25 14.5858 6.58579 14.25 7 14.25Z" fill="currentColor" />
            <path d="M12 11.25C12.4142 11.25 12.75 11.5858 12.75 12V18C12.75 18.4142 12.4142 18.75 12 18.75C11.5858 18.75 11.25 18.4142 11.25 18V12C11.25 11.5858 11.5858 11.25 12 11.25Z" fill="currentColor" />
            <path d="M17 8.25C17.4142 8.25 17.75 8.58579 17.75 9V18C17.75 18.4142 17.4142 18.75 17 18.75C16.5858 18.75 16.25 18.4142 16.25 18V9C16.25 8.58579 16.5858 8.25 17 8.25Z" fill="currentColor" />
        </svg>
    ),
    invest: (
        <svg viewBox="0 0 24 24">
            <path opacity="0.2" d="M6.25993 21.3884H6C5.05719 21.3884 4.58579 21.3884 4.29289 21.0955C4 20.8026 4 20.3312 4 19.3884V18.2764C4 17.7579 4 17.4987 4.13318 17.2672C4.26636 17.0356 4.46727 16.9188 4.8691 16.6851C7.51457 15.1464 11.2715 14.2803 13.7791 15.7759C13.9475 15.8764 14.0991 15.9977 14.2285 16.1431C14.7866 16.77 14.746 17.7161 14.1028 18.2775C13.9669 18.396 13.8222 18.486 13.6764 18.5172C13.7962 18.5033 13.911 18.4874 14.0206 18.4699C14.932 18.3245 15.697 17.8375 16.3974 17.3084L18.2046 15.9433C18.8417 15.462 19.7873 15.4619 20.4245 15.943C20.9982 16.3762 21.1736 17.0894 20.8109 17.6707C20.388 18.3487 19.7921 19.216 19.2199 19.7459C18.6469 20.2766 17.7939 20.7504 17.0975 21.0865C16.326 21.4589 15.4738 21.6734 14.6069 21.8138C12.8488 22.0983 11.0166 22.0549 9.27633 21.6964C8.29253 21.4937 7.27079 21.3884 6.25993 21.3884Z" fill="currentColor" />
            <path d="M6.58579 2.58579C6.21901 2.95256 6.08188 3.4593 6.03061 4.2498C7.24895 4.23355 8.23355 3.24896 8.2498 2.03061C7.4593 2.08188 6.95256 2.21901 6.58579 2.58579Z" fill="currentColor" />
            <path d="M17.4142 2.58579C17.0474 2.21901 16.5407 2.08188 15.7502 2.03061C15.7664 3.24895 16.751 4.23355 17.9694 4.2498C17.9181 3.4593 17.781 2.95256 17.4142 2.58579Z" fill="currentColor" />
            <path d="M17.4142 9.41421C17.0474 9.78099 16.5407 9.91812 15.7502 9.96939C15.7665 8.75104 16.751 7.76645 17.9694 7.7502C17.9181 8.5407 17.781 9.04744 17.4142 9.41421Z" fill="currentColor" />
            <path d="M6.58579 9.41421C6.95256 9.78099 7.4593 9.91812 8.2498 9.96939C8.23355 8.75105 7.24895 7.76645 6.03061 7.7502C6.08188 8.5407 6.21901 9.04744 6.58579 9.41421Z" fill="currentColor" />
            <path d="M6 5.75C8.07107 5.75 9.75 4.07107 9.75 2H14.25C14.25 4.07107 15.9289 5.75 18 5.75V6.25C15.9289 6.25 14.25 7.92893 14.25 10H9.75C9.75 7.92893 8.07107 6.25 6 6.25V5.75ZM12 7C12.5523 7 13 6.55228 13 6C13 5.44772 12.5523 5 12 5C11.4477 5 11 5.44772 11 6C11 6.55228 11.4477 7 12 7Z" fillRule="evenodd" clipRule="evenodd" fill="currentColor" />
        </svg>
    ),
    institution: (
        <svg viewBox="0 0 24 24">
            <path d="M12.75 8.83697V9.87803C13.6239 10.1869 14.25 11.0203 14.25 12C14.25 12.0492 14.2484 12.0979 14.2453 12.1463L15.2025 12.5565C15.2337 12.3757 15.25 12.1898 15.25 12C15.25 10.4632 14.1833 9.17555 12.75 8.83697Z" fill="currentColor" />
            <path d="M11.25 8.83697C9.81665 9.17555 8.75 10.4632 8.75 12C8.75 12.1898 8.76626 12.3757 8.79747 12.5565L9.75468 12.1463C9.75158 12.0979 9.75 12.0492 9.75 12C9.75 11.0203 10.3761 10.1869 11.25 9.87803V8.83697Z" fill="currentColor" />
            <path d="M14.6113 13.9351L13.6544 13.525C13.2432 13.9708 12.6542 14.25 12 14.25C11.3458 14.25 10.7568 13.9708 10.3456 13.525L9.38865 13.9351C9.98087 14.733 10.9301 15.25 12 15.25C13.0699 15.25 14.0191 14.733 14.6113 13.9351Z" fill="currentColor" />
            <path d="M13.0549 4.25H10.9451C9.57755 4.24998 8.47521 4.24996 7.60825 4.36652C6.70814 4.48754 5.95027 4.74643 5.34835 5.34835C5.07033 5.62637 4.8655 5.93766 4.71362 6.28086C4.64592 6.26078 4.57422 6.25 4.5 6.25C4.08579 6.25 3.75 6.58579 3.75 7V10C3.75 10.3266 3.95871 10.6044 4.25002 10.7073V13.2927C3.95871 13.3956 3.75 13.6734 3.75 14V17C3.75 17.4142 4.08579 17.75 4.5 17.75C4.57422 17.75 4.64592 17.7392 4.71362 17.7191C4.8655 18.0623 5.07033 18.3736 5.34835 18.6517C5.95027 19.2536 6.70814 19.5125 7.60825 19.6335C8.47522 19.75 9.57754 19.75 10.9451 19.75H13.0549C14.4225 19.75 15.5248 19.75 16.3918 19.6335C17.2919 19.5125 18.0497 19.2536 18.6516 18.6517C19.2536 18.0497 19.5125 17.2919 19.6335 16.3918C19.75 15.5248 19.75 14.4225 19.75 13.0549V10.9451C19.75 9.57754 19.75 8.47522 19.6335 7.60825C19.5125 6.70814 19.2536 5.95027 18.6516 5.34835C18.0497 4.74643 17.2919 4.48754 16.3918 4.36652C15.5248 4.24996 14.4225 4.24998 13.0549 4.25ZM7.25 12C7.25 9.37665 9.37665 7.25 12 7.25C14.6234 7.25 16.75 9.37665 16.75 12C16.75 14.6234 14.6234 16.75 12 16.75C9.37665 16.75 7.25 14.6234 7.25 12Z" fillRule="evenodd" clipRule="evenodd" fill="currentColor" />
            <path opacity="0.2" d="M3.46447 3.46447C2 4.92893 2 7.28595 2 12C2 16.714 2 19.0711 3.46447 20.5355C4.92893 22 7.28595 22 12 22C16.714 22 19.0711 22 20.5355 20.5355C22 19.0711 22 16.714 22 12C22 7.28595 22 4.92893 20.5355 3.46447C19.0711 2 16.714 2 12 2C7.28595 2 4.92893 2 3.46447 3.46447ZM10.9451 4.25H13.0549C14.4225 4.24998 15.5248 4.24996 16.3918 4.36652C17.2919 4.48754 18.0497 4.74643 18.6516 5.34835C19.2536 5.95027 19.5125 6.70814 19.6335 7.60825C19.75 8.47522 19.75 9.57754 19.75 10.9451V13.0549C19.75 14.4225 19.75 15.5248 19.6335 16.3918C19.5125 17.2919 19.2536 18.0497 18.6516 18.6517C18.0497 19.2536 17.2919 19.5125 16.3918 19.6335C15.5248 19.75 14.4225 19.75 13.0549 19.75H10.9451C9.57754 19.75 8.47522 19.75 7.60825 19.6335C6.70814 19.5125 5.95027 19.2536 5.34835 18.6517C5.07033 18.3736 4.8655 18.0623 4.71362 17.7191C4.64592 17.7392 4.57422 17.75 4.5 17.75C4.08579 17.75 3.75 17.4142 3.75 17V14C3.75 13.6734 3.95871 13.3956 4.25002 13.2927V10.7073C3.95871 10.6044 3.75 10.3266 3.75 10V7C3.75 6.58579 4.08579 6.25 4.5 6.25C4.57422 6.25 4.64592 6.26078 4.71362 6.28086C4.8655 5.93766 5.07033 5.62637 5.34835 5.34835C5.95027 4.74643 6.70814 4.48754 7.60825 4.36652C8.47521 4.24996 9.57755 4.24998 10.9451 4.25Z" fillRule="evenodd" clipRule="evenodd" fill="currentColor" />
        </svg>
    ),
}

/* Styles, from site/styles.css and site/sections/{hero,statement}.css. Every class starts with arc- */
const CSS = `
.arc-root {
  --concrete: #d3d3d3; --ink: #151515; --text: #222222; --muted: #3a3a3a; --white: #ffffff;
  --container-max: 1520px; --gutter: 40px; --grid-gap: 24px;
  --fs-hero: 76px; --fs-lede: 20px;
  --ease-out: cubic-bezier(0.22, 1, 0.36, 1);
  --dur-fast: 160ms; --dur-base: 240ms;
  --btn-dark: #292929;
  --shadow-btn: 0 0 0 1px rgba(41,41,41,0.05), 0 4px 4px 0 rgba(41,41,41,0.02), inset 0 1px 0 1px rgba(255,255,255,0.16), inset 0 -2px 0 1px #292929;
  --shadow-btn-pressed: 0 0 0 1px rgba(41,41,41,0.05), inset 0 1px 0 1px rgba(255,255,255,0.1), inset 0 -1px 0 1px #292929;
  --shadow-menu: 0 0 0 1px rgba(17,17,17,0.06), 0 2px 4px -1px rgba(17,17,17,0.03), 0 12px 32px -4px rgba(17,17,17,0.09);
  --vw: 100cqw;
  container-type: inline-size;
  position: relative;
  width: 100%;
  color: var(--text);
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-rendering: optimizeLegibility;
}
@media (max-width: 1199px) { .arc-root { --fs-hero: 60px; --fs-lede: 19px; --gutter: 32px; --grid-gap: 20px; } }
@media (max-width: 809px) { .arc-root { --fs-hero: 38px; --fs-lede: 17px; --gutter: 20px; --grid-gap: 12px; } }
.arc-root *, .arc-root *::before, .arc-root *::after { box-sizing: border-box; }
.arc-root h1, .arc-root p { margin: 0; }
.arc-root a { color: inherit; text-decoration: none; }
.arc-root svg { display: block; }
.arc-root button { font: inherit; color: inherit; background: none; border: 0; padding: 0; cursor: pointer; }
.arc-root :focus-visible { outline: 2px solid var(--ink); outline-offset: 3px; border-radius: 4px; }
.arc-container { width: 100%; max-width: var(--container-max); margin-inline: auto; padding-inline: var(--gutter); }

/* Hero */
.arc-hero {
  position: relative; isolation: isolate; min-height: 100vh; min-height: 100svh; overflow: hidden;
  background-color: var(--concrete);
  background-image: linear-gradient(112deg, rgba(0,0,0,0.06) 0%, rgba(0,0,0,0.02) 38%, rgba(255,255,255,0.22) 52%, rgba(255,255,255,0.14) 66%, rgba(0,0,0,0.05) 100%), url("${"__TEXTURE_URL__"}");
  background-size: auto, 1024px;
}
.arc-is-canvas .arc-hero, .arc-is-canvas .arc-statement { min-height: 900px; }
.arc-hero__canvas { position: absolute; inset: 0; z-index: -1; width: 100%; height: 100%; opacity: 0; transition: opacity 900ms var(--ease-out); }
.arc-hero--gl .arc-hero__canvas { opacity: 1; }
.arc-is-canvas .arc-hero__canvas { transition: none; }
.arc-hero__debris { position: absolute; inset: 0; z-index: -1; width: 100%; height: 100%; pointer-events: none; }
.arc-hero__inner {
  position: relative; display: grid; grid-template-columns: repeat(12, minmax(0, 1fr)); grid-template-rows: 1fr auto;
  column-gap: var(--grid-gap); min-height: inherit;
  padding-top: var(--header-h); padding-bottom: calc(var(--wordmark-visible, 160px) + 32px);
}
.arc-hero__content { grid-column: 1 / -1; grid-row: 1; align-self: center; display: grid; grid-template-columns: subgrid; align-items: end; }
.arc-hero__heading { grid-column: 1 / span 7; display: grid; justify-items: start; gap: 32px; }
.arc-hero__title { font-size: var(--fs-hero); font-weight: 500; line-height: 1.02; letter-spacing: -0.028em; color: var(--ink); }
.arc-hero__aside { grid-column: 9 / span 4; display: grid; justify-items: start; gap: 32px; margin-bottom: calc(var(--fs-hero) * 0.15); }
.arc-hero__lede { max-width: 22em; font-size: var(--fs-lede); line-height: 1.5; color: var(--text); }
.arc-hero__inner > .arc-hero__seam { grid-column: 1 / -1; grid-row: 2; }
.arc-hero--gl .arc-hero__seam { background: transparent; box-shadow: none; }
.arc-hero--gl .arc-hero__seam .arc-seam__hole { opacity: 0; }
.arc-hero__wordmark-wrap { position: absolute; left: 0; right: 0; bottom: 0; pointer-events: none; }
.arc-hero__wordmark {
  display: block; width: max-content; font-size: var(--wordmark-size, 18vw); font-weight: 500; line-height: 1;
  letter-spacing: 0.035em; margin-right: -0.035em; white-space: nowrap; transform: translateY(0.24em);
  color: rgba(0,0,0,0.035); text-shadow: 1px 1px 1px rgba(255,255,255,0.55), -1px -1px 1px rgba(0,0,0,0.16); user-select: none;
}
.arc-hero--gl .arc-hero__wordmark { color: transparent; text-shadow: none; }
@media (prefers-reduced-motion: no-preference) {
  .arc-root:not(.arc-is-canvas) .arc-rise { animation: arc-rise 700ms var(--ease-out) backwards; animation-delay: calc(var(--rise, 0) * 80ms + 150ms); }
}
@keyframes arc-rise { from { opacity: 0; transform: translateY(14px); } to { opacity: 1; transform: none; } }

/* Chip: a short label between square brackets, set as plain text */
.arc-chip { display: inline-block; max-width: 100%; white-space: nowrap; font-size: 13px; font-weight: 500; letter-spacing: 0.14em; line-height: 1.4; text-transform: uppercase; color: var(--text); }
.arc-chip::before { content: "[\\00a0"; content: "[\\00a0" / ""; }
.arc-chip::after { content: "\\00a0]"; content: "\\00a0]" / ""; }

/* Formwork seam, carved into the concrete when WebGL runs */
.arc-seam { position: relative; height: 1px; background: rgba(43,43,43,0.16); box-shadow: 0 1px 0 rgba(255,255,255,0.45); }
.arc-seam__hole { position: absolute; top: 50%; width: 9px; height: 9px; border-radius: 50%; background: rgba(0,0,0,0.06); box-shadow: inset 1.5px 1.5px 2px rgba(0,0,0,0.35), 1px 1px 0 rgba(255,255,255,0.55); }
.arc-seam__hole--start { left: 0; transform: translate(-50%, -50%); }
.arc-seam__hole--end { right: 0; transform: translate(50%, -50%); }

/* Primary button: a dark pill lit from above (the user's Framer reference) */
.arc-btn { display: inline-flex; align-items: center; justify-content: center; gap: 10px; height: 48px; padding: 0 24px; border-radius: 999px; font-size: 15px; font-weight: 500; letter-spacing: 0.005em; line-height: 1; white-space: nowrap; transition: background-color var(--dur-fast) var(--ease-out), transform var(--dur-fast) var(--ease-out), box-shadow var(--dur-fast) var(--ease-out); -webkit-tap-highlight-color: transparent; user-select: none; }
.arc-btn:active { transform: scale(0.98); }
.arc-root .arc-btn--primary { color: #f4f4f3; background: linear-gradient(180deg, rgba(207,207,207,0.16) 0%, rgba(207,207,207,0.11) 100%), var(--btn-dark); box-shadow: var(--shadow-btn); }
@media (hover: hover) { .arc-root .arc-btn--primary:hover { background: linear-gradient(180deg, rgba(207,207,207,0.22) 0%, rgba(207,207,207,0.15) 100%), var(--btn-dark); } }
.arc-root .arc-btn--primary:active { box-shadow: var(--shadow-btn-pressed); }

/* Path picker: one button, three paths. The menu is as wide as the hero's right-hand column */
.arc-picker { position: relative; display: grid; justify-items: start; width: 100%; }
.arc-picker__chevrons { width: 16px; height: 16px; flex: none; }
.arc-picker__chev { fill: none; stroke: currentColor; stroke-width: 1.5; stroke-linecap: round; stroke-linejoin: round; transform-box: fill-box; transform-origin: center; transition: transform var(--dur-base) var(--ease-out); }
.arc-picker__trigger[aria-expanded="true"] .arc-picker__chev--up { transform: translateY(1px) rotate(180deg); }
.arc-picker__trigger[aria-expanded="true"] .arc-picker__chev--down { transform: translateY(-1px) rotate(180deg); }
.arc-picker__panel {
  position: absolute; left: 0; bottom: calc(100% + 14px); z-index: 20; width: 100%; padding: 10px;
  background: var(--white); border-radius: 24px; box-shadow: var(--shadow-menu); transform-origin: 28px 100%;
  opacity: 0; visibility: hidden; transform: translateY(6px) scale(0.97);
  transition: opacity var(--dur-fast) var(--ease-out), transform var(--dur-fast) var(--ease-out), visibility 0s linear var(--dur-fast);
}
.arc-picker.is-open .arc-picker__panel { opacity: 1; visibility: visible; transform: none; transition: opacity var(--dur-base) var(--ease-out), transform var(--dur-base) var(--ease-out), visibility 0s; }
.arc-picker__title { margin: 0 14px 8px !important; padding: 12px 0 14px; border-bottom: 1px solid rgba(17,17,17,0.08); font-size: 12px; font-weight: 500; letter-spacing: 0.08em; line-height: 16px; text-transform: uppercase; color: var(--muted); }
.arc-picker__option { display: grid; grid-template-columns: 30px 1fr 16px; grid-template-rows: auto auto; column-gap: 16px; row-gap: 3px; align-items: center; padding: 14px; border-radius: 16px; transition: background-color var(--dur-fast) var(--ease-out); }
.arc-picker__icon { grid-row: 1 / span 2; display: grid; place-items: center; width: 30px; height: 30px; color: var(--text); transition: transform var(--dur-base) var(--ease-out); }
.arc-picker__icon svg { width: 30px; height: 30px; }
.arc-picker__label { grid-column: 2; align-self: end; font-size: 18px; font-weight: 500; line-height: 1.3; color: var(--ink); }
.arc-picker__meta { grid-column: 2; align-self: start; font-size: 14px; line-height: 1.4; color: var(--muted); }
.arc-picker__arrow { grid-column: 3; grid-row: 1 / span 2; width: 16px; height: 16px; color: #a6a6a6; transition: transform var(--dur-base) var(--ease-out), color var(--dur-fast) var(--ease-out); }
.arc-picker__option:focus-visible { outline-offset: -2px; }
@media (hover: hover) {
  .arc-picker__option:hover { background: #f6f6f5; }
  .arc-picker__option:hover .arc-picker__icon { transform: scale(1.06); }
  .arc-picker__option:hover .arc-picker__arrow { color: var(--ink); transform: translateX(2px); }
}
.arc-picker--no-icons .arc-picker__icon { display: none; }
.arc-picker--no-icons .arc-picker__option { grid-template-columns: 1fr 16px; }
.arc-picker--no-icons .arc-picker__label, .arc-picker--no-icons .arc-picker__meta { grid-column: 1; }
.arc-picker--no-icons .arc-picker__arrow { grid-column: 2; }

/* Statement: a pure white room, the brief's statement set like an editorial page */
.arc-statement { --st-soft: #9e9e9e; position: relative; display: grid; align-items: center; min-height: 100vh; padding: 128px var(--gutter); background: #ffffff; color: var(--ink); overflow: hidden; }
.arc-statement__inner { width: 100%; max-width: calc(var(--container-max) - 2 * var(--gutter)); margin-inline: auto; transform-origin: 30% 50%; --col: calc((100% - 11 * var(--grid-gap)) / 12 + var(--grid-gap)); }
.arc-statement__text { font-size: calc((min(var(--vw), var(--container-max)) - 2 * var(--gutter)) * 0.0445); font-weight: 400; line-height: 1.12; letter-spacing: -0.025em; text-indent: calc(var(--col) * 3); }
.arc-w { white-space: nowrap; }
.arc-statement__pale { color: var(--st-soft); }
.arc-statement__text.is-split .arc-c { opacity: 0; }
@media (max-width: 1199px) { .arc-statement__text { font-size: 44px; } }
@media (max-width: 809px) { .arc-statement__text { font-size: 30px; line-height: 1.16; text-indent: calc(var(--col) * 2); } }

/* Zoom-through stage: pins for --zoom-travel of scrolling */
.arc-zoom--on { height: calc(100vh + var(--zoom-travel)); }
.arc-zoom--on .arc-zoom__stage { position: sticky; top: 0; height: 100vh; overflow: hidden; }
.arc-zoom--on .arc-zoom__stage > .arc-hero, .arc-zoom--on .arc-zoom__stage > .arc-statement { position: absolute; inset: 0; min-height: 0; }
.arc-zoom--on .arc-hero { z-index: 2; }
.arc-zoom--on .arc-hero__inner { min-height: 100%; }
.arc-hero--zooming { background: none; }

@media (prefers-reduced-motion: reduce) {
  .arc-root *, .arc-root *::before, .arc-root *::after { transition-duration: 1ms !important; animation-duration: 1ms !important; }
}
`

HeroZoom.displayName = "Hero · Zoom to Statement"

addPropertyControls(HeroZoom, {
    chip: { type: ControlType.String, title: "Chip", defaultValue: "Independent capital markets advisory" },
    titleLine1: { type: ControlType.String, title: "Title 1", defaultValue: "Where Capital" },
    titleLine2: { type: ControlType.String, title: "Title 2", defaultValue: "Meets Conviction" },
    lede: { type: ControlType.String, title: "Lede", displayTextArea: true, defaultValue: "For growth-stage founders, funds and foundations raising $5M–$500M+." },
    buttonLabel: { type: ControlType.String, title: "Button", defaultValue: "Choose your path" },
    pickerTitle: { type: ControlType.String, title: "Menu title", defaultValue: "Who are you?" },
    showIcons: { type: ControlType.Boolean, title: "Icons", defaultValue: true },
    path1Title: { type: ControlType.String, title: "Path 1", defaultValue: "I’m raising capital" },
    path1Text: { type: ControlType.String, title: "Path 1 line", defaultValue: "Founders and funds raising $5M–$500M+" },
    path1Link: { type: ControlType.Link, title: "Path 1 link", defaultValue: "/what-we-do#founders" },
    path2Title: { type: ControlType.String, title: "Path 2", defaultValue: "I’m an investor" },
    path2Text: { type: ControlType.String, title: "Path 2 line", defaultValue: "Family offices, VCs, funds and LPs" },
    path2Link: { type: ControlType.Link, title: "Path 2 link", defaultValue: "/what-we-do#investors" },
    path3Title: { type: ControlType.String, title: "Path 3", defaultValue: "I represent an institution" },
    path3Text: { type: ControlType.String, title: "Path 3 line", defaultValue: "Institutions and sovereign capital" },
    path3Link: { type: ControlType.Link, title: "Path 3 link", defaultValue: "/what-we-do#institutions" },
    wordmark: { type: ControlType.String, title: "Carved word", defaultValue: "ARCOVIA" },
    statementStart: { type: ControlType.String, title: "Statement", displayTextArea: true, defaultValue: "Today’s markets are flooded with funding but starved for differentiation." },
    statementPale: { type: ControlType.String, title: "Pale phrase", defaultValue: "Spreadsheets validate data," },
    statementEnd: { type: ControlType.String, title: "Statement end", displayTextArea: true, defaultValue: "but only stories inspire action. Arcovia combines the science of financial stewardship with the art of narrative design, building investor conviction long before a term sheet is signed." },
    effect: { type: ControlType.Enum, title: "Through the O", options: ["drill", "break"], optionTitles: ["Drill", "Break"], defaultValue: "drill" },
    travel: { type: ControlType.Number, title: "Scroll (vh)", defaultValue: 280, min: 120, max: 600, step: 10 },
    headerOffset: { type: ControlType.Number, title: "Header space", defaultValue: 184, min: 0, max: 400, step: 1 },
    texture: { type: ControlType.ResponsiveImage, title: "Texture" },
    sun: { type: ControlType.Number, title: "Sunlight", defaultValue: 0.2, min: 0, max: 1, step: 0.01 },
    cursorLight: { type: ControlType.Number, title: "Cursor light", defaultValue: 0.22, min: 0, max: 1, step: 0.01 },
})
