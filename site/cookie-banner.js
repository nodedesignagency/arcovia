/* Arcovia — cookie choice (component: cookie-banner)
   From the brief: analytics load only after consent, "Accept" and "Reject" equally
   prominent. The choice is kept on this device for 12 months (localStorage key
   "arcovia-consent": { choice: "accepted" | "rejected", at: timestamp }), then we ask again.
   Any [data-cookie-settings] button (the Cookie Policy page) opens the banner again.

   For analytics later (Plausible or GA4, still to confirm), load the script only through
     window.arcoviaConsent.onAccept(function () { ...load analytics... });
   which runs at once if the visitor already accepted, or the moment they do.

   Review switch: ?cookies=reset forgets the choice so the banner shows again. */
(function () {
  "use strict";

  var KEY = "arcovia-consent";
  var MAX_AGE = 365 * 24 * 60 * 60 * 1000;
  var banner = document.querySelector("[data-cookie-banner]");
  var waiting = [];

  function read() {
    try {
      var v = JSON.parse(localStorage.getItem(KEY) || "null");
      if (v && (v.choice === "accepted" || v.choice === "rejected") && Date.now() - v.at < MAX_AGE) return v.choice;
    } catch (e) { /* storage blocked or bad value: ask again */ }
    return null;
  }
  function write(choice) {
    try { localStorage.setItem(KEY, JSON.stringify({ choice: choice, at: Date.now() })); } catch (e) { /* private mode: ask again next visit */ }
  }

  if (/[?&]cookies=reset\b/.test(location.search)) {
    try { localStorage.removeItem(KEY); } catch (e) { /* nothing stored */ }
  }

  var choice = read();

  window.arcoviaConsent = {
    get: function () { return choice; },
    onAccept: function (fn) {
      if (choice === "accepted") fn(); else waiting.push(fn);
    }
  };

  if (!banner) return;

  var hideTimer = null;
  function show() {
    clearTimeout(hideTimer);
    banner.hidden = false;
    // Next frame, so the fade and lift run
    requestAnimationFrame(function () { requestAnimationFrame(function () { banner.classList.add("is-shown"); }); });
  }
  function hide() {
    banner.classList.remove("is-shown");
    hideTimer = setTimeout(function () { banner.hidden = true; }, 260);
  }

  banner.querySelectorAll("[data-consent]").forEach(function (btn) {
    btn.addEventListener("click", function () {
      choice = btn.getAttribute("data-consent");
      write(choice);
      hide();
      if (choice === "accepted") {
        var run = waiting; waiting = [];
        run.forEach(function (fn) { fn(); });
      }
      document.dispatchEvent(new CustomEvent("arcovia:consent", { detail: { choice: choice } }));
    });
  });

  document.querySelectorAll("[data-cookie-settings]").forEach(function (btn) {
    btn.addEventListener("click", function () {
      show();
      var first = banner.querySelector("[data-consent]");
      if (first) first.focus({ preventScroll: true });
    });
  });

  // First visit (or the choice has expired): ask, a moment after the page settles
  if (!choice) setTimeout(show, 900);
})();
