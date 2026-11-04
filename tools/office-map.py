#!/usr/bin/env python3
"""
Office maps for About's "Offices and closing" (site/assets/offices/*-map.svg).

A quiet street plan around each office, drawn in our monochrome: concrete-grey
ground, white streets (wider for bigger roads), parks a touch darker, water
darker still, buildings as soft grey blocks, the office's own building in
charcoal, and the map's square marker (as on the globe and in the city index)
on the office with a hairline ring round it. No labels (an SVG used as an image
can't load Montserrat); the city and the address sit under the map.

Data: OpenStreetMap via OpenFreeMap's vector tiles (OpenMapTiles schema, zoom 14),
free to use commercially. Credit "© OpenStreetMap contributors" wherever the
maps are shown (the section does, on each map).

    python3 tools/office-map.py            # writes both maps
    python3 tools/office-map.py --debug    # also writes PNG previews to review/

Needs: pip install mapbox-vector-tile shapely
"""
import math
import os
import subprocess
import sys

import mapbox_vector_tile
from shapely.geometry import LineString, MultiLineString, MultiPolygon, Point, Polygon, box, shape
from shapely.ops import unary_union

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, "site", "assets", "offices")
CACHE = os.path.join(ROOT, "review", "tiles")
TILES = "https://tiles.openfreemap.org/planet/20261101_080013_pt/{z}/{x}/{y}.pbf"
Z = 14
EXTENT = 4096

# The offices: the point is the office's building (the address in the brief)
OFFICES = [
    # 2029 Century Park East, Los Angeles, CA 90067 (Century Plaza Tower I)
    {"file": "los-angeles-map.svg", "lat": 34.0596151, "lon": -118.4138446, "span": 900},
    # 450 Ave. 200, San Juan, Puerto Rico 00901: the brief's address does not resolve to a
    # street; this is 450 Ave. de la Constitución (Torre de la Reina) [TO CONFIRM with the client]
    {"file": "san-juan-map.svg", "lat": 18.4639801, "lon": -66.0932872, "span": 1000},
]

W, H = 1600, 1200  # 4:3, as the cards

# Monochrome, from the site's tokens
GROUND = "#e4e4e3"
PARK = "#dcdcdb"
WATER = "#cfcfce"
BUILDING = "#d2d2d1"
OFFICE = "#565656"  # --color-charcoal
ROAD = "#ffffff"
INK = "#151515"  # --color-ink

# Street widths in px on the 1600 px map, by OpenMapTiles class
ROAD_W = {
    "motorway": 26, "trunk": 24, "primary": 20, "secondary": 17, "tertiary": 14,
    "minor": 9, "service": 5, "track": 3, "path": 2,
}


def to_world(lat, lon):
    """Web Mercator in zoom-14 tile units (one tile = EXTENT units)."""
    n = 2 ** Z * EXTENT
    x = (lon + 180.0) / 360.0 * n
    r = math.radians(lat)
    y = (1.0 - math.log(math.tan(r) + 1.0 / math.cos(r)) / math.pi) / 2.0 * n
    return x, y


def tile(x, y):
    os.makedirs(CACHE, exist_ok=True)
    path = os.path.join(CACHE, "%d-%d-%d.pbf" % (Z, x, y))
    if not os.path.exists(path):
        url = TILES.format(z=Z, x=x, y=y)
        subprocess.run(["curl", "-sS", "--compressed", "-A", "arcovia-site-build", "-o", path, url], check=True)
    with open(path, "rb") as f:
        return mapbox_vector_tile.decode(f.read(), default_options={"y_coord_down": True})


def offset(geom, dx, dy):
    """Tile coordinates to world units."""
    def move(coords):
        return [(px + dx, py + dy) for px, py in coords]
    t = geom["type"]
    c = geom["coordinates"]
    if t == "Polygon":
        return {"type": t, "coordinates": [move(r) for r in c]}
    if t == "MultiPolygon":
        return {"type": t, "coordinates": [[move(r) for r in p] for p in c]}
    if t == "LineString":
        return {"type": t, "coordinates": move(c)}
    if t == "MultiLineString":
        return {"type": t, "coordinates": [move(l) for l in c]}
    return None


def path_d(geom, tx):
    """SVG path data for a shapely geometry, in map pixels (tx maps world to px)."""
    out = []

    def ring(coords, close):
        pts = [tx(x, y) for x, y in coords]
        if len(pts) < 2:
            return
        s = "M%.1f %.1f" % pts[0] + "".join("L%.1f %.1f" % p for p in pts[1:])
        out.append(s + ("Z" if close else ""))

    def walk(g):
        if g.is_empty:
            return
        if isinstance(g, Polygon):
            ring(g.exterior.coords, True)
            for i in g.interiors:
                ring(i.coords, True)
        elif isinstance(g, LineString):
            ring(g.coords, False)
        elif hasattr(g, "geoms"):
            for p in g.geoms:
                walk(p)

    walk(geom)
    return "".join(out)


