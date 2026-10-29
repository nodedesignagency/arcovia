/* ==========================================================================
   Zoom-through: hero → statement
   As you scroll past the hero, its text lifts away while the carved ARCOVIA
   already starts to grow; a drill bites into the O, throwing out chips and
   dust, the bore deepens, punches through to light, and the view flies down
   the bore into the statement behind. (?fx=break shows the earlier version,
   where the concrete cracks and breaks away instead.)
   The statement rises into place while its text writes itself in, letter
   by letter, with a soft fading front (after a reference the user sent).

   Scroll progress p (0 → 1) over the pinned stage:
     0.00–0.12  hero text fades and lifts; the zoom starts at the same time
     0.03–0.30  the drill bores into the O: chips and dust fly, the bore deepens
     0.28–0.40  it punches through: light breaks through the bottom of the bore
     0.00–0.60  the camera moves in, down the bore and out through the back
     0.00–0.60  zoom: the O drifts to the centre and the view flies through
     0.30–0.58  the statement rises from below into place (depth)
     0.36–0.96  its text writes itself in, letter by letter
   The zoom and the break are drawn by the WebGL slab itself (concrete.js
   setView), so the carving stays crisp and nothing is scaled in CSS. Every
   frame is computed from p alone, so scrolling back up simply plays it in
   reverse. Without WebGL the hero just fades. With reduced motion (or no
   JS) nothing pins: hero and statement stack.
   ========================================================================== */
