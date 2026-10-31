/**
 * Arcovia: site header (masthead), full-screen menu and office clock.
 *
 * After defiant.vc. At the top of the page the masthead is open: a labels row
 * (the two offices and one clock that swaps city on hover), the big A-mark, the
 * wordmark, one line, and the site map as two columns of three link rows.
 * Scrolling down folds it into a small bar ("Menu +") and slides it away;
 * scrolling up brings the small bar back with the labels row; the top of the
 * page opens it again. No background colour, only an untinted blur mid-page.
 * Type turns light over sections marked data-header-theme="dark".
 *
 * Place it in the layout template: position fixed, top 0, left 0, right 0,
 * width 100%, pointer events none (its own links and buttons turn them back on).
 * Ported from main.js and styles.css on main.
 */
import * as React from "react"
import { createPortal } from "react-dom"
import { addPropertyControls, ControlType } from "framer"
import { baseStyle, cssTag, sprite, isStaticRender, useArcoviaScript, type Life } from "./ArcoviaBase.tsx"

const HEADER_CSS = `/* ---------- Header: a masthead that folds, hides and comes back ----------
   After defiant.vc. Columns on the 12-column grid:
   labels row: 1-2 Los Angeles · 3-4 San Juan · 5-7 clock · 8-10 "Site map" · 11-12 "Company"
   main row:   1-2 mark · 3-4 wordmark · 5-7 one line · 8-10 and 11-12 link rows
   States (set in main.js):
   - top of page: expanded
   - .is-compact: rows stack into "Menu +", mark shrinks, wordmark slides in
   - .is-hidden: the whole header slides up out of view (scrolling down)
   - .is-on-dark: light type over dark sections
   No background in any state. */

.site-header {
  position: relative;   /* the Framer layer holding this component is fixed */
  z-index: 50;
  pointer-events: none;   /* only its links and button catch the pointer */
  transition: transform var(--mh-dur) var(--mh-ease);
}
.site-header a,
.site-header button,
.masthead-city { pointer-events: auto; }
.site-header.is-hidden { transform: translateY(-100%); }

/* No background colour. Mid-page, a clear blur (no tint) sits behind the bar
   and fades out at its bottom edge, so text scrolling underneath softens
   instead of colliding with the header. Delete this rule for no blur at all. */
.site-header::before {
  content: "";
  position: absolute;
  inset: 0 0 -24px;
  z-index: -1;
  -webkit-backdrop-filter: blur(22px);
  backdrop-filter: blur(22px);
  -webkit-mask-image: linear-gradient(to bottom, #000 calc(100% - 40px), transparent);
  mask-image: linear-gradient(to bottom, #000 calc(100% - 40px), transparent);
  opacity: 0;
  transition: opacity var(--dur-slow) var(--ease-out);
}
.site-header.is-compact::before { opacity: 1; }

/* Over dark sections the type turns light */
.site-header.is-on-dark {
  --color-ink: var(--color-on-dark);
  --color-text-muted: var(--color-on-dark-muted);
  --mh-line: rgba(244, 244, 243, 0.22);
}
.site-header .masthead-labels,
.site-header .masthead-main { transition: color var(--dur-slow) var(--ease-out); }

/* Labels row: offices, one clock, column name, over a full-width hairline */
.masthead-labels {
  display: grid;
  grid-template-columns: repeat(12, minmax(0, 1fr));
  column-gap: var(--grid-gap);
  align-items: end;
  height: var(--mh-labels);
  padding-bottom: 11px;
  border-bottom: 1px solid var(--mh-line);
  transition: border-color var(--dur-slow) var(--ease-out);
}
.masthead-city--la { grid-column: 1 / span 2; }
.masthead-city--sj { grid-column: 3 / span 2; }
.masthead-clock { grid-column: 5 / span 3; }
.masthead-labels__site { grid-column: 8 / span 3; }
.masthead-labels__company { grid-column: 11 / span 2; }

.masthead-city,
.masthead-label {
  font-size: 12px;
  font-weight: var(--weight-medium);
  letter-spacing: 0.06em;
  line-height: 16px;
  text-transform: uppercase;
  color: var(--color-text-muted);
  white-space: nowrap;
  transition: color var(--dur-base) var(--ease-out);
}
.masthead-city { cursor: default; }

/* The clock shows Los Angeles; hovering San Juan swaps to its time */
.masthead-clock {
  display: grid;
  font-size: 13px;
  font-weight: var(--weight-semibold);
  line-height: 16px;
  color: var(--color-ink);
  font-variant-numeric: tabular-nums;
  white-space: nowrap;
}
.masthead-clock__time {
  grid-area: 1 / 1;
  transition: opacity var(--dur-base) var(--ease-out), transform var(--dur-base) var(--ease-out);
}
.masthead-clock .office__tz { display: none; }
.masthead-clock__time--sj { opacity: 0; transform: translateY(5px); }
.masthead-city--la { color: var(--color-ink); }
.masthead-labels:has(.masthead-city--sj:hover) .masthead-city--la { color: var(--color-text-muted); }
.masthead-labels:has(.masthead-city--sj:hover) .masthead-city--sj { color: var(--color-ink); }
.masthead-labels:has(.masthead-city--sj:hover) .masthead-clock__time--la { opacity: 0; transform: translateY(-5px); }
.masthead-labels:has(.masthead-city--sj:hover) .masthead-clock__time--sj { opacity: 1; transform: none; }

/* Main row */
.masthead-main {
  position: relative;
  display: grid;
  grid-template-columns: repeat(12, minmax(0, 1fr));
  column-gap: var(--grid-gap);
  align-items: start;
  height: var(--mh-main);
  padding-top: var(--mh-pad);
  transition: height var(--mh-dur) var(--mh-ease), padding var(--mh-dur) var(--mh-ease);
}
.is-compact .masthead-main { height: var(--mh-compact); padding-top: calc((var(--mh-compact) - var(--mh-row)) / 2); }

.masthead-mark {
  grid-column: 1 / span 2;
  grid-row: 1;
  display: block;
  width: var(--mh-mark);
  color: var(--color-ink);
  transition: width var(--mh-dur) var(--mh-ease), margin var(--mh-dur) var(--mh-ease), color var(--dur-slow) var(--ease-out);
}
.masthead-mark svg { width: 100%; height: auto; fill: currentColor; }
/* Small mark centred on the row: half the row minus half the mark's height */
.is-compact .masthead-mark { width: var(--mh-mark-small); margin-top: calc(var(--mh-row) / 2 - var(--mh-mark-small) * 0.396); }

.masthead-word {
  grid-column: 3 / span 2;
  grid-row: 1;
  justify-self: start;
  height: var(--mh-row);
  display: flex;
  align-items: center;
  color: var(--color-ink);
  transform-origin: left center;
  transition: transform var(--mh-dur) var(--mh-ease), color var(--dur-slow) var(--ease-out);
}
/* --word-shift is measured in main.js: from column 3 to just right of the small mark */
.masthead-word svg { display: block; width: auto; height: 16px; fill: currentColor; }
.is-compact .masthead-word { transform: translateX(var(--word-shift, 0px)) scale(0.88); }

.masthead-note {
  grid-column: 5 / span 3;
  grid-row: 1;
  padding-top: 7px;
  font-size: 16px;
  line-height: 1.45;
  color: var(--color-text-muted);
  text-wrap: pretty;
  transition: opacity calc(var(--mh-dur) * 0.5) var(--mh-ease), transform var(--mh-dur) var(--mh-ease);
}
.is-compact .masthead-note { opacity: 0; transform: translateY(-6px); pointer-events: none; }

/* Hairline under the rows, from the wordmark column to the edge (not under the mark).
   It stays in the compact bar, under "Menu +", as in the reference. */
.masthead-rule {
  position: absolute;
  left: calc((100% - 11 * var(--grid-gap)) / 12 * 2 + 2 * var(--grid-gap));
  right: 0;
  top: calc(var(--mh-pad) + var(--mh-row) * var(--mh-rows));
  height: 1px;
  background: var(--mh-line);
  transition: top var(--mh-dur) var(--mh-ease), background-color var(--dur-slow) var(--ease-out);
}
.is-compact .masthead-rule { top: calc((var(--mh-compact) - var(--mh-row)) / 2 + var(--mh-row)); }

/* Site map: two columns of three rows, on the page grid */
.nav {
  grid-column: 8 / -1;
  grid-row: 1;
  position: relative;
  display: grid;
  grid-template-columns: subgrid;
}
.nav__list--site { grid-column: 1 / span 3; }
.nav__list--company { grid-column: 4 / span 2; }
.nav__list {
  position: relative;
  height: calc(var(--mh-row) * var(--mh-rows));
  transition: height var(--mh-dur) var(--mh-ease);
}
.nav__item {
  height: var(--mh-row);
  display: flex;
  align-items: center;
  transition: transform var(--mh-dur) var(--mh-ease), opacity calc(var(--mh-dur) * 0.55) var(--mh-ease), border-color var(--dur-slow) var(--ease-out);
  transition-delay: calc((2 - var(--i)) * 25ms);
}
.nav__item + .nav__item { border-top: 1px solid var(--mh-line); }

/* Folding: every row slides up onto the first and fades */
.is-compact .nav__list { height: var(--mh-row); }
.is-compact .nav__item {
  transform: translateY(calc(var(--i) * var(--mh-row) * -1));
  opacity: 0;
  pointer-events: none;
  transition-delay: calc(var(--i) * 25ms);
}

.nav__link {
  display: inline-flex;
  align-items: center;
  font-size: var(--fs-masthead);
  font-weight: var(--weight-medium);
  color: var(--color-ink);
  transition: color var(--dur-slow) var(--ease-out);
}
/* A short dash draws in before the active or hovered link */
.nav__link::before {
  content: "";
  width: 0;
  height: 1px;
  margin-right: 0;
  background: currentColor;
  transition: width var(--dur-base) var(--ease-out), margin var(--dur-base) var(--ease-out);
}
.nav__link[aria-current="page"]::before { width: 12px; margin-right: 8px; }
@media (hover: hover) {
  .nav__link:hover::before { width: 12px; margin-right: 8px; }
}

/* "Menu +": appears where the rows fold into */
.menu-btn {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  height: var(--mh-row);
  font-size: var(--fs-masthead);
  font-weight: var(--weight-medium);
  color: var(--color-ink);
  transition: color var(--dur-slow) var(--ease-out);
}
.menu-btn__plus { position: relative; width: 11px; height: 11px; transition: transform var(--dur-slow) var(--ease-out); }
.menu-btn__plus::before,
.menu-btn__plus::after {
  content: "";
  position: absolute;
  inset: 5px 0 auto;
  height: 1.5px;
  background: currentColor;
  border-radius: 1px;
}
.menu-btn__plus::after { transform: rotate(90deg); }
@media (hover: hover) {
  .menu-btn:hover .menu-btn__plus { transform: rotate(90deg); }
}

@media (min-width: 1200px) {
  .nav .menu-btn {
    position: absolute;
    top: 0;
    left: 0;
    opacity: 0;
    visibility: hidden;
    transition: opacity var(--dur-base) var(--ease-out), visibility 0s linear var(--dur-base), color var(--dur-slow) var(--ease-out);
  }
  .is-compact .nav .menu-btn {
    opacity: 1;
    visibility: visible;
    transition: opacity var(--dur-slow) var(--ease-out) calc(var(--mh-dur) * 0.55), visibility 0s, color var(--dur-slow) var(--ease-out);
  }
}

/* Tablet and phone (to refine once desktop is approved): labels row over a simple bar */
@media (max-width: 1199px) {
  .masthead-labels__site,
  .masthead-labels__company,
  .masthead-note,
  .masthead-rule,
  .nav__list { display: none; }
  .masthead-city--la { grid-column: 1 / span 3; }
  .masthead-city--sj { grid-column: 4 / span 3; }
  .masthead-clock { grid-column: 7 / span 3; }
  .masthead-main { display: flex; align-items: center; gap: 12px; padding-top: 0; }
  .is-compact .masthead-main { padding-top: 0; }
  .is-compact .masthead-mark { margin-top: 0; }
  .is-compact .masthead-word { transform: none; }
  .nav { margin-left: auto; display: block; }
}
@media (max-width: 809px) {
  .masthead-city--la { grid-column: 1 / span 4; }
  .masthead-city--sj { grid-column: 5 / span 4; }
  .masthead-clock { grid-column: 9 / span 4; justify-self: end; }
}

/* ---------- Full-screen menu (deck "Contents" slide) ---------- */
.menu {
  position: fixed;
  inset: 0;
  z-index: 60;
  display: flex;
  flex-direction: column;
  background-color: var(--color-concrete);
  background-image: var(--texture-concrete);
  background-size: 1024px;
  overflow-y: auto;
  visibility: hidden;
  opacity: 0;
  transition: opacity var(--dur-base) var(--ease-out), visibility 0s linear var(--dur-base);
}
.menu.is-open {
  visibility: visible;
  opacity: 1;
  transition: opacity var(--dur-base) var(--ease-out), visibility 0s;
}

.menu__top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 72px;
}

.menu__close {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  height: 40px;
  font-size: var(--fs-nav);
  font-weight: var(--weight-medium);
  color: var(--color-ink);
}

.menu__body {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  gap: var(--space-8);
  padding-block: var(--space-8) var(--space-6);
}

.menu__list { display: grid; gap: var(--space-2); }
.menu__item {
  opacity: 0;
  transform: translateY(10px);
  transition: opacity var(--dur-slow) var(--ease-out), transform var(--dur-slow) var(--ease-out);
  transition-delay: calc(var(--i, 0) * 40ms + 60ms);
}
.menu.is-open .menu__item { opacity: 1; transform: none; }

.menu__link {
  display: flex;
  align-items: baseline;
  gap: var(--space-5);
  font-size: clamp(36px, 6vw, 64px);
  font-weight: var(--weight-medium);
  letter-spacing: -0.02em;
  line-height: 1.15;
  color: var(--color-ink);
}
.menu__index {
  min-width: 1.6em;
  color: rgba(43, 43, 43, 0.32);
  text-shadow: 0 1px 0 rgba(255, 255, 255, 0.55);
}

.menu__foot {
  display: grid;
  grid-template-columns: repeat(3, auto);
  justify-content: start;
  align-items: end;
  gap: var(--space-5) var(--space-8);
  font-size: var(--fs-small);
  color: var(--color-text);
}
.menu__foot strong { display: block; font-weight: var(--weight-semibold); color: var(--color-ink); }
@media (max-width: 809px) {
  .menu__foot { grid-template-columns: 1fr; gap: var(--space-4); }
}
`

