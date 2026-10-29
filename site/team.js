/* ==========================================================================
   Team: portrait cards in a row that moves sideways as you scroll down
   The section pins (sticky stage) for one stretch of scroll per card. Each
   card slides in from the right and comes to rest at the front, on top of
   the one before (which sinks back into shade), while the window cut into
   its slab opens until only a thin concrete frame is left. Each card rests
   at the front for a moment before the next one comes.
   The names on the left hang on a line (after a timeline reference the user
   sent): it bends out to the person at the front, or to the name under the
   cursor, with a soft pill behind them, and fills with ink down to the
   person at the front as you scroll. Clicking a name scrolls the page to
   that card.
   Every frame comes from the scroll position alone (with light smoothing),
   so scrolling back up plays it in reverse. Desktop only (≥1200px), and not
   with reduced motion: there the row simply scrolls sideways on its own.
   Built to become a Framer code component.
   ========================================================================== */
(function () {
  "use strict";

  var team = document.querySelector("[data-team]");
  if (!team) return;
  var stage = team.querySelector(".team__stage");
  var viewport = team.querySelector(".team__viewport");
  var items = Array.prototype.slice.call(team.querySelectorAll(".team__item"));
  var more = team.querySelector(".team__more");      // last tile, on to the Team page
  var names = Array.prototype.slice.call(team.querySelectorAll("[data-team-go]"));
  var list = team.querySelector(".team__names");
  var line = team.querySelector(".team__line");
  var pill = team.querySelector(".team__pill");
  var n = items.length;
  if (!stage || !viewport || n < 2) return;

  var PER_CARD = 0.8;     // scroll for each card, in viewport heights
  var REST = 0.3;         // share of each card's stretch it spends resting at the front
  var SINK = 0.06;        // how much a covered card shrinks back
  var desktop = window.matchMedia("(min-width: 1200px)");
  var reduced = window.matchMedia("(prefers-reduced-motion: reduce)");

  var on = false;
  var step = 0;           // one card plus the gap, in px
  var pos = 0;            // which card is at the front: 0 … n-1, fractional in between
  var target = 0;
  var intro = 0;          // the first card's window opens as the section comes up
  var introTarget = 0;
  var current = -1;
  var raf = 0;
  var last = 0;

  // The names' line: rows of ROW px, the line at X0, bending out by BEND
  var ROW = 36, X0 = 6, BEND = 12;
  var hover = -1;         // name under the cursor or keyboard focus, -1 for none
  var bend = 0;           // where the line bends out: 0 … n-1, fractional in between
  var still = 0;          // without the pinned row: the card scrolled to

  function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }
  function smooth(e0, e1, x) { var t = clamp((x - e0) / (e1 - e0), 0, 1); return t * t * (3 - 2 * t); }

  /* ---------- Scroll → which card is at the front ---------- */
  function read() {
    var vh = window.innerHeight;
    var r = team.getBoundingClientRect();
    var travel = r.height - vh;
    var p = travel > 0 ? clamp(-r.top / travel, 0, 1) : 0;
    // Between two cards: rest, slide, rest. Each card rests for REST of its stretch.
    var t = p * (n - 1);
    var i = Math.min(Math.floor(t), n - 2);
    var f = t - i;
    target = i + smooth(REST / 2, 1 - REST / 2, f);
    // The first window opens over the last 70% of a screen before the stage pins
    introTarget = smooth(0.7 * vh, 0, r.top);
  }

  /* ---------- Draw: every card's place, window and shade ---------- */
  function drawCards() {
    items.forEach(function (item, k) {
      var past = clamp(pos - k, 0, 1);                 // 1 once the next card fully covers it
      var x = -Math.min(pos, k) * step;                // cards at or past the front stay there
      var a = clamp(1 - (k - pos), 0, 1);              // window opens on the way to the front
      if (k === 0) a *= intro;
      item.style.transform = "translate3d(" + x.toFixed(2) + "px,0,0) scale(" + (1 - SINK * past).toFixed(4) + ")";
      a = a * a * (3 - 2 * a);
      item.style.setProperty("--a", a.toFixed(4));
      // The text fades out while the window's edge passes under it, turns white, fades back in
      item.style.setProperty("--t", a < 0.5 ? "0" : "1");
      item.style.setProperty("--o", (1 - smooth(0.08, 0.28, a) + smooth(0.72, 0.92, a)).toFixed(4));
      item.style.setProperty("--d", past.toFixed(4));
      // Well under the stack: fade it out, so shadows don't pile up (it stays focusable)
      item.style.opacity = pos - k > 1.05 ? "0" : "";
    });
    if (more) more.style.transform = "translate3d(" + (-pos * step).toFixed(2) + "px,0,0)";
  }

  /* ---------- Draw: the names' line, dots, pill and the name it bends out to ---------- */
  var NS = "http://www.w3.org/2000/svg";
  var rail, ink, halo, dots = [], widths = [];
  function svgEl(tag, attrs) {
    var el = document.createElementNS(NS, tag);
    for (var a in attrs) el.setAttribute(a, attrs[a]);
    return line.appendChild(el);
  }
  function buildNames() {
    if (!line || !names.length) return;
    rail = svgEl("path", { fill: "none", stroke: "#d4d4d4", "stroke-width": "1.25", "stroke-linecap": "round" });
    ink = svgEl("path", { fill: "none", stroke: "#151515", "stroke-width": "1.5", "stroke-linecap": "round" });
    halo = svgEl("circle", { r: "8", fill: "rgba(21,21,21,0.1)" });
    names.forEach(function () { dots.push(svgEl("circle", { r: "2.75" })); });
    list.classList.add("is-drawn");
  }
  function measureNames() {
    widths = names.map(function (b) { return b.offsetWidth; });
  }
  // How far a name (or a point on the line) sits out from the line: 1 at the bend, 0 a row away
  function out(i) { return 1 - smooth(0, 1, Math.abs(i - bend)); }
  function front() { return on ? pos : still; }

  function drawNames() {
    var f = front();
    var top = ROW / 2, bottom = (n - 1) * ROW + ROW / 2;
    var fill = top + clamp(f, 0, n - 1) * ROW;
    if (rail) {
      // Sample the line every 1.5px: straight down, curving out and back around the bend
      var d = "", di = "";
      for (var y = top; y <= bottom + 0.01; y += 1.5) {
        var pt = (X0 + BEND * out((y - top) / ROW)).toFixed(2) + " " + y.toFixed(2);
        d += (d ? "L" : "M") + pt;
        if (y <= fill) di += (di ? "L" : "M") + pt;
      }
      rail.setAttribute("d", d);
      ink.setAttribute("d", di || "M0 0");
      var at = clamp(Math.round(f), 0, n - 1);
      dots.forEach(function (dot, k) {
        var reached = k <= f + 0.02;
        var big = k === at ? 4 : k === hover ? 3.5 : 2.75;
        dot.setAttribute("cx", (X0 + BEND * out(k)).toFixed(2));
        dot.setAttribute("cy", top + k * ROW);
        dot.setAttribute("r", big);
        dot.setAttribute("fill", reached || k === hover ? "#151515" : "#c4c4c4");
      });
      halo.setAttribute("cx", (X0 + BEND * out(at)).toFixed(2));
      halo.setAttribute("cy", top + at * ROW);
    }
    names.forEach(function (b, k) { b.style.setProperty("--shift", (BEND * out(k)).toFixed(2) + "px"); });
    if (pill && widths.length) {
      var i = clamp(Math.floor(bend), 0, n - 1), j = Math.min(i + 1, n - 1), t = bend - i;
      var w = widths[i] + (widths[j] - widths[i]) * t + BEND + 8;
      pill.style.transform = "translate3d(0," + (bend * ROW + 2).toFixed(2) + "px,0)";
      pill.style.width = w.toFixed(1) + "px";
    }
    var now = clamp(Math.round(f), 0, n - 1);
    if (now !== current) {
      current = now;
      names.forEach(function (b, k) {
        if (k === now) b.setAttribute("aria-current", "true");
        else b.removeAttribute("aria-current");
      });
    }
  }

  /* Light smoothing so the row and the line glide; stops once both have caught up.
     The line bends out to the name under the cursor, else follows the person at the front. */
  function frame(now) {
    var dt = Math.min(64, now - (last || now));
    last = now;
    var k = 1 - Math.exp(-dt / 90);
    if (on) {
      pos += (target - pos) * k;
      intro += (introTarget - intro) * k;
    }
    var bendTarget = hover >= 0 ? hover : front();
    bend += (bendTarget - bend) * (reduced.matches ? 1 : 1 - Math.exp(-dt / 120));
    if (Math.abs(target - pos) < 0.0005 && Math.abs(introTarget - intro) < 0.001 && Math.abs(bendTarget - bend) < 0.001) {
      if (on) { pos = target; intro = introTarget; }
      bend = bendTarget;
      raf = 0;
      last = 0;
    } else {
      raf = requestAnimationFrame(frame);
    }
    if (on) drawCards();
    drawNames();
  }
  function kick() { if (!raf) raf = requestAnimationFrame(frame); }
  function onScroll() {
    if (!on) return;
    read();
    kick();
  }

  function measure() {
    // offsetLeft ignores transforms, so this stays right mid-slide
    step = items[1].offsetLeft - items[0].offsetLeft;
  }

  function setOn(v) {
    on = v;
    team.classList.toggle("team--on", v);
    if (v) {
      team.style.setProperty("--team-travel", ((n - 1) * PER_CARD * 100).toFixed(2) + "vh");
      measure();
      read();
      pos = target;
      intro = introTarget;
      bend = pos;
      drawCards();
      drawNames();
    } else {
      team.style.removeProperty("--team-travel");
      if (more) more.style.transform = "";
      items.forEach(function (item) {
        item.style.transform = "";
        item.style.opacity = "";
        ["--a", "--t", "--o", "--d"].forEach(function (p) { item.style.removeProperty(p); });
      });
      bend = still;
      drawNames();
    }
  }
  function update() { setOn(desktop.matches && !reduced.matches); }

  /* ---------- Names: bring that person's card to the front ---------- */
  function scrollToCard(k, instant) {
    if (!on) {
      viewport.scrollTo({ left: items[k].offsetLeft - items[0].offsetLeft, behavior: reduced.matches || instant ? "auto" : "smooth" });
      return;
    }
    var r = team.getBoundingClientRect();
    var travel = r.height - window.innerHeight;
    var y = window.scrollY + r.top + travel * (k / (n - 1));
    window.scrollTo({ top: Math.round(y), behavior: instant ? "auto" : "smooth" });
  }
  names.forEach(function (b, k) {
    b.addEventListener("click", function () { scrollToCard(k); });
    // The line bends out to the name under the cursor or keyboard focus
    b.addEventListener("pointerenter", function () { hover = k; kick(); });
    b.addEventListener("focus", function () { if (b.matches(":focus-visible")) { hover = k; kick(); } });
    b.addEventListener("blur", function () { if (hover === k) { hover = -1; kick(); } });
  });
  if (list) list.addEventListener("pointerleave", function () { hover = -1; kick(); });

  // Without the pinned row the cards scroll sideways; the names follow that instead
  viewport.addEventListener("scroll", function () {
    if (on) return;
    var w = items[1].offsetLeft - items[0].offsetLeft;
    var k = clamp(Math.round(viewport.scrollLeft / w), 0, n - 1);
    if (k !== still) { still = k; kick(); }
  }, { passive: true });

  // Tabbing onto a card brings it to the front. The browser may also have scrolled the
  // clipped stage sideways to show it; put that back, the transforms do the moving.
  team.addEventListener("focusin", function (e) {
    if (!on) return;
    stage.scrollLeft = 0;
    viewport.scrollLeft = 0;
    for (var k = 0; k < n; k++) {
      if (items[k].contains(e.target)) { if (k !== current) scrollToCard(k, true); break; }
    }
  });

  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("resize", function () { measureNames(); if (on) { measure(); onScroll(); } else drawNames(); });
  [desktop, reduced].forEach(function (mq) {
    if (mq.addEventListener) mq.addEventListener("change", update);
    else if (mq.addListener) mq.addListener(update);
  });
  buildNames();
  measureNames();
  update();
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(function () {
    measureNames();
    if (on) { measure(); drawCards(); }
    drawNames();
  });
})();
