/* =====================================================================
   FIVE₅ COFFEE — staff dashboard
   Separate page, separate login. Reads the same data layer as the site.
   ===================================================================== */
(function (w, d) {
  'use strict';

  var FV = w.FV, DB = FV.db, U = FV.util, CFG = FV.cfg;
  var reduce = w.matchMedia && w.matchMedia('(prefers-reduced-motion: reduce)').matches;
  function t() { return FV.t(); }
  function A() { return FV.t().a; }
  function L() { return FV.lang; }

  var S = { user: null, zones: [], tables: [], menu: [], settings: null, bookings: [], loaded: false };
  var V = { tab: 'live', q: '', fStatus: 'all', fDate: '', zone: null, live: true,
            modal: null, seen: {}, fresh: {}, editItem: null, editTable: null, err: '', email: '' };
  var timer = null;

  /* ------------------------------------------------------------ utils */
  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  function $(s, r) { return (r || d).querySelector(s); }
  function $$(s, r) { return Array.prototype.slice.call((r || d).querySelectorAll(s)); }
  function loc(row, key) { return row[key + '_' + L()] || row[key + '_ar'] || ''; }
  function fmt(m) { return U.fmtTime(m, L()); }
  function zoneName(id) {
    for (var i = 0; i < S.zones.length; i++) if (S.zones[i].id === id) return loc(S.zones[i], 'name');
    return id || '—';
  }
  function tableLabel(id) {
    for (var i = 0; i < S.tables.length; i++) if (S.tables[i].id === id) return S.tables[i].label;
    return '—';
  }
  function zoneCap(id) {
    return S.tables.reduce(function (n, x) { return n + ((x.active !== false && x.zone_id === id) ? +x.seats : 0); }, 0);
  }
  function totalCap() { return S.tables.reduce(function (n, x) { return n + (x.active !== false ? +x.seats : 0); }, 0); }
  function dayShort(iso) {
    var ar = ['أحد', 'إثنين', 'ثلاثاء', 'أربعاء', 'خميس', 'جمعة', 'سبت'];
    var en = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    return (L() === 'ar' ? ar : en)[U.dow(iso)];
  }
  function seatsOn(date, zone) {
    return S.bookings.reduce(function (n, b) {
      return n + ((b.book_date === date && b.status !== 'cancelled' && b.status !== 'no_show' &&
                   (!zone || b.zone_id === zone)) ? (+b.party || 0) : 0);
    }, 0);
  }
  var toastT;
  function toast(msg, bad) {
    var old = $('.toast'); if (old) old.remove();
    var el = d.createElement('div');
    el.className = 'toast' + (bad ? ' toast--bad' : '');
    el.setAttribute('role', 'status'); el.textContent = msg;
    d.body.appendChild(el);
    clearTimeout(toastT); toastT = setTimeout(function () { el.remove(); }, 4200);
  }
  function fail(e) {
    var m = (e && e.message) || '';
    if (/Failed to fetch|NetworkError|Load failed/i.test(m)) return t().errors.NETWORK;
    return t().errors[m] || m || t().errors.DEFAULT;
  }

  /* ============================================================== SHELL */
  function barHTML() {
    var a = A();
    return '<div class="adm__bar"><div class="wrap hdr__in">' +
      '<a class="mark" href="index.html"><b>FIVE</b><i>₅</i></a>' +
      '<span class="adm__t">' + esc(a.title) + '</span>' +
      '<div class="hdr__act">' +
      '<button class="lang" data-act="lang">' + esc(t().other) + '</button>' +
      '<a class="lang" href="index.html">' + esc(a.backSite) + '</a>' +
      (S.user ? '<button class="lang" data-act="out">' + esc(a.out) + '</button>' : '') +
      '</div></div>' +
      (S.user ? '<div class="adm__tabs wrap">' + a.tabs.map(function (x) {
        return '<button data-act="tab" data-t="' + x[0] + '" aria-current="' + (V.tab === x[0] ? 'true' : 'false') + '">' + esc(x[1]) + '</button>';
      }).join('') + '</div>' : '') +
      '</div>';
  }

  function gateHTML() {
    var a = A();
    return barHTML() + '<form class="gate" id="loginForm"><h1 class="display">' + esc(a.loginH) + '</h1>' +
      '<p>' + esc(a.loginP) + '</p>' +
      '<div class="form" style="grid-template-columns:1fr">' +
      '<div class="f"><label for="em">' + esc(a.email) + '</label><input id="em" type="email" autocomplete="username" value="' + esc(V.email) + '" required></div>' +
      '<div class="f"><label for="pw">' + esc(a.pass) + '</label><input id="pw" type="password" autocomplete="current-password" required></div>' +
      '</div><p class="err" id="loginErr">' + esc(V.err) + '</p>' +
      '<button class="btn btn--ink" type="submit" style="width:100%;margin-top:14px">' + esc(a.enter) + '</button>' +
      (DB.mode === 'demo' ? '<p class="pane__s" style="margin-top:18px">' + esc(a.loginDemo) + '</p>' : '') +
      '</form>';
  }

  /* =============================================================== LIVE */
  function liveHTML() {
    var a = A(), today = U.today();
    var todays = S.bookings.filter(function (b) { return b.book_date === today && b.status !== 'cancelled' && b.status !== 'no_show'; });
    var guests = todays.reduce(function (n, b) { return n + (+b.party || 0); }, 0);
    var pending = S.bookings.filter(function (b) { return b.status === 'pending'; }).length;
    var cap = totalCap(), occ = cap ? Math.round(guests / cap * 100) : 0;
    var vals = [todays.length, guests, pending, occ + '%'];
    var tiles = a.tiles.map(function (x, i) {
      return '<div class="tile"><div class="tile__l">' + esc(x[0]) + '</div>' +
             '<div class="tile__n">' + esc(String(vals[i])) + '</div><div class="tile__s">' + esc(x[1]) + '</div></div>';
    }).join('');

    var days = [], max = 1;
    for (var i = 0; i < 7; i++) { var iso = U.addDays(today, i), g = seatsOn(iso); days.push([iso, g]); if (g > max) max = g; }
    var bars = days.map(function (x) {
      var h = x[1] === 0 ? 2 : Math.round(10 + x[1] / max * 100);
      return '<div class="bar" tabindex="0"><span class="bar__tip">' + esc(dayShort(x[0])) + ' ' + x[0].slice(5) + ' — ' + x[1] + '</span>' +
             '<span class="bar__v">' + x[1] + '</span><span class="bar__r" style="height:' + h + 'px"></span>' +
             '<span class="bar__x">' + esc(dayShort(x[0])) + '</span></div>';
    }).join('');

    var meters = S.zones.map(function (z) {
      var used = seatsOn(today, z.id), c = zoneCap(z.id), pct = c ? Math.min(100, Math.round(used / c * 100)) : 0;
      return '<div class="meter"><div class="meter__h"><b>' + esc(loc(z, 'name')) + '</b>' +
             '<span class="meter__v">' + used + ' / ' + c + ' · ' + pct + '%</span></div>' +
             '<div class="meter__t"><div class="meter__f" style="width:' + pct + '%"></div></div></div>';
    }).join('');

    var now = U.nowMin();
    var next = S.bookings.filter(function (b) {
      return b.book_date === today && b.status !== 'cancelled' && b.status !== 'no_show' && b.time_min >= now - 30;
    }).sort(function (x, y) { return x.time_min - y.time_min; }).slice(0, 6);
    var nextList = next.length ? next.map(function (b) {
      return '<div class="list-item"><span class="mono">' + fmt(b.time_min) + '</span>' +
        '<div class="grow"><b>' + esc(b.name) + '</b><small>' + b.party + ' · ' + esc(zoneName(b.zone_id)) +
        ' · ' + esc(tableLabel(b.table_id)) + '</small></div>' + pill(b.status) + '</div>';
    }).join('') : '<p class="empty">' + esc(a.nextEmpty) + '</p>';

    return '<div class="tiles">' + tiles + '</div>' +
      '<div class="tools" style="margin-bottom:22px">' +
      '<button class="ico" data-act="live" aria-pressed="' + (V.live ? 'true' : 'false') + '">' +
      esc(V.live ? a.liveOn : a.liveOff) + '</button>' +
      '<button class="ico" data-act="refresh">' + esc(a.refresh) + '</button></div>' +
      '<div class="panes">' +
      '<section class="pane"><h3>' + esc(a.weekH) + '</h3><p class="pane__s">' + esc(a.weekS) + '</p><div class="bars">' + bars + '</div></section>' +
      '<section class="pane"><h3>' + esc(a.zoneH) + '</h3><p class="pane__s">' + esc(a.zoneS) + '</p>' + meters + '</section>' +
      '</div>' +
      '<section class="pane"><h3>' + esc(a.nextH) + '</h3><p class="pane__s">' + esc(a.nextS) + '</p>' + nextList + '</section>';
  }
  function pill(st) {
    var a = A();
    return '<span class="pill pill--' + esc(st) + '">' + esc(a.st[st] || st) + '</span>';
  }

  /* =========================================================== BOOKINGS */
  function filtered() {
    var q = V.q.trim().toLowerCase(), today = U.today();
    return S.bookings.filter(function (b) {
      if (V.fStatus !== 'all' && b.status !== V.fStatus) return false;
      if (V.fDate && b.book_date !== V.fDate) return false;
      if (q && (b.code + ' ' + b.name + ' ' + b.phone).toLowerCase().indexOf(q) < 0) return false;
      return true;
    }).sort(function (x, y) {
      var fx = x.book_date >= today ? 0 : 1, fy = y.book_date >= today ? 0 : 1;
      if (fx !== fy) return fx - fy;
      if (x.book_date !== y.book_date) return fx === 0 ? x.book_date.localeCompare(y.book_date) : y.book_date.localeCompare(x.book_date);
      return x.time_min - y.time_min;
    });
  }
  function bookingsHTML() {
    var a = A(), list = filtered();
    var rows = list.map(function (b) {
      var msg = L() === 'ar'
        ? 'مرحبا ' + b.name + '، حجزك بـ Five5 Coffee (' + b.code + ') يوم ' + b.book_date + ' الساعة ' +
          fmt(b.time_min) + ' لـ ' + b.party + ' أشخاص على طاولة ' + tableLabel(b.table_id) + ' — مؤكّد. بنستناك!'
        : 'Hi ' + b.name + ', your table at Five5 Coffee (' + b.code + ') on ' + b.book_date + ' at ' +
          fmt(b.time_min) + ' for ' + b.party + ' (table ' + tableLabel(b.table_id) + ') is confirmed. See you!';
      var wa = 'https://wa.me/962' + String(b.phone).replace(/^0/, '').replace(/\D/g, '') + '?text=' + encodeURIComponent(msg);
      return '<tr' + (V.fresh[b.id] ? ' class="is-new"' : '') + '>' +
        '<td class="mono">' + esc(b.code) + '</td><td>' + esc(b.name) + '</td>' +
        '<td class="mono">' + esc(b.phone) + '</td><td class="mono">' + esc(b.book_date) + '</td>' +
        '<td class="mono">' + fmt(b.time_min) + '</td><td class="mono">' + esc(String(b.party)) + '</td>' +
        '<td>' + esc(zoneName(b.zone_id)) + '</td><td class="mono">' + esc(tableLabel(b.table_id)) + '</td>' +
        '<td>' + pill(b.status) + '</td><td><div class="rowact">' +
        (b.status !== 'confirmed' ? '<button class="ico" data-act="set" data-id="' + esc(b.id) + '" data-s="confirmed">' + esc(a.confirm) + '</button>' : '') +
        (b.status !== 'seated' ? '<button class="ico" data-act="set" data-id="' + esc(b.id) + '" data-s="seated">' + esc(a.seat) + '</button>' : '') +
        (b.status !== 'cancelled' ? '<button class="ico" data-act="set" data-id="' + esc(b.id) + '" data-s="cancelled">' + esc(a.cancel) + '</button>' : '') +
        '<a class="ico" href="' + esc(wa) + '" target="_blank" rel="noopener">' + esc(a.wa) + '</a>' +
        '<button class="ico ico--danger" data-act="del" data-id="' + esc(b.id) + '">' + esc(a.del) + '</button>' +
        '</div></td></tr>';
    }).join('');

    var sts = ['pending', 'confirmed', 'seated', 'cancelled', 'no_show'];
    return '<section class="pane"><h3>' + esc(a.tabs[1][1]) + '</h3>' +
      '<p class="pane__s">' + list.length + ' / ' + S.bookings.length + '</p>' +
      '<div class="tools">' +
      '<input class="grow" type="search" id="q" placeholder="' + esc(a.search) + '" value="' + esc(V.q) + '">' +
      '<select id="fStatus"><option value="all">' + esc(a.allStatus) + '</option>' +
      sts.map(function (s) { return '<option value="' + s + '"' + (V.fStatus === s ? ' selected' : '') + '>' + esc(a.st[s]) + '</option>'; }).join('') +
      '</select>' +
      '<input type="date" id="fDate" value="' + esc(V.fDate) + '">' +
      '<button class="ico" data-act="csv">' + esc(a.exportCsv) + '</button>' +
      (DB.mode === 'demo' ? '<button class="ico" data-act="seed">' + esc(a.seedBtn) + '</button>' +
                            '<button class="ico ico--danger" data-act="wipe">' + esc(a.clearBtn) + '</button>' : '') +
      '</div>' +
      (list.length
        ? '<div class="tbl-w"><table><thead><tr>' + a.cols.map(function (c) { return '<th>' + esc(c) + '</th>'; }).join('') +
          '</tr></thead><tbody>' + rows + '</tbody></table></div>'
        : '<div class="tbl-w"><p class="empty">' + esc(a.empty) + '</p></div>') +
      '</section>';
  }

  /* ============================================================== FLOOR */
  function floorHTML() {
    var a = A();
    if (!V.zone) V.zone = (S.zones[0] || {}).id;
    var tabs = S.zones.map(function (z) {
      return '<button class="chip" data-act="fzone" data-z="' + esc(z.id) + '" aria-pressed="' +
             (V.zone === z.id ? 'true' : 'false') + '">' + esc(loc(z, 'name')) + ' · ' + zoneCap(z.id) + '</button>';
    }).join('');
    var tbs = S.tables.filter(function (x) { return x.zone_id === V.zone; }).map(function (x) {
      return '<button type="button" class="tb tb--' + esc(x.shape) + ' tb--drag' +
        (V.editTable === x.id ? ' tb--sel' : '') + (x.active === false ? ' dim' : '') +
        '" data-act="pick" data-id="' + esc(x.id) + '" style="left:' + x.x + '%;top:' + x.y + '%">' +
        esc(x.label) + '<small>' + x.seats + '</small></button>';
    }).join('');

    var e = V.editTable ? S.tables.filter(function (x) { return x.id === V.editTable; })[0] : null;
    var editor = e ? '<div class="editrow">' +
      '<div class="f"><label for="e-lbl">' + esc(a.tableLabel) + '</label><input id="e-lbl" value="' + esc(e.label) + '"></div>' +
      '<div class="f"><label for="e-seat">' + esc(a.tableSeats) + '</label><input id="e-seat" type="number" min="1" max="20" value="' + e.seats + '"></div>' +
      '<div class="f"><label for="e-shape">' + esc(a.tableShape) + '</label><select id="e-shape">' +
        ['round', 'square', 'booth'].map(function (sh) { return '<option value="' + sh + '"' + (e.shape === sh ? ' selected' : '') + '>' + esc(a.shapes[sh]) + '</option>'; }).join('') +
      '</select></div>' +
      '<div class="f f--check"><input id="e-act" type="checkbox"' + (e.active !== false ? ' checked' : '') + '><label for="e-act">' + esc(a.itemActive) + '</label></div>' +
      '<div class="btn-row"><button class="btn btn--ink btn--sm" data-act="saveTable">' + esc(a.saveTable) + '</button>' +
      '<button class="btn btn--wire btn--sm" data-act="delTable">' + esc(a.delTable) + '</button></div>' +
      '</div>' : '';

    return '<section class="pane"><h3>' + esc(a.floorH) + '</h3><p class="pane__s">' + esc(a.floorS) + '</p>' +
      '<div class="floor-tabs">' + tabs + '<button class="chip" data-act="addTable">+ ' + esc(a.addTable) + '</button></div>' +
      '<div class="floor-wrap" id="floorEdit"><span class="floor-note">' + esc(a.dragHint) + '</span>' + tbs + '</div>' +
      editor + '</section>';
  }

  /* =============================================================== MENU */
  function menuHTML() {
    var a = A();
    var rows = S.menu.map(function (m) {
      var open = V.editItem === m.id;
      var head = '<div class="list-item' + (m.active === false ? ' dim' : '') + '">' +
        '<div class="grow"><b>' + esc(loc(m, 'name')) + '</b><small>' + esc(t().cats[m.cat] || m.cat) +
        (m.price != null && m.price !== '' ? ' · ' + Number(m.price).toFixed(2) + ' JD' : '') +
        (m.featured ? ' · ★' : '') + '</small></div>' +
        '<button class="ico" data-act="editItem" data-id="' + esc(m.id) + '" aria-pressed="' + (open ? 'true' : 'false') + '">' + esc(a.save === 'حفظ' ? 'تعديل' : 'Edit') + '</button>' +
        '<button class="ico ico--danger" data-act="delItem" data-id="' + esc(m.id) + '">' + esc(a.del) + '</button></div>';
      if (!open) return head;
      return head + '<div class="editrow">' +
        '<div class="f"><label>' + esc(a.itemName) + ' (AR)</label><input id="i-nar" value="' + esc(m.name_ar) + '"></div>' +
        '<div class="f"><label>' + esc(a.itemName) + ' (EN)</label><input id="i-nen" value="' + esc(m.name_en) + '"></div>' +
        '<div class="f"><label>' + esc(a.itemCat) + '</label><input id="i-cat" value="' + esc(m.cat) + '"></div>' +
        '<div class="f"><label>' + esc(a.itemPrice) + '</label><input id="i-price" type="number" step="0.25" min="0" value="' + (m.price == null ? '' : m.price) + '"></div>' +
        '<div class="f f--full"><label>' + esc(a.itemDesc) + ' (AR)</label><input id="i-dar" value="' + esc(m.desc_ar) + '"></div>' +
        '<div class="f f--full"><label>' + esc(a.itemDesc) + ' (EN)</label><input id="i-den" value="' + esc(m.desc_en) + '"></div>' +
        '<div class="f"><label>' + esc(a.itemMood) + '</label><input id="i-mood" value="' + esc((m.mood || []).join(',')) + '" placeholder="calm,sweet,hot"></div>' +
        '<div class="f f--check"><input id="i-act" type="checkbox"' + (m.active !== false ? ' checked' : '') + '><label for="i-act">' + esc(a.itemActive) + '</label></div>' +
        '<div class="f f--check"><input id="i-feat" type="checkbox"' + (m.featured ? ' checked' : '') + '><label for="i-feat">' + esc(a.itemFeat) + '</label></div>' +
        '<div class="btn-row"><button class="btn btn--ink btn--sm" data-act="saveItem" data-id="' + esc(m.id) + '">' + esc(a.save) + '</button></div>' +
        '</div>';
    }).join('');
    return '<section class="pane"><h3>' + esc(a.menuH) + '</h3><p class="pane__s">' + esc(a.menuS) + '</p>' +
      '<div class="tools"><button class="ico" data-act="addItem">+ ' + esc(a.addItem) + '</button></div>' +
      rows + '</section>';
  }

  /* =========================================================== SETTINGS */
  function settingsHTML() {
    var a = A(), s = S.settings || {};
    function hm(min) { min = ((min % 1440) + 1440) % 1440; return U.pad(Math.floor(min / 60)) + ':' + U.pad(min % 60); }
    return '<section class="pane"><h3>' + esc(a.setH) + '</h3><p class="pane__s">' + esc(a.setS) + '</p>' +
      '<form class="form" id="setForm">' +
      '<div class="f"><label for="s-open">' + esc(a.openT) + '</label><input id="s-open" type="time" value="' + hm(s.open_min) + '"></div>' +
      '<div class="f"><label for="s-close">' + esc(a.closeT) + '</label><input id="s-close" type="time" value="' + hm(s.close_min) + '"></div>' +
      '<div class="f"><label for="s-slot">' + esc(a.slotT) + '</label><input id="s-slot" type="number" min="15" max="120" step="5" value="' + (s.slot_min || 30) + '"></div>' +
      '<div class="f"><label for="s-hold">' + esc(a.holdT) + '</label><input id="s-hold" type="number" min="30" max="240" step="15" value="' + (s.hold_min || 90) + '"></div>' +
      '<div class="f"><label for="s-max">' + esc(a.maxP) + '</label><input id="s-max" type="number" min="1" max="20" value="' + (s.max_party || 12) + '"></div>' +
      '<div class="f"><label for="s-phone">' + esc(a.phoneS) + '</label><input id="s-phone" value="' + esc(s.phone || '') + '"></div>' +
      '<div class="f"><label for="s-wa">' + esc(a.waS) + '</label><input id="s-wa" value="' + esc(s.whatsapp || '') + '"></div>' +
      '<div class="f"><label for="s-ig">' + esc(a.igS) + '</label><input id="s-ig" value="' + esc(s.instagram || '') + '"></div>' +
      '<div class="f f--full"><label for="s-addr">' + esc(a.addrS) + ' (AR)</label><input id="s-addr" value="' + esc(s.address_ar || '') + '"></div>' +
      '<div class="f f--full"><label for="s-addren">' + esc(a.addrS) + ' (EN)</label><input id="s-addren" value="' + esc(s.address_en || '') + '"></div>' +
      '<div class="f f--full"><p class="pane__s" style="margin:0 0 10px">' + esc(a.capNote) + ' — ' + esc(a.total) + ': ' + totalCap() + '</p>' +
      '<button class="btn btn--ink" type="submit">' + esc(a.save) + '</button></div>' +
      '</form></section>';
  }

  /* ============================================================= RENDER */
  function modalHTML() {
    if (!V.modal) return '';
    var a = A();
    return '<div class="modal" data-act="closeModal"><div class="modal__c" role="dialog" aria-modal="true">' +
      '<h3 class="display" style="margin:0 0 6px;font-size:1.25rem">' + esc(V.modal.title) + '</h3>' +
      '<p class="pane__s">' + esc(V.modal.sub || '') + '</p>' +
      '<textarea class="copybox" id="copybox" readonly>' + esc(V.modal.text) + '</textarea>' +
      '<div class="btn-row" style="margin-top:16px">' +
      '<button class="btn btn--ink btn--sm" data-act="download">' + esc(a.exportCsv) + '</button>' +
      '<button class="btn btn--wire btn--sm" data-act="docopy">Copy</button>' +
      '<button class="btn btn--wire btn--sm" data-act="closeModal">×</button>' +
      '</div></div></div>';
  }

  function render() {
    d.documentElement.lang = FV.lang;
    d.documentElement.dir = t().dir;
    var app = $('#app');
    if (!S.user) { app.innerHTML = gateHTML() + modalHTML(); return; }
    var body =
      V.tab === 'live' ? liveHTML() :
      V.tab === 'bookings' ? bookingsHTML() :
      V.tab === 'floor' ? floorHTML() :
      V.tab === 'menu' ? menuHTML() : settingsHTML();
    app.innerHTML = barHTML() +
      '<div class="wrap" style="padding-block:30px 64px">' +
      (DB.mode === 'demo' ? '<div class="banner">' + esc(A().demoNote) + '</div>' : '') +
      body + '</div>' + modalHTML();
    if (V.tab === 'floor') bindDrag();
  }

  /* ============================================================== DRAG */
  var justDragged = false;
  function bindDrag() {
    var wrap = $('#floorEdit'); if (!wrap) return;
    $$('.tb--drag', wrap).forEach(function (el) {
      var id = el.getAttribute('data-id'), moved = false, startX = 0, startY = 0;
      el.addEventListener('pointerdown', function (ev) {
        ev.preventDefault();
        moved = false; startX = ev.clientX; startY = ev.clientY;
        el.setPointerCapture(ev.pointerId);
        function move(e2) {
          if (Math.abs(e2.clientX - startX) + Math.abs(e2.clientY - startY) > 4) moved = true;
          if (!moved) return;
          var r = wrap.getBoundingClientRect();
          var x = Math.max(3, Math.min(97, (e2.clientX - r.left) / r.width * 100));
          var y = Math.max(5, Math.min(95, (e2.clientY - r.top) / r.height * 100));
          el.style.left = x.toFixed(2) + '%'; el.style.top = y.toFixed(2) + '%';
        }
        function up() {
          el.removeEventListener('pointermove', move);
          el.removeEventListener('pointerup', up);
          el.removeEventListener('pointercancel', up);
          if (!moved) return;
          justDragged = true;
          setTimeout(function () { justDragged = false; }, 400);
          var row = S.tables.filter(function (x) { return x.id === id; })[0];
          if (!row) return;
          row.x = parseFloat(el.style.left); row.y = parseFloat(el.style.top);
          DB.saveTable(row).then(function () { toast(A().saved); })
                           .catch(function (e) { toast(fail(e), true); });
        }
        el.addEventListener('pointermove', move);
        el.addEventListener('pointerup', up);
        el.addEventListener('pointercancel', up);
      });
    });
  }

  /* ============================================================== DATA */
  function loadRefs() {
    return Promise.all([DB.getZones(), DB.getTables(), DB.getMenu(), DB.getSettings()]).then(function (r) {
      S.zones = (r[0] || []).slice().sort(function (a, b) { return (a.sort || 0) - (b.sort || 0); });
      S.tables = (r[1] || []).map(function (x) {
        return { id: x.id, zone_id: x.zone_id, label: x.label, seats: +x.seats, x: +x.x, y: +x.y,
                 shape: x.shape, active: x.active !== false, sort: +x.sort || 0 };
      });
      S.menu = (r[2] || []).slice().sort(function (a, b) { return (a.sort || 0) - (b.sort || 0); });
      S.settings = r[3] || S.settings;
    });
  }
  function loadBookings(quiet) {
    return DB.listBookings({}).then(function (rows) {
      rows = (rows || []).map(function (b) { return Object.assign({}, b, { time_min: +b.time_min, party: +b.party }); });
      if (S.loaded) {
        var seen = {}; S.bookings.forEach(function (b) { seen[b.id] = 1; });
        V.fresh = {};
        rows.forEach(function (b) { if (!seen[b.id]) V.fresh[b.id] = 1; });
        var n = Object.keys(V.fresh).length;
        if (n && quiet) toast((L() === 'ar' ? 'وصل ' + n + ' حجز جديد' : n + ' new booking' + (n > 1 ? 's' : '')));
      }
      S.bookings = rows; S.loaded = true;
    });
  }
  /* in demo mode an empty dashboard makes a poor first impression —
     fill it once so the client sees what a busy day looks like */
  function ensureDemoData() {
    if (DB.mode !== 'demo' || S.bookings.length) return Promise.resolve();
    return DB.seedDemoBookings(14).then(function () { return loadBookings(false); })
             .catch(function () {});
  }
  function refresh(quiet) {
    return loadBookings(quiet).then(render).catch(function (e) { if (!quiet) toast(fail(e), true); });
  }
  function startTimer() {
    clearInterval(timer);
    if (!V.live) return;
    timer = setInterval(function () { if (!d.hidden && S.user) refresh(true); }, Math.max(5000, CFG.ADMIN_REFRESH_MS || 12000));
  }

  function csvText() {
    var head = ['code', 'name', 'phone', 'date', 'time', 'guests', 'zone', 'table', 'status', 'notes', 'created'];
    var lines = [head.join(',')];
    filtered().forEach(function (b) {
      lines.push([b.code, b.name, b.phone, b.book_date, fmt(b.time_min), b.party, zoneName(b.zone_id),
                  tableLabel(b.table_id), b.status, b.notes || '', b.created_at || '']
        .map(function (v) { return '"' + String(v).replace(/"/g, '""') + '"'; }).join(','));
    });
    return '﻿' + lines.join('\n');
  }

  /* Saving a file to disk. A normal browser gets a Blob download; the hosted
     preview build swaps a saver into downloadHook, because a sandboxed page
     is not allowed to start a download by itself. */
  var downloadHook = null;
  function saveCsv() {
    var name = 'five5-bookings-' + U.today() + '.csv', text = csvText();
    if (downloadHook) { downloadHook(name, text); return; }
    try {
      var blob = new Blob([text], { type: 'text/csv;charset=utf-8' });
      var url = URL.createObjectURL(blob), link = d.createElement('a');
      link.href = url; link.download = name;
      d.body.appendChild(link); link.click(); link.remove();
      setTimeout(function () { URL.revokeObjectURL(url); }, 2000);
    } catch (e) { toast(fail(e), true); }
  }

  /* ============================================================ EVENTS */
  d.addEventListener('click', function (ev) {
    var el = ev.target.closest && ev.target.closest('[data-act]');
    if (!el) return;
    var a = el.getAttribute('data-act'), A2 = A();

    if (a === 'closeModal') {
      if (ev.target !== el && !ev.target.hasAttribute('data-act')) return;
      V.modal = null; render(); return;
    }
    if (a === 'lang') { FV.setLang(FV.lang === 'ar' ? 'en' : 'ar'); render(); return; }
    if (a === 'out') { DB.signOut().then(function () { S.user = null; clearInterval(timer); render(); }); return; }
    if (a === 'tab') { V.tab = el.getAttribute('data-t'); render(); return; }
    if (a === 'live') { V.live = !V.live; startTimer(); render(); return; }
    if (a === 'refresh') { refresh(false); return; }

    if (a === 'set') {
      var id = el.getAttribute('data-id'), st = el.getAttribute('data-s');
      S.bookings.forEach(function (b) { if (b.id === id) b.status = st; });
      render();
      DB.updateBooking(id, { status: st }).catch(function (e) { toast(fail(e), true); refresh(true); });
      return;
    }
    if (a === 'del') {
      var did = el.getAttribute('data-id');
      S.bookings = S.bookings.filter(function (b) { return b.id !== did; });
      render();
      DB.deleteBooking(did).catch(function (e) { toast(fail(e), true); refresh(true); });
      return;
    }
    if (a === 'csv') { V.modal = { title: A2.exportCsv, sub: '', text: csvText() }; render(); return; }
    if (a === 'download') { saveCsv(); return; }
    if (a === 'docopy') { var bx = $('#copybox'); if (bx) { bx.select(); try { d.execCommand('copy'); toast('✓'); } catch (e) {} } return; }
    if (a === 'seed') { DB.seedDemoBookings(16).then(function () { return refresh(false); }); return; }
    if (a === 'wipe') { if (w.confirm(A2.clearQ)) DB.clearBookings().then(function () { return refresh(false); }); return; }

    if (a === 'fzone') { V.zone = el.getAttribute('data-z'); V.editTable = null; render(); return; }
    if (a === 'pick') {
      var pid = el.getAttribute('data-id');
      /* a drag always leaves the table selected — only a plain click toggles it off */
      V.editTable = (!justDragged && V.editTable === pid) ? null : pid;
      render(); return;
    }
    if (a === 'addTable') {
      var row = { zone_id: V.zone, label: 'T' + (S.tables.filter(function (x) { return x.zone_id === V.zone; }).length + 1),
                  seats: 2, x: 50, y: 50, shape: 'round', active: true,
                  sort: S.tables.length + 1 };
      DB.saveTable(row).then(function (saved) {
        S.tables.push(Object.assign({}, row, saved || {}, { seats: +((saved || row).seats), x: +((saved || row).x), y: +((saved || row).y) }));
        V.editTable = (saved && saved.id) || row.id; render();
      }).catch(function (e) { toast(fail(e), true); });
      return;
    }
    if (a === 'saveTable') {
      var tr = S.tables.filter(function (x) { return x.id === V.editTable; })[0]; if (!tr) return;
      tr.label = $('#e-lbl').value || tr.label;
      tr.seats = Math.max(1, +$('#e-seat').value || 1);
      tr.shape = $('#e-shape').value;
      tr.active = $('#e-act').checked;
      DB.saveTable(tr).then(function () { toast(A2.saved); render(); }).catch(function (e) { toast(fail(e), true); });
      return;
    }
    if (a === 'delTable') {
      var tid = V.editTable; if (!tid) return;
      S.tables = S.tables.filter(function (x) { return x.id !== tid; }); V.editTable = null; render();
      DB.deleteTable(tid).catch(function (e) { toast(fail(e), true); });
      return;
    }

    if (a === 'editItem') { V.editItem = (V.editItem === el.getAttribute('data-id')) ? null : el.getAttribute('data-id'); render(); return; }
    if (a === 'addItem') {
      var it = { cat: 'coffee', name_ar: 'صنف جديد', name_en: 'New item', desc_ar: '', desc_en: '',
                 price: null, mood: [], featured: false, active: false, sort: S.menu.length + 1 };
      DB.saveMenuItem(it).then(function (saved) {
        S.menu.push(Object.assign({}, it, saved || {}));
        V.editItem = (saved && saved.id) || it.id; render();
      }).catch(function (e) { toast(fail(e), true); });
      return;
    }
    if (a === 'saveItem') {
      var mid = el.getAttribute('data-id');
      var m = S.menu.filter(function (x) { return x.id === mid; })[0]; if (!m) return;
      m.name_ar = $('#i-nar').value; m.name_en = $('#i-nen').value;
      m.desc_ar = $('#i-dar').value; m.desc_en = $('#i-den').value;
      m.cat = ($('#i-cat').value || 'coffee').trim();
      var pv = $('#i-price').value;
      m.price = (pv === '' ? null : Number(pv));
      m.mood = $('#i-mood').value.split(',').map(function (s) { return s.trim(); }).filter(Boolean);
      m.active = $('#i-act').checked; m.featured = $('#i-feat').checked;
      DB.saveMenuItem(m).then(function () { toast(A2.saved); V.editItem = null; render(); })
                        .catch(function (e) { toast(fail(e), true); });
      return;
    }
    if (a === 'delItem') {
      var rid = el.getAttribute('data-id');
      S.menu = S.menu.filter(function (x) { return x.id !== rid; }); render();
      DB.deleteMenuItem(rid).catch(function (e) { toast(fail(e), true); });
      return;
    }
  });

  d.addEventListener('submit', function (ev) {
    var f = ev.target;
    if (f.id === 'loginForm') {
      ev.preventDefault();
      var em = $('#em').value.trim(), pw = $('#pw').value;
      V.email = em; V.err = '';
      DB.signIn(em, pw).then(function (u) {
        S.user = u; V.err = '';
        return loadRefs().then(function () { return loadBookings(false); }).then(ensureDemoData);
      }).then(function () { render(); startTimer(); })
        .catch(function (e) { V.err = (e && e.message === 'BAD_LOGIN') ? A().badLogin : fail(e); render(); });
      return;
    }
    if (f.id === 'setForm') {
      ev.preventDefault();
      function m2(id) { var v = ($('#' + id).value || '0:0').split(':'); return (+v[0] || 0) * 60 + (+v[1] || 0); }
      var patch = {
        open_min: m2('s-open'), close_min: m2('s-close'),
        slot_min: Math.max(15, +$('#s-slot').value || 30),
        hold_min: Math.max(30, +$('#s-hold').value || 90),
        max_party: Math.max(1, +$('#s-max').value || 12),
        phone: $('#s-phone').value, whatsapp: $('#s-wa').value, instagram: $('#s-ig').value,
        address_ar: $('#s-addr').value, address_en: $('#s-addren').value
      };
      if (patch.close_min <= patch.open_min) patch.close_min += 1440;   /* closes after midnight */
      Object.assign(S.settings, patch);
      DB.saveSettings(patch).then(function () { toast(A().saved); render(); })
                            .catch(function (e) { toast(fail(e), true); });
      return;
    }
  });

  var qT;
  d.addEventListener('input', function (ev) {
    if (ev.target.id !== 'q') return;
    var v = ev.target.value;
    clearTimeout(qT);
    qT = setTimeout(function () {
      V.q = v; render();
      var b = $('#q'); if (b) { b.focus(); b.setSelectionRange(b.value.length, b.value.length); }
    }, 250);
  });
  d.addEventListener('change', function (ev) {
    if (ev.target.id === 'fStatus') { V.fStatus = ev.target.value; render(); }
    if (ev.target.id === 'fDate') { V.fDate = ev.target.value; render(); }
  });
  d.addEventListener('visibilitychange', function () { if (!d.hidden && S.user && V.live) refresh(true); });

  /* ============================================================== BOOT */
  render();
  DB.session().then(function (u) {
    if (!u) return;
    S.user = u;
    return loadRefs().then(function () { return loadBookings(false); }).then(ensureDemoData)
      .then(function () { render(); startTimer(); });
  }).catch(function () {});

})(window, document);
