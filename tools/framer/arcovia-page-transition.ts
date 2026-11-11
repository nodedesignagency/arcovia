/**
 * Arcovia: the page transition, as it is in Framer (project Arcovia, ArcoviaBase.tsx).
 * Reference copy of the logic (some comments trimmed). Framer's ArcoviaBase.tsx is the source
 * of truth: change it there, then update this copy.
 *
 * After the user's second reference video (11 Nov 2026): a black curtain between pages. Leaving,
 * the page lifts, is cut away from the bottom up and dims to black (a same-page View Transition
 * the click starts); the next page loads. Arriving, ARRIVE_SCRIPT (in the page's HTML, from every
 * section's BaseStyle; the header's runs first) paints the page black before the first paint, and
 * once it is ready the black lifts off from the bottom up while the page rises and brightens.
 *
 * Wiring in ArcoviaBase.tsx: BaseStyle adds PAGE_CSS to its style and renders ARRIVE_SCRIPT, off
 * the canvas; its effect calls initPageTransition() (once per page). INTRO_CSS's animations use
 * animation-play-state: var(--rv-play, running), so page openings wait under the black.
 */
export const PAGE_CSS = `/* Leaving: a same-page View Transition the click starts. The page lifts, is cut away from the bottom up and dims to black */
html.arc-leaving::view-transition { background: #0b0b0b; }
html.arc-leaving::view-transition-image-pair(root) { isolation: auto; }
html.arc-leaving::view-transition-old(root) { animation: arc-page-out 500ms cubic-bezier(0.7, 0, 0.84, 0) both; mix-blend-mode: normal; }
html.arc-leaving::view-transition-new(root) { animation: none; opacity: 0; }
/* clip-path needs both ends written out: from none it would jump instead of sliding */
@keyframes arc-page-out { from { clip-path: inset(0 0 0 0); } to { translate: 0 -8vh; clip-path: inset(0 0 100% 0); filter: brightness(0.4); } }
.arc-page-cover { position: fixed; inset: 0; z-index: 2147483000; background: #0b0b0b; }
/* Arriving: black from the first paint (the inline script sets html.arc-arriving), then it lifts off
   from the bottom up while the page under it brightens (html.arc-reveal, set once the page is ready).
   If the script never gets there, it lifts by itself after 2.5 s. */
html.arc-arriving body::before, html.arc-arriving body::after { content: ""; position: fixed; inset: 0; pointer-events: auto; }
html.arc-arriving body::before { z-index: 2147483000; background: #0b0b0b; animation: arc-cover-late 720ms cubic-bezier(0.16, 1, 0.3, 1) 2500ms both; }
html.arc-arriving body::after { z-index: 2147482999; background: #0b0b0b; opacity: 0.5; animation: arc-dim-late 720ms cubic-bezier(0.16, 1, 0.3, 1) 2500ms both; }
html.arc-arriving.arc-reveal body::before { animation: arc-cover 720ms cubic-bezier(0.16, 1, 0.3, 1) both; }
html.arc-arriving.arc-reveal body::after { animation: arc-dim 720ms cubic-bezier(0.16, 1, 0.3, 1) both; }
@keyframes arc-cover { from { clip-path: inset(0 0 0 0); } to { clip-path: inset(0 0 100% 0); } }
@keyframes arc-cover-late { from { clip-path: inset(0 0 0 0); } to { clip-path: inset(0 0 100% 0); } }
@keyframes arc-dim { to { opacity: 0; } }
@keyframes arc-dim-late { to { opacity: 0; } }
/* The page openings wait under the black and start as it lifts */
:root.arc-arriving:not(.arc-reveal) { --rv-play: paused; }`

/** Runs in the page's HTML before the first paint (every section renders it; the first one decides). */
export const ARRIVE_SCRIPT = `(function(){try{var k="arc-pt",t=+sessionStorage.getItem(k);if(!t)return;sessionStorage.removeItem(k);if(Date.now()-t<8000&&!(window.matchMedia&&matchMedia("(prefers-reduced-motion: reduce)").matches))document.documentElement.classList.add("arc-arriving")}catch(e){}})()`

const PAGE_OUT_MS = 500
const PAGE_IN_MS = 720

let pageTransitionOn = false

