/* ==========================================================================
   Bar band: the About hero's three rows of bars (component: bar-band)
   After the user's Mahadeva template reference (PatternField, its About band):
   rows of slots, each slot holding one bar that grows from one end, holds for
   a beat and closes again. Every 2.4 s the band moves to the next of five
   arrangements; each bar takes 1.1 s to open or close, with a small stagger.
   The rules are the template's, from a fixed seed, so the band is the same
   on every visit:
   - spacing: neighbours in a row never open together or one beat apart (no
     bar seems to slide along the row), and bars in neighbouring rows never
     open together where they overlap;
   - rotation: each bar is open for exactly one beat of the five;
   - tones (?bars=tone only): the fewest repeats among bars on screen together.
   Two looks:
   - carved (default): channels cast into the concrete, drawn by concrete.js
     (setBars), lit like the rest of the carving;
   - tone (?bars=tone): flat bars in the deck's monochrome, white to ink.
   Holds still with reduced motion. Pauses off-screen and once the next
   section has covered the hero. Built to become a Framer code component.
   ========================================================================== */
(function () {
  "use strict";

  var hero = document.querySelector("[data-about-hero]");
  var band = hero && hero.querySelector("[data-bars]");
  if (!hero || !band) return;

  var tone = /[?&]bars=tone\b/.test(location.search);
  hero.classList.add(tone ? "about-hero--tone" : "about-hero--carved");

  var CFG = {
    seed: 40213377,          // the template's seed for its top band
    rows: 3,
    cells: [4, 6],           // slots per row
    weight: [0.5, 2.2],      // a slot's share of the row
    target: [0.82, 1],       // how far a bar opens across its slot
    states: 5,
    interval: 2400,          // ms between arrangements
    duration: 1100,          // ms to open or close
    maxStagger: 260,         // ms
    minGap: 0.03,            // share of the row kept clear between bars in neighbouring rows
    inset: 3                 // carved: px of concrete above and below each channel (as .bars__row padding)
  };
  // Monochrome tones for ?bars=tone: the deck's white cards and charcoal panels, and steps between
  var TONES = ["#ffffff", "#f1f1f0", "#b9b9b8", "#7d7d7c", "#565656", "#2b2b2b"];

  /* ---------- The field, from a fixed seed (a port of the template's generator) ---------- */
  function random(seed) {
    var state = seed >>> 0;
    return function () {
      state = (state + 0x6d2b79f5) >>> 0;
      var t = state;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  function overlaps(a, b, gap) { return a.start < b.end + gap && b.start < a.end + gap; }

  function generate() {
    var rnd = random(CFG.seed), S = CFG.states;
    var grid = [];
    for (var t = 0; t < CFG.rows; t++) {
      var count = CFG.cells[0] + Math.floor(rnd() * (CFG.cells[1] - CFG.cells[0] + 1));
      var weights = [], total = 0;
      for (var i = 0; i < count; i++) {
        var w = CFG.weight[0] + rnd() * (CFG.weight[1] - CFG.weight[0]);
        weights.push(w);
        total += w;
      }
      var cursor = 0;
      grid.push(weights.map(function (w) {
        var start = cursor;
        cursor += w / total;
        return {
          weight: w, start: start, end: cursor,
          target: CFG.target[0] + rnd() * (CFG.target[1] - CFG.target[0]),
          origin: rnd() > 0.5 ? "start" : "end",
          open: [false, false, false, false, false].slice(0, S),
          stagger: Math.round(rnd() * CFG.maxStagger),
          tone: TONES[0]
        };
      }));
      rnd();   // the template samples a row thickness here; kept so the field matches it
    }

    // Each bar gets one beat to be open in, avoiding its neighbours
    var usage = [];
    for (var s = 0; s < S; s++) usage.push(0);
    grid.forEach(function (row, r) {
      row.forEach(function (cell, c) {
        rnd();   // showProbability is 1 in the template: every bar opens once
        var forbidden = {};
        [row[c - 1], row[c + 1]].forEach(function (n) {
          if (!n) return;
          n.open.forEach(function (on, st) {
            if (!on) return;
            forbidden[st] = forbidden[(st + 1) % S] = forbidden[(st - 1 + S) % S] = true;
          });
        });
        (grid[r - 1] || []).forEach(function (o) {
          if (!overlaps(cell, o, CFG.minGap)) return;
          o.open.forEach(function (on, st) { if (on) forbidden[st] = true; });
        });
        var allowed = [];
        for (var st = 0; st < S; st++) if (!forbidden[st]) allowed.push(st);
        if (!allowed.length) return;
        var phase = allowed[Math.floor(rnd() * allowed.length)];
        allowed.forEach(function (cand) { if (usage[cand] < usage[phase]) phase = cand; });
        cell.open[phase] = true;
        usage[phase] += 1;
      });
    });

    // Tones: fewest repeats among bars open at the same time, then fewest touching, then overall
    var perState = [], totals = {};
    for (var q = 0; q < S; q++) perState.push({});
    grid.forEach(function (row, r) {
      row.forEach(function (cell, c) {
        var states = [];
        cell.open.forEach(function (on, st) { if (on) states.push(st); });
        if (!states.length) return;
        var touching = {};
        if (row[c - 1]) touching[row[c - 1].tone] = true;
        (grid[r - 1] || []).forEach(function (o) { if (overlaps(cell, o, CFG.minGap)) touching[o.tone] = true; });
        var best = TONES[0], bestScore = Infinity;
        TONES.forEach(function (tn) {
          var on = states.reduce(function (sum, st) { return sum + (perState[st][tn] || 0); }, 0);
          var score = on * 1000 + (touching[tn] ? 100 : 0) + (totals[tn] || 0);
          if (score < bestScore) { bestScore = score; best = tn; }
        });
        cell.tone = best;
        totals[best] = (totals[best] || 0) + 1;
        states.forEach(function (st) { perState[st][best] = (perState[st][best] || 0) + 1; });
      });
    });
    return grid;
  }

  var grid = generate();

  /* ---------- DOM: rows, slots, bars ---------- */
  var cells = [];
  grid.forEach(function (row, r) {
    var rowEl = document.createElement("div");
    rowEl.className = "bars__row";
    row.forEach(function (cell) {
      var slot = document.createElement("div");
      slot.className = "bars__slot";
      slot.style.flex = cell.weight + " 1 0%";
      var bar = document.createElement("span");
      bar.className = "bars__bar";
      bar.style.transformOrigin = cell.origin === "start" ? "left" : "right";
      if (tone) bar.style.setProperty("--bar-tone", cell.tone);
      slot.appendChild(bar);
      rowEl.appendChild(slot);
      cell.row = r;
      cell.el = bar;
      cell.value = 0;     // how far it is open now (0–1 of its slot)
      cell.from = 0;
      cell.to = 0;
      cell.t0 = 0;
      cells.push(cell);
    });
    band.appendChild(rowEl);
  });

  /* ---------- Motion ---------- */
  // cubic-bezier(0.3, 0, 0.7, 1), the template's easing
  function ease(x) {
    var t = x;
    for (var i = 0; i < 6; i++) {
      var bx = 3 * (1 - t) * (1 - t) * t * 0.3 + 3 * (1 - t) * t * t * 0.7 + t * t * t;
      var d = 3 * (1 - t) * (1 - t) * 0.3 + 6 * (1 - t) * t * (0.7 - 0.3) + 3 * t * t * (1 - 0.7);
      if (Math.abs(d) < 1e-6) break;
      t -= (bx - x) / d;
      t = Math.max(0, Math.min(1, t));
    }
    return 3 * (1 - t) * t * t + t * t * t;
  }

  var state = -1;
  function goTo(s, now) {
    state = s;
    cells.forEach(function (c) {
      c.from = c.value;
      c.to = c.open[s] ? c.target : 0;
      c.t0 = now + c.stagger;
    });
  }

  // Move every bar to where it is at this moment; true if any of them moved
  function step(now) {
    var changed = false;
    cells.forEach(function (c) {
      var k = (now - c.t0) / CFG.duration;
      var v = k <= 0 ? c.from : k >= 1 ? c.to : c.from + (c.to - c.from) * ease(k);
      if (v !== c.value || !c.drawn) {
        c.value = v;
        c.drawn = true;
        c.el.style.transform = "scaleX(" + v.toFixed(4) + ")";
        changed = true;
      }
    });
    return changed;
  }

  /* ---------- Carved: hand the open parts to the concrete ---------- */
  var slab = null, carving = false, geo = null;   // carving: the slab is ready and the look is carved
  var data = new Float32Array(36);

  function measure() {
    var h = hero.getBoundingClientRect(), b = band.getBoundingClientRect();
    var rows = band.children;
    geo = {
      left: b.left - h.left,
      width: b.width,
      top: b.top - h.top,
      rowH: rows.length ? rows[0].getBoundingClientRect().height : b.height / CFG.rows
    };
  }

  function carve() {
    if (!carving || !geo) return;
    var slots = [0, 0, 0];
    for (var i = 0; i < 36; i++) data[i] = -1e5;
    cells.forEach(function (c) {
      var n = slots[c.row]++;
      if (n > 5 || c.value < 0.002) return;
      var x0 = geo.left + c.start * geo.width, x1 = geo.left + c.end * geo.width;
      var len = (x1 - x0) * c.value;
      var a = c.origin === "start" ? x0 : x1 - len;
      data[c.row * 12 + n * 2] = a;
      data[c.row * 12 + n * 2 + 1] = a + len;
    });
    slab.setBars({ top: geo.top, rowH: geo.rowH, inset: CFG.inset, deep: 1, data: data });
  }

  /* ---------- Loop: only while the hero is on screen and not covered ---------- */
  var reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
  var next = hero.parentNode.querySelector(".about-next");
  var onScreen = true, covered = false, running = false, nextTick = 0;

  function frame(now) {
    if (!onScreen || covered || document.hidden || reduced.matches) { running = false; return; }
    if (now >= nextTick) {
      goTo((state + 1) % CFG.states, now);
      nextTick = now + CFG.interval;
    }
    if (step(now)) carve();   // the slab only redraws while bars move
    requestAnimationFrame(frame);
  }

  function kick() {
    if (reduced.matches) {
      // Hold the first arrangement, still
      if (state !== 0) { goTo(0, -1e6); step(0); carve(); }
      return;
    }
    if (running || !onScreen || covered || document.hidden) return;
    running = true;
    // Coming back after a pause: carry on from where it stopped, a beat later
    nextTick = Math.max(nextTick, performance.now() + (state < 0 ? 200 : CFG.interval * 0.5));
    requestAnimationFrame(frame);
  }

  new IntersectionObserver(function (entries) {
    onScreen = entries[0].isIntersecting;
    kick();
  }).observe(hero);

  if (next) {
    var check = function () {
      var c = next.getBoundingClientRect().top <= 0;
      if (c !== covered) {
        covered = c;
        if (slab) slab.setPaused(covered);   // nothing to light once it is hidden
        kick();
      }
    };
    window.addEventListener("scroll", check, { passive: true });
    check();
  }
  document.addEventListener("visibilitychange", kick);
  if (reduced.addEventListener) reduced.addEventListener("change", kick);

  new ResizeObserver(function () { measure(); carve(); }).observe(hero);
  measure();
  step(performance.now());

  /* ---------- Live concrete (as the home hero) ---------- */
  if (window.ConcreteSurface) {
    slab = new window.ConcreteSurface(hero, { canvas: ".about-hero__canvas" });
    slab.init().then(function (ok) {
      if (!ok) { slab = null; return; }
      if (covered) slab.setPaused(true);
      carving = !tone;   // flat bars: the concrete has nothing to carve
      measure();
      carve();
    });
  }

  kick();
})();
