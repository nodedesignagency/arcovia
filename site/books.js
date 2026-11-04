/* ==========================================================================
   Selected work: the heading parts and goes, three books turn to face you
   After the template's "Before vs After" (the outer words part to either
   side, 600px, fading as they go) and the user's book video. The section
   pins (sticky stage) while:
     0.00–0.34  "Selected" and "work" part left and right and fade away,
                scrubbed by scroll, exactly as in the template
     0.10–0.40  three book spines rise into the middle as the words open: the
                middle one first, then the outer two (spines facing you)
     0.47       a little more scroll and all three books turn at once to face
                the front while they spread into their row. Only the books are
                left. The turn plays on its own once started (scrolling back
                above 0.42 turns them back), so a book is never left half turned.
     to 1.00    rest on the settled layout
   The settled layout is the real page (selected-work.css); this only adds
   transforms on top. At rest the covers face straight ahead with no
   transform at all, so their text stays crisp. Each book has its own
   perspective, centred on it, so the outer books never look skewed.
   ?books=angle rests them a little turned instead, a sliver of spine showing.
   Desktop only (≥1200px), and not with reduced motion: there the section is
   simply the settled layout.
   ========================================================================== */
(function () {
  "use strict";

  var sec = document.querySelector("[data-books]");
  if (!sec) return;
  var stage = sec.querySelector(".work__stage");
  var inner = sec.querySelector(".work__inner");
  var title = sec.querySelector(".work__title");
  var words = Array.prototype.slice.call(sec.querySelectorAll(".work__word"));
  var books = Array.prototype.slice.call(sec.querySelectorAll(".book"));
  var bodies = books.map(function (b) { return b.querySelector(".book__body"); });
  var covers = books.map(function (b) { return b.querySelector(".book__cover"); });
  var spines = books.map(function (b) { return b.querySelector(".book__spine"); });
  var more = sec.querySelector(".work__more");
  var n = books.length;
  if (!stage || !inner || !title || words.length !== 2 || n < 1) return;

  var PART = [0, 0.34];     // the words part and fade (linear, as in the template)
  var SPREAD = 600;         // how far each word travels, px (the template's value)
  var RISE_AT = 0.1;        // the middle spine starts to rise
  var RISE = 0.22;          // each spine's rise
  var STAGGER = 0.08;       // then the outer two, together
  var OPEN_AT = 0.47;       // the books turn to face the front
  var CLOSE_AT = 0.42;      // and back, a little earlier, so it never flickers
  var TURN_MS = 1100;       // the turn, played on its own once triggered
  var BACK_MS = 850;
  var REST = /[?&]books=angle\b/.test(location.search) ? 16 : 0; // resting angle, degrees
  var desktop = window.matchMedia("(min-width: 1200px)");
  var reduced = window.matchMedia("(prefers-reduced-motion: reduce)");

  var on = false, geo = null, p = 0, target = 0, q = 0, qTarget = 0, last = 0, raf = 0;

  function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }
  function ramp(a, b, x) { return clamp((x - a) / (b - a), 0, 1); }
  function lerp(a, b, t) { return a + (b - a) * t; }
  function easeOut(t) { return 1 - Math.pow(1 - t, 3); }
  function easeInOut(t) { return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; }
  function move(x, y) { return "translate(" + x.toFixed(2) + "px," + y.toFixed(2) + "px)"; }

  function clear() {
    words.concat(books, bodies).forEach(function (el) { el.style.transform = ""; });
    words.forEach(function (el) { el.style.opacity = ""; });
    books.forEach(function (el) { el.style.opacity = ""; });
    covers.concat(spines).forEach(function (el) { el.style.removeProperty("--lit"); });
    if (more) more.style.opacity = "";
  }

  /* ---------- Where everything sits: start, parted and settled ---------- */
  function measure() {
    clear();
    var s = stage.getBoundingClientRect();
    function rel(el) {
      var r = el.getBoundingClientRect();
      return { x: r.left - s.left, y: r.top - s.top, w: r.width, h: r.height };
    }
    var vw = s.width, vh = s.height;
    var w = words.map(rel);
    var b = books.map(rel);
    var W = b[0].w;
    var T = spines[0].offsetWidth || W * 0.19;
    var cy = b[0].y + b[0].h / 2;

    // The two words sit together in the middle of the stage (CSS); bring them level with the books
    var dy = cy - (w[0].y + w[0].h / 2);
    var spineGap = Math.max(20, T * 0.5);
    var group = n * T + (n - 1) * spineGap;

    // Each book's centre: closed, side by side in the middle; open, in its place in the row
    b.forEach(function (c, i) {
      c.cx = c.x + c.w / 2;
      c.closed = vw / 2 - group / 2 + T / 2 + i * (T + spineGap);
    });

    var ss = getComputedStyle(stage);
    var room = vh - parseFloat(ss.paddingTop) - parseFloat(ss.paddingBottom);
    return { W: W, T: T, dy: dy, spread: Math.max(SPREAD, vw * 0.4), b: b, rise: vh * 0.32, fits: inner.offsetHeight <= room + 1 };
  }

  /* ---------- One frame, from the scroll progress p and the turn q ---------- */
  function draw() {
    var g = geo;
    var part = ramp(PART[0], PART[1], p);
    var e = easeInOut(q);
    // The books spread a little ahead of the turn, so a widening cover never runs into
    // its neighbour
    var spread = easeInOut(ramp(0, 0.8, q));
    var turn = easeInOut(ramp(0.1, 1, q));
    var open = q >= 1;
    var flat = open && REST === 0;
    sec.classList.toggle("is-open", open);
    sec.classList.toggle("is-flat", flat);

    // The words part to either side and fade away, as in the template; only the books stay
    words.forEach(function (el, i) {
      el.style.transform = move((i ? 1 : -1) * g.spread * part, g.dy);
      el.style.opacity = (1 - part).toFixed(3);
    });

    // The turn: 90° shows the spine, 0° the cover. The box turns about its own middle,
    // and is drawn back as it turns so the face you see stays at the same depth (no swelling)
    var deg = lerp(90, REST, turn);
    var rad = deg * Math.PI / 180;
    var depth = -((g.W - g.T) / 2) * Math.sin(rad);
    var spin = "translateZ(" + (depth - g.T / 2).toFixed(2) + "px) rotateY(" + deg.toFixed(3) + "deg) translateZ(" + (g.T / 2).toFixed(2) + "px)";
    // Light from the front left: the cover dims as it turns away, the spine as it turns in
    var coverLit = clamp(0.72 + 0.28 * (Math.cos(rad) - 0.55 * Math.sin(rad)), 0.55, 1);
    var spineLit = clamp(0.72 + 0.28 * (Math.sin(rad) + 0.55 * Math.cos(rad)), 0.55, 1);

    books.forEach(function (el, i) {
      var c = g.b[i];
      // The gap opens from the middle, so the middle spine rises first, then its neighbours
      var order = Math.abs(i - (n - 1) / 2);
      var r = easeOut(ramp(RISE_AT + order * STAGGER, RISE_AT + order * STAGGER + RISE, p));
      var dx = lerp(c.closed, c.cx, spread) - c.cx;
      var dy = (1 - r) * g.rise;
      el.style.transform = Math.abs(dx) < 0.01 && dy < 0.01 ? "" : move(dx, dy);
      el.style.opacity = r >= 1 ? "" : clamp(r * 1.4, 0, 1).toFixed(3);
      el.style.visibility = r <= 0 ? "hidden" : "";
      bodies[i].style.transform = flat ? "" : spin;
      if (flat) {
        covers[i].style.removeProperty("--lit");
      } else {
        covers[i].style.setProperty("--lit", coverLit.toFixed(3));
        spines[i].style.setProperty("--lit", spineLit.toFixed(3));
      }
    });

    if (more) more.style.opacity = open ? "" : ramp(0.55, 1, e).toFixed(3);
  }

  /* ---------- Scroll → progress (lightly smoothed); the turn runs on time ---------- */
  function read() {
    var r = sec.getBoundingClientRect();
    var travel = r.height - window.innerHeight;
    target = travel > 0 ? clamp(-r.top / travel, 0, 1) : 0;
    if (target >= OPEN_AT) qTarget = 1;
    else if (target < CLOSE_AT) qTarget = 0;
  }

  function tick(now) {
    raf = 0;
    if (!on) return;
    if (!geo) geo = measure();
    var dt = last ? Math.min(64, now - last) : 16;
    last = now;
    var d = target - p;
    p = Math.abs(d) < 0.0004 ? target : p + d * 0.2;
    if (q !== qTarget) {
      q = qTarget > q ? Math.min(1, q + dt / TURN_MS) : Math.max(0, q - dt / BACK_MS);
    }
    draw();
    if (p !== target || q !== qTarget) raf = requestAnimationFrame(tick);
    else last = 0;
  }

  function queue() {
    if (!on) return;
    read();
    if (!raf) raf = requestAnimationFrame(tick);
  }

  function setMode() {
    var want = desktop.matches && !reduced.matches;
    sec.classList.toggle("work--staged", want);
    sec.classList.remove("is-open", "is-flat");
    geo = null;
    if (want) {
      // The settled layout must fit on one screen, or the section just scrolls
      geo = measure();
      if (!geo.fits) { want = false; sec.classList.remove("work--staged"); }
    }
    on = want;
    if (!on) {
      if (raf) cancelAnimationFrame(raf);
      raf = 0;
      clear();
      books.forEach(function (el) { el.style.visibility = ""; });
      return;
    }
    read();
    p = target;
    q = qTarget = p >= OPEN_AT ? 1 : 0;
    draw();
  }

  window.addEventListener("scroll", queue, { passive: true });
  window.addEventListener("resize", setMode);
  if (desktop.addEventListener) desktop.addEventListener("change", setMode);
  if (reduced.addEventListener) reduced.addEventListener("change", setMode);
  // The words are measured from the real font, so measure again once it's in
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(setMode);
  setMode();
})();
