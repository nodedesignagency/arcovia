/**
 * Arcovia: site footer (every page; component site-footer). Sits in the "Site"
 * layout template under the page content.
 *
 * After the user's references: defiant.vc's footer (the main inspiration, not a
 * copy) and their own Native Foreign footer. On the neutral ground straight after
 * the CTA, no line across the top (the user removed it).
 *   logo 1-3   small and horizontal, like the client's horizontal logo: the shared
 *              .logo (brandmark beside wordmark) with the mark 30px wide and the
 *              wordmark 17px tall, centred on the first line of links. The client's
 *              pack has no horizontal lockup, so it is spaced like their stacked
 *              lockup: there the mark sits 0.46 times the wordmark's height above
 *              it, here 0.46 times beside it (8px visible; gap 5px, since the mark's
 *              SVG carries about 3px of space on its right). The user rejected the
 *              stacked lockup here.
 *   links      two columns set large (32px), no labels over them (the user removed
 *              [ SITE MAP ] / [ COMPANY ]): What We Do, Track Record, Team on cols
 *              6-8; About, Contact, LinkedIn on cols 9-12; the masthead's short dash
 *              draws in on hover.
 *   offices    side by side over hairlines: city, live local time, address.
 *   bar        "© 2026 Arcovia. All rights reserved." left, the legal pages right
 *              (one link per legal page, so one or two fit).
 * The logo and the links' capitals sit 64px under the CTA box, the same space as
 * the box has above it under the sectors line.
 * Tablet (810-1199): the desktop layout on fewer columns (logo top left, links and
 * offices four columns each on the right), gaps 64px. Phone (809 and below): one
 * column, all six links in one list (the two groups a small step apart), offices
 * one under the other, gaps 32-48px. Breakpoints answer to the component's width.
 * LinkedIn URL [TO CONFIRM]; no email or phone yet ([COPY NEEDED] if the client
 * wants them). Privacy Policy and Terms point at the one Legal page for now.
 * Ported from sections/footer.css and the footer markup in index.html on main; the
 * clocks are main.js's (as in ArcoviaHeader).
 */
import * as React from "react"
import { addPropertyControls, ControlType } from "framer"
import { baseStyle, cssTag, sprite, useArcoviaScript, type Life } from "./ArcoviaBase.tsx"

