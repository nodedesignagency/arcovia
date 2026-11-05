"""Generate the Framer code components for "Contact via Arcovia" (the senior advisors' short note on their profiles)
from the HTML site, so Framer stays a faithful port:

  ArcoviaNote.tsx  the note (SECTION:profile's `.profile-note`, as tools/team-profiles.py writes it), with the note's
                   part of site/people.js running on it unchanged apart from the lifecycle (life.on), the CSS of
                   sections/contact.css, the note's part of sections/profile.css and the form parts of styles.css.
  ArcoviaLink.tsx  a link in ArcoviaEmail's two looks (the underlined link, the primary button), with its own label
                   and link: "Contact via Arcovia" on the profile (to #contact).

    python3 tools/framer-note.py   # writes review/framer/ArcoviaNote.tsx, ArcoviaLink.tsx and note-harness.html

The note's copy is read from a generated advisor profile (the first person whose contact is "form" in team.json),
with that person's name, first name and slug swapped for the component's controls (bound to the Team CMS fields on
the profile page). Its heading, line and thank-you are controls with "{first}" in them. The screen-width rules stay
real media queries (the note is a 660px column, so container queries would misfire). note-harness.html runs the
same markup, CSS and script in a plain page for testing in Chromium before upload.

Upload: create_upload_url, PUT the file, fetch() it inside a project program, api.files.create/write. The webhook
URL is the component's "Webhook URL" control (GoHighLevel, the last step), as for ArcoviaContact."""
import html, json, os, re
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SITE = os.path.join(ROOT, 'site')
OUT = os.path.join(ROOT, 'review', 'framer')
os.makedirs(OUT, exist_ok=True)

data = json.load(open(f'{SITE}/data/team.json', encoding='utf-8'))
src_person = next(p for p in data['people'] if p['contact'] == 'form')
FIRST, NAME, SLUG = src_person['first'], src_person['name'], src_person['slug']
profile = open(f'{SITE}/team/{SLUG}.html', encoding='utf-8').read()
contact_css = open(f'{SITE}/sections/contact.css', encoding='utf-8').read()
profile_css = open(f'{SITE}/sections/profile.css', encoding='utf-8').read()
styles = open(f'{SITE}/styles.css', encoding='utf-8').read()
people = open(f'{SITE}/people.js', encoding='utf-8').read()

# ---------------------------------------------------------------- CSS
note_rules = profile_css[profile_css.index('/* ---------- Senior advisors: the short note'):profile_css.index('/* ---------- Previous / All team members / Next')]
small = re.findall(r'@media \(max-width: (\d+)px\) \{(.*?)\n\}', profile_css, re.S)
note_small = ''.join(f'@media (max-width: {w}px) {{\n' + ''.join(l + '\n' for l in body.split('\n') if '.profile-note' in l) + '}\n'
                     for w, body in small if '.profile-note' in body)
parts = styles[styles.index('/* Check: a square box'):styles.index('/* ---------- Reduced motion ---------- */')]
CSS = ('/* The note sits in the profile\'s text column (one measure, 660px); the spacing above it and the scroll\n'
       '   target (#contact) belong to the Framer frame round it, so the section itself has no top margin */\n'
       '.arc-note { --pf-line: rgba(21, 21, 21, 0.12); --pf-measure: 660px; background: transparent; }\n'
       '.arc-note .profile-note { margin-top: 0; }\n'
       '.arc-note .nowrap { white-space: nowrap; }\n\n'
       '/* The Framer canvas does not run the script: there the blanks size to their placeholder (on the site the script sets exact widths) */\n'
       '.arc-note .note-input { field-sizing: content; }\n\n'
       '/* ---------- sections/contact.css (the note\'s blanks, sign-off and thank-you) ---------- */\n'
       + re.sub(r'(?m)^(\s*)\.js \.', r'\1.is-live .', contact_css)
       + '\n/* ---------- sections/profile.css: the advisors\' note ---------- */\n' + note_rules + note_small
       + '\n/* ---------- Form parts from styles.css (.check, .trap) ---------- */\n' + parts)
