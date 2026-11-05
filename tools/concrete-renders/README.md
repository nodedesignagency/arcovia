# Concrete renders

The six "What we do" tiles on Home, after the user's references: pale speckled
concrete forms on the flat charcoal ground (`#565656`). One form per service,
each a whole object with charcoal under it (only its far end may run off the
right), framed like the capital stack, which the user picked as the model:

| Tile | Service | Form |
| --- | --- | --- |
| `narrative` | Investor Narrative & Positioning | seven sheets stacked like shingles, three lengths: memo, teaser, deck |
| `strategy` | Capital Strategy | one folded plate, four steps: size, anchor, structure, close |
| `equity` | Equity Raising | a pin field: a slab with a grid of square pegs rising towards the far corner, many institutions lifting one company |
| `debt` | Debt Advisory & Placement | a capital stack: five slabs, the senior one thickest at the base |
| `mna` | M&A and Project Finance | two masses fitted along one S-shaped joint |
| `fund` | Fund Formation & Partnerships | a pavilion: a roof slab on rows of round columns, on a plinth |

Earlier Equity options stay in the script as `equity_fins` and `equity_curve`.

Output: `site/assets/services/<tile>.jpg` and `.webp`, 1440 × 1440 (the tile
is at most 360px, so 2x is 720px).

## About: "Our story"

Four 4:5 portrait cards for the pinned photo in About's "Our story"
(Framer's `ArcoviaStory.tsx`), in place of its stock photos, in the same style:

| Card | Step | Form |
| --- | --- | --- |
| `story_studio` | A studio in Los Angeles | a lens: three stepped rings like a camera barrel, on a plinth |
| `story_turn` | A story moves capital | a tower of square slabs, each turned a little further |
| `story_mark` | Arcovia today | the Arcovia brandmark cast in concrete (official logo geometry), on a plinth |
| `story_houses` | Two houses | two volumes on one plinth, Arcovia and LPP Media, each with a doorway |

Output: `site/assets/story/<studio, turn, mark, houses>.jpg` and `.webp`, 1216 × 1520. Render with
`--res 1216 --res-y 1520`.

## What We Do: "How a mandate runs"

Four square cards for the steps on the What We Do page (`SECTION:mandate`), in
the same style (pale concrete on the charcoal), one form per step:

| Card | Step | Form |
| --- | --- | --- |
| `mandate_prepare` | Preparation and launch | a file rack: six plates in two heights standing in slots on one base, everything filed and ready |
| `mandate_outreach` | Marketing and outreach | seven plates fanned out from one pin like a spread hand of cards: one story in front of many investors |
| `mandate_diligence` | Diligence and negotiation | two blocks cut to fit along a comb joint, lined up but still held apart |
| `mandate_close` | Closing | an arch on two piers with its keystone set: the last piece that locks the structure |

Output: `site/assets/mandate/<prepare, outreach, diligence, close>.jpg` and
`.webp`, 1200 × 1200 (the card's image is about 400px at 1440, so 2x fits).
Render with `--res 1200 --samples 48`, then `finish.py … --size 1200`; each
takes under two minutes on 4 CPU cores.

## What We Do: the three paths

Three 6:5 panels for Founders, Investors and Institutions (`SECTION:paths`),
echoing the path picker's icons on Home:

| Panel | Path | Form |
| --- | --- | --- |
| `path_founders` | Founders, raise with conviction | three square columns rising in steps on a plinth: the bar chart |
| `path_investors` | Investors, opportunities worth your time | a solid block with a shallow round dish in its top, holding one sphere |
| `path_institutions` | Institutions, complex mandates end to end | a vault: a thick wall with a round opening, its heavy round door open on its hinge |

Output: `site/assets/paths/<founders, investors, institutions>.jpg` and `.webp`,
1440 × 1200. Render with `--res 1440 --res-y 1200 --samples 48`, then
`finish.py … --size 1440`; each takes about two minutes on 4 CPU cores.

## Re-rendering

Blender as a Python module, then Pillow for the finish:

```bash
python3 -m venv .venv && .venv/bin/pip install bpy==5.2.3 pillow
```

```bash
.venv/bin/python render.py --scene narrative --res 1440 --samples 48 --out out/narrative.png
```

```bash
.venv/bin/python finish.py out/narrative.png ../../site/assets/services/narrative --size 1440
```

`render.py` builds the scene, the concrete material and the light, and renders
with a transparent background; `finish.py` sets it on the charcoal and adds a
fine film grain. One tile takes about 6–7 minutes on 4 CPU cores. Add
`--res 480 --samples 24` for a quick look, `--crop X0 Y0 X1 Y1` to check
detail on part of the frame, and `--blend scene.blend` to open a scene in
Blender.
