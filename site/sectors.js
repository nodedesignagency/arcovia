/* ==========================================================================
   Arcovia — sectors line (Home, block 9): a slow marquee.
   Repeats the list until it fills the width and moves it left at a calm,
   steady pace. Under the pointer it slows to a stop, so a sector can be
   read; while the page scrolls it picks up a little, then settles back.
   Pauses off-screen and in hidden tabs. With reduced motion it stands still.
   Review switch: ?sectors=band shows the charcoal band instead of the
   debossed line.
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
  var SPEED = 44;            // css px per second at rest
  var x = 0;                 // track offset, css px (0 … -loop)
  var loop = 0;              // width of one list, separator included
  var speed = SPEED;
  var boost = 0;             // extra speed from scrolling, decays
  var hover = false;
  var visible = false;
  var running = false;
  var last = 0;

  function build() {
    track.querySelectorAll("[data-clone]").forEach(function (n) { n.remove(); });
    var still = reduced.matches;
    root.classList.toggle("is-static", still);
    if (still) { track.style.transform = ""; stop(); return; }
    // Fractional width, so the copy lines up to the sub-pixel when the loop wraps
    loop = list.getBoundingClientRect().width;
    if (loop < 1) return;
    var copies = Math.ceil(viewport.clientWidth / loop) + 1;
    for (var i = 0; i < copies; i++) {
      var c = list.cloneNode(true);
      c.setAttribute("aria-hidden", "true");
      c.setAttribute("data-clone", "");
      track.appendChild(c);
    }
    x = ((x % loop) - loop) % loop;
    paint();
    start();
  }

  function paint() {
    track.style.transform = "translate3d(" + x.toFixed(2) + "px, 0, 0)";
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
})();