assert '../assets' not in CSS and 'url("assets' not in CSS
assert '.js ' not in re.sub(r'/\*.*?\*/', '', CSS, flags=re.S)
CSS_TS = CSS.replace('\\', '\\\\').replace('`', '\\`').replace('${', '\\${')

# ---------------------------------------------------------------- Markup
m = re.search(r'(<section class="profile-note".*?</section>)', profile, re.S)
markup = re.sub(r'<!--.*?-->', '', m.group(1), flags=re.S)
markup = re.sub(r'\n\s*\n', '\n', markup).strip()
def swap_markup(a, b, count=1):
    global markup
    assert markup.count(a) == count, (a, markup.count(a))
    markup = markup.replace(a, b)
# The Framer frame round the note owns the id (it is the scroll target of every "Contact via Arcovia" link)
swap_markup('<section class="profile-note" id="contact"', '<section class="profile-note"')
swap_markup(f'>Contact {FIRST} via Arcovia</h2>', '>@@heading@@</h2>')
lede = re.search(r'<p class="profile-note__lede">(.*?)</p>', markup).group(1)
swap_markup(f'<p class="profile-note__lede">{lede}</p>', '<p class="profile-note__lede">@@lede@@</p>')
thanks = re.search(r'<p class="note-done__text">(.*?)</p>', markup).group(1)
swap_markup(f'<p class="note-done__text">{thanks}</p>', '<p class="note-done__text">@@thanks@@</p>')
swap_markup('<input type="hidden" name="tag" value="advisor">', '<input type="hidden" name="tag" value="@@tag@@">')
swap_markup(f'<input type="hidden" name="advisor" value="{html.escape(NAME)}">', '<input type="hidden" name="advisor" value="@@name@@">')
swap_markup(f'<input type="hidden" name="advisor_slug" value="{SLUG}">', '<input type="hidden" name="advisor_slug" value="@@slug@@">')
swap_markup(f'<p>Dear {FIRST},</p>', '<p>Dear @@first@@,</p>')
# Framer routes: one Legal page for now (as the footer and ArcoviaContact)
swap_markup('href="../privacy.html"', 'href="/legal"')
assert FIRST not in re.sub(r'@@\w+@@', '', markup), 'a first name is left in the markup'
def unfirst(s): return html.unescape(s).replace(FIRST, '{first}')
DEFAULTS = {
    # slug: empty means "made from the name", as the Team CMS slugs are (Framer can't bind a Slug field to a text control)
    'first': FIRST, 'name': NAME, 'slug': '', 'tag': 'advisor',
    'heading': 'Contact {first} via Arcovia', 'lede': unfirst(lede), 'thanks': unfirst(thanks),
    'endpoint': '', 'sendAs': 'json',
}

# ---------------------------------------------------------------- Script: the note's part of people.js
body = people[people.index("  /* ---------- The advisors' short note ---------- */"):people.rindex('})();')]
def swap(a, b, count=1):
    global body
    assert body.count(a) == count, (a, body.count(a))
    body = body.replace(a, b)
swap('  document.querySelectorAll("[data-note-form]").forEach(function (form) {', '''  // The webhook URL and how to send come from the component's controls
  host.querySelectorAll("[data-note-form]").forEach(function (f) { f.setAttribute("data-endpoint", endpoint || ""); f.setAttribute("data-send", sendAs === "form" ? "form" : "json"); });
  host.querySelectorAll("[data-note-form]").forEach(function (form) {''')
swap('if (document.fonts && document.fonts.ready) document.fonts.ready.then(refresh);',
     'if (document.fonts && document.fonts.ready) document.fonts.ready.then(function () { if (!life.dead) refresh(); });')
swap('window.addEventListener("resize", refresh);', 'life.on(window, "resize", refresh);')
swap('form.addEventListener("input", onEdit);', 'life.on(form, "input", onEdit);')
swap('form.addEventListener("change", onEdit);', 'life.on(form, "change", onEdit);')
swap('form.addEventListener("submit", function (e) {', 'life.on(form, "submit", function (e) {')
swap('if (again) again.addEventListener("click", function () {', 'if (again) life.on(again, "click", function () {')
for bad in ('setTimeout', 'requestAnimationFrame', 'document.querySelectorAll', 'addEventListener'):
    assert bad not in body, bad
