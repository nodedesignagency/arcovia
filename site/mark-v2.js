/* ==========================================================================
   The mark · V2 (About, block 5, second version): the A-mark drawn the way a
   designer builds a logo sheet, then pressed into the concrete.
   After the user's references: hollow anchor points on the corners (pen
   tool), a clear-space grid one circle-radius wide with × in the corner
   cells and one plain annotation, faint construction lines running on
   along the edges.
   The section is 400vh with a sticky stage; its progress p (0 → 1 while the
   stage is pinned) drives everything, so it runs back when scrolling up and
   fast scrolling can't leave anything half done. Light smoothing only.
     step 1  p 0.00-0.24  the frame rules itself in; the left leg's edges run
                          on across it; the outline is drawn anchor to anchor;
                          hairline and "Capital"
     step 2  p 0.24-0.48  the right leg the same way; "Creative"; Capital dims
     step 3  p 0.48-0.70  the axis, the circle through its four anchors; × in
                          the corner cells and "× = radius of the circle";
                          "One idea"; 1 and 2 dim
     step 4  p 0.70-1.00  the drawing and the notes fade; the mark is pressed
                          in (floor, walls and lip together, so it never reads
                          as a flat shape); the beam of sunlight from The mark
                          above comes up and sweeps across it, with dust in it;
                          the closing line comes in, centred under the mark
   The wall is a ConcreteSurface (concrete.js) on the stage, as in The mark:
   dark concrete, sun 0 while the logo is drawn (and paused: nothing moves),
   then the CTA's beam (22°, 18 s across and back) fitted to the mark. The
   mark is carved into the wall by concrete.js with wide walls, exactly as
   The mark's: flush (mark depth 0, invisible) while the logo is drawn, then
   pressed in with scroll, so the beam lights the floor of the cut and throws
   shadows inside it. Without WebGL: the CSS concrete under an overlay, the
   SVG deboss and a soft raking light instead.
   Below 1200 (no pinning) and without JS: the finished mark, notes in a column.
   Reduced motion: each part appears whole at its point, the light stands still.
   Built to become a Framer code component (props: scroll length, mark width,
   the note copy).
   ========================================================================== */
