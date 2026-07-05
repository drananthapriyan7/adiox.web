/* ═══════════════════════════════════════════════════════════════
   ADIOX — Home interactions
   Canvas "Adiox Core" hero · orbit map · reveals · counters · tabs
═══════════════════════════════════════════════════════════════ */
(function () {
  "use strict";

  var reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ─────────── Nav: condense on scroll ─────────── */
  var nav = document.getElementById("nav");
  function onScrollNav() {
    nav.classList.toggle("scrolled", window.scrollY > 24);
  }
  window.addEventListener("scroll", onScrollNav, { passive: true });
  onScrollNav();

  /* ─────────── Mobile menu ─────────── */
  var burger = document.getElementById("hamburger");
  var mobileMenu = document.getElementById("mobileMenu");
  burger.addEventListener("click", function () {
    var open = burger.classList.toggle("open");
    burger.setAttribute("aria-expanded", open);
    mobileMenu.hidden = !open;
    document.body.style.overflow = open ? "hidden" : "";
  });

  /* ─────────── Smooth anchor scroll ─────────── */
  document.querySelectorAll(".js-scroll").forEach(function (a) {
    a.addEventListener("click", function (e) {
      var target = document.querySelector(a.getAttribute("href"));
      if (target) {
        e.preventDefault();
        target.scrollIntoView({ behavior: reducedMotion ? "auto" : "smooth" });
      }
    });
  });

  /* ─────────── Reveal on scroll ─────────── */
  var revealObs = new IntersectionObserver(function (entries) {
    entries.forEach(function (en) {
      if (en.isIntersecting) {
        en.target.classList.add("visible");
        revealObs.unobserve(en.target);
      }
    });
  }, { threshold: 0.12 });
  document.querySelectorAll(".reveal, .milestone").forEach(function (el) { revealObs.observe(el); });

  /* ─────────── Count-up stats ─────────── */
  function animateCount(el) {
    var target = parseInt(el.dataset.count, 10);
    var prefix = el.dataset.prefix || "";
    if (reducedMotion) { el.textContent = prefix + target.toLocaleString("en-US"); return; }
    var start = null, dur = 1600;
    function step(ts) {
      if (!start) start = ts;
      var p = Math.min((ts - start) / dur, 1);
      var eased = 1 - Math.pow(1 - p, 3);
      el.textContent = prefix + Math.round(target * eased).toLocaleString("en-US");
      if (p < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }
  var countObs = new IntersectionObserver(function (entries) {
    entries.forEach(function (en) {
      if (en.isIntersecting) { animateCount(en.target); countObs.unobserve(en.target); }
    });
  }, { threshold: 0.4 });
  document.querySelectorAll("[data-count]").forEach(function (el) { countObs.observe(el); });

  /* ─────────── Pillar tabs ─────────── */
  var tabs = document.querySelectorAll(".pillar-tab");
  var panels = document.querySelectorAll(".pillar-panel");
  tabs.forEach(function (tab) {
    tab.addEventListener("click", function () {
      tabs.forEach(function (t) { t.classList.remove("active"); t.setAttribute("aria-selected", "false"); });
      panels.forEach(function (p) { p.hidden = true; p.classList.remove("active"); });
      tab.classList.add("active");
      tab.setAttribute("aria-selected", "true");
      var panel = document.getElementById(tab.getAttribute("aria-controls"));
      panel.hidden = false;
      panel.classList.add("active");
    });
  });

  /* ─────────── Journey progress line ─────────── */
  var journeyLine = document.getElementById("journeyLine");
  var jlProgress = document.getElementById("jlProgress");
  if (journeyLine && jlProgress) {
    function updateJourney() {
      var rect = journeyLine.getBoundingClientRect();
      var vh = window.innerHeight;
      var progress = (vh * 0.75 - rect.top) / rect.height;
      progress = Math.max(0, Math.min(1, progress));
      jlProgress.style.height = (progress * 100) + "%";
    }
    window.addEventListener("scroll", updateJourney, { passive: true });
    updateJourney();
  }

  /* ─────────── Magnetic buttons ─────────── */
  if (!reducedMotion && window.matchMedia("(pointer: fine)").matches) {
    document.querySelectorAll(".magnetic").forEach(function (btn) {
      btn.addEventListener("mousemove", function (e) {
        var r = btn.getBoundingClientRect();
        var x = (e.clientX - r.left - r.width / 2) * 0.18;
        var y = (e.clientY - r.top - r.height / 2) * 0.3;
        btn.style.transform = "translate(" + x + "px," + y + "px)";
      });
      btn.addEventListener("mouseleave", function () { btn.style.transform = ""; });
    });

    /* Tilt on device frames */
    document.querySelectorAll(".tilt").forEach(function (wrap) {
      var device = wrap.querySelector(".device");
      if (!device) return;
      wrap.addEventListener("mousemove", function (e) {
        var r = wrap.getBoundingClientRect();
        var rx = ((e.clientY - r.top) / r.height - 0.5) * -8;
        var ry = ((e.clientX - r.left) / r.width - 0.5) * 10;
        device.style.transform = "rotateX(" + rx + "deg) rotateY(" + ry + "deg)";
      });
      wrap.addEventListener("mouseleave", function () { device.style.transform = ""; });
    });
  }

  /* ─────────── Ecosystem orbit map ─────────── */
  var orbitWrap = document.getElementById("orbitWrap");
  var orbitTip = document.getElementById("orbitTip");
  if (orbitWrap) {
    // angle in degrees, radius as fraction of half-size (SVG rings: 150/250/340 of 400)
    var NODES = [
      { label: "Academy",      pillar: "learn",   glyph: "glyph-learn",   angle: 300, r: 0.375, href: "/learn/academy",          tip: "Structured courses and learning paths, free from day one." },
      { label: "AI Coach",     pillar: "learn",   glyph: "glyph-learn",   angle: 235, r: 0.625, href: "/learn/ai-coach",         tip: "Reviews every trade you take and coaches you personally." },
      { label: "Glossary",     pillar: "learn",   glyph: "glyph-learn",   angle: 268, r: 0.85,  href: "/glossary",               tip: "Every prop trading term, explained in 60 seconds." },
      { label: "PropSim",      pillar: "train",   glyph: "glyph-train",   angle: 195, r: 0.375, href: "/train/simulator",        tip: "Practice prop-firm evaluations on simulated capital, from $10." },
      { label: "Backtesting",  pillar: "train",   glyph: "glyph-train",   angle: 160, r: 0.625, href: "/train/backtesting",      tip: "Replay years of market data against your rules." },
      { label: "Journal",      pillar: "train",   glyph: "glyph-train",   angle: 188, r: 0.85,  href: "/train/journal",          tip: "Every trade logged, tagged, and scored automatically." },
      { label: "Tournaments",  pillar: "compete", glyph: "glyph-compete", angle: 105, r: 0.375, href: "/compete/tournaments",    tip: "Free and paid competitions with published prize pools." },
      { label: "The Arena",    pillar: "compete", glyph: "glyph-compete", angle: 70,  r: 0.625, href: "/compete/trading-games",  tip: "1v1 trading duels and squad battles, ranked on skill." },
      { label: "Leaderboards", pillar: "compete", glyph: "glyph-compete", angle: 96,  r: 0.85,  href: "/compete/leaderboards",   tip: "Public, verifiable global rankings." },
      { label: "Challenges",   pillar: "trade",   glyph: "glyph-trade",   angle: 15,  r: 0.375, href: "/trade/challenges",       tip: "1-step, 2-step, instant, and pay-later evaluations." },
      { label: "Copy Trading", pillar: "trade",   glyph: "glyph-trade",   angle: 340, r: 0.625, href: "/trade/copy-trading",     tip: "Follow verified strategies or monetize your own." },
      { label: "PropSync",     pillar: "trade",   glyph: "glyph-trade",   angle: 8,   r: 0.85,  href: "/trade/propsync",         tip: "All your prop accounts on one command deck, with risk tools." }
    ];
    var threads = document.getElementById("orbitThreads");
    var SVGNS = "http://www.w3.org/2000/svg";

    NODES.forEach(function (n, i) {
      var rad = (n.angle - 90) * Math.PI / 180;
      var cx = 50 + Math.cos(rad) * n.r * 50; // percent
      var cy = 50 + Math.sin(rad) * n.r * 50;

      // connecting thread in SVG space (800x800)
      var line = document.createElementNS(SVGNS, "line");
      line.setAttribute("x1", 400); line.setAttribute("y1", 400);
      line.setAttribute("x2", cx * 8); line.setAttribute("y2", cy * 8);
      threads.appendChild(line);

      var node = document.createElement("a");
      node.className = "orbit-node";
      node.href = n.href;
      node.dataset.pillar = n.pillar;
      node.dataset.tip = n.tip;
      node.style.left = cx + "%";
      node.style.top = cy + "%";
      node.style.animationDelay = (i * 0.4) + "s";
      node.innerHTML = '<span class="on-dot"><span class="glyph ' + n.glyph + '"></span></span><span class="on-label">' + n.label + "</span>";
      orbitWrap.appendChild(node);

      node.addEventListener("mouseenter", function () {
        orbitTip.innerHTML = "<b>" + n.label + "</b>" + n.tip;
        orbitTip.hidden = false;
      });
      node.addEventListener("mousemove", function (e) {
        orbitTip.style.left = Math.min(e.clientX + 16, window.innerWidth - 280) + "px";
        orbitTip.style.top = (e.clientY + 18) + "px";
      });
      node.addEventListener("mouseleave", function () { orbitTip.hidden = true; });
    });
  }

  /* ─────────── HERO: "The Adiox Core" canvas ───────────
     Wireframe icosahedron core + 4 tilted orbit rings (one per pillar),
     cursor parallax, paused off-screen. Pure 2D-canvas 3D projection. */
  var canvas = document.getElementById("coreCanvas");
  if (canvas && !reducedMotion) {
    var ctx = canvas.getContext("2d");
    var W, H, CX, CY, SCALE, dpr;
    var mouseX = 0, mouseY = 0, targetMX = 0, targetMY = 0;
    var running = true, rafId = null;

    function resize() {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      var rect = canvas.parentElement.getBoundingClientRect();
      W = rect.width; H = rect.height;
      canvas.width = W * dpr; canvas.height = H * dpr;
      canvas.style.width = W + "px"; canvas.style.height = H + "px";
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      CX = W / 2; CY = H * 0.46;
      SCALE = Math.min(W, H) * 0.26;
    }
    resize();
    window.addEventListener("resize", resize);

    window.addEventListener("mousemove", function (e) {
      targetMX = (e.clientX / window.innerWidth - 0.5) * 2;
      targetMY = (e.clientY / window.innerHeight - 0.5) * 2;
    }, { passive: true });

    // Icosahedron geometry
    var PHI = (1 + Math.sqrt(5)) / 2;
    var VERTS = [
      [-1, PHI, 0], [1, PHI, 0], [-1, -PHI, 0], [1, -PHI, 0],
      [0, -1, PHI], [0, 1, PHI], [0, -1, -PHI], [0, 1, -PHI],
      [PHI, 0, -1], [PHI, 0, 1], [-PHI, 0, -1], [-PHI, 0, 1]
    ].map(function (v) {
      var len = Math.sqrt(v[0] * v[0] + v[1] * v[1] + v[2] * v[2]);
      return [v[0] / len, v[1] / len, v[2] / len];
    });
    var EDGES = [];
    (function () {
      var minD = Infinity, i, j;
      for (i = 0; i < 12; i++) for (j = i + 1; j < 12; j++) {
        var dx = VERTS[i][0] - VERTS[j][0], dy = VERTS[i][1] - VERTS[j][1], dz = VERTS[i][2] - VERTS[j][2];
        var d = dx * dx + dy * dy + dz * dz;
        if (d < minD - 1e-6) minD = d;
      }
      for (i = 0; i < 12; i++) for (j = i + 1; j < 12; j++) {
        var dx2 = VERTS[i][0] - VERTS[j][0], dy2 = VERTS[i][1] - VERTS[j][1], dz2 = VERTS[i][2] - VERTS[j][2];
        if (dx2 * dx2 + dy2 * dy2 + dz2 * dz2 < minD + 1e-4) EDGES.push([i, j]);
      }
    })();

    // Rings: one per pillar — {tilt axis rotation, radius, color, speed}
    var RINGS = [
      { color: "59,130,246",  radius: 1.55, tiltX: 0.45,  tiltZ: 0.1,  speed: 0.00022, phase: 0 },     // Learn (blue)
      { color: "34,211,238",  radius: 1.95, tiltX: -0.55, tiltZ: 0.35, speed: -0.00018, phase: 1.5 },  // Train (teal)
      { color: "139,92,246",  radius: 2.35, tiltX: 0.7,   tiltZ: -0.4, speed: 0.00014, phase: 3.1 },   // Compete (violet)
      { color: "245,185,66",  radius: 2.75, tiltX: -0.35, tiltZ: 0.6,  speed: -0.00011, phase: 4.6 }   // Trade (gold)
    ];
    var RING_SEGS = 90;
    var PARTICLES = [];
    RINGS.forEach(function (ring, ri) {
      for (var p = 0; p < 3; p++) PARTICLES.push({ ring: ri, offset: (p / 3) * Math.PI * 2 });
    });

    function rotate(v, ax, ay) {
      // rotate around X then Y
      var y = v[1] * Math.cos(ax) - v[2] * Math.sin(ax);
      var z = v[1] * Math.sin(ax) + v[2] * Math.cos(ax);
      var x = v[0] * Math.cos(ay) + z * Math.sin(ay);
      z = -v[0] * Math.sin(ay) + z * Math.cos(ay);
      return [x, y, z];
    }
    function project(v) {
      var persp = 3.6 / (3.6 + v[2]);
      return [CX + v[0] * SCALE * persp, CY + v[1] * SCALE * persp, persp, v[2]];
    }

    function draw(t) {
      if (!running) return;
      ctx.clearRect(0, 0, W, H);

      mouseX += (targetMX - mouseX) * 0.04;
      mouseY += (targetMY - mouseY) * 0.04;

      var rotX = 0.35 + mouseY * 0.12;
      var rotY = t * 0.00012 + mouseX * 0.25;

      // ── core glow
      var glow = ctx.createRadialGradient(CX, CY, 0, CX, CY, SCALE * 1.5);
      glow.addColorStop(0, "rgba(59,130,246,0.22)");
      glow.addColorStop(0.5, "rgba(59,130,246,0.06)");
      glow.addColorStop(1, "rgba(59,130,246,0)");
      ctx.fillStyle = glow;
      ctx.fillRect(CX - SCALE * 2, CY - SCALE * 2, SCALE * 4, SCALE * 4);

      // ── rings (draw far halves first, then core, then near halves)
      var ringPts = RINGS.map(function (ring) {
        var pts = [];
        var spin = t * ring.speed + ring.phase;
        for (var s = 0; s <= RING_SEGS; s++) {
          var a = (s / RING_SEGS) * Math.PI * 2 + spin;
          var v = [Math.cos(a) * ring.radius, 0, Math.sin(a) * ring.radius];
          // ring tilt
          v = rotate(v, ring.tiltX, ring.tiltZ);
          // scene rotation
          v = rotate(v, rotX, rotY);
          pts.push(project(v));
        }
        return pts;
      });

      function strokeRingHalf(ri, near) {
        var pts = ringPts[ri];
        ctx.beginPath();
        var started = false;
        for (var s = 0; s < pts.length; s++) {
          var isNear = pts[s][3] < 0;
          if (isNear === near) {
            if (!started) { ctx.moveTo(pts[s][0], pts[s][1]); started = true; }
            else ctx.lineTo(pts[s][0], pts[s][1]);
          } else started = false;
        }
        ctx.strokeStyle = "rgba(" + RINGS[ri].color + "," + (near ? 0.55 : 0.18) + ")";
        ctx.lineWidth = near ? 1.4 : 1;
        ctx.stroke();
      }
      for (var r1 = RINGS.length - 1; r1 >= 0; r1--) strokeRingHalf(r1, false);

      // ── icosahedron core
      var proj = VERTS.map(function (v) {
        var rv = rotate(v, rotX * 1.6, t * 0.0004 + rotY);
        return project([rv[0] * 0.75, rv[1] * 0.75, rv[2] * 0.75]);
      });
      EDGES.forEach(function (e) {
        var a = proj[e[0]], b = proj[e[1]];
        var depth = ((a[2] + b[2]) / 2 - 0.8) * 2.2;
        var alpha = Math.max(0.08, Math.min(0.8, depth));
        ctx.beginPath();
        ctx.moveTo(a[0], a[1]); ctx.lineTo(b[0], b[1]);
        ctx.strokeStyle = "rgba(147,197,253," + alpha + ")";
        ctx.lineWidth = 1.1;
        ctx.stroke();
      });
      proj.forEach(function (p) {
        ctx.beginPath();
        ctx.arc(p[0], p[1], 1.8 * p[2], 0, Math.PI * 2);
        ctx.fillStyle = "rgba(191,219,254,0.9)";
        ctx.fill();
      });

      // core center flare
      var flare = ctx.createRadialGradient(CX, CY, 0, CX, CY, SCALE * 0.4);
      flare.addColorStop(0, "rgba(147,197,253,0.5)");
      flare.addColorStop(1, "rgba(147,197,253,0)");
      ctx.fillStyle = flare;
      ctx.fillRect(CX - SCALE, CY - SCALE, SCALE * 2, SCALE * 2);

      // ── near ring halves + particles
      for (var r2 = 0; r2 < RINGS.length; r2++) strokeRingHalf(r2, true);
      PARTICLES.forEach(function (pt) {
        var ring = RINGS[pt.ring];
        var a = t * ring.speed * 14 + pt.offset;
        var v = [Math.cos(a) * ring.radius, 0, Math.sin(a) * ring.radius];
        v = rotate(v, ring.tiltX, ring.tiltZ);
        v = rotate(v, rotX, rotY);
        var p = project(v);
        var size = 2.6 * p[2];
        var g = ctx.createRadialGradient(p[0], p[1], 0, p[0], p[1], size * 4);
        g.addColorStop(0, "rgba(" + ring.color + ",0.9)");
        g.addColorStop(1, "rgba(" + ring.color + ",0)");
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(p[0], p[1], size * 4, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = "rgba(255,255,255,0.95)";
        ctx.beginPath();
        ctx.arc(p[0], p[1], size, 0, Math.PI * 2);
        ctx.fill();
      });

      rafId = requestAnimationFrame(draw);
    }

    // pause when hero off-screen
    var heroObs = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting && !running) {
          running = true;
          rafId = requestAnimationFrame(draw);
        } else if (!en.isIntersecting && running) {
          running = false;
          if (rafId) cancelAnimationFrame(rafId);
        }
      });
    }, { threshold: 0.05 });
    heroObs.observe(canvas.parentElement);

    rafId = requestAnimationFrame(draw);
  } else if (canvas) {
    // reduced-motion: static poster — single frame gradient glow
    var sctx = canvas.getContext("2d");
    var rect = canvas.parentElement.getBoundingClientRect();
    canvas.width = rect.width; canvas.height = rect.height;
    var g = sctx.createRadialGradient(rect.width / 2, rect.height * 0.45, 0, rect.width / 2, rect.height * 0.45, Math.min(rect.width, rect.height) * 0.5);
    g.addColorStop(0, "rgba(59,130,246,0.25)");
    g.addColorStop(1, "rgba(59,130,246,0)");
    sctx.fillStyle = g;
    sctx.fillRect(0, 0, rect.width, rect.height);
  }
})();
