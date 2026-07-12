/* ═══════════════════════════════════════════════════════════════
   ADIOX — Train pages: Challenge Builder · bar-replay demo ·
   calendar heatmap · Strategy Lab toy builder.
   Loads alongside pages.js (nav, reveals, scenes).
═══════════════════════════════════════════════════════════════ */
(function () {
  "use strict";

  /* ─────────── Challenge Builder (/train/simulator) ─────────── */
  var builder = document.getElementById("challengeBuilder");
  if (builder) {
    var PRESETS = {
      "two-step": { target: 8, daily: 5, max: 10, days: 0, news: true,  label: "FTMO®-style 2-step*" },
      "one-step": { target: 10, daily: 4, max: 8, days: 0, news: true,  label: "1-step" },
      "custom":   { target: 8, daily: 5, max: 10, days: 30, news: false, label: "Custom" }
    };
    var els = {
      target: builder.querySelector("#bTarget"),
      daily: builder.querySelector("#bDaily"),
      max: builder.querySelector("#bMax"),
      days: builder.querySelector("#bDays"),
      news: builder.querySelector("#bNews"),
      tabs: builder.querySelectorAll(".preset-tab")
    };
    var CIRC = 2 * Math.PI * 26; // ring radius 26

    function setRing(id, pct) {
      var ring = document.getElementById(id);
      ring.querySelector(".val").style.strokeDashoffset = CIRC * (1 - Math.min(pct, 1));
    }
    function render(presetLabel) {
      var t = +els.target.value, d = +els.daily.value, m = +els.max.value, days = +els.days.value;
      builder.querySelector("#bTargetVal").textContent = t + "%";
      builder.querySelector("#bDailyVal").textContent = "-" + d + "%";
      builder.querySelector("#bMaxVal").textContent = "-" + m + "%";
      builder.querySelector("#bDaysVal").textContent = days === 0 ? "No limit" : days + " days";
      // summary
      document.getElementById("sumPreset").textContent = presetLabel || "Custom";
      document.getElementById("sumRules").textContent = t + "% target · -" + d + "%/-" + m + "% DD";
      document.getElementById("sumTime").textContent = days === 0 ? "No time limit" : days + " days";
      document.getElementById("sumNews").textContent = els.news.classList.contains("on") ? "Enforced" : "Off";
      setRing("ringTarget", t / 15);
      setRing("ringDD", m / 15);
      document.getElementById("ringTargetNum").textContent = t + "%";
      document.getElementById("ringDDNum").textContent = m + "%";
      // carry config into signup
      var cta = document.getElementById("builderCta");
      cta.href = "/signup?sim=1&target=" + t + "&daily=" + d + "&max=" + m + "&days=" + days + "&news=" + (els.news.classList.contains("on") ? 1 : 0);
    }
    function applyPreset(key) {
      var p = PRESETS[key];
      els.target.value = p.target; els.daily.value = p.daily; els.max.value = p.max; els.days.value = p.days;
      els.news.classList.toggle("on", p.news);
      els.news.setAttribute("aria-checked", p.news);
      els.tabs.forEach(function (tab) { tab.classList.toggle("active", tab.dataset.preset === key); });
      render(p.label);
    }
    els.tabs.forEach(function (tab) {
      tab.addEventListener("click", function () { applyPreset(tab.dataset.preset); });
    });
    [els.target, els.daily, els.max, els.days].forEach(function (input) {
      input.addEventListener("input", function () {
        els.tabs.forEach(function (tab) { tab.classList.toggle("active", tab.dataset.preset === "custom"); });
        render("Custom");
      });
    });
    els.news.addEventListener("click", function () {
      els.news.classList.toggle("on");
      els.news.setAttribute("aria-checked", els.news.classList.contains("on"));
      render(document.getElementById("sumPreset").textContent);
    });
    els.news.addEventListener("keydown", function (e) {
      if (e.key === "Enter" || e.key === " ") { e.preventDefault(); els.news.click(); }
    });
    applyPreset("two-step");
  }

  /* ─────────── Bar-replay demo (/train/backtesting) ─────────── */
  var replay = document.getElementById("replayDemo");
  if (replay) {
    var canvas = replay.querySelector(".replay-canvas");
    var rctx = canvas.getContext("2d");
    var TOTAL = 120;
    // seeded pseudo-random walk so the demo is stable
    var candles = [];
    (function () {
      var seed = 42, price = 100;
      function rnd() { seed = (seed * 16807) % 2147483647; return seed / 2147483647; }
      for (var i = 0; i < TOTAL; i++) {
        var open = price;
        var drift = Math.sin(i * 0.12) * 0.35;
        var close = open + drift + (rnd() - 0.5) * 1.8;
        var hi = Math.max(open, close) + rnd() * 0.7;
        var lo = Math.min(open, close) - rnd() * 0.7;
        candles.push({ o: open, c: close, h: hi, l: lo });
        price = close;
      }
    })();
    var shown = 20, playing = false, speed = 1, acc = 0, lastT = 0, rafId = null;
    var reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    function sizeCanvas() {
      var dpr = Math.min(window.devicePixelRatio || 1, 2);
      var r = canvas.getBoundingClientRect();
      canvas.width = r.width * dpr; canvas.height = r.height * dpr;
      rctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      return r;
    }
    function drawReplay() {
      var r = canvas.getBoundingClientRect();
      var W = r.width, H = r.height;
      rctx.clearRect(0, 0, W, H);
      var slice = candles.slice(0, shown);
      var min = Infinity, max = -Infinity;
      slice.forEach(function (c) { min = Math.min(min, c.l); max = Math.max(max, c.h); });
      var pad = (max - min) * 0.1 + 0.01;
      min -= pad; max += pad;
      var cw = W / TOTAL;
      function y(v) { return H - ((v - min) / (max - min)) * H; }
      slice.forEach(function (c, i) {
        var x = i * cw + cw / 2;
        var up = c.c >= c.o;
        var col = up ? "#22D3EE" : "#64748B";
        rctx.strokeStyle = col;
        rctx.beginPath(); rctx.moveTo(x, y(c.h)); rctx.lineTo(x, y(c.l)); rctx.stroke();
        rctx.fillStyle = up ? "rgba(34,211,238,0.85)" : "rgba(100,116,139,0.85)";
        var top = y(Math.max(c.o, c.c));
        rctx.fillRect(x - cw * 0.3, top, cw * 0.6, Math.max(1.5, Math.abs(y(c.o) - y(c.c))));
      });
      // last price line
      var last = slice[slice.length - 1];
      rctx.strokeStyle = "rgba(34,211,238,0.35)";
      rctx.setLineDash([4, 4]);
      rctx.beginPath(); rctx.moveTo(0, y(last.c)); rctx.lineTo(W, y(last.c)); rctx.stroke();
      rctx.setLineDash([]);
      // progress + time readout
      replay.querySelector(".vcr-track i").style.width = (shown / TOTAL * 100) + "%";
      replay.querySelector(".vcr-time").textContent = "BAR " + shown + " / " + TOTAL + " · " + speed + "×";
    }
    function loop(t) {
      if (!playing) return;
      if (!lastT) lastT = t;
      acc += (t - lastT) * speed;
      lastT = t;
      while (acc > 220) { // one bar per 220ms at 1x
        acc -= 220;
        shown++;
        if (shown >= TOTAL) shown = 20; // loop the demo
      }
      drawReplay();
      rafId = requestAnimationFrame(loop);
    }
    function setPlaying(p) {
      playing = p;
      lastT = 0;
      replay.querySelector("#vcrPlay").textContent = playing ? "❚❚" : "▶";
      if (playing && !reduced) rafId = requestAnimationFrame(loop);
      else if (rafId) cancelAnimationFrame(rafId);
    }
    replay.querySelector("#vcrPlay").addEventListener("click", function () { setPlaying(!playing); });
    replay.querySelector("#vcrStep").addEventListener("click", function () {
      shown = Math.min(shown + 1, TOTAL); drawReplay();
    });
    replay.querySelector("#vcrReset").addEventListener("click", function () { shown = 20; drawReplay(); });
    replay.querySelectorAll(".vcr-speed").forEach(function (btn) {
      btn.addEventListener("click", function () {
        speed = +btn.dataset.speed;
        replay.querySelectorAll(".vcr-speed").forEach(function (b) { b.classList.remove("active"); });
        btn.classList.add("active");
        drawReplay();
      });
    });
    window.addEventListener("resize", function () { sizeCanvas(); drawReplay(); });
    sizeCanvas();
    drawReplay();
    // pause when off-screen
    new IntersectionObserver(function (entries) {
      entries.forEach(function (en) { if (!en.isIntersecting && playing) setPlaying(false); });
    }, { threshold: 0.05 }).observe(replay);
  }

  /* ─────────── Calendar heatmap (/train/journal) ─────────── */
  var heatmap = document.getElementById("heatmap");
  if (heatmap) {
    var seed2 = 7;
    function rnd2() { seed2 = (seed2 * 16807) % 2147483647; return seed2 / 2147483647; }
    for (var d = 1; d <= 35; d++) {
      var tile = document.createElement("div");
      tile.className = "hm-tile";
      var weekend = d % 7 === 6 || d % 7 === 0;
      if (weekend || rnd2() < 0.12) {
        tile.style.opacity = "0.35";
        tile.textContent = "·";
      } else {
        var pnl = Math.round((rnd2() - 0.42) * 380);
        tile.dataset.pnl = pnl;
        tile.textContent = d <= 31 ? d : "";
        var a = Math.min(Math.abs(pnl) / 300, 1);
        tile.style.background = pnl >= 0
          ? "rgba(34,211,238," + (0.12 + a * 0.5) + ")"
          : "rgba(248,113,113," + (0.12 + a * 0.45) + ")";
        tile.style.borderColor = pnl >= 0 ? "rgba(34,211,238,0.35)" : "rgba(248,113,113,0.3)";
        tile.title = (pnl >= 0 ? "+$" : "-$") + Math.abs(pnl) + " · day " + d;
      }
      heatmap.appendChild(tile);
    }
  }

  /* ─────────── Strategy Lab toy builder (/train/strategy-builder) ─────────── */
  var lab = document.getElementById("labDemo");
  if (lab) {
    var slots = lab.querySelectorAll(".lab-slot");
    var blocks = lab.querySelectorAll(".lab-palette .lab-block");
    var track = lab.querySelector(".lab-track");
    var status = lab.querySelector(".lab-status");
    var order = ["ind", "cond", "act", "risk"];

    function nextEmpty() {
      for (var i = 0; i < slots.length; i++) if (!slots[i].classList.contains("filled")) return i;
      return -1;
    }
    function checkValid() {
      var filled = lab.querySelectorAll(".lab-slot.filled").length;
      var valid = filled === 4;
      track.classList.toggle("valid", valid);
      status.classList.toggle("on", valid);
      status.textContent = valid
        ? "✓ LOGIC VALID — RSI(14) < 30 · LONDON SESSION · BUY MARKET · RISK 0.5% / TARGET 2R"
        : filled + " / 4 blocks placed — tap blocks in any order";
    }
    blocks.forEach(function (block) {
      block.setAttribute("tabindex", "0");
      block.setAttribute("role", "button");
      function place() {
        if (block.classList.contains("used")) return;
        // find the slot matching this block's type
        var type = block.dataset.type;
        var idx = order.indexOf(type);
        var slot = slots[idx];
        if (slot.classList.contains("filled")) return;
        slot.innerHTML = "";
        var clone = block.cloneNode(true);
        clone.classList.remove("used");
        clone.removeAttribute("tabindex");
        slot.appendChild(clone);
        slot.classList.add("filled");
        block.classList.add("used");
        checkValid();
      }
      block.addEventListener("click", place);
      block.addEventListener("keydown", function (e) {
        if (e.key === "Enter" || e.key === " ") { e.preventDefault(); place(); }
      });
    });
    lab.querySelector("#labReset").addEventListener("click", function () {
      slots.forEach(function (slot, i) {
        slot.classList.remove("filled");
        slot.innerHTML = ["INDICATOR", "CONDITION", "ACTION", "RISK RULE"][i];
      });
      blocks.forEach(function (b) { b.classList.remove("used"); });
      checkValid();
    });
    checkValid();
  }
})();
