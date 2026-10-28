/* ==========================================================================
   ConcreteSurface — WebGL concrete with carved marks, drifting sunlight
   and a soft cursor light. Built as one self-contained class so it can be
   wrapped as a Framer code component later (props: speed, intensity,
   cursor strength, carve text).

   How it works
   - The concrete colour comes from a seamless texture plus slow procedural
     mottling, so repeats never show.
   - Anything marked data-carve inside the host is drawn into an offscreen
     "height map" at its real on-screen position and at full device
     resolution: "text" (the element's own text, in its own font), "mark"
     (the A-mark, read from the SVG sprite), "seam" (a formwork joint),
     "hole" (a formwork tie hole) and "panel" (a charcoal inlay). The
     shader turns that height map into surface normals, so the light
     catches the walls of every carving.
   - Every carving always shows a crisp dark rim and light rim (soft sky
     light from the upper left). A diagonal band of sunlight drifts across
     over ~34 s and deepens the relief where it passes; the cursor adds a
     dim point light.
   - Pauses off-screen and in hidden tabs. With reduced motion it renders
     one still frame. Without WebGL the CSS fallback stays.
   ========================================================================== */
(function () {
  "use strict";

  var VERT = [
    "attribute vec2 aPos;",
    "void main(){ gl_Position = vec4(aPos, 0.0, 1.0); }"
  ].join("\n");

  var FRAG = [
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
    "",
    "float hash(vec2 p){ p = fract(p * vec2(123.34, 456.21)); p += dot(p, p + 45.32); return fract(p.x * p.y); }",
    "float noise(vec2 p){ vec2 i = floor(p), f = fract(p); vec2 u = f*f*(3.0-2.0*f);",
    "  return mix(mix(hash(i), hash(i+vec2(1.0,0.0)), u.x), mix(hash(i+vec2(0.0,1.0)), hash(i+vec2(1.0,1.0)), u.x), u.y); }",
    "float fbm(vec2 p){ float v = 0.0, a = 0.5; for(int i = 0; i < 4; i++){ v += a*noise(p); p = p*2.03 + 17.1; a *= 0.5; } return v; }",
    // Sharpen the softened height map so carved walls stay about 1.5 css px wide: crisp, never blurry
    "float H(vec2 uv){ return smoothstep(0.2, 0.8, texture2D(uHeight, uv).r); }",
    "",
    "void main(){",
    "  vec2 res = uRes / uScale;",
    "  vec2 p = vec2(gl_FragCoord.x, uRes.y - gl_FragCoord.y) / uScale;", // css px, y down
    "  vec2 uv = p / res;",
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
    "  vec3 lc = vec3(uMouse - p, 150.0);",
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
    "  gl_FragColor = vec4(vec3(c), 1.0);",
    "}"
  ].join("\n");

  function ConcreteSurface(host, opts) {
    opts = opts || {};
    this.host = host;
    this.canvas = host.querySelector(opts.canvas || "canvas");
    this.opts = {
      texture: opts.texture || "assets/concrete.jpg",
      textureSize: opts.textureSize || 1024,   // css px per tile
      period: opts.period || 34,               // seconds for the sun to drift across and back
      sun: opts.sun != null ? opts.sun : 0.2,
      cursor: opts.cursor != null ? opts.cursor : 0.22,
      staticBand: opts.staticBand != null ? opts.staticBand : 0.6
    };
    this.mouse = { x: -9999, y: -9999, tx: -9999, ty: -9999, amt: 0, tamt: 0 };
    this.visible = true;
    this.running = false;
    this.t0 = performance.now();
    this.last = 0;
    this.reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
  }

  ConcreteSurface.prototype.init = function () {
    var gl = this.canvas.getContext("webgl", { antialias: false, alpha: false, depth: false, stencil: false, powerPreference: "low-power", preserveDrawingBuffer: false });
    if (!gl) return Promise.resolve(false);
    this.gl = gl;

    var prog = this.program(VERT, FRAG);
    if (!prog) return Promise.resolve(false);
    this.prog = prog;
    gl.useProgram(prog);

    var buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    var loc = gl.getAttribLocation(prog, "aPos");
    gl.enableVertexAttribArray(loc);
    gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);

    this.u = {};
    ["uRes", "uScale", "uTime", "uBand", "uMouse", "uMouseAmt", "uSun", "uCursor", "uTex", "uTexSize", "uHeight", "uHTexel"].forEach(function (n) {
      this.u[n] = gl.getUniformLocation(prog, n);
    }, this);

    this.heightCanvas = document.createElement("canvas");
    this.heightTex = gl.createTexture();
    gl.activeTexture(gl.TEXTURE1);
    gl.bindTexture(gl.TEXTURE_2D, this.heightTex);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

    var self = this;
    var fonts = document.fonts && document.fonts.ready ? document.fonts.ready : Promise.resolve();
    return Promise.all([this.loadTexture(), fonts]).then(function () {
      self.layout();
      self.bind();
      self.host.classList.add("hero--gl");
      self.kick();
      return true;
    }).catch(function () { return false; });
  };

  ConcreteSurface.prototype.program = function (vs, fs) {
    var gl = this.gl;
    function compile(type, src) {
      var s = gl.createShader(type);
      gl.shaderSource(s, src);
      gl.compileShader(s);
      if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) { console.warn(gl.getShaderInfoLog(s)); return null; }
      return s;
    }
    var v = compile(gl.VERTEX_SHADER, vs), f = compile(gl.FRAGMENT_SHADER, fs);
    if (!v || !f) return null;
    var p = gl.createProgram();
    gl.attachShader(p, v);
    gl.attachShader(p, f);
    gl.linkProgram(p);
    if (!gl.getProgramParameter(p, gl.LINK_STATUS)) { console.warn(gl.getProgramInfoLog(p)); return null; }
    return p;
  };

  ConcreteSurface.prototype.loadTexture = function () {
    var gl = this.gl, src = this.opts.texture;
    // From disk, browsers refuse to hand local images to WebGL; use the inlined copy instead
    var needInline = location.protocol === "file:";
    var ready = needInline ? loadScript(src.replace(/\.jpg$/, "-texture.js")).then(function () { return window.ARCOVIA_CONCRETE_DATA; }) : Promise.resolve(src);
    return ready.then(function (url) {
      return new Promise(function (resolve, reject) {
        var img = new Image();
        img.onload = function () {
          var tex = gl.createTexture();
          gl.activeTexture(gl.TEXTURE0);
          gl.bindTexture(gl.TEXTURE_2D, tex);
          gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img);
          gl.generateMipmap(gl.TEXTURE_2D);
          gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
          gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
          gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
          gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT);
          resolve();
        };
        img.onerror = reject;
        img.src = url;
      });
    });
  };

  /* Size the canvas and redraw the height map from the live layout */
  ConcreteSurface.prototype.layout = function () {
    var gl = this.gl, rect = this.host.getBoundingClientRect();
    var w = Math.max(1, rect.width), h = Math.max(1, rect.height);
    var coarse = window.matchMedia("(pointer: coarse)").matches;
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    var maxPx = coarse ? 3.6e6 : 7.2e6;
    if (w * h * dpr * dpr > maxPx) dpr = Math.sqrt(maxPx / (w * h));
    this.dpr = dpr;
    this.w = w;
    this.h = h;
    this.canvas.width = Math.round(w * dpr);
    this.canvas.height = Math.round(h * dpr);
    gl.viewport(0, 0, this.canvas.width, this.canvas.height);

    // Height map at full device resolution, so carved edges are as sharp as the type around them
    this.drawHeight(w, h, dpr);
    this.needsFrame = true;
  };

  ConcreteSurface.prototype.drawHeight = function (w, h, s) {
    var gl = this.gl, hc = this.heightCanvas;
    hc.width = Math.round(w * s);
    hc.height = Math.round(h * s);

    var sharp = document.createElement("canvas");
    sharp.width = hc.width;
    sharp.height = hc.height;
    var ctx = sharp.getContext("2d");
    ctx.scale(s, s);
    ctx.fillStyle = "rgb(255,0,0)";
    ctx.fillRect(0, 0, w, h);

    var origin = this.host.getBoundingClientRect();
    var panels = [];
    var els = this.host.querySelectorAll("[data-carve]");
    var order = { panel: 0, seam: 1, hole: 2, mark: 3, text: 4 };
    Array.prototype.slice.call(els).sort(function (a, b) {
      return order[a.getAttribute("data-carve")] - order[b.getAttribute("data-carve")];
    }).forEach(function (el) {
      var r = el.getBoundingClientRect();
      var x = r.left - origin.left, y = r.top - origin.top;
      var kind = el.getAttribute("data-carve");
      if (kind === "panel") {
        // Charcoal inlay, flush with the surface, with a fine groove around it
        panels.push([x, y, r.width, r.height]);
        ctx.strokeStyle = "rgb(120,0,0)";
        ctx.lineWidth = 1.5;
        ctx.strokeRect(x - 0.75, y - 0.75, r.width + 1.5, r.height + 1.5);
      } else if (kind === "seam") {
        // Formwork joint: a fine, shallow groove along the element's long side
        ctx.fillStyle = "rgb(70,0,0)";
        if (r.width >= r.height) ctx.fillRect(x, y + r.height / 2 - 0.6, r.width, 1.2);
        else ctx.fillRect(x + r.width / 2 - 0.6, y, 1.2, r.height);
      } else if (kind === "hole") {
        // Formwork tie hole: a small round recess, the same circle as the top of the A
        ctx.fillStyle = "rgb(0,0,0)";
        ctx.beginPath();
        ctx.arc(x + r.width / 2, y + r.height / 2, r.width / 2, 0, Math.PI * 2);
        ctx.fill();
      } else if (kind === "mark") {
        var paths = markPaths(el);
        if (!paths.length) return;
        var vb = (el.getAttribute("viewBox") || "0 0 554 539").split(/[\s,]+/).map(Number);
        var k = Math.min(r.width / vb[2], r.height / vb[3]);
        ctx.save();
        ctx.translate(x + (r.width - vb[2] * k) / 2, y + (r.height - vb[3] * k) / 2);
        ctx.scale(k, k);
        ctx.fillStyle = "rgb(0,0,0)";
        paths.forEach(function (p) { ctx.fill(p); });
        ctx.restore();
      } else if (kind === "text") {
        drawText(ctx, el, origin);
      }
    });

    // Soften every edge into a sloped wall (the bevel)
    var hctx = hc.getContext("2d");
    var blur = 0.9 * s;
    if (typeof hctx.filter === "string") {
      hctx.filter = "blur(" + blur.toFixed(2) + "px)";
      hctx.drawImage(sharp, 0, 0);
      hctx.filter = "none";
    } else {
      hctx.globalAlpha = 1 / 9;
      for (var dx = -1; dx <= 1; dx++) for (var dy = -1; dy <= 1; dy++) hctx.drawImage(sharp, dx * blur, dy * blur);
      hctx.globalAlpha = 1;
    }

    // Inlay mask goes in the green channel unblurred, so panel edges stay crisp
    hctx.save();
    hctx.globalCompositeOperation = "lighter";
    hctx.fillStyle = "rgb(0,255,0)";
    hctx.scale(s, s);
    panels.forEach(function (r) { hctx.fillRect(r[0], r[1], r[2], r[3]); });
    hctx.restore();

    gl.activeTexture(gl.TEXTURE1);
    gl.bindTexture(gl.TEXTURE_2D, this.heightTex);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, hc);
    this.hTexel = [1 / hc.width, 1 / hc.height];
  };

  ConcreteSurface.prototype.bind = function () {
    var self = this;

    var ro = new ResizeObserver(function () { self.queueLayout(); });
    ro.observe(this.host);
    this.host.querySelectorAll("[data-carve]").forEach(function (el) { ro.observe(el); });

    new IntersectionObserver(function (entries) {
      self.visible = entries[0].isIntersecting;
      self.kick();
    }, { rootMargin: "100px" }).observe(this.host);

    document.addEventListener("visibilitychange", function () { self.kick(); });
    if (this.reduced.addEventListener) this.reduced.addEventListener("change", function () { self.kick(); });

    this.host.addEventListener("pointermove", function (e) {
      if (e.pointerType !== "mouse") return;
      var r = self.host.getBoundingClientRect();
      self.mouse.tx = e.clientX - r.left;
      self.mouse.ty = e.clientY - r.top;
      if (self.mouse.amt < 0.01) { self.mouse.x = self.mouse.tx; self.mouse.y = self.mouse.ty; }
      self.mouse.tamt = 1;
    });
    this.host.addEventListener("pointerleave", function () { self.mouse.tamt = 0; });
  };

  ConcreteSurface.prototype.queueLayout = function () {
    var self = this;
    if (this.layoutQueued) return;
    this.layoutQueued = true;
    requestAnimationFrame(function () {
      self.layoutQueued = false;
      self.layout();
      self.kick();
    });
  };

  /* Start, stop or draw a single still frame depending on state */
  ConcreteSurface.prototype.kick = function () {
    var animate = this.visible && !document.hidden && !this.reduced.matches;
    if (animate && !this.running) {
      this.running = true;
      this.loop = this.loop || this.frame.bind(this);
      requestAnimationFrame(this.loop);
    } else if (!animate && this.needsFrame && this.visible) {
      this.render(this.reduced.matches ? 0 : (performance.now() - this.t0) / 1000, true);
    }
  };

  ConcreteSurface.prototype.frame = function (now) {
    if (!this.visible || document.hidden || this.reduced.matches) { this.running = false; return; }
    var dt = Math.min(0.1, (now - (this.last || now)) / 1000);
    var m = this.mouse;
    var ease = 1 - Math.exp(-dt * 7);
    m.x += (m.tx - m.x) * ease;
    m.y += (m.ty - m.y) * ease;
    m.amt += (m.tamt - m.amt) * (1 - Math.exp(-dt * 3));

    // The sun moves slowly; without the cursor, 30 fps is plenty
    var idle = m.amt < 0.01 && m.tamt === 0;
    if (!idle || now - this.last > 32 || this.needsFrame) {
      this.render((now - this.t0) / 1000, false);
      this.last = now;
    }
    requestAnimationFrame(this.loop);
  };

  ConcreteSurface.prototype.render = function (t, still) {
    var gl = this.gl, u = this.u, o = this.opts;
    var band = still && this.reduced.matches ? o.staticBand : 0.55 + 0.45 * Math.sin((t / o.period) * Math.PI * 2 + 0.2);
    gl.uniform2f(u.uRes, this.canvas.width, this.canvas.height);
    gl.uniform1f(u.uScale, this.dpr);
    gl.uniform1f(u.uTime, t);
    gl.uniform1f(u.uBand, band);
    gl.uniform2f(u.uMouse, this.mouse.x, this.mouse.y);
    gl.uniform1f(u.uMouseAmt, this.mouse.amt);
    gl.uniform1f(u.uSun, o.sun);
    gl.uniform1f(u.uCursor, o.cursor);
    gl.uniform1i(u.uTex, 0);
    gl.uniform1f(u.uTexSize, o.textureSize);
    gl.uniform1i(u.uHeight, 1);
    gl.uniform2f(u.uHTexel, this.hTexel[0], this.hTexel[1]);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
    this.needsFrame = false;
  };

  /* ---------- helpers ---------- */

  // Read the A-mark's path data from the SVG (inline paths or a <use> of the sprite)
  function markPaths(svg) {
    var src = svg;
    var use = svg.querySelector("use");
    if (use) {
      var id = (use.getAttribute("href") || use.getAttribute("xlink:href") || "").replace("#", "");
      src = document.getElementById(id) || svg;
    }
    return Array.prototype.map.call(src.querySelectorAll("path"), function (p) { return new Path2D(p.getAttribute("d")); });
  }

  // Draw an element's text exactly where the browser laid it out, glyph by glyph
  function drawText(ctx, el, origin) {
    var node = el.firstChild;
    if (!node || node.nodeType !== 3) return;
    var cs = getComputedStyle(el);
    var size = parseFloat(cs.fontSize);
    ctx.save();
    ctx.font = cs.fontWeight + " " + size + "px " + cs.fontFamily;
    ctx.fillStyle = "rgb(0,0,0)";
    ctx.textBaseline = "alphabetic";
    var m = ctx.measureText(node.data);
    var asc = m.fontBoundingBoxAscent || size * 0.968;
    var desc = m.fontBoundingBoxDescent || size * 0.251;
    var range = document.createRange();
    for (var i = 0; i < node.data.length; i++) {
      range.setStart(node, i);
      range.setEnd(node, i + 1);
      var r = range.getBoundingClientRect();
      // A glyph's client rect is the font's content area, so the baseline sits one ascent down
      var baseline = r.top - origin.top + (r.height - (asc + desc)) / 2 + asc;
      ctx.fillText(node.data[i], r.left - origin.left, baseline);
    }
    ctx.restore();
  }

  function loadScript(src) {
    return new Promise(function (resolve, reject) {
      var s = document.createElement("script");
      s.src = src;
      s.onload = resolve;
      s.onerror = reject;
      document.head.appendChild(s);
    });
  }

  window.ConcreteSurface = ConcreteSurface;
})();