INIT = 'function initNote(host, life, endpoint, sendAs) {\n' + body.rstrip() + '\n}\n'

# ---------------------------------------------------------------- ArcoviaNote.tsx
def j(v): return json.dumps(v, ensure_ascii=False)
controls = [
    ('endpoint', 'ControlType.String', 'Webhook URL', {'placeholder': 'GoHighLevel inbound webhook URL', 'description': 'Where the note is sent (JSON POST). Empty: the thank-you shows and nothing is sent.'}),
    ('sendAs', 'ControlType.Enum', 'Send as', {'options': ['json', 'form'], 'optionTitles': ['JSON', 'Form (no preflight)'], 'description': 'Form if the webhook refuses requests from a browser (CORS)'}),
    ('first', 'ControlType.String', 'First name', {'description': 'Bind to the Team collection: First name'}),
    ('name', 'ControlType.String', 'Name', {'description': 'Bind to the Team collection: Name (sent as "advisor")'}),
    ('slug', 'ControlType.String', 'Slug', {'description': 'Sent as "advisor_slug". Empty: made from the name, as the CMS slugs are'}),
    ('tag', 'ControlType.String', 'Tag', {'description': 'The GoHighLevel tag sent with the note'}),
    ('heading', 'ControlType.String', 'Heading', {'description': '{first} is the first name'}),
    ('lede', 'ControlType.String', 'Line', {'displayTextArea': True}),
    ('thanks', 'ControlType.String', 'Thank you', {'displayTextArea': True}),
]
props_ts = '\n'.join(f'    {k}: string' for k in DEFAULTS)
defaults_ts = '\n'.join(f'    {k}: {j(v)},' for k, v in DEFAULTS.items())
def control(k, t, title, extra):
    bits = [f'type: {t}', f'title: {j(title)}', f'defaultValue: DEFAULTS.{k}'] + [f'{a}: {j(b)}' for a, b in extra.items()]
    return f'    {k}: {{ {", ".join(bits)} }},'
controls_ts = '\n'.join(control(*c) for c in controls)

note_tsx = '''// @ts-nocheck
// The note's part of people.js runs here as it is (plain JavaScript), so this file is not type-checked.
/**
 * Arcovia: "Contact via Arcovia", the short note on a senior advisor's profile.
 *
 * The brief: leadership and team are reached by their direct email, senior advisors through
 * Arcovia, by a short form that names the advisor (each person's preference [TO CONFIRM]).
 * Written like the Contact page's note on the open white page: "Dear Ken, / My name is ___,
 * ___ at ___. / I'd like to talk about: ___ / You can reach me at ___.", every blank a real,
 * labelled field that grows with what is typed; consent, then "Send note"; the thank-you
 * replaces the note. Bind First name, Name and Slug to the Team collection on the profile page.
 * It posts JSON to the "Webhook URL" control (the GoHighLevel inbound webhook) with the tag
 * ("advisor"), the advisor's name and slug, clean field names, the visit source (kept by
 * ArcoviaHeader for the visit) and a spam-trap field; "Send as: Form" posts it form-encoded
 * without a CORS preflight. With no URL it shows the thank-you and logs what it would send.
 * The frame round it on the profile page is the scroll target (#contact) of the
 * "Contact via Arcovia" links.
 * Generated by tools/framer-note.py from the profile template, sections/contact.css,
 * sections/profile.css, styles.css and people.js.
 */
import * as React from "react"
import { addPropertyControls, ControlType } from "framer"
import { baseStyle, cssTag, sprite, useArcoviaScript } from "./ArcoviaBase.tsx"

const NOTE_CSS = `''' + CSS_TS + '''`

const MARKUP = ''' + j(markup) + '''

interface Props {
''' + props_ts + '''
    style?: React.CSSProperties
}

const DEFAULTS: Props = {
''' + defaults_ts + '''
}

const esc = (s) => String(s == null ? "" : s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c])

function buildMarkup(p) {
    const first = (p.first || "").trim() || (p.name || "").trim().split(/\\s+/)[0] || ""
    // As the Team CMS makes its slugs from the name: "João Pedro Gonçalves" -> "joao-pedro-goncalves"
    const slug = (p.slug || "").trim() || String(p.name || "").normalize("NFD").replace(/[\\u0300-\\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "")
    const withFirst = (s) => esc(String(s == null ? "" : s).split("{first}").join(first))
    const fill = {
        first: esc(first), name: esc(p.name), slug: esc(slug), tag: esc(p.tag),
        heading: withFirst(p.heading), lede: withFirst(p.lede), thanks: withFirst(p.thanks),
    }
    let out = MARKUP
    for (const k of Object.keys(fill)) out = out.split("@@" + k + "@@").join(fill[k])
    return out
}

/**
 * @framerSupportedLayoutWidth any-prefer-fixed
 * @framerSupportedLayoutHeight auto
 */
export default function ArcoviaNote(incoming: Partial<Props>) {
    const p = { ...DEFAULTS, ...incoming }
    const ref = React.useRef<HTMLDivElement>(null)
    const markup = React.useMemo(() => buildMarkup(p), [p.first, p.name, p.slug, p.tag, p.heading, p.lede, p.thanks])
    useArcoviaScript(ref, (root, life) => initNote(root, life, p.endpoint, p.sendAs), [markup, p.endpoint, p.sendAs])

    return (
        <div className="arc arc-note" ref={ref} style={p.style}>
            {baseStyle()}
            {cssTag("note", NOTE_CSS)}
            {sprite()}
            <div className="arc-note__body" dangerouslySetInnerHTML={{ __html: markup }} />
        </div>
    )
}

/* ==========================================================================
   Behaviour: the note's part of people.js, on this component's own markup.
   ========================================================================== */
''' + INIT + '''
addPropertyControls(ArcoviaNote, {
''' + controls_ts + '''
})
'''
open(f'{OUT}/ArcoviaNote.tsx', 'w', encoding='utf-8').write(note_tsx)

