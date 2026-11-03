"""Generate the About page's Framer code components (ArcoviaAboutHero, ArcoviaStory, ArcoviaBeliefs,
ArcoviaProcess) from site/about.html, the section stylesheets and the section scripts, so the Framer
project stays a faithful port of the approved HTML. Follows the Home port's conventions (ArcoviaBase:
baseStyle, cssTag, useArcoviaScript; @media (max-width) -> @container arc; 100vw -> 100cqw).

    python3 tools/framer-about.py        # writes review/framer/*.tsx (git-ignored)

Then upload each file as text (Framer MCP create_upload_url, PUT the file), fetch() it inside a
project program and api.files.write() it over the existing file. PHOTOS are the Our story photos
already uploaded to the Framer project."""
import json, os, re, sys, html
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SITE = os.path.join(ROOT, 'site')
OUT = os.path.join(ROOT, 'review', 'framer')
os.makedirs(OUT, exist_ok=True)
PHOTOS = {
    'studio': 'https://framerusercontent.com/images/YB9EDGTHnalQR2xerd3P3coz0.jpg',
    'screening': 'https://framerusercontent.com/images/0weWwRYb6uTdiNHmu8GKOlsEalQ.jpg',
    'table': 'https://framerusercontent.com/images/d0gtmEkCCXmqoIF4gzYKmMe6VU.jpg',
    'edit': 'https://framerusercontent.com/images/5ymoMqPaCdtIOPqTBs065eidgE.jpg',
}
page = open(SITE + '/about.html', encoding='utf-8').read()

def j(v): return json.dumps(v, ensure_ascii=False)
def text(s): return html.unescape(re.sub(r'<[^>]+>', '', s)).strip()

def css(name):
    c = open(f'{SITE}/sections/{name}.css', encoding='utf-8').read()
    c = c.replace('100vw', '100cqw')
    c = re.sub(r'@media \(max-width: (\d+)px\)', r'@container arc (max-width: \1px)', c)
    c = c.replace('url("../assets/concrete.jpg")', 'url("@@CONCRETE@@")')
    assert '../assets' not in c, name
    c = c.replace('\\', '\\\\').replace('`', '\\`').replace('${', '\\${')
    return c.replace('@@CONCRETE@@', '${ASSETS.concrete}')

def section(name):
    m = re.search(r'<!-- SECTION:%s START.*?-->(.*?)<!-- SECTION:%s END -->' % (name, name), page, re.S)
    return m.group(1)

# ---------------------------------------------------------------- About hero
hero = section('about-hero')
chip = text(re.search(r'<p class="chip">(.*?)</p>', hero).group(1))
lines = [text(x) for x in re.findall(r'<span class="about-hero__line">(.*?)</span>', hero)]
lede = text(re.search(r'<p class="about-hero__lede">(.*?)</p>', hero, re.S).group(1))

