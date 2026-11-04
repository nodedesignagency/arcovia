/* ==========================================================================
   The mark · V2 (About, block 5, second version): the A-mark is sketched
   part by part as you scroll, then pressed into the concrete.
   The section is 400vh with a sticky stage; its progress p (0 → 1 while the
   stage is pinned) drives everything, so it runs back when scrolling up and
   fast scrolling can't leave anything half done. Light smoothing only.
     step 1  p 0.00-0.24  dotted axis and baseline; the left line draws itself
                          (pencil tip), its guide runs up to the top point;
                          leader and "Capital"
     step 2  p 0.24-0.48  the right line, its guide rising to meet the left one
                          at the top point; leader and "Creative"; step 1 dims
     step 3  p 0.48-0.70  the circle draws closed round that point, inside a
                          faint compass guide; leader and "One idea"; 1 and 2 dim
     step 4  p 0.70-1.00  guides, outlines and notes fade; the mark is pressed
                          in (floor, then walls and lip); the wall lightens a
                          little, the drifting light comes up, the closing line
                          comes in at the bottom left
   Below 1200 (no pinning) and without JS: the finished mark, notes in a column.
   Reduced motion: each part appears whole at its point, no pencil tip, and
   the light stands still.
   Built to become a Framer code component (props: scroll length, mark width,
   the step copy).
   ========================================================================== */
