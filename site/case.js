/* ==========================================================================
   Case page: the book comes across and the case opens
   After the user's Stripe Press reference: a book picked from the shelf
   turns as it travels to the left, the dark room takes the book's colour,
   and the text comes in on the right.
     - Coming from Selected work (case-link.js saves where the clicked book
       stood, how far it was turned, and how far its cover was open): the
       book starts exactly there, on the same black, at the same size.
       Opened any other way: it stands on its spine in the middle.
     - 0–1150 ms the book travels to its place on the left and grows to its
       size there. On the way it turns (spine, head and page edges showing)
       and settles straight on; an open cover closes in the first half.
     - The black veil dissolves into the ground from 38% to 78% of the way.
     - The text comes in, one part after another, from 55% of the way;
       the masthead last.
   Scroll-free and timed, with one clock (requestAnimationFrame from one
   start time), so it can't stall. At the end every inline style goes and
   the book rests with no transform, so its cover stays crisp.
   Desktop only (≥1200px), not with reduced motion: the head script decides
   (.case-intro) before the first paint. Built to become part of the case
   template's code component in Framer.
   ========================================================================== */
(function () {
  "use strict";

  var root = document.documentElement;
  var sec = document.querySelector("[data-case]");
  var KEY = "arcovia_case_from";
  var from = null;
  try {
    from = JSON.parse(sessionStorage.getItem(KEY) || "null");
    sessionStorage.removeItem(KEY);
  } catch (e) { from = null; }
  if (!sec || !root.classList.contains("case-intro")) return;

  var wrap = sec.querySelector("[data-case-book]");
  var body = wrap && wrap.querySelector(".book__body");
  var cover = wrap && wrap.querySelector(".book__cover");
  var spine = wrap && wrap.querySelector(".book__spine");
  if (!wrap || !body || !cover || !spine) { root.classList.remove("case-intro"); return; }
  var leaves = Array.prototype.slice.call(wrap.querySelectorAll(".book__leaf"));
  var veil = sec.querySelector(".case__veil");
  var header = document.querySelector("[data-header]");
  var items = Array.prototype.slice.call(sec.querySelectorAll("[data-case-in]"));
  if (header) items.push(header);

  var slug = sec.getAttribute("data-case");
  if (from && (from.slug !== slug || !(Date.now() - from.t < 8000))) from = null;

  var TRAVEL = 1150;        // the book's way across, ms
  var VEIL = [0.38, 0.78];  // the black dissolves (share of the way)
  var TEXT_AT = 0.55;       // the text starts coming in (share of the way)
  var TEXT_STEP = 75;       // ms between parts
  var TEXT_MS = 560;        // each part's fade and rise
  var RISE = 18;            // px
  var SWING = 24;           // degrees the book turns its spine towards the way it goes
  var LEAN = -9;            // degrees it leans, showing the head of the page block
  var ROLL = -2.5;          // degrees it rolls

  function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }
  function ramp(a, b, x) { return clamp((x - a) / (b - a), 0, 1); }
  function easeInOut(t) { return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; }
  function easeOut(t) { return 1 - Math.pow(1 - t, 3); }
  function smooth(t) { return t * t * (3 - 2 * t); }

  // Where the book rests (no transform yet), and where it starts
  window.scrollTo(0, 0);
  var rest = wrap.getBoundingClientRect();
  var W = wrap.offsetWidth, H = wrap.offsetHeight;
  var T = spine.offsetWidth || W * 0.24;
  var fx = rest.left + rest.width / 2, fy = rest.top + rest.height / 2;
  var start = from
    ? { x: from.x, y: from.y, s: from.h / H, deg: from.deg || 0, open: from.open || 0 }
    : { x: window.innerWidth / 2, y: window.innerHeight / 2, s: 0.86, deg: 90, open: 0 };
  // Turned a long way already (closed, on its spine): just turn back, no extra swing
  var swing = start.deg < 45 ? SWING : 0;

  function pose(k) {
    var e = easeInOut(k);
    var arc = Math.sin(Math.PI * e);
    // Across and up to size, rising a little towards you on the way
    var s = (start.s + (1 - start.s) * e) * (1 + 0.05 * arc);
    wrap.style.transform = "translate(" + ((start.x - fx) * (1 - e)).toFixed(2) + "px," + ((start.y - fy) * (1 - e)).toFixed(2) + "px) scale(" + s.toFixed(4) + ")";

    // The turn, about the box's middle, drawn back so the face you see keeps its depth
    var deg = start.deg * (1 - e) + swing * arc;
    var rad = deg * Math.PI / 180;
    var depth = -((W - T) / 2) * Math.sin(Math.abs(rad));
    body.style.transform = "translateZ(" + (depth - T / 2).toFixed(2) + "px) rotateZ(" + (ROLL * arc).toFixed(3) + "deg) rotateX(" + (LEAN * arc).toFixed(3) + "deg) rotateY(" + deg.toFixed(3) + "deg) translateZ(" + (T / 2).toFixed(2) + "px)";
    // Light from the front left, as in Selected work
    cover.style.setProperty("--lit", clamp(0.72 + 0.28 * (Math.cos(rad) - 0.55 * Math.sin(rad)), 0.55, 1).toFixed(3));
    spine.style.setProperty("--lit", clamp(0.72 + 0.28 * (Math.sin(rad) + 0.55 * Math.cos(rad)), 0.55, 1).toFixed(3));

    // An open cover (it was hovered when clicked) closes in the first half
    var c = start.open * (1 - easeOut(ramp(0, 0.45, k)));
    cover.style.transform = Math.abs(c) > 0.01 ? "rotateY(" + c.toFixed(3) + "deg)" : "";
    leaves.forEach(function (el) {
      var f = parseFloat(el.style.getPropertyValue("--k")) || 0;
      el.style.transform = Math.abs(c) > 0.01 ? "translateZ(" + (-3 + f * 3).toFixed(2) + "px) rotateY(" + (c * f).toFixed(3) + "deg)" : "";
    });

    if (veil) veil.style.opacity = (1 - smooth(ramp(VEIL[0], VEIL[1], k))).toFixed(3);
  }

  function text(ms) {
    items.forEach(function (el, i) {
      var u = easeOut(ramp(0, TEXT_MS, ms - TRAVEL * TEXT_AT - i * TEXT_STEP));
      el.style.opacity = u.toFixed(3);
      if (el !== header) el.style.transform = u < 1 ? "translateY(" + ((1 - u) * RISE).toFixed(2) + "px)" : "";
    });
  }

  function finish() {
    [wrap, body, cover].concat(leaves, items).forEach(function (el) {
      el.style.transform = "";
      el.style.opacity = "";
    });
    cover.style.removeProperty("--lit");
    spine.style.removeProperty("--lit");
    if (veil) veil.style.opacity = "";
    wrap.classList.remove("is-turning");
    root.classList.remove("case-intro", "case-playing");
    if ("scrollRestoration" in history) history.scrollRestoration = "auto";
  }

  var END = TRAVEL * TEXT_AT + (items.length - 1) * TEXT_STEP + TEXT_MS;
  var t0 = 0;
  var delay = from ? 40 : 180; // straight on from the click; a beat to see it standing otherwise
  var held = false;

  // For checks: window.arcoviaCase.render(ms) stops the clock and draws that moment
  window.arcoviaCase = {
    render: function (ms) {
      held = true;
      root.classList.add("case-intro", "case-playing");
      wrap.classList.add("is-turning");
      pose(clamp(ms / TRAVEL, 0, 1));
      text(ms);
    },
    duration: END
  };

  function tick(now) {
    if (held) return;
    if (!t0) t0 = now + delay;
    var ms = Math.max(0, now - t0);
    pose(clamp(ms / TRAVEL, 0, 1));
    text(ms);
    if (ms >= END) finish();
    else requestAnimationFrame(tick);
  }

  // The first frame: the book where it was clicked, on black
  wrap.classList.add("is-turning");
  pose(0);
  text(0);
  root.classList.add("case-playing");
  requestAnimationFrame(tick);
})();
