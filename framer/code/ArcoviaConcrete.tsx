/**
 * Arcovia: ConcreteSurface, the WebGL concrete behind the Home hero.
 *
 * Carved marks, drifting sunlight and a soft cursor light on live concrete, plus
 * the zoom and the hole the hero opens into the statement (burn, break or drill,
 * see setView). A plain module, no component: ArcoviaHero.tsx creates it with
 * `new ConcreteSurface(heroSection, { canvas: ".hero__canvas", scope: root })`,
 * calls init(), and calls destroy() when the component unmounts.
 *
 * How it works
 * - The concrete colour comes from a seamless texture plus slow procedural
 *   mottling, so repeats never show.
 * - Anything marked data-carve inside the host is drawn into an offscreen
 *   "height map" at its real on-screen position and at full device
 *   resolution: "text" (the element's own text, in its own font), "mark"
 *   (the A-mark, read from the SVG sprite), "seam" (a formwork joint),
 *   "hole" (a formwork tie hole) and "panel" (a charcoal inlay). The
 *   shader turns that height map into surface normals, so the light
 *   catches the walls of every carving.
 * - Every carving always shows a crisp dark rim and light rim (soft sky
 *   light from the upper left). A diagonal band of sunlight drifts across
 *   over ~34 s and deepens the relief where it passes; the cursor adds a
 *   dim point light.
 * - setView() zooms the slab (scale around a point, plus a shift) and can
 *   open a hole through it: burning (an ember, a ragged glowing edge), breaking
 *   (cracks, shards dropping away) or drilling (a round bore seen in
 *   perspective that deepens, punches through to light and is flown down). The height map is
 *   redrawn for each view, so carving stays crisp at any zoom; the hole is
 *   transparent, so whatever sits behind the canvas shows through (the hero
 *   uses this to drill through the O of ARCOVIA and fly into the statement).
 * - Pauses off-screen and in hidden tabs. With reduced motion it renders
 *   one still frame. Without WebGL the CSS fallback stays.
 *
 * Ported from site/concrete.js on main. Shaders and maths are unchanged. Changes
 * for Framer: the texture is the uploaded image (ASSETS.concrete, loaded with
 * crossOrigin "anonymous"), the file:// fallback is gone, sprite lookups are
 * scoped to the component (opts.scope), and destroy() stops the loop, disconnects
 * the observers, removes the listeners and frees the GL context.
 */
import { ASSETS } from "./ArcoviaBase.tsx"

// Shaders: verbatim from site/concrete.js
const VERT = [
  "attribute vec2 aPos;",
  "void main(){ gl_Position = vec4(aPos, 0.0, 1.0); }"
].join("\n");