about_hero = '''/**
 * Arcovia: the About page's opening (About block 1).
 *
 * The structure of the user's Mahadeva template About opening and nothing else
 * (the user firmly rejected its band of bars and its heading wipe): a short
 * opening, at least two thirds of the screen, on the home hero's live concrete
 * (ConcreteSurface, as main.js starts it on [data-hero]: drifting sunlight and
 * a soft cursor light, no carving). The chip and the headline sit low on the
 * left (cols 1-8, one sentence per line, a share of the grid width so it breaks
 * the same at every desktop width); the line on the right (cols 9-12) ends on
 * the headline's baseline. No text animation.
 * On the Framer canvas (and without WebGL): the concrete photo with a soft
 * diagonal light band.
 * Ported from about.html (SECTION:about-hero) and sections/about-hero.css on main.
 */
import * as React from "react"
import { addPropertyControls, ControlType } from "framer"
import { ASSETS, baseStyle, cssTag, useArcoviaScript, type Life } from "./ArcoviaBase.tsx"
import { ConcreteSurface } from "./ArcoviaConcrete.tsx"

const ABOUT_HERO_CSS = `''' + css('about-hero') + '''`

interface Props {
    chip: string
    line1: string
    line2: string
    lede: string
    style?: React.CSSProperties
}

const DEFAULTS: Props = {
    chip: ''' + j(chip) + ''',
    line1: ''' + j(lines[0]) + ''',
    line2: ''' + j(lines[1]) + ''',
    lede: ''' + j(lede) + ''',
}

/**
 * @framerSupportedLayoutWidth any-prefer-fixed
 * @framerSupportedLayoutHeight auto
 */
export default function ArcoviaAboutHero(incoming: Partial<Props>) {
    const p = { ...DEFAULTS, ...incoming }
    const ref = React.useRef<HTMLDivElement>(null)
    // Lay the slab out again whenever the copy changes
    const key = JSON.stringify([p.chip, p.line1, p.line2, p.lede])
    useArcoviaScript(ref, (root, life) => initAboutHero(root, life), [key])

    return (
        <div className="arc arc-about-hero" ref={ref} style={p.style}>
            {baseStyle()}
            {cssTag("about-hero", ABOUT_HERO_CSS)}
            <section className="about-hero" data-hero="" aria-labelledby="about-title">
                <canvas className="hero__canvas" aria-hidden="true"></canvas>

                <div className="about-hero__inner container">
                    <div className="about-hero__heading">
                        {p.chip ? <p className="chip">{p.chip}</p> : null}
                        <h1 className="about-hero__title" id="about-title">
                            <span className="about-hero__line">{p.line1}</span>
                            {p.line2 ? <span className="about-hero__line">{p.line2}</span> : null}
                        </h1>
                    </div>
                    <p className="about-hero__lede">{p.lede}</p>
                </div>
            </section>
        </div>
    )
}

/* ==========================================================================
   Behaviour (main.js, "Live concrete"): the home hero's ConcreteSurface on the
   section, the tiled concrete with its drifting sun and cursor light.
   ========================================================================== */
function initAboutHero(host: HTMLElement, life: Life) {
    const hero = host.querySelector<HTMLElement>("[data-hero]")
    if (!hero) return
    const concrete = new ConcreteSurface(hero, { canvas: ".hero__canvas", texture: ASSETS.concrete, scope: host })
    life.add(() => concrete.destroy())
    concrete.init()
    // The component can mount before Montserrat has loaded: lay the slab out again once it is in
    const fonts = (document as any).fonts
    if (fonts && fonts.addEventListener) life.on(fonts, "loadingdone", () => concrete.queueLayout())
}

addPropertyControls(ArcoviaAboutHero, {
    chip: { type: ControlType.String, title: "Chip", defaultValue: DEFAULTS.chip },
    line1: { type: ControlType.String, title: "Headline 1", defaultValue: DEFAULTS.line1 },
    line2: { type: ControlType.String, title: "Headline 2", defaultValue: DEFAULTS.line2 },
    lede: { type: ControlType.String, title: "Text", displayTextArea: true, defaultValue: DEFAULTS.lede },
})
'''

# ---------------------------------------------------------------- Our story
story = section('story')
s_chip = text(re.search(r'<p class="chip">(.*?)</p>', story).group(1))
t = re.search(r'<h2 class="story__title"[^>]*>(.*?)</h2>', story, re.S).group(1)
s_title = [text(x) for x in t.split('<br>')]
ICON_TITLES = {'camera': 'Camera', 'views': 'Views (eye)', 'lesson': 'Lesson (light bulb)', 'turn': 'Turn (clapperboard)',
               'outgrow': 'Outgrow (expand)', 'firm': 'Firm (buildings)', 'point': 'Point (target)', 'map': 'Map',
               'process': 'Process (checklist)', 'money': 'Money (wallet)', 'people': 'People', 'door': 'Door (exit)'}
steps = []
for m in re.finditer(r'<li class="story-step" data-story-step data-image="assets/story/(\w+)\.jpg">(.*?)</ul>\s*</li>', story, re.S):
    body = m.group(2)
    st = {'title': text(re.search(r'story-step__title">(.*?)<', body).group(1)),
          'meta': text(re.search(r'story-step__meta">(.*?)<', body).group(1)),
          'photo': PHOTOS[m.group(1)]}
    pts = re.findall(r'#icon-story-(\w+)".*?story-point__title">(.*?)</h4>.*?story-point__text">(.*?)</p>', body, re.S)
    assert len(pts) == 3, pts
    for k, (ic, ti, tx) in enumerate(pts, 1):
        st[f'icon{k}'] = ic; st[f'point{k}'] = text(ti); st[f'text{k}'] = text(tx)
    steps.append(st)
assert len(steps) == 4, len(steps)
sprite = '\n'.join(re.findall(r'<symbol id="icon-story-\w+".*?</symbol>', page))
assert sprite.count('<symbol') == 12
for k in ICON_TITLES: assert f'id="icon-story-{k}"' in sprite, k