(function () {
  "use strict";

  var root = document.querySelector("[data-mark-v2]");
  if (!root) return;
  var svg = root.querySelector(".mark-v2__svg");
  if (!svg) return;

  var reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
  var desktop = window.matchMedia("(min-width: 1200px)");
  var SMOOTHING = 0.12;              // seconds: how long the drawing takes to catch up with the scroll
  var DIM = 0.45;                    // an earlier note, once the next step starts
  var OVERLAY = [0.74, 0.66];        // the dark overlay, before and after the mark is pressed in

  // Where everything happens, in p
  var T = {
    guides:  [0.00, 0.06],
    left:    [0.03, 0.15],  guideL: [0.13, 0.18],  lead1: [0.15, 0.19],  note1: [0.17, 0.21],
    right:   [0.25, 0.37],  guideR: [0.34, 0.40],  apex:  [0.39, 0.42],  lead2: [0.37, 0.41],  note2: [0.39, 0.43],
    compass: [0.48, 0.57],  circle: [0.50, 0.61],  lead3: [0.60, 0.64],  note3: [0.62, 0.66],
    sketchOut: [0.71, 0.77], floor: [0.72, 0.81],  press: [0.76, 0.85],  light: [0.75, 0.88],  closing: [0.83, 0.91]
  };
  var STEPS = [0.24, 0.48, 0.70];    // where steps 2, 3 and 4 begin

  function clamp01(x) { return x < 0 ? 0 : x > 1 ? 1 : x; }
  function seg(p, r) { return clamp01((p - r[0]) / (r[1] - r[0])); }
  function smooth(t) { return t * t * (3 - 2 * t); }
  function at(p, r) {
    var t = seg(p, r);
    if (reduced.matches) return t > 0.5 ? 1 : 0;   // no drawing, parts appear whole
    return smooth(t);
  }

  // ---------- Elements ----------
  var q = function (s) { return root.querySelector(s); };
  var overlay = q(".mark-v2__overlay");
  var sketch = q(".mark-v2__sketch");
  var floor = q(".mark-v2__floor");
  var walls = q(".mark-v2__walls");
  var lip = q(".mark-v2__lip");
  var light = q(".mark-v2__light");
  var closing = q("[data-closing]");
  var stepEl = q("[data-step]");
  var tip = q("[data-tip]");
  var draws = { left: q('[data-draw="left"]'), right: q('[data-draw="right"]'), circle: q('[data-draw="circle"]') };
  var leaders = [q('[data-leader="1"]'), q('[data-leader="2"]'), q('[data-leader="3"]')];
  var nodes = { apex: q('[data-node="apex"]'), 1: q('[data-node="1"]'), 2: q('[data-node="2"]'), 3: q('[data-node="3"]') };
  var notes = [q('[data-note="1"]'), q('[data-note="2"]'), q('[data-note="3"]')];
  var compass = q('[data-guide="compass"]');

  // Guides grow from where they start: the axis up from below the feet, the baseline out from
  // the middle, the two leg guides up to the top point
  function guide(name, mode) {
    var el = q('[data-guide="' + name + '"]');
    return {
      el: el, mode: mode,
      x1: +el.getAttribute("x1"), y1: +el.getAttribute("y1"),
      x2: +el.getAttribute("x2"), y2: +el.getAttribute("y2")
    };
  }
  var guides = { axis: guide("axis", "grow"), base: guide("base", "centre"), left: guide("left", "grow"), right: guide("right", "grow") };
  var APEX = [36.201, 8.011], COMPASS_R = 11.6;

  var lengths = {};
  function measure() {
    Object.keys(draws).forEach(function (k) {
      var L = draws[k].getTotalLength();
      lengths[k] = L;
      draws[k].style.strokeDasharray = L + " " + L;
    });
    leaders.forEach(function (el, i) {
      var L = el.getTotalLength ? el.getTotalLength() : 60;
      lengths["lead" + i] = L;
      el.style.strokeDasharray = L + " " + L;
    });
    // Strokes true to the pixel whatever the mark's size: 1.2px lines, 1px leaders, 1.5px dots every 5px
    var w = svg.getBoundingClientRect().width || 420;
    var k = 72 / w;
    root.style.setProperty("--mv2-sw", (1.2 * k).toFixed(4));
    root.style.setProperty("--mv2-hair", (1 * k).toFixed(4));
    root.style.setProperty("--mv2-dot", (1.5 * k).toFixed(4));
    root.style.setProperty("--mv2-gap", (5 * k).toFixed(4));
  }

  // ---------- Writing styles only when they change ----------
  var cache = new WeakMap();
  function set(el, prop, val) {
    var c = cache.get(el);
    if (!c) { c = {}; cache.set(el, c); }
    if (c[prop] === val) return;
    c[prop] = val;
    el.style[prop] = val;
  }
  function attr(el, name, val) {
    var c = cache.get(el);
    if (!c) { c = {}; cache.set(el, c); }
    if (c["@" + name] === val) return;
    c["@" + name] = val;
    el.setAttribute(name, val);
  }
  function f(x) { return x.toFixed(3); }

  function drawGuide(g, t) {
    if (g.mode === "centre") {
      var cx = (g.x1 + g.x2) / 2, half = (g.x2 - g.x1) / 2 * t;
      attr(g.el, "x1", f(cx - half)); attr(g.el, "x2", f(cx + half));
    } else {
      attr(g.el, "x2", f(g.x1 + (g.x2 - g.x1) * t));
      attr(g.el, "y2", f(g.y1 + (g.y2 - g.y1) * t));
    }
    set(g.el, "opacity", t > 0 ? "1" : "0");
  }

  // The compass guide: an arc round the top point, from the bottom, clockwise
  function drawCompass(t) {
    if (t <= 0) { attr(compass, "d", ""); return; }
    var n = Math.max(2, Math.round(120 * t)), d = "";
    for (var i = 0; i <= n; i++) {
      var a = Math.PI / 2 + (Math.PI * 2 * t) * (i / n);
      d += (i ? "L" : "M") + f(APEX[0] + Math.cos(a) * COMPASS_R) + " " + f(APEX[1] + Math.sin(a) * COMPASS_R);
    }
    attr(compass, "d", d);
  }

  function drawLine(k, t) {
    set(draws[k], "strokeDashoffset", f(lengths[k] * (1 - t)));
    set(draws[k], "opacity", t > 0 ? "1" : "0");
  }
  function drawLeader(i, t) {
    var L = lengths["lead" + i];
    set(leaders[i], "strokeDashoffset", f(L * (1 - t)));
    set(leaders[i], "opacity", t > 0 ? "1" : "0");
    set(nodes[i + 1], "opacity", f(clamp01(t * 4)));
  }

  // The pencil tip rides on whichever line is being drawn
  function placeTip(k, t) {
    if (!k || reduced.matches) { set(tip, "opacity", "0"); return; }
    var pt = draws[k].getPointAtLength(lengths[k] * t);
    attr(tip, "transform", "translate(" + f(pt.x) + " " + f(pt.y) + ")");
    set(tip, "opacity", f(Math.min(1, t / 0.04, (1 - t) / 0.06)));
  }

  // A note rises a little as it comes in; it dims, then fades out in place
  function noteState(el, inT, dimT, outT) {
    if (!el) return;
    var o = inT * (1 - (1 - DIM) * dimT) * (1 - outT);
    set(el, "opacity", f(o));
    set(el, "transform", "translateY(" + f((1 - inT) * 10) + "px)");
  }

  // ---------- One frame of the drawing at progress p ----------
  function render(p) {
    var g = at(p, T.guides);
    drawGuide(guides.axis, g);
    drawGuide(guides.base, g);

    var dL = at(p, T.left), dR = at(p, T.right), dC = at(p, T.circle);
    drawLine("left", dL);
    drawLine("right", dR);
    drawLine("circle", dC);
    drawGuide(guides.left, at(p, T.guideL));
    drawGuide(guides.right, at(p, T.guideR));
    set(nodes.apex, "opacity", f(at(p, T.apex)));
    drawCompass(at(p, T.compass));

    drawLeader(0, at(p, T.lead1));
    drawLeader(1, at(p, T.lead2));
    drawLeader(2, at(p, T.lead3));

    var active = dL > 0 && dL < 1 ? "left" : dR > 0 && dR < 1 ? "right" : dC > 0 && dC < 1 ? "circle" : null;
    placeTip(active, active === "left" ? dL : active === "right" ? dR : dC);

    // Notes: in, then dimmed once the next step starts; all fade with the sketch
    var out = at(p, T.sketchOut);
    var dim1 = at(p, T.lead2), dim2 = at(p, T.lead3);
    noteState(notes[0], at(p, T.note1), dim1, out);
    noteState(notes[1], at(p, T.note2), dim2, out);
    noteState(notes[2], at(p, T.note3), 0, out);
    set(sketch, "opacity", f(1 - out));

    // Step 4: pressed into the concrete
    var fl = at(p, T.floor), pr = at(p, T.press), li = at(p, T.light);
    set(floor, "opacity", f(0.28 * fl));
    set(walls, "opacity", f(pr));
    set(lip, "opacity", f(pr));
    set(overlay, "opacity", f(OVERLAY[0] + (OVERLAY[1] - OVERLAY[0]) * at(p, T.press)));
    set(light, "opacity", f(li));
    var c = at(p, T.closing);
    set(closing, "opacity", f(c));
    set(closing, "transform", "translateY(" + f((1 - c) * 10) + "px)");

    var step = p < STEPS[0] ? 1 : p < STEPS[1] ? 2 : p < STEPS[2] ? 3 : 4;
    if (stepEl.textContent !== String(step)) stepEl.textContent = step;
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

  // Below 1200: no pinning, the finished mark; notes and closing simply there
  function setMode() {
    var on = desktop.matches;
    if (on === live) return;
    live = on;
    root.classList.toggle("is-live", on);
    measure();
    if (on) {
      shown = -1;
      queue();
    } else {
      if (raf) { cancelAnimationFrame(raf); raf = 0; }
      still();
    }
  }
  function still() {
    render(1);
    notes.concat([closing]).forEach(function (el) { el.style.opacity = ""; el.style.transform = ""; cache.delete(el); });
  }

  window.addEventListener("scroll", queue, { passive: true });
  window.addEventListener("resize", function () { measure(); queue(); });
  if (desktop.addEventListener) desktop.addEventListener("change", setMode);
  if (reduced.addEventListener) reduced.addEventListener("change", function () { shown = -1; queue(); });
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(measure);

  measure();
  setMode();
  if (!live) still();
  window.arcoviaMarkV2 = { render: render, T: T };
})();
