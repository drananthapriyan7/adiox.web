/* ═══════════════════════════════════════════════════════════════
   ADIOX — Compete pages: countdowns · flip cards · share links
   Loads alongside pages.js (which owns nav, reveals, counters, scenes).
═══════════════════════════════════════════════════════════════ */
(function () {
  "use strict";

  /* ─── Countdown timers ───
     [data-countdown] ticks toward the next daily 18:00 UTC session
     (placeholder cadence until the tournaments API is wired in). */
  var cds = document.querySelectorAll("[data-countdown]");
  if (cds.length) {
    function nextSession() {
      var now = new Date();
      var next = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 18, 0, 0));
      if (next <= now) next.setUTCDate(next.getUTCDate() + 1);
      return next;
    }
    var target = nextSession();
    function pad(n) { return String(n).padStart(2, "0"); }
    function tick() {
      var diff = target - Date.now();
      if (diff < 0) { target = nextSession(); diff = target - Date.now(); }
      var h = Math.floor(diff / 3600000);
      var m = Math.floor(diff / 60000) % 60;
      var s = Math.floor(diff / 1000) % 60;
      cds.forEach(function (cd) {
        var hEl = cd.querySelector("[data-cd-h]"), mEl = cd.querySelector("[data-cd-m]"), sEl = cd.querySelector("[data-cd-s]");
        if (hEl) hEl.textContent = pad(h);
        if (mEl) mEl.textContent = pad(m);
        if (sEl) sEl.textContent = pad(s);
      });
    }
    tick();
    setInterval(tick, 1000);
  }

  /* ─── Flip cards: tap toggles on touch, hover handles desktop ─── */
  document.querySelectorAll(".flip").forEach(function (card) {
    card.addEventListener("click", function (e) {
      if (e.target.closest("a")) return; // let the join link through
      card.classList.toggle("flipped");
    });
    card.addEventListener("keydown", function (e) {
      if (e.key === "Enter" || e.key === " ") { e.preventDefault(); card.classList.toggle("flipped"); }
    });
  });

  /* ─── Challenge a Friend: copy share link ─── */
  document.querySelectorAll("[data-share]").forEach(function (btn) {
    btn.addEventListener("click", function () {
      var url = location.origin + "/compete/trading-games?duel=invite";
      var done = function () {
        var prev = btn.textContent;
        btn.textContent = "Link copied ✓";
        setTimeout(function () { btn.textContent = prev; }, 2200);
      };
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(url).then(done, done);
      } else { done(); }
    });
  });
})();
