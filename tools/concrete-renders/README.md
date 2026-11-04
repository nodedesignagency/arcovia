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
