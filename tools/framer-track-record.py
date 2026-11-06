"""Generate the Track Record page's Framer code components from the HTML, so Framer stays a faithful
port: ArcoviaTrackHero (site/track-record.html SECTION:track-hero, sections/track-hero.css) and
ArcoviaCase (the case template: tools/case-pages.py's copy, sections/selected-work.css for the book,
sections/case.css and case.js). Follows the About port's conventions (ArcoviaBase: baseStyle, cssTag,
sprite, useArcoviaScript; @media (max-width) -> @container arc; 100vw -> 100cqw).

    python3 tools/framer-track-record.py     # writes review/framer/ArcoviaTrackHero.tsx, ArcoviaCase.tsx

Then upload each file as text (Framer MCP create_upload_url, PUT the file), fetch() it inside a project
program and api.files.write() it. In Framer the case's copy comes from the Cases CMS collection: the
defaults here are only what the canvas shows before the controls are connected.

Framer differences from the HTML, on purpose:
- The opening is gated in CSS instead of by a head script: the component renders data-intro (not on the
  canvas), and on desktop without reduced motion its CSS hides the case behind the black veil until the
  script plays; if the script never runs, CSS reveals everything after 2.6 s. The masthead is hidden with
  html:has(...) for the same span.
- The other editions are an array control set once on the template page's instance (the component
  leaves out the edition it shows), not generated per page.
- BOOKS are the book faces already uploaded to the project (the same as ArcoviaSelectedWork's)."""
import json, os, re
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SITE = os.path.join(ROOT, 'site')
OUT = os.path.join(ROOT, 'review', 'framer')
os.makedirs(OUT, exist_ok=True)
BOOKS = {
    'cover-concrete': 'https://framerusercontent.com/images/xpd0ie0VyvOOMHZ5ZbYk7RoU2mg.jpg',
    'spine-concrete': 'https://framerusercontent.com/images/nCHtdPAQkNvKovnHsTwVkXOxkc.jpg',
    'cover-charcoal': 'https://framerusercontent.com/images/11jleDdOmcfXbH7ZLPeCwffWYs.jpg',
    'spine-charcoal': 'https://framerusercontent.com/images/yHIEGG2vYkh5xCE0mR4pUV2RzQ.jpg',
    'cover-paper': 'https://framerusercontent.com/images/d3wIK5E061h9Kcp89ANg80Dq1U.jpg',
    'spine-paper': 'https://framerusercontent.com/images/kwEEkcOyOPiK0op4ANkkpiXOI0.jpg',
}

def j(v): return json.dumps(v, ensure_ascii=False)

def tsx_css(c, books=False):
    c = c.replace('100vw', '100cqw')
    c = re.sub(r'@media \(max-width: (\d+)px\)', r'@container arc (max-width: \1px)', c)
    c = c.replace('url("../assets/concrete.jpg")', 'url("@@CONCRETE@@")')
    if books:
        for k, u in BOOKS.items():
            c = c.replace(f'url("../assets/books/{k}.jpg")', f'url("{u}")')
    assert 'url("../assets' not in c, 'unmapped asset'
    c = c.replace('\\', '\\\\').replace('`', '\\`').replace('${', '\\${')
    return c.replace('@@CONCRETE@@', '${ASSETS.concrete}')

def read(p): return open(p, encoding='utf-8').read()

# ---------------------------------------------------------------- the copy
gen = read(os.path.join(ROOT, 'tools', 'case-pages.py'))
ns = {}
exec(gen[gen.index('CASES = ['):gen.index('src = open("track-record.html")')], ns)
CASES = ns['CASES']
EYE_SCAN = eval(re.search(r"^EYE_SCAN = (.*)$", gen, re.M).group(1))
about = read(os.path.join(SITE, 'about.html'))
TARGET = re.search(r'<symbol id="icon-story-point" viewBox="0 0 24 24">(.*?)</symbol>', about, re.S).group(1)
index = read(os.path.join(SITE, 'index.html'))
CHART = re.search(r'<symbol id="icon-raise" viewBox="0 0 24 24">(.*?)</symbol>', index, re.S).group(1)
CASE_SPRITE = (
    '<symbol id="icon-case-situation" viewBox="0 0 24 24">' + EYE_SCAN + '</symbol>'
    '<symbol id="icon-case-approach" viewBox="0 0 24 24">' + TARGET + '</symbol>'
    '<symbol id="icon-case-outcome" viewBox="0 0 24 24">' + CHART + '</symbol>'
)

