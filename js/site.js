/* ═══════════════════════════════════════════════════════════════
   ADIOX — marketing site behaviour
   Navigation, reveal, tabs, FAQ search, calculators, contact form.
   The calculators implement the rules published on each page; the
   portal (portal.adiox.io) remains the source of truth at checkout.
═══════════════════════════════════════════════════════════════ */
(function () {
  'use strict';
  document.documentElement.classList.add('js');

  var $ = function (sel, root) { return (root || document).querySelector(sel); };
  var $$ = function (sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); };
  var num = function (v) { var n = parseFloat(String(v).replace(/[^0-9.\-]/g, '')); return isFinite(n) ? n : 0; };
  var clamp = function (v, lo, hi) { return Math.min(hi, Math.max(lo, v)); };
  var usd = function (v) {
    return (v < 0 ? '−$' : '$') + Math.abs(v).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  /* ─── Header: scrolled state ─── */
  var header = $('.site-header');
  if (header) {
    var onScroll = function () { header.classList.toggle('is-scrolled', window.scrollY > 8); };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
  }

  /* ─── Products dropdown ─── */
  $$('.nav-drop').forEach(function (drop) {
    var btn = $('.nav-link', drop), panel = $('.drop-panel', drop), timer, hoverAt = 0;
    var set = function (open) { btn.setAttribute('aria-expanded', String(open)); panel.classList.toggle('is-open', open); };
    btn.addEventListener('click', function (e) {
      e.stopPropagation();
      // A click that lands just after hover opened the menu should keep it open, not toggle it shut.
      if (Date.now() - hoverAt < 500) { set(true); return; }
      set(btn.getAttribute('aria-expanded') !== 'true');
    });
    drop.addEventListener('mouseenter', function () {
      clearTimeout(timer);
      if (window.matchMedia('(hover: hover)').matches && btn.getAttribute('aria-expanded') !== 'true') { hoverAt = Date.now(); set(true); }
    });
    drop.addEventListener('mouseleave', function () { timer = setTimeout(function () { set(false); }, 120); });
    document.addEventListener('click', function (e) { if (!drop.contains(e.target)) set(false); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') { set(false); } });
  });

  /* ─── Mobile menu ─── */
  var toggle = $('.menu-toggle'), mnav = $('#mobile-nav');
  if (toggle && mnav) {
    var setMenu = function (open) {
      toggle.setAttribute('aria-expanded', String(open));
      toggle.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
      mnav.classList.toggle('is-open', open);
      document.body.classList.toggle('nav-open', open);
    };
    toggle.addEventListener('click', function () { setMenu(toggle.getAttribute('aria-expanded') !== 'true'); });
    $$('a', mnav).forEach(function (a) { a.addEventListener('click', function () { setMenu(false); }); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') setMenu(false); });
    window.addEventListener('resize', function () { if (window.innerWidth > 1080) setMenu(false); });
  }

  /* ─── Reveal on scroll ─── */
  var reveals = $$('.reveal');
  if ('IntersectionObserver' in window && reveals.length) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) { if (en.isIntersecting) { en.target.classList.add('is-in'); io.unobserve(en.target); } });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.05 });
    reveals.forEach(function (el) { io.observe(el); });
  } else {
    reveals.forEach(function (el) { el.classList.add('is-in'); });
  }

  /* ─── Tabs ─── */
  $$('[role="tablist"]').forEach(function (list) {
    var tabs = $$('[role="tab"]', list);
    var select = function (tab, focus) {
      tabs.forEach(function (t) {
        var on = t === tab;
        t.setAttribute('aria-selected', String(on));
        t.tabIndex = on ? 0 : -1;
        var p = document.getElementById(t.getAttribute('aria-controls'));
        if (p) p.hidden = !on;
      });
      if (focus) tab.focus();
    };
    tabs.forEach(function (t, i) {
      t.addEventListener('click', function () { select(t); });
      t.addEventListener('keydown', function (e) {
        var d = e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : 0;
        if (d) { e.preventDefault(); select(tabs[(i + d + tabs.length) % tabs.length], true); }
      });
    });
  });

  /* ─── FAQ search ─── */
  var search = $('#faq-search');
  if (search) {
    var items = $$('.faq-item'), groups = $$('.faq-group'), empty = $('#faq-empty');
    search.addEventListener('input', function () {
      var q = search.value.trim().toLowerCase(), shown = 0;
      items.forEach(function (it) {
        var hit = !q || it.textContent.toLowerCase().indexOf(q) !== -1;
        it.hidden = !hit;
        if (hit) shown++;
        if (q && hit) it.open = true;
      });
      groups.forEach(function (g) { g.hidden = !$$('.faq-item', g).some(function (it) { return !it.hidden; }); });
      if (empty) empty.classList.toggle('is-visible', shown === 0);
    });
  }

  /* ─── Calculators ─── */
  var calcs = {
    /* Challenge rule levels: equity thresholds for a phase. */
    rules: function (f, out) {
      var bal = Math.max(0, num(f.balance.value));
      var target = clamp(num(f.target.value), 0, 100);
      var overall = clamp(num(f.overall.value), 0, 100);
      var daily = clamp(num(f.daily.value), 0, 100);
      var dayStart = f.daystart && f.daystart.value !== '' ? Math.max(0, num(f.daystart.value)) : bal;
      out.target.textContent = target > 0 ? usd(bal * (1 + target / 100)) : 'No target';
      out.overall.textContent = usd(bal * (1 - overall / 100));
      out.daily.textContent = usd(dayStart * (1 - daily / 100));
      out.single.textContent = usd(bal * 0.02);
      out.summary.textContent = target > 0
        ? 'Reach ' + usd(bal * (1 + target / 100)) + ' equity and the minimum trading days to pass this phase.'
        : 'No profit target: stay above both loss floors to keep the account.';
    },

    /* Training Room custom simulator fee, by number of days. */
    sim: function (f, out, root) {
      var days = Math.round(num(f.days.value));
      var fee = days <= 30 ? 10 : days <= 40 ? 15 : days <= 50 ? 20 : 25;
      var band = days <= 30 ? 'Up to 30 days' : days <= 40 ? '31–40 days' : days <= 50 ? '41–50 days' : 'More than 50 days';
      out.days.textContent = days + (days === 1 ? ' day' : ' days');
      out.fee.textContent = usd(fee);
      out.band.textContent = band;
      $$('[data-band]', root).forEach(function (row) { row.classList.toggle('is-current', row.getAttribute('data-band') === String(fee)); });
    },

    /* Unified checkout: coupon → credit (capped) → wallet → payment gateway (min $1). */
    checkout: function (f, out) {
      var fee = Math.max(0, num(f.fee.value));
      var couponPct = clamp(num(f.coupon.value), 0, 100);
      var noCredit = f.nocredit && f.nocredit.checked;
      var capPct = clamp(num(f.cap.value), 0, 50);
      var credit = Math.max(0, num(f.credit.value));
      var wallet = Math.max(0, num(f.wallet.value));

      var discount = round2(fee * couponPct / 100);
      var due = round2(fee - discount);
      var creditCap = noCredit ? 0 : round2(due * capPct / 100);
      var creditUse = round2(Math.min(credit, creditCap));
      var rest = round2(due - creditUse);
      var walletUse = round2(Math.min(wallet, rest));
      var gateway = round2(rest - walletUse);
      var gatewayCharge = gateway > 0 ? Math.max(1, gateway) : 0;

      out.discount.textContent = discount ? '−' + usd(discount) : usd(0);
      out.credit.textContent = creditUse ? '−' + usd(creditUse) : usd(0);
      out.wallet.textContent = walletUse ? '−' + usd(walletUse) : usd(0);
      out.gateway.textContent = usd(gatewayCharge);
      out.total.textContent = usd(due);
      out.note.textContent = gateway === 0
        ? 'Covered by coupon, credit and wallet. The account is created straight away.'
        : gateway < 1
          ? 'The remaining ' + usd(gateway) + ' is below the $1 gateway minimum, so the card, payment-link or crypto charge is $1.00.'
          : 'The remaining ' + usd(gateway) + ' is paid by card, payment link or crypto. The account is created once the payment is confirmed.';
      out.capline.textContent = noCredit
        ? 'This coupon does not allow bonus credit on the same purchase.'
        : 'Credit can cover up to ' + capPct + '% of the amount after discount (' + usd(creditCap) + ').';
    },

    /* Points exchange: 100 points → $10 bonus credit. */
    points: function (f, out) {
      var pts = Math.max(0, Math.floor(num(f.points.value)));
      var blocks = Math.floor(pts / 100);
      out.credit.textContent = usd(blocks * 10);
      out.used.textContent = (blocks * 100).toLocaleString('en-US') + ' points';
      out.left.textContent = (pts - blocks * 100).toLocaleString('en-US') + ' points';
    },

    /* Referral commission: 10% of cash paid by referred users 1–20, 15% from the 21st on. */
    referral: function (f, out) {
      var users = Math.max(0, Math.floor(num(f.users.value)));
      var spend = Math.max(0, num(f.spend.value));
      var tier1 = Math.min(users, 20), tier2 = Math.max(0, users - 20);
      var c1 = round2(tier1 * spend * 0.10), c2 = round2(tier2 * spend * 0.15);
      out.tier1.textContent = usd(c1);
      out.tier2.textContent = usd(c2);
      out.total.textContent = usd(c1 + c2);
      out.split.textContent = tier1 + ' × 10% · ' + tier2 + ' × 15%';
    },

    /* Funded payout: profit × payout share %. */
    payout: function (f, out) {
      var profit = Math.max(0, num(f.profit.value));
      var share = clamp(num(f.share.value), 0, 100);
      var user = round2(profit * share / 100);
      out.user.textContent = usd(user);
      out.firm.textContent = usd(round2(profit - user));
      out.cycle.textContent = f.cycle.value === '30' ? 'Monthly · every 30 days' : 'Weekly · every 7 days';
    }
  };
  function round2(v) { return Math.round(v * 100) / 100; }

  $$('[data-calc]').forEach(function (form) {
    var fn = calcs[form.getAttribute('data-calc')];
    if (!fn) return;
    var root = form.closest('.calc') || form;
    var out = {};
    $$('[data-out]', root).forEach(function (el) { out[el.getAttribute('data-out')] = el; });
    var fields = {};
    $$('input, select', form).forEach(function (el) {
      if (!el.name) return;
      if (el.type === 'radio') {
        // A radio group reads as the value of its checked option.
        if (!fields[el.name]) fields[el.name] = { get value() { var c = $('input[name="' + el.name + '"]:checked', form); return c ? c.value : ''; } };
      } else {
        fields[el.name] = el;
      }
    });
    var run = function () {
      $$('input[type="range"]', form).forEach(function (r) {
        var lbl = $('[data-range-for="' + r.name + '"]', form);
        if (lbl) lbl.textContent = r.value + (r.getAttribute('data-unit') || '');
      });
      fn(fields, out, root);
    };
    form.addEventListener('input', run);
    form.addEventListener('change', run);
    form.addEventListener('submit', function (e) { e.preventDefault(); run(); });
    run();
  });

  /* ─── Contact form ─── */
  var cform = $('#contact-form');
  if (cform) {
    var status = $('#contact-status'), submit = $('button[type="submit"]', cform);
    var setErr = function (name, msg) {
      var el = cform.elements[name], err = $('[data-error-for="' + name + '"]', cform);
      if (el) el.setAttribute('aria-invalid', msg ? 'true' : 'false');
      if (err) err.textContent = msg || '';
    };
    var validate = function () {
      var ok = true, v = function (n) { return cform.elements[n].value.trim(); };
      if (v('name').length < 2) { setErr('name', 'Please enter your name.'); ok = false; } else setErr('name');
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v('email'))) { setErr('email', 'Please enter a valid email address.'); ok = false; } else setErr('email');
      if (!v('topic')) { setErr('topic', 'Please choose a topic.'); ok = false; } else setErr('topic');
      if (v('message').length < 20) { setErr('message', 'Please write at least 20 characters so we can help.'); ok = false; } else setErr('message');
      return ok;
    };
    $$('input, select, textarea', cform).forEach(function (el) {
      el.addEventListener('blur', function () { if (el.getAttribute('aria-invalid') === 'true') validate(); });
    });
    cform.addEventListener('submit', function (e) {
      e.preventDefault();
      status.className = 'form-status';
      status.textContent = '';
      if (!validate()) {
        var first = $('[aria-invalid="true"]', cform);
        if (first) first.focus();
        return;
      }
      submit.classList.add('is-loading');
      submit.setAttribute('aria-busy', 'true');
      fetch(cform.action, { method: 'POST', body: new FormData(cform), headers: { 'Accept': 'application/json' } })
        .then(function (r) { return r.json().catch(function () { return { ok: false, error: 'Unexpected response from the server.' }; }); })
        .then(function (res) {
          if (res && res.ok) {
            cform.reset();
            status.className = 'form-status is-success';
            status.textContent = 'Thanks — your message has been received. Our support team will reply by email.';
          } else {
            if (res && res.fields) Object.keys(res.fields).forEach(function (k) { setErr(k, res.fields[k]); });
            status.className = 'form-status is-error';
            status.textContent = (res && res.error) || 'Something went wrong. Please try again.';
          }
        })
        .catch(function () {
          status.className = 'form-status is-error';
          status.textContent = 'We could not reach the server. Check your connection and try again.';
        })
        .then(function () { submit.classList.remove('is-loading'); submit.removeAttribute('aria-busy'); status.focus(); });
    });
  }

  /* ─── Footer year ─── */
  $$('[data-year]').forEach(function (el) { el.textContent = new Date().getFullYear(); });
})();