export function initPageTransition() {
    if (pageTransitionOn || typeof window === "undefined") return
    pageTransitionOn = true
    const root = document.documentElement
    let leaving = false
    let cover: HTMLElement | null = null
    const prefetched = new Set<string>()

    const reduced = () => !!(window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches)

    // ---------- Arriving ----------
    if (root.classList.contains("arc-arriving")) {
        let started = false
        const lift = () => {
            if (started) return
            started = true
            root.classList.add("arc-reveal")
            const main = document.getElementById("main")
            // The page rises into place (only at the top: further down, a moving page would shift the fixed header)
            if (main && window.scrollY < 2) {
                try {
                    main.animate([{ translate: "0 6vh" }, { translate: "0 0" }], {
                        duration: PAGE_IN_MS,
                        easing: "cubic-bezier(0.16, 1, 0.3, 1)",
                    })
                } catch (e) {}
            }
            window.setTimeout(() => root.classList.remove("arc-arriving", "arc-reveal"), PAGE_IN_MS + 60)
        }
        // Once the fonts are in (at most 300 ms more), so the page under the black is the finished one
        const fonts = (document as any).fonts
        const ready: Promise<unknown> = fonts && fonts.ready ? fonts.ready : Promise.resolve()
        Promise.race([ready, new Promise((r) => window.setTimeout(r, 300))]).then(() =>
            requestAnimationFrame(() => requestAnimationFrame(lift))
        )
    }

    // ---------- Leaving ----------
    const target = (e: Event): URL | null => {
        const el = e.target as Element | null
        const a = el && el.closest ? (el.closest("a[href]") as HTMLAnchorElement | null) : null
        if (!a || a.hasAttribute("download") || a.hasAttribute("data-no-transition")) return null
        if (a.target && a.target !== "_self") return null
        let url: URL
        try {
            url = new URL(a.href, location.href)
        } catch (err) {
            return null
        }
        if (url.origin !== location.origin || !/^https?:$/.test(url.protocol)) return null
        // The same page (an anchor on it, or itself): no transition
        if (url.pathname === location.pathname && url.search === location.search) return null
        return url
    }

    const prefetch = (href: string) => {
        if (prefetched.has(href)) return
        prefetched.add(href)
        const l = document.createElement("link")
        l.rel = "prefetch"
        l.href = href
        document.head.appendChild(l)
    }

    const showCover = () => {
        if (!cover) {
            cover = document.createElement("div")
            cover.className = "arc-page-cover"
            cover.setAttribute("aria-hidden", "true")
        }
        document.body.appendChild(cover)
        return cover
    }

    const reset = () => {
        leaving = false
        root.classList.remove("arc-leaving")
        if (cover && cover.parentNode) cover.parentNode.removeChild(cover)
    }

    const leave = (href: string) => {
        leaving = true
        prefetch(href)
        let gone = false
        const go = () => {
            if (gone) return
            gone = true
            try {
                sessionStorage.setItem("arc-pt", String(Date.now()))
            } catch (e) {}
            location.assign(href)
        }
        window.setTimeout(go, PAGE_OUT_MS + 600) // failsafe
        const doc = document as any
        if (typeof doc.startViewTransition === "function") {
            root.classList.add("arc-leaving")
            try {
                const vt = doc.startViewTransition(() => {
                    showCover()
                })
                vt.finished.then(go, go)
            } catch (err) {
                showCover()
                go()
            }
        } else {
            // No View Transitions: the black comes up from the bottom over the page
            const c = showCover()
            try {
                c.animate([{ transform: "translateY(100%)" }, { transform: "none" }], {
                    duration: PAGE_OUT_MS,
                    easing: "cubic-bezier(0.7, 0, 0.84, 0)",
                }).finished.then(go, go)
            } catch (err) {
                go()
            }
        }
    }

    // On the window, capture phase: Framer defers listeners added to the document (they run after
    // the click is done, too late to hold the link); the window's run first and in time.
    window.addEventListener(
        "click",
        (e: MouseEvent) => {
            if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return
            const url = target(e)
            if (!url || reduced()) return
            e.preventDefault()
            e.stopPropagation()
            if (!leaving) leave(url.href)
        },
        true
    )

    let hoverTimer = 0
    window.addEventListener(
        "pointerover",
        (e) => {
            const url = target(e)
            window.clearTimeout(hoverTimer)
            if (url) hoverTimer = window.setTimeout(() => prefetch(url.href), 120)
        },
        { passive: true }
    )

    // Back to this page from the history cache: take the black away
    window.addEventListener("pageshow", (e: PageTransitionEvent) => {
        if (e.persisted) reset()
    })
}
