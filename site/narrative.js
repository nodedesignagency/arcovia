/* ==========================================================================
   What We Do, block 3: "Narrative and positioning" (SECTION:narrative)
   Like Home's statement (zoom.js): the text writes itself in, letter by
   letter, with a soft fading front. Here the section pins on its own: the
   stage sticks for --narrative-travel of scrolling and the writing follows
   the scroll (so it runs backwards when scrolling up and fast scrolling
   settles exactly). It starts as the section comes up the screen and is
   complete a little before the stage lets go.
   Off with reduced motion and below 1200 (desktop first): the text in full.
   ========================================================================== */
(function () {
  "use strict";

  var section = document.querySelector("[data-narrative]");
  if (!section) return;
  var reveal = section.querySelector("[data-reveal]");
  if (!reveal) return;
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  if (window.matchMedia("(max-width: 1199px)").matches) return;

  function clamp(v, a, b) { return Math.min(b, Math.max(a, v)); }

  /* Wrap every letter in a span (inside a span per word, so words never break),
     as zoom.js does for Home's statement */
  function splitChars(el) {
    var out = [];
    var walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
    var nodes = [];
    while (walker.nextNode()) nodes.push(walker.currentNode);
    nodes.forEach(function (node) {
      var frag = document.createDocumentFragment();
      node.data.split(/(\s+)/).forEach(function (part) {
        if (!part) return;
        if (/^\s+$/.test(part)) { frag.appendChild(document.createTextNode(part)); return; }
        var word = document.createElement("span");
        word.className = "w";
        Array.prototype.forEach.call(part, function (ch) {
          var span = document.createElement("span");
          span.className = "c";
          span.textContent = ch;
          word.appendChild(span);
          out.push({ el: span, q: -1 });
        });
        frag.appendChild(word);
      });
      node.parentNode.replaceChild(frag, node);
    });
    el.classList.add("is-split");
    return out;
  }

  /* One letter's state: invisible → fading in → solid, as on Home */
  var FRONT = 28, STEPS = 24;   // letters in the fading front; opacity steps
  function paintChar(c, v) {
    var q = v <= 0 ? 0 : v >= 1 ? STEPS : Math.min(STEPS - 1, Math.max(1, Math.round(v * STEPS)));
    if (q === c.q) return;
    c.q = q;
    c.el.style.opacity = q === STEPS ? "1" : (Math.pow(q / STEPS, 1.4)).toFixed(3);
  }

  var chars = splitChars(reveal);
  section.classList.add("narrative--on");

  /* Progress: 0 when the section's top is a quarter of the screen from the top
     (the text is in view below it), 1 when the stage has travelled 85% of its pin,
     so most of the writing happens while the text stands still */
  var queued = false;
  function render() {
    queued = false;
    var vh = window.innerHeight;
    var r = section.getBoundingClientRect();
    var travel = Math.max(1, section.offsetHeight - vh);
    var start = vh * 0.25;          // section top a quarter of the screen from the top
    var end = -travel * 0.85;       // most of the way through the pin
    var p = clamp((start - r.top) / (start - end), 0, 1);
    var front = p * (chars.length + FRONT);
    chars.forEach(function (c, i) { paintChar(c, (front - i) / FRONT); });
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