const FOOTER_CSS = `/* ==========================================================================
   SECTION: footer — every page (component: site-footer)
   After the user's references: defiant.vc's footer (the main inspiration,
   not a copy) and their own Native Foreign footer. On the neutral ground
   straight after the CTA, no line across the top.
     logo 1-3 (small and horizontal: the brandmark beside the wordmark, in
              the proportions of the client's horizontal logo)
     Site map 6-8 · Company 9-12: just the links, set large, no labels; the
              masthead's short dash draws in on hover
     offices 6-8 · 9-12: side by side over hairlines, city, live local
              time (main.js), address
     bar: © on the left, the legal pages on the right, over a hairline
   ========================================================================== */

.site-footer {
  --ft-line: rgba(21, 21, 21, 0.16);
  background: var(--color-neutral);
  color: var(--color-text);
}

.site-footer__inner {
  display: grid;
  grid-template-columns: repeat(12, minmax(0, 1fr));
  column-gap: var(--grid-gap);
  /* The logo and the links' capitals sit 64px under the CTA box, the same space as the box
     has above it (under the sectors line): the capitals start about 10px into their line */
  padding-top: calc(var(--space-8) - 10px);
}

/* ---------- The logo: small and horizontal ----------
   The shared .logo (brandmark beside wordmark). The client's pack has no horizontal
   lockup, so the spacing follows their stacked lockup: there the mark sits 0.46 times
   the wordmark's height above it, so here it sits 0.46 times beside it (8px at a 17px
   wordmark; the mark's SVG already carries about 3px of space on its right). */
.site-footer__logo {
  grid-column: 1 / span 3;
  grid-row: 1;
  align-self: start;
  justify-self: start;
  gap: 5px;
  margin-top: 10px;         /* centred on the first line of links */
}
.site-footer__logo .logo__mark { width: 30px; }
.site-footer__logo .logo__word { height: 17px; }

/* ---------- Link columns ---------- */
.site-footer__col--site { grid-column: 6 / span 3; grid-row: 1; }
.site-footer__col--company { grid-column: 9 / span 4; grid-row: 1; }

.site-footer__links { display: grid; }
.site-footer__link {
  display: inline-flex;
  align-items: center;
  font-size: 32px;
  font-weight: var(--weight-medium);
  line-height: 1.34;
  letter-spacing: -0.018em;
  color: var(--color-ink);
}
/* The masthead's short dash, drawing in on hover */
.site-footer__link::before {
  content: "";
  width: 0;
  height: 1.5px;
  margin-right: 0;
  background: currentColor;
  transition: width var(--dur-base) var(--ease-out), margin var(--dur-base) var(--ease-out);
}
@media (hover: hover) {
  .site-footer__link:hover::before { width: 16px; margin-right: 10px; }
}

/* ---------- Offices, side by side over hairlines ---------- */
.site-footer__offices {
  grid-column: 6 / -1;
  grid-row: 2;
  display: grid;
  grid-template-columns: subgrid;
  margin-top: var(--space-9);
}
.site-footer__office {
  display: grid;
  grid-template-columns: 1fr auto;
  align-items: baseline;
  column-gap: var(--space-4);
  row-gap: 6px;
  padding-top: var(--space-4);
  border-top: 1px solid var(--ft-line);
}
.site-footer__office:nth-child(1) { grid-column: 1 / span 3; }
.site-footer__office:nth-child(2) { grid-column: 4 / span 4; }
.site-footer__city {
  font-size: 16px;
  font-weight: var(--weight-medium);
  line-height: 22px;
  color: var(--color-ink);
}
/* Live local time, as in the masthead's clock */
.site-footer__time {
  font-size: 13px;
  font-weight: var(--weight-semibold);
  line-height: 22px;
  font-variant-numeric: tabular-nums;
  white-space: nowrap;
  color: var(--color-ink);
}
.site-footer__time .office__tz { font-weight: var(--weight-medium); color: var(--color-text-muted); }
.site-footer__address {
  grid-column: 1 / -1;
  font-style: normal;
  font-size: 15px;
  line-height: 22px;
  color: var(--color-text-muted);
}

/* ---------- Bar: © left, legal right ---------- */
.site-footer__bar {
  grid-column: 1 / -1;
  grid-row: 3;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-5);
  height: 72px;
  margin-top: var(--space-9);
  border-top: 1px solid var(--ft-line);
  font-size: 14px;
  line-height: 20px;
  color: var(--color-text-muted);
}
.site-footer__legal { display: flex; gap: var(--space-6); }
.site-footer__legal-link { transition: color var(--dur-fast) var(--ease-out); }
@media (hover: hover) {
  .site-footer__legal-link:hover { color: var(--color-ink); }
}

/* ---------- Tablet (810-1199): the desktop layout on fewer columns ----------
   The logo keeps the top left; the links and the offices share the eight columns
   on the right, four each, so "Track Record" stays on one line. The gaps step
   down from 96px to 64px. */
@container arc (max-width: 1199px) {
  .site-footer__col--site { grid-column: 5 / span 4; }
  .site-footer__col--company { grid-column: 9 / span 4; }
  .site-footer__offices { grid-column: 5 / -1; margin-top: var(--space-8); }
  .site-footer__office:nth-child(1) { grid-column: 1 / span 4; }
  .site-footer__office:nth-child(2) { grid-column: 5 / span 4; }
  .site-footer__bar { margin-top: var(--space-8); }
}

/* ---------- Phone (809 and below): one column ----------
   The logo, then all six links in one list (the two groups a small step apart),
   the offices one under the other, then © and the legal pages. The gaps step
   down to 32-48px. */
@container arc (max-width: 809px) {
  .site-footer__logo { grid-column: 1 / -1; margin-bottom: var(--space-6); }
  .site-footer__col--site { grid-column: 1 / -1; grid-row: 2; }
  .site-footer__col--company { grid-column: 1 / -1; grid-row: 3; margin-top: var(--space-4); }
  .site-footer__link { font-size: 26px; }
  .site-footer__offices { grid-column: 1 / -1; grid-row: 4; row-gap: var(--space-5); margin-top: var(--space-7); }
  .site-footer__office:nth-child(n) { grid-column: 1 / -1; }
  .site-footer__bar {
    grid-row: 5;
    flex-direction: column;
    align-items: flex-start;
    justify-content: center;
    gap: var(--space-3);
    height: auto;
    margin-top: var(--space-7);
    padding-block: var(--space-5);
  }
}`

