/* ==========================================================================
   Why founders choose Arcovia: cards stack, then settle into a row
   After a reference the user sent. The section pins (sticky stage) while:
     0.00–0.05  the headline stands alone, huge, its lines staggered on the grid
     0.05–0.64  the four cards rise from below, one at a time, into a stack in
                front of it; each covers the one before, whose figure still
                shows above it, and the stack recentres as it grows
     0.68–0.90  the stack spreads into a row while the headline shrinks into
                place above it as a normal heading; the chip and footnote fade in
     0.90–1.00  rest on the settled layout
   The settled layout is the real page (why-founders.css); this only adds
   transforms on top, so at the end nothing is scaled and the text is native.
   Every frame comes from the scroll position alone (with light smoothing),
   so scrolling back up plays it in reverse. Desktop only (≥1200px), and not
   with reduced motion: there the section is simply the settled layout.
   ?cards=concrete previews version B (cast-concrete cards on white).
   ========================================================================== */
(function () {
  "use strict";

  var sec = document.querySelector("[data-founders]");
  if (!sec) return;
  var stage = sec.querySelector(".why-founders__stage");
  var inner = sec.querySelector(".why-founders__inner");
  var title = sec.querySelector(".why-founders__title");
  var lines = Array.prototype.slice.call(sec.querySelectorAll(".why-founders__line"));
  var cards = Array.prototype.slice.call(sec.querySelectorAll(".stat-card"));
  var chip = sec.querySelector(".why-founders__chip");
  var note = sec.querySelector(".why-founders__note");
  var n = cards.length;
  if (!stage || !inner || !title || !lines.length || n < 2) return;

  // Review switch: ?cards=concrete shows version B
  if (/[?&]cards=concrete\b/.test(location.search)) sec.setAttribute("data-variant", "concrete");

  var HOLD = 0.05;          // the headline alone
  var RISE = 0.125;         // each card's rise
  var EACH = 0.15;          // from one card's start to the next
  var SPREAD = [0.68, 0.9]; // the stack spreads and the headline settles
  var STACK_SCALE = 1.1;    // cards are a little larger in the stack
  var BIG = 0.148;          // the big headline's size, as a share of the grid's width
  var LEAD = 0.96;          // its line spacing
  var INDENT = [0, 12, 1];  // where each of its lines starts, in grid columns (12: flush right)
  var LAG = 0.14;           // each headline line starts settling a little after the one before
  var desktop = window.matchMedia("(min-width: 1200px)");
  var reduced = window.matchMedia("(prefers-reduced-motion: reduce)");

  var on = false, geo = null, p = 0, target = 0, raf = 0;

  function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }
  function ramp(a, b, x) { return clamp((x - a) / (b - a), 0, 1); }
  function lerp(a, b, t) { return a + (b - a) * t; }
  function easeOut(t) { return 1 - Math.pow(1 - t, 3); }
  function easeInOut(t) { return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; }

  function clear() {
    lines.concat(cards).forEach(function (el) { el.style.transform = ""; });
    cards.forEach(function (el) { el.style.removeProperty("--shade"); });
    [chip, note].forEach(function (el) { if (el) el.style.opacity = ""; });
  }

  /* ---------- Where everything sits: settled, big and stacked ---------- */
  function measure() {
    clear();
    var s = stage.getBoundingClientRect();
    var vw = s.width, vh = s.height;
    function rel(el) {
      var r = el.getBoundingClientRect();
      return { x: r.left - s.left, y: r.top - s.top, w: r.width, h: r.height };
    }
    var cs = getComputedStyle(inner);
    var gap = parseFloat(getComputedStyle(document.documentElement).getPropertyValue("--grid-gap")) || 24;
    var ir = rel(inner);
    var gridL = ir.x + parseFloat(cs.paddingLeft);
    var gridW = ir.w - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight);
    var col = (gridW - 11 * gap) / 12 + gap;

    // The big headline: each line keeps its own place on the grid, the block centred on the screen
    var small = parseFloat(getComputedStyle(title).fontSize);
    var big = gridW * BIG;
    var k = big / small;
    var heads = lines.map(rel);
    var blockH = big * LEAD * (lines.length - 1) + heads[heads.length - 1].h * k;
    var top = (vh - blockH) / 2;
    heads.forEach(function (h, i) {
      var x = gridL + (INDENT[i] || 0) * col;
      h.bx = Math.min(x, gridL + gridW - h.w * k);
      h.by = top + i * big * LEAD;
    });

    // The stack: centred, each card a figure's height below the one before
    var natural = cards.map(rel);
    var fig = cards[0].querySelector(".stat-card__figure");
    var figBottom = fig ? fig.getBoundingClientRect().bottom - cards[0].getBoundingClientRect().top : 90;
    var sc = STACK_SCALE;
    var cardH = Math.max.apply(null, natural.map(function (c) { return c.h; }));
    var step = (figBottom + 20) * sc;
    // Keep the whole stack on screen on shorter windows
    var room = vh - 64;
    if (cardH * sc + (n - 1) * step > room) {
      sc = room / (cardH + (n - 1) * (figBottom + 20));
      step = (figBottom + 20) * sc;
    }
    var ss = getComputedStyle(stage);
    return {
      vw: vw, vh: vh, k: k, heads: heads, cards: natural,
      sc: sc, step: step, cardH: cardH * sc,
      sx: (vw - natural[0].w * sc) / 2,
      fits: ir.h <= vh - parseFloat(ss.paddingTop) - parseFloat(ss.paddingBottom) + 1
    };
  }

  /* ---------- One frame, from the progress p alone ---------- */
  function draw() {
    var g = geo;
    // How far each card has risen, and how many sit on the stack
    var rise = cards.map(function (c, i) { return easeOut(ramp(HOLD + i * EACH, HOLD + i * EACH + RISE, p)); });
    var landed = rise.reduce(function (a, b) { return a + b; }, 0);
    var stackTop = (g.vh - (g.cardH + Math.max(0, landed - 1) * g.step)) / 2;
    var spread = ramp(SPREAD[0], SPREAD[1], p);
    var f = easeInOut(spread);

    cards.forEach(function (el, i) {
      var c = g.cards[i];
      var yStack = stackTop + i * g.step;
      var y = lerp(g.vh + 40, yStack, rise[i]);
      var x = lerp(g.sx, c.x, f);
      y = lerp(y, c.y, f);
      var sc = lerp(g.sc, 1, f);
      var still = f >= 1;
      el.style.transform = still ? "" : "translate3d(" + (x - c.x).toFixed(2) + "px," + (y - c.y).toFixed(2) + "px,0) scale(" + sc.toFixed(4) + ")";
      var shade = i < n - 1 ? rise[i + 1] * (1 - f) : 0;
      if (shade > 0.001) el.style.setProperty("--shade", shade.toFixed(3)); else el.style.removeProperty("--shade");
    });

    // The headline shrinks into place as the cards spread, one line after the other, so each
    // line finds its place in the sentence before the next comes up beside it. The scale is
    // eased in log space, so the shrinking feels even.
    var last = g.heads.length - 1;
    g.heads.forEach(function (h, i) {
      var t = easeInOut(ramp(i * LAG, 1 - (last - i) * LAG, spread));
      var x = lerp(h.bx, h.x, t);
      var y = lerp(h.by, h.y, t);
      var k = Math.exp(lerp(Math.log(g.k), 0, t));
      lines[i].style.transform = t >= 1 ? "" : "translate(" + (x - h.x).toFixed(2) + "px," + (y - h.y).toFixed(2) + "px) scale(" + k.toFixed(4) + ")";
    });

    if (chip) chip.style.opacity = f >= 1 ? "" : ramp(0.5, 1, f).toFixed(3);
    if (note) note.style.opacity = f >= 1 ? "" : ramp(0.6, 1, f).toFixed(3);
    sec.classList.toggle("is-settled", f >= 1);
  }

  /* ---------- Scroll → progress, lightly smoothed ---------- */
  function read() {
    var r = sec.getBoundingClientRect();
    var travel = r.height - window.innerHeight;
    target = travel > 0 ? clamp(-r.top / travel, 0, 1) : 0;
  }

  function tick() {
    raf = 0;
    if (!on) return;
    if (!geo) geo = measure();
    var d = target - p;
    p = Math.abs(d) < 0.0004 ? target : p + d * 0.2;
    draw();
    if (p !== target) raf = requestAnimationFrame(tick);
  }

  function queue() {
    if (!on) return;
    read();
    if (!raf) raf = requestAnimationFrame(tick);
  }

  function setMode() {
    var want = desktop.matches && !reduced.matches;
    sec.classList.toggle("why-founders--staged", want);
    geo = null;
    if (want) {
      // The settled layout must fit on one screen, or the section just scrolls
      geo = measure();
      if (!geo.fits) { want = false; sec.classList.remove("why-founders--staged"); }
    }
    on = want;
    if (!on) {
      if (raf) cancelAnimationFrame(raf);
      raf = 0;
      clear();
      sec.classList.remove("is-settled");
      return;
    }
    read();
    p = target;
    draw();
  }

  window.addEventListener("scroll", queue, { passive: true });
  window.addEventListener("resize", setMode);
  if (desktop.addEventListener) desktop.addEventListener("change", setMode);
  if (reduced.addEventListener) reduced.addEventListener("change", setMode);
  // The headline is measured from the real font, so measure again once it's in
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(setMode);
  setMode();
})();
