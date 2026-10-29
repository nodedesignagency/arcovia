/* ==========================================================================
   WorldMap — the compact world map: a concrete globe with the eight cities,
   arcs drawn out from Los Angeles. Built as one self-contained class so it
   can become a Framer code component later (props: cities, origin, view
   centre, texture).

   How it works
   - The globe is a WebGL sphere of the same concrete as the hero (the
     texture is wrapped around it in world space, so it turns with the
     globe), lit softly from the upper left, darker towards the rim, with a
     soft shadow on the white below it.
   - Land is raised stone with real terrain: a bevelled coastline (Natural
     Earth, assets/globe-land.png) and relief from NASA's GEBCO elevation
     (assets/globe-relief.jpg) light up like a carved relief globe, with
     faint engraved contour lines across the higher ground. The sea stays
     smooth and a shade darker. The coastline is resolved per pixel, so it
     stays crisp at any size.
   - Drag (or use the arrow keys) to turn the globe; it glides on when let
     go. Clicking a city in the list turns the globe to it. On touch,
     sideways drags turn it and up-and-down still scrolls the page.
   - Arcs, markers and their hit areas are SVG on top; labels are HTML, so
     they stay crisp. Each arc follows the great circle from Los Angeles,
     lifted off the surface in proportion to its length; whatever turns
     behind the globe is hidden.
   - The offices (Los Angeles, San Juan) are always labelled (on phones only
     when picked, as the city list right below names them). Any other city
     shows its label while its marker or its row in the city list
     ([data-city]) is hovered, focused or tapped; its arc darkens and the
     others fade.
   - The arcs draw out one after another the first time the map comes into
     view. With reduced motion they are simply there and turns are instant.
   - Without WebGL the globe falls back to flat grey dots on a pale disc.
   ========================================================================== */