(function () {
  "use strict";

  var zoom = document.querySelector("[data-zoom]");
  if (!zoom) return;
  var hero = zoom.querySelector("[data-hero]");
  var statement = zoom.querySelector("[data-statement]");
  var mark = hero && hero.querySelector(".hero__wordmark");
  if (!hero || !statement || !mark) return;

  var fades = hero.querySelectorAll("[data-zoom-fade]");
  var inner = statement.querySelector(".statement__inner");
  var reveal = statement.querySelector("[data-reveal]");
  var reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
  var chars = splitChars(reveal);
  var FX = /[?&]fx=break\b/.test(location.search) ? "break" : "drill";
  var DRILL_K = 1.2;       // slab thickness, relative to the camera's starting distance

  /* ---------- Debris: chips and dust thrown out by the drill ----------
     Drawn on a 2D canvas over the slab. Every particle's state comes from the scroll
     position alone, so scrolling back up pulls the chips back in. */
  var debris = hero.querySelector(".hero__debris");
  var dctx = debris && debris.getContext ? debris.getContext("2d") : null;
  var particles = (function () {
    var seed = 7;
    function rnd() { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; }
    function chip(launch, burst) {
      var verts = [], n = 5 + Math.floor(rnd() * 4);
      for (var i = 0; i < n; i++) verts.push(0.35 + rnd() * 0.65);
      return {
        kind: "chip", launch: launch, life: 0.045 + rnd() * 0.04,
        ang: rnd() * Math.PI * 2, from: burst ? rnd() * 0.4 : 0.55 + rnd() * 0.45,
        speed: burst ? 1.4 + rnd() * 1.4 : 0.6 + rnd() * 1.0, fall: 0.4 + rnd() * 0.9,
        size: burst ? 2.5 + rnd() * 5 : 1.2 + rnd() * 3, grow: burst ? 3.5 : 1.6,
        rot: rnd() * 6.28, spin: (rnd() - 0.5) * 14, verts: verts,
        tone: Math.round(140 + rnd() * 70)
      };
    }
    var out = [], i;
    for (i = 0; i < 80; i++) out.push(chip(0.05 + rnd() * 0.24, false));      // while drilling
    for (i = 0; i < 34; i++) out.push(chip(0.28 + rnd() * 0.06, true));       // the punch-through
    for (i = 0; i < 110; i++) out.push({                                       // fine dust
      kind: "dust", launch: 0.04 + rnd() * 0.3, life: 0.08 + rnd() * 0.08,
      ang: rnd() * Math.PI * 2, from: 0.6 + rnd() * 0.5, speed: 0.3 + rnd() * 0.7,
      fall: -0.1 + rnd() * 0.3, size: 0.7 + rnd() * 1.3, tone: Math.round(200 + rnd() * 40)
    });
    for (i = 0; i < 10; i++) out.push({                                        // puffs of dust at the lip
      kind: "puff", launch: 0.04 + rnd() * 0.26, life: 0.1 + rnd() * 0.06,
      ang: rnd() * Math.PI * 2, from: 0.9 + rnd() * 0.3, speed: 0.2 + rnd() * 0.3, fall: -0.15, size: 40 + rnd() * 50
    });
    return out;
  })();

  function drawDebris(p, vw, vh, ox, oy, s, cam) {
    if (!dctx) return;
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    if (debris.width !== Math.round(vw * dpr) || debris.height !== Math.round(vh * dpr)) {
      debris.width = Math.round(vw * dpr);
      debris.height = Math.round(vh * dpr);
    }
    dctx.setTransform(1, 0, 0, 1, 0, 0);
    dctx.clearRect(0, 0, debris.width, debris.height);
    if (p < 0.04 || p > 0.52) return;
    dctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    var rim = 0.97 * Math.min(geo.rx, geo.ry) * Math.min(s, 40);   // the bore's radius on screen
    particles.forEach(function (q) {
      var age = (p - q.launch) / q.life;
      if (age <= 0 || age >= 1) return;
      var fade = Math.min(1, age / 0.08) * (1 - Math.max(0, (age - 0.6) / 0.4));
      var dist = rim * q.from + age * q.speed * (110 + rim * 0.6);
      var x = ox + Math.cos(q.ang) * dist;
      var y = oy + Math.sin(q.ang) * dist + age * age * q.fall * 160;
      if (q.kind === "puff") {
        var r = q.size * (0.6 + age * 1.6) * Math.sqrt(Math.min(s, 6));
        var g = dctx.createRadialGradient(x, y, 0, x, y, r);
        g.addColorStop(0, "rgba(236,236,234," + (0.38 * fade).toFixed(3) + ")");
        g.addColorStop(1, "rgba(236,236,234,0)");
        dctx.fillStyle = g;
        dctx.fillRect(x - r, y - r, r * 2, r * 2);
        return;
      }
      var size = q.size * (1 + q.grow * age) * Math.sqrt(Math.min(s, 6));
      dctx.globalAlpha = fade * (q.kind === "dust" ? 0.55 : 1);
      dctx.fillStyle = "rgb(" + q.tone + "," + q.tone + "," + (q.tone - 2) + ")";
      if (q.kind === "dust") {
        dctx.beginPath();
        dctx.arc(x, y, size, 0, Math.PI * 2);
        dctx.fill();
      } else {
        // A chip of concrete: a jagged little fragment, tumbling, its far side in shadow
        var rot = q.rot + age * q.spin;
        var path = function (ox2, oy2, k) {
          dctx.beginPath();
          q.verts.forEach(function (v, i) {
            var a = rot + (i / q.verts.length) * Math.PI * 2;
            var px = x + ox2 + Math.cos(a) * size * v * k, py = y + oy2 + Math.sin(a) * size * v * k;
            if (i === 0) dctx.moveTo(px, py); else dctx.lineTo(px, py);
          });
          dctx.closePath();
        };
        var base = dctx.globalAlpha;
        dctx.globalAlpha = base * 0.22;                     // a faint blur of motion behind it
        dctx.fillStyle = "rgb(120,120,118)";
        path(-Math.cos(q.ang) * size * 1.4, -Math.sin(q.ang) * size * 1.4, 0.8);
        dctx.fill();
        dctx.globalAlpha = base;
        dctx.fillStyle = "rgb(" + (q.tone - 55) + "," + (q.tone - 55) + "," + (q.tone - 57) + ")";
        path(size * 0.18, size * 0.22, 1);                   // shadow side
        dctx.fill();
        dctx.fillStyle = "rgb(" + q.tone + "," + q.tone + "," + (q.tone - 2) + ")";
        path(0, 0, 0.9);                                     // lit face
        dctx.fill();
      }
    });
    dctx.globalAlpha = 1;
  }

  var geo = null;          // the O's counter, in hero coordinates
  var lastP = -1;
  var lastSurface = null;
  var queued = false;

  function clamp(x, a, b) { return x < a ? a : x > b ? b : x; }
  function smooth(a, b, x) { var t = clamp((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); }
  function ramp(a, b, x) { return clamp((x - a) / (b - a), 0, 1); }

  /* Wrap every letter of the statement in a span (inside a span per word, so
     words never break), remembering which belong to the pale phrase */
  function splitChars(el) {
    var out = [];
    if (!el) return out;
    var walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
    var nodes = [];
    while (walker.nextNode()) nodes.push(walker.currentNode);
    nodes.forEach(function (node) {
      var pale = !!(node.parentNode.closest && node.parentNode.closest(".statement__pale"));
      var frag = document.createDocumentFragment();
      node.data.split(/(\s+)/).forEach(function (part) {
        if (!part) return;
        if (/^\s+$/.test(part)) { frag.appendChild(document.createTextNode(part)); return; }
        var word = document.createElement("span");
        word.className = "w";
        Array.prototype.forEach.call(part, function (ch) {
          var span = document.createElement("span");
          span.className = "c";
          span.textContent = ch;
          word.appendChild(span);
          out.push({ el: span, pale: pale, q: -1 });
        });
        frag.appendChild(word);
      });
      node.parentNode.replaceChild(frag, node);
    });
    el.classList.add("is-split");
    return out;
  }

  /* One letter's state: invisible → fading in → solid. The front is soft, a few
     words wide, so the text seems to write itself rather than switch on. */
  var FRONT = 28, STEPS = 24;   // letters in the fading front; opacity steps
  function paintChar(c, v) {
    var q = v <= 0 ? 0 : v >= 1 ? STEPS : Math.min(STEPS - 1, Math.max(1, Math.round(v * STEPS)));
    if (q === c.q) return;
    c.q = q;
    c.el.style.opacity = q === STEPS ? "1" : (Math.pow(q / STEPS, 1.4)).toFixed(3);
  }

  /* Find the counter (the inside) of the O, in hero coordinates.
     The glyph is drawn in a canvas to find its inner edges, then placed where
     the browser laid out the O in the wordmark. */
  function measure() {
    var text = mark.firstChild;
    var i = text && text.nodeType === 3 ? text.data.indexOf("O") : -1;
    if (i < 0) return null;

    var cs = getComputedStyle(mark);
    var size = parseFloat(cs.fontSize);
    var base = 200;
    var c = document.createElement("canvas");
    var ctx = c.getContext("2d");
    var font = cs.fontWeight + " " + base + "px " + cs.fontFamily;
    ctx.font = font;
    var m = ctx.measureText("O");
    var pad = 20;
    c.width = Math.ceil(m.actualBoundingBoxLeft + m.actualBoundingBoxRight) + pad * 2;
    c.height = Math.ceil(m.actualBoundingBoxAscent + m.actualBoundingBoxDescent) + pad * 2;
    ctx = c.getContext("2d");
    ctx.font = font;
    var x0 = pad + m.actualBoundingBoxLeft;
    var y0 = pad + m.actualBoundingBoxAscent;
    ctx.fillText("O", x0, y0);
    var data = ctx.getImageData(0, 0, c.width, c.height).data;
    var a = function (x, y) { return data[(y * c.width + x) * 4 + 3]; };

    var gx = Math.round(x0 + (m.actualBoundingBoxRight - m.actualBoundingBoxLeft) / 2);
    var gy = Math.round(y0 - (m.actualBoundingBoxAscent - m.actualBoundingBoxDescent) / 2);
    var x, y, inL = gx, inR = gx, inT = gy, inB = gy;
    for (x = 0; x < c.width && a(x, gy) < 128; x++);
    for (; x < c.width && a(x, gy) >= 128; x++);
    inL = x;
    for (x = c.width - 1; x > 0 && a(x, gy) < 128; x--);
    for (; x > 0 && a(x, gy) >= 128; x--);
    inR = x;
    for (y = 0; y < c.height && a(gx, y) < 128; y++);
    for (; y < c.height && a(gx, y) >= 128; y++);
    inT = y;
    for (y = c.height - 1; y > 0 && a(gx, y) < 128; y--);
    for (; y > 0 && a(gx, y) >= 128; y--);
    inB = y;

    var k = size / base;
    var range = document.createRange();
    range.setStart(text, i);
    range.setEnd(text, i + 1);
    var r = range.getBoundingClientRect();
    var h = hero.getBoundingClientRect();
    var asc = (m.fontBoundingBoxAscent || base * 0.968) * k;
    var desc = (m.fontBoundingBoxDescent || base * 0.251) * k;
    var baseline = r.top - h.top + (r.height - (asc + desc)) / 2 + asc;

    return {
      cx: r.left - h.left + ((inL + inR) / 2 - x0) * k,
      cy: baseline + ((inT + inB) / 2 - y0) * k,
      rx: (inR - inL) / 2 * k,
      ry: (inB - inT) / 2 * k
    };
  }

  function surface() {
    var sfc = window.arcoviaHero;
    return sfc && sfc.ready ? sfc : null;
  }

  function reset() {
    hero.classList.remove("hero--zooming");
    hero.style.opacity = "";
    hero.style.visibility = "";
    if (dctx) dctx.clearRect(0, 0, debris.width, debris.height);
    fades.forEach(function (el) { el.style.opacity = ""; el.style.transform = ""; });
    if (inner) { inner.style.transform = ""; inner.style.opacity = ""; }
    chars.forEach(function (c) { c.q = -1; paintChar(c, 1); });
    var sfc = surface();
    if (sfc) { sfc.setPaused(false); sfc.setView({ ox: 0, oy: 0, tx: 0, ty: 0, s: 1, burn: null, shatter: null, drill: null }); }
  }

  function update() {
    queued = false;
    if (!zoom.classList.contains("zoom--on")) return;
    var vw = document.documentElement.clientWidth;
    var vh = window.innerHeight;
    var rect = zoom.getBoundingClientRect();
    var travel = rect.height - vh;
    var p = travel > 0 ? clamp(-rect.top / travel, 0, 1) : 0;
    var sfc = surface();
    if (p === lastP && sfc === lastSurface) return;
    lastP = p;
    lastSurface = sfc;
    if (!geo) geo = measure();
    if (!geo) return;

    // 1. Hero text lifts away, while the wordmark already starts to grow (below)
    var f = smooth(0, 0.12, p);
    fades.forEach(function (el) {
      el.style.opacity = f ? String(1 - f) : "";
      el.style.transform = f ? "translateY(" + (-28 * f).toFixed(1) + "px)" : "";
    });

    var t = smooth(0, 0.42, p);   // the O drifts to the centre of the screen
    var tx = (vw / 2 - geo.cx) * t, ty = (vh / 2 - geo.cy) * t;
    var z = ramp(0, 0.6, p);
    var through = z >= 1;
    hero.classList.toggle("hero--zooming", p > 0);
    hero.style.visibility = through ? "hidden" : "";
    var view = { ox: geo.cx, oy: geo.cy, tx: tx, ty: ty, s: 1 };
    var debrisArgs = null;

    if (FX === "break") {
      // 2. The O cracks, light leaks through, and the concrete breaks away, centre first
      var BREAK_END = 5.2, HOLE_MIN = 1.9;
      var crack = Math.pow(ramp(0.02, 0.36, p), 0.85) * 3.2;
      var brk = Math.pow(ramp(0.12, 0.54, p), 1.15) * BREAK_END;
      var halfDiag = Math.sqrt(vw * vw + vh * vh) / 2;
      var scaleEnd = halfDiag * 1.08 / (HOLE_MIN * Math.min(geo.rx, geo.ry));
      view.s = Math.pow(scaleEnd, Math.pow(z, 1.6));
      view.shatter = crack > 0 ? { cx: geo.cx, cy: geo.cy, rx: geo.rx, ry: geo.ry, crack: crack, brk: brk, light: smooth(0.08, 0.2, p) } : null;
    } else {
      // 2. A drill bores into the O, punches through, and the camera flies down the bore.
      //    The camera moves at a steady pace in depth, so the zoom is true perspective:
      //    slow at first, then the rim rushes past and the light at the far end opens up.
      var cam = 1 - (1 + DRILL_K) * Math.pow(z, 1.6);
      var depth = DRILL_K * smooth(0.03, 0.3, p);
      view.s = cam > 0.02 ? 1 / cam : 50;
      view.drill = depth > 0 ? {
        cx: geo.cx, cy: geo.cy, rx: geo.rx, ry: geo.ry,
        cam: cam, depth: depth, light: smooth(0.28, 0.4, p),
        dust: smooth(0.03, 0.08, p) * (1 - smooth(0.36, 0.5, p)),
        k: DRILL_K, r: 0.97, spin: p * 60, thick: 2.2
      } : null;
      debrisArgs = [p, vw, vh, geo.cx + tx, geo.cy + ty, view.s, cam];
    }

    if (sfc) {
      sfc.setPaused(through);
      if (!through) sfc.setView(view);
      if (debrisArgs) { try { drawDebris.apply(null, debrisArgs); } catch (e) { /* debris is decoration only */ } }
    } else {
      // No WebGL: nothing to drill through, so the hero simply fades away
      hero.style.opacity = String(1 - smooth(0.1, 0.45, p));
    }

    // 4. The statement rises from below into place after half the zoom, for depth
    var rise = smooth(0.3, 0.58, p);
    if (inner) {
      inner.style.transform = rise < 1 ? "translate3d(0," + ((1 - rise) * 42).toFixed(2) + "vh,0) scale(" + (0.94 + 0.06 * rise).toFixed(4) + ")" : "";
      inner.style.opacity = rise < 1 ? (0.25 + 0.75 * rise).toFixed(3) : "";
    }

    // 5. The text writes itself in, letter by letter, as the room arrives
    var front = ramp(0.36, 0.96, p) * (chars.length + FRONT);
    chars.forEach(function (c, i) { paintChar(c, (front - i) / FRONT); });
  }

  function queue() {
    if (queued) return;
    queued = true;
    requestAnimationFrame(update);
  }

  function setMode() {
    var on = !reduced.matches;
    zoom.classList.toggle("zoom--on", on);
    geo = null;
    lastP = -1;
    if (on) queue(); else reset();
  }

  window.addEventListener("scroll", queue, { passive: true });
  window.addEventListener("resize", function () { geo = null; lastP = -1; queue(); });
  if (reduced.addEventListener) reduced.addEventListener("change", setMode);
  // The O is measured from the real font, so wait for it
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(function () { geo = null; lastP = -1; queue(); });
  setMode();
  // The slab loads its texture asynchronously; redraw once it's ready
  var wait = setInterval(function () { if (surface()) { clearInterval(wait); lastP = -1; queue(); } }, 100);
  setTimeout(function () { clearInterval(wait); }, 15000);
})();
