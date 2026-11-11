// @ts-nocheck
/**
 * ArcoviaLegal — one legal document: Disclosures, Privacy Policy, Cookie Policy, Terms of Use.
 * The Framer port of SECTION:legal-doc (site/sections/legal-doc.css, site/legal.js), the approved
 * V2 (4 Nov 2026): the Contact page as it is in Framer (ArcoviaContact).
 *
 * The content lives in the "Legal" CMS collection, so the client edits it there only:
 *   Title, Line, Last updated (date), Text (formatted text), Large first section (on/off).
 * On the detail page (/legal/:slug) every control below is connected to its CMS field.
 *
 * In Text, every Heading 2 starts a section. The heading hangs on the left third, the section's
 * paragraphs, lists and tables run on the right, a hairline above each section (the page grid,
 * through subgrid). "On this page" lists those headings, read from this component's own output,
 * and marks the one you are reading; nobody edits that list.
 *
 *   head      the chip on its side up the left edge (.chip--side), the title on cols 5-12, 32px in
 *   line      under the title, cols 5-12, 32px in
 *   left 1-3  sticky: one box (hairline, square corners, 16px inside): "Last updated", then over a
 *             hairline running edge to edge "On this page"
 *   right     cols 5-12, 32px in: the text, one section per row
 *   end       the page ends on a hairline 12px over the footer (white on this page: the Site
 *             template's "White footer" is on)
 * Tablet (810-1199): one column; chip, title, line, "Last updated"; headings on cols 1-4, text on
 * 5-12. Phone (809 and below): headings over their text. Breakpoints answer to the component's
 * width (@container arc), like the other Arcovia components.
 * Blanks still to fill are written in square brackets in the CMS, e.g. [privacy email].
 */
import * as React from "react"
import { addPropertyControls, ControlType } from "framer"
import { baseStyle, cssTag, isStaticRender } from "./ArcoviaBase.tsx"