(function () {
  "use strict";

  var NS = "http://www.w3.org/2000/svg";
  var RAD = Math.PI / 180;
  var LAT_RANGE = [-35, 65]; // how far the globe tilts north and south

  var VERT = "attribute vec2 aPos; void main(){ gl_Position = vec4(aPos, 0.0, 1.0); }";

  var FRAG = [
    "precision highp float;",
    "uniform vec2 uRes;",       // device px
    "uniform float uScale;",    // device px per css px
    "uniform vec2 uCenter;",    // globe centre, css px from the top left
    "uniform float uR;",        // radius, css px
    "uniform vec3 uE;",         // the view's right, up and toward-viewer axes in world space
    "uniform vec3 uN;",
    "uniform vec3 uC;",
    "uniform sampler2D uTex;",  // concrete, seamless
    "uniform sampler2D uLand;",   // coastline: land coverage, equirectangular
    "uniform sampler2D uRelief;", // height: a bevel along the coast plus land elevation
    "const vec2 TEXEL = vec2(1.0 / 2048.0, 1.0 / 1024.0);",
    "const float TEXEL_DEG = 360.0 / 2048.0;",
    "const float PI = 3.14159265;",
    "",
    "float tex(vec2 uv){ return texture2D(uTex, uv).r; }",
    "float height(vec2 uv){ return texture2D(uRelief, uv).r; }",
    "",
    "void main(){",
    "  vec2 p = vec2(gl_FragCoord.x, uRes.y - gl_FragCoord.y) / uScale;",
    "  vec2 d = (p - uCenter) / uR;",
    "  float r = length(d);",
    "  float px = 1.0 / (uR * uScale);",
    "",
    "  // Soft shadow on the white, down and to the right of the light",
    "  vec2 sd = (p - uCenter) / uR - vec2(0.09, 0.14);",
    "  float sh = 0.13 * (1.0 - smoothstep(0.72, 1.22, length(sd)));",
    "  float inside = 1.0 - smoothstep(1.0 - px, 1.0 + px, r);",
    "  if (inside <= 0.0) { gl_FragColor = vec4(0.0, 0.0, 0.0, sh); return; }",
    "",
    "  float x = d.x, y = -d.y;",
    "  float z = sqrt(max(0.0, 1.0 - x * x - y * y));",
    "  vec3 P = x * uE + y * uN + z * uC;",
    "  float lat = asin(clamp(P.z, -1.0, 1.0));",
    "  float lon = atan(P.y, P.x);",
    "  vec2 uv = vec2(lon / (2.0 * PI) + 0.5, 0.5 - lat / PI);",
    "  vec3 east = vec3(-sin(lon), cos(lon), 0.0);",
    "  vec3 north = vec3(-sin(lat) * cos(lon), -sin(lat) * sin(lon), cos(lat));",
    "",
    "  // Concrete, wrapped in world space (tri-planar) so it turns with the globe",
    "  vec3 w = pow(abs(P), vec3(4.0)); w /= (w.x + w.y + w.z);",
    "  float k = 0.9;",
    "  float t = tex(P.yz * k + 0.31) * w.x + tex(P.xz * k + 0.57) * w.y + tex(P.xy * k) * w.z;",
    "  float grit = tex(P.yz * 2.3 + 0.7) * w.x + tex(P.xz * 2.3 + 0.2) * w.y + tex(P.xy * 2.3 + 0.45) * w.z;",
    "",
    "  // Land: crisp coastline from the coverage, at any size",
    "  float pxDeg = degrees(px) / max(z, 0.2);",
    "  float edge = clamp(0.5 * pxDeg / TEXEL_DEG, 0.03, 0.5);",
    "  float land = smoothstep(0.5 - edge, 0.5 + edge, texture2D(uLand, uv).r);",
    "",
    "  // Relief: the surface normal follows the height map (coastal bevel and terrain)",
    "  float h = height(uv);",
    "  float hE = height(uv + vec2(TEXEL.x, 0.0)) - height(uv - vec2(TEXEL.x, 0.0));",
    "  float hN = height(uv - vec2(0.0, TEXEL.y)) - height(uv + vec2(0.0, TEXEL.y));",
    "  float dE = hE / (2.0 * TEXEL.x * 2.0 * PI * max(cos(lat), 0.05));",
    "  float dN = hN / (2.0 * TEXEL.y * PI);",
    "  vec3 Nw = normalize(P - 0.013 * (dE * east + dN * north));",
    "",
    "  // Contours: thin engraved lines across the higher ground",
    "  float levels = 9.0;",
    "  float q = (h - 0.32) / 0.68 * levels;",
    "  float gradPx = length(vec2(hE, hN)) * 0.5 / (TEXEL_DEG / pxDeg) * levels / 0.68;",
    "  float dist = abs(fract(q + 0.5) - 0.5) / max(gradPx, 1e-4);",
    "  // (from the second level up, so the lowlands stay calm)",
    "  float contour = (1.0 - smoothstep(0.35, 0.95, dist)) * smoothstep(0.6, 0.9, q) * land * smoothstep(0.25, 0.5, z);",
    "",
    "  // Light: soft, from the upper left and in front",
    "  vec3 L = normalize(vec3(-0.38, 0.48, 0.8));",
    "  vec3 Lw = L.x * uE + L.y * uN + L.z * uC;",
    "  float diff = max(dot(Nw, Lw), 0.0);",
    "  float flat_ = max(dot(P, Lw), 0.0);",
    "  float lit = (0.64 + 0.4 * diff) * mix(0.86, 1.0, z);",
    "  vec3 H = normalize(Lw + uC);",
    "  float spec = pow(max(dot(Nw, H), 0.0), 40.0) * 0.05;",
    "",
    "  // Sea: smooth and a shade darker; land: lighter stone with a finer grit",
    "  float sea = 0.8 * (1.0 + (t / 0.765 - 1.0) * 0.9);",
    "  float stone = 0.9 * (1.0 + (t / 0.765 - 1.0) * 0.6 + (grit / 0.765 - 1.0) * 0.5);",
    "  float albedo = mix(sea, stone, land) * (1.0 - 0.1 * contour);",
    "  float c = albedo * lit + spec;",
    "  gl_FragColor = vec4(vec3(c) * inside, inside + sh * (1.0 - inside));",
    "}"
  ].join("\n");

  function parseDots(str) {
    var out = [];
    (str || "").split(";").forEach(function (row) {
      var parts = row.split(":");
      var lat = parseInt(parts[0], 10) / 10;
      parts[1].split(",").forEach(function (lon) { out.push([lat, parseInt(lon, 10) / 10]); });
    });
    return out;
  }

  function toVec(lat, lon) {
    var p = lat * RAD, l = lon * RAD;
    return [Math.cos(p) * Math.cos(l), Math.cos(p) * Math.sin(l), Math.sin(p)];
  }

  function coords(lat, lon) {
    return Math.abs(lat).toFixed(2) + "°" + (lat >= 0 ? "N" : "S") + ", " + Math.abs(lon).toFixed(2) + "°" + (lon >= 0 ? "E" : "W");
  }

  function clampLat(v) { return Math.max(LAT_RANGE[0], Math.min(LAT_RANGE[1], v)); }
  function wrapLon(v) { return ((v + 540) % 360) - 180; }
  function ease(t) { return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; }

  function loadScript(src) {
    return new Promise(function (resolve, reject) {
      var s = document.createElement("script");
      s.src = src; s.onload = resolve; s.onerror = reject;
      document.head.appendChild(s);
    });
  }

  function WorldMap(root) {
    this.root = root;
    this.stage = root.querySelector(".map__stage");
    this.canvas = root.querySelector(".map__globe");
    this.svg = root.querySelector(".map__lines");
    this.labelLayer = root.querySelector(".map__labels");
    this.cities = Array.prototype.slice.call(root.querySelectorAll("[data-city]")).map(function (el) {
      return {
        id: el.getAttribute("data-city"),
        name: el.getAttribute("data-name"),
        lat: parseFloat(el.getAttribute("data-lat")),
        lon: parseFloat(el.getAttribute("data-lon")),
        office: el.hasAttribute("data-office"),
        side: el.getAttribute("data-side") || "right",
        row: el
      };
    });
    this.origin = this.cities.filter(function (c) { return c.id === root.getAttribute("data-origin"); })[0] || this.cities[0];
    this.home = { lat: parseFloat(root.getAttribute("data-center-lat")) || 20, lon: parseFloat(root.getAttribute("data-center-lon")) || -35 };
    this.center = { lat: this.home.lat, lon: this.home.lon };
    this.dots = parseDots(window.ARCOVIA_LAND_DOTS);
    this.drawn = false;
    this.settled = false;
    this.reduced = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    this.texture = root.getAttribute("data-texture") || "assets/concrete.jpg";
  }

  WorldMap.prototype.init = function () {
    var self = this;
    this.build();
    this.gl = this.initGL();
    this.layout();
    this.bindTurning();

    var width = window.innerWidth;
    window.addEventListener("resize", function () {
      if (window.innerWidth === width) return;
      width = window.innerWidth;
      self.layout();
    });

    if (this.reduced || !("IntersectionObserver" in window)) { this.reveal(true); return; }
    var io = new IntersectionObserver(function (entries) {
      if (!entries[0].isIntersecting) return;
      io.disconnect();
      self.reveal(false);
    }, { threshold: 0.25 });
    io.observe(this.stage);
  };

  // Markers, arcs, hit areas and labels, one set per city
  WorldMap.prototype.build = function () {
    var self = this;
    this.arcGroup = document.createElementNS(NS, "g");
    this.markGroup = document.createElementNS(NS, "g");
    this.svg.appendChild(this.arcGroup);
    this.svg.appendChild(this.markGroup);

    this.cities.forEach(function (c, i) {
      c.v = toVec(c.lat, c.lon);
      if (c !== self.origin) {
        c.arc = document.createElementNS(NS, "path");
        c.arc.setAttribute("class", "map__arc");
        c.arc.style.setProperty("--n", i);
        self.arcGroup.appendChild(c.arc);
      }
      c.mark = document.createElementNS(NS, "rect");
      c.mark.setAttribute("class", "map__mark" + (c === self.origin ? " map__mark--origin" : ""));
      c.mark.style.setProperty("--n", i);
      self.markGroup.appendChild(c.mark);

      c.hit = document.createElementNS(NS, "circle");
      c.hit.setAttribute("class", "map__hit");
      c.hit.setAttribute("r", 16);
      self.markGroup.appendChild(c.hit);

      c.label = document.createElement("div");
      c.label.className = "map__label" + (c.office ? " map__label--office" : "");
      c.label.style.setProperty("--n", c === self.origin ? -10 : i);
      c.label.setAttribute("aria-hidden", "true");
      c.label.innerHTML = '<span class="map__label-name"></span><span class="map__label-meta"></span>';
      c.label.firstChild.textContent = c.name;
      c.label.lastChild.textContent = (c.office ? "Office · " : "") + coords(c.lat, c.lon);
      self.labelLayer.appendChild(c.label);

      var on = function () { if (!self.drag) self.focus(c); };
      var off = function () { if (!self.drag) self.focus(null); };
      c.hit.addEventListener("pointerenter", on);
      c.hit.addEventListener("pointerleave", off);
      c.row.addEventListener("pointerenter", on);
      c.row.addEventListener("pointerleave", off);
      c.row.addEventListener("focus", on);
      c.row.addEventListener("blur", off);
      // Picking a city turns the globe to it
      c.row.addEventListener("click", function () { self.turnTo(c.lat, c.lon); });
      c.row.addEventListener("keydown", function (e) {
        if (e.key === "Enter" || e.key === " ") { e.preventDefault(); self.turnTo(c.lat, c.lon); }
      });
    });
  };

  /* ---------- WebGL globe ---------- */
  WorldMap.prototype.initGL = function () {
    var gl = null;
    try { gl = this.canvas.getContext("webgl", { premultipliedAlpha: true, antialias: false }); } catch (e) { gl = null; }
    if (!gl) return null;
    var self = this;
    var compile = function (type, src) {
      var s = gl.createShader(type);
      gl.shaderSource(s, src);
      gl.compileShader(s);
      if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) { console.warn(gl.getShaderInfoLog(s)); return null; }
      return s;
    };
    var v = compile(gl.VERTEX_SHADER, VERT), f = compile(gl.FRAGMENT_SHADER, FRAG);
    if (!v || !f) return null;
    var prog = gl.createProgram();
    gl.attachShader(prog, v); gl.attachShader(prog, f); gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) { console.warn(gl.getProgramInfoLog(prog)); return null; }
    gl.useProgram(prog);
    this.prog = prog;

    var buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
    var loc = gl.getAttribLocation(prog, "aPos");
    gl.enableVertexAttribArray(loc);
    gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);

    this.u = {};
    ["uRes", "uScale", "uCenter", "uR", "uE", "uN", "uC", "uTex", "uLand", "uRelief"].forEach(function (n) { self.u[n] = gl.getUniformLocation(prog, n); });
    gl.uniform1i(this.u.uTex, 0);
    gl.uniform1i(this.u.uLand, 1);
    gl.uniform1i(this.u.uRelief, 2);

    // A texture per unit: flat until its image arrives
    var blank = function (unit, v) {
      var t = gl.createTexture();
      gl.activeTexture(gl.TEXTURE0 + unit);
      gl.bindTexture(gl.TEXTURE_2D, t);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, new Uint8Array([v, v, v, 255]));
      return t;
    };
    var upload = function (unit, t, img, mipmaps) {
      gl.activeTexture(gl.TEXTURE0 + unit);
      gl.bindTexture(gl.TEXTURE_2D, t);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img);
      // The land and relief maps skip mipmaps: their seam at the date line would show as a line
      if (mipmaps) gl.generateMipmap(gl.TEXTURE_2D);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, mipmaps ? gl.LINEAR_MIPMAP_LINEAR : gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, mipmaps ? gl.REPEAT : gl.CLAMP_TO_EDGE);
      self.drawGlobe();
    };
    var image = function (url, done) {
      var img = new Image();
      img.onload = function () { done(img); };
      img.src = url;
    };
    var landTex = blank(1, 0), reliefTex = blank(2, 0);
    // From disk, browsers refuse to hand local images to WebGL: use the inlined copies
    var maps = location.protocol === "file:"
      ? loadScript("assets/globe-textures.js").then(function () { return window.ARCOVIA_GLOBE_TEXTURES; })
      : Promise.resolve({ land: "assets/globe-land.png", relief: "assets/globe-relief.jpg" });
    maps.then(function (m) {
      image(m.land, function (img) { upload(1, landTex, img, false); });
      image(m.relief, function (img) { upload(2, reliefTex, img, false); });
    }).catch(function () {});

    // Concrete: as the hero's (from disk, the inlined copy the hero uses)
    var concrete = blank(0, 195);
    var src = this.texture;
    var ready = window.ARCOVIA_CONCRETE_DATA ? Promise.resolve(window.ARCOVIA_CONCRETE_DATA)
      : location.protocol === "file:" ? loadScript(src.replace(/\.jpg$/, "-texture.js")).then(function () { return window.ARCOVIA_CONCRETE_DATA; })
      : Promise.resolve(src);
    ready.then(function (url) { image(url, function (img) { upload(0, concrete, img, true); }); }).catch(function () {});

    this.root.classList.add("map--gl");
    return gl;
  };

  // The view's axes in world space: right (east at the centre), up (north), toward the viewer
  WorldMap.prototype.basis = function () {
    var p0 = this.center.lat * RAD, l0 = this.center.lon * RAD;
    return {
      e: [-Math.sin(l0), Math.cos(l0), 0],
      n: [-Math.sin(p0) * Math.cos(l0), -Math.sin(p0) * Math.sin(l0), Math.cos(p0)],
      c: [Math.cos(p0) * Math.cos(l0), Math.cos(p0) * Math.sin(l0), Math.sin(p0)]
    };
  };

  WorldMap.prototype.drawGlobe = function () {
    if (!this.gl) { this.drawFlat(); return; }
    var gl = this.gl, b = this.basis();
    gl.viewport(0, 0, this.canvas.width, this.canvas.height);
    gl.uniform2f(this.u.uRes, this.canvas.width, this.canvas.height);
    gl.uniform1f(this.u.uScale, this.dpr);
    gl.uniform2f(this.u.uCenter, this.cx, this.cy);
    gl.uniform1f(this.u.uR, this.R);
    gl.uniform3fv(this.u.uE, b.e);
    gl.uniform3fv(this.u.uN, b.n);
    gl.uniform3fv(this.u.uC, b.c);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
  };

  // Fallback without WebGL: flat grey dots on a pale disc
  WorldMap.prototype.drawFlat = function () {
    var g = this.canvas.getContext("2d");
    g.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    g.clearRect(0, 0, this.w, this.h);
    g.fillStyle = "#eeeeee";
    g.beginPath(); g.arc(this.cx, this.cy, this.R, 0, Math.PI * 2); g.fill();
    var base = Math.max(1.05, this.R / 260);
    g.fillStyle = "#8f8f8f";
    for (var i = 0; i < this.dots.length; i++) {
      var p = this.project(toVec(this.dots[i][0], this.dots[i][1]));
      if (p[2] <= 0.02) continue;
      g.globalAlpha = 0.25 + 0.75 * Math.sqrt(p[2]);
      g.beginPath();
      g.arc(p[0], p[1], base * (0.55 + 0.45 * p[2]), 0, Math.PI * 2);
      g.fill();
    }
    g.globalAlpha = 1;
  };

  /* ---------- Turning ---------- */
  WorldMap.prototype.bindTurning = function () {
    var self = this, stage = this.stage;
    var deg = function () { return 180 / Math.PI / self.R; }; // degrees per px of drag at the centre

    stage.addEventListener("pointerdown", function (e) {
      if (e.button !== 0) return;
      self.stopMotion();
      self.drag = { x: e.clientX, y: e.clientY, lat: self.center.lat, lon: self.center.lon, t: performance.now(), vx: 0, vy: 0, moved: false };
      try { stage.setPointerCapture(e.pointerId); } catch (err) {}
    });
    stage.addEventListener("pointermove", function (e) {
      var d = self.drag;
      if (!d) return;
      var now = performance.now(), dt = Math.max(1, now - d.t);
      var dx = e.clientX - d.x, dy = e.clientY - d.y;
      if (!d.moved && Math.abs(dx) + Math.abs(dy) < 3) return;
      if (!d.moved) { d.moved = true; self.root.classList.add("is-turning"); self.focus(null); }
      var lon = self.center.lon, lat = self.center.lat;
      self.center.lon = wrapLon(d.lon - dx * deg());
      self.center.lat = clampLat(d.lat + dy * deg());
      // Velocity in degrees per ms, smoothed, for the glide after letting go
      d.vx = 0.7 * d.vx + 0.3 * (wrapLon(self.center.lon - lon) / dt);
      d.vy = 0.7 * d.vy + 0.3 * ((self.center.lat - lat) / dt);
      d.t = now;
      // Re-anchor, so a drag held against the tilt limit responds as soon as it turns back
      d.lat = self.center.lat - dy * deg();
      self.render();
    });
    var end = function () {
      var d = self.drag;
      if (!d) return;
      self.drag = null;
      self.root.classList.remove("is-turning");
      if (d.moved && !self.reduced) self.glide(d.vx, d.vy);
    };
    stage.addEventListener("pointerup", end);
    stage.addEventListener("pointercancel", end);

    stage.addEventListener("keydown", function (e) {
      var k = { ArrowLeft: [0, -20], ArrowRight: [0, 20], ArrowUp: [10, 0], ArrowDown: [-10, 0] }[e.key];
      if (!k) return;
      e.preventDefault();
      self.turnTo(self.center.lat + k[0], self.center.lon + k[1]);
    });
  };

  WorldMap.prototype.stopMotion = function () {
    if (this.motion) cancelAnimationFrame(this.motion);
    this.motion = null;
  };

  // Keep turning after a drag, slowing down
  WorldMap.prototype.glide = function (vx, vy) {
    var self = this, last = performance.now();
    if (Math.abs(vx) + Math.abs(vy) < 0.005) return;
    var step = function (now) {
      var dt = Math.min(40, now - last); last = now;
      self.center.lon = wrapLon(self.center.lon + vx * dt);
      self.center.lat = clampLat(self.center.lat + vy * dt);
      var f = Math.exp(-dt / 320);
      vx *= f; vy *= f;
      self.render();
      self.motion = Math.abs(vx) + Math.abs(vy) > 0.0008 ? requestAnimationFrame(step) : null;
    };
    this.motion = requestAnimationFrame(step);
  };

  // Turn smoothly to face a point
  WorldMap.prototype.turnTo = function (lat, lon) {
    var self = this;
    this.stopMotion();
    var from = { lat: this.center.lat, lon: this.center.lon };
    var to = { lat: clampLat(lat), lon: lon };
    var dl = wrapLon(to.lon - from.lon);
    if (this.reduced) { this.center = { lat: to.lat, lon: wrapLon(from.lon + dl) }; this.render(); return; }
    var dur = 700 + 4 * Math.min(180, Math.abs(dl) + Math.abs(to.lat - from.lat)), t0 = performance.now();
    var step = function (now) {
      var k = Math.min(1, (now - t0) / dur), e = ease(k);
      self.center.lat = from.lat + (to.lat - from.lat) * e;
      self.center.lon = wrapLon(from.lon + dl * e);
      self.render();
      self.motion = k < 1 ? requestAnimationFrame(step) : null;
    };
    this.motion = requestAnimationFrame(step);
  };

  /* ---------- Layout and drawing ---------- */
  // Project a unit vector (scaled by r) into the view: [x, y, z] in px, z > 0 faces us
  WorldMap.prototype.project = function (v, r) {
    var b = this.basis();
    var R = this.R * (r || 1);
    var x = v[0] * b.e[0] + v[1] * b.e[1] + v[2] * b.e[2];
    var y = v[0] * b.n[0] + v[1] * b.n[1] + v[2] * b.n[2];
    var z = v[0] * b.c[0] + v[1] * b.c[1] + v[2] * b.c[2];
    return [this.cx + R * x, this.cy - R * y, z];
  };

  // Points along the great circle from a to b, lifted off the surface in
  // proportion to its length: [x, y, z, visible]
  WorldMap.prototype.arcPoints = function (o, v) {
    var ang = Math.acos(Math.max(-1, Math.min(1, o[0] * v[0] + o[1] * v[1] + o[2] * v[2])));
    var lift = 0.26 * (ang / Math.PI);
    var pts = [], steps = 72;
    for (var k = 0; k <= steps; k++) {
      var t = k / steps;
      var a = Math.sin((1 - t) * ang) / Math.sin(ang), b = Math.sin(t * ang) / Math.sin(ang);
      var q = this.project([a * o[0] + b * v[0], a * o[1] + b * v[1], a * o[2] + b * v[2]], 1 + lift * Math.sin(Math.PI * t));
      q.push(q[2] > 0 || Math.hypot(q[0] - this.cx, q[1] - this.cy) > this.R);
      pts.push(q);
    }
    return pts;
  };

  // How high above the globe's centre the highest arc reaches in the home view, in px (negative is up)
  WorldMap.prototype.arcTop = function () {
    var self = this, min = -this.R;
    this.cities.forEach(function (c) {
      if (c === self.origin) return;
      self.arcPoints(self.origin.v, c.v).forEach(function (q) { if (q[3]) min = Math.min(min, q[1]); });
    });
    return min;
  };

  WorldMap.prototype.layout = function () {
    var w = this.stage.clientWidth;
    var phone = w < 600;
    // On phones the city list right below names the offices; their callouts show on tap like the rest
    this.root.classList.toggle("is-compact", phone);
    // Globe size; the room above it is what the highest arc needs in the home view
    // the city list cuts the globe below its lowest city
    this.R = Math.min(phone ? w * 0.47 : w * 0.3, 400);
    this.cx = w / 2;
    var saved = this.center;
    this.center = { lat: this.home.lat, lon: this.home.lon };
    this.cy = 0;
    // (and some more, as arcs rise higher when the globe is turned)
    var top = Math.max(this.R * 0.2, Math.ceil(-this.arcTop()) + 20);
    this.center = saved;
    this.cy = top;
    var h = Math.round(top + this.R * 0.88);
    this.stage.style.height = h + "px";
    this.w = w; this.h = h;

    this.dpr = Math.min(window.devicePixelRatio || 1, 2);
    this.canvas.width = Math.round(w * this.dpr);
    this.canvas.height = Math.round(h * this.dpr);
    this.canvas.style.width = w + "px";
    this.canvas.style.height = h + "px";
    this.svg.setAttribute("viewBox", "0 0 " + w + " " + h);
    this.svg.setAttribute("width", w);
    this.svg.setAttribute("height", h);
    this.size = this.R > 250 ? 8 : 7;
    this.cities.forEach(function (c) { c.lw = c.label.offsetWidth; c.lh = c.label.offsetHeight; });
    this.render();
  };

  WorldMap.prototype.render = function () {
    this.drawGlobe();
    this.drawLines();
  };

  WorldMap.prototype.drawLines = function () {
    var self = this;
    this.cities.forEach(function (c) {
      var p = self.project(c.v);
      c.x = p[0]; c.y = p[1];
      var behind = p[2] < 0.03;
      c.mark.classList.toggle("is-behind", behind);
      c.label.classList.toggle("is-behind", behind);
      c.hit.style.display = behind ? "none" : "";
      var s = c === self.origin ? self.size + 2 : self.size;
      c.mark.setAttribute("x", (p[0] - s / 2).toFixed(1));
      c.mark.setAttribute("y", (p[1] - s / 2).toFixed(1));
      c.mark.setAttribute("width", s);
      c.mark.setAttribute("height", s);
      c.hit.setAttribute("cx", p[0].toFixed(1));
      c.hit.setAttribute("cy", p[1].toFixed(1));
      self.placeLabel(c);
      if (!c.arc) return;

      // Great circle from the origin; parts behind the globe are left out
      var d = "", pen = false;
      self.arcPoints(self.origin.v, c.v).forEach(function (q) {
        if (q[3]) { d += (pen ? "L" : "M") + q[0].toFixed(1) + " " + q[1].toFixed(1); pen = true; }
        else pen = false;
      });
      c.arc.setAttribute("d", d);
      // The dash only serves the first draw
      if (self.settled) { c.arc.style.strokeDasharray = "none"; return; }
      var len = d ? c.arc.getTotalLength() : 0;
      c.arc.style.strokeDasharray = len + " " + len;
      c.arc.style.setProperty("--len", len);
    });
  };

  // Beside the marker, kept inside the stage
  WorldMap.prototype.placeLabel = function (c) {
    var gap = 12, w = c.lw, h = c.lh;
    var side = c.side;
    // No room on the preferred side: use the other one rather than cover the marker
    if (side === "left" && c.x - gap - w < 4) side = "right";
    else if (side === "right" && c.x + gap + w > this.w - 4) side = "left";
    var x = side === "left" ? c.x - gap - w : c.x + gap;
    var y = c.y - h / 2;
    if (side === "above") { x = c.x - w / 2; y = c.y - gap - h; }
    if (side === "below") { x = c.x - w / 2; y = c.y + gap; }
    x = Math.max(4, Math.min(this.w - w - 4, x));
    y = Math.max(4, Math.min(this.h - h - 4, y));
    c.label.style.transform = "translate(" + Math.round(x) + "px, " + Math.round(y) + "px)";
  };

  WorldMap.prototype.reveal = function (instant) {
    var self = this, root = this.root;
    this.drawn = true;
    root.classList.toggle("is-instant", instant);
    root.classList.add("is-drawn");
    // Once everything is in, hover responds at once (the staggered delays only serve the first draw)
    setTimeout(function () { root.classList.add("is-settled"); self.settled = true; self.drawLines(); }, instant ? 0 : 2600);
  };

  WorldMap.prototype.focus = function (city) {
    // Los Angeles is where every arc starts: focusing it keeps them all
    this.root.classList.toggle("has-focus", !!city && city !== this.origin);
    this.cities.forEach(function (c) {
      var on = c === city;
      c.row.classList.toggle("is-active", on);
      c.label.classList.toggle("is-active", on);
      c.mark.classList.toggle("is-active", on);
      if (c.arc) c.arc.classList.toggle("is-active", on);
    });
  };

  window.WorldMap = WorldMap;
  document.querySelectorAll("[data-world-map]").forEach(function (el) {
    if (window.ARCOVIA_LAND_DOTS) new WorldMap(el).init();
  });
})();