story_tsx = '''/**
 * Arcovia: "Our story" (About block 2).
 *
 * Layout after the user's process-section reference video (steps scrolling on
 * the left, a giant step number pinned on the right that spun to the next
 * number): here a photo turns instead. On the neutral ground: the chip and a
 * large heading (a share of the grid width, the break after "Los Angeles" is
 * the design's), then four steps on cols 1-6, each a title with a short line in
 * small capitals over a hairline, and three points, each an icon (Solar, Bold
 * Duotone: 480 Design, CC BY 4.0, via Iconify) beside a heading and a
 * paragraph. Every point stays in full ink (no dimming: the user rejected it).
 * A 4:5 photo card is pinned flush right on cols 7-12, centred on the screen,
 * and turns over on its vertical axis to each step's photo as soon as that
 * step's content is nearer the middle of the screen than the last step's (the
 * old rule, once it reaches the photo's centre, turned late or not at all):
 * four steps, four photos. Each step is a screen tall with its content centred in it, so one step sits beside the photo
 * at a time, and the photo column is inset so the story starts and ends in the
 * middle of the screen. The turn is timed (450 ms, starting at once), not scrubbed; it turns
 * back when scrolling up and catches up if several steps pass, fast scrolling
 * included (a Web Animations turn with a token and a backup timer: an
 * interrupted CSS transition never reports its end and froze the card). At
 * rest the card has no transform, so the photo stays crisp. Reduced motion:
 * the photo simply changes. On the Framer canvas: the first photo, still.
 * The photos are stand-ins: [IMAGE NEEDED] real LPP Media and Arcovia photos.
 * Ported from about.html (SECTION:story), sections/story.css and story.js on main.
 */
import * as React from "react"
import { addPropertyControls, ControlType } from "framer"
import { baseStyle, cssTag, useArcoviaScript, type Life } from "./ArcoviaBase.tsx"

const STORY_CSS = `''' + css('story') + '''`

/** Solar, Bold Duotone (480 Design, CC BY 4.0, via Iconify), light layer at 20%: used with <use href="#icon-story-…"/> */
const STORY_SPRITE = ''' + j(sprite) + '''

const ICONS = ''' + j(list(ICON_TITLES.keys())) + '''
const ICON_TITLES = ''' + j(list(ICON_TITLES.values())) + '''

/** A ControlType.ResponsiveImage value, or a plain URL */
type Photo = string | { src?: string; srcSet?: string; alt?: string } | undefined
const photoSrc = (v: Photo) => (typeof v === "string" ? v : (v && v.src) || "")

interface Step {
    title: string
    meta?: string
    photo?: Photo
    icon1?: string
    point1?: string
    text1?: string
    icon2?: string
    point2?: string
    text2?: string
    icon3?: string
    point3?: string
    text3?: string
}

interface Props {
    chip: string
    title1: string
    title2: string
    steps: Step[]
    style?: React.CSSProperties
}

const DEFAULTS: Props = {
    chip: ''' + j(s_chip) + ''',
    title1: ''' + j(s_title[0]) + ''',
    title2: ''' + j(s_title[1]) + ''',
    steps: ''' + json.dumps(steps, ensure_ascii=False, indent=4).replace('\n', '\n    ') + ''',
}

/**
 * @framerSupportedLayoutWidth any-prefer-fixed
 * @framerSupportedLayoutHeight auto
 */
export default function ArcoviaStory(incoming: Partial<Props>) {
    const p = { ...DEFAULTS, ...incoming }
    const steps = Array.isArray(p.steps) && p.steps.length ? p.steps : DEFAULTS.steps
    const photos = steps.map((s, i) => photoSrc(s.photo) || photoSrc(DEFAULTS.steps[i % DEFAULTS.steps.length].photo))
    const ref = React.useRef<HTMLDivElement>(null)
    useArcoviaScript(ref, (root, life) => initStory(root, life), [JSON.stringify(photos), steps.length])

    return (
        <div className="arc arc-story" ref={ref} style={p.style}>
            {baseStyle()}
            {cssTag("story", STORY_CSS)}
            <svg className="sprite" aria-hidden="true" focusable="false" dangerouslySetInnerHTML={{ __html: STORY_SPRITE }} />
            <section className="story" data-story="" aria-labelledby="story-title">
                <div className="story__inner container">
                    <header className="story__head">
                        {p.chip ? <p className="chip">{p.chip}</p> : null}
                        <h2 className="story__title" id="story-title">
                            {p.title1}
                            {p.title2 ? (
                                <>
                                    <br /> {p.title2}
                                </>
                            ) : null}
                        </h2>
                    </header>

                    <ol className="story__steps">
                        {steps.map((s, i) => {
                            const points = [1, 2, 3]
                                .map((k) => ({ icon: (s as any)["icon" + k], title: (s as any)["point" + k], text: (s as any)["text" + k] }))
                                .filter((pt) => pt.title || pt.text)
                            return (
                                <li className="story-step" data-story-step="" data-image={photos[i]} key={i}>
                                    <div className="story-step__head">
                                        <h3 className="story-step__title">{s.title}</h3>
                                        {s.meta ? <p className="story-step__meta">{s.meta}</p> : null}
                                    </div>
                                    <ul className="story-step__points">
                                        {points.map((pt, k) => (
                                            <li className="story-point" key={k}>
                                                <svg className="story-point__icon" aria-hidden="true">
                                                    <use href={"#icon-story-" + (ICONS.indexOf(pt.icon) >= 0 ? pt.icon : "point")} />
                                                </svg>
                                                <h4 className="story-point__title">{pt.title}</h4>
                                                <p className="story-point__text">{pt.text}</p>
                                            </li>
                                        ))}
                                    </ul>
                                </li>
                            )
                        })}
                    </ol>

                    {/* Component: story-card. One photo, pinned; it turns over to each step's photo.
                        Decorative here: the text carries the story on its own. */}
                    <div className="story__media" aria-hidden="true">
                        <div className="story__card" data-story-card="">
                            <div className="story__face story__face--front">
                                <img src={photos[0]} alt="" width={1216} height={1520} />
                            </div>
                            <div className="story__face story__face--back">
                                <img src={photos[0]} alt="" width={1216} height={1520} />
                            </div>
                        </div>
                    </div>
                </div>
            </section>
        </div>
    )
}

/* ==========================================================================
   Behaviour (story.js): the pinned photo that turns over.
   The step whose content is nearest the middle of the screen (where the photo
   is pinned) owns the photo, so the card turns as soon as the next step comes
   up past the halfway point between two steps. (The old rule, "once the content
   reaches the photo's centre", turned late, did not turn at all if you stopped
   a little short of the centre, and on the last step only turned as the card
   was scrolling away.) The turn is quick (450 ms) and starts at once: every
   photo is loaded and decoded up front, and after a turn the two faces trade
   places instead of swapping photos, so nothing waits for an image. If the
   reader moves on during the first half of a turn (the new photo still facing
   away), the hidden face takes the newer photo, or the card turns back if the
   reader went back; later in a turn it finishes and turns again to catch up.
   Timed, not scrubbed, so the card never rests half turned; at rest the card
   has no transform, so the photo stays crisp.
   ========================================================================== */
function initStory(host: HTMLElement, life: Life) {
    const root = host.querySelector<HTMLElement>("[data-story]")
    const card = root && root.querySelector<HTMLElement>("[data-story-card]")
    if (!root || !card) return
    const steps = Array.prototype.slice.call(root.querySelectorAll("[data-story-step]")) as HTMLElement[]
    const srcs = steps.map((s) => s.getAttribute("data-image") || "")
    const faceA = card.querySelector<HTMLElement>(".story__face--front")
    const faceB = card.querySelector<HTMLElement>(".story__face--back")
    const imgA = faceA && faceA.querySelector("img")
    const imgB = faceB && faceB.querySelector("img")
    if (!faceA || !faceB || !imgA || !imgB || !steps.length) return
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)")

    // Load and decode every photo up front, so a turn starts at once and never shows a blank face
    srcs.forEach((src) => {
        if (!src) return
        const i = new Image()
        i.src = src
        if (i.decode) i.decode().catch(() => {})
    })

    // The face showing (up) and the one facing away (down). They trade places after each turn.
    type Face = { face: HTMLElement; img: HTMLImageElement }
    let up: Face = { face: faceA, img: imgA }
    let down: Face = { face: faceB, img: imgB }
    const place = () => {
        up.face.style.transform = "none"
        down.face.style.transform = "rotateY(180deg)"
    }
    place()

    let shown = 0 // the step whose photo is showing
    let target = 0 // the step whose photo should show
    let next = 0 // the step the card is turning to
    let busy = false
    let token = 0
    let anim: Animation | null = null
    const TURN_MS = 450
    const EASE = "cubic-bezier(0.4, 0, 0.2, 1)"
    const SLACK = 12 // px: a resting scroll position right at the halfway point never wobbles

    // Middle of a step's content (its head and its points), wherever the step's box ends
    const centreOf = (s: HTMLElement) => {
        const head = s.querySelector<HTMLElement>(".story-step__head") || s
        const pts = s.querySelector<HTMLElement>(".story-step__points") || head
        return (head.getBoundingClientRect().top + pts.getBoundingClientRect().bottom) / 2
    }

    // The step whose content is nearest the middle of the screen
    const activeStep = () => {
        const mid = window.innerHeight * 0.5
        const d = steps.map((s) => Math.abs(centreOf(s) - mid))
        let k = 0
        for (let i = 1; i < d.length; i++) if (d[i] < d[k]) k = i
        if (k !== target && d[target] - d[k] < SLACK) return target
        return k
    }

    // Resolves once the photo can be drawn (or after a short wait, never later)
    const ready = (img: HTMLImageElement) =>
        new Promise<void>((resolve) => {
            const t = life.timeout(resolve, 150)
            const done = () => {
                life.clear(t)
                resolve()
            }
            if (img.decode) img.decode().then(done, done)
            else done()
        })

    /* The turn is a self-timed animation (Web Animations), not a CSS transition: a transition
       that gets interrupted never reports that it ended, and the card froze. Each turn has a
       token, and a timer backs up the animation's own end, so a turn always finishes, once. */
    const settle = (t: number) => {
        if (life.dead || t !== token || !busy) return
        token++
        if (anim) {
            anim.cancel() // drop the transform
            anim = null
        }
        card.classList.remove("is-turning")
        if (next !== shown) {
            // The face that turned to us keeps showing: the faces trade places in the same frame
            // as the card drops its transform, so nothing flashes and nothing waits for a photo
            const was = up
            up = down
            down = was
            place()
            shown = next
        }
        busy = false
        turn() // catch up if the reader has moved on meanwhile
    }

    const turn = () => {
        if (life.dead || busy || target === shown) return
        if (reduced.matches || !card.animate) {
            up.img.src = srcs[target]
            shown = target
            return
        }
        busy = true
        next = target
        const t = ++token
        down.img.src = srcs[next]
        ready(down.img).then(() => {
            if (life.dead || t !== token) return
            if (target === shown) {
                busy = false // the reader went back before it began
                return
            }
            if (target !== next) {
                next = target
                down.img.src = srcs[next]
            }
            card.classList.add("is-turning")
            // forwards turns to the left, backwards to the right
            anim = card.animate([{ transform: "rotateY(0deg)" }, { transform: "rotateY(" + (next > shown ? -180 : 180) + "deg)" }], {
                duration: TURN_MS,
                easing: EASE,
                fill: "forwards",
            })
            const end = () => settle(t)
            anim.finished.then(end, end)
            life.timeout(end, TURN_MS * 2 + 300)
        })
    }

    // The reader moved on during a turn. While the new photo is still facing away (the first
    // half), the hidden face takes the newer photo if it lies the same way round, or the card
    // turns back if the reader returned to the photo already showing. Later, it finishes and catches up.
    const retarget = () => {
        if (!anim || target === next || anim.playbackRate < 0) return
        const timing = anim.effect && anim.effect.getComputedTiming()
        if (!timing || (timing.progress || 0) >= 0.5) return
        if (target === shown) {
            next = shown
            anim.reverse()
        } else if ((target > shown) === (next > shown)) {
            next = target
            down.img.src = srcs[next]
        }
    }

    let queued = false
    const update = () => {
        queued = false
        if (!card.offsetParent) return // the card is hidden
        target = activeStep()
        retarget()
        turn()
    }
    const request = () => {
        if (queued) return
        queued = true
        life.raf(update)
    }
    life.on(window, "scroll", request, { passive: true })
    life.on(window, "resize", request)
    life.on(window, "load", request)
    update()

    life.add(() => {
        token++
        if (anim) anim.cancel()
        anim = null
        busy = false
        card.classList.remove("is-turning")
        faceA.style.transform = ""
        faceB.style.transform = ""
        imgA.src = srcs[0]
        imgB.src = srcs[0]
    })
}

addPropertyControls(ArcoviaStory, {
    chip: { type: ControlType.String, title: "Chip", defaultValue: DEFAULTS.chip },
    title1: { type: ControlType.String, title: "Heading 1", defaultValue: DEFAULTS.title1 },
    title2: { type: ControlType.String, title: "Heading 2", defaultValue: DEFAULTS.title2 },
    steps: {
        type: ControlType.Array,
        title: "Steps",
        control: {
            type: ControlType.Object,
            controls: {
                title: { type: ControlType.String, title: "Title" },
                meta: { type: ControlType.String, title: "Line" },
                photo: { type: ControlType.ResponsiveImage, title: "Photo" },
                icon1: { type: ControlType.Enum, title: "Icon 1", options: ICONS, optionTitles: ICON_TITLES, defaultValue: "point" },
                point1: { type: ControlType.String, title: "Point 1" },
                text1: { type: ControlType.String, title: "Text 1", displayTextArea: true },
                icon2: { type: ControlType.Enum, title: "Icon 2", options: ICONS, optionTitles: ICON_TITLES, defaultValue: "point" },
                point2: { type: ControlType.String, title: "Point 2" },
                text2: { type: ControlType.String, title: "Text 2", displayTextArea: true },
                icon3: { type: ControlType.Enum, title: "Icon 3", options: ICONS, optionTitles: ICON_TITLES, defaultValue: "point" },
                point3: { type: ControlType.String, title: "Point 3" },
                text3: { type: ControlType.String, title: "Text 3", displayTextArea: true },
            },
        },
        defaultValue: DEFAULTS.steps,
        description: "One photo per step: the card turns to it as the step reaches the middle of the screen. Empty photo: the stand-in.",
    },
})
'''

