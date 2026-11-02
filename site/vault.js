/* Arcovia — the vault opening (SECTION:vault, sections/vault.css).
   The inline script in the head sets html.vault-on before the first paint when
   the opening should play. This opens it: once the hero's concrete is live
   (.hero--gl) and the closed door has been seen for a moment, or at the latest
   after MAX_WAIT, ready or not. A scroll, key or tap opens it at once. It
   removes itself once the doors have cleared. */
(function () {
  "use strict";

  var root = document.documentElement;
  var vault = document.querySelector("[data-vault]");
  if (!vault) return;
  if (!root.classList.contains("vault-on")) {
    vault.parentNode.removeChild(vault);
    return;
  }

  var MIN_HOLD = 400;  // ms the closed door is seen
  var MAX_WAIT = 1600; // ms at most before it opens
  var LATE = 3500;     // ms after the first paint: past this, skip the opening
  var OPEN = parseFloat(getComputedStyle(vault).getPropertyValue("--vault-open")) || 900;

  // Seen in this visit: coming back to Home from another page skips it (see the head script)
  try { sessionStorage.setItem("arc-vault", "1"); } catch (e) { /* private mode: plays again, fine */ }

  var hero = document.querySelector("[data-hero]");
  var t0 = performance.now();
  try {
    var paint = performance.getEntriesByName("first-contentful-paint")[0];
    if (paint) t0 = paint.startTime; // the door has been on screen since the first paint
  } catch (e) { /* no paint timing: count from now */ }

  var opened = false;
  var inputs = ["wheel", "touchstart", "keydown", "pointerdown"];

  // A very slow load: the page has waited long enough, so no late opening (the CSS failsafe
  // would take the door away at 5 s, possibly mid-way)
  if (performance.now() - t0 > LATE) {
    vault.parentNode.removeChild(vault);
    root.classList.add("vault-open", "vault-done");
    restoreTint();
    return;
  }

  // The browser's toolbar tint goes back to the concrete
  function restoreTint() {
    var meta = document.querySelector('meta[name="theme-color"]');
    if (meta && meta.getAttribute("data-base")) meta.setAttribute("content", meta.getAttribute("data-base"));
  }

  function ready() {
    return !hero || hero.classList.contains("hero--gl");
  }

  function open() {
    if (opened) return;
    opened = true;
    inputs.forEach(function (type) { window.removeEventListener(type, open, true); });
    root.classList.add("vault-open");
    restoreTint();
    window.setTimeout(function () {
      root.classList.add("vault-done");
      if (vault.parentNode) vault.parentNode.removeChild(vault);
    }, OPEN + 120);
  }

  inputs.forEach(function (type) { window.addEventListener(type, open, { capture: true, passive: true }); });

  (function wait() {
    if (opened) return;
    var waited = performance.now() - t0;
    if ((waited >= MIN_HOLD && ready()) || waited >= MAX_WAIT) open();
    else requestAnimationFrame(wait);
  })();
})();
