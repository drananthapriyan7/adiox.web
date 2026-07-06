/* ═══════════════════════════════════════════════════════════════
   ADIOX — Trade pages: challenge calculator · audience toggle ·
   demo control switches. Loads alongside pages.js.
═══════════════════════════════════════════════════════════════ */
(function () {
  "use strict";

  /* ─── Challenge calculator (/trade/challenges) ─── */
  var calc = document.getElementById("challengeCalc");
  if (calc) {
    var SIZES = [10000, 25000, 50000, 100000, 200000];
    var PRICING = {
      "two-step":  { label: "2-Step",    prices: [89, 189, 299, 499, 899],       note: "Fee refunded with your first payout",
        feats: ["Phase 1: 8% target · Phase 2: 5% target", "10% max drawdown · 5% daily", "No time limit on either phase", "Up to 90% payout split when funded"] },
      "one-step":  { label: "1-Step",    prices: [109, 229, 359, 599, 1099],     note: "One phase between you and funding",
        feats: ["Single phase: 10% profit target", "8% max drawdown · 4% daily", "No time limit", "Up to 85% payout split when funded"] },
      "instant":   { label: "Instant",   prices: [249, 499, 899, 1599, 2899],    note: "No evaluation — funded from trade one",
        feats: ["Skip the evaluation entirely", "6% max drawdown · 3% daily", "Payouts from day 14", "Up to 70% payout split"] },
      "pay-later": { label: "Pay-Later", prices: [0, 0, 0, 0, 0],                note: "Start free — fee comes out of your first payouts",
        feats: ["$0 upfront — qualify by simulator record", "Standard 2-step rules apply", "1.5× fee deducted from first payouts", "No payout ever? You owe nothing"] }
    };
    var PL_DEFERRED = [134, 284, 449, 749, 1349]; // 1.5× two-step fee, deferred

    var state = { model: "two-step", size: 1 }; // default $25k
    var slider = calc.querySelector("#sizeSlider");
    var tabs = calc.querySelectorAll(".model-tab");
    var fmt = function (n) { return "$" + n.toLocaleString("en-US"); };

    function render() {
      var p = PRICING[state.model];
      var size = SIZES[state.size];
      var price = p.prices[state.size];
      calc.querySelector("#calcSize").textContent = fmt(size);
      var priceEl = calc.querySelector("#calcPrice");
      if (state.model === "pay-later") {
        priceEl.innerHTML = "$0 <small>today · " + fmt(PL_DEFERRED[state.size]) + " from first payouts</small>";
      } else {
        priceEl.innerHTML = fmt(price) + " <small>one-time fee</small>";
      }
      var list = calc.querySelector("#calcFeats");
      list.innerHTML = p.feats.map(function (f) { return "<li>" + f + "</li>"; }).join("");
      // sticky summary
      document.getElementById("sumModel").textContent = p.label;
      document.getElementById("sumSize").textContent = fmt(size);
      document.getElementById("sumPrice").textContent = state.model === "pay-later" ? "$0" : fmt(price);
      document.getElementById("sumNote").textContent = p.note;
      tabs.forEach(function (t) { t.classList.toggle("active", t.dataset.model === state.model); });
    }

    slider.addEventListener("input", function () { state.size = +slider.value; render(); });
    tabs.forEach(function (t) {
      t.addEventListener("click", function () { state.model = t.dataset.model; render(); });
    });
    render();
  }

  /* ─── Audience toggle (/trade/copy-trading) ─── */
  var audBtns = document.querySelectorAll(".aud-btn");
  if (audBtns.length) {
    audBtns.forEach(function (btn) {
      btn.addEventListener("click", function () {
        audBtns.forEach(function (b) { b.classList.remove("active"); });
        btn.classList.add("active");
        document.body.classList.remove("view-copier", "view-provider");
        document.body.classList.add("view-" + btn.dataset.view);
      });
    });
  }

  /* ─── Demo control switches (risk controls / loss lock) ─── */
  document.querySelectorAll(".sw[data-toggle]").forEach(function (sw) {
    sw.setAttribute("role", "switch");
    sw.setAttribute("tabindex", "0");
    sw.setAttribute("aria-checked", sw.classList.contains("on"));
    function flip() {
      sw.classList.toggle("on");
      sw.setAttribute("aria-checked", sw.classList.contains("on"));
    }
    sw.addEventListener("click", flip);
    sw.addEventListener("keydown", function (e) {
      if (e.key === "Enter" || e.key === " ") { e.preventDefault(); flip(); }
    });
  });
})();
