"""Generate the What We Do page's Framer code components from site/services.html, the section
stylesheets and the section scripts, so the Framer page (/what-we-do) stays a faithful port of the
HTML. Follows the Home and About ports' conventions (ArcoviaBase: baseStyle, cssTag, sprite,
useArcoviaScript; @media (max-width) -> @container arc; 100vw -> 100cqw) and declares each
section's ground (data-bg) for the page's changing background (ArcoviaSurface), as on Home.

    python3 tools/framer-services.py        # writes review/framer/*.tsx (git-ignored)

Components: ArcoviaServicesHero (the concrete opening and the three path rows), ArcoviaPaths
(Founders, Investors, Institutions), ArcoviaSituations (Start from where you are), ArcoviaNarrative
(Narrative and positioning), ArcoviaMandate (How a mandate runs), ArcoviaGenesis (GENESIS, our
capital platform). The sectors line and the CTA are Home's ArcoviaSectors and ArcoviaClosing with
this page's copy in their controls.

Upload each file as text (Framer MCP create_upload_url, PUT the file), fetch() it inside a project
program and api.files.create()/write() it. IMAGES are the Blender renders already uploaded to the
Framer project (site/assets/mandate/, site/assets/paths/)."""
import json, os, re, html
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SITE = os.path.join(ROOT, 'site')
OUT = os.path.join(ROOT, 'review', 'framer')
os.makedirs(OUT, exist_ok=True)
IMAGES = {
    'prepare': 'https://framerusercontent.com/images/XVoOUgCYZjWLxBs3yiGSELltY.jpg',
    'outreach': 'https://framerusercontent.com/images/dMHPY46gUIBtJ32i5Qp6JBYbkOs.jpg',
    'diligence': 'https://framerusercontent.com/images/2PpyS5zHbzF1n787oZPBumTP9qY.jpg',
    'close': 'https://framerusercontent.com/images/WmWWp4lhFXUQSdAKy9i5XLxWA5Q.jpg',
    'founders': 'https://framerusercontent.com/images/Mp07qNvCZJev5JpmzAGm97UGN0.jpg',
    'investors': 'https://framerusercontent.com/images/U4ZqhiFhM4JPGQ9Keoyq9pfTW3A.jpg',
    'institutions': 'https://framerusercontent.com/images/5h9BAcMlrR8sIr3ykHXLO6k8u4.jpg',
}
page = open(SITE + '/services.html', encoding='utf-8').read()
styles = open(SITE + '/styles.css', encoding='utf-8').read()


def j(v): return json.dumps(v, ensure_ascii=False)
def text(s): return html.unescape(re.sub(r'<[^>]+>', '', s)).strip()
def dump(v): return json.dumps(v, ensure_ascii=False, indent=4).replace('\n', '\n    ')


def esc(c):
    return c.replace('\\', '\\\\').replace('`', '\\`').replace('${', '\\${')


def convert(c):
    c = c.replace('100vw', '100cqw')
    c = re.sub(r'@media \(max-width: (\d+)px\)', r'@container arc (max-width: \1px)', c)
    c = c.replace('url("../assets/concrete.jpg")', 'url("@@CONCRETE@@")')
    assert '../assets' not in c
    return esc(c).replace('@@CONCRETE@@', '${ASSETS.concrete}')


def css(name):
    return convert(open(f'{SITE}/sections/{name}.css', encoding='utf-8').read())


def section(name):
    m = re.search(r'<!-- SECTION:%s START.*?-->(.*?)<!-- SECTION:%s END -->' % (name, name), page, re.S)
    assert m, name
    return m.group(1)


def write(name, src):
    with open(os.path.join(OUT, name + '.tsx'), 'w', encoding='utf-8') as f:
        f.write(src)
    print('wrote review/framer/%s.tsx (%d bytes)' % (name, len(src.encode('utf-8'))))


PHOTO_TYPE = '''/** A ControlType.ResponsiveImage value, or a plain URL */
type Photo = string | { src?: string; srcSet?: string; alt?: string } | undefined
const photoSrc = (v: Photo) => (typeof v === "string" ? v : (v && v.src) || "")
/** One point per line in a text area */
const lines = (s: string | undefined) => String(s || "").split(/\\n+/).map((x) => x.trim()).filter(Boolean)'''

# ---------------------------------------------------------------- Opening
hero = section('services-hero')
h_chip = text(re.search(r'<p class="chip">(.*?)</p>', hero).group(1))
h_lines = [text(x) for x in re.findall(r'<span class="services-hero__line">(.*?)</span>', hero)]
h_lede = text(re.search(r'<p class="services-hero__lede">(.*?)</p>', hero, re.S).group(1))
h_rows = [{'label': text(l), 'link': h} for h, l in re.findall(r'<a class="path-rows__option" href="([^"]+)"><span class="path-rows__label">(.*?)</span>', hero)]
assert len(h_lines) == 2 and len(h_rows) == 3

