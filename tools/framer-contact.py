"""Generate the Contact page's Framer code component (ArcoviaContact) from site/contact.html (SECTION:contact),
site/sections/contact.css, site/contact.js and the form parts in site/styles.css, so the Framer project stays a
faithful port of the approved HTML. Follows the Home and About ports' conventions (ArcoviaBase: baseStyle, cssTag,
sprite, useArcoviaScript; @media (max-width) -> @container arc; 100vw -> 100cqw).

    python3 tools/framer-contact.py     # writes review/framer/ArcoviaContact.tsx and contact-harness.html (git-ignored)

The section's markup goes in as HTML (dangerouslySetInnerHTML) with the editable copy filled in from the property
controls, and contact.js runs on it unchanged apart from the lifecycle (life.on / life.timeout / life.raf), so
the form behaves exactly as on the site. contact-harness.html runs the same markup, CSS and script in a plain page
for testing in Chromium before upload.

Upload: create_upload_url, PUT the file, fetch() it inside a project program, api.files.create/write
("ArcoviaContact.tsx"). The webhook URL is the component's "Webhook URL" control (GoHighLevel, the last step)."""
import html, json, os, re
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SITE = os.path.join(ROOT, 'site')
OUT = os.path.join(ROOT, 'review', 'framer')
os.makedirs(OUT, exist_ok=True)

page = open(f'{SITE}/contact.html', encoding='utf-8').read()
section_css = open(f'{SITE}/sections/contact.css', encoding='utf-8').read()
script = open(f'{SITE}/contact.js', encoding='utf-8').read()
styles = open(f'{SITE}/styles.css', encoding='utf-8').read()

# ---------------------------------------------------------------- CSS
parts = styles[styles.index('/* Check: a square box'):styles.index('/* ---------- Reduced motion ---------- */')]

def convert(c):
    c = c.replace('100vw', '100cqw')
    c = re.sub(r'@media \(max-width: (\d+)px\)', r'@container arc (max-width: \1px)', c)
    # contact.css marks script-only states with html.js; the component marks its own root instead
    c = re.sub(r'(?m)^(\s*)\.js \.', r'\1.is-live .', c)
    assert '../assets' not in c and 'url("assets' not in c
    return c

CSS = ('/* The page is white: no concrete behind the contact section */\n.arc-contact { background: var(--color-white); }\n\n'
       + convert(section_css) + '\n/* ---------- Form parts from styles.css (.check, .trap) ---------- */\n' + parts)
assert '.js ' not in re.sub(r'/\*.*?\*/', '', CSS, flags=re.S)
CSS_TS = CSS.replace('\\', '\\\\').replace('`', '\\`').replace('${', '\\${')

# ---------------------------------------------------------------- Markup
m = re.search(r'<!-- SECTION:contact START.*?-->(.*?)<!-- SECTION:contact END -->', page, re.S)
markup = re.sub(r'<!--.*?-->', '', m.group(1), flags=re.S)
markup = re.sub(r'\n\s*\n', '\n', markup).strip()
# The paths' questions start hidden (the canvas shows the note before a path is chosen); the script reveals one
markup, n = re.subn(r'(<fieldset class="note__body" data-path-fields="[^"]+")>', r'\1 hidden disabled>', markup)
assert n == 5, n
# Framer routes: one Legal page for now (as the footer); home is /
markup = markup.replace('href="privacy.html"', 'href="/legal"')

def sec(pattern):
    hit = re.search(pattern, markup, re.S)
    assert hit, pattern
    return hit

def text(s): return html.unescape(re.sub(r'<[^>]+>', '', s)).strip()

DEFAULTS = {}
def token(name, pattern, group=1, value=None):
    """Replace one exact piece of copy with @@name@@ and keep its current value as the control's default."""
    global markup
    hit = sec(pattern)
    DEFAULTS[name] = value if value is not None else text(hit.group(group))
    a, b = hit.span(group)
    markup = markup[:a] + f'@@{name}@@' + markup[b:]

