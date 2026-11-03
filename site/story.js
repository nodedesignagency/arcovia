/* ==========================================================================
   Our story: the pinned photo that turns over (component: story-card)
   Layout after the user's process-section reference video, where a big step
   number turned on its vertical axis whenever the next step arrived. Here the
   photo does: once a step's content reaches the centre of the photo (the
   middle of the screen), the card turns over (front: the photo shown now,
   back: the step's photo). Four steps, four photos. As in the What We Do
   section, each step is as tall as the photo with its content centred in it
   (story.css), so one step sits beside the photo at a time.
   Scrolling back turns it back the other way. Timed, not scrubbed, so the
   card never rests half turned; if several steps go by during one turn, it
   turns again to catch up (fast scrolling included: see turn()). After each turn the new photo moves to the front
   and the card drops its transform, so at rest the photo stays crisp.
   Reduced motion: the photo simply changes. Below 1200 the card is hidden
   (each step shows its own photo) and this does nothing. Built to become a
   Framer code component.
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

  var shown = 0, target = 0, turning = false, token = 0, anim = null;
  var TURN_MS = 700, EASE = "cubic-bezier(0.65, 0, 0.35, 1)";

  // The last step whose content has reached the photo's centre. The card is pinned in the
  // middle of the screen, so that is the screen's middle; each step's content is centred in
  // its own box, so the box's centre is the content's.
  function activeStep() {
    var mid = window.innerHeight * 0.5, k = 0;
    steps.forEach(function (s, i) {
      var r = s.getBoundingClientRect();
      if (r.top + r.height / 2 <= mid + 1) k = i;
    });
    return k;
  }

  // Resolves once the photo can be drawn (or after a short wait, never later)
  function ready(img) {
    return new Promise(function (resolve) {
      var t = setTimeout(resolve, 250);
      var done = function () { clearTimeout(t); resolve(); };
      if (img.decode) img.decode().then(done, done); else done();
    });
  }

  /* The turn is a self-timed animation (Web Animations), not a CSS transition: a transition
     that gets interrupted never reports that it ended, and when you scrolled fast the card
     waited for that report forever and stopped turning. Each turn has a token, and a timer
     backs up the animation's own end, so a turn always finishes, exactly once. */
  function settle(t, next) {
    if (t !== token || !turning) return;
    token++;
    front.src = srcs[next];
    ready(front).then(function () {
      if (anim) { anim.cancel(); anim = null; }   // drop the transform: the new photo is in front now
      card.classList.remove("is-turning");
      shown = next;
      turning = false;
      turn();                                     // catch up if the reader has moved on meanwhile
    });
  }

  function turn() {
    if (turning || target === shown) return;
    var next = target;
    if (reduced.matches || !card.animate) { front.src = srcs[next]; shown = next; return; }
    turning = true;
    var t = token;
    back.src = srcs[next];
    ready(back).then(function () {
      if (t !== token) return;
      card.classList.add("is-turning");
      // forwards turns to the left, backwards to the right
      anim = card.animate(
        [{ transform: "rotateY(0deg)" }, { transform: "rotateY(" + (next > shown ? -180 : 180) + "deg)" }],
        { duration: TURN_MS, easing: EASE, fill: "forwards" }
      );
      anim.finished.then(function () { settle(t, next); }, function () { settle(t, next); });
      setTimeout(function () { settle(t, next); }, TURN_MS + 400);
    });
  }

  var queued = false;
  function update() {
    queued = false;
    if (!card.offsetParent) return;               // below 1200 the card is hidden: each step shows its own photo
    target = activeStep();
    turn();
  }
  window.addEventListener("scroll", function () {
    if (!queued) { queued = true; requestAnimationFrame(update); }
  }, { passive: true });
  window.addEventListener("resize", update);
  update();
})();