interface NavLink {
    label: string
    link: string
}

interface Props {
    note: string
    homeLink: string
    siteLabel: string
    companyLabel: string
    siteLinks: NavLink[]
    companyLinks: NavLink[]
    menuLinks: NavLink[]
    laAddress: string
    sjAddress: string
    linkedIn: string
    ctaLabel: string
    ctaLink: string
    style?: React.CSSProperties
}

const DEFAULTS: Props = {
    // [COPY NEEDED] Draft line, to confirm with Lilla
    note: "We build investor conviction, then run the process that turns it into capital.",
    homeLink: "/",
    siteLabel: "Site map",
    companyLabel: "Company",
    siteLinks: [
        { label: "What We Do", link: "/what-we-do" },
        { label: "Track Record", link: "/track-record" },
        { label: "Team", link: "/team" },
    ],
    companyLinks: [
        { label: "About", link: "/about" },
        { label: "Contact", link: "/contact" },
        { label: "Legal", link: "/legal" },
    ],
    menuLinks: [
        { label: "What We Do", link: "/what-we-do" },
        { label: "Track Record", link: "/track-record" },
        { label: "Team", link: "/team" },
        { label: "About", link: "/about" },
        { label: "Contact", link: "/contact" },
    ],
    laAddress: "2029 Century Park East, CA 90067",
    sjAddress: "450 Ave. 200, Puerto Rico 00901",
    linkedIn: "", // [TO CONFIRM] LinkedIn company page URL
    ctaLabel: "Start a conversation",
    ctaLink: "/contact",
}

