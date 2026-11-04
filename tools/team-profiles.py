#!/usr/bin/env python3
"""Generate the Team profile pages, one per person: site/team/<slug>.html.

The people come from site/data/team.json (from the client's brief); the masthead,
menu, sprite and footer are taken from site/team.html, so every profile carries
the same shared markup (links rewritten one folder up). The profile itself is
SECTION:profile (sections/profile.css, people.js); advisors' pages also load
sections/contact.css for the short note's blanks, sign-off and thank-you.

    python3 tools/team-profiles.py        writes all fifteen pages

Change the template here, or the people in team.json, then run it again: the
pages are generated, never edited by hand. In Framer this is the Team CMS
collection (team.json's fields) with one template page.
"""
import html
import json
import pathlib
import re

ROOT = pathlib.Path(__file__).resolve().parent.parent
SITE = ROOT / "site"
OUT = SITE / "team"

data = json.loads((SITE / "data" / "team.json").read_text())
people = data["people"]
groups = {g["id"]: g for g in data["groups"]}
team_html = (SITE / "team.html").read_text()


def esc(s):
    return html.escape(s, quote=True)


def up(markup):
    """Point relative links and sources one folder up (the profiles live in site/team/)."""
    return re.sub(r'\b(href|src)="(?!#|https?:|mailto:|tel:|data:|/|\.\./)([^"]+)"', r'\1="../\2"', markup)


def between(start, end, include_end=True):
    i = team_html.index(start)
    j = team_html.index(end, i)
    return team_html[i:j + (len(end) if include_end else 0)]


sprite = between("  <!-- Sprite:", "  </svg>\n")
# The arrow for the Contact button and Previous / Next (as on the Contact page)
ARROW = '    <symbol id="icon-arrow" viewBox="0 0 16 16"><path d="M2.5 8h11M9 3.5 13.5 8 9 12.5" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></symbol>\n'
sprite = sprite.replace("  </svg>\n", ARROW + "  </svg>\n")
chrome = up(between('  <a class="visually-hidden" href="#main">', "  <main id=\"main\">", include_end=False))
footer = up(between("  <!-- SECTION:footer START", "  <!-- SECTION:footer END -->"))

ADVISOR_NOTE = data["advisors_note"]


def section_of(p):
    return groups[p["group"]]["section"]  # "leadership" or "advisors"


def portrait(p):
    crop = p.get("crop") or {}
    style = "; ".join(f"--{k}:{v}" for k, v in crop.items())
    style = f' style="{style}"' if style else ""
    if p.get("photo"):
        from PIL import Image  # only for the photo's size (width/height attributes)
        w, h = Image.open(SITE / p["photo"]).size
        return (f'<img class="profile__photo" src="../{p["photo"]}" alt="Portrait of {esc(p["name"])}" '
                f'width="{w}" height="{h}"{style}>')
    return (f'<img class="profile__photo" src="../assets/team/portrait-placeholder.svg" alt="" width="600" height="720"'
            f'{style} data-todo="Portrait of {esc(p["name"])} [PHOTO NEEDED]">')


def contact_row(p):
    first = esc(p["first"])
    linkedin = (f'<a class="profile__social" href="{esc(p["linkedin"])}" aria-label="{esc(p["name"])} on LinkedIn">'
                if p.get("linkedin") else
                f'<a class="profile__social" href="#" aria-label="{esc(p["name"])} on LinkedIn" data-todo="LinkedIn URL [TO CONFIRM]">')
    linkedin += '\n              <svg aria-hidden="true"><use href="#icon-linkedin"/></svg>\n            </a>'
    if p["contact"] == "email":
        return f'''          <div class="profile__contact">
            <a class="btn btn--primary profile__cta" href="#" data-mailto="{esc(p["email"])}">Email {first}<svg class="btn__icon" aria-hidden="true"><use href="#icon-arrow"/></svg></a>
            {linkedin}
            <a class="profile__email" data-email="{esc(p["email"])}">{esc(p["email"])} [at] arcovia.io</a>
          </div>'''
    return f'''          <div class="profile__contact">
            <a class="btn btn--primary profile__cta" href="#contact">Contact via Arcovia<svg class="btn__icon" aria-hidden="true"><use href="#icon-arrow"/></svg></a>
            {linkedin}
          </div>'''


