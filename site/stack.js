/* ==========================================================================
   DropStack — concrete blocks that come down onto a stack as you scroll.
   Built as one self-contained class so it can become a Framer code
   component later (props: blocks, step length, turn, perspective).

   How it works
   - The section becomes a tall scroll track around a sticky stage. Each
     block has its own scroll point: passing it brings the block down,
     scrolling back up lifts it off again, top block first.
   - A block falls in from above the stage while it turns one full circle
     on its vertical axis, then settles on the stack. Each block is a real
     box: its top, ends and back are added here (CSS draws each block in an
     axonometric view, leaning alternately right and left). Perspective
     flattens out over the last stretch of the turn, so the face ends
     exactly flat and the text crisp.
   - Blocks move on `translate`; `transform` belongs to each block's lean.
   - A block with another landed on it darkens its top, which then only
     shows in the joint.
   - Motion runs on time, not on scroll position, so every block moves the
     same way however fast you scroll. The next block starts once the one
     below is well on its way.
   - The first block in the markup is the base; CSS stacks them upwards.
   - Without JS, or with reduced motion, the stack is simply built.
   ========================================================================== */
(function () {
  "use strict";

  var EASE_FALL = "cubic-bezier(0.5, 0, 0.2, 1)";  // gathers speed, then eases onto the stack
  var EASE_TURN = "cubic-bezier(0.4, 0.1, 0.2, 1)"; // the turn slows as the block settles
  var EASE_LIFT = "cubic-bezier(0.5, 0, 0.75, 0)";
  var PERSPECTIVE = 1200;                            // css px
  var OVERLAP = 0.6;                                 // the next block starts 60% into this one's fall

  // Blocks move on `translate`, leaving `transform` to the CSS lean of each block
  function currentY(el) {
    var t = getComputedStyle(el).translate;
    if (!t || t === "none") return 0;
    return parseFloat(t.split(" ")[1]) || 0;
  }
  function setY(el, y) { el.style.translate = "0px " + y + "px"; }

  function DropStack(section) {
    this.section = section;
    this.stage = section.querySelector(".data__stage");
    this.stack = section.querySelector(".stack");
    this.blocks = Array.prototype.slice.call(section.querySelectorAll(".stack__block"));
    this.bodies = this.blocks.map(function (el) { return el.querySelector(".stack__body"); });
    this.state = this.blocks.map(function () { return "up"; });
    this.anims = [];
    this.turns = [];
    this.readyAt = [];
    this.rise = [];
    this.marks = [];
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

    this.measure();

    if (window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      this.section.style.height = "";
      this.blocks.forEach(function (el, i) { self.place(i, "landed"); });
      return;
    }

    // Blocks already passed (a reload halfway down the page) start in place
    var target = this.target();
    this.blocks.forEach(function (el, i) { self.place(i, i < target ? "landed" : "up"); });

    var queued = false;
    window.addEventListener("scroll", function () {
      if (queued) return;
      queued = true;
      requestAnimationFrame(function () { queued = false; self.sync(); });
    }, { passive: true });

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
    var self = this;
    this.measure();
    this.blocks.forEach(function (el, i) { if (self.state[i] === "up") setY(el, -self.rise[i]); });
    this.sync();
  };

  // How far each block falls, and the scroll point that brings it down
  DropStack.prototype.measure = function () {
    var vh = window.innerHeight;
    var rise = this.rise;
    var stageTop = this.stage.getBoundingClientRect().top;

    // Resting bottoms relative to the stage, with each block's current drop taken out
    var bottoms = this.blocks.map(function (el, i) {
      var bottom = el.getBoundingClientRect().bottom - currentY(el) - stageTop;
      rise[i] = bottom + 48; // starts just above the stage
      return bottom;
    });

    // The base comes down as soon as its resting place is well inside the window
    var start = Math.min(0, bottoms[0] - vh * 0.9);
    var step = Math.max(200, vh * 0.32);
    this.marks = this.blocks.map(function (el, i) { return start + i * step; });
    var track = Math.max(0, this.marks[this.marks.length - 1] + vh * 0.55);
    this.section.style.height = (this.stage.offsetHeight + track) + "px";
  };

  // How many blocks should be on the stack at this scroll position
  DropStack.prototype.target = function () {
    var scrolled = -this.section.getBoundingClientRect().top;
    var n = 0;
    while (n < this.marks.length && scrolled >= this.marks[n]) n++;
    return n;
  };

  // Put a block straight into a state, without motion
  DropStack.prototype.place = function (i, state) {
    var el = this.blocks[i];
    if (this.anims[i]) this.anims[i].cancel();
    if (this.turns[i]) this.turns[i].cancel();
    el.classList.remove("is-turning");
    this.state[i] = state;
    setY(el, state === "landed" ? 0 : -this.rise[i]);
    el.classList.toggle("is-landed", state === "landed");
    this.cover();
  };

  // A block is covered once the one above it has landed
  DropStack.prototype.cover = function () {
    var state = this.state;
    this.blocks.forEach(function (el, i) { el.classList.toggle("is-covered", state[i + 1] === "landed"); });
  };

  DropStack.prototype.move = function (i, to, duration, easing, done) {
    var el = this.blocks[i];
    var from = currentY(el);
    if (this.anims[i]) this.anims[i].cancel();
    setY(el, to);
    if (!el.animate) { done(); return; }
    var a = el.animate([{ translate: "0px " + from + "px" }, { translate: "0px " + to + "px" }], { duration: duration, easing: easing });
    a.onfinish = done;
    this.anims[i] = a;
  };

  // One full turn on the vertical axis, around the middle of the box.
  // Each block is drawn slanted (axonometric, leaning right or left); a turning
  // box swept through that slant reads as a beam swinging diagonally, so the
  // turning block cancels its slant and turns in plain perspective, then eases
  // back into the slanted view as it settles. The small translate keeps the box
  // centred while it does.
  DropStack.prototype.turn = function (i, duration) {
    var el = this.blocks[i];
    var body = this.bodies[i];
    if (!body.animate) return;
    if (this.turns[i]) this.turns[i].cancel();
    el.classList.add("is-turning");
    var cs = getComputedStyle(el);
    var lean = parseFloat(cs.getPropertyValue("--lean")) || 0;
    var dir = parseFloat(cs.getPropertyValue("--dir")) || 1;
    var shift = lean * (parseFloat(cs.getPropertyValue("--depth")) || 0) / 2;
    var unslant = "translate(" + -shift * dir + "px, " + shift + "px) matrix3d(1,0,0,0, 0,1,0,0, " + lean * dir + "," + -lean + ",1,0, 0,0,0,1) ";
    var slant = "translate(0px, 0px) matrix3d(1,0,0,0, 0,1,0,0, 0,0,1,0, 0,0,0,1) ";
    var p = "perspective(" + PERSPECTIVE + "px) ";
    var a = body.animate([
      { transform: unslant + p + "rotateY(0deg)" },
      { transform: unslant + p + "rotateY(306deg)", offset: 0.85 },
      { transform: slant + "perspective(60000px) rotateY(360deg)" }
    ], { duration: duration, easing: EASE_TURN });
    a.onfinish = function () { el.classList.remove("is-turning"); };
    this.turns[i] = a;
  };

  DropStack.prototype.drop = function (i) {
    var self = this;
    var el = this.blocks[i];
    var duration = Math.min(1100, 650 + Math.abs(currentY(el)) * 0.4);
    this.state[i] = "falling";
    this.readyAt[i] = duration * OVERLAP;
    this.turn(i, duration + 120);
    this.move(i, 0, duration, EASE_FALL, function () {
      self.state[i] = "landed";
      el.classList.add("is-landed");
      self.cover();
      self.thud();
      self.sync();
    });
  };

  DropStack.prototype.lift = function (i) {
    var self = this;
    this.state[i] = "lifting";
    this.blocks[i].classList.remove("is-landed");
    this.cover();
    var dist = Math.abs(-this.rise[i] - currentY(this.blocks[i]));
    this.move(i, -this.rise[i], 260 + dist * 0.3, EASE_LIFT, function () {
      self.state[i] = "up";
      self.sync();
    });
  };

  // The stack gives a little under the weight of a landing block
  // (on `translate`, like the blocks)
  DropStack.prototype.thud = function () {
    if (!this.stack.animate) return;
    this.stack.animate(
      [{ translate: "0 0" }, { translate: "0 1.5px", offset: 0.25 }, { translate: "0 0" }],
      { duration: 320, easing: "ease-out" }
    );
  };

  DropStack.prototype.sync = function () {
    var self = this;
    var target = this.target();
    var i;
    // Lift anything above the target, top block first
    for (i = this.blocks.length - 1; i >= target; i--) {
      if (this.state[i] === "falling" || this.state[i] === "landed") this.lift(i);
    }
    // Bring down the next block once the one below has landed or is well on its way
    // (read from the fall itself, so it holds whatever speed the animation runs at)
    for (i = 0; i < target; i++) {
      if (this.state[i] === "landed") continue;
      if (this.state[i] === "falling") {
        var fall = this.anims[i];
        if (fall && fall.currentTime < this.readyAt[i]) {
          if (!this.waiting) {
            this.waiting = true;
            requestAnimationFrame(function () { self.waiting = false; self.sync(); });
          }
          return;
        }
        continue;
      }
      this.drop(i);
      return;
    }
  };

  window.DropStack = DropStack;
  document.querySelectorAll("[data-stack]").forEach(function (section) {
    new DropStack(section).init();
  });
})();
