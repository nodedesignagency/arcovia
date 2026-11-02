/* Arcovia — the vault opening (SECTION:vault, sections/vault.css).
   The logo is the vault. On a flat charcoal door the A-mark is debossed, large.
   The A's outline is a doorway and its two leaves are the legs: each leaf is a
   thick slab (one leg and its half of the space between the legs), hinged along
   the outer edge of its leg; the circle above is the vault wheel, fixed in the
   wall. The inline script in the head sets html.vault-on before the first paint
   and the CSS paints the closed door; this script, once the hero's concrete is
   live (.hero--gl) and the door has been seen for a moment (at the latest after
   MAX_WAIT; a scroll, key or tap starts it at once), plays it in WebGL:
   1. the wheel spins (a machined sheen sweeps round it);
   2. light leaks through the cracks and draws the doorway and the centre seam;
   3. the leaves swing open towards you on their leg hinges, heavy, in true
      perspective: their thickness shows and their inner faces catch the light
      pouring out; the hero shows through the A-shaped doorway;
   4. the view pushes in through the A, the leaves rush past at the sides, and
      lands on the hero.
   Lit from above like the deboss; drawn at device resolution so edges stay crisp.
   The deboss is the same SVG filter as the CSS door (#deboss-vault), rasterised
   once into a texture. Removes itself (and frees its GL context) when done. */
