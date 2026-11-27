/* ═══════════════════════════════════════════════════════════════
   ADIOX SIGNALS — page behaviour
   Top signals come from the portal's public API:
     GET https://portal.adiox.io/api/public/signals
     → { generatedAt, available, signals: [ { id, position, name, description, imageUrl, fee, periodDays,
         currency, trialEnabled, subscribers, hasTrackRecord, windowDays, closedTrades, winRatePct, totalR,
         profitFactor, signalCount, topSymbols, mainTimeframe, lastSignalAt, gold, subscribeUrl } ] }
   Subscribe opens that provider on Adiox Trade Copier (subscribeUrl); Get Free Signal opens the Adiox portal.
═══════════════════════════════════════════════════════════════ */
(function () {
  'use strict';
  document.documentElement.classList.add('js');
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var num = function (v) { var n = parseFloat(v); return isFinite(n) ? n : 0; };
  var esc = function (s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); };
  var PORTAL = 'https://portal.adiox.io';

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

  /* ═══ Top signals (portal public API) ═══ */
  var API = (function () {
    var meta = $('meta[name="adiox-api"]'), base = meta ? meta.content : '';
    // Local development only: ?api=http://localhost:xxxx/api/public/signals
    if (/^(localhost|127\.0\.0\.1)$/.test(location.hostname)) {
      var q = new URLSearchParams(location.search).get('api');
      if (q && /^https?:\/\//.test(q)) base = q;
    }
    return base.replace(/\/+$/, '');
  })();
  var grid = $('#s-grid'), state = $('#s-state');
  if (!grid) return;

  function getJSON(url) {
    var ctrl = 'AbortController' in window ? new AbortController() : null;
    var timer = ctrl ? setTimeout(function () { ctrl.abort(); }, 10000) : null;
    return fetch(url, { headers: { Accept: 'application/json' }, credentials: 'omit', signal: ctrl ? ctrl.signal : undefined })
      .then(function (r) { if (!r.ok) throw new Error('HTTP ' + r.status); return r.json(); })
      .finally(function () { if (timer) clearTimeout(timer); });
  }
  function safeUrl(u, httpsOnly) {
    try { var x = new URL(u); return (httpsOnly ? x.protocol === 'https:' : /^https?:$/.test(x.protocol)) ? x.href : ''; } catch (e) { return ''; }
  }
  function price(s) {
    var fee = num(s.fee), cur = String(s.currency || 'USD').toUpperCase();
    if (!fee) return 'Free';
    var amount = fee.toLocaleString('en-US', { minimumFractionDigits: fee % 1 ? 2 : 0, maximumFractionDigits: 2 });
    var period = num(s.periodDays) ? ' / ' + num(s.periodDays) + ' days' : '';
    return (cur === 'USD' ? '$' + amount : amount + ' ' + esc(cur)) + period;
  }
  function ago(iso) {
    var t = new Date(iso); if (isNaN(t)) return '';
    var m = Math.max(0, Math.round((Date.now() - t) / 60000));
    if (m < 60) return m <= 1 ? 'just now' : m + ' min ago';
    var h = Math.round(m / 60); if (h < 24) return h + 'h ago';
    var d = Math.round(h / 24); return d + (d === 1 ? ' day ago' : ' days ago');
  }
  function initials(name) {
    return String(name || '').replace(/[^A-Za-z0-9À-￿\s]/g, '').split(/\s+/).filter(Boolean).slice(0, 2).map(function (w) { return w.charAt(0).toUpperCase(); }).join('') || 'S';
  }
  function fixed(v, d) { return num(v).toFixed(d).replace(/\.0+$|(\.\d*?)0+$/, '$1'); }

  function card(s) {
    var img = safeUrl(s.imageUrl, true);
    var symbols = (s.topSymbols || []).slice(0, 3).map(esc).join(', ');
    var tagline = symbols + (s.mainTimeframe ? (symbols ? ' · ' : '') + esc(s.mainTimeframe) : '');
    var hasRecord = s.hasTrackRecord && s.totalR != null;
    var r = num(s.totalR);
    var result = hasRecord
      ? '<div class="s-result' + (r < 0 ? ' neg' : '') + '"><b>' + (r >= 0 ? '+' : '−') + fixed(Math.abs(r), 1) + 'R</b><span>Total · ' + (num(s.windowDays) || 90) + ' days · ' + num(s.closedTrades) + ' closed trades</span></div>'
      : '<div class="s-result muted"><b>Building track record</b><span>' + (s.trialEnabled ? 'Free trial available' : 'New signal channel') + '</span></div>';
    var stat = function (v, label) { return '<div><b>' + v + '</b><span>' + label + '</span></div>'; };
    var subscribe = safeUrl(s.subscribeUrl) || PORTAL;
    var last = s.lastSignalAt ? ago(s.lastSignalAt) : '';
    return '<article class="scard' + (s.gold ? ' is-gold' : '') + '">' +
      '<div class="s-head"><div class="s-av">' + esc(initials(s.name)) + (img ? '<img src="' + esc(img) + '" alt="" loading="lazy" referrerpolicy="no-referrer" onerror="this.remove()">' : '') +
        '<span class="s-rank" title="Rank">' + num(s.position) + '</span></div>' +
        '<div class="s-name"><h3 title="' + esc(s.name) + '">' + esc(s.name) + '</h3><span>' + (tagline || 'Forex signals') + '</span></div></div>' +
      '<div class="s-badges">' + (s.gold ? '<span class="badge b-gold">Gold · XAUUSD</span>' : '') + (s.trialEnabled ? '<span class="badge b-green">Free trial</span>' : '') + (hasRecord ? '' : '<span class="badge b-blue">New</span>') + '</div>' +
      result +
      '<div class="s-stats">' +
        stat(hasRecord && s.winRatePct != null ? fixed(s.winRatePct, 1) + '%' : '—', 'Win rate') +
        stat(hasRecord && s.profitFactor != null ? fixed(s.profitFactor, 2) : '—', 'Profit factor') +
        stat(num(s.subscribers).toLocaleString('en-US'), 'Subscribers') +
      '</div>' +
      '<p class="s-desc">' + esc(s.description || '') + '</p>' +
      '<div class="s-meta"><span>Price <b>' + price(s) + '</b></span>' + (last ? '<span>Last signal ' + esc(last) + '</span>' : '') + '</div>' +
      '<div class="s-act">' +
        '<a class="btn btn-ghost btn-sm" href="' + esc(subscribe) + '" target="_blank" rel="noopener" aria-label="Subscribe to ' + esc(s.name) + ' on Adiox Trade Copier">Subscribe ↗</a>' +
        '<a class="btn btn-gold btn-sm" href="' + PORTAL + '" target="_blank" rel="noopener" aria-label="Get a free signal in the Adiox portal">Get Free Signal ↗</a>' +
      '</div></article>';
  }

  var data = null, filter = 'all';
  function visible() {
    var list = data ? data.signals : [];
    return filter === 'gold' ? list.filter(function (s) { return s.gold; }) : list;
  }
  function showState(title, text, extra) {
    state.hidden = false;
    state.innerHTML = '<b>' + title + '</b>' + text + '<div class="actions" style="justify-content:center;">' + (extra || '') +
      '<a class="btn btn-gold btn-sm" href="' + PORTAL + '" target="_blank" rel="noopener">Get Free Gold Signals ↗</a></div>';
  }
  function render() {
    grid.classList.remove('is-loading');
    grid.setAttribute('aria-busy', 'false');
    var list = visible();
    if (!list.length) {
      grid.innerHTML = '';
      if (filter === 'gold' && data.signals.length) {
        showState('No gold-focused providers listed right now', 'Try all signals, or start with your free gold signals: you can get up to five.',
          '<button class="btn btn-ghost btn-sm" type="button" data-filter-go="all">Show all signals</button>');
      } else {
        showState('Top signals are being updated', 'Providers appear here as soon as they are listed. Meanwhile, you can get up to five free gold signals.');
      }
      return;
    }
    state.hidden = true;
    grid.innerHTML = list.map(card).join('');
  }
  function setFilter(f) {
    filter = f === 'gold' ? 'gold' : 'all';
    $$('.filters [data-filter]').forEach(function (b) { b.setAttribute('aria-pressed', String(b.getAttribute('data-filter') === filter)); });
    if (data) render();
  }
  $$('.filters [data-filter]').forEach(function (b) { b.addEventListener('click', function () { setFilter(b.getAttribute('data-filter')); }); });
  state.addEventListener('click', function (e) {
    var go = e.target.closest('[data-filter-go]'); if (go) setFilter(go.getAttribute('data-filter-go'));
    if (e.target.closest('#s-retry')) { state.hidden = true; grid.classList.add('is-loading'); grid.innerHTML = '<div class="skel" aria-hidden="true"></div><div class="skel" aria-hidden="true"></div><div class="skel" aria-hidden="true"></div>'; load(); }
  });

  function counts() {
    var all = data.signals.length, gold = data.signals.filter(function (s) { return s.gold; }).length;
    $('#n-f-all').textContent = all || '';
    $('#n-f-gold').textContent = gold || '';
    var pill = $('#n-all'); pill.textContent = all ? all + ' providers' : ''; pill.hidden = !all;
    var box = $('#live-stats');
    if (box && all) {
      box.innerHTML = '<span><i class="pulse"></i><b>' + all + '</b> top signal providers</span>' + (gold ? '<span><b>' + gold + '</b> trade gold (XAUUSD)</span>' : '');
      box.hidden = false;
    }
  }

  // Structured data: the live provider list (only real data from the API).
  function listSchema() {
    var old = $('#live-signals'); if (old) old.remove();
    if (!data.signals.length) return;
    var el = document.createElement('script');
    el.type = 'application/ld+json'; el.id = 'live-signals';
    el.textContent = JSON.stringify({
      '@context': 'https://schema.org', '@type': 'ItemList', name: 'Top signal providers on Adiox', url: 'https://signals.adiox.io/#top-signals',
      numberOfItems: data.signals.length,
      itemListElement: data.signals.map(function (s, i) {
        return { '@type': 'ListItem', position: i + 1, item: {
          '@type': 'Service', name: s.name, description: s.description || undefined, serviceType: s.gold ? 'Gold (XAUUSD) trading signals' : 'Forex trading signals',
          provider: { '@type': 'Organization', name: s.name }, url: safeUrl(s.subscribeUrl) || undefined,
          offers: { '@type': 'Offer', price: String(num(s.fee)), priceCurrency: String(s.currency || 'USD').toUpperCase() } } };
      })
    });
    document.head.appendChild(el);
  }

  function load() {
    if (!API) { data = { signals: [] }; render(); return; }
    getJSON(API).then(function (res) {
      var list = res && Array.isArray(res.signals) ? res.signals : [];
      if (res && res.available === false && !list.length && !data) throw new Error('unavailable');
      data = { signals: list.slice().sort(function (a, b) { return num(a.position) - num(b.position); }) };
      counts(); render(); listSchema();
      $('#s-updated').textContent = 'Updated ' + new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + ' · data from Adiox';
    }).catch(function () {
      if (data) return; // keep the list from an earlier load
      grid.classList.remove('is-loading'); grid.setAttribute('aria-busy', 'false'); grid.innerHTML = '';
      showState('Top signals couldn’t be loaded right now', 'Please try again in a moment. Your free gold signals are still available in the Adiox portal: you can get up to five.',
        '<button class="btn btn-ghost btn-sm" type="button" id="s-retry">Try again</button>');
    });
  }
  load();
  setInterval(function () { if (!document.hidden) load(); }, 5 * 60000);
})();
