"""
Arcovia: concrete renders for the "What we do" tiles.

One square image per service, after the user's references: pale speckled
concrete forms with soft rounded edges, lit by a broad soft light from the
upper left, cut off by the frame, on a flat charcoal ground (#565656, the
site's charcoal). Each form says something about its service:

  narrative  Investor Narrative & Positioning  sheets stacked like shingles, in three lengths (memo, teaser, deck)
  strategy   Capital Strategy                  four soft steps: size, anchor, structure, close
  equity     Equity Raising                    rows of fins rising left to right
  debt       Debt Advisory & Placement         a capital stack: five slabs, thick senior at the base
  mna        M&A and Project Finance           two masses fitted along one S-shaped joint
  fund       Fund Formation & Partnerships     one slab carried by a colonnade

Rendered with Blender's Cycles (the `bpy` module from PyPI), then set on the
charcoal and given a fine film grain by finish.py.

    python render.py --scene narrative --res 1600 --samples 160 --out out/narrative.png
"""
import argparse
import math
import sys

import bpy  # first: the bpy module brings bmesh and mathutils with it
import bmesh
from mathutils import Vector

# ---------------------------------------------------------------------------
# Scene setup


def reset():
    bpy.ops.wm.read_factory_settings(use_empty=True)
    sc = bpy.context.scene
    sc.render.engine = "CYCLES"
    sc.cycles.device = "CPU"
    sc.render.film_transparent = True
    sc.render.image_settings.file_format = "PNG"
    sc.render.image_settings.color_mode = "RGBA"
    sc.render.image_settings.color_depth = "16"
    try:
        sc.view_settings.view_transform = "AgX"
        sc.view_settings.look = "None"
    except TypeError:
        sc.view_settings.view_transform = "Filmic"
    sc.cycles.max_bounces = 8
    sc.cycles.diffuse_bounces = 4
    sc.cycles.glossy_bounces = 2
    sc.cycles.transparent_max_bounces = 2
    sc.cycles.use_denoising = True
    sc.cycles.use_adaptive_sampling = True
    sc.cycles.adaptive_threshold = 0.02
    try:
        sc.cycles.denoiser = "OPENIMAGEDENOISE"
    except TypeError:
        pass
    world(0.6, 0.16)
    return sc


def world(grey, strength):
    w = bpy.data.worlds.new("World")
    bpy.context.scene.world = w
    try:
        w.use_nodes = True
    except AttributeError:
        pass
    bg = w.node_tree.nodes.get("Background")
    if bg is None:
        bg = w.node_tree.nodes.new("ShaderNodeBackground")
        out = w.node_tree.nodes.new("ShaderNodeOutputWorld")
        w.node_tree.links.new(bg.outputs[0], out.inputs[0])
    bg.inputs["Color"].default_value = (grey, grey, grey, 1)
    bg.inputs["Strength"].default_value = strength


def look_at(ob, target):
    d = Vector(target) - ob.location
    ob.rotation_euler = d.to_track_quat("-Z", "Y").to_euler()


def camera(loc, target, lens=50.0, shift=(0.0, 0.0), dof=None):
    cd = bpy.data.cameras.new("Camera")
    cd.lens = lens
    cd.sensor_width = 36
    cd.shift_x, cd.shift_y = shift
    cd.clip_end = 200
    if dof:
        cd.dof.use_dof = True
        cd.dof.focus_distance = dof[0]
        cd.dof.aperture_fstop = dof[1]
    cam = bpy.data.objects.new("Camera", cd)
    bpy.context.scene.collection.objects.link(cam)
    cam.location = loc
    look_at(cam, target)
    bpy.context.scene.camera = cam
    return cam


def area_light(name, loc, target, size, energy, size_y=None):
    ld = bpy.data.lights.new(name, "AREA")
    ld.shape = "RECTANGLE"
    ld.size = size
    ld.size_y = size_y or size
    ld.energy = energy
    ob = bpy.data.objects.new(name, ld)
    bpy.context.scene.collection.objects.link(ob)
    ob.location = loc
    look_at(ob, target)
    return ob


def studio(key=(4.5, -6.0, 6.0), target=(0, 0, 0), key_energy=2200.0, fill_energy=260.0, key_size=4.0):
    """The references' light: one soft key from the upper right and front, so
    the faces turned to the left (the ones the camera sees from its place on the
    left) fall into a mid grey; a weak broad fill from the left; and a dim
    grey dome."""
    area_light("Key", key, target, key_size, key_energy)
    fx = (-abs(key[0]) * 1.3, key[1], key[2] * 0.5)
    area_light("Fill", fx, target, 10.0, fill_energy)


