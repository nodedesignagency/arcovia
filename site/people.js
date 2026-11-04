/* Arcovia — people (the Team page and the profiles, team/<slug>.html)

   Direct emails: the markup carries only the name (data-email="colin", optional
   data-domain, arcovia.io by default) and a spelled-out fallback ("colin [at]
   arcovia.io"), so the address is never in the HTML for spam bots to harvest.
   It is put together here: [data-email] gets the address as its text and link,
   [data-mailto] (a button with its own label) gets only the link.

   The advisors' short note ("Contact via Arcovia", [data-note-form]): written like
   the Contact page's note. Its blanks grow with what is typed, errors are an ink
   line and a short message, it has the spam trap and saves the visit source. It
   names the advisor (hidden fields). Sending: data-endpoint takes the GoHighLevel
   webhook URL (the last step, as for Contact; data-send="form" posts form-encoded
   if the webhook refuses browser requests). Until then it logs what it would send
   and shows the thank-you. */
(function () {
  "use strict";

  function address(el, attr) {
    return el.getAttribute(attr) + "@" + (el.getAttribute("data-domain") || "arcovia.io");
  }
  document.querySelectorAll("[data-email]").forEach(function (a) {
    var addr = address(a, "data-email");
    a.setAttribute("href", "mailto:" + addr);
    a.textContent = addr;
  });
  document.querySelectorAll("[data-mailto]").forEach(function (a) {
    a.setAttribute("href", "mailto:" + address(a, "data-mailto"));
  });

  /* ---------- The advisors' short note ---------- */
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

  // Blanks grow with what is written in them; the note's text grows a line at a time
  var ctx = document.createElement("canvas").getContext("2d");
  function fit(el) {
    if (!el.getClientRects().length) return;
    var cs = getComputedStyle(el);
    ctx.font = cs.fontStyle + " " + cs.fontWeight + " " + cs.fontSize + " " + cs.fontFamily;
    var text = el.value || el.placeholder || "";
    var ls = parseFloat(cs.letterSpacing) || 0;
    el.style.width = Math.ceil(ctx.measureText(text).width + ls * text.length + parseFloat(cs.paddingLeft) + parseFloat(cs.paddingRight) + 1) + "px";
  }
  function grow(el) {
    if (!el.getClientRects().length) return;
    var cs = getComputedStyle(el);
    el.style.height = "auto";
    el.style.height = (el.scrollHeight + parseFloat(cs.borderTopWidth) + parseFloat(cs.borderBottomWidth)) + "px";
  }
  function listJoin(items) {
    if (items.length < 2) return items.join("");
    return items.slice(0, -1).join(", ") + " and " + items[items.length - 1];
  }

  document.querySelectorAll("[data-note-form]").forEach(function (form) {
    var scope = form.closest("[data-profile-note]") || form.parentNode;
    var done = scope.querySelector("[data-note-done]");
    var status = form.querySelector("[data-status]");
    var submitLabel = form.querySelector("[data-submit-label]");
    var submitText = submitLabel ? submitLabel.textContent : "";
    var started = Date.now();

    function refresh() {
      form.querySelectorAll("[data-autosize]").forEach(fit);
      form.querySelectorAll("[data-autogrow]").forEach(grow);
    }
    refresh();
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(refresh);
    window.addEventListener("resize", refresh);

    // The visit source goes in the hidden fields (again after "Write another note": reset empties them)
    function fillVisit() {
      var visit = readVisit();
      Object.keys(visit).forEach(function (k) {
        var f = form.querySelector('input[type="hidden"][name="' + k + '"]');
        if (f) f.value = visit[k];
      });
    }
    fillVisit();

    // Errors, monochrome: an ink line under the blank and a short message
    function holder(el) { return el.closest("[data-field]") || el; }
    function controls(h) {
      return h.matches("input, textarea") ? [h] : Array.prototype.slice.call(h.querySelectorAll("input, textarea"));
    }
    function showError(h) { h.classList.add("is-invalid"); controls(h).forEach(function (c) { c.setAttribute("aria-invalid", "true"); }); }
    function clearError(h) { h.classList.remove("is-invalid"); controls(h).forEach(function (c) { c.removeAttribute("aria-invalid"); }); }
    function say(text) { if (status) status.textContent = text; }
    function summary(bad) {
      var names = [], alone = [];
      bad.forEach(function (h) {
        var n = h.getAttribute("data-error-name"), a = h.getAttribute("data-error-alone");
        if (n) names.push(n); else if (a) alone.push(a);
      });
      return ((names.length ? "Still to fill in: " + listJoin(names) + ". " : "") + alone.join(" ")).trim();
    }

    function onEdit(e) {
      var el = e.target;
      if (el.hasAttribute("data-autosize")) fit(el);
      if (el.hasAttribute("data-autogrow")) grow(el);
      var h = holder(el);
      if (h.classList.contains("is-invalid") && controls(h).every(function (c) { return c.checkValidity(); })) clearError(h);
      // The message keeps up: it lists only what is still missing
      if (status && status.textContent) say(summary(Array.prototype.slice.call(form.querySelectorAll(".is-invalid"))));
    }
    form.addEventListener("input", onEdit);
    form.addEventListener("change", onEdit);

    form.addEventListener("submit", function (e) {
      e.preventDefault();
      if (form.classList.contains("is-sending")) return;
      form.querySelectorAll(".is-invalid").forEach(clearError);
      var bad = [];
      Array.prototype.forEach.call(form.elements, function (el) {
        if (!el.willValidate || el.type === "hidden" || el.closest(".trap")) return;
        if (!el.checkValidity()) { var h = holder(el); if (bad.indexOf(h) < 0) bad.push(h); }
      });
      if (bad.length) {
        bad.forEach(showError);
        say(summary(bad));
        var first = controls(bad[0])[0];
        if (first) {
          (first.closest(".check") || first).scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "center" });
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
        if (value) data[key] = value;
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
        console.info("[profile] No endpoint yet (the GoHighLevel webhook is the last step). This is what would be sent:", data);
        finish(data);
        return;
      }
      form.classList.add("is-sending");
      if (submitLabel) submitLabel.textContent = "Sending…";
      var asForm = form.getAttribute("data-send") === "form";
      var request = asForm
        ? fetch(endpoint, { method: "POST", mode: "no-cors", body: new URLSearchParams(data) })
        : fetch(endpoint, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) });
      request
        .then(function (r) { if (!asForm && !r.ok) throw new Error("HTTP " + r.status); finish(data); })
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
      done.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "center" });
    }

    var again = done && done.querySelector("[data-note-again]");
    if (again) again.addEventListener("click", function () {
      form.reset();
      fillVisit();
      started = Date.now();
      form.querySelectorAll(".is-invalid").forEach(clearError);
      say("");
      done.hidden = true;
      form.hidden = false;
      refresh();
      var firstField = form.querySelector("input:not([type=hidden]), textarea");
      if (firstField) firstField.focus();
    });
  });
})();