token('chip', r'<p class="chip[^"]*">(.*?)</p>')
t = sec(r'<h1 class="contact__title" id="contact-title">(.*?)</h1>')
title1, title2 = [text(x) for x in t.group(1).split('<br>')]
markup = markup.replace(t.group(1), '@@title1@@<br> @@title2@@')
DEFAULTS['title1'], DEFAULTS['title2'] = title1, title2
token('lede', r'<p class="contact__lede">(.*?)</p>')
token('generalLabel', r'<dt>(General inquiries)</dt>')
g = sec(r'<a href="mailto:((?!@@)[^"]+)">\1</a>')
DEFAULTS['generalEmail'] = g.group(1)
markup = markup.replace(g.group(0), '<a href="mailto:@@generalEmail@@">@@generalEmail@@</a>', 1)
token('pressLabel', r'<dt>(Press)</dt>')
pr = sec(r'<a href="mailto:((?!@@)[^"]+)">\1</a>')
DEFAULTS['pressEmail'] = pr.group(1)
markup = markup.replace(pr.group(0), '<a href="mailto:@@pressEmail@@">@@pressEmail@@</a>', 1)
for i in (1, 2):
    o = sec(r'<li class="office">\s*<p class="office__city">([^<]+?) <span class="office__time" data-clock="([^"]+)"></span></p>\s*<address class="office__address">(.*?)</address>')
    DEFAULTS[f'office{i}City'] = o.group(1).strip()
    DEFAULTS[f'office{i}Zone'] = o.group(2)
    DEFAULTS[f'office{i}Address'] = '\n'.join(text(x) for x in o.group(3).split('<br>'))
    rep = (f'<li class="office" data-office="{i}">\n                <p class="office__city">@@office{i}City@@ '
           f'<span class="office__time" data-clock="@@office{i}Zone@@"></span></p>\n'
           f'                <address class="office__address">@@office{i}Address@@</address>')
    markup = markup[:o.start()] + rep + markup[o.end():]
token('thanks', r'<p class="note-done__text">(.*?)</p>')
assert '@@' not in json.dumps(DEFAULTS)

# ---------------------------------------------------------------- Script
body = script
head = body.index('(function () {')
body = body[head + len('(function () {'):]
body = body[:body.rindex('})();')]
body = body.replace('  "use strict";\n', '', 1)
def swap(a, b, count=1):
    global body
    assert body.count(a) == count, (a, body.count(a))
    body = body.replace(a, b)
swap('window.addEventListener("resize", function () {', 'life.on(window, "resize", function () {')
swap('requestAnimationFrame(function () { queued = false; refresh(); });', 'life.raf(function () { queued = false; refresh(); });')
swap('        setTimeout(function () {', '        life.timeout(function () {')
swap('if (document.fonts && document.fonts.ready) document.fonts.ready.then(refresh);',
     'if (document.fonts && document.fonts.ready) document.fonts.ready.then(function () { if (!life.dead) refresh(); });')
swap('  document.querySelectorAll("[data-contact-form]").forEach(initForm);', '''  // The webhook URL comes from the component's control; the root marks that the script runs (.is-live)
  host.classList.add("is-live");
  life.add(function () { host.classList.remove("is-live"); });
  host.querySelectorAll("[data-contact-form]").forEach(function (f) { f.setAttribute("data-endpoint", endpoint || ""); f.setAttribute("data-send", sendAs === "form" ? "form" : "json"); });
  host.querySelectorAll("[data-contact-form]").forEach(initForm);

  /* Office clocks: local time in each office, e.g. "7:02 AM PDT" (as main.js and ArcoviaHeader) */
  var clocks = host.querySelectorAll("[data-clock]");
  if (clocks.length && window.Intl) {
    var tick = function () {
      var now = new Date();
      clocks.forEach(function (el) {
        try {
          var parts = new Intl.DateTimeFormat("en-US", { hour: "numeric", minute: "2-digit", timeZone: el.getAttribute("data-clock") || undefined, timeZoneName: "short" }).formatToParts(now);
          var time = "", zone = "";
          parts.forEach(function (part) { if (part.type === "timeZoneName") zone = part.value; else time += part.value; });
          el.innerHTML = time.trim() + ' <span class="office__tz">' + zone + "</span>";
        } catch (e) { /* unknown zone: leave it empty */ }
      });
    };
    tick();
    life.timeout(function () { tick(); life.interval(tick, 60000); }, 60000 - (Date.now() % 60000) + 50);
  }''')
assert 'setTimeout' not in body and 'requestAnimationFrame' not in body and 'document.querySelectorAll' not in body
INIT = 'function initContact(host, life, endpoint, sendAs) {' + body.rstrip() + '\n}\n'