const FRAG = [
  "precision highp float;",
  "uniform vec2 uRes;",        // device px
  "uniform float uScale;",     // device px per css px
  "uniform float uTime;",
  "uniform float uBand;",      // sunlight band centre, 0..1 across the diagonal
  "uniform vec2 uMouse;",      // css px, y down
  "uniform float uMouseAmt;",
  "uniform float uSun;",       // sunlight strength
  "uniform float uCursor;",    // cursor light strength
  "uniform sampler2D uTex;",   // concrete, seamless
  "uniform float uTexSize;",   // css px per texture tile
  "uniform sampler2D uHeight;",// r: surface height (1 surface, 0 carved), g: charcoal inlay
  "uniform vec2 uHTexel;",     // one device px in height-map uv
  "uniform vec2 uOrigin;",     // zoom: the point that scales (css px, slab coordinates)
  "uniform vec2 uShift;",      // zoom: where that point sits on screen
  "uniform float uZoom;",      // zoom: scale
  "uniform vec4 uBurn;",       // burn: centre x, y and the O's counter radii x, y (slab coordinates)
  "uniform vec3 uBurnP;",      // burn: radius (in counter units), heat (glow), warmth (0 white, 1 fire)
  "uniform vec4 uBreak;",      // break: centre x, y and the O's counter radii x, y (slab coordinates)
  "uniform vec3 uBreakP;",     // break: crack reach, break reach (counter units), light through the cracks
  "uniform vec4 uDrill;",      // drill: centre x, y and the O's counter radii x, y (slab coordinates)
  "uniform vec4 uDrillP;",     // drill: camera distance (1 at the start, 0 at the face, -K at the back), depth drilled (0–K), light through (0–1), dust (0–1)
  "uniform vec4 uDrillQ;",     // drill: K (slab thickness / starting camera distance), bore radius (counter units), spin, thickness in counter radii
  "",
  "float hash(vec2 p){ p = fract(p * vec2(123.34, 456.21)); p += dot(p, p + 45.32); return fract(p.x * p.y); }",
  "float noise(vec2 p){ vec2 i = floor(p), f = fract(p); vec2 u = f*f*(3.0-2.0*f);",
  "  return mix(mix(hash(i), hash(i+vec2(1.0,0.0)), u.x), mix(hash(i+vec2(0.0,1.0)), hash(i+vec2(1.0,1.0)), u.x), u.y); }",
  "float fbm(vec2 p){ float v = 0.0, a = 0.5; for(int i = 0; i < 4; i++){ v += a*noise(p); p = p*2.03 + 17.1; a *= 0.5; } return v; }",
  // Sharpen the softened height map so carved walls stay about 1.5 css px wide: crisp, never blurry
  "float H(vec2 uv){ return smoothstep(0.2, 0.8, texture2D(uHeight, uv).r); }",
  "",
  // Shatter pattern: Voronoi cells in a polar-warped space around the O, so cracks run
  // out from the centre with rings between them, like an impact on a slab. Shards are
  // small near the point of impact and grow chunkier outward.
  "const float SN = 7.0;",     // shards around the circle
  "const float SM = 1.3;",     // rings per step out: low, so the radial cracks run long
  "const float SC = 0.4;",     // keeps the shards at the point of impact from getting tiny
  "vec2 hash2(vec2 p){ return fract(sin(vec2(dot(p, vec2(127.1, 311.7)), dot(p, vec2(269.5, 183.3)))) * 43758.5453); }",
  "vec2 warpQ(vec2 q){",
  "  vec2 w = vec2(atan(q.y, q.x) / 6.2831853 * SN, log(length(q) + SC) * SM);",
  // jagged, not geometric: a slow wander plus fine teeth along every crack
  "  w += (vec2(noise(q * 4.0 + 3.0), noise(q * 4.0 + 11.0)) - 0.5) * 0.16;",
  "  w += (vec2(noise(q * 21.0 + 5.0), noise(q * 21.0 + 17.0)) - 0.5) * 0.05;",
  "  return w;",
  "}",
  "vec2 unwarp(vec2 w){ float d = exp(w.y / SM) - SC; float an = w.x / SN * 6.2831853; return d * vec2(cos(an), sin(an)); }",
  // screen px per warped unit at distance d from the centre (the smaller of the two directions)
  "float pxScale(float d, float unit){ return unit * min((d + SC) / SM, max(d, 0.04) * 6.2831853 / SN); }",
  // xy: the shard's id, z: distance to the nearest crack (warped units); seed: the shard's centre (warped)
  "vec3 voro(vec2 w, out vec2 seed){",
  "  vec2 i = floor(w), f = fract(w);",
  "  float f1 = 8.0, f2 = 8.0; vec2 id = vec2(0.0); seed = vec2(0.0);",
  "  for (int y = -1; y <= 1; y++) for (int x = -1; x <= 1; x++) {",
  "    vec2 g = vec2(float(x), float(y));",
  "    vec2 cell = i + g;",
  "    vec2 key = vec2(mod(cell.x, SN), cell.y);",           // wraps around the circle
  "    vec2 o = 0.08 + 0.84 * hash2(key);",
  "    vec2 r = g + o - f;",
  "    float dd = dot(r, r);",
  "    if (dd < f1) { f2 = f1; f1 = dd; id = key; seed = cell + o; } else if (dd < f2) { f2 = dd; }",
  "  }",
  "  return vec3(id, sqrt(f2) - sqrt(f1));",
  "}",
  "",
  "void main(){",
  "  vec2 res = uRes / uScale;",
  "  vec2 sp = vec2(gl_FragCoord.x, uRes.y - gl_FragCoord.y) / uScale;", // screen, css px, y down
  "  vec2 uv = sp / res;",                                              // height map is drawn per view, in screen space
  "  vec2 p = uOrigin + (sp - uShift) / uZoom;",                         // the same point on the slab
  "",
  "  // Concrete: seamless texture for pores and grain, fbm for large soft mottling",
  "  vec2 tuv = p / uTexSize;",
  "  float tpx = 1.0 / uTexSize;",
  "  float t0 = texture2D(uTex, tuv).r;",
  "  float tx = texture2D(uTex, tuv + vec2(tpx, 0.0)).r;",
  "  float ty = texture2D(uTex, tuv + vec2(0.0, tpx)).r;",
  "  float mott = 0.955 + 0.09 * fbm(p / 520.0 + 3.7);",
  "  float inlay = texture2D(uHeight, uv).g;",
  "  float hc = H(uv);",
  "  float detail = 1.0 + (t0 / 0.765 - 1.0) * mix(0.62, 0.3, inlay);",
  "  float albedo = mix(0.865, 0.37, inlay) * detail * mix(mott, 1.0, inlay);",
  "",
  "  // Normal from the carve height map (slope per css px, so it looks the same at any pixel density)",
  "  vec2 e = uHTexel;",
  "  float hx = (H(uv + vec2(e.x, 0.0)) - H(uv - vec2(e.x, 0.0))) * uScale * 0.5;",
  "  float hy = (H(uv + vec2(0.0, e.y)) - H(uv - vec2(0.0, e.y))) * uScale * 0.5;",
  "  vec3 n = normalize(vec3(-hx * 2.2, -hy * 2.2, 1.0));",
  "  n = normalize(n + vec3(-(tx - t0), -(ty - t0), 0.0) * mix(1.6, 0.6, inlay));",
  "",
  "  // Sun: low, from the upper left",
  "  vec3 Ls = normalize(vec3(-0.58, -0.62, 0.52));",
  "  float sunN = max(dot(n, Ls), 0.0) / Ls.z;",
  "",
  "  // Soft diagonal band of sunlight that drifts across the slab",
  "  float k = 0.55;",
  "  float b = (p.x - (res.y - p.y) * k + res.y * k) / (res.x + res.y * k);",
  "  b += (fbm(p / 260.0 + uTime * 0.01) - 0.5) * 0.05;",
  "  float w = 0.2, soft = 0.17;",
  "  float band = smoothstep(uBand - w - soft, uBand - w + soft, b) * (1.0 - smoothstep(uBand + w - soft * 0.7, uBand + w + soft * 0.7, b));",
  "",
  "  // Short cast shadow inside carvings, on the side facing away from the sun",
  "  vec2 ld = normalize(Ls.xy) * e * uScale;",
  "  float occ = clamp((max(H(uv + ld * 1.2), H(uv + ld * 2.4)) - hc) * 1.4, 0.0, 1.0);",
  "",
  "  // Sky light from the upper left: always draws a dark rim and a light rim on every carving",
  "  vec3 La = normalize(vec3(-0.45, -0.6, 0.66));",
  "  float amb = 0.86 + 0.36 * (dot(n, La) - La.z);",
  "  float ao = mix(0.92, 1.0, hc);",
  "  // ...and a soft inner shadow under the upper-left wall, so carvings read as recessed, not outlined",
  "  vec2 la = normalize(La.xy) * e * uScale;",
  "  float occA = clamp((max(H(uv + la * 2.0), H(uv + la * 4.5)) - hc) * 1.2, 0.0, 1.0);",
  "  ao *= 1.0 - occA * 0.09;",
  "",
  "  float light = amb * ao * 0.9;",
  "  light += uSun * band * sunN * (1.0 - occ * 0.85);",
  "",
  "  // Cursor: a dim, soft point light hovering above the surface",
  "  vec3 lc = vec3(uMouse - sp, 150.0);",
  "  float d = length(lc.xy);",
  "  vec3 Lc = normalize(lc);",
  "  float fall = exp(-d * d / (2.0 * 240.0 * 240.0)) * uMouseAmt;",
  "  light += uCursor * fall * max(dot(n, Lc), 0.0) / Lc.z;",
  "  float edgeC = max(dot(n, Lc) - Lc.z, 0.0) * fall;",
  "",
  "  // Edges facing the sun catch a little extra light",
  "  float edge = max(dot(n, Ls) - Ls.z, 0.0) * (0.25 + band) * (1.0 - occ);",
  "",
  "  float c = albedo * light + (uSun * edge + uCursor * edgeC * 2.2) * mix(0.35, 0.7, inlay);",
  "  c *= 1.0 - 0.07 * pow(length((uv - 0.5) * vec2(1.0, 1.2)), 2.0);",
  "  c += (hash(gl_FragCoord.xy + fract(uTime) * 61.0) - 0.5) * (2.0 / 255.0);",
  "",
  "  // The burn, like paper catching fire: an ember, then a ragged hole whose edge glows,",
  "  // charred concrete beyond it and light spilling in. Widths are in screen px, so the",
  "  // glowing band keeps its size while the view zooms in.",
  "  vec3 col = vec3(c);",
  "  float a = 1.0, spill = 0.0;",
  "  vec3 inside = vec3(1.0);",
  "  if (uBurn.z > 0.0) {",
  "    vec2 q = (p - uBurn.xy) / uBurn.zw;",                    // 1.0 = the O's inner edge
  "    float d = length(q);",
  "    float unit = min(uBurn.z, uBurn.w) * uZoom;",            // screen px per counter unit
  "    float R = uBurnP.x, heat = uBurnP.y;",
  "    if ((d - R * 1.3) * unit < 280.0) {",                    // skip pixels far from the fire
  "      float ang = atan(q.y, q.x);",
  "      vec2 drift = vec2(uTime * 0.22, -uTime * 0.31);",
  "      float n = fbm(q * 2.3 + 3.1) * 0.6 + fbm(q * 7.5 + drift) * 0.4;",
  "      float k = (d - R * (0.55 + 0.75 * n)) * unit;",       // px from the burning edge; < 0 is burnt through
  "      if (R > 0.0005) a = smoothstep(-0.8, 0.8, k);",
  "      float kk = max(k, 0.0);",
  "      float flick = 0.85 + 0.3 * noise(vec2(ang * 5.0 + d * 4.0, uTime * 4.0));",
  // Glow after the reference: a clean, luminous band, white at the edge, light gold through
  // the band, golden at the fringe. Always brighter than the concrete, so it reads as light.
  "      float core = exp(-kk / 7.0);",                          // white-hot edge
  "      float flame = exp(-kk / 22.0) * flick;",                // the glowing band
  "      float bloom = exp(-kk / 46.0);",                        // soft light thrown onto the concrete
  // Only a faint scorch, well beyond the glow
  "      float charAmt = smoothstep(150.0, 70.0, kk) * smoothstep(30.0, 60.0, kk) * smoothstep(0.0, 0.04, R);",
  "      charAmt *= 0.5 + 0.6 * fbm(q * 9.0 + 5.0);",
  "      vec3 gold = mix(vec3(1.0), vec3(1.0, 0.93, 0.72), uBurnP.z);",
  "      vec3 amber = mix(vec3(1.0), vec3(1.0, 0.78, 0.34), uBurnP.z);",
  "      col *= 1.0 - 0.1 * charAmt;",
  "      float glowAmt = clamp(heat * (core + flame * 0.95 + bloom * 0.5), 0.0, 1.0);",
  "      vec3 tint = mix(amber, gold, clamp(core * 1.2 + flame * 0.5, 0.0, 1.0));",
  "      tint = mix(tint, vec3(1.0), clamp(core * 1.1, 0.0, 1.0));",
  // Light never darkens: red and green only rise; blue may drop, which gives the gold its colour
  "      col = mix(col, vec3(max(tint.r, col.r), max(tint.g, col.g), tint.b), glowAmt);",
  // Inside the hole: hot light spilling in past the edge, fading to clear
  "      spill = heat * 0.9 * exp(min(k, 0.0) / 30.0) * (1.0 - a);",
  "      inside = mix(vec3(1.0), gold, 0.5);",
  "    }",
  "  }",
  "",
  "  // The break: hairline cracks run out from the O; each crack opens just before its",
  "  // shards give way, letting a thread of light through; then the shards sink and drop",
  "  // back into the light, centre first.",
  "  if (uBreak.z > 0.0) {",
  "    vec2 q = (p - uBreak.xy) / uBreak.zw;",                  // 1.0 = the O's inner edge
  "    float d = length(q);",
  "    float unit = min(uBreak.z, uBreak.w) * uZoom;",          // screen px per counter unit
  "    float crackR = uBreakP.x, breakR = uBreakP.y, glowAmt = uBreakP.z;",
  "    if (d < max(crackR * 1.3, breakR) + 0.4) {",
  "      vec2 sw; vec3 v = voro(warpQ(q), sw);",
  "      float edgePx = v.z * 0.5 * pxScale(d, unit);",           // px to the nearest crack
  "      vec2 seedQ = unwarp(sw);",
  "      float ds = length(seedQ);",
  "      float rnd = hash2(v.xy + 17.0).x;",
  "      float when = ds * (1.0 + rnd * 0.25);",                  // when this shard lets go (break reach)
  "      float fall = clamp((breakR - when) / (0.35 + ds * 0.25), 0.0, 1.0);",
  "      float loosen = clamp((breakR - when + 0.7) / 0.7, 0.0, 1.0);",   // the crack opens just before
  "      if (fall > 0.0) {",
  // A falling shard sinks away from us: it shrinks toward its centre, turns a little and
  // drops; this pixel is mapped back onto the shard, and if it misses, the slab is open here.
  "        float ff = fall * fall;",
  "        float sc = 1.0 - 0.88 * ff;",
  "        float th = (rnd - 0.5) * 1.1 * ff;",
  "        vec2 drop = vec2(0.0, 0.18 * (ds + SC) * ff);",
  "        vec2 rq = mat2(cos(th), -sin(th), sin(th), cos(th)) * (q - seedQ - drop) / sc;",
  "        vec2 qq = seedQ + rq;",
  "        vec2 sw2; vec3 v2 = voro(warpQ(qq), sw2);",
  "        if (ff < 0.97 && v2.x == v.x && v2.y == v.y) {",
  "          float rimPx = v2.z * 0.5 * pxScale(length(qq), unit) * sc;",
  "          float tt = texture2D(uTex, (uBreak.xy + qq * uBreak.zw) / uTexSize).r / 0.765;",
  "          float sh = 0.84 * (1.0 + (tt - 1.0) * 0.6) * (1.0 - 0.5 * ff);",       // tilting into shadow
  "          sh *= mix(0.42, 1.0, smoothstep(0.5, 4.0, rimPx));",                  // the broken edge, in shadow
  "          col = vec3(sh);",
  "        } else {",
  "          a = 0.0;",
  "        }",
  "      } else {",
  // Cracks spread from the centre with a soft, uneven front
  "        float front = crackR * (0.85 + 0.3 * noise(q * 3.0 + 5.0));",
  "        float vis = smoothstep(front, front * 0.82, d);",
  "        if (vis > 0.0) {",
  "          float w = 0.55 + 2.2 * loosen;",                         // hairline, opening as it loosens
  "          float line = (1.0 - smoothstep(w * 0.5, w * 0.5 + 0.9, edgePx)) * vis;",
  "          float gap = (1.0 - smoothstep(w * 0.5 - 0.6, w * 0.5 + 0.2, edgePx)) * loosen * vis;",
  "          col *= 1.0 + (rnd - 0.5) * 0.06 * vis;",                 // each piece settles a touch differently
  "          col *= 1.0 - 0.55 * line;",                             // dark hairline
  // As a piece loosens, its broken edge shows the slab's thickness: a shadowed face along the crack
  "          float face = (1.0 - smoothstep(w * 0.5, w * 0.5 + 2.0 + 7.0 * loosen, edgePx)) * loosen * vis;",
  "          col *= 1.0 - 0.38 * face;",
  "          col = mix(col, vec3(1.0), clamp(glowAmt * gap, 0.0, 1.0));",            // light through the opening
  "          col += glowAmt * loosen * 0.18 * exp(-edgePx / 3.0) * vis;",            // a faint glow on its lips
  "        }",
  "      }",
  "    }",
  "  }",
  "",
  "  // The drill: a round bore through the O. Seen in perspective, its wall recedes to the",
  "  // floor; dust swirls inside; it punches through to light, and the camera flies down it.",
  "  if (uDrill.z > 0.0 && uDrillP.y > 0.0005) {",
  "    vec2 Q = (sp - uShift) / uDrill.zw;",                   // 1.0 = the O's counter, at the starting distance
  "    float rs = max(length(Q), 1e-4);",
  "    float cam = uDrillP.x, D = uDrillP.y, lightThrough = uDrillP.z, dust = uDrillP.w;",
  "    float K = uDrillQ.x, R0 = uDrillQ.y, spin = uDrillQ.z + uTime * 2.5, TH = uDrillQ.w;",
  "    float unitPx = min(uDrill.z, uDrill.w);",
  "    vec2 dirQ = Q / rs;",                                   // direction from the axis (no seam, unlike an angle)
  "    float rimR = R0 * (1.0 + 0.035 * (noise(dirQ * 3.5 + 3.7) - 0.5));",   // a drilled edge, slightly chipped
  "    float rf = rs * max(cam, 1e-4);",                       // this pixel's radius on the front face
  "    if (cam <= 0.0 || rf < rimR) {",
  "      float z = R0 / rs - cam;",                            // depth of the wall seen here (0 front, K back)
  "      float lam = max(dot(-Q / rs, normalize(vec2(-0.58, -0.62))), 0.0);",
  "      if (z < D) {",
  // The bore's wall: concrete, lit on the side facing the light, darker deeper in,
  // scored with rings by the bit, catching light from the far end once it breaks through
  "        float zc = z / K * TH;",
  "        float tw = texture2D(uTex, (dirQ * R0 * 1.6 + vec2(zc * 0.9, zc * 1.7)) * unitPx / uTexSize + 0.37).r / 0.765;",
  "        float sh = 0.86 * (1.0 + (tw - 1.0) * 0.8) * (0.5 + 0.44 * lam);",
  "        sh *= mix(1.0, 0.36, clamp(zc / TH, 0.0, 1.0));",
  "        sh *= 1.0 + 0.018 * sin(zc * 48.0 + noise(dirQ * 2.0 + zc * 3.0) * 2.0);",
  "        sh += 0.12 * exp(-zc / 0.03);",                       // the lip catches the light
  "        sh += lightThrough * 0.9 * exp(-(K - z) / (0.2 * K));",
  "        vec2 sd = mat2(cos(spin), -sin(spin), sin(spin), cos(spin)) * dirQ;",   // dust turning with the bit
  "        sh += dust * 0.1 * noise(sd * 2.5 + zc * 2.5);",
  "        col = vec3(clamp(sh, 0.0, 1.0));",
  "      } else {",
  // The bottom of the bore: freshly ground concrete with circular marks and spinning dust,
  // then a ragged opening of light breaking through it
  "        float fd = max(cam + D, 1e-4);",
  "        vec2 fq = Q * fd;",                                   // position on the floor, counter units
  "        float rb = length(fq);",
  "        float tf = texture2D(uTex, (uDrill.xy + fq * uDrill.zw) / uTexSize + 0.61).r / 0.765;",
  "        float sh = 0.86 * (1.0 + (tf - 1.0) * 0.6) * mix(0.84, 0.3, clamp(D / K, 0.0, 1.0));",   // matte, in the bore's shade
  "        sh *= 1.0 + 0.025 * clamp(D / K * 3.0, 0.0, 1.0) * sin(rb * 70.0 + noise(fq * 9.0) * 3.0);",
  "        vec2 fd2 = mat2(cos(spin * 1.3), sin(spin * 1.3), -sin(spin * 1.3), cos(spin * 1.3)) * fq;",
  "        sh += dust * 0.08 * noise(fd2 * 6.0);",
  "        float lr = lightThrough * R0 * (1.05 + 0.18 * (noise(fq / max(rb, 1e-4) * 2.5 + 9.1) - 0.5) + 0.06 * (noise(fq * 14.0) - 0.5));",
  "        float edgePx = (rb - lr) * unitPx / fd;",            // px from the opening's edge
  "        if (lightThrough > 0.0 && rb < lr) {",
  "          a = 0.0;",
  "        } else {",
  "          sh = mix(sh, 1.0, lightThrough * exp(-max(edgePx, 0.0) / 9.0));",
  "          col = vec3(clamp(sh, 0.0, 1.0));",
  "        }",
  "      }",
  "    } else {",
  // The front face around the hole: a shadowed rim, spalled chips of fresh concrete, dust
  "      float beyond = rf - rimR;",                          // counter units past the rim
  "      float pxOut = beyond * unitPx / cam;",
  "      float drilled = smoothstep(0.0, 0.2 * K, D);",
  "      float chipBand = R0 * (0.04 + 0.1 * noise(dirQ * 2.2 + 1.1));",
  "      float chip = step(beyond, chipBand) * step(0.56, noise(dirQ * 4.1 + 4.4)) * drilled;",
  "      col *= 1.0 + 0.08 * chip;",
  "      col *= 1.0 - 0.3 * chip * (1.0 - smoothstep(0.0, 2.0, (chipBand - beyond) * unitPx / cam));",
  "      col *= 1.0 - 0.28 * drilled * exp(-pxOut / 2.5);",
  "      col = mix(col, vec3(0.93), dust * 0.5 * exp(-beyond / (0.7 * R0)));",
  "    }",
  "  }",
  "  gl_FragColor = vec4(col * a + inside * spill, a + spill);",
  "}"
].join("\n");

