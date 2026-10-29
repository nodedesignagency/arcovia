/* ==========================================================================
   WorldMap — the compact world map: a dotted globe with the eight cities,
   arcs drawn out from Los Angeles. Built as one self-contained class so it
   can become a Framer code component later (props: cities, origin, view
   centre, dot colour).

   How it works
   - Land is a fixed set of dots (assets/land-dots.js, from Natural Earth),
     drawn on a canvas in an orthographic view, smaller and fainter towards
     the edge of the globe so it reads as a sphere.
   - Arcs, markers and their hit areas are SVG on top; labels are HTML, so
     they stay crisp. Each arc follows the great circle from Los Angeles,
     lifted off the surface in proportion to its length; any part that
     passes behind the globe is left out.
   - The offices (Los Angeles, San Juan) are always labelled (on phones only
     when picked, as the city list right below names them). Any other city
     shows its label while its marker or its row in the city list
     ([data-city]) is hovered, focused or tapped; its arc darkens and the
     others fade.
   - The arcs draw out one after another the first time the map comes into
     view. With reduced motion they are simply there.
   ========================================================================== */
(function () {
  "use strict";

  var NS = "http://www.w3.org/2000/svg";
  var RAD = Math.PI / 180;

  function parseDots(str) {
    var out = [];
    (str || "").split(";").forEach(function (row) {
      var parts = row.split(":");
      var lat = parseInt(parts[0], 10) / 10;
      parts[1].split(",").forEach(function (lon) { out.push([lat, parseInt(lon, 10) / 10]); });
    });
    return out;
  }

  function toVec(lat, lon) {
    var p = lat * RAD, l = lon * RAD;
    return [Math.cos(p) * Math.cos(l), Math.cos(p) * Math.sin(l), Math.sin(p)];
  }

  function coords(lat, lon) {
    return Math.abs(lat).toFixed(2) + "°" + (lat >= 0 ? "N" : "S") + ", " + Math.abs(lon).toFixed(2) + "°" + (lon >= 0 ? "E" : "W");
  }

  function WorldMap(root) {
    this.root = root;
    this.stage = root.querySelector(".map__stage");
    this.canvas = root.querySelector(".map__dots");
    this.svg = root.querySelector(".map__lines");
    this.labelLayer = root.querySelector(".map__labels");
    this.cities = Array.prototype.slice.call(root.querySelectorAll("[data-city]")).map(function (el) {
      return {
        id: el.getAttribute("data-city"),
        name: el.getAttribute("data-name"),
        lat: parseFloat(el.getAttribute("data-lat")),
        lon: parseFloat(el.getAttribute("data-lon")),
        office: el.hasAttribute("data-office"),
        side: el.getAttribute("data-side") || "right",
        row: el
      };
    });
    this.origin = this.cities.filter(function (c) { return c.id === root.getAttribute("data-origin"); })[0] || this.cities[0];
    this.center = { lat: parseFloat(root.getAttribute("data-center-lat")) || 20, lon: parseFloat(root.getAttribute("data-center-lon")) || -35 };
    this.dots = parseDots(window.ARCOVIA_LAND_DOTS);
    this.drawn = false;
    this.reduced = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  }

  WorldMap.prototype.init = function () {
    var self = this;
    this.build();
    this.layout();

    var width = window.innerWidth;
    window.addEventListener("resize", function () {
      if (window.innerWidth === width) return;
      width = window.innerWidth;
      self.layout();
    });

    if (this.reduced || !("IntersectionObserver" in window)) { this.reveal(true); return; }
    var io = new IntersectionObserver(function (entries) {
      if (!entries[0].isIntersecting) return;
      io.disconnect();
      self.reveal(false);
    }, { threshold: 0.25 });
    io.observe(this.stage);
  };

  // Markers, arcs, hit areas and labels, one set per city
  WorldMap.prototype.build = function () {
    var self = this;
    this.arcGroup = document.createElementNS(NS, "g");
    this.markGroup = document.createElementNS(NS, "g");
    this.svg.appendChild(this.arcGroup);
    this.svg.appendChild(this.markGroup);

    this.cities.forEach(function (c, i) {
      if (c !== self.origin) {
        c.arc = document.createElementNS(NS, "path");
        c.arc.setAttribute("class", "map__arc");
        c.arc.style.setProperty("--n", i);
        self.arcGroup.appendChild(c.arc);
      }
      c.mark = document.createElementNS(NS, "rect");
      c.mark.setAttribute("class", "map__mark" + (c === self.origin ? " map__mark--origin" : ""));
      c.mark.style.setProperty("--n", i);
      self.markGroup.appendChild(c.mark);

      c.hit = document.createElementNS(NS, "circle");
      c.hit.setAttribute("class", "map__hit");
      c.hit.setAttribute("r", 16);
      self.markGroup.appendChild(c.hit);

      c.label = document.createElement("div");
      c.label.className = "map__label" + (c.office ? " map__label--office" : "");
      c.label.style.setProperty("--n", c === self.origin ? -10 : i);
      c.label.setAttribute("aria-hidden", "true");
      c.label.innerHTML = '<span class="map__label-name"></span><span class="map__label-meta"></span>';
      c.label.firstChild.textContent = c.name;
      c.label.lastChild.textContent = (c.office ? "Office · " : "") + coords(c.lat, c.lon);
      self.labelLayer.appendChild(c.label);

      var on = function () { self.focus(c); };
      var off = function () { self.focus(null); };
      c.hit.addEventListener("pointerenter", on);
      c.hit.addEventListener("pointerleave", off);
      c.row.addEventListener("pointerenter", on);
      c.row.addEventListener("pointerleave", off);
      c.row.addEventListener("focus", on);
      c.row.addEventListener("blur", off);
    });
  };

  // How high above the globe's centre (cy) the highest arc reaches, in px (negative is up)
  WorldMap.prototype.arcTop = function () {
    var self = this, o = toVec(this.origin.lat, this.origin.lon), min = -this.R;
    this.cities.forEach(function (c) {
      if (c === self.origin) return;
      self.arcPoints(o, toVec(c.lat, c.lon)).forEach(function (q) { if (q[3]) min = Math.min(min, q[1]); });
    });
    return min;
  };

  // Points along the great circle from a to b, lifted off the surface in
  // proportion to its length: [x, y, z, visible]
  WorldMap.prototype.arcPoints = function (o, v) {
    var ang = Math.acos(Math.max(-1, Math.min(1, o[0] * v[0] + o[1] * v[1] + o[2] * v[2])));
    var lift = 0.26 * (ang / Math.PI);
    var pts = [], steps = 72;
    for (var k = 0; k <= steps; k++) {
      var t = k / steps;
      var a = Math.sin((1 - t) * ang) / Math.sin(ang), b = Math.sin(t * ang) / Math.sin(ang);
      var q = this.project([a * o[0] + b * v[0], a * o[1] + b * v[1], a * o[2] + b * v[2]], 1 + lift * Math.sin(Math.PI * t));
      q.push(q[2] > 0 || Math.hypot(q[0] - this.cx, q[1] - this.cy) > this.R);
      pts.push(q);
    }
    return pts;
  };

  // Project a unit vector (scaled by r) into the view: [x, y, z] in px, z > 0 faces us
  WorldMap.prototype.project = function (v, r) {
    var lat = Math.asin(Math.max(-1, Math.min(1, v[2]))), lon = Math.atan2(v[1], v[0]);
    var p0 = this.center.lat * RAD, dl = lon - this.center.lon * RAD;
    var R = this.R * (r || 1);
    var x = Math.cos(lat) * Math.sin(dl);
    var y = Math.cos(p0) * Math.sin(lat) - Math.sin(p0) * Math.cos(lat) * Math.cos(dl);
    var z = Math.sin(p0) * Math.sin(lat) + Math.cos(p0) * Math.cos(lat) * Math.cos(dl);
    return [this.cx + R * x, this.cy - R * y, z];
  };

  WorldMap.prototype.layout = function () {
    var w = this.stage.clientWidth;
    var phone = w < 600;
    // On phones the city list right below names the offices; their callouts show on tap like the rest
    this.root.classList.toggle("is-compact", phone);
    // Globe size; the room above it is just what the highest arc needs;
    // the city list cuts the globe below its lowest city
    this.R = Math.min(phone ? w * 0.47 : w * 0.3, 400);
    this.cx = w / 2;
    this.cy = 0;
    var arcTop = this.arcTop();
    var top = Math.max(16, Math.ceil(-arcTop) + 20);
    var cut = this.R * 0.88;
    this.cy = top;
    var h = Math.round(top + cut);
    this.stage.style.height = h + "px";
    this.w = w; this.h = h;
    this.drawDots();
    this.drawLines();
  };

  WorldMap.prototype.drawDots = function () {
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    var c = this.canvas;
    c.width = Math.round(this.w * dpr);
    c.height = Math.round(this.h * dpr);
    c.style.width = this.w + "px";
    c.style.height = this.h + "px";
    var g = c.getContext("2d");
    g.setTransform(dpr, 0, 0, dpr, 0, 0);
    g.clearRect(0, 0, this.w, this.h);

    // The sphere: a pale disc, a touch darker at the rim
    var grad = g.createRadialGradient(this.cx - this.R * 0.3, this.cy - this.R * 0.35, this.R * 0.1, this.cx, this.cy, this.R);
    grad.addColorStop(0, "#f8f8f8");
    grad.addColorStop(1, "#eeeeee");
    g.fillStyle = grad;
    g.beginPath(); g.arc(this.cx, this.cy, this.R, 0, Math.PI * 2); g.fill();
    g.strokeStyle = "rgba(43, 43, 43, 0.08)";
    g.lineWidth = 1;
    g.stroke();

    // Land: smaller and fainter towards the rim
    var base = Math.max(1.05, this.R / 260);
    g.fillStyle = "#8f8f8f";
    for (var i = 0; i < this.dots.length; i++) {
      var p = this.project(toVec(this.dots[i][0], this.dots[i][1]));
      if (p[2] <= 0.02) continue;
      g.globalAlpha = 0.25 + 0.75 * Math.sqrt(p[2]);
      g.beginPath();
      g.arc(p[0], p[1], base * (0.55 + 0.45 * p[2]), 0, Math.PI * 2);
      g.fill();
    }
    g.globalAlpha = 1;
  };

  WorldMap.prototype.drawLines = function () {
    var self = this;
    this.svg.setAttribute("viewBox", "0 0 " + this.w + " " + this.h);
    this.svg.setAttribute("width", this.w);
    this.svg.setAttribute("height", this.h);
    var o = toVec(this.origin.lat, this.origin.lon);
    var size = this.R > 250 ? 8 : 7;

    this.cities.forEach(function (c) {
      var v = toVec(c.lat, c.lon);
      var p = self.project(v);
      c.x = p[0]; c.y = p[1];
      var s = c === self.origin ? size + 2 : size;
      c.mark.setAttribute("x", (p[0] - s / 2).toFixed(1));
      c.mark.setAttribute("y", (p[1] - s / 2).toFixed(1));
      c.mark.setAttribute("width", s);
      c.mark.setAttribute("height", s);
      c.hit.setAttribute("cx", p[0].toFixed(1));
      c.hit.setAttribute("cy", p[1].toFixed(1));
      self.placeLabel(c);
      if (!c.arc) return;

      // Great circle from the origin; parts behind the globe are left out
      var d = "", pen = false;
      self.arcPoints(o, v).forEach(function (q) {
        if (q[3]) { d += (pen ? "L" : "M") + q[0].toFixed(1) + " " + q[1].toFixed(1); pen = true; }
        else pen = false;
      });
      c.arc.setAttribute("d", d);
      var len = c.arc.getTotalLength();
      c.arc.style.strokeDasharray = len + " " + len;
      c.arc.style.setProperty("--len", len);
    });
  };

  // Beside the marker, kept inside the stage
  WorldMap.prototype.placeLabel = function (c) {
    var el = c.label;
    var gap = 12;
    var w = el.offsetWidth, h = el.offsetHeight;
    var side = c.side;
    // No room on the preferred side: use the other one rather than cover the marker
    if (side === "left" && c.x - gap - w < 4) side = "right";
    else if (side === "right" && c.x + gap + w > this.w - 4) side = "left";
    var x = side === "left" ? c.x - gap - w : c.x + gap;
    var y = c.y - h / 2;
    if (c.side === "above") { x = c.x - w / 2; y = c.y - gap - h; }
    if (c.side === "below") { x = c.x - w / 2; y = c.y + gap; }
    x = Math.max(4, Math.min(this.w - w - 4, x));
    y = Math.max(4, Math.min(this.h - h - 4, y));
    el.style.transform = "translate(" + Math.round(x) + "px, " + Math.round(y) + "px)";
  };

  WorldMap.prototype.reveal = function (instant) {
    var root = this.root;
    this.drawn = true;
    root.classList.toggle("is-instant", instant);
    root.classList.add("is-drawn");
    // Once everything is in, hover responds at once (the staggered delays only serve the first draw)
    setTimeout(function () { root.classList.add("is-settled"); }, instant ? 0 : 2600);
  };

  WorldMap.prototype.focus = function (city) {
    // Los Angeles is where every arc starts: focusing it keeps them all
    this.root.classList.toggle("has-focus", !!city && city !== this.origin);
    this.cities.forEach(function (c) {
      var on = c === city;
      c.row.classList.toggle("is-active", on);
      c.label.classList.toggle("is-active", on);
      c.mark.classList.toggle("is-active", on);
      if (c.arc) c.arc.classList.toggle("is-active", on);
    });
  };

  window.WorldMap = WorldMap;
  document.querySelectorAll("[data-world-map]").forEach(function (el) {
    if (window.ARCOVIA_LAND_DOTS) new WorldMap(el).init();
  });
})();