# ---------------------------------------------------------------- Component
def j(v): return json.dumps(v, ensure_ascii=False)
controls = [
    ('endpoint', 'ControlType.String', 'Webhook URL', {'placeholder': 'GoHighLevel inbound webhook URL', 'description': 'Where the note is sent (JSON POST). Empty: the thank-you shows and nothing is sent.'}),
    ('chip', 'ControlType.String', 'Chip', {}),
    ('title1', 'ControlType.String', 'Headline 1', {}),
    ('title2', 'ControlType.String', 'Headline 2', {}),
    ('lede', 'ControlType.String', 'Line', {'displayTextArea': True}),
    ('generalLabel', 'ControlType.String', 'Email 1 label', {}),
    ('generalEmail', 'ControlType.String', 'Email 1', {}),
    ('pressLabel', 'ControlType.String', 'Email 2 label', {}),
    ('pressEmail', 'ControlType.String', 'Email 2', {}),
    ('office1City', 'ControlType.String', 'Office 1', {}),
    ('office1Address', 'ControlType.String', 'Office 1 address', {'displayTextArea': True}),
    ('office1Zone', 'ControlType.String', 'Office 1 time zone', {'description': 'IANA zone for the live local time'}),
    ('office2City', 'ControlType.String', 'Office 2', {}),
    ('office2Address', 'ControlType.String', 'Office 2 address', {'displayTextArea': True}),
    ('office2Zone', 'ControlType.String', 'Office 2 time zone', {}),
    ('thanks', 'ControlType.String', 'Thank you', {'displayTextArea': True}),
]
DEFAULTS['endpoint'] = ''
DEFAULTS['sendAs'] = 'json'
DEFAULTS['sheet'] = False
props_ts = '\n'.join(f'    {k}: {"boolean" if k == "sheet" else "string"}' for k in list(DEFAULTS))
defaults_ts = '\n'.join(f'    {k}: {j(v)},' for k, v in DEFAULTS.items())
def control(k, t, title, extra):
    bits = [f'type: {t}', f'title: {j(title)}', f'defaultValue: DEFAULTS.{k}'] + [f'{a}: {j(b)}' for a, b in extra.items()]
    return f'    {k}: {{ {", ".join(bits)} }},'
controls_ts = '\n'.join(control(*c) for c in controls)
controls_ts = controls_ts.replace('    chip:', '    sendAs: { type: ControlType.Enum, title: "Send as", options: ["json", "form"], optionTitles: ["JSON", "Form (no preflight)"], defaultValue: DEFAULTS.sendAs, description: "Form if the webhook refuses requests from a browser (CORS)" },\n    chip:', 1)
controls_ts += '\n    sheet: { type: ControlType.Boolean, title: "Note", enabledTitle: "Sheet", disabledTitle: "Open", defaultValue: DEFAULTS.sheet },'

