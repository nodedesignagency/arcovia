/* ==========================================================================
   Arcovia — the Residency Program (Team, block 5): the rolling wheel.
   After the user's screen recording: the three fields roll up one row at a
   time after the sentence, the one in the middle row in ink. The list is
   held three times over, so there is always a name above and below and the
   roll wraps round without a seam (it jumps back a set, unseen, after each
   pass). Rolls only while the section is on screen and the tab is open;
   with reduced motion it stands still on the first field.
   Built to become a Framer code component (props: sentence, names, hold).
   ========================================================================== */
(function () {
  "use strict";

  var wheel = document.querySelector("[data-residency-wheel]");
  if (!wheel) return;
  var track = wheel.querySelector(".residency__track");
  var section = wheel.closest(".residency") || wheel;
  var reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
  var HOLD = 2000;   // each name rests in the middle this long
  var ROLL = 700;    // then the wheel rolls up one row (the CSS transition)

  var originals = Array.prototype.slice.call(track.children);
  var n = originals.length;
  for (var c = 0; c < 2; c++) {
    originals.forEach(function (item) {
      var copy = item.cloneNode(true);
      copy.classList.remove("is-on");
      track.appendChild(copy);
    });
  }
  var items = track.children;
  var k = n;   // start on the middle set, so the name above is there from the first frame

  function set(i, jump) {
    if (jump) track.classList.add("is-jump");
    track.style.setProperty("--k", i);
    for (var j = 0; j < items.length; j++) {
      items[j].classList.toggle("is-on", j === i);
      items[j].classList.toggle("is-near", Math.abs(j - i) === 1);   // the dim names above and below
    }
    if (jump) {
      void track.offsetHeight;   // apply it before the transitions come back
      track.classList.remove("is-jump");
    }
  }

  function step() {
    k += 1;
    set(k, false);
    if (k >= 2 * n) setTimeout(function () { k -= n; set(k, true); }, ROLL + 50);
  }

  var timer = null;
  var visible = false;
  function update() {
    var run = visible && !document.hidden && !reduced.matches;
    if (run && !timer) timer = setInterval(step, HOLD + ROLL);
    if (!run && timer) { clearInterval(timer); timer = null; }
  }

  set(k, true);
  if ("IntersectionObserver" in window) {
    new IntersectionObserver(function (entries) {
      visible = entries[0].isIntersecting;
      update();
    }, { threshold: 0.25 }).observe(section);
  } else {
    visible = true;
  }
  document.addEventListener("visibilitychange", update);
  if (reduced.addEventListener) reduced.addEventListener("change", update);
  update();

  // For checks: arcoviaResidency.step() rolls once; .stop() holds it
  window.arcoviaResidency = { step: step, stop: function () { visible = false; update(); } };
})();
