/* ==========================================================================
   Selected work → a case's own page
   Clicking a book (cover or spine) opens its case (case-<slug>.html). As in
   the user's Stripe Press reference, the other books and the heading fade
   away first (240 ms), then the page changes. Just before it does, this
   saves where the clicked book stands on screen, how far it is turned and
   how far its cover is open, so case.js can start the book exactly there.
   Modified clicks (new tab, etc.), below 1200px and with reduced motion
   are plain links. Coming back (browser back) restores the shelf.
   Sits beside books.js and changes nothing in it.
   ========================================================================== */
(function () {
  "use strict";

  var sec = document.querySelector("[data-books]");
  if (!sec || !window.matchMedia) return;
  var KEY = "arcovia_case_from";
  var FADE = 240;
  var desktop = window.matchMedia("(min-width: 1200px)");
  var reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
  var faded = [];
  var leaving = false;

  // The angle of a rotateY in a computed transform (matrix3d: cos at [0], -sin at [2])
  function turnOf(el) {
    var t = getComputedStyle(el).transform;
    if (!t || t.indexOf("matrix3d(") !== 0) return 0;
    var v = t.slice(9, -1).split(",").map(parseFloat);
    return Math.atan2(-v[2], v[0]) * 180 / Math.PI;
  }

  function fade(el) {
    el.style.transition = "opacity " + FADE + "ms ease, transform 620ms var(--ease-out)";
    el.style.opacity = "0";
    faded.push(el);
  }

  function restore() {
    leaving = false;
    faded.forEach(function (el) { el.style.transition = ""; el.style.opacity = ""; });
    faded = [];
  }

  Array.prototype.forEach.call(sec.querySelectorAll(".book__link"), function (link) {
    link.addEventListener("click", function (e) {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      var m = /case-([\w-]+)\.html/.exec(link.getAttribute("href") || "");
      if (!m || !desktop.matches || reduced.matches) return;
      e.preventDefault();
      if (leaving) return;
      leaving = true;

      Array.prototype.forEach.call(sec.querySelectorAll(".book"), function (b) {
        if (!b.contains(link)) fade(b.querySelector(".book__lift"));
      });
      var title = sec.querySelector(".work__title");
      if (title) fade(title);

      setTimeout(function () {
        var lift = link.querySelector(".book__lift");
        var body = link.querySelector(".book__body");
        var cover = link.querySelector(".book__cover");
        var r = lift.getBoundingClientRect();
        var turned = /rotateY\((-?[\d.]+)deg\)/.exec(body.style.transform || "");
        try {
          sessionStorage.setItem(KEY, JSON.stringify({
            slug: m[1],
            x: r.left + r.width / 2,
            y: r.top + r.height / 2,
            w: r.width,
            h: r.height,
            deg: turned ? parseFloat(turned[1]) : 0,
            open: turnOf(cover),
            t: Date.now()
          }));
        } catch (err) { /* storage blocked: the case page opens from the middle */ }
        location.href = link.href;
      }, FADE + 20);
    });
  });

  // Back from a case: the browser may restore this page as it was left
  window.addEventListener("pageshow", restore);
})();
