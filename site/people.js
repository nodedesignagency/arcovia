/* Arcovia — people (Team page, and later the profile template)
   Direct emails: the markup carries only the name (data-email="colin", optional
   data-domain, arcovia.io by default) and a spelled-out fallback ("colin [at]
   arcovia.io"), so the address is never in the HTML for spam bots to harvest.
   It is put together here. */
(function () {
  "use strict";

  document.querySelectorAll("[data-email]").forEach(function (a) {
    var addr = a.getAttribute("data-email") + "@" + (a.getAttribute("data-domain") || "arcovia.io");
    a.setAttribute("href", "mailto:" + addr);
    a.textContent = addr;
  });
})();
