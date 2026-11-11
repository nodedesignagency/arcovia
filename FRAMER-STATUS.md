# Framer status and QA (11 Nov 2026)

The live build is in the Framer project **Arcovia** (published at `cautious-shares-354627.framer.app`). This file records what is built there, what the QA pass on 11 Nov fixed, and what is still open. The HTML drafts in `/site` cover only the hero and statement.

## What is built (V1 scope)

| Page | Path | Sections |
|---|---|---|
| Home | `/` | Vault opening, hero + statement, "A record to build on" (4 figures), Selected work, What we do, World map, Leadership, Why founders, Sectors, CTA |
| What We Do | `/what-we-do` | Hero, Founders / Investors / Institutions (the 3 client-requested sections), Start from where you are, Narrative, How a mandate runs, GENESIS, **Who we raise from (added 11 Nov)**, Sectors, CTA |
| Track Record | `/track-record` + `/track-record/:case` (Cases CMS, 3) | Hero with the 3 editions, Selected transactions (CMS, 18), Senior advisor experience (CMS, 10), closing |
| Team | `/team` + `/team/:person` (Team CMS, 20) | Hero + stat band, Leadership, Senior advisors in 3 groups, The Arcovia team table, **Residency Program (added 11 Nov)** |
| About | `/about` | Hero, Our story, What we believe, How we work, The mark, World map (`#map`), Offices + closing |
| Contact | `/contact` | Five-path note form (GoHighLevel tags), emails, offices |
| Legal | `/legal` + `/legal/:doc` (Legal CMS, 4) | **Index page (added 11 Nov)**, Disclosures, Privacy, Cookies, Terms |

Almost every section is a code component (`Arcovia*.tsx`) sharing `ArcoviaBase.tsx` (tokens, chip, sprite, script lifecycle). The header and footer live in the "Site" layout template.

Assets panel folders (11 Nov): Layout templates · Components · Text styles (Headings, Body, Labels and nav) · Link styles · Color styles (Surfaces, Text, Lines) · Code (Foundation, Header and footer, Shared sections used on more than one page, then one folder per page: Home, What We Do, Track Record, Team, About, Contact, Legal). Put every new asset in its folder.

## Fixed in the QA pass (11 Nov)

- Footer: What We Do, Track Record, Team, About and Contact all pointed to `#` on every page (their link fields were empty). They now link to their pages. LinkedIn is hidden on the live site until a URL is set; the canvas still shows it.
- Home leadership cards: LinkedIn icons pointed to `#`; names went to `/team`, not to each profile. Names now open the profile, and the icons only show once a URL exists.
- Team page and every profile: the LinkedIn button rendered `href="null"`, which opened `/team/null`, a 404. It now only shows when the CMS LinkedIn field is filled.
- Profile "Contact via Arcovia" form: the Privacy Policy link went to the empty `/legal` page. It now goes to `/legal/privacy`.
- `/legal` was a blank page. It is now an index of the four documents, and the header's "Legal" link points to it.
- Header menu: the LinkedIn link pointed to `#`. It is hidden until a URL is set.
- Every page had the same title and description. What We Do, Track Record, Team, About, Contact and Legal now use the brief's SEO titles and descriptions.
- About, "How we work": once the rows stacked, the second line of each description was cut in half. The stacked strip is now 96px tall (was 80px).
- What We Do path buttons and the Residency button open the contact form on the matching path (`/contact?path=founder|investor|institution|talent`). The contact form now reads `?path=`.
- Links inside code components went nowhere in Framer's Preview, and did a full page reload on the live site. They were plain `<a href="/page">`, and the menu was outside Framer's root. Internal links now use `SiteLink` (in `ArcoviaBase.tsx`), which wraps Framer's `Link` so they go through Framer's router. This covers the header, menu, footer, Home path picker, "See what we do", "Meet the team", team cards, "Explore the map", the CTA buttons, the disclosures note and the offices button. The menu closes when one of its links is followed, and the header's active-page dash follows the address. Still plain on purpose: external, `mailto:`, same-page `#…` and `?query` links (Paths, Residency), plus the Selected work books and case pages, whose own transition script handles navigation. Use `SiteLink` for every new internal link in code.