write('ArcoviaServicesHero', '''/**
 * Arcovia: the What We Do page's opening (What We Do block 1).
 *
 * The About hero's structure, as the Team page's: a short opening on the home
 * hero's live concrete (ConcreteSurface: drifting sunlight and a soft cursor
 * light, no carving), the chip and the headline low on the left (cols 1-8, one
 * line each, a share of the grid width so it breaks the same at every desktop
 * width). The line and the buttons are placed as on Home's hero (ArcoviaHero,
 * Paths: Rows; the user asked for it): the line under the headline, the three
 * paths stacked on cols 9-12 as rows like the masthead's links (hairlines above,
 * between and below, an arrow at the end; on hover the label and the arrow slide
 * 12px in), the last row's line on the line's last baseline. Each row jumps to
 * its block further down the page (#founders, #investors, #institutions).
 * The concrete paints its own ground (WebGL), so the opening declares no data-bg,
 * like Home's hero: the changing background starts with the section after it.
 * On the Framer canvas (and without WebGL): the concrete photo with a soft
 * diagonal light band.
 * Generated by tools/framer-services.py from services.html (SECTION:services-hero)
 * and sections/services-hero.css.
 */
import * as React from "react"
import { addPropertyControls, ControlType } from "framer"
import { ASSETS, baseStyle, cssTag, sprite, useArcoviaScript, type Life } from "./ArcoviaBase.tsx"
import { ConcreteSurface } from "./ArcoviaConcrete.tsx"

const SERVICES_HERO_CSS = `''' + css('services-hero') + '''`

interface Row {
    label: string
    link: string
}

interface Props {
    chip: string
    line1: string
    line2: string
    lede: string
    rows: Row[]
    style?: React.CSSProperties
}

const DEFAULTS: Props = {
    chip: ''' + j(h_chip) + ''',
    line1: ''' + j(h_lines[0]) + ''',
    line2: ''' + j(h_lines[1]) + ''',
    lede: ''' + j(h_lede) + ''',
    rows: ''' + dump(h_rows) + ''',
}

/**
 * @framerSupportedLayoutWidth any-prefer-fixed
 * @framerSupportedLayoutHeight auto
 */
export default function ArcoviaServicesHero(incoming: Partial<Props>) {
    const p = { ...DEFAULTS, ...incoming }
    const rows = Array.isArray(p.rows) && p.rows.length ? p.rows : DEFAULTS.rows
    const ref = React.useRef<HTMLDivElement>(null)
    // Lay the slab out again whenever the copy changes
    const key = JSON.stringify([p.chip, p.line1, p.line2, p.lede, rows])
    useArcoviaScript(ref, (root, life) => initServicesHero(root, life), [key])

    return (
        <div className="arc arc-services-hero" ref={ref} style={p.style}>
            {baseStyle()}
            {cssTag("services-hero", SERVICES_HERO_CSS)}
            {sprite()}
            <section className="services-hero" data-hero="" aria-labelledby="services-hero-title">
                <canvas className="hero__canvas" aria-hidden="true"></canvas>

                <div className="services-hero__inner container">
                    <div className="services-hero__heading">
                        {p.chip ? <p className="chip">{p.chip}</p> : null}
                        <h1 className="services-hero__title" id="services-hero-title">
                            <span className="services-hero__line">{p.line1}</span>
                            {p.line2 ? <span className="services-hero__line">{p.line2}</span> : null}
                        </h1>
                        {p.lede ? <p className="services-hero__lede">{p.lede}</p> : null}
                    </div>

                    {/* Component: path-rows, as on Home's hero */}
                    <nav className="services-hero__paths path-rows" aria-label="Who are you?">
                        <ul className="path-rows__list">
                            {rows.map((r, i) => (
                                <li key={i}>
                                    <a className="path-rows__option" href={r.link || "#"}>
                                        <span className="path-rows__label">{r.label}</span>
                                        <svg className="path-rows__arrow" aria-hidden="true">
                                            <use href="#icon-arrow" />
                                        </svg>
                                    </a>
                                </li>
                            ))}
                        </ul>
                    </nav>
                </div>
            </section>
        </div>
    )
}

/* Behaviour (main.js, "Live concrete"): the home hero's ConcreteSurface on the section */
function initServicesHero(host: HTMLElement, life: Life) {
    const hero = host.querySelector<HTMLElement>("[data-hero]")
    if (!hero) return
    const concrete = new ConcreteSurface(hero, { canvas: ".hero__canvas", texture: ASSETS.concrete, scope: host })
    life.add(() => concrete.destroy())
    concrete.init()
    // The component can mount before Montserrat has loaded: lay the slab out again once it is in
    const fonts = (document as any).fonts
    if (fonts && fonts.addEventListener) life.on(fonts, "loadingdone", () => concrete.queueLayout())
}

addPropertyControls(ArcoviaServicesHero, {
    chip: { type: ControlType.String, title: "Chip", defaultValue: DEFAULTS.chip },
    line1: { type: ControlType.String, title: "Headline 1", defaultValue: DEFAULTS.line1 },
    line2: { type: ControlType.String, title: "Headline 2", defaultValue: DEFAULTS.line2 },
    lede: { type: ControlType.String, title: "Text", displayTextArea: true, defaultValue: DEFAULTS.lede },
    rows: {
        type: ControlType.Array,
        title: "Paths",
        control: {
            type: ControlType.Object,
            controls: {
                label: { type: ControlType.String, title: "Label" },
                link: { type: ControlType.String, title: "Link", description: "#founders, #investors or #institutions jump to the blocks below." },
            },
        },
        defaultValue: DEFAULTS.rows,
        maxCount: 4,
    },
})
''')