# ---------------------------------------------------------------------------
# Concrete: pale micro-concrete with dark pits and short fibres, a soft
# mottling, a fine grain. Textured in world space, so every form shows its own
# patch of the same cast.


class Nodes:
    def __init__(self, nt):
        self.nt = nt
        self.N = nt.nodes
        self.L = nt.links

    def new(self, kind, **props):
        n = self.N.new(kind)
        for k, v in props.items():
            setattr(n, k, v)
        return n

    def link(self, a, b):
        self.L.new(a, b)

    def math(self, op, a, b=None, c=None):
        n = self.new("ShaderNodeMath", operation=op)
        for i, v in enumerate((a, b, c)):
            if v is None:
                continue
            if isinstance(v, (int, float)):
                n.inputs[i].default_value = v
            else:
                self.link(v, n.inputs[i])
        return n.outputs[0]

    def lerp(self, a, b, t):
        # a + (b - a) * t
        return self.math("MULTIPLY_ADD", self.math("SUBTRACT", b, a), t, a)


def concrete(name="Concrete", base=0.60, fleck_scale=1.0):
    m = bpy.data.materials.new(name)
    try:
        m.use_nodes = True
    except AttributeError:
        pass
    g = Nodes(m.node_tree)
    g.N.clear()
    out = g.new("ShaderNodeOutputMaterial")
    bsdf = g.new("ShaderNodeBsdfPrincipled")
    g.link(bsdf.outputs[0], out.inputs["Surface"])
    pos = g.new("ShaderNodeNewGeometry").outputs["Position"]

    def noise(scale, detail=3.0, rough=0.55):
        n = g.new("ShaderNodeTexNoise")
        n.inputs["Scale"].default_value = scale
        n.inputs["Detail"].default_value = detail
        n.inputs["Roughness"].default_value = rough
        g.link(pos, n.inputs["Vector"])
        return n.outputs["Fac"]

    def flecks(scale, density, rmin, rmax, stretch=(1, 1, 1), rot=(0, 0, 0)):
        """Round (or, stretched, needle-like) spots in a share of Voronoi cells."""
        # turn first, then stretch, so each set of fibres lies along its own direction
        turn = g.new("ShaderNodeMapping")
        turn.inputs["Rotation"].default_value = rot
        g.link(pos, turn.inputs["Vector"])
        mp = g.new("ShaderNodeMapping")
        mp.inputs["Scale"].default_value = stretch
        g.link(turn.outputs["Vector"], mp.inputs["Vector"])
        vo = g.new("ShaderNodeTexVoronoi")
        vo.voronoi_dimensions = "3D"
        vo.feature = "F1"
        vo.inputs["Scale"].default_value = scale * fleck_scale
        g.link(mp.outputs["Vector"], vo.inputs["Vector"])
        sep = g.new("ShaderNodeSeparateColor")
        g.link(vo.outputs["Color"], sep.inputs[0])
        on = g.math("GREATER_THAN", sep.outputs[0], 1.0 - density)
        r = g.math("MULTIPLY_ADD", sep.outputs[1], rmax - rmin, rmin)
        r0 = g.math("MULTIPLY", r, 0.55)
        mr = g.new("ShaderNodeMapRange", interpolation_type="SMOOTHSTEP")
        g.link(vo.outputs["Distance"], mr.inputs["Value"])
        g.link(r0, mr.inputs["From Min"])
        g.link(r, mr.inputs["From Max"])
        mr.inputs["To Min"].default_value = 1.0
        mr.inputs["To Max"].default_value = 0.0
        return g.math("MULTIPLY", mr.outputs[0], on), sep.outputs[2]

    mott = noise(0.9, 4.0, 0.6)
    cloud = noise(6.0, 3.0, 0.6)
    grain = noise(260.0, 2.0, 0.6)

    # dark pits: many tiny ones, a few larger ones
    pits_s, tone_s = flecks(38.0, 0.46, 0.09, 0.21)
    pits_l, tone_l = flecks(9.0, 0.20, 0.05, 0.11)
    # short fibres in three directions
    fib = None
    for rot in ((0.9, 0.2, 0.4), (1.6, 0.9, -0.6), (-0.7, 1.5, 1.1), (2.3, -1.2, 0.3), (0.4, 2.0, -1.4), (-1.5, -0.6, 2.2)):
        f, _ = flecks(6.0, 0.16, 0.06, 0.10, stretch=(5.0, 5.0, 1.0), rot=rot)
        fib = f if fib is None else g.math("MAXIMUM", fib, f)
    # pale aggregate, barely there
    pale, _ = flecks(30.0, 0.15, 0.10, 0.22)

    v = g.math("MULTIPLY_ADD", mott, 0.07, base - 0.035)
    v = g.math("MULTIPLY_ADD", cloud, 0.03, g.math("SUBTRACT", v, 0.015))
    v = g.math("MULTIPLY_ADD", grain, 0.06, g.math("SUBTRACT", v, 0.03))
    v = g.lerp(v, base + 0.06, g.math("MULTIPLY", pale, 0.35))
    dark_s = g.math("MULTIPLY_ADD", tone_s, 0.24, 0.12)
    dark_l = g.math("MULTIPLY_ADD", tone_l, 0.20, 0.07)
    v = g.lerp(v, dark_s, pits_s)
    v = g.lerp(v, dark_l, pits_l)
    v = g.lerp(v, 0.26, g.math("MULTIPLY", fib, 0.75))
    g.link(v, bsdf.inputs["Base Color"])

    rough = g.math("MULTIPLY_ADD", grain, 0.12, 0.70)
    g.link(rough, bsdf.inputs["Roughness"])
    for key, val in (("Specular IOR Level", 0.32), ("IOR", 1.45)):
        if key in bsdf.inputs:
            bsdf.inputs[key].default_value = val

    # relief: pits sink in, the grain stands up a little
    h = g.math("MULTIPLY_ADD", grain, 0.35, 0.0)
    h = g.math("SUBTRACT", h, g.math("MAXIMUM", pits_s, pits_l))
    h = g.math("SUBTRACT", h, g.math("MULTIPLY", fib, 0.4))
    bump = g.new("ShaderNodeBump")
    bump.inputs["Strength"].default_value = 0.3
    bump.inputs["Distance"].default_value = 0.003
    g.link(h, bump.inputs["Height"])
    g.link(bump.outputs[0], bsdf.inputs["Normal"])
    return m