## Still open before launch

**Blocking**
1. GoHighLevel webhook. The Contact form and the profile notes have no endpoint, so they show "Thank you" and send nothing. Paste the inbound webhook URL into the "Webhook URL" control on `ArcoviaContact` (Contact page) and `ArcoviaNote` (Team member page).
2. Plan and domain. The site is on the free `framer.app` subdomain with the "Made in Framer" badge. It needs a paid site plan, arcovia.io connected, and a 301 redirect from arcovia.com.
3. Legal text from counsel: [Arcovia legal entity], [privacy email], [retention period], transfer safeguards, the analytics provider, "Last updated" dates, and the LemVega regulatory line.
4. Cookie banner. The brief requires one if analytics use cookies. None is set up yet.

**Content from the client (Lilla / Colin)**
- LinkedIn company URL, each person's LinkedIn (CMS field), Instagram handle.
- Portraits: all 11 senior advisors and 6 team members show the placeholder; better originals for Caroline (stage photo) and Adil (200px).
- Confirm the direct emails shown on profiles (`firstname@arcovia.io`) and `hello@` / `press@`.
- Client names permission, the Brazil raise year (table says 2017, brief says 2023 or 2017), map hubs and consent, the wording of "The mark".

**Differences from the brief (confirmed by the user, 11 Nov: they come from the client)**
- Copy that differs from the brief is the client's: the "$5M–$3B" range, the What We Do hero line, and the Founders / Investors / Institutions copy. Keep it.
- The map's 19 cities are approved. Keep them.
- Home "What we do" now has the brief's "See what we do" link to the What We Do page (added 11 Nov). What We Do was already in the masthead's site map and in the menu.

**Waiting for a decision**
- Footer: the brief asks for the tagline "Where Capital Meets Conviction" (pages 6 and 29), Instagram "[TO CONFIRM: handle]" (pages 6 and 30), and "LPP Media, the creative house of Arcovia. Coming soon." (pages 2, 6 and 30). None is in the footer yet. Don't add them until the user says so; Instagram also needs the handle.

**SEO and handover**
- CMS page titles (profiles, cases, legal docs) still use the site title. In Framer, set each detail page's title from its fields (e.g. "{Name} · Arcovia").
- Once the LinkedIn and Instagram URLs exist, add them to the "Structured data (Organization)" layer in the Site template, as well as to the footer and header.
- Tablet and phone have not been QA'd (desktop only until approval).

## Accessibility and SEO audit (11 Nov, axe-core WCAG 2.1 AA + best practice, 1440)

Passed: one H1 on every page; heading levels in order; `lang="en-US"`; a canonical URL and `robots` index on every page; `sitemap.xml` (34 URLs) and `robots.txt`; colour contrast (no failures); form labels; visible keyboard focus (`:focus-visible`); every image has alt (decorative ones empty); OG and Twitter title and description on the main pages.

Fixed:
- No page had a `<main>` landmark. Every page breakpoint is now `main`.
- Team: 11 portrait links had no accessible name. The portrait (which repeats the name link under it) is now hidden from screen readers and the tab order; the name link stays.
- `/legal`: there was no H1 (the text style forced h2). It now has an H1, and the documents are h2.
- Track Record: the books in the hero jumped from H1 to H3 and shared the landmark name "Selected work" with the hero. They are now h2, in a region called "Case studies".
- What We Do: the situations table's scroll region repeated its section's name. It now has its own name.
- No share image. The site default is now 1200×630: concrete with the debossed A-mark and wordmark.
- No structured data. Organization JSON-LD is on every page (name, logo, both offices, email); Person JSON-LD is on every profile (name, title, photo, worksFor, LinkedIn when set).

Left as is:
- Home's H1 is hidden once the hero zoom has passed (the hero is `visibility: hidden`). It is present at the top, where search engines and screen readers start.
- The `aside` blocks on Contact and the legal documents sit inside a section (an axe best-practice note, not a WCAG failure).
- The "Made in Framer" badge sits outside the landmarks; it goes away with the paid plan.
