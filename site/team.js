/* ==========================================================================
   Team: portrait cards in a row that moves sideways as you scroll down
   The section pins (sticky stage) for one stretch of scroll per card. Each
   card slides in from the right and comes to rest at the front, on top of
   the one before (which sinks back into shade), while the window cut into
   its slab opens until the portrait fills it. Each card rests at the front
   for a moment before the next one comes. The names on the left follow
   along; clicking one scrolls the page to that card.
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
  function draw() {
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
    var front = clamp(Math.round(pos), 0, n - 1);
    if (front !== current) {
      current = front;
      names.forEach(function (b, k) {
        if (k === front) b.setAttribute("aria-current", "true");
        else b.removeAttribute("aria-current");
      });
    }
  }

  /* Light smoothing so the row glides; stops once it has caught up */
  function frame(now) {
    var dt = Math.min(64, now - (last || now));
    last = now;
    var k = 1 - Math.exp(-dt / 90);
    pos += (target - pos) * k;
    intro += (introTarget - intro) * k;
    if (Math.abs(target - pos) < 0.0005 && Math.abs(introTarget - intro) < 0.001) {
      pos = target;
      intro = introTarget;
      raf = 0;
      last = 0;
    } else {
      raf = requestAnimationFrame(frame);
    }
    draw();
  }
  function onScroll() {
    if (!on) return;
    read();
    if (!raf) raf = requestAnimationFrame(frame);
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
      draw();
    } else {
      team.style.removeProperty("--team-travel");
      if (more) more.style.transform = "";
      items.forEach(function (item) {
        item.style.transform = "";
        item.style.opacity = "";
        ["--a", "--t", "--o", "--d"].forEach(function (p) { item.style.removeProperty(p); });
      });
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
  names.forEach(function (b) {
    b.addEventListener("click", function () { scrollToCard(+b.getAttribute("data-team-go")); });
  });

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
  window.addEventListener("resize", function () { if (on) { measure(); onScroll(); } });
  [desktop, reduced].forEach(function (mq) {
    if (mq.addEventListener) mq.addEventListener("change", update);
    else if (mq.addListener) mq.addListener(update);
  });
  update();
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(function () { if (on) { measure(); draw(); } });
})();
