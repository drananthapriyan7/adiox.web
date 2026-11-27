/* ═══════════════════════════════════════════════════════════════
   ADIOX TOURNAMENTS — page behaviour
   The rule checker and the leaderboard/prize simulator mirror the
   tournament logic in the Adiox portal (TournamentService):
   - live checks in order: overall loss → daily loss
   - a rule set to 0 is off
   - at the end: the minimum number of trades decides eligibility
   - competition ranking by equity (1, 1, 3); tied cash/credit prizes pooled
     and split equally; challenge prizes given to every tied player.
═══════════════════════════════════════════════════════════════ */
(function () {
  'use strict';
  document.documentElement.classList.add('js');
  var Arena = {}; // hooks shared between the tools and the live-data module
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var num = function (v) { var n = parseFloat(v); return isFinite(n) ? n : 0; };
  var usd = function (v) { return (v < 0 ? '−$' : '$') + Math.abs(v).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }); };
  var usd0 = function (v) { return '$' + Math.round(v).toLocaleString('en-US'); };
  var esc = function (s) { return String(s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); };

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

  /* ─── Rule checker ─── */
  var checker = $('#checker');
  if (checker) {
    var list = $('#c-list'), verdict = $('#c-verdict');
    var runChecker = function () {
      var f = checker.elements;
      var init = Math.max(0, num(f.init.value)), maxLoss = Math.max(0, num(f.maxLoss.value)), daily = Math.max(0, num(f.daily.value));
      var minTrades = Math.max(0, Math.floor(num(f.minTrades.value)));
      var equity = num(f.equity.value), prev = f.prev.value === '' ? init : Math.max(0, num(f.prev.value));
      var trades = Math.max(0, Math.floor(num(f.trades.value)));
      var atEnd = f.stage.value === 'end';

      var rows = [], broken = null;
      var add = function (label, state, detail) { rows.push({ label: label, state: state, detail: detail }); };
      var live = [
        { label: 'Overall loss', on: maxLoss > 0, fail: equity <= init - maxLoss, detail: 'Floor ' + usd0(init - maxLoss) + ' · equity ' + usd0(equity), reason: 'Overall loss reached' },
        { label: 'Daily loss', on: daily > 0, fail: prev - equity >= daily, detail: 'Floor ' + usd0(prev - daily) + ' · lost ' + usd0(Math.max(0, prev - equity)) + ' today', reason: 'Daily loss reached' }
      ];
      live.forEach(function (r) {
        if (!r.on) return add(r.label, 'na', 'Off');
        if (broken) return add(r.label, 'na', 'Not checked');
        if (r.fail) { broken = r.reason; return add(r.label, 'bad', r.detail); }
        add(r.label, 'ok', r.detail);
      });

      var notEligible = [];
      if (atEnd && !broken) {
        if (trades < minTrades) notEligible.push('fewer than ' + minTrades + ' trades');
        add('Minimum trades', minTrades > 0 ? (trades < minTrades ? 'bad' : 'ok') : 'na', minTrades > 0 ? trades + ' of ' + minTrades : 'Off');
      }

      list.innerHTML = rows.map(function (r) {
        return '<li class="' + r.state + '"><span>' + esc(r.label) + '</span><b>' + esc(r.detail) + '</b></li>';
      }).join('');
      if (broken) {
        verdict.className = 'verdict v-bad';
        verdict.innerHTML = 'Eliminated<small>' + esc(broken) + ' — open trades are closed and the account is locked.</small>';
      } else if (atEnd && notEligible.length) {
        verdict.className = 'verdict v-warn';
        verdict.innerHTML = 'Not eligible<small>Finished, but ' + esc(notEligible.join(', ')) + ', so no rank or prize.</small>';
      } else if (atEnd) {
        verdict.className = 'verdict v-ok';
        verdict.innerHTML = 'Qualifies for a rank<small>Ranked by final equity: ' + esc(usd(equity)) + '.</small>';
      } else {
        verdict.className = 'verdict v-ok';
        verdict.innerHTML = 'Still in the tournament<small>No live rule broken. End-of-tournament checks still apply.</small>';
      }
    };
    checker.addEventListener('input', runChecker);
    checker.addEventListener('change', runChecker);
    checker.addEventListener('submit', function (e) { e.preventDefault(); });
    runChecker();
    // Pre-fill the checker with a real tournament's rules (from the portal API).
    Arena.loadRules = function (t) {
      var r = t.rules || {}, f = checker.elements;
      f.init.value = t.startingBalance || 0; f.maxLoss.value = r.maxOverallLoss || 0; f.daily.value = r.maxDailyLoss || 0;
      f.minTrades.value = r.minTrades || 0;
      f.equity.value = t.startingBalance || 0; f.prev.value = ''; f.trades.value = 0;
      runChecker();
    };
  }

  /* ─── Leaderboard & prize simulator ─── */
  var pBody = $('#s-players'), zBody = $('#s-prizes'), out = $('#s-result'), note = $('#s-note');
  if (pBody && zBody) {
    var EXAMPLE_PLAYERS = [
      ['trader_kai', 11840, 42], ['m.santos', 11215, 18], ['pipwizard', 11215, 27], ['lena_fx', 10702, 9],
      ['rex_fx', 10450, 2], ['nova', 10390, 15], ['drift', 9980, 6], ['zed', 9640, 4]
    ];
    var EXAMPLE_PRIZES = [[1, 1, 'cash', 500], [2, 3, 'cash', 250], [4, 5, 'credit', 100], [6, 6, 'challenge', 10000]];
    var TYPES = { cash: 'Cash', credit: 'Credit', challenge: 'Challenge' };

    var playerRow = function (p) {
      return '<tr><td><input class="inp" aria-label="Player name" data-k="name" maxlength="24" value="' + esc(p[0]) + '"></td>' +
        '<td><input class="inp" aria-label="Final equity" data-k="equity" type="number" step="10" value="' + p[1] + '"></td>' +
        '<td><input class="inp" aria-label="Trades" data-k="trades" type="number" min="0" step="1" value="' + p[2] + '"></td>' +
        '<td><button class="del" type="button" aria-label="Remove player">✕</button></td></tr>';
    };
    var prizeRow = function (z) {
      return '<tr><td><div style="display:flex; gap:6px; align-items:center;"><input class="inp" aria-label="From rank" data-k="from" type="number" min="1" step="1" value="' + z[0] + '" style="min-width:56px;">–<input class="inp" aria-label="To rank" data-k="to" type="number" min="1" step="1" value="' + z[1] + '" style="min-width:56px;"></div></td>' +
        '<td><select class="inp" aria-label="Prize type" data-k="type">' + Object.keys(TYPES).map(function (t) { return '<option value="' + t + '"' + (t === z[2] ? ' selected' : '') + '>' + TYPES[t] + '</option>'; }).join('') + '</select></td>' +
        '<td><input class="inp" aria-label="Amount, or challenge account size" data-k="amount" type="number" min="0" step="10" value="' + z[3] + '"></td>' +
        '<td><button class="del" type="button" aria-label="Remove prize row">✕</button></td></tr>';
    };
    var load = function () {
      pBody.innerHTML = EXAMPLE_PLAYERS.map(playerRow).join('');
      zBody.innerHTML = EXAMPLE_PRIZES.map(prizeRow).join('');
      simulate();
    };
    var read = function (body) {
      return $$('tr', body).map(function (tr) {
        var o = {};
        $$('[data-k]', tr).forEach(function (el) { o[el.getAttribute('data-k')] = el.value; });
        return o;
      });
    };

    var simulate = function () {
      var init = Math.max(0, num($('#s-init').value)), minT = Math.max(0, Math.floor(num($('#s-min').value)));
      var players = read(pBody).map(function (p, i) { return { name: (p.name || 'Player ' + (i + 1)).trim(), equity: num(p.equity), trades: Math.max(0, Math.floor(num(p.trades))) }; });
      var prizes = read(zBody).map(function (z) {
        var a = Math.max(1, Math.floor(num(z.from))), b = Math.max(1, Math.floor(num(z.to)));
        return { from: Math.min(a, b), to: Math.max(a, b), type: z.type, amount: Math.max(0, num(z.amount)) };
      });

      var eligible = [], out_ = [];
      players.forEach(function (p) {
        var why = [];
        if (p.trades < minT) why.push('fewer than ' + minT + ' trades');
        if (why.length) { p.why = why.join(', '); out_.push(p); } else eligible.push(p);
      });
      eligible.sort(function (a, b) { return b.equity - a.equity; });

      // Competition ranking: equal equity → equal rank; next rank skips.
      var groups = [];
      eligible.forEach(function (p, i) {
        var g = groups[groups.length - 1];
        if (g && g.equity === p.equity) g.players.push(p);
        else groups.push({ rank: i + 1, equity: p.equity, players: [p] });
      });

      var tieNotes = [];
      groups.forEach(function (g) {
        var n = g.players.length, pool = { cash: 0, credit: 0 }, challenge = null;
        for (var pos = g.rank; pos < g.rank + n; pos++) {
          prizes.forEach(function (z) {
            if (pos < z.from || pos > z.to) return;
            if (z.type === 'challenge') { if (!challenge || z.amount > challenge) challenge = z.amount; }
            else pool[z.type] += z.amount;
          });
        }
        g.players.forEach(function (p) {
          p.rank = g.rank;
          p.prize = [];
          if (pool.cash) p.prize.push('<span class="prize-cash">' + usd(pool.cash / n) + ' cash</span>');
          if (pool.credit) p.prize.push('<span class="prize-credit">' + usd(pool.credit / n) + ' credit</span>');
          if (challenge !== null) p.prize.push('<span class="prize-chal">' + usd0(challenge) + ' challenge</span>');
        });
        if (n > 1 && (pool.cash || pool.credit || challenge !== null)) {
          var parts = [];
          if (pool.cash) parts.push(usd(pool.cash) + ' cash split ' + n + ' ways');
          if (pool.credit) parts.push(usd(pool.credit) + ' credit split ' + n + ' ways');
          if (challenge !== null) parts.push('a challenge account each');
          tieNotes.push(n + ' players tied at rank ' + g.rank + ': ' + parts.join(', ') + '.');
        }
      });

      var rows = eligible.map(function (p) {
        var cls = p.rank <= 3 ? ' r' + p.rank : '';
        return '<tr><td><span class="rk' + cls + '">' + p.rank + '</span></td><td>' + esc(p.name) + '</td><td class="num">' + usd(p.equity) + '</td><td>' + (p.prize.length ? p.prize.join('<br>') : '<span class="faint">—</span>') + '</td></tr>';
      });
      out_.forEach(function (p) {
        rows.push('<tr><td><span class="rk">—</span></td><td>' + esc(p.name) + '</td><td class="num">' + usd(p.equity) + '</td><td><span class="badge b-red">Not eligible</span><br><span class="faint small">' + esc(p.why) + '</span></td></tr>');
      });
      out.innerHTML = rows.length ? rows.join('') : '<tr><td colspan="4" class="faint">Add players to see the leaderboard.</td></tr>';
      note.textContent = (tieNotes.length ? tieNotes.join(' ') + ' ' : '') +
        (out_.length ? out_.length + ' player' + (out_.length > 1 ? 's' : '') + ' removed before ranking. ' : '') +
        'Example data — real prize tables are set per tournament.';
    };

    $('#s-add-player').addEventListener('click', function () {
      pBody.insertAdjacentHTML('beforeend', playerRow(['Player ' + (pBody.rows.length + 1), init(), 5]));
      simulate();
      $('tr:last-child input', pBody).focus();
    });
    var init = function () { return Math.max(0, num($('#s-init').value)); };
    $('#s-add-prize').addEventListener('click', function () {
      var last = read(zBody).pop(), from = last ? Math.max(num(last.from), num(last.to)) + 1 : 1;
      zBody.insertAdjacentHTML('beforeend', prizeRow([from, from, 'cash', 50]));
      simulate();
    });
    $('#s-reset').addEventListener('click', load);
    // Pre-fill the simulator with a real tournament's prize table and qualification rules.
    Arena.loadPrizes = function (t) {
      var r = t.rules || {}, rows = (t.prizes && t.prizes.rows) || [];
      // Keep the example players comparable: rescale their equity to the new starting balance.
      var oldInit = num($('#s-init').value), newInit = num(t.startingBalance);
      if (oldInit > 0 && newInit > 0 && oldInit !== newInit) {
        $$('input[data-k="equity"]', pBody).forEach(function (el) { el.value = Math.round(num(el.value) * newInit / oldInit); });
      }
      $('#s-init').value = t.startingBalance || 0;
      $('#s-min').value = r.minTrades || 0;
      zBody.innerHTML = rows.length
        ? rows.map(function (z) { return prizeRow([z.rankFrom, z.rankTo, z.type, z.type === 'challenge' ? (z.challengeAccountSize || 0) : z.amount]); }).join('')
        : '';
      simulate();
    };
    [pBody, zBody].forEach(function (b) {
      b.addEventListener('click', function (e) {
        var d = e.target.closest('.del');
        if (d) { d.closest('tr').remove(); simulate(); }
      });
    });
    ['#s-init', '#s-min'].forEach(function (s) { $(s).addEventListener('input', simulate); });
    pBody.addEventListener('input', simulate);
    zBody.addEventListener('input', simulate);
    zBody.addEventListener('change', simulate);
    load();
  }

  /* ═══ Live tournaments (portal public API) ═══════════════════
     GET {api}?status=all · {api}/{id} · {api}/{id}/leaderboard
     The static content above stays as the fallback when the API is unreachable. */
  var PORTAL = 'https://portal.adiox.io';
  var API = (function () {
    var meta = $('meta[name="adiox-api"]'), base = meta ? meta.content : '';
    // Local development only: ?api=http://localhost:xxxx/api/public/tournaments
    if (/^(localhost|127\.0\.0\.1)$/.test(location.hostname)) {
      var q = new URLSearchParams(location.search).get('api');
      if (q && /^https?:\/\//.test(q)) base = q;
    }
    return base.replace(/\/+$/, '');
  })();
  var grid = $('#t-grid');
  // The static card in the HTML, shown when nothing is open for registration.
  var fb = grid && $('.t-fallback', grid), FALLBACK = fb ? fb.outerHTML : '';

  function getJSON(path) {
    var ctrl = 'AbortController' in window ? new AbortController() : null;
    var timer = ctrl ? setTimeout(function () { ctrl.abort(); }, 10000) : null;
    return fetch(API + path, { headers: { Accept: 'application/json' }, credentials: 'omit', signal: ctrl ? ctrl.signal : undefined })
      .then(function (r) { if (!r.ok) throw new Error('HTTP ' + r.status); return r.json(); })
      .finally(function () { if (timer) clearTimeout(timer); });
  }
  function safeUrl(u) {
    try { var x = new URL(u); return /^https?:$/.test(x.protocol) ? x.href : ''; } catch (e) { return ''; }
  }
  function money(v) {
    v = num(v);
    return '$' + v.toLocaleString('en-US', { minimumFractionDigits: v % 1 ? 2 : 0, maximumFractionDigits: 2 });
  }
  function flag(code) {
    if (!code || !/^[A-Za-z]{2}$/.test(code)) return '';
    return '<span class="flag" aria-label="' + esc(code.toUpperCase()) + '">' + String.fromCodePoint.apply(null, code.toUpperCase().split('').map(function (c) { return 127397 + c.charCodeAt(0); })) + '</span>';
  }
  function fmtDate(iso) {
    var d = new Date(iso);
    return isNaN(d) ? '—' : d.toLocaleString(undefined, { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
  }
  function countdown(iso) {
    var ms = new Date(iso) - Date.now();
    if (!(ms > 0)) return null;
    var s = Math.floor(ms / 1000), d = Math.floor(s / 86400), h = Math.floor(s % 86400 / 3600), m = Math.floor(s % 3600 / 60), sec = s % 60;
    var p = function (n) { return (n < 10 ? '0' : '') + n; };
    return d > 0 ? d + 'd ' + p(h) + 'h ' + p(m) + 'm' : p(h) + 'h ' + p(m) + 'm ' + p(sec) + 's';
  }
  function prizeSummary(t) {
    var z = t.prizes || {}, parts = [];
    if (num(z.cashPool) > 0) parts.push(money(z.cashPool) + ' cash');
    if (num(z.creditPool) > 0) parts.push(money(z.creditPool) + ' credit');
    if (num(z.challengeAccounts) > 0) parts.push(z.challengeAccounts + ' challenge' + (z.challengeAccounts > 1 ? 's' : ''));
    return parts.length ? parts.join(' + ') : '—';
  }
  var STATUS = { live: ['Live', 'b-green'], upcoming: ['Coming soon', 'b-blue'], completed: ['Ended', 'b-violet'] };

  function timeLine(t) {
    if (t.status === 'upcoming') return '<div class="when">Starts in<b data-cd="' + esc(t.startTime) + '">—</b></div>';
    if (t.status === 'live') return '<div class="when">Ends in<b data-cd="' + esc(t.endTime) + '">—</b></div>';
    return '<div class="when">Ended<b>' + esc(fmtDate(t.endTime)) + '</b></div>';
  }
  function regLine(t) {
    if (t.status === 'completed') return '';
    if (t.registrationOpen) return '<p class="reg open">● Registration open' + (t.registrationClosesAt ? ' · closes ' + esc(fmtDate(t.registrationClosesAt)) : '') + '</p>';
    var full = t.slotsTotal > 0 && t.slotsTaken >= t.slotsTotal;
    return '<p class="reg closed">' + (full ? 'Full — all slots taken' : 'Registration closed') + '</p>';
  }
  function slotsLine(t) {
    if (!t.slotsTotal) return '<div class="slots"><div class="slots-top"><span>Slots</span><span class="num">Unlimited · ' + num(t.slotsTaken) + ' joined</span></div></div>';
    var pct = Math.min(100, Math.round(num(t.slotsTaken) / t.slotsTotal * 100));
    return '<div class="slots"><div class="slots-top"><span>Slots</span><span class="num">' + num(t.slotsTaken) + ' / ' + t.slotsTotal + '</span></div><div class="bar"><i style="--w:' + pct + '%"></i></div></div>';
  }
  function card(t) {
    var st = STATUS[t.status] || STATUS.upcoming, img = safeUrl(t.bannerUrl);
    return '<article class="tcard">' +
      '<div class="tbanner">' + (img ? '<img src="' + esc(img) + '" alt="" loading="lazy" onerror="this.remove()">' : '') +
      '<div class="badges"><span class="badge dot ' + st[1] + '">' + st[0] + '</span><span class="badge b-gold">' + (t.category === 'free' ? 'Free' : 'Paid') + '</span></div></div>' +
      '<div class="tbody"><h3>' + esc(t.name) + '</h3><p class="desc clamp">' + esc(t.description || '') + '</p>' +
      '<div class="tgrid"><div><span>Starting balance</span><b>' + money(t.startingBalance) + '</b></div>' +
      '<div><span>Entry fee</span><b' + (num(t.entryFee) ? '' : ' class="gold"') + '>' + (num(t.entryFee) ? money(t.entryFee) : 'Free') + '</b></div>' +
      '<div><span>Prizes</span><b>' + esc(prizeSummary(t)) + '</b></div></div>' +
      slotsLine(t) +
      '<div class="tfoot">' + timeLine(t) + '</div>' + regLine(t) +
      '<div class="tact"><button class="btn btn-ghost btn-sm" type="button" data-open="' + t.id + '">Details</button>' +
      '<a class="btn btn-gold btn-sm" href="' + PORTAL + '" target="_blank" rel="noopener" aria-label="Join Now: ' + esc(t.name) + ' (opens the Adiox portal)">Join Now ↗</a></div>' +
      '</div></article>';
  }

  var data = null;
  function byStatus(s) { return data ? data.tournaments.filter(function (t) { return t.status === s; }) : []; }
  // Open for registration: live or upcoming, registration open (full or closed ones are left out).
  function openList() {
    if (!data) return [];
    var rank = { live: 0, upcoming: 1 };
    return data.tournaments.filter(function (t) { return t.registrationOpen && t.status !== 'completed'; })
      .sort(function (a, b) {
        return (rank[a.status] - rank[b.status]) ||
          (new Date(a.registrationClosesAt || a.startTime) - new Date(b.registrationClosesAt || b.startTime));
      });
  }
  function setCount(n) {
    var pill = $('#n-open'); if (!pill) return;
    pill.textContent = n ? String(n) : ''; pill.hidden = !n;
  }
  function setNote(text) {
    var el = $('#t-note'); if (!el) return;
    el.textContent = text || ''; el.hidden = !text;
  }
  function showFallback(text) {
    grid.innerHTML = FALLBACK;
    grid.classList.remove('is-loading');
    grid.setAttribute('aria-busy', 'false');
    setCount(0);
    setNote(text);
  }
  function render() {
    var list = openList();
    setCount(list.length);
    if (!list.length) {
      showFallback('No tournaments are open for registration right now. The card above shows what a tournament looks like. Join Now opens the Adiox portal, where new tournaments appear first.');
      return;
    }
    grid.classList.remove('is-loading');
    grid.setAttribute('aria-busy', 'false');
    setNote('');
    grid.innerHTML = list.map(card).join('');
    tick();
  }
  function tick() {
    $$('[data-cd]').forEach(function (el) {
      var left = countdown(el.getAttribute('data-cd'));
      el.textContent = left || 'now';
    });
  }

  function heroStats() {
    var box = $('#live-stats'); if (!box || !data) return;
    var open = openList();
    var cash = open.reduce(function (s, t) { return s + num(t.prizes && t.prizes.cashPool); }, 0);
    var html = '<span><i class="pulse"></i><b>' + open.length + '</b> open for registration</span><span><b>' + num(data.counts.live) + '</b> live</span>';
    if (cash > 0) html += '<span><b>' + money(cash) + '</b> in cash prizes to join now</span>';
    box.innerHTML = html; box.hidden = false;
  }
  function heroBoard() {
    var featured = byStatus('live')[0] || byStatus('completed')[0];
    if (!featured) return;
    getJSON('/' + featured.id + '/leaderboard').then(function (lb) {
      if (!lb.entries || !lb.entries.length) return;
      var st = STATUS[featured.status] || STATUS.live;
      var badge = $('#hb-badge'); badge.className = 'badge dot ' + st[1]; badge.textContent = st[0];
      $('#hb-name').textContent = featured.name;
      $('#hb-desc').textContent = (featured.status === 'live' ? 'Live leaderboard' : 'Final leaderboard') + ' · ' + num(lb.players && lb.players.total) + ' players';
      $('#hb-rows').innerHTML = lb.entries.slice(0, 3).map(function (e) {
        return '<tr><td><span class="rk' + (e.rank <= 3 ? ' r' + e.rank : '') + '">' + e.rank + '</span></td><td>' + esc(e.name) + flag(e.country) + '</td><td class="num">' + money(e.equity) + '</td></tr>';
      }).join('');
      var board = $('#hero-board'); board.setAttribute('aria-label', 'Leaderboard of ' + featured.name);
      $('#hb-caption').textContent = 'Live from the Adiox portal · updated ' + new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }).catch(function () { /* keep the illustration */ });
  }

  // Structured data: live and upcoming tournaments as Events (only real data from the API).
  function eventSchema() {
    var open = data.tournaments.filter(function (t) { return t.status !== 'completed'; });
    var old = $('#live-events'); if (old) old.remove();
    if (!open.length) return;
    var el = document.createElement('script');
    el.type = 'application/ld+json'; el.id = 'live-events';
    el.textContent = JSON.stringify({
      '@context': 'https://schema.org',
      '@graph': open.map(function (t) {
        var img = safeUrl(t.bannerUrl);
        return {
          '@type': 'Event', name: t.name, description: t.description || undefined,
          startDate: t.startTime, endDate: t.endTime,
          eventStatus: 'https://schema.org/EventScheduled',
          eventAttendanceMode: 'https://schema.org/OnlineEventAttendanceMode',
          location: { '@type': 'VirtualLocation', url: PORTAL },
          image: img ? [img] : undefined,
          organizer: { '@type': 'Organization', name: 'Adiox', url: 'https://adiox.io/' },
          offers: { '@type': 'Offer', price: String(num(t.entryFee)), priceCurrency: 'USD', url: PORTAL,
            availability: t.registrationOpen ? 'https://schema.org/InStock' : 'https://schema.org/SoldOut',
            validThrough: t.registrationClosesAt || t.endTime }
        };
      })
    });
    document.head.appendChild(el);
  }

  // Tool pickers: load a real tournament into the rule checker and the prize simulator.
  function fillPickers() {
    [['#c-load', Arena.loadRules], ['#s-load', Arena.loadPrizes]].forEach(function (p) {
      var sel = $(p[0]); if (!sel || !p[1] || !data.tournaments.length) return;
      var keep = sel.value;
      sel.innerHTML = '<option value="">Choose a tournament…</option>' + data.tournaments.map(function (t) {
        return '<option value="' + t.id + '">' + esc(t.name) + ' (' + (STATUS[t.status] || STATUS.upcoming)[0].toLowerCase() + ')</option>';
      }).join('');
      sel.value = keep;
      sel.closest('.load-real').hidden = false;
      if (!sel.dataset.bound) {
        sel.dataset.bound = '1';
        sel.addEventListener('change', function () {
          var t = data.tournaments.filter(function (x) { return String(x.id) === sel.value; })[0];
          if (t) p[1](t);
        });
      }
    });
  }

  // Details dialog with rules, prizes and the live leaderboard.
  var dlg = $('#t-dialog'), dBody = $('#d-body'), lastFocus = null;
  function rulesTable(t) {
    var r = t.rules || {}, off = '<span class="faint">Off</span>';
    var row = function (k, v) { return '<tr><th scope="row">' + k + '</th><td class="num">' + v + '</td></tr>'; };
    return '<div class="tw"><table><tbody>' +
      row('Overall loss limit', num(r.maxOverallLoss) ? money(r.maxOverallLoss) + ' <span class="faint">(floor ' + money(num(t.startingBalance) - num(r.maxOverallLoss)) + ')</span>' : off) +
      row('Daily loss limit', num(r.maxDailyLoss) ? money(r.maxDailyLoss) : off) +
      row('Min trades to qualify', num(r.minTrades) || off) +
      '</tbody></table></div>' +
      '<div class="flags">' + [['News trading', r.newsTradingAllowed], ['Copy trading', r.copyTradingAllowed], ['HFT', r.hftAllowed]].map(function (f) {
        return '<span class="badge ' + (f[1] ? 'b-green' : 'b-red') + '">' + f[0] + (f[1] ? ' allowed' : ' not allowed') + '</span>';
      }).join('') + '</div>';
  }
  function prizeTable(t) {
    var rows = (t.prizes && t.prizes.rows) || [];
    if (!rows.length) return '<p class="faint">The prize table is shown in the portal.</p>';
    return '<div class="tw"><table><thead><tr><th scope="col">Ranks</th><th scope="col">Prize</th></tr></thead><tbody>' + rows.map(function (z) {
      var ranks = z.rankFrom === z.rankTo ? '#' + z.rankFrom : '#' + z.rankFrom + '–' + z.rankTo;
      var prize = z.type === 'challenge' ? '<span class="prize-chal">' + (z.challengeAccountSize ? money(z.challengeAccountSize) + ' ' : '') + 'challenge account</span>'
        : '<span class="prize-' + (z.type === 'credit' ? 'credit' : 'cash') + '">' + money(z.amount) + ' ' + esc(z.type) + (z.rankFrom !== z.rankTo ? ' each' : '') + '</span>';
      return '<tr><td>' + ranks + '</td><td>' + prize + '</td></tr>';
    }).join('') + '</tbody></table></div>';
  }
  function openDetails(id, opener) {
    var t = data && data.tournaments.filter(function (x) { return x.id === id; })[0];
    if (!t || !dlg) return;
    lastFocus = opener || document.activeElement;
    var st = STATUS[t.status] || STATUS.upcoming;
    dBody.innerHTML =
      '<div class="badges" style="display:flex;gap:6px;"><span class="badge dot ' + st[1] + '">' + st[0] + '</span><span class="badge b-gold">' + (t.category === 'free' ? 'Free entry' : 'Paid entry') + '</span></div>' +
      '<h2 id="d-title">' + esc(t.name) + '</h2><p class="muted">' + esc(t.description || '') + '</p>' +
      '<div class="dmeta"><div><span>Starts</span><b>' + esc(fmtDate(t.startTime)) + '</b></div><div><span>Ends</span><b>' + esc(fmtDate(t.endTime)) + '</b></div>' +
      '<div><span>Starting balance</span><b>' + money(t.startingBalance) + '</b></div><div><span>Entry fee</span><b>' + (num(t.entryFee) ? money(t.entryFee) : 'Free') + '</b></div>' +
      '<div><span>Slots</span><b>' + (t.slotsTotal ? num(t.slotsTaken) + ' / ' + t.slotsTotal : 'Unlimited') + '</b></div><div><span>Registration closes</span><b>' + (t.registrationClosesAt ? esc(fmtDate(t.registrationClosesAt)) : '—') + '</b></div>' +
      '<div><span>Accounts per player</span><b>' + num(t.maxAccountsPerUser) + '</b></div><div><span>Rejoins</span><b>' + (num(t.maxRejoins) ? num(t.maxRejoins) + ' × ' + money(t.rejoinFee) + (num(t.rejoinCooldownMinutes) ? ', ' + num(t.rejoinCooldownMinutes) + ' min cooldown' : '') : 'Not allowed') + '</b></div></div>' +
      '<h3>Rules</h3>' + rulesTable(t) +
      '<h3>Prizes</h3>' + prizeTable(t) +
      '<h3>Leaderboard</h3><div id="d-lb">' + (t.status === 'upcoming' ? '<p class="faint">The leaderboard opens when the tournament starts.</p>' : '<p class="faint">Loading leaderboard…</p>') + '</div>' +
      '<div class="dact"><a class="btn btn-gold" href="' + PORTAL + '" target="_blank" rel="noopener">' + (t.registrationOpen ? 'Join in the portal ↗' : 'Open the portal ↗') + '</a>' +
      '<button class="btn btn-ghost" type="button" data-use="rules">Check these rules</button><button class="btn btn-ghost" type="button" data-use="prizes">Simulate these prizes</button></div>';
    dBody.querySelector('[data-use="rules"]').addEventListener('click', function () { if (Arena.loadRules) Arena.loadRules(t); syncPicker('#c-load', t.id); closeDetails(); document.getElementById('rules').scrollIntoView(); });
    dBody.querySelector('[data-use="prizes"]').addEventListener('click', function () { if (Arena.loadPrizes) Arena.loadPrizes(t); syncPicker('#s-load', t.id); closeDetails(); document.getElementById('prizes').scrollIntoView(); });
    if (typeof dlg.showModal === 'function') dlg.showModal(); else dlg.setAttribute('open', '');
    if (t.status !== 'upcoming') {
      getJSON('/' + t.id + '/leaderboard').then(function (lb) {
        var box = $('#d-lb'); if (!box) return;
        if (!lb.entries || !lb.entries.length) { box.innerHTML = '<p class="faint">No ranked players yet.</p>'; return; }
        box.innerHTML = '<div class="tw"><table><thead><tr><th scope="col">Rank</th><th scope="col">Trader</th><th scope="col">Equity</th><th scope="col">P/L</th><th scope="col">Trades</th></tr></thead><tbody>' +
          lb.entries.map(function (e) {
            var pl = num(e.profitPct);
            return '<tr><td><span class="rk' + (e.rank <= 3 ? ' r' + e.rank : '') + '">' + e.rank + '</span></td><td>' + esc(e.name) + flag(e.country) + '</td><td class="num">' + money(e.equity) + '</td>' +
              '<td class="num" style="color:' + (pl >= 0 ? 'var(--green)' : 'var(--red)') + '">' + (pl >= 0 ? '+' : '') + pl.toFixed(2) + '%</td><td class="num">' + num(e.trades) + '</td></tr>';
          }).join('') + '</tbody></table></div><p class="out-note" style="margin-top:8px;">' + num(lb.players && lb.players.total) + ' players · ' + num(lb.players && lb.players.eliminated) + ' eliminated · names shortened for privacy</p>';
      }).catch(function () { var box = $('#d-lb'); if (box) box.innerHTML = '<p class="faint">The leaderboard couldn’t be loaded. It’s always available in the portal.</p>'; });
    }
  }
  function syncPicker(sel, id) { var s = $(sel); if (s) s.value = String(id); }
  function closeDetails() {
    if (!dlg) return;
    if (typeof dlg.close === 'function') dlg.close(); else dlg.removeAttribute('open');
  }
  if (dlg) {
    dlg.addEventListener('click', function (e) { if (e.target === dlg || e.target.closest('[data-close]')) closeDetails(); });
    dlg.addEventListener('close', function () { if (lastFocus && lastFocus.focus) lastFocus.focus(); });
  }
  if (grid) grid.addEventListener('click', function (e) {
    var b = e.target.closest('[data-open]');
    if (b) openDetails(Number(b.getAttribute('data-open')), b);
  });

  var firstLoad = true;
  function loadLive(manual) {
    if (!grid) return;
    if (!API) { showFallback(''); return; }
    getJSON('?status=all').then(function (res) {
      data = res && Array.isArray(res.tournaments) ? res : { counts: { live: 0, upcoming: 0, completed: 0 }, tournaments: [] };
      if (firstLoad || manual) heroBoard();
      firstLoad = false;
      render();
      heroStats(); fillPickers(); eventSchema();
      $('#t-updated').textContent = 'Updated ' + new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + ' · data from the Adiox portal';
    }).catch(function () {
      // Keep showing real cards from an earlier load; otherwise show the static card. The 60 s refresh retries.
      if (!data) showFallback('Live tournaments couldn’t be loaded right now. Join Now still takes you to the Adiox portal.');
    });
  }
  if (grid) {
    loadLive();
    setInterval(tick, 1000);
    setInterval(function () { if (!document.hidden) loadLive(); }, 60000);
  }

  $$('[data-year]').forEach(function (el) { el.textContent = new Date().getFullYear(); });
})();