# ---------------------------------------------------------------------------
# Forms. Every edge is rounded by a bevel with hardened normals, so the flat
# faces stay flat and the edges catch the light like cast concrete.


def _finish(name, bm, loc, rot, bevel, segs, mat, angle=None):
    me = bpy.data.meshes.new(name)
    bm.to_mesh(me)
    bm.free()
    ob = bpy.data.objects.new(name, me)
    bpy.context.scene.collection.objects.link(ob)
    ob.location = loc
    ob.rotation_euler = rot
    if bevel:
        mod = ob.modifiers.new("Bevel", "BEVEL")
        mod.width = bevel
        mod.segments = segs
        mod.use_clamp_overlap = True
        mod.harden_normals = True
        if angle is None:
            mod.limit_method = "NONE"
        else:
            mod.limit_method = "ANGLE"
            mod.angle_limit = math.radians(angle)
        me.shade_smooth()
    me.materials.append(mat)
    return ob


def box(name, size, loc, mat, rot=(0, 0, 0), bevel=0.02, segs=8):
    """A box of size (x, y, z) centred on loc."""
    bm = bmesh.new()
    bmesh.ops.create_cube(bm, size=1.0)
    for vert in bm.verts:
        vert.co = Vector((vert.co.x * size[0], vert.co.y * size[1], vert.co.z * size[2]))
    return _finish(name, bm, loc, rot, bevel, segs, mat)


def column(name, radius, height, loc, mat, segs=96):
    """A round column, smooth shaded (its ends are hidden in the slab and below the frame)."""
    bm = bmesh.new()
    bmesh.ops.create_cone(bm, cap_ends=True, segments=segs, radius1=radius, radius2=radius, depth=height)
    ob = _finish(name, bm, loc, (0, 0, 0), 0, 0, mat)
    ob.data.shade_smooth()
    return ob


