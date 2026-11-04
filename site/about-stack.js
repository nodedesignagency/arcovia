/* ==========================================================================
   About: the opening's scroll stack (after the Mahadeva template's About page).
   The opening (.about-hero) and Our story share one stack (.about-stack): the
   opening is pinned at the top (CSS: sticky) and Our story, with its own
   neutral ground, rides up over it instead of pushing it off. While it does,
   the opening's heading and line climb at a fifth of the scroll (the template's
   Framer Scroll Speed, 120%), so they stay ahead of the edge covering them a
   little longer. 2D transform only (a 3D one gets cached as a bitmap and blurs
   the type); at rest there is no transform at all. Once the opening is fully
   covered it is hidden and its concrete stops drawing, and both come back as
   soon as the edge moves down again. Reduced motion: no climb.
   ========================================================================== */
(function () {
  "use strict";

  var hero = document.querySelector(".about-stack > .about-hero");
  if (!hero) return;
  var inner = hero.querySelector(".about-hero__inner");
  var next = hero.nextElementSibling;
  if (!inner || !next) return;

  var RATE = 0.2; // the climb, as a share of the scroll (Scroll Speed 120%)
  var reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
  var queued = false;
  var hidden = false;

  function update() {
    queued = false;
    var h = hero.offsetHeight;
    // How much of the opening Our story covers: its top edge against the opening's bottom
    var covered = hero.getBoundingClientRect().bottom - next.getBoundingClientRect().top;
    covered = Math.max(0, Math.min(h, covered));

    inner.style.transform = reduced.matches || covered < 0.5 ? "" : "translateY(" + (-covered * RATE).toFixed(1) + "px)";

    var hide = covered >= h - 1;
    if (hide !== hidden) {
      hidden = hide;
      hero.style.visibility = hide ? "hidden" : "";
      if (window.arcoviaHero && window.arcoviaHero.setPaused) window.arcoviaHero.setPaused(hide);
    }
  }

  function queue() {
    if (queued) return;
    queued = true;
    requestAnimationFrame(update);
  }

  window.addEventListener("scroll", queue, { passive: true });
  window.addEventListener("resize", queue);
  if (typeof reduced.addEventListener === "function") reduced.addEventListener("change", queue);
  update();
})();
