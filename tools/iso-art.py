"""
Isometric line drawings for the About page (What we believe, How we work) and the What We Do
page (GENESIS, our capital platform).

All the 3D drawings share one 30-degree isometric angle, fine ink lines, white tops and
fronts, concrete right-hand sides and one charcoal top. This draws them from boxes and
extruded shapes (painter's order) and prints SVG inner markup for a 160 x 120 viewBox,
flush left on a shared bottom line. Paste a printed drawing into its <svg> in
site/about.html (the CSS lives in sections/beliefs.css and sections/process.css).

    python3 tools/iso-art.py beliefs     # What we believe: 01-04 (class prefix belief__)
    python3 tools/iso-art.py process     # How we work: 01-04 (class prefix process__)
    python3 tools/iso-art.py genesis     # What We Do, GENESIS: 01-04 (class prefix genesis__)
"""
import math, json, sys
C30, S30 = math.cos(math.radians(30)), math.sin(math.radians(30))
VIEW = (1, 1, 1)

def proj(p):
    x, y, z = p
    return ((x - y) * C30, (x + y) * S30 - z)

def box(x0, y0, z0, dx, dy, dz, tag=None):
    x1, y1, z1 = x0 + dx, y0 + dy, z0 + dz
    V = lambda a, b, c: (a, b, c)
    faces = [
        ([V(x0,y0,z1),V(x1,y0,z1),V(x1,y1,z1),V(x0,y1,z1)], (0,0,1)),   # top
        ([V(x0,y0,z0),V(x0,y1,z0),V(x1,y1,z0),V(x1,y0,z0)], (0,0,-1)),
        ([V(x1,y0,z0),V(x1,y1,z0),V(x1,y1,z1),V(x1,y0,z1)], (1,0,0)),   # right
        ([V(x0,y0,z0),V(x0,y0,z1),V(x0,y1,z1),V(x0,y1,z0)], (-1,0,0)),
        ([V(x0,y1,z0),V(x0,y1,z1),V(x1,y1,z1),V(x1,y1,z0)], (0,1,0)),   # left (front)
        ([V(x0,y0,z0),V(x1,y0,z0),V(x1,y0,z1),V(x0,y0,z1)], (0,-1,0)),
    ]
    return [(f, n, tag) for f, n in faces]

def prism(poly_uz, y0, depth, tag=None):
    """A polygon in the x-z plane (x, z points), extruded along y from y0 to y0+depth."""
    n = len(poly_uz)
    back = [(x, y0, z) for x, z in poly_uz]
    front = [(x, y0 + depth, z) for x, z in poly_uz]
    A = sum(poly_uz[i][0]*poly_uz[(i+1)%n][1] - poly_uz[(i+1)%n][0]*poly_uz[i][1] for i in range(n)) / 2
    faces = [(front, (0,1,0), tag), (back, (0,-1,0), tag)]
    for i in range(n):
        (ax, az), (bx, bz) = poly_uz[i], poly_uz[(i+1)%n]
        dx, dz = bx - ax, bz - az
        nx, nz = (dz, -dx) if A > 0 else (-dz, dx)
        L = math.hypot(nx, nz) or 1
        faces.append(([(ax,y0,az),(bx,y0,bz),(bx,y0+depth,bz),(ax,y0+depth,az)], (nx/L, 0, nz/L), tag))
    return faces


def prism_xy(poly, z0, h, tag=None):
    """A polygon in the x-y plane, extruded up along z from z0 to z0+h."""
    n = len(poly)
    bottom = [(x, y, z0) for x, y in poly]
    top = [(x, y, z0 + h) for x, y in poly]
    A = sum(poly[i][0]*poly[(i+1)%n][1] - poly[(i+1)%n][0]*poly[i][1] for i in range(n)) / 2
    faces = [(top, (0,0,1), tag), (bottom, (0,0,-1), tag)]
    for i in range(n):
        (ax, ay), (bx, by) = poly[i], poly[(i+1)%n]
        dx, dy = bx - ax, by - ay
        nx, ny = (dy, -dx) if A > 0 else (-dy, dx)
        L = math.hypot(nx, ny) or 1
        faces.append(([(ax,ay,z0),(bx,by,z0),(bx,by,z0+h),(ax,ay,z0+h)], (nx/L, ny/L, 0), tag))
    return faces