/** "/team" and "https://…" pass through; Framer link values pass through too */
const href = (v: string | undefined) => v || "#"

/** The links that point at the page being viewed get aria-current="page" (the dash before the link) */
function isCurrent(link: string) {
    if (typeof window === "undefined" || !link || link === "#") return false
    try {
        const u = new URL(link, window.location.href)
        return u.origin === window.location.origin && u.pathname.replace(/\/$/, "") === window.location.pathname.replace(/\/$/, "")
    } catch (e) {
        return false
    }
}

/**
 * @framerSupportedLayoutWidth any-prefer-fixed
 * @framerSupportedLayoutHeight auto
 */
export default function ArcoviaHeader(incoming: Partial<Props>) {
    const p = { ...DEFAULTS, ...incoming }
    const siteLinks = p.siteLinks?.length ? p.siteLinks : DEFAULTS.siteLinks
    const companyLinks = p.companyLinks?.length ? p.companyLinks : DEFAULTS.companyLinks
    const menuLinks = p.menuLinks?.length ? p.menuLinks : DEFAULTS.menuLinks
    const ref = React.useRef<HTMLDivElement>(null)
    const [portalHost, setPortalHost] = React.useState<HTMLElement | null>(null)
    const [current, setCurrent] = React.useState<string>("")

    // The full-screen menu lives in <body>, so no transformed ancestor can trap its position: fixed
    React.useEffect(() => {
        if (isStaticRender()) return
        setPortalHost(document.body)
        setCurrent(window.location.pathname)
    }, [])

    useArcoviaScript(ref, (root, life) => initHeader(root, life), [portalHost])

    const navItem = (l: NavLink, i: number) => (
        <li className="nav__item" style={{ ["--i" as any]: i }} key={i}>
            <a className="nav__link" href={href(l.link)} aria-current={current && isCurrent(l.link) ? "page" : undefined}>
                {l.label}
            </a>
        </li>
    )

    const menu = (
        <div className="arc arc-menu-host">
            <div className="menu" id="arc-menu" data-menu aria-hidden="true" role="dialog" aria-modal="true" aria-label="Menu">
                <div className="menu__top container">
                    <a className="logo" href={href(p.homeLink)} aria-label="Arcovia, home">
                        <svg className="logo__mark" viewBox="0 0 72 57" aria-hidden="true"><use href="#a-mark" /></svg>
                        <svg className="logo__word" viewBox="0 0 72 11" aria-hidden="true"><use href="#wordmark" /></svg>
                    </a>
                    <button className="menu__close" type="button" data-menu-close>Close</button>
                </div>
                <div className="menu__body container">
                    <ol className="menu__list">
                        {menuLinks.map((l, i) => (
                            <li className="menu__item" style={{ ["--i" as any]: i }} key={i}>
                                <a className="menu__link" href={href(l.link)}>
                                    <span className="menu__index">{i + 1}.</span>
                                    {l.label}
                                </a>
                            </li>
                        ))}
                    </ol>
                    <div className="menu__foot">
                        <p><strong>Los Angeles</strong>{p.laAddress}</p>
                        <p><strong>San Juan</strong>{p.sjAddress}</p>
                        <p><a href={href(p.linkedIn)} target={p.linkedIn ? "_blank" : undefined} rel="noopener">LinkedIn</a></p>
                        <a className="btn btn--primary" href={href(p.ctaLink)}>{p.ctaLabel}</a>
                    </div>
                </div>
            </div>
        </div>
    )

    return (
        <div className="arc arc-header" ref={ref} style={{ ...p.style }}>
            {baseStyle()}
            {cssTag("header", HEADER_CSS)}
            {sprite()}
            <header className="site-header" data-header>
                <div className="site-header__inner container">
                    <div className="masthead-labels">
                        <span className="masthead-city masthead-city--la">Los Angeles</span>
                        <span className="masthead-city masthead-city--sj">San Juan</span>
                        {/* One clock: Los Angeles time; hover San Juan to see its time */}
                        <p className="masthead-clock">
                            <span className="masthead-clock__time masthead-clock__time--la"><span className="visually-hidden">Los Angeles </span><span data-clock="America/Los_Angeles">Pacific Time</span></span>
                            <span className="masthead-clock__time masthead-clock__time--sj"><span className="visually-hidden">San Juan </span><span data-clock="America/Puerto_Rico">Atlantic Time</span></span>
                        </p>
                        <p className="masthead-label masthead-labels__site" aria-hidden="true">{p.siteLabel}</p>
                        <p className="masthead-label masthead-labels__company" aria-hidden="true">{p.companyLabel}</p>
                    </div>
                    <div className="masthead-main">
                        <a className="masthead-mark" href={href(p.homeLink)} aria-label="Arcovia, home">
                            <svg viewBox="0 0 72 57" aria-hidden="true"><use href="#a-mark" /></svg>
                        </a>
                        <a className="masthead-word" href={href(p.homeLink)} tabIndex={-1} aria-hidden="true">
                            <svg viewBox="0 0 72 11"><use href="#wordmark" /></svg>
                        </a>
                        <p className="masthead-note">{p.note}</p>
                        <nav className="nav" aria-label="Main">
                            <ul className="nav__list nav__list--site">{siteLinks.slice(0, 3).map(navItem)}</ul>
                            <ul className="nav__list nav__list--company">{companyLinks.slice(0, 3).map(navItem)}</ul>
                            <button className="menu-btn" type="button" aria-expanded="false" aria-controls="arc-menu" data-menu-open>
                                Menu
                                <span className="menu-btn__plus" aria-hidden="true"></span>
                            </button>
                        </nav>
                        <span className="masthead-rule" aria-hidden="true"></span>
                    </div>
                </div>
            </header>
            {portalHost ? createPortal(menu, portalHost) : null}
        </div>
    )
}

