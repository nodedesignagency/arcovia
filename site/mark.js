/* ==========================================================================
   The mark (About, block 5): the A-mark carved large into a dark concrete
   wall, with window light drifting slowly across it and back (after the
   user's reference).
   A ConcreteSurface on the section (the hero's tiled concrete, darkened),
   the mark carved by concrete.js from [data-carve="mark"] with wide walls,
   so it reads as a deep cut: the lower-right walls catch the light, the
   upper-left walls throw a shadow onto the floor of the cut.
   The light is a patch of sun through a window: soft parallel bars rising to
   the right, travelling from the mark's upper left to its upper right in
   20 s and back in 20 s, easing at both ends, wherever the mark sits at any
   screen size. It dims behind Capital and Creative, so their text keeps its
   contrast.
   With reduced motion: the light stands still over the left of the mark.
   Built to become a Framer code component (props: light angle, size,
   period, tone).
   ========================================================================== */
(function () {
  "use strict";

  var host = document.querySelector("[data-mark]");
  if (!host || !window.ConcreteSurface) return;
  var symbol = host.querySelector(".mark__symbol");

  var win = { angle: 32, width: 180, length: 400, soft: 80, bar: 92, lit: 0.4, barSoft: 0.24, from: [0, 0], to: [0, 0] };
  var surface = new window.ConcreteSurface(host, {
    canvas: ".mark__canvas",
    tone: 0.42,                // a dark wall, as in the reference
    bevel: 2.4,                // wide walls: a deep cut
    sun: 1.22,                 // the window light: bright on the dark wall, the concrete still showing in it
    cursor: 0.2,
    period: 40,                // across and back, in seconds
    staticBand: 0.3,           // with reduced motion: over the left of the mark
    vignette: 0.42,            // the wall falls into shade towards its edges
    window: win,
    shade: ".mark__side",      // the light dims behind the text
    shadeStrength: 0.72,
    shadeFeather: 200,
    smooth: true
  });
  window.arcoviaMark = surface;

  // The light travels from the mark's upper left to its upper right, measured on the mark itself
  function fitLight() {
    if (!symbol) return;
    var hr = host.getBoundingClientRect(), r = symbol.getBoundingClientRect();
    var x = r.left - hr.left, y = r.top - hr.top;
    win.from = [x + r.width * 0.26, y + r.height * 0.3];
    win.to = [x + r.width * 0.78, y + r.height * 0.3];
    win.width = r.width * 0.25;
    win.length = r.height * 0.72;
    win.bar = r.width * 0.13;
    surface.needsFrame = true;
  }

  surface.init().then(function (ok) {
    if (!ok) return;
    fitLight();
    host.classList.add("is-live");
    surface.kick();
    var queued = false;
    window.addEventListener("resize", function () {
      if (queued) return;
      queued = true;
      requestAnimationFrame(function () { queued = false; fitLight(); surface.kick(); });
    });
  });
})();
