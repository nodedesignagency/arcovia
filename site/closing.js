/* ==========================================================================
   Arcovia — closing (Home, block 10): the CTA's sunrise wall.
   A ConcreteSurface on the CTA box with the wall photo (assets/cta-wall.jpg)
   mapped once over it: a beam of sunlight rises to the right and sweeps
   across the wall and back every 18 s (easing at both ends), with a faint
   glow either side and fine dust turning in it; it dims behind the text.
   The official lockup is carved into the wall, so the beam catches its walls
   as it passes, and it is pressed in as the box comes up: flush as it enters
   at the bottom of the screen, fully carved by the time it comes to rest
   (scroll-linked, so it lifts back out if you scroll up).
   With reduced motion: the beam stands still across the lockup, carved.
   Built to become a Framer code component (props: beam angle, width,
   period, dust, light).
   ========================================================================== */
(function () {
  "use strict";

  var host = document.querySelector("[data-closing]");
  if (!host || !window.ConcreteSurface) return;
  var mark = host.querySelector(".closing__mark");
  var reduced = window.matchMedia("(prefers-reduced-motion: reduce)");

  var surface = new window.ConcreteSurface(host, {
    canvas: ".closing__canvas",
    texture: "assets/cta-wall.jpg",
    photo: true,
    albedo: 1,                  // the photo as it is
    vignette: 0.28,             // the wall falls into shade towards its edges, as in the social assets
    sun: 0.82,                  // the beam: bright, with the concrete still showing through
    cursor: 0.1,
    period: 18,                 // across and back, in seconds
    staticBand: 0.6,            // with reduced motion: across the lockup
    // rises to the right; fades in along its length, so it is full over the lockup and gone before the text
    beam: { angle: 22, width: 72, soft: 22, from: -330, to: 400, fadeFrom: -420, fadeTo: 60 },
    dust: 0.4,
    shade: ".closing__content", // and the wall is a little darker behind the text
    shadeStrength: 0.5,
    shadeFeather: 180,
    smooth: true
  });
  window.arcoviaClosing = surface;

  // 0 while the lockup's top edge enters at the bottom of the screen, 1 once its centre is two thirds
  // of the way down (so where the page comes to rest on the box, it is always fully carved)
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
