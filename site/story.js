/* ==========================================================================
   Our story: the pinned photo that turns over (component: story-card)
   Layout after the user's process-section reference video, where a big step
   number turned on its vertical axis whenever the next step arrived. Here the
   photo does: the step whose content is nearest the middle of the screen (where
   the photo is pinned) owns the photo, so the card turns as soon as the next
   step comes up past the halfway point between two steps. Four steps, four
   photos. As in the What We Do section, each step is a screen tall with its
   content centred in it (story.css), so one step sits beside the photo at a time.

   Why "nearest the middle" and not "once the content reaches the photo's
   centre": that rule turned late, and if you stopped scrolling a little short
   of the centre it did not turn at all; on the last step it only turned as the
   card was already scrolling away (the user saw both, Nov 2026). Now every
   resting position shows the photo of the step beside it.

   The turn is quick (450 ms) and starts at once: every photo is loaded and
   decoded up front, and after a turn the two faces trade places instead of
   swapping photos, so nothing waits for an image. If the reader moves on while
   the card is still in the first half of a turn (the new photo not yet showing),
   the hidden face simply takes the newer photo, or the card turns back if the
   reader went back; otherwise it finishes and turns again to catch up.
   Scrolling back turns it the other way. Timed, not scrubbed, so the card never
   rests half turned. The turn is a Web Animations card.animate() with a
   per-turn token and a backup timer, never a CSS transition waiting for
   transitionend (an interrupted transition never fires it and the card froze).
   At rest the card has no transform, so the photo stays crisp; 3D only while
   turning. Reduced motion: the photo simply changes. Built to become a Framer
   code component (tools/framer-about.py carries the same code).
   ========================================================================== */
(function () {
  "use strict";

  var root = document.querySelector("[data-story]");
  var card = root && root.querySelector("[data-story-card]");
  if (!root || !card) return;

  var steps = Array.prototype.slice.call(root.querySelectorAll("[data-story-step]"));
  var srcs = steps.map(function (s) { return s.getAttribute("data-image") || ""; });
  var faceA = card.querySelector(".story__face--front");
  var faceB = card.querySelector(".story__face--back");
  var imgA = faceA && faceA.querySelector("img");
  var imgB = faceB && faceB.querySelector("img");
  if (!imgA || !imgB || !steps.length) return;
  var reduced = window.matchMedia("(prefers-reduced-motion: reduce)");

  // Load and decode every photo up front, so a turn starts at once and never shows a blank face
  srcs.forEach(function (src) {
    if (!src) return;
    var i = new Image();
    i.src = src;
    if (i.decode) i.decode().catch(function () {});
  });

  // The face showing (up) and the one facing away (down). They trade places after each turn.
  var up = { face: faceA, img: imgA }, down = { face: faceB, img: imgB };
  function place() {
    up.face.style.transform = "none";
    down.face.style.transform = "rotateY(180deg)";
  }
  place();

  var shown = 0;      // the step whose photo is showing
  var target = 0;     // the step whose photo should show
  var next = 0;       // the step the card is turning to
  var busy = false, token = 0, anim = null;
  var TURN_MS = 450, EASE = "cubic-bezier(0.4, 0, 0.2, 1)";
  var SLACK = 12;     // px: a resting scroll position right at the halfway point never wobbles

  // Middle of a step's content (its head and its points), wherever the step's box ends
  function centreOf(s) {
    var head = s.querySelector(".story-step__head") || s;
    var pts = s.querySelector(".story-step__points") || head;
    return (head.getBoundingClientRect().top + pts.getBoundingClientRect().bottom) / 2;
  }

  // The step whose content is nearest the middle of the screen
  function activeStep() {
    var mid = window.innerHeight * 0.5;
    var d = steps.map(function (s) { return Math.abs(centreOf(s) - mid); });
    var k = 0;
    for (var i = 1; i < d.length; i++) if (d[i] < d[k]) k = i;
    if (k !== target && d[target] - d[k] < SLACK) return target;
    return k;
  }

  // Resolves once the photo can be drawn (or after a short wait, never later)
  function ready(img) {
    return new Promise(function (resolve) {
      var t = setTimeout(resolve, 150);
      var done = function () { clearTimeout(t); resolve(); };
      if (img.decode) img.decode().then(done, done); else done();
    });
  }

  function settle(t) {
    if (t !== token || !busy) return;
    token++;
    if (anim) { anim.cancel(); anim = null; }    // drop the transform
    card.classList.remove("is-turning");
    if (next !== shown) {
      // The face that turned to us keeps showing: the faces trade places in the same frame
      // as the card drops its transform, so nothing flashes and nothing waits for a photo
      var was = up; up = down; down = was;
      place();
      shown = next;
    }
    busy = false;
    turn();                                     // catch up if the reader has moved on meanwhile
  }

  function turn() {
    if (busy || target === shown) return;
    if (reduced.matches || !card.animate) { up.img.src = srcs[target]; shown = target; return; }
    busy = true;
    next = target;
    var t = ++token;
    down.img.src = srcs[next];
    ready(down.img).then(function () {
      if (t !== token) return;
      if (target === shown) { busy = false; return; }   // the reader went back before it began
      if (target !== next) { next = target; down.img.src = srcs[next]; }
      card.classList.add("is-turning");
      // forwards turns to the left, backwards to the right
      anim = card.animate(
        [{ transform: "rotateY(0deg)" }, { transform: "rotateY(" + (next > shown ? -180 : 180) + "deg)" }],
        { duration: TURN_MS, easing: EASE, fill: "forwards" }
      );
      var end = function () { settle(t); };
      anim.finished.then(end, end);
      setTimeout(end, TURN_MS * 2 + 300);
    });
  }

  // The reader moved on during a turn. While the new photo is still facing away (the first half),
  // the hidden face takes the newer photo if it lies the same way round, or the card turns back
  // if the reader returned to the photo already showing. Later in the turn it finishes and catches up.
  function retarget() {
    if (!anim || target === next || anim.playbackRate < 0) return;
    var timing = anim.effect && anim.effect.getComputedTiming();
    if (!timing || (timing.progress || 0) >= 0.5) return;
    if (target === shown) {
      next = shown;
      anim.reverse();
    } else if ((target > shown) === (next > shown)) {
      next = target;
      down.img.src = srcs[next];
    }
  }

  var queued = false;
  function update() {
    queued = false;
    if (!card.offsetParent) return;   // the card is hidden
    target = activeStep();
    retarget();
    turn();
  }
  function request() {
    if (!queued) { queued = true; requestAnimationFrame(update); }
  }
  window.addEventListener("scroll", request, { passive: true });
  window.addEventListener("resize", request);
  window.addEventListener("load", request);
  update();
})();
