/* ═══════════════════════════════════════════════════════════════
   ADIOX — Content-layer interactions: pricing billing toggle ·
   glossary/FAQ search · category filter · "was this helpful".
   Loads alongside pages.js.
═══════════════════════════════════════════════════════════════ */
(function () {
  "use strict";

  /* ─── Pricing: monthly/annual toggle ─── */
  var billBtns = document.querySelectorAll(".bill-btn");
  if (billBtns.length) {
    billBtns.forEach(function (btn) {
      btn.addEventListener("click", function () {
        billBtns.forEach(function (b) { b.classList.remove("active"); });
        btn.classList.add("active");
        var annual = btn.dataset.bill === "annual";
        document.querySelectorAll("[data-monthly]").forEach(function (el) {
          el.innerHTML = (annual ? el.dataset.annual : el.dataset.monthly) +
            '<span>/' + (annual ? "mo, billed yearly" : "month") + "</span>";
        });
      });
    });
  }

  /* ─── Search filter (glossary terms / faq items) ─── */
  var search = document.getElementById("contentSearch");
  if (search) {
    var items = document.querySelectorAll("[data-search]");
    var noRes = document.getElementById("noResults");
    search.addEventListener("input", function () {
      var q = search.value.trim().toLowerCase();
      var hits = 0;
      items.forEach(function (item) {
        var match = !q || item.dataset.search.toLowerCase().indexOf(q) !== -1;
        item.classList.toggle("hidden", !match);
        if (item.tagName === "DETAILS") item.style.display = match ? "" : "none";
        if (match) hits++;
      });
      if (noRes) noRes.hidden = hits > 0;
    });
  }

  /* ─── Blog category filter ─── */
  var pills = document.querySelectorAll(".cat-pill[data-cat]");
  if (pills.length) {
    pills.forEach(function (pill) {
      pill.addEventListener("click", function (e) {
        e.preventDefault();
        pills.forEach(function (p) { p.classList.remove("active"); });
        pill.classList.add("active");
        var cat = pill.dataset.cat;
        document.querySelectorAll(".post[data-cat]").forEach(function (post) {
          post.style.display = (cat === "all" || post.dataset.cat === cat) ? "" : "none";
        });
      });
    });
  }

  /* ─── FAQ: was this helpful ─── */
  document.querySelectorAll(".helpful button").forEach(function (btn) {
    btn.addEventListener("click", function () {
      var wrap = btn.closest(".helpful");
      wrap.querySelectorAll("button").forEach(function (b) { b.disabled = true; b.style.opacity = 0.4; });
      btn.classList.add("voted");
      btn.style.opacity = 1;
      btn.textContent = "Thanks ✓";
    });
  });

  /* ─── Demo forms: prevent submit, show confirmation ─── */
  document.querySelectorAll("form[data-demo]").forEach(function (form) {
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var btn = form.querySelector("button[type=submit], .btn");
      if (btn) { btn.textContent = "Sent ✓ — we reply within 24h"; btn.style.pointerEvents = "none"; }
    });
  });
})();
