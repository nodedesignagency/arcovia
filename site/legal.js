/* Arcovia — legal pages: marks the section you are reading in "On this page"
   (component: legal-doc). The rail lists the sheet's clauses; the current one is
   the last whose top has reached the line where a jump from the rail lands it
   (its scroll-margin, just under the small header, plus a little), or the last
   one once the page can't scroll further. A fixed share of the screen (40%) was
   tried: short clauses then pulled the next one in, so a jump marked the wrong
   section. Plain scroll listener, one frame at a time; nothing moves, only
   aria-current changes (the dash is CSS). */
(function () {
  "use strict";

  var links = Array.prototype.slice.call(document.querySelectorAll("[data-legal-toc] a[href^='#']"));
  if (!links.length) return;

  var items = links.map(function (a) {
    return { link: a, target: document.getElementById(a.getAttribute("href").slice(1)) };
  }).filter(function (it) { return it.target; });

  var current = null;
  var ticking = false;

  function update() {
    ticking = false;
    var margin = items.length ? parseFloat(getComputedStyle(items[0].target).scrollMarginTop) || 0 : 0;
    var line = Math.min(margin + 48, window.innerHeight * 0.5);
    var atEnd = window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 2;
    var next = null;
    items.forEach(function (it) {
      if (it.target.getBoundingClientRect().top <= line) next = it;
    });
    // Short last sections never reach the line: at the bottom of the page, the last one is current
    if (atEnd && items.length && items[items.length - 1].target.getBoundingClientRect().top < window.innerHeight) {
      next = items[items.length - 1];
    }
    if (next === current) return;
    if (current) current.link.removeAttribute("aria-current");
    if (next) next.link.setAttribute("aria-current", "location");
    current = next;
  }

  window.addEventListener("scroll", function () {
    if (!ticking) { ticking = true; requestAnimationFrame(update); }
  }, { passive: true });
  window.addEventListener("resize", update);
  update();
})();