const LEGAL_CSS = `/* The page is white, as Contact's */
.arc-legal { background: var(--color-white); }

.legal-doc {
  /* Clear of the small header bar when it comes back (labels row + compact bar), as on Contact */
  --legal-top: calc(var(--mh-labels) + var(--mh-compact) + var(--space-6));
  --legal-line: rgba(21, 21, 21, 0.12);
  --legal-soft: #6e6e6e;
  /* The title: a share of the grid's width (Contact's), so it sets the same at every desktop width */
  --legal-title: calc((min(100cqw, var(--container-max)) - 2 * var(--gutter)) * 0.07);
  /* The text column's width (cols 5-12 less the 32px in): the hairline over each section */
  --legal-rule: calc((min(100cqw, var(--container-max)) - 2 * var(--gutter) - 11 * var(--grid-gap)) / 12 * 8 + 7 * var(--grid-gap) - var(--space-6));
  background: var(--color-white);
  padding: calc(var(--header-h) + var(--space-8)) 0 var(--space-3);
}
.legal-doc::after {
  content: "";
  display: block;
  width: calc(min(100%, var(--container-max)) - 2 * var(--gutter));
  margin: var(--space-10) auto 0;
  border-top: 1px solid rgba(21, 21, 21, 0.16);
}
.legal-doc__inner {
  display: grid;
  grid-template-columns: repeat(12, minmax(0, 1fr));
  column-gap: var(--grid-gap);
  align-items: start;
}

/* ---------- Head: the chip on its side, the title on the right ---------- */
.legal-doc__head {
  grid-column: 1 / -1;
  grid-row: 1;
  display: grid;
  grid-template-columns: subgrid;
  align-items: start;
  row-gap: 22px;
  margin-bottom: var(--space-6);
}
.legal-doc__head .chip {
  grid-column: 1 / span 2;
  grid-row: 1;
  justify-self: start;
  margin-top: calc(var(--legal-title) * 0.1585 - 0.14em);
}
.legal-doc__title {
  grid-column: 5 / -1;
  grid-row: 1;
  margin: 0;
  padding-left: var(--space-6);
  font-size: var(--legal-title);
  font-weight: var(--weight-medium);
  line-height: 1;
  letter-spacing: -0.034em;
  color: var(--color-ink);
}
.legal-doc__lede {
  grid-column: 5 / -1;
  grid-row: 2;
  max-width: 34em;
  margin: 0 0 var(--space-8);
  padding-left: var(--space-6);
  font-size: 20px;
  line-height: 1.55;
  color: var(--color-text);
  text-wrap: pretty;
}

/* ---------- Left: one box, "Last updated" and "On this page" ---------- */
.legal-aside {
  grid-column: 1 / span 3;
  grid-row: 3;
  position: sticky;
  top: var(--legal-top);
  /* the box's first label has its cap height on the first section title's */
  padding-top: calc(1px + 28px + 20px * (28 / 20 / 2 - 0.3415) - 17px - 14px * (1.4 / 2 - 0.3415));
}
.legal-aside__card {
  display: grid;
  gap: var(--space-5);
  padding: 16px;
  border: 1px solid var(--legal-line);
}
.legal-aside__meta { margin: 0; }
.legal-aside__meta dt { font-size: 14px; line-height: 1.4; color: var(--legal-soft); }
.legal-aside__meta dd { margin: 2px 0 0; font-size: 17px; font-weight: var(--weight-medium); line-height: 1.45; color: var(--color-ink); }
.legal-aside__meta .legal-todo { margin-left: -6px; }
.legal-aside__toc {
  margin-inline: -16px;
  padding: var(--space-5) 16px 0;
  border-top: 1px solid var(--legal-line);
}
.legal-nav__label { margin: 0 0 var(--space-3); font-size: 14px; line-height: 1.4; color: var(--legal-soft); }
.legal-nav__toc { display: grid; gap: 6px; margin: 0; padding: 0; list-style: none; }
.legal-nav__link {
  display: inline-flex;
  align-items: center;
  font-size: 15px;
  line-height: 22px;
  color: var(--color-text-muted);
  text-decoration: none;
  transition: color var(--dur-fast) var(--ease-out);
}
.legal-nav__link::before {
  content: "";
  flex: none;
  width: 0;
  height: 1px;
  margin-right: 0;
  background: currentColor;
  transition: width var(--dur-base) var(--ease-out), margin var(--dur-base) var(--ease-out);
}
.legal-nav__link[aria-current="location"] { color: var(--color-ink); }
.legal-nav__link[aria-current="location"]::before { width: 10px; margin-right: 8px; }
@media (hover: hover) {
  .legal-nav__link:hover { color: var(--color-ink); }
}

/* A blank to fill (the date before counsel approves the text) */
.legal-todo {
  padding: 1px 6px;
  border-radius: 4px;
  background: var(--color-well);
  color: var(--color-text-muted);
  font-weight: var(--weight-book);
}

/* ---------- Right: the CMS text, one section per heading ----------
   The text column is a subgrid of the page grid. Framer's formatted text may arrive wrapped in a
   div; such wrappers step aside (display: contents) so its blocks sit on the grid themselves.
   Each Heading 2 starts a new row on the left three columns (auto-placement: a block placed
   before the previous one's column moves to the next row), the rest runs on the right. */
.arc-legal .legal-doc__text {
  grid-column: 5 / -1;
  grid-row: 3;
  display: grid;
  grid-template-columns: subgrid;
  align-items: start;
  min-width: 0;
  padding-left: var(--space-6);
  /* Framer's text styles read these */
  --framer-font-family: var(--font-sans);
  --framer-font-size: var(--fs-body);
  --framer-line-height: 28px;
  --framer-text-color: var(--color-text);
  --framer-letter-spacing: 0;
  --framer-paragraph-spacing: 0px;
  font-size: var(--fs-body);
  line-height: 28px;
  color: var(--color-text);
}
.arc-legal .legal-doc__text div:has(> h2),
.arc-legal .legal-doc__text div:has(> p) { display: contents; }
/* Blank blocks (Framer's formatted text starts with an empty paragraph; clients leave blank lines)
   take no place: hidden before the page runs (a block holding only a line break) and marked by the
   script after (data-blank / data-filled), so a line ending in a break still shows */
.arc-legal .legal-doc__text :is(p, h2, h3):has(> br:only-child):not([data-filled]),
.arc-legal .legal-doc__text [data-blank] { display: none; }

.arc-legal :is(.legal-doc__text, .legal-doc__text div:has(> h2)) > * {
  grid-column: 4 / -1;
  min-width: 0;
  max-width: 40em;
  margin: var(--space-4) 0 0;
  padding: 0;
  font-family: var(--font-sans);
  font-size: var(--fs-body);
  font-weight: var(--weight-book);
  line-height: 28px;
  color: var(--color-text);
  text-wrap: pretty;
}
.arc-legal :is(.legal-doc__text, .legal-doc__text div:has(> h2)) > h2 {
  --framer-font-size: 20px;
  --framer-font-weight: 500;
  --framer-text-color: var(--color-ink);
  --framer-letter-spacing: -0.01em;
  grid-column: 1 / span 3;
  grid-row-end: span 2;
  position: relative;
  max-width: none;
  margin: var(--space-7) 0 0;
  padding: var(--space-6) var(--space-5) 0 0;
  font-size: 20px;
  font-weight: var(--weight-medium);
  line-height: 28px;
  letter-spacing: -0.01em;
  color: var(--color-ink);
  text-wrap: balance;
  scroll-margin-top: var(--legal-top);
}
.arc-legal :is(.legal-doc__text, .legal-doc__text div:has(> h2)) > h2 + *,
.arc-legal :is(.legal-doc__text, .legal-doc__text div:has(> h2)) > h2 + [data-blank] + * {
  margin-top: var(--space-7);
  padding-top: var(--space-6);
}
/* The hairline over each section, across the whole text column */
.arc-legal :is(.legal-doc__text, .legal-doc__text div:has(> h2)) > h2::before {
  content: "";
  position: absolute;
  top: 0;
  left: 0;
  width: var(--legal-rule);
  border-top: 1px solid var(--legal-line);
}
/* The first section: its line is Contact's line over the note, 28px under it. first-of-type, not
   first-child: Framer's formatted text can put another element before the first heading */
.arc-legal :is(.legal-doc__text, .legal-doc__text div:has(> h2)) > h2:first-of-type,
.arc-legal :is(.legal-doc__text, .legal-doc__text div:has(> h2)) > h2:first-of-type + * {
  margin-top: 0;
  padding-top: 28px;
}
/* Large first section (Disclosures: the regulatory statement) */
.arc-legal .legal-doc--lead :is(.legal-doc__text, .legal-doc__text div:has(> h2)) > h2:first-of-type + * {
  --framer-font-size: 22px;
  --framer-line-height: 1.5em;
  --framer-text-color: var(--color-ink);
  font-size: 22px;
  line-height: 1.5;
  letter-spacing: -0.005em;
  color: var(--color-ink);
}

.arc-legal .legal-doc__text :is(h3, h4) { font-size: var(--fs-body); font-weight: var(--weight-semibold); color: var(--color-ink); }
.arc-legal .legal-doc__text strong { font-weight: var(--weight-semibold); color: var(--color-ink); }
.arc-legal .legal-doc__text a {
  --framer-link-text-color: var(--color-ink);
  --framer-link-text-decoration: underline;
  color: var(--color-ink);
  text-decoration: underline;
  text-decoration-thickness: 1px;
  text-underline-offset: 3px;
  text-decoration-color: rgba(21, 21, 21, 0.35);
}
@media (hover: hover) {
  .arc-legal .legal-doc__text a:hover { text-decoration-color: currentColor; }
}

/* Lists: a short dash, like the masthead's */
.arc-legal .legal-doc__text ul { display: grid; gap: var(--space-2); list-style: none; padding: 0; }
.arc-legal .legal-doc__text li { position: relative; margin: 0; padding-left: 22px; list-style: none; }
.arc-legal .legal-doc__text li::marker { content: none; }
.arc-legal .legal-doc__text li::before {
  content: "";
  position: absolute;
  left: 0;
  top: 14px;
  width: 10px;
  height: 1px;
  background: currentColor;
}
.arc-legal .legal-doc__text li > * { margin: 0; }

/* Tables (Cookie Policy: what is stored) */
.arc-legal .legal-doc__text table { width: 100%; border-collapse: collapse; font-size: 15px; line-height: 22px; }
.arc-legal .legal-doc__text :is(th, td) {
  --framer-font-size: 15px;
  --framer-line-height: 22px;
  padding: 12px 16px 12px 0;
  text-align: left;
  vertical-align: top;
  border: 0;
  border-bottom: 1px solid var(--legal-line);
  background: none;
}
.arc-legal .legal-doc__text :is(th, td) > * { margin: 0; font-size: 15px; line-height: 22px; }
.arc-legal .legal-doc__text tr:first-child :is(th, td) { padding-top: 0; }
/* First column: the name on one line in semibold ink, a second line (its kind) in grey; the last
   column (how long) keeps short values like "12 months" on one line */
.arc-legal .legal-doc__text :is(th, td):first-child > :first-child { font-weight: var(--weight-semibold); color: var(--color-ink); white-space: nowrap; }
.arc-legal .legal-doc__text :is(th, td):first-child > * + * { color: var(--color-text-muted); }
.arc-legal .legal-doc__text :is(th, td):last-child { min-width: 6.5em; padding-right: 0; }
.arc-legal .legal-doc__text tr:first-child :is(th, td) > :is(*, :first-child) { font-size: 13px; font-weight: var(--weight-medium); color: var(--legal-soft); white-space: normal; }

/* ---------- Tablet (810-1199): one column ---------- */
@container arc (max-width: 1199px) {
  .legal-doc { --legal-rule: calc(min(100cqw, var(--container-max)) - 2 * var(--gutter)); }
  .legal-doc__head { grid-template-columns: none; }
  .legal-doc__head .chip { grid-column: 1 / -1; margin-top: 0; }
  .legal-doc__title { grid-column: 1 / -1; grid-row: 2; padding-left: 0; font-size: 72px; }
  .legal-doc__lede { grid-column: 1 / span 9; padding-left: 0; font-size: 19px; margin-bottom: var(--space-7); }
  .legal-aside { grid-column: 1 / -1; position: static; padding-top: 0; margin-bottom: var(--space-8); }
  .legal-aside__card { padding: 0; border: 0; }
  .legal-aside__toc { display: none; }
  .arc-legal .legal-doc__text { grid-column: 1 / -1; grid-row: 4; padding-left: 0; }
  .arc-legal :is(.legal-doc__text, .legal-doc__text div:has(> h2)) > * { grid-column: 5 / -1; }
  .arc-legal :is(.legal-doc__text, .legal-doc__text div:has(> h2)) > h2 { grid-column: 1 / span 4; }
}

/* ---------- Phone (809 and below): headings over their text ---------- */
@container arc (max-width: 809px) {
  .legal-doc::after { margin-top: var(--space-9); }
  .legal-doc__title { font-size: 46px; letter-spacing: -0.03em; }
  .legal-doc__lede { grid-column: 1 / -1; font-size: 17px; }
  .arc-legal :is(.legal-doc__text, .legal-doc__text div:has(> h2)) > * { grid-column: 1 / -1; }
  .arc-legal :is(.legal-doc__text, .legal-doc__text div:has(> h2)) > h2 { grid-column: 1 / -1; grid-row-end: auto; margin-top: var(--space-6); padding: var(--space-5) 0 0; }
  .arc-legal :is(.legal-doc__text, .legal-doc__text div:has(> h2)) > h2 + * { margin-top: var(--space-3); padding-top: 0; }
  .arc-legal :is(.legal-doc__text, .legal-doc__text div:has(> h2)) > h2:first-of-type { padding-top: var(--space-5); }
  .arc-legal :is(.legal-doc__text, .legal-doc__text div:has(> h2)) > h2:first-of-type + * { padding-top: 0; }
  .arc-legal .legal-doc--lead :is(.legal-doc__text, .legal-doc__text div:has(> h2)) > h2:first-of-type + * { font-size: 19px; --framer-font-size: 19px; }
  .arc-legal .legal-doc__text :is(th, td) { padding-right: 10px; }
}
`