interface LinkItem {
    label: string
    link: string
}

interface Office {
    city: string
    timeZone: string
    zoneName: string
    address1: string
    address2: string
}

interface Props {
    homeLink: string
    siteLinks: LinkItem[]
    companyLinks: LinkItem[]
    offices: Office[]
    copyright: string
    legalLinks: LinkItem[]
    style?: React.CSSProperties
}

const DEFAULTS: Props = {
    homeLink: "/",
    siteLinks: [
        { label: "What We Do", link: "/what-we-do" },
        { label: "Track Record", link: "/track-record" },
        { label: "Team", link: "/team" },
    ],
    companyLinks: [
        { label: "About", link: "/about" },
        { label: "Contact", link: "/contact" },
        { label: "LinkedIn", link: "" }, // [TO CONFIRM] LinkedIn company page URL
    ],
    offices: [
        { city: "Los Angeles", timeZone: "America/Los_Angeles", zoneName: "Pacific Time", address1: "2029 Century Park East", address2: "Los Angeles, CA 90067" },
        { city: "San Juan", timeZone: "America/Puerto_Rico", zoneName: "Atlantic Time", address1: "450 Ave. 200", address2: "San Juan, Puerto Rico 00901" },
    ],
    copyright: "© 2026 Arcovia. All rights reserved.",
    legalLinks: [
        { label: "Privacy Policy", link: "/legal" },
        { label: "Terms", link: "/legal" },
    ],
}

const href = (v: string | undefined) => v || "#"
const external = (v: string | undefined) => !!v && /^https?:\/\//.test(v)

/**
 * @framerSupportedLayoutWidth any-prefer-fixed
 * @framerSupportedLayoutHeight auto
 */