# ---------------------------------------------------------------- The three paths
paths_html = section('paths')
paths = []
for m in re.finditer(r'<article class="path-feature[^"]*" id="(\w+)".*?</article>', paths_html, re.S):
    a = m.group(0)
    paths.append({
        'id': m.group(1),
        'chip': text(re.search(r'<p class="chip">(.*?)</p>', a).group(1)),
        'title': text(re.search(r'<h2 class="path-feature__title"[^>]*>(.*?)</h2>', a, re.S).group(1)),
        'lede': text(re.search(r'<p class="path-feature__lede">(.*?)</p>', a, re.S).group(1)),
        'points': '\n'.join(text(x) for x in re.findall(r'<li>(.*?)</li>', a)),
        'button': text(re.search(r'path-feature__btn" href="[^"]*">(.*?)<svg', a, re.S).group(1)),
        'link': '/contact',
        'image': IMAGES[m.group(1)],
    })
assert [p['id'] for p in paths] == ['founders', 'investors', 'institutions'], paths

write('ArcoviaPaths', '''/**
 * Arcovia: the three paths on What We Do (Founders, Investors, Institutions).
 *
 * After the user's reference (a studio's split section: a large headline and its
 * line beside a big rounded panel holding an illustration), one block per path,
 * alternating as the user asked: the first and third text left and image right,
 * the second image left and text right. In our language, on white: the chip (the
 * path's name), the headline at the site's section-heading size, the brief's line,
 * the four points over hairlines, each with a tick (drawn in CSS: a mask on the
 * row's ::before), the primary button with the arrow; the panel a
 * Blender concrete render on the charcoal (tools/concrete-renders, path_*),
 * echoing the path picker's icons on Home: a bar chart, a held sphere, a vault.
 * Each block is its anchor (#founders, #investors, #institutions), which the
 * opening's rows and Home's path picker lead to. Still: no motion. Tablet and
 * phone: one column, the panel first and its text under it (tablet: a wide 16:9
 * panel with the whole render in its middle on the charcoal; phone: 6:5).
 * Declares its ground (data-bg="white") for the page's changing background.
 * Generated by tools/framer-services.py from services.html (SECTION:paths) and
 * sections/paths.css.
 */
import * as React from "react"
import { addPropertyControls, ControlType } from "framer"
import { baseStyle, cssTag, sprite } from "./ArcoviaBase.tsx"

const PATHS_CSS = `''' + css('paths') + '''`

''' + PHOTO_TYPE + '''

interface Path {
    id: string
    chip: string
    title: string
    lede: string
    points: string
    button: string
    link: string
    image?: Photo
}

interface Props {
    paths: Path[]
    style?: React.CSSProperties
}

const DEFAULTS: Props = {
    paths: ''' + dump(paths) + ''',
}

/**
 * @framerSupportedLayoutWidth any-prefer-fixed
 * @framerSupportedLayoutHeight auto
 */
export default function ArcoviaPaths(incoming: Partial<Props>) {
    const p = { ...DEFAULTS, ...incoming }
    const list = Array.isArray(p.paths) && p.paths.length ? p.paths : DEFAULTS.paths

    return (
        <div className="arc arc-paths" style={p.style}>
            {baseStyle()}
            {cssTag("paths", PATHS_CSS)}
            {sprite()}
            <section className="paths" data-bg="white" aria-label="Who we work with">
                <div className="container">
                    {list.map((it, i) => {
                        const src = photoSrc(it.image) || photoSrc(DEFAULTS.paths[i % DEFAULTS.paths.length].image)
                        const id = (it.id || "").replace(/^#/, "") || undefined
                        return (
                            <article className={i % 2 ? "path-feature path-feature--flip" : "path-feature"} id={id} aria-labelledby={id ? id + "-title" : undefined} key={i}>
                                <div className="path-feature__text">
                                    {it.chip ? <p className="chip">{it.chip}</p> : null}
                                    <h2 className="path-feature__title" id={id ? id + "-title" : undefined}>
                                        {it.title}
                                    </h2>
                                    {it.lede ? <p className="path-feature__lede">{it.lede}</p> : null}
                                    <ul className="path-feature__list">
                                        {lines(it.points).map((pt, k) => (
                                            <li key={k}>{pt}</li>
                                        ))}
                                    </ul>
                                    {it.button ? (
                                        <a className="btn btn--primary path-feature__btn" href={it.link || "/contact"}>
                                            {it.button}
                                            <svg className="btn__icon" aria-hidden="true">
                                                <use href="#icon-arrow" />
                                            </svg>
                                        </a>
                                    ) : null}
                                </div>
                                <div className="path-feature__media">
                                    <img src={src} alt="" width={1440} height={1200} loading="lazy" />
                                </div>
                            </article>
                        )
                    })}
                </div>
            </section>
        </div>
    )
}

addPropertyControls(ArcoviaPaths, {
    paths: {
        type: ControlType.Array,
        title: "Paths",
        control: {
            type: ControlType.Object,
            controls: {
                id: { type: ControlType.String, title: "Anchor", description: "The block's id: links to #founders land here." },
                chip: { type: ControlType.String, title: "Chip" },
                title: { type: ControlType.String, title: "Headline" },
                lede: { type: ControlType.String, title: "Text", displayTextArea: true },
                points: { type: ControlType.String, title: "Points", displayTextArea: true, description: "One per line." },
                button: { type: ControlType.String, title: "Button" },
                link: { type: ControlType.Link, title: "Button link" },
                image: { type: ControlType.ResponsiveImage, title: "Image" },
            },
        },
        defaultValue: DEFAULTS.paths,
        maxCount: 3,
        description: "Alternating: the second block puts its image on the left.",
    },
})
''')

