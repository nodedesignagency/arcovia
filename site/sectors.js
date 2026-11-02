/* ==========================================================================
   Arcovia — sectors line (Home, block 9): a slow marquee.
   Moves the line left at a calm, steady pace. Under the pointer it slows to
   a stop, so a sector can be read; while the page scrolls it picks up a
   little, then settles back. Pauses off-screen and in hidden tabs. With
   reduced motion it stands still.

   carved (default): a ConcreteSurface with the plain material carves the
   seams, tie holes and the line exactly like the hero. The line is carved
   once into a strip (concrete.js, [data-carve-slide]) and only its offset
   changes each frame; the DOM line stays still and transparent, for screen
   readers and for measuring. Without WebGL the DOM line itself moves, with
   copies to fill the width and the SVG deboss filter.
   band (?sectors=band): the DOM line moves on a charcoal band.
   Built to become a Framer code component (props: speed, variant).
   ========================================================================== */
(function () {
  "use strict";

  var root = document.querySelector("[data-sectors]");
  if (!root) return;

  var variant = (location.search.match(/[?&]sectors=(\w+)/) || [])[1] || root.getAttribute("data-variant") || "carved";
  root.setAttribute("data-variant", variant);
  // Only the charcoal band is dark under the header
  var band = root.querySelector(".sectors__band");
  if (variant === "band" && band) band.setAttribute("data-header-theme", "dark");

  var viewport = root.querySelector(".sectors__viewport");
  var track = root.querySelector("[data-sectors-track]");
  var list = track && track.querySelector(".sectors__list");
  if (!viewport || !list) return;

  var reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
  var SPEED_BASE = 44;       // css px per second at rest, for the 60px desktop line
  var SPEED = SPEED_BASE;    // in step with the type size (build), so it feels as calm at any size
  var x = 0;                 // offset, css px (0 … -loop)
  var loop = 0;              // width of one list, separator included
  var speed = SPEED;
  var boost = 0;             // extra speed from scrolling, decays
  var hover = false;
  var visible = false;
  var running = false;
  var last = 0;
  var surface = null;        // the live carving, once WebGL is up

  function build() {
    track.querySelectorAll("[data-clone]").forEach(function (n) { n.remove(); });
    var still = reduced.matches;
    root.classList.toggle("is-static", still);
    // Standing still, the line wraps and is carved in place; moving, it is carved into the sliding strip
    if (still) list.removeAttribute("data-carve-slide"); else list.setAttribute("data-carve-slide", "");
    if (surface) surface.queueLayout();
    if (still) { track.style.transform = ""; stop(); return; }
    // The pace follows the type size: 44 px/s at 60px, about 23 px/s for the 32px phone line
    var item = list.querySelector(".sectors__item");
    var fs = item ? parseFloat(getComputedStyle(item).fontSize) : 60;
    SPEED = SPEED_BASE * Math.max(0.5, Math.min(1, (fs || 60) / 60));
    // Fractional width, so the loop wraps to the sub-pixel
    loop = list.getBoundingClientRect().width;
    if (loop < 1) return;
    if (!surface) {
      // Without the live surface the DOM line moves, with copies to fill the width
      var copies = Math.ceil(viewport.clientWidth / loop) + 1;
      for (var i = 0; i < copies; i++) {
        var c = list.cloneNode(true);
        c.setAttribute("aria-hidden", "true");
        c.setAttribute("data-clone", "");
        c.removeAttribute("data-carve-slide");
        c.querySelectorAll("[data-carve]").forEach(function (n) { n.removeAttribute("data-carve"); });
        track.appendChild(c);
      }
    }
    x = ((x % loop) - loop) % loop;
    paint();
    start();
  }

  function paint() {
    if (surface) {
      track.style.transform = "";
      surface.setSlide(-x);
    } else {
      track.style.transform = "translate3d(" + x.toFixed(2) + "px, 0, 0)";
    }
  }

  function frame(now) {
    if (!running) return;
    var dt = Math.min(0.05, (now - (last || now)) / 1000);
    last = now;
    var target = hover ? 0 : SPEED * (1 + boost);
    // Ease towards the target: a gentle stop under the pointer, a softer pick-up after
    speed += (target - speed) * (1 - Math.exp(-dt * (hover ? 4 : 2.2)));
    boost *= Math.exp(-dt * 1.8);
    x -= speed * dt;
    if (x <= -loop) x += loop;
    paint();
    requestAnimationFrame(frame);
  }

  function start() {
    if (running || !visible || document.hidden || reduced.matches || loop < 1) return;
    running = true;
    last = 0;
    requestAnimationFrame(frame);
  }
  function stop() { running = false; }

  new IntersectionObserver(function (entries) {
    visible = entries[0].isIntersecting;
    if (visible) start(); else stop();
  }, { rootMargin: "120px 0px" }).observe(root);

  document.addEventListener("visibilitychange", function () { if (document.hidden) stop(); else start(); });

  // Slow to a stop under a mouse pointer (touch would leave it stuck)
  viewport.addEventListener("pointerenter", function (e) { if (e.pointerType === "mouse") hover = true; });
  viewport.addEventListener("pointerleave", function () { hover = false; });

  // Scrolling nudges it along: a little faster, never backwards
  var lastY = window.scrollY;
  window.addEventListener("scroll", function () {
    var dy = Math.abs(window.scrollY - lastY);
    lastY = window.scrollY;
    if (running) boost = Math.min(2.4, Math.max(boost, dy / 14));
  }, { passive: true });

  var queued = false;
  function rebuild() {
    if (queued) return;
    queued = true;
    requestAnimationFrame(function () { queued = false; build(); });
  }
  window.addEventListener("resize", rebuild);
  if (reduced.addEventListener) reduced.addEventListener("change", rebuild);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(rebuild);
  build();

  // The carved version: carve it into a plain neutral surface, exactly like the hero
  if (variant !== "band" && window.ConcreteSurface && root.querySelector(".sectors__canvas")) {
    var s = new window.ConcreteSurface(root, {
      canvas: ".sectors__canvas",
      plain: true,
      albedo: 1.21,   // the flat ground lands on --color-neutral (#efefee)
      sun: 0,         // no drifting sunlight: the ground stays perfectly flat; the rims come from the sky light
      cursor: 0.06    // a faint light that follows the pointer
    });
    window.arcoviaSectors = s;
    s.init().then(function (ok) {
      if (!ok) return;
      surface = s;
      root.classList.add("is-live");
      build();
    });
  }
})();