PREFIX = 'belief'
def shade(n, tag, accent):
    nx, ny, nz = n
    if accent and tag == accent and nz > 0.9: return PREFIX + '__fill'
    if nx > 0.5: return PREFIX + '__face'            # the side facing right: concrete
    return PREFIX + '__front'                         # tops and fronts: white

def render(faces, extra_lines=(), accent=None, box_w=160, box_h=120, margin=2, under=(), lines_after=(), hidden_lines=()):
    seen = lambda fs: [(f, n, t) for f, n, t in fs if sum(a*b for a, b in zip(n, VIEW)) > 1e-6]
    vis_under, vis = seen(under), seen(faces)
    pts = [proj(p) for f, n, t in vis + vis_under for p in f] + [proj(p) for ln in list(extra_lines) + list(lines_after) + list(hidden_lines) for p in ln]
    minx, maxx = min(p[0] for p in pts), max(p[0] for p in pts)
    miny, maxy = min(p[1] for p in pts), max(p[1] for p in pts)
    k = min((box_w - 2*margin) / (maxx - minx), (box_h - 2*margin) / (maxy - miny))
    # flush left, on a shared bottom line, so the drawings line up with the text under them
    ox = 1 - minx * k
    oy = box_h - 1 - maxy * k
    tp = lambda p: (proj(p)[0] * k + ox, proj(p)[1] * k + oy)
    f1 = lambda v: ('%.1f' % v).rstrip('0').rstrip('.')
    out = []
    line = lambda ln, cls='': '<path%s d="M' % (' class="%s"' % cls if cls else '') + 'L'.join(f1(a) + ' ' + f1(b) for a, b in map(tp, ln)) + '"/>'
    for ln in hidden_lines: out.append(line(ln, PREFIX + '__hidden'))   # edges behind the solid, dashed
    for ln in extra_lines: out.append(line(ln))                       # lines behind everything
    depth = lambda f: sum(sum(p) for p in f) / len(f)
    for f, n, t in sorted(vis_under, key=lambda v: depth(v[0])) + sorted(vis, key=lambda v: depth(v[0])):
        out.append('<path class="%s" d="M%sZ"/>' % (shade(n, t, accent), 'L'.join(f1(a) + ' ' + f1(b) for a, b in map(tp, f))))
    for ln in lines_after: out.append(line(ln))                       # lines in front of everything
    return ''.join(out)



def beliefs():
    global PREFIX
    PREFIX = 'belief'
    arts = {}
    # 01 Capital follows conviction: four slabs stacked into one solid block, the top one charcoal
    f = []
    for i in range(4):
        f += box(0, 0, i * 13, 44, 44, 9, tag='top' if i == 3 else None)
    arts['01'] = render(f, accent='top')
    # 02 Alignment before transaction: a cube in two pieces, the top piece straight above its notch
    f = box(0, 0, 0, 22, 44, 44) + box(22, 0, 0, 22, 44, 22) + box(22, 0, 38, 22, 44, 22, tag='b')
    arts['02'] = render(f, accent='b')
    # 03 Founders keep their vision: a solid core inside an open frame, hidden edges dashed
    a, b = 0, 46
    V = [(x, y, z) for x in (a, b) for y in (a, b) for z in (a, b)]
    edges = [(p, q) for i, p in enumerate(V) for q in V[i+1:] if sum(u != v for u, v in zip(p, q)) == 1]
    back = [e for e in edges if (a, a, a) in e]
    front = [e for e in edges if (b, b, b) in e]
    rim = [e for e in edges if e not in back and e not in front]
    arts['03'] = render(box(14, 14, 14, 18, 18, 18, tag='core'), accent='core', hidden_lines=back, extra_lines=rim, lines_after=front)
    # 04 Trust compounds: columns that grow taller, the tallest topped in charcoal
    f = []
    hs = [12, 22, 36, 54]
    for i, h in enumerate(hs):
        f += box(i * 20, 0, 0, 14, 14, h, tag='last' if i == len(hs) - 1 else None)
    arts['04'] = render(f, accent='last')
    return arts