interface Props {
    title: string
    lede: string
    updated: string
    body: React.ReactNode
    lead: boolean
    chip: string
    updatedLabel: string
    updatedFallback: string
    tocLabel: string
    style?: React.CSSProperties
}

const SAMPLE = (
    <>
        <h2>First section</h2>
        <p>Connect Text to the Legal collection’s Text field. Every Heading 2 starts a section and appears in “On this page”.</p>
        <h2>Second section</h2>
        <p>Paragraphs, lists and tables run on the right of their heading.</p>
    </>
)

const DEFAULTS: Props = {
    title: "Privacy Policy",
    lede: "What we collect when you visit or write to us, why, and the choices you have.",
    updated: "",
    body: SAMPLE,
    lead: false,
    chip: "Legal",
    updatedLabel: "Last updated",
    updatedFallback: "To be confirmed",
    tocLabel: "On this page",
}

function slugify(s: string): string {
    const out = String(s || "")
        .toLowerCase()
        .normalize("NFKD")
        .replace(/[̀-ͯ]/g, "")
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "")
    return out || "section"
}

function formatDate(v: any): string {
    if (!v) return ""
    const d = new Date(v)
    if (isNaN(d.getTime())) return String(v)
    return new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" }).format(d)
}

type Entry = { id: string; label: string }