# ---------------------------------------------------------------- What we believe
bel = section('beliefs')
b_title = text(re.search(r'<h2 class="beliefs__title"[^>]*>(.*?)</h2>', bel).group(1))
b_items = []
b_art = []
for m in re.finditer(r'<li class="belief">(.*?)</li>', bel, re.S):
    body = m.group(1)
    note = re.search(r'<!-- (.*?) -->', body, re.S).group(1).strip()
    art = re.search(r'<svg class="belief__art" viewBox="0 0 160 120" aria-hidden="true">(.*?)</svg>', body, re.S).group(1)
    b_items.append({'title': text(re.search(r'belief__name">(.*?)<', body).group(1)),
                    'text': text(re.search(r'belief__text">(.*?)</p>', body, re.S).group(1))})
    b_art.append((note, art))
assert len(b_items) == 4
art_lines = ',\n'.join(f'    // {n}\n    {j(a)}' for n, a in b_art)

beliefs_tsx = '''/**
 * Arcovia: "What we believe" (About block 3).
 *
 * Layout after the user's reference (four columns behind vertical hairlines,
 * each a small number, a fine line drawing, a title and one line; a design
 * studio's services row), in our language: on white between the neutral "Our
 * story" and the neutral "How we work"; the heading, then four columns of
 * three grid columns, each behind a hairline: the number (01–04), a 200 × 150
 * drawing, a title and its line, lined up across the columns (subgrid).
 * The drawings are fine-lined 3D in one isometric angle (30°), in the style of
 * the reference's third, drawn by tools/iso-art.py: ink lines that stay 1px,
 * white tops and fronts, concrete sides, one charcoal top. 01 four slabs
 * stacked into one solid block; 02 a cube in two pieces held lined up above
 * its notch; 03 the company's own core held inside an open frame (its hidden
 * edges dashed); 04 columns growing taller one after another. Still: no motion.
 * Copy is the user's, every word.
 * Ported from about.html (SECTION:beliefs) and sections/beliefs.css on main.
 */
import * as React from "react"
import { addPropertyControls, ControlType } from "framer"
import { baseStyle, cssTag } from "./ArcoviaBase.tsx"

const BELIEFS_CSS = `''' + css('beliefs') + '''`

/** The four drawings (viewBox 0 0 160 120), in order. Change them in tools/iso-art.py, not by hand. */
const ART = [
''' + art_lines + '''
]

interface Item {
    title: string
    text: string
}

interface Props {
    title: string
    items: Item[]
    style?: React.CSSProperties
}

const DEFAULTS: Props = {
    title: ''' + j(b_title) + ''',
    items: ''' + json.dumps(b_items, ensure_ascii=False, indent=4).replace('\n', '\n    ') + ''',
}

/**
 * @framerSupportedLayoutWidth any-prefer-fixed
 * @framerSupportedLayoutHeight auto
 */
export default function ArcoviaBeliefs(incoming: Partial<Props>) {
    const p = { ...DEFAULTS, ...incoming }
    const items = Array.isArray(p.items) && p.items.length ? p.items : DEFAULTS.items

    return (
        <div className="arc arc-beliefs" style={p.style}>
            {baseStyle()}
            {cssTag("beliefs", BELIEFS_CSS)}
            <section className="beliefs" aria-labelledby="beliefs-title">
                <div className="beliefs__inner container">
                    <h2 className="beliefs__title" id="beliefs-title">
                        {p.title}
                    </h2>

                    <ol className="beliefs__list">
                        {items.map((it, i) => (
                            <li className="belief" key={i}>
                                <p className="belief__num" aria-hidden="true">
                                    {String(i + 1).padStart(2, "0")}
                                </p>
                                <svg className="belief__art" viewBox="0 0 160 120" aria-hidden="true" dangerouslySetInnerHTML={{ __html: ART[i % ART.length] }} />
                                <h3 className="belief__name">{it.title}</h3>
                                <p className="belief__text">{it.text}</p>
                            </li>
                        ))}
                    </ol>
                </div>
            </section>
        </div>
    )
}

addPropertyControls(ArcoviaBeliefs, {
    title: { type: ControlType.String, title: "Heading", defaultValue: DEFAULTS.title },
    items: {
        type: ControlType.Array,
        title: "Beliefs",
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
})
'''

