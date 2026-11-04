/* Arcovia — contact form

   The note opens with the path: five radio pills named "tag", whose values are
   the GoHighLevel tags (founder, investor, institution, partner-press, talent).
   The chosen path's fieldset is switched on; the others are disabled, so they
   neither validate nor send. Every note saves the visit source (UTM tags, first page, referrer), has a
   hidden spam trap and needs the Privacy Policy box ticked.

   Sending: data-endpoint on the <form> takes the GoHighLevel webhook URL (the
   last step, once the client gives it). Until then, the form logs what it would
   send to the console and shows the confirmation. */
(function () {
  "use strict";

  var reduceMotion = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var UTM = ["utm_source", "utm_medium", "utm_campaign", "utm_term", "utm_content"];

  // Visit source: kept by main.js for the whole visit; this page's own tags win
  function readVisit() {
    var visit = {};
    try { visit = JSON.parse(sessionStorage.getItem("arcovia_visit") || "{}") || {}; } catch (e) { /* storage blocked */ }
    var q = new URLSearchParams(location.search);
    if (UTM.some(function (k) { return q.get(k); })) UTM.forEach(function (k) { visit[k] = q.get(k) || ""; });
    if (!visit.landing_page) visit.landing_page = location.href.split("#")[0];
    if (visit.referrer == null) visit.referrer = document.referrer || "";
    return visit;
  }

  // Blanks grow with what is written in them
  var ctx = document.createElement("canvas").getContext("2d");
  function fit(el) {
    if (!el.getClientRects().length) return; // not shown
    var cs = getComputedStyle(el);
    ctx.font = cs.fontStyle + " " + cs.fontWeight + " " + cs.fontSize + " " + cs.fontFamily;
    var text = el.tagName === "SELECT"
      ? (el.options[el.selectedIndex] ? el.options[el.selectedIndex].text : "")
      : (el.value || el.placeholder || "");
    var ls = parseFloat(cs.letterSpacing) || 0;
    var w = ctx.measureText(text).width + ls * text.length +
      parseFloat(cs.paddingLeft) + parseFloat(cs.paddingRight) + 1;
    el.style.width = Math.ceil(w) + "px";
    if (el.tagName === "SELECT") el.classList.toggle("is-empty", !el.value);
  }
  // Short texts grow a line at a time
  function grow(el) {
    if (!el.getClientRects().length) return;
    var cs = getComputedStyle(el);
    el.style.height = "auto";
    el.style.height = (el.scrollHeight + parseFloat(cs.borderTopWidth) + parseFloat(cs.borderBottomWidth)) + "px";
  }
  function addCounter(el) {
    if (!(el.maxLength > 0)) return;
    var count = document.createElement("span");
    count.className = "field-count";
    count.setAttribute("aria-hidden", "true");
    el.insertAdjacentElement("afterend", count);
    el._count = function () { count.textContent = el.value.length + " / " + el.maxLength; };
    el.addEventListener("input", el._count);
    el._count();
  }

  function listJoin(items) {
    if (items.length < 2) return items.join("");
    return items.slice(0, -1).join(", ") + " and " + items[items.length - 1];
  }

  function initForm(form) {
    var scope = form.closest("[data-contact]") || form.parentNode;
    var done = scope.querySelector("[data-contact-done]");
    var paths = Array.prototype.slice.call(form.querySelectorAll('input[name="tag"]'));
    var groups = form.querySelectorAll("[data-path-fields]");
    var afterPath = form.querySelectorAll("[data-after-path]");
    var status = form.querySelector("[data-status]");
    var submit = form.querySelector('[type="submit"]');
    var submitLabel = submit.querySelector("[data-submit-label]");
    var submitText = submitLabel ? submitLabel.textContent : "";
    var memory = {};          // what was typed, so it follows you to another path
    var started = Date.now();
    var byPointer = false;    // only scroll the questions into view after a click, not while arrowing

    // Visit source into the hidden fields
    var visit = readVisit();
    Object.keys(visit).forEach(function (k) {
      var f = form.querySelector('input[type="hidden"][name="' + k + '"]');
      if (f) f.value = visit[k];
    });

    form.querySelectorAll("textarea[maxlength]").forEach(addCounter);

    function current() {
      var c = form.querySelector('input[name="tag"]:checked');
      return c ? c.value : "";
    }

    function refresh() {
      form.querySelectorAll("[data-autosize]").forEach(fit);
      form.querySelectorAll("textarea[data-autogrow]").forEach(grow);
    }

    function setPath(value, fromUser) {
      var firstTime = !form.classList.contains("is-chosen");
      form.classList.toggle("is-chosen", !!value);
      form.setAttribute("data-path", value);
      groups.forEach(function (g) {
        var on = g.getAttribute("data-path-fields") === value;
        g.hidden = !on;
        g.disabled = !on;
        if (!on) return;
        g.querySelectorAll("input, textarea").forEach(function (el) {
          if (el.type === "radio" || el.type === "checkbox") return;
          if (!el.value && memory[el.name]) {
            el.value = memory[el.name];
            if (el._count) el._count();
          }
        });
      });
      afterPath.forEach(function (el) { el.inert = !value; });
      refresh();

      // The first time, bring the questions into view if they open below the fold
      if (value && fromUser && firstTime) {
        var target = form.querySelector("[data-path-fields]:not([hidden])");
        if (!target) return;
        setTimeout(function () {
          var top = target.getBoundingClientRect().top;
          if (top > window.innerHeight * 0.7) {
            window.scrollTo({ top: window.scrollY + top - window.innerHeight * 0.35, behavior: reduceMotion ? "auto" : "smooth" });
          }
        }, 120);
      }
    }

    /* ---------- The path pills ---------- */
    form.querySelectorAll(".note-path").forEach(function (pill) {
      pill.addEventListener("pointerdown", function () { byPointer = true; });
    });
    form.addEventListener("keydown", function (e) {
      if (e.target.name !== "tag") return;
      byPointer = false;
      if (e.key === "Enter") e.preventDefault(); // Enter on a path shouldn't send an empty note
    });

    /* ---------- Errors (monochrome: an ink line and a short message) ---------- */
    function holder(el) { return el.closest("[data-field]") || el; }
    function controls(h) {
      return h.matches("input, select, textarea") ? [h] : Array.prototype.slice.call(h.querySelectorAll("input, select, textarea"));
    }
    function isValid(h) {
      return controls(h).every(function (c) { return !c.willValidate || c.checkValidity(); });
    }
    function showError(h) {
      h.classList.add("is-invalid");
      controls(h).forEach(function (c) { c.setAttribute("aria-invalid", "true"); });
    }
    function clearError(h) {
      h.classList.remove("is-invalid");
      controls(h).forEach(function (c) { c.removeAttribute("aria-invalid"); });
    }
    function say(text) { if (status) status.textContent = text; }

    function summary(bad) {
      if (!current()) return "Choose why you’re writing to begin your note.";
      var names = [], alone = [];
      bad.forEach(function (h) {
        var n = h.getAttribute("data-error-name");
        var a = h.getAttribute("data-error-alone");
        if (n) names.push(n); else if (a) alone.push(a);
      });
      return ((names.length ? "Still to fill in: " + listJoin(names) + ". " : "") + alone.join(" ")).trim();
    }

    /* ---------- Typing ---------- */
    function onEdit(e) {
      var el = e.target;
      if (el.name === "tag") {
        if (e.type !== "change") return;
        setPath(el.value, byPointer);
        clearError(holder(el));
        say("");
        return;
      }
      if (el.name && el.type !== "radio" && el.type !== "checkbox" && el.type !== "hidden") memory[el.name] = el.value;
      if (el.hasAttribute("data-autosize")) fit(el);
      if (el.hasAttribute("data-autogrow")) grow(el);
      var h = holder(el);
      if (h.classList.contains("is-invalid") && isValid(h)) clearError(h);
      if (status && status.textContent && !form.querySelector(".is-invalid")) say("");
    }
    form.addEventListener("input", onEdit);
    form.addEventListener("change", onEdit);

    /* ---------- Sending ---------- */
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      if (form.classList.contains("is-sending")) return;

      form.querySelectorAll(".is-invalid").forEach(clearError);
      var bad = [];
      if (!current()) {
        bad.push(holder(paths[0]));
      } else {
        Array.prototype.forEach.call(form.elements, function (el) {
          if (!el.willValidate || el.type === "hidden" || el.closest(".trap")) return;
          if (!el.checkValidity()) {
            var h = holder(el);
            if (bad.indexOf(h) < 0) bad.push(h);
          }
        });
      }

      if (bad.length) {
        bad.forEach(showError);
        say(summary(bad));
        var first = controls(bad[0])[0];
        if (first) {
          (first.closest(".note-who, .check") || first).scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "center" });
          first.focus({ preventScroll: true });
        }
        return;
      }
      say("");
      send(collect());
    });

    function collect() {
      var data = {};
      new FormData(form).forEach(function (value, key) {
        value = String(value).trim();
        if (!value) return;
        data[key] = data[key] ? data[key] + ", " + value : value;
      });
      ["website", "linkedin_url"].forEach(function (k) {
        if (data[k] && !/^https?:\/\//i.test(data[k])) data[k] = "https://" + data[k];
      });
      data.page = location.href.split(/[?#]/)[0];
      data.submitted_at = new Date().toISOString();
      data.seconds_on_form = Math.round((Date.now() - started) / 1000);
      return data;
    }

    function send(data) {
      // The spam trap was filled in: thank the bot and send nothing
      if (data.fax) { finish(data); return; }
      delete data.fax;

      var endpoint = form.getAttribute("data-endpoint");
      if (!endpoint) {
        console.info("[contact] No endpoint yet (the GoHighLevel webhook is the last step). This is what would be sent:", data);
        finish(data);
        return;
      }
      form.classList.add("is-sending");
      if (submitLabel) submitLabel.textContent = "Sending…";
      fetch(endpoint, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) })
        .then(function (r) { if (!r.ok) throw new Error("HTTP " + r.status); finish(data); })
        .catch(function () { say("Your note didn’t go through. Please try again in a moment."); })
        .then(function () {
          form.classList.remove("is-sending");
          if (submitLabel) submitLabel.textContent = submitText;
        });
    }

    function finish(data) {
      if (!done) return;
      done.querySelectorAll("[data-done-email]").forEach(function (el) { el.textContent = data.email || "you"; });
      form.hidden = true;
      done.hidden = false;
      done.focus({ preventScroll: true });
      // Back to the top when the thank-you fits on the first screen, under the headline
      var top = window.scrollY + done.getBoundingClientRect().top;
      window.scrollTo({ top: top < window.innerHeight * 0.8 ? 0 : top - 180, behavior: reduceMotion ? "auto" : "smooth" });
    }

    if (done) {
      var again = done.querySelector("[data-contact-again]");
      if (again) again.addEventListener("click", function () {
        form.reset();
        memory = {};
        started = Date.now();
        form.querySelectorAll(".is-invalid").forEach(clearError);
        form.querySelectorAll("textarea[maxlength]").forEach(function (t) { if (t._count) t._count(); });
        say("");
        done.hidden = true;
        form.hidden = false;
        setPath("", false);
        paths[0].focus({ preventScroll: true });
      });
    }

    // Start: a browser may bring back a choice from before a reload
    setPath(current(), false);
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(refresh);
    var queued = false;
    window.addEventListener("resize", function () {
      if (queued) return;
      queued = true;
      requestAnimationFrame(function () { queued = false; refresh(); });
    });
  }

  document.querySelectorAll("[data-contact-form]").forEach(initForm);
})();