(function () {
  "use strict";

  var root = document.querySelector("[data-mark-v2]");
  if (!root) return;
  var svg = root.querySelector(".mark-v2__svg");
  if (!svg) return;
  var NS = "http://www.w3.org/2000/svg";

  var reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
  var desktop = window.matchMedia("(min-width: 1200px)");
  var SMOOTHING = 0.12;              // seconds: how long the drawing takes to catch up with the scroll
  var DIM = 0.45;                    // an earlier note, once the next step starts
  var OVERLAY = [0.74, 0.7];         // the dark overlay, before and after the mark is pressed in
  var ANCHOR = 3.5;                  // anchor point radius, px
  var POP = 2.5;                     // an anchor grows in over this much of the line (mark units)

  // Where everything happens, in p
  var T = {
    grid: [0.00, 0.08],
    consL: [0.06, 0.10],  left: [0.09, 0.17],   lead1: [0.16, 0.19],  note1: [0.17, 0.21],
    consR: [0.25, 0.29],  right: [0.28, 0.37],  lead2: [0.37, 0.40],  note2: [0.38, 0.42],
    axis: [0.48, 0.51],   circle: [0.50, 0.59],
    cross: [0.59, 0.63],  lead3: [0.60, 0.63],  note3: [0.61, 0.65],
    sketchOut: [0.71, 0.77], press: [0.73, 0.84], light: [0.80, 0.92], closing: [0.82, 0.90]
  };

  function clamp01(x) { return x < 0 ? 0 : x > 1 ? 1 : x; }
  function seg(p, a, b) { return clamp01((p - a) / (b - a)); }
  function smooth(t) { return t * t * (3 - 2 * t); }
  function at(p, r, a, b) {
    var t = seg(p, a !== undefined ? a : r[0], b !== undefined ? b : r[1]);
    if (reduced.matches) return t > 0.5 ? 1 : 0;   // no drawing: parts appear whole
    return smooth(t);
  }

  // ---------- Elements ----------
  function q(s) { return root.querySelector(s); }
  function qa(s) { return Array.prototype.slice.call(root.querySelectorAll(s)); }
  var overlay = q(".mark-v2__overlay");
  var sketch = q(".mark-v2__sketch");
  var floor = q(".mark-v2__floor"), walls = q(".mark-v2__walls"), lip = q(".mark-v2__lip");
  var light = q(".mark-v2__light");
  var closing = q("[data-closing]");
  var tag = q("[data-tag]");
  var cross = q("[data-cross]");
  var rules = qa("[data-rule]");
  var cons = { left: qa('[data-cons="left"]'), right: qa('[data-cons="right"]'), axis: qa('[data-cons="axis"]') };
  var leaders = [q('[data-leader="1"]'), q('[data-leader="2"]'), q('[data-leader="3"]')];
  var dots = [q('[data-dot="1"]'), q('[data-dot="2"]'), null];
  var notes = [q('[data-note="1"]'), q('[data-note="2"]'), q('[data-note="3"]')];
  var anchorLayer = q("[data-anchor-layer]");

  // The three outlines and their anchor points (made here from data-anchors)
  var draws = ["left", "right", "circle"].map(function (k) {
    var el = q('[data-draw="' + k + '"]');
    var pts = el.getAttribute("data-anchors").trim().split(/\s+/).map(function (s) {
      var xy = s.split(","); return { x: +xy[0], y: +xy[1] };
    });
    var anchors = pts.map(function (pt) {
      var c = document.createElementNS(NS, "circle");
      c.setAttribute("class", "mark-v2__anchor");
      c.setAttribute("cx", pt.x); c.setAttribute("cy", pt.y); c.setAttribute("r", "0");
      anchorLayer.appendChild(c);
      return { el: c, x: pt.x, y: pt.y, at: 0 };
    });
    return { key: k, el: el, anchors: anchors, len: 0 };
  });
  var byKey = { left: draws[0], right: draws[1], circle: draws[2] };

  // ---------- Measuring ----------
  var lens = new Map(), anchorR = 0.6;
  function lineLength(el) {
    var dx = el.getAttribute("x2") - el.getAttribute("x1"), dy = el.getAttribute("y2") - el.getAttribute("y1");
    return Math.sqrt(dx * dx + dy * dy);
  }
  function prepDash(el, L) {
    lens.set(el, L);
    el.style.strokeDasharray = L + " " + L;
  }
  function measure() {
    rules.concat(cons.left, cons.right, cons.axis, leaders).forEach(function (el) { prepDash(el, lineLength(el)); });
    draws.forEach(function (d) {
      d.len = d.el.getTotalLength();
      prepDash(d.el, d.len);
      // How far along the outline each anchor is: the first is the start; the others are found in order
      var N = 600, from = 0;
      d.anchors.forEach(function (a, i) {
        if (i === 0) { a.at = 0; return; }
        var best = Infinity, bestL = from;
        for (var s = 0; s <= N; s++) {
          var L = d.len * s / N;
          if (L < from) continue;
          var pt = d.el.getPointAtLength(L), dist = (pt.x - a.x) * (pt.x - a.x) + (pt.y - a.y) * (pt.y - a.y);
          if (dist < best) { best = dist; bestL = L; }
        }
        a.at = bestL; from = bestL;
      });
    });
    // Lines true to the pixel whatever the mark's size: 1px lines, 7px anchors
    var w = svg.getBoundingClientRect().width || 420;
    var k = 72 / w;
    root.style.setProperty("--mv2-px", (1 * k).toFixed(4));
    anchorR = ANCHOR * k;
  }

  // ---------- Writing only what changes ----------
  var cache = new WeakMap();
  function put(el, key, val, apply) {
    var c = cache.get(el);
    if (!c) { c = {}; cache.set(el, c); }
    if (c[key] === val) return;
    c[key] = val;
    apply();
  }
  function set(el, prop, val) { if (el) put(el, prop, val, function () { el.style[prop] = val; }); }
  function attr(el, name, val) { put(el, "@" + name, val, function () { el.setAttribute(name, val); }); }
  function cls(el, name, on) { put(el, "." + name, on, function () { el.classList.toggle(name, on); }); }
  function f(x) { return x.toFixed(3); }

  // A line or outline drawn from its start to t
  function drawn(el, t) {
    var L = lens.get(el);
    set(el, "strokeDashoffset", f(L * (1 - t)));
    set(el, "opacity", t > 0 ? "1" : "0");
  }
  // An outline with its anchors: each anchor grows in as the line reaches it;
  // the last one placed stays filled until the outline closes
  function drawOutline(d, t) {
    drawn(d.el, t);
    var reached = t * d.len, last = -1;
    d.anchors.forEach(function (a, i) {
      var g = t > 0 ? clamp01((reached - a.at) / POP + (i === 0 ? 1 : 0)) : 0;
      if (reduced.matches) g = g > 0 ? 1 : 0;
      if (g > 0) last = i;
      var e = 1 - Math.pow(1 - g, 3);
      attr(a.el, "r", f(anchorR * (0.35 + 0.65 * e)));
      set(a.el, "opacity", f(e));
    });
    d.anchors.forEach(function (a, i) { cls(a.el, "is-current", t > 0 && t < 1 && i === last); });
  }

  function noteState(el, inT, dimT, outT) {
    var o = inT * (1 - (1 - DIM) * dimT) * (1 - outT);
    set(el, "opacity", f(o));
    set(el, "transform", "translateY(" + f((1 - inT) * 8) + "px)");
  }

  // ---------- One frame of the drawing at progress p ----------
  function render(p) {
    // The frame rules itself in, line after line
    var gStep = (T.grid[1] - T.grid[0] - 0.04) / Math.max(1, rules.length - 1);
    rules.forEach(function (el, i) { drawn(el, at(p, null, T.grid[0] + i * gStep, T.grid[0] + i * gStep + 0.04)); });

    cons.left.forEach(function (el) { drawn(el, at(p, T.consL)); });
    cons.right.forEach(function (el) { drawn(el, at(p, T.consR)); });
    cons.axis.forEach(function (el) { drawn(el, at(p, T.axis)); });

    drawOutline(byKey.left, at(p, T.left));
    drawOutline(byKey.right, at(p, T.right));
    drawOutline(byKey.circle, at(p, T.circle));

    var x = at(p, T.cross), out = at(p, T.sketchOut);
    set(cross, "opacity", f(x));
    set(tag, "opacity", f(x * (1 - out)));

    [T.lead1, T.lead2, T.lead3].forEach(function (r, i) {
      var t = at(p, r);
      drawn(leaders[i], t);
      if (dots[i]) set(dots[i], "opacity", f(clamp01(t * 4)));
    });

    // Notes: in, dimmed once the next step starts, out with the drawing
    noteState(notes[0], at(p, T.note1), at(p, T.lead2), out);
    noteState(notes[1], at(p, T.note2), at(p, T.lead3), out);
    noteState(notes[2], at(p, T.note3), 0, out);
    set(sketch, "opacity", f(1 - out));

    // Step 4: pressed into the concrete (carved by concrete.js; without WebGL, the SVG floor, walls and lip together)
    var pr = at(p, T.press);
    set(floor, "opacity", f(0.28 * pr));
    set(walls, "opacity", f(pr));
    set(lip, "opacity", f(pr));
    set(overlay, "opacity", f(OVERLAY[0] + (OVERLAY[1] - OVERLAY[0]) * pr));
    var li = at(p, T.light);
    set(light, "opacity", f(li));
    setLight(li, pr);
    var c = at(p, T.closing);
    set(closing, "opacity", f(c));
    set(closing, "transform", "translateY(" + f((1 - c) * 8) + "px)");
  }

  // ---------- The wall and the beam of sunlight (concrete.js) ----------
  var stage = q(".mark-v2__stage");
  var SUN = 1.0, DUST = 0.4, TONE = [0.42, 0.45];   // the beam at full; the wall before and after the press
  var beam = { angle: 22, width: 80, soft: 26, from: -300, to: 300, fadeFrom: -900, fadeTo: -400 };
  var surface = null, beamOn = false, lightNow = [-1, -1];
  if (window.ConcreteSurface && q(".mark-v2__canvas")) {
    surface = new window.ConcreteSurface(stage, {
      canvas: ".mark-v2__canvas",
      tone: TONE[0],            // a dark wall, as The mark
      bevel: 2.2,               // wide walls: a deep cut (The mark: 2.4 on a larger mark)
      vignette: 0.42,
      sun: 0,                   // no light until the logo is drawn
      cursor: 0,
      period: 18,               // across and back, in seconds (the CTA's and The mark's)
      staticBand: 0.5,          // with reduced motion: across the middle of the mark
      beam: beam,
      dust: 0,                  // no shade box: the beam fades out before the feet, clear of the closing line
      smooth: true
    });
    surface.markDepth = 0;      // flush, so invisible, until the last step presses it in
    surface.setPaused(true);
    surface.init().then(function (ok) {
      if (!ok) { surface = null; return; }
      fitLight();
      root.classList.add("is-gl");
      var l = lightNow; lightNow = [-1, -1];
      setLight(Math.max(0, l[0]), Math.max(0, l[1]));
    });
  }

  // The beam measured on the mark, as in The mark: as wide as the CTA's beam on its
  // lockup, sweeping from across the circle down to the lower legs, full from the left leg on
  function fitLight() {
    if (!surface) return;
    var hr = stage.getBoundingClientRect(), r = svg.getBoundingClientRect();
    if (!r.width) return;
    var mw = r.width, mh = r.height;
    var cx = r.left - hr.left + mw / 2 - hr.width / 2;   // the mark's centre, from the slab's centre
    var cy = r.top - hr.top + mh / 2 - hr.height / 2;
    var a = beam.angle * Math.PI / 180;
    var nx = Math.sin(a), ny = Math.cos(a);              // across the beam (y down)
    var dx = Math.cos(a), dy = -Math.sin(a);             // along it, towards the upper right
    var across = cx * nx + cy * ny;
    var half = (mw / 2) * nx + (mh / 2) * ny;
    beam.width = mh * 0.17;
    beam.soft = mh * 0.055;
    beam.from = across - half * 0.66;
    beam.to = across + half * 0.42;                      // ...down to the lower legs, clear of the closing line
    var along = cx * dx + cy * dy;
    beam.fadeFrom = along - mw * 0.72;
    beam.fadeTo = along - mw * 0.18;
    surface.needsFrame = true;
    surface.kick();
  }

  // li: how far the light has come up (0-1); pr: how far the mark is pressed in
  function setLight(li, pr) {
    if (li === lightNow[0] && pr === lightNow[1]) return;
    lightNow = [li, pr];
    if (!surface || !surface.ready) return;
    var o = surface.opts, on = li > 0;
    // Each time the light comes in, the beam starts a quarter of the way across, moving down the mark
    if (on && !beamOn) surface.t0 = performance.now() - o.period * 1000 / 6;
    beamOn = on;
    o.sun = SUN * li;
    o.dust = DUST * li;
    o.tone = TONE[0] + (TONE[1] - TONE[0]) * pr;
    surface.markDepth = pr;     // the carved mark presses in
    surface.needsFrame = true;
    surface.setPaused(!on);    // nothing moves while the logo is drawn
    surface.kick();
  }

  // ---------- Scroll → progress, lightly smoothed ----------
  var target = 0, shown = -1, last = 0, raf = 0, live = false;

  function progress() {
    var r = root.getBoundingClientRect();
    var run = root.offsetHeight - window.innerHeight;
    return run > 0 ? clamp01(-r.top / run) : 1;
  }
  function frame(now) {
    raf = 0;
    var dt = last ? Math.min(0.1, (now - last) / 1000) : 1 / 60;
    last = now;
    if (shown < 0 || reduced.matches) shown = target;
    else shown += (target - shown) * (1 - Math.exp(-dt / SMOOTHING));
    if (Math.abs(target - shown) < 0.0004) shown = target;
    render(shown);
    if (shown !== target) raf = requestAnimationFrame(frame);
    else last = 0;
  }
  function queue() {
    if (!live) return;
    target = progress();
    if (!raf) raf = requestAnimationFrame(frame);
  }

  // Below 1200: no pinning; the finished mark, the notes and the closing line simply there
  function still() {
    render(1);
    notes.concat([closing, tag]).forEach(function (el) { el.style.opacity = ""; el.style.transform = ""; cache.delete(el); });
  }
  function setMode() {
    var on = desktop.matches;
    if (on === live) return;
    live = on;
    root.classList.toggle("is-live", on);
    measure();
    requestAnimationFrame(fitLight);
    if (on) { shown = -1; queue(); }
    else { if (raf) { cancelAnimationFrame(raf); raf = 0; } still(); }
  }

  window.addEventListener("scroll", queue, { passive: true });
  window.addEventListener("resize", function () {
    measure();
    requestAnimationFrame(fitLight);
    if (live) { shown = -1; queue(); }
  });
  if (desktop.addEventListener) desktop.addEventListener("change", setMode);
  if (reduced.addEventListener) reduced.addEventListener("change", function () { shown = -1; queue(); });

  measure();
  setMode();
  if (!live) still();
  window.arcoviaMarkV2 = { render: render, T: T, surface: surface };
})();