def process():
    global PREFIX
    PREFIX = 'process'
    arts = {}
    # 01 Parallel execution: two lanes side by side, a block on each at the same point
    lanes = box(0, 0, 0, 96, 18, 3) + box(0, 26, 0, 96, 18, 3)
    arts['01'] = render(box(52, 3, 3, 14, 12, 13) + box(52, 29, 3, 14, 12, 13, tag='a'), accent='a', under=lanes)
    # 02 Conflict-free: a level beam on a pivot, equal blocks at both ends
    pivot = prism([(40, 0), (56, 0), (48, 15)], 9, 14)
    beam = box(0, 4, 15, 96, 24, 3)
    arts['02'] = render(box(4, 8, 18, 16, 16, 16) + box(76, 8, 18, 16, 16, 16, tag='a'), accent='a', under=pivot + beam)
    # 03 Senior access: steps rising to a block at the top
    steps = prism([(0, 0), (80, 0), (80, 10), (60, 10), (60, 20), (40, 20), (40, 30), (20, 30), (20, 40), (0, 40)], 0, 30)
    arts['03'] = render(box(3, 8, 40, 14, 14, 14, tag='a'), accent='a', under=steps)
    # 04 Global reach: four blocks spread across one base, the four regions
    base = box(0, 0, 0, 84, 84, 4)
    blocks = box(10, 10, 4, 22, 22, 16) + box(52, 10, 4, 22, 22, 16) + box(10, 52, 4, 22, 22, 16) + box(52, 52, 4, 22, 22, 16, tag='a')
    arts['04'] = render(blocks, accent='a', under=base)
    return arts

def genesis():
    """What We Do, "GENESIS, our capital platform": the four cards (class prefix genesis__)."""
    global PREFIX
    PREFIX = 'genesis'
    arts = {}
    # 01 Investor targeting: four plates, each smaller than the one below (thesis, sector, stage,
    # check size), narrowing to one block: the qualified target, topped in charcoal
    f = []
    sizes = [60, 46, 32, 18]
    for i, s in enumerate(sizes):
        o = (60 - s) / 2
        f += box(o, o, i * 7, s, s, 5)
    f += box(23, 23, 28, 14, 14, 14, tag='a')
    arts['01'] = render(f, accent='a')
    # 02 Personalised outreach: one source and three lanes, each to a different investor
    # (a tall block topped in charcoal, a cube, a low wide one): no generic blasts
    lanes = box(10, 3, 0, 58, 7, 2) + box(10, 23, 0, 58, 7, 2) + box(10, 43, 0, 58, 7, 2)
    blocks = (box(0, 0, 0, 10, 52, 12)                        # the source: one low wall the three lanes leave from
              + box(68, 0, 0, 13, 13, 30, tag='a')            # a tall block, topped in charcoal (at the back)
              + box(68, 20, 0, 13, 13, 13)                    # a cube
              + box(68, 40, 0, 20, 13, 7))                    # a low wide one (in front)
    arts['02'] = render(blocks, accent='a', under=lanes)
    # 03 Engagement analytics: a field of columns at different heights (the signals), the
    # tallest, the most likely investor, topped in charcoal
    hs = [[8, 14, 10, 6], [18, 30, 16, 9], [12, 44, 22, 12]]
    f = []
    for r, row in enumerate(hs):
        for c, h in enumerate(row):
            f += box(c * 16, r * 16, 4, 11, 11, h, tag='a' if h == 44 else None)
    arts['03'] = render(f, accent='a', under=box(-4, -4, 0, 63, 47, 4))
    # 04 Pipeline conversion: two blocks joined by a bridge flush with their tops, a small
    # block crossing it to the meeting: qualified investors routed to founders, warm introductions
    f = box(0, 0, 0, 28, 28, 24) + box(70, 0, 0, 28, 28, 24)
    bridge = box(28, 8, 20, 42, 12, 4)
    arts['04'] = render(f + bridge + box(44, 10, 24, 9, 8, 9, tag='a'), accent='a')
    return arts

if __name__ == '__main__':
    which = sys.argv[1] if len(sys.argv) > 1 else 'beliefs'
    for k, v in {'beliefs': beliefs, 'process': process, 'genesis': genesis}[which]().items():
        print('<!-- %s %s -->' % (which, k))
        print(v)
