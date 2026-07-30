
class Component extends DCLogic {
  constructor(props) {
    super(props);
    const d = this.seed(); d.families = []; d.enrollments = []; d.courses = []; if (d.events) d.events = [];
    const HD = 'אבגדה';
    for (const c of d.courses) if (!c.sessions) {
      const m = /(\d+)\s*(קבוצות|פעמים)/.exec(c.audience || '');
      const n = m ? Math.min(+m[1], 5) : 1;
      c.sessions = Array.from({ length: n }, (_, i) => ({ day: (c.weekday + i * 2) % 6, time: c.time, label: n > 1 ? (/פעמים/.test(m[2]) ? 'מפגש ' + (i + 1) : 'קבוצה ' + HD[i] + '׳') : '' }));
    }
    for (const c of d.courses) if (c.img) c.img = c.img.replace('assets/course-', 'assets/s-').replace(/\.png$/, '.jpg');
    try { const im = document.getElementById('img-data'); if (im) { const M = JSON.parse(im.textContent); for (const c of d.courses) if (c.img) { const k = c.img.split('/').pop(); if (M[k]) c.img = M[k]; } } } catch (err) {}
    this.state = { view: 'home', q: '', statusFilter: 'all', selId: null, modal: null,
      form: {}, memberForm: {}, formError: '', memberError: '', editingId: null, editingMemberId: null,
      confirmingId: null, toast: '', families: d.families, enrollments: d.enrollments, courses: d.courses, seq: 100,
      selCourseId: null, courseForm: {}, courseError: '', enrollForm: {}, enrollError: '', editingCourseId: null,
      calYear: new Date().getFullYear(), calMonth: new Date().getMonth(), events: d.events,
      orgName: 'מאור החסד', notif: { email: true, push: false, sms: true, strong: false }, eventForm: {}, eventError: '',
      paletteOpen: false, paletteQ: '', cityFilter: 'all', commFilter: 'all', rooms: d.rooms, editingEventId: null,
      orgSite: 'https://maor-hachesed.org.il', orgDonate: '', wheelOpen: false, wheelLocks: {}, wheelRot: 0,
      diaryRoomId: null, diaryDate: null, absEnrollId: null, absReason: '', absError: '',
      reports: { daily: true, weekly: true, monthly: false, quarterly: false },
      importKind: 'members', importSummary: null, importError: '', famView: 'list', crsView: 'grid', navHist: [], supporters: [], supQ: '',
      calHebMode: true, calHebAnchor: null };
    try { const z = parseFloat(localStorage.getItem('maorclean2_ui_scale')); if (z >= .8 && z <= 1.5) this.state.uiScale = z; } catch (e) {}
    try { const a = JSON.parse(localStorage.getItem('maorclean2_acc') || '{}'); if (a && typeof a === 'object') this.state.acc = a; } catch (e) {}
    try {
      const raw = localStorage.getItem('maorclean2_db') || 'null';
      let db = null;
      try { db = JSON.parse(raw); } catch (pe) { try { localStorage.setItem('maorclean2_db_corrupt', raw); } catch (e2) {} this._dbCorrupt = true; db = null; }
      if (db && db.v && db.v !== 1) { try { localStorage.setItem('maorclean2_db_corrupt', raw); } catch (e2) {} this._dbCorrupt = true; db = null; }
      if (db && Array.isArray(db.families) && db.families.length) {
        db.families.forEach((f, i) => { if (f && !f.id) f.id = 'fx' + i; if (f) { if (!Array.isArray(f.members)) f.members = []; if (!Array.isArray(f.docs)) f.docs = []; } });
        const seenIds = new Set();
        db.families = db.families.filter(f => f && f.id && !seenIds.has(f.id) && seenIds.add(f.id));
        Object.assign(this.state, {
          families: db.families, enrollments: db.enrollments || this.state.enrollments,
          courses: db.courses || this.state.courses, events: db.events || this.state.events,
          rooms: db.rooms || this.state.rooms, orgName: db.orgName || this.state.orgName,
          orgSite: db.orgSite ?? this.state.orgSite, orgDonate: db.orgDonate ?? '',
          notif: db.notif || this.state.notif, reports: db.reports || this.state.reports,
          seq: Math.max(db.seq || 0, 500),
          famView: (db.ui || {}).famView || 'list', crsView: (db.ui || {}).crsView || 'grid',
          supporters: Array.isArray(db.supporters) ? db.supporters : []
        });
        if (Array.isArray(db.teachers) && db.teachers.length) this._dbTeachers = db.teachers;
        this._fromDb = true;
      }
    } catch (e) {}
    if (this._dbTeachers) this.teachers = this._dbTeachers;
    window.__fsScale = this.state.uiScale || 1;
    if (!window.__fsPatched) {
      window.__fsPatched = true;
      const orig = React.createElement;
      React.createElement = function (type, props) {
        const f = window.__fsScale || 1;
        if (f !== 1 && props && props.style && props.style.fontSize) {
          const m = /^([\d.]+)px$/.exec(String(props.style.fontSize));
          if (m) props = { ...props, style: { ...props.style, fontSize: (parseFloat(m[1]) * f).toFixed(2) + 'px' } };
        }
        const args = [type, props];
        for (let i = 2; i < arguments.length; i++) args.push(arguments[i]);
        return orig.apply(React, args);
      };
    }
    this.fmtHD = new Intl.DateTimeFormat('he-u-ca-hebrew', { day: 'numeric' });
    this.fmtHM = new Intl.DateTimeFormat('he-u-ca-hebrew', { month: 'long' });
    this.fmtHY = new Intl.DateTimeFormat('he-u-ca-hebrew', { year: 'numeric' });
    this.fmtHE = new Intl.DateTimeFormat('en-u-ca-hebrew', { day: 'numeric', month: 'long' });
    this.fmtHEY = new Intl.DateTimeFormat('en-u-ca-hebrew', { day: 'numeric', month: 'long', year: 'numeric' });
    try {
      const tdy = this.isoOf(new Date());
      this.state.dayGate = localStorage.getItem('maorclean2_day') !== tdy;
      this.state.dayEndDraft = localStorage.getItem('maorclean2_dayend') || '17:00';
    } catch (e) { this.state.dayGate = false; this.state.dayEndDraft = '17:00'; }
  }
  componentDidMount() {
    try { document.documentElement.lang = 'he'; document.documentElement.dir = 'rtl'; } catch (e) {}
    if (this._dbCorrupt) setTimeout(() => this.t('⚠ הנתונים השמורים נמצאו פגומים — נשמר עותק בצד (maor_db_corrupt). שחזרו מגיבוי דרך ⬆ ייבוא'), 1500);
    this._kd = (e) => {
      if ((e.metaKey || e.ctrlKey) && (e.key === 'k' || e.key === 'K')) { e.preventDefault(); this.setState({ paletteOpen: !this.state.paletteOpen, paletteQ: '' }); }
      else if (e.key === 'Escape') { if (this.state.demoOn) this.stopDemo(); else if (this.state.paletteOpen) this.setState({ paletteOpen: false }); else if (this.state.modal) this.setState({ modal: null, evReturn: null, afterMember: null }); else if (this.state.wheelOpen) this.setState({ wheelOpen: false }); else if (this.state.famWheelOpen) this.setState({ famWheelOpen: false }); }
    };
    window.addEventListener('keydown', this._kd);
    this._car = setInterval(() => { if (this.state.view === 'home' && !this.state.modal) this.setState({ carIdx: (this.state.carIdx || 0) + 1 }); }, 5000);
    this._fs = () => this.setState({ fsOn: !!document.fullscreenElement });
    document.addEventListener('fullscreenchange', this._fs);
    this._dayTick = setInterval(() => {
      try {
        const today = this.isoOf(new Date());
        if (localStorage.getItem('maorclean2_day') === today && localStorage.getItem('maorclean2_autoexp') !== today) {
          const end = localStorage.getItem('maorclean2_dayend') || '17:00';
          const d0 = new Date();
          if (this.pad2(d0.getHours()) + ':' + this.pad2(d0.getMinutes()) >= end) {
            localStorage.setItem('maorclean2_autoexp', today);
            this.exportBackup();
            this.t('הגיעה שעת הסיום שהגדרתם — גיבוי סוף היום ירד אוטומטית ✓');
          }
        }
      } catch (e) {}
    }, 60000);
    const applyFams = (d) => {
      if (this.state.families.some(f => String(f.id).startsWith('fr'))) return;
      if (d && Array.isArray(d.families) && d.families.length) {
        const demo = this.state.families;
        for (const f of d.families) { if (!Array.isArray(f.members)) f.members = []; if (!Array.isArray(f.docs)) f.docs = []; if (!f.cred) f.cred = { score: 620 + (f.name.length * 37 + (f.city || '').length * 53) % 330, log: [] }; }
        this.setState({ families: d.families.concat(demo) });
        this.t('נטענו ' + d.families.length + ' משפחות מהקובץ האמיתי');
      }
    };
    {
      const supTag = document.getElementById('sup-data');
      if (supTag) { try {
        const sd = JSON.parse(supTag.textContent);
        if (sd && Array.isArray(sd.supporters) && sd.supporters.length) {
          const cur = this.state.supporters || [];
          if (!cur.length) this.setState({ supporters: sd.supporters });
          else {
            const key = (x) => String(x.phone || '').replace(/\D/g, '') || this.normName(x.name);
            const hm = new Map(sd.supporters.map(x => [key(x), x.hist]));
            let ch = 0;
            for (const sp of cur) if (!sp.hist) { const h = hm.get(key(sp)); if (h) { sp.hist = h; ch++; } }
            if (ch) this.setState({ supporters: cur });
          }
        }
      } catch (err) {} }
    }
    if (!this._fromDb) {
      const famTag = document.getElementById('fam-data');
      if (famTag) { try { applyFams(JSON.parse(famTag.textContent)); } catch (err) {} }
      else /* no demo data */;
    }
    try {
      const wTag = document.getElementById('widows-data');
      if (wTag) {
        const wd = JSON.parse(wTag.textContent);
        const have = this.state.families.filter(f => String(f.id).startsWith('wd'));
        if (wd && Array.isArray(wd.families) && wd.families.length && have.length !== wd.families.length) {
          for (const f of wd.families) { if (!Array.isArray(f.members)) f.members = []; if (!Array.isArray(f.docs)) f.docs = []; if (!f.cred) f.cred = { score: 620 + (f.name.length * 37 + (f.city || '').length * 53) % 330, log: [] }; }
          const keep = this.state.families.filter(f => !String(f.id).startsWith('wd'));
          this.setState({ families: wd.families.concat(keep) }, () => { try { this.persist(); } catch (e) {} });
          this.t('נוספו ' + wd.families.length + ' משפחות אלמנות · תאריך הוספה: תשפ"ו');
        }
      }
    } catch (err) {}
  }
  persist() {
    try {
      const s = this.state;
      this._saveOk = true;
      localStorage.setItem('maorclean2_db', JSON.stringify({ v: 1, savedAt: new Date().toISOString(), families: s.families, enrollments: s.enrollments, courses: s.courses, events: s.events, rooms: s.rooms, orgName: s.orgName, orgSite: s.orgSite, orgDonate: s.orgDonate, notif: s.notif, reports: s.reports, seq: s.seq, teachers: this.teachers, supporters: s.supporters, ui: { famView: s.famView, crsView: s.crsView } }));
    } catch (e) {
      this._saveOk = false;
      if (!this._warnedSave) { this._warnedSave = true; this.t('⚠ השמירה האוטומטית נכשלה (אחסון מלא או מצב פרטי) — הורידו גיבוי מלא עכשיו!'); }
    }
  }
  componentDidUpdate() {
    const s = this.state;
    const key = s.view + '|' + (s.selId || '') + '|' + (s.selCourseId || '') + '|' + (s.calDay || '');
    if (this._loc == null) { this._loc = key; this._locObj = { view: s.view, selId: s.selId, selCourseId: s.selCourseId, calDay: s.calDay }; }
    else if (key !== this._loc) {
      const prev = this._locObj;
      this._loc = key; this._locObj = { view: s.view, selId: s.selId, selCourseId: s.selCourseId, calDay: s.calDay };
      if (this._navBack) this._navBack = false;
      else { const h = (s.navHist || []).concat([prev]); if (h.length > 20) h.shift(); this.setState({ navHist: h }); }
    }
    clearTimeout(this._sv); this._sv = setTimeout(() => this.persist(), 500);
  }
  exportBackup() {
    this.persist();
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([localStorage.getItem('maorclean2_db') || '{}'], { type: 'application/json' }));
    a.download = 'maor-backup-' + this.isoOf(new Date()) + '.json'; a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 5000);
    this.t('גיבוי מלא ירד — כולל הכל: משפחות, שיבוצים, אירועים והגדרות');
  }
  applyBackup(txt) {
    try {
      const db = JSON.parse(txt);
      if (!db || !Array.isArray(db.families)) { this.setState({ importError: 'קובץ הגיבוי לא תקין (חסר families)', importSummary: null }); return; }
      db.families.forEach((f, i) => { if (f && !f.id) f.id = 'fb' + i; if (f) { if (!Array.isArray(f.members)) f.members = []; if (!Array.isArray(f.docs)) f.docs = []; } });
      const seenB = new Set();
      db.families = db.families.filter(f => f && f.id && !seenB.has(f.id) && seenB.add(f.id));
      if (Array.isArray(db.teachers) && db.teachers.length) this.teachers = db.teachers;
      this.setState({ families: db.families, enrollments: db.enrollments || [], courses: db.courses || this.state.courses, events: db.events || [], rooms: db.rooms || this.state.rooms, orgName: db.orgName || this.state.orgName, orgSite: db.orgSite ?? this.state.orgSite, orgDonate: db.orgDonate ?? '', notif: db.notif || this.state.notif, reports: db.reports || this.state.reports, famView: (db.ui || {}).famView || this.state.famView, crsView: (db.ui || {}).crsView || this.state.crsView, seq: Math.max(db.seq || 0, 500), modal: null, importError: '', importSummary: null });
      this._fromDb = true;
      this.t('הגיבוי שוחזר במלואו: ' + db.families.length + ' משפחות, ' + (db.enrollments || []).length + ' שיבוצים');
    } catch (e) { this.setState({ importError: 'שגיאה בקריאת הגיבוי: ' + e.message, importSummary: null }); }
  }
  componentWillUnmount() { window.removeEventListener('keydown', this._kd); clearInterval(this._car); clearInterval(this._dayTick); document.removeEventListener('fullscreenchange', this._fs); }
  exportImportFormat() {
    const s = this.state, kind = s.importKind || 'members';
    if (kind === 'backup') { this.exportBackup(); return; }
    if (kind === 'ayin') {
      const rows = [['תומכת', 'טלפון', 'שם למסירה', 'כמה עיניים', 'נמסר (כן/לא)', 'שולם (כן/לא)', 'תשובה/הערה', 'עופרת בוצעה (כן/לא)']];
      for (const sp of (s.supporters || [])) { const a = sp.ayin || {}; const lastAns = (a.answers || [])[0]; const leadDone = ['eyes', 'answer', 'done'].includes(a.stage) ? 'כן' : 'לא'; for (const n of (a.names || [])) rows.push([sp.name, sp.phone || '', n.name, (n.eyes === '' || n.eyes == null) ? '' : n.eyes, n.done ? 'כן' : 'לא', a.paid ? 'כן' : 'לא', (lastAns ? lastAns.note : (a.answeredNote || '')).replace(/,/g, ' '), leadDone]); }
      if (rows.length === 1) { this.t('אין שמות למסירה במערכת'); return; }
      this.csvDown('maor-ayin-eyes.csv', rows);
      this.t('ירד גיליון העיניים — מלאו את העמודות והחזירו ב-⬆ ייבוא');
      return;
    }
    if (kind === 'supporters') {
      const rows = [['שם', 'טלפון', 'אימייל', 'ת"ז', 'כתובת', 'קטגוריה', 'עבור']];
      for (const sp of (s.supporters || [])) rows.push([sp.name, sp.phone || '', sp.email || '', sp.idNum || '', sp.address || '', sp.cat || '', sp.forWho || '']);
      this.csvDown('maor-import-supporters.csv', rows);
      this.t('ירד קובץ תומכות בפורמט הייבוא — עריכה באקסל והחזרה ב-⬆ ייבוא');
      return;
    }
    if (kind === 'members') {
      const rows = [['שם משפחה', 'שם פרטי', 'תאריך לידה', 'מין', 'ת"ז', 'ת"ז הורה', 'טלפון', 'עיר']];
      for (const f of s.families) for (const m of f.members) if (!m.isParent) rows.push([f.name, m.first, m.birth || '', m.gender === 'f' ? 'בת' : 'בן', m.idNum || '', f.fatherId || f.motherId || '', f.phone || '', f.city || '']);
      this.csvDown('maor-import-members.csv', rows);
      this.t('ירד קובץ ילדים בפורמט הייבוא — אפשר לערוך באקסל ולהחזיר ב-⬆ ייבוא');
    } else {
      const rows = [['שם', 'ת"ז האב', 'טלפון האב', 'שם האם', 'ת"ז האם', 'טלפון האם', 'עיר', 'רחוב', 'מספר בית', 'מצב משפחתי', 'קהילה', 'מספר ילדים', 'הערות']];
      for (const f of s.families) rows.push([f.name, f.fatherId || '', f.phone || '', f.mother || '', f.motherId || '', f.phone2 || '', f.city || '', f.address || '', '', f.maritalStatus || '', f.community || '', f.members.filter(m => !m.isParent).length, (f.status === 'inactive' ? 'סטטוס: לא פעיל · ' : '') + (f.notes || '')]);
      this.csvDown('maor-import-families.csv', rows);
      this.t('ירד קובץ משפחות בפורמט הייבוא — עריכה באקסל והחזרה ב-⬆ ייבוא');
    }
  }
  seed() {
    const families = [
      { id:'f1', name:'כהן', father:'אברהם', mother:'רבקה', fatherId:'037128451', motherId:'', phone:'052-8371924', phone2:'02-5813674', email:'cohen.family@gmail.com', address:'חזון איש 12', city:'ירושלים', status:'active', notes:'משפחה ותיקה — זכאית להנחת אחים 10%.', docs:['ספח ת"ז — אב.pdf','אישור לימודים — משה.jpg'],
        members:[{id:'m1',first:'משה',gender:'m',birth:'2014-03-14'},{id:'m2',first:'שרה',gender:'f',birth:'2016-07-02'},{id:'m3',first:'דוד',gender:'m',birth:'2019-11-23'},{id:'m4',first:'תמר',gender:'f',birth:'2021-05-09'}] },
      { id:'f2', name:'לוי', father:'יעקב', mother:'מרים', fatherId:'', motherId:'214583676', phone:'054-6218753', phone2:'', email:'levi.mishpaha@gmail.com', address:'בית וגן 41', city:'ירושלים', status:'active', notes:'', docs:['ספח ת"ז — אם.pdf'],
        members:[{id:'m5',first:'יוסף',gender:'m',birth:'2013-01-18'},{id:'m6',first:'רחל',gender:'f',birth:'2015-09-30'},{id:'m7',first:'בנימין',gender:'m',birth:'2018-04-12'}] },
      { id:'f3', name:'מזרחי', father:'שלמה', mother:'יפה', fatherId:'', motherId:'', phone:'050-7439168', phone2:'', email:'', address:'הרב שך 8', city:'בני ברק', status:'active', notes:'לתאם הסעה לאיתן בימי שלישי.', docs:[],
        members:[{id:'m8',first:'אליה',gender:'m',birth:'2012-06-25'},{id:'m9',first:'נועה',gender:'f',birth:'2014-12-07'},{id:'m10',first:'איתן',gender:'m',birth:'2017-08-19'},{id:'m11',first:'הודיה',gender:'f',birth:'2020-02-28'},{id:'m12',first:'רועי',gender:'m',birth:'2022-10-05'}] },
      { id:'f4', name:'פרידמן', father:'מנחם', mother:'חנה', fatherId:'', motherId:'', phone:'053-3894621', phone2:'', email:'friedman.h@gmail.com', address:'רבי עקיבא 102', city:'בני ברק', status:'pending', notes:'ממתינים לאישור ועדת מלגות.', docs:['בקשת מלגה.pdf'],
        members:[{id:'m13',first:'צבי',gender:'m',birth:'2015-03-11'},{id:'m14',first:'אסתר',gender:'f',birth:'2017-06-08'}] },
      { id:'f5', name:'אברמוב', father:'דניאל', mother:'אולגה', fatherId:'304892151', motherId:'', phone:'058-5127436', phone2:'', email:'abramov.d@gmail.com', address:'יוספטל 3', city:'פתח תקווה', status:'active', notes:'', docs:[],
        members:[{id:'m15',first:'מיכאל',gender:'m',birth:'2013-10-02'},{id:'m16',first:'ליאה',gender:'f',birth:'2016-02-14'},{id:'m17',first:'יונתן',gender:'m',birth:'2019-07-21'}] },
      { id:'f6', name:'שרעבי', father:'עמרם', mother:'ברכה', fatherId:'', motherId:'', phone:'052-9146378', phone2:'', email:'', address:'שבזי 17', city:'ראש העין', status:'active', notes:'', docs:[],
        members:[{id:'m18',first:'אוריה',gender:'m',birth:'2014-08-16'},{id:'m19',first:'שילת',gender:'f',birth:'2016-11-03'},{id:'m20',first:'נהוראי',gender:'m',birth:'2020-01-26'}] },
      { id:'f7', name:'גולדשטיין', father:'אריה', mother:'דבורה', fatherId:'', motherId:'', phone:'054-2371589', phone2:'', email:'', address:'סורוצקין 24', city:'ירושלים', status:'inactive', notes:'עברו דירה — לוודא פרטי קשר מעודכנים.', docs:[],
        members:[{id:'m21',first:'שמעון',gender:'m',birth:'2011-04-04'},{id:'m22',first:'גיטל',gender:'f',birth:'2013-08-27'}] },
      { id:'f8', name:'בן דוד', father:'איציק', mother:'סיגל', fatherId:'', motherId:'058731464', phone:'050-6284917', phone2:'', email:'bendavid.s@gmail.com', address:'ההדס 5', city:'מודיעין עילית', status:'active', notes:'', docs:['ספח ת"ז — אם.pdf'],
        members:[{id:'m23',first:'אגם',gender:'f',birth:'2015-12-19'},{id:'m24',first:'ליאם',gender:'m',birth:'2018-03-06'},{id:'m25',first:'רומי',gender:'f',birth:'2021-09-14'}] },
      { id:'f9', name:'אוחיון', father:'מאיר', mother:'אילנה', fatherId:'', motherId:'', phone:'053-7418265', phone2:'', email:'', address:'קדושת לוי 9', city:'ביתר עילית', status:'pending', notes:'', docs:[],
        members:[{id:'m26',first:'אבישי',gender:'m',birth:'2012-02-09'},{id:'m27',first:'טליה',gender:'f',birth:'2014-05-30'},{id:'m28',first:'עומר',gender:'m',birth:'2017-10-11'},{id:'m29',first:'אלה',gender:'f',birth:'2021-12-01'}] }
    ];
    this.teachers = [ {id:'t1',name:'בלומה',phone:'052-7611234'},{id:'t2',name:'מירי',phone:'053-3102845'},{id:'t3',name:'פרידה',phone:'054-8447196'},{id:'t4',name:'שורי',phone:'050-4118362'},{id:'t5',name:'פייגי',phone:'052-7169284'},{id:'t6',name:'שרי',phone:'058-3247715'},{id:'t7',name:'שיינדי',phone:'053-3175529'},{id:'t8',name:'חיה אסתי',phone:'052-7648131'},{id:'t9',name:'שרה',phone:'050-4152978'},{id:'t10',name:'מלכה',phone:'054-8471263'},{id:'t11',name:'נעמי',phone:'052-7133846'},{id:'t12',name:'רבקי',phone:'053-3118657'},{id:'t13',name:'חיה',phone:'058-3292414'},{id:'t14',name:'דבורי',phone:'052-7145092'},{id:'t15',name:'דסי',phone:'050-4187345'},{id:'t16',name:'חומי',phone:'053-3156871'},{id:'t17',name:'נחמי',phone:'052-7192630'},{id:'t18',name:'שייני',phone:'054-8412598'},{id:'t19',name:'קיילה',phone:'058-3261947'} ];
    const CY = { start: '2025-09-01', end: '2026-07-31', semester: 'שנתי', sector: 'הכל', gender: 'f', ageMin: 16, ageMax: 99 };
    const IMG = { sew: 'assets/course-sewing.png', art: 'assets/course-art.png', eng: 'assets/course-english.png', fit: 'assets/course-fitness.png', epi: 'assets/course-epilation.png', ref: 'assets/course-reflexology.png', mus: 'assets/course-music.png', bak: 'assets/course-baking.png', gfx: 'assets/course-writing.png', emp: 'assets/course-empowerment.png' };
    const courses = [
      {...CY, id:'c1', name:'תפירה — בלומה', teacherId:'t1', roomId:'r2', weekday:0, time:'10:00', cat:'מלאכה', img:IMG.sew, model:'monthly', size:0, price:170, maxStudents:10, audience:'נשים', description:'חדר גדול · יום א׳ 10:00.'},
      {...CY, id:'c2', name:'אומנות — מירי', teacherId:'t2', roomId:'r2', weekday:1, time:'11:00', cat:'אמנות', img:IMG.art, model:'monthly', size:0, price:160, maxStudents:12, audience:'נשים', description:'חדר גדול · יום ב׳ 11:00.'},
      {...CY, id:'c3', name:'אנגלית — פרידה', teacherId:'t3', roomId:'r2', weekday:2, time:'17:00', cat:'העשרה', img:IMG.eng, model:'punch', size:12, price:240, maxStudents:24, audience:'3 קבוצות', ageMin:8, description:'3 קבוצות ברצף · יום ג׳ מ-17:00 · 12 מפגשים.'},
      {...CY, id:'c4', name:'התעמלות — תנועה זורמת (שורי)', teacherId:'t4', roomId:'r2', weekday:0, time:'19:00', cat:'ספורט', img:IMG.fit, model:'monthly', size:0, price:110, maxStudents:20, audience:'2 קבוצות', description:'2 קבוצות · יום א׳ 19:00/20:00.'},
      {...CY, id:'c5', name:'התעמלות — פילאטיס (פייגי)', teacherId:'t5', roomId:'r2', weekday:1, time:'20:00', cat:'ספורט', img:IMG.fit, model:'monthly', size:0, price:120, maxStudents:18, audience:'2 קבוצות', description:'2 קבוצות · יום ב׳ 20:00/21:00.'},
      {...CY, id:'c6', name:'התעמלות — עיצוב ושיקום (שרי)', teacherId:'t6', roomId:'r2', weekday:2, time:'09:00', cat:'ספורט', img:IMG.fit, model:'monthly', size:0, price:110, maxStudents:18, audience:'2 קבוצות', description:'2 קבוצות · יום ג׳ 09:00/10:00.'},
      {...CY, id:'c7', name:'התעמלות — שיקום (שיינדי)', teacherId:'t7', roomId:'r2', weekday:3, time:'09:00', cat:'ספורט', img:IMG.fit, model:'monthly', size:0, price:110, maxStudents:18, audience:'2 קבוצות', description:'2 קבוצות · יום ד׳ 09:00/10:00.'},
      {...CY, id:'c8', name:'ציור קרש-פנדה — חיה אסתי', teacherId:'t8', roomId:'r2', weekday:3, time:'17:30', cat:'אמנות', img:IMG.art, model:'monthly', size:0, price:160, maxStudents:12, audience:'כללי', gender:'all', ageMin:6, description:'חדר גדול · יום ד׳ 17:30.'},
      {...CY, id:'c9', name:'ציור שמן — שרה', teacherId:'t9', roomId:'r2', weekday:4, time:'11:00', cat:'אמנות', img:IMG.art, model:'monthly', size:0, price:180, maxStudents:10, audience:'נשים', description:'חדר גדול · יום ה׳ 11:00.'},
      {...CY, id:'c10', name:'אפילציה', teacherId:'', roomId:'r4', weekday:1, time:'18:00', cat:'טיפוח', img:IMG.epi, model:'monthly', size:0, price:200, maxStudents:6, audience:'נשים', description:'קליניקה · בתיאום תורים.'},
      {...CY, id:'c11', name:'רפלקסולוגיה — מלכה', teacherId:'t10', roomId:'r4', weekday:0, time:'09:30', cat:'רווחה', img:IMG.ref, model:'monthly', size:0, price:180, maxStudents:6, audience:'נשים', description:'קליניקה · יום א׳ 09:30.'},
      {...CY, id:'c12', name:'מסאז׳ — נעמי', teacherId:'t11', roomId:'r4', weekday:2, time:'10:00', cat:'רווחה', img:IMG.ref, model:'punch', size:10, price:200, maxStudents:8, audience:'נשים', description:'בנוסף: 2 כיסאות מסאז׳ בתורים לאורך כל היום — הזמנה דרך יומן הקליניקה.'},
      {...CY, id:'c13', name:'כינור — רבקי', teacherId:'t12', roomId:'r5', weekday:0, time:'16:00', cat:'מוזיקה', img:IMG.mus, model:'punch', size:12, price:240, maxStudents:6, audience:'כללי', gender:'all', ageMin:6, description:'אולפן · יום א׳ 16:00.'},
      {...CY, id:'c14', name:'גיטרה — חיה', teacherId:'t13', roomId:'r5', weekday:1, time:'16:00', cat:'מוזיקה', img:IMG.mus, model:'monthly', size:0, price:230, maxStudents:8, audience:'כללי', gender:'all', ageMin:6, description:'אולפן · יום ב׳ 16:00.'},
      {...CY, id:'c15', name:'פסנתר — דבורי', teacherId:'t14', roomId:'r5', weekday:2, time:'16:00', cat:'מוזיקה', img:IMG.mus, model:'punch', size:12, price:250, maxStudents:6, audience:'כללי', gender:'all', ageMin:6, description:'אולפן · יום ג׳ 16:00.'},
      {...CY, id:'c16', name:'אולפן הקלטות — דסי', teacherId:'t15', roomId:'r5', weekday:3, time:'18:00', cat:'מוזיקה', img:IMG.mus, model:'monthly', size:0, price:260, maxStudents:6, audience:'נשים', description:'אולפן · יום ד׳ 18:00.'},
      {...CY, id:'c17', name:'פיתוח קול — דסי', teacherId:'t15', roomId:'r5', weekday:3, time:'19:30', cat:'מוזיקה', img:IMG.mus, model:'monthly', size:0, price:220, maxStudents:8, audience:'נשים', description:'אולפן · יום ד׳ 19:30.'},
      {...CY, id:'c18', name:'גרפיקה — חומי', teacherId:'t16', roomId:'r5', weekday:4, time:'10:00', cat:'העשרה', img:IMG.gfx, model:'monthly', size:0, price:240, maxStudents:10, audience:'נשים', description:'אולפן · יום ה׳ 10:00 · מחשבים במקום.'},
      {...CY, id:'c19', name:'אורגנית — דבורי', teacherId:'t14', roomId:'r5', weekday:0, time:'18:00', cat:'מוזיקה', img:IMG.mus, model:'monthly', size:0, price:230, maxStudents:8, audience:'כללי', gender:'all', ageMin:8, description:'אולפן · יום א׳ 18:00.'},
      {...CY, id:'c20', name:'אורגנית — נחמי', teacherId:'t17', roomId:'r5', weekday:2, time:'18:30', cat:'מוזיקה', img:IMG.mus, model:'monthly', size:0, price:230, maxStudents:8, audience:'כללי', gender:'all', ageMin:8, description:'אולפן · יום ג׳ 18:30.'},
      {...CY, id:'c21', name:'אפייה — שייני', teacherId:'t18', roomId:'r3', weekday:1, time:'17:00', cat:'קולינרי', img:IMG.bak, model:'punch', size:12, price:200, maxStudents:10, audience:'נשים ונערות', ageMin:10, description:'מטבח · יום ב׳ 17:00 · 12 מפגשים.'},
      {...CY, id:'c22', name:'אפייה — קיילה', teacherId:'t19', roomId:'r3', weekday:3, time:'11:00', cat:'קולינרי', img:IMG.bak, model:'punch', size:12, price:200, maxStudents:10, audience:'נשים ונערות', ageMin:9, description:'מטבח · יום ד׳ 11:00 · 12 מפגשים.'},
      {...CY, id:'c23', name:'ארוחות בוקר — מגובש שבועי', teacherId:'', roomId:'r3', weekday:0, time:'09:00', cat:'קולינרי', img:IMG.bak, model:'monthly', size:0, price:80, maxStudents:25, audience:'קהילתי', description:'3 פעמים בשבוע — ימים א׳, ג׳, ה׳ 09:00 · מטבח.'}
    ];
    const enrollments = [
      {id:'e1',memberId:'m1',courseId:'c13',plan:'punch',purchased:12,used:5},
      {id:'e2',memberId:'m2',courseId:'c8',plan:'monthly',purchased:0,used:7},
      {id:'e16',memberId:'m3',courseId:'c8',plan:'monthly',purchased:0,used:4},
      {id:'e3',memberId:'m5',courseId:'c3',plan:'punch',purchased:12,used:11},
      {id:'e4',memberId:'m6',courseId:'c21',plan:'punch',purchased:12,used:4},
      {id:'e5',memberId:'m8',courseId:'c15',plan:'punch',purchased:12,used:3},
      {id:'e6',memberId:'m9',courseId:'c8',plan:'monthly',purchased:0,used:6},
      {id:'e7',memberId:'m10',courseId:'c3',plan:'punch',purchased:12,used:12},
      {id:'e8',memberId:'m13',courseId:'c14',plan:'monthly',purchased:0,used:2},
      {id:'e9',memberId:'m15',courseId:'c3',plan:'punch',purchased:12,used:11},
      {id:'e10',memberId:'m16',courseId:'c21',plan:'punch',purchased:12,used:8},
      {id:'e11',memberId:'m18',courseId:'c13',plan:'punch',purchased:12,used:1},
      {id:'e12',memberId:'m19',courseId:'c22',plan:'punch',purchased:12,used:2},
      {id:'e13',memberId:'m23',courseId:'c15',plan:'punch',purchased:12,used:5},
      {id:'e14',memberId:'m26',courseId:'c14',plan:'monthly',purchased:0,used:6},
      {id:'e15',memberId:'m27',courseId:'c22',plan:'punch',purchased:12,used:9}
    ];
    for (const e of enrollments) e.absences = [];
    enrollments.find(e => e.id === 'e7').absences.push({ date: '2026-07-06', reason: 'מחלה', makeup: false });
    const events = [
      { id: 'ev1', title: 'ישיבת צוות חודשית', date: '2026-07-19', time: '09:30', type: 'org', notes: '', price: 0, roomId: 'r2' },
      { id: 'ev2', title: 'ערב הוקרה למתנדבים', date: '2026-07-28', time: '19:00', type: 'org', notes: '', price: 1500, roomId: 'r1' },
      { id: 'ev3', title: 'חידוש ביטוח צד ג׳', date: '2026-08-03', time: '', type: 'reminder', notes: '', price: 0, roomId: '' },
      { id: 'ev4', title: 'פתיחת רישום תשפ"ז', date: '2026-08-16', time: '10:00', type: 'org', notes: '', price: 0, roomId: 'r1' }
    ];
    const extra = { f1:['ליטאי','נשואים','עברית','קופת העיר',true,'הנחת אחים 10%'], f2:['חסידי','נשואים','יידיש','ועד הצדקה',true,''], f3:['ספרדי','נשואים','עברית','',false,''], f4:['חסידי','נשואים','יידיש','קופת העיר',false,'מלגה בבדיקה'], f5:['דוברי רוסית','נשואים','רוסית','',true,''], f6:['ספרדי','נשואים','עברית','',true,''], f7:['ליטאי','אלמן/ה','עברית','ועד הצדקה',false,''], f8:['כללי','גרושים','עברית','',false,''], f9:['ספרדי','נשואים','צרפתית','קופת העיר',false,''] };
    for (const f of families) { const x = extra[f.id]; f.community = x[0]; f.maritalStatus = x[1]; f.language = x[2]; f.tzedaka = x[3]; f.fullSefach = x[4]; f.discount = x[5]; }
    const rooms = [
      {id:'r1',name:'משרד',active:true,slot:60},
      {id:'r11',name:'כסא מסאז׳ 1',active:true,slot:60},
      {id:'r12',name:'כסא מסאז׳ 2',active:true,slot:60},
      {id:'r2',name:'חדר גדול',active:true,slot:60,eq:{'מראות':true,'הגברה':true,'שולחנות מתקפלים':true}},
      {id:'r3',name:'מטבח',active:true,slot:60,eq:{'מטבח מאובזר':true}},
      {id:'r4',name:'קליניקה',active:true,slot:60,notes:'שני כיסאות מסאז׳ — תורים לאורך כל היום דרך היומן'},
      {id:'r5',name:'אולפן',active:true,slot:60,eq:{'פסנתר':true,'הגברה':true,'מחשבים':true}},
      {id:'r6',name:'חדר בריחה',active:false,slot:90,location:'המקום החדש',notes:'בהקמה'},
      {id:'r7',name:'חדר ג׳קוזי',active:false,slot:45,location:'המקום החדש',notes:'בהקמה'},
      {id:'r8',name:'חדר ירידים',active:false,slot:60,location:'המקום החדש',notes:'בגדים וחלוקת מתנות'},
      {id:'r9',name:'חדר אוכל',active:false,slot:60,location:'המקום החדש',notes:'בהקמה'},
      {id:'r10',name:'חדר הרצאות',active:false,slot:60,location:'המקום החדש',notes:'בהקמה'}
    ];

    const mx = { m1:{school:'ת"ת אור החיים',grade:'ה׳',sefach:true,photos:true}, m5:{school:'ת"ת דרכי אבות',grade:'ז׳',phone:'055-6712893',sefach:true,recommend:true}, m8:{school:'ישיבת נר משה',grade:'ח׳',phone:'058-3321417',invite:true}, m9:{school:'בית יעקב',grade:'ו׳',photos:true}, m23:{school:'חורב בנות',grade:'ד׳'} };
    for (const f of families) for (const m of f.members) { const x = mx[m.id] || {}; m.phone = x.phone || ''; m.phone2 = ''; m.school = x.school || ''; m.grade = x.grade || ''; m.health = ''; m.mSefach = !!x.sefach; m.mInvite = !!x.invite; m.mRecommend = !!x.recommend; m.mPhotos = !!x.photos; m.mVideos = false; }
    const credSeed = { f1: 962, f2: 838, f3: 812, f4: 545, f5: 762, f6: 705, f7: 468, f8: 795, f9: 588 };
    for (const f of families) f.cred = { score: credSeed[f.id] != null ? credSeed[f.id] : 700, log: [] };
    events.push({ id: 'ev5', title: 'להתקשר למשפחת פרידמן — סטטוס מלגה', date: this.isoOffset(2), time: '10:00', type: 'call', notes: '', priority: 'red' });
    events.push({ id: 'ev6', title: 'לחזור לגב׳ אוחיון — רישום לגיטרה', date: this.isoOffset(0), time: '12:30', type: 'call', notes: '' });
    events.push({ id: 'ev7', title: 'חתונת הבת של משפחת לוי', date: '2026-08-05', time: '19:30', type: 'wedding', notes: '', price: 0, roomId: '', famId: 'f2' });
    events.push({ id: 'ev8', title: 'אזכרה — ר׳ אברהם כהן ז"ל', date: '2025-07-30', time: '18:00', type: 'memorial', notes: 'עלייה לקבר ולימוד משניות', price: 0, roomId: '', famId: 'f1', priority: 'orange' });
    events.push({ id: 'ev9', title: 'יום נישואים — משפחת אברמוב', date: '2013-07-16', time: '', type: 'anniversary', notes: '', price: 0, roomId: '', famId: 'f5' });
    return { families, enrollments, courses, events, rooms };
  }
  t(m) { clearTimeout(this._tt); this.setState({ toast: m }); this._tt = setTimeout(() => this.setState({ toast: '' }), 2600); }
  age(b) { if (!b) return null; const d = new Date(b), n = new Date(); let a = n.getFullYear() - d.getFullYear(); const md = n.getMonth() - d.getMonth(); if (md < 0 || (md === 0 && n.getDate() < d.getDate())) a--; return a; }
  fmtD(iso) { if (!iso) return '—'; return new Date(iso).toLocaleDateString('he-IL'); }
  validId(v) { if (!/^\d{5,9}$/.test(v)) return false; const p = v.padStart(9, '0'); let s = 0; for (let i = 0; i < 9; i++) { let d = +p[i] * (i % 2 === 0 ? 1 : 2); s += Math.floor(d / 10) + (d % 10); } return s % 10 === 0; }
  stMeta(s) { return { active: ['פעילה', '#e4f5ea', '#12803c'], pending: ['ממתינה', '#fdf1d4', '#9a6414'], inactive: ['לא פעילה', '#eceae2', '#8b8474'] }[s] || ['—', '#eceae2', '#8b8474']; }
  punch(eid) {
    const en = this.state.enrollments.find(e => e.id === eid); if (!en) return;
    if (en.status === 'paused') { this.t('השיבוץ מוקפא — הפשירו אותו בניהול השיבוץ (⚙)'); return; }
    if (en.status === 'ended') { this.t('השיבוץ הסתיים — ניתן לחדש בניהול השיבוץ (⚙)'); return; }
    if (en.plan === 'punch' && en.used >= en.purchased) { this.t('אין יתרת שיעורים — נדרש חידוש כרטיסייה'); return; }
    if ((this.props.punchConfirm ?? false) && this.state.confirmingId !== eid) {
      this.setState({ confirmingId: eid }); clearTimeout(this._ct);
      this._ct = setTimeout(() => this.setState({ confirmingId: null }), 3000); return;
    }
    en.used++; this.setState({ enrollments: this.state.enrollments, confirmingId: null }); this.t('הניקוב נרשם בהצלחה');
    const famC = this.state.families.find(f => f.members.some(m => m.id === en.memberId));
    if (famC) this.credEvent(famC.id, 5, 'נוכחות (Check-in)');
  }
  openFam(id) {
    const r = (this.state.recentIds || []).filter(x => x !== id);
    r.unshift(id);
    this.setState({ selId: id, view: 'families', recentIds: r.slice(0, 6) });
  }
  openRoomSet(id) {
    const room = (this.state.rooms || []).find(r => r.id === id); if (!room) return;
    this.setState({ modal: 'roomset', roomSetId: id, roomError: '', roomForm: {
      name: room.name || '', activeSel: room.active ? 'yes' : 'no', slot: String(room.slot || 60), cap: String(room.cap || ''),
      location: room.location || '', rate: String(room.rate || ''), from: room.from || '08:00', to: room.to || '20:00',
      accessSel: room.access ? 'yes' : 'no', notes: room.notes || '', eq: { ...(room.eq || {}) } } });
  }
  saveRoomSet() {
    const s = this.state, f = s.roomForm;
    if (!f.name || !f.name.trim()) { this.setState({ roomError: 'שם החדר הוא שדה חובה' }); return; }
    const fields = { name: f.name.trim(), active: f.activeSel === 'yes', slot: +f.slot || 60, cap: +f.cap || 0,
      location: f.location || '', rate: +f.rate || 0, from: f.from || '08:00', to: f.to || '20:00',
      access: f.accessSel === 'yes', notes: f.notes || '', eq: f.eq || {} };
    if (s.roomSetId === '__new') {
      s.rooms.push({ id: 'r' + s.seq, ...fields });
      this.setState({ rooms: s.rooms, seq: s.seq + 1, modal: null, roomError: '' });
      this.t('החדר "' + fields.name + '" נוסף בהצלחה');
      return;
    }
    const room = (s.rooms || []).find(r => r.id === s.roomSetId);
    if (!room) return;
    Object.assign(room, fields);
    this.setState({ rooms: s.rooms, modal: null, roomError: '' });
    this.t('הגדרות החדר "' + room.name + '" נשמרו');
  }
  sessionsOf(c) { return c ? ((c.sessions && c.sessions.length) ? c.sessions : [{ day: c.weekday, time: c.time, label: '' }]) : []; }
  tierOf(sc) {
    if (sc >= 950) return ['titan', 'טיטאן', '#fdf3dd', '#9a6414', '#f3c76b'];
    if (sc >= 800) return ['lion', 'לביאה', '#e4f5ea', '#12803c', '#16a34a'];
    if (sc >= 500) return ['pale', 'טעון שיפור', '#fdf1d4', '#9a6414', '#d97706'];
    return ['red', 'סיכון נטישה', '#fdeaea', '#b91c1c', '#dc2626'];
  }
  credEvent(famId, delta, desc) {
    const f = this.state.families.find(x => x.id === famId); if (!f) return;
    f.cred = f.cred || { score: 700, log: [] };
    if (!Array.isArray(f.cred.log)) f.cred.log = [];
    if (typeof f.cred.score !== 'number') f.cred.score = 700;
    const last3 = f.cred.log.slice(0, 3);
    const tf = last3.length ? 0.8 + 0.4 * (last3.filter(e => e.delta > 0).length / last3.length) : 1;
    const applied = Math.round(delta * tf);
    const before = this.tierOf(f.cred.score)[0];
    f.cred.score = Math.max(0, Math.min(1000, f.cred.score + applied));
    f.cred.log.unshift({ date: this.isoOf(new Date()), delta: applied, desc: desc + (tf !== 1 ? ' (TrendFactor ' + tf.toFixed(1) + ')' : '') });
    if (f.cred.log.length > 20) f.cred.log.length = 20;
    if (this.tierOf(f.cred.score)[0] === 'red' && before !== 'red') this.t('התראה למנהל: משפחת ' + f.name + ' ירדה לסטטוס אדום — SMS/מייל יישלחו בגרסה המחוברת');
    this.setState({ families: this.state.families });
  }
  runDecay() {
    const cutoff = this.isoOffset(-14); let n = 0;
    for (const f of this.state.families) {
      f.cred = f.cred || { score: 700, log: [] };
      const last = f.cred.log[0];
      if (!last || last.date < cutoff) { f.cred.score = Math.max(0, f.cred.score - 2); f.cred.log.unshift({ date: this.isoOf(new Date()), delta: -2, desc: 'Decay — חוסר פעילות 14+ ימים' }); n++; }
    }
    this.setState({ families: this.state.families });
    this.t('Batch יומי הורץ: הפחתת אי-פעילות (-2) ל-' + n + ' משפחות');
  }
  emptyForm() { return { name: '', phone: '', father: '', fatherId: '', mother: '', motherId: '', phone2: '', email: '', address: '', city: '', status: 'active', notes: '', maritalStatus: '', language: 'עברית', community: 'חסידי', tzedaka: '', fullSefach: 'no', discount: '' }; }
  saveFamily() {
    const f = this.state.form;
    if (!f.name || !f.name.trim()) { this.setState({ formError: 'שם משפחה הוא שדה חובה' }); return; }
    if (f.maritalStatus === '__other' && !(f.maritalOther || '').trim()) { this.setState({ formError: 'בחרתם "אחר" במצב משפחתי — הקלידו את הערך' }); return; }
    if (f.fatherId && !this.validId(f.fatherId)) { this.setState({ formError: 'ת"ז האב אינה תקינה (ספרת ביקורת שגויה)' }); return; }
    if (f.motherId && !this.validId(f.motherId)) { this.setState({ formError: 'ת"ז האם אינה תקינה (ספרת ביקורת שגויה)' }); return; }
    if (f.language === '__other' && !(f.langOther || '').trim()) { this.setState({ formError: 'בחרתם שפה "אחר" — הקלידו את השפה' }); return; }
    const patch = { ...f, fullSefach: f.fullSefach === true || f.fullSefach === 'yes', maritalStatus: f.maritalStatus === '__other' ? (f.maritalOther || '').trim() : f.maritalStatus, language: f.language === '__other' ? (f.langOther || '').trim() : f.language, community: (f.community || '').trim() || 'כללי' };
    delete patch.maritalOther; delete patch.communityOld; delete patch.langOther;
    const fams = this.state.families;
    if (this.state.editingId) {
      const ex = fams.find(x => x.id === this.state.editingId); Object.assign(ex, patch);
      this.setState({ families: fams, modal: null, formError: '' }); this.t('פרטי המשפחה עודכנו');
    } else {
      const id = 'f' + this.state.seq;
      fams.unshift({ ...this.emptyForm(), ...patch, id, members: [], docs: [], createdAt: this.isoOf(new Date()) });
      this.setState({ families: fams, modal: null, formError: '', seq: this.state.seq + 1, selId: id, view: 'families', recentIds: [id, ...(this.state.recentIds || [])].slice(0, 6) }); this.t('משפחת ' + f.name + ' נוצרה');
    }
  }
  saveMember() {
    const m = this.state.memberForm;
    if (!m.first || !m.first.trim()) { this.setState({ memberError: 'שם פרטי הוא שדה חובה' }); return; }
    if (m.idNum && !this.validId(m.idNum)) { this.setState({ memberError: 'מספר ת"ז אינו תקין (ספרת ביקורת שגויה)' }); return; }
    const fam = this.state.families.find(x => x.id === this.state.selId); if (!fam) return;
    if (this.state.editingMemberId) {
      const ex = fam.members.find(x => x.id === this.state.editingMemberId); Object.assign(ex, m);
      this.setState({ modal: null, memberError: '', mbMode: 'greg', hbDay: '', hbMonth: '', hbYear: '' }); this.t('פרטי ' + m.first + ' עודכנו');
    } else {
      const nid = 'm' + this.state.seq;
      fam.members.push({ ...m, id: nid });
      if (this.state.afterMember === 'join') {
        this.setState({ memberError: '', seq: this.state.seq + 1, modal: 'join', afterMember: null, joinError: '', jmQ: null, jcQ: null, joinForm: { memberId: nid, courseId: '', purchased: '' } });
        this.t(m.first + ' נוסף/ה — ממשיכים בשיבוץ מאותה נקודה');
      } else {
        this.setState({ modal: null, memberError: '', seq: this.state.seq + 1, mbMode: 'greg', hbDay: '', hbMonth: '', hbYear: '' }); this.t(m.first + ' נוסף/ה למשפחה');
      }
    }
  }
  allMembers() { const out = []; for (const f of this.state.families) for (const m of f.members) out.push({ ...m, famName: f.name, famId: f.id }); return out; }
  planWord(plan) { return { punch: 'כרטיסייה', monthly: 'מנוי חודשי', half_year: 'מנוי חצי-שנתי', year: 'מנוי שנתי' }[plan] || 'מנוי חודשי'; }
  pricePer(c) { return c.model === 'punch' ? ' לכרטיסייה' : c.model === 'half_year' ? ' לחצי שנה' : c.model === 'year' ? ' לשנה' : ' לחודש'; }
  gradeLabel(g) { return { gan: 'גן', '1': 'א׳', '2': 'ב׳', '3': 'ג׳', '4': 'ד׳', '5': 'ה׳', '6': 'ו׳', '7': 'ז׳', '8': 'ח׳', '9': 'ט׳', '10': 'י׳', '11': 'י״א', '12': 'י״ב' }[String(g)] || ''; }
  gradeRange(c) { const a = this.gradeLabel(c.gradeMin), b = this.gradeLabel(c.gradeMax); if (!a && !b) return ''; return a && b ? (a === b ? a : a + '–' + b) : (a || b); }
  emptyCourseForm() { return { name: '', teacherId: 't1', description: '', gradeMin: '', gradeMax: '', price: '', price1: '', price2: '', price1Name: '', price2Name: '', model: 'monthly', size: '', start: '2025-09-01', end: '2026-07-31', roomId: 'r2', weekday: '0', time: '17:00', maxStudents: '12', gender: 'f', ageMin: '', ageMax: '', cat: 'העשרה', catOther: '', newTeacherName: '', newTeacherPhone: '', semester: 'שנתי', semesterOther: '' }; }
  saveCourse() {
    const f = this.state.courseForm;
    if (!f.name || !f.name.trim()) { this.setState({ courseError: 'שם הקורס הוא שדה חובה' }); return; }
    if (f.price && (isNaN(+f.price) || +f.price < 0)) { this.setState({ courseError: 'המחיר חייב להיות מספר חיובי' }); return; }
    if (f.model === 'punch' && (!f.size || +f.size <= 0)) { this.setState({ courseError: 'בכרטיסייה יש להגדיר מספר ניקובים גדול מ-0' }); return; }
    const cs = this.state.courses;
    const patch = { ...f, price: +f.price || 0, price1: +f.price1 || 0, price2: +f.price2 || 0, price1Name: (f.price1Name || '').trim(), price2Name: (f.price2Name || '').trim(), size: +f.size || 0, weekday: Math.min(5, Math.max(0, +f.weekday || 0)), time: f.time || '17:00',
      maxStudents: +f.maxStudents || 12, ageMin: f.ageMin === '' ? 3 : Math.max(0, +f.ageMin || 0), ageMax: f.ageMax === '' ? 99 : Math.max(1, +f.ageMax || 99) };
    delete patch.newTeacherName; delete patch.newTeacherPhone;
    if (f.cat === '__other') {
      if (!(f.catOther || '').trim()) { this.setState({ courseError: 'בחרתם קטגוריה "אחר" — הקלידו אותה' }); return; }
      patch.cat = f.catOther.trim();
    }
    delete patch.catOther;
    if (f.semester === '__other') {
      if (!(f.semesterOther || '').trim()) { this.setState({ courseError: 'בחרתם מסלול "אחר" — הקלידו את שם המסלול' }); return; }
      patch.semester = f.semesterOther.trim();
    }
    delete patch.semesterOther;
    let seqExtra = 0;
    if (f.teacherId === '__add') {
      const tn = (f.newTeacherName || '').trim();
      if (!tn) { this.setState({ courseError: 'בחרתם "הוספת מורה" — הקלידו את שם המורה' }); return; }
      const exT = this.teachers.find(t => t.name === tn);
      if (exT) patch.teacherId = exT.id;
      else { const nt = { id: 't' + this.state.seq, name: tn, phone: this.fixPhone((f.newTeacherPhone || '').trim()) }; this.teachers.push(nt); patch.teacherId = nt.id; seqExtra = 1; }
    }
    if (patch.ageMax < patch.ageMin) { this.setState({ courseError: '"עד גיל" חייב להיות גדול מ"מגיל"' }); return; }
    const room = this.state.rooms.find(r => r.id === patch.roomId);
    const roomWarn = room && !room.active ? ' ⚠ שימו לב: החדר כבוי (מצב סימולציה — יופיע ב"דורש טיפול" עד הפעלתו)' : '';
    if (this.state.editingCourseId) {
      const ex = cs.find(x => x.id === this.state.editingCourseId);
      Object.assign(ex, patch);
      if (ex.sessions && ex.sessions.length) { ex.sessions[0].day = patch.weekday; ex.sessions[0].time = patch.time; }
      this.setState({ courses: cs, modal: null, courseError: '', seq: this.state.seq + seqExtra }); this.t('הקורס עודכן — משתקף ביומן ' + (room ? room.name : 'החדר') + ' ובלוח' + roomWarn);
    } else {
      const id = 'c' + this.state.seq;
      cs.unshift({ sector: 'הכל', ...patch, id });
      this.setState({ courses: cs, modal: null, courseError: '', seq: this.state.seq + 1 + seqExtra, selCourseId: id, view: 'courses' }); this.t('הקורס "' + f.name + '" נוצר — נכנס ליומן ' + (room ? room.name : 'החדר') + ', ללוח ולגלגל' + roomWarn);
    }
  }
  saveEnroll() {
    const f = this.state.enrollForm, c = this.state.courses.find(x => x.id === this.state.selCourseId);
    if (!f.memberId) { this.setState({ enrollError: 'יש לבחור תלמיד/ה' }); return; }
    if (String(f.memberId).startsWith('__pf:') || String(f.memberId).startsWith('__pm:')) {
      const isF = String(f.memberId).startsWith('__pm:');
      const famX = this.state.families.find(x => x.id === String(f.memberId).slice(5));
      if (!famX) { this.setState({ enrollError: 'המשפחה לא נמצאה' }); return; }
      const pm = { id: 'mp' + this.state.seq, first: (isF ? famX.mother : famX.father) || (isF ? 'אמא' : 'אבא'), gender: isF ? 'f' : 'm', birth: '', idNum: '', phone: '', phone2: '', school: '', grade: '', health: '', mSefach: false, mInvite: false, mRecommend: false, mPhotos: false, mVideos: false, notes: '', isParent: true };
      famX.members.push(pm);
      this.state.seq++;
      f.memberId = pm.id;
    }
    if (this.state.enrollments.filter(e => e.courseId === c.id).length >= (c.maxStudents || 999)) { this.setState({ enrollError: 'הקורס מלא — הגעתם למקסימום התלמידים שהוגדר' }); return; }
    const isPunch = c.model === 'punch', purchased = isPunch ? +(f.purchased || c.size) : 0;
    if (isPunch && (isNaN(purchased) || purchased <= 0)) { this.setState({ enrollError: 'מספר ניקובים חייב להיות גדול מ-0' }); return; }
    this.state.enrollments.push({ id: 'e' + this.state.seq, memberId: f.memberId, courseId: c.id, plan: c.model, purchased, used: 0, group: f.group || '', absences: [], enrolledAt: this.isoOf(new Date()) });
    this.setState({ enrollments: this.state.enrollments, modal: null, enrollError: '', seq: this.state.seq + 1 });
    this.t('התלמיד/ה שובצ/ה לקורס');
  }
  static HOLIDAYS = { 'Tishri 1': 'ראש השנה', 'Tishri 2': 'ראש השנה ב׳', 'Tishri 10': 'יום כיפור', 'Tishri 15': 'סוכות', 'Tishri 21': 'הושענא רבה', 'Tishri 22': 'שמחת תורה', 'Kislev 25': 'חנוכה', 'Tevet 10': 'צום עשרה בטבת', 'Shevat 15': 'ט״ו בשבט', 'Adar 14': 'פורים', 'Adar II 14': 'פורים', 'Nisan 15': 'פסח', 'Nisan 21': 'שביעי של פסח', 'Iyar 18': 'ל״ג בעומר', 'Sivan 6': 'שבועות', 'Tamuz 17': 'צום י״ז בתמוז', 'Av 9': 'תשעה באב', 'Av 15': 'ט״ו באב', 'Elul 29': 'ערב ראש השנה' };
  gem(n) {
    n = +n; if (!n) return '';
    const U = ['', 'א', 'ב', 'ג', 'ד', 'ה', 'ו', 'ז', 'ח', 'ט'],
      T = ['', 'י', 'כ', 'ל', 'מ', 'נ', 'ס', 'ע', 'פ', 'צ'],
      H = ['', 'ק', 'ר', 'ש', 'ת', 'תק', 'תר', 'תש', 'תת', 'תתק'];
    let s = H[Math.floor(n / 100)] || '', r = n % 100;
    if (r === 15) s += 'טו'; else if (r === 16) s += 'טז'; else s += T[Math.floor(r / 10)] + U[r % 10];
    return s.length === 1 ? s + '׳' : s.slice(0, -1) + '״' + s.slice(-1);
  }
  gemYear(y) { return this.gem(+y % 1000); }
  hebDateFull(iso) { if (!iso) return ''; const d = new Date(iso); if (isNaN(d)) return ''; return this.gem(this.hebParts(d).day) + ' ' + this.fmtHM.format(d) + ' ' + this.gemYear(this.fmtHY.format(d)); }
  static XLAT = {
    'כהן': ['cohen', 'kohen', 'коэн'], 'לוי': ['levi', 'леви'], 'מזרחי': ['mizrahi', 'мизрахи'], 'פרידמן': ['fridman', 'friedman', 'фридман'], 'אברמוב': ['abramov', 'абрамов'], 'שרעבי': ['sharabi', 'шараби'], 'גולדשטיין': ['goldstein', 'гольдштейн'], 'בן דוד': ['bendavid', 'ben david', 'бен давид'], 'אוחיון': ['ohayon', 'охайон'],
    'משה': ['moshe', 'моше', 'מוישי', 'מוישה'], 'שרה': ['sara', 'sarah', 'сара', 'שרהלה'], 'דוד': ['david', 'давид', 'דודי'], 'תמר': ['tamar', 'тамар'], 'יוסף': ['yosef', 'иосиф', 'יוסי'], 'רחל': ['rachel', 'рахель', 'רחלי'], 'בנימין': ['binyamin', 'беньямин', 'בני'], 'נועה': ['noa', 'ноа'], 'איתן': ['eitan', 'эйтан'], 'הודיה': ['hodaya'], 'מיכאל': ['michael', 'михаил', 'מיכי'], 'ליאה': ['lea', 'лея'], 'יונתן': ['yonatan', 'йонатан', 'יוני'], 'אבישי': ['avishai'], 'טליה': ['talia', 'талия'], 'עומר': ['omer'], 'אגם': ['agam'], 'ליאם': ['liam'], 'רומי': ['romi'], 'אליה': ['eliya', 'элия'], 'צבי': ['zvi', 'цви'], 'אסתר': ['esther', 'эстер', 'אסתי'],
    'כינור': ['violin', 'скрипка'], 'גיטרה': ['guitar', 'гитара'], 'פסנתר': ['piano', 'пианино', 'פסנטר'], 'אורגנית': ['organ', 'орган', 'אורגן'], 'מסאז׳': ['massage', 'массаж', 'מסאז', 'עיסוי'], 'גרפיקה': ['graphics', 'графика'], 'פיתוח קול': ['vocal', 'שירה'], 'אומנות': ['art', 'אמנות'],
    'צילום': ['photo', 'photography', 'фото', 'מצלמה'], 'ספרות': ['writing', 'литература', 'כתיבה', 'ספר'], 'אפייה': ['baking', 'выпечка', 'בישול', 'קונדיטוריה'], 'אנגלית': ['english', 'английский', 'שפה'], 'העצמה': ['empowerment', 'ביטחון עצמי'], 'התעמלות': ['fitness', 'гимнастика', 'ספורט', 'כושר', 'ג׳ים'], 'רפלקסולוגיה': ['reflexology', 'рефлексология', 'עיסוי'], 'ציור': ['art', 'рисование', 'אמנות', 'יצירה'], 'תפירה': ['sewing', 'шитьё', 'מחט'], 'אפילציה': ['epilation', 'эпиляция', 'טיפוח'], 'מוזיקה': ['music', 'музыка', 'נגינה', 'כינור', 'גיטרה', 'אורגנית'],
    'ירושלים': ['jerusalem', 'иерусалим'], 'בני ברק': ['bnei brak', 'бней брак'], 'פתח תקווה': ['petah tikva', 'петах тиква'], 'ראש העין': ['rosh haayin'], 'מודיעין עילית': ['modiin illit'], 'ביתר עילית': ['beitar illit']
  };
  norm(t) { return String(t || '').toLowerCase().replace(/[\u0591-\u05C7]/g, '').replace(/[ךםןףץ]/g, (ch) => ({ 'ך': 'כ', 'ם': 'מ', 'ן': 'נ', 'ף': 'פ', 'ץ': 'צ' })[ch]).replace(/['"׳״\-–._]/g, '').trim(); }
  smartRank(q, items) {
    const nq = this.norm(q);
    if (!nq) return items.slice(0, 7);
    const toks = nq.split(/\s+/).filter(Boolean);
    const scored = [];
    for (const it of items) {
      let tot = 0, ok = true;
      for (const tk of toks) { let best = 0; for (const tm of it.nterms) { best = Math.max(best, this.scoreTerm(tk, tm)); if (best >= 100) break; } if (!best) { ok = false; break; } tot += best; }
      if (ok) scored.push({ it, sc: tot / toks.length });
    }
    return scored.sort((a, b) => b.sc - a.sc).slice(0, 7).map(x => x.it);
  }
  lev(a, b, max) {
    const la = a.length, lb = b.length;
    if (Math.abs(la - lb) > max) return -1;
    const dp = []; for (let j = 0; j <= lb; j++) dp[j] = j;
    for (let i = 1; i <= la; i++) {
      let prev = dp[0]; dp[0] = i; let rowMin = dp[0];
      for (let j = 1; j <= lb; j++) { const tmp = dp[j]; dp[j] = Math.min(dp[j] + 1, dp[j - 1] + 1, prev + (a[i - 1] === b[j - 1] ? 0 : 1)); prev = tmp; rowMin = Math.min(rowMin, dp[j]); }
      if (rowMin > max) return -1;
    }
    return dp[lb] <= max ? dp[lb] : -1;
  }
  scoreTerm(q, t) {
    if (!q || !t) return 0;
    if (t === q) return 100;
    if (t.startsWith(q)) return 80;
    if (q.length >= 4 && (q.endsWith('ים') || q.endsWith('ות'))) { const q2 = q.slice(0, -2); if (t === q2 || t.startsWith(q2)) return 70; }
    if (q.length >= 2 && t.includes(q)) return 62;
    if (q.length >= 3) {
      const sq = q.replace(/[יו]/g, ''), st = t.replace(/[יו]/g, '');
      if (sq.length >= 2 && sq === st) return 58;
      const d = this.lev(q, t, t.length >= 6 ? 2 : 1);
      if (d >= 0) return 52 - d * 4;
    }
    return 0;
  }
  pad2(n) { return String(n).padStart(2, '0'); }
  isoOffset(days) { const d = new Date(); d.setDate(d.getDate() + days); return this.isoOf(d); }
  isoOf(d) { return d.getFullYear() + '-' + this.pad2(d.getMonth() + 1) + '-' + this.pad2(d.getDate()); }
  hebParts(d) { const o = {}; for (const x of this.fmtHE.formatToParts(d)) o[x.type] = x.value; return o; }
  hebToIso(day, monKey, hy) {
    const start = new Date(hy - 3761, 5, 1);
    for (let i = 0; i < 500; i++) {
      const dd = new Date(start.getFullYear(), start.getMonth(), start.getDate() + i);
      const p = {}; for (const x of this.fmtHEY.formatToParts(dd)) p[x.type] = x.value;
      if (+p.year === hy && p.month === monKey && +p.day === day) return this.isoOf(dd);
    }
    return '';
  }
  hb2FromIso(iso) { if (!iso) return { d: '', m: '', y: '' }; const p = {}; for (const x of this.fmtHEY.formatToParts(new Date(iso + 'T12:00:00'))) p[x.type] = x.value; return { d: p.day, m: p.month, y: p.year }; }
  hb2Sel(iso, apply) {
    const base = iso ? this.hb2FromIso(iso) : this.hb2FromIso(this.isoOf(new Date()));
    const mk = (k) => (e) => {
      const t = { ...base, [k]: e.target.value };
      if (t.d && t.m && t.y) { const niso = this.hebToIso(+t.d, t.m, +t.y); if (niso) apply(niso); else this.t('התאריך העברי הזה לא קיים בשנה שנבחרה'); }
    };
    return { d: String(base.d || ''), m: base.m || '', y: String(base.y || ''), setD: mk('d'), setM: mk('m'), setY: mk('y') };
  }
  hbChange(k, v) {
    const s = this.state;
    const hb = { hbDay: s.hbDay || '', hbMonth: s.hbMonth || '', hbYear: s.hbYear || '' };
    hb[k] = v;
    const st = { [k]: v };
    if (hb.hbDay && hb.hbMonth && hb.hbYear) {
      const iso = this.hebToIso(+hb.hbDay, hb.hbMonth, +hb.hbYear);
      if (iso) { st.memberForm = { ...s.memberForm, birth: iso }; }
      else this.t('התאריך העברי הזה לא קיים בשנה שנבחרה');
    }
    this.setState(st);
  }
  dayEvents(d) {
    const iso = this.isoOf(d), out = [], hp = this.hebParts(d);
    const hol = Component.HOLIDAYS[hp.month + ' ' + hp.day];
    if (hol) out.push({ label: hol, title: hol, bg: '#e4f5ea', c: '#12803c', type: 'חג ומועד', sort: 0, prC: 'transparent' });
    for (const ev of this.state.events) {
      if (ev.done || !ev.date) continue;
      const meta = this.evMeta(ev.type);
      let hit = ev.date === iso;
      if (!hit && meta.recur && iso > ev.date) { const C = this._hpc || (this._hpc = {}); const oh = C[ev.date] || (C[ev.date] = this.hebParts(new Date(ev.date + 'T12:00:00'))); hit = oh.month === hp.month && oh.day === hp.day; }
      if (!hit) continue;
      const prC = ev.priority === 'red' ? '#dc2626' : ev.priority === 'orange' ? '#d97706' : ev.priority === 'green' ? '#16a34a' : 'transparent';
      out.push({ label: (ev.time ? ev.time + ' · ' : '') + ev.title, title: ev.title + (ev.famId ? this.famSuffix(ev.famId) : ''), time: ev.time, bg: meta.bg, c: meta.c, type: ev.customType || meta.label, sort: ev.priority === 'red' ? 0.5 : 1, ev, prC,
        nav: (evt) => { if (evt && evt.stopPropagation) evt.stopPropagation(); if (ev.famId && this.state.families.some(f2 => f2.id === ev.famId)) this.openFam(ev.famId); else this.openEventEdit(ev); } });
    }
    for (const f of this.state.families) for (const m of f.members) if (m.birth && m.birth.slice(5) === iso.slice(5)) out.push({ label: 'יום הולדת · ' + m.first, title: 'יום הולדת: ' + m.first + ' (משפחת ' + f.name + ')', famId: f.id, bg: '#fbeef3', c: '#be185d', type: 'יום הולדת', sort: 2, prC: 'transparent', nav: (evt) => { if (evt && evt.stopPropagation) evt.stopPropagation(); this.openFam(f.id); } });
    for (const f of this.state.families) if (f.createdAt === iso) out.push({ label: 'הצטרפות · ' + f.name, title: 'הצטרפות משפחת ' + f.name + ' למערכת', famId: f.id, bg: '#e7edf5', c: '#3a5a86', type: 'הצטרפות', sort: 2.4, joinKind: true, prC: 'transparent', nav: (evt) => { if (evt && evt.stopPropagation) evt.stopPropagation(); this.openFam(f.id); } });
    for (const e of this.state.enrollments) {
      if (e.enrolledAt !== iso) continue;
      let em = null, ef = null;
      for (const f of this.state.families) { const x = f.members.find(mm => mm.id === e.memberId); if (x) { em = x; ef = f; break; } }
      const ec = this.state.courses.find(x => x.id === e.courseId);
      if (!em || !ec) continue;
      out.push({ label: 'הרשמה · ' + em.first, title: 'הרשמה לחוג: ' + em.first + ' (' + (ef ? 'משפחת ' + ef.name : '') + ') ← ' + ec.name, bg: '#eef7e6', c: '#3f6212', type: 'הרשמה לחוג', sort: 2.6, joinKind: true, prC: 'transparent', nav: (evt) => { if (evt && evt.stopPropagation) evt.stopPropagation(); this.setState({ view: 'courses', selCourseId: ec.id }); } });
    }
    for (const c of this.state.courses) if ((!c.start || iso >= c.start) && (!c.end || iso <= c.end)) for (const ss of this.sessionsOf(c)) if (ss.day === d.getDay()) out.push({ label: (ss.time ? ss.time + ' · ' : '') + c.name + (ss.label ? ' · ' + ss.label : ''), title: c.name + (ss.label ? ' — ' + ss.label : ''), time: ss.time, cid: c.id, bg: '#fdf1d4', c: '#9a6414', type: 'מפגש קורס', sort: 3, session: true, prC: 'transparent', nav: (evt) => { if (evt && evt.stopPropagation) evt.stopPropagation(); this.setState({ view: 'courses', selCourseId: c.id }); } });
    return out.sort((a, b) => a.sort - b.sort);
  }
  allowE(e) {
    const cf = this.state.calFilters || {};
    const on = (k) => cf[k] !== false;
    if (this.state.calUrgentOnly && !(e.ev && e.ev.priority === 'red')) return false;
    if (e.session) return on('courses');
    if (e.joinKind) return on('joins');
    if (e.sort === 0) return on('holidays');
    if (e.sort === 2) return on('bdays');
    if (e.ev) {
      const t = e.ev.type;
      if (t === 'reminder') return on('reminders');
      if (t === 'call') return on('calls');
      if (t === 'org') return on('org');
      return on('family');
    }
    return true;
  }
  buildCal() {
    const s = this.state, y = s.calYear, mo = s.calMonth;
    const hebMode = !!s.calHebMode;
    let first, gridStart, count = 42, hmStart = null, hmEnd = null;
    if (hebMode) {
      const anchor = new Date((s.calHebAnchor || this.isoOf(new Date())) + 'T12:00:00');
      const hp0 = this.hebParts(anchor);
      first = new Date(anchor); first.setDate(first.getDate() - (+hp0.day - 1));
      let dim = 29;
      const d30 = new Date(first); d30.setDate(d30.getDate() + 29);
      if (this.hebParts(d30).month === hp0.month) dim = 30;
      hmStart = this.isoOf(first);
      const lastH = new Date(first); lastH.setDate(lastH.getDate() + dim - 1);
      hmEnd = this.isoOf(lastH);
      gridStart = new Date(first); gridStart.setDate(gridStart.getDate() - first.getDay());
      count = Math.ceil((first.getDay() + dim) / 7) * 7;
      const prevD = new Date(first); prevD.setDate(prevD.getDate() - 1);
      const nextD = new Date(first); nextD.setDate(nextD.getDate() + dim);
      this._hebNav = { prevIso: this.isoOf(prevD), nextIso: this.isoOf(nextD), first, lastH };
    } else {
      first = new Date(y, mo, 1); gridStart = new Date(y, mo, 1 - first.getDay());
      this._hebNav = null;
    }
    const todayIso = this.isoOf(new Date());
    const cells = [];
    for (let i = 0; i < count; i++) {
      const d = new Date(gridStart.getFullYear(), gridStart.getMonth(), gridStart.getDate() + i);
      const iso = this.isoOf(d), inMonth = hebMode ? (iso >= hmStart && iso <= hmEnd) : d.getMonth() === mo, isToday = iso === todayIso;
      const evs = this.dayEvents(d).filter(e => this.allowE(e)), hp = this.hebParts(d);
      cells.push({ dayNum: hebMode ? (d.getDate() + '.' + (d.getMonth() + 1)) : String(d.getDate()), open: () => this.setState({ calDay: iso, calMonth: d.getMonth(), calYear: d.getFullYear() }),
        hebDay: hebMode ? this.gem(hp.day) : (this.gem(hp.day) + (hp.day === '1' ? ' ' + this.fmtHM.format(d) : '')),
        bg: isToday ? 'rgba(243,199,107,.3)' : inMonth ? 'rgba(255,255,255,.55)' : 'rgba(255,255,255,.2)',
        numBg: isToday ? '#b45309' : 'transparent', numC: isToday ? '#fff' : inMonth ? '#4d463c' : '#b3ab9c',
        pills: evs.slice(0, 3), hasMore: evs.length > 3, moreLabel: '+' + (evs.length - 3) + ' נוספים' });
    }
    const last = new Date(y, mo + 1, 0);
    const m1 = this.fmtHM.format(first), m2 = this.fmtHM.format(last);
    const upcoming = [];
    const start = new Date();
    const monFmt = new Intl.DateTimeFormat('he', { month: 'short' });
    for (let i = 0; i < 30 && upcoming.length < 8; i++) {
      const d = new Date(start.getFullYear(), start.getMonth(), start.getDate() + i);
      for (const e of this.dayEvents(d)) {
        if (e.session || upcoming.length >= 8 || !this.allowE(e)) continue;
        upcoming.push({ day: this.gem(this.hebParts(d).day), mon: this.fmtHM.format(d), title: e.title,
          sub: this.fmtD(this.isoOf(d)) + (e.time ? ' · ' + e.time : ''),
          typeLabel: e.type, bg: e.bg, c: e.c, prC: e.prC || 'transparent',
          isEv: !!e.ev, isCall: !!(e.ev && e.ev.type === 'call'), nav: e.nav || null, hasNav: !!e.nav,
          edit: e.ev ? ((evt) => { if (evt && evt.stopPropagation) evt.stopPropagation(); this.openEventEdit(e.ev); }) : null,
          markDone: e.ev ? ((evt) => { if (evt && evt.stopPropagation) evt.stopPropagation(); e.ev.done = true; this.setState({ events: this.state.events }); this.t('השיחה סומנה כבוצעה'); }) : null });
      }
    }
    if (hebMode) {
      const lastH = this._hebNav.lastH;
      return { cells, upcoming, noUpcoming: upcoming.length === 0,
        monthLabel: this.fmtD(this.isoOf(first)) + ' – ' + this.fmtD(this.isoOf(lastH)),
        hebMonthLabel: this.fmtHM.format(first) + ' ' + this.gemYear(this.fmtHY.format(first)) };
    }
    return { cells, upcoming, noUpcoming: upcoming.length === 0,
      monthLabel: new Intl.DateTimeFormat('he', { month: 'long', year: 'numeric' }).format(first),
      hebMonthLabel: (m1 === m2 ? m1 : m1 + '–' + m2) + ' ' + this.gemYear(this.fmtHY.format(last)) };
  }
  saveEvent() {
    const f = this.state.eventForm;
    if (!f.title || !f.title.trim()) { this.setState({ eventError: 'כותרת היא שדה חובה' }); return; }
    if (!f.date) { this.setState({ eventError: 'יש לבחור תאריך' }); return; }
    if (f.type === '__other' && !(f.typeOther || '').trim()) { this.setState({ eventError: 'בחרתם סוג "אחר" — הקלידו את סוג האירוע' }); return; }
    if (f.roomId && f.time) {
      const hr = parseInt(f.time);
      const clashEv = this.state.events.find(x => !x.done && x.id !== this.state.editingEventId && x.roomId === f.roomId && x.date === f.date && parseInt(x.time || '-1') === hr);
      if (clashEv) { this.setState({ eventError: 'החדר תפוס בשעה זו: "' + clashEv.title + '" — בחרו שעה או חדר אחרים' }); return; }
      const dowE = new Date(f.date + 'T12:00:00').getDay();
      const clashC = this.state.courses.find(c => c.roomId === f.roomId && (!c.start || f.date >= c.start) && (!c.end || f.date <= c.end) && this.sessionsOf(c).some(ss => ss.day === dowE && parseInt(ss.time) === hr));
      if (clashC) { this.setState({ eventError: 'בשעה זו מתקיים החוג "' + clashC.name + '" בחדר הזה — בחרו שעה או חדר אחרים' }); return; }
    }
    if ((f.type || 'org') === 'org') {
      const br = this.blockReason(new Date(f.date + 'T12:00:00'), 'misc');
      if (br) { this.setState({ eventError: 'התאריך חסום לתזמון אירועים: ' + br }); return; }
    }
    const pf = { ...f, price: +f.price || 0 };
    let clashWarn = '';
    if (f.time) { const hr2 = parseInt(f.time); const other = this.state.events.find(x => !x.done && x.id !== this.state.editingEventId && x.date === f.date && x.time && parseInt(x.time) === hr2); if (other) clashWarn = ' · ⚠ התנגשות עם "' + other.title + '" בשעה ' + other.time; }
    if (pf.type === '__other') { pf.type = 'custom'; pf.customType = (f.typeOther || '').trim(); } else pf.customType = '';
    delete pf.typeOther;
    const ret = this.state.evReturn;
    const back = ret ? { modal: 'diary', diaryRoomId: ret.roomId, diaryDate: ret.date, evReturn: null } : { modal: null, evReturn: null };
    if (this.state.editingEventId) {
      const ex = this.state.events.find(x => x.id === this.state.editingEventId); Object.assign(ex, pf);
      this.setState({ events: this.state.events, eventError: '', editingEventId: null, ...back }); this.t('האירוע עודכן' + clashWarn);
    } else {
      this.state.events.push({ ...pf, id: 'ev' + this.state.seq });
      this.setState({ events: this.state.events, eventError: '', seq: this.state.seq + 1, ...back });
      this.t((ret ? 'ההזמנה נכנסה — המשבצת מסומנת תפוסה ביומן' : 'האירוע נוסף ללוח') + clashWarn);
    }
  }
  blockReason(d, kind) {
    const dow = d.getDay();
    if (dow === 6) return 'שבת';
    if (kind === 'course' && dow === 5) return 'יום שישי (שעתיים לפני שבת)';
    const hp = this.hebParts(d), hol = Component.HOLIDAYS[hp.month + ' ' + hp.day];
    const FULL = ['ראש השנה', 'ראש השנה ב׳', 'יום כיפור', 'סוכות', 'שמחת תורה', 'פסח', 'שביעי של פסח', 'שבועות', 'תשעה באב'];
    if (hol && FULL.includes(hol)) return hol;
    if (kind === 'course') { const dd = +hp.day; if ((hp.month === 'Tishri' && dd >= 16 && dd <= 21) || (hp.month === 'Nisan' && dd >= 16 && dd <= 20)) return 'חול המועד'; }
    return null;
  }
  nextSession(c) {
    if (!c) return null;
    const n = new Date(); let best = null;
    for (const ss of this.sessionsOf(c)) {
      if (ss.day == null) continue;
      const t = (ss.time || '17:00').split(':');
      const d = new Date(n.getFullYear(), n.getMonth(), n.getDate(), +t[0], +t[1] || 0);
      let add = (ss.day - d.getDay() + 7) % 7;
      if (add === 0 && d <= n) add = 7;
      d.setDate(d.getDate() + add);
      if (!best || d < best) best = d;
    }
    return best;
  }
  saveAbsence() {
    const s = this.state, en = s.enrollments.find(e => e.id === s.absEnrollId);
    if (!en) return;
    if (!s.absReason || !s.absReason.trim()) { this.setState({ absError: 'נימוק הוא שדה חובה' }); return; }
    const c = s.courses.find(x => x.id === en.courseId);
    const ns = this.nextSession(c), eligible = ns ? (ns - new Date()) / 3600000 >= 48 : false;
    const kind = s.absKind || 'cancel';
    en.absences = en.absences || [];
    en.absences.push({ date: this.isoOf(new Date()), reason: s.absReason.trim(), makeup: eligible && kind !== 'noshow', noshow: kind === 'noshow' });
    if ((kind === 'noshow' || !eligible) && en.plan === 'punch' && en.used < en.purchased) en.used++;
    this.setState({ enrollments: s.enrollments, modal: null, absReason: '', absError: '' });
    const famA = this.state.families.find(fx => fx.members.some(m => m.id === en.memberId));
    if (famA) {
      if (kind === 'noshow') this.credEvent(famA.id, -20, 'No-Show: ' + (c ? c.name : ''));
      else if (!eligible) this.credEvent(famA.id, -10, 'ביטול מאוחר (<48 שעות)');
      else this.credEvent(famA.id, 0, 'ביטול מוקדם — שימור ניקוד');
    }
    this.t(kind === 'noshow' ? 'No-Show נרשם (-20 אמינות)' : eligible ? 'החיסור נרשם — זכאי/ת להשלמה' : 'החיסור נרשם' + (en.plan === 'punch' ? ' והניקוב ירד' : ''));
  }
  genReport(freq) {
    const s = this.state, allM = this.allMembers();
    const low = s.enrollments.filter(e => e.plan === 'punch' && e.purchased - e.used <= 2);
    const abs = s.enrollments.reduce((a, e) => a + (e.absences || []).length, 0);
    const L = ['דו"ח ' + freq + ' — ' + (s.orgName || 'מאור החסד'),
      'הופק: ' + this.hebDateFull(this.isoOf(new Date())) + ' · ' + new Date().toLocaleString('he-IL'),
      'נמענים: בעל אירוע + אחראי כללי · ערוצים: מייל + אזור אישי', '',
      'משפחות: ' + s.families.length + ' (' + s.families.filter(f => f.status === 'active').length + ' פעילות, ' + s.families.filter(f => f.status === 'pending').length + ' ממתינות)',
      'תלמידים: ' + allM.length + ' · שיבוצים: ' + s.enrollments.length + ' · חוגים: ' + s.courses.length,
      'חיסורים מתועדים: ' + abs, '', 'יתרות נמוכות (' + low.length + '):'];
    for (const e of low) { const m = allM.find(x => x.id === e.memberId) || {}; const c = s.courses.find(x => x.id === e.courseId) || {}; L.push('  • ' + (m.first || '') + ' ' + (m.famName || '') + ' — ' + (c.name || '') + ': ' + (e.purchased - e.used) + '/' + e.purchased); }
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob(['\uFEFF' + L.join('\n')], { type: 'text/plain;charset=utf-8' }));
    a.download = 'maor-report-' + freq + '.txt'; a.click();
    this.t('הדו"ח ה' + freq + ' הופק וירד למחשב');
  }
  parseCSVText(t) {
    const rows = []; let row = [], cur = '', q = false;
    for (let i = 0; i < t.length; i++) {
      const ch = t[i];
      if (q) {
        if (ch === '"' && t[i + 1] === '"') { cur += '"'; i++; }
        else if (ch === '"' && (i + 1 >= t.length || t[i + 1] === ',' || t[i + 1] === '\n' || t[i + 1] === '\r')) q = false;
        else cur += ch;
      } else {
        if (ch === '"' && cur === '') q = true;
        else if (ch === ',') { row.push(cur); cur = ''; }
        else if (ch === '\n' || ch === '\r') { if (ch === '\r' && t[i + 1] === '\n') i++; row.push(cur); cur = ''; if (row.some(c => c.trim() !== '')) rows.push(row); row = []; }
        else cur += ch;
      }
    }
    if (cur !== '' || row.length) { row.push(cur); if (row.some(c => c.trim() !== '')) rows.push(row); }
    return rows;
  }
  normName(s) { return this.norm(s).replace(/\s/g, ''); }
  numMatch(q, n) {
    q = String(q || '').trim(); if (!q) return true;
    let m = q.match(/^(\d+)\s*\+$/); if (m) return n >= +m[1];
    m = q.match(/^(\d+)\s*-\s*(\d+)$/); if (m) return n >= +m[1] && n <= +m[2];
    if (/^\d+$/.test(q)) return n === +q;
    return true;
  }
  parseAnyDate(v) {
    v = String(v || '').trim(); if (!v) return '';
    if (/^\d{4}-\d{2}-\d{2}$/.test(v)) return v;
    const m = v.match(/^(\d{1,2})[./-](\d{1,2})[./-](\d{2,4})$/);
    if (m) { let y = +m[3]; if (y < 100) y += y > 26 ? 1900 : 2000; return y + '-' + this.pad2(+m[2]) + '-' + this.pad2(+m[1]); }
    if (/^\d{4,5}$/.test(v)) { const b = new Date(Date.UTC(1899, 11, 30)); b.setUTCDate(b.getUTCDate() + +v); return b.toISOString().slice(0, 10); }
    return '';
  }
  handleImportFile(file) {
    if (this.state.importKind === 'backup' || /\.json$/i.test(file.name || '')) {
      const rj = new FileReader(); rj.onload = () => this.applyBackup(String(rj.result)); rj.readAsText(file, 'utf-8'); return;
    }
    const go = (txt) => { try { this.processImport(txt); } catch (err) { this.setState({ importError: 'שגיאה בקריאת הקובץ: ' + err.message, importSummary: null }); } };
    const rd = new FileReader();
    rd.onload = () => {
      const txt = String(rd.result);
      if (txt.includes('\uFFFD')) { const r2 = new FileReader(); r2.onload = () => go(String(r2.result)); r2.readAsText(file, 'windows-1255'); }
      else go(txt);
    };
    rd.readAsText(file, 'utf-8');
  }
  processImport(txt) {
    const s = this.state, rows = this.parseCSVText(txt);
    if (rows.length < 2) { this.setState({ importError: 'הקובץ ריק או לא בפורמט CSV', importSummary: null }); return; }
    const header = rows[0].map(h => (h || '').trim());
    const clean = (x) => (x || '').replace(/\s+/g, ' ').trim();
    const hIdx = (keys) => header.findIndex(h => keys.some(k => h.includes(k)));
    if (s.importKind === 'ayin') {
      const iSup = hIdx(['תומכת', 'תומך']), iNm = hIdx(['שם למסירה', 'שם לעופרת', 'שם']), iEyes = hIdx(['עיניים']), iDone = hIdx(['נמסר']), iPaid = hIdx(['שולם', 'תשלום']), iAns = hIdx(['תשובה', 'הערה']), iLead = hIdx(['עופרת']);
      if (iNm < 0 || iEyes < 0) { this.setState({ importError: 'חסרות עמודות "שם למסירה" ו/או "כמה עיניים"', importSummary: null }); return; }
      const upds = []; let miss = 0;
      for (let r = 1; r < rows.length; r++) {
        const row = rows[r], supN = clean(row[iSup] || ''), nm = clean(row[iNm]); if (!nm) continue;
        const raw = clean(row[iEyes] || ''); const eyes = /^\d+$/.test(raw) ? +raw : null;
        const doneRaw = clean(row[iDone] || ''), paidRaw = iPaid >= 0 ? clean(row[iPaid] || '') : '', ansRaw = iAns >= 0 ? clean(row[iAns] || '') : '', leadRaw = iLead >= 0 ? clean(row[iLead] || '') : '';
        const sp = (s.supporters || []).find(x => (!supN || this.normName(x.name) === this.normName(supN)) && ((x.ayin || {}).names || []).some(n => this.normName(n.name) === this.normName(nm)));
        if (!sp) { miss++; continue; }
        const rec = ((sp.ayin || {}).names || []).find(n => this.normName(n.name) === this.normName(nm));
        const yes = (v) => /כן|yes|✓|v|שולם/i.test(v);
        if (eyes == null && !doneRaw && !paidRaw && !ansRaw && !leadRaw) continue;
        upds.push({ sp, rec, eyes, done: doneRaw ? yes(doneRaw) : null, paid: paidRaw ? yes(paidRaw) : null, answer: ansRaw || null, lead: leadRaw ? yes(leadRaw) : null });
      }
      this._pendImport = { kind: 'ayin', upds };
      this.setState({ importError: '', importSummary: { line1: 'זוהו ' + upds.length + ' שמות לעדכון', line2: upds.filter(u => u.eyes != null).length + ' עיניים · ' + upds.filter(u => u.paid != null).length + ' שולם · ' + upds.filter(u => u.answer).length + ' תשובות · ' + upds.filter(u => u.lead).length + ' עופרת', unmatchedLine: miss ? miss + ' שורות לא הותאמו לשם קיים במערכת' : '', canApply: upds.length > 0 } });
      return;
    }
    if (s.importKind === 'supporters') {
      const digits = (x) => (x || '').replace(/\D/g, '');
      const iName = hIdx(['שם']), iPhone = hIdx(['טלפון', 'נייד']), iMail = hIdx(['מייל', 'אימייל', 'דוא']),
        iId = header.findIndex(h => /ת\.?["'״׳]?ז|זהות/.test(h)), iAddr = hIdx(['כתובת', 'עיר']),
        iCat = hIdx(['קטגור', 'סוג']), iFor = hIdx(['עבור', 'לעילוי']);
      if (iName < 0) { this.setState({ importError: 'לא נמצאה עמודת "שם" בקובץ', importSummary: null }); return; }
      const news = [], upds = [];
      const byName = {}; for (const sp of (s.supporters || [])) byName[this.normName(sp.name)] = sp;
      for (let r = 1; r < rows.length; r++) {
        const row = rows[r]; const name = clean(row[iName]); if (!name) continue;
        const rec = { name, phone: this.fixPhone(clean(row[iPhone] || '')), email: clean(row[iMail] || ''), idNum: digits(row[iId] || ''), address: clean(row[iAddr] || ''), cat: clean(row[iCat] || ''), forWho: clean(row[iFor] || '') };
        const ex = byName[this.normName(name)];
        if (ex) upds.push({ ex, rec }); else news.push(rec);
      }
      this._pendImport = { kind: 'supporters', news, upds };
      this.setState({ importError: '', importSummary: { line1: 'זוהו ' + (news.length + upds.length) + ' תומכות בקובץ', line2: '+' + news.length + ' חדשות · ' + upds.length + ' עודכנו', unmatchedLine: '', canApply: (news.length + upds.length) > 0 } });
      return;
    }
    if (s.importKind === 'members') {
      const digits = (x) => (x || '').replace(/\D/g, '');
      const isIdCol = (h) => /ת\.?["'״׳]?ז|זהות|מזהה/.test(h);
      let iFam = hIdx(['שם משפחה', 'משפחה']), iFirst = hIdx(['שם פרטי', 'פרטי', 'שם הילד']), iBirth = hIdx(['לידה']), iGen = hIdx(['מין', 'מגדר']);
      const iParentId = header.findIndex(h => isIdCol(h) && /(הורה|אם|אב|משפחה)/.test(h));
      const iChildId = header.findIndex(h => isIdCol(h) && !/(הורה|אם|אב|משפחה)/.test(h));
      const iPhone = hIdx(['טלפון']), iMother = hIdx(['שם האם', 'האם']), iCity = hIdx(['עיר']);
      let start = 1;
      if (iFam < 0 && iFirst < 0) { iFam = 0; iFirst = 1; start = 0; }
      const pend = [], unmatched = [], ambiguous = [], famIds = new Set(), hows = {};
      for (const r of rows.slice(start)) {
        const fam = clean(r[iFam]), first = clean(iFirst >= 0 ? r[iFirst] : r[1]);
        if (!first) continue;
        const nf = this.normName(fam);
        let target = null, how = '';
        const pid = iParentId >= 0 ? digits(r[iParentId]) : '';
        if (pid.length >= 5) {
          const hits = s.families.filter(f => digits(f.fatherId) === pid || digits(f.motherId) === pid);
          if (hits.length === 1) { target = hits[0]; how = 'ת"ז הורה'; }
        }
        if (!target && iPhone >= 0) {
          const ph = digits(r[iPhone]);
          if (ph.length >= 7) {
            const hits = s.families.filter(f => digits(f.phone) === ph || digits(f.phone2) === ph);
            if (hits.length === 1) { target = hits[0]; how = 'טלפון'; }
          }
        }
        if (!target && nf) {
          let hits = s.families.filter(f => this.normName(f.name) === nf);
          if (hits.length > 1 && iMother >= 0 && clean(r[iMother])) {
            const nm = this.normName(r[iMother]);
            const h2 = hits.filter(f => { const fm = this.normName(f.mother); return fm && nm && (fm.includes(nm) || nm.includes(fm)); });
            if (h2.length) { hits = h2; how = 'שם משפחה + שם האם'; }
          }
          if (hits.length > 1 && iCity >= 0 && clean(r[iCity])) {
            const h3 = hits.filter(f => f.city === clean(r[iCity]));
            if (h3.length) { hits = h3; how = how || 'שם משפחה + עיר'; }
          }
          if (hits.length === 1) { target = hits[0]; how = how || 'שם משפחה (יחיד)'; }
          else if (hits.length > 1) { ambiguous.push(fam + ' · ' + first + ' (' + hits.length + ' משפחות בשם הזה)'); continue; }
        }
        const gr = clean(iGen >= 0 ? r[iGen] : '');
        const m = { first, gender: /בת|נק|f|ילדה/i.test(gr) ? 'f' : 'm', birth: this.parseAnyDate(iBirth >= 0 ? r[iBirth] : ''), idNum: clean(iChildId >= 0 ? r[iChildId] : '').replace(/\D/g, ''), phone: '', phone2: '', school: '', grade: '', health: '', mSefach: false, mInvite: false, mRecommend: false, mPhotos: false, mVideos: false, notes: '' };
        if (target) { pend.push({ famId: target.id, m }); famIds.add(target.id); hows[how] = (hows[how] || 0) + 1; }
        else unmatched.push((fam || '—') + ' · ' + first);
      }
      this._pendImport = { kind: 'members', pend };
      const howLine = Object.entries(hows).map(([k, v]) => k + ': ' + v).join(' · ');
      const warn = [];
      if (ambiguous.length) warn.push('⚠ ' + ambiguous.length + ' לא יובאו — שם משפחה כפול (' + ambiguous.slice(0, 3).join(', ') + (ambiguous.length > 3 ? '…' : '') + '). הוסיפו עמודת ת"ז הורה או טלפון לזיהוי חד-משמעי');
      if (unmatched.length) warn.push('⚠ ' + unmatched.length + ' ללא משפחה במערכת: ' + unmatched.slice(0, 3).join(', ') + (unmatched.length > 3 ? '…' : ''));
      this.setState({ importError: '', importSummary: { line1: 'זוהו ' + (pend.length + unmatched.length + ambiguous.length) + ' שורות ילדים בקובץ', line2: '✓ הותאמו ' + pend.length + ' ילדים ל-' + famIds.size + ' משפחות' + (howLine ? ' (' + howLine + ')' : ''), unmatchedLine: warn.join(' | '), applyLabel: 'ייבוא ' + pend.length + ' ילדים', canApply: pend.length > 0 } });
    } else {
      const news = [], upds = [];
      const digits = (x) => (x || '').replace(/\D/g, '');
      for (const r of rows.slice(1)) {
        let name = clean(r[0]); if (!name || name.includes('שם פרטי שם משפחה')) continue;
        let isFair = false;
        if (/יריד חנוכה/.test(name)) { isFair = true; name = clean(name.replace(/-?\s*יריד חנוכה תשפ..?/g, '')); }
        name = clean(name.replace('#NAME?', '')); if (!name) continue;
        let city = clean(r[6] || ''); if (city === 'רגיל') city = '';
        if (city === 'ביתר' || city === 'ביתר עלית') city = 'ביתר עילית';
        const noteRaw = r[12] || '';
        const stc = clean((noteRaw.match(/סטטוס:\s*([^\n]+)/) || [])[1] || '');
        const obj = { name, father: '', mother: clean(r[3]), fatherId: clean(r[1]), motherId: clean(r[4]),
          phone: clean(r[2]) === '-' ? '' : clean(r[2]), phone2: clean(r[5]) === '-' ? '' : clean(r[5]), email: '',
          address: clean([r[7], r[8]].map(clean).filter(Boolean).join(' ')), city,
          status: stc.includes('לא פעיל') ? 'inactive' : 'active',
          maritalStatus: stc.includes('אלמנ') || (r[9] || '').includes('אלמן') ? 'אלמן/ה' : stc.includes('גרוש') ? 'גרושים' : 'נשואים',
          language: 'עברית', community: clean(r[10]) || 'חסידי', tzedaka: '', fullSefach: false, discount: '',
          notes: isFair ? 'השתתפה ביריד חנוכה תשפ"ו' : '', docs: [], members: [] };
        const ex = s.families.find(f => this.normName(f.name) === this.normName(name) && (!digits(obj.phone) || !digits(f.phone) || digits(f.phone) === digits(obj.phone)));
        if (ex) upds.push({ id: ex.id, obj }); else news.push(obj);
      }
      this._pendImport = { kind: 'families', news, upds };
      this.setState({ importError: '', importSummary: { line1: 'זוהו ' + (news.length + upds.length) + ' משפחות בקובץ', line2: '+' + news.length + ' חדשות · ' + upds.length + ' עדכונים לקיימות', unmatchedLine: '', applyLabel: 'ייבוא ' + (news.length + upds.length) + ' משפחות', canApply: (news.length + upds.length) > 0 } });
    }
  }
  applyImport() {
    const P = this._pendImport, s = this.state;
    if (!P) return;
    if (P.kind === 'ayin') {
      const today = this.isoOf(new Date()); let logged = 0;
      for (const u of P.upds) {
        const ay = this.ayinOf(u.sp);
        if (u.eyes != null && +u.rec.eyes !== u.eyes) { if (!ay.log) ay.log = []; ay.log.unshift({ date: today, eyes: u.eyes, name: u.rec.name }); logged++; }
        if (u.eyes != null) u.rec.eyes = u.eyes;
        if (u.done != null) u.rec.done = u.done;
        if (u.paid != null) ay.paid = u.paid;
        if (u.answer && !(ay.answers || []).some(a => a.note === u.answer)) { if (!ay.answers) ay.answers = []; ay.answers.unshift({ date: today, note: u.answer }); ay.answeredNote = u.answer; }
        if (u.lead && !['eyes', 'answer', 'done'].includes(ay.stage)) ay.stage = 'eyes';
        ay.lastTouch = today;
      }
      this.setState({ supporters: s.supporters, modal: null, importSummary: null }, () => { try { this.persist(); } catch (e) {} });
      this.t('עודכנו ' + P.upds.length + ' שמות · ' + logged + ' רישומי עיניים נכנסו להיסטוריה, ללוח התרומות ולדוח');
      return;
    }
    if (P.kind === 'supporters') {
      if (!s.supporters) s.supporters = [];
      for (const u of P.upds) Object.assign(u.ex, u.rec);
      let i = 0;
      const added = P.news.map(o => ({ id: 'spi' + (s.seq + i++), ...o, count: 0, ils: 0, usd: 0, first: '', last: '', nextDate: '', donations: [], hist: [] }));
      this.setState({ supporters: added.concat(s.supporters), seq: s.seq + i, modal: null, importSummary: null });
      this.t('+' + added.length + ' תומכות חדשות · ' + P.upds.length + ' עודכנו');
      return;
    }
    if (P.kind === 'members') {
      let n = 0;
      for (const { famId, m } of P.pend) {
        const f = s.families.find(x => x.id === famId); if (!f) continue;
        if (f.members.some(x => x.first === m.first && (x.birth || '') === (m.birth || ''))) continue;
        f.members.push({ ...m, id: 'mi' + (s.seq + n) }); n++;
      }
      this.setState({ families: s.families, seq: s.seq + n, modal: null, importSummary: null });
      this.t('יובאו ' + n + ' ילדים בהצלחה');
    } else {
      for (const { id, obj } of P.upds) { const f = s.families.find(x => x.id === id); if (f) { for (const k in obj) { if (k === 'members' || k === 'docs') continue; if (obj[k]) f[k] = obj[k]; } } }
      let i = 0;
      const added = P.news.map(o => ({ ...o, id: 'fi' + (s.seq + i++), createdAt: this.isoOf(new Date()) }));
      this.setState({ families: added.concat(s.families), seq: s.seq + i, modal: null, importSummary: null });
      this.t('+' + added.length + ' משפחות חדשות · ' + P.upds.length + ' עודכנו');
    }
    this._pendImport = null;
  }
  openEventEdit(ev) {
    this.setState({ modal: 'event', editingEventId: ev.id, eventError: '', eventForm: { title: ev.title, date: ev.date, time: ev.time || '', type: ev.type === 'custom' ? '__other' : ev.type, typeOther: ev.customType || '', notes: ev.notes || '', price: String(ev.price || ''), roomId: ev.roomId || '', famId: ev.famId || '', priority: ev.priority || 'green' } });
  }
  runAudit() {
    const s = this.state, issues = [];
    const digits = (x) => (x || '').replace(/\D/g, '');
    const add = (cat, title, famId, dupIds) => issues.push({ cat, title, famId, dupIds });
    const CATS = { 'כפילות': ['#fdeaea', '#b91c1c'], 'ת"ז': ['#fdf1d4', '#9a6414'], 'טלפון': ['#e7edf5', '#3a5a86'], 'אימייל': ['#efe7f3', '#7c3aed'], 'כתובת': ['#eceae2', '#4d463c'], 'לוגיקה': ['#dff0ec', '#0f766e'], 'ילדים': ['#fbeef3', '#be185d'], 'קשר': ['#f6ead1', '#9a6414'] };
    const g1 = {}, g2 = {}, g3 = {};
    for (const f of s.families) {
      const k1 = this.normName(f.name) + '|' + this.normName(f.mother || '');
      (g1[k1] = g1[k1] || []).push(f);
      for (const p of [f.phone, f.phone2]) { const d = digits(p); if (d.length >= 7) (g2[d] = g2[d] || []).push(f); }
      for (const idn of [f.fatherId, f.motherId]) { const d = digits(idn); if (d.length >= 5) (g3[d] = g3[d] || []).push(f); }
    }
    for (const k in g1) { const a = g1[k]; if (a.length > 1 && !k.endsWith('|')) add('כפילות', 'שם + שם האם זהים: "' + (a[0].mother ? a[0].mother + ' ' : '') + a[0].name + '" — ' + a.length + ' רשומות · פתחו להשוואה', a[0].id, a.map(f => f.id)); }
    const seenPair = new Set();
    for (const k in g2) { const a = [...new Set(g2[k])]; if (a.length > 1) { const key = a.map(f => f.id).sort().join(); if (!seenPair.has(key)) { seenPair.add(key); add('כפילות', 'טלפון ' + k + ' משותף ל-' + a.length + ' משפחות: ' + a.map(f => f.name).slice(0, 3).join(', ') + ' · פתחו להשוואה', a[0].id, a.map(f => f.id)); } } }
    for (const k in g3) { const a = [...new Set(g3[k])]; if (a.length > 1) add('כפילות', 'ת"ז ' + k + ' מופיעה ב-' + a.length + ' משפחות: ' + a.map(f => f.name).slice(0, 2).join(', ') + ' · פתחו להשוואה', a[0].id, a.map(f => f.id)); }
    const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
    const phoneIssue = (p) => {
      if (!p || p === '-') return null;
      const d = digits(p);
      if ((d.length === 9 || d.length === 10) && d[0] === '0') return null;
      if (d.length === 8) return 'כנראה חסרה ספרת 0 מובילה: ' + p;
      if (d.length < 7) return 'קצר מדי: ' + p;
      if (d[0] !== '0') return 'לא מתחיל ב-0: ' + p;
      return 'אורך חריג (' + d.length + ' ספרות): ' + p;
    };
    for (const f of s.families) {
      for (const [idn, who] of [[f.fatherId, 'אב'], [f.motherId, 'אם']]) { const d = digits(idn); if (d.length && !this.validId(d)) add('ת"ז', 'משפחת ' + f.name + ': ת"ז ' + who + ' לא עוברת ספרת ביקורת (' + idn + ')', f.id); }
      for (const p of [f.phone, f.phone2]) { const pi = phoneIssue(p); if (pi) add('טלפון', 'משפחת ' + f.name + ': ' + pi, f.id); }
      if (f.email && !emailRe.test(f.email)) add('אימייל', 'משפחת ' + f.name + ': אימייל לא תקין (' + f.email + ')', f.id);
      if (f.status !== 'inactive') {
        if (!f.city) add('כתובת', 'משפחת ' + f.name + ': חסרה עיר', f.id);
        else if (!f.address) add('כתובת', 'משפחת ' + f.name + ': יש עיר אבל חסרה כתובת', f.id);
      }
      const single = f.maritalStatus === 'אלמן/ה' || f.maritalStatus === 'גרושים' || f.maritalStatus === 'פרודים';
      if (single && f.father && f.mother) add('לוגיקה', 'משפחת ' + f.name + ': מסומנת "' + f.maritalStatus + '" — חייבת להיות בלי בן/בת זוג, אבל רשומים שניים (' + f.father + ' + ' + f.mother + '). יש להסיר את בן הזוג', f.id);
      else if (single && digits(f.fatherId) && digits(f.motherId)) add('לוגיקה', 'משפחת ' + f.name + ': מסומנת "' + f.maritalStatus + '" אבל רשומות שתי תעודות זהות של בני זוג — יש להסיר אחת', f.id);
      if (f.maritalStatus === 'נשואים' && f.status === 'active' && !f.father && !f.mother) add('לוגיקה', 'משפחת ' + f.name + ': מסומנת נשואים אבל לא רשום אף בן זוג', f.id);
      if (!digits(f.phone) && !digits(f.phone2) && !f.email) add('קשר', 'משפחת ' + f.name + ': אין שום פרט קשר (טלפון או אימייל)', f.id);
      const seenKid = new Set();
      for (const m of f.members) {
        if (m.isParent) { if (m.idNum && !this.validId(m.idNum)) add('ת"ז', 'משפחת ' + f.name + ': ת"ז של ' + m.first + ' (הורה) לא תקינה', f.id); continue; }
        if (!m.birth) add('ילדים', 'משפחת ' + f.name + ': ל' + m.first + ' אין תאריך לידה', f.id);
        else { const a = this.age(m.birth); if (a != null && (a < 0 || a > 25)) add('ילדים', 'משפחת ' + f.name + ': גיל חריג ל' + m.first + ' (' + a + ')', f.id); }
        if (m.idNum && !this.validId(m.idNum)) add('ת"ז', 'משפחת ' + f.name + ': ת"ז של ' + m.first + ' לא תקינה', f.id);
        const mp = phoneIssue(m.phone); if (mp) add('טלפון', 'משפחת ' + f.name + ': טלפון של ' + m.first + ' — ' + mp, f.id);
        const kk = m.first + '|' + (m.birth || '');
        if (seenKid.has(kk)) add('כפילות', 'משפחת ' + f.name + ': הילד/ה ' + m.first + ' מופיע/ה פעמיים', f.id);
        seenKid.add(kk);
      }
    }
    for (const e of s.enrollments) {
      const paid = (e.payments || []).reduce((a, x) => a + x.amount, 0);
      if (e.totalDue && paid > e.totalDue) {
        const fam2 = s.families.find(f2 => f2.members.some(m2 => m2.id === e.memberId));
        if (fam2) add('לוגיקה', 'משפחת ' + fam2.name + ': שולם ₪' + paid + ' — יותר מסה"כ העסקה (₪' + e.totalDue + '). בדקו החזר או עדכנו את הסכום', fam2.id);
      }
    }
    const sups = s.supporters || [];
    const addS = (cat, title, spId) => issues.push({ cat, title, spId });
    const sg1 = {}, sg2 = {}, sg3 = {};
    for (const sp of sups) {
      const k1 = this.normName(sp.name); if (k1) (sg1[k1] = sg1[k1] || []).push(sp);
      const dp = digits(sp.phone); if (dp.length >= 7) (sg2[dp] = sg2[dp] || []).push(sp);
      const di = digits(sp.idNum); if (di.length >= 5) (sg3[di] = sg3[di] || []).push(sp);
    }
    const seenS = new Set();
    for (const k in sg1) { const a = sg1[k]; if (a.length > 1) { const key = a.map(x => x.id).sort().join(); if (!seenS.has(key)) { seenS.add(key); addS('כפילות', 'תומכת בשם "' + a[0].name + '" — ' + a.length + ' רשומות זהות', a[0].id); } } }
    for (const k in sg2) { const a = [...new Set(sg2[k])]; if (a.length > 1) addS('כפילות', 'טלפון ' + k + ' משותף ל-' + a.length + ' תומכות: ' + a.map(x => x.name).slice(0, 3).join(', '), a[0].id); }
    for (const k in sg3) { const a = [...new Set(sg3[k])]; if (a.length > 1) addS('כפילות', 'ת"ז ' + k + ' מופיעה אצל ' + a.length + ' תומכות', a[0].id); }
    for (const sp of sups) {
      const di = digits(sp.idNum); if (di.length && !this.validId(di)) addS('ת"ז', 'תומכת ' + sp.name + ': ת"ז לא עוברת ספרת ביקורת (' + sp.idNum + ')', sp.id);
      const pi = phoneIssue(sp.phone); if (pi) addS('טלפון', 'תומכת ' + sp.name + ': ' + pi, sp.id);
      if (sp.email && !emailRe.test(sp.email)) addS('אימייל', 'תומכת ' + sp.name + ': אימייל לא תקין (' + sp.email + ')', sp.id);
      if (!digits(sp.phone) && !sp.email) addS('קשר', 'תומכת ' + sp.name + ': אין שום פרט קשר (טלפון או אימייל)', sp.id);
      if (sp.nextDate && sp.nextDate < this.isoOf(new Date())) addS('קשר', 'תומכת ' + sp.name + ': עבר תאריך היעד לקשר (' + this.fmtD(sp.nextDate) + ') — לתאם מחדש', sp.id);
      for (const d of (sp.donations || [])) { if (d.amount != null && d.amount <= 0) addS('לוגיקה', 'תומכת ' + sp.name + ': תרומה בסכום לא תקין (' + d.amount + ')', sp.id); }
    }
    const counts = {};
    for (const i of issues) counts[i.cat] = (counts[i.cat] || 0) + 1;
    this._lastAudit = issues;
    return { total: String(issues.length), clean: issues.length === 0, notClean: issues.length > 0,
      rows: issues.slice(0, 80).map(i => ({ tag: i.cat, tagBg: CATS[i.cat][0], tagC: CATS[i.cat][1], title: i.title, go: () => { if (i.dupIds && i.dupIds.length > 1) { this.setState({ dupIds: i.dupIds }); return; } if (i.spId) { this.openSupCard(i.spId); } else { this.setState({ modal: null, selCourseId: null }); this.openFam(i.famId); } } })),
      more: issues.length > 80 ? 'מוצגות 80 הראשונות מתוך ' + issues.length + ' — ייצאו את הדוח המלא' : '',
      hasMore: issues.length > 80,
      chips: Object.entries(counts).map(([k, v]) => ({ label: k + ' · ' + v, bg: CATS[k][0], c: CATS[k][1] })) };
  }
  startDemo() { if (this.state.demoOn) return; this._demoStop = false; this.setState({ demoOn: true, demoCap: '', demoX: window.innerWidth / 2, demoY: window.innerHeight / 2 }); this.runDemo(); }
  stopDemo() { this._demoStop = true; clearTimeout(this._demoT); if (this.state.demoOn) this.setState({ demoOn: false, demoCap: '' }); }
  async runDemo() {
    const sleep = (ms) => new Promise(r => { this._demoT = setTimeout(r, ms); });
    const ok = () => this.state.demoOn && !this._demoStop;
    const setV = (el, v) => { const d = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value'); d.set.call(el, v); el.dispatchEvent(new Event('input', { bubbles: true })); };
    const byText = (txt, q = 'button') => [...document.querySelectorAll(q)].find(e => (e.textContent || '').trim().includes(txt));
    const cursorTo = async (el, cap) => {
      if (!el || !ok()) return false;
      const main = document.querySelector('main');
      let r = el.getBoundingClientRect();
      if (main && (r.top < 110 || r.bottom > window.innerHeight - 70)) {
        main.scrollTo({ top: Math.max(0, r.top + main.scrollTop - 240), behavior: 'smooth' });
        await sleep(650); r = el.getBoundingClientRect();
      }
      this.setState({ demoX: r.left + r.width / 2, demoY: r.top + r.height / 2, demoCap: cap ? cap : this.state.demoCap });
      await sleep(800);
      return ok();
    };
    const clickEl = async (el, cap) => { if (!await cursorTo(el, cap)) return; el.click(); await sleep(750); };
    const typeInto = async (el, txt, cap) => { if (!await cursorTo(el, cap)) return; for (let i = 1; i <= txt.length; i++) { if (!ok()) return; setV(el, txt.slice(0, i)); await sleep(130); } await sleep(600); };
    const cap = async (c, ms = 1700) => { this.setState({ demoCap: c }); await sleep(ms); };
    const setSel = (el, v) => { if (!el) return; const d = Object.getOwnPropertyDescriptor(window.HTMLSelectElement.prototype, 'value'); d.set.call(el, v); el.dispatchEvent(new Event('change', { bubbles: true })); };
    const setTA = (el, v) => { if (!el) return; const d = Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype, 'value'); d.set.call(el, v); el.dispatchEvent(new Event('input', { bubbles: true })); };
    const btnEq = (txt) => [...document.querySelectorAll('button')].find(b => b.textContent.trim() === txt);
    const closeX = () => [...document.querySelectorAll('button')].find(b => b.textContent.trim() === '✕' && b.style.fontSize === '15px');
    const segs = () => [...document.querySelectorAll('button')].filter(b => (b.style.transform || '').includes('translateY(-108px)'));
    const pickRow = (txt) => [...document.querySelectorAll('div')].find(d => d.style.cursor === 'pointer' && d.style.fontSize === '13px' && d.textContent.includes(txt));
    try {
      this.setState({ view: 'home', selId: null, selCourseId: null, modal: null, paletteOpen: false, wheelOpen: false, famWheelOpen: false });
      await cap('👋 הדמיה מלאה — המערכת מדגימה את עצמה, על הנתונים האמיתיים', 2200); if (!ok()) return;
      // ——— פרק 0: מסך הבית ———
      await cursorTo(byText('תלמידים במערכת', 'div'), 'סטטיסטיקות חיות — כל אריח לחיץ'); await sleep(500);
      await cursorTo(byText('ממתינות לאישור', 'button'), 'צ׳יפים חכמים: ממתינות, תזכורת טלפון, מצא חוג'); await sleep(500);
      const homeTile = document.querySelector('div[title="פתיחת יומן החדר"]');
      await clickEl(homeTile, 'קליק על חדר — היומן שלו נפתח מהבית');
      await sleep(500); await clickEl(closeX(), '');
      await clickEl(byText('חיפוש'), 'ב-⌘K מחכות פעולות מהירות ויתרות נמוכות');
      await sleep(700);
      await clickEl(byText('העתקת כל הטלפונים'), 'רשימת חיוג שלמה — ללוח ההעתקה');
      // ——— פרק 1: חיפוש-על ———
      await clickEl(byText('חיפוש'), '⌘K — חיפוש חכם מכל מקום');
      await typeInto(document.querySelector('input[placeholder*="חיפוש חכם"]'), 'כהאן', 'מקלידים עם שגיאה: "כהאן"…');
      await cap('המנוע מתקן לבד: משפחות, תלמידים, חוגים, מסמכים ✓');
      await clickEl([...document.querySelectorAll('div')].find(d => d.style.cursor === 'pointer' && d.textContent.includes('משפחת כהן')), 'קליק — ישר לכרטיס המשפחה');
      // ——— פרק 2: כרטיס משפחה ———
      await cap('כרטיס משפחה: ילדים עם תאריך עברי, חוגים, יתרות', 1900); if (!ok()) return;
      await clickEl([...document.querySelectorAll('button')].find(b => b.textContent.trim() === 'ניקוב'), 'ניקוב נוכחות — היתרה יורדת + 5 נק׳ אמינות');
      await clickEl([...document.querySelectorAll('button')].find(b => b.title === 'רישום חיסור (נימוק חובה)'), 'רישום חיסור — עם כלל 48 השעות');
      setSel([...document.querySelectorAll('select')].find(s2 => [...s2.options].some(o => o.value === 'noshow')), 'noshow'); await sleep(600);
      setTA([...document.querySelectorAll('textarea')].find(t2 => (t2.placeholder || '').includes('מחלה')), 'לא הודיעה'); await sleep(500);
      await clickEl(byText('שמירת חיסור'), 'No-Show = הניקוב יורד ו־−20 אמינות');
      await clickEl([...document.querySelectorAll('button')].find(b => b.title && b.title.indexOf('ניהול שיבוץ') === 0), '⚙ ניהול שיבוץ — קנייה, הקפאה, מסלול, הסרה');
      await clickEl(byText('קנייה וטעינה'), '🎫 טעינת כרטיסייה — 12 ניקובים');
      await clickEl(byText('סגירה'), '');
      await clickEl(byText('+ שיבוץ לחוג'), 'שיבוץ חדש — גם להורים!'); if (!ok()) return;
      await typeInto(document.querySelector('input[placeholder*="גם עם שגיאת"]'), 'אמא', 'מקלידים "אמא" — ההורים ברשימה');
      await clickEl(pickRow('אמא'), 'בוחרים את האם — הסינון לפי גיל ומגדר');
      await typeInto(document.querySelector('input[placeholder*="הקלידו חוג"]'), 'רפלק', 'חיזוי חוגים: רק תואמי גיל ומגדר');
      await clickEl(pickRow('רפלקסולוגיה'), '');
      await clickEl(btnEq('שיבוץ'), 'האם שובצה — נוצר לה כרטיס עם תג "אם"');
      await clickEl([...document.querySelectorAll('button')].find(b => b.title === 'עריכה'), 'עריכת בן משפחה — תאריך עברי חי, מוסד, תיעוד');
      await sleep(900); await clickEl(byText('ביטול'), '');
      await clickEl([...document.querySelectorAll('button')].find(b => b.title === 'קניית / טעינת כרטיסייה'), '🎫 קנייה גם ישירות מכרטיס הילד');
      await sleep(600); await clickEl(byText('סגירה'), '');
      await clickEl(byText('✎ עריכת משפחה'), 'עריכת משפחה: קהילה, מצב משפחתי, קופה, הנחה');
      await sleep(1100); await clickEl(byText('ביטול'), '');
      await clickEl(byText('+ העלאת ספח'), 'תיעוד ומדיה — ספחים, הזמנות, תמונות');
      await clickEl(byText('+ פעולה קהילתית'), '💛 פעולה קהילתית = +15 למדד האמינות');
      // ——— פרק 3: ניקיון נתונים ———
      await clickEl(byText('משפחות'), '292 משפחות אמיתיות בטבלה'); if (!ok()) return;
      await typeInto(document.querySelector('input[placeholder*="חיפוש לפי שם"]'), 'לו', 'הקלדה חכמה גם כאן — שורת חיזוי');
      await cap('צ׳יפים של השלמות: לוי, בלוי…', 1400);
      const inp2 = document.querySelector('input[placeholder*="חיפוש לפי שם"]'); setV(inp2, ''); inp2 && inp2.dispatchEvent(new Event('input', { bubbles: true }));
      await clickEl([...document.querySelectorAll('button')].find(b => b.textContent.includes('סינון מורחב')), '🎡 מאתר המשפחות — גלגל בתוך הדף');
      await clickEl(segs()[0], 'צלילה: הטבלה למטה מסתננת חי');
      await clickEl(segs()[0], 'עוד ציר — הספירה מצטמצמת');
      await cap('8 צירים: עיר, קהילה, מצב משפחתי, אמינות…', 1600);
      await clickEl(byText('✕ סגירה'), '');
      await clickEl(byText('⬆ ייבוא'), 'ייבוא CSV — הצלבה לפי ת"ז, טלפון ושם');
      await sleep(1100); await clickEl(byText('ביטול'), '');
      await clickEl(byText('בדיקת נתונים'), '✓ סורק כפילויות, ת"ז, טלפונים, לוגיקה');
      await sleep(1400);
      await clickEl(byText('תיקון אוטומטי'), 'תיקון אוטומטי: השלמת 0 לטלפונים');
      await clickEl(byText('← למרכז הטיפול'), 'הממצאים נשפכים למרכז הטיפול');
      await cap('מרכז הטיפול: הכל עם "✓ טופל" ומעקב', 1600);
      await clickEl(btnEq('✓ טופל'), 'סימנו כטופל — נעלם מהרשימה');
      // ——— פרק 4: חוגים וחדרים ———
      await clickEl(byText('קורסים'), '23 חוגים · רצועת חדרים חיה'); if (!ok()) return;
      await clickEl([...document.querySelectorAll('div[title="פתיחת יומן החדר"]')].find(d => d.textContent.includes('מטבח')), 'יומן המטבח — משבצות 60 דק׳');
      await cap('15:00 חסום לנקיון · שבת נחסמת אוטומטית', 1700);
      await clickEl([...document.querySelectorAll('button')].find(b => b.title === 'יום הבא'), 'מדפדפים יום קדימה');
      await clickEl(btnEq('הזמנה'), 'משבצת פנויה? מזמינים בקליק');
      await sleep(700); await clickEl(byText('הוספה ללוח'), 'ההזמנה נכנסה ללוח וליומן החדר');
      await clickEl([...document.querySelectorAll('button')].find(b => b.title === 'מערך הגדרות החדר'), '⚙ הגדרות חדר — ציוד, קיבולת, הערות');
      await sleep(900); await clickEl(byText('מקרן'), '');
      await clickEl(byText('שמירת הגדרות'), 'הציוד נשמר על החדר');
      await clickEl(btnEq('+ חדר'), '🏗 מתרחבים? מוסיפים חדר בקליק');
      await clickEl(byText('חדר בריחה'), '');
      await clickEl(byText('הוספת חדר'), 'חדר בריחה נולד — עם יומן משלו');
      await clickEl([...document.querySelectorAll('button')].find(b => b.textContent.includes('מצא חוג')), '🎡 מאתר החוגים');
      await clickEl(segs()[0], 'הגריד מסתנן חי');
      await clickEl(byText('✕ סגירה'), '');
      const card = [...document.querySelectorAll('div')].find(d => d.style.cursor === 'pointer' && /מורה:/.test(d.textContent) && /תלמידים/.test(d.textContent));
      await clickEl(card, 'כרטיס חוג: תפוסה, מחיר, תקופה בעברי');
      await clickEl(byText('✎ עריכת קורס'), 'עריכת קורס — עם תאריך עברי חי בטופס');
      await sleep(1000); await clickEl(byText('ביטול'), '');
      await cap('שעות פעילות וקבוצות — הוספה והסרה חיה', 1500);
      await clickEl(byText('+ הוספת קבוצה'), 'קבוצה חדשה — נכנסת מיד ללוח וליומן');
      await clickEl(byText('+ שיבוץ תלמיד'), 'שיבוץ עם הקלדה חכמה');
      await typeInto(document.querySelector('input[placeholder*="ותיקון שגיאות"]'), 'ליאה', '');
      await clickEl(pickRow('ליאה'), '');
      await clickEl(btnEq('שיבוץ'), 'שובצה — עם בדיקת גיל והתנגשויות');
      // ——— פרק 5: לוח שנה ———
      await clickEl(byText('לוח שנה'), '📅 עברי + לועזי · שכבות סינון'); if (!ok()) return;
      await clickEl(btnEq('טלפונים'), 'מכבים שכבה — נשאר רק מה שחשוב');
      await clickEl(btnEq('טלפונים'), '');
      await clickEl(byText('● דחופים בלבד'), 'מצב חירום: רק אדומים על הלוח');
      await clickEl(byText('● דחופים בלבד'), '');
      await clickEl(byText('+ אירוע חדש'), 'אירוע חדש — כולל אזכרה שחוזרת בעברי');
      await typeInto(document.querySelector('input[placeholder*="ישיבת"]'), 'ישיבת צוות', '');
      const pr = [...document.querySelectorAll('select')].find(s2 => [...s2.options].some(o => o.value === 'red'));
      if (pr) { setSel(pr, 'red'); await cap('רמת דחיפות: אדום — פס בלוח + מרכז הטיפול', 1300); }
      await clickEl(byText('הוספה ללוח'), 'נשמר — מופיע מיד בלוח');
      await clickEl(btnEq('✓ בוצע'), '📞 תזכורת טלפון — מסמנים "בוצע" מהפאנל');
      await clickEl([...document.querySelectorAll('button')].find(b => b.title === 'עריכת האירוע'), 'עריכת אירוע ישירות מהפאנל');
      await sleep(900); await clickEl(byText('ביטול'), '');
      await clickEl(byText('היום'), 'תצוגה יומית: שעות, חדרים, ניקוב ישיר');
      await sleep(1300);
      await clickEl([...document.querySelectorAll('button')].find(b => b.title === 'יום הבא'), 'מדפדפים בין ימים');
      await sleep(700);
      // ——— פרק 6: הגדרות ובית ———
      await clickEl(byText('הגדרות'), '⚙ ארגון, התראות, דוחות, מנוע אמינות'); if (!ok()) return;
      const tg = [...document.querySelectorAll('button')].filter(b => b.style.width === '40px' && b.style.borderRadius === '99px')[3];
      if (tg) { await clickEl(tg, 'ערוצי התראות — כולל "דחיפה חזקה" לחירום'); await sleep(400); tg.click(); await sleep(400); }
      await clickEl(btnEq('הפק עכשיו ⬇'), 'דוח יומי אמיתי יורד למחשב');
      await clickEl(byText('הרץ עכשיו'), 'Batch יומי: Decay אי-פעילות במדד');
      await clickEl(byText('בית'), 'ובחזרה הביתה — הכל התעדכן');
      const g = byText('מדד אמינות הקהילה', 'span');
      if (g) await cursorTo(g, '📈 ההיסטוגרמה זזה מכל פעולה שעשינו עכשיו');
      await sleep(1400);
      const g2 = byText('דורש טיפול', 'span');
      if (g2) await cursorTo(g2, 'המשימות שנוצרו מחכות כאן');
      await sleep(1200);
      await cursorTo(byText('תפוסת החוגים', 'span'), 'תפוסה, הכנסה משוערת והכי מבוקשים — חי');
      await sleep(1200);
      await clickEl(btnEq('פתח רשימה ↓'), 'ניקוב מהיר — ישר לקורס של היום');
      await sleep(900);
      await clickEl(byText('בית'), '');
      await cap('זו המערכת. חיה, מלאה, במקום אחד ✦', 3000);
    } catch (err) {}
    this.stopDemo();
  }
  openManage(eid) { this.setState({ modal: 'manage', manageId: eid, buyQty: '', manageConfirm: false, payAmt: '', payMethod: 'מזומן', mgNote: (this.state.enrollments.find(e => e.id === eid) || {}).note || '' }); }
  payBal(e) { const paid = (e.payments || []).reduce((a, x) => a + x.amount, 0); return Math.max(0, (e.totalDue || 0) - paid); }
  receipt(en, p) {
    const s = this.state, allM = this.allMembers();
    const m = allM.find(x => x.id === en.memberId) || {}; const c = s.courses.find(x => x.id === en.courseId) || {};
    const paid = (en.payments || []).reduce((a, x) => a + x.amount, 0);
    const L = ['קבלה — ' + (s.orgName || 'מאור החסד'), 'מס׳ קבלה: ' + (p.rid || ''), 'תאריך: ' + this.hebDateFull(p.date) + ' · ' + this.fmtD(p.date), '',
      'משפחת ' + (m.famName || '') + ' · ' + (m.first || '') + ' · חוג: ' + (c.name || ''),
      'התקבל: ₪' + p.amount + ' (' + (p.method || '') + ')',
      'סה"כ עסקה: ₪' + (en.totalDue || 0) + ' · שולם עד כה: ₪' + paid + ' · יתרה: ₪' + this.payBal(en),
      en.dueDate ? 'תשלום הבא: ' + this.hebDateFull(en.dueDate) + ' · ' + this.fmtD(en.dueDate) : '', '', 'תודה רבה!'];
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob(['\uFEFF' + L.filter(x => x !== '').join('\n')], { type: 'text/plain;charset=utf-8' }));
    a.download = 'receipt-' + (p.rid || 'x') + '.txt'; a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 5000);
  }
  addPay() {
    const s = this.state, en = this.mgEn(); if (!en) return;
    const amt = Math.round((+(s.payAmt || 0)) * 100) / 100;
    if (!amt || amt <= 0) { this.t('הקלידו סכום תשלום תקין'); return; }
    en.payments = en.payments || [];
    const p = { rid: 'R-' + s.seq, date: this.isoOf(new Date()), amount: amt, method: s.payMethod || 'מזומן' };
    en.payments.push(p);
    this.setState({ enrollments: s.enrollments, seq: s.seq + 1, payAmt: '' });
    this.t('התקבל ₪' + amt + (en.totalDue ? ' · יתרה: ₪' + this.payBal(en) : '') + ' — הקבלה ירדה למחשב');
    this.receipt(en, p);
    const famP = s.families.find(f => f.members.some(m => m.id === en.memberId));
    if (famP) this.credEvent(famP.id, 5, 'תשלום התקבל (₪' + amt + ')');
  }
  savePayDue(v) {
    const s = this.state, en = this.mgEn(); if (!en) return;
    en.dueDate = v;
    const allM = this.allMembers(), m = allM.find(x => x.id === en.memberId) || {}, c = s.courses.find(x => x.id === en.courseId) || {};
    if (v) {
      let ev = s.events.find(x => x.id === en.dueEventId);
      if (!ev) { ev = { id: 'ev' + s.seq, type: 'reminder', title: '', date: v, time: '', notes: '', priority: 'orange', price: 0, roomId: '' }; s.events.push(ev); en.dueEventId = ev.id; s.seq++; }
      ev.title = 'תשלום יתרה — ' + (m.first || '') + ' (' + (c.name || '') + ')';
      ev.date = v; ev.done = false;
      ev.famId = (s.families.find(f => f.members.some(mm => mm.id === en.memberId)) || {}).id || '';
      this.t('נקבע תשלום הבא ל-' + this.fmtD(v) + ' — נוספה תזכורת ללוח השנה');
    } else this.t('תאריך התשלום הבא נוקה');
    this.setState({ enrollments: s.enrollments, events: s.events, seq: s.seq });
  }
  mgEn() { return this.state.enrollments.find(e => e.id === this.state.manageId); }
  buyPunches() {
    const s = this.state, en = this.mgEn(); if (!en) return;
    const c = s.courses.find(x => x.id === en.courseId) || {};
    const qty = +(s.buyQty || c.size || 12);
    if (isNaN(qty) || qty <= 0 || qty > 200) { this.t('כמות ניקובים לא תקינה'); return; }
    if (en.plan === 'punch') en.purchased += qty;
    else { en.plan = 'punch'; en.purchased = qty; en.used = 0; }
    if (en.status === 'ended') en.status = 'active';
    this.setState({ enrollments: s.enrollments, buyQty: '' });
    this.t('כרטיסייה נטענה: +' + qty + ' ניקובים · יתרה חדשה ' + (en.purchased - en.used));
  }
  famLockPass(f) {
    if (!this.state.famWheelOpen) return true;
    const L = this.state.fwLocks || {};
    const ids = new Set(f.members.map(m => m.id));
    const G = { city: f.city || '', comm: f.community || '', marital: f.maritalStatus || 'לא ידוע', status: this.stMeta(f.status)[0], cred: this.tierOf((f.cred || {}).score ?? 700)[1], kids: f.members.length ? 'עם ילדים' : 'בלי ילדים', enrolled: this.state.enrollments.some(e => ids.has(e.memberId)) ? 'משתתפות בחוגים' : 'לא משתתפות', sefach: f.fullSefach ? 'קיים' : 'חסר', lang: f.language || '' };
    for (const k in L) if (L[k] !== undefined && G[k] !== L[k]) return false;
    return true;
  }
  saveEnrollNew() {
    const s = this.state, f = s.enrollNewForm || {};
    const c = s.courses.find(x => x.id === s.selCourseId); if (!c) return;
    let fam = s.families.find(x => x.id === f.famId);
    let famCreated = false;
    if (!fam && f.famId === '__new' && (f.newFamName || '').trim()) {
      const nm = this.normName(f.newFamName);
      fam = s.families.find(x => this.normName(x.name) === nm);
      if (!fam) {
        fam = { ...this.emptyForm(), fullSefach: false, id: 'f' + s.seq, name: f.newFamName.trim(), phone: this.fixPhone((f.newFamPhone || '').trim()), members: [], docs: [], cred: { score: 700, log: [] }, createdAt: this.isoOf(new Date()) };
        s.families.unshift(fam); s.seq++; famCreated = true;
      }
    }
    if (!fam) { this.setState({ enrollError: 'יש לבחור משפחה מהרשימה — או להקליד שם חדש ולבחור "＋ משפחה חדשה"' }); return; }
    if (!f.first || !f.first.trim()) { this.setState({ enrollError: 'שם פרטי הוא שדה חובה' }); return; }
    if (s.enrollments.filter(e => e.courseId === c.id).length >= (c.maxStudents || 999)) { this.setState({ enrollError: 'הקורס מלא — הגעתם למקסימום התלמידים' }); return; }
    const m = { id: 'm' + s.seq, first: f.first.trim(), gender: f.gender || 'f', birth: f.birth || '', idNum: '', phone: '', phone2: '', school: '', grade: '', health: '', mSefach: false, mInvite: false, mRecommend: false, mPhotos: false, mVideos: false, notes: '' };
    fam.members.push(m);
    s.enrollments.push({ id: 'e' + (s.seq + 1), memberId: m.id, courseId: c.id, plan: c.model, purchased: c.model === 'punch' ? (+(s.enrollForm || {}).purchased || c.size || 12) : 0, used: 0, absences: [], enrolledAt: this.isoOf(new Date()) });
    this.setState({ families: s.families, enrollments: s.enrollments, seq: s.seq + 2, modal: null, enrollError: '', enrollNewOpen: false, enfQ: null });
    this.t((famCreated ? 'משפחת ' + fam.name + ' נוצרה, ' : '') + m.first + ' נוסף/ה למשפחת ' + fam.name + ' ושובצ/ה ל"' + c.name + '"');
  }
  saveJoin() {
    const s = this.state, f = s.joinForm || {};
    const fam = s.families.find(x => x.id === s.selId); if (!fam) return;
    if (!f.memberId) { this.setState({ joinError: 'יש לבחור ילד/ה או הורה' }); return; }
    const c = s.courses.find(x => x.id === f.courseId);
    if (!c) { this.setState({ joinError: 'יש לבחור חוג' }); return; }
    let memberId = f.memberId;
    if (memberId === '__pf' || memberId === '__pm') {
      const isF = memberId === '__pm';
      let pm = fam.members.find(x => x.isParent && x.gender === (isF ? 'f' : 'm'));
      if (!pm) {
        pm = { id: 'mp' + s.seq, first: (isF ? fam.mother : fam.father) || (isF ? 'אמא' : 'אבא'), gender: isF ? 'f' : 'm', birth: '', idNum: '', phone: '', phone2: '', school: '', grade: '', health: '', mSefach: false, mInvite: false, mRecommend: false, mPhotos: false, mVideos: false, notes: '', isParent: true };
        fam.members.push(pm);
      }
      memberId = pm.id;
    }
    if (s.enrollments.some(e => e.memberId === memberId && e.courseId === c.id)) { this.setState({ joinError: 'כבר משובץ/ת לחוג הזה' }); return; }
    const n = s.enrollments.filter(e => e.courseId === c.id).length;
    if (n >= (c.maxStudents || 999)) { this.setState({ joinError: 'החוג מלא (' + n + '/' + c.maxStudents + ')' }); return; }
    const isP = c.model === 'punch';
    const purchased = isP ? +(f.purchased || c.size || 12) : 0;
    if (isP && (isNaN(purchased) || purchased <= 0)) { this.setState({ joinError: 'מספר ניקובים חייב להיות גדול מ-0' }); return; }
    s.enrollments.push({ id: 'e' + s.seq, memberId, courseId: c.id, plan: c.model, purchased, used: 0, group: f.group || '', absences: [], enrolledAt: this.isoOf(new Date()) });
    const mm = fam.members.find(x => x.id === memberId);
    this.setState({ enrollments: s.enrollments, seq: s.seq + 2, modal: null, joinError: '' });
    this.t((mm ? mm.first : '') + ' שובצ/ה ל"' + c.name + '"');
  }
  openTeacher(id) {
    const t = this.teachers.find(x => x.id === id); if (!t) return;
    this.setState({ modal: 'teacher', teacherEditId: id, teacherError: '', tForm: { name: t.name, phone: t.phone || '', phone2: t.phone2 || '', email: t.email || '', idNum: t.idNum || '', address: t.address || '', specialty: t.specialty || '', payRate: t.payRate != null && t.payRate !== '' ? String(t.payRate) : '', startDate: t.startDate || '', notes: t.notes || '' } });
  }
  saveTeacherFull() {
    const s = this.state, f = s.tForm || {};
    const nm = (f.name || '').trim();
    if (!nm) { this.setState({ teacherError: 'שם המורה הוא שדה חובה' }); return; }
    if ((f.idNum || '').trim() && !this.validId(f.idNum.trim())) { this.setState({ teacherError: 'ת"ז לא תקינה (ספרת ביקורת שגויה)' }); return; }
    if ((f.email || '').trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(f.email.trim())) { this.setState({ teacherError: 'כתובת האימייל לא תקינה' }); return; }
    if ((f.payRate || '').trim() && (isNaN(+f.payRate) || +f.payRate < 0)) { this.setState({ teacherError: 'תעריף לשעה חייב להיות מספר' }); return; }
    const patch = { name: nm, phone: this.fixPhone((f.phone || '').trim()), phone2: this.fixPhone((f.phone2 || '').trim()), email: (f.email || '').trim(), idNum: (f.idNum || '').trim(), address: (f.address || '').trim(), specialty: (f.specialty || '').trim(), payRate: (f.payRate || '').trim() ? +f.payRate : '', startDate: f.startDate || '', notes: (f.notes || '').trim() };
    if (s.teacherEditId) {
      const t = this.teachers.find(x => x.id === s.teacherEditId); if (!t) return;
      Object.assign(t, patch);
      this.persist(); this.setState({ modal: null, teacherError: '' });
      this.t('כרטיס המורה עודכן — משתקף בכל החוגים, החיפוש והייצוא');
    } else {
      if (this.teachers.some(x => x.name === nm)) { this.setState({ teacherError: 'כבר קיימת מורה בשם הזה' }); return; }
      this.teachers.push({ id: 't' + s.seq, ...patch });
      this.persist(); this.setState({ modal: null, teacherError: '', seq: s.seq + 1 });
      this.t('המורה ' + nm + ' נוספה — זמינה לשיבוץ בכל חוג');
    }
  }
  saveRoom() {
    const s = this.state, f = s.newRoomForm || {};
    if (!f.name || !f.name.trim()) { this.setState({ newRoomError: 'שם החדר הוא שדה חובה' }); return; }
    if (s.rooms.some(r => r.name === f.name.trim())) { this.setState({ newRoomError: 'כבר קיים חדר בשם הזה' }); return; }
    const slot = +f.slot || 60;
    s.rooms.push({ id: 'r' + s.seq, name: f.name.trim(), active: true, slot });
    this.setState({ rooms: s.rooms, seq: s.seq + 1, modal: null, newRoomError: '' });
    this.t('החדר "' + f.name.trim() + '" נוסף — היומן שלו זמין ברצועת החדרים');
  }
  supScore(sp) {
    const tot = (sp.ils || 0) + (sp.usd || 0) * 3.7;
    const days = sp.last ? Math.floor((Date.now() - new Date(sp.last + 'T12:00:00').getTime()) / 86400000) : 9999;
    const R = days <= 30 ? 350 : days <= 90 ? 280 : days <= 180 ? 200 : days <= 365 ? 120 : 40;
    const F = (sp.count || 0) >= 10 ? 300 : sp.count >= 5 ? 230 : sp.count >= 3 ? 160 : sp.count >= 2 ? 100 : 50;
    const M = tot >= 5000 ? 350 : tot >= 2000 ? 280 : tot >= 1000 ? 210 : tot >= 500 ? 140 : tot >= 100 ? 80 : 40;
    return R + F + M;
  }
  supTier(sc) { return sc >= 800 ? ['זהב', '#fdf3dd', '#9a6414', '#f3c76b'] : sc >= 600 ? ['כסף', '#eef1f5', '#44546a', '#94a3b8'] : sc >= 400 ? ['ארד', '#f6ead1', '#9a6414', '#d97706'] : ['רדומה', '#eceae2', '#8b8474', '#a8a29e']; }
  supReceipt(sp, d) {
    const s = this.state;
    const L = ['קבלה על תרומה — ' + (s.orgName || 'מאור החסד'), 'מס׳: ' + d.rid, 'תאריך: ' + this.hebDateFull(d.date) + ' · ' + this.fmtD(d.date), '',
      'תורם/ת: ' + sp.name + (sp.idNum ? ' · ת"ז ' + sp.idNum : ''), 'סכום: ' + (d.cur === '$' ? '$' : '₪') + d.amount + (d.cat ? ' · ' + d.cat : ''),
      'סה"כ מצטבר: ₪' + (sp.ils || 0).toLocaleString('he-IL') + (sp.usd ? ' + $' + sp.usd.toLocaleString('he-IL') : '') + ' · ' + sp.count + ' תרומות', '', 'תזכו למצוות!'];
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob(['\uFEFF' + L.join('\n')], { type: 'text/plain;charset=utf-8' }));
    a.download = 'donation-' + d.rid + '.txt'; a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 5000);
  }
  addDonation() {
    const s = this.state, sp = (s.supporters || []).find(x => x.id === s.supEditId); if (!sp) return;
    const amt = Math.round((+(s.donAmt || 0)) * 100) / 100;
    if (!amt || amt <= 0) { this.t('הקלידו סכום תרומה תקין'); return; }
    const d = { rid: 'D-' + s.seq, date: s.donDate || this.isoOf(new Date()), amount: amt, cur: s.donCur || '₪', cat: (s.donCat || sp.cat || '').trim() };
    sp.donations = sp.donations || []; sp.donations.push(d);
    sp.count = (sp.count || 0) + 1;
    if (d.cur === '$') sp.usd = (sp.usd || 0) + amt; else sp.ils = (sp.ils || 0) + amt;
    if (!sp.last || d.date > sp.last) sp.last = d.date;
    const dj = new Date(d.date + 'T12:00:00');
    this.setState({ supporters: s.supporters, seq: s.seq + 1, donAmt: '', supCalY: dj.getFullYear(), supCalM: dj.getMonth(), supCalDay: d.date });
    this.t('נרשמה תרומה ' + (d.cur === '$' ? '$' : '₪') + amt + ' — מסומנת בלוח, הציון עודכן והקבלה ירדה');
    this.supReceipt(sp, d);
  }
  saveSupNext(v) {
    const s = this.state, sp = (s.supporters || []).find(x => x.id === s.supEditId); if (!sp) return;
    sp.nextDate = v;
    if (v) {
      let ev = s.events.find(x => x.id === sp.nextEventId);
      if (!ev) { ev = { id: 'ev' + s.seq, type: 'call', title: '', date: v, time: '', notes: '', priority: 'orange', price: 0, roomId: '' }; s.events.push(ev); sp.nextEventId = ev.id; s.seq++; }
      ev.title = 'יעד קשר — תומכת: ' + sp.name;
      ev.date = v; ev.done = false; ev.notes = 'משפחה תומכת · ' + (sp.phone || '') + (sp.email ? ' · ' + sp.email : '');
      this.t('נקבע תאריך יעד ' + this.hebDateFull(v) + ' — מסומן 🎯 בלוח התרומות ונוספה תזכורת ללוח השנה');
    } else this.t('תאריך היעד נוקה');
    const vj = v ? new Date(v + 'T12:00:00') : null;
    this.setState({ supporters: s.supporters, events: s.events, seq: s.seq, ...(vj ? { supCalY: vj.getFullYear(), supCalM: vj.getMonth(), supCalDay: v } : {}) });
  }
  exportCourseStudents(c) {
    const s = this.state, allM = this.allMembers();
    const rows = [['תלמיד/ה', 'גיל', 'משפחה', 'טלפון', 'קבוצה', 'מסלול', 'יתרה', 'רגישויות/רפואי', 'הערה']];
    for (const e of s.enrollments.filter(e2 => e2.courseId === c.id)) {
      const m = allM.find(x => x.id === e.memberId) || {};
      const fam = s.families.find(f2 => f2.id === m.famId) || {};
      rows.push([m.first || '', this.age(m.birth) ?? '', fam.name || '', m.phone || fam.phone || '', e.group || '', e.plan === 'punch' ? 'כרטיסייה ' + (e.purchased - e.used) + '/' + e.purchased : 'מנוי', e.plan === 'punch' ? (e.purchased - e.used) : '', m.health || '', e.note || '']);
    }
    this.csvDown('course-' + c.name + '.csv', rows);
    this.t('רשימת התלמידים של "' + c.name + '" ירדה — כולל רגישויות למורה');
  }
  exportCourseDaily(c) {
    const s = this.state, allM = this.allMembers();
    const DAYN = ['ראשון', 'שני', 'שלישי', 'רביעי', 'חמישי', 'שישי', 'שבת'];
    if (!c.start || !c.end) { this.t('לחוג חסר תאריך התחלה/סיום — עדכנו בעריכת הקורס'); return; }
    const enrolls = s.enrollments.filter(e => e.courseId === c.id);
    const rows = [['תאריך עברי', 'תאריך לועזי', 'יום', 'קבוצה/שעה', 'סטטוס יום', 'תלמידה פעילה', 'משפחה', 'מסלול', 'נוכחות/חיסור']];
    const start = new Date(c.start + 'T12:00:00'), end = new Date(c.end + 'T12:00:00');
    let days = 0;
    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      const iso = this.isoOf(d), dow = d.getDay();
      const sess = this.sessionsOf(c).filter(ss => ss.day === dow);
      if (!sess.length) continue;
      days++;
      for (const ss of sess) {
        const slot = (ss.label || 'קבוצה') + ' · ' + (ss.time || '');
        const active = enrolls.filter(e => (e.status !== 'ended') && (!e.enrolledAt || e.enrolledAt <= iso) && (!ss.label || !e.group || e.group === ss.label));
        if (!active.length) { rows.push([this.hebDateFull(iso), this.fmtD(iso), DAYN[dow], slot, 'אין רשומות', '', '', '', '']); continue; }
        for (const e of active) {
          const m = allM.find(x => x.id === e.memberId) || {};
          const fam = s.families.find(f2 => f2.id === m.famId) || {};
          const abs = (e.absences || []).find(a => a.date === iso);
          const status = e.status === 'paused' ? 'מוקפא' : abs ? (abs.noshow ? 'לא הופיעה' : 'חיסור' + (abs.reason ? ' · ' + abs.reason : '')) : 'פעיל';
          rows.push([this.hebDateFull(iso), this.fmtD(iso), DAYN[dow], slot, e.status === 'paused' ? 'מוקפא' : 'מתקיים', m.first || '', fam.name || '', this.planWord(e.plan), status]);
        }
      }
    }
    if (days === 0) { this.t('אין מפגשים בטווח התאריכים של החוג'); return; }
    this.csvDown('course-daily-' + c.name + '.csv', rows);
    this.t('דו"ח יומי מפורט של "' + c.name + '" ירד — ' + days + ' ימי פעילות, ' + this.fmtD(c.start) + '–' + this.fmtD(c.end));
  }
  supDonEvents(sp) {
    const out = (sp.donations || []).map(d => ({ date: d.date, amount: d.amount, cur: d.cur || '₪', src: 'קבלה ' + d.rid, rid: d.rid }));
    for (const h of (sp.hist || [])) out.push({ date: h.d, amount: h.a, cur: h.c || '₪', src: 'מהקובץ ההיסטורי' });
    if (!(sp.hist || []).length) {
      const seen = new Set(out.map(x => x.date));
      if (sp.first && !seen.has(sp.first)) out.push({ date: sp.first, amount: 0, cur: '', src: 'תרומה ראשונה (מהקובץ)' });
      if (sp.last && sp.last !== sp.first && !seen.has(sp.last)) out.push({ date: sp.last, amount: 0, cur: '', src: 'תרומה אחרונה (מהקובץ)' });
    }
    return out.sort((a, b) => String(b.date).localeCompare(String(a.date)));
  }
  supCalData(events) {
    const s = this.state, now = new Date();
    const y = s.supCalY != null ? s.supCalY : now.getFullYear();
    const m = s.supCalM != null ? s.supCalM : now.getMonth();
    const byDay = {};
    for (const e of events) if (e.date) (byDay[e.date] = byDay[e.date] || []).push(e);
    const heb = !!s.supCalHeb;
    let first = new Date(y, m, 1);
    if (heb) { first = new Date((s.supCalRef || this.isoOf(now)) + 'T12:00:00'); for (let k = 0; k < 32 && +this.hebParts(first).day !== 1; k++) first.setDate(first.getDate() - 1); }
    const start = new Date(first.getFullYear(), first.getMonth(), first.getDate() - first.getDay());
    const h0 = heb ? this.hebParts(first) : null;
    const inMonth = (d) => heb ? (() => { const hp = this.hebParts(d); return hp.month === h0.month && this.fmtHY.format(d) === this.fmtHY.format(first); })() : (d.getFullYear() === y && d.getMonth() === m);
    const todayIso = this.isoOf(now);
    let mc = 0, mi = 0, mu = 0;
    for (const iso in byDay) {
      const d = new Date(iso + 'T12:00:00');
      if (inMonth(d)) { mc += byDay[iso].length; for (const e of byDay[iso]) { if (e.cur === '$') mu += e.amount || 0; else mi += e.amount || 0; } }
    }
    const cells = [];
    for (let i = 0; i < 42; i++) {
      const d = new Date(start.getFullYear(), start.getMonth(), start.getDate() + i);
      const iso = this.isoOf(d), evs = byDay[iso] || [], inM = inMonth(d);
      cells.push({ n: String(d.getDate()), heb: this.gem(this.hebParts(d).day), has: evs.length > 0, count: String(evs.length),
        cellBg: iso === todayIso ? 'rgba(243,199,107,.3)' : inM ? 'rgba(255,255,255,.8)' : 'rgba(33,29,23,.04)',
        op: inM ? '1' : '.45', bd: s.supCalDay === iso ? '2px solid #b45309' : '1px solid rgba(33,29,23,.07)',
        cur: evs.length ? 'pointer' : 'default',
        pick: () => { if (evs.length) this.setState({ supCalDay: s.supCalDay === iso ? null : iso }); } });
    }
    const dayList = (byDay[s.supCalDay] || []).map(e => ({ line: (e.name ? e.name + ' · ' : '') + (e.amount ? (e.cur === '$' ? '$' : '₪') + e.amount : '') + (e.src ? ' · ' + e.src : ''), go: e.spId ? () => this.setState({ supQ: e.name || '', supCalDay: null }) : null }));
    const gEnd = new Date(y, m + 1, 0);
    return { cells,
      hebOn: heb, gridHebBg: heb ? '#211d17' : '#fff', gridHebC: heb ? '#f3c76b' : '#8b8474', gridGregBg: heb ? '#fff' : '#211d17', gridGregC: heb ? '#8b8474' : '#f3c76b',
      toHeb: () => this.setState({ supCalHeb: true, supCalRef: this.isoOf(first), supCalDay: null }),
      toGreg: () => this.setState({ supCalHeb: false, supCalM: first.getMonth(), supCalY: first.getFullYear(), supCalDay: null }),
      label: heb ? this.fmtHM.format(first) + ' ' + this.gemYear(this.fmtHY.format(first)) : new Intl.DateTimeFormat('he', { month: 'long', year: 'numeric' }).format(first),
      hebLabel: heb ? new Intl.DateTimeFormat('he', { month: 'long', year: 'numeric' }).format(first) + ' – ' + new Intl.DateTimeFormat('he', { month: 'long', year: 'numeric' }).format(new Date(first.getFullYear(), first.getMonth(), first.getDate() + 28)) : this.fmtHM.format(first) + '–' + this.fmtHM.format(gEnd) + ' ' + this.gemYear(this.fmtHY.format(gEnd)),
      monthLine: mc ? mc + ' תרומות החודש · ' + ((mi ? '₪' + mi.toLocaleString('he-IL') : '') + (mi && mu ? ' + ' : '') + (mu ? '$' + mu.toLocaleString('he-IL') : '') || 'סכומים מהקובץ ההיסטורי') : 'אין תרומות מתועדות בחודש זה',
      prev: () => { if (heb) { const p = new Date(first); p.setDate(p.getDate() - 1); this.setState({ supCalRef: this.isoOf(p), supCalDay: null }); return; } const nm = m - 1; this.setState(nm < 0 ? { supCalM: 11, supCalY: y - 1, supCalDay: null } : { supCalM: nm, supCalY: y, supCalDay: null }); },
      next: () => { if (heb) { const p = new Date(first); p.setDate(p.getDate() + 30); this.setState({ supCalRef: this.isoOf(p), supCalDay: null }); return; } const nm = m + 1; this.setState(nm > 11 ? { supCalM: 0, supCalY: y + 1, supCalDay: null } : { supCalM: nm, supCalY: y, supCalDay: null }); },
      dayLabel: s.supCalDay ? this.hebDateFull(s.supCalDay) + ' · ' + this.fmtD(s.supCalDay) : '',
      dayList, hasDay: !!(s.supCalDay && dayList.length) };
  }
  exportSupportersCSV() {
    const s = this.state;
    const rows = [['שם', 'טלפון', 'אימייל', 'ת"ז', 'כתובת', 'קטגוריה', 'עבור', 'תרומות', 'סה"כ ₪', 'סה"כ $', 'ציון משוקלל', 'דרגה', 'תרומה ראשונה', 'תרומה אחרונה', 'תאריך יעד', 'הערות']];
    for (const sp of (s.supporters || [])) { const sc = this.supScore(sp); rows.push([sp.name, sp.phone || '', sp.email || '', sp.idNum || '', sp.address || '', sp.cat || '', sp.forWho || '', sp.count || 0, sp.ils || 0, sp.usd || 0, sc, this.supTier(sc)[0], sp.first || '', sp.last || '', sp.nextDate || '', sp.notes || '']); }
    this.csvDown('maor-supporters.csv', rows); this.t('קובץ התומכות ירד — כולל ציון משוקלל ודרגות');
  }
  armDel(key) {
    if (this.state.delConfirm !== key) {
      this.setState({ delConfirm: key }); clearTimeout(this._dcT);
      this._dcT = setTimeout(() => this.setState({ delConfirm: null }), 3500); return false;
    }
    this.setState({ delConfirm: null }); return true;
  }
  deleteFamily(fid) {
    if (!this.armDel('fam' + fid)) return;
    const s = this.state, f = s.families.find(x => x.id === fid); if (!f) return;
    const mids = new Set(f.members.map(m => m.id));
    this.setState({ families: s.families.filter(x => x.id !== fid), enrollments: s.enrollments.filter(e => !mids.has(e.memberId)), selId: null });
    this.t('משפחת ' + f.name + ' נמחקה — כולל ' + f.members.length + ' בני משפחה והשיבוצים שלהם');
  }
  deleteMember(fid, mid) {
    if (!this.armDel('mem' + mid)) return;
    const s = this.state, f = s.families.find(x => x.id === fid); if (!f) return;
    const m = f.members.find(x => x.id === mid); if (!m) return;
    f.members = f.members.filter(x => x.id !== mid);
    this.setState({ families: s.families, enrollments: s.enrollments.filter(e => e.memberId !== mid) });
    this.t(m.first + ' נמחק/ה מהמשפחה — כולל השיבוצים בחוגים');
  }
  deleteCourse(cid) {
    if (!this.armDel('crs' + cid)) return;
    const s = this.state, c = s.courses.find(x => x.id === cid); if (!c) return;
    const n = s.enrollments.filter(e => e.courseId === cid).length;
    this.setState({ courses: s.courses.filter(x => x.id !== cid), enrollments: s.enrollments.filter(e => e.courseId !== cid), selCourseId: null });
    this.t('החוג "' + c.name + '" נמחק' + (n ? ' — כולל ' + n + ' שיבוצים' : '') + ' · הוסר גם מהלוח ומהיומנים');
  }
  deleteSupporter(spid) {
    if (!this.armDel('sup' + spid)) return;
    const s = this.state, sp = (s.supporters || []).find(x => x.id === spid); if (!sp) return;
    this.setState({ supporters: s.supporters.filter(x => x.id !== spid), modal: null, supEditId: null });
    this.t('התומכת "' + sp.name + '" נמחקה מהמערכת');
  }
  quickRemoveEnroll(eid, ev) {
    if (ev && ev.stopPropagation) ev.stopPropagation();
    const s = this.state;
    if (s.rmConfirmId !== eid) {
      this.setState({ rmConfirmId: eid }); clearTimeout(this._rmT);
      this._rmT = setTimeout(() => this.setState({ rmConfirmId: null }), 3500); return;
    }
    const i = s.enrollments.findIndex(e => e.id === eid);
    if (i >= 0) {
      const en = s.enrollments[i];
      const m = this.allMembers().find(x => x.id === en.memberId) || {};
      const c = s.courses.find(x => x.id === en.courseId) || {};
      s.enrollments.splice(i, 1);
      this.setState({ enrollments: s.enrollments, rmConfirmId: null });
      this.t('השיבוץ של ' + (m.first || 'התלמיד/ה') + ' ב"' + (c.name || 'החוג') + '" נמחק סופית');
    }
  }
  ayinOf(sp) { if (!sp.ayin) sp.ayin = { stage: 'new', eyes: '', note: '', nextTalk: '', lastTouch: '' }; return sp.ayin; }
  openSupCard(id) {
    const sp = (this.state.supporters || []).find(x => x.id === id); if (!sp) return;
    this.setState({ view: 'support', modal: 'supporter', supEditId: id, selId: null, selCourseId: null,
      supForm: { name: sp.name, phone: sp.phone || '', email: sp.email || '', address: sp.address || '', idNum: sp.idNum || '', cat: sp.cat || '', forWho: sp.forWho || '', notes: sp.notes || '' } });
  }
  static AYIN_STAGES = [['new', 'שיחה חדשה — לקחת שמות'], ['lead', 'לעשות עופרת'], ['eyes', 'רישום עיניים'], ['answer', 'למסור תשובות'], ['done', 'הושלם']];
  ayinTouch(sp, patch) {
    const a = this.ayinOf(sp); Object.assign(a, patch); a.lastTouch = this.isoOf(new Date());
    this.setState({ supporters: this.state.supporters });
  }
  ayinCall(sp, kind) {
    const title = (kind === 'answer' ? 'למסור תשובות — ' : kind === 'again' ? 'לדבר שוב — ' : 'עין הרע: שיחה ראשונית — ') + sp.name;
    const date = this.ayinOf(sp).nextTalk || this.isoOf(new Date());
    this.state.events.push({ id: 'ev' + this.state.seq, title, date, time: this.ayinOf(sp).nextTalkTime || '', type: 'call', notes: 'עין הרע · ' + (sp.phone || '') + (sp.ayin && sp.ayin.eyes !== '' ? ' · עיניים: ' + sp.ayin.eyes : ''), priority: 'yellow' });
    this.setState({ events: this.state.events, seq: this.state.seq + 1 });
    this.t('תזכורת "' + title + '" נכנסה ללוח השנה');
  }
  ayinDailyReport() {
    const today = this.isoOf(new Date());
    const rows = (this.state.supporters || []).filter(sp => sp.ayin && (sp.ayin.lastTouch === today || (sp.ayin.log || []).some(l => l.date === today)));
    if (!rows.length) { this.t('עוד לא עודכן אף שם היום — עדכנו עיניים/שלב בכרטיס והדוח יתמלא'); return; }
    const st = Object.fromEntries(Component.AYIN_STAGES);
    const eyesToday = (sp) => { const l = (sp.ayin.log || []).filter(x => x.date === today); return l.length ? l.reduce((t2, x2) => t2 + (+x2.eyes || 0), 0) : (sp.ayin.eyes || ''); };
    const namesLine = (sp) => ((sp.ayin.names || []).map(x => x.name + (x.eyes ? ' 🧿' + x.eyes : '') + (x.done ? ' ✓' : '')).join(' · ')).replace(/,/g, ' ');
    const csv = [['שם', 'טלפון', 'עיניים היום', 'שלב', 'שמות למסירה', 'מתי לדבר שוב', 'הערה']].concat(rows.map(sp => [sp.name, sp.phone || '', eyesToday(sp), st[sp.ayin.stage] || '', namesLine(sp), sp.ayin.nextTalk ? this.fmtD(sp.ayin.nextTalk) : '', (((sp.ayin.answers || []).map(x => x.note).join(' | ')) || sp.ayin.note || '').replace(/,/g, ' ')]));
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob(['\uFEFF' + csv.map(r => r.join(',')).join('\n')], { type: 'text/csv' }));
    a.download = 'ayin-hara-' + today + '.csv'; a.click();
    this.t('דוח יומי: ' + rows.length + ' שמות שטופלו היום — הקובץ ירד');
  }
  ayinActionLabel(sp) {
    const a = sp.ayin || {}; const st = a.stage || 'new';
    if (st === 'done') return '';
    if (st === 'new' && !(a.names || []).length) return '';
    if (st === 'eyes' && !(a.names || []).some(x => x.eyes !== '' && x.eyes != null)) return '';
    return st === 'new' ? 'לעשות עופרת ←' : st === 'lead' ? '🫙 אישור עופרת' : st === 'eyes' ? 'למסור תשובות ←' : (a.answerPushed ? '✓ השלמה' : '📞 דחיפה ללוח');
  }
  ayinAction(sp) {
    const ay = this.ayinOf(sp); const st = ay.stage || 'new';
    const ayEvent = (title, done2) => { this.state.events.push({ id: 'ev' + this.state.seq, title, date: ay.nextTalk || this.isoOf(new Date()), time: ay.nextTalkTime || '', type: 'call', notes: 'עין הרע · ' + (sp.phone || ''), priority: 'yellow', done: !!done2 }); this.setState({ events: this.state.events, seq: this.state.seq + 1 }); };
    if (st === 'new') { ayEvent('עין הרע: לעשות עופרת — ' + sp.name + ' (' + (ay.names || []).length + ' שמות)'); this.ayinTouch(sp, { stage: 'lead' }); this.t('נרשמו ' + (ay.names || []).length + ' שמות — נכנס ללוח: לעשות עופרת'); return; }
    if (st === 'lead') { ayEvent('עופרת נעשתה — ' + sp.name + ' (' + (ay.names || []).length + ' שמות)', true); this.ayinTouch(sp, { stage: 'eyes' }); this.t('העופרת אושרה — נרשם בלוח ובדוח. עכשיו: רישום עיניים לכל שם'); return; }
    if (st === 'eyes') { const eyes2 = (ay.names || []).reduce((t2, x2) => t2 + (+x2.eyes || 0), 0); ayEvent('עין הרע: למסור תשובות — ' + sp.name + ' (🧿 ' + eyes2 + ' עיניים)'); this.ayinTouch(sp, { stage: 'answer' }); this.t('העיניים נרשמו — נכנס ללוח: למסור תשובות'); return; }
    if (st === 'answer' && !ay.answerPushed) { this.ayinCall(sp, 'answer'); this.ayinTouch(sp, { answerPushed: true }); return; }
    if (st !== 'done') { ayEvent('עין הרע: הטיפול הושלם — ' + sp.name, true); this.ayinTouch(sp, { stage: 'done' }); this.t('הטיפול הושלם ✓ — נרשם בלוח'); }
  }
  dupFields() {
    return [
      ['name', 'שם משפחה', f => f.name || ''], ['mother', 'שם האם', f => f.mother || ''], ['father', 'שם האב', f => f.father || ''],
      ['phone', 'טלפון', f => f.phone || ''], ['phone2', 'טלפון 2', f => f.phone2 || ''], ['email', 'אימייל', f => f.email || ''],
      ['city', 'עיר', f => f.city || ''], ['address', 'כתובת', f => f.address || ''],
      ['motherId', 'ת"ז אם', f => f.motherId || ''], ['fatherId', 'ת"ז אב', f => f.fatherId || ''],
      ['community', 'קהילה', f => f.community || ''], ['language', 'שפה', f => f.language || ''], ['maritalStatus', 'מצב משפחתי', f => f.maritalStatus || ''],
      ['status', 'סטטוס', f => f.status || ''], ['kidsHome', 'ילדים בבית', f => f.kidsHome == null ? '' : String(f.kidsHome)], ['kidsMarried', 'ילדים נשואים', f => f.kidsMarried == null ? '' : String(f.kidsMarried)],
      ['createdAt', 'נרשמה', f => f.createdAt || ''], ['notes', 'הערות', f => f.notes || '']
    ];
  }
  dupFieldMerge(ids) {
    const s = this.state, fs = ids.map(id => s.families.find(f => f.id === id)).filter(Boolean);
    if (fs.length < 2) return;
    const keep = fs[0], pick = s.dupPick || {}, edit = s.dupEdit || {};
    for (const [key, , get] of this.dupFields()) {
      let val;
      if (edit[key] != null) val = edit[key];
      else { const idx = pick[key] != null ? pick[key] : fs.findIndex(f => get(f)); val = get(fs[idx >= 0 ? idx : 0]); }
      if (key === 'kidsHome' || key === 'kidsMarried') keep[key] = val === '' ? 0 : +val;
      else keep[key] = val;
    }
    const seen = new Set(), mem = [], doc = [];
    for (const f of fs) { for (const m of (f.members || [])) { const k = (m.first || '') + '|' + (m.birth || ''); if (!seen.has(k)) { seen.add(k); mem.push(m); } } for (const d of (f.docs || [])) doc.push(d); }
    keep.members = mem; keep.docs = doc;
    const del = new Set(fs.slice(1).map(f => f.id));
    this.setState({ families: s.families.filter(f => !del.has(f.id) || f.id === keep.id), dupIds: null, dupPick: {}, dupEdit: {} }, () => { try { this.persist(); } catch (e) {} });
    this.t('הרשומות מוזגו לפי הבחירה ✓ — נשמרה רשומה אחת');
  }
  dupMerge(ids, keepId) {
    const s = this.state, keep = s.families.find(f => f.id === keepId);
    if (!keep) return;
    const others = ids.filter(x => x !== keepId).map(x => s.families.find(f => f.id === x)).filter(Boolean);
    const F = ['phone', 'phone2', 'email', 'address', 'city', 'father', 'mother', 'fatherId', 'motherId', 'community', 'language', 'maritalStatus'];
    for (const o of others) {
      for (const k of F) if (!keep[k] && o[k]) keep[k] = o[k];
      if (o.phone && o.phone !== keep.phone && !keep.phone2) keep.phone2 = o.phone;
      if ((+o.kidsHome || 0) > (+keep.kidsHome || 0)) keep.kidsHome = o.kidsHome;
      if ((+o.kidsMarried || 0) > (+keep.kidsMarried || 0)) keep.kidsMarried = o.kidsMarried;
      keep.members = (keep.members || []).concat(o.members || []);
      keep.docs = (keep.docs || []).concat(o.docs || []);
      if (keep.status !== 'active' && o.status === 'active') keep.status = 'active';
      const on = (o.notes || '').trim();
      if (on && !(keep.notes || '').includes(on)) keep.notes = ((keep.notes || '') + ' | מוזג: ' + on).trim();
    }
    const del = new Set(others.map(o => o.id));
    this.setState({ families: s.families.filter(f => !del.has(f.id)), dupIds: null }, () => { try { this.persist(); } catch (e) {} });
    this.t('מוזגו ' + (others.length + 1) + ' רשומות ל"' + keep.name + '" ✓');
  }
  dupDrop(ids, dropIds) {
    const del = new Set(dropIds);
    const left = ids.filter(x => !del.has(x));
    this.setState({ families: this.state.families.filter(f => !del.has(f.id)), dupIds: left.length > 1 ? left : null }, () => { try { this.persist(); } catch (e) {} });
    this.t('נמחקו ' + dropIds.length + ' רשומות');
  }
  expFieldDefs(target) {
    return target === 'courses' ? [
      ['name', 'שם החוג'], ['teacher', 'מורה + טלפון'], ['grade', 'כיתות'], ['audience', 'קהל יעד'], ['room', 'חדר'], ['schedule', 'יום ושעה'], ['model', 'מסלול ומחיר'], ['occ', 'תפוסה'], ['students', 'רשימת תלמידים'], ['studentsFull', 'תלמידים + טלפון + יתרה'], ['pays', 'תשלומים בטווח'], ['revenue', 'סה"כ הכנסות'], ['abs', 'חיסורים בטווח'], ['notes', 'הערות']
    ] : target === 'events' ? [
      ['title', 'כותרת'], ['type', 'סוג אירוע'], ['hdate', 'תאריך עברי'], ['gdate', 'תאריך לועזי'], ['time', 'שעה'], ['fam', 'משפחה'], ['priority', 'עדיפות'], ['notes', 'הערות'], ['done', 'בוצע']
    ] : [
      ['name', 'שם'], ['phone', 'טלפון'], ['email', 'אימייל'], ['address', 'כתובת'], ['city', 'עיר'], ['cat', 'קטגוריה'], ['forWho', 'עבור מי'], ['dons', 'תרומות בטווח (מספר + סכום)'], ['donsAll', 'סה"כ תרומות (כל הזמן)'], ['tier', 'דירוג'], ['stage', 'שלב עין הרע'], ['names', 'שמות למסירה + עיניים'], ['eyesTotal', 'סה"כ עיניים'], ['paid', 'שולם'], ['answers', 'תשובות/הערות בטווח'], ['next', 'תאריך יעד ליצירת קשר'], ['notes', 'הערות']
    ];
  }
  customExportData() {
    const s = this.state, from = s.expFrom || '0000-01-01', to = s.expTo || '9999-12-31';
    const inR = (d) => !!d && d >= from && d <= to;
    const sel = s.expSel || {}; const defs = this.expFieldDefs(s.expTarget).filter(f => sel[f[0]] !== false);
    const data = [];
    if (s.expTarget === 'events') {
      const occ = [];
      for (const ev of s.events) {
        if (!ev.date) continue;
        if (this.evMeta(ev.type).recur) {
          const oh = this.hebParts(new Date(ev.date + 'T12:00:00'));
          const d0 = new Date(from + 'T12:00:00'), d1 = new Date(to + 'T12:00:00');
          for (let dd = new Date(d0), k = 0; dd <= d1 && k < 366; dd.setDate(dd.getDate() + 1), k++) {
            const hp = this.hebParts(dd);
            if (+hp.day === +oh.day && hp.month === oh.month) occ.push({ ev, date: this.isoOf(dd) });
          }
        } else if (inR(ev.date)) occ.push({ ev, date: ev.date });
      }
      for (const { ev, date } of occ.sort((a2, b2) => String(a2.date).localeCompare(String(b2.date)))) {
        const val = { title: ev.title, type: ev.customType || this.evMeta(ev.type).label, hdate: this.hebDateFull(date), gdate: this.fmtD(date), time: ev.time || '', fam: (s.families.find(x => x.id === ev.famId) || {}).name || '', priority: ev.priority === 'red' ? 'דחוף' : ev.priority === 'yellow' ? 'בינוני' : ev.priority ? 'רגיל' : '', notes: ev.notes || '', done: ev.done ? 'כן' : 'לא' };
        data.push({ key: ev.id + '-' + date, label: ev.title + ' · ' + this.fmtD(date), noteSeed: ev.notes || '', cells: defs.map(f => String(val[f[0]] ?? '').replace(/,/g, ' ')) });
      }
    } else if (s.expTarget === 'courses') {
      const allM = this.allMembers();
      for (const c of s.courses) {
        const ens = s.enrollments.filter(e => e.courseId === c.id);
        let payN = 0, paySum = 0, absN = 0;
        for (const e of ens) { for (const p of (e.payments || [])) if (inR(p.date)) { payN++; paySum += p.amount || 0; } for (const a2 of (e.absences || [])) if (inR(a2.date)) absN++; }
        const t2 = this.teachers.find(x => x.id === c.teacherId) || {};
        const revAll = ens.reduce((x, e) => { const p = c.price || 0; return x + ((e.status || 'active') !== 'active' ? 0 : c.model === 'monthly' ? p : c.model === 'half_year' ? p / 6 : c.model === 'year' ? p / 12 : 0); }, 0);
        const val = { name: c.name, teacher: (t2.name || '') + (t2.phone ? ' ' + t2.phone : ''), grade: this.gradeRange(c) || '—', audience: c.audience || '', room: (this.rooms || []).find(r => r.id === c.roomId) ? (this.rooms.find(r => r.id === c.roomId).name || '') : (c.room || ''), schedule: [c.day, c.time].filter(Boolean).join(' '), model: this.planWord(c.model) + ' · ₪' + (c.price || 0), occ: ens.length + '/' + (c.maxStudents || '—'), students: ens.map(e => (allM.find(m => m.id === e.memberId) || {}).first || '').filter(Boolean).join(' · '), studentsFull: ens.map(e => { const m = allM.find(m => m.id === e.memberId) || {}; const bal = (e.payments || []).reduce((x, p) => x + (p.amount || 0), 0); return (m.first || '') + (m.phone ? ' ' + m.phone : '') + ' (₪' + bal + ')'; }).filter(Boolean).join(' · '), pays: payN + ' תשלומים · ₪' + paySum, revenue: '₪' + Math.round(revAll) + ' לחודש', abs: absN + ' חיסורים', notes: c.notes || '' };
        data.push({ key: c.id, label: c.name, noteSeed: c.notes || '', cells: defs.map(f => String(val[f[0]] ?? '').replace(/,/g, ' ')) });
      }
    } else {
      const st = { new: 'שיחה חדשה', lead: 'לעשות עופרת', eyes: 'רישום עיניים', answer: 'למסור תשובות', done: 'הושלם' };
      for (const sp of (s.supporters || [])) {
        const dons = (sp.donations || []).concat((sp.hist || []).map(h => ({ date: h.d, amount: h.a, cur: h.c }))).filter(d => inR(d.date));
        const allDons = (sp.donations || []).concat((sp.hist || []).map(h => ({ date: h.d, amount: h.a, cur: h.c })));
        const a = sp.ayin || {};
        const answers = (a.answers || []).filter(x => inR(x.date));
        if (!(dons.length || inR(a.lastTouch) || answers.length || (a.log || []).some(l => inR(l.date)))) continue;
        const ils = dons.filter(d => d.cur !== '$').reduce((x, d) => x + (+d.amount || 0), 0), usd = dons.filter(d => d.cur === '$').reduce((x, d) => x + (+d.amount || 0), 0);
        const ilsAll = allDons.filter(d => d.cur !== '$').reduce((x, d) => x + (+d.amount || 0), 0), usdAll = allDons.filter(d => d.cur === '$').reduce((x, d) => x + (+d.amount || 0), 0);
        const eyesT = (a.names || []).reduce((x, n) => x + (+n.eyes || 0), 0);
        const val = { name: sp.name, phone: sp.phone || '', email: sp.email || '', address: sp.address || '', city: sp.city || '', cat: sp.cat || '', forWho: sp.forWho || '', dons: dons.length + ' תרומות · ₪' + ils + (usd ? ' + $' + usd : ''), donsAll: allDons.length + ' תרומות · ₪' + ilsAll + (usdAll ? ' + $' + usdAll : ''), tier: this.supTier(this.supScore(sp))[0], stage: st[a.stage] || '', names: (a.names || []).map(n => n.name + (n.eyes !== '' && n.eyes != null ? ' 🧿' + n.eyes : '') + (n.done ? ' ✓' : '')).join(' · '), eyesTotal: String(eyesT), paid: a.paid ? 'כן' : 'לא', answers: answers.map(x => x.note).join(' | '), next: a.nextTalk ? this.fmtD(a.nextTalk) + (a.nextTalkTime ? ' ' + a.nextTalkTime : '') : '', notes: sp.notes || '' };
        data.push({ key: sp.id, label: sp.name, noteSeed: [(a.answers || [])[0] && (a.answers[0].note), sp.notes].filter(Boolean).join(' · '), cells: defs.map(f => String(val[f[0]] ?? '').replace(/,/g, ' ')) });
      }
    }
    return { defs, data, from, to };
  }
  runCustomExport() {
    const s = this.state;
    const { defs, data, from, to } = this.customExportData();
    if (!defs.length) { this.t('בחרו לפחות נתון אחד לייצוא'); return; }
    if (!data.length) { this.t('אין נתונים בטווח שנבחר'); return; }
    const withNotes = s.expWithNotes, en = s.expNotes || {};
    const header = defs.map(f => f[1]).concat(withNotes ? ['הערות ידניות'] : []);
    const rows = [header].concat(data.map(d => d.cells.concat(withNotes ? [String((en[s.expTarget + ':' + d.key] != null ? en[s.expTarget + ':' + d.key] : (d.noteSeed || ''))).replace(/,/g, ' ')] : [])));
    this.csvDown((s.expTarget === 'courses' ? 'courses-report-' : s.expTarget === 'events' ? 'events-report-' : 'supporters-report-') + from + '_' + to + '.csv', rows);
    this.setState({ expOpen: false });
    this.t('הדו"ח ירד — ' + data.length + ' שורות · ' + this.fmtD(from) + '–' + this.fmtD(to));
  }
  fixPhone(p) {
    const raw = String(p || '').trim();
    const d = raw.replace(/\D/g, '');
    if (!d || d[0] === '0') return raw;
    if (d.length === 9) return '0' + d.slice(0, 2) + '-' + d.slice(2);
    if (d.length === 8) return '0' + d[0] + '-' + d.slice(1);
    return raw;
  }
  fixAllPhones() {
    const s = this.state; let n = 0;
    for (const f of s.families) {
      for (const k of ['phone', 'phone2']) { const v = this.fixPhone(f[k]); if (v && v !== String(f[k] || '').trim()) { f[k] = v; n++; } }
      for (const m of f.members) for (const k of ['phone', 'phone2']) { const v = this.fixPhone(m[k]); if (v && v !== String(m[k] || '').trim()) { m[k] = v; n++; } }
    }
    this.setState({ families: s.families });
    this.t(n ? 'נוסף 0 מוביל ל-' + n + ' טלפונים' : 'לא נמצאו טלפונים חסרי 0');
  }
  csvDown(name, rows) {
    const safe = (x) => { let v = String(x ?? ''); if (/^[=+\-@]/.test(v)) v = "'" + v; return (v.includes(',') || v.includes('"') || v.includes('\n')) ? '"' + v.replace(/"/g, '""') + '"' : v; };
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob(['\uFEFF' + rows.map(r => r.map(safe).join(',')).join('\n')], { type: 'text/csv' }));
    a.download = name; a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 5000);
  }
  exportFamiliesCSV() {
    const s = this.state;
    const rows = [['משפחה', 'אב', 'אם', 'טלפון', 'טלפון 2', 'אימייל', 'עיר', 'כתובת', 'קהילה', 'שפה', 'מצב משפחתי', 'סטטוס', 'ילדים', 'קורסים', 'מדד אמינות', 'יתרת תשלומים', 'נרשמה']];
    const ids = (f) => new Set(f.members.map(m => m.id));
    for (const f of s.families) { const idSet = ids(f); rows.push([f.name, f.father || '', f.mother || '', f.phone || '', f.phone2 || '', f.email || '', f.city || '', f.address || '', f.community || '', f.language || '', f.maritalStatus || '', this.stMeta(f.status)[0], f.members.filter(m => !m.isParent).length, s.enrollments.filter(e => idSet.has(e.memberId)).length, (f.cred || {}).score ?? '', s.enrollments.filter(e => idSet.has(e.memberId)).reduce((a, e) => a + this.payBal(e), 0) || '', f.createdAt || '']); }
    this.csvDown('maor-families.csv', rows); this.t('קובץ המשפחות ירד — נפתח ישירות באקסל');
  }
  exportCoursesCSV() {
    const s = this.state, DAY = ['ראשון', 'שני', 'שלישי', 'רביעי', 'חמישי', 'שישי', 'שבת'];
    const rows = [['חוג', 'מורה', 'טלפון מורה', 'חדר', 'קבוצות', 'מסלול תמחור', 'מחיר מלא', 'הנחה 1', 'הנחה 2', 'מסלול תקופה', 'קהל', 'קטגוריה', 'גיל', 'רשומים', 'מקסימום', 'הערות']];
    for (const c of s.courses) {
      const t = this.teachers.find(x => x.id === c.teacherId) || {};
      rows.push([c.name, t.name || '', t.phone || '', (s.rooms.find(r => r.id === c.roomId) || {}).name || '', this.sessionsOf(c).map((ss, i) => (ss.label || 'קבוצה ' + (i + 1)) + ' יום ' + DAY[ss.day] + ' ' + (ss.time || '')).join(' | '), c.model === 'punch' ? 'כרטיסייה ' + c.size : 'מנוי חודשי', c.price || '', c.price1 || '', c.price2 || '', c.semester || '', c.audience || '', c.cat || '', (c.ageMin ?? '') + '-' + (c.ageMax ?? ''), s.enrollments.filter(e => e.courseId === c.id).length, c.maxStudents || '', c.notes || '']);
    }
    this.csvDown('maor-courses.csv', rows); this.t('קובץ החוגים ירד — נפתח ישירות באקסל');
  }
  exportEnrollCSV() {
    const s = this.state, allM = this.allMembers();
    const rows = [['משפחה', 'תלמיד/ה', 'חוג', 'קבוצה', 'מסלול', 'נרכשו', 'נוצלו', 'יתרה', 'חיסורים', 'סטטוס', 'סה"כ עסקה', 'שולם', 'יתרת תשלום', 'תשלום הבא', 'הערה']];
    for (const e of s.enrollments) {
      const m = allM.find(x => x.id === e.memberId) || {}; const c = s.courses.find(x => x.id === e.courseId) || {};
      const paid = (e.payments || []).reduce((a, x) => a + x.amount, 0);
      rows.push([m.famName || '', m.first || '', c.name || '', e.group || '', e.plan === 'punch' ? 'כרטיסייה' : 'מנוי', e.purchased || '', e.used || 0, e.plan === 'punch' ? (e.purchased - e.used) : '', (e.absences || []).length, e.status === 'paused' ? 'מוקפא' : e.status === 'ended' ? 'הסתיים' : 'פעיל', e.totalDue || '', paid || '', this.payBal(e) || '', e.dueDate || '', e.note || '']);
    }
    this.csvDown('maor-students.csv', rows); this.t('קובץ התלמידים והשיבוצים ירד — נפתח באקסל');
  }
  exportEventsCSV() {
    const s = this.state;
    const rows = [['תאריך עברי', 'תאריך לועזי', 'שעה', 'סוג', 'כותרת', 'משפחה', 'חדר', 'מחיר', 'דחיפות', 'בוצע']];
    for (const ev of s.events) rows.push([ev.date ? this.hebDateFull(ev.date) : '', ev.date || '', ev.time || '', ev.customType || this.evMeta(ev.type).label, ev.title, (s.families.find(x => x.id === ev.famId) || {}).name || '', (s.rooms.find(r => r.id === ev.roomId) || {}).name || '', ev.price || '', ev.priority || '', ev.done ? 'כן' : '']);
    this.csvDown('maor-events.csv', rows); this.t('קובץ האירועים ירד — נפתח באקסל');
  }
  exportAudit() {
    const L = ['דוח תקינות נתונים — ' + (this.state.orgName || 'מאור החסד'), 'הופק: ' + new Date().toLocaleString('he-IL'), ''];
    for (const i of (this._lastAudit || [])) L.push('[' + i.cat + '] ' + i.title);
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob(['\uFEFF' + L.join('\n')], { type: 'text/plain;charset=utf-8' }));
    a.download = 'maor-data-audit.txt'; a.click();
    this.t('דוח התקינות ירד למחשב (' + (this._lastAudit || []).length + ' ממצאים)');
  }
  evMeta(t) {
    return ({
      reminder: { bg: '#efe7f3', c: '#7c3aed', label: 'תזכורת' },
      call: { bg: '#dff0ec', c: '#0f766e', label: 'טלפון' },
      wedding: { bg: '#fdeee0', c: '#b45309', label: 'חתונה' },
      memorial: { bg: '#eceae2', c: '#4d463c', label: 'אזכרה', recur: true },
      anniversary: { bg: '#fbeef3', c: '#be185d', label: 'יום נישואים', recur: true },
      bday: { bg: '#fbeef3', c: '#be185d', label: 'יום הולדת', recur: true },
      org: { bg: '#e7edf5', c: '#3a5a86', label: 'אירוע' }
    })[t] || { bg: '#e7edf5', c: '#3a5a86', label: 'אירוע' };
  }
  famSuffix(famId) { const f = this.state.families.find(x => x.id === famId); return f ? ' · משפחת ' + f.name : ''; }
  famHistoryOf(f) {
    const s = this.state, out = [];
    const ids = new Set(f.members.map(m => m.id));
    const push = (d, tag, bg, c, t) => { if (d) out.push({ d, tag, bg, c, t }); };
    if (f.createdAt) push(f.createdAt, 'הצטרפות', '#e7edf5', '#3a5a86', 'הצטרפות המשפחה למערכת');
    for (const l of ((f.cred || {}).log || [])) push(l.date, 'אמינות', '#f6ead1', '#9a6414', l.desc + ' (' + (l.delta > 0 ? '+' : '') + l.delta + ' נק׳)');
    for (const e of s.enrollments) {
      if (!ids.has(e.memberId)) continue;
      const mm = f.members.find(x => x.id === e.memberId) || {};
      const cc = s.courses.find(x => x.id === e.courseId) || {};
      push(e.enrolledAt, 'שיבוץ', '#eef7e6', '#3f6212', 'שיבוץ ' + (mm.first || '') + ' לחוג ' + (cc.name || '') + (e.group ? ' · ' + e.group : ''));
      for (const p of (e.payments || [])) push(p.date, 'תשלום', '#e4f5ea', '#12803c', 'תשלום ₪' + p.amount + ' (' + p.method + ') — ' + (cc.name || '') + ' · ' + p.rid);
      for (const a of (e.absences || [])) push(a.date, a.noshow ? 'No-Show' : 'חיסור', '#fdeaea', '#b91c1c', (a.noshow ? 'No-Show' : 'חיסור') + ' — ' + (mm.first || '') + ' ב' + (cc.name || '') + (a.reason ? ' · ' + a.reason : '') + (a.makeup ? ' · זכאי/ת השלמה' : ''));
    }
    for (const ev of s.events) if (ev.famId === f.id && ev.date) push(ev.date, ev.customType || this.evMeta(ev.type).label, '#efe7f3', '#7c3aed', (ev.customType || this.evMeta(ev.type).label) + ': ' + ev.title + (ev.done ? ' ✓ בוצע' : ''));
    return out.sort((a, b) => String(b.d).localeCompare(String(a.d)));
  }
  exportFamilyReport(f) {
    const s = this.state;
    const ids = new Set(f.members.map(m => m.id));
    const L = ['דוח משפחה מלא — משפחת ' + f.name, 'הופק: ' + this.hebDateFull(this.isoOf(new Date())) + ' · ' + new Date().toLocaleString('he-IL'), '='.repeat(46), '',
      '— פרטי המשפחה —',
      'אב: ' + (f.father || '—') + (f.fatherId ? ' · ת"ז ' + f.fatherId : ''),
      'אם: ' + (f.mother || '—') + (f.motherId ? ' · ת"ז ' + f.motherId : ''),
      'טלפון: ' + (f.phone || '—') + (f.phone2 ? ' · ' + f.phone2 : '') + (f.email ? ' · ' + f.email : ''),
      'כתובת: ' + ([f.address, f.city].filter(Boolean).join(', ') || '—'),
      'קהילה: ' + (f.community || '—') + ' · שפה: ' + (f.language || '—') + ' · מצב משפחתי: ' + (f.maritalStatus || '—'),
      'סטטוס: ' + this.stMeta(f.status)[0] + (f.createdAt ? ' · הצטרפה: ' + this.hebDateFull(f.createdAt) + ' (' + this.fmtD(f.createdAt) + ')' : ''),
      'קופת צדקה: ' + (f.tzedaka || '—') + ' · הנחה: ' + (f.discount || '—') + ' · ספח מלא: ' + (f.fullSefach ? 'קיים' : 'חסר'),
      'מדד אמינות: ' + ((f.cred || {}).score ?? '—') + ' (' + this.tierOf((f.cred || {}).score ?? 700)[1] + ')',
      f.notes ? 'הערות: ' + f.notes : '', '', '— בני המשפחה —'];
    for (const m of f.members) L.push('• ' + m.first + (m.isParent ? ' (הורה)' : '') + ' · ' + (m.gender === 'f' ? 'נקבה' : 'זכר') + (m.birth ? ' · ' + this.hebDateFull(m.birth) + ' (' + this.fmtD(m.birth) + ')' + (this.age(m.birth) != null ? ' · גיל ' + this.age(m.birth) : '') : '') + (m.school ? ' · ' + m.school + (m.grade ? ' ' + m.grade : '') : '') + (m.phone ? ' · ' + m.phone : '') + (m.health ? ' · רגישויות: ' + m.health : ''));
    L.push('', '— שיבוצים לחוגים —');
    let anyE = false;
    for (const e of s.enrollments) {
      if (!ids.has(e.memberId)) continue;
      anyE = true;
      const mm = f.members.find(x => x.id === e.memberId) || {};
      const cc = s.courses.find(x => x.id === e.courseId) || {};
      const paid = (e.payments || []).reduce((a, x) => a + x.amount, 0);
      L.push('• ' + (mm.first || '') + ' — ' + (cc.name || '') + (e.group ? ' · ' + e.group : '') + ' · ' + (e.plan === 'punch' ? 'כרטיסייה ' + (e.purchased - e.used) + '/' + e.purchased : 'מנוי חודשי') + (e.enrolledAt ? ' · נרשם ' + this.hebDateFull(e.enrolledAt) : '') + (e.status === 'paused' ? ' · מוקפא' : e.status === 'ended' ? ' · הסתיים' : ''));
      if (e.totalDue || paid) L.push('   תשלומים: סה"כ עסקה ₪' + (e.totalDue || 0) + ' · שולם ₪' + paid + ' · יתרה ₪' + this.payBal(e) + (e.dueDate ? ' · תשלום הבא: ' + this.hebDateFull(e.dueDate) : ''));
      for (const p of (e.payments || [])) L.push('   🧾 ' + p.rid + ' · ' + this.hebDateFull(p.date) + ' · ₪' + p.amount + ' · ' + p.method);
      for (const a of (e.absences || [])) L.push('   ✕ ' + (a.noshow ? 'No-Show' : 'חיסור') + ' · ' + this.hebDateFull(a.date) + (a.reason ? ' · ' + a.reason : ''));
      if (e.note) L.push('   📝 ' + e.note);
    }
    if (!anyE) L.push('(אין שיבוצים)');
    L.push('', '— היסטוריית פעולות מלאה —');
    const hist = this.famHistoryOf(f);
    for (const h of hist) L.push('[' + this.hebDateFull(h.d) + ' · ' + this.fmtD(h.d) + '] ' + h.tag + ': ' + h.t);
    if (!hist.length) L.push('(אין פעולות מתועדות)');
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob(['\uFEFF' + L.filter(x => x !== '' || true).join('\n')], { type: 'text/plain;charset=utf-8' }));
    a.download = 'family-report-' + f.name + '.txt'; a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 5000);
    this.t('דוח המשפחה המלא ירד למחשב');
  }
  nextOccurLabel(ev) {
    const meta = this.evMeta(ev.type);
    if (!ev.date) return '';
    if (!meta.recur) return this.fmtD(ev.date) + ' · ' + this.hebDateFull(ev.date);
    const oh = this.hebParts(new Date(ev.date + 'T12:00:00'));
    const n = new Date();
    for (let i = 0; i < 400; i++) {
      const dd = new Date(n.getFullYear(), n.getMonth(), n.getDate() + i);
      const hp = this.hebParts(dd);
      if (hp.month === oh.month && hp.day === oh.day) return this.fmtD(this.isoOf(dd)) + ' · ' + this.gem(hp.day) + ' ' + this.fmtHM.format(dd);
    }
    return this.hebDateFull(ev.date);
  }
  renderVals() {
    const s = this.state, role = this.props.role ?? 'מנהל', isAdmin = role === 'מנהל';
    const wLocks = s.wheelLocks || {}, wRot = s.wheelRot || 0, roomsArr = s.rooms || [],
      cityF = s.cityFilter || 'all', commF = s.commFilter || 'all';
    const DAYN = ['ראשון', 'שני', 'שלישי', 'רביעי', 'חמישי', 'שישי', 'שבת'];
    const nv = (on) => on ? ['#fff', '#211d17', '0 1px 5px rgba(33,29,23,.12)'] : ['transparent', '#8b8474', 'none'];
    const [homeBg, homeC, homeSh] = nv(s.view === 'home'), [famBg, famC, famSh] = nv(s.view === 'families'),
      [crsBg, crsC, crsSh] = nv(s.view === 'courses'), [calBg, calC, calSh] = nv(s.view === 'calendar'), [setBg, setC, setSh] = nv(s.view === 'settings'),
      [supBg, supC, supSh] = nv(s.view === 'support');
    const now = new Date(), hpNow = this.hebParts(now);
    const todayLabel = new Intl.DateTimeFormat('he', { weekday: 'long' }).format(now) + ', ' + this.gem(hpNow.day) + ' ' + this.fmtHM.format(now) + ' ' + this.gemYear(this.fmtHY.format(now)) + ' · ' + this.fmtD(this.isoOf(now));
    const ql = s.q.trim().toLowerCase(), qd = s.q.replace(/\D/g, '');
    const match = (f) => {
      if (!this.famLockPass(f)) return false;
      if (s.statusFilter !== 'all' && f.status !== s.statusFilter) return false;
      if (cityF !== 'all' && f.city !== cityF) return false;
      if (commF !== 'all' && f.community !== commF) return false;
      if ((s.commMulti || []).length && !(s.commMulti || []).includes(f.community)) return false;
      const cf = s.colF || {};
      if ((cf.name || '').trim()) { const nn = this.norm(cf.name); if (!this.norm([f.name, f.father, f.mother].join(' ')).includes(nn)) return false; }
      if ((cf.phone || '').trim()) { const pd = cf.phone.replace(/\D/g, ''); if (!pd || !((f.phone || '') + ' ' + (f.phone2 || '')).replace(/\D/g, '').includes(pd)) return false; }
      if ((cf.kids || '').trim() && !this.numMatch(cf.kids, f.members.filter(m => !m.isParent).length)) return false;
      if ((cf.courses || '').trim() && !this.numMatch(cf.courses, famEnrolls(f).length)) return false;
      const fMar = s.fMar || 'all', fLang = s.fLang || 'all', fSefach = s.fSefach || 'all', fKids = s.fKids || 'all', fEnr = s.fEnrolled || 'all';
      if (fMar !== 'all' && (f.maritalStatus || '') !== fMar) return false;
      if (fLang !== 'all' && (f.language || '') !== fLang) return false;
      if (fSefach === 'yes' && !f.fullSefach) return false;
      if (fSefach === 'no' && f.fullSefach) return false;
      if (fKids === 'yes' && !f.members.length) return false;
      if (fKids === 'no' && f.members.length) return false;
      if (fEnr === 'yes' && !famEnrolls(f).length) return false;
      if (fEnr === 'no' && famEnrolls(f).length) return false;
      const fTier = s.fTier || 'all';
      if (fTier !== 'all' && this.tierOf((f.cred || {}).score ?? 700)[0] !== fTier) return false;
      if (!ql) return true;
      const names = [f.name, f.father, f.mother, ...f.members.map(m => m.first)].join(' ').toLowerCase();
      if (names.includes(ql)) return true;
      return qd.length >= 2 && ((f.phone || '').replace(/\D/g, '').includes(qd) || (f.phone2 || '').replace(/\D/g, '').includes(qd));
    };
    const famEnrolls = (f) => { const ids = new Set(f.members.map(m => m.id)); return s.enrollments.filter(e => ids.has(e.memberId)); };
    const famRow = (f) => {
      const [stLabel, stBg, stC] = this.stMeta(f.status);
      const kids = f.members.filter(m => !m.isParent).map(m => m.first);
      return { title: 'משפחת ' + f.name, parents: [f.father, f.mother].filter(Boolean).join(' ו'), phone: f.phone || '—',
        kidsCount: String(kids.length), kidsLine: kids.length ? kids.slice(0, 3).join(', ') + (kids.length > 3 ? ' +' + (kids.length - 3) : '') : '—',
        coursesLabel: famEnrolls(f).length ? String(famEnrolls(f).length) : '—', stLabel, stBg, stC,
        parentsLine: [[f.father, f.mother].filter(Boolean).join(' ו'), f.community || 'כללי'].filter(Boolean).join(' · '),
        tierDot: this.tierOf((f.cred || {}).score ?? 700)[4], tierTitle: 'מדד אמינות: ' + ((f.cred || {}).score ?? 700),
        sub1: [[f.father, f.mother].filter(Boolean).join(' ו'), f.city].filter(Boolean).join(' · '),
        sub2: (kids.length ? kids.length + ' ילדים' : (f.kidsHome || f.kidsMarried) ? (f.kidsHome || 0) + ' בבית · ' + (f.kidsMarried || 0) + ' נשואים' : '0 ילדים') + ' · ' + famEnrolls(f).length + ' קורסים' + (f.createdAt ? ' · נרשמה ' + this.hebDateFull(f.createdAt) : ''),
        key: (ev) => { if (ev.key === 'Enter' || ev.key === ' ') { ev.preventDefault(); this.openFam(f.id); } },
        open: () => this.openFam(f.id) };
    };
    const filteredFams = s.families.filter(match);
    const colFActive = Object.values(s.colF || {}).some(v => String(v || '').trim());
    const fSort = s.famSort || null;
    let sortedFams = filteredFams;
    if (fSort && fSort.key) {
      const sVal = (f) => fSort.key === 'name' ? f.name : fSort.key === 'phone' ? (f.phone || '') : fSort.key === 'kids' ? f.members.filter(m => !m.isParent).length : fSort.key === 'courses' ? famEnrolls(f).length : ({ active: 0, pending: 1, inactive: 2 }[f.status] ?? 3);
      sortedFams = filteredFams.slice().sort((a, b) => { const va = sVal(a), vb = sVal(b); const c = (typeof va === 'string') ? String(va).localeCompare(String(vb), 'he') : (va - vb); return c * (fSort.dir || 1); });
    }
    const rows = sortedFams.map(famRow);
    const cityOptions = [...new Set(s.families.map(f => f.city).filter(Boolean))];
    const commOptions = [...new Set(s.families.map(f => f.community).filter(Boolean))];
    const statFams = String(filteredFams.length), statKids = String(filteredFams.reduce((a, f) => { const k = f.members.filter(m => !m.isParent).length; return a + (k || (+f.kidsHome || 0)); }, 0));
    const marOptions = [...new Set(s.families.map(f => f.maritalStatus).filter(Boolean))];
    const langOptions = [...new Set(s.families.map(f => f.language).filter(Boolean))];
    const advCount = ['fMar', 'fLang', 'fSefach', 'fKids', 'fEnrolled', 'fTier'].filter(k => (s[k] || 'all') !== 'all').length;
    let famSuggests = [];
    if (ql) {
      const lastTok = this.norm(ql.split(/\s+/).pop());
      if (lastTok) {
        const seen = new Set();
        outer2: for (const f of s.families) {
          for (const t of [f.name, f.father, f.mother, f.city, f.community, ...f.members.map(m2 => m2.first)]) {
            if (!t) continue;
            const nt = this.norm(t);
            if (!nt || nt === lastTok || seen.has(nt)) continue;
            if (nt.startsWith(lastTok) || (lastTok.length >= 3 && this.lev(lastTok, nt, 1) >= 0)) {
              seen.add(nt);
              famSuggests.push({ label: t, apply: () => { const parts = s.q.trim().split(/\s+/); parts[parts.length - 1] = t; this.setState({ q: parts.join(' ') + ' ' }); } });
              if (famSuggests.length >= 7) break outer2;
            }
          }
        }
      }
    }
    const tierCounts = { titan: 0, lion: 0, pale: 0, red: 0 };
    for (const f of s.families) tierCounts[this.tierOf((f.cred || {}).score ?? 700)[0]]++;
    const tierTiles = [['titan', 'טיטאן · 950+', '#fdf3dd', '#9a6414'], ['lion', 'לביאה · 800+', '#e4f5ea', '#12803c'], ['pale', 'טעון שיפור · 500+', '#fdf1d4', '#9a6414'], ['red', 'סיכון · <500', '#fdeaea', '#b91c1c']].map(([k, label, bg, c]) => ({
      label, count: String(tierCounts[k]), bg, c,
      pct: Math.max(4, Math.round(tierCounts[k] / Math.max(1, s.families.length) * 100)) + '%',
      go: () => this.setState({ view: 'families', selId: null, fTier: k, famAdv: true }) }));
    const CALF = [['courses', 'מפגשי קורסים'], ['bdays', 'ימי הולדת'], ['holidays', 'חגים'], ['org', 'אירועי ארגון'], ['reminders', 'תזכורות'], ['calls', 'טלפונים'], ['family', 'משפחתיים'], ['joins', 'הצטרפויות והרשמות']];
    const cfMap = s.calFilters || {};
    const calChips = CALF.map(([k, label]) => { const on = cfMap[k] !== false;
      return { label, bg: on ? '#211d17' : 'rgba(255,255,255,.75)', c: on ? '#f3c76b' : '#8b8474',
        toggle: () => this.setState({ calFilters: { ...cfMap, [k]: !on } }) }; });
    let fam = {};
    const sel = s.families.find(f => f.id === s.selId);
    if (sel) {
      const [stLabel, stBg, stC] = this.stMeta(sel.status);
      const ers = famEnrolls(sel).map(e => {
        const c = s.courses.find(x => x.id === e.courseId) || {};
        const m = sel.members.find(x => x.id === e.memberId) || {};
        const isPunch = e.plan === 'punch', rem = e.purchased - e.used;
        const barColor = rem <= 0 ? '#dc2626' : rem <= 2 ? '#d97706' : '#16a34a';
        const confirming = s.confirmingId === e.id, disabled = isPunch && rem <= 0;
        return { member: m.first || '—', course: c.name || '—', teacher: (this.teachers.find(t => t.id === c.teacherId) || {}).name || '—',
          planLabel: (isPunch ? 'כרטיסייה · ' + e.purchased + ' ניקובים' : this.planWord(e.plan)) + (e.group ? ' · ' + e.group : '') + (e.status === 'paused' ? ' · מוקפא ⏸' : e.status === 'ended' ? ' · הסתיים' : '') + ((e.absences || []).length ? ' · ' + e.absences.length + ' חיסורים' : '') + (e.note ? ' · 📝' : '') + (this.payBal(e) > 0 ? ' · 💳 יתרה ₪' + this.payBal(e) : '') + (e.enrolledAt ? ' · נרשם ' + this.hebDateFull(e.enrolledAt) : ''), isPunch, isMonthly: !isPunch,
          abs: () => this.setState({ modal: 'absence', absEnrollId: e.id, absReason: '', absError: '', absKind: 'cancel' }),
          remove: (ev2) => this.quickRemoveEnroll(e.id, ev2),
          rmLabel: s.rmConfirmId === e.id ? 'לאשר מחיקה?' : '✕',
          rmBg: s.rmConfirmId === e.id ? '#b91c1c' : '#fff', rmC: s.rmConfirmId === e.id ? '#fff' : '#b91c1c', rmBd: s.rmConfirmId === e.id ? '#b91c1c' : '#f5c9c9',
          pct: isPunch ? Math.max(0, Math.round(rem / e.purchased * 100)) : 0,
          balanceLabel: isPunch ? rem + ' מתוך ' + e.purchased : '', barColor,
          usedLabel: e.used + ' נוכחויות מתחילת החודש',
          punchLabel: confirming ? 'לאשר ניקוב?' : disabled ? 'חידוש ←' : 'ניקוב',
          btnBg: confirming ? '#b45309' : disabled ? '#f6ead1' : '#211d17', btnC: disabled ? '#9a6414' : '#fff',
          punch: () => disabled ? this.openManage(e.id) : this.punch(e.id),
          manage: () => this.openManage(e.id) };
      });
      fam = { initial: sel.name[0], title: 'משפחת ' + sel.name, stLabel, stBg, stC,
        subtitle: [[sel.father, sel.mother].filter(Boolean).join(' ו'), [sel.address, sel.city].filter(Boolean).join(', ')].filter(Boolean).join(' · '),
        phone: sel.phone || '—', phone2Label: sel.phone2 || '—', emailLabel: sel.email || '—',
        addressLabel: [sel.address, sel.city].filter(Boolean).join(', ') || '—',
        fatherIdLabel: sel.fatherId ? (s.showIds ? sel.fatherId : '•••••' + String(sel.fatherId).slice(-2)) : '—',
        motherIdLabel: sel.motherId ? (s.showIds ? sel.motherId : '•••••' + String(sel.motherId).slice(-2)) : '—',
        idsBtn: s.showIds ? 'הסתר ת"ז' : 'הצג ת"ז',
        toggleIds: () => this.setState({ showIds: !s.showIds }),
        notesLabel: sel.notes || 'אין הערות למשפחה זו.',
        maritalLabel: sel.maritalStatus || '—', languageLabel: sel.language || '—',
        communityLabel: sel.community || '—', tzedakaLabel: sel.tzedaka || '—',
        sefachLabel: sel.fullSefach ? 'ספח מלא ✓' : 'חסר ספח מלא',
        sefachBg: sel.fullSefach ? '#e4f5ea' : '#fdf1d4', sefachC: sel.fullSefach ? '#12803c' : '#9a6414',
        del: () => this.deleteFamily(sel.id),
        delLabel: s.delConfirm === 'fam' + sel.id ? 'לאשר מחיקת משפחה?' : '🗑 מחיקה',
        delBg: s.delConfirm === 'fam' + sel.id ? '#b91c1c' : '#fff', delC: s.delConfirm === 'fam' + sel.id ? '#fff' : '#b91c1c',
        hasDiscount: !!sel.discount, discountLabel: sel.discount || '',
        hasJoined: !!sel.createdAt, joinedLabel: sel.createdAt ? 'הצטרפה ' + this.hebDateFull(sel.createdAt) : '',
        docs: sel.docs, hasDocs: sel.docs.length > 0,

        hasEnrollments: ers.length > 0, noEnrollments: ers.length === 0,
        enrollCountLabel: ers.length ? ers.length + ' שיבוצים' : '',
        history: this.famHistoryOf(sel).slice(0, 40).map(h => ({ ...h, dl: this.hebDateFull(h.d) + ' · ' + this.fmtD(h.d) })),
        expReport: () => this.exportFamilyReport(sel),
        members: [
          ...(!sel.members.some(x => x.isParent && x.gender === 'm') ? [{ initial: (sel.father || 'א')[0], first: sel.father || 'אב (להשלמה)', gLabel: 'אב', gBg: '#f6ead1', gC: '#9a6414', ageLabel: 'הורה · השלמת כרטיס ←', birthLabel: '', hebBirth: '',
            join: () => this.setState({ modal: 'join', joinError: '', jmQ: null, jcQ: null, joinForm: { memberId: '__pf', courseId: '', purchased: '' } }),
            buy: () => this.setState({ modal: 'join', joinError: '', jmQ: null, jcQ: null, joinForm: { memberId: '__pf', courseId: '', purchased: '' } }),
            edit: () => this.setState({ modal: 'member', editingMemberId: null, memberError: '', memberForm: { first: sel.father || '', gender: 'm', birth: '', idNum: '', phone: sel.phone || '', phone2: '', school: '', grade: '', health: '', mSefach: false, mInvite: false, mRecommend: false, mPhotos: false, mVideos: false, notes: '', isParent: true } }) }] : []),
          ...(!sel.members.some(x => x.isParent && x.gender === 'f') ? [{ initial: (sel.mother || 'א')[0], first: sel.mother || 'אם (להשלמה)', gLabel: 'אם', gBg: '#f6ead1', gC: '#9a6414', ageLabel: 'הורה · השלמת כרטיס ←', birthLabel: '', hebBirth: '',
            join: () => this.setState({ modal: 'join', joinError: '', jmQ: null, jcQ: null, joinForm: { memberId: '__pm', courseId: '', purchased: '' } }),
            buy: () => this.setState({ modal: 'join', joinError: '', jmQ: null, jcQ: null, joinForm: { memberId: '__pm', courseId: '', purchased: '' } }),
            edit: () => this.setState({ modal: 'member', editingMemberId: null, memberError: '', memberForm: { first: sel.mother || '', gender: 'f', birth: '', idNum: '', phone: sel.phone2 || sel.phone || '', phone2: '', school: '', grade: '', health: '', mSefach: false, mInvite: false, mRecommend: false, mPhotos: false, mVideos: false, notes: '', isParent: true } }) }] : []),
          ...sel.members.map(m => ({ initial: m.first[0], first: m.first,
          gLabel: m.isParent ? (m.gender === 'f' ? 'אם' : 'אב') : m.gender === 'f' ? 'בת' : 'בן', gBg: m.isParent ? '#f6ead1' : m.gender === 'f' ? '#fbeef3' : '#e7edf5', gC: m.isParent ? '#9a6414' : m.gender === 'f' ? '#be185d' : '#3a5a86',
          buy: () => { const ens = s.enrollments.filter(e2 => e2.memberId === m.id); const p = ens.find(e2 => e2.plan === 'punch') || ens[0]; if (p) this.openManage(p.id); else this.setState({ modal: 'join', joinError: '', jmQ: null, jcQ: null, joinForm: { memberId: m.id, courseId: '', purchased: '' } }); },
          ageLabel: this.age(m.birth) != null ? (m.gender === 'f' ? 'בת ' : 'בן ') + this.age(m.birth) : 'גיל לא ידוע',
          birthLabel: this.fmtD(m.birth), hebBirth: this.hebDateFull(m.birth),
          hasPhone: !!(m.phone || m.phone2), phoneLabel: [m.phone, m.phone2].filter(Boolean).join(' · '),
          join: () => this.setState({ modal: 'join', joinError: '', jmQ: null, jcQ: null, joinForm: { memberId: m.id, courseId: '', purchased: '' } }),
          edit: () => this.setState({ modal: 'member', editingMemberId: m.id, memberError: '', ...(m.birth ? (() => { const hp = this.hb2FromIso(m.birth); return { hbDay: String(hp.d || ''), hbMonth: hp.m || '', hbYear: String(hp.y || '') }; })() : { hbDay: '', hbMonth: '', hbYear: '' }), memberForm: { first: m.first, gender: m.gender || 'm', birth: m.birth || '', idNum: m.idNum || '', phone: m.phone || '', phone2: m.phone2 || '', school: m.school || '', grade: m.grade || '', health: m.health || '', mSefach: !!m.mSefach, mInvite: !!m.mInvite, mRecommend: !!m.mRecommend, mPhotos: !!m.mPhotos, mVideos: !!m.mVideos, notes: m.notes || '' } }),
          del: (ev2) => { ev2.stopPropagation && ev2.stopPropagation(); this.deleteMember(sel.id, m.id); },
          delLabel: s.delConfirm === 'mem' + m.id ? 'לאשר?' : '🗑',
          delBg: s.delConfirm === 'mem' + m.id ? '#b91c1c' : 'transparent', delC: s.delConfirm === 'mem' + m.id ? '#fff' : '#b3ab9c' }))],
        enrollments: ers,
        specialEvents: s.events.filter(e => e.famId === sel.id && !e.done).map(e => {
          const m = this.evMeta(e.type);
          return { chip: e.customType || m.label, bg: m.bg, c: m.c, title: e.title,
            dateLabel: (m.recur ? 'הקרוב: ' : '') + this.nextOccurLabel(e),
            edit: () => this.openEventEdit(e) };
        }),
        addEvent: () => this.setState({ modal: 'event', editingEventId: null, eventError: '', eventForm: { title: '', date: this.isoOf(new Date()), time: '', type: 'wedding', notes: '', price: '', roomId: '', famId: sel.id, priority: 'green' } }) };
      fam.hasMembers = fam.members.length > 0;
      fam.noMembers = fam.members.length === 0;
      fam.hasHistory = fam.history.length > 0;
      fam.noHistory = fam.history.length === 0;
      fam.histCount = fam.history.length + ' פעולות';
      fam.hasSpecials = fam.specialEvents.length > 0;
      fam.noSpecials = fam.specialEvents.length === 0;
      const cr2 = sel.cred || { score: 700, log: [] };
      const [, tLabel, tBg2, tC2, tDot2] = this.tierOf(cr2.score);
      fam.cred = { score: String(cr2.score), tier: tLabel, tBg: tBg2, tC: tC2, dot: tDot2, pct: Math.min(100, Math.round(cr2.score / 10)) + '%',
        log: cr2.log.slice(0, 3).map(l => ({ d: this.fmtD(l.date), delta: (l.delta > 0 ? '+' : '') + l.delta, dC: l.delta > 0 ? '#12803c' : l.delta < 0 ? '#b91c1c' : '#8b8474', desc: l.desc })),
        hasLog: cr2.log.length > 0, noLog: cr2.log.length === 0,
        social: () => this.credEvent(sel.id, 15, 'פעולה קהילתית (תרומה/עזרה)'),
        helpOpen: !!s.credHelp, toggleHelp: () => this.setState({ credHelp: !s.credHelp }),
        overrideVal: s.credOverride || '', setOverride: (e) => this.setState({ credOverride: e.target.value }),
        applyOverride: () => { const v = parseInt(s.credOverride); if (isNaN(v) || v < 0 || v > 1000) { this.t('ציון Override חייב להיות 0–1000'); return; } cr2.score = v; cr2.log.unshift({ date: this.isoOf(new Date()), delta: 0, desc: 'Override ידני של מנהל → ' + v }); sel.cred = cr2; this.setState({ families: s.families, credOverride: '' }); this.t('הציון עודכן ידנית'); } };
    }
    const myTeacherId = isAdmin ? null : 't3';
    const tints = ['#f6ead1', '#e3eddc', '#dfe8f2', '#f2e0e4', '#e9dff0', '#ece8d9'];
    const teacherName = (id) => (this.teachers.find(t => t.id === id) || {}).name || '—';
    const teacherFull = (id) => { const t = this.teachers.find(x => x.id === id); return t ? 'מורה: ' + t.name + (t.phone ? ' · ' + t.phone : '') : 'ללא מורה'; };
    const modelMeta = (c) => c.model === 'punch' ? ['כרטיסייה · ' + (c.size || 0) + ' ניקובים', '#fdf1d4', '#9a6414']
      : c.model === 'half_year' ? ['מנוי חצי-שנתי', '#e7edf5', '#3a5a86']
      : c.model === 'year' ? ['מנוי שנתי', '#efe7f3', '#7c3aed']
      : ['מנוי חודשי', '#e4f5ea', '#12803c'];
    const visCourses = s.courses.filter(c => !myTeacherId || c.teacherId === myTeacherId);
    const cntOf = (c) => s.enrollments.filter(e => e.courseId === c.id).length;
    const ccf = s.crsColF || {};
    const crsColActive = Object.entries(ccf).some(([k, v]) => String(v || '').trim() && v !== 'all');
    let visShown = visCourses.filter(c => {
      if ((ccf.name || '').trim() && !this.norm(c.name).includes(this.norm(ccf.name))) return false;
      if ((ccf.audience || '').trim() && !this.norm(c.audience || '').includes(this.norm(ccf.audience))) return false;
      if ((ccf.teacher || '').trim() && !this.norm(teacherName(c.teacherId)).includes(this.norm(ccf.teacher))) return false;
      if (ccf.model && ccf.model !== 'all' && c.model !== ccf.model) return false;
      if ((ccf.count || '').trim() && !this.numMatch(ccf.count, cntOf(c))) return false;
      if ((ccf.price || '').trim() && !this.numMatch(ccf.price, c.price || 0)) return false;
      return true;
    });
    const cSort = s.crsSort || null;
    if (cSort && cSort.key) {
      const cval = (c) => cSort.key === 'name' ? c.name : cSort.key === 'audience' ? (c.audience || '') : cSort.key === 'teacher' ? teacherName(c.teacherId) : cSort.key === 'model' ? c.model : cSort.key === 'count' ? cntOf(c) : cSort.key === 'price1' ? (c.price1 || 0) : cSort.key === 'price2' ? (c.price2 || 0) : (c.price || 0);
      visShown = visShown.slice().sort((a, b) => { const va = cval(a), vb = cval(b); const cc = (typeof va === 'string') ? String(va).localeCompare(String(vb), 'he') : (va - vb); return cc * (cSort.dir || 1); });
    }
    const courseRows = visShown.map((c, i) => {
      const [modelLabel, modelBg, modelC] = modelMeta(c);
      const n = s.enrollments.filter(e => e.courseId === c.id).length;
      return { cid: c.id, name: c.name, initial: c.name[0], tint: tints[i % tints.length], teacher: teacherName(c.teacherId), teacherFull: teacherFull(c.teacherId),
        img: c.img || '', hasImg: !!c.img, noImg: !c.img, audience: c.audience || 'כללי',
        priceLabel: c.price ? '₪' + c.price + this.pricePer(c) : '—', modelLabel, modelBg, modelC,
        countLabel: n + '/' + (c.maxStudents || '∞') + ' תלמידים', semLabel: c.semester || 'שנתי',
        p0: c.price ? '₪' + c.price : '—', p1: c.price1 ? '₪' + c.price1 + (c.price1Name ? ' · ' + c.price1Name : '') : '—', p2: c.price2 ? '₪' + c.price2 + (c.price2Name ? ' · ' + c.price2Name : '') : '—',
        cntC: n >= (c.maxStudents || 999) ? '#dc2626' : n >= (c.maxStudents || 999) * 0.8 ? '#9a6414' : '#8b8474',
        datesLabel: this.fmtD(c.start) + '–' + this.fmtD(c.end),
        key: (ev) => { if (ev.key === 'Enter' || ev.key === ' ') { ev.preventDefault(); this.setState({ selCourseId: c.id, view: 'courses' }); } },
        open: () => this.setState({ selCourseId: c.id, view: 'courses' }) };
    });
    let crs = {}, enPick = null;
    this._enfPick = null;
    const selC = s.courses.find(c => c.id === s.selCourseId);
    if (selC) {
      const enrolled = s.enrollments.filter(e => e.courseId === selC.id);
      const all = this.allMembers();
      const students = enrolled.map(e => {
        const m = all.find(x => x.id === e.memberId) || {};
        const isPunch = e.plan === 'punch', rem = e.purchased - e.used;
        const barColor = rem <= 0 ? '#dc2626' : rem <= 2 ? '#d97706' : '#16a34a';
        const confirming = s.confirmingId === e.id, disabled = isPunch && rem <= 0;
        return { name: m.first || '—', family: m.famName ? 'משפחת ' + m.famName : '—',
          ageLabel: this.age(m.birth) != null ? (m.gender === 'f' ? 'בת ' : 'בן ') + this.age(m.birth) : '',
          hasNote: !!e.note, noteLabel: e.note || '',
          groupVal: e.group || '',
          setGroup: (ev2) => { e.group = ev2.target.value; this.setState({ enrollments: s.enrollments }); this.t(ev2.target.value ? m.first + ' שויך/ה ל' + ev2.target.value : 'הוסר השיוך של ' + m.first); },
          planLabel: (isPunch ? 'כרטיסייה · ' + e.purchased : this.planWord(e.plan)) + (e.status === 'paused' ? ' · מוקפא ⏸' : e.status === 'ended' ? ' · הסתיים' : '') + ((e.absences || []).length ? ' · ' + e.absences.length + ' חיס׳' : '') + (this.payBal(e) > 0 ? ' · 💳 ₪' + this.payBal(e) : ''), isPunch, isMonthly: !isPunch,
          abs: () => this.setState({ modal: 'absence', absEnrollId: e.id, absReason: '', absError: '', absKind: 'cancel' }),
          remove: (ev2) => this.quickRemoveEnroll(e.id, ev2),
          rmLabel: s.rmConfirmId === e.id ? 'לאשר מחיקה?' : '✕',
          rmBg: s.rmConfirmId === e.id ? '#b91c1c' : '#fff', rmC: s.rmConfirmId === e.id ? '#fff' : '#b91c1c', rmBd: s.rmConfirmId === e.id ? '#b91c1c' : '#f5c9c9',
          pct: isPunch ? Math.max(0, Math.round(rem / e.purchased * 100)) : 0,
          balanceLabel: isPunch ? rem + ' מתוך ' + e.purchased : '', barColor,
          usedLabel: e.used + ' נוכחויות מתחילת החודש',
          punchLabel: confirming ? 'לאשר ניקוב?' : disabled ? 'חידוש ←' : 'ניקוב',
          btnBg: confirming ? '#b45309' : disabled ? '#f6ead1' : '#211d17', btnC: disabled ? '#9a6414' : '#fff',
          punch: () => disabled ? this.openManage(e.id) : this.punch(e.id),
          manage: () => this.openManage(e.id) };
      });
      const enrolledIds = new Set(enrolled.map(e => e.memberId));
      this._enrollOptions = all.filter(m => !enrolledIds.has(m.id)).map(m => ({ id: m.id, label: (m.isParent ? (m.gender === 'f' ? 'אמא — ' : 'אבא — ') : '') + m.first + ' · משפחת ' + m.famName }));
      for (const f2 of s.families) {
        if (f2.father && !f2.members.some(x => x.isParent && x.gender === 'm')) this._enrollOptions.push({ id: '__pf:' + f2.id, label: 'אבא — ' + f2.father + ' · משפחת ' + f2.name });
        if (f2.mother && !f2.members.some(x => x.isParent && x.gender === 'f')) this._enrollOptions.push({ id: '__pm:' + f2.id, label: 'אמא — ' + f2.mother + ' · משפחת ' + f2.name });
      }
      if (s.modal === 'enroll') {
        const xt3 = (t) => [t, ...(Component.XLAT[t] || [])];
        const enItems = this._enrollOptions.map(o => ({ id: o.id, label: o.label, nterms: [...new Set([o.label, ...o.label.split(/[ ·]+/)].flatMap(xt3).map(t => this.norm(t)).filter(Boolean))], pick: () => this.setState({ enrollForm: { ...(s.enrollForm || {}), memberId: o.id }, enQ: null, enrollError: '' }) }));
        enPick = { q: s.enQ != null ? s.enQ : ((this._enrollOptions.find(o => o.id === (s.enrollForm || {}).memberId) || {}).label || ''), list: s.enQ != null ? this.smartRank(s.enQ, enItems) : [] };
        const nf = s.enrollNewForm || {};
        const famItems = s.families.map(f2 => ({ id: f2.id, label: 'משפחת ' + f2.name + (f2.city ? ' · ' + f2.city : ''), nterms: [...new Set(['משפחת ' + f2.name, f2.name, f2.father, f2.mother, f2.city].filter(Boolean).flatMap(xt3).map(t => this.norm(t)).filter(Boolean))], pick: () => this.setState({ enrollNewForm: { ...nf, famId: f2.id }, enfQ: null, enrollError: '' }) }));
        const selFam = s.families.find(f2 => f2.id === nf.famId);
        const enfL = s.enfQ != null ? this.smartRank(s.enfQ, famItems) : [];
        const enfQt = (s.enfQ || '').trim();
        if (s.enfQ != null && enfQt.length >= 2 && !s.families.some(f2 => this.normName(f2.name) === this.normName(enfQt)))
          enfL.push({ id: '__new', label: '＋ משפחה חדשה: "' + enfQt + '" — יצירה ושיבוץ בלי לצאת מהמסך', pick: () => this.setState({ enrollNewForm: { ...nf, famId: '__new', newFamName: enfQt }, enfQ: null, enrollError: '' }) });
        this._enfPick = { q: s.enfQ != null ? s.enfQ : (nf.famId === '__new' ? '＋ חדשה: ' + (nf.newFamName || '') : (selFam ? 'משפחת ' + selFam.name : '')), list: enfL };
      }
      const [modelLabel, modelBg, modelC] = modelMeta(selC);
      crs = { name: selC.name, initial: selC.name[0], tint: tints[Math.max(0, s.courses.indexOf(selC)) % tints.length],
        img: selC.img || '', hasImg: !!selC.img, noImg: !selC.img, audience: selC.audience || 'כללי', gradeLabel: this.gradeRange(selC), hasGrade: !!this.gradeRange(selC),
        teacher: teacherName(selC.teacherId), teacherPhone: (this.teachers.find(t => t.id === selC.teacherId) || {}).phone || '—', priceLabel: selC.price ? '₪' + selC.price + this.pricePer(selC) : '—',
        p1Label: selC.price1 ? '₪' + selC.price1 : '—', p2Label: selC.price2 ? '₪' + selC.price2 : '—',
        p1Name: selC.price1Name || 'הנחה 1', p2Name: selC.price2Name || 'הנחה 2',
        modelLabel, modelBg, modelC, datesLabel: this.fmtD(selC.start) + ' – ' + this.fmtD(selC.end),
        datesHeb: (selC.start ? this.hebDateFull(selC.start) : '—') + ' – ' + (selC.end ? this.hebDateFull(selC.end) : '—'),
        sessCount: this.sessionsOf(selC).length + (this.sessionsOf(selC).length === 1 ? ' קבוצה' : ' קבוצות'),
        sessionRows: this.sessionsOf(selC).map((ss, i) => ({
          label: (ss.label ? ss.label + ' · ' : '') + 'יום ' + DAYN[ss.day] + ' ' + (ss.time || ''),
          remove: () => {
            if (!selC.sessions || !selC.sessions.length) selC.sessions = this.sessionsOf(selC).slice();
            if (selC.sessions.length <= 1) { this.t('חייבת להישאר לפחות קבוצה אחת'); return; }
            const lbl = selC.sessions[i] ? (selC.sessions[i].label || ('קבוצה ' + (i + 1))) : '';
            selC.sessions.splice(i, 1);
            let moved = 0;
            for (const e2 of s.enrollments) if (e2.courseId === selC.id && e2.group === lbl) { e2.group = ''; moved++; }
            this.setState({ courses: s.courses, enrollments: s.enrollments });
            this.t('הקבוצה הוסרה' + (moved ? ' · ' + moved + ' תלמידים סונכרנו ל"ללא שיוך"' : ' מלוח הפעילות'));
          } })),
        hebDates: this.hebDateFull(selC.start) + ' – ' + this.hebDateFull(selC.end),
        descLabel: selC.description || 'אין תיאור.',
        students, hasStudents: students.length > 0, noStudents: students.length === 0,
        studentCountLabel: students.length + '/' + (selC.maxStudents || '∞') + ' רשומים',
        groupCounts: (() => {
          const P = [['#fdf1d4', '#9a6414'], ['#e7edf5', '#3a5a86'], ['#e4f5ea', '#12803c'], ['#efe7f3', '#7c3aed'], ['#fbeef3', '#be185d']];
          const out = this.sessionsOf(selC).map((ss, i) => { const v = ss.label || ('קבוצה ' + (i + 1)); const n = enrolled.filter(e => e.group === v).length; return { label: v + ' · ' + n, bg: P[i % P.length][0], c: P[i % P.length][1] }; });
          const none = enrolled.filter(e => !e.group).length;
          if (none) out.push({ label: 'ללא שיוך · ' + none, bg: '#eceae2', c: '#8b8474' });
          return out;
        })(),
        semLabel: selC.semester || 'שנתי',
        roomLabel: (s.rooms.find(r => r.id === selC.roomId) || {}).name || '—',
        capacityLabel: students.length + ' מתוך ' + (selC.maxStudents || '∞'),
        isFull: students.length >= (selC.maxStudents || 999),
        enrollBtn: students.length >= (selC.maxStudents || 999) ? 'הקורס מלא' : '+ שיבוץ תלמיד',
        del: () => this.deleteCourse(selC.id),
        delLabel: s.delConfirm === 'crs' + selC.id ? 'לאשר מחיקת חוג?' : '🗑 מחיקה',
        delBg: s.delConfirm === 'crs' + selC.id ? '#b91c1c' : '#fff', delC: s.delConfirm === 'crs' + selC.id ? '#fff' : '#b91c1c' };
    }
    const todayDow = new Date().getDay();
    const roomRows = roomsArr.map(r => {
      const live = r.active ? s.courses.find(c => c.roomId === r.id && c.weekday === todayDow) : null;
      return { name: r.name, bg: r.active ? 'rgba(255,255,255,.6)' : 'rgba(33,29,23,.05)',
        tBg: r.active ? '#211d17' : '#ded7c8', tJust: r.active ? 'flex-end' : 'flex-start',
        dot: r.active ? (live ? '#16a34a' : '#c2b9a6') : '#dc2626',
        anim: live ? 'pulse 1.6s ease-in-out infinite' : 'none',
        liveC: r.active ? (live ? '#12803c' : '#8b8474') : '#b91c1c',
        liveLabel: r.active ? (live ? 'היום: ' + live.name + ' · ' + live.time : 'פנוי היום · 60 דק׳/משבצת') : 'לא פעיל',
        chip: live ? 'LIVE' : r.active ? 'פנוי' : 'כבוי',
        chipBg: live ? '#16a34a' : r.active ? '#eceae2' : '#fdeaea', chipC: live ? '#fff' : r.active ? '#8b8474' : '#b91c1c',
        haloAnim: live ? 'spin 6s linear infinite' : 'none', haloOpacity: live ? '0.85' : r.active ? '0.15' : '0.05',
        dotGlow: live ? '0 0 12px rgba(22,163,74,.85)' : 'none',
        toggle: (ev) => { if (ev && ev.stopPropagation) ev.stopPropagation(); r.active = !r.active; this.setState({ rooms: roomsArr }); },
        settings: (ev) => { if (ev && ev.stopPropagation) ev.stopPropagation(); this.openRoomSet(r.id); },
        openDiary: () => this.setState({ modal: 'diary', diaryRoomId: r.id, diaryDate: this.isoOf(new Date()) }) };
    });
    const liveRooms = roomRows.filter(r => r.anim !== 'none').length;
    const cal = s.view === 'calendar' ? this.buildCal() : { cells: [], upcoming: [], noUpcoming: true, monthLabel: '', hebMonthLabel: '' };
    const allM = this.allMembers();
    let mg = null;
    if (s.modal === 'manage' && s.manageId) {
      const en = this.mgEn();
      if (en) {
        const c = s.courses.find(x => x.id === en.courseId) || {};
        const m = allM.find(x => x.id === en.memberId) || {};
        const rem = en.purchased - en.used;
        mg = { who: (m.first || '—') + ' ' + (m.famName || '') + ' · ' + (c.name || '—'),
          planLabel: this.planWord(en.plan),
          balanceLabel: en.plan === 'punch' ? 'יתרה: ' + rem + ' מתוך ' + en.purchased : en.used + ' נוכחויות מתחילת החודש',
          statusLabel: en.status === 'paused' ? 'מוקפא' : en.status === 'ended' ? 'הסתיים' : 'פעיל',
          stBg: en.status === 'paused' ? '#fdf1d4' : en.status === 'ended' ? '#eceae2' : '#e4f5ea',
          stC: en.status === 'paused' ? '#9a6414' : en.status === 'ended' ? '#8b8474' : '#12803c',
          qtyPh: String(c.size || 12), priceLabel: c.price ? '₪' + c.price : '—',
          isPunch: en.plan === 'punch',
          totalDueVal: en.totalDue != null && en.totalDue !== 0 ? String(en.totalDue) : '',
          totalDuePh: String(c.price || 0),
          setTotalDue: (ev2) => { en.totalDue = Math.max(0, Math.round((+ev2.target.value || 0) * 100) / 100); this.setState({ enrollments: s.enrollments }); },
          balLine: (() => { const paid = (en.payments || []).reduce((a, x) => a + x.amount, 0); return en.totalDue ? 'שולם ₪' + paid + ' מתוך ₪' + en.totalDue + ' · יתרה ₪' + this.payBal(en) : (paid ? 'שולם ₪' + paid + ' (ללא סה"כ עסקה)' : 'הגדירו סה"כ עסקה ותקבלו מעקב יתרה'); })(),
          balC: this.payBal(en) > 0 ? '#b45309' : '#12803c',
          pays: (en.payments || []).slice().reverse().map(p => ({ line: this.hebDateFull(p.date) + ' · ₪' + p.amount + ' · ' + p.method + ' · ' + p.rid, rec: () => this.receipt(en, p) })),
          hasPays: !!(en.payments || []).length, noPays: !(en.payments || []).length,
          hasGroups: this.sessionsOf(c).length > 1,
          groupOptions: this.sessionsOf(c).map((ss, i) => { const v = ss.label || ('קבוצה ' + (i + 1)); return { v, t: v + ' · יום ' + ['ראשון', 'שני', 'שלישי', 'רביעי', 'חמישי', 'שישי', 'שבת'][ss.day] + ' ' + (ss.time || '') }; }),
          groupVal: en.group || '',
          setGroup: (e) => { en.group = e.target.value; this.setState({ enrollments: s.enrollments }); this.t(e.target.value ? 'שויך/ה לקבוצה: ' + e.target.value : 'הוסר שיוך הקבוצה'); },
          buyTitle: en.plan === 'punch' ? 'קניית / טעינת כרטיסייה' : 'מעבר לכרטיסייה (קנייה ראשונה)',
          pauseLabel: en.status === 'paused' ? '▶ הפשרה — חזרה לפעילות' : '⏸ הקפאה זמנית',
          endLabel: 'סיום שיבוץ',
          removeLabel: s.manageConfirm ? 'לאשר הסרה סופית?' : 'הסרת השיבוץ',
          removeBg: s.manageConfirm ? '#b91c1c' : '#fff', removeC: s.manageConfirm ? '#fff' : '#b91c1c',
          goCourse: () => this.setState({ modal: null, view: 'courses', selId: null, selCourseId: c.id }) };
      }
    }
    const visCIds = new Set(visCourses.map(c => c.id));
    const lowEnrolls = s.enrollments.filter(e => visCIds.has(e.courseId) && e.plan === 'punch' && e.purchased - e.used <= 2)
      .map(e => ({ e, m: allM.find(x => x.id === e.memberId) || {}, c: s.courses.find(x => x.id === e.courseId) || {}, rem: e.purchased - e.used }))
      .sort((a, b) => a.rem - b.rem);
    const todayCourses = s.courses.filter(c => this.sessionsOf(c).some(ss => ss.day === now.getDay()));
    const bdayHits = [];
    for (let i = 0; i < 7 && bdayHits.length < 1; i++) {
      const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() + i);
      const key = this.isoOf(d).slice(5);
      for (const m of allM) if (m.birth && m.birth.slice(5) === key) bdayHits.push({ m, d, days: i, turning: d.getFullYear() - new Date(m.birth).getFullYear() });
    }
    const digestLines = [];
    if (lowEnrolls.length) { const l = lowEnrolls[0]; digestLines.push('ל' + (l.m.first || '') + ' ' + (l.m.famName || '') + ' ' + (l.rem === 0 ? 'נגמרה הכרטיסייה' : l.rem === 1 ? 'נשאר ניקוב אחד' : 'נשארו ' + l.rem + ' ניקובים') + ' ב' + l.c.name + ' — כדאי להציע חידוש'); }
    const pend = s.families.filter(f => f.status === 'pending');
    if (pend.length) digestLines.push(pend.length + ' משפחות ממתינות לאישור: ' + pend.map(f => f.name).slice(0, 3).join(', '));
    if (todayCourses.length) digestLines.push('היום: ' + todayCourses.map(c => c.name + ' ב-' + this.sessionsOf(c).filter(ss => ss.day === now.getDay()).map(ss => ss.time).join('/')).join(' · '));
    const callsDue = s.events.filter(e => e.type === 'call' && !e.done && e.date <= this.isoOffset(1));
    if (callsDue.length) digestLines.push('תזכורות טלפון פתוחות: ' + callsDue[0].title + (callsDue.length > 1 ? ' (+' + (callsDue.length - 1) + ' נוספות)' : ''));
    const specials = [];
    for (let i = 0; i < 7 && specials.length < 2; i++) {
      const dd = new Date(now.getFullYear(), now.getMonth(), now.getDate() + i);
      for (const e of this.dayEvents(dd)) if (e.ev && ['חתונה', 'אזכרה', 'יום נישואים', 'יום הולדת'].includes(e.type) && specials.length < 2) specials.push(e.type + ' ביום ' + DAYN[dd.getDay()] + ': ' + e.title);
    }
    if (specials.length) digestLines.push('מיוחדים השבוע — ' + specials.join(' · '));
    if (bdayHits.length && bdayHits[0].days === 0) digestLines.push('יום הולדת היום ל' + bdayHits[0].m.first + ' (משפחת ' + bdayHits[0].m.famName + ')');
    if (!digestLines.length) digestLines.push('הכל מעודכן — אין משימות דחופות הבוקר');
    const bd = bdayHits[0];
    let carItem = null, carDots = [];
    if (s.view === 'home') {
      const carSrc = [];
      const ICM = { memorial: '🕯', wedding: '💍', anniversary: '💍', birthday: '🎂', call: '📞', reminder: '🔔', org: '✦' };
      for (let i = 0; i < 14; i++) {
        const dd = new Date(now.getFullYear(), now.getMonth(), now.getDate() + i);
        const iso2 = this.isoOf(dd), key = iso2.slice(5);
        const when = i === 0 ? 'היום!' : i === 1 ? 'מחר' : 'בעוד ' + i + ' ימים';
        for (const f of s.families) for (const m of f.members) if (m.birth && m.birth.slice(5) === key)
          carSrc.push({ icon: '🎂', bg: '#fbeef3', bd2: '#f3d3e0', title: 'יום הולדת — ' + m.first + ' (' + (dd.getFullYear() - new Date(m.birth).getFullYear()) + ')', sub: 'משפחת ' + f.name + ' · ' + when, btn: 'לכרטיס המשפחה ←', go: () => this.openFam(f.id) });
        for (const ev of s.events) if (!ev.done && ev.date === iso2)
          carSrc.push({ icon: ICM[ev.type] || '✦', bg: '#f6ead1', bd2: '#ecd9a8', title: ev.title, sub: when + (ev.time ? ' · ' + ev.time : '') + ' · ' + this.gem(this.hebParts(dd).day) + ' ' + this.fmtHM.format(dd), btn: 'ללוח השנה ←', go: () => this.setState({ view: 'calendar', calDay: iso2, calMonth: dd.getMonth(), calYear: dd.getFullYear() }) });
        if (carSrc.length >= 10) break;
      }
      const ci = carSrc.length ? (s.carIdx || 0) % carSrc.length : 0;
      carItem = carSrc.length ? { ...carSrc[ci], anim: (s.carIdx || 0) % 2 ? 'fadeUp .45s ease' : 'fadeIn .45s ease' } : { icon: '🎂', bg: '#fbeef3', bd2: '#f3d3e0', title: 'אין אירועים קרובים', sub: '14 הימים הקרובים שקטים', btn: 'ללוח השנה ←', go: () => this.setState({ view: 'calendar' }), anim: 'none' };
      carDots = carSrc.slice(0, 8).map((_, i2) => ({ bg: i2 === (carSrc.length ? ci % 8 : 0) ? '#b45309' : 'rgba(33,29,23,.18)' }));
    }
    const paletteQl = s.paletteQ.trim().toLowerCase();
    const closeP = () => this.setState({ paletteOpen: false, paletteQ: '' });
    const dlCSV = () => { closeP();
      const rws = [['משפחה', 'אב', 'אם', 'טלפון', 'עיר', 'קהילה', 'סטטוס', 'ילדים']].concat(s.families.map(f => [f.name, f.father || '', f.mother || '', f.phone || '', f.city || '', f.community || '', this.stMeta(f.status)[0], f.members.length]));
      const safe = (x) => { const v = String(x ?? ''); return /^[=+\-@]/.test(v) ? "'" + v : v; };
      const a = document.createElement('a');
      a.href = URL.createObjectURL(new Blob(['\uFEFF' + rws.map(r => r.map(safe).join(',')).join('\n')], { type: 'text/csv' }));
      a.download = 'maor-hachesed-families.csv'; a.click();
      setTimeout(() => URL.revokeObjectURL(a.href), 5000);
      this.t('קובץ CSV ירד — ' + s.families.length + ' משפחות'); };
    const copyPhones = () => { closeP();
      const list = s.families.filter(f => f.phone).map(f => 'משפחת ' + f.name + ': ' + f.phone).join('\n');
      if (navigator.clipboard) navigator.clipboard.writeText(list);
      this.t('הועתקו ' + s.families.filter(f => f.phone).length + ' מספרי טלפון ללוח'); };
    const newCallReminder = () => { closeP(); this.setState({ view: 'calendar', modal: 'event', editingEventId: null, eventError: '', eventForm: { title: '', date: this.isoOf(now), time: '', type: 'call', notes: '' } }); };
    const goPending = () => { closeP(); this.setState({ view: 'families', selId: null, statusFilter: 'pending', cityFilter: 'all', commFilter: 'all', q: '' }); };
    let paletteActions = [
      { title: '+ משפחה חדשה', sub: 'פתיחת טופס רישום', adminOnly: true, run: () => { closeP(); this.setState({ modal: 'family', editingId: null, formError: '', form: this.emptyForm() }); }, kw: 'משפחה חדשה הוסף רישום' },
      { title: '+ קורס חדש', sub: 'הגדרת חוג ומסלול תמחור', adminOnly: true, run: () => { closeP(); this.setState({ view: 'courses', selCourseId: null, modal: 'course', editingCourseId: null, courseError: '', courseForm: this.emptyCourseForm() }); }, kw: 'קורס חדש הוסף חוג' },
      { title: '+ אירוע חדש', sub: 'הוספה ללוח השנה', run: () => { closeP(); this.setState({ view: 'calendar', modal: 'event', editingEventId: null, eventError: '', eventForm: { title: '', date: this.isoOf(now), time: '', type: 'org', notes: '' } }); }, kw: 'אירוע חדש לוח' },
      { title: '+ תזכורת טלפון', sub: 'מעקב שיחה — נכנס ללוח השנה', run: newCallReminder, kw: 'טלפון תזכורת שיחה מעקב להתקשר' },
      { title: 'ניקוב לקורס של היום', sub: todayCourses.length ? todayCourses[0].name + ' · ' + todayCourses[0].time : 'אין מפגשים היום', run: () => { closeP(); if (todayCourses.length) this.setState({ view: 'courses', selCourseId: todayCourses[0].id }); else this.t('אין מפגשים היום'); }, kw: 'ניקוב נוכחות היום מפגש' },
      { title: 'משפחות ממתינות לאישור', sub: s.families.filter(f => f.status === 'pending').length + ' ממתינות כרגע', adminOnly: true, run: goPending, kw: 'ממתינות אישור מלגה סטטוס' },
      { title: 'מי חוגג השבוע?', sub: bd ? bd.m.first + ' · משפחת ' + bd.m.famName : 'אין ימי הולדת קרובים', run: () => { closeP(); if (bd) this.setState({ view: 'families', selId: bd.m.famId }); else this.setState({ view: 'calendar' }); }, kw: 'יום הולדת חוגג השבוע ברכה' },
      { title: 'ייצוא משפחות לאקסל (CSV)', sub: 'כל השדות — כולל קהילה, אמינות ותאריך רישום', adminOnly: true, run: () => { closeP(); this.exportFamiliesCSV(); }, kw: 'ייצוא אקסל csv הורדה רשימה משפחות' },
      { title: 'ייצוא חוגים לאקסל (CSV)', sub: 'מורות, טלפונים, קבוצות ומחירים', adminOnly: true, run: () => { closeP(); this.exportCoursesCSV(); }, kw: 'ייצוא אקסל csv חוגים קורסים' },
      { title: 'ייצוא תלמידים ושיבוצים (CSV)', sub: 'יתרות, קבוצות, חיסורים והערות', adminOnly: true, run: () => { closeP(); this.exportEnrollCSV(); }, kw: 'ייצוא אקסל csv תלמידים שיבוצים' },
      { title: 'העתקת כל הטלפונים', sub: 'רשימת חיוג ללוח ההעתקה', adminOnly: true, run: copyPhones, kw: 'טלפונים חיוג העתקה רשימה' },
      { title: '💛 + תומכת חדשה', sub: 'הוספת משפחה תומכת — כרטיס מלא', adminOnly: true, run: () => { closeP(); this.setState({ view: 'support', modal: 'supporter', supEditId: '__new', supForm: { name: '', phone: '', email: '', address: '', idNum: '', cat: '', forWho: '', notes: '' } }); }, kw: 'תומכת חדשה תורמת תרומה הוספה' },
      { title: '⬆ ייבוא נתונים מקובץ', sub: 'CSV — משפחות או ילדים', adminOnly: true, run: () => { closeP(); this.setState({ modal: 'import', importError: '', importSummary: null }); }, kw: 'ייבוא קובץ csv אקסל העלאה עדכון' },
      { title: '✓ בדיקת תקינות נתונים', sub: 'כפילויות, ת"ז, טלפונים, לוגיקה', adminOnly: true, run: () => { closeP(); this.setState({ modal: 'audit' }); }, kw: 'בדיקה תקינות כפילויות ולידציה ניקוי' },
      { title: 'מרכז הטיפול', sub: 'תפעול + ממצאי בדיקת נתונים — עם סימון טופל', run: () => { closeP(); this.setState({ view: 'care', selId: null, selCourseId: null, careAudit: this.runAudit().rows }); }, kw: 'דורש טיפול משימות דחוף מרכז' },
      { title: 'הגדרות מערכת', sub: 'ארגון, התראות ומשתמשים', adminOnly: true, run: () => { closeP(); this.setState({ view: 'settings' }); }, kw: 'הגדרות התראות משתמשים לוגו' }
    ];
    if (!isAdmin) paletteActions = paletteActions.filter(a => !a.adminOnly);
    let paletteGroups = [], paletteSuggests = [];
    this._firstResult = null;
    if (paletteQl) {
      const items = [];
      const push = (type, bg, c, title, sub, run, terms, ids) => items.push({ type, bg, c, title, sub, run, ids: (ids || []).filter(Boolean).map(String),
        dterms: [...new Set(terms.filter(Boolean))], nterms: [...new Set(terms.filter(Boolean).map(t => this.norm(t)).filter(Boolean))] });
      const xl = (t) => t ? [t, ...(Component.XLAT[t] || [])] : [];
      for (const f of s.families) {
        const go = () => { closeP(); this.setState({ view: 'families', selId: f.id }); };
        push('משפחות', '#f6ead1', '#9a6414', 'משפחת ' + f.name, [f.father, f.mother].filter(Boolean).join(' ו') + ' · ' + (f.city || ''), go,
          [...xl(f.name), 'משפחת ' + f.name, f.father, f.mother, ...xl(f.city), f.community, this.stMeta(f.status)[0]],
          [f.fatherId, f.motherId, (f.phone || '').replace(/\D/g, ''), (f.phone2 || '').replace(/\D/g, '')]);
        for (const d of (f.docs || [])) push('מסמכים', '#eceae2', '#4d463c', d, 'משפחת ' + f.name, go, [d, 'מסמך', 'ספח'], []);
      }
      for (const m of allM) push('תלמידים', '#e7edf5', '#3a5a86', m.first + ' ' + m.famName,
        (this.age(m.birth) != null ? (m.gender === 'f' ? 'בת ' : 'בן ') + this.age(m.birth) + ' · ' : '') + (m.school || 'כרטיס המשפחה'),
        () => { closeP(); this.setState({ view: 'families', selId: m.famId }); },
        [...xl(m.first), ...xl(m.famName), m.school, m.grade], [m.idNum, (m.phone || '').replace(/\D/g, '')]);
      for (const c of s.courses) push('חוגים', '#e4f5ea', '#12803c', c.name, 'מורה: ' + teacherName(c.teacherId) + ' · יום ' + DAYN[c.weekday],
        () => { closeP(); this.setState({ view: 'courses', selCourseId: c.id }); },
        [...xl(c.name), ...xl((c.name || '').split(' — ')[0]), c.audience, c.cat, teacherName(c.teacherId), 'חוג', 'קורס'], [c.id]);
      for (const sp of (s.supporters || [])) push('תומכות', '#f6ead1', '#9a6414', sp.name, (sp.cat || '') + ' · ' + sp.count + ' תרומות' + (sp.phone ? ' · ' + sp.phone : ''),
        () => { closeP(); this.setState({ view: 'support', supQ: sp.name }); },
        [sp.name, sp.email, sp.cat, sp.forWho, 'תומכת', 'תורם', 'תרומה'], [(sp.phone || '').replace(/\D/g, ''), sp.idNum]);
      for (const t of this.teachers) push('מורים', '#dff0ec', '#0f766e', t.name, s.courses.filter(c => c.teacherId === t.id).map(c => c.name).join(' · ') || 'ללא קורסים',
        () => { closeP(); this.setState({ view: 'courses', selCourseId: null }); }, [...xl(t.name), 'מורה'], []);
      for (const ev of s.events) if (!ev.done) push('אירועים', ev.type === 'call' ? '#dff0ec' : '#e7edf5', ev.type === 'call' ? '#0f766e' : '#3a5a86', ev.title, this.fmtD(ev.date) + (ev.time ? ' · ' + ev.time : ''),
        () => { closeP(); const dd = new Date(ev.date + 'T12:00:00'); this.setState({ view: 'calendar', calDay: ev.date, calMonth: dd.getMonth(), calYear: dd.getFullYear() }); },
        [ev.title, 'אירוע', 'תזכורת', this.evMeta(ev.type).label, ev.famId ? this.famSuffix(ev.famId) : ''], []);
      for (const e of s.enrollments) { const em = allM.find(x => x.id === e.memberId), ec = s.courses.find(x => x.id === e.courseId);
        if (em && ec) push('תלמידים', '#e7edf5', '#3a5a86', em.first + ' · ' + ec.name, 'הרשמה #' + e.id,
          () => { closeP(); this.setState({ view: 'courses', selCourseId: ec.id }); }, [], [e.id]); }
      for (const a of paletteActions) push('פעולות', '#211d17', '#f3c76b', a.title, a.sub, a.run, [a.title, ...a.kw.split(' ')], []);
      const tokens = paletteQl.split(/\s+/).filter(Boolean).map(t => this.norm(t)).filter(Boolean);
      const qd = s.paletteQ.replace(/\D/g, '');
      const scored = [];
      for (const it of items) {
        let sc = 0;
        if (qd.length >= 3 && s.paletteQ.trim().replace(/[\d\s\-().]/g, '') === '' && it.ids.some(id => id.includes(qd))) sc = 130;
        else if (qd.length >= 4 && it.ids.some(id => id.includes(qd))) sc = 130;
        else if (tokens.length) {
          let tot = 0, ok = true;
          for (const tk of tokens) { let best = 0; for (const tm of it.nterms) { best = Math.max(best, this.scoreTerm(tk, tm)); if (best >= 100) break; } if (!best) { ok = false; break; } tot += best; }
          sc = ok ? tot / tokens.length : 0;
        }
        if (sc > 0) scored.push({ it, sc });
      }
      scored.sort((a, b) => b.sc - a.sc);
      const byType = {};
      for (const { it, sc } of scored) {
        if (!byType[it.type]) byType[it.type] = { label: it.type, top: sc, items: [] };
        if (byType[it.type].items.length < 3) byType[it.type].items.push({ badge: it.type, badgeBg: it.bg, badgeC: it.c, title: it.title, sub: it.sub, run: it.run });
      }
      paletteGroups = Object.values(byType).sort((a, b) => b.top - a.top);
      this._firstResult = scored.length ? scored[0].it : null;
      const last = tokens[tokens.length - 1] || '';
      if (last) {
        const seen = new Set();
        outer: for (const { it } of scored.slice(0, 30)) for (const dt of it.dterms) {
          const nd = this.norm(dt);
          if (!nd || nd === last || seen.has(nd) || !/[\u0590-\u05FF]/.test(dt)) continue;
          if (nd.startsWith(last) || (last.length >= 3 && this.lev(last, nd, 1) >= 0)) {
            seen.add(nd);
            paletteSuggests.push({ label: dt, apply: () => { const parts = s.paletteQ.trim().split(/\s+/); parts[parts.length - 1] = dt; this.setState({ paletteQ: parts.join(' ') + ' ' }); } });
            if (paletteSuggests.length >= 6) break outer;
          }
        }
      }
    }
    const lowRows = lowEnrolls.slice(0, 5).map(l => ({
      initial: (l.m.first || '?')[0], title: (l.m.first || '—') + ' · ' + (l.c.name || ''),
      sub: l.rem === 0 ? 'הכרטיסייה נגמרה' : 'נותרו ' + l.rem + ' מתוך ' + l.e.purchased,
      subColor: l.rem === 0 ? '#dc2626' : '#9a6414',
      open: () => { closeP(); this.setState({ view: 'families', selId: l.m.famId }); },
      punch: () => this.punch(l.e.id) }));
    const AGER = [['3–5', 3, 5], ['6–8', 6, 8], ['9–12', 9, 12], ['13–17', 13, 17], ['18–30', 18, 30], ['31–59', 31, 59], ['60+', 60, 99]];
    const wApply = (cs, k, v) => {
      if (k === 'age') { const r = AGER.find(a => a[0] === v); return cs.filter(c => (c.ageMin ?? 3) <= r[2] && (c.ageMax ?? 18) >= r[1]); }
      if (k === 'gender') return cs.filter(c => (c.gender || 'all') === 'all' || c.gender === (v === 'בנים' ? 'm' : 'f'));
      if (k === 'day') return cs.filter(c => DAYN[c.weekday] === v);
      if (k === 'cat') return cs.filter(c => (c.cat || 'העשרה') === v);
      if (k === 'sector') return cs.filter(c => (c.sector || 'הכל') === 'הכל' || c.sector === v);
      return cs;
    };
    const wOpts = (cs, k) => {
      if (k === 'age') return AGER.filter(r => cs.some(c => (c.ageMin ?? 3) <= r[2] && (c.ageMax ?? 18) >= r[1])).map(r => r[0]);
      if (k === 'gender') { const o = []; if (cs.some(c => (c.gender || 'all') !== 'f')) o.push('בנים'); if (cs.some(c => (c.gender || 'all') !== 'm')) o.push('בנות'); return o; }
      if (k === 'day') return [...new Set(cs.map(c => DAYN[c.weekday]))];
      if (k === 'cat') return [...new Set(cs.map(c => c.cat || 'העשרה'))];
      if (k === 'sector') return [...new Set(cs.map(c => c.sector || 'הכל'))];
      return [];
    };
    const AXES = [['sector', 'מגזר'], ['age', 'גיל'], ['gender', 'מגדר'], ['day', 'יום'], ['cat', 'סוג חוג']];
    let wcs = visCourses.slice(); const lockChips = []; let wAxis = null, wheelOpts = [];
    for (const [k, lbl] of AXES) {
      if (wLocks[k] !== undefined) {
        wcs = wApply(wcs, k, wLocks[k]);
        const kk = k;
        lockChips.push({ label: lbl + ': ' + wLocks[k], isManual: true, bg: '#211d17', c: '#f3c76b',
          remove: () => { const nl = {}; for (const [k2] of AXES) { if (k2 === kk) break; if (wLocks[k2] !== undefined) nl[k2] = wLocks[k2]; } this.setState({ wheelLocks: nl, wheelRot: wRot + 90 }); } });
        continue;
      }
      const opts = wOpts(wcs, k);
      if (opts.length < 2) { if (opts.length === 1) lockChips.push({ label: lbl + ': ' + opts[0] + ' · דולג', isManual: false, bg: '#eceae2', c: '#8b8474', remove: null }); continue; }
      if (!wAxis) {
        wAxis = { k, lbl };
        const n = opts.length, kk = k;
        wheelOpts = opts.map((o, i) => { const ang = Math.round(-90 + i * 360 / n);
          return { label: o, pos: 'translate(-50%,-50%) rotate(' + ang + 'deg) translateY(-108px) rotate(' + (-ang) + 'deg)',
            pick: () => this.setState({ wheelLocks: { ...wLocks, [kk]: o }, wheelRot: wRot + 137 }) }; });
      }
    }
    this._wcsIds = new Set(wcs.map(c => c.id));
    const WCOL = ['#f3c76b', '#b45309', '#7c3aed', '#0f766e', '#be185d'];
    const nseg = Math.max(wheelOpts.length, 1), ringStops = [];
    for (let i = 0; i < nseg; i++) ringStops.push(WCOL[i % WCOL.length] + ' ' + (i * 100 / nseg) + '% ' + ((i + 1) * 100 / nseg) + '%');
    const wheelRing = 'conic-gradient(from -90deg, ' + ringStops.join(', ') + ')';
    const wheelResults = wcs.map(c => {
      const n = s.enrollments.filter(e => e.courseId === c.id).length, mx = c.maxStudents || 999, left = mx - n;
      return { name: c.name, teacher: teacherName(c.teacherId),
        meta: this.sessionsOf(c).map(ss => 'יום ' + DAYN[ss.day] + ' ' + (ss.time || '') + (ss.label ? ' (' + ss.label + ')' : '')).join(' · ') + ' · ₪' + (c.price || 0) + ' לחודש',
        avail: left <= 0 ? 'מלא' : left <= 2 ? left + ' נותרו' : 'מקום פנוי',
        avBg: left <= 0 ? '#fdeaea' : left <= 2 ? '#fdf1d4' : '#e4f5ea', avC: left <= 0 ? '#b91c1c' : left <= 2 ? '#9a6414' : '#12803c',
        canEnroll: isAdmin && left > 0,
        enroll: () => this.setState({ wheelOpen: false, view: 'courses', selCourseId: c.id, modal: 'enroll', enrollError: '', enrollForm: { memberId: '', purchased: c.model === 'punch' ? String(c.size) : '' } }) };
    });
    let enrollHints = [];
    if (selC && s.modal === 'enroll' && s.enrollForm.memberId) {
      const em = allM.find(m => m.id === s.enrollForm.memberId);
      if (em) {
        const a = this.age(em.birth), lo = selC.ageMin ?? 3, hi = selC.ageMax ?? 18;
        if (a != null) enrollHints.push(a >= lo && a <= hi
          ? { t: '✓ גיל מתאים — ' + (em.gender === 'f' ? 'בת ' : 'בן ') + a + ', טווח החוג ' + lo + '–' + hi, bg: '#e4f5ea', c: '#12803c' }
          : { t: 'שימו לב: גיל ' + a + ' מחוץ לטווח המומלץ (' + lo + '–' + hi + ')', bg: '#fdf1d4', c: '#9a6414' });
        if ((selC.gender || 'all') !== 'all' && em.gender && selC.gender !== em.gender)
          enrollHints.push({ t: selC.gender === 'm' ? 'החוג מיועד לבנים בלבד' : 'החוג מיועד לבנות בלבד', bg: '#fdeaea', c: '#b91c1c' });
        for (const e of s.enrollments.filter(e => e.memberId === em.id)) {
          const cc = s.courses.find(x => x.id === e.courseId); if (!cc) continue;
          for (const s1 of this.sessionsOf(cc)) for (const s2 of this.sessionsOf(selC)) if (s1.day === s2.day && s1.time === s2.time)
            enrollHints.push({ t: 'התנגשות לו"ז: ' + em.first + ' כבר רשום/ה ל"' + cc.name + '" ביום ' + DAYN[s1.day] + ' ' + (s1.time || ''), bg: '#fdeaea', c: '#b91c1c' });
        }
      }
    }
    const attention = [];
    if (s.view === 'home' || s.view === 'care') {
    for (const f of s.families) if (f.status === 'pending') attention.push({ tag: 'מלגה', tagBg: '#fdf1d4', tagC: '#9a6414', title: 'משפחת ' + f.name + ' ממתינה לאישור', go: () => this.openFam(f.id) });
    for (const c of s.courses) { const rr = roomsArr.find(r => r.id === c.roomId); if (rr && !rr.active) attention.push({ tag: 'חדר', tagBg: '#fdeaea', tagC: '#b91c1c', title: '"' + c.name + '" משויך לחדר כבוי (' + rr.name + ') — הפעילו את החדר או העבירו את החוג', go: () => this.setState({ view: 'courses', selCourseId: c.id }) }); }
    for (const sp of (s.supporters || [])) if (sp.nextDate && sp.nextDate <= this.isoOf(now)) attention.push({ tag: 'תומכת', tagBg: '#fdf3dd', tagC: '#9a6414', title: 'הגיע תאריך היעד ליצירת קשר — ' + sp.name + (sp.phone ? ' · ' + sp.phone : ''), go: () => this.setState({ view: 'support', supQ: sp.name }) });
    for (const e of s.enrollments) {
      const pb = this.payBal(e);
      if (pb > 0 && e.dueDate && e.dueDate <= this.isoOf(now)) {
        const pm = allM.find(x => x.id === e.memberId) || {}; const pc = s.courses.find(x => x.id === e.courseId) || {};
        attention.push({ tag: 'תשלום', tagBg: '#fdeee0', tagC: '#b45309', title: 'יתרת ₪' + pb + ' — ' + (pm.first || '') + ' (' + (pm.famName || '') + ') · ' + (pc.name || '') + ' · עבר המועד ' + this.fmtD(e.dueDate), go: () => this.openFam(pm.famId) });
      }
    }
    for (const l of lowEnrolls) attention.push({ tag: 'יתרה', tagBg: '#efe7f3', tagC: '#7c3aed', title: (l.m.first || '') + ' (' + (l.m.famName || '') + ') — ' + (l.rem === 0 ? 'הכרטיסייה נגמרה' : 'נשארו ' + l.rem) + ' ב' + (l.c.name || ''), go: () => this.openFam(l.m.famId) });
    const urgSeen = new Set();
    for (let i = 0; i < 7; i++) {
      const du = new Date(now.getFullYear(), now.getMonth(), now.getDate() + i);
      for (const e of this.dayEvents(du)) {
        if (!e.ev || e.ev.priority !== 'red' || urgSeen.has(e.ev.id)) continue;
        urgSeen.add(e.ev.id);
        const isoU = this.isoOf(du);
        attention.unshift({ tag: 'דחוף', tagBg: '#fdeaea', tagC: '#b91c1c', title: e.title + ' — יום ' + DAYN[du.getDay()] + (e.time ? ' ' + e.time : ''), go: () => this.setState({ view: 'calendar', calDay: isoU, calMonth: du.getMonth(), calYear: du.getFullYear() }) });
      }
    }
    if (urgSeen.size) digestLines.unshift('דחוף השבוע: ' + attention.filter(a => a.tag === 'דחוף').map(a => a.title).slice(0, 2).join(' · '));
    for (const f of s.families) if (!f.fullSefach && f.status !== 'inactive' && f.members.length) attention.push({ tag: 'מסמך', tagBg: '#e7edf5', tagC: '#3a5a86', title: 'חסר ספח מלא — משפחת ' + f.name, go: () => this.openFam(f.id) });
    for (const f of s.families) if (this.tierOf((f.cred || {}).score ?? 700)[0] === 'red') attention.push({ tag: 'סיכון', tagBg: '#fdeaea', tagC: '#b91c1c', title: 'משפחת ' + f.name + ' בסטטוס אדום (' + f.cred.score + ') — נדרשת שיחת שירות', go: () => this.openFam(f.id) });
    for (const c of s.courses) { const n = s.enrollments.filter(e => e.courseId === c.id).length, mx = c.maxStudents || 999;
      if (n >= mx) attention.push({ tag: 'מלא', tagBg: '#fdeaea', tagC: '#b91c1c', title: '"' + c.name + '" מלא (' + n + '/' + mx + ')', go: () => this.setState({ view: 'courses', selCourseId: c.id }) });
      else if (n >= mx * 0.8) attention.push({ tag: 'מתמלא', tagBg: '#fdf1d4', tagC: '#9a6414', title: '"' + c.name + '" כמעט מלא (' + n + '/' + mx + ')', go: () => this.setState({ view: 'courses', selCourseId: c.id }) }); }
    }

    let dayV = null;
    if (s.view === 'calendar' && s.calDay) {
      const dd = new Date(s.calDay + 'T12:00:00');
      const openEv = (ev) => () => this.openEventEdit(ev);
      const evsD = this.dayEvents(dd).filter(e => this.allowE(e));
      dayV = {
        title: new Intl.DateTimeFormat('he', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }).format(dd),
        heb: new Intl.DateTimeFormat('he', { weekday: 'long' }).format(dd) + ', ' + this.hebDateFull(s.calDay),
        allDay: evsD.filter(e => e.sort === 0 || e.sort === 2).map(e => ({ label: e.title, bg: e.bg, c: e.c, go: e.nav || null, cur: e.nav ? 'pointer' : 'default' })),
        rows: evsD.filter(e => e.sort === 1 || e.sort === 3).sort((a, b) => (a.time || '99:99').localeCompare(b.time || '99:99')).map(e => {
          const cc = e.cid ? s.courses.find(x => x.id === e.cid) : null;
          return { time: e.time || '—', title: e.title,
            sub: cc ? teacherName(cc.teacherId) + ' · ' + ((roomsArr.find(r => r.id === cc.roomId) || {}).name || '') + ' · ' + s.enrollments.filter(x => x.courseId === cc.id).length + ' רשומים' : (e.ev && e.ev.notes) || '',
            typeLabel: e.type, bg: e.bg, c: e.c, prC: e.prC || 'transparent',
            actionLabel: cc ? 'לניקוב ←' : e.ev ? 'עריכה' : '', hasAction: !!(cc || e.ev),
            act: e.ev ? ((evt) => { if (evt && evt.stopPropagation) evt.stopPropagation(); openEv(e.ev)(); }) : cc ? ((evt) => { if (evt && evt.stopPropagation) evt.stopPropagation(); this.setState({ view: 'courses', selCourseId: cc.id }); }) : null,
            go: e.nav || (cc ? () => this.setState({ view: 'courses', selCourseId: cc.id }) : e.ev ? openEv(e.ev) : null) };
        })
      };
      dayV.hasAllDay = dayV.allDay.length > 0;
      dayV.empty = dayV.allDay.length === 0 && dayV.rows.length === 0;
      dayV.countLabel = (dayV.rows.length + dayV.allDay.length) + ' אירועים ביום זה';
      dayV.blockLabel = this.blockReason(dd, 'course');
      dayV.hasBlock = !!dayV.blockLabel;
    }
    const shiftDay = (n) => { const nd = new Date((s.calDay || this.isoOf(now)) + 'T12:00:00'); nd.setDate(nd.getDate() + n); this.setState({ calDay: this.isoOf(nd), calMonth: nd.getMonth(), calYear: nd.getFullYear() }); };
    let diary = null;
    if (s.modal === 'diary' && s.diaryRoomId) {
      const room = roomsArr.find(r => r.id === s.diaryRoomId) || {};
      const dIso = s.diaryDate || this.isoOf(now);
      const dd2 = new Date(dIso + 'T12:00:00');
      const blocked = !room.active ? 'החדר מושבת בהגדרות' : this.blockReason(dd2, 'course');
      const slots = [];
      const hFrom = parseInt(room.from) || 8, hTo = parseInt(room.to) || 20;
      for (let h = hFrom; h <= hTo; h++) {
        const hh = this.pad2(h) + ':00';
        if (h === 15) { slots.push({ time: hh, label: 'ניקיון יומי (15:00–16:00)', bg: '#eceae2', c: '#4d463c', free: false, book: null }); continue; }
        const oc = s.courses.find(c => c.roomId === room.id && (!c.start || dIso >= c.start) && (!c.end || dIso <= c.end) && this.sessionsOf(c).some(ss => ss.day === dd2.getDay() && parseInt(ss.time) === h));
        const oe = s.events.find(ev => !ev.done && ev.roomId === room.id && ev.date === dIso && parseInt(ev.time || '-1') === h);
        const cleaning = h === 15;
        const free = !oc && !oe && !blocked && !cleaning;
        slots.push({ time: hh,
          label: oc ? 'חוג: ' + oc.name : oe ? 'אירוע: ' + oe.title : blocked ? 'חסום — ' + blocked : cleaning ? 'נקיון יומי (15:00–16:00)' : 'פנוי',
          bg: oc ? '#fdf1d4' : oe ? '#e7edf5' : blocked ? '#fdeaea' : cleaning ? '#eceae2' : '#e4f5ea',
          c: oc ? '#9a6414' : oe ? '#3a5a86' : blocked ? '#b91c1c' : cleaning ? '#57534e' : '#12803c',
          free, book: free ? () => this.setState({ modal: 'event', editingEventId: null, eventError: '', evReturn: { roomId: room.id, date: dIso }, eventForm: { title: '', date: dIso, time: hh, type: 'org', notes: 'חדר: ' + room.name, price: '', roomId: room.id, famId: '', priority: 'green' } }) : null });
      }
      const eqOn = Object.entries(room.eq || {}).filter(([, v]) => v).map(([k]) => k);
      diary = { name: 'יומן — ' + room.name,
        slotLabel: 'משבצות של ' + (room.slot || 60) + ' דק׳' + (room.cap ? ' · עד ' + room.cap + ' משתתפים' : '') + (room.access ? ' · נגיש' : '') + (eqOn.length ? ' · ' + eqOn.slice(0, 3).join(', ') : ''),
        settings: () => this.openRoomSet(room.id),
        dateLabel: new Intl.DateTimeFormat('he', { weekday: 'long' }).format(dd2) + ', ' + this.hebDateFull(dIso) + ' · ' + this.fmtD(dIso),
        blockedLabel: blocked ? 'היום חסום לתזמון חוגים: ' + blocked : '', hasBlocked: !!blocked, slots,
        prev: () => { const nd = new Date(dd2); nd.setDate(nd.getDate() - 1); this.setState({ diaryDate: this.isoOf(nd) }); },
        next: () => { const nd = new Date(dd2); nd.setDate(nd.getDate() + 1); this.setState({ diaryDate: this.isoOf(nd) }); } };
    }
    let absV = null;
    if (s.modal === 'absence' && s.absEnrollId) {
      const en2 = s.enrollments.find(e => e.id === s.absEnrollId);
      const em2 = en2 ? allM.find(m => m.id === en2.memberId) : null;
      const c2 = en2 ? s.courses.find(c => c.id === en2.courseId) : null;
      if (en2 && c2) {
        const ns = this.nextSession(c2);
        const hrs = ns ? Math.round((ns - now) / 3600000) : null;
        const eligible = hrs != null && hrs >= 48;
        absV = { who: (em2 ? em2.first + ' ' + (em2.famName || '') : '') + ' · ' + c2.name,
          sessionLabel: ns ? 'המפגש הקרוב: יום ' + DAYN[ns.getDay()] + ' ' + this.pad2(ns.getHours()) + ':' + this.pad2(ns.getMinutes()) + ' — בעוד ' + hrs + ' שעות' : '',
          eligLabel: eligible ? '✓ מעל 48 שעות מראש — זכאי/ת להשלמה, הניקוב לא יירד' : '⚠ פחות מ-48 שעות — לא זכאי/ת להשלמה' + (en2.plan === 'punch' ? ', הניקוב יירד' : ''),
          eligBg: eligible ? '#e4f5ea' : '#fdf1d4', eligC: eligible ? '#12803c' : '#9a6414' };
      }
    }
    const audit = s.modal === 'audit' ? this.runAudit() : null;
    let credV = null;
    if (s.view === 'home') {
      const scores = s.families.map(f => (f.cred || {}).score ?? 700);
      const avg = Math.round(scores.reduce((a, b) => a + b, 0) / Math.max(1, scores.length));
      const bins = Array(20).fill(0);
      for (const sc of scores) bins[Math.min(19, Math.floor(sc / 50))]++;
      const maxB = Math.max(1, ...bins);
      const zoneC = (i) => { const v = i * 50; if (v >= 950) return '#f3c76b'; if (v >= 800) return '#16a34a'; if (v >= 500) return '#d97706'; return '#dc2626'; };
      const [, tLabel3, tBg3, tC3] = this.tierOf(avg);
      const today = this.isoOf(now);
      let dayDelta = 0;
      for (const f of s.families) for (const l of ((f.cred || {}).log || [])) if (l.date === today) dayDelta += l.delta;
      credV = { avg: String(avg), tier: tLabel3, tBg: tBg3, tC: tC3, needle: Math.min(99, avg / 10) + '%',
        trend: (dayDelta > 0 ? '+' : '') + dayDelta + ' נק׳ היום', trendC: dayDelta > 0 ? '#12803c' : dayDelta < 0 ? '#b91c1c' : '#8b8474',
        total: String(scores.length),
        bars: bins.map((n, i) => ({ h: Math.max(4, Math.round(n / maxB * 100)) + '%', c: zoneC(i), t: (i * 50) + '–' + (i * 50 + 49) + ': ' + n + ' משפחות', glow: n === maxB ? '0 0 14px rgba(180,83,9,.4)' : 'none' })),
        risk: s.families.map(f => ({ f, sc: (f.cred || {}).score ?? 700 })).sort((a, b) => a.sc - b.sc).slice(0, 3).map(x => ({ name: 'משפחת ' + x.f.name, score: String(x.sc), dot: this.tierOf(x.sc)[4], open: () => this.openFam(x.f.id) })) };
    }
    let crsG = null;
    if (s.view === 'home') {
      const rows2 = s.courses.map(c => {
        const n = s.enrollments.filter(e => e.courseId === c.id).length, mx = c.maxStudents || 12;
        const pct = Math.min(100, Math.round(n / mx * 100));
        const col = pct >= 100 ? '#dc2626' : pct >= 85 ? '#f3c76b' : pct >= 40 ? '#16a34a' : '#d97706';
        return { c, n, mx, pct, col };
      });
      const avgOcc = Math.round(rows2.reduce((a, r) => a + r.pct, 0) / Math.max(1, rows2.length));
      const students = s.enrollments.length;
      const revenue = s.enrollments.reduce((a, e) => { const c = s.courses.find(x => x.id === e.courseId); if (!c || (e.status || 'active') !== 'active') return a; const p = c.price || 0; return a + (c.model === 'monthly' ? p : c.model === 'half_year' ? p / 6 : c.model === 'year' ? p / 12 : 0); }, 0);
      const fullN = rows2.filter(r => r.pct >= 100).length;
      crsG = { avg: avgOcc + '%', needle: Math.min(99, avgOcc) + '%',
        students: String(students), revenue: '₪' + revenue.toLocaleString('he-IL') + ' לחודש (מנויים חודשיים בלבד)',
        chips: [
          { label: rows2.length + ' חוגים', bg: '#e7edf5', c: '#3a5a86', go: () => this.setState({ view: 'courses', selCourseId: null }) },
          { label: rows2.filter(r => r.c.model === 'punch').length + ' כרטיסייה', bg: '#fdf1d4', c: '#9a6414', go: () => this.setState({ view: 'courses', selCourseId: null }) },
          { label: rows2.filter(r => r.c.model === 'monthly').length + ' מנוי', bg: '#e4f5ea', c: '#12803c', go: () => this.setState({ view: 'courses', selCourseId: null }) },
          { label: fullN + ' מלאים', bg: '#fdeaea', c: '#b91c1c', go: () => this.setState({ view: 'courses', selCourseId: null }) }],
        bars: rows2.map(r => ({ h: Math.max(6, r.pct) + '%', c: r.col, t: r.c.name + ' · ' + r.n + '/' + r.mx + ' (' + r.pct + '%)',
          glow: r.pct >= 100 ? '0 0 12px rgba(220,38,38,.45)' : 'none',
          go: () => this.setState({ view: 'courses', selCourseId: r.c.id }) })),
        top: rows2.slice().sort((a, b) => b.pct - a.pct).slice(0, 3).map(r => ({ name: r.c.name, pctLabel: r.n + '/' + r.mx, dot: r.col, open: () => this.setState({ view: 'courses', selCourseId: r.c.id }) })) };
    }
    const EQUIP = ['מקרן', 'הגברה', 'מזגן', 'פסנתר', 'מראות', 'מטבח מאובזר', 'מחשבים', 'שולחנות מתקפלים'];
    const rf = s.roomForm || {};
    const roomEqChips = s.modal === 'roomset' ? EQUIP.map(label => ({
      label: (rf.eq && rf.eq[label] ? '✓ ' : '') + label,
      bg: rf.eq && rf.eq[label] ? '#211d17' : '#fff', c: rf.eq && rf.eq[label] ? '#f3c76b' : '#4d463c', bd: rf.eq && rf.eq[label] ? '#211d17' : '#ded7c8',
      toggle: () => this.setState({ roomForm: { ...rf, eq: { ...(rf.eq || {}), [label]: !(rf.eq && rf.eq[label]) } } }) })) : [];
    const reps = s.reports || {};
    const reportRows = [['daily', 'יומי'], ['weekly', 'שבועי'], ['monthly', 'חודשי'], ['quarterly', 'רבעוני']].map(([k, label]) => ({
      label: 'דו"ח ' + label, on: !!reps[k],
      tBg: reps[k] ? '#211d17' : '#ded7c8', tJust: reps[k] ? 'flex-end' : 'flex-start',
      toggle: () => this.setState({ reports: { ...reps, [k]: !reps[k] } }),
      gen: () => this.genReport(label) }));
    const careDoneMap = s.careDone || {};
    const careSrc = attention.concat(s.careAudit || []);
    const care = careSrc.filter(a => !careDoneMap[a.tag + '|' + a.title]).map(a => {
      const key = a.tag + '|' + a.title;
      return { ...a, done: () => { this.setState({ careDone: { ...careDoneMap, [key]: true } }); this.t('סומן כטופל ✓'); } };
    });
    const careF = s.careFilter || 'הכל';
    const careTags = ['הכל', ...new Set(care.map(a => a.tag))];
    const careChips = careTags.map(t => ({
      label: t === 'הכל' ? 'הכל · ' + care.length : t + ' · ' + care.filter(a => a.tag === t).length,
      bg: careF === t ? '#211d17' : 'rgba(255,255,255,.8)', c: careF === t ? '#f3c76b' : '#211d17',
      pick: () => this.setState({ careFilter: t }) }));
    const careRows = careF === 'הכל' ? care : care.filter(a => a.tag === careF);
    const careDoneCount = Object.keys(careDoneMap).length;
    const FGET = { city: (f) => f.city || '', comm: (f) => f.community || '', marital: (f) => f.maritalStatus || 'לא ידוע', status: (f) => this.stMeta(f.status)[0], cred: (f) => this.tierOf((f.cred || {}).score ?? 700)[1], kids: (f) => f.members.length ? 'עם ילדים' : 'בלי ילדים', enrolled: (f) => famEnrolls(f).length ? 'משתתפות בחוגים' : 'לא משתתפות', sefach: (f) => f.fullSefach ? 'קיים' : 'חסר', lang: (f) => f.language || '' };
    const FAXES = [['city', 'עיר'], ['comm', 'קהילה'], ['marital', 'מצב משפחתי'], ['status', 'סטטוס'], ['cred', 'אמינות'], ['kids', 'ילדים'], ['enrolled', 'חוגים'], ['sefach', 'ספח מלא'], ['lang', 'שפה']];
    const fwL = s.fwLocks || {}, fwR = s.fwRot || 0;
    let fcs = s.families.slice(); const fwChips = []; let fwAxis = null, fwOpts = [];
    for (const [k, lbl] of FAXES) {
      if (fwL[k] !== undefined) {
        fcs = fcs.filter(f => FGET[k](f) === fwL[k]);
        const kk = k;
        fwChips.push({ label: lbl + ': ' + fwL[k], isManual: true, bg: '#211d17', c: '#f3c76b',
          remove: () => { const nl = {}; for (const [k2] of FAXES) { if (k2 === kk) break; if (fwL[k2] !== undefined) nl[k2] = fwL[k2]; } this.setState({ fwLocks: nl, fwRot: fwR + 90 }); } });
        continue;
      }
      const counts = {};
      for (const f of fcs) { const v = FGET[k](f); if (v) counts[v] = (counts[v] || 0) + 1; }
      let opts = Object.entries(counts).sort((a, b) => b[1] - a[1]).map(([v]) => v);
      if (opts.length < 2) { if (opts.length === 1) fwChips.push({ label: lbl + ': ' + opts[0] + ' · דולג', isManual: false, bg: '#eceae2', c: '#8b8474', remove: null }); continue; }
      if (!fwAxis) {
        fwAxis = { k, lbl }; opts = opts.slice(0, 8);
        const n = opts.length, kk = k;
        fwOpts = opts.map((o, i) => { const ang = Math.round(-90 + i * 360 / n);
          return { label: o + ' · ' + counts[o], pos: 'translate(-50%,-50%) rotate(' + ang + 'deg) translateY(-108px) rotate(' + (-ang) + 'deg)',
            pick: () => this.setState({ fwLocks: { ...fwL, [kk]: o }, fwRot: fwR + 137 }) }; });
      }
    }
    const fwSeg = Math.max(fwOpts.length, 1), fwStops = [];
    for (let i = 0; i < fwSeg; i++) fwStops.push(WCOL[i % WCOL.length] + ' ' + (i * 100 / fwSeg) + '% ' + ((i + 1) * 100 / fwSeg) + '%');
    const fwRing = 'conic-gradient(from -90deg, ' + fwStops.join(', ') + ')';
    const fwResults = fcs.slice(0, 8).map(f => ({ title: 'משפחת ' + f.name, sub: [f.city, f.community, f.phone].filter(Boolean).join(' · ') || '—',
      open: () => { this.setState({ famWheelOpen: false }); this.openFam(f.id); } }));
    const ST_REV = { 'פעילה': 'active', 'ממתינה': 'pending', 'לא פעילה': 'inactive' };
    const fwApply = () => {
      this.setState({ famWheelOpen: false, view: 'families', selId: null, q: '',
        cityFilter: fwL.city || 'all', commFilter: fwL.comm || 'all',
        statusFilter: fwL.status ? (ST_REV[fwL.status] || 'all') : 'all',
        fMar: fwL.marital && fwL.marital !== 'לא ידוע' ? fwL.marital : 'all',
        fLang: fwL.lang || 'all',
        fSefach: fwL.sefach ? (fwL.sefach === 'קיים' ? 'yes' : 'no') : 'all',
        fKids: fwL.kids ? (fwL.kids === 'עם ילדים' ? 'yes' : 'no') : 'all',
        fEnrolled: fwL.enrolled ? (fwL.enrolled === 'משתתפות בחוגים' ? 'yes' : 'no') : 'all',
        fTier: fwL.cred ? ({ 'טיטאן': 'titan', 'לביאה': 'lion', 'טעון שיפור': 'pale', 'סיכון נטישה': 'red' }[fwL.cred] || 'all') : 'all',
        famAdv: true });
      this.t('הסינון הוחל על טבלת המשפחות');
    };
    let joinHints = [], joinCourseOptions = [], joinMemberOptions = [], joinIsPunch = false, joinPick = null;
    if (s.modal === 'join' && sel) {
      const jf = s.joinForm || {};
      joinMemberOptions = sel.members.map(m2 => ({ id: m2.id, label: (m2.isParent ? (m2.gender === 'f' ? 'אמא — ' : 'אבא — ') : '') + m2.first + (this.age(m2.birth) != null ? ' · ' + (m2.gender === 'f' ? 'בת ' : 'בן ') + this.age(m2.birth) : '') }));
      if (sel.father && !sel.members.some(x => x.isParent && x.gender === 'm')) joinMemberOptions.push({ id: '__pf', label: 'אבא — ' + sel.father });
      if (sel.mother && !sel.members.some(x => x.isParent && x.gender === 'f')) joinMemberOptions.push({ id: '__pm', label: 'אמא — ' + sel.mother });
      const realId = jf.memberId === '__pf' ? (sel.members.find(x => x.isParent && x.gender === 'm') || {}).id : jf.memberId === '__pm' ? (sel.members.find(x => x.isParent && x.gender === 'f') || {}).id : jf.memberId;
      const enrolledSet = new Set(s.enrollments.filter(e => e.memberId === realId).map(e => e.courseId));
      const jm = jf.memberId === '__pf' ? { first: sel.father, gender: 'm', birth: '' } : jf.memberId === '__pm' ? { first: sel.mother, gender: 'f', birth: '' } : sel.members.find(x => x.id === jf.memberId);
      const jAge = jm ? this.age(jm.birth) : null;
      joinCourseOptions = s.courses.filter(c => {
        if (enrolledSet.has(c.id)) return false;
        if (s.enrollments.filter(e => e.courseId === c.id).length >= (c.maxStudents || 999)) return false;
        if (s.joinShowAll) return true;
        if (!jm) return false;
        if ((c.gender || 'all') !== 'all' && jm.gender && c.gender !== jm.gender) return false;
        if (jAge != null) return (c.ageMin ?? 3) <= jAge && (c.ageMax ?? 99) >= jAge;
        return (c.ageMax ?? 99) >= 16;
      }).map(c => ({ id: c.id, label: c.name + ' · ' + teacherName(c.teacherId) + ' · יום ' + DAYN[(this.sessionsOf(c)[0] || {}).day ?? c.weekday] }));
      const xt2 = (t) => [t, ...(Component.XLAT[t] || [])];
      const mkTerms = (parts) => [...new Set(parts.filter(Boolean).flatMap(xt2).map(t => this.norm(t)).filter(Boolean))];
      const jmItems = joinMemberOptions.map(o => ({ id: o.id, label: o.label, nterms: mkTerms([o.label, ...o.label.split(/[ ·—]+/)]), pick: () => this.setState({ joinForm: { ...jf, memberId: o.id, courseId: '' }, jmQ: null, jcQ: null, joinError: '' }) }));
      if (!jmItems.length) jmItems.push({ id: '__add', label: '＋ אין עדיין בני משפחה — הוספה מהירה וחזרה אוטומטית לשיבוץ', nterms: [this.norm('הוספה')], pick: () => this.setState({ modal: 'member', editingMemberId: null, memberError: '', afterMember: 'join', memberForm: { first: '', gender: 'm', birth: '', idNum: '', phone: '', phone2: '', school: '', grade: '', health: '', mSefach: false, mInvite: false, mRecommend: false, mPhotos: false, mVideos: false, notes: '' } }) });
      const jcItems = joinCourseOptions.map(o => { const c2 = s.courses.find(x => x.id === o.id) || {}; return { id: o.id, label: o.label, nterms: mkTerms([o.label, c2.name, (c2.name || '').split(' — ')[0], c2.cat, teacherName(c2.teacherId), ...(c2.name || '').split(/[ ·—]+/)]), pick: () => this.setState({ joinForm: { ...jf, courseId: o.id }, jcQ: null, joinError: '' }) }; });
      joinPick = {
        jmQ: s.jmQ != null ? s.jmQ : ((joinMemberOptions.find(o => o.id === jf.memberId) || {}).label || ''),
        jcQ: s.jcQ != null ? s.jcQ : ((joinCourseOptions.find(o => o.id === jf.courseId) || {}).label || ''),
        jmList: s.jmQ != null ? this.smartRank(s.jmQ, jmItems) : [],
        jcList: s.jcQ != null ? this.smartRank(s.jcQ, jcItems) : []
      };
      const jc = s.courses.find(c => c.id === jf.courseId);
      joinIsPunch = !!jc && jc.model === 'punch';
      this._joinGroups = jc && this.sessionsOf(jc).length > 1 ? this.sessionsOf(jc).map((ss, i) => { const v = ss.label || ('קבוצה ' + (i + 1)); return { v, t: v + ' · יום ' + DAYN[ss.day] + ' ' + (ss.time || '') }; }) : [];
      if (jm && jc) {
        const a = this.age(jm.birth), lo = jc.ageMin ?? 3, hi = jc.ageMax ?? 99;
        if (a != null) joinHints.push(a >= lo && a <= hi ? { t: '✓ גיל מתאים — ' + a + ' (טווח החוג ' + lo + '–' + hi + ')', bg: '#e4f5ea', c: '#12803c' } : { t: 'שימו לב: גיל ' + a + ' מחוץ לטווח המומלץ (' + lo + '–' + hi + ')', bg: '#fdf1d4', c: '#9a6414' });
        if ((jc.gender || 'all') !== 'all' && jm.gender && jc.gender !== jm.gender) joinHints.push({ t: jc.gender === 'm' ? 'החוג מיועד לבנים בלבד' : 'החוג מיועד לבנות בלבד', bg: '#fdeaea', c: '#b91c1c' });
        for (const e of s.enrollments.filter(e => e.memberId === realId)) {
          const cc = s.courses.find(x => x.id === e.courseId); if (!cc) continue;
          for (const s1 of this.sessionsOf(cc)) for (const s2 of this.sessionsOf(jc)) if (s1.day === s2.day && s1.time === s2.time) joinHints.push({ t: 'התנגשות לו"ז: "' + cc.name + '" באותו יום ושעה', bg: '#fdeaea', c: '#b91c1c' });
      }
      }
    }
    const mbMode = s.mbMode || 'greg';
    const HBM = [['Tishri', 'תשרי'], ['Heshvan', 'חשוון'], ['Kislev', 'כסלו'], ['Tevet', 'טבת'], ['Shevat', 'שבט'], ['Adar', 'אדר'], ['Adar I', 'אדר א׳'], ['Adar II', 'אדר ב׳'], ['Nisan', 'ניסן'], ['Iyar', 'אייר'], ['Sivan', 'סיוון'], ['Tamuz', 'תמוז'], ['Av', 'אב'], ['Elul', 'אלול']];
    const mbKeys = {
      mbIsGreg: mbMode === 'greg', mbIsHeb: mbMode === 'heb',
      mbGregOn: () => this.setState({ mbMode: 'greg' }), mbHebOn: () => this.setState({ mbMode: 'heb' }),
      mbGregBg: mbMode === 'greg' ? '#211d17' : '#eceae2', mbGregC: mbMode === 'greg' ? '#f3c76b' : '#57534e',
      mbHebBg: mbMode === 'heb' ? '#211d17' : '#eceae2', mbHebC: mbMode === 'heb' ? '#f3c76b' : '#57534e',
      hbDay: s.hbDay || '', hbMonth: s.hbMonth || '', hbYear: s.hbYear || '',
      onHbDay: (e) => this.hbChange('hbDay', e.target.value),
      onHbMonth: (e) => this.hbChange('hbMonth', e.target.value),
      onHbYear: (e) => this.hbChange('hbYear', e.target.value),
      hbDayOpts: Array.from({ length: 30 }, (_, i) => ({ v: String(i + 1), t: this.gem(i + 1) })),
      hbMonthOpts: HBM.map(([v, t]) => ({ v, t })),
      hbYearOpts: Array.from({ length: 96 }, (_, i) => { const y = 5787 - i; return { v: String(y), t: this.gemYear(String(y)) + ' (' + y + ')' }; })
    };
    const mfB = s.memberForm.birth;
    const memberFormHebLine = mfB ? ((s.memberForm.gender === 'f' ? 'בת ' : 'בן ') + (this.age(mfB) ?? '') + ' · תאריך עברי: ' + this.hebDateFull(mfB)) : 'בחרו תאריך לידה — התאריך העברי יחושב אוטומטית';
    const MEDIA = [['mSefach', 'ספח'], ['mInvite', 'הזמנה'], ['mRecommend', 'המלצה'], ['mPhotos', 'תמונות'], ['mVideos', 'סרטונים']];
    const memberMediaChips = MEDIA.map(([k, label]) => ({ label: (s.memberForm[k] ? '✓ ' : '') + label,
      bg: s.memberForm[k] ? '#211d17' : '#fff', c: s.memberForm[k] ? '#f3c76b' : '#4d463c', bd: s.memberForm[k] ? '#211d17' : '#ded7c8',
      toggle: () => this.setState({ memberForm: { ...s.memberForm, [k]: !s.memberForm[k] } }) }));
    const total = s.families.length, active = s.families.filter(f => f.status === 'active').length;
    return {
      isAdmin, roleLabel: isAdmin ? 'מנהל/ת מערכת' : 'מורה', todayLabel, q: s.q, statusFilter: s.statusFilter,
      nav: { homeBg, homeC, homeSh, famBg, famC, famSh, crsBg, crsC, crsSh, calBg, calC, calSh, setBg, setC, setSh, supBg, supC, supSh },
      viewSupport: s.view === 'support',
      goSupport: () => this.setState({ view: 'support', selId: null, selCourseId: null }),
      supQ: s.supQ || '', setSupQ: (e) => this.setState({ supQ: e.target.value }),
      ...(() => {
        if (s.view !== 'support') return { supRows: [], supCountLabel: '', noSup: false, supHead: [], showSupModal: false };
        const nq = this.norm(s.supQ || ''), qd2 = (s.supQ || '').replace(/\D/g, '');
        const scf = s.supColF || {};
        const scfActive = Object.values(scf).some(v => String(v || '').trim());
        let list = (s.supporters || []).filter(sp => {
          if (nq || qd2) {
            const phoneHit = qd2.length >= 3 && (sp.phone || '').replace(/\D/g, '').includes(qd2);
            const textHit = nq && this.norm([sp.name, sp.email, sp.cat, sp.address, sp.forWho].join(' ')).includes(nq);
            if (!phoneHit && !textHit) return false;
          }
          if ((scf.name || '').trim() && !this.norm(sp.name).includes(this.norm(scf.name))) return false;
          if ((scf.phone || '').trim()) { const pd = scf.phone.replace(/\D/g, ''); if (!pd || !(sp.phone || '').replace(/\D/g, '').includes(pd)) return false; }
          if ((scf.email || '').trim() && !this.norm(sp.email || '').includes(this.norm(scf.email))) return false;
          if ((scf.cat || '').trim() && !this.norm((sp.cat || '') + ' ' + (sp.forWho || '')).includes(this.norm(scf.cat))) return false;
          if ((scf.count || '').trim() && !this.numMatch(scf.count, sp.count || 0)) return false;
          if ((scf.total || '').trim() && !this.numMatch(scf.total, Math.round((sp.ils || 0) + (sp.usd || 0) * 3.7))) return false;
          if ((scf.score || '').trim() && !this.numMatch(scf.score, this.supScore(sp))) return false;
          if (s.supTierF && this.supTier(this.supScore(sp))[0] !== s.supTierF) return false;
          return true;
        });
        if (s.ayinMode && s.ayinF && s.ayinF !== 'all') {
          if (s.ayinF === 'eyes') list = list.filter(sp => +((sp.ayin || {}).eyes || 0) > 0);
          else if (s.ayinF === 'noeyes') list = list.filter(sp => !+((sp.ayin || {}).eyes || 0));
          else if (s.ayinF === 'today') list = list.filter(sp => sp.ayin && sp.ayin.lastTouch === this.isoOf(new Date()));
          else list = list.filter(sp => ((sp.ayin || {}).stage || 'new') === s.ayinF);
        }
        const sSort = s.supSort || null;
        if (sSort && sSort.key) {
          const val = (sp) => sSort.key === 'name' ? sp.name : sSort.key === 'phone' ? (sp.phone || '') : sSort.key === 'email' ? (sp.email || '') : sSort.key === 'cat' ? (sp.cat || '') : sSort.key === 'count' ? (sp.count || 0) : sSort.key === 'last' ? (sp.last || '') : sSort.key === 'score' ? this.supScore(sp) : sSort.key === 'eyes' ? (+((sp.ayin || {}).eyes || 0)) : sSort.key === 'stage' ? ((sp.ayin || {}).stage || 'new') : ((sp.ils || 0) + (sp.usd || 0) * 3.7);
          list = list.slice().sort((a, b) => { const va = val(a), vb = val(b); const c = (typeof va === 'string') ? String(va).localeCompare(String(vb), 'he') : (va - vb); return c * (sSort.dir || 1); });
        }
        const supRows = list.slice(0, 120).map(sp => ({
          name: sp.name, phone: sp.phone || '—', email: sp.email || '—',
          cat: sp.cat || '—', forWho: sp.forWho || '',
          score: String(this.supScore(sp)), tierL: this.supTier(this.supScore(sp))[0], tierBg: this.supTier(this.supScore(sp))[1], tierC: this.supTier(this.supScore(sp))[2],
          nextBadge: sp.nextDate ? (sp.nextDate <= this.isoOf(new Date()) ? '🔔 יעד עבר' : '🎯 ' + this.fmtD(sp.nextDate)) : '',
          countLabel: sp.count + ' תרומות',
          totalLabel: (sp.ils ? '₪' + sp.ils.toLocaleString('he-IL') : '') + (sp.ils && sp.usd ? ' + ' : '') + (sp.usd ? '$' + sp.usd.toLocaleString('he-IL') : '') || '—',
          lastLabel: sp.last ? this.hebDateFull(sp.last) + ' · ' + this.fmtD(sp.last) : '—',
          open: () => this.setState({ modal: 'supporter', supEditId: sp.id, supForm: { name: sp.name, phone: sp.phone || '', email: sp.email || '', address: sp.address || '', idNum: sp.idNum || '', cat: sp.cat || '', forWho: sp.forWho || '', notes: sp.notes || '' } }),
          key: (ev) => { if (ev.key === 'Enter' || ev.key === ' ') { ev.preventDefault(); this.setState({ modal: 'supporter', supEditId: sp.id, supForm: { name: sp.name, phone: sp.phone || '', email: sp.email || '', address: sp.address || '', idNum: sp.idNum || '', cat: sp.cat || '', forWho: sp.forWho || '', notes: sp.notes || '' } }); } },
          call: (ev) => { if (ev && ev.stopPropagation) ev.stopPropagation(); this.setState({ view: 'calendar', modal: 'event', editingEventId: null, eventError: '', eventForm: { title: 'להתקשר לתודה — ' + sp.name, date: this.isoOf(new Date()), time: '', type: 'call', notes: 'משפחה תומכת · ' + (sp.phone || '') + (sp.email ? ' · ' + sp.email : ''), price: '', roomId: '', famId: '', priority: 'green' } }); },
          ayStage: (sp.ayin || {}).stage || 'new',
          ayEyes: String((sp.ayin || {}).eyes ?? ''),
          ayNext: (sp.ayin || {}).nextTalk || '',
          ayNote: (sp.ayin || {}).note || '',
          ayTouched: (sp.ayin || {}).lastTouch === this.isoOf(new Date()) ? '✓ עודכן היום' : '',
          aySetStage: (e) => { e.stopPropagation && e.stopPropagation(); this.ayinTouch(sp, { stage: e.target.value }); },
          aySetEyes: (e) => { e.stopPropagation && e.stopPropagation(); this.ayinTouch(sp, { eyes: e.target.value.replace(/[^\d]/g, '') }); },
          aySetNext: (e) => { e.stopPropagation && e.stopPropagation(); this.ayinTouch(sp, { nextTalk: e.target.value }); },
          aySetNote: (e) => { e.stopPropagation && e.stopPropagation(); this.ayinTouch(sp, { note: e.target.value }); },
          ayCallAnswer: (e) => { e.stopPropagation && e.stopPropagation(); this.ayinCall(sp, 'answer'); },
          ayCallAgain: (e) => { e.stopPropagation && e.stopPropagation(); this.ayinCall(sp, 'again'); },
          ayStop: (e) => { e.stopPropagation && e.stopPropagation(); }
        }));
        const supHead = [['name', 'תומכ/ת'], ['phone', 'טלפון'], ['email', 'אימייל'], ['cat', 'קטגוריה'], ['count', 'תרומות'], ['score', 'ציון'], ['total', 'סה"כ'], ['last', 'תרומה אחרונה']].map(([k, label]) => ({
          label, arrow: sSort && sSort.key === k ? (sSort.dir > 0 ? '▲' : '▼') : '',
          click: () => this.setState({ supSort: sSort && sSort.key === k ? (sSort.dir > 0 ? { key: k, dir: -1 } : null) : { key: k, dir: 1 } }) }));
        const spSel = (s.supporters || []).find(x => x.id === s.supEditId);
        const tIls = (s.supporters || []).reduce((a, x) => a + (x.ils || 0), 0), tUsd = (s.supporters || []).reduce((a, x) => a + (x.usd || 0), 0);
        return { supRows, noSup: supRows.length === 0, supHead,
          ayinMode: !!s.ayinMode, ayinModeOff: !s.ayinMode,
          toggleAyin: () => this.setState({ ayinMode: !s.ayinMode }),
          ayinBtnBg: s.ayinMode ? '#211d17' : 'rgba(255,255,255,.75)', ayinBtnC: s.ayinMode ? '#f3c76b' : '#211d17',
          ayinReport: () => this.setState({ expOpen: true, expTarget: 'supporters', expFrom: this.isoOf(new Date()), expTo: this.isoOf(new Date()), expSel: {} }),
          ayinTodayCount: String((s.supporters || []).filter(x => x.ayin && (x.ayin.lastTouch === this.isoOf(new Date()) || (x.ayin.log || []).some(l => l.date === this.isoOf(new Date())))).length),
          hasAyinToday: (s.supporters || []).some(x => x.ayin && (x.ayin.lastTouch === this.isoOf(new Date()) || (x.ayin.log || []).some(l => l.date === this.isoOf(new Date())))),
          ayinStages: Component.AYIN_STAGES.map(([v, t]) => ({ v, t })),
          ayinF: s.ayinF || 'all',
          setAyinF: (e) => this.setState({ ayinF: e.target.value }),
          ayinSortEyes: () => this.setState({ supSort: s.supSort && s.supSort.key === 'eyes' ? (s.supSort.dir > 0 ? { key: 'eyes', dir: -1 } : null) : { key: 'eyes', dir: 1 } }),
          ayinSortStage: () => this.setState({ supSort: s.supSort && s.supSort.key === 'stage' ? (s.supSort.dir > 0 ? { key: 'stage', dir: -1 } : null) : { key: 'stage', dir: 1 } }),
          ayinEyesArrow: sSort && sSort.key === 'eyes' ? (sSort.dir > 0 ? '▲' : '▼') : '', ayinStageArrow: sSort && sSort.key === 'stage' ? (sSort.dir > 0 ? '▲' : '▼') : '',
          supColFOn: !!s.supColFOn, toggleSupColF: () => this.setState({ supColFOn: !s.supColFOn }),
          supColFBtnBg: (s.supColFOn || scfActive) ? '#211d17' : 'rgba(33,29,23,.08)', supColFBtnC: (s.supColFOn || scfActive) ? '#f3c76b' : '#8b8474',
          supColF: { name: scf.name || '', phone: scf.phone || '', email: scf.email || '', cat: scf.cat || '', count: scf.count || '', total: scf.total || '', score: scf.score || '' },
          onSupColF: (e) => this.setState({ supColF: { ...scf, [e.target.name]: e.target.value } }),
          clearSupColF: () => this.setState({ supColF: {} }),
          showSupModal: s.modal === 'supporter' && (!!spSel || s.supEditId === '__new'),
          supModalTitle: spSel ? 'כרטיס תומכ/ת — עריכה מלאה' : 'תומכת חדשה — כרטיס מלא',
          openNewSup: () => this.setState({ modal: 'supporter', supEditId: '__new', supForm: { name: '', phone: '', email: '', address: '', idNum: '', cat: '', forWho: '', notes: '' } }),
          supDel: () => spSel && this.deleteSupporter(spSel.id),
          supHasSel: !!spSel,
          supDelLabel: spSel && s.delConfirm === 'sup' + spSel.id ? 'לאשר מחיקת תומכת?' : '🗑 מחיקת תומכ/ת',
          supDelBg: spSel && s.delConfirm === 'sup' + spSel.id ? '#b91c1c' : '#fff', supDelC: spSel && s.delConfirm === 'sup' + spSel.id ? '#fff' : '#b91c1c',
          supForm: s.supForm || {},
          onSupField: (e) => this.setState({ supForm: { ...(s.supForm || {}), [e.target.name]: e.target.value } }),
          supStats: spSel ? (spSel.count + ' תרומות · ' + ((spSel.ils ? '₪' + spSel.ils.toLocaleString('he-IL') : '') + (spSel.ils && spSel.usd ? ' + ' : '') + (spSel.usd ? '$' + spSel.usd.toLocaleString('he-IL') : '') || '—') + (spSel.first ? ' · מ-' + this.hebDateFull(spSel.first) : '') + (spSel.last ? ' · אחרונה ' + this.hebDateFull(spSel.last) : '')) : '',
          supScoreLine: spSel ? ('ציון משוקלל: ' + this.supScore(spSel) + '/1000 · דרגת ' + this.supTier(this.supScore(spSel))[0] + ' — משוקלל לפי טריות (R), תדירות (F) וסכום (M)') : '',
          supScoreBg: spSel ? this.supTier(this.supScore(spSel))[1] : '#eceae2', supScoreC: spSel ? this.supTier(this.supScore(spSel))[2] : '#8b8474',
          supNextDate: spSel ? (spSel.nextDate || '') : '',
          setSupNext: (e) => this.saveSupNext(e.target.value),
          donAmt: s.donAmt || '', setDonAmt: (e) => this.setState({ donAmt: e.target.value }),
          donCur: s.donCur || '₪', setDonCur: (e) => this.setState({ donCur: e.target.value }),
          donCat: s.donCat || '', setDonCat: (e) => this.setState({ donCat: e.target.value }),
          donDate: s.donDate || this.isoOf(new Date()), setDonDate: (e) => this.setState({ donDate: e.target.value }),
          hebDon: this.hb2Sel(s.donDate || this.isoOf(new Date()), (iso) => this.setState({ donDate: iso })),
          addDon: () => this.addDonation(),
          supDons: spSel ? this.supDonEvents(spSel).slice(0, 60).map(e => {
            const md = e.rid ? (spSel.donations || []).find(d => d.rid === e.rid) : null;
            const dd = e.date ? new Date(e.date + 'T12:00:00') : null;
            return { line: this.hebDateFull(e.date) + ' · ' + this.fmtD(e.date) + (e.amount ? ' · ' + (e.cur === '$' ? '$' : '₪') + e.amount.toLocaleString('he-IL') : '') + ' · ' + e.src, hasRec: !!md, rec: md ? () => this.supReceipt(spSel, md) : null,
              jump: dd ? () => this.setState({ supCalY: dd.getFullYear(), supCalM: dd.getMonth(), supCalDay: e.date }) : null };
          }) : [],
          hasSupDons: !!(spSel && ((spSel.donations || []).length || (spSel.hist || []).length)),
          fileDonsLine: spSel ? ((spSel.hist || []).length ? 'כל התרומות — מתי וכמה (' + this.supDonEvents(spSel).length + '):' : 'מהקובץ ההיסטורי: ' + Math.max(0, (spSel.count || 0) - ((spSel.donations || []).length)) + ' תרומות (מצטבר בסטטיסטיקה למעלה)') : '',
          expSup: () => this.exportSupportersCSV(),
          hasSups: (s.supporters || []).length > 0,
          ayinBoardOn: s.ayinBoardOn !== false,
          ayinBoardToggle: () => this.setState({ ayinBoardOn: s.ayinBoardOn === false }),
          ayinBoardBtn: s.ayinBoardOn !== false ? 'הסתרה ▲' : 'הצגה ▼',
          hasAyinBoard: (s.supporters || []).some(sp => { const a = sp.ayin || {}; return a.stage || (a.names || []).length || a.lastTouch; }),
          ayinBoardFilter: s.ayinBoardFilter || 'all',
          setAyinBoardFilter: (e) => this.setState({ ayinBoardFilter: e.target.value }),
          ayinBoardSort: s.ayinBoardSort || 'target',
          setAyinBoardSort: (e) => this.setState({ ayinBoardSort: e.target.value }),
          ayinBoard: (s.supporters || []).filter(sp => { const a = sp.ayin || {}; if (!(a.stage || (a.names || []).length || a.lastTouch)) return false; return (s.ayinBoardFilter || 'all') === 'all' || (a.stage || 'new') === s.ayinBoardFilter; }).sort((sa, sb) => { const aa = sa.ayin || {}, ab = sb.ayin || {}; const srt = s.ayinBoardSort || 'target';
            if (srt === 'name') return String(sa.name).localeCompare(String(sb.name), 'he');
            if (srt === 'last') return String(ab.lastTouch || '').localeCompare(String(aa.lastTouch || ''));
            if (srt === 'stage') { const stgs2 = Component.AYIN_STAGES.map(x => x[0]); return stgs2.indexOf(aa.stage || 'new') - stgs2.indexOf(ab.stage || 'new'); }
            return String(aa.nextTalk || '9999').localeCompare(String(ab.nextTalk || '9999')); }).map(sp => { const a = sp.ayin || {}; const stgs = Component.AYIN_STAGES; const cur = Math.max(0, stgs.findIndex(x => x[0] === (a.stage || 'new')));
            return { name: sp.name,
              btnLabel: this.ayinActionLabel(sp), hasBtn: !!this.ayinActionLabel(sp),
              act: (ev) => { if (ev && ev.stopPropagation) ev.stopPropagation(); this.ayinAction(sp); },
              chips: stgs.map((x, i) => ({ t: (i < cur ? '✓ ' : '') + x[1], bd: i === cur ? '#211d17' : i < cur ? '#cde9d6' : '#e8e2d4', bg: i === cur ? '#211d17' : i < cur ? '#e4f5ea' : '#faf7f0', c: i === cur ? '#f3c76b' : i < cur ? '#12803c' : '#b3ab9a' })),
              namesLine: (a.names || []).map(n => n.name + (n.eyes ? ' 🧿' + n.eyes : '')).join(' · ') || '—',
              target: a.nextTalk ? this.fmtD(a.nextTalk) + (a.nextTalkTime ? ' · ' + a.nextTalkTime : '') : '—',
              last: a.lastTouch ? this.fmtD(a.lastTouch) : '—',
              open: () => this.setState({ modal: 'supporter', supEditId: sp.id, supForm: { name: sp.name, phone: sp.phone || '', email: sp.email || '', address: sp.address || '', idNum: sp.idNum || '', cat: sp.cat || '', forWho: sp.forWho || '', notes: sp.notes || '' } }) }; }),
          openSupImport: () => this.setState({ modal: 'import', importKind: 'supporters', importError: '', importSummary: null }),
          supCalOn: !!s.supCalOn,
          toggleSupCal: () => this.setState({ supCalOn: !s.supCalOn, supCalDay: null }),
          supCalBtnBg: s.supCalOn ? '#211d17' : 'rgba(255,255,255,.75)', supCalBtnC: s.supCalOn ? '#f3c76b' : '#211d17',
          supCalAll: (() => {
            if (!s.supCalOn) return {};
            const all = [];
            for (const sp of (s.supporters || [])) {
              for (const e of this.supDonEvents(sp)) all.push({ ...e, name: sp.name, spId: sp.id });
              for (const l of ((sp.ayin || {}).log || [])) all.push({ date: l.date, amount: 0, cur: '', src: '🧿 ' + l.eyes + ' עיניים' + (l.name ? ' — ' + l.name : ''), name: sp.name, spId: sp.id });
              for (const an of ((sp.ayin || {}).answers || [])) all.push({ date: an.date, amount: 0, cur: '', src: '📞 תשובה: ' + an.note, name: sp.name, spId: sp.id });
              if ((sp.ayin || {}).nextTalk) all.push({ date: sp.ayin.nextTalk, amount: 0, cur: '', src: '🔁 לדבר שוב', name: sp.name, spId: sp.id });
            }
            return this.supCalData(all);
          })(),
          supCalMine: spSel ? this.supCalData(this.supDonEvents(spSel).map(e => ({ ...e, spId: null }))
            .concat(spSel.nextDate ? [{ date: spSel.nextDate, amount: 0, cur: '', src: '🎯 תאריך יעד לקשר הבא' }] : [])
            .concat(((spSel.ayin || {}).log || []).map(l => ({ date: l.date, amount: 0, cur: '', src: '🧿 עין הרע · ' + l.eyes + ' עיניים' + (l.name ? ' — ' + l.name : '') })))
            .concat(((spSel.ayin || {}).answers || []).map(an => ({ date: an.date, amount: 0, cur: '', src: '📞 תשובה: ' + an.note })))
            .concat((spSel.ayin || {}).nextTalk ? [{ date: spSel.ayin.nextTalk, amount: 0, cur: '', src: '🔁 לדבר שוב (עין הרע)' }] : [])) : {},
          ayCard: spSel ? (() => {
            const a = spSel.ayin || {};
            return { stage: a.stage || 'new', next: a.nextTalk || '', note: a.note || '',
              touched: a.lastTouch === this.isoOf(new Date()) ? '✓ עודכן היום' : (a.lastTouch ? 'עדכון אחרון: ' + this.fmtD(a.lastTouch) : ''),
              hebNext: this.hb2Sel(a.nextTalk || '', (iso) => this.ayinTouch(spSel, { nextTalk: iso })),
              nextHeb: a.nextTalk ? 'יעד: ' + this.hebDateFull(a.nextTalk) + ' · ' + this.fmtD(a.nextTalk) + (a.nextTalkTime ? ' · ' + a.nextTalkTime : '') : 'לא נקבע מועד',
              modeIsHeb: (s.ayDateMode || 'heb') === 'heb', modeIsGreg: (s.ayDateMode || 'heb') === 'greg',
              modeHeb: () => this.setState({ ayDateMode: 'heb' }), modeGreg: () => this.setState({ ayDateMode: 'greg' }),
              hebBg: (s.ayDateMode || 'heb') === 'heb' ? '#211d17' : '#fff', hebC: (s.ayDateMode || 'heb') === 'heb' ? '#f3c76b' : '#8b8474',
              gregBg: s.ayDateMode === 'greg' ? '#211d17' : '#fff', gregC: s.ayDateMode === 'greg' ? '#f3c76b' : '#8b8474',
              gregIn: a.nextTalk || '', setGregIn: (e) => this.ayinTouch(spSel, { nextTalk: e.target.value }),
              timeIn: a.nextTalkTime || '', setTimeIn: (e) => this.ayinTouch(spSel, { nextTalkTime: e.target.value }),
              showAnswer: !!(a.note || '').trim() && (a.note || '').trim() !== (a.answeredNote || ''),
              showAgain: !!a.nextTalk,
              setStage: (e) => this.ayinTouch(spSel, { stage: e.target.value }),
              setNext: (e) => this.ayinTouch(spSel, { nextTalk: e.target.value }),
              setNote: (e) => this.ayinTouch(spSel, { note: e.target.value }),
              steps: (() => { const stgs = Component.AYIN_STAGES; const cur = Math.max(0, stgs.findIndex(x2 => x2[0] === (a.stage || 'new'))); return stgs.filter((x2, i2) => i2 <= cur + 1).map((x2, i2) => ({ label: (i2 < cur ? '✓ ' : i2 === cur + 1 ? '← ' : '') + x2[1], tip: i2 === cur + 1 ? 'מעבר לשלב הבא' : i2 < cur ? 'שלב שהושלם — לחיצה חוזרת אליו' : 'השלב הנוכחי', bd: i2 === cur ? '#211d17' : i2 < cur ? '#cde9d6' : '#ded7c8', bg: i2 === cur ? '#211d17' : i2 < cur ? '#e4f5ea' : '#fff', c: i2 === cur ? '#f3c76b' : i2 < cur ? '#12803c' : '#8b8474', pick: () => this.ayinTouch(spSel, { stage: x2[0] }) })); })(),
              stWhen: a.stage !== 'done', showNames: ['new', 'lead', 'eyes'].includes(a.stage || 'new'), stDone: a.stage === 'done',
              saveNote: () => { const ay = this.ayinOf(spSel); const note = (ay.note || '').trim(); if (!note) { this.t('כתבו תשובה/הערה לפני השמירה'); return; } if (!ay.answers) ay.answers = []; if (ay.editAw != null && ay.answers[ay.editAw]) { ay.answers[ay.editAw] = { date: this.isoOf(new Date()), note }; delete ay.editAw; } else ay.answers.unshift({ date: this.isoOf(new Date()), note }); ay.answeredNote = note; this.ayinTouch(spSel, { note: '' }); this.t('ההערה נשמרה — מסונכרנת לדוח היומי ולכרטיס'); },
              hasAnswers: !!(a.answers || []).length,
              answers: (a.answers || []).map((an, ai) => ({ date: this.fmtD(an.date), note: an.note,
                edit: () => { const ay = this.ayinOf(spSel); ay.editAw = ai; this.ayinTouch(spSel, { note: an.note }); this.t('ההערה בעריכה — שנו את הטקסט ולחצו שמירה'); },
                remove: () => { const ay = this.ayinOf(spSel); ay.answers = ay.answers.filter(x2 => x2 !== an); this.setState({ supporters: s.supporters }); this.t('ההערה נמחקה'); } })),
              showAction: (() => { const st2 = a.stage || 'new'; if (st2 === 'done') return false; if (st2 === 'new') return !!(a.names || []).length; if (st2 === 'eyes') return (a.names || []).some(x2 => x2.eyes !== '' && x2.eyes != null); return true; })(),
              actionLabel: (() => { const st2 = a.stage || 'new'; return st2 === 'new' ? '✓ השמות נלקחו → לעשות עופרת' : st2 === 'lead' ? '🫙 אישור — העופרת נעשתה (סנכרון ללוח ולדוח)' : st2 === 'eyes' ? '✓ העיניים נרשמו → למסור תשובות' : a.answerPushed ? '✓ השלמה' : '📞 דחיפה ללוח — למסור תשובות'; })(),
              actionTip: 'הכפתור החכם — מקדם לשלב הבא ומסנכרן ללוח ולדוח היומי',
              actionRun: () => this.ayinAction(spSel),
              restart: () => { const ay = this.ayinOf(spSel); ay.names = []; ay.answerPushed = false; delete ay.editAw; this.ayinTouch(spSel, { stage: 'new', note: '', nextTalk: '' }); this.t('נפתח מחזור חדש מההתחלה — ההיסטוריה נשמרה'); },
              doneLine: (() => { const ns = a.names || []; const eyes = ns.reduce((t2, x2) => t2 + (+x2.eyes || 0), 0); return ns.length ? ns.length + ' שמות נמסרו · 🧿 ' + eyes + ' עיניים' : (a.lastTouch ? 'עדכון אחרון: ' + this.fmtD(a.lastTouch) : ''); })(),
              callAnswer: () => {
                const ay = this.ayinOf(spSel); const note = (ay.note || '').trim();
                if (!note) { this.t('כתבו תשובה/הערה לפני הרישום'); return; }
                if (!ay.answers) ay.answers = [];
                ay.answers.unshift({ date: this.isoOf(new Date()), note });
                ay.answeredNote = note;
                this.ayinCall(spSel, 'answer');
                this.t('התשובה נרשמה — מסומנת בלוח הפרטי ובלוח המרכזי');
              },
              callAgain: () => this.ayinCall(spSel, 'again'),
              nameIn: s.ayinNameIn || '', eyesIn2: s.ayinNameEyes || '',
              setNameIn: (e) => this.setState({ ayinNameIn: e.target.value }),
              setEyesIn2: (e) => this.setState({ ayinNameEyes: e.target.value.replace(/[^\d]/g, '') }),
              addName: () => {
                const nm = (s.ayinNameIn || '').trim();
                if (!nm) { this.t('הקלידו שם לפני ההוספה'); return; }
                const ay = this.ayinOf(spSel); if (!ay.names) ay.names = [];
                if (ay.names.some(x => this.normName(x.name) === this.normName(nm))) { this.t('השם "' + nm + '" כבר ברשימה'); return; }
                ay.names.push({ id: 'an' + this.state.seq, name: nm, eyes: (s.ayinNameEyes === '' || s.ayinNameEyes == null) ? '' : +s.ayinNameEyes, done: false });
                if (s.ayinNameEyes !== '' && s.ayinNameEyes != null) { if (!ay.log) ay.log = []; ay.log.unshift({ date: this.isoOf(new Date()), eyes: +s.ayinNameEyes, name: nm }); }
                ay.lastTouch = this.isoOf(new Date());
                this.setState({ supporters: s.supporters, seq: this.state.seq + 1, ayinNameIn: '', ayinNameEyes: '' });
                this.t('"' + nm + '" נוסף לרשימת העופרת של ' + spSel.name);
              },
              names: ((spSel.ayin || {}).names || []).map(nm => ({
                name: nm.name, eyes: String(nm.eyes || ''),
                done: !!nm.done, mark: nm.done ? '✓' : '✗',
                markBg: nm.done ? '#e4f5ea' : '#fdeaea', markC: nm.done ? '#12803c' : '#b91c1c',
                rowBg: nm.done ? '#f3faf5' : '#fff',
                setEyes: (e) => { nm.eyes = +e.target.value.replace(/[^\d]/g, '') || ''; this.ayinTouch(spSel, {}); this.setState({ supporters: s.supporters }); },
                toggle: () => { nm.done = !nm.done; this.ayinTouch(spSel, {}); this.setState({ supporters: s.supporters }); this.t(nm.name + (nm.done ? ' — עופרת בוצעה ✓' : ' — הוחזר לממתין')); },
                remove: () => { const ay = this.ayinOf(spSel); ay.names = (ay.names || []).filter(x => x !== nm); this.setState({ supporters: s.supporters }); this.t('"' + nm.name + '" הוסר מהרשימה'); } })),
              hasNames: !!((spSel.ayin || {}).names || []).length,
              namesSummary: (() => { const ns = (spSel.ayin || {}).names || []; if (!ns.length) return ''; const done = ns.filter(x => x.done).length; const eyes = ns.reduce((a, x) => a + (+x.eyes || 0), 0); return ns.length + ' שמות · ' + done + ' עופרת בוצעה · ' + (ns.length - done) + ' ממתינות · 🧿 ' + eyes + ' עיניים'; })(),
              hasLog: !!((spSel.ayin || {}).log || []).length,
              log: ((spSel.ayin || {}).log || []).slice(0, 30).map(l => ({ line: this.hebDateFull(l.date) + ' · ' + this.fmtD(l.date) + (l.name ? ' · ' + l.name : ''), eyes: String(l.eyes) })) };
          })() : {},
          showSupCalMine: !!spSel,
          supTiers: (() => {
            const cnt = { 'זהב': 0, 'כסף': 0, 'ארד': 0, 'רדומה': 0 };
            for (const sp of (s.supporters || [])) cnt[this.supTier(this.supScore(sp))[0]]++;
            return ['זהב', 'כסף', 'ארד', 'רדומה'].map(t2 => { const [, bg, c] = this.supTier(t2 === 'זהב' ? 900 : t2 === 'כסף' ? 700 : t2 === 'ארד' ? 500 : 100); const on = s.supTierF === t2;
              return { label: t2 + ' · ' + cnt[t2], bg: on ? '#211d17' : bg, c: on ? '#f3c76b' : c, pick: () => this.setState({ supTierF: on ? null : t2 }) }; });
          })(),
          supBars: (() => {
            const bins = Array(10).fill(0);
            for (const sp of (s.supporters || [])) bins[Math.min(9, Math.floor(this.supScore(sp) / 100))]++;
            const mx = Math.max(1, ...bins);
            return bins.map((n, i) => ({ h: Math.max(5, Math.round(n / mx * 100)) + '%', c: this.supTier(i * 100 + 50)[3], t: (i * 100) + '–' + (i * 100 + 99) + ': ' + n + ' תומכות' }));
          })(),
          supAvgDon: (() => { const totIls = (s.supporters || []).reduce((a, x) => a + (x.ils || 0) + (x.usd || 0) * 3.7, 0); const totCnt = (s.supporters || []).reduce((a, x) => a + (x.count || 0), 0); return totCnt ? '₪' + Math.round(totIls / totCnt).toLocaleString('he-IL') : '—'; })(),
          sup12m: (() => { const cut = this.isoOffset(-365); let n = 0; for (const sp of (s.supporters || [])) if (sp.last && sp.last >= cut) n++; return String(n); })(),
          saveSupporter: () => {
            const f2 = s.supForm || {};
            if (!(f2.name || '').trim()) { this.t('שם התומכ/ת הוא שדה חובה'); return; }
            if ((f2.idNum || '').trim() && !this.validId((f2.idNum || '').replace(/\D/g, ''))) { this.t('ת"ז לא תקינה (ספרת ביקורת)'); return; }
            const vals = { name: f2.name.trim(), phone: this.fixPhone((f2.phone || '').trim()), email: (f2.email || '').trim(), address: (f2.address || '').trim(), idNum: (f2.idNum || '').trim(), cat: (f2.cat || '').trim(), forWho: (f2.forWho || '').trim(), notes: (f2.notes || '').trim() };
            if (spSel) {
              Object.assign(spSel, vals);
              this.setState({ supporters: s.supporters, modal: null });
              this.t('כרטיס התומכ/ת עודכן — משתקף מיד בטבלה, בחיפוש ובגיבוי');
            } else {
              if ((s.supporters || []).some(x => this.normName(x.name) === this.normName(vals.name) && (!vals.phone || !x.phone || x.phone.replace(/\D/g, '') === vals.phone.replace(/\D/g, '')))) { this.t('תומכת בשם הזה כבר קיימת — פתחו את הכרטיס שלה מהטבלה'); return; }
              const id = 'sp' + s.seq;
              s.supporters.unshift({ id, ...vals, count: 0, ils: 0, usd: 0, first: '', last: '', nextDate: '', donations: [], hist: [] });
              this.setState({ supporters: s.supporters, seq: s.seq + 1, supEditId: id });
              this.t('התומכת "' + vals.name + '" נוספה — אפשר לרשום לה תרומה כאן בכרטיס');
            }
          },
          supCountLabel: (nq || qd2 || scfActive || (sSort && sSort.key) ? list.length + ' מתוך ' : '') + (s.supporters || []).length + ' משפחות תומכות · סה"כ ₪' + tIls.toLocaleString('he-IL') + ' + $' + tUsd.toLocaleString('he-IL') + (list.length > 120 ? ' · מוצגות 120 הראשונות' : '') };
      })(),
      viewHome: s.view === 'home',
      viewList: s.view === 'families' && !s.selId, viewDetail: s.view === 'families' && !!sel,
      viewCourses: s.view === 'courses' && !selC, viewCourseDetail: s.view === 'courses' && !!selC,
      viewCalMonth: s.view === 'calendar' && !s.calDay, viewCalDay: !!dayV, day: dayV || {},
      backToMonth: () => this.setState({ calDay: null }),
      prevDay: () => shiftDay(-1), nextDay: () => shiftDay(1),
      dayNewEvent: () => this.setState({ modal: 'event', editingEventId: null, eventError: '', eventForm: { title: '', date: s.calDay || this.isoOf(now), time: '', type: 'org', notes: '', price: '', roomId: '', famId: '', priority: 'green' } }),
      viewSettings: s.view === 'settings',
      rows, noResults: rows.length === 0, fam, crs,
      courseRows: s.wheelOpen && this._wcsIds ? courseRows.filter(r => this._wcsIds.has(r.cid)) : courseRows,
      countLabel: (ql || s.statusFilter !== 'all' || cityF !== 'all' || commF !== 'all' || advCount > 0 || s.famWheelOpen || colFActive) ? rows.length + ' מתוך ' + total + ' משפחות' + (s.famWheelOpen ? ' — מסונן בגלגל' : '') : total + ' משפחות · ' + active + ' פעילות',
      famSuggests, hasFamSuggests: famSuggests.length > 0,
      colFOn: !!s.colFOn, toggleColF: () => this.setState({ colFOn: !s.colFOn, famView: 'list' }),
      colFBtnBg: (s.colFOn || colFActive) ? '#211d17' : 'rgba(255,255,255,.75)', colFBtnC: (s.colFOn || colFActive) ? '#f3c76b' : '#211d17',
      colF: { name: (s.colF || {}).name || '', phone: (s.colF || {}).phone || '', kids: (s.colF || {}).kids || '', courses: (s.colF || {}).courses || '' },
      onColF: (e) => this.setState({ colF: { ...(s.colF || {}), [e.target.name]: e.target.value } }),
      clearColF: () => this.setState({ colF: {}, statusFilter: 'all' }),
      famHead: [['name', 'משפחה'], ['phone', 'טלפון'], ['kids', 'ילדים'], ['courses', 'קורסים'], ['status', 'סטטוס']].map(([k, label]) => ({
        label, arrow: fSort && fSort.key === k ? (fSort.dir > 0 ? '▲' : '▼') : '',
        click: () => this.setState({ famSort: fSort && fSort.key === k ? (fSort.dir > 0 ? { key: k, dir: -1 } : null) : { key: k, dir: 1 } }) })),
      coursesCountLabel: s.wheelOpen && this._wcsIds ? this._wcsIds.size + ' מתוך ' + visCourses.length + ' חוגים — מסונן בגלגל' : (crsColActive || (cSort && cSort.key)) ? visShown.length + ' מתוך ' + visCourses.length + ' חוגים — מסונן/ממוין בעמודות' : (isAdmin ? visCourses.length + ' קורסים פעילים · תשפ"ו' : visCourses.length + ' קורסים · מציג את הקורסים של ' + teacherName('t3') + ' בלבד'),
      crsHead: [['name', 'חוג'], ['audience', 'קהל'], ['teacher', 'מורה'], ['model', 'מסלול'], ['count', 'תפוסה'], ['price', 'מחיר מלא'], ['price1', 'הנחה 1'], ['price2', 'הנחה 2']].map(([k, label]) => ({
        label, arrow: cSort && cSort.key === k ? (cSort.dir > 0 ? '▲' : '▼') : '',
        click: () => this.setState({ crsSort: cSort && cSort.key === k ? (cSort.dir > 0 ? { key: k, dir: -1 } : null) : { key: k, dir: 1 } }) })),
      crsColFOn: !!s.crsColFOn, toggleCrsColF: () => this.setState({ crsColFOn: !s.crsColFOn, crsView: 'list' }),
      crsColFBtnBg: (s.crsColFOn || crsColActive) ? '#211d17' : 'rgba(33,29,23,.08)', crsColFBtnC: (s.crsColFOn || crsColActive) ? '#f3c76b' : '#8b8474',
      crsColF: { name: ccf.name || '', audience: ccf.audience || '', teacher: ccf.teacher || '', model: ccf.model || 'all', count: ccf.count || '', price: ccf.price || '' },
      onCrsColF: (e) => this.setState({ crsColF: { ...ccf, [e.target.name]: e.target.value } }),
      clearCrsColF: () => this.setState({ crsColF: {} }),
      digestLines, statStudents: String(allM.length),
      statFams: String(s.families.length), statWidows: String(s.families.filter(f => f.maritalStatus === 'אלמן/ה').length), statLow: String(lowEnrolls.length), statToday: String(todayCourses.length),
      todayCourseLabel: todayCourses.length ? todayCourses[0].name + ' · ' + this.sessionsOf(todayCourses[0]).filter(ss => ss.day === now.getDay()).map(ss => ss.time).join('/') : 'אין מפגשים היום',
      quickPunchBtn: todayCourses.length ? 'פתח רשימה ↓' : 'ללוח השנה',
      quickPunchGo: () => todayCourses.length ? this.setState({ view: 'courses', selCourseId: todayCourses[0].id }) : this.setState({ view: 'calendar' }),
      bdayTitle: bd ? (bd.days === 0 ? 'יום הולדת היום' : 'יום הולדת ב' + new Intl.DateTimeFormat('he', { weekday: 'long' }).format(bd.d)) : 'ימי הולדת',
      bdaySub: bd ? bd.m.first + ' (' + bd.turning + ') · משפחת ' + bd.m.famName : 'אין ימי הולדת השבוע',
      bdayBtn: bd ? 'לכרטיס המשפחה ←' : 'ללוח השנה ←',
      bdayGo: () => bd ? this.setState({ view: 'families', selId: bd.m.famId }) : this.setState({ view: 'calendar' }),
      recentRows: (() => {
        const byReg = s.families.filter(f => f.createdAt).sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)));
        const list = byReg.slice(0, 5);
        for (const id of (s.recentIds || [])) { if (list.length >= 5) break; const f = s.families.find(x => x.id === id); if (f && !list.includes(f)) list.push(f); }
        for (const f of s.families) { if (list.length >= 5) break; if (!list.includes(f)) list.push(f); }
        return list.slice(0, 5).map(famRow);
      })(),
      showPalette: s.paletteOpen, paletteQ: s.paletteQ,
      openPalette: () => this.setState({ paletteOpen: true, paletteQ: '' }),
      chipPending: goPending, chipCall: newCallReminder,
      closePalette: closeP,
      setPaletteQ: (e) => this.setState({ paletteQ: e.target.value }),
      paletteKey: (e) => { if (e.key === 'Enter' && this._firstResult) this._firstResult.run(); },
      paletteEmptyQ: !paletteQl, paletteHasQ: !!paletteQl,
      paletteGroups, noPaletteResults: !!paletteQl && paletteGroups.length === 0,
      paletteSuggests, hasSuggests: paletteSuggests.length > 0,
      paletteActions, lowRows, noLowRows: lowRows.length === 0,
      cityFilter: cityF, commFilter: commF, cityOptions, commOptions, statFams, statKids,
      setCityFilter: (e) => this.setState({ cityFilter: e.target.value }),
      setCommFilter: (e) => this.setState({ commFilter: e.target.value }),
      marOptions, langOptions,
      famAdv: !!s.famAdv || advCount > 0, toggleFamAdv: () => this.setState({ famAdv: !s.famAdv }),
      showFamWheel: !!s.famWheelOpen,
      openFamWheel: () => this.setState({ view: 'families', selId: null, famWheelOpen: true, fwLocks: {}, fwRot: 0 }),
      famWheelToggle: () => this.setState(s.famWheelOpen ? { famWheelOpen: false } : { view: 'families', selId: null, famWheelOpen: true, fwLocks: {}, fwRot: 0 }),
      fwBtnBg: s.famWheelOpen ? '#211d17' : '#211d17', fwBtnC: '#f3c76b',
      closeFamWheel: () => this.setState({ famWheelOpen: false }),
      fwReset: () => this.setState({ fwLocks: {}, fwRot: fwR + 360 }),
      fwChips, hasFwChips: fwChips.length > 0, fwOpts, fwRing, fwRotT: 'rotate(' + fwR + 'deg)',
      fwCount: String(fcs.length), fwAxisLabel: fwAxis ? fwAxis.lbl : '', fwHasAxis: !!fwAxis,
      fwDone: !fwAxis && fcs.length > 0, fwEmpty: fcs.length === 0,
      fwResults, fwMore: fcs.length > 8 ? '+' + (fcs.length - 8) + ' משפחות נוספות — לחצו "הצג בטבלה"' : '',
      hasFwMore: fcs.length > 8, fwApply, fwApplyLabel: 'הצג בטבלה (' + fcs.length + ') ←',
      famAdvBadge: advCount ? '· ' + advCount + ' ▴' : '▾',
      fMar: s.fMar || 'all', fLang: s.fLang || 'all', fSefach: s.fSefach || 'all', fKids: s.fKids || 'all', fEnrolled: s.fEnrolled || 'all', fTier: s.fTier || 'all',
      setFTier: (e) => this.setState({ fTier: e.target.value }),
      tierTiles, runDecay: () => this.runDecay(),
      showNewRoom: s.modal === 'newRoom', newRoomForm: s.newRoomForm || {},
      onNewRoomField: (e) => this.setState({ newRoomForm: { ...(s.newRoomForm || {}), [e.target.name]: e.target.value } }),
      newRoomError: s.newRoomError || '', hasNewRoomError: !!s.newRoomError,
      saveRoom: () => this.saveRoom(),
      roomSuggests: ['חדר בריחה', 'חדר ג׳קוזי', 'חדר ירידים ומתנות', 'חדר אוכל', 'חדר הרצאות', 'כסא מסאז׳ 3'].map(n => ({ label: n, pick: () => this.setState({ newRoomForm: { ...(s.newRoomForm || {}), name: n } }) })),
      eventFormHebLine: s.eventForm.date ? ('עברי: ' + this.hebDateFull(s.eventForm.date)) : '',
      credV: credV || {}, showCredGraph: !!credV,
      crsG: crsG || {}, showCrsGraph: !!crsG,
      sessForm: { day: (s.sessForm || {}).day ?? '0', time: (s.sessForm || {}).time || (selC ? selC.time : '17:00') || '17:00', label: (s.sessForm || {}).label || '' },
      onSessField: (e) => this.setState({ sessForm: { day: '0', time: selC ? selC.time : '17:00', label: '', ...(s.sessForm || {}), [e.target.name]: e.target.value } }),
      addSession: () => {
        if (!selC) return;
        const f = s.sessForm || {};
        if (!selC.sessions || !selC.sessions.length) selC.sessions = this.sessionsOf(selC).slice();
        selC.sessions.push({ day: +(f.day ?? 0), time: f.time || selC.time || '17:00', label: (f.label || '').trim() });
        this.setState({ courses: s.courses, sessForm: { day: f.day ?? '0', time: f.time || selC.time || '17:00', label: '' } });
        this.t('הקבוצה נוספה — מופיעה מיד בלוח השנה וביומן החדר');
      },
      absKind: s.absKind || 'cancel', setAbsKind: (e) => this.setState({ absKind: e.target.value }),
      setFMar: (e) => this.setState({ fMar: e.target.value }),
      setFLang: (e) => this.setState({ fLang: e.target.value }),
      setFSefach: (e) => this.setState({ fSefach: e.target.value }),
      setFKids: (e) => this.setState({ fKids: e.target.value }),
      setFEnrolled: (e) => this.setState({ fEnrolled: e.target.value }),
      calChips, calUrgentBg: s.calUrgentOnly ? '#dc2626' : 'rgba(255,255,255,.75)', calUrgentC: s.calUrgentOnly ? '#fff' : '#8b8474',
      calUrgentToggle: () => this.setState({ calUrgentOnly: !s.calUrgentOnly }),
      showBack: (s.navHist || []).length > 0,
      goBack: () => { const h = (s.navHist || []).slice(); const p = h.pop(); if (!p) return; this._navBack = true; this.setState({ navHist: h, view: p.view, selId: p.selId || null, selCourseId: p.selCourseId || null, calDay: p.calDay || null, modal: null, paletteOpen: false, wheelOpen: false, famWheelOpen: false }); },
      famIsList: (s.famView || 'list') !== 'grid', famIsGrid: (s.famView || 'list') === 'grid',
      famViewBtn: (s.famView || 'list') === 'grid' ? '☰ רשימה' : '▦ גריד',
      toggleFamView: () => this.setState({ famView: (s.famView || 'list') === 'grid' ? 'list' : 'grid' }),
      crsIsGrid: (s.crsView || 'grid') !== 'list', crsIsList: (s.crsView || 'grid') === 'list',
      crsViewBtn: (s.crsView || 'grid') === 'list' ? '▦ גריד' : '☰ רשימה',
      toggleCrsView: () => this.setState({ crsView: (s.crsView || 'grid') === 'list' ? 'grid' : 'list' }),
      crsHasGroups: !!selC && this.sessionsOf(selC).length > 1,
      crsNoGroups: !!selC && this.sessionsOf(selC).length <= 1,
      crsGroupOptions: selC ? this.sessionsOf(selC).map((ss, i) => { const v = ss.label || ('קבוצה ' + (i + 1)); return { v, t: v + ' · יום ' + DAYN[ss.day] + ' ' + (ss.time || '') }; }) : [],
      crsNoteVal: selC ? (s.crsNoteFor === selC.id && s.crsNote != null ? s.crsNote : (selC.notes || '')) : '',
      setCrsNote: (e) => this.setState({ crsNote: e.target.value, crsNoteFor: selC ? selC.id : null }),
      saveCrsNote: () => { if (!selC) return; selC.notes = (s.crsNoteFor === selC.id && s.crsNote != null ? s.crsNote : selC.notes || '').trim(); this.setState({ courses: s.courses, crsNote: null, crsNoteFor: null }); this.t(selC.notes ? 'ההערה נשמרה על החוג' : 'ההערה נמחקה'); },
      expCourseStudents: () => selC && this.exportCourseStudents(selC),
      expCourseDaily: () => selC && this.exportCourseDaily(selC),
      openCourseReminder: () => selC && this.setState({ modal: 'event', editingEventId: null, eventError: '', eventForm: { title: 'תזכורת: ' + selC.name, date: this.isoOf(now), time: selC.time || '', type: 'reminder', notes: 'חוג: ' + selC.name + (selC.roomId ? ' · חדר: ' + ((roomsArr.find(r => r.id === selC.roomId) || {}).name || '') : ''), price: '', roomId: selC.roomId || '', famId: '', priority: 'green' } }),
      roomRows, roomsNowLabel: liveRooms ? liveRooms + ' חדרים בפעילות היום' : 'אין פעילות בחדרים היום',
      showWheel: s.wheelOpen,
      openWheel: () => this.setState({ view: 'courses', selId: null, selCourseId: null, wheelOpen: true, wheelLocks: {}, wheelRot: 0 }),
      wheelToggle: () => this.setState(s.wheelOpen ? { wheelOpen: false } : { wheelOpen: true, wheelLocks: {}, wheelRot: 0, selCourseId: null }),
      wheelBtnBg: s.wheelOpen ? '#211d17' : 'rgba(255,255,255,.75)', wheelBtnC: s.wheelOpen ? '#f3c76b' : '#211d17',
      closeWheel: () => this.setState({ wheelOpen: false }),
      wheelReset: () => this.setState({ wheelLocks: {}, wheelRot: wRot + 360 }),
      lockChips, hasLockChips: lockChips.length > 0, wheelOpts, wheelRing,
      wheelRot: 'rotate(' + wRot + 'deg)', wheelCount: String(wcs.length),
      wheelAxisLabel: wAxis ? wAxis.lbl : '', wheelHasAxis: !!wAxis,
      wheelDone: !wAxis && wcs.length > 0, wheelEmpty: wcs.length === 0, wheelResults,
      attention: care.slice(0, 7), attCount: String(care.length), noAttention: care.length === 0,
      viewCare: s.view === 'care', goCare: () => this.setState({ view: 'care', selId: null, selCourseId: null, careAudit: this.runAudit().rows }),
      goCareLow: () => this.setState({ view: 'care', selId: null, selCourseId: null, careFilter: 'יתרה', careAudit: this.runAudit().rows }),
      goTodayCal: () => this.setState({ view: 'calendar', selId: null, selCourseId: null, calDay: this.isoOf(now), calMonth: now.getMonth(), calYear: now.getFullYear() }),
      demoOn: !!s.demoOn, demoX: s.demoX || 0, demoY: s.demoY || 0,
      demoCap: s.demoCap || '', hasDemoCap: !!s.demoCap,
      startDemo: () => this.startDemo(), stopDemo: () => this.stopDemo(),
      accOpen: !!s.accOpen,
      toggleAccPanel: () => this.setState({ accOpen: !s.accOpen }),
      accAttrs: Object.keys(s.acc || {}).filter(k => (s.acc || {})[k]).join(' '),
      accToggles: [['contrast', 'ניגודיות גבוהה'], ['links', 'הדגשת כפתורים וקישורים'], ['noanim', 'עצירת אנימציות ותנועה'], ['spacing', 'ריווח טקסט מוגדל']].map(([k, label]) => {
        const on = !!(s.acc || {})[k];
        return { label, mark: on ? '✓' : '', bg: on ? '#211d17' : '#fff', c: on ? '#f3c76b' : '#211d17',
          click: () => { const a = { ...(s.acc || {}) }; a[k] = !a[k]; try { localStorage.setItem('maorclean2_acc', JSON.stringify(a)); } catch (e) {} this.setState({ acc: a }); } };
      }),
      accReset: () => { try { localStorage.setItem('maorclean2_acc', '{}'); localStorage.setItem('maorclean2_ui_scale', 1); } catch (e) {} this.setState({ acc: {}, uiScale: 1 }); this.t('הגדרות הנגישות אופסו'); },
      uiZoom: s.uiScale || 1,
      uiPct: Math.round((s.uiScale || 1) * 100) + '%',
      uiInc: () => { const v = Math.min(1.6, Math.round(((s.uiScale || 1) + .1) * 10) / 10); window.__fsScale = v; try { localStorage.setItem('maorclean2_ui_scale', v); } catch (e) {} this.setState({ uiScale: v }); },
      uiDec: () => { const v = Math.max(.8, Math.round(((s.uiScale || 1) - .1) * 10) / 10); window.__fsScale = v; try { localStorage.setItem('maorclean2_ui_scale', v); } catch (e) {} this.setState({ uiScale: v }); },
      uiReset: () => { window.__fsScale = 1; try { localStorage.setItem('maorclean2_ui_scale', 1); } catch (e) {} this.setState({ uiScale: 1 }); },
      carItem: carItem || {}, carDots, hasCarDots: carDots.length > 1,
      careRows: careRows.slice(0, 100), careChips, noCare: careRows.length === 0,
      careCountLabel: care.length + ' פריטים פתוחים (תפעול + בדיקת נתונים)' + (careDoneCount ? ' · ' + careDoneCount + ' סומנו כטופלו' : ''),
      careRefresh: () => { this.setState({ careAudit: this.runAudit().rows }); this.t('ממצאי בדיקת הנתונים עודכנו'); },
      sendAuditToCare: () => { this.setState({ modal: null, view: 'care', selId: null, selCourseId: null, careAudit: this.runAudit().rows }); this.t('הממצאים נשלחו למרכז הטיפול'); },
      careReset: () => { this.setState({ careDone: {}, careFilter: 'הכל' }); this.t('הסימונים אופסו'); },
      enrollHints, hasEnrollHints: enrollHints.length > 0,
      diary: diary || {}, showDiary: !!diary,
      absV: absV || {}, showAbsence: !!absV,
      absReason: s.absReason || '', setAbsReason: (e) => this.setState({ absReason: e.target.value }),
      absError: s.absError || '', hasAbsError: !!s.absError,
      saveAbsence: () => this.saveAbsence(),
      reportRows, roomOptions: roomsArr,
      showImport: s.modal === 'import',
      openImport: () => this.setState({ modal: 'import', importError: '', importSummary: null }),
      importKind: s.importKind || 'members',
      setImportKind: (e) => { this._pendImport = null; this.setState({ importKind: e.target.value, importSummary: null, importError: '' }); },
      importHint: (s.importKind || 'members') === 'backup'
        ? 'קובץ גיבוי JSON שהופק מ"גיבוי מלא" — משחזר הכל: משפחות, ילדים, שיבוצים, אירועים, חדרים והגדרות. מחליף את הנתונים הנוכחיים.'
        : (s.importKind || 'members') === 'ayin'
        ? 'גיליון עיניים: הורידו למטה ⬇, מלאו את עמודת "כמה עיניים" (0 גם תקין) ואת "נמסר", והחזירו לכאן. ההצלבה לפי שם התומכת + השם למסירה — כל כמות חדשה נרשמת אוטומטית להיסטוריה, ללוח התרומות ולדוחות.'
        : (s.importKind || 'members') === 'supporters'
        ? 'קובץ תומכות: שם (חובה), טלפון, אימייל, ת"ז, כתובת, קטגוריה, עבור. ההצלבה לפי שם — קיימות יעודכנו, חדשות יתווספו. הורידו תבנית בכפתור למטה.'
        : (s.importKind || 'members') === 'members'
        ? 'קובץ ילדים: שם משפחה, שם פרטי, תאריך לידה, מין, ת"ז + מומלץ מאוד עמודת ת"ז הורה או טלפון. ההצלבה: ת"ז הורה ← טלפון ← שם משפחה+שם האם ← +עיר. שם משפחה כפול בלי מזהה — לא ינוחש.'
        : 'קובץ משפחות באותו מבנה כמו הקובץ שהעלית (שם, ת"ז, טלפונים, עיר…). קיימות יעודכנו, חדשות יתווספו.',
      onImportFile: (e) => { const f = e.target.files && e.target.files[0]; if (f) this.handleImportFile(f); e.target.value = ''; },
      importSummary: s.importSummary || {},
      hasImportSummary: !!s.importSummary,
      canApplyImport: !!(s.importSummary && s.importSummary.canApply),
      importError: s.importError || '', hasImportError: !!s.importError,
      applyImport: () => this.applyImport(),
      expImportFmt: () => this.exportImportFormat(),
      expImportLabel: (s.importKind || 'members') === 'backup' ? '⬇ גיבוי מלא עכשיו (אותו פורמט לשחזור)' : '⬇ ייצוא בפורמט הייבוא — לעריכה באקסל והחזרה',
      showDayGate: !!s.dayGate,
      dayGateDate: todayLabel,
      dayEndDraft: s.dayEndDraft || '17:00',
      setDayEnd: (e) => this.setState({ dayEndDraft: e.target.value }),
      startDay: () => {
        const end = s.dayEndDraft || '17:00';
        try { localStorage.setItem('maorclean2_day', this.isoOf(now)); localStorage.setItem('maorclean2_dayend', end); } catch (e) {}
        this.setState({ dayGate: false });
        this.t('☀ יום העבודה נפתח — גיבוי אוטומטי יירד בשעה ' + end);
      },
      gateRestore: () => {
        const end = s.dayEndDraft || '17:00';
        try { localStorage.setItem('maorclean2_day', this.isoOf(now)); localStorage.setItem('maorclean2_dayend', end); } catch (e) {}
        this.setState({ dayGate: false, modal: 'import', importKind: 'backup', importError: '', importSummary: null });
      },
      showGuide: !!s.guideOn,
      openGuide: () => this.setState({ guideOn: true }),
      closeGuide: () => this.setState({ guideOn: false }),
      showAudit: !!audit, audit: audit || {},
      dupCmp: (() => {
        const ids = s.dupIds || [];
        const fs = ids.map(id => s.families.find(f => f.id === id)).filter(Boolean);
        if (fs.length < 2) return { show: false, cards: [], fields: [] };
        const pick = s.dupPick || {}, edit = s.dupEdit || {};
        const fields = this.dupFields().map(([key, lab, get]) => {
          const vals = fs.map(get); const diff = vals.some(v => v !== vals[0]);
          const defIdx = vals.findIndex(v => v); const chosen = pick[key] != null ? pick[key] : (defIdx >= 0 ? defIdx : 0);
          const edited = edit[key] != null;
          return { key, lab, diff, edited, editVal: edited ? edit[key] : vals[chosen >= 0 ? chosen : 0],
            setEdit: (e) => this.setState({ dupEdit: { ...edit, [key]: e.target.value } }),
            clearEdit: () => { const ne = { ...edit }; delete ne[key]; this.setState({ dupEdit: ne }); },
            opts: fs.map((f, i) => ({ v: vals[i] || '—', on: !edited && chosen === i, bg: (!edited && chosen === i) ? '#211d17' : '#fff', c: (!edited && chosen === i) ? '#f3c76b' : '#211d17', bd: (!edited && chosen === i) ? '#211d17' : '#ded7c8', empty: !vals[i], sel: () => { const ne = { ...edit }; delete ne[key]; this.setState({ dupPick: { ...pick, [key]: i }, dupEdit: ne }); } })) };
        });
        return { show: true, fields: fields.map(fl => ({ ...fl, diffBd: fl.diff ? '#ecd9a8' : '#ece5d5', diffBg: fl.diff ? '#fdf9ef' : '#fdfbf6' })),
          heads: fs.map(f => ({ name: (f.mother ? f.mother + ' ' : '') + f.name, sub: [f.city, this.stMeta(f.status)[0]].filter(Boolean).join(' · '), drop: () => this.dupDrop(ids, [f.id]), open: () => { this.setState({ dupIds: null }); this.openFam(f.id); } })),
          title: 'מיזוג כפילות — ' + fs.length + ' רשומות',
          count: fs.length,
          close: () => this.setState({ dupIds: null, dupPick: {}, dupEdit: {} }),
          merge: () => this.dupFieldMerge(ids),
          dropAll: () => this.dupDrop(ids, ids) };
      })(),
      showRoomSet: s.modal === 'roomset', roomForm: rf, roomEqChips,
      roomSetTitle: s.roomSetId === '__new' ? 'הוספת חדר חדש' : 'הגדרות חדר — ' + (rf.name || ''),
      openNewRoom: () => this.setState({ modal: 'roomset', roomSetId: '__new', roomError: '', roomForm: { name: '', activeSel: 'yes', slot: '60', cap: '', location: 'המקום החדש', rate: '', from: '08:00', to: '20:00', accessSel: 'yes', notes: '', eq: {} } }),
      onRoomField: (e) => this.setState({ roomForm: { ...rf, [e.target.name]: e.target.value } }),
      saveRoomSet: () => this.saveRoomSet(),
      roomError: s.roomError || '', hasRoomError: !!s.roomError,
      openAudit: () => this.setState({ modal: 'audit' }),
      exportAudit: () => this.exportAudit(),
      fixPhones: () => this.fixAllPhones(),
      eventModalTitle: s.editingEventId ? 'עריכת אירוע' : 'אירוע חדש',
      orgSite: s.orgSite || '', setOrgSite: (e) => this.setState({ orgSite: e.target.value }),
      orgDonate: s.orgDonate || '', setOrgDonate: (e) => this.setState({ orgDonate: e.target.value }),
      logoInfo: () => this.t('העלאת לוגו תחובר ל-Supabase Storage בגרסה המחוברת'),
      notifStrongBg: s.notif.strong ? '#b45309' : '#ded7c8', notifStrongJust: s.notif.strong ? 'flex-end' : 'flex-start',
      toggleStrong: () => this.setState({ notif: { ...s.notif, strong: !s.notif.strong } }),
      form: s.form, memberForm: s.memberForm, memberFormHebLine, memberMediaChips, ...mbKeys,
      formMarOther: s.form.maritalStatus === '__other',
      courseFormAddTeacher: s.courseForm.teacherId === '__add',
      courseFormSemOther: s.courseForm.semester === '__other',
      courseFormCatOther: s.courseForm.cat === '__other',
      formLangOther: s.form.language === '__other',
      evTypeOtherShow: s.eventForm.type === '__other',
      expFams: () => this.exportFamiliesCSV(), expCourses: () => this.exportCoursesCSV(),
      openCourseExport: () => this.setState({ expOpen: true, expTarget: 'courses', expFrom: this.isoOf(new Date()), expTo: this.isoOf(new Date()), expSel: {} }),
      openEventsExport: () => this.setState({ expOpen: true, expTarget: 'events', expFrom: this.isoOf(new Date()), expTo: this.isoOffset(30), expSel: {} }),
      expM: (() => { if (!s.expOpen) return { show: false }; const defs = this.expFieldDefs(s.expTarget); const sel = s.expSel || {};
        return { show: true, title: s.expTarget === 'courses' ? '📊 דו"ח קורסים מותאם' : s.expTarget === 'events' ? '📊 דו"ח לוח שנה מותאם' : '📊 דו"ח תומכות מותאם',
          from: s.expFrom || '', to: s.expTo || '',
          setFrom: (e) => this.setState({ expFrom: e.target.value }), setTo: (e) => this.setState({ expTo: e.target.value }),
          isHeb: s.expDateMode === 'heb', isGreg: s.expDateMode !== 'heb',
          modeHeb: () => this.setState({ expDateMode: 'heb' }), modeGreg: () => this.setState({ expDateMode: 'greg' }),
          hebBg: s.expDateMode === 'heb' ? '#211d17' : '#fff', hebC: s.expDateMode === 'heb' ? '#f3c76b' : '#8b8474',
          gregBg: s.expDateMode !== 'heb' ? '#211d17' : '#fff', gregC: s.expDateMode !== 'heb' ? '#f3c76b' : '#8b8474',
          hebFrom: this.hb2Sel(s.expFrom || '', (iso) => this.setState({ expFrom: iso })),
          hebTo: this.hb2Sel(s.expTo || '', (iso) => this.setState({ expTo: iso })),
          rangeLine: (s.expFrom ? this.hebDateFull(s.expFrom) + ' · ' + this.fmtD(s.expFrom) : '—') + '  ←  ' + (s.expTo ? this.hebDateFull(s.expTo) + ' · ' + this.fmtD(s.expTo) : '—'),
          close: () => this.setState({ expOpen: false }), stop: (e) => e.stopPropagation(),
          fields: defs.map(([k, label]) => { const on = sel[k] !== false; return { label, mark: on ? '✓' : '', markBg: on ? '#211d17' : '#fff', markC: '#f3c76b', bd: on ? '#211d17' : '#ded7c8', bg: on ? '#f7f0dd' : '#fff', toggle: () => this.setState({ expSel: { ...sel, [k]: !on } }) }; }),
          selAll: () => { const ns = {}; for (const [k] of defs) ns[k] = true; this.setState({ expSel: ns }); },
          clearAll: () => { const ns = {}; for (const [k] of defs) ns[k] = false; this.setState({ expSel: ns }); },
          withNotes: !!s.expWithNotes,
          notesMark: s.expWithNotes ? '✓' : '',
          toggleNotes: () => this.setState({ expWithNotes: !s.expWithNotes }),
          preview: s.expWithNotes ? this.customExportData().data.map(d => { const k = s.expTarget + ':' + d.key; const cur = (s.expNotes || {})[k]; return { label: d.label, note: cur != null ? cur : (d.noteSeed || ''), setNote: (e) => this.setState({ expNotes: { ...(s.expNotes || {}), [k]: e.target.value } }) }; }) : [],
          run: () => this.runCustomExport() }; })(),
      expEnroll: () => this.exportEnrollCSV(), expEvents: () => this.exportEventsCSV(),
      hasFams: s.families.length > 0, hasCourses: s.courses.length > 0,
      hasEnroll: s.enrollments.length > 0, hasEvents: s.events.length > 0,
      noExportData: !(s.families.length || s.courses.length || s.enrollments.length || s.events.length),
      commChips: cityOptions.length >= 0 ? commOptions.map(co => { const on = (s.commMulti || []).includes(co); return { label: co + (on ? ' ✓' : ''), bg: on ? '#211d17' : 'rgba(255,255,255,.85)', c: on ? '#f3c76b' : '#211d17', toggle: () => { const m = (s.commMulti || []).slice(); const ix = m.indexOf(co); if (ix >= 0) m.splice(ix, 1); else m.push(co); this.setState({ commMulti: m }); } }; }) : [],
      formError: s.formError, hasFormError: !!s.formError, memberError: s.memberError, hasMemberError: !!s.memberError,
      showFamilyModal: s.modal === 'family', showMemberModal: s.modal === 'member',
      familyModalTitle: s.editingId ? 'עריכת משפחה' : 'משפחה חדשה',
      memberModalTitle: s.editingMemberId ? 'עריכת בן משפחה' : 'הוספת בן משפחה',
      toast: s.toast, hasToast: !!s.toast,
      courseForm: s.courseForm, courseError: s.courseError, hasCourseError: !!s.courseError,
      enrollForm: s.enrollForm, enrollError: s.enrollError, hasEnrollError: !!s.enrollError,
      enrollOptions: selC ? (this._enrollOptions || []) : [],
      enrollIsPunch: !!selC && selC.model === 'punch',
      showJoinModal: s.modal === 'join' && !!sel,
      joinForm: s.joinForm || {}, joinError: s.joinError || '', hasJoinError: !!s.joinError,
      joinMemberOptions, joinCourseOptions, joinIsPunch, joinHints, hasJoinHints: joinHints.length > 0,
      joinHasGroups: !!(this._joinGroups && this._joinGroups.length), joinGroupOptions: this._joinGroups || [],
      onJoinField: (e) => { const jf = { ...(s.joinForm || {}), [e.target.name]: e.target.value }; if (e.target.name === 'memberId') jf.courseId = ''; this.setState({ joinForm: jf, joinError: '' }); },
      hasJcEmpty: !!(joinPick && (s.joinForm || {}).memberId && joinCourseOptions.length === 0 && !s.joinShowAll),
      jmQ: joinPick ? joinPick.jmQ : '', jcQ: joinPick ? joinPick.jcQ : '',
      jmList: joinPick ? joinPick.jmList : [], jcList: joinPick ? joinPick.jcList : [],
      hasJmList: !!(joinPick && joinPick.jmList.length), hasJcList: !!(joinPick && joinPick.jcList.length),
      onJmInput: (e) => this.setState({ jmQ: e.target.value, joinForm: { ...(s.joinForm || {}), memberId: '', courseId: '' } }),
      onJmFocus: () => { if (s.jmQ == null) this.setState({ jmQ: '' }); },
      onJcInput: (e) => this.setState({ jcQ: e.target.value, joinForm: { ...(s.joinForm || {}), courseId: '' } }),
      onJcFocus: () => { if (s.jcQ == null) this.setState({ jcQ: '' }); },
      enQ: enPick ? enPick.q : '', enList: enPick ? enPick.list : [], hasEnList: !!(enPick && enPick.list.length),
      onEnInput: (e) => this.setState({ enQ: e.target.value, enrollForm: { ...(s.enrollForm || {}), memberId: '' } }),
      onEnFocus: () => { if (s.enQ == null) this.setState({ enQ: '' }); },
      enrollNewOpen: !!s.enrollNewOpen,
      enrollNewLabel: s.enrollNewOpen ? '− סגירת הטופס' : 'לא נמצא/ה במערכת? + הוספת בן משפחה חדש ושיבוץ',
      toggleEnrollNew: () => this.setState({ enrollNewOpen: !s.enrollNewOpen, enrollError: '', enrollNewForm: s.enrollNewForm || { famId: '', first: '', gender: 'f', birth: '' } }),
      enrollNewForm: s.enrollNewForm || {},
      onEnrollNewField: (e) => this.setState({ enrollNewForm: { ...(s.enrollNewForm || {}), [e.target.name]: e.target.value } }),
      enfQ: this._enfPick ? this._enfPick.q : '',
      enfList: this._enfPick ? this._enfPick.list : [],
      hasEnfList: !!(this._enfPick && this._enfPick.list.length),
      onEnfInput: (e) => this.setState({ enfQ: e.target.value, enrollNewForm: { ...(s.enrollNewForm || {}), famId: '' } }),
      enrollNewIsNewFam: (s.enrollNewForm || {}).famId === '__new',
      onEnfFocus: () => { if (s.enfQ == null) this.setState({ enfQ: '' }); },
      saveEnrollNew: () => this.saveEnrollNew(),
      joinShowAll: !!s.joinShowAll,
      toggleJoinShowAll: () => this.setState({ joinShowAll: !s.joinShowAll, joinForm: { ...(s.joinForm || {}), courseId: '' } }),
      joinShowAllLabel: s.joinShowAll ? '✓ מוצגים גם חוגים לא-תואמי גיל (עם אזהרה) — לחצו לחזרה לסינון' : 'מוצגים רק תואמי גיל ומגדר · הצג גם לא-תואמי גיל ←',
      joinShowAllC: s.joinShowAll ? '#12803c' : '#b45309',
      openJoin: () => this.setState({ modal: 'join', joinError: '', jmQ: null, jcQ: null, joinForm: { memberId: (sel && sel.members[0] ? sel.members[0].id : ''), courseId: '', purchased: '' } }),
      saveJoin: () => this.saveJoin(),
      showManage: !!mg, mg: mg || {},
      buyQty: s.buyQty || '', setBuyQty: (e) => this.setState({ buyQty: e.target.value }),
      mgNote: s.mgNote || '', setMgNote: (e) => this.setState({ mgNote: e.target.value }),
      payAmt: s.payAmt || '', setPayAmt: (e) => this.setState({ payAmt: e.target.value }),
      payMethod: s.payMethod || 'מזומן', setPayMethod: (e) => this.setState({ payMethod: e.target.value }),
      addPay: () => this.addPay(),
      payDue: (this.mgEn() || {}).dueDate || '', setPayDue: (e) => this.savePayDue(e.target.value),
      saveMgNote: () => { const en = this.mgEn(); if (!en) return; en.note = (s.mgNote || '').trim(); this.setState({ enrollments: s.enrollments }); this.t(en.note ? 'ההערה נשמרה — מוצגת ברשימת התלמידים' : 'ההערה נמחקה'); },
      buyPunches: () => this.buyPunches(),
      mgUndo: () => { const en = this.mgEn(); if (!en || !en.used) { this.t('אין ניקוב לביטול'); return; } en.used--; const fu = s.families.find(f2 => f2.members.some(m2 => m2.id === en.memberId)); if (fu && fu.cred && Array.isArray(fu.cred.log)) { const li = fu.cred.log.findIndex(l => l.delta > 0 && l.desc && l.desc.indexOf('נוכחות (Check-in)') === 0); if (li > -1) { const rev = fu.cred.log[li].delta; fu.cred.log.splice(li, 1); fu.cred.score = Math.max(0, Math.min(1000, fu.cred.score - rev)); fu.cred.log.unshift({ date: this.isoOf(new Date()), delta: -rev, desc: 'ביטול ניקוב — החזר מדויק של ניקוד הנוכחות' }); this.setState({ families: s.families }); } else this.credEvent(fu.id, -5, 'ביטול ניקוב — תיקון טעות'); } this.setState({ enrollments: s.enrollments }); this.t('הניקוב האחרון בוטל — היתרה הוחזרה'); },
      mgToMonthly: () => { const en = this.mgEn(); if (!en) return; en.plan = 'monthly'; this.setState({ enrollments: s.enrollments }); this.t('השיבוץ הועבר למנוי חודשי'); },
      mgPause: () => { const en = this.mgEn(); if (!en) return; en.status = en.status === 'paused' ? 'active' : 'paused'; this.setState({ enrollments: s.enrollments }); this.t(en.status === 'paused' ? 'השיבוץ הוקפא — הניקוב נחסם עד הפשרה' : 'השיבוץ הופשר וחזר לפעילות'); },
      mgEnd: () => { const en = this.mgEn(); if (!en) return; en.status = 'ended'; this.setState({ enrollments: s.enrollments }); this.t('השיבוץ סומן כהסתיים'); },
      mgRemove: () => { if (!s.manageConfirm) { this.setState({ manageConfirm: true }); return; } const i = s.enrollments.findIndex(e => e.id === s.manageId); if (i >= 0) { const enR = s.enrollments[i]; if (enR.dueEventId) { const ei = s.events.findIndex(x => x.id === enR.dueEventId); if (ei >= 0) s.events.splice(ei, 1); } s.enrollments.splice(i, 1); } this.setState({ enrollments: s.enrollments, events: s.events, modal: null, manageConfirm: false }); this.t('השיבוץ הוסר לצמיתות — כולל תזכורת התשלום מהלוח'); },
      courseFormIsPunch: s.courseForm.model === 'punch',
      hebCS: this.hb2Sel(s.courseForm.start, (iso) => this.setState({ courseForm: { ...s.courseForm, start: iso } })),
      hebCE: this.hb2Sel(s.courseForm.end, (iso) => this.setState({ courseForm: { ...s.courseForm, end: iso } })),
      teacherOptions: this.teachers,
      showCourseModal: s.modal === 'course', showEnrollModal: s.modal === 'enroll',
      courseModalTitle: s.editingCourseId ? 'עריכת קורס' : 'קורס חדש',
      cells: cal.cells, upcoming: cal.upcoming, noUpcoming: cal.noUpcoming,
      monthLabel: cal.monthLabel, hebMonthLabel: cal.hebMonthLabel,
      showEventModal: s.modal === 'event',
      evEditing: !!s.editingEventId, evSaveLabel: s.editingEventId ? 'שמירת שינויים' : 'הוספה ללוח',
      deleteEvent: () => { this.setState({ events: this.state.events.filter(e => e.id !== s.editingEventId), modal: null, editingEventId: null }); this.t('האירוע נמחק מהלוח'); },
      famOptions: s.modal === 'event' ? s.families.map(f => ({ id: f.id, label: 'משפחת ' + f.name })) : [],
      evFormRecurring: !!s.eventForm.date,
      evDateIsHeb: s.evDateMode === 'heb', evDateIsGreg: s.evDateMode !== 'heb',
      evDateHeb: () => this.setState({ evDateMode: 'heb' }), evDateGreg: () => this.setState({ evDateMode: 'greg' }),
      evDateHebBg: s.evDateMode === 'heb' ? '#211d17' : '#fff', evDateHebC: s.evDateMode === 'heb' ? '#f3c76b' : '#8b8474',
      evDateGregBg: s.evDateMode !== 'heb' ? '#211d17' : '#fff', evDateGregC: s.evDateMode !== 'heb' ? '#f3c76b' : '#8b8474',
      evHebDate: this.hb2Sel(s.eventForm.date || '', (iso) => this.setState({ eventForm: { ...s.eventForm, date: iso } })),
      evQuickDates: (() => { const cur = s.eventForm.date; const mk = (label, days, tip) => { const iso = this.isoOffset(days); const on = cur === iso; return { label, tip, pick: () => this.setState({ eventForm: { ...s.eventForm, date: iso } }), bd: on ? '#211d17' : '#ded7c8', bg: on ? '#211d17' : '#fff', c: on ? '#f3c76b' : '#8b8474' }; };
        return [mk('היום', 0, 'תזמון להיום'), mk('בעוד שבוע', 7, 'שבוע מהיום'), mk('חודש', 30, 'חודש מהיום'), mk('חודשיים', 60, 'חודשיים מהיום'), mk('שלושה חודשים', 90, 'שלושה חודשים מהיום')]; })(),
      evFormHebLine: s.eventForm.date ? 'תאריך עברי: ' + this.hebDateFull(s.eventForm.date) + (this.evMeta(s.eventForm.type || 'org').recur ? ' · חוזר מדי שנה בתאריך העברי הזה' : '') : '',
      courseFormHasHeb: !!(s.courseForm.start || s.courseForm.end),
      courseFormHebLine: 'תקופה בעברי: ' + (s.courseForm.start ? this.hebDateFull(s.courseForm.start) : '—') + ' עד ' + (s.courseForm.end ? this.hebDateFull(s.courseForm.end) : '—'),
      eventForm: s.eventForm, eventError: s.eventError, hasEventError: !!s.eventError,
      orgName: s.orgName, setOrgName: (e) => this.setState({ orgName: e.target.value }),
      saveSettings: () => { this.persist(); this.t(this._saveOk ? 'נשמר במחשב הזה ✓ — כל שינוי נשמר גם אוטומטית' : '⚠ השמירה נכשלה — הורידו גיבוי מלא ובדקו מקום פנוי בדפדפן'); },
      exportBackup: () => this.exportBackup(),
      resetArm: !!s.resetArm,
      resetLabel: s.resetArm ? 'לאשר איפוס? כל השינויים המקומיים יימחקו' : 'איפוס נתונים מקומיים',
      resetLocal: () => { if (!s.resetArm) { this.setState({ resetArm: true }); clearTimeout(this._ra); this._ra = setTimeout(() => this.setState({ resetArm: false }), 4000); return; } try { localStorage.removeItem('maorclean2_db'); } catch (e) {} window.location.reload(); },
      notifEmailBg: s.notif.email ? '#211d17' : '#ded7c8', notifEmailJust: s.notif.email ? 'flex-end' : 'flex-start',
      notifPushBg: s.notif.push ? '#211d17' : '#ded7c8', notifPushJust: s.notif.push ? 'flex-end' : 'flex-start',
      notifSmsBg: s.notif.sms ? '#211d17' : '#ded7c8', notifSmsJust: s.notif.sms ? 'flex-end' : 'flex-start',
      toggleEmail: () => this.setState({ notif: { ...s.notif, email: !s.notif.email } }),
      togglePush: () => this.setState({ notif: { ...s.notif, push: !s.notif.push } }),
      toggleSms: () => this.setState({ notif: { ...s.notif, sms: !s.notif.sms } }),
      teacherRows: this.teachers.map(t => ({ name: t.name, initial: t.name[0],
        sub: (t.phone || 'ללא טלפון') + (t.specialty ? ' · ' + t.specialty : '') + ' · ' + s.courses.filter(c => c.teacherId === t.id).length + ' חוגים',
        open: () => this.openTeacher(t.id) })),
      addTeacher: () => this.setState({ modal: 'teacher', teacherEditId: null, teacherError: '', tForm: { name: '', phone: '', phone2: '', email: '', idNum: '', address: '', specialty: '', payRate: '', startDate: '', notes: '' } }),
      showTeacher: s.modal === 'teacher',
      tForm: s.tForm || {},
      teacherModalTitle: s.teacherEditId ? 'כרטיס מורה — עריכה מלאה' : '+ מורה חדשה',
      teacherError: s.teacherError || '', hasTeacherError: !!s.teacherError,
      tIsEdit: !!s.teacherEditId,
      tHebStart: (s.tForm || {}).startDate ? 'התחלה בעברי: ' + this.hebDateFull(s.tForm.startDate) : '',
      tStatsLine: (() => { if (!s.teacherEditId) return ''; const cs = s.courses.filter(c => c.teacherId === s.teacherEditId); const ids = new Set(cs.map(c => c.id)); const n = s.enrollments.filter(e => ids.has(e.courseId)).length; return cs.length + ' חוגים · ' + n + ' תלמידים רשומים'; })(),
      tCourses: s.courses.filter(c => c.teacherId === s.teacherEditId).map(c => ({ label: c.name + ' · ' + this.sessionsOf(c).map(ss => 'יום ' + DAYN[ss.day] + ' ' + (ss.time || '')).join(' · ') + ' · ' + (s.enrollments.filter(e => e.courseId === c.id).length) + ' תלמידים', go: () => this.setState({ modal: null, view: 'courses', selCourseId: c.id }) })),
      tHasCourses: s.courses.some(c => c.teacherId === s.teacherEditId),
      tCanDelete: !!s.teacherEditId && !s.courses.some(c => c.teacherId === s.teacherEditId),
      deleteTeacher: () => { const i = this.teachers.findIndex(x => x.id === s.teacherEditId); if (i < 0) return; if (s.courses.some(c => c.teacherId === s.teacherEditId)) { this.setState({ teacherError: 'למורה יש חוגים משויכים — העבירו אותם קודם למורה אחרת' }); return; } const nm = this.teachers[i].name; this.teachers.splice(i, 1); this.persist(); this.setState({ modal: null }); this.t('המורה ' + nm + ' הוסרה מהמערכת'); },
      onTField: (e) => this.setState({ tForm: { ...(s.tForm || {}), [e.target.name]: e.target.value } }),
      saveTeacher: () => this.saveTeacherFull(),
      tCallNow: () => { const t = this.teachers.find(x => x.id === s.teacherEditId); if (!t) return; this.setState({ modal: 'event', editingEventId: null, eventError: '', eventForm: { title: 'להתקשר למורה ' + t.name + (t.phone ? ' · ' + t.phone : ''), date: this.isoOf(now), time: '', type: 'call', notes: 'מתוך כרטיס מורה', priority: 'orange', price: '', roomId: '', famId: '' } }); },
      goHome: () => this.setState({ view: 'home', selId: null, selCourseId: null }),
      goFamilies: () => this.setState({ view: 'families', selId: null, selCourseId: null }),
      goCourses: () => this.setState({ view: 'courses', selId: null, selCourseId: null }),
      goCalendar: () => this.setState({ view: 'calendar', selId: null, selCourseId: null, calDay: null }),
      goSettings: () => this.setState({ view: 'settings', selId: null, selCourseId: null }),
      back: () => this.setState({ selId: null }),
      goCoursesBack: () => this.setState({ selCourseId: null }),
      setQ: (e) => this.setState({ q: e.target.value }),
      setStatusFilter: (e) => this.setState({ statusFilter: e.target.value }),
      clearSearch: () => this.setState({ q: '', statusFilter: 'all', cityFilter: 'all', commFilter: 'all', commMulti: [], colF: {}, fMar: 'all', fLang: 'all', fSefach: 'all', fKids: 'all', fEnrolled: 'all', fTier: 'all' }),
      showGlobalHint: !!ql, searchEverywhere: () => this.setState({ paletteOpen: true, paletteQ: s.q.trim() }),
      openNewFamily: () => this.setState({ modal: 'family', editingId: null, formError: '', form: this.emptyForm() }),
      editFamily: () => { const f = sel; this.setState({ modal: 'family', editingId: f.id, formError: '', form: { name: f.name, phone: f.phone, father: f.father, fatherId: f.fatherId, mother: f.mother, motherId: f.motherId, phone2: f.phone2, email: f.email, address: f.address, city: f.city, status: f.status, notes: f.notes, maritalStatus: f.maritalStatus || '', language: f.language || 'עברית', community: f.community || 'כללי', tzedaka: f.tzedaka || '', fullSefach: f.fullSefach ? 'yes' : 'no', discount: f.discount || '' } }); },
      /* audit-fix: אין יותר ברירת־מחדל שקטה */
      openAddMember: () => this.setState({ modal: 'member', editingMemberId: null, memberError: '', memberForm: { first: '', gender: 'm', birth: '', idNum: '', phone: '', phone2: '', school: '', grade: '', health: '', mSefach: false, mInvite: false, mRecommend: false, mPhotos: false, mVideos: false, notes: '' } }),
      onFormField: (e) => this.setState({ form: { ...s.form, [e.target.name]: e.target.value } }),
      onMemberField: (e) => { const st = { memberForm: { ...s.memberForm, [e.target.name]: e.target.value } }; if (e.target.name === 'birth' && e.target.value) { const hp = this.hb2FromIso(e.target.value); st.hbDay = String(hp.d || ''); st.hbMonth = hp.m || ''; st.hbYear = String(hp.y || ''); } this.setState(st); },
      saveFamily: () => this.saveFamily(), saveMember: () => this.saveMember(),
      openNewCourse: () => this.setState({ modal: 'course', editingCourseId: null, courseError: '', courseForm: this.emptyCourseForm() }),
      editCourse: () => this.setState({ modal: 'course', editingCourseId: selC.id, courseError: '', courseForm: { name: selC.name, teacherId: selC.teacherId, description: selC.description || '', gradeMin: selC.gradeMin || '', gradeMax: selC.gradeMax || '', price: String(selC.price || ''), price1: String(selC.price1 || ''), price2: String(selC.price2 || ''), price1Name: selC.price1Name || '', price2Name: selC.price2Name || '', newTeacherName: '', newTeacherPhone: '', model: selC.model, size: String(selC.size || ''), start: selC.start || '', end: selC.end || '', roomId: selC.roomId || 'r2', weekday: String(selC.weekday ?? 0), time: selC.time || '17:00', maxStudents: String(selC.maxStudents || 12), gender: selC.gender || 'f', ageMin: selC.ageMin != null ? String(selC.ageMin) : '', ageMax: selC.ageMax != null ? String(selC.ageMax) : '', cat: ['מלאכה', 'אמנות', 'העשרה', 'ספורט', 'מוזיקה', 'רווחה', 'טיפוח', 'קולינרי', 'קהילה'].includes(selC.cat || 'העשרה') ? (selC.cat || 'העשרה') : '__other', catOther: ['מלאכה', 'אמנות', 'העשרה', 'ספורט', 'מוזיקה', 'רווחה', 'טיפוח', 'קולינרי', 'קהילה'].includes(selC.cat || 'העשרה') ? '' : (selC.cat || ''), semester: ['שנתי', 'חצי שנתי'].includes(selC.semester || 'שנתי') ? (selC.semester || 'שנתי') : '__other', semesterOther: ['שנתי', 'חצי שנתי'].includes(selC.semester || 'שנתי') ? '' : (selC.semester || '') } }),
      gradeOptions: [{ v: '', t: '— ללא —' }, { v: 'gan', t: 'גן' }, { v: '1', t: 'א׳' }, { v: '2', t: 'ב׳' }, { v: '3', t: 'ג׳' }, { v: '4', t: 'ד׳' }, { v: '5', t: 'ה׳' }, { v: '6', t: 'ו׳' }, { v: '7', t: 'ז׳' }, { v: '8', t: 'ח׳' }, { v: '9', t: 'ט׳' }, { v: '10', t: 'י׳' }, { v: '11', t: 'י״א' }, { v: '12', t: 'י״ב' }],
      onCourseField: (e) => this.setState({ courseForm: { ...s.courseForm, [e.target.name]: e.target.value } }),
      saveCourse: () => this.saveCourse(),
      openEnroll: () => { const o = this._enrollOptions || []; this.setState({ modal: 'enroll', enrollError: '', enQ: null, enfQ: null, enrollNewOpen: false, enrollNewForm: { famId: '', first: '', gender: selC.gender === 'm' ? 'm' : 'f', birth: '' }, enrollForm: { memberId: o.length ? o[0].id : '', purchased: selC.model === 'punch' ? String(selC.size) : '' } }); },
      onEnrollField: (e) => this.setState({ enrollForm: { ...s.enrollForm, [e.target.name]: e.target.value } }),
      saveEnroll: () => this.saveEnroll(),
      prevMonth: () => { if (s.calHebMode && this._hebNav) { this.setState({ calHebAnchor: this._hebNav.prevIso }); return; } const m = s.calMonth - 1; this.setState(m < 0 ? { calMonth: 11, calYear: s.calYear - 1 } : { calMonth: m }); },
      nextMonth: () => { if (s.calHebMode && this._hebNav) { this.setState({ calHebAnchor: this._hebNav.nextIso }); return; } const m = s.calMonth + 1; this.setState(m > 11 ? { calMonth: 0, calYear: s.calYear + 1 } : { calMonth: m }); },
      goToday: () => { this.setState({ calMonth: now.getMonth(), calYear: now.getFullYear(), calHebAnchor: this.isoOf(now), calDay: this.isoOf(now) }); this.t('היום: ' + todayLabel); },
      calHebMode: !!s.calHebMode,
      calGridBtn: s.calHebMode ? 'גריד עברי ✓' : 'גריד לועזי',
      calGridBg: s.calHebMode ? '#211d17' : 'rgba(255,255,255,.75)', calGridC: s.calHebMode ? '#f3c76b' : '#211d17',
      toggleCalHeb: () => this.setState({ calHebMode: !s.calHebMode, calHebAnchor: this.isoOf(now) }),
      openNewEvent: () => this.setState({ modal: 'event', editingEventId: null, eventError: '', eventForm: { title: '', date: this.isoOf(now), time: '', type: 'org', notes: '', price: '', roomId: '', famId: '', priority: 'green' } }),
      onEventField: (e) => this.setState({ eventForm: { ...s.eventForm, [e.target.name]: e.target.value } }),
      saveEvent: () => this.saveEvent(),
      closeModal: () => this.setState({ modal: null, formError: '', memberError: '', courseError: '', enrollError: '', eventError: '', editingEventId: null, manageConfirm: false, joinError: '', jmQ: null, jcQ: null, enQ: null, enfQ: null, enrollNewOpen: false, evReturn: null, afterMember: null, mbMode: 'greg', hbDay: '', hbMonth: '', hbYear: '' }),
      stop: (e) => e.stopPropagation(),
      docsInfo: () => this.t('העלאת קבצים תחובר ל-Supabase Storage בגרסה המחוברת')
    };
  }
}