# ---------------------------------------------------------------- ArcoviaLink.tsx (ArcoviaEmail's two looks, any link)
link_tsx = '''/**
 * Arcovia: a link in ArcoviaEmail's two looks, with its own label and link.
 *
 * Link: the underlined text of the Team cards' email. Button: the primary button with its
 * arrow (as "Email Colin" on the profiles). Used for "Contact via Arcovia" on a senior
 * advisor's profile, linking to #contact (the frame round ArcoviaNote further down).
 * Generated by tools/framer-note.py; the styles are ArcoviaEmail's, so the two match exactly.
 */
import * as React from "react"
import { addPropertyControls, ControlType } from "framer"

interface Props {
    label: string
    link: string
    look: "link" | "button"
    size: number
    style?: React.CSSProperties
}

const FONT = '"Montserrat", "Helvetica Neue", Arial, sans-serif'

/**
 * @framerSupportedLayoutWidth any
 * @framerSupportedLayoutHeight auto
 */
export default function ArcoviaLink(props: Partial<Props>) {
    const { label = "Contact via Arcovia", link = "#contact", look = "button", size = 15, style } = props
    const [hover, setHover] = React.useState(false)
    const common = {
        href: link || undefined,
        onMouseEnter: () => setHover(true),
        onMouseLeave: () => setHover(false),
    }
    if (look === "button") {
        return (
            <a {...common} style={{
                display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 10,
                height: 52, padding: "0 28px", borderRadius: 999, boxSizing: "border-box",
                fontFamily: FONT, fontSize: 16, fontWeight: 500, letterSpacing: "0.005em", lineHeight: 1,
                whiteSpace: "nowrap", textDecoration: "none", color: "#f4f4f3", cursor: "pointer",
                background: hover
                    ? "linear-gradient(180deg, rgba(207,207,207,0.22) 0%, rgba(207,207,207,0.15) 100%), #292929"
                    : "linear-gradient(180deg, rgba(207,207,207,0.16) 0%, rgba(207,207,207,0.11) 100%), #292929",
                boxShadow: "0 0 0 1px rgba(41,41,41,0.05), 0 4px 4px 0 rgba(41,41,41,0.02), inset 0 1px 0 1px rgba(255,255,255,0.16), inset 0 -2px 0 1px #292929",
                transition: "background 160ms cubic-bezier(0.22,1,0.36,1)",
                ...style,
            }}>
                {label}
                <svg width="14" height="14" viewBox="0 0 16 16" aria-hidden="true" style={{ flex: "none", transform: hover ? "translateX(3px)" : "none", transition: "transform 240ms cubic-bezier(0.22,1,0.36,1)" }}>
                    <path d="M2.5 8h11M9 3.5 13.5 8 9 12.5" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
            </a>
        )
    }
    return (
        <a {...common} style={{
            fontFamily: FONT, fontSize: size, fontWeight: 500, lineHeight: 1.4, color: "#151515",
            textDecorationLine: "underline", textDecorationThickness: 1, textUnderlineOffset: 4,
            textDecorationColor: hover ? "#151515" : "rgba(21,21,21,0.32)",
            transition: "text-decoration-color 160ms cubic-bezier(0.22,1,0.36,1)",
            display: "inline-block", maxWidth: "100%", whiteSpace: "normal", cursor: "pointer",
            ...style,
        }}>
            {label}
        </a>
    )
}

addPropertyControls(ArcoviaLink, {
    label: { type: ControlType.String, title: "Label", defaultValue: "Contact via Arcovia" },
    link: { type: ControlType.Link, title: "Link", defaultValue: "#contact" },
    look: { type: ControlType.Enum, title: "Look", options: ["link", "button"], optionTitles: ["Link", "Button"], defaultValue: "button" },
    size: { type: ControlType.Number, title: "Size", defaultValue: 15, min: 12, max: 24, step: 1, hidden: (p: Props) => p.look === "button" },
})
'''
open(f'{OUT}/ArcoviaLink.tsx', 'w', encoding='utf-8').write(link_tsx)