export interface ConcreteOptions {
    /** Selector of the canvas inside the host */
    canvas?: string
    /** Seamless concrete texture (must allow CORS) */
    texture?: string
    /** css px per texture tile */
    textureSize?: number
    /** seconds for the sun to drift across and back */
    period?: number
    /** sunlight strength */
    sun?: number
    /** cursor light strength */
    cursor?: number
    /** sunlight band position for the still (reduced motion) frame */
    staticBand?: number
    /** 1: fire colours, 0: white heat only */
    burnWarmth?: number
    /** Where to look up sprite symbols (<use href="#a-mark">); defaults to the document */
    scope?: ParentNode
}

export interface ConcreteView {
    ox: number
    oy: number
    tx: number
    ty: number
    s: number
    burn?: { cx: number; cy: number; rx: number; ry: number; r: number; heat: number } | null
    shatter?: { cx: number; cy: number; rx: number; ry: number; crack: number; brk: number; light: number } | null
    drill?: { cx: number; cy: number; rx: number; ry: number; cam: number; depth: number; light: number; dust: number; k: number; r: number; spin: number; thick: number } | null
}

const UNIFORMS = ["uRes", "uScale", "uTime", "uBand", "uMouse", "uMouseAmt", "uSun", "uCursor", "uTex", "uTexSize", "uHeight", "uHTexel", "uOrigin", "uShift", "uZoom", "uBurn", "uBurnP", "uBreak", "uBreakP", "uDrill", "uDrillP", "uDrillQ"]