def build(office, debug=False):
    cx, cy = to_world(office["lat"], office["lon"])
    mpu = math.cos(math.radians(office["lat"])) * 40075016.686 / (2 ** Z * EXTENT)  # metres per unit
    half_w = office["span"] / mpu / 2
    half_h = half_w * H / W
    pad = half_w * 0.08
    frame = box(cx - half_w - pad, cy - half_h - pad, cx + half_w + pad, cy + half_h + pad)
    scale = W / (2 * half_w)

    def tx(x, y):
        return ((x - (cx - half_w)) * scale, (y - (cy - half_h)) * scale)

    layers = {"water": [], "park": [], "building": [], "roads": {}}
    x0, x1 = int((cx - half_w - pad) // EXTENT), int((cx + half_w + pad) // EXTENT)
    y0, y1 = int((cy - half_h - pad) // EXTENT), int((cy + half_h + pad) // EXTENT)
    for ty in range(y0, y1 + 1):
        for txi in range(x0, x1 + 1):
            data = tile(txi, ty)
            dx, dy = txi * EXTENT, ty * EXTENT
            for name, layer in data.items():
                for f in layer["features"]:
                    g = offset(f["geometry"], dx, dy)
                    if not g:
                        continue
                    try:
                        geom = shape(g)
                    except Exception:
                        continue
                    if not geom.is_valid:
                        geom = geom.buffer(0)
                    if not geom.intersects(frame):
                        continue
                    geom = geom.intersection(frame)
                    props = f.get("properties", {})
                    if name == "water":
                        layers["water"].append(geom)
                    elif name == "park" or (name == "landcover" and props.get("class") in ("grass", "wood")):
                        layers["park"].append(geom)
                    elif name == "building":
                        layers["building"].append(geom)
                    elif name == "transportation":
                        cls = props.get("class")
                        if cls not in ROAD_W or props.get("brunnel") == "tunnel":
                            continue
                        layers["roads"].setdefault(cls, []).append(geom)

    water = unary_union(layers["water"]) if layers["water"] else None
    park = unary_union(layers["park"]) if layers["park"] else None
    buildings = unary_union(layers["building"]) if layers["building"] else None

    # The office's own building: the footprint under the point (or the nearest one)
    here = Point(cx, cy)
    office_geom = None
    if buildings is not None:
        parts = list(buildings.geoms) if hasattr(buildings, "geoms") else [buildings]
        hits = [p for p in parts if p.contains(here)]
        if not hits:
            near = sorted(parts, key=lambda p: p.distance(here))
            hits = [p for p in near[:1] if p.distance(here) * mpu < 25]
        if hits:
            office_geom = hits[0]
            buildings = buildings.difference(office_geom)
            # The marker sits in the middle of the footprint, and the map centres on it
            # (the shift is a few metres, well inside the padding the features were clipped to)
            c = office_geom.representative_point() if office_geom.geom_type != "Polygon" else office_geom.centroid
            if not office_geom.contains(c):
                c = office_geom.representative_point()
            cx, cy = c.x, c.y

    svg = [
        '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 %d %d" width="%d" height="%d">' % (W, H, W, H),
        "<!-- Map data © OpenStreetMap contributors (ODbL), tiles by OpenFreeMap / OpenMapTiles. Made by tools/office-map.py -->",
        '<rect width="%d" height="%d" fill="%s"/>' % (W, H, GROUND),
    ]
    if park is not None:
        svg.append('<path fill="%s" d="%s"/>' % (PARK, path_d(park, tx)))
    if water is not None:
        svg.append('<path fill="%s" d="%s"/>' % (WATER, path_d(water, tx)))
    # Streets, small to big, so bigger roads run over the smaller ones
    for cls in ["path", "track", "service", "minor", "tertiary", "secondary", "primary", "trunk", "motorway"]:
        geoms = layers["roads"].get(cls)
        if not geoms:
            continue
        d = path_d(unary_union(geoms), tx)
        dash = ' stroke-dasharray="1 6"' if cls == "path" else ""
        op = ' stroke-opacity="0.9"' if cls == "path" else ""
        svg.append('<path fill="none" stroke="%s" stroke-width="%s" stroke-linecap="round" stroke-linejoin="round"%s%s d="%s"/>' % (ROAD, ROAD_W[cls], dash, op, d))
    if buildings is not None:
        svg.append('<path fill="%s" d="%s"/>' % (BUILDING, path_d(buildings, tx)))
    if office_geom is not None:
        svg.append('<path fill="%s" d="%s"/>' % (OFFICE, path_d(office_geom, tx)))
    # The marker: the map's square, with a hairline ring, on the office
    mx, my = tx(cx, cy)
    svg.append('<circle cx="%.1f" cy="%.1f" r="46" fill="none" stroke="%s" stroke-opacity="0.45" stroke-width="2"/>' % (mx, my, INK))
    svg.append('<rect x="%.1f" y="%.1f" width="22" height="22" fill="%s" stroke="#ffffff" stroke-width="4" paint-order="stroke"/>' % (mx - 11, my - 11, INK))
    svg.append("</svg>")

    path = os.path.join(OUT, office["file"])
    with open(path, "w", encoding="utf-8") as f:
        f.write("\n".join(svg) + "\n")
    print("%s  %.0f KB  office building: %s" % (path, os.path.getsize(path) / 1024, "yes" if office_geom is not None else "no"))
    if debug:
        os.makedirs(os.path.join(ROOT, "review"), exist_ok=True)


if __name__ == "__main__":
    debug = "--debug" in sys.argv
    for o in OFFICES:
        build(o, debug)
