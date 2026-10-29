/* ==========================================================================
   Team: portrait cards in a row that moves sideways as you scroll down
   The section pins (sticky stage) for one stretch of scroll per card. Each
   card slides in from the right and comes to rest at the front, on top of
   the one before (which sinks back into shade), while the window cut into
   its slab opens until only a thin concrete frame is left. Each card rests
   at the front for a moment before the next one comes. The last stop is a
   black card leading on to the Team page, in two versions while exploring
   (?more=b shows B); it builds in once it is in view beside the last person.
   The names on the left hang on one line in groups (after a timeline
   reference the user sent): group names on the outer line, people one step
   in, the line curving between them. The person under the cursor, or else
   the one at the front, is selected: pill, ink dot with a glow, and the
   line leading into their dot in ink. "See other members", the last stop,
   sits back on the outer line. Clicking a name scrolls the page to that card.
   Every frame comes from the scroll position alone (with light smoothing),
   so scrolling back up plays it in reverse. Desktop only (≥1200px), and not
   with reduced motion: there the row simply scrolls sideways on its own.
   Built to become a Framer code component.
   ========================================================================== */
(function () {
  "use strict";

  var team = document.querySelector("[data-team]");
  if (!team) return;
  // Draft: two versions of the last card while exploring; ?more=b shows B, else A
  var pick = /[?&]more=b\b/.test(location.search) ? "b" : "a";
  Array.prototype.forEach.call(team.querySelectorAll("[data-more]"), function (li) {
    if (li.getAttribute("data-more") === pick) li.hidden = false;
    else li.parentNode.removeChild(li);
  });
  Array.prototype.forEach.call(team.querySelectorAll("[data-more-link]"), function (a) {
    a.classList.toggle("is-current", a.getAttribute("data-more-link") === pick);
  });
  var stage = team.querySelector(".team__stage");
  var viewport = team.querySelector(".team__viewport");
  var items = Array.prototype.slice.call(team.querySelectorAll(".team__item"));
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
  var current = -1;       // the person at the front
  var still = 0;          // without the pinned row: the card scrolled to
  var hover = -1;         // name under the cursor or keyboard focus, -1 for none
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
      // Once the next card fully covers it, fade it out so its shadow doesn't show round
      // the edges of the one on top (it stays focusable)
      var gone = smooth(0.85, 1, past);
      item.style.opacity = gone ? (1 - gone).toFixed(3) : "";
    });
    setFront(Math.round(pos));
    // The last card builds in once it is fully in view, beside the last person
    showMore(pos > n - 2.2);
  }

  /* ---------- Names: groups on one line ---------- */
  var NS = "http://www.w3.org/2000/svg";
  var OUTER = 6, INNER = 24;      // x of the group names' dots and the people's dots
  var people = [];                // per person: where their dot sits, their dot and lead-in
  var glow = null;
  var selected = -1;

  function el(parent, tag, attrs) {
    var e = document.createElementNS(NS, tag);
    for (var a in attrs) e.setAttribute(a, attrs[a]);
    return parent.appendChild(e);
  }
  // Straight on, or an S-curve where the line steps between the two columns
  function seg(p, q) {
    if (p.x === q.x) return "L" + q.x + " " + q.y;
    var mid = (p.y + q.y) / 2;
    return "C" + p.x + " " + mid + " " + q.x + " " + mid + " " + q.x + " " + q.y;
  }

  // Lay the line out from where the rows actually sit (again after fonts load and on resize)
  function layoutNames() {
    if (!line || !list) return;
    while (line.firstChild) line.removeChild(line.firstChild);
    var nodes = Array.prototype.map.call(list.querySelectorAll(".team__group-name, .team__name"), function (row) {
      var person = row.classList.contains("team__name");
      var inner = person && !row.classList.contains("team__name--more");
      return { person: person, x: inner ? INNER : OUTER, y: row.offsetTop + row.offsetHeight / 2, top: row.offsetTop };
    });
    if (!nodes.length) return;
    var defs = el(line, "defs", {});
    var d = "M" + nodes[0].x + " " + nodes[0].y;
    for (var i = 1; i < nodes.length; i++) d += seg(nodes[i - 1], nodes[i]);
    el(line, "path", { "class": "rail", d: d });

    people = [];
    nodes.forEach(function (node, i) {
      if (!node.person) return;
      var k = people.length;
      var prev = nodes[i - 1];
      // The stretch of line leading into this person: faint at the row above, full at the dot
      var g = el(defs, "linearGradient", { id: "team-lead-" + k, gradientUnits: "userSpaceOnUse", x1: 0, y1: prev.y, x2: 0, y2: node.y });
      el(g, "stop", { offset: "0", "stop-opacity": "0.25" });
      el(g, "stop", { offset: "1", "stop-opacity": "1" });
      node.lead = el(line, "path", { "class": "lead", d: "M" + prev.x + " " + prev.y + seg(prev, node), stroke: "url(#team-lead-" + k + ")" });
      people.push(node);
    });
    glow = el(line, "circle", { "class": "glow", r: "8", cx: "0", cy: "0" });
    nodes.forEach(function (node) {
      var dot = el(line, "circle", { "class": "dot", cx: node.x, cy: node.y, r: node.x === INNER ? 3.5 : 3.75 });
      if (node.person) node.dot = dot;
    });
    list.classList.add("is-drawn");
    var keep = selected;
    selected = -1;
    select(keep < 0 ? Math.max(current, 0) : keep, true);
  }

  function select(k, instant) {
    if (!people.length) return;
    k = clamp(k, 0, people.length - 1);
    if (k === selected) return;
    selected = k;
    people.forEach(function (p, i) {
      p.lead.classList.toggle("is-on", i === k);
      p.dot.classList.toggle("is-on", i === k);
    });
    names.forEach(function (b, i) { b.classList.toggle("is-selected", i === k); });
    var p = people[k];
    var moving = [glow, pill].filter(Boolean);
    if (instant) moving.forEach(function (e) { e.style.transition = "none"; });
    glow.style.transform = "translate(" + p.x + "px," + p.y + "px)";
    if (pill) pill.style.transform = "translate3d(0," + (p.top + 3) + "px,0)";
    if (instant) {
      // Let the jump land before the transitions come back
      void list.offsetHeight;
      moving.forEach(function (e) { e.style.transition = ""; });
    }
  }
  // The name under the cursor wins; otherwise the person at the front
  function refreshNames() { select(hover >= 0 ? hover : current); }

  function setFront(k) {
    k = clamp(k, 0, n - 1);
    if (k === current) return;
    current = k;
    names.forEach(function (b, i) {
      if (i === k) b.setAttribute("aria-current", "true");
      else b.removeAttribute("aria-current");
    });
    refreshNames();
  }

  /* ---------- Last card: builds in once it is in view beside the last person ----------
     The tiles settle one after another (CSS, on .is-in) and the team count runs up.
     Going away it clears quickly, ready to build in again. */
  var moreCard = team.querySelector(".team-more");
  var countEl = moreCard && moreCard.querySelector("[data-count]");
  var countTo = countEl ? +countEl.getAttribute("data-count") : 0;
  var shown = null, countRaf = 0;
  function showMore(v) {
    v = !!v;
    if (!moreCard || v === shown) return;
    shown = v;
    moreCard.classList.toggle("is-in", v);
    if (!countEl) return;
    cancelAnimationFrame(countRaf);
    if (!v || reduced.matches) { countEl.textContent = v ? countTo : 0; return; }
    var t0 = 0;
    countRaf = requestAnimationFrame(function run(now) {
      if (!t0) t0 = now;
      var u = clamp((now - t0 - 150) / 900, 0, 1);
      countEl.textContent = Math.round(countTo * (1 - Math.pow(1 - u, 3)));
      if (u < 1) countRaf = requestAnimationFrame(run);
    });
  }
  // Without the pinned row: build in once the card scrolls into view
  if (moreCard && "IntersectionObserver" in window) {
    new IntersectionObserver(function (entries) {
      if (!on && !reduced.matches) showMore(entries[0].isIntersecting);
    }, { threshold: 0.6 }).observe(moreCard);
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
    drawCards();
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
      drawCards();
    } else {
      team.style.removeProperty("--team-travel");
      items.forEach(function (item) {
        item.style.transform = "";
        item.style.opacity = "";
        ["--a", "--t", "--o", "--d"].forEach(function (p) { item.style.removeProperty(p); });
      });
      setFront(still);
    }
    // Start the last card as it should be: built in if it is already in view
    shown = null;
    showMore(v ? pos > n - 2.2 : reduced.matches);
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
    // Hovering (or tabbing onto) a name selects it while the pointer or focus is there
    b.addEventListener("pointerenter", function () { hover = k; refreshNames(); });
    b.addEventListener("focus", function () { if (b.matches(":focus-visible")) { hover = k; refreshNames(); } });
    b.addEventListener("blur", function () { if (hover === k) { hover = -1; refreshNames(); } });
  });
  if (list) list.addEventListener("pointerleave", function () { hover = -1; refreshNames(); });

  // Without the pinned row the cards scroll sideways; the names follow that instead
  viewport.addEventListener("scroll", function () {
    if (on) return;
    var w = items[1].offsetLeft - items[0].offsetLeft;
    still = clamp(Math.round(viewport.scrollLeft / w), 0, n - 1);
    setFront(still);
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
  window.addEventListener("resize", function () { layoutNames(); if (on) { measure(); onScroll(); } });
  [desktop, reduced].forEach(function (mq) {
    if (mq.addEventListener) mq.addEventListener("change", update);
    else if (mq.addListener) mq.addListener(update);
  });
  layoutNames();
  update();
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(function () {
    layoutNames();
    if (on) { measure(); drawCards(); }
  });
})();