export class ConcreteSurface {
    host: HTMLElement
    canvas: HTMLCanvasElement
    opts: Required<Omit<ConcreteOptions, "canvas" | "scope">>
    scope: ParentNode
    mouse = { x: -9999, y: -9999, tx: -9999, ty: -9999, amt: 0, tamt: 0 }
    view: ConcreteView = { ox: 0, oy: 0, tx: 0, ty: 0, s: 1, burn: null, shatter: null, drill: null }
    carves: any[] = []
    visible = true
    running = false
    ready = false
    paused = false
    destroyed = false
    t0 = performance.now()
    last = 0
    reduced: MediaQueryList
    gl: WebGLRenderingContext | null = null
    prog: WebGLProgram | null = null
    u: Record<string, WebGLUniformLocation | null> = {}
    heightCanvas: HTMLCanvasElement | null = null
    sharpCanvas: HTMLCanvasElement | null = null
    heightTex: WebGLTexture | null = null
    tex: WebGLTexture | null = null
    buf: WebGLBuffer | null = null
    shaders: WebGLShader[] = []
    hTexel: number[] = [0, 0]
    dpr = 1
    w = 1
    h = 1
    heightDirty = false
    needsFrame = false
    layoutQueued = false
    loop: FrameRequestCallback | null = null
    private frameId = 0
    private layoutId = 0
    private offs: Array<() => void> = []

