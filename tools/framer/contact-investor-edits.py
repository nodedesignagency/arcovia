# The investor-path change, as exact replacements. "markup" items apply to the form's HTML
# (in Framer: the decoded MARKUP string), "source" items to the CSS and script.
import json
OLD_INV = ('<p>We’re <select class="note-input note-select" data-autosize name="investor_type" aria-label="Investor type"><option value="" selected>a type of investor</option><option value="Family office">a family office</option><option value="Venture capital">a venture capital firm</option><option value="Fund">a fund</option><option value="LP">an LP</option><option value="Other">another kind of investor</option></select> with a typical check of <span class="nowrap"><input class="note-input" data-autosize name="check_size" type="text" placeholder="check size" aria-label="Typical check size">.</span> We invest at <input class="note-input" data-autosize name="stages" type="text" placeholder="stages" aria-label="Stages"> in <span class="nowrap"><input class="note-input" data-autosize name="sectors" type="text" placeholder="sectors" aria-label="Sectors">,</span> across <span class="nowrap"><input class="note-input" data-autosize name="geographies" type="text" placeholder="geographies" aria-label="Geographies">.</span></p>')
I = "                "
def pill(v):
    return f'{I}    <label class="note-path"><input type="checkbox" name="stages" value="{v}"><span class="note-path__dot note-path__dot--box" aria-hidden="true"></span>{v}</label>\n'
NEW_INV = (
    '<p>We’re <select class="note-input note-select" data-autosize name="investor_type" aria-label="Investor type"><option value="" selected>a type of investor</option><option value="Angel">an angel investor</option><option value="VC">a venture capital firm</option><option value="Family office">a family office</option><option value="Corporate VC">a corporate VC</option><option value="Private equity">a private equity firm</option></select> with a typical check of <span class="nowrap"><input class="note-input" data-autosize name="check_size" type="text" placeholder="check size" aria-label="Typical check size">.</span></p>\n'
    f'{I}<div class="note__block">\n'
    f'{I}  <p class="note__ask" id="nb-stages">Stages we invest at</p>\n'
    f'{I}  <div class="note-who note-stages" role="group" aria-labelledby="nb-stages" data-field>\n'
    + "".join(pill(v) for v in ["Pre-seed", "Seed", "Seed extension", "Series A", "Series B+ to pre-IPO", "Other"]) +
    f'{I}  </div>\n'
    f'{I}</div>\n'
    f'{I}<p>We invest in <span class="nowrap"><input class="note-input" data-autosize name="sectors" type="text" placeholder="industries" aria-label="Industries">,</span> across <span class="nowrap"><input class="note-input" data-autosize name="geographies" type="text" placeholder="regions" aria-label="Geographic focus">.</span> In the US, we look at <span class="nowrap"><input class="note-input" data-autosize name="us_state" type="text" placeholder="states, if any" aria-label="US state">.</span> We prefer <input class="note-input" data-autosize name="business_model" type="text" placeholder="business models" aria-label="Business model"> businesses.</p>'
)
OLD_CSS = '.note-path:has(:focus-visible) { outline: 1.5px solid var(--color-ink); outline-offset: 2px; }\n'
NEW_CSS = OLD_CSS + '/* Tick boxes (the investor\'s stages): the same pill with a square box instead of a ring */\n.note-path__dot--box { border-radius: 4px; }\n.note-path__dot--box::after { border-radius: 1.5px; }\n'
OLD_JS = ('      var LABELS = { partner_type: "Enquiry" };\n'
          '      var lines = [];\n'
          '      Array.prototype.forEach.call(form.elements, function (el) {\n'
          '        if (!el.name || OWN.test(el.name) || el.type === "hidden" || el.type === "radio" || el.type === "checkbox" || el.matches(":disabled")) return;\n'
          '        if (!data[el.name]) return;\n')
NEW_JS = ('      // A group of tick boxes (the investor\'s stages) goes in as one line, under its label here\n'
          '      var LABELS = { partner_type: "Enquiry", stages: "Stage" };\n'
          '      var lines = [], seen = {};\n'
          '      Array.prototype.forEach.call(form.elements, function (el) {\n'
          '        if (!el.name || OWN.test(el.name) || el.type === "hidden" || el.type === "radio" || (el.type === "checkbox" && !LABELS[el.name]) || el.matches(":disabled") || seen[el.name]) return;\n'
          '        if (!data[el.name]) return;\n'
          '        seen[el.name] = true;\n')
SPEC = [
    {"where": "markup", "old": OLD_INV, "new": NEW_INV},
    {"where": "source", "old": OLD_CSS, "new": NEW_CSS},
    {"where": "source", "old": OLD_JS, "new": NEW_JS},
]
if __name__ == "__main__":
    json.dump(SPEC, open("spec.json", "w"), ensure_ascii=False)
    print("spec.json", len(json.dumps(SPEC, ensure_ascii=False)))