export default function ArcoviaFooter(incoming: Partial<Props>) {
    const p = { ...DEFAULTS, ...incoming }
    const siteLinks = p.siteLinks?.length ? p.siteLinks : DEFAULTS.siteLinks
    const companyLinks = p.companyLinks?.length ? p.companyLinks : DEFAULTS.companyLinks
    const offices = (p.offices?.length ? p.offices : DEFAULTS.offices).slice(0, 2)
    const legalLinks = p.legalLinks || DEFAULTS.legalLinks
    const ref = React.useRef<HTMLDivElement>(null)
    const key = JSON.stringify(offices.map((o) => o.timeZone))
    useArcoviaScript(ref, (root, life) => initClocks(root, life), [key])

    const linkList = (links: LinkItem[]) => (
        <ul className="site-footer__links">
            {links.map((l, i) => (
                <li key={i}>
                    <a
                        className="site-footer__link"
                        href={href(l.link)}
                        target={external(l.link) ? "_blank" : undefined}
                        rel={external(l.link) ? "noopener" : undefined}
                        data-todo={!l.link || l.link === "#" ? l.label + " URL [TO CONFIRM]" : undefined}
                    >
                        {l.label}
                    </a>
                </li>
            ))}
        </ul>
    )

    return (
        <div className="arc arc-footer" ref={ref} style={p.style}>
            {baseStyle()}
            {cssTag("footer", FOOTER_CSS)}
            {sprite()}
            <footer className="site-footer" aria-labelledby="footer-title">
                <h2 className="visually-hidden" id="footer-title">
                    Site footer
                </h2>
                <div className="site-footer__inner container">
                    {/* Component: logo (the shared .logo: brandmark beside wordmark), sized for the footer */}
                    <a className="logo site-footer__logo" href={href(p.homeLink)} aria-label="Arcovia, home">
                        <svg className="logo__mark" viewBox="0 0 72 57" aria-hidden="true">
                            <use href="#a-mark" />
                        </svg>
                        <svg className="logo__word" viewBox="0 0 72 11" aria-hidden="true">
                            <use href="#wordmark" />
                        </svg>
                    </a>

                    <nav className="site-footer__col site-footer__col--site" aria-label="Site map">
                        {linkList(siteLinks)}
                    </nav>
                    <nav className="site-footer__col site-footer__col--company" aria-label="Company">
                        {linkList(companyLinks)}
                    </nav>

                    <div className="site-footer__offices">
                        {offices.map((o, i) => (
                            <div className="site-footer__office" key={i}>
                                <p className="site-footer__city">{o.city}</p>
                                <p className="site-footer__time">
                                    <span className="visually-hidden">Local time </span>
                                    <span data-clock={o.timeZone}>{o.zoneName}</span>
                                </p>
                                <address className="site-footer__address">
                                    {o.address1}
                                    {o.address2 ? (
                                        <>
                                            <br />
                                            {o.address2}
                                        </>
                                    ) : null}
                                </address>
                            </div>
                        ))}
                    </div>

                    <div className="site-footer__bar">
                        <p className="site-footer__copy">{p.copyright}</p>
                        <ul className="site-footer__legal">
                            {legalLinks.map((l, i) => (
                                <li key={i}>
                                    <a className="site-footer__legal-link" href={href(l.link)}>
                                        {l.label}
                                    </a>
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>
            </footer>
        </div>
    )
}

/* ---------- Behaviour (main.js: office clocks), as in ArcoviaHeader ---------- */
function initClocks(host: HTMLElement, life: Life) {
    /* Office clocks: local time in each office, e.g. "7:02 AM PDT" */
    const clocks = host.querySelectorAll<HTMLElement>("[data-clock]")
    if (!clocks.length || !(window as any).Intl) return
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
            } catch (e) {
                // unknown zone: keep the fallback text
            }
        })
    }
    tick()
    // Line the updates up with the turn of the minute
    life.timeout(() => {
        tick()
        life.interval(tick, 60000)
    }, 60000 - (Date.now() % 60000) + 50)
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

addPropertyControls(ArcoviaFooter, {
    homeLink: { type: ControlType.Link, title: "Home", defaultValue: DEFAULTS.homeLink },
    siteLinks: { ...linkControl, title: "Site map", maxCount: 4, defaultValue: DEFAULTS.siteLinks },
    companyLinks: { ...linkControl, title: "Company", maxCount: 4, defaultValue: DEFAULTS.companyLinks },
    offices: {
        type: ControlType.Array,
        title: "Offices",
        maxCount: 2,
        control: {
            type: ControlType.Object,
            controls: {
                city: { type: ControlType.String, title: "City" },
                timeZone: { type: ControlType.String, title: "Time zone", placeholder: "America/Los_Angeles" },
                zoneName: { type: ControlType.String, title: "Zone name" },
                address1: { type: ControlType.String, title: "Address" },
                address2: { type: ControlType.String, title: "Address 2" },
            },
        },
        defaultValue: DEFAULTS.offices,
    },
    copyright: { type: ControlType.String, title: "Copyright", defaultValue: DEFAULTS.copyright },
    legalLinks: { ...linkControl, title: "Legal", maxCount: 3, defaultValue: DEFAULTS.legalLinks },
})
