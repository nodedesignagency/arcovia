/* ==========================================================================
   Arcovia — the Residency Program (Team, block 5): the debossed word.
   After the user's screen recording (a headline whose last word changes in
   a tag), in our debossed style: the field is carved into the neutral
   ground by concrete.js (plain material, as the sectors line), and every
   few seconds it rises flush into the surface, the line re-centres to the
   next field's width, and the next field presses in. The depth is
   data-carve-depth on the word (0 flush, 1 pressed in); recarve() redraws
   the height map each frame while it changes or moves.
   Runs only while the section is on screen and the tab is open; stands
   still on the first field with reduced motion. Without WebGL the word is
   pressed in with CSS and fades between fields.
   Built to become a Framer code component (props: names, hold).
   ========================================================================== */
(function () {
  "use strict";

  var head = document.querySelector("[data-residency-head]");
  if (!head) return;
  var slot = head.querySelector(".residency__slot");
  var word = head.querySelector(".residency__word");
  var reduced = window.matchMedia("(prefers-reduced-motion: reduce)");

  var NAMES = ["Venture capital", "Private equity", "Investment banking"];
  var HOLD = 2600;      // each field rests, pressed in
  var OUT = 420;        // rises flush (eases in: it stays legible, then sinks)
  var MOVE = 420;       // the line re-centres (the slot's CSS width transition)
  var IN_AT = OUT + MOVE * 0.5;   // the next field starts pressing in halfway through the move
  var IN = 650;         // and presses in
  var CYCLE = HOLD + IN_AT + IN;
  var index = 0;
  var surface = null;

  function easeIn(t) { return t * t; }
  function easeOut(t) { return 1 - Math.pow(1 - t, 3); }

  // Width of a field in the word's own font
  var probe = null;
  function widthOf(text) {
    if (!probe) {
      probe = document.createElement("span");
      probe.setAttribute("aria-hidden", "true");
      probe.style.cssText = "position:absolute;visibility:hidden;white-space:nowrap;left:0;top:0";
      slot.appendChild(probe);
    }
    probe.textContent = text;
    return probe.getBoundingClientRect().width;
  }
  function fit(instant) {
    if (instant) slot.style.transition = "none";
    slot.style.width = Math.ceil(widthOf(NAMES[index])) + "px";
    if (instant) { void slot.offsetWidth; slot.style.transition = ""; }
  }

  // v is how pressed in the word looks (0 flush, 1 fully carved). A carving looks almost full long
  // before it is fully deep (its rims are already there at half depth), so the depth follows v squared,
  // which spreads the visible change evenly over the motion.
  function depth(v) {
    word.setAttribute("data-carve-depth", (v * v).toFixed(3));
    if (surface) surface.recarve();
    else word.style.opacity = v;
  }

  // One swap: out, move, in. Every frame redraws the carving, since the word sinks and the line moves.
  var busy = false;
  function swap() {
    if (busy) return;
    busy = true;
    var t0 = performance.now();
    var switched = false;
    function tick(now) {
      var t = now - t0;
      // The switch happens on the first frame past the rise, even if a slow frame skipped the move
      if (t >= OUT && !switched) {
        switched = true;
        depth(0);
        index = (index + 1) % NAMES.length;
        word.textContent = NAMES[index];
        fit(false);
      }
      if (t < OUT) {
        depth(1 - easeIn(t / OUT));
      } else if (t < IN_AT) {
        if (surface) surface.recarve();   // the line is moving
      } else if (t < IN_AT + IN) {
        depth(easeOut((t - IN_AT) / IN));  // redraws too, so it follows the line while it still moves
      } else {
        depth(1);
        busy = false;
        return;
      }
      requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  }

  var timer = null;
  var visible = false;
  function update() {
    var run = visible && !document.hidden && !reduced.matches;
    if (run && !timer) timer = setInterval(swap, CYCLE);
    if (!run && timer) { clearInterval(timer); timer = null; }
  }

  fit(true);
  depth(1);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(function () { fit(true); if (surface) surface.recarve(); });
  window.addEventListener("resize", function () { fit(true); });

  if (window.ConcreteSurface) {
    var s = new window.ConcreteSurface(head, {
      canvas: ".residency__canvas",
      plain: true,
      albedo: 1.21,   // the flat ground lands on --color-neutral (#efefee), as the sectors line
      sun: 0,         // no drifting light: the ground stays perfectly flat; the rims come from the sky light
      cursor: 0       // none: a pointer light would show the canvas's edge on the open page
    });
    s.init().then(function (ok) {
      if (!ok) return;
      surface = s;
      head.classList.add("is-live");
      depth(1);
    });
  }

  if ("IntersectionObserver" in window) {
    new IntersectionObserver(function (entries) {
      visible = entries[0].isIntersecting;
      update();
    }, { threshold: 0.25 }).observe(head);
  } else {
    visible = true;
  }
  document.addEventListener("visibilitychange", update);
  if (reduced.addEventListener) reduced.addEventListener("change", update);
  update();

  // For checks: arcoviaResidency.swap() runs one change; .stop() holds it; .surface is the ground
  window.arcoviaResidency = {
    swap: swap,
    stop: function () { visible = false; update(); },
    get surface() { return surface; }
  };
})();
