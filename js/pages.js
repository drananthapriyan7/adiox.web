/* ═══════════════════════════════════════════════════════════════
   ADIOX — Shared page interactions (ecosystem + pillar hubs)
   Nav · reveals · counters · magnetic/tilt · chapter dots ·
   per-pillar canvas environments (data-scene on the canvas element)
═══════════════════════════════════════════════════════════════ */
(function () {
  "use strict";

  var reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var finePointer = window.matchMedia("(pointer: fine)").matches;

  /* ─────────── Nav ─────────── */
  var nav = document.getElementById("nav");
  if (nav) {
    var onScrollNav = function () { nav.classList.toggle("scrolled", window.scrollY > 24); };
    window.addEventListener("scroll", onScrollNav, { passive: true });
    onScrollNav();
  }
  var burger = document.getElementById("hamburger");
  var mobileMenu = document.getElementById("mobileMenu");
  if (burger && mobileMenu) {
    burger.addEventListener("click", function () {
      var open = burger.classList.toggle("open");
      burger.setAttribute("aria-expanded", open);
      mobileMenu.hidden = !open;
      document.body.style.overflow = open ? "hidden" : "";
    });
  }

  /* ─────────── Reveal on scroll ─────────── */
  var revealObs = new IntersectionObserver(function (entries) {
    entries.forEach(function (en) {
      if (en.isIntersecting) { en.target.classList.add("visible"); revealObs.unobserve(en.target); }
    });
  }, { threshold: 0.12 });
  document.querySelectorAll(".reveal").forEach(function (el) { revealObs.observe(el); });

  /* ─────────── Count-up ─────────── */
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

  /* ─────────── Magnetic + tilt ─────────── */
  if (!reducedMotion && finePointer) {
    document.querySelectorAll(".magnetic").forEach(function (btn) {
      btn.addEventListener("mousemove", function (e) {
        var r = btn.getBoundingClientRect();
        btn.style.transform = "translate(" + ((e.clientX - r.left - r.width / 2) * 0.18) + "px," + ((e.clientY - r.top - r.height / 2) * 0.3) + "px)";
      });
      btn.addEventListener("mouseleave", function () { btn.style.transform = ""; });
    });
    document.querySelectorAll(".tilt").forEach(function (wrap) {
      var device = wrap.querySelector(".device");
      if (!device) return;
      wrap.addEventListener("mousemove", function (e) {
        var r = wrap.getBoundingClientRect();
        device.style.transform = "rotateX(" + (((e.clientY - r.top) / r.height - 0.5) * -8) + "deg) rotateY(" + (((e.clientX - r.left) / r.width - 0.5) * 10) + "deg)";
      });
      wrap.addEventListener("mouseleave", function () { device.style.transform = ""; });
    });
  }

  /* ─────────── Chapter progress dots ─────────── */
  var dots = document.querySelectorAll(".dots-nav a");
  if (dots.length) {
    var sections = [];
    dots.forEach(function (d) {
      var sec = document.querySelector(d.getAttribute("href"));
      if (sec) sections.push({ dot: d, sec: sec });
    });
    var dotObs = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) {
          dots.forEach(function (d) { d.classList.remove("active"); });
          sections.forEach(function (s) { if (s.sec === en.target) s.dot.classList.add("active"); });
        }
      });
    }, { rootMargin: "-40% 0px -50% 0px" });
    sections.forEach(function (s) { dotObs.observe(s.sec); });
  }

  /* ═════════════ Canvas scenes ═════════════ */
  var canvas = document.querySelector("canvas[data-scene]");
  if (!canvas) return;
  var scene = canvas.dataset.scene;
  var ctx = canvas.getContext("2d");
  var W, H, dpr;
  var mx = 0, my = 0, tmx = 0, tmy = 0;
  var running = true, rafId = null;

  function resize() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    var rect = canvas.parentElement.getBoundingClientRect();
    W = rect.width; H = rect.height;
    canvas.width = W * dpr; canvas.height = H * dpr;
    canvas.style.width = W + "px"; canvas.style.height = H + "px";
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  resize();
  window.addEventListener("resize", resize);
  window.addEventListener("mousemove", function (e) {
    tmx = (e.clientX / window.innerWidth - 0.5) * 2;
    tmy = (e.clientY / window.innerHeight - 0.5) * 2;
  }, { passive: true });

  function rand(a, b) { return a + Math.random() * (b - a); }

  /* ── LEARN: constellation library — drifting star map ── */
  function makeConstellation() {
    var stars = [];
    for (var i = 0; i < 90; i++) {
      stars.push({ x: Math.random(), y: Math.random(), r: rand(0.6, 2), tw: rand(0, Math.PI * 2), sp: rand(0.0004, 0.0013), vx: rand(-0.00003, 0.00003), vy: rand(-0.00002, 0.00002) });
    }
    return function (t) {
      ctx.clearRect(0, 0, W, H);
      var px = mx * 14, py = my * 10;
      // link nearby stars
      for (var i = 0; i < stars.length; i++) {
        var a = stars[i];
        a.x = (a.x + a.vx + 1) % 1; a.y = (a.y + a.vy + 1) % 1;
        for (var j = i + 1; j < stars.length; j++) {
          var b = stars[j];
          var dx = (a.x - b.x) * W, dy = (a.y - b.y) * H;
          var d = dx * dx + dy * dy;
          if (d < 9500) {
            ctx.beginPath();
            ctx.moveTo(a.x * W + px, a.y * H + py);
            ctx.lineTo(b.x * W + px, b.y * H + py);
            ctx.strokeStyle = "rgba(59,130,246," + (0.22 * (1 - d / 9500)) + ")";
            ctx.lineWidth = 1;
            ctx.stroke();
          }
        }
      }
      stars.forEach(function (s) {
        var alpha = 0.35 + 0.55 * Math.abs(Math.sin(t * s.sp + s.tw));
        ctx.beginPath();
        ctx.arc(s.x * W + px, s.y * H + py, s.r, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(147,197,253," + alpha + ")";
        ctx.fill();
      });
    };
  }

  /* ── TRAIN: holodeck — perspective grid + materializing candles ── */
  function makeHolodeck() {
    var candles = [];
    for (var i = 0; i < 26; i++) {
      var open = 0.5 + Math.sin(i * 0.6) * 0.14 + rand(-0.05, 0.05);
      candles.push({ open: open, close: open + rand(-0.09, 0.11), hi: rand(0.02, 0.06), lo: rand(0.02, 0.06), born: i * 260 });
    }
    return function (t) {
      ctx.clearRect(0, 0, W, H);
      var horizon = H * 0.62;
      // perspective floor grid
      ctx.strokeStyle = "rgba(34,211,238,0.14)";
      ctx.lineWidth = 1;
      var vx = W / 2 + mx * 30;
      for (var i = -10; i <= 10; i++) {
        ctx.beginPath();
        ctx.moveTo(vx + i * 26, horizon);
        ctx.lineTo(W / 2 + i * W * 0.16, H);
        ctx.stroke();
      }
      var zRows = 9;
      for (var r = 1; r <= zRows; r++) {
        var y = horizon + Math.pow(r / zRows, 2.1) * (H - horizon);
        ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y);
        ctx.strokeStyle = "rgba(34,211,238," + (0.05 + 0.1 * (r / zRows)) + ")";
        ctx.stroke();
      }
      // scan line
      var scanY = horizon * (0.5 + 0.5 * Math.abs(Math.sin(t * 0.00035)));
      var scan = ctx.createLinearGradient(0, scanY - 40, 0, scanY + 40);
      scan.addColorStop(0, "rgba(34,211,238,0)");
      scan.addColorStop(0.5, "rgba(34,211,238,0.08)");
      scan.addColorStop(1, "rgba(34,211,238,0)");
      ctx.fillStyle = scan;
      ctx.fillRect(0, scanY - 40, W, 80);
      // materializing candles above the grid
      var cw = W / (candles.length + 6);
      var cycle = 12000;
      candles.forEach(function (c, i) {
        var life = ((t - c.born) % cycle) / cycle;
        if (life < 0) return;
        var appear = Math.min(1, life * 6);
        var x = cw * (i + 3) + mx * 18;
        var top = H * 0.12, span = horizon - top - 30;
        var yO = top + (1 - c.open) * span, yC = top + (1 - c.close) * span;
        var up = c.close > c.open;
        var col = up ? "34,211,238" : "100,116,139";
        ctx.strokeStyle = "rgba(" + col + "," + 0.6 * appear + ")";
        ctx.beginPath();
        ctx.moveTo(x, Math.min(yO, yC) - c.hi * span);
        ctx.lineTo(x, Math.max(yO, yC) + c.lo * span);
        ctx.stroke();
        ctx.fillStyle = "rgba(" + col + "," + (up ? 0.55 : 0.35) * appear + ")";
        var bh = Math.max(2, Math.abs(yC - yO) * appear);
        ctx.fillRect(x - cw * 0.28, Math.min(yO, yC), cw * 0.56, bh);
      });
    };
  }

  /* ── COMPETE: arena bowl — concentric arcs of pulsing pillars ── */
  function makeArena() {
    return function (t) {
      ctx.clearRect(0, 0, W, H);
      var cx = W / 2 + mx * 24, cy = H * 0.78;
      // spotlight
      var spot = ctx.createRadialGradient(cx, cy, 0, cx, cy, H * 0.7);
      spot.addColorStop(0, "rgba(139,92,246,0.2)");
      spot.addColorStop(1, "rgba(139,92,246,0)");
      ctx.fillStyle = spot;
      ctx.fillRect(0, 0, W, H);
      // tiers of pillars in an arc
      for (var tier = 0; tier < 5; tier++) {
        var radius = H * (0.28 + tier * 0.12);
        var count = 26 + tier * 8;
        for (var i = 0; i <= count; i++) {
          var a = Math.PI + (i / count) * Math.PI; // upper half arc
          var x = cx + Math.cos(a) * radius * 1.35;
          var y = cy + Math.sin(a) * radius * 0.55;
          if (x < -20 || x > W + 20) continue;
          var wave = Math.sin(t * 0.0018 - i * 0.35 - tier * 0.8);
          var h = 8 + tier * 3 + Math.max(0, wave) * (14 + tier * 4);
          var alpha = 0.12 + 0.3 * Math.max(0, wave) + tier * 0.02;
          ctx.fillStyle = "rgba(139,92,246," + alpha + ")";
          ctx.fillRect(x - 1.6, y - h, 3.2, h);
        }
      }
    };
  }

  /* ── TRADE: command-deck skyline of live charts ── */
  function makeSkyline() {
    var towers = [];
    var n = 34;
    for (var i = 0; i < n; i++) towers.push({ h: rand(0.1, 0.55), w: rand(0.014, 0.035), flick: rand(0, Math.PI * 2) });
    var lines = [];
    for (var l = 0; l < 3; l++) {
      var pts = [];
      for (var p = 0; p <= 30; p++) pts.push(rand(0.25, 0.75));
      lines.push({ pts: pts, y: 0.16 + l * 0.14, speed: rand(0.00006, 0.00013), col: l === 0 ? "245,185,66" : l === 1 ? "34,211,238" : "59,130,246" });
    }
    return function (t) {
      ctx.clearRect(0, 0, W, H);
      var px = mx * 20;
      // floating chart lines
      lines.forEach(function (ln) {
        var shift = (t * ln.speed) % 1;
        ctx.beginPath();
        for (var p = 0; p <= 30; p++) {
          var idx = (p + Math.floor(shift * 30)) % 31;
          var x = (p / 30) * W + px * 0.5;
          var y = H * ln.y + (ln.pts[idx] - 0.5) * H * 0.1;
          if (p === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
        }
        ctx.strokeStyle = "rgba(" + ln.col + ",0.35)";
        ctx.lineWidth = 1.4;
        ctx.stroke();
      });
      // skyline towers
      var x = 0;
      towers.forEach(function (tw, i) {
        var w = tw.w * W;
        var h = tw.h * H * 0.6;
        var glow = 0.25 + 0.2 * Math.abs(Math.sin(t * 0.001 + tw.flick));
        var grad = ctx.createLinearGradient(0, H - h, 0, H);
        grad.addColorStop(0, "rgba(245,185,66," + glow * 0.55 + ")");
        grad.addColorStop(1, "rgba(245,185,66,0.03)");
        ctx.fillStyle = grad;
        ctx.fillRect(x + px * 0.3, H - h, w - 3, h);
        // windows
        ctx.fillStyle = "rgba(255,255,255," + glow * 0.35 + ")";
        for (var wy = H - h + 8; wy < H - 8; wy += 12) {
          if (Math.sin(i * 7.3 + wy) > 0.3) ctx.fillRect(x + px * 0.3 + w * 0.3, wy, 2.5, 2.5);
        }
        x += w + 4;
      });
    };
  }

  /* ── ARENA DUEL: two energy avatars over a shifting candlestick battlefield ── */
  function makeDuel() {
    var candles = [];
    for (var i = 0; i < 40; i++) candles.push({ v: 0.5, target: 0.5, next: 0 });
    var sparks = [];
    for (var s = 0; s < 26; s++) sparks.push({ a: rand(0, Math.PI * 2), r: rand(30, 55), sp: rand(0.001, 0.0025), side: s % 2 });
    return function (t) {
      ctx.clearRect(0, 0, W, H);
      var groundY = H * 0.82;
      // battlefield candles
      var cw = W / candles.length;
      candles.forEach(function (c, i) {
        if (t > c.next) { c.target = 0.15 + Math.random() * 0.85; c.next = t + rand(600, 2600); }
        c.v += (c.target - c.v) * 0.03;
        var h = c.v * H * 0.22;
        var lean = (i / candles.length - 0.5); // violet left → teal right
        var col = lean < 0 ? "139,92,246" : "34,211,238";
        var alpha = 0.1 + 0.25 * c.v;
        ctx.fillStyle = "rgba(" + col + "," + alpha + ")";
        ctx.fillRect(i * cw + 1, groundY - h, cw - 2, h);
        ctx.strokeStyle = "rgba(" + col + "," + alpha * 0.7 + ")";
        ctx.beginPath();
        ctx.moveTo(i * cw + cw / 2, groundY - h - c.v * 18);
        ctx.lineTo(i * cw + cw / 2, groundY - h);
        ctx.stroke();
      });
      // ground line
      ctx.strokeStyle = "rgba(255,255,255,0.1)";
      ctx.beginPath(); ctx.moveTo(0, groundY); ctx.lineTo(W, groundY); ctx.stroke();
      // two energy avatars
      var ax = W * 0.24 + mx * 12, bx = W * 0.76 + mx * 12;
      var ay = H * 0.42 + Math.sin(t * 0.0011) * 10, by = H * 0.42 + Math.cos(t * 0.0013) * 10;
      [[ax, ay, "139,92,246"], [bx, by, "34,211,238"]].forEach(function (av) {
        var g = ctx.createRadialGradient(av[0], av[1], 0, av[0], av[1], 90);
        g.addColorStop(0, "rgba(" + av[2] + ",0.5)");
        g.addColorStop(0.4, "rgba(" + av[2] + ",0.14)");
        g.addColorStop(1, "rgba(" + av[2] + ",0)");
        ctx.fillStyle = g;
        ctx.beginPath(); ctx.arc(av[0], av[1], 90, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = "rgba(255,255,255,0.9)";
        ctx.beginPath(); ctx.arc(av[0], av[1], 7, 0, Math.PI * 2); ctx.fill();
      });
      // orbiting sparks
      sparks.forEach(function (sp) {
        sp.a += sp.sp * 16;
        var cx = sp.side ? bx : ax, cy = sp.side ? by : ay;
        var col = sp.side ? "34,211,238" : "139,92,246";
        var x = cx + Math.cos(sp.a) * sp.r, y = cy + Math.sin(sp.a) * sp.r * 0.6;
        ctx.fillStyle = "rgba(" + col + ",0.8)";
        ctx.beginPath(); ctx.arc(x, y, 1.6, 0, Math.PI * 2); ctx.fill();
      });
      // energy tether between avatars, pulsing
      var pulse = 0.12 + 0.12 * Math.abs(Math.sin(t * 0.0016));
      var grad = ctx.createLinearGradient(ax, ay, bx, by);
      grad.addColorStop(0, "rgba(139,92,246," + pulse + ")");
      grad.addColorStop(1, "rgba(34,211,238," + pulse + ")");
      ctx.strokeStyle = grad;
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      ctx.moveTo(ax, ay);
      var midY = Math.min(ay, by) - 40 + Math.sin(t * 0.002) * 16;
      ctx.quadraticCurveTo((ax + bx) / 2, midY, bx, by);
      ctx.stroke();
    };
  }

  /* ── AI COACH: neural orb — particle sphere of violet synapses ── */
  function makeNeural() {
    var pts = [];
    for (var i = 0; i < 110; i++) {
      // fibonacci sphere distribution
      var phi = Math.acos(1 - 2 * (i + 0.5) / 110);
      var theta = Math.PI * (1 + Math.sqrt(5)) * i;
      pts.push({ phi: phi, theta: theta, pulse: rand(0, Math.PI * 2) });
    }
    return function (t) {
      ctx.clearRect(0, 0, W, H);
      var cx = W / 2 + mx * 20, cy = H * 0.45 + my * 14;
      var R = Math.min(W, H) * 0.26;
      var rotY = t * 0.00025;
      // glow
      var g = ctx.createRadialGradient(cx, cy, 0, cx, cy, R * 1.8);
      g.addColorStop(0, "rgba(139,92,246,0.16)");
      g.addColorStop(1, "rgba(139,92,246,0)");
      ctx.fillStyle = g;
      ctx.fillRect(cx - R * 2, cy - R * 2, R * 4, R * 4);
      // project points
      var proj = pts.map(function (p) {
        var x = Math.sin(p.phi) * Math.cos(p.theta + rotY);
        var y = Math.cos(p.phi);
        var z = Math.sin(p.phi) * Math.sin(p.theta + rotY);
        // breathing morph
        var r = R * (1 + 0.06 * Math.sin(t * 0.0012 + p.pulse));
        var persp = 2.6 / (2.6 + z);
        return [cx + x * r * persp, cy + y * r * 0.92 * persp, persp, z];
      });
      // synapse links between near points
      for (var i = 0; i < proj.length; i++) {
        for (var j = i + 1; j < proj.length; j++) {
          var dx = proj[i][0] - proj[j][0], dy = proj[i][1] - proj[j][1];
          var d = dx * dx + dy * dy;
          if (d < R * R * 0.14) {
            var a = 0.16 * (1 - d / (R * R * 0.14)) * Math.min(proj[i][2], proj[j][2]);
            ctx.beginPath();
            ctx.moveTo(proj[i][0], proj[i][1]);
            ctx.lineTo(proj[j][0], proj[j][1]);
            ctx.strokeStyle = "rgba(167,139,250," + a + ")";
            ctx.lineWidth = 1;
            ctx.stroke();
          }
        }
      }
      // nodes
      proj.forEach(function (p, i) {
        var flick = 0.4 + 0.5 * Math.abs(Math.sin(t * 0.0016 + pts[i].pulse));
        ctx.beginPath();
        ctx.arc(p[0], p[1], 1.7 * p[2], 0, Math.PI * 2);
        ctx.fillStyle = "rgba(196,181,253," + flick * Math.max(0.2, p[2] - 0.6) + ")";
        ctx.fill();
      });
    };
  }

  /* ── ECOSYSTEM: neural network of pillar-colored nodes ── */
  function makeNetwork() {
    var COLS = ["59,130,246", "34,211,238", "139,92,246", "245,185,66"];
    var nodes = [];
    for (var i = 0; i < 60; i++) {
      nodes.push({ x: Math.random(), y: Math.random(), vx: rand(-0.00006, 0.00006), vy: rand(-0.00005, 0.00005), c: COLS[i % 4], r: rand(1.2, 2.6) });
    }
    return function (t) {
      ctx.clearRect(0, 0, W, H);
      var px = mx * 20, py = my * 14;
      for (var i = 0; i < nodes.length; i++) {
        var a = nodes[i];
        a.x = (a.x + a.vx + 1) % 1; a.y = (a.y + a.vy + 1) % 1;
        for (var j = i + 1; j < nodes.length; j++) {
          var b = nodes[j];
          var dx = (a.x - b.x) * W, dy = (a.y - b.y) * H;
          var d = dx * dx + dy * dy;
          if (d < 16000) {
            ctx.beginPath();
            ctx.moveTo(a.x * W + px, a.y * H + py);
            ctx.lineTo(b.x * W + px, b.y * H + py);
            ctx.strokeStyle = "rgba(" + a.c + "," + (0.2 * (1 - d / 16000)) + ")";
            ctx.lineWidth = 1;
            ctx.stroke();
          }
        }
      }
      nodes.forEach(function (nd) {
        var pulse = 0.5 + 0.4 * Math.sin(t * 0.0012 + nd.x * 9);
        ctx.beginPath();
        ctx.arc(nd.x * W + px, nd.y * H + py, nd.r, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(" + nd.c + "," + pulse + ")";
        ctx.fill();
      });
    };
  }

  var render =
    scene === "constellation" ? makeConstellation() :
    scene === "holodeck" ? makeHolodeck() :
    scene === "arena" ? makeArena() :
    scene === "skyline" ? makeSkyline() :
    scene === "duel" ? makeDuel() :
    scene === "neural" ? makeNeural() :
    makeNetwork();

  if (reducedMotion) {
    render(0); // static poster frame
    return;
  }

  function loop(t) {
    if (!running) return;
    mx += (tmx - mx) * 0.04;
    my += (tmy - my) * 0.04;
    render(t);
    rafId = requestAnimationFrame(loop);
  }

  var sceneObs = new IntersectionObserver(function (entries) {
    entries.forEach(function (en) {
      if (en.isIntersecting && !running) { running = true; rafId = requestAnimationFrame(loop); }
      else if (!en.isIntersecting && running) { running = false; if (rafId) cancelAnimationFrame(rafId); }
    });
  }, { threshold: 0.05 });
  sceneObs.observe(canvas.parentElement);

  rafId = requestAnimationFrame(loop);
})();
