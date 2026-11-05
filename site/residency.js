/* ==========================================================================
   Arcovia — the Residency Program (Team, block 5): four cast-concrete slabs.
   Each slab ([data-residency-slab]) gets its own ConcreteSurface with the
   cast concrete of the Home team cards (assets/concrete-cast.jpg), and
   carves what it holds exactly like the hero: the field's words
   (data-carve="text") or the official A-mark (data-carve="mark"). A slow,
   faint band of light drifts over each slab at its own pace, and a soft
   light follows the pointer. Paused off-screen; one still frame with
   reduced motion; without WebGL the CSS slabs stay.
   Built to become a Framer code component (props: fields, texture, light).
   ========================================================================== */
(function () {
  "use strict";

  if (!window.ConcreteSurface) return;
  var slabs = document.querySelectorAll("[data-residency-slab]");
  var periods = [38, 44, 50, 56];   // each slab's light drifts at its own pace, so they never move as one
  window.arcoviaResidency = [];

  Array.prototype.forEach.call(slabs, function (slab, i) {
    var mark = slab.classList.contains("residency__slab--mark");
    var surface = new window.ConcreteSurface(slab, {
      canvas: ".residency__canvas",
      texture: "assets/concrete-cast.jpg",
      textureSize: 960,             // the same scale as the Home team cards
      sun: 0.16,
      period: periods[i % periods.length],
      cursor: 0.18,
      tone: 1.17,                   // lifts the cast concrete to the Home team cards' grey (~#c4c4c4)
      vignette: 0.05,
      bevel: mark ? 1.6 : 1.1       // the mark is larger: wider walls, a deeper cut
    });
    window.arcoviaResidency.push(surface);
    surface.init().then(function (ok) {
      if (ok) slab.classList.add("is-live");
    });
  });
})();