tsx = '''// @ts-nocheck
// contact.js runs here as it is (plain JavaScript), so this file is not type-checked.
/**
 * Arcovia: the Contact page (SECTION:contact).
 *
 * After the user's reference (the Kreativy studio contact page): a large headline top left,
 * then two columns. Left, sticky: the brief's line, the two emails, the two offices with
 * their live local time. Right: the form written as a short note on the open white page,
 * "Hello Arcovia, Here's why I'm writing:" and the brief's five paths as radio pills; the
 * chosen path's questions follow as blanks in the sentences (each a real, labelled field
 * that grows with what is typed). Consent, then "Send note"; the brief's thank-you replaces
 * the note. Tablet and phone: one column, the line under the headline, email and offices
 * after the note.
 * The note posts JSON to the "Webhook URL" control (the GoHighLevel inbound webhook): the
 * path as "tag" (founder, investor, institution, partner-press, talent), clean field names,
 * the visit source (UTM tags, first page, referrer: kept by ArcoviaHeader for the visit) and
 * a spam-trap field. "Send as: Form" posts it form-encoded without a CORS preflight, if the
 * webhook refuses browser requests. With no URL it shows the thank-you and logs what it would send.
 * "Note: Sheet" sets the note on a floating white sheet (the site's ?sheet=card).
 * Generated by tools/framer-contact.py from contact.html, sections/contact.css and contact.js on main.
 */
import * as React from "react"
import { addPropertyControls, ControlType } from "framer"
import { baseStyle, cssTag, sprite, useArcoviaScript } from "./ArcoviaBase.tsx"

const CONTACT_CSS = `''' + CSS_TS + '''`

const MARKUP = ''' + j(markup) + '''

interface Props {
''' + props_ts + '''
    style?: React.CSSProperties
}

const DEFAULTS: Props = {
''' + defaults_ts + '''
}

const esc = (s) => String(s == null ? "" : s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c])
const lines = (s) => String(s == null ? "" : s).split(/\\n/).map(esc).join("<br>")

function buildMarkup(p) {
    const fill = {
        chip: esc(p.chip), title1: esc(p.title1), title2: esc(p.title2), lede: esc(p.lede),
        generalLabel: esc(p.generalLabel), generalEmail: esc(p.generalEmail),
        pressLabel: esc(p.pressLabel), pressEmail: esc(p.pressEmail),
        office1City: esc(p.office1City), office1Address: lines(p.office1Address), office1Zone: esc(p.office1Zone),
        office2City: esc(p.office2City), office2Address: lines(p.office2Address), office2Zone: esc(p.office2Zone),
        thanks: esc(p.thanks),
    }
    let out = MARKUP
    for (const k of Object.keys(fill)) out = out.split("@@" + k + "@@").join(fill[k])
    return out
}

/**
 * @framerSupportedLayoutWidth any-prefer-fixed
 * @framerSupportedLayoutHeight auto
 */
export default function ArcoviaContact(incoming: Partial<Props>) {
    const p = { ...DEFAULTS, ...incoming }
    const ref = React.useRef<HTMLDivElement>(null)
    const markup = React.useMemo(() => buildMarkup(p), [p.chip, p.title1, p.title2, p.lede, p.generalLabel, p.generalEmail, p.pressLabel, p.pressEmail, p.office1City, p.office1Address, p.office1Zone, p.office2City, p.office2Address, p.office2Zone, p.thanks])
    useArcoviaScript(ref, (root, life) => initContact(root, life, p.endpoint, p.sendAs), [markup, p.endpoint, p.sendAs])

    return (
        <div className="arc arc-contact" ref={ref} style={p.style} data-sheet={p.sheet ? "card" : undefined}>
            {baseStyle()}
            {cssTag("contact", CONTACT_CSS)}
            {sprite()}
            <div className="arc-contact__body" dangerouslySetInnerHTML={{ __html: markup }} />
        </div>
    )
}

/* ==========================================================================
   Behaviour: contact.js as it is, on this component's own markup.
   ========================================================================== */
''' + INIT + '''
addPropertyControls(ArcoviaContact, {
''' + controls_ts + '''
})
'''
open(f'{OUT}/ArcoviaContact.tsx', 'w', encoding='utf-8').write(tsx)

# ---------------------------------------------------------------- Harness: the same markup, CSS and script in a plain page
filled = markup
for k, v in DEFAULTS.items():
    if isinstance(v, str):
        val = '<br>'.join(html.escape(x, quote=True) for x in v.split('\n')) if k.endswith('Address') else html.escape(v, quote=True)
        filled = filled.replace(f'@@{k}@@', val)
sprite_svg = re.search(r'<svg class="sprite".*?</svg>', page, re.S).group(0)
harness = ('<!doctype html>\n<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">\n'
           '<title>ArcoviaContact harness</title>\n'
           '<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Montserrat:wght@400;500;600&display=swap">\n'
           '<link rel="stylesheet" href="/styles.css">\n'
           '<style>\nbody { margin: 0; background: #fff; }\n.arc { container: arc / inline-size; }\n' + CSS + '\n</style></head>\n<body>\n'
           '<div class="arc arc-contact" id="host">\n' + sprite_svg + '\n<div class="arc-contact__body">' + filled + '</div>\n</div>\n'
           '</body></html>\n')
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
harness = harness.replace('</body></html>', '<script>' + life_js + INIT +
    '\nvar host = document.getElementById("host");\nif (/[?&]sheet=card\\b/.test(location.search)) host.setAttribute("data-sheet", "card");\n'
    'window.__life = createLife();\ninitContact(host, window.__life, new URLSearchParams(location.search).get("endpoint") || "", new URLSearchParams(location.search).get("send") || "json");\n</script>\n</body></html>')
open(f'{OUT}/contact-harness.html', 'w', encoding='utf-8').write(harness)
print('wrote', f'{OUT}/ArcoviaContact.tsx', len(tsx), 'chars;', f'{OUT}/contact-harness.html')
print('defaults:', json.dumps(DEFAULTS, ensure_ascii=False)[:600])
