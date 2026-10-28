/* Arcovia — shared behaviour: header, menu, path picker, hero */
(function () {
  "use strict";

  var root = document.documentElement;
  root.classList.add("js");

  /* ---------- Header: thin bar once scrolled ---------- */
  var header = document.querySelector("[data-header]");
  if (header) {
    var ticking = false;
    var update = function () {
      header.classList.toggle("is-scrolled", window.scrollY > 24);
      ticking = false;
    };
    window.addEventListener("scroll", function () {
      if (!ticking) { ticking = true; requestAnimationFrame(update); }
    }, { passive: true });
    update();
  }

  /* ---------- Full-screen menu ---------- */
  var menu = document.querySelector("[data-menu]");
  var menuOpeners = document.querySelectorAll("[data-menu-open]");
  var lastFocus = null;

  function setMenu(open) {
    if (!menu) return;
    menu.classList.toggle("is-open", open);
    menu.setAttribute("aria-hidden", String(!open));
    menuOpeners.forEach(function (b) { b.setAttribute("aria-expanded", String(open)); });
    root.style.overflow = open ? "hidden" : "";
    if (open) {
      lastFocus = document.activeElement;
      var first = menu.querySelector("[data-menu-close]");
      if (first) setTimeout(function () { first.focus(); }, 50);
    } else if (lastFocus) {
      lastFocus.focus();
    }
  }

  menuOpeners.forEach(function (b) { b.addEventListener("click", function () { setMenu(true); }); });
  if (menu) {
    menu.querySelectorAll("[data-menu-close]").forEach(function (b) { b.addEventListener("click", function () { setMenu(false); }); });
    menu.addEventListener("keydown", function (e) {
      if (e.key === "Escape") setMenu(false);
      if (e.key !== "Tab") return;
      // Keep focus inside the menu while it is open
      var f = menu.querySelectorAll("a, button");
      var first = f[0], last = f[f.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    });
  }

  /* ---------- Path picker: one button, three paths ---------- */
  document.querySelectorAll("[data-path-picker]").forEach(function (picker) {
    var trigger = picker.querySelector(".path-picker__trigger");
    var panel = picker.querySelector(".path-picker__panel");
    var options = panel.querySelectorAll(".path-picker__option");

    function set(open, focusFirst) {
      picker.classList.toggle("is-open", open);
      trigger.setAttribute("aria-expanded", String(open));
      panel.setAttribute("aria-hidden", String(!open));
      options.forEach(function (a) { a.tabIndex = open ? 0 : -1; });
      if (open && focusFirst) options[0].focus();
    }

    trigger.addEventListener("click", function (e) {
      // Keyboard and screen-reader users land on the first path; mouse users stay on the button
      set(!picker.classList.contains("is-open"), e.detail === 0);
    });
    picker.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && picker.classList.contains("is-open")) { set(false); trigger.focus(); }
      if (e.key === "ArrowDown" || e.key === "ArrowUp") {
        if (!picker.classList.contains("is-open")) return;
        e.preventDefault();
        var list = Array.prototype.slice.call(options);
        var i = list.indexOf(document.activeElement);
        var next = e.key === "ArrowDown" ? (i + 1) % list.length : (i - 1 + list.length) % list.length;
        list[next].focus();
      }
    });
    document.addEventListener("pointerdown", function (e) {
      if (!picker.contains(e.target)) set(false);
    });
    picker.addEventListener("focusout", function (e) {
      if (e.relatedTarget && !picker.contains(e.relatedTarget)) set(false);
    });
    set(false);
  });

  /* ---------- Office clocks: local time in each office, e.g. "7:02 AM PDT" ---------- */
  var clocks = document.querySelectorAll("[data-clock]");
  if (clocks.length && window.Intl) {
    var tickClocks = function () {
      var now = new Date();
      clocks.forEach(function (el) {
        try {
          el.textContent = new Intl.DateTimeFormat("en-US", { hour: "numeric", minute: "2-digit", timeZone: el.getAttribute("data-clock"), timeZoneName: "short" }).format(now);
        } catch (e) { /* unknown zone: keep the fallback text */ }
      });
    };
    tickClocks();
    // Line the updates up with the turn of the minute
    setTimeout(function () { tickClocks(); setInterval(tickClocks, 60000); }, 60000 - (Date.now() % 60000) + 50);
  }

  /* ---------- Hero ---------- */
  var hero = document.querySelector("[data-hero]");
  if (!hero) return;

  // Fit the carved ARCOVIA to the container width
  var mark = hero.querySelector(".hero__wordmark");
  var wrap = hero.querySelector(".hero__wordmark-wrap");
  function fitWordmark() {
    if (!mark || !wrap) return;
    var cs = getComputedStyle(wrap);
    var target = wrap.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight);
    mark.style.fontSize = "100px";
    var w = mark.getBoundingClientRect().width - 0.035 * 100;
    var size = Math.floor((100 * target) / w * 100) / 100;
    mark.style.fontSize = "";
    hero.style.setProperty("--wordmark-size", size + "px");
    hero.style.setProperty("--wordmark-visible", Math.round(size * 0.6) + "px");
  }
  fitWordmark();
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(fitWordmark);
  var fitQueued = false;
  window.addEventListener("resize", function () {
    if (fitQueued) return;
    fitQueued = true;
    requestAnimationFrame(function () { fitQueued = false; fitWordmark(); });
  });

  // Live concrete
  if (window.ConcreteSurface) {
    window.arcoviaHero = new window.ConcreteSurface(hero, { canvas: ".hero__canvas" });
    window.arcoviaHero.init();
  }
})();
