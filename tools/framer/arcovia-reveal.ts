/**
 * Arcovia: the site-wide reveal, as it is in Framer (project Arcovia, ArcoviaBase.tsx).
 * Reference copy of the logic (some comments trimmed). Framer's ArcoviaBase.tsx is the source
 * of truth: change it there, then update this copy.
 *
 * After the user's reference video (11 Nov 2026): text and rows come in from a soft blur and a
 * little lower, sharp and in place, one after another (80 ms apart).
 *
 * How it is wired in ArcoviaBase.tsx:
 * - BASE_CSS has the hidden state, set by the script only:
 *     :where(.arc) [data-rv="wait"] { opacity: 0 !important; }
 * - baseStyle() returns <BaseStyle />, which renders the same <link> and <style> as before and,
 *   off the canvas, adds INTRO_CSS to the style and runs initReveal(closest .arc, createLife())
 *   in an effect. So every Arcovia section gets the reveal without changing its own file.
 * - ?reveal=off on any page shows the site without it, to compare.
 *
 * Canvas-built parts (Team page, team member pages, the Person card component) use Framer's own
 * text effects (In View, element, blur) and appear effects with the same timing instead.
 */
export const INTRO_CSS = `@keyframes arc-rv { from { opacity: 0; filter: blur(var(--rv-b, 10px)); translate: 0 var(--rv-y, 20px); } }
@keyframes arc-rv-fade { from { opacity: 0; } }
@media (prefers-reduced-motion: no-preference) {
  :root:not([data-reveal="off"]) :is(.services-hero__heading > *, .services-hero__title > *, .services-hero__paths,
      .track-hero__inner > *,
      .about-hero__heading > *, .about-hero__title > *, .about-hero__lede,
      .team-hero__heading > *, .team-hero__title > *, .team-hero__lede, .team-stat,
      .contact__head > *, .contact__lede, .contact__aside, .contact__main,
      .legal-doc__head > *, .legal-doc__lede, .legal-aside, .legal-doc__text > :nth-child(-n+8),
      .work--full .work__books > .book) {
    animation: arc-rv 1000ms cubic-bezier(0.22, 1, 0.36, 1) backwards;
    animation-delay: calc(150ms + var(--rv-i, 0) * 90ms);
    animation-play-state: var(--rv-play, running);
  }
  :root:not([data-reveal="off"]) :is(.about-hero__media, .team-hero__media) {
    animation: arc-rv-fade 1400ms cubic-bezier(0.22, 1, 0.36, 1) 500ms backwards;
    animation-play-state: var(--rv-play, running);
  }
  /* Headlines set in lines: the lines come in one after another, not the headline as a block */
  :root:not([data-reveal="off"]) :is(.services-hero__title, .about-hero__title, .team-hero__title) { animation: none; }
  :is(.services-hero__title, .about-hero__title, .team-hero__title) > :nth-child(1),
  .track-hero__title, .contact__title, .legal-doc__title { --rv-i: 1; --rv-b: 14px; --rv-y: 28px; }
  :is(.services-hero__title, .about-hero__title, .team-hero__title) > :nth-child(2) { --rv-i: 2; --rv-b: 14px; --rv-y: 28px; }
  :is(.services-hero__lede, .about-hero__lede, .team-hero__lede, .track-hero__lede, .contact__lede, .legal-doc__lede) { --rv-i: 3; }
  .services-hero__paths, .team-stat:nth-child(1), .contact__aside, .legal-aside { --rv-i: 4; }
  .team-stat:nth-child(2), .contact__main, .legal-doc__text > * { --rv-i: 5; }
  .team-stat:nth-child(3) { --rv-i: 6; }
  /* Track Record's books (.work--full; Home's books keep their own scroll animation): one after another after the line */
  .work--full .work__books > .book { --rv-b: 12px; --rv-y: 32px; }
  .work--full .work__books > .book:nth-child(1) { --rv-i: 4; }
  .work--full .work__books > .book:nth-child(2) { --rv-i: 5; }
  .work--full .work__books > .book:nth-child(3) { --rv-i: 6; }
}`

export const REVEAL_SELECTOR = [
    // Home
    ".data__head > *", ".data__note",
    ".wwd__head > *",
    ".map__head > *", ".map__lede", ".map__cities > li",
    ".team__intro > *", ".team__all", ".team-card__body",
    ".closing__content > *",
    // What We Do
    ".path-feature__text > :not(ul)", ".path-feature__list > li",
    ".situations__title", ".data-table tr", ".situation-band", ".situation-cards > li", ".situation-list > *",
    ".mandate__head > *", ".mandate-card__num", ".mandate-card__title", ".mandate-card__list > li",
    ".genesis__head > *", ".genesis-card > :not(svg)", ".genesis__note",
    ".raise__head > *", ".raise__item", ".raise__note",
    // Track Record
    ".closing-row__inner > *",
    // About
    ".story__head > *", ".story-step__head > *", ".story-point",
    ".beliefs__title", ".belief > :not(svg)",
    ".process__title", ".process__num", ".process__name", ".process__text",
    ".offices__head > *", ".office__head", ".office__details > *", ".offices__close > *",
    // Team
    ".residency__title", ".residency__body", ".residency__btn",
    // Legal pages (not the case pages: ArcoviaCase has its own opening, the book carried in from the
    // shelf, then its text; the user saw this reveal spoil it, 11 Nov 2026)
    ".legal-doc__text > *",
    // Footer, every page
    ".site-footer__inner > *",
].join(",")

