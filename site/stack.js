/* ==========================================================================
   DropStack — concrete blocks that come down onto a stack as you scroll.
   Built as one self-contained class so it can become a Framer code
   component later (props: blocks, scroll per block, smoothing, perspective).

   How it works
   - The section becomes a tall scroll track around a sticky stage. Each
     block owns one stretch of that track, one after another: across its
     stretch it comes down from above the stage, turning one full circle on
     its vertical axis, and settles on the stack. Scrolling back plays the
     same stretch in reverse, so blocks always leave one at a time, top
     block first.
   - Everything follows the scroll position itself (no timers, no bounce),
     eased by a light exponential smoothing so wheel and trackpad steps
     glide instead of jumping.
   - Each block is a real box: its top, ends and back are added here (CSS
     draws the stack in an axonometric view). While it turns, the block
     drops that slant and turns in plain perspective; over the last stretch
     it eases back into the slanted view and the perspective flattens out,
     so the face lands exactly flat and the text crisp.
   - The joint under a block darkens as the block above settles on it, and
     the base's contact shadow fades in as it lands.
   - The first block in the markup is the base; CSS stacks them upwards.
   - Without JS, or with reduced motion, the stack is simply built.
   ========================================================================== */
(function () {
  "use strict";

  var PERSPECTIVE = 1200; // css px
  var SMOOTHING = 0.14;   // seconds: how long the motion takes to catch up with the scroll

  function clamp01(x) { return x < 0 ? 0 : x > 1 ? 1 : x; }
  function smoothstep(a, b, x) { var t = clamp01((x - a) / (b - a)); return t * t * (3 - 2 * t); }
  // Starts from rest, gathers speed gently and slows into place: no sudden starts or stops
  function settle(t) { return (1 - Math.cos(Math.PI * t)) / 2; }

  function DropStack(section) {
    this.section = section;
    this.stage = section.querySelector(".data__stage");
    this.stack = section.querySelector(".stack");
    this.blocks = Array.prototype.slice.call(section.querySelectorAll(".stack__block"));
    this.bodies = this.blocks.map(function (el) { return el.querySelector(".stack__body"); });
    this.rise = [];
    this.progress = 0;  // shown, in blocks: 2.5 = two blocks down, the third halfway
    this.target = 0;    // where the scroll says it should be
    this.running = false;
  }

  DropStack.prototype.init = function () {
    var self = this;

    // The top, back and both ends of each box
    this.bodies.forEach(function (body) {
      ["top", "back", "left", "right"].forEach(function (side) {
        var s = document.createElement("span");
        s.className = "stack__side stack__side--" + side;
        s.setAttribute("aria-hidden", "true");
        body.appendChild(s);
      });
    });

    if (window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      this.progress = this.blocks.length;
      this.render();
      return;
    }

    this.measure();
    this.progress = this.target = this.read(); // a reload halfway down the page starts in place
    this.render();

    window.addEventListener("scroll", function () { self.kick(); }, { passive: true });

    var width = window.innerWidth;
    window.addEventListener("resize", function () {
      // Phones resize the height as the address bar moves; only a new width changes the layout
      if (window.innerWidth === width) return;
      width = window.innerWidth;
      self.relayout();
    });
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(function () { self.relayout(); });
  };

  DropStack.prototype.relayout = function () {
    this.measure();
    this.progress = this.target = this.read();
    this.render();
  };

  // How far each block falls, and where the scroll track starts and how long it is
  DropStack.prototype.measure = function () {
    var vh = window.innerHeight;
    var rise = this.rise;
    var self = this;

    // Measure the resting places with every block in place
    this.blocks.forEach(function (el, i) { el.style.transform = ""; self.bodies[i].style.transform = ""; });
    var stageTop = this.stage.getBoundingClientRect().top;
    this.blocks.forEach(function (el, i) {
      rise[i] = el.getBoundingClientRect().bottom - stageTop + 48; // starts just above the stage
    });

    var cs = getComputedStyle(this.stack);
    this.lean = parseFloat(cs.getPropertyValue("--lean")) || 0;
    this.depth = parseFloat(cs.getPropertyValue("--depth")) || 0;

    // The base starts down while the section is still coming up the screen;
    // each block then gets the same stretch of scroll, and the built stack holds a while
    this.start = -vh * 0.25;
    this.step = Math.max(240, vh * 0.42);
    var hold = vh * 0.45;
    var track = Math.max(0, this.start + this.blocks.length * this.step + hold);
    this.section.style.height = (this.stage.offsetHeight + track) + "px";
    this.top = this.section.getBoundingClientRect().top + window.scrollY;
  };

  // Where the scroll is, in blocks
  DropStack.prototype.read = function () {
    var p = (window.scrollY - this.top - this.start) / this.step;
    return Math.max(0, Math.min(this.blocks.length, p));
  };

  // Catch up with the scroll, frame by frame, until there
  DropStack.prototype.kick = function () {
    this.target = this.read();
    if (this.running) return;
    this.running = true;
    var self = this;
    var last = performance.now();
    var frame = function (now) {
      var dt = Math.min(0.1, (now - last) / 1000);
      last = now;
      self.progress += (self.target - self.progress) * (1 - Math.exp(-dt / SMOOTHING));
      if (Math.abs(self.target - self.progress) < 0.0005) self.progress = self.target;
      self.render();
      if (self.progress !== self.target) requestAnimationFrame(frame);
      else self.running = false;
    };
    requestAnimationFrame(frame);
  };

  DropStack.prototype.render = function () {
    var n = this.blocks.length;
    for (var i = 0; i < n; i++) {
      var t = clamp01(this.progress - i);
      var el = this.blocks[i];
      var body = this.bodies[i];

      // The joint under this block darkens as the block above settles on it;
      // the base's contact shadow fades in as it lands
      var above = i + 1 < n ? clamp01(this.progress - i - 1) : 0;
      el.style.setProperty("--cover", smoothstep(0.82, 1, above).toFixed(3));
      if (i === 0) el.style.setProperty("--land", smoothstep(0.75, 1, t).toFixed(3));

      el.classList.toggle("is-turning", t > 0 && t < 1);
      if (t >= 1) { el.style.transform = ""; body.style.transform = ""; continue; }

      el.style.transform = "translate3d(0, " + (-this.rise[i] * (1 - settle(t))).toFixed(2) + "px, 0)";
      body.style.transform = this.turnAt(t);
    }
  };

  // The box at t (0 above the stage, 1 settled): one full turn on its vertical
  // axis around the middle of the box, done by 85%. While it turns it cancels
  // the stack's slant (a turning box swept through the slant reads as a beam
  // swinging diagonally); from 70% it eases back into the slant and the
  // perspective flattens out, so it lands exactly flat.
  DropStack.prototype.turnAt = function (t) {
    var angle = 360 * smoothstep(0.05, 0.85, t);
    var s = smoothstep(0.7, 1, t);
    var u = 1 - s;
    var lean = this.lean * u;
    var shift = this.lean * this.depth / 2 * u;
    var d = PERSPECTIVE / Math.max(0.001, u * u);
    return "translate(" + (-shift).toFixed(2) + "px, " + shift.toFixed(2) + "px) " +
      "matrix3d(1,0,0,0, 0,1,0,0, " + lean.toFixed(4) + "," + (-lean).toFixed(4) + ",1,0, 0,0,0,1) " +
      "perspective(" + d.toFixed(0) + "px) rotateY(" + angle.toFixed(2) + "deg)";
  };

  window.DropStack = DropStack;
  document.querySelectorAll("[data-stack]").forEach(function (section) {
    new DropStack(section).init();
  });
})();