def note(p):
    """The advisors' short note: it reaches the Arcovia team and names the advisor (the brief)."""
    first, name = esc(p["first"]), esc(p["name"])
    return f'''
          <!-- Contact via Arcovia: the brief's short form that reaches the team and names the advisor
               (advisors are independent). Written like the Contact page's note; people.js sends it.
               [COPY NEEDED] Draft heading, line and thank-you, to confirm with Lilla.
               [TO CONFIRM] the GoHighLevel tag ("advisor") and each advisor's contact preference. -->
          <section class="profile-note" id="contact" aria-labelledby="note-title" data-profile-note>
            <h2 class="profile-note__title" id="note-title">Contact {first} via Arcovia</h2>
            <p class="profile-note__lede">Senior advisors are independent, so notes to them come to the Arcovia team first. We’ll pass yours on to {first}.</p>

            <form class="profile-note__form" data-note-form data-endpoint="" novalidate>
              <input type="hidden" name="tag" value="advisor">
              <input type="hidden" name="advisor" value="{name}">
              <input type="hidden" name="advisor_slug" value="{esc(p["slug"])}">

              <p>Dear {first},</p>
              <p>My name is <span class="nowrap"><input class="note-input" data-autosize name="full_name" type="text" autocomplete="name" placeholder="your name" aria-label="Your name" data-error-name="your name" required>,</span> <input class="note-input" data-autosize name="role" type="text" autocomplete="organization-title" placeholder="your role" aria-label="Your role"> at <span class="nowrap"><input class="note-input" data-autosize name="company_name" type="text" autocomplete="organization" placeholder="company" aria-label="Company" data-error-name="your company" required>.</span></p>
              <div class="note__block">
                <label class="note__ask" for="pn-note">I’d like to talk about</label>
                <textarea class="note-area" id="pn-note" name="note" rows="1" maxlength="600" placeholder="What you have in mind" data-autogrow data-error-name="what you’d like to talk about" required></textarea>
              </div>
              <p>You can reach me at <span class="nowrap"><input class="note-input" data-autosize name="email" type="email" autocomplete="email" inputmode="email" placeholder="email address" aria-label="Email" data-error-name="your email address" required>.</span></p>

              <div class="note__foot">
                <label class="check" data-field data-error-alone="Please agree to the Privacy Policy so we can reply.">
                  <input type="checkbox" name="consent" value="yes" required>
                  <span class="check__box" aria-hidden="true"></span>
                  <span class="check__text">I agree to the <a href="../privacy.html">Privacy Policy</a> and to Arcovia keeping these details to reply to me.</span>
                </label>
                <button class="btn btn--primary note__send" type="submit"><span data-submit-label>Send note</span><svg class="btn__icon" aria-hidden="true"><use href="#icon-arrow"/></svg></button>
              </div>
              <p class="note__status" role="status" aria-live="polite" data-status></p>

              <!-- Visit source, saved with the lead (filled in by people.js) -->
              <input type="hidden" name="utm_source">
              <input type="hidden" name="utm_medium">
              <input type="hidden" name="utm_campaign">
              <input type="hidden" name="utm_term">
              <input type="hidden" name="utm_content">
              <input type="hidden" name="landing_page">
              <input type="hidden" name="referrer">
              <!-- Spam trap: hidden from people, filled in by bots -->
              <div class="trap" aria-hidden="true"><label>Leave this empty <input type="text" name="fax" tabindex="-1" autocomplete="off"></label></div>
            </form>

            <!-- Confirmation, in place of the note -->
            <div class="note-done" data-note-done hidden tabindex="-1">
              <svg class="note-done__mark" viewBox="0 0 72 57" aria-hidden="true"><use href="#a-mark"/></svg>
              <p class="note-done__text">Thank you. Your note is on its way to {first}.</p>
              <p class="note-done__meta">We’ll reply to <span data-done-email></span>.</p>
              <button class="note-done__again" type="button" data-note-again>Write another note</button>
            </div>
          </section>'''


def jsonld(p):
    org = {"@type": "Organization", "name": "Arcovia", "url": "https://arcovia.io"}
    person = {
        "@context": "https://schema.org",
        "@type": "Person",
        "name": p["name"],
        "jobTitle": p["title"],
        "url": f"https://arcovia.io/team/{p['slug']}",
        "description": p["bio"],
        # Leaders work for Arcovia; senior advisors are independent, so only affiliated
        ("worksFor" if section_of(p) == "leadership" else "affiliation"): org,
    }
    if p.get("linkedin"):
        person["sameAs"] = [p["linkedin"]]
    return json.dumps(person, ensure_ascii=False, indent=2).replace("</", "<\\/")


