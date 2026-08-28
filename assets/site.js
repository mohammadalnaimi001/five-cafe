/* =====================================================================
   FIVE₅ COFFEE — the public site
   Sections render once; after that only the piece that changed re-renders,
   so typing in the menu search never rebuilds the booking form.
   ===================================================================== */
(function (w, d) {
  'use strict';

  var FV = w.FV, DB = FV.db, U = FV.util, CFG = FV.cfg;
  var t = FV.t;
  var reduce = w.matchMedia && w.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------------------------------------------------------- state */
  var S = {
    zones: [], tables: [], menu: [],
    settings: { open_min: 600, close_min: 1500, slot_min: 30, hold_min: 90, max_party: 12,
                phone: CFG.PHONE, whatsapp: CFG.WHATSAPP, instagram: CFG.INSTAGRAM,
                address_ar: 'شارع الأميرة ثروت، عمّان', address_en: 'Princess Tharwat St, Amman',
                plus_code: 'XR8V+VR Amman' },
    loaded: false
  };
  var V = {
    step: 1,
    date: U.today(), party: 2, time: null, zone: null, table: null, anyTable: false,
    name: '', phone: '', notes: '',
    dayLoad: null, avail: null, availKey: '', availBusy: false,
    menuCat: 'all', menuQ: '',
    mood: { i: 0, answers: [], result: null, started: false },
    done: null, busy: false, err: ''
  };

  /* ---------------------------------------------------------- helpers */
  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  function $(sel, root) { return (root || d).querySelector(sel); }
  function $$(sel, root) { return Array.prototype.slice.call((root || d).querySelectorAll(sel)); }
  function L() { return FV.lang; }
  function loc(row, key) { return row[key + '_' + L()] || row[key + '_ar'] || ''; }
  function fmt(m) { return U.fmtTime(m, L()); }
  function zoneName(id) {
    for (var i = 0; i < S.zones.length; i++) if (S.zones[i].id === id) return loc(S.zones[i], 'name');
    return id;
  }
  function tableById(id) {
    for (var i = 0; i < S.tables.length; i++) if (S.tables[i].id === id) return S.tables[i];
    return null;
  }
  function errText(e) {
    var m = (e && e.message) || '';
    if (/Failed to fetch|NetworkError|Load failed/i.test(m)) return t().errors.NETWORK;
    return t().errors[m] || t().errors.DEFAULT;
  }
  var toastT;
  function toast(msg, bad) {
    var old = $('.toast'); if (old) old.remove();
    var el = d.createElement('div');
    el.className = 'toast' + (bad ? ' toast--bad' : '');
    el.setAttribute('role', 'status'); el.textContent = msg;
    d.body.appendChild(el);
    clearTimeout(toastT); toastT = setTimeout(function () { el.remove(); }, 5200);
  }

  /* ================================================================ HERO */
  function heroHTML() {
    var T = t(), s = S.settings, o = s.open_min, c = s.close_min <= s.open_min ? s.close_min + 1440 : s.close_min;
    var span = c - o, n = U.nowMin(), ext = n < o ? n + 1440 : n;
    var live = U.isOpen(s)
      ? '<span class="live"><span class="live__dot"></span>' + esc(T.openNow) + ' · ' + esc(T.closesAt) + fmt(s.close_min) + '</span>'
      : '<span class="live live--shut"><span class="live__dot"></span>' + esc(T.shut) + ' · ' + esc(T.opensAt) + fmt(o) + '</span>';
    var ticks = '';
    for (var m = o; m <= c; m += 60) {
      var p = ((m - o) / span * 100).toFixed(3), maj = (m % 180 === 0) ? '1' : '0';
      ticks += '<span class="rail__tick" data-major="' + maj + '" style="inset-inline-start:' + p + '%"></span>';
      if (m % 180 === 0) ticks += '<span class="rail__lbl" style="inset-inline-start:' + p + '%">' + fmt(m) + '</span>';
    }
    var now = (ext >= o && ext <= c)
      ? '<span class="rail__now" id="railNow" style="inset-inline-start:' + ((ext - o) / span * 100).toFixed(3) + '%"></span>' : '';
    var stats = T.stats.map(function (x) {
      return '<div class="stat"><div class="stat__n" data-count="' + esc(x[0]) + '">' + esc(x[0]) +
             '</div><div class="stat__l">' + esc(x[1]) + '</div></div>';
    }).join('');
    return '<section class="hero" id="top"><canvas id="steam" aria-hidden="true"></canvas>' +
      '<span class="hero__glyph" id="glyph" aria-hidden="true">5</span>' +
      '<div class="wrap"><div class="hero__in">' + live +
      '<p class="eyebrow">' + esc(T.heroEyebrow) + '</p>' +
      '<h1 class="display"><span><em>' + esc(T.heroH1a) + '</em></span><span><em>' + esc(T.heroH1b) + '</em></span></h1>' +
      '<p>' + esc(T.heroP) + '</p>' +
      '<div class="hero__cta"><a class="btn btn--gold" href="#booking">' + esc(T.book) + '</a>' +
      '<a class="btn btn--wire" href="#menu">' + esc(T.menuBtn) + '</a></div></div>' +
      '<div class="rail"><div class="rail__cap"><span>' + esc(T.railStart) + '</span><span>' + esc(T.railEnd) + '</span></div>' +
      '<div class="rail__track">' + ticks + now + '</div><div class="rail__pad"></div></div>' +
      '<div class="stats">' + stats + '</div></div></section>';
  }

  /* =============================================================== ABOUT */
  function aboutHTML() {
    var T = t();
    var cells = T.cells.map(function (c, i) {
      return '<div class="cell rv rv-' + Math.min(i + 1, 4) + '"><div class="cell__k">' + esc(c[0]) + '</div>' +
             '<h3>' + esc(c[1]) + '</h3><p>' + esc(c[2]) + '</p></div>';
    }).join('');
    return '<section class="band band--cream" id="about"><div class="wrap">' +
      '<div class="sec-head rv"><p class="eyebrow">' + esc(T.aboutEy) + '</p>' +
      '<h2 class="h2 display">' + esc(T.aboutH) + '</h2><p class="lede">' + esc(T.aboutP) + '</p></div>' +
      '<div class="grid4">' + cells + '</div></div></section>';
  }

  /* ================================================================ MENU */
  function menuCats() {
    var seen = {}, out = ['all'];
    S.menu.forEach(function (m) { if (m.active && !seen[m.cat]) { seen[m.cat] = 1; out.push(m.cat); } });
    return out;
  }
  function menuHTML() {
    var T = t();
    var tabs = menuCats().map(function (c) {
      return '<button class="chip" data-act="cat" data-cat="' + esc(c) + '" aria-pressed="' +
             (V.menuCat === c ? 'true' : 'false') + '">' + esc(T.cats[c] || c) + '</button>';
    }).join('');
    return '<section class="band band--cream2" id="menu"><div class="wrap">' +
      '<div class="sec-head rv"><p class="eyebrow">' + esc(T.menuEy) + '</p>' +
      '<h2 class="h2 display">' + esc(T.menuH) + '</h2><p class="lede">' + esc(T.menuP) + '</p></div>' +
      '<div class="menu-bar rv"><div class="chips" id="menuTabs">' + tabs + '</div>' +
      '<div class="menu-search"><label class="sr" for="menuQ">' + esc(T.searchMenu) + '</label>' +
      '<input id="menuQ" type="search" placeholder="' + esc(T.searchMenu) + '" value="' + esc(V.menuQ) + '"></div></div>' +
      '<div class="menu" id="menuList"></div>' +
      '<p class="note rv"><span>&#9679;</span><span><b>' + esc(T.menuAvg) + '</b> — ' + esc(T.menuAvgSrc) + '</span></p>' +
      '</div></section>';
  }
  function renderMenu() {
    var box = $('#menuList'); if (!box) return;
    var T = t(), q = V.menuQ.trim().toLowerCase();
    var list = S.menu.filter(function (m) {
      if (!m.active) return false;
      if (V.menuCat !== 'all' && m.cat !== V.menuCat) return false;
      if (!q) return true;
      return (m.name_ar + ' ' + m.name_en + ' ' + m.desc_ar + ' ' + m.desc_en).toLowerCase().indexOf(q) >= 0;
    });
    if (!list.length) { box.innerHTML = '<p class="empty">' + esc(T.noMatch) + '</p>'; return; }
    box.innerHTML = list.map(function (m, i) {
      var price = (m.price === null || m.price === undefined || m.price === '')
        ? '' : '<span class="item__price">' + Number(m.price).toFixed(2) + '</span>';
      return '<article class="item" style="animation-delay:' + Math.min(i * 35, 320) + 'ms">' +
        '<div class="item__n">' + (i + 1 < 10 ? '0' : '') + (i + 1) + '</div>' +
        '<div class="item__b"><h3>' + esc(loc(m, 'name')) +
        (m.featured ? '<span class="tag-star">' + esc(T.featured) + '</span>' : '') + '</h3>' +
        '<p>' + esc(loc(m, 'desc')) + '</p></div>' +
        '<div class="item__t">' + esc(T.cats[m.cat] || m.cat) + '</div>' + price + '</article>';
    }).join('');
  }

  /* ========================================================= MOOD FINDER */
  function moodHTML() {
    var T = t();
    return '<section class="band band--dark" id="mood"><div class="wrap">' +
      '<div class="sec-head rv"><p class="eyebrow">' + esc(T.moodEy) + '</p>' +
      '<h2 class="h2 display">' + esc(T.moodH) + '</h2><p class="lede">' + esc(T.moodP) + '</p></div>' +
      '<div class="mood rv" id="moodBox"></div></div></section>';
  }
  function moodPick() {
    var picked = V.mood.answers;
    var best = null, bestScore = -1;
    S.menu.filter(function (m) { return m.active; }).forEach(function (m) {
      var moods = m.mood || [], score = 0;
      picked.forEach(function (a) { if (moods.indexOf(a) >= 0) score++; });
      score = score * 10 + (m.featured ? 1 : 0);
      if (score > bestScore) { bestScore = score; best = m; }
    });
    return best;
  }
  function renderMood() {
    var box = $('#moodBox'); if (!box) return;
    var T = t(), M = V.mood;
    if (!M.started) {
      box.innerHTML = '<div class="fade-swap"><div class="mood__step">' + esc(T.moodEy) + '</div>' +
        '<h3 class="mood__q display">' + esc(T.moodH) + '</h3>' +
        '<div class="mood__opts"><button class="btn btn--gold" data-act="moodStart">' + esc(T.moodStart) + '</button></div></div>';
      return;
    }
    if (M.result) {
      var m = M.result;
      var why = M.answers.map(function (a, i) {
        var q = T.moodQs[i]; if (!q) return a;
        for (var j = 0; j < q[1].length; j++) if (q[1][j][0] === a) return q[1][j][1];
        return a;
      }).join(' · ');
      box.innerHTML = '<div class="mood__res"><div class="mood__step">' + esc(T.moodResult) + '</div>' +
        '<h3 class="mood__name display">' + esc(loc(m, 'name')) + '</h3>' +
        '<p class="lede" style="margin-bottom:14px">' + esc(loc(m, 'desc')) + '</p>' +
        '<p class="mood__why">' + esc(T.moodBecause) + ': ' + esc(why) + '</p>' +
        '<div class="btn-row"><a class="btn btn--gold" href="#booking">' + esc(T.moodBook) + '</a>' +
        '<button class="btn btn--wire" data-act="moodReset">' + esc(T.moodAgain) + '</button></div></div>';
      return;
    }
    var q = T.moodQs[M.i];
    var opts = q[1].map(function (o) {
      return '<button class="mood__opt" data-act="moodAns" data-v="' + esc(o[0]) + '">' + esc(o[1]) + '</button>';
    }).join('');
    var bar = T.moodQs.map(function (_, i) { return '<i class="' + (i <= M.i ? 'on' : '') + '"></i>'; }).join('');
    box.innerHTML = '<div class="fade-swap"><div class="mood__step">' + esc(T.moodStep) + ' ' + (M.i + 1) + '/' + T.moodQs.length + '</div>' +
      '<h3 class="mood__q display">' + esc(q[0]) + '</h3>' +
      '<div class="mood__opts">' + opts + '</div><div class="mood__bar">' + bar + '</div></div>';
  }

  /* ============================================================= REVIEWS */
  function reviewsHTML() {
    var T = t();
    var tags = T.revTags.map(function (x) { return '<span class="chip">' + esc(x) + '</span>'; }).join('');
    var revs = T.revs.map(function (r, i) {
      return '<article class="rev rv rv-' + Math.min(i + 1, 4) + '"><q>' + esc(r[0]) + '</q>' +
             '<div class="rev__w"><b>' + esc(r[1]) + '</b><span>' + esc(r[2]) + '</span></div></article>';
    }).join('');
    return '<section class="band band--cream" id="reviews"><div class="wrap">' +
      '<div class="sec-head rv"><p class="eyebrow">' + esc(T.revEy) + '</p>' +
      '<h2 class="h2 display">' + esc(T.revH) + '</h2></div>' +
      '<div class="rev-top rv"><div><div class="score">4.4</div><div class="stars" aria-hidden="true">★★★★☆</div>' +
      '<span class="sr">4.4 ' + esc(T.revOf) + '</span></div><div class="chips">' + tags + '</div></div>' +
      '<div class="revs">' + revs + '</div></div></section>';
  }

  /* ============================================================= BOOKING */
  function bookingHTML() {
    var T = t();
    if (V.done) return doneHTML();
    var steps = [['1', T.s1], ['2', T.s2], ['3', T.s3]].map(function (s, i) {
      var n = i + 1;
      return '<button class="stp" data-act="step" data-n="' + n + '" aria-current="' + (V.step === n ? 'true' : 'false') + '"' +
             (stepReady(n) ? '' : ' disabled') + '><b>' + esc(T.step) + ' ' + s[0] + '</b><span>' + esc(s[1]) + '</span></button>';
    }).join('');
    var opts = '';
    for (var i = 1; i <= (S.settings.max_party || 12); i++)
      opts += '<option value="' + i + '"' + (i === V.party ? ' selected' : '') + '>' + i + '</option>';
    var aside = T.asideRows.map(function (r) { return '<dt>' + esc(r[0]) + '</dt><dd>' + esc(r[1]) + '</dd>'; }).join('');

    return '<section class="band band--dark" id="booking"><div class="wrap">' +
      '<div class="sec-head rv"><p class="eyebrow">' + esc(T.bkEy) + '</p>' +
      '<h2 class="h2 display">' + esc(T.bkH) + '</h2><p class="lede">' + esc(T.bkP) + '</p></div>' +
      '<div class="book"><div><div class="steps">' + steps + '</div>' +

      /* step 1 — when */
      '<div class="pane-step" data-step="1"><div class="form">' +
        '<div class="f"><label for="f-date">' + esc(T.fDate) + '</label>' +
        '<input id="f-date" type="date" min="' + U.today() + '" max="' + U.addDays(U.today(), 60) + '" value="' + esc(V.date) + '"></div>' +
        '<div class="f"><label for="f-party">' + esc(T.fParty) + '</label><select id="f-party">' + opts + '</select></div>' +
        '<div class="f f--full"><label>' + esc(T.fTime) + '</label><div id="slotGrid"></div></div>' +
      '</div></div>' +

      /* step 2 — where */
      '<div class="pane-step" data-step="2"><div id="floorBox"></div></div>' +

      /* step 3 — who */
      '<div class="pane-step" data-step="3"><div class="form">' +
        '<div class="f"><label for="f-name">' + esc(T.fName) + '</label><input id="f-name" type="text" autocomplete="name" value="' + esc(V.name) + '"></div>' +
        '<div class="f"><label for="f-phone">' + esc(T.fPhone) + '</label><input id="f-phone" type="tel" inputmode="numeric" placeholder="07 xxxx xxxx" autocomplete="tel" value="' + esc(V.phone) + '"></div>' +
        '<div class="f f--full"><label for="f-notes">' + esc(T.fNotes) + '</label>' +
        '<textarea id="f-notes" maxlength="300" placeholder="' + esc(T.fNotesPh) + '">' + esc(V.notes) + '</textarea></div>' +
        '<div class="f f--full"><p class="err" id="bk-err" role="alert"></p>' +
        '<button class="btn btn--gold" id="bkBtn" data-act="submit">' + esc(T.submit) + '</button></div>' +
      '</div></div>' +

      '</div>' +
      '<aside class="aside"><h3>' + esc(T.asideH) + '</h3><dl>' + aside + '</dl>' +
      '<div class="summary" id="summary"></div></aside>' +
      '</div></div></section>';
  }
  function stepReady(n) {
    if (n <= 1) return true;
    if (n === 2) return !!V.time;
    if (n === 3) return !!V.time && (V.anyTable || !!V.table);
    return false;
  }
  function renderStep() {
    $$('.pane-step').forEach(function (p) { p.hidden = (+p.getAttribute('data-step') !== V.step); });
    $$('.stp').forEach(function (b) {
      var n = +b.getAttribute('data-n');
      b.setAttribute('aria-current', V.step === n ? 'true' : 'false');
      b.disabled = !stepReady(n);
    });
    renderSummary();
  }
  function renderSummary() {
    var box = $('#summary'); if (!box) return;
    var T = t(), rows = [];
    rows.push([T.fDate, V.date]);
    if (V.time !== null) rows.push([T.fTime, fmt(V.time)]);
    rows.push([T.fParty, V.party + ' ' + T.person]);
    if (V.anyTable) rows.push([T.doneTable, T.anyTable]);
    else if (V.table) {
      var tb = tableById(V.table);
      if (tb) rows.push([T.doneTable, zoneName(tb.zone_id) + ' · ' + tb.label]);
    }
    box.innerHTML = rows.map(function (r) {
      return '<div><span>' + esc(r[0]) + '</span><b>' + esc(r[1]) + '</b></div>';
    }).join('');
  }

  /* ---- step 1: the time grid, with how many tables are free ---- */
  function renderSlots() {
    var box = $('#slotGrid'); if (!box) return;
    var T = t(), today = U.today(), n = U.nowMin();
    var free = {};
    (V.dayLoad || []).forEach(function (r) { free[r.time_min] = r.free_tables; });
    var out = '', shown = 0;
    U.slots(S.settings).forEach(function (m) {
      if (V.date === today && m < 1440 && m <= n + 30) return;   /* already gone tonight */
      shown++;
      var f = free[m];
      var dis = (f !== undefined && f <= 0);
      out += '<button type="button" class="slot" data-act="slot" data-m="' + m + '"' +
        (dis ? ' disabled' : '') + ' aria-pressed="' + (V.time === m ? 'true' : 'false') + '">' + fmt(m) +
        '<span class="slot__c">' + (f === undefined ? '·' : (f <= 0 ? esc(T.floorTaken) : f + ' ' + esc(T.seatsLeft))) +
        '</span></button>';
    });
    box.innerHTML = shown
      ? '<div class="slots">' + out + '</div>'
      : '<p class="lede" style="font-size:.9rem">' + esc(T.noSlots) + '</p>';
  }
  function loadDay() {
    V.dayLoad = null; renderSlots();
    return DB.dayLoad(V.date).then(function (r) { V.dayLoad = r; renderSlots(); })
      .catch(function () { V.dayLoad = []; renderSlots(); });
  }

  /* ---- step 2: the floor plan ---- */
  function renderFloor() {
    var box = $('#floorBox'); if (!box) return;
    var T = t();
    if (V.time === null) { box.innerHTML = '<p class="lede" style="font-size:.92rem">' + esc(T.pickTime) + '</p>'; return; }
    if (!V.zone) V.zone = (S.zones[0] || {}).id;

    var tabs = S.zones.map(function (z) {
      return '<button class="chip" data-act="zone" data-z="' + esc(z.id) + '" aria-pressed="' +
             (V.zone === z.id ? 'true' : 'false') + '">' + esc(loc(z, 'name')) + '</button>';
    }).join('');

    var takenMap = {};
    (V.avail || []).forEach(function (a) { takenMap[a.table_id] = a.taken; });

    var body;
    if (V.availBusy && !V.avail) {
      body = '<p class="floor-note">' + esc(T.loadingMap) + '</p>';
    } else {
      body = '<span class="floor-note">' + esc(zoneName(V.zone)) + '</span>' +
        S.tables.filter(function (tb) { return tb.active && tb.zone_id === V.zone; }).map(function (tb) {
          var taken = !!takenMap[tb.id], small = tb.seats < V.party;
          var cls = 'tb tb--' + tb.shape + (taken ? ' tb--taken' : (small ? ' tb--small' : ' tb--free')) +
                    (V.table === tb.id && !V.anyTable ? ' tb--picked' : '');
          var title = tb.label + ' · ' + tb.seats + ' ' + T.seatsN + ' · ' +
                      (taken ? T.floorTaken : (small ? T.floorSmall : T.floorFree));
          return '<button type="button" class="' + cls + '" data-act="table" data-id="' + esc(tb.id) + '"' +
                 (taken || small ? ' disabled' : '') + ' title="' + esc(title) + '" aria-label="' + esc(title) + '"' +
                 ' style="left:' + tb.x + '%;top:' + tb.y + '%">' + esc(tb.label) +
                 '<small>' + tb.seats + '</small></button>';
        }).join('');
    }

    box.innerHTML =
      '<div class="floor-tabs">' + tabs + '</div>' +
      '<button type="button" class="chip" data-act="any" aria-pressed="' + (V.anyTable ? 'true' : 'false') +
      '" style="margin-bottom:14px">' + esc(T.anyTable) + ' — ' + esc(T.anyTableSub) + '</button>' +
      '<div class="floor-wrap">' + body + '</div>' +
      '<div class="floor-key">' +
        '<span><i class="k-free"></i>' + esc(T.floorFree) + '</span>' +
        '<span><i class="k-taken"></i>' + esc(T.floorTaken) + '</span>' +
        '<span><i class="k-pick"></i>' + esc(T.floorPicked) + '</span>' +
      '</div>';
  }
  function loadAvail() {
    var key = V.date + '|' + V.time;
    if (V.time === null || V.availKey === key) { renderFloor(); return Promise.resolve(); }
    V.availBusy = true; V.avail = null; renderFloor();
    return DB.availability(V.date, V.time).then(function (r) {
      V.avail = r; V.availKey = key; V.availBusy = false; renderFloor();
    }).catch(function (e) {
      V.availBusy = false; V.avail = []; renderFloor(); toast(errText(e), true);
    });
  }

  /* ---- confirmation ---- */
  function doneHTML() {
    var T = t(), b = V.done;
    var msg = (L() === 'ar')
      ? 'حجز جديد (' + b.code + ')\nالاسم: ' + b.name + '\nالموبايل: ' + b.phone +
        '\nالتاريخ: ' + b.date + ' - ' + fmt(b.time) + '\nعدد الأشخاص: ' + b.party +
        '\nالطاولة: ' + b.table_label + ' (' + zoneName(b.zone_id) + ')' + (b.notes ? '\nملاحظات: ' + b.notes : '')
      : 'New reservation (' + b.code + ')\nName: ' + b.name + '\nMobile: ' + b.phone +
        '\nDate: ' + b.date + ' - ' + fmt(b.time) + '\nGuests: ' + b.party +
        '\nTable: ' + b.table_label + ' (' + zoneName(b.zone_id) + ')' + (b.notes ? '\nNotes: ' + b.notes : '');
    return '<section class="band band--dark" id="booking"><div class="wrap"><div class="done">' +
      '<p class="eyebrow" style="margin-bottom:4px">' + esc(T.doneH) + '</p>' +
      '<div class="done__code">' + esc(b.code) + '</div>' +
      '<div class="done__tbl">' + esc(T.doneTable) + ' ' + esc(b.table_label) + ' · ' + esc(zoneName(b.zone_id)) + '</div>' +
      '<p>' + esc(b.date) + ' · ' + fmt(b.time) + ' · ' + b.party + ' ' + esc(T.person) + '</p>' +
      '<p>' + esc(T.doneP) + '</p>' +
      '<div class="btn-row" style="justify-content:center">' +
      '<a class="btn btn--gold" href="' + esc(U.waLink(S.settings.whatsapp || CFG.WHATSAPP, msg)) + '" target="_blank" rel="noopener">' + esc(T.doneWA) + '</a>' +
      '<button class="btn btn--wire" data-act="newbk">' + esc(T.doneNew) + '</button>' +
      '</div></div></div></section>';
  }

  function submit() {
    var T = t();
    V.name = ($('#f-name') || {}).value || V.name;
    V.phone = ($('#f-phone') || {}).value || V.phone;
    V.notes = ($('#f-notes') || {}).value || V.notes;
    var err = $('#bk-err'), btn = $('#bkBtn');
    function fail(msg) { if (err) err.textContent = msg; }

    if (String(V.name).trim().length < 2) return fail(T.errors.INVALID_NAME);
    if (!U.validPhone(V.phone)) return fail(T.errors.INVALID_PHONE);
    if (V.time === null) return fail(T.errors.NO_TIME);
    if (!V.anyTable && !V.table) return fail(T.errors.NO_TABLE);
    fail(''); if (btn) { btn.disabled = true; btn.textContent = T.sending; }

    DB.book({
      name: V.name, phone: V.phone, date: V.date, time: V.time, party: V.party,
      zone: V.anyTable ? (V.zone || (S.zones[0] || {}).id) : (tableById(V.table) || {}).zone_id,
      table: V.anyTable ? null : V.table, notes: V.notes
    }).then(function (r) {
      V.done = {
        code: r.code, table_label: r.table_label, zone_id: r.zone_id,
        name: V.name, phone: String(V.phone).replace(/\D/g, ''), date: V.date,
        time: V.time, party: V.party, notes: V.notes
      };
      V.availKey = '';
      render();
      var el = $('#booking'); if (el) el.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' });
    }).catch(function (e) {
      if (btn) { btn.disabled = false; btn.textContent = T.submit; }
      fail(errText(e));
      if ((e && e.message) === 'TABLE_TAKEN') { V.availKey = ''; V.table = null; V.step = 2; renderStep(); loadAvail(); }
    });
  }

  /* ============================================================== VISIT */
  function visitHTML() {
    var T = t(), s = S.settings;
    var vals = { address: loc(s, 'address'), plus: s.plus_code, phone: s.phone, hours: T.hoursVal };
    var cards = T.locRows.map(function (r) {
      var v = esc(vals[r[1]] || '');
      if (r[1] === 'phone') v = '<a href="tel:+' + esc(s.whatsapp || CFG.WHATSAPP) + '">' + v + '</a>';
      return '<div class="loc__c rv"><dt>' + esc(r[0]) + '</dt><dd>' + v + '</dd></div>';
    }).join('');
    var ask = L() === 'ar' ? 'مرحبا، بدي أستفسر عن الحجز' : 'Hi, I would like to ask about a table';
    return '<section class="band band--cream" id="visit"><div class="wrap">' +
      '<div class="sec-head rv"><p class="eyebrow">' + esc(T.visitEy) + '</p>' +
      '<h2 class="h2 display">' + esc(T.visitH) + '</h2></div>' +
      '<div class="loc">' + cards + '</div>' +
      '<div class="btn-row rv">' +
      '<a class="btn btn--ink" href="' + esc(CFG.MAPS) + '" target="_blank" rel="noopener">' + esc(T.openMaps) + '</a>' +
      '<a class="btn btn--wire" href="tel:+' + esc(s.whatsapp || CFG.WHATSAPP) + '">' + esc(T.callUs) + '</a>' +
      '<a class="btn btn--wire" href="' + esc(U.waLink(s.whatsapp || CFG.WHATSAPP, ask)) + '" target="_blank" rel="noopener">' + esc(T.waUs) + '</a>' +
      '</div></div></section>';
  }

  /* ============================================================== SHELL */
  function shellHTML() {
    var T = t();
    var nav = T.nav.map(function (n) { return '<a href="#' + n[0] + '">' + esc(n[1]) + '</a>'; }).join('');
    var head = '<header class="hdr"><div class="wrap hdr__in">' +
      '<a class="mark" href="#top"><b>FIVE</b><i>₅</i></a>' +
      '<nav class="nav">' + nav + '</nav>' +
      '<div class="hdr__act"><button class="lang" data-act="lang">' + esc(T.other) + '</button>' +
      '<a class="btn btn--gold btn--sm" href="#booking">' + esc(T.book) + '</a></div></div></header>';
    var foot = '<footer class="ftr"><div class="wrap">' +
      '<div class="ftr__in"><a class="mark" href="#top"><b>FIVE</b><i>₅</i></a>' +
      '<span>' + esc(T.ftrTag) + '</span>' +
      '<a href="https://instagram.com/' + esc(S.settings.instagram || CFG.INSTAGRAM) + '" target="_blank" rel="noopener">@' +
      esc(S.settings.instagram || CFG.INSTAGRAM) + '</a></div>' +
      '<div class="ftr__b"><span>&copy; ' + U.today().slice(0, 4) + ' Five₅ Coffee — ' + esc(T.rights) + '</span>' +
      '<a href="admin.html">' + esc(T.ftrAdmin) + '</a></div></div></footer>';
    return head + heroHTML() + aboutHTML() + menuHTML() + moodHTML() + reviewsHTML() +
           bookingHTML() + visitHTML() + foot +
           (DB.mode === 'demo' ? '<span class="demo-badge">' + esc(T.demoBadge) + '</span>' : '');
  }

  function render() {
    d.documentElement.lang = FV.lang;
    d.documentElement.dir = t().dir;
    $('#app').innerHTML = shellHTML();
    renderMenu(); renderMood();
    if (!V.done) { renderSlots(); renderFloor(); renderStep(); }
    initSteam(); initReveal(); initCounters();
  }

  /* ========================================================== MOTION */
  var steamRAF = null, steamBound = false;
  function initSteam() {
    var c = $('#steam'); if (!c || reduce) return;
    var ctx = c.getContext('2d'); if (!ctx) return;
    function size() { c.width = Math.max(1, Math.round(c.clientWidth / 3)); c.height = Math.max(1, Math.round(c.clientHeight / 3)); }
    size();
    var puffs = [];
    for (var i = 0; i < 7; i++)
      puffs.push({ x: Math.random(), y: Math.random(), r: .18 + Math.random() * .22, s: .00012 + Math.random() * .00022, p: Math.random() * 6.28 });
    var last = 0;
    function frame(ts) {
      if (ts - last > 40) {
        last = ts; var W = c.width, H = c.height;
        ctx.clearRect(0, 0, W, H);
        puffs.forEach(function (p) {
          p.y -= p.s * 40; if (p.y < -.3) { p.y = 1.3; p.x = Math.random(); }
          var x = (p.x + Math.sin(ts * .00018 + p.p) * .05) * W, y = p.y * H, rad = p.r * W;
          var g = ctx.createRadialGradient(x, y, 0, x, y, rad);
          g.addColorStop(0, 'rgba(217,180,95,.16)');
          g.addColorStop(.6, 'rgba(176,138,62,.06)');
          g.addColorStop(1, 'rgba(20,17,14,0)');
          ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, rad, 0, 6.2832); ctx.fill();
        });
      }
      steamRAF = requestAnimationFrame(frame);
    }
    if (steamRAF) cancelAnimationFrame(steamRAF);
    steamRAF = requestAnimationFrame(frame);
    if (!steamBound) { steamBound = true; w.addEventListener('resize', function () { var cv = $('#steam'); if (cv) { c = cv; size(); } }, { passive: true }); }
  }

  var io = null;
  function initReveal() {
    if (reduce || !w.IntersectionObserver) { $$('.rv').forEach(function (e) { e.classList.add('in'); }); return; }
    if (io) io.disconnect();
    io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) { if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); } });
    }, { rootMargin: '0px 0px -8% 0px', threshold: .12 });
    $$('.rv').forEach(function (e) { io.observe(e); });
  }

  function initCounters() {
    if (reduce) return;
    $$('.stat__n').forEach(function (el) {
      var raw = el.getAttribute('data-count') || '';
      var num = parseFloat(raw);
      if (isNaN(num) || /[–-]/.test(raw)) return;          /* skip ranges like 5–10 */
      var dec = (raw.split('.')[1] || '').length, t0 = null;
      function step(ts) {
        if (!t0) t0 = ts;
        var k = Math.min(1, (ts - t0) / 1100), e = 1 - Math.pow(1 - k, 3);
        el.textContent = (num * e).toFixed(dec);
        if (k < 1) requestAnimationFrame(step);
      }
      el.textContent = (0).toFixed(dec);
      requestAnimationFrame(step);
    });
  }

  /* hero glyph parallax + magnetic gold buttons */
  function initPointerMotion() {
    if (reduce) return;
    w.addEventListener('scroll', function () {
      var g = $('#glyph'); if (!g) return;
      g.style.transform = 'translateY(' + (w.scrollY * .12) + 'px)';
    }, { passive: true });
    d.addEventListener('mousemove', function (ev) {
      var b = ev.target.closest && ev.target.closest('.btn--gold');
      $$('.btn--gold').forEach(function (el) { if (el !== b) el.style.transform = ''; });
      if (!b) return;
      var r = b.getBoundingClientRect();
      b.style.transform = 'translate(' + ((ev.clientX - r.left - r.width / 2) * .12) + 'px,' +
                                        ((ev.clientY - r.top - r.height / 2) * .18) + 'px)';
    });
    d.addEventListener('mouseleave', function () { $$('.btn--gold').forEach(function (el) { el.style.transform = ''; }); });
  }

  /* nav highlight */
  function initNavSpy() {
    if (!w.IntersectionObserver) return;
    var spy = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        $$('.nav a').forEach(function (a) {
          a.setAttribute('aria-current', a.getAttribute('href') === '#' + en.target.id ? 'true' : 'false');
        });
      });
    }, { rootMargin: '-45% 0px -50% 0px' });
    ['about', 'menu', 'mood', 'reviews', 'visit'].forEach(function (id) {
      var el = d.getElementById(id); if (el) spy.observe(el);
    });
  }

  /* the live "now" marker on the hero rail */
  setInterval(function () {
    var el = $('#railNow'); if (!el) return;
    var s = S.settings, o = s.open_min, c = s.close_min <= o ? s.close_min + 1440 : s.close_min;
    var n = U.nowMin(), ext = n < o ? n + 1440 : n;
    if (ext >= o && ext <= c) el.style.insetInlineStart = ((ext - o) / (c - o) * 100).toFixed(3) + '%';
  }, 60000);

  /* ============================================================ EVENTS */
  d.addEventListener('click', function (ev) {
    var el = ev.target.closest && ev.target.closest('[data-act]');
    if (!el) return;
    var a = el.getAttribute('data-act');

    if (a === 'lang') {
      FV.setLang(FV.lang === 'ar' ? 'en' : 'ar');
      render(); loadDay(); return;
    }
    if (a === 'cat') { V.menuCat = el.getAttribute('data-cat');
      $$('#menuTabs .chip').forEach(function (b) { b.setAttribute('aria-pressed', b === el ? 'true' : 'false'); });
      renderMenu(); return; }
    if (a === 'moodStart') { V.mood = { i: 0, answers: [], result: null, started: true }; renderMood(); return; }
    if (a === 'moodAns') {
      V.mood.answers.push(el.getAttribute('data-v'));
      if (V.mood.i + 1 >= t().moodQs.length) V.mood.result = moodPick(); else V.mood.i++;
      renderMood(); return;
    }
    if (a === 'moodReset') { V.mood = { i: 0, answers: [], result: null, started: true }; renderMood(); return; }

    if (a === 'step') { var n = +el.getAttribute('data-n'); if (stepReady(n)) { V.step = n; renderStep(); if (n === 2) loadAvail(); } return; }
    if (a === 'slot') {
      V.time = +el.getAttribute('data-m'); V.table = null; V.anyTable = false;
      $$('.slot').forEach(function (b) { b.setAttribute('aria-pressed', b === el ? 'true' : 'false'); });
      V.step = 2; renderStep(); loadAvail();
      var fb = $('#floorBox'); if (fb) fb.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'nearest' });
      return;
    }
    if (a === 'zone') { V.zone = el.getAttribute('data-z'); renderFloor(); return; }
    if (a === 'any')  { V.anyTable = !V.anyTable; if (V.anyTable) V.table = null; renderFloor(); renderStep();
                        if (V.anyTable) { V.step = 3; renderStep(); } return; }
    if (a === 'table') {
      V.table = el.getAttribute('data-id'); V.anyTable = false;
      var tb = tableById(V.table); if (tb) V.zone = tb.zone_id;
      renderFloor(); V.step = 3; renderStep();
      var nb = $('#f-name'); if (nb) nb.focus();
      return;
    }
    if (a === 'submit') { ev.preventDefault(); submit(); return; }
    if (a === 'newbk') {
      V.done = null; V.step = 1; V.time = null; V.table = null; V.anyTable = false;
      V.name = ''; V.phone = ''; V.notes = ''; V.availKey = '';
      render(); loadDay();
      var b2 = $('#booking'); if (b2) b2.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth' });
      return;
    }
  });

  var qT;
  d.addEventListener('input', function (ev) {
    var id = ev.target.id;
    if (id === 'menuQ') { var v = ev.target.value; clearTimeout(qT); qT = setTimeout(function () { V.menuQ = v; renderMenu(); }, 180); return; }
    if (id === 'f-name') V.name = ev.target.value;
    if (id === 'f-phone') V.phone = ev.target.value;
    if (id === 'f-notes') V.notes = ev.target.value;
  });
  d.addEventListener('change', function (ev) {
    var id = ev.target.id;
    if (id === 'f-date') {
      V.date = ev.target.value || U.today();
      V.time = null; V.table = null; V.anyTable = false; V.availKey = '';
      V.step = 1; renderStep(); loadDay();
    }
    if (id === 'f-party') {
      V.party = +ev.target.value || 1;
      if (V.table) { var tb = tableById(V.table); if (tb && tb.seats < V.party) V.table = null; }
      renderFloor(); renderSummary();
    }
  });

  /* ============================================================== BOOT */
  render();
  initPointerMotion();

  Promise.all([
    DB.getZones().catch(function () { return []; }),
    DB.getTables().catch(function () { return []; }),
    DB.getMenu().catch(function () { return []; }),
    DB.getSettings().catch(function () { return null; })
  ]).then(function (r) {
    if (r[0].length) S.zones = r[0].slice().sort(function (a, b) { return (a.sort || 0) - (b.sort || 0); });
    if (r[1].length) S.tables = r[1].map(function (x) { return { id: x.id, zone_id: x.zone_id, label: x.label, seats: +x.seats, x: +x.x, y: +x.y, shape: x.shape, active: x.active !== false, sort: +x.sort || 0 }; });
    if (r[2].length) S.menu = r[2].slice().sort(function (a, b) { return (a.sort || 0) - (b.sort || 0); });
    if (r[3]) S.settings = r[3];
    S.loaded = true;
    if (!V.zone) V.zone = (S.zones[0] || {}).id;
    render();
    initNavSpy();
    return loadDay();
  }).catch(function (e) { toast(errText(e), true); });

})(window, document);