tr = read(os.path.join(SITE, 'track-record.html'))
hero = re.search(r'<!-- SECTION:track-hero START.*?-->(.*?)<!-- SECTION:track-hero END -->', tr, re.S).group(1)
chip = re.search(r'<p class="chip track-hero__chip">(.*?)</p>', hero).group(1)
title = re.search(r'<h1 class="track-hero__title" id="track-title">(.*?)</h1>', hero).group(1)
lede = re.search(r'<p class="track-hero__lede">(.*?)</p>', hero, re.S).group(1)

# ---------------------------------------------------------------- ArcoviaTrackHero
track_hero = '''/**
 * Arcovia: the Track Record page's opening (Track Record block 1).
 *
 * The About hero's structure, kept by the user over a carved version: a short
 * opening, at least two thirds of the screen, on the home hero's live concrete
 * (ConcreteSurface: drifting sunlight and a soft cursor light, no carving). The
 * chip and the H1 sit low on the left (cols 1-8); the line on the right
 * (cols 9-12) ends on the H1's baseline. The H1 is two words, so it is set at the
 * Contact headline's size (7% of the grid width). No text animation.
 * On the Framer canvas (and without WebGL): the concrete photo with a soft
 * diagonal light band.
 * Generated by tools/framer-track-record.py from track-record.html
 * (SECTION:track-hero) and sections/track-hero.css.
 */
import * as React from "react"
import { addPropertyControls, ControlType } from "framer"
import { ASSETS, baseStyle, cssTag, useArcoviaScript, type Life } from "./ArcoviaBase.tsx"
import { ConcreteSurface } from "./ArcoviaConcrete.tsx"

const TRACK_HERO_CSS = `''' + tsx_css(read(os.path.join(SITE, 'sections', 'track-hero.css'))) + '''`

interface Props {
    chip: string
    title: string
    lede: string
    style?: React.CSSProperties
}

const DEFAULTS: Props = {
    chip: ''' + j(chip) + ''',
    title: ''' + j(title) + ''',
    lede: ''' + j(lede) + ''',
}

/**
 * @framerSupportedLayoutWidth any-prefer-fixed
 * @framerSupportedLayoutHeight auto
 */
export default function ArcoviaTrackHero(incoming: Partial<Props>) {
    const p = { ...DEFAULTS, ...incoming }
    const ref = React.useRef<HTMLDivElement>(null)
    const key = JSON.stringify([p.chip, p.title, p.lede])
    useArcoviaScript(ref, (root, life) => initTrackHero(root, life), [key])

    return (
        <div className="arc arc-track-hero" ref={ref} style={p.style}>
            {baseStyle()}
            {cssTag("track-hero", TRACK_HERO_CSS)}
            <section className="track-hero" data-hero="" aria-labelledby="track-title">
                <canvas className="hero__canvas" aria-hidden="true"></canvas>
                <div className="track-hero__inner container">
                    {p.chip ? <p className="chip track-hero__chip">{p.chip}</p> : null}
                    <h1 className="track-hero__title" id="track-title">{p.title}</h1>
                    <p className="track-hero__lede">{p.lede}</p>
                </div>
            </section>
        </div>
    )
}

/* The home hero's ConcreteSurface on the section (main.js, "Live concrete") */
function initTrackHero(host: HTMLElement, life: Life) {
    const hero = host.querySelector<HTMLElement>("[data-hero]")
    if (!hero) return
    const concrete = new ConcreteSurface(hero, { canvas: ".hero__canvas", texture: ASSETS.concrete, scope: host })
    life.add(() => concrete.destroy())
    concrete.init()
    const fonts = (document as any).fonts
    if (fonts && fonts.addEventListener) life.on(fonts, "loadingdone", () => concrete.queueLayout())
}

addPropertyControls(ArcoviaTrackHero, {
    chip: { type: ControlType.String, title: "Chip", defaultValue: DEFAULTS.chip },
    title: { type: ControlType.String, title: "Headline", defaultValue: DEFAULTS.title },
    lede: { type: ControlType.String, title: "Text", displayTextArea: true, defaultValue: DEFAULTS.lede },
})
'''