def page(i, p):
    prev_p, next_p = people[i - 1], people[(i + 1) % len(people)]
    is_adv = section_of(p) == "advisors"
    group_label = "Senior advisors" if is_adv else "Leadership"
    group_href = "../team.html#advisors" if is_adv else "../team.html#leadership"
    first_sentence = re.split(r"(?<=[.;])\s", p["bio"], maxsplit=1)[0].rstrip(";")
    desc = f'{p["name"]}, {p["title"]}. {first_sentence}'
    if not desc.endswith("."):
        desc += "."
    contact_css = '\n  <link rel="stylesheet" href="../sections/contact.css">' if is_adv else ""
    legal = f'\n          <p class="profile__legal">{esc(ADVISOR_NOTE)}</p>' if is_adv else ""
    return f'''<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
  <title>{esc(p["name"])} · Team · Arcovia</title>
  <meta name="description" content="{esc(desc)}">
  <meta name="robots" content="noindex, nofollow"><!-- Draft: keep staging out of search -->
  <meta name="theme-color" content="#ffffff">
  <link rel="icon" href="../assets/a-mark.svg" type="image/svg+xml">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Montserrat:wght@400;500;600&display=swap">
  <link rel="stylesheet" href="../styles.css">
  <!-- One stylesheet per section, so a section can be approved and moved to main on its own -->
  <link rel="stylesheet" href="../sections/profile.css">{contact_css}
  <link rel="stylesheet" href="../sections/footer.css">
  <script type="application/ld+json">
{jsonld(p)}
  </script>
</head>
<!-- Generated by tools/team-profiles.py from data/team.json: edit those, not this page -->
<body class="page--white">

{sprite}
{chrome}  <main id="main">

    <!-- SECTION:profile START · styles: sections/profile.css{" (+ sections/contact.css for the note)" if is_adv else ""} · scripts: people.js
         The profile template, one page per person (team/<slug>.html; in Framer, the Team CMS
         template). Portrait on cols 1-4, held in view; the group as a chip back to the Team page,
         the name, the title, the bio from the brief, then the Contact button and LinkedIn.
         {"Senior advisors: the legal line, and Contact via Arcovia (the short note below)." if is_adv else "Leadership: the button writes to the direct email, which people.js puts together."}
         Previous / All team members / Next at the end. -->
    <article class="profile" aria-labelledby="profile-name">
      <div class="profile__grid container">
        <div class="profile__media">
          <div class="profile__frame">
            {portrait(p)}
          </div>
        </div>

        <div class="profile__body">
          <a class="chip profile__group" href="{group_href}">{group_label}</a>
          <h1 class="profile__name" id="profile-name">{esc(p["name"])}</h1>
          <p class="profile__title">{esc(p["title"])}</p>
          <p class="profile__bio">{esc(p["bio"])}</p>{legal}
{contact_row(p)}{note(p) if is_adv else ""}
        </div>
      </div>

      <nav class="profile-nav container" aria-label="More of the team">
        <div class="profile-nav__inner">
          <a class="profile-nav__link profile-nav__link--prev" href="{prev_p["slug"]}.html" rel="prev">
            <span class="profile-nav__label"><svg class="btn__icon" aria-hidden="true"><use href="#icon-arrow"/></svg>Previous</span>
            <span class="profile-nav__name">{esc(prev_p["name"])}</span>
          </a>
          <a class="profile-nav__all" href="../team.html">All team members</a>
          <a class="profile-nav__link profile-nav__link--next" href="{next_p["slug"]}.html" rel="next">
            <span class="profile-nav__label">Next<svg class="btn__icon" aria-hidden="true"><use href="#icon-arrow"/></svg></span>
            <span class="profile-nav__name">{esc(next_p["name"])}</span>
          </a>
        </div>
      </nav>
    </article>
    <!-- SECTION:profile END -->

  </main>

{footer}

  <script src="../main.js"></script>
  <script src="../people.js"></script>
</body>
</html>
'''


OUT.mkdir(exist_ok=True)
for i, p in enumerate(people):
    (OUT / f'{p["slug"]}.html').write_text(page(i, p))
print(f"Wrote {len(people)} profiles to {OUT.relative_to(ROOT)}/")