/* ---------- Behaviour (main.js: header, menu, clocks) ---------- */
function initHeader(host: HTMLElement, life: Life) {
    const root = document.documentElement

    // Review switch: ?ink=soft shows the previous, softer text colours
    try {
        const ink = new URLSearchParams(location.search).get("ink")
        if (ink) root.setAttribute("data-ink", ink)
    } catch (e) {}

    /* Header: fold on leaving the top, hide going down, return going up */
    const header = host.querySelector<HTMLElement>("[data-header]")
    if (header) {
        let ticking = false
        let lastY = window.scrollY
        const update = () => {
            const y = Math.max(0, window.scrollY)
            const dy = y - lastY
            const atTop = y < 8
            header.classList.toggle("is-compact", !atTop)
            if (atTop || root.style.overflow === "hidden") {
                header.classList.remove("is-hidden")
            } else if (Math.abs(dy) > 6) {
                // Down: slide away once past the masthead. Up: come back as the small bar.
                header.classList.toggle("is-hidden", dy > 0 && y > header.offsetHeight && !header.contains(document.activeElement))
            }
            if (atTop || Math.abs(dy) > 6) lastY = y

            // Light type while the bar sits over a dark section (queried each time: sections can change)
            const probe = 40
            let onDark = false
            document.querySelectorAll("[data-header-theme='dark']").forEach((sec) => {
                const r = sec.getBoundingClientRect()
                if (r.top <= probe && r.bottom >= probe) onDark = true
            })
            header.classList.toggle("is-on-dark", onDark)
            ticking = false
        }
        life.on(window, "scroll", () => {
            if (!ticking) {
                ticking = true
                life.raf(update)
            }
        }, { passive: true })
        // Keyboard users tabbing into a hidden header bring it back
        life.on(header, "focusin", () => header.classList.remove("is-hidden"))
        update()

        // How far the wordmark travels to sit beside the small mark when the masthead folds
        const measure = () => {
            const grid = header.querySelector<HTMLElement>(".masthead-main")
            if (!grid || window.innerWidth < 1200) {
                header.style.removeProperty("--word-shift")
                return
            }
            const cs = getComputedStyle(grid)
            const cols = cs.gridTemplateColumns.split(" ").map(parseFloat)
            const gap = parseFloat(cs.columnGap) || 0
            const col3 = cols[0] + cols[1] + gap * 2
            const small = parseFloat(getComputedStyle(root).getPropertyValue("--mh-mark-small")) || 22
            header.style.setProperty("--word-shift", small + 12 - col3 + "px")
        }
        measure()
        life.on(window, "resize", measure)
    }

    /* Full-screen menu (rendered into <body>) */
    const menu = document.querySelector<HTMLElement>(".arc-menu-host [data-menu]")
    const openers = host.querySelectorAll<HTMLElement>("[data-menu-open]")
    let lastFocus: Element | null = null
    const setMenu = (open: boolean) => {
        if (!menu) return
        menu.classList.toggle("is-open", open)
        menu.setAttribute("aria-hidden", String(!open))
        openers.forEach((b) => b.setAttribute("aria-expanded", String(open)))
        root.style.overflow = open ? "hidden" : ""
        if (open) {
            lastFocus = document.activeElement
            const first = menu.querySelector<HTMLElement>("[data-menu-close]")
            if (first) life.timeout(() => first.focus(), 50)
        } else if (lastFocus && (lastFocus as HTMLElement).focus) {
            ;(lastFocus as HTMLElement).focus()
        }
    }
    openers.forEach((b) => life.on(b, "click", () => setMenu(true)))
    if (menu) {
        menu.querySelectorAll("[data-menu-close]").forEach((b) => life.on(b, "click", () => setMenu(false)))
        life.on(menu, "keydown", (e: KeyboardEvent) => {
            if (e.key === "Escape") setMenu(false)
            if (e.key !== "Tab") return
            // Keep focus inside the menu while it is open
            const f = menu.querySelectorAll<HTMLElement>("a, button")
            const first = f[0]
            const last = f[f.length - 1]
            if (e.shiftKey && document.activeElement === first) {
                e.preventDefault()
                last.focus()
            } else if (!e.shiftKey && document.activeElement === last) {
                e.preventDefault()
                first.focus()
            }
        })
        life.add(() => {
            if (menu.classList.contains("is-open")) root.style.overflow = ""
        })
    }

    /* Office clocks: local time in each office, e.g. "7:02 AM PDT" */
    const clocks = host.querySelectorAll<HTMLElement>("[data-clock]")
    if (clocks.length && (window as any).Intl) {
        const tick = () => {
            const now = new Date()
            clocks.forEach((el) => {
                try {
                    // "7:02 AM" plus the zone ("PDT") in its own span, so phones can drop it
                    const parts = new Intl.DateTimeFormat("en-US", { hour: "numeric", minute: "2-digit", timeZone: el.getAttribute("data-clock") || undefined, timeZoneName: "short" }).formatToParts(now)
                    let time = ""
                    let zone = ""
                    parts.forEach((part) => {
                        if (part.type === "timeZoneName") zone = part.value
                        else time += part.value
                    })
                    el.innerHTML = time.trim() + ' <span class="office__tz">' + zone + "</span>"
                } catch (e) {}
            })
        }
        tick()
        // Line the updates up with the turn of the minute
        life.timeout(() => {
            tick()
            life.interval(tick, 60000)
        }, 60000 - (Date.now() % 60000) + 50)
    }
}

