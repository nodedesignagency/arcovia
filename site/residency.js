/* ==========================================================================
   Arcovia — the Residency Program (Team, block 5).
   Two versions for the user to compare: A, "Invitation" (default) and B,
   "Panel" (?residency=panel). This only switches to B and, there, carves
   the A-mark into the charcoal panel with concrete.js (plain material, a
   slow soft light drifting across it, a faint light under the pointer).
   Once a version is chosen, drop the other (and this switch).
   ========================================================================== */
(function () {
  "use strict";

  var invitation = document.querySelector("[data-residency]");
  var panel = document.querySelector("[data-residency-panel]");
  if (!invitation || !panel) return;
  if (new URLSearchParams(location.search).get("residency") !== "panel") return;

  invitation.hidden = true;
  invitation.removeAttribute("id");
  panel.hidden = false;
  panel.id = "residency";

  var card = panel.querySelector(".residency-panel__card");
  if (!card || !window.ConcreteSurface) return;

  var surface = new window.ConcreteSurface(card, {
    canvas: ".residency-panel__canvas",
    plain: true,
    albedo: 0.31,     // the flat ground lands on --color-charcoal-deep (#3e3e3e)
    sun: 0.26,        // a slow soft band of light drifting across the panel
    cursor: 0.1,
    bevel: 2.4        // a very large mark: wide walls, so it reads as a deep cut (as The mark)
  });
  window.arcoviaResidency = surface;
  surface.init().then(function (ok) {
    if (ok) card.classList.add("is-live");
  });
})();