# ---------------------------------------------------------------- Start from where you are
sit = section('situations')
s_title = text(re.search(r'<h2 class="situations__title"[^>]*>(.*?)</h2>', sit).group(1))
s_heads = [text(x) for x in re.findall(r'<th scope="col">(.*?)</th>', sit)]
s_rows = [{'situation': text(a), 'text': text(b)} for a, b in re.findall(r'<tr><th scope="row">(.*?)</th><td><span class="situations__text">(.*?)</span></td></tr>', sit)]
assert len(s_heads) == 2 and len(s_rows) == 5
# The shared data-table component lives in styles.css on the site; ArcoviaBase doesn't have it yet
dt = re.search(r'/\* ---------- Data table \(component: data-table\).*?\.data-table td \{ color: var\(--color-text\); \}\n', styles, re.S).group(0)

write('ArcoviaSituations', '''/**
 * Arcovia: "Start from where you are" on What We Do.
 *
 * The brief's five rows ("Your situation / What we do"), laid out like the Team
 * page's "The Arcovia team" table, as the user asked: on the neutral ground, the
 * heading at the Team table's size on one line, then a real table across the 12
 * columns (Your situation cols 1-4, What we do cols 5-12, its text capped so lines
 * stay readable), column labels on a band, a hairline on every cell edge. Tablet
 * keeps the table on the grid; phones get the brief's accordion instead (the same
 * rows as native details/summary, the first one open; component situation-list).
 * Declares its ground (data-bg="neutral") for the page's changing background.
 * Generated by tools/framer-services.py from services.html (SECTION:situations),
 * sections/situations.css and the data-table component in styles.css.
 */
import * as React from "react"
import { addPropertyControls, ControlType } from "framer"
import { baseStyle, cssTag } from "./ArcoviaBase.tsx"

const SITUATIONS_CSS = `''' + convert(dt) + '\n' + css('situations') + '''`

interface Row {
    situation: string
    text: string
}

interface Props {
    title: string
    head1: string
    head2: string
    rows: Row[]
    style?: React.CSSProperties
}

const DEFAULTS: Props = {
    title: ''' + j(s_title) + ''',
    head1: ''' + j(s_heads[0]) + ''',
    head2: ''' + j(s_heads[1]) + ''',
    rows: ''' + dump(s_rows) + ''',
}

/**
 * @framerSupportedLayoutWidth any-prefer-fixed
 * @framerSupportedLayoutHeight auto
 */
export default function ArcoviaSituations(incoming: Partial<Props>) {
    const p = { ...DEFAULTS, ...incoming }
    const rows = Array.isArray(p.rows) && p.rows.length ? p.rows : DEFAULTS.rows

    return (
        <div className="arc arc-situations" style={p.style}>
            {baseStyle()}
            {cssTag("situations", SITUATIONS_CSS)}
            <section className="situations" data-bg="neutral" id="situations" aria-labelledby="situations-title">
                <div className="container">
                    <h2 className="situations__title" id="situations-title">
                        {p.title}
                    </h2>
                    <div className="situations__scroll" role="region" aria-labelledby="situations-title" tabIndex={0}>
                        <table className="data-table">
                            <colgroup>
                                <col className="situations__col--situation" />
                                <col className="situations__col--service" />
                            </colgroup>
                            <thead>
                                <tr>
                                    <th scope="col">{p.head1}</th>
                                    <th scope="col">{p.head2}</th>
                                </tr>
                            </thead>
                            <tbody>
                                {rows.map((r, i) => (
                                    <tr key={i}>
                                        <th scope="row">{r.situation}</th>
                                        <td>
                                            <span className="situations__text">{r.text}</span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Phones: the same rows as an accordion (component situation-list) */}
                    <div className="situation-list">
                        {rows.map((r, i) => (
                            <details className="situation-list__item" open={i === 0} key={i}>
                                <summary className="situation-list__head">
                                    <span className="situation-list__name">{r.situation}</span>
                                    <span className="situation-list__icon" aria-hidden="true"></span>
                                </summary>
                                <p className="situation-list__text">{r.text}</p>
                            </details>
                        ))}
                    </div>
                </div>
            </section>
        </div>
    )
}

addPropertyControls(ArcoviaSituations, {
    title: { type: ControlType.String, title: "Heading", defaultValue: DEFAULTS.title },
    head1: { type: ControlType.String, title: "Column 1", defaultValue: DEFAULTS.head1 },
    head2: { type: ControlType.String, title: "Column 2", defaultValue: DEFAULTS.head2 },
    rows: {
        type: ControlType.Array,
        title: "Rows",
        control: {
            type: ControlType.Object,
            controls: {
                situation: { type: ControlType.String, title: "Situation" },
                text: { type: ControlType.String, title: "What we do", displayTextArea: true },
            },
        },
        defaultValue: DEFAULTS.rows,
    },
})
''')

