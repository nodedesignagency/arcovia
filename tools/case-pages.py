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

# The parts' icons: Situation is Solar's eye-scan (Bold Duotone, from Iconify; the map read
# wrong to the user), Approach the target from About's "Our story" (Solar too), Outcome the
# user's bar chart from the path picker. Light layers at 20%, as everywhere on the site
EYE_SCAN = '<g fill="currentColor"><g opacity="0.2"><path d="M14 2.75C15.9068 2.75 17.2615 2.75159 18.2892 2.88976C19.2952 3.02503 19.8749 3.27869 20.2981 3.7019C20.7852 4.18904 20.9973 4.56666 21.1147 5.23984C21.2471 5.9986 21.25 7.08092 21.25 9C21.25 9.41422 21.5858 9.75 22 9.75C22.4142 9.75 22.75 9.41422 22.75 9L22.75 8.90369C22.7501 7.1045 22.7501 5.88571 22.5924 4.98199C22.417 3.97665 22.0432 3.32568 21.3588 2.64124C20.6104 1.89288 19.6615 1.56076 18.489 1.40314C17.3498 1.24997 15.8942 1.24998 14.0564 1.25H14C13.5858 1.25 13.25 1.58579 13.25 2C13.25 2.41421 13.5858 2.75 14 2.75Z"/><path d="M2.00001 14.25C2.41422 14.25 2.75001 14.5858 2.75001 15C2.75001 16.9191 2.75289 18.0014 2.88529 18.7602C3.00275 19.4333 3.21477 19.811 3.70191 20.2981C4.12512 20.7213 4.70476 20.975 5.71085 21.1102C6.73852 21.2484 8.09318 21.25 10 21.25C10.4142 21.25 10.75 21.5858 10.75 22C10.75 22.4142 10.4142 22.75 10 22.75H9.94359C8.10583 22.75 6.6502 22.75 5.51098 22.5969C4.33856 22.4392 3.38961 22.1071 2.64125 21.3588C1.95681 20.6743 1.58304 20.0233 1.40762 19.018C1.24992 18.1143 1.24995 16.8955 1.25 15.0964L1.25001 15C1.25001 14.5858 1.58579 14.25 2.00001 14.25Z"/><path d="M22 14.25C22.4142 14.25 22.75 14.5858 22.75 15L22.75 15.0963C22.7501 16.8955 22.7501 18.1143 22.5924 19.018C22.417 20.0233 22.0432 20.6743 21.3588 21.3588C20.6104 22.1071 19.6615 22.4392 18.489 22.5969C17.3498 22.75 15.8942 22.75 14.0564 22.75H14C13.5858 22.75 13.25 22.4142 13.25 22C13.25 21.5858 13.5858 21.25 14 21.25C15.9068 21.25 17.2615 21.2484 18.2892 21.1102C19.2952 20.975 19.8749 20.7213 20.2981 20.2981C20.7852 19.811 20.9973 19.4333 21.1147 18.7602C21.2471 18.0014 21.25 16.9191 21.25 15C21.25 14.5858 21.5858 14.25 22 14.25Z"/><path d="M9.94359 1.25H10C10.4142 1.25 10.75 1.58579 10.75 2C10.75 2.41421 10.4142 2.75 10 2.75C8.09319 2.75 6.73852 2.75159 5.71085 2.88976C4.70476 3.02503 4.12512 3.27869 3.70191 3.7019C3.21477 4.18904 3.00275 4.56666 2.88529 5.23984C2.75289 5.9986 2.75001 7.08092 2.75001 9C2.75001 9.41422 2.41422 9.75 2.00001 9.75C1.58579 9.75 1.25001 9.41422 1.25001 9L1.25 8.90369C1.24995 7.10453 1.24992 5.8857 1.40762 4.98199C1.58304 3.97665 1.95681 3.32568 2.64125 2.64124C3.38961 1.89288 4.33856 1.56076 5.51098 1.40314C6.65019 1.24997 8.10584 1.24998 9.94359 1.25Z"/></g><path d="M12 10.75C11.3096 10.75 10.75 11.3096 10.75 12C10.75 12.6904 11.3096 13.25 12 13.25C12.6904 13.25 13.25 12.6904 13.25 12C13.25 11.3096 12.6904 10.75 12 10.75Z"/><path fill-rule="evenodd" d="M5.89243 14.0598C5.29747 13.3697 5 13.0246 5 12C5 10.9754 5.29748 10.6303 5.89242 9.94021C7.08037 8.56222 9.07268 7 12 7C14.9273 7 16.9196 8.56222 18.1076 9.94021C18.7025 10.6303 19 10.9754 19 12C19 13.0246 18.7025 13.3697 18.1076 14.0598C16.9196 15.4378 14.9273 17 12 17C9.07268 17 7.08038 15.4378 5.89243 14.0598ZM9.25 12C9.25 10.4812 10.4812 9.25 12 9.25C13.5188 9.25 14.75 10.4812 14.75 12C14.75 13.5188 13.5188 14.75 12 14.75C10.4812 14.75 9.25 13.5188 9.25 12Z" clip-rule="evenodd"/></g>'
def symbol(page, sid, new):
    m = re.search(r'<symbol id="' + sid + r'".*?</symbol>', open(page).read(), re.S)
    assert m, sid
    return "    " + m.group(0).replace('id="' + sid + '"', 'id="' + new + '"')