const REVEAL_EASE = "cubic-bezier(0.22, 1, 0.36, 1)"
const REVEAL_MS = 1000
const REVEAL_STAGGER = 80

/** ?reveal=off (or <html data-reveal="off">) shows the site without the reveal, to compare. */
function revealOff(): boolean {
    try {
        const html = document.documentElement
        if (new URLSearchParams(window.location.search).get("reveal") === "off") html.setAttribute("data-reveal", "off")
        return html.getAttribute("data-reveal") === "off"
    } catch (e) {
        return false
    }
}

export function initReveal(root: HTMLElement, life: Life /* from ArcoviaBase.tsx */) {
    if (root.hasAttribute("data-rv-root")) return
    root.setAttribute("data-rv-root", "")
    life.add(() => root.removeAttribute("data-rv-root"))
    if (revealOff() || typeof Element.prototype.animate !== "function") return
    if (window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches) return

    type Item = { el: HTMLElement; opacity: string; blur: number; y: number }
    const pending = new Map<HTMLElement, Item>()
    const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v))
    let frame = 0

    const setup = () => {
        const vh = window.innerHeight
        const all = Array.from(root.querySelectorAll<HTMLElement>(REVEAL_SELECTOR))
        const found = all.filter((el) => !all.some((o) => o !== el && o.contains(el)))
        for (const el of found) {
            if (el.closest("[data-carve], .visually-hidden") || el.querySelector("[data-carve], canvas")) continue
            const cs = getComputedStyle(el)
            if (cs.display === "none" || cs.display === "contents" || parseFloat(cs.opacity) === 0) continue
            // On screen (or above it) already: leave it as it is, so nothing flashes
            if (el.getBoundingClientRect().top < vh) continue
            const fs = parseFloat(cs.fontSize) || 16
            pending.set(el, {
                el,
                opacity: cs.opacity,
                blur: cs.filter === "none" ? clamp(fs * 0.24, 6, 14) : 0,
                y: clamp(fs * 0.45, 16, 28),
            })
            el.setAttribute("data-rv", "wait")
        }
        schedule()
    }

    const play = (it: Item, delay: number) => {
        const el = it.el
        el.setAttribute("data-rv", "in")
        const from: Keyframe = { opacity: 0, translate: "0 " + it.y + "px" }
        const to: Keyframe = { opacity: it.opacity, translate: "0 0" }
        if (it.blur) {
            from.filter = "blur(" + it.blur.toFixed(1) + "px)"
            to.filter = "blur(0px)"
        }
        const done = () => {
            if (el.getAttribute("data-rv") === "in") el.removeAttribute("data-rv")
        }
        try {
            const a = el.animate([from, to], { duration: REVEAL_MS, delay, easing: REVEAL_EASE, fill: "backwards" })
            a.addEventListener("finish", done)
            a.addEventListener("cancel", done)
        } catch (e) {
            done()
        }
    }

    const check = () => {
        frame = 0
        if (!pending.size) return
        const vh = window.innerHeight
        const atEnd = window.scrollY + vh >= document.documentElement.scrollHeight - 4
        const due: Item[] = []
        pending.forEach((it) => {
            const top = it.el.getBoundingClientRect().top
            if (top < vh * 0.88 || (atEnd && top < vh)) due.push(it)
        })
        if (!due.length) return
        // One after another in reading order
        due.sort((a, b) => (a.el.compareDocumentPosition(b.el) & Node.DOCUMENT_POSITION_FOLLOWING ? -1 : 1))
        due.forEach((it, i) => {
            pending.delete(it.el)
            play(it, Math.min(i, 10) * REVEAL_STAGGER)
        })
    }

    const schedule = () => {
        if (!frame && pending.size) frame = life.raf(check)
    }

    // Two frames in, so the section's own script has laid it out
    life.raf(() => life.raf(setup))
    life.on(window, "scroll", schedule, { passive: true })
    life.on(window, "resize", schedule)
    life.interval(schedule, 500) // layout that moves without a scroll (pinned stages, late images)
    life.add(() => {
        pending.forEach((it) => it.el.removeAttribute("data-rv"))
        pending.clear()
    })
}