# ---------------------------------------------------------------- Narrative and positioning
nar = section('narrative')
n_chip = text(re.search(r'<h2 class="chip narrative__chip"[^>]*>(.*?)</h2>', nar).group(1))
n_text = text(re.search(r'<p class="narrative__text" data-reveal>(.*?)</p>', nar, re.S).group(1))

write('ArcoviaNarrative', '''/**
 * Arcovia: "Narrative and positioning" on What We Do.
 *
 * Set like Home's second section, the statement (the user asked for it): a white
 * room, a screen tall, the brief's body set large (a share of the grid width, so it
 * breaks the same at every desktop width), regular weight. After the user's
 * reference (a studio's about block): the brief's headline is the chip on cols
 * 1-3, its top on the body's first cap height; the body on cols 4-12, its first
 * line one column further in. Tablet and phone: the chip above the body across
 * the full grid, the first line indented. As on Home, the stage pins while the text writes
 * itself in, letter by letter, with a soft fading front (28 letters, 24 opacity
 * steps), scroll-linked, so it runs back when scrolling up and fast scrolling
 * settles exactly. Off with reduced motion and below 1200 (the text in full); on
 * the Framer canvas the text in full.
 * Declares its ground (data-bg="white") for the page's changing background.
 * Generated by tools/framer-services.py from services.html (SECTION:narrative),
 * sections/narrative.css and narrative.js.
 */
import * as React from "react"
import { addPropertyControls, ControlType } from "framer"
import { baseStyle, cssTag, useArcoviaScript, type Life } from "./ArcoviaBase.tsx"

const NARRATIVE_CSS = `''' + css('narrative') + '''`

interface Props {
    chip: string
    text: string
    style?: React.CSSProperties
}

const DEFAULTS: Props = {
    chip: ''' + j(n_chip) + ''',
    text: ''' + j(n_text) + ''',
}

/**
 * @framerSupportedLayoutWidth any-prefer-fixed
 * @framerSupportedLayoutHeight auto
 */
export default function ArcoviaNarrative(incoming: Partial<Props>) {
    const p = { ...DEFAULTS, ...incoming }
    const ref = React.useRef<HTMLDivElement>(null)
    useArcoviaScript(ref, (root, life) => initNarrative(root, life), [p.text])

    return (
        <div className="arc arc-narrative" ref={ref} style={p.style}>
            {baseStyle()}
            {cssTag("narrative", NARRATIVE_CSS)}
            <section className="narrative" data-bg="white" id="narrative" data-narrative="" aria-labelledby="narrative-title">
                <div className="narrative__stage">
                    <div className="narrative__inner">
                        <h2 className="chip narrative__chip" id="narrative-title">
                            {p.chip}
                        </h2>
                        {/* Keyed on the text: the script splits it into letters, so new copy starts afresh */}
                        <p className="narrative__text" data-reveal="" key={p.text}>
                            {p.text}
                        </p>
                    </div>
                </div>
            </section>
        </div>
    )
}

/* ==========================================================================
   Behaviour (narrative.js): the stage pins for --narrative-travel and the text
   writes itself in, as Home's statement does (zoom.js): each letter in a span
   (inside a span per word, so words never break), invisible -> fading in ->
   solid, a soft front a few words wide. Progress runs from the section's top a
   quarter of the screen down to 85% of the pin.
   ========================================================================== */
function initNarrative(host: HTMLElement, life: Life) {
    const section = host.querySelector<HTMLElement>("[data-narrative]")
    const reveal = section && section.querySelector<HTMLElement>("[data-reveal]")
    if (!section || !reveal) return
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return
    // Desktop only, as the stylesheet's container queries: the component's own width, not the window
    if (host.getBoundingClientRect().width < 1200) return

    const FRONT = 28
    const STEPS = 24
    const chars: Array<{ el: HTMLElement; q: number }> = []
    const walker = document.createTreeWalker(reveal, NodeFilter.SHOW_TEXT)
    const nodes: Text[] = []
    while (walker.nextNode()) nodes.push(walker.currentNode as Text)
    nodes.forEach((node) => {
        const frag = document.createDocumentFragment()
        node.data.split(/(\\s+)/).forEach((part) => {
            if (!part) return
            if (/^\\s+$/.test(part)) {
                frag.appendChild(document.createTextNode(part))
                return
            }
            const word = document.createElement("span")
            word.className = "w"
            Array.prototype.forEach.call(part, (ch: string) => {
                const span = document.createElement("span")
                span.className = "c"
                span.textContent = ch
                word.appendChild(span)
                chars.push({ el: span, q: -1 })
            })
            frag.appendChild(word)
        })
        if (node.parentNode) node.parentNode.replaceChild(frag, node)
    })
    reveal.classList.add("is-split")
    section.classList.add("narrative--on")
    life.add(() => section.classList.remove("narrative--on"))

    const paint = (c: { el: HTMLElement; q: number }, v: number) => {
        const q = v <= 0 ? 0 : v >= 1 ? STEPS : Math.min(STEPS - 1, Math.max(1, Math.round(v * STEPS)))
        if (q === c.q) return
        c.q = q
        c.el.style.opacity = q === STEPS ? "1" : Math.pow(q / STEPS, 1.4).toFixed(3)
    }

    let queued = false
    const render = () => {
        queued = false
        const vh = window.innerHeight
        const r = section.getBoundingClientRect()
        const travel = Math.max(1, section.offsetHeight - vh)
        const start = vh * 0.25
        const end = -travel * 0.85
        const p = Math.min(1, Math.max(0, (start - r.top) / (start - end)))
        const front = p * (chars.length + FRONT)
        chars.forEach((c, i) => paint(c, (front - i) / FRONT))
    }
    const queue = () => {
        if (queued) return
        queued = true
        life.raf(render)
    }
    life.on(window, "scroll", queue, { passive: true })
    life.on(window, "resize", queue)
    render()
}

addPropertyControls(ArcoviaNarrative, {
    chip: { type: ControlType.String, title: "Headline (chip)", defaultValue: DEFAULTS.chip },
    text: { type: ControlType.String, title: "Body", displayTextArea: true, defaultValue: DEFAULTS.text },
})
''')

