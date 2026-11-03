/* ==========================================================================
   Our story: the pinned photo that turns over (component: story-card)
   Layout after the user's process-section reference video, where a big step
   number turned on its vertical axis whenever the next step arrived. Here the
   photo does: once a step crosses the middle of the screen, the card turns
   over (front: the photo shown now, back: the step's photo). Four steps, four
   photos.
   Scrolling back turns it back the other way. Timed, not scrubbed, so the
   card never rests half turned; if several steps go by during one turn, it
   turns again to catch up. After each turn the new photo moves to the front
   and the card drops its transform, so at rest the photo stays crisp.
   Reduced motion: the photo simply changes. Built to become a Framer code
   component.
   ========================================================================== */
(function () {
  "use strict";

  var root = document.querySelector("[data-story]");
  var card = root && root.querySelector("[data-story-card]");
  if (!root || !card) return;

  var steps = Array.prototype.slice.call(root.querySelectorAll("[data-story-step]"));
  var srcs = steps.map(function (s) { return s.getAttribute("data-image"); });
  var front = card.querySelector(".story__face--front img");
  var back = card.querySelector(".story__face--back img");
  var reduced = window.matchMedia("(prefers-reduced-motion: reduce)");

  // Load every photo up front, so a turn never shows a blank face
  srcs.forEach(function (src) { var i = new Image(); i.src = src; });

  var shown = 0, target = 0, turning = false, turningTo = 0;

  // The step whose top last crossed the middle of the screen
  function activeStep() {
    var mid = window.innerHeight * 0.5, k = 0;
    steps.forEach(function (s, i) { if (s.getBoundingClientRect().top < mid) k = i; });
    return k;
  }

  function settle(next) {
    front.src = srcs[next];
    var done = function () {
      card.classList.remove("is-turning");
      card.style.transform = "";
      shown = next;
      turning = false;
      turn();
    };
    if (front.decode) front.decode().then(done, done); else done();
  }

  function turn() {
    if (turning || target === shown) return;
    var next = target;
    if (reduced.matches) { front.src = srcs[next]; shown = next; return; }
    turning = true;
    turningTo = next;
    back.src = srcs[next];
    var go = function () {
      card.classList.add("is-turning");
      // forwards turns to the left, backwards to the right
      requestAnimationFrame(function () {
        card.style.transform = "rotateY(" + (next > shown ? -180 : 180) + "deg)";
      });
    };
    if (back.decode) back.decode().then(go, go); else go();
  }

  card.addEventListener("transitionend", function (e) {
    if (e.target !== card || e.propertyName !== "transform" || !turning) return;
    settle(turningTo);
  });

  var queued = false;
  function update() {
    queued = false;
    target = activeStep();
    turn();
  }
  window.addEventListener("scroll", function () {
    if (!queued) { queued = true; requestAnimationFrame(update); }
  }, { passive: true });
  window.addEventListener("resize", update);
  update();
})();
