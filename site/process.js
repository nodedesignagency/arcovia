/* ==========================================================================
   How we work: the hairlines that draw in (component: process-list)
   After the user's reference video: as a row comes up the screen, the
   hairline across its top draws in from the left, and it is complete by the
   time the row is in the upper part of the screen. Scroll-linked, so it runs
   back when scrolling up. The stacking itself is plain CSS (sticky rows in
   process.css); this only sets --line on each row. Without JS, or with
   reduced motion, the lines are simply there. Built to become a Framer code
   component.
   ========================================================================== */
(function () {
  "use strict";

  var root = document.querySelector("[data-process]");
  if (!root) return;
  var rows = Array.prototype.slice.call(root.querySelectorAll(".process__row"));
  var reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
  var START = 0.92, END = 0.42;   // the line starts as the row's top passes 92% of the screen, done by 42%

  var queued = false, near = false;
  function update() {
    queued = false;
    if (reduced.matches || window.innerWidth < 1200) {
      rows.forEach(function (r) { r.style.removeProperty("--line"); });
      return;
    }
    var vh = window.innerHeight;
    rows.forEach(function (r) {
      var t = r.getBoundingClientRect().top;
      var p = (START * vh - t) / ((START - END) * vh);
      p = Math.max(0, Math.min(1, p));
      r.style.setProperty("--line", (1 - Math.pow(1 - p, 2)).toFixed(4));   // eases out as it finishes
    });
  }
  function queue() {
    if (!near || queued) return;
    queued = true;
    requestAnimationFrame(update);
  }

  new IntersectionObserver(function (entries) {
    near = entries[0].isIntersecting;
    queue();
  }, { rootMargin: "50% 0px" }).observe(root);
  window.addEventListener("scroll", queue, { passive: true });
  window.addEventListener("resize", function () { near = true; queue(); });
  if (reduced.addEventListener) reduced.addEventListener("change", update);
  near = true;
  update();
})();