/**
 * @framerSupportedLayoutWidth any-prefer-fixed
 * @framerSupportedLayoutHeight auto
 */
export default function ArcoviaLegal(incoming: Partial<Props>) {
    const p = { ...DEFAULTS, ...incoming }
    const textRef = React.useRef<HTMLDivElement>(null)
    const [toc, setToc] = React.useState<Entry[]>([])
    const [current, setCurrent] = React.useState<string | null>(null)
    const jumped = React.useRef(false)

    // "On this page": the Heading 2s this component rendered, each given an id to jump to
    React.useEffect(() => {
        const box = textRef.current
        if (!box) return
        const read = () => {
            box.querySelectorAll("p, h2, h3").forEach((el) => {
                const filled = !!(el.textContent || "").trim()
                if (filled) {
                    if (!el.hasAttribute("data-filled")) el.setAttribute("data-filled", "")
                    if (el.hasAttribute("data-blank")) el.removeAttribute("data-blank")
                } else if (!el.closest("td, th, li") && !el.hasAttribute("data-blank")) {
                    el.setAttribute("data-blank", "")
                }
            })
            const seen: Record<string, number> = {}
            const list: Entry[] = []
            box.querySelectorAll("h2").forEach((h) => {
                const label = (h.textContent || "").trim()
                if (!label) return
                let id = slugify(label)
                seen[id] = (seen[id] || 0) + 1
                if (seen[id] > 1) id += "-" + seen[id]
                if (h.id !== id) h.id = id
                list.push({ id, label })
            })
            setToc((prev) => (JSON.stringify(prev) === JSON.stringify(list) ? prev : list))
        }
        read()
        const mo = new MutationObserver(read)
        mo.observe(box, { childList: true, subtree: true, characterData: true })
        return () => mo.disconnect()
    }, [])

    // The section you are reading: the last whose top has reached the line a jump lands it on
    React.useEffect(() => {
        const box = textRef.current
        if (!box || !toc.length || isStaticRender()) return
        const heads = () => toc.map((t) => box.querySelector("#" + CSS.escape(t.id)) as HTMLElement).filter(Boolean)
        let frame = 0
        const update = () => {
            frame = 0
            const hs = heads()
            if (!hs.length) return
            const margin = parseFloat(getComputedStyle(hs[0]).scrollMarginTop) || 0
            const line = Math.min(margin + 48, window.innerHeight * 0.5)
            let next: string | null = null
            hs.forEach((h) => {
                if (h.getBoundingClientRect().top <= line) next = h.id
            })
            const last = hs[hs.length - 1]
            const atEnd = window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 2
            if (atEnd && last.getBoundingClientRect().top < window.innerHeight) next = last.id
            setCurrent((c) => (c === next ? c : next))
        }
        const onScroll = () => {
            if (!frame) frame = requestAnimationFrame(update)
        }
        window.addEventListener("scroll", onScroll, { passive: true })
        window.addEventListener("resize", onScroll)
        update()
        // Arriving with #section in the address (e.g. Home's "See Disclosures"): go there once
        if (!jumped.current && location.hash.length > 1) {
            jumped.current = true
            const el = box.querySelector("#" + CSS.escape(decodeURIComponent(location.hash.slice(1))))
            if (el) requestAnimationFrame(() => (el as HTMLElement).scrollIntoView())
        }
        return () => {
            window.removeEventListener("scroll", onScroll)
            window.removeEventListener("resize", onScroll)
            if (frame) cancelAnimationFrame(frame)
        }
    }, [toc])

    const go = (e: React.MouseEvent, id: string) => {
        const box = textRef.current
        const el = box && (box.querySelector("#" + CSS.escape(id)) as HTMLElement)
        if (!el) return
        e.preventDefault()
        const reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches
        el.scrollIntoView({ behavior: reduce ? "auto" : "smooth" })
        try {
            history.replaceState(null, "", "#" + id)
        } catch (err) {}
    }

    const date = formatDate(p.updated)
    const body = typeof p.body === "string" ? <div dangerouslySetInnerHTML={{ __html: p.body }} /> : p.body

    return (
        <div className="arc arc-legal" style={p.style}>
            {baseStyle()}
            {cssTag("legal", LEGAL_CSS)}
            <section className={"legal-doc" + (p.lead ? " legal-doc--lead" : "")} aria-labelledby="legal-title">
                <div className="legal-doc__inner container">
                    <div className="legal-doc__head">
                        <p className="chip chip--side">{p.chip}</p>
                        <h1 className="legal-doc__title" id="legal-title">
                            {p.title}
                        </h1>
                    </div>
                    {p.lede ? <p className="legal-doc__lede">{p.lede}</p> : null}

                    <aside className="legal-aside" aria-label="About this document">
                        <div className="legal-aside__card">
                            <dl className="legal-aside__meta">
                                <div>
                                    <dt>{p.updatedLabel}</dt>
                                    <dd>{date || <span className="legal-todo">{p.updatedFallback}</span>}</dd>
                                </div>
                            </dl>
                            {toc.length > 0 ? (
                                <nav className="legal-aside__toc" aria-labelledby="legal-toc-label">
                                    <p className="legal-nav__label" id="legal-toc-label">
                                        {p.tocLabel}
                                    </p>
                                    <ol className="legal-nav__toc">
                                        {toc.map((t) => (
                                            <li key={t.id}>
                                                <a
                                                    className="legal-nav__link"
                                                    href={"#" + t.id}
                                                    aria-current={current === t.id ? "location" : undefined}
                                                    onClick={(e) => go(e, t.id)}
                                                >
                                                    {t.label}
                                                </a>
                                            </li>
                                        ))}
                                    </ol>
                                </nav>
                            ) : null}
                        </div>
                    </aside>

                    <div className="legal-doc__text" ref={textRef}>
                        {body}
                    </div>
                </div>
            </section>
        </div>
    )
}

addPropertyControls(ArcoviaLegal, {
    title: { type: ControlType.String, title: "Title", defaultValue: DEFAULTS.title },
    lede: { type: ControlType.String, title: "Line", displayTextArea: true, defaultValue: DEFAULTS.lede },
    updated: { type: ControlType.Date, title: "Last updated" },
    body: { type: ControlType.RichText, title: "Text" },
    lead: { type: ControlType.Boolean, title: "Large first", defaultValue: false, enabledTitle: "Yes", disabledTitle: "No" },
    chip: { type: ControlType.String, title: "Chip", defaultValue: DEFAULTS.chip },
    updatedLabel: { type: ControlType.String, title: "Date label", defaultValue: DEFAULTS.updatedLabel },
    updatedFallback: { type: ControlType.String, title: "No date", defaultValue: DEFAULTS.updatedFallback },
    tocLabel: { type: ControlType.String, title: "List label", defaultValue: DEFAULTS.tocLabel },
})