(function () {
  "use strict";

  var root = document.documentElement;
  var vault = document.querySelector("[data-vault]");
  if (!vault) return;
  if (!root.classList.contains("vault-on")) {
    vault.parentNode.removeChild(vault);
    return;
  }

  var MIN_HOLD = 400;  // ms the closed door is seen
  var MAX_WAIT = 1600; // ms at most before it opens
  var LATE = 3500;     // ms after the first paint: past this, skip the opening

  // The sequence, in ms from the start of the unlock
  var T = {
    spin: [0, 520],      // the wheel turns
    leak: [300, 620],    // light leaks through the cracks
    swing: [560, 1520],  // the leaves swing open
    push: [1000, 1820],  // the view pushes in through the A
    rise: 1250           // the hero's text starts to rise
  };
  var SWING = 100 * Math.PI / 180; // how far the leaves open
  var DEPTH = 3.4;                 // the leaves' thickness, in mark units
  var CHARCOAL = [86 / 255, 86 / 255, 86 / 255]; // #565656

  // The A-mark (viewBox 72 × 57, as in the sprite). The circle is the wheel; the doorway
  // runs down the legs' outer edges to their feet and closes under the wheel with an arc.
  var MARK = { w: 72, h: 57, cx: 36.201, cy: 8.0109, r: 8.0136 };
  var SHAPES = [
    "M12.0606 45.653L6.4043 56.272L9.58059 56.3005C11.096 56.3148 12.4458 56.3605 14.1267 56.2321L35.0366 17.4288C32.9219 16.7924 31.1725 15.7479 29.6286 14.4009L12.0606 45.653Z",
    "M62.5327 50.738L42.9184 14.1807C41.2461 15.8616 39.5509 16.9432 37.3164 17.1743L57.8439 56.243H65.3551C64.3192 54.3652 63.3831 52.7499 62.5327 50.738Z",
    "M36.201 16.0215C40.6267 16.0215 44.2145 12.4351 44.2145 8.0109C44.2145 3.58674 40.6267 0.000244141 36.201 0.000244141C31.7753 0.000244141 28.1875 3.58674 28.1875 8.0109C28.1875 12.4351 31.7753 16.0215 36.201 16.0215Z"
  ];
  var ARC_R = 9.1;   // the doorway's top: an arc just outside the wheel, under the legs' tops
  var FOOT_Y = 56.4; // the doorway's foot, just under the legs' feet
  var TL = [29.6286, 14.4009], TR = [42.9184, 14.1807]; // the legs' outer top corners
  // the legs' outer edges, top to foot (the hinges); the right one follows its curve at the foot
  var EDGE_L = [TL, [12.0606, 45.653], [6.4043, 56.272], [6.33, FOOT_Y]];
  var EDGE_R = [TR, [62.5327, 50.738], [63.62, 53.25], [64.6, 55.0], [65.3551, 56.243], [65.44, FOOT_Y]];

  // Seen in this visit: coming back to Home from another page skips it (see the head script)
  try { sessionStorage.setItem("arc-vault", "1"); } catch (e) { /* private mode: plays again, fine */ }

  var hero = document.querySelector("[data-hero]");
  var t0 = performance.now();
  try {
    var paint = performance.getEntriesByName("first-contentful-paint")[0];
    if (paint) t0 = paint.startTime; // the door has been on screen since the first paint
  } catch (e) { /* no paint timing: count from now */ }

  function restoreTint() {
    var meta = document.querySelector('meta[name="theme-color"]');
    if (meta && meta.getAttribute("data-base")) meta.setAttribute("content", meta.getAttribute("data-base"));
  }
  function remove() {
    if (vault.parentNode) vault.parentNode.removeChild(vault);
  }

  if (performance.now() - t0 > LATE) {
    remove();
    root.classList.add("vault-open", "vault-done");
    restoreTint();
    return;
  }

  var reduce = !!window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var canvas = vault.querySelector(".vault__canvas");
  var gl = null;
  if (!reduce && canvas) {
    try {
      gl = canvas.getContext("webgl", { alpha: true, premultipliedAlpha: true, antialias: true, depth: true, stencil: false });
    } catch (e) { gl = null; }
  }

  /* ---------- Small helpers ---------- */
  function clamp(v) { return v < 0 ? 0 : v > 1 ? 1 : v; }
  function span(t, a) { return clamp((t - a[0]) / (a[1] - a[0])); }
  function smooth(a, b, v) { var x = clamp((v - a) / (b - a)); return x * x * (3 - 2 * x); }
  function easeInOutCubic(x) { return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2; }
  function easeInOutQuart(x) { return x < 0.5 ? 8 * x * x * x * x : 1 - Math.pow(-2 * x + 2, 4) / 2; }
  function easeInCubic(x) { return x * x * x; }

  /* ---------- Geometry, in mark units ---------- */
  function arcPoints(a0, a1, n) {
    var out = [];
    for (var i = 0; i <= n; i++) {
      var a = a0 + (a1 - a0) * (i / n);
      out.push([MARK.cx + Math.cos(a) * ARC_R, MARK.cy + Math.sin(a) * ARC_R]);
    }
    return out;
  }
  var A_L = Math.atan2(TL[1] - MARK.cy, TL[0] - MARK.cx); // ~136°: towards the left leg's top
  var A_R = Math.atan2(TR[1] - MARK.cy, TR[0] - MARK.cx); // ~43°
  var BOT = Math.PI / 2;                                    // straight down (y grows downwards)
  var CT = [MARK.cx, MARK.cy + ARC_R], CF = [MARK.cx, FOOT_Y];
  // Each leaf: under the arc from the centre to its leg's top, down the leg's outer edge,
  // along the foot to the centre (the boundary, in order; CF closes it and is the fan centre)
  var LEAF_L = arcPoints(BOT, A_L, 10).concat(EDGE_L.slice(1)).concat([CF]);
  var LEAF_R = arcPoints(BOT, A_R, 10).concat(EDGE_R.slice(1)).concat([CF]);
  // The whole doorway (the hole in the wall), in order round it
  var DOOR = arcPoints(A_R, BOT, 10).concat(arcPoints(BOT, A_L, 10).slice(1))
    .concat(EDGE_L.slice(1)).concat(EDGE_R.slice(1).reverse());

  /* ---------- GL programs ---------- */
  var VS = [
    "attribute vec3 aPos;",   // rest position, world px (x right, y down, z towards the viewer)
    "attribute vec3 aNorm;",
    "attribute vec2 aMark;",  // rest position in mark units (for the deboss and the wheel)
    "attribute float aTex;",  // 1 on faces that carry the deboss
    "uniform mat3 uRot;",     // the leaf's turn about its hinge ...
    "uniform vec3 uPivot;",   // ... through this point
    "uniform vec3 uCam;",     // camera position, world px
    "uniform vec2 uSize;",    // viewport, css px
    "uniform float uF;",      // focal length, px
    "varying vec3 vN; varying vec3 vP; varying vec2 vM; varying float vT;",
    "void main() {",
    "  vec3 p = uPivot + uRot * (aPos - uPivot);",
    "  vN = uRot * aNorm; vP = p; vM = aMark; vT = aTex;",
    "  float zc = uCam.z - p.z;",
    "  float n = 1.0, f = 40000.0;",
    "  gl_Position = vec4((p.x - uCam.x) * uF / (uSize.x * 0.5), -(p.y - uCam.y) * uF / (uSize.y * 0.5),",
    "                     zc * (f + n) / (f - n) - 2.0 * f * n / (f - n), zc);",
    "}"
  ].join("\n");
  var FS = [
    // high precision where the GPU has it (the mark coordinates are interpolated over large triangles)
    "#ifdef GL_FRAGMENT_PRECISION_HIGH",
    "precision highp float;",
    "#else",
    "precision mediump float;",
    "#endif",
    "varying vec3 vN; varying vec3 vP; varying vec2 vM; varying float vT;",
    "uniform vec3 uBase; uniform vec3 uL; uniform float uAmb; uniform float uDif;",
    "uniform vec3 uBackPos; uniform float uBack;",
    "uniform sampler2D uTex; uniform vec4 uTexMap;",
    "uniform float uWall; uniform vec2 uWheelC; uniform float uWheelR; uniform vec2 uSpin; uniform float uSheen;",
    "void main() {",
    "  vec3 n = normalize(vN);",
    "  vec3 col = uBase * (uAmb + uDif * max(dot(n, uL), 0.0));",
    // light from inside the vault, on faces that turn towards it
    "  vec3 tb = uBackPos - vP; float db = length(tb);",
    "  col += vec3(uBack * 0.62 * max(dot(n, tb / db), 0.0));",
    "  if (vT > 0.5) {",
    "    vec2 tc = (vM - uTexMap.xy) / uTexMap.zw;",
    "    if (tc.x > 0.0 && tc.x < 1.0 && tc.y > 0.0 && tc.y < 1.0) {",
    "      vec4 d = texture2D(uTex, tc);",
    "      col = col * (1.0 - d.a) + d.rgb * d.a;",
    "    }",
    // the wheel: a machined face whose sheen sweeps round as it turns (direction vectors, no angles)
    "    if (uWall > 0.5 && uSheen > 0.001) {",
    "      vec2 q = vM - uWheelC; float r = length(q);",
    "      if (r < uWheelR) {",
    "        float s = abs(dot(q / max(r, 0.0001), uSpin));",
    "        float edge = smoothstep(uWheelR, uWheelR - 0.6, r);",
    "        col += vec3((0.2 * pow(s, 14.0) + 0.018 * sin(r * 8.0)) * uSheen * edge);",
    "      }",
    "    }",
    "  }",
    "  gl_FragColor = vec4(col, 1.0);",
    "}"
  ].join("\n");
  // Light pouring through the doorway (drawn first; the wall and leaves cover it elsewhere)
  var GVS = "attribute vec2 aXY; varying vec2 vXY; void main() { vXY = aXY; gl_Position = vec4(aXY, 0.0, 1.0); }";
  var GFS = [
    "precision mediump float;",
    "varying vec2 vXY; uniform vec2 uSize; uniform vec2 uC; uniform float uR; uniform float uGlow;",
    "void main() {",
    "  vec2 p = (vXY * 0.5 + 0.5) * uSize; p.y = uSize.y - p.y;",
    "  float d = length(p - uC) / uR;",
    "  float g = uGlow * (exp(-d * d * 1.6) * 0.85 + 0.15 * exp(-d * d * 0.25));",
    "  gl_FragColor = vec4(vec3(g), g);",
    "}"
  ].join("\n");
  // Seams: lines with a hard or soft edge (the closed door's joint; light leaking through the cracks)
  var LVS = [
    "attribute vec3 aPos; attribute float aAcross;",
    "uniform vec3 uCam; uniform vec2 uSize; uniform float uF;",
    "varying float vA;",
    "void main() { vA = aAcross; float zc = uCam.z - aPos.z;",
    "  gl_Position = vec4((aPos.x - uCam.x) * uF / (uSize.x * 0.5), -(aPos.y - uCam.y) * uF / (uSize.y * 0.5), 0.0, zc); }"
  ].join("\n");
  var LFS = [
    "precision mediump float;",
    "varying float vA; uniform vec4 uColor; uniform float uSoft;",
    "void main() { float a = mix(1.0, pow(1.0 - abs(vA), 2.0), uSoft); gl_FragColor = vec4(uColor.rgb * uColor.a * a, uColor.a * a); }"
  ].join("\n");

  function shader(type, src) {
    var s = gl.createShader(type);
    gl.shaderSource(s, src);
    gl.compileShader(s);
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s));
    return s;
  }
  function program(vs, fs, attrs) {
    var p = gl.createProgram();
    gl.attachShader(p, shader(gl.VERTEX_SHADER, vs));
    gl.attachShader(p, shader(gl.FRAGMENT_SHADER, fs));
    attrs.forEach(function (a, i) { gl.bindAttribLocation(p, i, a); });
    gl.linkProgram(p);
    if (!gl.getProgramParameter(p, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(p));
    var u = {};
    var n = gl.getProgramParameter(p, gl.ACTIVE_UNIFORMS);
    for (var i = 0; i < n; i++) {
      var info = gl.getActiveUniform(p, i);
      u[info.name] = gl.getUniformLocation(p, info.name);
    }
    return { p: p, u: u };
  }

  var progMain = null, progGlow = null, progLine = null, tex = null, texReady = false;
  var W = 0, H = 0, dpr = 1, u = 1, OX = 0, OY = 0, F = 1;
  var buffers = {}, DOOR_C = null, HINGE = {};

  /* ---------- Layout: the same sizes as the CSS closed door ---------- */
  function toWorld(m) { return [OX + m[0] * u, OY + m[1] * u]; }

  function layout() {
    W = vault.clientWidth;
    H = vault.clientHeight;
    dpr = Math.min(window.devicePixelRatio || 1, 2.5);
    canvas.width = Math.round(W * dpr);
    canvas.height = Math.round(H * dpr);
    var mh = Math.min(0.5 * H, (0.7 * W * MARK.h) / MARK.w);
    u = mh / MARK.h;
    OX = W / 2 - MARK.cx * u;          // the wheel's centre on the middle of the screen
    OY = 0.48 * H - (MARK.h / 2) * u;  // the mark's centre 48% down
    F = (H / 2) / Math.tan((40 * Math.PI / 180) / 2); // 40° field of view; the wall fills the screen
    build();
    prepareTexture();
  }

  // Interleaved vertex data: pos(3) norm(3) mark(2) tex(1)
  function pushV(a, m, z, n, t) { var w = toWorld(m); a.push(w[0], w[1], z, n[0], n[1], n[2], m[0], m[1], t); }

  // A leaf: front face (fan from the foot's centre), back face, and the sides (its thickness)
  function leafMesh(poly) {
    var D = DEPTH * u;
    var a = [];
    var c = poly[poly.length - 1]; // CF
    for (var i = 0; i < poly.length - 2; i++) {
      pushV(a, c, 0, [0, 0, 1], 1); pushV(a, poly[i], 0, [0, 0, 1], 1); pushV(a, poly[i + 1], 0, [0, 0, 1], 1);
      pushV(a, c, -D, [0, 0, -1], 0); pushV(a, poly[i + 1], -D, [0, 0, -1], 0); pushV(a, poly[i], -D, [0, 0, -1], 0);
    }
    // outward normals: away from the polygon's centroid
    var gx = 0, gy = 0;
    poly.forEach(function (p) { gx += p[0]; gy += p[1]; });
    gx /= poly.length; gy /= poly.length;
    for (var j = 0; j < poly.length; j++) {
      var p0 = poly[j], p1 = poly[(j + 1) % poly.length];
      var ex = p1[0] - p0[0], ey = p1[1] - p0[1], len = Math.hypot(ex, ey);
      if (len < 1e-6) continue;
      var nx = ey / len, ny = -ex / len;
      var mx = (p0[0] + p1[0]) / 2 - gx, my = (p0[1] + p1[1]) / 2 - gy;
      if (nx * mx + ny * my < 0) { nx = -nx; ny = -ny; }
      var n = [nx, ny, 0];
      pushV(a, p0, 0, n, 0); pushV(a, p1, 0, n, 0); pushV(a, p1, -D, n, 0);
      pushV(a, p0, 0, n, 0); pushV(a, p1, -D, n, 0); pushV(a, p0, -D, n, 0);
    }
    return a;
  }

  // The wall: a ring between the doorway and a far circle, cast on rays from the doorway's
  // centroid (dense, so the far chords never cut into the screen)
  function wallMesh() {
    var a = [];
    // the doorway's area centroid (the vertex average leans towards the dense arc at the top)
    var ar = 0, gx = 0, gy = 0;
    for (var q = 0; q < DOOR.length; q++) {
      var q0 = DOOR[q], q1 = DOOR[(q + 1) % DOOR.length];
      var cr = q0[0] * q1[1] - q1[0] * q0[1];
      ar += cr;
      gx += (q0[0] + q1[0]) * cr;
      gy += (q0[1] + q1[1]) * cr;
    }
    gx /= 3 * ar;
    gy /= 3 * ar;
    var far = 40 * Math.max(W, H) / u; // mark units
    var near = 95;                     // a middle ring round the mark: the deboss lives inside it
    var N = 512, inner = [], mid = [], outer = [];
    for (var i = 0; i < N; i++) {
      var ang = (i / N) * Math.PI * 2, dx = Math.cos(ang), dy = Math.sin(ang);
      var best = Infinity;
      for (var j = 0; j < DOOR.length; j++) {
        var p0 = DOOR[j], p1 = DOOR[(j + 1) % DOOR.length];
        var sx = p1[0] - p0[0], sy = p1[1] - p0[1];
        var den = dx * sy - dy * sx;
        if (Math.abs(den) < 1e-9) continue;
        var t = ((p0[0] - gx) * sy - (p0[1] - gy) * sx) / den;
        var s = ((p0[0] - gx) * dy - (p0[1] - gy) * dx) / den;
        if (t > 0 && s >= -1e-6 && s <= 1 + 1e-6 && t < best) best = t;
      }
      inner.push([gx + dx * best, gy + dy * best]);
      mid.push([gx + dx * Math.max(near, best + 10), gy + dy * Math.max(near, best + 10)]);
      outer.push([gx + dx * far, gy + dy * far]);
    }
    var n = [0, 0, 1];
    // small triangles round the A carry the deboss; the far ring is plain wall
    for (var k = 0; k < N; k++) {
      var k1 = (k + 1) % N;
      pushV(a, inner[k], 0, n, 1); pushV(a, mid[k], 0, n, 1); pushV(a, mid[k1], 0, n, 1);
      pushV(a, inner[k], 0, n, 1); pushV(a, mid[k1], 0, n, 1); pushV(a, inner[k1], 0, n, 1);
      pushV(a, mid[k], 0, n, 0); pushV(a, outer[k], 0, n, 0); pushV(a, outer[k1], 0, n, 0);
      pushV(a, mid[k], 0, n, 0); pushV(a, outer[k1], 0, n, 0); pushV(a, mid[k1], 0, n, 0);
    }
    return { a: a, g: [gx, gy] };
  }

  // Lines as quads in world px: [x, y, z, across]
  function lineQuads(pts, halfW, z, closed) {
    var a = [];
    var n = closed ? pts.length : pts.length - 1;
    for (var i = 0; i < n; i++) {
      var p0 = toWorld(pts[i]), p1 = toWorld(pts[(i + 1) % pts.length]);
      var dx = p1[0] - p0[0], dy = p1[1] - p0[1], len = Math.hypot(dx, dy);
      if (len < 1e-6) continue;
      var nx = -dy / len * halfW, ny = dx / len * halfW;
      a.push(p0[0] - nx, p0[1] - ny, z, -1, p0[0] + nx, p0[1] + ny, z, 1, p1[0] + nx, p1[1] + ny, z, 1);
      a.push(p0[0] - nx, p0[1] - ny, z, -1, p1[0] + nx, p1[1] + ny, z, 1, p1[0] - nx, p1[1] - ny, z, -1);
    }
    return a;
  }

  function upload(name, data, stride) {
    if (!buffers[name]) buffers[name] = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffers[name]);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(data), gl.STATIC_DRAW);
    buffers[name].count = data.length / stride;
  }

  // The hinge of a leaf: the line from its leg's top to its foot, on the front face
  function hinge(edge, poly) {
    var a = toWorld(edge[0]), b = toWorld(edge[edge.length - 2]);
    var kx = b[0] - a[0], ky = b[1] - a[1], kl = Math.hypot(kx, ky);
    var k = [kx / kl, ky / kl, 0];
    // turn towards the viewer: the leaf's middle must come forward (z > 0)
    var g = [0, 0];
    poly.forEach(function (p) { var w = toWorld(p); g[0] += w[0]; g[1] += w[1]; });
    g[0] /= poly.length; g[1] /= poly.length;
    // for a small turn phi about k, the middle moves along k × r; its z is kx·ry − ky·rx
    var rx = g[0] - a[0], ry = g[1] - a[1];
    var sign = (k[0] * ry - k[1] * rx) > 0 ? 1 : -1;
    return { a: [a[0], a[1], 0], k: k, sign: sign };
  }

  function build() {
    var w = wallMesh();
    upload("wall", w.a, 9);
    upload("left", leafMesh(LEAF_L), 9);
    upload("right", leafMesh(LEAF_R), 9);
    DOOR_C = toWorld(w.g);
    upload("glow", [-1, -1, 1, -1, 1, 1, -1, -1, 1, 1, -1, 1], 2);
    var px = 1 / u; // one css px in mark units
    var joint = [CT, CF];
    // The closed door's joint, as the CSS draws it: dark, with a light lip 1px to its right
    upload("jointDark", lineQuads(joint.map(function (p) { return [p[0] - px / 2, p[1]]; }), 0.5, 0.05, false), 4);
    upload("jointLight", lineQuads(joint.map(function (p) { return [p[0] + px / 2, p[1]]; }), 0.5, 0.05, false), 4);
    // The light leaking through the cracks: the doorway's outline and the centre seam
    upload("leakCore", lineQuads(DOOR, 0.8, 0.06, true).concat(lineQuads(joint, 0.8, 0.06, false)), 4);
    upload("leakGlow", lineQuads(DOOR, 7, 0.07, true).concat(lineQuads(joint, 7, 0.07, false)), 4);
    HINGE.left = hinge(EDGE_L, LEAF_L);
    HINGE.right = hinge(EDGE_R, LEAF_R);
  }

  // Rodrigues: the rotation by phi about unit axis k, as a column-major mat3
  function rot(k, phi) {
    var c = Math.cos(phi), s = Math.sin(phi), t = 1 - c;
    var x = k[0], y = k[1], z = k[2];
    return [
      t * x * x + c, t * x * y + s * z, t * x * z - s * y,
      t * x * y - s * z, t * y * y + c, t * y * z + s * x,
      t * x * z + s * y, t * y * z - s * x, t * z * z + c
    ];
  }
  var ID = [1, 0, 0, 0, 1, 0, 0, 0, 1];

  // The deboss texture: the whole mark through the same filter as the CSS door, in mark units
  var FILTER =
    '<filter id="d" x="-5%" y="-5%" width="110%" height="110%" color-interpolation-filters="sRGB">' +
    '<feFlood flood-color="#000" flood-opacity="0.22"/><feComposite in2="SourceAlpha" operator="in" result="floor"/>' +
    '<feOffset in="SourceAlpha" dx="0" dy="0.55" result="o1"/><feGaussianBlur in="o1" stdDeviation="0.22" result="b1"/>' +
    '<feComposite in="SourceAlpha" in2="b1" operator="out" result="e1"/>' +
    '<feFlood flood-color="#000" flood-opacity="0.6"/><feComposite in2="e1" operator="in" result="shade"/>' +
    '<feOffset in="SourceAlpha" dx="0" dy="-0.32" result="o2"/><feGaussianBlur in="o2" stdDeviation="0.15" result="b2"/>' +
    '<feComposite in="SourceAlpha" in2="b2" operator="out" result="e2"/>' +
    '<feFlood flood-color="#fff" flood-opacity="0.22"/><feComposite in2="e2" operator="in" result="light"/>' +
    '<feMerge><feMergeNode in="floor"/><feMergeNode in="shade"/><feMergeNode in="light"/></feMerge></filter>';
  var TEXMAP = [-2, -2, 76, 61]; // the mark units the texture covers
  var onTexture = null;
  function prepareTexture() {
    var R = u * dpr * 1.5; // device px per mark unit (a little headroom for the push-in)
    var pw = Math.min(4096, Math.ceil(TEXMAP[2] * R)), ph = Math.min(4096, Math.ceil(TEXMAP[3] * R));
    var shapes = SHAPES.map(function (d) { return '<path d="' + d + '"/>'; }).join("");
    var svg =
      '<svg xmlns="http://www.w3.org/2000/svg" width="' + pw + '" height="' + ph + '" viewBox="' + TEXMAP.join(" ") + '" preserveAspectRatio="none">' +
      "<defs>" + FILTER + "</defs>" +
      // the empty rect gives the filter the mark's whole box, as on the CSS door
      '<g filter="url(#d)"><rect width="72" height="57" fill="none"/>' + shapes + "</g></svg>";
    var img = new Image();
    img.onload = function () {
      var c = document.createElement("canvas");
      c.width = pw;
      c.height = ph;
      c.getContext("2d").drawImage(img, 0, 0, pw, ph);
      if (!tex) tex = gl.createTexture();
      gl.bindTexture(gl.TEXTURE_2D, tex);
      gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, false);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, c);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      texReady = true;
      if (onTexture) { var f = onTexture; onTexture = null; f(); }
    };
    img.src = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(svg);
  }

  /* ---------- One frame ---------- */
  function stateAt(t) {
    var st = {};
    var sp = span(t, T.spin);
    st.spin = 2.6 * Math.PI * easeInOutCubic(sp) + 0.6;        // the sheen turns with the wheel
    st.sheen = Math.sin(Math.PI * sp);                          // ... and fades in and out
    var sw = span(t, T.swing), pu = span(t, T.push);
    st.leak = smooth(0, 1, span(t, T.leak)) * (1 - smooth(0.02, 0.18, sw));
    st.phi = SWING * easeInOutQuart(sw);
    st.joint = 1 - smooth(0, 0.6, span(t, T.leak));            // the dark joint gives way to light
    st.back = smooth(0, 0.35, sw) * (1 - smooth(0.7, 1, pu));
    st.glow = smooth(0, 0.3, sw) * (1 - smooth(0.05, 0.7, pu));
    st.push = easeInCubic(pu);
    st.end = t >= T.push[1];
    st.t = t;
    return st;
  }

  function camAt(st) {
    // From straight in front (the wall fills the screen exactly) to just through the doorway
    var e = st.push, aim = smooth(0, 0.6, st.push);
    return [
      W / 2 + (DOOR_C[0] - W / 2) * aim,
      H / 2 + (DOOR_C[1] - H / 2) * aim,
      F * (1 - e) - 0.04 * F * e
    ];
  }

  function bindMain(name) {
    var b = buffers[name];
    gl.bindBuffer(gl.ARRAY_BUFFER, b);
    var s = 9 * 4;
    gl.enableVertexAttribArray(0); gl.vertexAttribPointer(0, 3, gl.FLOAT, false, s, 0);
    gl.enableVertexAttribArray(1); gl.vertexAttribPointer(1, 3, gl.FLOAT, false, s, 12);
    gl.enableVertexAttribArray(2); gl.vertexAttribPointer(2, 2, gl.FLOAT, false, s, 24);
    gl.enableVertexAttribArray(3); gl.vertexAttribPointer(3, 1, gl.FLOAT, false, s, 32);
    return b.count;
  }
  function bindLine(name) {
    var b = buffers[name];
    gl.bindBuffer(gl.ARRAY_BUFFER, b);
    gl.enableVertexAttribArray(0); gl.vertexAttribPointer(0, 3, gl.FLOAT, false, 16, 0);
    gl.enableVertexAttribArray(1); gl.vertexAttribPointer(1, 1, gl.FLOAT, false, 16, 12);
    gl.disableVertexAttribArray(2); gl.disableVertexAttribArray(3);
    return b.count;
  }

  // The light, from above (as the deboss), a touch from the left
  var L = (function () { var v = [0.12, -0.78, 0.62], l = Math.hypot(v[0], v[1], v[2]); return [v[0] / l, v[1] / l, v[2] / l]; })();

  function draw(st) {
    var cam = camAt(st);
    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.clearColor(0, 0, 0, 0);
    gl.clearDepth(1);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    // Light pouring through the doorway (behind everything; the wall and leaves cover it elsewhere)
    if (st.glow > 0.001) {
      gl.disable(gl.DEPTH_TEST);
      gl.enable(gl.BLEND);
      gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
      gl.useProgram(progGlow.p);
      var zc = cam[2];
      var cx = W / 2 + (DOOR_C[0] - cam[0]) * F / zc, cy = H / 2 + (DOOR_C[1] - cam[1]) * F / zc;
      gl.uniform2f(progGlow.u.uSize, W, H);
      gl.uniform2f(progGlow.u.uC, cx, cy);
      gl.uniform1f(progGlow.u.uR, 0.55 * H * F / Math.max(zc, 1));
      gl.uniform1f(progGlow.u.uGlow, 0.42 * st.glow);
      gl.bindBuffer(gl.ARRAY_BUFFER, buffers.glow);
      gl.enableVertexAttribArray(0); gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 8, 0);
      gl.disableVertexAttribArray(1); gl.disableVertexAttribArray(2); gl.disableVertexAttribArray(3);
      gl.drawArrays(gl.TRIANGLES, 0, 6);
    }

    // The wall and the leaves
    gl.disable(gl.BLEND);
    gl.enable(gl.DEPTH_TEST);
    gl.depthFunc(gl.LEQUAL);
    gl.useProgram(progMain.p);
    var U = progMain.u;
    gl.uniform3f(U.uCam, cam[0], cam[1], cam[2]);
    gl.uniform2f(U.uSize, W, H);
    gl.uniform1f(U.uF, F);
    gl.uniform3f(U.uBase, CHARCOAL[0], CHARCOAL[1], CHARCOAL[2]);
    gl.uniform3f(U.uL, L[0], L[1], L[2]);
    // the front faces at rest come out exactly #565656: ambient + diffuse · (n · L) = 1
    gl.uniform1f(U.uAmb, 0.5);
    gl.uniform1f(U.uDif, 0.5 / L[2]);
    gl.uniform3f(U.uBackPos, DOOR_C[0], DOOR_C[1], -24 * u);
    gl.uniform1f(U.uBack, st.back);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.uniform1i(U.uTex, 0);
    gl.uniform4f(U.uTexMap, TEXMAP[0], TEXMAP[1], TEXMAP[2], TEXMAP[3]);
    gl.uniform2f(U.uWheelC, MARK.cx, MARK.cy);
    gl.uniform1f(U.uWheelR, MARK.r);
    gl.uniform2f(U.uSpin, Math.cos(st.spin), Math.sin(st.spin));
    gl.uniform1f(U.uSheen, st.sheen);

    gl.uniformMatrix3fv(U.uRot, false, ID);
    gl.uniform3f(U.uPivot, 0, 0, 0);
    gl.uniform1f(U.uWall, 1);
    gl.drawArrays(gl.TRIANGLES, 0, bindMain("wall"));
    gl.uniform1f(U.uWall, 0);
    ["left", "right"].forEach(function (side) {
      var h = HINGE[side];
      gl.uniformMatrix3fv(U.uRot, false, rot(h.k, h.sign * st.phi));
      gl.uniform3f(U.uPivot, h.a[0], h.a[1], h.a[2]);
      gl.drawArrays(gl.TRIANGLES, 0, bindMain(side));
    });

    // The joint and the light in the cracks (on the wall plane, while the door is closed)
    if (st.joint > 0.001 || st.leak > 0.001) {
      gl.disable(gl.DEPTH_TEST);
      gl.enable(gl.BLEND);
      gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
      gl.useProgram(progLine.p);
      var LU = progLine.u;
      gl.uniform3f(LU.uCam, cam[0], cam[1], cam[2]);
      gl.uniform2f(LU.uSize, W, H);
      gl.uniform1f(LU.uF, F);
      if (st.joint > 0.001) {
        gl.uniform1f(LU.uSoft, 0);
        gl.uniform4f(LU.uColor, 0, 0, 0, 0.3 * st.joint);
        gl.drawArrays(gl.TRIANGLES, 0, bindLine("jointDark"));
        gl.uniform4f(LU.uColor, 1, 1, 1, 0.08 * st.joint);
        gl.drawArrays(gl.TRIANGLES, 0, bindLine("jointLight"));
      }
      if (st.leak > 0.001) {
        gl.uniform1f(LU.uSoft, 1);
        gl.uniform4f(LU.uColor, 1, 1, 1, 0.22 * st.leak);
        gl.drawArrays(gl.TRIANGLES, 0, bindLine("leakGlow"));
        gl.uniform1f(LU.uSoft, 0);
        gl.uniform4f(LU.uColor, 1, 1, 1, 0.92 * st.leak);
        gl.drawArrays(gl.TRIANGLES, 0, bindLine("leakCore"));
      }
    }
  }

  /* ---------- The sequence ---------- */
  var started = false, rose = false, t1 = 0;
  var inputs = ["wheel", "touchstart", "keydown", "pointerdown"];

  function ready() {
    return !hero || hero.classList.contains("hero--gl");
  }

  function freeGL() {
    try {
      var lose = gl && gl.getExtension("WEBGL_lose_context");
      if (lose) lose.loseContext();
    } catch (e) { /* nothing to free */ }
  }

  function done() {
    window.removeEventListener("resize", layout);
    root.classList.add("vault-open", "vault-done");
    restoreTint();
    remove();
    freeGL();
  }

  // Reduced motion, or no WebGL: the door fades
  function fade() {
    root.classList.add("vault-open");
    restoreTint();
    vault.classList.add("is-fading");
    window.setTimeout(function () {
      root.classList.add("vault-done");
      remove();
      freeGL();
    }, 420);
  }

  function tick(now) {
    var st = stateAt(now - t1);
    draw(st);
    if (!rose && st.t >= T.rise) {
      rose = true;
      root.classList.add("vault-open");
      restoreTint();
    }
    if (!st.end) requestAnimationFrame(tick);
    else done();
  }

  function go() {
    draw(stateAt(0)); // the closed door, as the CSS painted it; the canvas takes over
    vault.classList.add("is-drawn", "is-moving");
    window.addEventListener("resize", layout);
    t1 = performance.now();
    requestAnimationFrame(tick);
  }

  function begin() {
    if (started) return;
    started = true;
    inputs.forEach(function (type) { window.removeEventListener(type, begin, true); });
    if (!gl || !progMain) {
      fade();
      return;
    }
    if (texReady) go();
    else {
      onTexture = go;
      window.setTimeout(function () { if (onTexture) { onTexture = null; fade(); } }, 500);
    }
  }

  // Set up now, while the door waits
  if (gl) {
    try {
      progMain = program(VS, FS, ["aPos", "aNorm", "aMark", "aTex"]);
      progGlow = program(GVS, GFS, ["aXY"]);
      progLine = program(LVS, LFS, ["aPos", "aAcross"]);
      layout();
    } catch (e) {
      progMain = null;
    }
  }

  inputs.forEach(function (type) { window.addEventListener(type, begin, { capture: true, passive: true }); });

  (function wait() {
    if (started) return;
    var waited = performance.now() - t0;
    if ((waited >= MIN_HOLD && ready()) || waited >= MAX_WAIT) begin();
    else requestAnimationFrame(wait);
  })();
})();
