/* =====================================================================
   FIVE₅ COFFEE — all site copy, in one place.
   Edit here to change any text on the site or the dashboard.
   ===================================================================== */
(function (w) {
  'use strict';

  var T = {
    ar: {
      dir: 'rtl', lang: 'ar', other: 'EN',

      /* ---------- shell ---------- */
      nav: [['about', 'لمحة'], ['menu', 'القائمة'], ['mood', 'مزاجك'], ['reviews', 'المراجعات'], ['visit', 'الموقع']],
      book: 'احجز طاولة', menuBtn: 'شوف القائمة', backTop: 'فوق',

      /* ---------- hero ---------- */
      openNow: 'مفتوح الآن', closesAt: 'بنسكّر ', shut: 'مسكّر حالياً', opensAt: 'بنفتح ',
      heroEyebrow: 'سوق يارد · شارع الأميرة ثروت · عمّان',
      heroH1a: 'قهوة مختصّة،', heroH1b: 'وجلسة بتطوّل لآخر الليل',
      heroP: 'كوفي هاوس هادي في قلب سوق يارد. تحضير V60 ودرِپ على مهل، مخبوزات طازة من الفرن، وركن شيشة على التراس — لحد الساعة وحدة الفجر.',
      railStart: 'بداية اليوم', railEnd: 'آخر الليل',
      stats: [['4.4', 'تقييم جوجل'], ['110', 'مراجعة'], ['5–10', 'د.أ للشخص']],
      scrollHint: 'انزل',

      /* ---------- about ---------- */
      aboutEy: 'ليش الناس بترجع', aboutH: 'مكان بيعرف يهدّى البال',
      aboutP: 'ثلاث جلسات مختلفة تحت سقف واحد، وفريق الزوّار بيذكروه بالاسم في مراجعاتهم.',
      cells: [
        ['جلسة داخلية', 'هدوء وإضاءة دافية', 'طاولات متباعدة، صوت واطي، وإنترنت — الجلسة بتطوّل بدون ما حدا يستعجلك.'],
        ['تراس وشيشة', 'برّا تحت الهوا', 'ركن شيشة على التراس لسهرة عمّان، مع نفس القهوة اللي بتشربها جوّا.'],
        ['سفري وتوصيل', 'على السريع', 'طلبك جاهز على الباب، أو بيوصلك عالبيت من نفس المطبخ.'],
        ['باريستا', 'تحضير مختص', 'V60، درِپ، ولاتيه — تحضير بمعايير مختصة مش بس فنجان قهوة.']
      ],

      /* ---------- menu ---------- */
      menuEy: 'القائمة', menuH: 'شو بتحب تشرب؟',
      menuP: 'دوّر أو فلتر حسب الصنف — القائمة الكاملة على الطاولة.',
      cats: { all: 'الكل', coffee: 'قهوة', tea: 'شاي', bakery: 'مخبوزات', dessert: 'حلويات', food: 'أكل' },
      searchMenu: 'دوّر على صنف…', noMatch: 'ما في صنف بهذا الاسم.',
      featured: 'الأكثر طلباً',
      menuAvg: 'متوسط الإنفاق ٥–١٠ د.أ للشخص', menuAvgSrc: 'بحسب ٤٣ زائر على جوجل',

      /* ---------- mood finder ---------- */
      moodEy: 'مكتشف المزاج', moodH: 'ما بتعرف شو تطلب؟',
      moodP: 'ثلاث أسئلة، وبنقترح عليك المشروب المناسب.',
      moodStart: 'يلا نجرّب', moodAgain: 'جرّب مرة ثانية', moodStep: 'سؤال',
      moodQs: [
        ['كيف مزاجك هلق؟', [['calm', 'رايق وبدي أهدى'], ['awake', 'تعبان وبدي أصحى'], ['cozy', 'بدي شي يدفّي القلب']]],
        ['حلو ولا سادة؟', [['sweet', 'حلو'], ['plain', 'سادة']]],
        ['حار ولا بارد؟', [['hot', 'حار'], ['cold', 'بارد']]]
      ],
      moodResult: 'اقتراحنا إلك', moodBecause: 'لأنك اخترت',
      moodBook: 'احجز طاولة وجرّبه',

      /* ---------- reviews ---------- */
      revEy: 'رأي الزوّار', revH: '110 مراجعة على جوجل', revOf: 'من 5',
      revTags: ['أجواء', 'ضيافة', 'شيشة', 'موظفين', 'باريستا', 'حلو'],
      revs: [
        ['أجواء الكوفي هاوس رائعة وهادية، المكان نظيف والقهوة ممتازة! تحية خاصة لعماد على حسن الاستقبال والخدمة الرائعة، فعلاً إنسان محترم وبيتعامل مع الزبائن بذوق عالي. أكيد رح أرجع أزور المكان مرة ثانية.', 'Basel Ahmad', 'قبل ٩ أشهر'],
        ['مكان جداً لطيف، وتعامل الموظفين أكثر من ممتاز — وخصوصاً عماد، ما قصّر بالمرة وضل متابع معنا بأسلوب لطيف. شكراً للكل.', 'Fares Altaamare', 'قبل ٩ أشهر'],
        ['المكان جداً لطيف وقعدته حلوة ورايقة وهادية، والموظفين لطيفين ومزوّقين بالتعامل. حبيت القهوة والبراوني عندهم كتير طيب.', 'Wasan Baj', 'قبل سنة']
      ],

      /* ---------- booking ---------- */
      bkEy: 'الحجز', bkH: 'اختار طاولتك بنفسك',
      bkP: 'حدّد اليوم والوقت، وبتشوف المخطط الحقيقي للكافيه — اضغط على الطاولة اللي بدك ياها.',
      step: 'خطوة',
      s1: 'متى؟', s2: 'وين؟', s3: 'مين؟',
      fName: 'الاسم', fPhone: 'رقم الموبايل', fDate: 'التاريخ', fParty: 'عدد الأشخاص',
      fTime: 'الوقت', fNotes: 'ملاحظات (اختياري)',
      fNotesPh: 'مثلاً: طاولة جنب الشباك، أو عيد ميلاد',
      seatsLeft: 'طاولة متاحة', noSlots: 'خلصت أوقات اليوم — اختار تاريخ ثاني.',
      pickTime: 'اختار وقت عشان نعرضلك الطاولات الفاضية.',
      floorFree: 'متاحة', floorTaken: 'محجوزة', floorSmall: 'أصغر من مجموعتك', floorPicked: 'اختيارك',
      anyTable: 'أي طاولة مناسبة', anyTableSub: 'بنختارلك أنسب طاولة',
      tableN: 'طاولة', seatsN: 'مقاعد', loadingMap: 'بنحمّل المخطط…',
      submit: 'أكّد الحجز', sending: 'جاري الحفظ…', person: 'شخص',
      asideH: 'قبل ما تحجز',
      asideRows: [['الساعات', 'يومياً · بنسكّر ١:٠٠ ص'], ['المدة', 'الطاولة محجوزة ٩٠ دقيقة'],
                  ['مجموعات', 'أكثر من ١٢ شخص؟ احكِ معنا مباشرة'], ['الإلغاء', 'بلّغنا قبل ساعتين وبنفضّي الطاولة']],
      doneH: 'تم! طاولتك محجوزة', doneP: 'احتفظ برقم الحجز — الفريق بيتواصل معك للتأكيد.',
      doneTable: 'طاولتك', doneWA: 'أرسل التفاصيل على واتساب', doneNew: 'حجز جديد',
      errors: {
        INVALID_NAME: 'اكتب اسمك (حرفين على الأقل)',
        INVALID_PHONE: 'رقم أردني مثل 0791234567',
        INVALID_DATE: 'اختار تاريخ من اليوم أو بعده',
        DATE_TOO_FAR: 'أبعد تاريخ بنقبله بعد شهرين',
        INVALID_PARTY: 'من ١ لـ ١٢ شخص — للمجموعات الأكبر احكِ معنا',
        CLOSED_AT_THAT_TIME: 'إحنا مسكّرين بهذا الوقت',
        NO_SUCH_TABLE: 'الطاولة مش موجودة',
        TABLE_TOO_SMALL: 'هاي الطاولة أصغر من مجموعتك — اختار وحدة أكبر',
        TABLE_TAKEN: 'حدا سبقك على هاي الطاولة — اختار وحدة ثانية',
        NO_TABLE_FITS: 'ما ضل طاولة بتسع مجموعتك بهذا الوقت',
        NO_TIME: 'اختار وقت',
        NO_TABLE: 'اختار طاولة من المخطط',
        NETWORK: 'ما قدرنا نوصل للسيرفر — جرّب كمان مرة أو احكِ معنا على الواتساب',
        DEFAULT: 'صار خطأ — جرّب كمان مرة'
      },

      /* ---------- visit ---------- */
      visitEy: 'الموقع', visitH: 'وين بتلاقينا',
      locRows: [['العنوان', 'address'], ['كود الموقع', 'plus'], ['الهاتف', 'phone'], ['الساعات', 'hours']],
      hoursVal: 'يومياً حتى ١:٠٠ ص',
      openMaps: 'افتح بجوجل مابس', callUs: 'اتصل فينا', waUs: 'واتساب',
      ftrTag: 'كوفي هاوس · سوق يارد · عمّان', ftrAdmin: 'لوحة التحكم', rights: 'جميع الحقوق محفوظة',
      demoBadge: 'وضع المعاينة — الحجوزات محفوظة بالمتصفح فقط',

      /* ---------- admin ---------- */
      a: {
        title: 'لوحة التحكم', brand: 'Five₅ · سوق يارد',
        loginH: 'تسجيل الدخول', loginP: 'دخول الموظفين فقط.',
        email: 'الإيميل', pass: 'كلمة المرور', enter: 'دخول', out: 'خروج',
        loginDemo: 'وضع المعاينة: أي إيميل وكلمة مرور من ٤ خانات بيفتحوا اللوحة.',
        badLogin: 'الإيميل أو كلمة المرور غلط',
        tabs: [['live', 'اليوم'], ['bookings', 'الحجوزات'], ['floor', 'مخطط الطاولات'], ['menu', 'القائمة'], ['settings', 'الإعدادات']],
        tiles: [['حجوزات اليوم', 'حجز'], ['ضيوف اليوم', 'مقعد'], ['بانتظار التأكيد', 'حجز'], ['إشغال اليوم', 'من السعة']],
        weekH: 'الضيوف — ٧ أيام قادمة', weekS: 'مجموع المقاعد المحجوزة كل يوم',
        zoneH: 'إشغال المناطق اليوم', zoneS: 'المقاعد المحجوزة مقابل السعة',
        nextH: 'الجاي بعد شوي', nextS: 'أقرب ٦ حجوزات اليوم', nextEmpty: 'ما ضل حجوزات اليوم.',
        liveOn: 'التحديث التلقائي شغّال', liveOff: 'التحديث متوقف', refresh: 'حدّث الآن',
        search: 'بحث بالاسم أو الرقم أو الكود', allStatus: 'كل الحالات',
        st: { pending: 'معلّق', confirmed: 'مؤكّد', seated: 'جالس', cancelled: 'ملغى', no_show: 'ما إجا' },
        cols: ['الكود', 'الاسم', 'الموبايل', 'التاريخ', 'الوقت', 'الضيوف', 'المنطقة', 'الطاولة', 'الحالة', ''],
        confirm: 'تأكيد', seat: 'جلّسه', cancel: 'إلغاء', noShow: 'ما إجا', del: 'حذف', wa: 'واتساب',
        empty: 'ما في حجوزات مطابقة.', exportCsv: 'تصدير CSV', seedBtn: 'بيانات تجريبية', clearBtn: 'مسح الحجوزات',
        clearQ: 'متأكد؟ بينمسح كل الحجوزات.',
        floorH: 'مخطط الطاولات', floorS: 'اسحب الطاولة لمكانها. التغييرات بتنحفظ لما تفلت.',
        addTable: 'أضف طاولة', tableLabel: 'الاسم', tableSeats: 'المقاعد', tableShape: 'الشكل',
        shapes: { round: 'دائرية', square: 'مربعة', booth: 'بوث' },
        saveTable: 'حفظ', delTable: 'حذف الطاولة', dragHint: 'اسحبني',
        menuH: 'أصناف القائمة', menuS: 'أضف، عدّل، أو أخفِ صنف عن الموقع.',
        addItem: 'أضف صنف', itemName: 'الاسم', itemDesc: 'الوصف', itemCat: 'الصنف',
        itemPrice: 'السعر (د.أ) — اتركه فاضي عشان يختفي', itemMood: 'المزاج', itemActive: 'ظاهر بالموقع',
        itemFeat: 'الأكثر طلباً', save: 'حفظ', saved: 'تم الحفظ',
        setH: 'إعدادات الحجز', setS: 'بتأثر على المواعيد والسعة على الموقع فوراً.',
        openT: 'وقت الفتح', closeT: 'وقت الإغلاق', slotT: 'الفاصل بين المواعيد (دقيقة)',
        holdT: 'مدة حجز الطاولة (دقيقة)', maxP: 'أقصى عدد أشخاص للحجز الواحد',
        phoneS: 'الهاتف', waS: 'واتساب (بصيغة 9627…)', igS: 'إنستقرام', addrS: 'العنوان',
        capNote: 'السعة بتتحسب تلقائياً من مجموع مقاعد الطاولات.',
        demoNote: 'وضع المعاينة — البيانات محفوظة بالمتصفح. حط بيانات Supabase بملف config.js عشان تشتغل فعلياً.',
        backSite: 'الموقع', total: 'المجموع'
      }
    },

    en: {
      dir: 'ltr', lang: 'en', other: 'عربي',
      nav: [['about', 'About'], ['menu', 'Menu'], ['mood', 'Your mood'], ['reviews', 'Reviews'], ['visit', 'Visit']],
      book: 'Reserve a table', menuBtn: 'See the menu', backTop: 'Top',

      openNow: 'Open now', closesAt: 'Closes ', shut: 'Closed now', opensAt: 'Opens ',
      heroEyebrow: 'Souq Yard · Princess Tharwat St · Amman',
      heroH1a: 'Specialty coffee,', heroH1b: 'and a table that lasts till late',
      heroP: 'A quiet coffee house in the heart of Souq Yard. Slow V60 and drip, bakery straight from the oven, and a shisha corner on the terrace — until one in the morning.',
      railStart: 'Day starts', railEnd: 'Last call',
      stats: [['4.4', 'Google rating'], ['110', 'reviews'], ['5–10', 'JD per person']],
      scrollHint: 'Scroll',

      aboutEy: 'Why people come back', aboutH: 'A room that lowers your shoulders',
      aboutP: 'Three different ways to sit under one roof — and a team guests name personally in their reviews.',
      cells: [
        ['Indoor', 'Warm light, low volume', 'Spaced tables, a quiet room, working Wi-Fi. Nobody rushes you out of your seat.'],
        ['Terrace & shisha', 'Outside, under the sky', 'A shisha corner on the terrace for an Amman evening, with the same coffee you get inside.'],
        ['Takeaway & delivery', 'On the move', 'Ready at the counter, or delivered from the same kitchen.'],
        ['Barista', 'Brewed properly', 'V60, drip and latte pulled to specialty standards — not just a cup of coffee.']
      ],

      menuEy: 'The menu', menuH: 'What are you drinking?',
      menuP: 'Search, or filter by category — the full list is at your table.',
      cats: { all: 'All', coffee: 'Coffee', tea: 'Tea', bakery: 'Bakery', dessert: 'Desserts', food: 'Food' },
      searchMenu: 'Search the menu…', noMatch: 'Nothing matches that.',
      featured: 'Most ordered',
      menuAvg: 'Average spend 5–10 JD per person', menuAvgSrc: 'reported by 43 Google visitors',

      moodEy: 'Mood finder', moodH: "Don't know what to order?",
      moodP: 'Three questions, and we pick your drink.',
      moodStart: "Let's go", moodAgain: 'Try again', moodStep: 'Question',
      moodQs: [
        ['How are you feeling?', [['calm', 'Calm — I want to slow down'], ['awake', 'Tired — wake me up'], ['cozy', 'I want something comforting']]],
        ['Sweet or plain?', [['sweet', 'Sweet'], ['plain', 'Plain']]],
        ['Hot or cold?', [['hot', 'Hot'], ['cold', 'Cold']]]
      ],
      moodResult: 'Our pick for you', moodBecause: 'because you chose',
      moodBook: 'Reserve a table and try it',

      revEy: 'Guest reviews', revH: '110 reviews on Google', revOf: 'of 5',
      revTags: ['Atmosphere', 'Hospitality', 'Shisha', 'Staff', 'Barista', 'Sweets'],
      revs: [
        ['The atmosphere is lovely and calm, the place is clean and the coffee is excellent. Special thanks to Emad for the welcome and the service — a real gentleman who treats guests with genuine care. I will definitely be back.', 'Basel Ahmad', '9 months ago'],
        ['A very pleasant place, and the staff go beyond excellent — especially Emad, who checked on us the whole time with such a kind manner. Thank you all.', 'Fares Altaamare', '9 months ago'],
        ['Really lovely place, the seating is relaxed and quiet, and the staff are kind and thoughtful. I loved the coffee, and the brownie is very good.', 'Wasan Baj', 'a year ago']
      ],

      bkEy: 'Reservations', bkH: 'Pick your own table',
      bkP: "Choose a day and a time, and you'll see the real floor plan — tap the table you want.",
      step: 'Step',
      s1: 'When?', s2: 'Where?', s3: 'Who?',
      fName: 'Name', fPhone: 'Mobile number', fDate: 'Date', fParty: 'Guests',
      fTime: 'Time', fNotes: 'Notes (optional)',
      fNotesPh: 'e.g. a table by the window, or a birthday',
      seatsLeft: 'tables free', noSlots: 'No times left today — pick another date.',
      pickTime: 'Pick a time and we will show you which tables are free.',
      floorFree: 'Free', floorTaken: 'Booked', floorSmall: 'Too small for your party', floorPicked: 'Your pick',
      anyTable: 'Any suitable table', anyTableSub: "We'll pick the best fit",
      tableN: 'Table', seatsN: 'seats', loadingMap: 'Loading the floor plan…',
      submit: 'Confirm reservation', sending: 'Saving…', person: 'guests',
      asideH: 'Before you book',
      asideRows: [['Hours', 'Daily · we close 1:00 AM'], ['Length', 'Tables are held for 90 minutes'],
                  ['Groups', 'More than 12? Talk to us directly'], ['Cancelling', "Tell us 2 hours ahead and we'll free the table"]],
      doneH: 'Done — your table is held', doneP: 'Keep your reference. The team will call to confirm.',
      doneTable: 'Your table', doneWA: 'Send details on WhatsApp', doneNew: 'New reservation',
      errors: {
        INVALID_NAME: 'Enter your name (2 letters minimum)',
        INVALID_PHONE: 'A Jordanian number like 0791234567',
        INVALID_DATE: 'Pick today or a later date',
        DATE_TOO_FAR: 'We take bookings up to two months ahead',
        INVALID_PARTY: 'Between 1 and 12 — for bigger groups, talk to us',
        CLOSED_AT_THAT_TIME: "We're closed at that time",
        NO_SUCH_TABLE: 'That table does not exist',
        TABLE_TOO_SMALL: 'That table is too small for your party — pick a bigger one',
        TABLE_TAKEN: 'Someone just took that table — pick another',
        NO_TABLE_FITS: 'No table fits your party at that time',
        NO_TIME: 'Pick a time',
        NO_TABLE: 'Pick a table on the plan',
        NETWORK: 'We could not reach the server — try again or message us on WhatsApp',
        DEFAULT: 'Something went wrong — try again'
      },

      visitEy: 'Visit', visitH: 'Where to find us',
      locRows: [['Address', 'address'], ['Plus code', 'plus'], ['Phone', 'phone'], ['Hours', 'hours']],
      hoursVal: 'Daily until 1:00 AM',
      openMaps: 'Open in Google Maps', callUs: 'Call us', waUs: 'WhatsApp',
      ftrTag: 'Coffee house · Souq Yard · Amman', ftrAdmin: 'Dashboard', rights: 'All rights reserved',
      demoBadge: 'Preview mode — bookings are stored in this browser only',

      a: {
        title: 'Dashboard', brand: 'Five₅ · Souq Yard',
        loginH: 'Sign in', loginP: 'Staff only.',
        email: 'Email', pass: 'Password', enter: 'Sign in', out: 'Sign out',
        loginDemo: 'Preview mode: any email and a 4-character password will open the dashboard.',
        badLogin: 'Wrong email or password',
        tabs: [['live', 'Today'], ['bookings', 'Bookings'], ['floor', 'Floor plan'], ['menu', 'Menu'], ['settings', 'Settings']],
        tiles: [["Today's bookings", 'bookings'], ['Guests today', 'seats'], ['Awaiting confirmation', 'bookings'], ['Occupancy today', 'of capacity']],
        weekH: 'Guests — next 7 days', weekS: 'Total seats booked per day',
        zoneH: 'Zone occupancy today', zoneS: 'Seats booked against capacity',
        nextH: 'Coming up', nextS: 'The next 6 bookings today', nextEmpty: 'Nothing else booked today.',
        liveOn: 'Auto-refresh on', liveOff: 'Auto-refresh off', refresh: 'Refresh now',
        search: 'Search name, number or code', allStatus: 'All statuses',
        st: { pending: 'Pending', confirmed: 'Confirmed', seated: 'Seated', cancelled: 'Cancelled', no_show: 'No show' },
        cols: ['Code', 'Name', 'Mobile', 'Date', 'Time', 'Guests', 'Zone', 'Table', 'Status', ''],
        confirm: 'Confirm', seat: 'Seat', cancel: 'Cancel', noShow: 'No show', del: 'Delete', wa: 'WhatsApp',
        empty: 'No bookings match.', exportCsv: 'Export CSV', seedBtn: 'Sample data', clearBtn: 'Clear bookings',
        clearQ: 'Are you sure? This deletes every booking.',
        floorH: 'Floor plan', floorS: 'Drag a table where it belongs. Changes save when you let go.',
        addTable: 'Add table', tableLabel: 'Label', tableSeats: 'Seats', tableShape: 'Shape',
        shapes: { round: 'Round', square: 'Square', booth: 'Booth' },
        saveTable: 'Save', delTable: 'Delete table', dragHint: 'drag me',
        menuH: 'Menu items', menuS: 'Add, edit, or hide an item from the site.',
        addItem: 'Add item', itemName: 'Name', itemDesc: 'Description', itemCat: 'Category',
        itemPrice: 'Price (JD) — leave empty to hide it', itemMood: 'Mood', itemActive: 'Visible on the site',
        itemFeat: 'Most ordered', save: 'Save', saved: 'Saved',
        setH: 'Booking settings', setS: 'These change the times and capacity on the site immediately.',
        openT: 'Opening time', closeT: 'Closing time', slotT: 'Minutes between slots',
        holdT: 'How long a table is held (minutes)', maxP: 'Maximum guests per booking',
        phoneS: 'Phone', waS: 'WhatsApp (9627… format)', igS: 'Instagram', addrS: 'Address',
        capNote: 'Capacity is calculated from the seats on the floor plan.',
        demoNote: 'Preview mode — data lives in this browser. Put your Supabase keys in config.js to go live.',
        backSite: 'Site', total: 'Total'
      }
    }
  };

  w.FV = w.FV || {};
  w.FV.T = T;
  w.FV.lang = (function () {
    try { var v = localStorage.getItem('fv_lang'); if (v === 'ar' || v === 'en') return v; } catch (e) {}
    return 'ar';
  })();
  w.FV.setLang = function (l) {
    w.FV.lang = l;
    try { localStorage.setItem('fv_lang', l); } catch (e) {}
  };
  w.FV.t = function () { return T[w.FV.lang]; };
})(window);
