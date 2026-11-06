"""Writes the three case pages (site/case-<slug>.html) from the cases below and
track-record.html's shared chrome (head, sprite, masthead, menu, footer), so the three stay
one template. Change a case's copy here, not in the HTML, then run from site/:
    python3 ../tools/case-pages.py"""
import re, sys, html

# Situation, Approach, Outcome: (heading, text). The text is the brief's; the headings are
# [COPY NEEDED] drafts made only from the brief's own words, to confirm with Lilla. Where a
# heading is the text's first sentence, the text goes on from the second.
CASES = [
    dict(
        slug="brazil-telecom-tower-raise", tone="concrete", no="01", figure="$63M",
        name="Brazil Telecom Tower Raise",
        line="Equity and debt for a 1,360+ tower rollout.",
        meta=["Brazil Infrastructure Company (BIC)", "Telecom infrastructure", "2023"],
        situation=("Contracts in place, no capital structure", "Multi-decade master service agreements signed with Telefónica, with TIM and Claro close behind, but no institutional capital structure or investor narrative to fund a 1,360+ tower rollout."),
        approach=("The full capital-stack story", "We built the full capital-stack story around pass-through leaseback economics, contracted pre-build revenue and the CTO’s track record (co-founder of Brazil Tower Co., 1,700+ towers), and targeted infrastructure family offices and telecom infrastructure funds."),
        outcome=("$63M in equity and debt committed", "The first towers are deployment-ready, and the platform is on track for 1,360+ sites within four years."),
    ),
    dict(
        slug="mandela-station", tone="charcoal", no="02", figure="$54M+",
        name="Mandela Station",
        line="Debt and equity for a multi-asset portfolio, now a long-term capital relationship.",
        meta=["Mandela Station", "Multi-asset portfolio", "2020s"],
        situation=("One strategy across debt, equity and syndication", "Needed a capital strategy spanning senior debt, growth equity and institutional syndication to fund the expansion of the portfolio."),
        approach=("A multi-phase engagement through our family office platform", "We reframed the story from a developer pitch into an impact investment thesis and targeted mission-aligned family offices and impact capital."),
        outcome=("$54M+ secured across debt and equity", "An advisory mandate that grew into a long-term capital relationship."),
    ),
    dict(
        slug="valr-energy-growth-round", tone="paper", no="03", figure="$35M",
        name="VALR Energy Growth Round",
        line="Growth capital to launch into a 50,000-store network.",
        meta=["VALR Companies", "Consumer / CPG", "2025"],
        situation=("Growth capital for a 50,000-store launch", "Growth capital was needed to take the first nitrogen-infused energy drink into Core-Mark’s 50,000-store network. CPG investors weren’t connecting the agency business ($8M EBITDA) with the brand."),
        approach=("Repositioned as one integrated platform", "We repositioned VALR as a vertically integrated experiential and CPG platform, using the agency’s 17-year history as the de-risking anchor, and targeted growth equity and consumer family offices."),
        outcome=("$35M growth capital committed", "Launched into Core-Mark’s network with 50% faster sell-through than leading competitors in early pilots."),
    ),
]

src = open("track-record.html").read()
head, rest = src.split("<body>", 1)
pre_main, rest = rest.split("  <main id=\"main\">", 1)
_, post_main = rest.split("  </main>", 1)
post_main = re.sub(r"  <script src=\"concrete\.js\"></script>\n  <script src=\"main\.js\"></script>\n  <script src=\"books\.js\"></script>\n",
                   "  <script src=\"main.js\"></script>\n  <script src=\"case.js\"></script>\n", post_main)
assert "case.js" in post_main

# The parts' icons, copied from the pages that already carry them: the map and the target
# (Solar, Bold Duotone, as in About's "Our story") and the user's bar chart (the path picker)
def symbol(page, sid, new):
    m = re.search(r'<symbol id="' + sid + r'".*?</symbol>', open(page).read(), re.S)
    assert m, sid
    return "    " + m.group(0).replace('id="' + sid + '"', 'id="' + new + '"')
ICONS = "\n".join([
    "    <!-- Case parts: Solar, Bold Duotone (480 Design, CC BY 4.0, via Iconify) and the path picker's bar chart -->",
    symbol("about.html", "icon-story-map", "icon-case-situation"),
    symbol("about.html", "icon-story-point", "icon-case-approach"),
    symbol("index.html", "icon-raise", "icon-case-outcome"),
])

# The arrow for the other editions' rows
arrow = '    <symbol id="icon-arrow" viewBox="0 0 16 16"><path d="M2.5 8h11M9 3.5 13.5 8 9 12.5" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></symbol>\n  </svg>'
pre_main = pre_main.replace("\n  </svg>", "\n" + ICONS + "\n" + arrow, 1)
pre_main = pre_main.replace("<!-- Sprite: logo, the book covers' deboss. One source for header, menu, books and footer -->",
                            "<!-- Sprite: logo, the book cover's deboss, the arrow. One source for header, menu, book and footer -->")

INTRO = '''  <!-- The case opens with the book coming across from Selected work (case.js). Decided here,
       before the first paint, so nothing flashes: desktop only, not with reduced motion. If
       case.js never runs, the page shows itself after 2.5 s -->
  <script>
    (function () {
      var d = document.documentElement;
      if (!window.matchMedia || !matchMedia("(min-width: 1200px)").matches || matchMedia("(prefers-reduced-motion: reduce)").matches) return;
      d.classList.add("case-intro");
      if ("scrollRestoration" in history) history.scrollRestoration = "manual";
      setTimeout(function () { if (!d.classList.contains("case-playing")) d.classList.remove("case-intro"); }, 2500);
    })();
  </script>
'''