def prism(name, pts, depth, mat, plane="XZ", loc=(0, 0, 0), rot=(0, 0, 0), bevel=0.03, segs=10, angle=20):
    """A polygon drawn in one plane, pushed out along the third axis by depth.
    XZ: drawn as (x, z), pushed along +y.  XY: drawn as (x, y), pushed along +z."""
    bm = bmesh.new()
    if plane == "XZ":
        vs = [bm.verts.new((p[0], 0.0, p[1])) for p in pts]
        push = Vector((0, depth, 0))
    else:
        vs = [bm.verts.new((p[0], p[1], 0.0)) for p in pts]
        push = Vector((0, 0, depth))
    face = bm.faces.new(vs)
    res = bmesh.ops.extrude_face_region(bm, geom=[face])
    moved = [e for e in res["geom"] if isinstance(e, bmesh.types.BMVert)]
    bmesh.ops.translate(bm, verts=moved, vec=push)
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    return _finish(name, bm, loc, rot, bevel, segs, mat, angle)


def s_curve(p0, p1, n=24):
    """Points along a smooth S from p0 to p1 (a smoothstep in the second axis)."""
    out = []
    for i in range(n + 1):
        t = i / n
        s = t * t * (3 - 2 * t)
        out.append((p0[0] + (p1[0] - p0[0]) * s, p0[1] + (p1[1] - p0[1]) * t))
    return out


# ---------------------------------------------------------------------------
# The six scenes


def scene_narrative(mat):
    """Investor Narrative & Positioning: memo, teaser and deck as one system.
    Sheets stacked like shingles, each lower one tucked behind the one above;
    their left edges in a rhythm of three lengths."""
    h, t, pitch = 0.46, 0.055, 0.34
    lefts = (-0.62, 0.02, -0.30)  # memo (long), deck (short), teaser (between)
    for i in range(11):
        z = 1.85 - i * pitch
        x0 = lefts[i % 3]
        x1 = 4.0
        box(f"sheet{i}", (x1 - x0, t, h), ((x0 + x1) / 2, i * 0.035, z), mat,
            rot=(math.radians(-9), 0, 0), bevel=0.02, segs=8)
    # looking straight down +y keeps the sheets level; the frame is shifted instead
    camera((-0.9, -6.2, -1.1), (-0.9, 0.0, -0.35), lens=72, shift=(0.21, 0.08))
    studio(target=(0.5, 0, 0))


def scene_strategy(mat):
    """Capital Strategy: round size, valuation anchor, structure, closing
    sequence. One folded concrete plate, four soft steps rising to the right,
    floating on the charcoal."""
    run, rise, th, n = 0.70, 0.42, 0.17, 4
    x, z = -2.4, -1.55
    top = [(x - 1.0, z)]
    for i in range(n):
        top.append((x, z))
        z += rise
        top.append((x, z))
        x += run
    top.append((x + 2.5, z))
    # a uniform plate: the underside is the top moved down and right by its thickness
    under = [(px + th, pz - th) for px, pz in top]
    under[0] = (top[0][0], top[0][1] - th)
    under[-1] = (top[-1][0], top[-1][1] - th)
    pts = top + list(reversed(under))
    prism("plate", pts, 2.6, mat, plane="XZ", loc=(0, 0, 0), bevel=0.05, segs=12, angle=30)
    camera((-2.7, -5.2, 0.9), (-0.55, 0.9, -0.3), lens=64)
    studio(target=(0, 0.5, 0))


def scene_equity(mat):
    """Equity Raising: growth equity through 3,000+ institutional relationships.
    Rows of fins, many of them, rising from left to right."""
    rows = (
        # depth, first x, step, widths, base height, rise per fin
        (1.10, -0.72, 0.62, (0.48, 0.36, 0.52, 0.40, 0.46, 0.38, 0.50), 1.55, 0.26),
        (0.55, -0.98, 0.58, (0.30, 0.44, 0.34, 0.48, 0.30, 0.42, 0.36), 0.95, 0.27),
        (0.00, -1.22, 0.55, (0.26, 0.32, 0.24, 0.36, 0.28, 0.34, 0.30, 0.26), 0.40, 0.29),
    )
    t = 0.045
    k = 0
    for depth, x0, step, widths, h0, dh in rows:
        for j, w in enumerate(widths):
            top = h0 + j * dh
            bottom = -3.0
            x = x0 + j * step
            box(f"fin{k}", (w, t, top - bottom), (x + w / 2, depth, (top + bottom) / 2), mat,
                bevel=0.014, segs=8)
            k += 1
    camera((-1.45, -6.0, 0.45), (0.65, 0.5, 0.75), lens=60)
    studio(target=(0.3, 0.5, 0.6))