ICONS = "\n".join([
    "    <!-- Case parts: Solar, Bold Duotone (480 Design, CC BY 4.0, via Iconify) and the path picker's bar chart -->",
    '    <symbol id="icon-case-situation" viewBox="0 0 24 24">' + EYE_SCAN + '</symbol>',
    symbol("about.html", "icon-story-point", "icon-case-approach"),
    symbol("index.html", "icon-raise", "icon-case-outcome"),
])

# The arrow for the other editions' rows
arrow = '    <symbol id="icon-arrow" viewBox="0 0 16 16"><path d="M2.5 8h11M9 3.5 13.5 8 9 12.5" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></symbol>\n  </svg>'
if 'id="icon-arrow"' in pre_main:   # track-record.html carries the arrow already (its table)
    arrow = "  </svg>"
pre_main = pre_main.replace("\n  </svg>", "\n" + ICONS + "\n" + arrow, 1)
pre_main = pre_main.replace("<!-- Sprite: logo, the book covers' deboss, the arrow. One source for header, menu, books, table and footer -->",
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
        rows.append(f'''            <li>
              <a class="case__other" href="case-{o["slug"]}.html">
                <span class="book book--mini book--{o["tone"]}" aria-hidden="true">
                  <span class="book__cover"><span class="book__top"><svg class="book__mark" viewBox="0 0 72 57"><use href="#a-mark"/></svg></span><span class="book__figure">{o["figure"]}</span></span>
                </span>
                <span class="case__other-title"><span class="case__other-no">Edition No. {o["no"]}</span><span class="case__other-name">{o["name"]}</span></span>
                <span class="case__other-figure">{o["figure"]}</span>
                <svg class="case__other-arrow" aria-hidden="true"><use href="#icon-arrow"/></svg>
              </a>
            </li>''')
    return "\n".join(rows)

for c in CASES:
    h = head
    h = h.replace("<title>Track Record · Arcovia</title>", f"<title>{c['name']} · Track Record · Arcovia</title>")
    h = re.sub(r'<meta name="description" content="[^"]*">',
               f'<meta name="description" content="Edition No. {c["no"]}: {c["name"]}. {html.escape(c["outcome"][0] + ". " + c["outcome"][1], quote=True)}">', h)
    h = h.replace('  <link rel="stylesheet" href="sections/track-hero.css">\n', "")
    h = h.replace('  <link rel="stylesheet" href="sections/transactions.css">\n', "")
    h = h.replace('  <link rel="stylesheet" href="sections/selected-work.css">\n',
                  '  <link rel="stylesheet" href="sections/selected-work.css"><!-- the book component -->\n  <link rel="stylesheet" href="sections/case.css">\n')
    h = h.replace('  <link rel="preload" href="assets/concrete.jpg" as="image">\n',
                  f'  <link rel="preload" href="assets/books/cover-{c["tone"]}.jpg" as="image">\n')
    h = h.replace("</head>", INTRO + "</head>")
    body_cls = "page--white case-page"   # every case on white (the user)
    # each separator stays with the item before it, so a wrapped line never starts with "·"
    meta = " ".join(f"<span>{m}&nbsp;·</span>" if i < len(c["meta"]) - 1 else f"<span>{m}</span>" for i, m in enumerate(c["meta"]))
    section = f'''  <main id="main">

    <!-- SECTION:case START · styles: sections/selected-work.css (the book), sections/case.css · scripts: case.js
         A case's own page (component: case; one template, the three editions from the brief; in
         Framer a CMS template). The book from Selected work on the left, the case on the right.
         Opening it, after the user's Stripe Press reference: the book comes across from where it
         was clicked (or stands up on its spine in the middle), turns as it travels to the left,
         the black of Selected work dissolves into the white page, then the case writes itself
         in on the right. At rest the book has no transform,
         so its cover stays crisp; on scrolling it stays beside the text.
         Copy from the brief (Track Record: Edition No. {c["no"]}); figures from the deck. The
         headings of Situation, Approach and Outcome are [COPY NEEDED] drafts made only from the
         brief's own words, to confirm with Lilla. -->
    <article class="case case--{c["tone"]}" data-case="{c["slug"]}" aria-labelledby="case-title">
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
