/* ==========================================================================
   The mark (About, block 5): the A-mark carved large into a dark concrete
   wall, with a beam of sunlight moving slowly across it and back.
   A ConcreteSurface on the section (the hero's tiled concrete, darkened),
   the mark carved by concrete.js from [data-carve="mark"] with wide walls,
   so it reads as a deep cut: the lower-right walls catch the light, the
   upper-left walls throw a shadow onto the floor of the cut.
   The light is the CTA's (Home, closing.js), at the user's request: a crisp
   beam rising to the right at 22°, with a faint glow either side and fine
   dust turning in it, sweeping across the mark and back every 18 s (easing
   at both ends). It fades in along its length, as from a high opening on the
   right, so it is full over the mark and gone before Capital; it dims behind
   Capital and Creative, so their text keeps its contrast. Its width and path
   are measured on the mark, so it crosses the whole mark at any screen size.
   Review switch: ?mark=window brings back the window light (soft streaks
   drifting across, after the user's reference image).
   With reduced motion: the beam stands still across the mark.
   Built to become a Framer code component (props: beam angle, width,
   period, dust, tone).
   ========================================================================== */
(function () {
  "use strict";

  var host = document.querySelector("[data-mark]");
  if (!host || !window.ConcreteSurface) return;
  var symbol = host.querySelector(".mark__symbol");
  var useWindow = /[?&]mark=window\b/.test(location.search);

  var beam = useWindow ? null : { angle: 22, width: 100, soft: 30, from: -300, to: 300, fadeFrom: -900, fadeTo: -400 };
  var win = useWindow ? { angle: 32, width: 180, length: 400, soft: 80, bar: 92, lit: 0.4, barSoft: 0.24, from: [0, 0], to: [0, 0] } : null;

  var surface = new window.ConcreteSurface(host, {
    canvas: ".mark__canvas",
    tone: 0.42,                // a dark wall
    bevel: 2.4,                // wide walls: a deep cut
    sun: useWindow ? 1.22 : 1.0,   // the beam: bright on the dark wall, the concrete still showing in it
    cursor: 0.1,
    period: useWindow ? 40 : 18,   // across and back, in seconds (the CTA's 18 s)
    staticBand: useWindow ? 0.3 : 0.5,   // with reduced motion: across the mark
    vignette: 0.42,            // the wall falls into shade towards its edges
    beam: beam,
    window: win,
    dust: useWindow ? 0 : 0.4, // fine dust turning in the beam, as in the CTA
    shade: ".mark__side",      // the light dims behind the text
    shadeStrength: 0.72,
    shadeFeather: 200,
    smooth: true
  });
  window.arcoviaMark = surface;

  // Measure the light on the mark itself
  function fitLight() {
    if (!symbol) return;
    var hr = host.getBoundingClientRect(), r = symbol.getBoundingClientRect();
    if (win) {
      var x = r.left - hr.left, y = r.top - hr.top;
      win.from = [x + r.width * 0.26, y + r.height * 0.3];
      win.to = [x + r.width * 0.78, y + r.height * 0.3];
      win.width = r.width * 0.25;
      win.length = r.height * 0.72;
      win.bar = r.width * 0.13;
    } else {
      var k = Math.min(r.width / 72, r.height / 57);       // the mark is fitted into its box (viewBox 72 × 57)
      var mw = 72 * k, mh = 57 * k;
      var cx = r.left - hr.left + r.width / 2 - hr.width / 2;   // the mark's centre, from the slab's centre
      var cy = r.top - hr.top + r.height / 2 - hr.height / 2;
      var a = beam.angle * Math.PI / 180;
      var nx = Math.sin(a), ny = Math.cos(a);              // across the beam (y down)
      var dx = Math.cos(a), dy = -Math.sin(a);             // along it, towards the upper right
      var across = cx * nx + cy * ny;
      var half = (mw / 2) * nx + (mh / 2) * ny;            // the mark's half extent across the beam
      beam.width = mh * 0.17;                              // as wide on the mark as the CTA's beam on its lockup
      beam.soft = mh * 0.055;
      beam.from = across - half * 0.66;                    // from across the circle...
      beam.to = across + half * 0.5;                       // ...down to the lower legs, clear of the label
      var along = cx * dx + cy * dy;
      beam.fadeFrom = along - mw * 0.72;                   // nothing left of the mark's left foot...
      beam.fadeTo = along - mw * 0.18;                     // ...full from the left leg on
    }
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