    constructor(host: HTMLElement, opts: ConcreteOptions = {}) {
        this.host = host
        this.canvas = host.querySelector(opts.canvas || "canvas") as HTMLCanvasElement
        this.scope = opts.scope || document
        this.opts = {
            texture: opts.texture || ASSETS.concrete,
            textureSize: opts.textureSize || 1024, // css px per tile
            period: opts.period || 34, // seconds for the sun to drift across and back
            sun: opts.sun != null ? opts.sun : 0.2,
            cursor: opts.cursor != null ? opts.cursor : 0.22,
            staticBand: opts.staticBand != null ? opts.staticBand : 0.6,
            burnWarmth: opts.burnWarmth != null ? opts.burnWarmth : 1, // 1: fire colours, 0: white heat only
        }
        this.reduced = window.matchMedia("(prefers-reduced-motion: reduce)")
    }

    init(): Promise<boolean> {
        if (this.destroyed || !this.canvas) return Promise.resolve(false)
        const attrs: WebGLContextAttributes = { antialias: false, alpha: true, premultipliedAlpha: true, depth: false, stencil: false, powerPreference: "low-power", preserveDrawingBuffer: false }
        let gl = this.canvas.getContext("webgl", attrs)
        if (gl && gl.isContextLost()) {
            // This canvas was used by an earlier surface whose context was released (destroy()):
            // a canvas keeps its lost context for good, so give it a fresh canvas in its place
            const fresh = this.canvas.cloneNode(false) as HTMLCanvasElement
            this.canvas.replaceWith(fresh)
            this.canvas = fresh
            gl = fresh.getContext("webgl", attrs)
        }
        if (!gl) return Promise.resolve(false)
        this.gl = gl

        const prog = this.program(VERT, FRAG)
        if (!prog) return Promise.resolve(false)
        this.prog = prog
        gl.useProgram(prog)

        const buf = gl.createBuffer()
        this.buf = buf
        gl.bindBuffer(gl.ARRAY_BUFFER, buf)
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW)
        const loc = gl.getAttribLocation(prog, "aPos")
        gl.enableVertexAttribArray(loc)
        gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0)

        this.u = {}
        UNIFORMS.forEach((n) => {
            this.u[n] = gl!.getUniformLocation(prog, n)
        })

        this.heightCanvas = document.createElement("canvas")
        this.sharpCanvas = document.createElement("canvas")
        this.heightTex = gl.createTexture()
        gl.activeTexture(gl.TEXTURE1)
        gl.bindTexture(gl.TEXTURE_2D, this.heightTex)
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR)
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR)
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE)
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)

        const fonts = document.fonts && document.fonts.ready ? document.fonts.ready : Promise.resolve()
        return Promise.all([this.loadTexture(), fonts])
            .then(() => {
                if (this.destroyed) return false
                this.layout()
                this.bind()
                this.ready = true
                this.host.classList.add("hero--gl")
                this.kick()
                return true
            })
            .catch(() => false)
    }

    program(vs: string, fs: string): WebGLProgram | null {
        const gl = this.gl!
        const compile = (type: number, src: string) => {
            const s = gl.createShader(type)
            if (!s) return null
            gl.shaderSource(s, src)
            gl.compileShader(s)
            if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
                console.warn(gl.getShaderInfoLog(s))
                return null
            }
            this.shaders.push(s)
            return s
        }
        const v = compile(gl.VERTEX_SHADER, vs),
            f = compile(gl.FRAGMENT_SHADER, fs)
        if (!v || !f) return null
        const p = gl.createProgram()
        if (!p) return null
        gl.attachShader(p, v)
        gl.attachShader(p, f)
        gl.linkProgram(p)
        if (!gl.getProgramParameter(p, gl.LINK_STATUS)) {
            console.warn(gl.getProgramInfoLog(p))
            return null
        }
        return p
    }

    loadTexture(): Promise<void> {
        const src = this.opts.texture
        return new Promise<void>((resolve, reject) => {
            const img = new Image()
            // framerusercontent.com sends Access-Control-Allow-Origin: *, so WebGL may read it
            img.crossOrigin = "anonymous"
            img.onload = () => {
                const gl = this.gl
                if (this.destroyed || !gl) return reject(new Error("destroyed"))
                const tex = gl.createTexture()
                this.tex = tex
                gl.activeTexture(gl.TEXTURE0)
                gl.bindTexture(gl.TEXTURE_2D, tex)
                gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img)
                gl.generateMipmap(gl.TEXTURE_2D)
                gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR)
                gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR)
                gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT)
                gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT)
                resolve()
            }
            img.onerror = reject
            img.src = src
        })
    }

    /* Size the canvas, collect the carvings from the live layout, paint the height map */
    layout() {
        const gl = this.gl
        if (!gl) return
        const rect = this.host.getBoundingClientRect()
        const w = Math.max(1, rect.width),
            h = Math.max(1, rect.height)
        const coarse = window.matchMedia("(pointer: coarse)").matches
        let dpr = Math.min(window.devicePixelRatio || 1, 2)
        const maxPx = coarse ? 3.6e6 : 7.2e6
        if (w * h * dpr * dpr > maxPx) dpr = Math.sqrt(maxPx / (w * h))
        this.dpr = dpr
        this.w = w
        this.h = h
        this.canvas.width = Math.round(w * dpr)
        this.canvas.height = Math.round(h * dpr)
        gl.viewport(0, 0, this.canvas.width, this.canvas.height)
        this.carves = this.collect()
        this.heightDirty = true
        this.needsFrame = true
    }

    /* Read every [data-carve] element into drawing instructions, in slab coordinates */
    collect() {
        const origin = this.host.getBoundingClientRect()
        const out: any[] = []
        const order: Record<string, number> = { panel: 0, seam: 1, hole: 2, mark: 3, text: 4 }
        const scope = this.scope
        Array.prototype.slice
            .call(this.host.querySelectorAll("[data-carve]"))
            .sort((a: Element, b: Element) => order[a.getAttribute("data-carve")!] - order[b.getAttribute("data-carve")!])
            .forEach((el: Element) => {
                const r = el.getBoundingClientRect()
                const x = r.left - origin.left,
                    y = r.top - origin.top
                const kind = el.getAttribute("data-carve")
                if (kind === "mark") {
                    const paths = markPaths(el, scope)
                    const vb = (el.getAttribute("viewBox") || "0 0 72 57").split(/[\s,]+/).map(Number)
                    const k = Math.min(r.width / vb[2], r.height / vb[3])
                    out.push({ kind: kind, paths: paths, x: x + (r.width - vb[2] * k) / 2, y: y + (r.height - vb[3] * k) / 2, k: k })
                } else if (kind === "text") {
                    out.push(textGlyphs(el as HTMLElement, origin))
                } else {
                    out.push({ kind: kind, x: x, y: y, w: r.width, h: r.height })
                }
            })
        return out
    }

    /* Paint the height map for the current view: red = surface height, green = charcoal inlay */
    paintHeight() {
        const gl = this.gl!,
            hc = this.heightCanvas!,
            sc = this.sharpCanvas!,
            d = this.dpr,
            v = this.view
        const W = this.canvas.width,
            H = this.canvas.height
        if (hc.width !== W || hc.height !== H) {
            hc.width = sc.width = W
            hc.height = sc.height = H
        }

        const ctx = sc.getContext("2d")!
        ctx.setTransform(1, 0, 0, 1, 0, 0)
        ctx.fillStyle = "rgb(255,0,0)"
        ctx.fillRect(0, 0, W, H)
        // screen = shift + (slab - origin) * scale
        ctx.setTransform(d * v.s, 0, 0, d * v.s, d * (v.ox + v.tx - v.ox * v.s), d * (v.oy + v.ty - v.oy * v.s))

        const panels: any[] = []
        this.carves.forEach((c) => {
            if (c.kind === "panel") {
                // Charcoal inlay, flush with the surface, with a fine groove around it
                panels.push(c)
                ctx.strokeStyle = "rgb(120,0,0)"
                ctx.lineWidth = 1.5
                ctx.strokeRect(c.x - 0.75, c.y - 0.75, c.w + 1.5, c.h + 1.5)
            } else if (c.kind === "seam") {
                // Formwork joint: a fine, shallow groove along the element's long side
                ctx.fillStyle = "rgb(70,0,0)"
                if (c.w >= c.h) ctx.fillRect(c.x, c.y + c.h / 2 - 0.6, c.w, 1.2)
                else ctx.fillRect(c.x + c.w / 2 - 0.6, c.y, 1.2, c.h)
            } else if (c.kind === "hole") {
                // Formwork tie hole: a small round recess, the same circle as the top of the A
                ctx.fillStyle = "rgb(0,0,0)"
                ctx.beginPath()
                ctx.arc(c.x + c.w / 2, c.y + c.h / 2, c.w / 2, 0, Math.PI * 2)
                ctx.fill()
            } else if (c.kind === "mark") {
                ctx.save()
                ctx.translate(c.x, c.y)
                ctx.scale(c.k, c.k)
                ctx.fillStyle = "rgb(0,0,0)"
                c.paths.forEach((p: Path2D) => {
                    ctx.fill(p)
                })
                ctx.restore()
            } else if (c.kind === "text") {
                ctx.font = c.font
                ctx.fillStyle = "rgb(0,0,0)"
                ctx.textBaseline = "alphabetic"
                c.glyphs.forEach((g: { ch: string; x: number; y: number }) => {
                    ctx.fillText(g.ch, g.x, g.y)
                })
            }
        })

        // Soften every edge into a sloped wall (the bevel). The wall widens a little as you zoom in.
        const hctx = hc.getContext("2d")!
        const blur = 0.9 * d * Math.min(v.s, 2.2)
        hctx.setTransform(1, 0, 0, 1, 0, 0)
        if (typeof hctx.filter === "string") {
            hctx.filter = "blur(" + blur.toFixed(2) + "px)"
            hctx.drawImage(sc, 0, 0)
            hctx.filter = "none"
        } else {
            hctx.globalAlpha = 1 / 9
            for (let dx = -1; dx <= 1; dx++) for (let dy = -1; dy <= 1; dy++) hctx.drawImage(sc, dx * blur, dy * blur)
            hctx.globalAlpha = 1
        }

        // Inlay mask goes in the green channel unblurred, so panel edges stay crisp
        if (panels.length) {
            hctx.save()
            hctx.globalCompositeOperation = "lighter"
            hctx.fillStyle = "rgb(0,255,0)"
            hctx.setTransform(d * v.s, 0, 0, d * v.s, d * (v.ox + v.tx - v.ox * v.s), d * (v.oy + v.ty - v.oy * v.s))
            panels.forEach((c) => {
                hctx.fillRect(c.x, c.y, c.w, c.h)
            })
            hctx.restore()
        }

        gl.activeTexture(gl.TEXTURE1)
        gl.bindTexture(gl.TEXTURE_2D, this.heightTex)
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, hc)
        this.hTexel = [1 / W, 1 / H]
        this.heightDirty = false
    }

    /* Zoom the slab and burn or break through it.
       view: { ox, oy, tx, ty, s,
               burn: { cx, cy, rx, ry, r, heat } | null,
               shatter: { cx, cy, rx, ry, crack, brk, light } | null,
               drill: { cx, cy, rx, ry, cam, depth, light, dust, k, r, spin, thick } | null }
       Positions in css px in the slab's own (unzoomed) coordinates. Radii (r, crack,
       brk) are shares of the O's counter (rx, ry); heat and light run 0–1.
       drill: cam is the camera's distance to the face (1 at the start, 0 at the face,
       -k once through the back); depth runs 0–k; s should be 1/cam while cam > 0.
       Draws a frame straight away. */
    setView(view: ConcreteView) {
        this.view = view
        this.heightDirty = true
        this.needsFrame = true
        if (this.ready && !document.hidden) {
            this.render((performance.now() - this.t0) / 1000, !this.running)
            this.last = performance.now()
        }
    }

    bind() {
        const ro = new ResizeObserver(() => {
            this.queueLayout()
        })
        ro.observe(this.host)
        this.host.querySelectorAll("[data-carve]").forEach((el) => {
            ro.observe(el)
        })
        this.offs.push(() => ro.disconnect())

        const io = new IntersectionObserver(
            (entries) => {
                this.visible = entries[0].isIntersecting
                this.kick()
            },
            { rootMargin: "100px" }
        )
        io.observe(this.host)
        this.offs.push(() => io.disconnect())

        this.listen(document, "visibilitychange", () => {
            this.kick()
        })
        if (typeof this.reduced.addEventListener === "function")
            this.listen(this.reduced, "change", () => {
                this.kick()
            })

        this.listen(this.host, "pointermove", (e: PointerEvent) => {
            if (e.pointerType !== "mouse") return
            const r = this.host.getBoundingClientRect()
            this.mouse.tx = e.clientX - r.left
            this.mouse.ty = e.clientY - r.top
            if (this.mouse.amt < 0.01) {
                this.mouse.x = this.mouse.tx
                this.mouse.y = this.mouse.ty
            }
            this.mouse.tamt = 1
        })
        this.listen(this.host, "pointerleave", () => {
            this.mouse.tamt = 0
        })
    }

    queueLayout() {
        if (this.layoutQueued || this.destroyed) return
        this.layoutQueued = true
        this.layoutId = requestAnimationFrame(() => {
            this.layoutQueued = false
            if (this.destroyed) return
            this.layout()
            this.kick()
        })
    }

    /* Pause while something else owns the view (the hero zoom, once the hero is flying away) */
    setPaused(paused: boolean) {
        paused = !!paused
        if (this.paused === paused) return
        this.paused = paused
        if (this.ready) this.kick()
    }

    /* Start, stop or draw a single still frame depending on state */
    kick() {
        if (!this.ready) return // nothing to draw until the textures and height map exist
        const animate = this.visible && !this.paused && !document.hidden && !this.reduced.matches
        if (animate && !this.running) {
            this.running = true
            this.loop = this.loop || this.frame.bind(this)
            this.frameId = requestAnimationFrame(this.loop!)
        } else if (!animate && this.needsFrame && this.visible) {
            this.render(this.reduced.matches ? 0 : (performance.now() - this.t0) / 1000, true)
        }
    }

    frame(now: number) {
        if (this.destroyed || !this.visible || this.paused || document.hidden || this.reduced.matches) {
            this.running = false
            return
        }
        const dt = Math.min(0.1, (now - (this.last || now)) / 1000)
        const m = this.mouse
        const ease = 1 - Math.exp(-dt * 7)
        m.x += (m.tx - m.x) * ease
        m.y += (m.ty - m.y) * ease
        m.amt += (m.tamt - m.amt) * (1 - Math.exp(-dt * 3))

        // The sun moves slowly; without the cursor, 30 fps is plenty
        const idle = m.amt < 0.01 && m.tamt === 0
        if (!idle || now - this.last > 32 || this.needsFrame) {
            this.render((now - this.t0) / 1000, false)
            this.last = now
        }
        this.frameId = requestAnimationFrame(this.loop!)
    }

    render(t: number, still: boolean) {
        const gl = this.gl,
            u = this.u,
            o = this.opts,
            v = this.view
        if (!gl || this.destroyed) return
        if (this.heightDirty) this.paintHeight()
        const band = still && this.reduced.matches ? o.staticBand : 0.55 + 0.45 * Math.sin((t / o.period) * Math.PI * 2 + 0.2)
        gl.uniform2f(u.uRes, this.canvas.width, this.canvas.height)
        gl.uniform1f(u.uScale, this.dpr)
        gl.uniform1f(u.uTime, t)
        gl.uniform1f(u.uBand, band)
        gl.uniform2f(u.uMouse, this.mouse.x, this.mouse.y)
        gl.uniform1f(u.uMouseAmt, this.mouse.amt)
        gl.uniform1f(u.uSun, o.sun)
        gl.uniform1f(u.uCursor, o.cursor)
        gl.uniform1i(u.uTex, 0)
        gl.uniform1f(u.uTexSize, o.textureSize)
        gl.uniform1i(u.uHeight, 1)
        gl.uniform2f(u.uHTexel, this.hTexel[0], this.hTexel[1])
        gl.uniform2f(u.uOrigin, v.ox, v.oy)
        gl.uniform2f(u.uShift, v.ox + v.tx, v.oy + v.ty)
        gl.uniform1f(u.uZoom, v.s)
        const b = v.burn
        gl.uniform4f(u.uBurn, b ? b.cx : 0, b ? b.cy : 0, b ? b.rx : 0, b ? b.ry : 0)
        gl.uniform3f(u.uBurnP, b ? b.r : 0, b ? b.heat : 0, o.burnWarmth)
        const k = v.shatter
        gl.uniform4f(u.uBreak, k ? k.cx : 0, k ? k.cy : 0, k ? k.rx : 0, k ? k.ry : 0)
        gl.uniform3f(u.uBreakP, k ? k.crack : 0, k ? k.brk : 0, k ? k.light : 0)
        const dr = v.drill
        gl.uniform4f(u.uDrill, dr ? dr.cx : 0, dr ? dr.cy : 0, dr ? dr.rx : 0, dr ? dr.ry : 0)
        gl.uniform4f(u.uDrillP, dr ? dr.cam : 1, dr ? dr.depth : 0, dr ? dr.light : 0, dr ? dr.dust : 0)
        gl.uniform4f(u.uDrillQ, dr ? dr.k : 1, dr ? dr.r : 1, dr ? dr.spin : 0, dr ? dr.thick : 2)
        gl.drawArrays(gl.TRIANGLES, 0, 3)
        this.needsFrame = false
    }

    /**
     * Stop for good: the frame loop and queued layout, the observers and listeners,
     * and the GL context (textures, buffer and program deleted, context lost) and
     * the offscreen canvases. The hero falls back to its CSS concrete.
     */
    destroy() {
        if (this.destroyed) return
        this.destroyed = true
        this.ready = false
        this.running = false
        cancelAnimationFrame(this.frameId)
        cancelAnimationFrame(this.layoutId)
        this.offs.splice(0).forEach((off) => {
            try {
                off()
            } catch (e) {}
        })
        const gl = this.gl
        if (gl) {
            try {
                gl.deleteTexture(this.tex)
                gl.deleteTexture(this.heightTex)
                gl.deleteBuffer(this.buf)
                gl.deleteProgram(this.prog)
                this.shaders.forEach((s) => gl.deleteShader(s))
                const lose = gl.getExtension("WEBGL_lose_context")
                if (lose) lose.loseContext()
            } catch (e) {}
        }
        this.gl = null
        this.prog = null
        this.tex = this.heightTex = this.buf = null
        this.shaders = []
        ;[this.heightCanvas, this.sharpCanvas].forEach((c) => {
            if (c) c.width = c.height = 0
        })
        this.heightCanvas = this.sharpCanvas = null
        this.carves = []
        this.host.classList.remove("hero--gl")
    }

    private listen(target: EventTarget, type: string, fn: any) {
        target.addEventListener(type, fn)
        this.offs.push(() => target.removeEventListener(type, fn))
    }
}