# ---------------------------------------------------------------- Harness: the same markup, CSS and script in a plain page
filled = markup
for k, v in {**DEFAULTS, 'slug': SLUG}.items():
    filled = filled.replace(f'@@{k}@@', html.escape(v.replace('{first}', FIRST), quote=True))
sprite_svg = re.search(r'<svg class="sprite".*?</svg>', profile, re.S).group(0)
life_js = '''
function createLife() {
  var offs = [], dead = false;
  return {
    get dead() { return dead; },
    on: function (t, type, fn, o) { t.addEventListener(type, fn, o); offs.push(function () { t.removeEventListener(type, fn, o); }); },
    raf: function (fn) { return requestAnimationFrame(function (t) { if (!dead) fn(t); }); },
    timeout: function (fn, ms) { var id = setTimeout(function () { if (!dead) fn(); }, ms); offs.push(function () { clearTimeout(id); }); return id; },
    interval: function (fn, ms) { var id = setInterval(fn, ms); offs.push(function () { clearInterval(id); }); return id; },
    clear: function (id) { clearTimeout(id); clearInterval(id); },
    add: function (fn) { offs.push(fn); },
    dispose: function () { dead = true; offs.splice(0).forEach(function (f) { f(); }); }
  };
}
'''
harness = ('<!doctype html>\n<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">\n'
           '<title>ArcoviaNote harness</title>\n'
           '<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Montserrat:wght@400;500;600&display=swap">\n'
           '<link rel="stylesheet" href="/styles.css">\n'
           '<style>\nbody { margin: 0; background: #fff; }\n.frame { max-width: 660px; margin: 80px auto; padding-top: 88px; }\n'
           + CSS + '\n</style></head>\n<body>\n' + sprite_svg + '\n<div class="frame" id="contact">\n<div class="arc arc-note" id="host">\n<div class="arc-note__body">'
           + filled + '</div>\n</div>\n</div>\n<script>' + life_js + INIT +
           '\nwindow.__life = createLife();\ninitNote(document.getElementById("host"), window.__life, new URLSearchParams(location.search).get("endpoint") || "", "json");\n'
           '</script>\n</body></html>\n')
open(f'{OUT}/note-harness.html', 'w', encoding='utf-8').write(harness)
print('wrote ArcoviaNote.tsx', len(note_tsx), 'chars; ArcoviaLink.tsx', len(link_tsx), 'chars; note-harness.html')
print('defaults:', json.dumps(DEFAULTS, ensure_ascii=False))