# ---------------------------------------------------------------- How a mandate runs
md = section('mandate')
m_title = text(re.search(r'<h2 class="mandate__title"[^>]*>(.*?)</h2>', md).group(1))
m_lede = text(re.search(r'<p class="mandate__lede">(.*?)</p>', md, re.S).group(1))
steps = []
for a in re.findall(r'<article class="mandate-card".*?</article>', md, re.S):
    img = re.search(r'assets/mandate/(\w+)\.jpg', a).group(1)
    steps.append({
        'title': text(re.search(r'<h3 class="mandate-card__title"[^>]*>(.*?)</h3>', a).group(1)),
        'items': '\n'.join(text(x) for x in re.findall(r'<li>(.*?)</li>', a)),
        'image': IMAGES[img],
    })
assert len(steps) == 4

write('ArcoviaMandate', '''/**
 * Arcovia: "How a mandate runs" on What We Do.
 *
 * The brief's four steps, laid out after the user's reference video (a template's
 * services section: the heading and a line held on the left while a column of
 * cards goes by on the right, each card a number, a title and a list over
 * hairlines beside a render; as a card comes up it slides in from the right and
 * brightens from dim to full). In our language, on the neutral grey (the user
 * asked for grey instead of the concrete): white rounded cards, each with a
 * concrete render on the charcoal made in Blender (tools/concrete-renders,
 * mandate_*): a file rack, a fan of plates on one pin, two blocks cut to fit,
 * an arch with its keystone. The heading on cols 1-4 stays in view (sticky)
 * while the cards go by on cols 5-12. The slide-in is scroll-linked, so it runs
 * back when scrolling up; at rest the cards have no transform. Off with reduced
 * motion and below 1200; on the Framer canvas the cards simply sit.
 * Declares its ground (data-bg="neutral") for the page's changing background.
 * Generated by tools/framer-services.py from services.html (SECTION:mandate),
 * sections/mandate.css and mandate.js.
 */
import * as React from "react"
import { addPropertyControls, ControlType } from "framer"
import { baseStyle, cssTag, useArcoviaScript, type Life } from "./ArcoviaBase.tsx"

const MANDATE_CSS = `''' + css('mandate') + '''`

''' + PHOTO_TYPE + '''

interface Step {
    title: string
    items: string
    image?: Photo
}

interface Props {
    title: string
    lede: string
    steps: Step[]
    style?: React.CSSProperties
}

const DEFAULTS: Props = {
    title: ''' + j(m_title) + ''',
    lede: ''' + j(m_lede) + ''',
    steps: ''' + dump(steps) + ''',
}

/**
 * @framerSupportedLayoutWidth any-prefer-fixed
 * @framerSupportedLayoutHeight auto
 */
export default function ArcoviaMandate(incoming: Partial<Props>) {
    const p = { ...DEFAULTS, ...incoming }
    const steps = Array.isArray(p.steps) && p.steps.length ? p.steps : DEFAULTS.steps
    const ref = React.useRef<HTMLDivElement>(null)
    useArcoviaScript(ref, (root, life) => initMandate(root, life), [steps.length])

    return (
        <div className="arc arc-mandate" ref={ref} style={p.style}>
            {baseStyle()}
            {cssTag("mandate", MANDATE_CSS)}
            <section className="mandate" data-bg="neutral" id="how-a-mandate-runs" data-mandate="" aria-labelledby="mandate-title">
                <div className="mandate__inner container">
                    <div className="mandate__head">
                        <h2 className="mandate__title" id="mandate-title">
                            {p.title}
                        </h2>
                        {p.lede ? <p className="mandate__lede">{p.lede}</p> : null}
                    </div>

                    <ol className="mandate__steps">
                        {steps.map((s, i) => {
                            const src = photoSrc(s.image) || photoSrc(DEFAULTS.steps[i % DEFAULTS.steps.length].image)
                            return (
                                <li key={i}>
                                    <article className="mandate-card" aria-labelledby={"mandate-" + (i + 1)}>
                                        <div className="mandate-card__text">
                                            <p className="mandate-card__num" aria-hidden="true">
                                                {String(i + 1).padStart(2, "0")}
                                            </p>
                                            <h3 className="mandate-card__title" id={"mandate-" + (i + 1)}>
                                                {s.title}
                                            </h3>
                                            <ul className="mandate-card__list">
                                                {lines(s.items).map((it, k) => (
                                                    <li key={k}>{it}</li>
                                                ))}
                                            </ul>
                                        </div>
                                        <div className="mandate-card__media">
                                            <img src={src} alt="" width={1200} height={1200} loading="lazy" />
                                        </div>
                                    </article>
                                </li>
                            )
                        })}
                    </ol>
                </div>
            </section>
        </div>
    )
}

/* ==========================================================================
   Behaviour (mandate.js): each card slides in from the right (96px) and
   brightens (0.22 -> 1) as it comes up, eased out, scroll-linked: it starts as
   the card's top enters the bottom of the screen and has arrived when its top
   is 45% of the way up (measured on the card's li, so the transform doesn't
   feed back). At rest no transform or opacity.
   ========================================================================== */
function initMandate(host: HTMLElement, life: Life) {
    const section = host.querySelector<HTMLElement>("[data-mandate]")
    if (!section) return
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return
    if (host.getBoundingClientRect().width < 1200) return
    const cards = Array.prototype.slice.call(section.querySelectorAll(".mandate-card")) as HTMLElement[]
    if (!cards.length) return

    const SHIFT = 96
    const DIM = 0.22
    const state = cards.map(() => -1)
    life.add(() =>
        cards.forEach((c) => {
            c.style.transform = ""
            c.style.opacity = ""
        })
    )

    let queued = false
    const render = () => {
        queued = false
        const vh = window.innerHeight
        const from = vh
        const to = vh * 0.45
        cards.forEach((card, i) => {
            const li = card.parentNode as HTMLElement
            const top = li.getBoundingClientRect().top
            const t = Math.min(1, Math.max(0, (from - top) / (from - to)))
            const e = 1 - Math.pow(1 - t, 3)
            const q = Math.round(e * 400) / 400
            if (q === state[i]) return
            state[i] = q
            if (q >= 1) {
                card.style.transform = ""
                card.style.opacity = ""
            } else {
                card.style.transform = "translate3d(" + ((1 - q) * SHIFT).toFixed(1) + "px,0,0)"
                card.style.opacity = (DIM + (1 - DIM) * q).toFixed(3)
            }
        })
    }
    const queue = () => {
        if (queued) return
        queued = true
        life.raf(render)
    }
    life.on(window, "scroll", queue, { passive: true })
    life.on(window, "resize", queue)
    render()
}

addPropertyControls(ArcoviaMandate, {
    title: { type: ControlType.String, title: "Heading", defaultValue: DEFAULTS.title },
    lede: { type: ControlType.String, title: "Text", displayTextArea: true, defaultValue: DEFAULTS.lede },
    steps: {
        type: ControlType.Array,
        title: "Steps",
        control: {
            type: ControlType.Object,
            controls: {
                title: { type: ControlType.String, title: "Title" },
                items: { type: ControlType.String, title: "Points", displayTextArea: true, description: "One per line." },
                image: { type: ControlType.ResponsiveImage, title: "Image" },
            },
        },
        defaultValue: DEFAULTS.steps,
        maxCount: 6,
    },
})
''')

