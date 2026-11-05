/* ==========================================================================
   What We Do, block 4: "How a mandate runs" (SECTION:mandate)
   After the user's reference: as each card comes up the screen it slides in
   from the right and brightens from dim to full. Scroll-linked, so it runs
   back when scrolling up and fast scrolling settles exactly: a card starts
   as its top enters the bottom of the screen and has arrived by the time its
   top is 45% of the way up. At rest a card has no transform or opacity, so
   its text and image stay crisp.
   Off with reduced motion and below 1200 (desktop first): the cards simply sit.
   ========================================================================== */
(function () {
  "use strict";

  var section = document.querySelector("[data-mandate]");
  if (!section) return;
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  if (window.matchMedia("(max-width: 1199px)").matches) return;

  var cards = Array.prototype.slice.call(section.querySelectorAll(".mandate-card"));
  if (!cards.length) return;

  var SHIFT = 96;      // px to the right at the start
  var DIM = 0.22;      // opacity at the start
  function clamp(v, a, b) { return Math.min(b, Math.max(a, v)); }
  function easeOut(t) { return 1 - Math.pow(1 - t, 3); }

  var state = cards.map(function () { return -1; });
  var queued = false;
  function render() {
    queued = false;
    var vh = window.innerHeight;
    var from = vh, to = vh * 0.45;
    cards.forEach(function (card, i) {
      // the card's own place in the page (its li), so its transform doesn't feed back
      var top = card.parentNode.getBoundingClientRect().top;
      var e = easeOut(clamp((from - top) / (from - to), 0, 1));
      var q = Math.round(e * 400) / 400;
      if (q === state[i]) return;
      state[i] = q;
      if (q >= 1) {
        card.style.transform = "";
        card.style.opacity = "";
      } else {
        card.style.transform = "translate3d(" + ((1 - q) * SHIFT).toFixed(1) + "px,0,0)";
        card.style.opacity = (DIM + (1 - DIM) * q).toFixed(3);
      }
    });
  }
  function queue() {
    if (queued) return;
    queued = true;
    requestAnimationFrame(render);
  }
  window.addEventListener("scroll", queue, { passive: true });
  window.addEventListener("resize", queue);
  render();
})();