const linkControl = {
    type: ControlType.Array as const,
    control: {
        type: ControlType.Object as const,
        controls: {
            label: { type: ControlType.String as const, title: "Label" },
            link: { type: ControlType.Link as const, title: "Link" },
        },
    },
}

addPropertyControls(ArcoviaHeader, {
    note: { type: ControlType.String, title: "Line", displayTextArea: true, defaultValue: DEFAULTS.note },
    homeLink: { type: ControlType.Link, title: "Home", defaultValue: DEFAULTS.homeLink },
    siteLabel: { type: ControlType.String, title: "Site label", defaultValue: DEFAULTS.siteLabel },
    siteLinks: { ...linkControl, title: "Site map", maxCount: 3, defaultValue: DEFAULTS.siteLinks },
    companyLabel: { type: ControlType.String, title: "Company label", defaultValue: DEFAULTS.companyLabel },
    companyLinks: { ...linkControl, title: "Company", maxCount: 3, defaultValue: DEFAULTS.companyLinks },
    menuLinks: { ...linkControl, title: "Menu", defaultValue: DEFAULTS.menuLinks },
    laAddress: { type: ControlType.String, title: "LA address", defaultValue: DEFAULTS.laAddress },
    sjAddress: { type: ControlType.String, title: "SJ address", defaultValue: DEFAULTS.sjAddress },
    linkedIn: { type: ControlType.Link, title: "LinkedIn" },
    ctaLabel: { type: ControlType.String, title: "Menu button", defaultValue: DEFAULTS.ctaLabel },
    ctaLink: { type: ControlType.Link, title: "Button link", defaultValue: DEFAULTS.ctaLink },
})
