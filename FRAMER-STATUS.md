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

**Differences from the brief to confirm (left as built)**
- Raise range: the site says "$5M–$3B" (hero, path picker, meta description); the brief and deck say "$5M–$500M+".
- Map: 19 cities; the brief and CLAUDE.md list 8 (LA, SF, NY, San Juan, São Paulo, London, Paris, Abu Dhabi).
- What We Do hero subline differs from the brief ("Equity, debt, M&A, project finance and fund formation, from growth rounds to complex multi-party transactions.").
- The Founders / Investors / Institutions sections use different copy from the brief's audience pages. Missing from the brief: the H1s, "How it works" in 3 steps, the proof items, "Who we work with", the investor discretion and legal lines, and the institutions' four advisor cards. Investors' button says "Join our investor network"; the brief says "Share your mandate".
- Home "What we do" has no "See what we do" link (the brief asks for one).
- Footer has no tagline, LPP Media line or Instagram (the brief's footer has them).

**SEO and handover**
- CMS page titles (profiles, cases, legal docs) still use the site title. In Framer, set each detail page's title from its fields (e.g. "{Name} · Arcovia").
- Social share image (concrete with the A-mark) and schema.org Organization / Person markup.
- Tablet and phone have not been QA'd (desktop only until approval).
