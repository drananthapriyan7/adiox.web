/* ═══════════════════════════════════════════════════════════════
   ADIOX COPY TRADING — page behaviour
   Top Copiers come from the portal's public API:
     GET https://portal.adiox.io/api/public/copiers
     → { generatedAt, available, portalUrl, copiers: [ { id, position, name, platform, rank, rankTier, profitGrade,
         safetyGrade, winRatePct, maxDrawdownPct, profitFactor, profitWindow, gainPctWindow, tradesWindow, windowDays,
         activeCopiers, monthlyFee, currency, martingaleWarning, since, copyUrl } ] }
   The list is shown exactly in the order the API returns it (its ranking order, highest first): never re-sorted.
═══════════════════════════════════════════════════════════════ */
(function () {
  'use strict';
  document.documentElement.classList.add('js');
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var num = function (v) { var n = parseFloat(v); return isFinite(n) ? n : 0; };
  var has = function (v) { return v !== null && v !== undefined && v !== '' && isFinite(parseFloat(v)); };
  var esc = function (s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); };
  var PORTAL = 'https://copier.adiox.io/Account/Login';

  /* ─── Reveal ─── */
  var rv = $$('.rv');
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (es) { es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } }); }, { rootMargin: '0px 0px -6% 0px', threshold: 0.05 });
    rv.forEach(function (el) { io.observe(el); });
  } else rv.forEach(function (el) { el.classList.add('in'); });

  /* ─── Highlight the section in view ─── */
  var links = $$('.hnav a');
  if ('IntersectionObserver' in window && links.length) {
    var map = {};
    links.forEach(function (a) { map[a.getAttribute('href').slice(1)] = a; });
    var so = new IntersectionObserver(function (es) {
      es.forEach(function (e) {
        if (e.isIntersecting && map[e.target.id]) { links.forEach(function (a) { a.classList.remove('on'); }); map[e.target.id].classList.add('on'); }
      });
    }, { rootMargin: '-45% 0px -50% 0px' });
    Object.keys(map).forEach(function (id) { var s = document.getElementById(id); if (s) so.observe(s); });
  }

  $$('[data-year]').forEach(function (el) { el.textContent = new Date().getFullYear(); });

  /* ═══ Top Copiers (portal public API) ═══ */
  var API = (function () {
    var meta = $('meta[name="adiox-api"]'), base = meta ? meta.content : '';
    // Local development only: ?api=http://localhost:xxxx/api/public/copiers
    if (/^(localhost|127\.0\.0\.1)$/.test(location.hostname)) {
      var q = new URLSearchParams(location.search).get('api');
      if (q && /^https?:\/\//.test(q)) base = q;
    }
    return base.replace(/\/+$/, '');
  })();
  var grid = $('#c-grid'), state = $('#c-state');
  if (!grid) return;

  function getJSON(url) {
    var ctrl = 'AbortController' in window ? new AbortController() : null;
    var timer = ctrl ? setTimeout(function () { ctrl.abort(); }, 10000) : null;
    return fetch(url, { headers: { Accept: 'application/json' }, credentials: 'omit', signal: ctrl ? ctrl.signal : undefined })
      .then(function (r) { if (!r.ok) throw new Error('HTTP ' + r.status); return r.json(); })
      .finally(function () { if (timer) clearTimeout(timer); });
  }
  function safeUrl(u) {
    try { var x = new URL(u); return x.protocol === 'https:' ? x.href : ''; } catch (e) { return ''; }
  }
  function fixed(v, d) { return num(v).toFixed(d).replace(/\.0+$|(\.\d*?)0+$/, '$1'); }
  function money(v, cur) {
    cur = String(cur || 'USD').toUpperCase(); v = num(v);
    var a = Math.abs(v).toLocaleString('en-US', { minimumFractionDigits: v % 1 ? 2 : 0, maximumFractionDigits: 2 });
    return (v < 0 ? '−' : '') + (cur === 'USD' ? '$' + a : a + ' ' + esc(cur));
  }
  function signed(v, suffix) { v = num(v); return (v >= 0 ? '+' : '−') + fixed(Math.abs(v), 1) + suffix; }
  var TIER = { platinum: 'b-violet', diamond: 'b-blue', gold: 'b-gold', silver: '', bronze: '' };

  function card(c, i) {
    var pos = num(c.position) || i + 1;
    var gainKnown = has(c.gainPctWindow);
    var main = gainKnown ? num(c.gainPctWindow) : num(c.profitWindow);
    var days = num(c.windowDays);
    var idle = !gainKnown && !num(c.profitWindow) && !num(c.tradesWindow);
    var gain = idle ? '<div class="c-gain neg" style="background:rgba(255,255,255,.03);border-color:var(--line);"><b style="color:var(--ink);font-family:var(--f-display);font-size:16px;">No trades yet</b><span>' + (days ? 'In the last ' + days + ' days' : 'In this window') + '</span></div>' :
      '<div class="c-gain' + (main < 0 ? ' neg' : '') + '"><b>' + (gainKnown ? signed(c.gainPctWindow, '%') : (main >= 0 ? '+' : '') + money(c.profitWindow, c.currency)) + '</b><span>' +
      (gainKnown ? money(c.profitWindow, c.currency) + ' profit · ' : '') + (days ? days + ' days · ' : '') + num(c.tradesWindow) + ' trades</span></div>';
    var stat = function (v, label) { return '<div><b>' + v + '</b><span>' + label + '</span></div>'; };
    var tier = String(c.rankTier || '');
    var badges = (tier ? '<span class="badge ' + (TIER[tier.toLowerCase()] || '') + '">' + esc(tier) + '</span>' : '') +
      (c.profitGrade ? '<span class="badge b-green">Profit ' + esc(c.profitGrade) + '</span>' : '') +
      (c.safetyGrade ? '<span class="badge b-blue">Safety ' + esc(c.safetyGrade) + '</span>' : '') +
      (c.martingaleWarning ? '<span class="badge b-red" title="This trader adds to losing positions">Martingale risk</span>' : '');
    var fee = num(c.monthlyFee) ? money(c.monthlyFee, c.currency) + ' / month' : 'Free';
    var copy = safeUrl(c.copyUrl) || PORTAL;
    return '<article class="ccard' + (i === 0 ? ' top1' : '') + '" aria-label="Rank ' + pos + ': ' + esc(c.name) + '">' +
      '<div class="c-head"><span class="c-pos' + (pos <= 3 ? ' p' + pos : '') + '" title="Rank">' + pos + '</span>' +
        '<div class="c-name"><h3 title="' + esc(c.name) + '">' + esc(c.name) + '</h3><span>' + esc(c.platform || 'Trader') + (c.since ? ' · since ' + esc(String(c.since).slice(0, 4)) : '') + '</span></div></div>' +
      (badges ? '<div class="c-badges">' + badges + '</div>' : '') +
      gain +
      '<div class="c-stats">' +
        stat(has(c.winRatePct) ? fixed(c.winRatePct, 1) + '%' : '—', 'Win rate') +
        stat(has(c.maxDrawdownPct) ? fixed(c.maxDrawdownPct, 1) + '%' : '—', 'Max drawdown') +
        stat(has(c.profitFactor) ? fixed(c.profitFactor, 2) : '—', 'Profit factor') +
      '</div>' +
      '<div class="c-meta"><span><b>' + num(c.activeCopiers).toLocaleString('en-US') + '</b> active copiers</span><span>Fee <b>' + fee + '</b></span></div>' +
      '<div class="c-act"><a class="btn btn-gold btn-sm" href="' + esc(copy) + '" target="_blank" rel="noopener" aria-label="Copy ' + esc(c.name) + ' in the Adiox copy trading portal">Copy this trader ↗</a></div>' +
      '</article>';
  }

  var data = null;
  function showState(title, text, extra) {
    state.hidden = false;
    state.innerHTML = '<b>' + title + '</b>' + text + '<div class="actions" style="justify-content:center;">' + (extra || '') +
      '<a class="btn btn-gold btn-sm" href="' + PORTAL + '" target="_blank" rel="noopener">Open the copy trading portal ↗</a></div>';
  }
  function render() {
    grid.classList.remove('is-loading');
    grid.setAttribute('aria-busy', 'false');
    if (!data.length) {
      grid.innerHTML = '';
      showState('Top Copiers are being updated', 'Ranked traders appear here as soon as the ranking is published.');
      return;
    }
    state.hidden = true;
    grid.innerHTML = data.map(card).join(''); // API order = ranking order
  }
  function stats() {
    var pill = $('#n-all'); pill.textContent = data.length ? data.length + ' ranked' : ''; pill.hidden = !data.length;
    var box = $('#live-stats'), copiers = data.reduce(function (s, c) { return s + num(c.activeCopiers); }, 0);
    if (box && data.length) {
      box.innerHTML = '<span><i class="pulse"></i><b>' + data.length + '</b> top copiers ranked</span>' + (copiers ? '<span><b>' + copiers.toLocaleString('en-US') + '</b> active copiers</span>' : '');
      box.hidden = false;
    }
  }
  // Structured data: the live ranking (only real data from the API).
  function listSchema() {
    var old = $('#live-copiers'); if (old) old.remove();
    if (!data.length) return;
    var el = document.createElement('script');
    el.type = 'application/ld+json'; el.id = 'live-copiers';
    el.textContent = JSON.stringify({
      '@context': 'https://schema.org', '@type': 'ItemList', name: 'Top Copiers on Adiox copy trading', url: 'https://copytrading.adiox.io/#top-copiers',
      itemListOrder: 'https://schema.org/ItemListOrderAscending', numberOfItems: data.length,
      itemListElement: data.map(function (c, i) { return { '@type': 'ListItem', position: i + 1, name: c.name, url: safeUrl(c.copyUrl) || undefined }; })
    });
    document.head.appendChild(el);
  }
  state.addEventListener('click', function (e) {
    if (e.target.closest('#c-retry')) { state.hidden = true; grid.classList.add('is-loading'); grid.innerHTML = '<div class="skel" aria-hidden="true"></div><div class="skel" aria-hidden="true"></div><div class="skel" aria-hidden="true"></div>'; load(); }
  });

  function load() {
    if (!API) { data = []; render(); return; }
    getJSON(API).then(function (res) {
      var list = res && Array.isArray(res.copiers) ? res.copiers : [];
      if (res && res.available === false && !list.length && !data) throw new Error('unavailable');
      data = list.slice(); // keep the API's ranking order
      stats(); render(); listSchema();
      $('#c-updated').textContent = 'Updated ' + new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + ' · ranking from Adiox copy trading';
    }).catch(function () {
      if (data) return; // keep the ranking from an earlier load
      grid.classList.remove('is-loading'); grid.setAttribute('aria-busy', 'false'); grid.innerHTML = '';
      showState('Top Copiers couldn’t be loaded right now', 'Please try again in a moment, or open the copy trading portal to see the full ranking.',
        '<button class="btn btn-ghost btn-sm" type="button" id="c-retry">Try again</button>');
    });
  }
  load();
  setInterval(function () { if (!document.hidden) load(); }, 5 * 60000);
})();