# ---------------------------------------------------------------- GENESIS
gen = section('genesis')
g_title = text(re.search(r'<h2 class="genesis__title"[^>]*>(.*?)</h2>', gen).group(1))
g_lede = text(re.search(r'<p class="genesis__lede">(.*?)</p>', gen, re.S).group(1))
g_note = text(re.search(r'<p class="genesis__note">(.*?)</p>', gen, re.S).group(1))
g_items = [{'title': text(a), 'text': text(b)} for a, b in re.findall(r'<h3 class="genesis-card__name">(.*?)</h3>\s*<p class="genesis-card__text">(.*?)</p>', gen, re.S)]
g_art = re.findall(r'<svg class="genesis-card__art" viewBox="0 0 160 120" aria-hidden="true">(.*?)</svg>', gen, re.S)
g_notes = re.findall(r'<p class="genesis-card__num" aria-hidden="true">\d\d</p>\s*<!-- (.*?) -->', gen, re.S)
assert len(g_items) == 4 and len(g_art) == 4 and len(g_notes) == 4

write('ArcoviaGenesis', '''/**
 * Arcovia: "GENESIS, our capital platform" on What We Do (the brief's "The
 * technology behind the process").
 *
 * Laid out like About's "What we believe" (the user asked for it): on white, the
 * heading with the brief's body under it, then four columns behind vertical
 * hairlines, each a small number, a fine isometric drawing, a title and its line,
 * lined up across the columns (subgrid); then the brief's footnote. The drawings
 * come from the same renderer as About's (tools/iso-art.py genesis): one 30°
 * angle, ink lines that stay 1px, white tops and fronts, concrete sides, one
 * charcoal top. Still: no motion. Tablet: two columns, still lined up across
 * each row; phone: one card under the other.
 * Declares its ground (data-bg="white") for the page's changing background.
 * Generated by tools/framer-services.py from services.html (SECTION:genesis) and
 * sections/genesis.css.
 */
import * as React from "react"
import { addPropertyControls, ControlType } from "framer"
import { baseStyle, cssTag } from "./ArcoviaBase.tsx"

const GENESIS_CSS = `''' + css('genesis') + '''`

/** The four drawings (viewBox 0 0 160 120), in order. Change them in tools/iso-art.py (genesis), not by hand. */
const ART = [
''' + ',\n'.join('    // ' + note.strip() + '\n    ' + j(art) for note, art in zip(g_notes, g_art)) + '''
]

interface Item {
    title: string
    text: string
}

interface Props {
    title: string
    lede: string
    items: Item[]
    note: string
    style?: React.CSSProperties
}

const DEFAULTS: Props = {
    title: ''' + j(g_title) + ''',
    lede: ''' + j(g_lede) + ''',
    items: ''' + dump(g_items) + ''',
    note: ''' + j(g_note) + ''',
}

/**
 * @framerSupportedLayoutWidth any-prefer-fixed
 * @framerSupportedLayoutHeight auto
 */
export default function ArcoviaGenesis(incoming: Partial<Props>) {
    const p = { ...DEFAULTS, ...incoming }
    const items = Array.isArray(p.items) && p.items.length ? p.items : DEFAULTS.items

    return (
        <div className="arc arc-genesis" style={p.style}>
            {baseStyle()}
            {cssTag("genesis", GENESIS_CSS)}
            <section className="genesis" data-bg="white" id="genesis" aria-labelledby="genesis-title">
                <div className="genesis__inner container">
                    <div className="genesis__head">
                        <h2 className="genesis__title" id="genesis-title">
                            {p.title}
                        </h2>
                        {p.lede ? <p className="genesis__lede">{p.lede}</p> : null}
                    </div>

                    <ol className="genesis__list">
                        {items.map((it, i) => (
                            <li className="genesis-card" key={i}>
                                <p className="genesis-card__num" aria-hidden="true">
                                    {String(i + 1).padStart(2, "0")}
                                </p>
                                <svg className="genesis-card__art" viewBox="0 0 160 120" aria-hidden="true" dangerouslySetInnerHTML={{ __html: ART[i % ART.length] }} />
                                <h3 className="genesis-card__name">{it.title}</h3>
                                <p className="genesis-card__text">{it.text}</p>
                            </li>
                        ))}
                    </ol>

                    {p.note ? <p className="genesis__note">{p.note}</p> : null}
                </div>
            </section>
        </div>
    )
}

addPropertyControls(ArcoviaGenesis, {
    title: { type: ControlType.String, title: "Heading", defaultValue: DEFAULTS.title },
    lede: { type: ControlType.String, title: "Text", displayTextArea: true, defaultValue: DEFAULTS.lede },
    items: {
        type: ControlType.Array,
        title: "Cards",
        control: {
            type: ControlType.Object,
            controls: {
                title: { type: ControlType.String, title: "Title" },
                text: { type: ControlType.String, title: "Text", displayTextArea: true },
            },
        },
        defaultValue: DEFAULTS.items,
        maxCount: 4,
        description: "Four, in order: each has its own drawing.",
    },
    note: { type: ControlType.String, title: "Footnote", displayTextArea: true, defaultValue: DEFAULTS.note },
})
''')

# ---------------------------------------------------------------- Sectors and CTA (Home's components): the copy for their controls
sec = section('sectors')
cta = section('closing')
copy = {
    'sectors': [text(x) for x in re.findall(r'<li class="sectors__item" data-carve="text">(.*?)</li>', sec)],
    'closing': {
        'title': text(re.search(r'<h2 class="closing__title"[^>]*>(.*?)</h2>', cta).group(1)),
        'body': text(re.search(r'<p class="closing__body">(.*?)</p>', cta, re.S).group(1)),
        'buttonLabel': text(re.search(r'closing__btn" href="[^"]*">(.*?)<svg', cta, re.S).group(1)),
        'buttonLink': '/contact',
    },
}
with open(os.path.join(OUT, 'services-copy.json'), 'w', encoding='utf-8') as f:
    json.dump(copy, f, ensure_ascii=False, indent=2)
print('wrote review/framer/services-copy.json')
