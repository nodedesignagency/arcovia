/* ==========================================================================
   Arcovia — closing (Home, block 10): the deck's closing slide.
   Live concrete with the A-mark carved large (concrete.js). As the section
   comes up, the mark is pressed into the slab like a seal: flush as it
   enters at the bottom of the screen, fully carved by the time it comes to
   rest. Scroll-linked, so it lifts back out if you scroll up. With reduced
   motion it is carved from the start.
   Built to become a Framer code component (with the concrete).
   ========================================================================== */
(function () {
  "use strict";

  // The host is the slab that runs behind the sectors line and the closing
  var host = document.querySelector("[data-closing]");
  if (!host || !window.ConcreteSurface) return;
  var mark = host.querySelector(".closing__mark");
  var reduced = window.matchMedia("(prefers-reduced-motion: reduce)");

  var surface = new window.ConcreteSurface(host, { canvas: ".closing-wall__canvas" });
  window.arcoviaClosing = surface;

  // 0 while the mark's top edge enters at the bottom of the screen, 1 once its centre is two thirds
  // of the way down (so where the page ends and the closing comes to rest, it is always fully carved)
  function depth() {
    if (reduced.matches || !mark) return 1;
    var r = mark.getBoundingClientRect();
    var vh = window.innerHeight;
    var p = Math.max(0, Math.min(1, (vh - r.top) / (vh * 0.34 + r.height / 2)));
    return p * p * (3 - 2 * p);
  }

  var queued = false;
  function update() {
    queued = false;
    surface.setMarkDepth(depth());
  }
  function queue() {
    if (queued) return;
    queued = true;
    requestAnimationFrame(update);
  }

  surface.markDepth = depth();
  surface.init().then(function (ok) {
    if (!ok) return;
    host.classList.add("is-live");
    update();
    window.addEventListener("scroll", queue, { passive: true });
    window.addEventListener("resize", queue);
    if (reduced.addEventListener) reduced.addEventListener("change", queue);
  });
})();
