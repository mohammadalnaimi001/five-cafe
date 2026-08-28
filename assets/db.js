/* =====================================================================
   FIVE₅ COFFEE — data layer
   One API, two backings:
     · supabase  → REST + Auth over plain fetch (no libraries, ~6KB)
     · demo      → in-memory sample data, so the site runs with no backend
   Both expose exactly the same methods, so index.html / admin.html never
   need to know which one is behind them.
   ===================================================================== */
(function (w) {
  'use strict';

  var CFG = w.FV_CONFIG || {};
  var TZ = 'Asia/Amman';

  /* ---------------------------------------------------------------- util */
  var util = {
    tz: TZ,
    parts: function () {
      var f = new Intl.DateTimeFormat('en-CA', {
        timeZone: TZ, year: 'numeric', month: '2-digit', day: '2-digit',
        hour: '2-digit', minute: '2-digit', hour12: false
      });
      var o = {}; f.formatToParts(new Date()).forEach(function (p) { o[p.type] = p.value; });
      return o;
    },
    today: function () { var p = util.parts(); return p.year + '-' + p.month + '-' + p.day; },
    nowMin: function () { var p = util.parts(); return (+p.hour % 24) * 60 + (+p.minute); },
    addDays: function (iso, n) {
      var d = new Date(iso + 'T00:00:00Z'); d.setUTCDate(d.getUTCDate() + n);
      return d.toISOString().slice(0, 10);
    },
    dow: function (iso) { return new Date(iso + 'T00:00:00Z').getUTCDay(); },
    pad: function (n) { return (n < 10 ? '0' : '') + n; },
    fmtTime: function (m, lang) {
      m = ((m % 1440) + 1440) % 1440;
      var h = Math.floor(m / 60), mi = m % 60, h12 = h % 12 || 12;
      var ap = h < 12 ? (lang === 'ar' ? 'ص' : 'AM') : (lang === 'ar' ? 'م' : 'PM');
      return h12 + ':' + util.pad(mi) + ' ' + ap;
    },
    /* every bookable start time, from opening to one hour before closing */
    slots: function (s) {
      var out = [], step = Math.max(15, s.slot_min || 30), last = (s.close_min || 1500) - 60;
      for (var m = (s.open_min || 600); m <= last; m += step) out.push(m);
      return out;
    },
    isOpen: function (s) {
      var n = util.nowMin(), o = s.open_min, c = s.close_min;
      return (n >= o && n < c) || (n + 1440 >= o && n + 1440 < c);
    },
    validPhone: function (p) { return /^07\d{8}$/.test(String(p || '').replace(/\D/g, '')); },
    waLink: function (num, msg) { return 'https://wa.me/' + num + '?text=' + encodeURIComponent(msg); }
  };

  /* ------------------------------------------------------- demo seed data */
  function demoSeed() {
    var zones = [
      { id: 'inside',  name_ar: 'جلسة داخلية', name_en: 'Indoor',        blurb_ar: 'هدوء وإضاءة دافية وإنترنت', blurb_en: 'Warm light, low volume, working Wi-Fi', sort: 1 },
      { id: 'terrace', name_ar: 'تراس خارجي',  name_en: 'Terrace',       blurb_ar: 'برّا تحت الهوا',            blurb_en: 'Outside, under the sky',                sort: 2 },
      { id: 'shisha',  name_ar: 'ركن الشيشة',  name_en: 'Shisha corner', blurb_ar: 'ركن الشيشة على التراس',     blurb_en: 'The shisha corner on the terrace',      sort: 3 }
    ];
    var raw = [
      ['inside','T1',2,12,16,'round'],   ['inside','T2',2,30,16,'round'],
      ['inside','T3',4,52,15,'square'],  ['inside','T4',4,74,15,'square'],
      ['inside','T5',2,12,42,'round'],   ['inside','T6',4,32,44,'square'],
      ['inside','T7',4,54,44,'square'],  ['inside','T8',6,80,45,'booth'],
      ['inside','T9',2,12,72,'round'],   ['inside','T10',4,34,74,'square'],
      ['inside','T11',4,58,74,'square'], ['inside','T12',4,82,75,'booth'],
      ['terrace','A1',2,14,20,'round'],  ['terrace','A2',2,36,18,'round'],
      ['terrace','A3',4,60,20,'square'], ['terrace','A4',4,84,22,'square'],
      ['terrace','A5',2,14,62,'round'],  ['terrace','A6',2,36,64,'round'],
      ['terrace','A7',4,60,66,'square'], ['terrace','A8',4,84,64,'square'],
      ['shisha','S1',3,18,22,'booth'],   ['shisha','S2',3,50,20,'booth'],
      ['shisha','S3',3,82,24,'booth'],   ['shisha','S4',3,18,68,'booth'],
      ['shisha','S5',3,50,70,'booth'],   ['shisha','S6',3,82,66,'booth']
    ];
    var tables = raw.map(function (r, i) {
      return { id: 'tbl-' + r[1], zone_id: r[0], label: r[1], seats: r[2],
               x: r[3], y: r[4], shape: r[5], active: true, sort: i + 1 };
    });
    var m = [
      ['coffee','V60 درِپ','V60 Drip','تحضير يدوي على مهل — طعم صافي وحموضة مضبوطة','Hand-poured slowly — clean cup, balanced acidity',['calm','plain','hot'],true],
      ['coffee','كولد برو','Cold Brew','منقوع ١٨ ساعة — قوي وناعم وبارد','Steeped 18 hours — strong, smooth, cold',['awake','plain','cold'],false],
      ['coffee','كراميل ماكياتو','Caramel Macchiato','إسبريسو، حليب مبخّر، وطبقة كراميل','Espresso, steamed milk and a caramel layer',['sweet','hot','cozy'],true],
      ['coffee','قهوة أمريكية','American Coffee','إسبريسو مطوّل بالمي الساخن — سادة وصافي','Espresso lengthened with hot water',['awake','plain','hot'],false],
      ['coffee','فلات وايت','Flat White','إسبريسو مزدوج مع حليب مخملي','Double espresso, velvet milk',['awake','plain','hot'],false],
      ['coffee','آيس لاتيه','Iced Latte','لاتيه على ثلج — للأيام الحرّة','Latte over ice — for the hot days',['calm','sweet','cold'],false],
      ['tea','شاي بالنعنع','Mint Tea','شاي أحمر ونعنع طازة','Black tea with fresh mint',['calm','plain','hot'],false],
      ['tea','ماتشا لاتيه','Matcha Latte','ماتشا يابانية مع حليب','Japanese matcha with milk',['calm','sweet','hot'],false],
      ['bakery','فطيرة زعتر','Zaatar Fatira','طازة من الفرن، بتيجي مع القهوة الصبحية','Straight out of the oven',['plain','cozy'],true],
      ['bakery','كرواسون جبنة','Cheese Croissant','مقرمش من برّا وطري من جوّا','Crisp outside, soft inside',['cozy','sweet'],false],
      ['dessert','براوني','Brownie','شوكولا كثيفة وطرية — الزوّار بيوصوا فيها','Dense, soft chocolate — guests call it out by name',['sweet','cozy'],true],
      ['dessert','تشيز كيك','Cheesecake','قطعة كلاسيكية مع صوص التوت','A classic slice with berry sauce',['sweet','cozy'],false],
      ['food','سندويشة حلومي','Halloumi Sandwich','حلومي مشوي، زعتر وطماطم','Grilled halloumi, zaatar and tomato',['plain','cozy'],false],
      ['food','بولة أكاي','Acai Bowl','أكاي مع فواكه وجرانولا','Acai with fruit and granola',['calm','sweet','cold'],false]
    ];
    var menu = m.map(function (r, i) {
      return { id: 'm' + i, cat: r[0], name_ar: r[1], name_en: r[2], desc_ar: r[3],
               desc_en: r[4], price: null, mood: r[5], featured: r[6], active: true, sort: i + 1 };
    });
    var settings = {
      id: 1, open_min: 600, close_min: 1500, slot_min: 30, hold_min: 90, max_party: 12,
      phone: CFG.PHONE || '0792225059', whatsapp: CFG.WHATSAPP || '962792225059',
      instagram: CFG.INSTAGRAM || 'five5coffee',
      address_ar: 'شارع الأميرة ثروت، عمّان', address_en: 'Princess Tharwat St, Amman',
      plus_code: 'XR8V+VR Amman'
    };
    return { zones: zones, tables: tables, menu: menu, settings: settings, bookings: [] };
  }

  /* ------------------------------------------------------- demo adapter */
  function DemoAdapter() {
    var KEY = 'fv_demo_v1';
    var db = demoSeed();
    try {
      var raw = localStorage.getItem(KEY);
      if (raw) { var p = JSON.parse(raw); if (p && p.bookings) { db.bookings = p.bookings; if (p.settings) db.settings = p.settings; if (p.tables) db.tables = p.tables; if (p.menu) db.menu = p.menu; } }
    } catch (e) {}
    function save() { try { localStorage.setItem(KEY, JSON.stringify(db)); } catch (e) {} }
    function ok(v) { return Promise.resolve(v); }
    function overlaps(b, date, time) {
      return b.book_date === date && b.status !== 'cancelled' && b.status !== 'no_show' &&
             b.time_min < time + db.settings.hold_min && time < b.time_min + db.settings.hold_min;
    }
    var listeners = [];
    function fire() { listeners.forEach(function (f) { try { f(); } catch (e) {} }); }

    return {
      mode: 'demo',
      getZones:    function () { return ok(db.zones.slice()); },
      getTables:   function () { return ok(db.tables.slice()); },
      getMenu:     function () { return ok(db.menu.slice()); },
      getSettings: function () { return ok(Object.assign({}, db.settings)); },

      availability: function (date, time) {
        return ok(db.tables.filter(function (t) { return t.active; }).map(function (t) {
          return { table_id: t.id, zone_id: t.zone_id, seats: t.seats,
                   taken: db.bookings.some(function (b) { return b.table_id === t.id && overlaps(b, date, time); }) };
        }));
      },

      dayLoad: function (date) {
        var active = db.tables.filter(function (t) { return t.active; });
        return ok(util.slots(db.settings).map(function (m) {
          var busy = {};
          db.bookings.forEach(function (b) { if (b.table_id && overlaps(b, date, m)) busy[b.table_id] = 1; });
          return { time_min: m, free_tables: active.length - Object.keys(busy).length };
        }));
      },

      book: function (p) {
        var s = db.settings;
        if (String(p.name || '').trim().length < 2)   return Promise.reject(new Error('INVALID_NAME'));
        if (!util.validPhone(p.phone))                return Promise.reject(new Error('INVALID_PHONE'));
        if (!p.date || p.date < util.today())         return Promise.reject(new Error('INVALID_DATE'));
        if (p.party < 1 || p.party > s.max_party)     return Promise.reject(new Error('INVALID_PARTY'));
        if (p.time < s.open_min || p.time > s.close_min - 60) return Promise.reject(new Error('CLOSED_AT_THAT_TIME'));

        var t;
        if (p.table) {
          t = db.tables.filter(function (x) { return x.id === p.table && x.active; })[0];
          if (!t) return Promise.reject(new Error('NO_SUCH_TABLE'));
          if (t.seats < p.party) return Promise.reject(new Error('TABLE_TOO_SMALL'));
        } else {
          t = db.tables.filter(function (x) {
            return x.active && x.zone_id === p.zone && x.seats >= p.party &&
                   !db.bookings.some(function (b) { return b.table_id === x.id && overlaps(b, p.date, p.time); });
          }).sort(function (a, b) { return a.seats - b.seats || a.sort - b.sort; })[0];
          if (!t) return Promise.reject(new Error('NO_TABLE_FITS'));
        }
        if (db.bookings.some(function (b) { return b.table_id === t.id && overlaps(b, p.date, p.time); }))
          return Promise.reject(new Error('TABLE_TAKEN'));

        var code = 'FV-' + p.date.slice(5, 7) + p.date.slice(8) + '-' +
                   Math.random().toString(16).slice(2, 6).toUpperCase();
        var row = {
          id: 'bk-' + Date.now() + '-' + Math.floor(Math.random() * 9999), code: code,
          name: String(p.name).trim(), phone: String(p.phone).replace(/\D/g, ''),
          book_date: p.date, time_min: p.time, party: p.party, zone_id: t.zone_id,
          table_id: t.id, notes: String(p.notes || '').slice(0, 300),
          status: 'pending', source: 'web', created_at: new Date().toISOString()
        };
        db.bookings.push(row); save(); fire();
        return ok({ code: code, table_label: t.label, zone_id: t.zone_id, id: row.id });
      },

      /* ---- admin ---- */
      signIn: function (email, pw) {
        if (String(pw || '').length < 4) return Promise.reject(new Error('BAD_LOGIN'));
        try { localStorage.setItem('fv_demo_session', email || 'demo@five5'); } catch (e) {}
        return ok({ email: email || 'demo@five5', demo: true });
      },
      signOut: function () { try { localStorage.removeItem('fv_demo_session'); } catch (e) {} return ok(true); },
      session:  function () {
        var v = null; try { v = localStorage.getItem('fv_demo_session'); } catch (e) {}
        return ok(v ? { email: v, demo: true } : null);
      },
      listBookings: function () {
        return ok(db.bookings.slice().sort(function (a, b) {
          return a.book_date.localeCompare(b.book_date) || a.time_min - b.time_min;
        }));
      },
      updateBooking: function (id, patch) {
        db.bookings.forEach(function (b) { if (b.id === id) Object.assign(b, patch); });
        save(); fire(); return ok(true);
      },
      deleteBooking: function (id) {
        db.bookings = db.bookings.filter(function (b) { return b.id !== id; });
        save(); fire(); return ok(true);
      },
      saveSettings: function (patch) { Object.assign(db.settings, patch); save(); return ok(true); },
      saveTable: function (t) {
        var i = db.tables.map(function (x) { return x.id; }).indexOf(t.id);
        if (i < 0) { t.id = t.id || 'tbl-' + Date.now(); db.tables.push(t); }
        else Object.assign(db.tables[i], t);
        save(); return ok(t);
      },
      deleteTable: function (id) {
        db.tables = db.tables.filter(function (t) { return t.id !== id; });
        db.bookings.forEach(function (b) { if (b.table_id === id) b.table_id = null; });
        save(); return ok(true);
      },
      saveMenuItem: function (m) {
        var i = db.menu.map(function (x) { return x.id; }).indexOf(m.id);
        if (i < 0) { m.id = m.id || 'm' + Date.now(); db.menu.push(m); }
        else Object.assign(db.menu[i], m);
        save(); return ok(m);
      },
      deleteMenuItem: function (id) {
        db.menu = db.menu.filter(function (m) { return m.id !== id; });
        save(); return ok(true);
      },
      seedDemoBookings: function (n) {
        var names = ['أحمد الزعبي','Lana Haddad','محمد أبو رمان','Dina Sawalha','عمر الخطيب',
                     'Rania Nasser','يزن العموش','Sara Qasem','خالد المومني','Hala Tarawneh'];
        var st = ['confirmed','confirmed','pending','confirmed','cancelled'];
        var slots = util.slots(db.settings);
        for (var i = 0; i < (n || 16); i++) {
          var date = util.addDays(util.today(), Math.floor(Math.random() * 7));
          var time = slots[Math.floor(Math.random() * slots.length)];
          var party = 1 + Math.floor(Math.random() * 4);
          var free = db.tables.filter(function (t) {
            return t.seats >= party && !db.bookings.some(function (b) { return b.table_id === t.id && overlaps(b, date, time); });
          });
          if (!free.length) continue;
          var t = free[Math.floor(Math.random() * free.length)];
          db.bookings.push({
            id: 'seed-' + i + '-' + Math.floor(Math.random() * 9999),
            code: 'FV-' + date.slice(5, 7) + date.slice(8) + '-' + Math.random().toString(16).slice(2, 6).toUpperCase(),
            name: names[i % names.length],
            phone: '079' + String(1000000 + Math.floor(Math.random() * 8999999)),
            book_date: date, time_min: time, party: party, zone_id: t.zone_id, table_id: t.id,
            notes: '', status: st[Math.floor(Math.random() * st.length)], source: 'demo',
            created_at: new Date().toISOString()
          });
        }
        save(); fire(); return ok(true);
      },
      clearBookings: function () { db.bookings = []; save(); fire(); return ok(true); },
      onChange: function (cb) { listeners.push(cb); return function () { listeners = listeners.filter(function (f) { return f !== cb; }); }; },
      reset: function () { try { localStorage.removeItem(KEY); } catch (e) {} db = demoSeed(); fire(); return ok(true); }
    };
  }

  /* --------------------------------------------------- supabase adapter */
  function SupabaseAdapter() {
    var URL = String(CFG.SUPABASE_URL || '').replace(/\/+$/, '');
    var KEY = CFG.SUPABASE_ANON_KEY || '';
    var TOKKEY = 'fv_sb_token';
    var token = null;
    try { token = JSON.parse(localStorage.getItem(TOKKEY) || 'null'); } catch (e) {}

    function headers(extra) {
      var h = { 'apikey': KEY, 'Content-Type': 'application/json' };
      h['Authorization'] = 'Bearer ' + ((token && token.access_token) || KEY);
      return Object.assign(h, extra || {});
    }
    function req(path, opts) {
      opts = opts || {};
      return fetch(URL + path, {
        method: opts.method || 'GET',
        headers: headers(opts.headers),
        body: opts.body ? JSON.stringify(opts.body) : undefined
      }).then(function (r) {
        return r.text().then(function (txt) {
          var data = null;
          if (txt) { try { data = JSON.parse(txt); } catch (e) { data = txt; } }
          if (!r.ok) {
            var msg = (data && (data.message || data.error_description || data.error || data.msg)) || ('HTTP_' + r.status);
            var err = new Error(String(msg).replace(/^.*?:\s*/, '')); err.status = r.status; err.body = data;
            throw err;
          }
          return data;
        });
      });
    }
    var rest = function (p, o) { return req('/rest/v1' + p, o); };
    var rpc  = function (fn, args) { return req('/rest/v1/rpc/' + fn, { method: 'POST', body: args }); };

    function setToken(t) {
      token = t;
      try { t ? localStorage.setItem(TOKKEY, JSON.stringify(t)) : localStorage.removeItem(TOKKEY); } catch (e) {}
    }

    return {
      mode: 'supabase',
      getZones:    function () { return rest('/zones?select=*&order=sort'); },
      getTables:   function () { return rest('/tables?select=*&order=zone_id,sort'); },
      getMenu:     function () { return rest('/menu_items?select=*&order=sort'); },
      getSettings: function () { return rest('/settings?select=*&id=eq.1').then(function (r) { return r[0]; }); },

      availability: function (date, time) { return rpc('availability_for', { p_date: date, p_time: time }); },
      dayLoad:      function (date) { return rpc('day_load', { p_date: date }); },

      book: function (p) {
        return rpc('book_table', {
          p_name: p.name, p_phone: p.phone, p_date: p.date, p_time: p.time,
          p_party: p.party, p_zone: p.zone, p_table: p.table || null, p_notes: p.notes || ''
        });
      },

      /* ---- admin ---- */
      signIn: function (email, pw) {
        return req('/auth/v1/token?grant_type=password', {
          method: 'POST', body: { email: email, password: pw }
        }).then(function (t) { setToken(t); return t.user || { email: email }; });
      },
      signOut: function () {
        var p = token ? req('/auth/v1/logout', { method: 'POST' }).catch(function () {}) : Promise.resolve();
        return p.then(function () { setToken(null); return true; });
      },
      session: function () {
        if (!token || !token.access_token) return Promise.resolve(null);
        return req('/auth/v1/user').then(function (u) { return u; })
          .catch(function () { setToken(null); return null; });
      },
      listBookings: function (o) {
        o = o || {};
        var q = '/bookings?select=*&order=book_date.asc,time_min.asc&limit=1000';
        if (o.from) q += '&book_date=gte.' + o.from;
        if (o.to)   q += '&book_date=lte.' + o.to;
        return rest(q);
      },
      updateBooking: function (id, patch) {
        return rest('/bookings?id=eq.' + id, { method: 'PATCH', body: patch, headers: { Prefer: 'return=minimal' } });
      },
      deleteBooking: function (id) { return rest('/bookings?id=eq.' + id, { method: 'DELETE' }); },
      saveSettings:  function (patch) {
        patch.updated_at = new Date().toISOString();
        return rest('/settings?id=eq.1', { method: 'PATCH', body: patch, headers: { Prefer: 'return=minimal' } });
      },
      saveTable: function (t) {
        var body = { zone_id: t.zone_id, label: t.label, seats: t.seats, x: t.x, y: t.y, shape: t.shape, active: t.active, sort: t.sort };
        return t.id
          ? rest('/tables?id=eq.' + t.id, { method: 'PATCH', body: body, headers: { Prefer: 'return=representation' } }).then(function (r) { return r[0]; })
          : rest('/tables', { method: 'POST', body: body, headers: { Prefer: 'return=representation' } }).then(function (r) { return r[0]; });
      },
      deleteTable: function (id) { return rest('/tables?id=eq.' + id, { method: 'DELETE' }); },
      saveMenuItem: function (m) {
        var body = { cat: m.cat, name_ar: m.name_ar, name_en: m.name_en, desc_ar: m.desc_ar,
                     desc_en: m.desc_en, price: m.price, mood: m.mood, featured: m.featured,
                     active: m.active, sort: m.sort };
        return m.id
          ? rest('/menu_items?id=eq.' + m.id, { method: 'PATCH', body: body, headers: { Prefer: 'return=representation' } }).then(function (r) { return r[0]; })
          : rest('/menu_items', { method: 'POST', body: body, headers: { Prefer: 'return=representation' } }).then(function (r) { return r[0]; });
      },
      deleteMenuItem: function (id) { return rest('/menu_items?id=eq.' + id, { method: 'DELETE' }); },
      seedDemoBookings: function () { return Promise.reject(new Error('DEMO_ONLY')); },
      clearBookings:    function () { return Promise.reject(new Error('DEMO_ONLY')); },
      onChange: function () { return function () {}; }   // the dashboard polls instead
    };
  }

  var configured = CFG.SUPABASE_URL && CFG.SUPABASE_URL.indexOf('YOUR-PROJECT') < 0;
  var DB = (CFG.DEMO || !configured) ? DemoAdapter() : SupabaseAdapter();

  w.FV = w.FV || {};
  w.FV.util = util;
  w.FV.db = DB;
  w.FV.cfg = CFG;
  w.FV.demoSeed = demoSeed;
})(window);
