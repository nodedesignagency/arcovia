/* ==========================================================================
   DropStack — concrete blocks that drop onto a stack as you scroll.
   Built as one self-contained class so it can become a Framer code
   component later (props: blocks, step length, gravity).

   How it works
   - The section becomes a tall scroll track around a sticky stage. Each
     block has its own scroll point: passing it drops the block, scrolling
     back up lifts it off again, top block first.
   - Falls run on time, not on scroll position, so every block falls under
     the same gravity (a true t² free fall) and stops dead on the stack,
     however fast you scroll. Blocks due at the same time fall one after
     another, each waiting for the one below to land.
   - The first block in the markup is the base; CSS stacks them upwards.
   - Without JS, or with reduced motion, the stack is simply built.
   ========================================================================== */
(function () {
  "use strict";

  var GRAVITY = 5200;                                    // css px/s²: a full-height fall takes about half a second
  var EASE_FALL = "cubic-bezier(0.333, 0, 0.667, 0.333)"; // exactly t²
  var EASE_LIFT = "cubic-bezier(0.5, 0, 0.75, 0)";

  function currentY(el) {
    var t = getComputedStyle(el).transform;
    if (!t || t === "none") return 0;
    var v = t.slice(t.indexOf("(") + 1, -1).split(",").map(parseFloat);
    return v.length === 6 ? v[5] : v[13];
  }

  function DropStack(section) {
    this.section = section;
    this.stage = section.querySelector(".data__stage");
    this.stack = section.querySelector(".stack");
    this.blocks = Array.prototype.slice.call(section.querySelectorAll(".stack__block"));
    this.state = this.blocks.map(function () { return "up"; });
    this.anims = [];
    this.rise = [];
    this.marks = [];
    this.busy = false;
  }

  DropStack.prototype.init = function () {
    var self = this;
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
    this.blocks.forEach(function (el, i) { if (self.state[i] === "up") el.style.transform = "translateY(" + -self.rise[i] + "px)"; });
    this.sync();
  };

  // Where each block rests, how far it falls, and the scroll point that drops it
  DropStack.prototype.measure = function () {
    var vh = window.innerHeight;
    var blocks = this.blocks;
    var rise = this.rise;
    var stageTop = this.stage.getBoundingClientRect().top;

    // Resting boxes relative to the stage, with each block's current drop taken out
    var boxes = blocks.map(function (el) {
      var r = el.getBoundingClientRect();
      return { top: r.top - currentY(el) - stageTop, bottom: r.bottom - currentY(el) - stageTop, left: r.left, right: r.right };
    });

    boxes.forEach(function (b, i) {
      rise[i] = b.bottom + 48; // starts just above the stage
      if (i === 0) return;
      // The joint under a block only spans its overlap with the block below
      var below = boxes[i - 1];
      blocks[i].style.setProperty("--joint-l", (Math.max(b.left, below.left) - b.left + 5) + "px");
      blocks[i].style.setProperty("--joint-r", (b.right - Math.min(b.right, below.right) + 5) + "px");
    });

    // The base drops as soon as its resting place is well inside the window
    var start = Math.min(0, boxes[0].bottom - vh * 0.9);
    var step = Math.max(200, vh * 0.32);
    this.marks = blocks.map(function (el, i) { return start + i * step; });
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
    this.state[i] = state;
    el.style.transform = state === "landed" ? "translateY(0px)" : "translateY(" + -this.rise[i] + "px)";
    el.classList.toggle("is-landed", state === "landed");
  };

  DropStack.prototype.move = function (i, to, duration, easing, done) {
    var el = this.blocks[i];
    var from = currentY(el);
    if (this.anims[i]) this.anims[i].cancel();
    el.style.transform = "translateY(" + to + "px)";
    if (!el.animate) { done(); return; }
    var a = el.animate([{ transform: "translateY(" + from + "px)" }, { transform: "translateY(" + to + "px)" }], { duration: duration, easing: easing });
    a.onfinish = done;
    this.anims[i] = a;
  };

  DropStack.prototype.drop = function (i) {
    var self = this;
    var fall = Math.abs(currentY(this.blocks[i]));
    this.state[i] = "falling";
    this.busy = true;
    this.move(i, 0, Math.sqrt(2 * fall / GRAVITY) * 1000, EASE_FALL, function () {
      self.state[i] = "landed";
      self.busy = false;
      self.blocks[i].classList.add("is-landed");
      self.thud();
      self.sync();
    });
  };

  DropStack.prototype.lift = function (i) {
    var self = this;
    if (this.state[i] === "falling") this.busy = false;
    this.state[i] = "lifting";
    this.blocks[i].classList.remove("is-landed");
    var dist = Math.abs(-this.rise[i] - currentY(this.blocks[i]));
    this.move(i, -this.rise[i], 260 + dist * 0.3, EASE_LIFT, function () {
      self.state[i] = "up";
      self.sync();
    });
  };

  // The stack gives a little under the weight of a landing block
  DropStack.prototype.thud = function () {
    if (!this.stack.animate) return;
    this.stack.animate(
      [{ transform: "translateY(0)" }, { transform: "translateY(1.5px)", offset: 0.25 }, { transform: "translateY(0)" }],
      { duration: 320, easing: "ease-out" }
    );
  };

  DropStack.prototype.sync = function () {
    var target = this.target();
    var i;
    // Lift anything above the target, top block first
    for (i = this.blocks.length - 1; i >= target; i--) {
      if (this.state[i] === "falling" || this.state[i] === "landed") this.lift(i);
    }
    if (this.busy) return;
    // Drop the next block, once the one below it has landed
    for (i = 0; i < target; i++) {
      if (this.state[i] === "up" || this.state[i] === "lifting") {
        if (i === 0 || this.state[i - 1] === "landed") this.drop(i);
        return;
      }
    }
  };

  window.DropStack = DropStack;
  document.querySelectorAll("[data-stack]").forEach(function (section) {
    new DropStack(section).init();
  });
})();