# ---------------------------------------------------------------- How we work
pro = section('process')
p_title = text(re.search(r'<h2 class="process__title"[^>]*>(.*?)</h2>', pro).group(1))
p_rows, p_art = [], []
for m in re.finditer(r'<li class="process__row"[^>]*>(.*?)</li>', pro, re.S):
    body = m.group(1)
    note = re.search(r'<!-- (.*?) -->', body, re.S).group(1).strip()
    art = re.search(r'<svg class="process__art" viewBox="0 0 160 120" aria-hidden="true">(.*?)</svg>', body, re.S).group(1)
    p_rows.append({'title': text(re.search(r'process__name">(.*?)<', body).group(1)),
                   'text': text(re.search(r'process__text">(.*?)</p>', body, re.S).group(1))})
    p_art.append((note, art))
assert len(p_rows) == 4
p_art_lines = ',\n'.join(f'    // {n}\n    {j(a)}' for n, a in p_art)

process_tsx = '''/**
 * Arcovia: "How we work" (About block 4).
 *
 * After the user's reference video (a stacking process list): the heading, then
 * four rows on the 12-column grid, on the neutral ground: the number (cols 1-2)
 * and the title (cols 3-8) at 48px, the line on cols 9-12 (its first line on
 * the title's cap height), and under each title a 3D drawing like those in What
 * we believe (tools/iso-art.py). A hairline across the top of each row draws in
 * from the left as the row comes up (scroll-linked: starts as the row's top
 * passes 92% of the screen, complete by 42%, eased out; runs back when
 * scrolling up). Each row sticks near the top under the one before and the next
 * slides up over it, so the rows pile up as title strips; the whole stack then
 * leaves together (each row's box reaches down one strip for every row after
 * it, pulled back by a negative margin on the next, so all rows end on the same
 * line). The stacking is plain CSS (sticky rows); the script only draws the
 * lines. Below 1200, and with reduced motion, the lines are simply there and the
 * rows don't stack. No extra labels or lists from the video (no copy for them).
 * Copy is the user's, every word.
 * Ported from about.html (SECTION:process), sections/process.css and process.js on main.
 */
import * as React from "react"
import { addPropertyControls, ControlType } from "framer"
import { baseStyle, cssTag, useArcoviaScript, type Life } from "./ArcoviaBase.tsx"

const PROCESS_CSS = `''' + css('process') + '''`

/** The four drawings (viewBox 0 0 160 120), in order. Change them in tools/iso-art.py, not by hand. */
const ART = [
''' + p_art_lines + '''
]

interface Row {
    title: string
    text: string
}

interface Props {
    title: string
    rows: Row[]
    style?: React.CSSProperties
}

const DEFAULTS: Props = {
    title: ''' + j(p_title) + ''',
    rows: ''' + json.dumps(p_rows, ensure_ascii=False, indent=4).replace('\n', '\n    ') + ''',
}

/**
 * @framerSupportedLayoutWidth any-prefer-fixed
 * @framerSupportedLayoutHeight auto
 */
export default function ArcoviaProcess(incoming: Partial<Props>) {
    const p = { ...DEFAULTS, ...incoming }
    const rows = Array.isArray(p.rows) && p.rows.length ? p.rows : DEFAULTS.rows
    const ref = React.useRef<HTMLDivElement>(null)
    useArcoviaScript(ref, (root, life) => initProcess(root, life), [rows.length])

    return (
        <div className="arc arc-process" ref={ref} style={p.style}>
            {baseStyle()}
            {cssTag("process", PROCESS_CSS)}
            <section className="process" data-process="" aria-labelledby="process-title" style={{ ["--process-n" as any]: String(rows.length) }}>
                <div className="process__inner container">
                    <h2 className="process__title" id="process-title">
                        {p.title}
                    </h2>

                    <ol className="process__list">
                        {rows.map((r, i) => (
                            <li className="process__row" key={i} style={{ ["--i" as any]: String(i) }}>
                                <span className="process__num" aria-hidden="true">
                                    {String(i + 1).padStart(2, "0")}
                                </span>
                                <h3 className="process__name">{r.title}</h3>
                                <svg className="process__art" viewBox="0 0 160 120" aria-hidden="true" dangerouslySetInnerHTML={{ __html: ART[i % ART.length] }} />
                                <p className="process__text">{r.text}</p>
                            </li>
                        ))}
                    </ol>
                </div>
            </section>
        </div>
    )
}

/* ==========================================================================
   Behaviour (process.js): the hairlines that draw in.
   Sets --line (0 to 1) on each row as it comes up the screen. Off below 1200
   (the component's own width, as its stylesheet) and with reduced motion.
   ========================================================================== */
function initProcess(host: HTMLElement, life: Life) {
    const root = host.querySelector<HTMLElement>("[data-process]")
    if (!root) return
    const rows = Array.prototype.slice.call(root.querySelectorAll(".process__row")) as HTMLElement[]
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)")
    const START = 0.92 // the line starts as the row's top passes 92% of the screen...
    const END = 0.42 // ...and is done by 42%

    let queued = false
    let near = false
    const update = () => {
        queued = false
        if (reduced.matches || host.clientWidth < 1200) {
            rows.forEach((r) => r.style.removeProperty("--line"))
            return
        }
        const vh = window.innerHeight
        rows.forEach((r) => {
            const t = r.getBoundingClientRect().top
            let p = (START * vh - t) / ((START - END) * vh)
            p = Math.max(0, Math.min(1, p))
            r.style.setProperty("--line", (1 - Math.pow(1 - p, 2)).toFixed(4)) // eases out as it finishes
        })
    }
    const queue = () => {
        if (!near || queued) return
        queued = true
        life.raf(update)
    }

    life.observe(
        new IntersectionObserver(
            (entries) => {
                near = entries[0].isIntersecting
                queue()
            },
            { rootMargin: "50% 0px" }
        )
    ).observe(root)
    life.on(window, "scroll", queue, { passive: true })
    life.on(window, "resize", () => {
        near = true
        queue()
    })
    if (typeof reduced.addEventListener === "function") life.on(reduced, "change", update)
    near = true
    update()

    life.add(() => rows.forEach((r) => r.style.removeProperty("--line")))
}

addPropertyControls(ArcoviaProcess, {
    title: { type: ControlType.String, title: "Heading", defaultValue: DEFAULTS.title },
    rows: {
        type: ControlType.Array,
        title: "Rows",
        control: {
            type: ControlType.Object,
            controls: {
                title: { type: ControlType.String, title: "Title" },
                text: { type: ControlType.String, title: "Text", displayTextArea: true },
            },
        },
        defaultValue: DEFAULTS.rows,
        maxCount: 4,
        description: "Four, in order: each has its own drawing.",
    },
})
'''

files = {'ArcoviaAboutHero.tsx': about_hero, 'ArcoviaStory.tsx': story_tsx, 'ArcoviaBeliefs.tsx': beliefs_tsx, 'ArcoviaProcess.tsx': process_tsx}
for name, src in files.items():
    open(f'{OUT}/{name}', 'w', encoding='utf-8').write(src)
    print(name, len(src.encode('utf-8')), 'bytes')
print('hero', chip, lines, lede[:40])
print('story', s_chip, s_title, [s['title'] for s in steps])
print('beliefs', b_title, [i['title'] for i in b_items])
print('process', p_title, [r['title'] for r in p_rows])