def scene_debt(mat):
    """Debt Advisory & Placement: venture debt, growth lending, unitranche,
    mezzanine, subordinated. A capital stack: five slabs, the senior one
    thickest at the base, each above a little thinner and set back."""
    thick = (0.62, 0.44, 0.32, 0.23, 0.16)
    gap = 0.03
    z = -1.9
    for i, th in enumerate(thick):
        inset = i * 0.12
        x0, y0 = -0.95 + inset, -0.55 + inset
        x1, y1 = 4.0, 4.0
        box(f"layer{i}", (x1 - x0, y1 - y0, th), ((x0 + x1) / 2, (y0 + y1) / 2, z + th / 2), mat,
            bevel=0.035, segs=10)
        z += th + gap
    camera((-3.4, -5.6, 0.75), (0.1, 0.45, -0.45), lens=60)
    studio(target=(0, 0.3, -0.5))


def scene_mna(mat):
    """M&A and Project Finance: sell-side and buy-side brought together. Two
    masses fitted along one S-shaped joint, a hairline of shadow between them,
    the right one standing a step higher."""
    gap = 0.03
    joint = s_curve((-0.55, -4.0), (0.45, 4.0), n=48)
    # the joint runs front to back (along y); it swings from left to right
    left = [(-5.0, -4.0)] + [(x - gap / 2, y) for x, y in joint] + [(-5.0, 4.0)]
    right = [(x + gap / 2, y) for x, y in joint] + [(5.0, 4.0), (5.0, -4.0)]
    # the joint, squeezed so the S reads in the frame
    def squeeze(pts):
        return [(x, y * 0.5) for x, y in pts]
    prism("sell", squeeze(left), 2.0, mat, plane="XY", loc=(0, 0, -2.6), bevel=0.06, segs=12, angle=25)
    prism("buy", list(reversed(squeeze(right))), 2.36, mat, plane="XY", loc=(0, 0, -2.6), bevel=0.06, segs=12, angle=25)
    camera((-1.7, -3.7, 3.6), (0.05, 0.25, -0.6), lens=55)
    studio(target=(0, 0, -0.6))


def scene_fund(mat):
    """Fund Formation & Partnerships: one fund carried by its partners. A deep
    slab resting on rows of round columns, seen from below."""
    box("slab", (7.0, 7.0, 0.5), (2.6, 2.8, 1.55), mat, bevel=0.05, segs=10)
    for j in range(6):
        for i in range(3):
            x = -0.7 + j * 0.95
            y = -0.35 + i * 1.05
            column(f"col{i}{j}", 0.17, 6.0, (x, y, 1.4 - 3.0), mat)
    camera((-2.9, -5.2, -1.3), (0.7, 0.9, 0.75), lens=46)
    studio(target=(0.5, 0.5, 0.6))


SCENES = {
    "narrative": scene_narrative,
    "strategy": scene_strategy,
    "equity": scene_equity,
    "debt": scene_debt,
    "mna": scene_mna,
    "fund": scene_fund,
}


def main():
    argv = sys.argv[sys.argv.index("--") + 1:] if "--" in sys.argv else sys.argv[1:]
    ap = argparse.ArgumentParser()
    ap.add_argument("--scene", required=True, choices=sorted(SCENES))
    ap.add_argument("--res", type=int, default=1600)
    ap.add_argument("--samples", type=int, default=160)
    ap.add_argument("--out", required=True)
    ap.add_argument("--blend", help="also save the scene as a .blend file")
    ap.add_argument("--crop", type=float, nargs=4, metavar=("X0", "Y0", "X1", "Y1"),
                    help="render only this part of the frame (0-1, from the bottom left), for checking detail")
    a = ap.parse_args(argv)

    sc = reset()
    sc.render.resolution_x = a.res
    sc.render.resolution_y = a.res
    sc.render.resolution_percentage = 100
    sc.cycles.samples = a.samples
    if a.crop:
        sc.render.use_border = True
        sc.render.use_crop_to_border = True
        sc.render.border_min_x, sc.render.border_min_y, sc.render.border_max_x, sc.render.border_max_y = a.crop
    mat = concrete()
    SCENES[a.scene](mat)
    sc.render.filepath = a.out
    if a.blend:
        bpy.ops.wm.save_as_mainfile(filepath=a.blend)
    bpy.ops.render.render(write_still=True)


if __name__ == "__main__":
    main()