# ---------------------------------------------------------------- ArcoviaCase
case_css = read(os.path.join(SITE, 'sections', 'case.css'))
# The HTML's opening rules (head script + .case-intro) give way to the CSS gate below
a = case_css.index('/* ---------- Opening (case.js) ----------')
b = case_css.index('/* Tablet and phone')
case_css = case_css[:a] + case_css[b:]
GATE = '''
/* Every case is on white: in the HTML the page's body is white (body.page--white); in Framer
   the component paints it (the Site template's "White footer" makes the footer match) */
.arc-case { background: var(--color-white); }

/* ---------- Opening (Framer): gated in CSS ----------
   data-intro is rendered off the canvas. On desktop without reduced motion the
   case waits behind the black veil (the black of Selected work) with the book
   and the text hidden, and the masthead too; the script sets data-playing and
   plays the opening, then data-done. If the script never runs, everything shows
   itself after 2.6 s. Animations outrank inline styles, so they stop once the
   script plays. The component is a size container (layout containment), so the
   veil covers the component's box, which starts at the top of the page. */
.case__veil { display: none; }
@media (min-width: 1200px) and (prefers-reduced-motion: no-preference) {
  .arc-case[data-intro]:not([data-done]) .case__veil {
    display: block;
    position: fixed;
    inset: 0;
    z-index: 40;
    background: var(--color-black);
    pointer-events: none;
    animation: case-safety-out 1ms linear 2.6s forwards;
  }
  .arc-case[data-intro]:not([data-done]) .case__book { z-index: 45; }
  .arc-case[data-intro]:not([data-done]):not([data-playing]) .case__book,
  .arc-case[data-intro]:not([data-done]):not([data-playing]) [data-case-in] {
    opacity: 0;
    animation: case-safety-in 1ms linear 2.6s forwards;
  }
  html:has(.arc-case[data-intro]:not([data-done])) .site-header {
    opacity: 0;
    animation: case-safety-in 1ms linear 2.6s forwards;
  }
  .arc-case[data-playing] .case__veil,
  .arc-case[data-playing] [data-case-in],
  html:has(.arc-case[data-playing]) .site-header { animation: none; }
}
@keyframes case-safety-out { to { opacity: 0; visibility: hidden; } }
@keyframes case-safety-in { to { opacity: 1; } }
'''
book_css = read(os.path.join(SITE, 'sections', 'selected-work.css'))

behaviour = read(os.path.join(SITE, 'case.js'))
first = CASES[0]
EDITIONS = [{'no': c['no'], 'name': c['name'], 'figure': c['figure'], 'binding': c['tone'],
             'link': '/track-record/' + c['slug']} for c in CASES]