def book(c):
    return f'''        <div class="case__media">
          <!-- Component: book, the same as in Selected work, closed (no link), with the page
               block's head, tail and fore-edge for the turn as it comes across -->
          <div class="case__book" data-case-book aria-hidden="true">
            <div class="book book--{c["tone"]}">
              <div class="book__lift">
                <div class="book__body">
                  <div class="book__spine">
                    <p class="book__spine-text"><span class="book__spine-figure">{c["figure"]}</span>{c["name"]}</p>
                    <svg class="book__spine-mark" viewBox="0 0 72 57"><use href="#a-mark"/></svg>
                  </div>
                  <span class="book__edge book__edge--head"></span>
                  <span class="book__edge book__edge--tail"></span>
                  <span class="book__edge book__edge--fore"></span>
                  <span class="book__pages"></span>
                  <span class="book__leaf" style="--k:0.22"></span>
                  <span class="book__leaf" style="--k:0.44"></span>
                  <span class="book__leaf" style="--k:0.68"></span>
                  <div class="book__cover">
                    <div class="book__top">
                      <svg class="book__mark" viewBox="0 0 72 57"><use href="#a-mark"/></svg>
                      <span class="book__index">{c["no"]}</span>
                    </div>
                    <p class="book__figure">{c["figure"]}</p>
                    <p class="book__name">{c["name"]}</p>
                    <p class="book__line">{c["line"]}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>'''

def parts(c):
    out = []
    for key, label in (("situation", "Situation"), ("approach", "Approach"), ("outcome", "Outcome")):
        heading, text = c[key]
        out.append(f'''          <section class="case__part" aria-labelledby="case-{key}" data-case-in>
            <p class="case__kicker"><svg class="case__kicker-icon" aria-hidden="true"><use href="#icon-case-{key}"/></svg>{label}</p>
            <h2 class="case__heading" id="case-{key}">{heading}</h2>
            <p class="case__text">{text}</p>
          </section>''')
    return "\n".join(out)

def others(c):
    rows = []
    for o in CASES:
        if o is c:
            continue
        rows.append(f'''            <li><a class="case__other" href="case-{o["slug"]}.html"><span class="case__other-no">Edition No. {o["no"]}</span><span class="case__other-name">{o["name"]}</span><span class="case__other-figure">{o["figure"]}</span><svg class="case__other-arrow" aria-hidden="true"><use href="#icon-arrow"/></svg></a></li>''')
    return "\n".join(rows)

for c in CASES:
    dark = c["tone"] == "charcoal"
    h = head
    h = h.replace("<title>Track Record · Arcovia</title>", f"<title>{c['name']} · Track Record · Arcovia</title>")
    h = re.sub(r'<meta name="description" content="[^"]*">',
               f'<meta name="description" content="Edition No. {c["no"]}: {c["name"]}. {html.escape(c["outcome"][0] + ". " + c["outcome"][1], quote=True)}">', h)
    h = h.replace('  <link rel="stylesheet" href="sections/track-hero.css">\n', "")
    h = h.replace('  <link rel="stylesheet" href="sections/selected-work.css">\n',
                  '  <link rel="stylesheet" href="sections/selected-work.css"><!-- the book component -->\n  <link rel="stylesheet" href="sections/case.css">\n')
    h = h.replace('  <link rel="preload" href="assets/concrete.jpg" as="image">\n',
                  f'  <link rel="preload" href="assets/books/cover-{c["tone"]}.jpg" as="image">\n')
    h = h.replace("</head>", INTRO + "</head>")
    body_cls = "page--white case-page" if c["tone"] == "paper" else "case-page"
    meta = " · ".join(f"<span>{m}</span>" for m in c["meta"])
    section = f'''  <main id="main">

    <!-- SECTION:case START · styles: sections/selected-work.css (the book), sections/case.css · scripts: case.js
         A case's own page (component: case; one template, the three editions from the brief; in
         Framer a CMS template). The book from Selected work on the left, the case on the right.
         Opening it, after the user's Stripe Press reference: the book comes across from where it
         was clicked (or stands up on its spine in the middle), turns as it travels to the left,
         the black of Selected work dissolves into the book's own ground (concrete, charcoal,
         paper), then the case writes itself in on the right. At rest the book has no transform,
         so its cover stays crisp; on scrolling it stays beside the text.
         Copy from the brief (Track Record: Edition No. {c["no"]}); figures from the deck. The
         headings of Situation, Approach and Outcome are [COPY NEEDED] drafts made only from the
         brief's own words, to confirm with Lilla. -->
    <article class="case case--{c["tone"]}" data-case="{c["slug"]}"{' data-header-theme="dark"' if dark else ''} aria-labelledby="case-title">
      <div class="case__inner container">
{book(c)}

        <div class="case__content">
          <header class="case__head">
            <p class="chip case__chip" data-case-in>Edition No. {c["no"]}</p>
            <h1 class="case__title" id="case-title" data-case-in>{c["name"]}</h1>
            <p class="case__meta" data-case-in>{meta}</p>
          </header>

{parts(c)}

          <nav class="case__others" aria-label="Other editions" data-case-in>
            <ul class="case__others-list">
{others(c)}
            </ul>
          </nav>
        </div>
      </div>

      <div class="case__veil" aria-hidden="true"></div>
    </article>
    <!-- SECTION:case END -->

  </main>'''
    out = h + f'<body class="{body_cls}">' + pre_main + section + post_main
    open(f"case-{c['slug']}.html", "w").write(out)
    print("wrote", f"case-{c['slug']}.html")