/* ---------- helpers ---------- */

// Read the A-mark's path data from the SVG (inline paths or a <use> of the sprite)
function markPaths(svg: Element, scope: ParentNode) {
    let src: ParentNode = svg
    const use = svg.querySelector("use")
    if (use) {
        const id = (use.getAttribute("href") || use.getAttribute("xlink:href") || "").replace("#", "")
        // The sprite is rendered inside the component (sprite()): look there first
        let found: Element | null = null
        try {
            found = id ? scope.querySelector('[id="' + id.replace(/"/g, '\\"') + '"]') : null
        } catch (e) {}
        src = found || (id ? document.getElementById(id) : null) || svg
    }
    return Array.prototype.map.call(src.querySelectorAll("path"), (p: Element) => new Path2D(p.getAttribute("d") || "")) as Path2D[]
}

// Where the browser laid out each glyph of an element's text, so the carving matches it exactly
function textGlyphs(el: HTMLElement, origin: DOMRect) {
    const out = { kind: "text", font: "", glyphs: [] as { ch: string; x: number; y: number }[] }
    const node = el.firstChild as Text | null
    if (!node || node.nodeType !== 3) return out
    const cs = getComputedStyle(el)
    const size = parseFloat(cs.fontSize)
    out.font = cs.fontWeight + " " + size + "px " + cs.fontFamily
    const ctx = document.createElement("canvas").getContext("2d")!
    ctx.font = out.font
    const m = ctx.measureText(node.data)
    const asc = m.fontBoundingBoxAscent || size * 0.968
    const desc = m.fontBoundingBoxDescent || size * 0.251
    const range = document.createRange()
    for (let i = 0; i < node.data.length; i++) {
        range.setStart(node, i)
        range.setEnd(node, i + 1)
        const r = range.getBoundingClientRect()
        // A glyph's client rect is the font's content area, so the baseline sits one ascent down
        out.glyphs.push({ ch: node.data[i], x: r.left - origin.left, y: r.top - origin.top + (r.height - (asc + desc)) / 2 + asc })
    }
    return out
}