case_tsx = '''/**
 * Arcovia: a case's own page (Track Record, /track-record/:slug; component: case).
 *
 * One template for every edition, its copy from the Cases CMS collection. The
 * book from Selected work on the left (sticky, so it stays beside the text);
 * on the right the chip "Edition No. 0X", the name as the H1, client · sector ·
 * year, then Situation, Approach and Outcome, each an icon beside its label, a
 * large heading and the brief's text in grey (after the user's reference, a
 * product note), then the other editions as rows, each with its small book.
 * Every case is on white.
 *
 * Opening it, after the user's Stripe Press reference: the book comes across from
 * where it was clicked in Selected work (ArcoviaSelectedWork saves where it stood
 * in sessionStorage "arcovia_case_from"), or stands up on its spine in the middle
 * when the page is opened any other way; it turns as it travels to the left (its
 * spine, the head and fore-edge of the page block showing) and grows to its size,
 * an open cover closes, the black dissolves into the white page, then the text
 * and the masthead come in. One clock, 1150 ms across, about 2.2 s in all. At
 * rest the book has no transform, so its cover stays crisp.
 * Desktop only, not with reduced motion and not on the canvas: there the page is
 * simply as it rests.
 * Generated by tools/framer-track-record.py from tools/case-pages.py's copy,
 * sections/selected-work.css (the book), sections/case.css and case.js.
 */
import * as React from "react"
import { addPropertyControls, ControlType } from "framer"
import { baseStyle, cssTag, sprite, isStaticRender, useArcoviaScript, type Life } from "./ArcoviaBase.tsx"

const BOOK_CSS = `''' + tsx_css(book_css, books=True) + '''`

const CASE_CSS = `''' + tsx_css(case_css) + tsx_css(GATE) + '''`

/** Situation: Solar eye-scan; Approach: Solar target (both Bold Duotone, 480 Design, CC BY 4.0, via Iconify);
 *  Outcome: the path picker's bar chart. Light layers at 20%. */
const CASE_SPRITE = ''' + j(CASE_SPRITE) + '''

type Binding = "concrete" | "charcoal" | "paper"
const BINDINGS: Binding[] = ["concrete", "charcoal", "paper"]

interface Edition {
    no: string
    name: string
    figure: string
    binding: Binding
    link: string
}

interface Props {
    no: string
    name: string
    figure: string
    line: string
    binding: Binding
    client: string
    sector: string
    year: string
    chipLabel: string
    situationLabel: string
    situationHeading: string
    situation: string
    approachLabel: string
    approachHeading: string
    approach: string
    outcomeLabel: string
    outcomeHeading: string
    outcome: string
    editions: Edition[]
    style?: React.CSSProperties
}

const DEFAULTS: Props = {
    no: ''' + j(first['no']) + ''',
    name: ''' + j(first['name']) + ''',
    figure: ''' + j(first['figure']) + ''',
    line: ''' + j(first['line']) + ''',
    binding: ''' + j(first['tone']) + ''',
    client: ''' + j(first['meta'][0]) + ''',
    sector: ''' + j(first['meta'][1]) + ''',
    year: ''' + j(first['meta'][2]) + ''',
    chipLabel: "Edition No.",
    situationLabel: "Situation",
    situationHeading: ''' + j(first['situation'][0]) + ''',
    situation: ''' + j(first['situation'][1]) + ''',
    approachLabel: "Approach",
    approachHeading: ''' + j(first['approach'][0]) + ''',
    approach: ''' + j(first['approach'][1]) + ''',
    outcomeLabel: "Outcome",
    outcomeHeading: ''' + j(first['outcome'][0]) + ''',
    outcome: ''' + j(first['outcome'][1]) + ''',
    editions: ''' + j(EDITIONS) + ''',
}

function bindingOf(b: string, i = 0): Binding {
    return (BINDINGS as string[]).indexOf(b) >= 0 ? (b as Binding) : BINDINGS[i % 3]
}

function Book({ no, figure, name, line, binding }: { no: string; figure: string; name: string; line: string; binding: Binding }) {
    return (
        <div className={"book book--" + binding}>
            <div className="book__lift">
                <div className="book__body">
                    <div className="book__spine">
                        <p className="book__spine-text">
                            <span className="book__spine-figure">{figure}</span>
                            {name}
                        </p>
                        <svg className="book__spine-mark" viewBox="0 0 72 57">
                            <use href="#a-mark" />
                        </svg>
                    </div>
                    <span className="book__edge book__edge--head"></span>
                    <span className="book__edge book__edge--tail"></span>
                    <span className="book__edge book__edge--fore"></span>
                    <span className="book__pages"></span>
                    <span className="book__leaf" style={{ ["--k" as any]: 0.22 }}></span>
                    <span className="book__leaf" style={{ ["--k" as any]: 0.44 }}></span>
                    <span className="book__leaf" style={{ ["--k" as any]: 0.68 }}></span>
                    <div className="book__cover">
                        <div className="book__top">
                            <svg className="book__mark" viewBox="0 0 72 57">
                                <use href="#a-mark" />
                            </svg>
                            <span className="book__index">{no}</span>
                        </div>
                        <p className="book__figure">{figure}</p>
                        <p className="book__name">{name}</p>
                        <p className="book__line">{line}</p>
                    </div>
                </div>
            </div>
        </div>
    )
}

function Part({ id, label, heading, text }: { id: string; label: string; heading: string; text: string }) {
    if (!heading && !text) return null
    return (
        <section className="case__part" aria-labelledby={"case-" + id} data-case-in="">
            <p className="case__kicker">
                <svg className="case__kicker-icon" aria-hidden="true">
                    <use href={"#icon-case-" + id} />
                </svg>
                {label}
            </p>
            <h2 className="case__heading" id={"case-" + id}>
                {heading}
            </h2>
            {text ? <p className="case__text">{text}</p> : null}
        </section>
    )
}

/**
 * @framerSupportedLayoutWidth any-prefer-fixed
 * @framerSupportedLayoutHeight auto
 */
export default function ArcoviaCase(incoming: Partial<Props>) {
    const p = { ...DEFAULTS, ...incoming }
    const ref = React.useRef<HTMLDivElement>(null)
    const still = isStaticRender()
    const binding = bindingOf(p.binding)
    const meta = [p.client, p.sector, p.year].filter(Boolean)
    const same = (e: Edition) => (e.no && e.no === p.no) || (e.name && e.name === p.name)
    const others = (p.editions?.length ? p.editions : DEFAULTS.editions).filter((e) => !same(e))
    useArcoviaScript(ref, (root, life) => initCase(root, life), [p.no, p.name])

    return (
        <div className="arc arc-case" ref={ref} style={p.style} data-intro={still ? undefined : ""}>
            {baseStyle()}
            {cssTag("case-book", BOOK_CSS)}
            {cssTag("case", CASE_CSS)}
            {sprite()}
            <svg className="sprite" aria-hidden="true" focusable="false" dangerouslySetInnerHTML={{ __html: CASE_SPRITE }} />
            <article className={"case case--" + binding} data-case="" aria-labelledby="case-title">
                <div className="case__inner container">
                    <div className="case__media">
                        <div className="case__book" data-case-book="" aria-hidden="true">
                            <Book no={p.no} figure={p.figure} name={p.name} line={p.line} binding={binding} />
                        </div>
                    </div>

                    <div className="case__content">
                        <header className="case__head">
                            <p className="chip case__chip" data-case-in="">
                                {p.chipLabel} {p.no}
                            </p>
                            <h1 className="case__title" id="case-title" data-case-in="">
                                {p.name}
                            </h1>
                            {meta.length ? (
                                <p className="case__meta" data-case-in="">
                                    {meta.map((m, i) => (
                                        <React.Fragment key={i}>
                                            {i ? " " : null}
                                            <span>{i < meta.length - 1 ? m + "\\u00a0·" : m}</span>
                                        </React.Fragment>
                                    ))}
                                </p>
                            ) : null}
                        </header>

                        <Part id="situation" label={p.situationLabel} heading={p.situationHeading} text={p.situation} />
                        <Part id="approach" label={p.approachLabel} heading={p.approachHeading} text={p.approach} />
                        <Part id="outcome" label={p.outcomeLabel} heading={p.outcomeHeading} text={p.outcome} />

                        {others.length ? (
                            <nav className="case__others" aria-label="Other editions" data-case-in="">
                                <ul className="case__others-list">
                                    {others.map((e, i) => (
                                        <li key={i}>
                                            <a className="case__other" href={e.link || "#"}>
                                                <span className={"book book--mini book--" + bindingOf(e.binding, i)} aria-hidden="true">
                                                    <span className="book__cover">
                                                        <span className="book__top">
                                                            <svg className="book__mark" viewBox="0 0 72 57">
                                                                <use href="#a-mark" />
                                                            </svg>
                                                        </span>
                                                        <span className="book__figure">{e.figure}</span>
                                                    </span>
                                                </span>
                                                <span className="case__other-title">
                                                    <span className="case__other-no">
                                                        {p.chipLabel} {e.no}
                                                    </span>
                                                    <span className="case__other-name">{e.name}</span>
                                                </span>
                                                <span className="case__other-figure">{e.figure}</span>
                                                <svg className="case__other-arrow" aria-hidden="true">
                                                    <use href="#icon-arrow" />
                                                </svg>
                                            </a>
                                        </li>
                                    ))}
                                </ul>
                            </nav>
                        ) : null}
                    </div>
                </div>

                <div className="case__veil" aria-hidden="true"></div>
            </article>
        </div>
    )
}

/* ==========================================================================
   Behaviour (case.js): the book comes across and the case opens.
   ========================================================================== */
function initCase(host: HTMLElement, life: Life) {
    const sec = host.querySelector<HTMLElement>("[data-case]")
    const wrap = host.querySelector<HTMLElement>("[data-case-book]")
    const body = wrap && wrap.querySelector<HTMLElement>(".book__body")
    const cover = wrap && wrap.querySelector<HTMLElement>(".book__cover")
    const spine = wrap && wrap.querySelector<HTMLElement>(".book__spine")
    const veil = host.querySelector<HTMLElement>(".case__veil")
    const KEY = "arcovia_case_from"
    let from: any = null
    try {
        from = JSON.parse(sessionStorage.getItem(KEY) || "null")
        sessionStorage.removeItem(KEY)
    } catch (e) {
        from = null
    }
    const done = () => {
        host.removeAttribute("data-playing")
        host.setAttribute("data-done", "")
    }
    const desktop = window.matchMedia("(min-width: 1200px)").matches
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches
    // The CSS safety reveal may already have run (the script came late): leave the page as it is
    const late = (() => {
        const a = veil && (veil as any).getAnimations ? (veil as any).getAnimations()[0] : null
        return !!(a && typeof a.currentTime === "number" && a.currentTime > 2200)
    })()
    if (!sec || !wrap || !body || !cover || !spine || !veil || !desktop || reduced || late || wrap.offsetParent === null) {
        done()
        return
    }
    const leaves = Array.prototype.slice.call(wrap.querySelectorAll(".book__leaf")) as HTMLElement[]
    const header = document.querySelector<HTMLElement>("[data-header]")
    const items = Array.prototype.slice.call(host.querySelectorAll("[data-case-in]")) as HTMLElement[]
    if (header) items.push(header)

    // Coming from Selected work: the book stood where it was clicked (any edition: its slug is in the URL)
    if (from && !(Date.now() - from.t < 8000 && location.pathname.replace(/\\/$/, "").endsWith("/" + from.slug))) from = null

    const TRAVEL = 1150
    const VEIL = [0.38, 0.78]
    const TEXT_AT = 0.55
    const TEXT_STEP = 75
    const TEXT_MS = 560
    const RISE = 18
    const SWING = 24
    const LEAN = -9
    const ROLL = -2.5
    const clamp = (v: number, a: number, b: number) => (v < a ? a : v > b ? b : v)
    const ramp = (a: number, b: number, x: number) => clamp((x - a) / (b - a), 0, 1)
    const easeInOut = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2)
    const easeOut = (t: number) => 1 - Math.pow(1 - t, 3)
    const smooth = (t: number) => t * t * (3 - 2 * t)

    if ("scrollRestoration" in history) history.scrollRestoration = "manual"
    window.scrollTo(0, 0)
    const rest = wrap.getBoundingClientRect()
    const W = wrap.offsetWidth
    const H = wrap.offsetHeight
    const T = spine.offsetWidth || W * 0.24
    const fx = rest.left + rest.width / 2
    const fy = rest.top + rest.height / 2
    const start = from
        ? { x: from.x, y: from.y, s: from.h / H, deg: from.deg || 0, open: from.open || 0 }
        : { x: window.innerWidth / 2, y: window.innerHeight / 2, s: 0.86, deg: 90, open: 0 }
    const swing = start.deg < 45 ? SWING : 0

    function pose(k: number) {
        const e = easeInOut(k)
        const arc = Math.sin(Math.PI * e)
        const s = (start.s + (1 - start.s) * e) * (1 + 0.05 * arc)
        wrap!.style.transform = "translate(" + ((start.x - fx) * (1 - e)).toFixed(2) + "px," + ((start.y - fy) * (1 - e)).toFixed(2) + "px) scale(" + s.toFixed(4) + ")"
        const deg = start.deg * (1 - e) + swing * arc
        const rad = (deg * Math.PI) / 180
        const depth = -((W - T) / 2) * Math.sin(Math.abs(rad))
        body!.style.transform =
            "translateZ(" + (depth - T / 2).toFixed(2) + "px) rotateZ(" + (ROLL * arc).toFixed(3) + "deg) rotateX(" + (LEAN * arc).toFixed(3) + "deg) rotateY(" + deg.toFixed(3) + "deg) translateZ(" + (T / 2).toFixed(2) + "px)"
        cover!.style.setProperty("--lit", clamp(0.72 + 0.28 * (Math.cos(rad) - 0.55 * Math.sin(rad)), 0.55, 1).toFixed(3))
        spine!.style.setProperty("--lit", clamp(0.72 + 0.28 * (Math.sin(rad) + 0.55 * Math.cos(rad)), 0.55, 1).toFixed(3))
        const c = start.open * (1 - easeOut(ramp(0, 0.45, k)))
        cover!.style.transform = Math.abs(c) > 0.01 ? "rotateY(" + c.toFixed(3) + "deg)" : ""
        leaves.forEach((el) => {
            const f = parseFloat(el.style.getPropertyValue("--k")) || 0
            el.style.transform = Math.abs(c) > 0.01 ? "translateZ(" + (-3 + f * 3).toFixed(2) + "px) rotateY(" + (c * f).toFixed(3) + "deg)" : ""
        })
        veil!.style.opacity = (1 - smooth(ramp(VEIL[0], VEIL[1], k))).toFixed(3)
    }

    function text(ms: number) {
        items.forEach((el, i) => {
            const u = easeOut(ramp(0, TEXT_MS, ms - TRAVEL * TEXT_AT - i * TEXT_STEP))
            el.style.opacity = u.toFixed(3)
            if (el !== header) el.style.transform = u < 1 ? "translateY(" + ((1 - u) * RISE).toFixed(2) + "px)" : ""
        })
    }

    function finish() {
        ;[wrap!, body!, cover!].concat(leaves, items).forEach((el) => {
            el.style.transform = ""
            el.style.opacity = ""
        })
        cover!.style.removeProperty("--lit")
        spine!.style.removeProperty("--lit")
        veil!.style.opacity = ""
        wrap!.classList.remove("is-turning")
        done()
        if ("scrollRestoration" in history) history.scrollRestoration = "auto"
    }

    const END = TRAVEL * TEXT_AT + (items.length - 1) * TEXT_STEP + TEXT_MS
    const delay = from ? 40 : 180
    let t0 = 0
    function tick(now: number) {
        if (!t0) t0 = now + delay
        const ms = Math.max(0, now - t0)
        pose(clamp(ms / TRAVEL, 0, 1))
        text(ms)
        if (ms >= END) finish()
        else life.raf(tick)
    }

    // The first frame: the book where it was clicked, on black
    wrap.classList.add("is-turning")
    pose(0)
    text(0)
    host.setAttribute("data-playing", "")
    life.raf(tick)
    // Leaving mid-way (navigating on): never leave the page half drawn
    life.add(() => {
        if (!host.hasAttribute("data-done")) finish()
    })
}

addPropertyControls(ArcoviaCase, {
    no: { type: ControlType.String, title: "Edition", defaultValue: DEFAULTS.no },
    name: { type: ControlType.String, title: "Name", defaultValue: DEFAULTS.name },
    figure: { type: ControlType.String, title: "Figure", defaultValue: DEFAULTS.figure },
    line: { type: ControlType.String, title: "Cover line", displayTextArea: true, defaultValue: DEFAULTS.line },
    binding: {
        type: ControlType.Enum,
        title: "Binding",
        options: ["concrete", "charcoal", "paper"],
        optionTitles: ["Concrete", "Charcoal linen", "White paper"],
        defaultValue: DEFAULTS.binding,
    },
    client: { type: ControlType.String, title: "Client", defaultValue: DEFAULTS.client },
    sector: { type: ControlType.String, title: "Sector", defaultValue: DEFAULTS.sector },
    year: { type: ControlType.String, title: "Year", defaultValue: DEFAULTS.year },
    chipLabel: { type: ControlType.String, title: "Edition label", defaultValue: DEFAULTS.chipLabel },
    situationLabel: { type: ControlType.String, title: "Situation", defaultValue: DEFAULTS.situationLabel },
    situationHeading: { type: ControlType.String, title: "Situation heading", displayTextArea: true, defaultValue: DEFAULTS.situationHeading },
    situation: { type: ControlType.String, title: "Situation text", displayTextArea: true, defaultValue: DEFAULTS.situation },
    approachLabel: { type: ControlType.String, title: "Approach", defaultValue: DEFAULTS.approachLabel },
    approachHeading: { type: ControlType.String, title: "Approach heading", displayTextArea: true, defaultValue: DEFAULTS.approachHeading },
    approach: { type: ControlType.String, title: "Approach text", displayTextArea: true, defaultValue: DEFAULTS.approach },
    outcomeLabel: { type: ControlType.String, title: "Outcome", defaultValue: DEFAULTS.outcomeLabel },
    outcomeHeading: { type: ControlType.String, title: "Outcome heading", displayTextArea: true, defaultValue: DEFAULTS.outcomeHeading },
    outcome: { type: ControlType.String, title: "Outcome text", displayTextArea: true, defaultValue: DEFAULTS.outcome },
    editions: {
        type: ControlType.Array,
        title: "Editions",
        control: {
            type: ControlType.Object,
            controls: {
                no: { type: ControlType.String, title: "Edition" },
                name: { type: ControlType.String, title: "Name" },
                figure: { type: ControlType.String, title: "Figure" },
                binding: {
                    type: ControlType.Enum,
                    title: "Binding",
                    options: ["concrete", "charcoal", "paper"],
                    optionTitles: ["Concrete", "Charcoal linen", "White paper"],
                },
                link: { type: ControlType.Link, title: "Link" },
            },
        },
        defaultValue: DEFAULTS.editions,
    },
})
'''

for name, src in {'ArcoviaTrackHero.tsx': track_hero, 'ArcoviaCase.tsx': case_tsx}.items():
    open(os.path.join(OUT, name), 'w', encoding='utf-8').write(src)
    print(name, len(src.encode('utf-8')), 'bytes')
print('hero', chip, '|', title, '|', lede[:50])
print('editions', [e['link'] for e in EDITIONS])
