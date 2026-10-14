// 🔓 נוצר אוטומטית ע"י catalog/inner/scripts/open.mjs מתוך generator:gen/looks/app/src/01-store.js — לא לערוך ביד.
// כל פונקציה כאן = ערך-בדרך שהורם מתוך פונקציה גדולה יותר; טהורה, בלי I/O. SIGS = צורת הקלטים לקורא-ההתנהגות.
const LAST = ['ברגר', 'רוזן', 'כהן', 'ויס', 'אדלר', 'שטרן', 'נוימן', 'לוי', 'פריד', 'כץ', 'גולד', 'רוט', 'מלר', 'פרידמן', 'הורוביץ', 'אונגר', 'ויסבלט', 'גרין', 'דויטש', 'הירש', 'וקסלר', 'זילבר', 'חשין', 'טננבוים', 'יעקובוביץ', 'כהנא', 'לנדאו', 'אברמסון', 'בלוי', 'גולדשטיין', 'שוורץ', 'פישר', 'רייזמן', 'הלר', 'בראון', 'שפירא', 'טויב', 'ריינר', 'אקשטיין', 'זיסקינד'];
const MALE = ['אברהם', 'יצחק', 'יעקב', 'משה', 'אהרן', 'שמואל', 'דוד', 'שלמה', 'מנחם', 'מרדכי', 'נפתלי', 'אשר', 'זבולון', 'יששכר', 'אליהו', 'אלימלך', 'ברוך', 'גרשון', 'זלמן', 'חיים', 'טוביה', 'יוסף', 'כלב', 'לוי', 'נחום', 'עזרא', 'פינחס', 'צבי', 'קלמן', 'שרגא', 'שמעון', 'יהודה', 'דן', 'גד', 'אורי', 'בנימין'];
const LOAN_OPEN = ['ניתן', 'בהחזר', 'באיחור'];
export function inner$seed$fn$t(s) {
    let t = Math.imul(s ^ s >>> 15, 1 | s);
    return t;
}
export function inner$build$forEach$free(DB, s) {
    const free = DB.staff.find(x => !x.absent && x.role === s.role && !x.subFor);
    return free;
}
export function inner$build$last(i) {
    const last = LAST[i % LAST.length] + (i >= LAST.length ? ' ' + MALE[i % 7][0] + '׳' : '');
    return last;
}
export function inner$build$f(DB, sid) {
    const FAMS = 168;
    const f = DB.families[sid % FAMS];
    return f;
}
export function inner$build$edge(c) {
    const edge = c === 0 || c === 11;
    return edge;
}
export function inner$build$s(r, c, st) {
    const s = { id: 'q' + (r * 12 + c), row: r, col: c, status: st, familyId: null, price: st === 'מושכר' ? 2400 : 0 };
    return s;
}
export function inner$build$started(stage) {
    const started = ['בהחזר', 'באיחור', 'נפרע'].includes(stage);
    return started;
}
export function inner$build$drivers(DB) {
    const drivers = DB.staff.filter(s => s.role === 'נהג');
    return drivers;
}
export function inner$nameOf$p(DB, pid) {
    const p = DB.people.find(x => x.id === pid);
    return p;
}
export function inner$fund$live(DB) {
    const live = DB.loans.filter(l => LOAN_OPEN.includes(l.stage));
    return live;
}
export function inner$fund$out(DB) {
    const live = DB.loans.filter(l => LOAN_OPEN.includes(l.stage));
    const out = live.reduce((a, l) => a + Math.round(l.amount * (1 - l.paid / l.installments)), 0);
    return out;
}
export function inner$fund$out$$step(live) {
    const out = live.reduce((a, l) => a + Math.round(l.amount * (1 - l.paid / l.installments)), 0);
    return out;
}
export function inner$attendanceOf$ss(DB, classId) {
    const ss = DB.students.filter(s => s.classId === classId);
    return ss;
}
export function inner$attendanceOf$days(DB, classId) {
    const ss = DB.students.filter(s => s.classId === classId);
    const days = ss.reduce((a, s) => a + s.att.filter(Boolean).length, 0);
    return days;
}
export function inner$attendanceOf$days$$step(ss) {
    const days = ss.reduce((a, s) => a + s.att.filter(Boolean).length, 0);
    return days;
}
export function inner$undoLast$e(DB, u) {
    const e = DB.log.find(x => x.undo === u.undo);
    return e;
}

export const SIGS = {
  inner$seed$fn$t: [{"name":"s","d":{"t":"any"},"opt":false}],
  inner$build$forEach$free: [{"name":"DB","d":{"t":"obj","p":[["tariff",{"t":"obj","p":[["tuition",{"t":"num"},false],["bus",{"t":"num"},false],["books",{"t":"num"},false],["year",{"t":"str"},false]]},false],["hmonths",{"t":"arr","of":{"t":"str"}},false],["today",{"t":"obj","p":[["hd",{"t":"str"},false],["hy",{"t":"str"},false],["dow",{"t":"str"},false]]},false],["people",{"t":"arr","of":{"t":"undef"}},false],["families",{"t":"arr","of":{"t":"undef"}},false],["students",{"t":"arr","of":{"t":"undef"}},false],["classes",{"t":"arr","of":{"t":"undef"}},false],["staff",{"t":"arr","of":{"t":"undef"}},false],["payments",{"t":"arr","of":{"t":"undef"}},false],["donors",{"t":"arr","of":{"t":"undef"}},false],["donations",{"t":"arr","of":{"t":"undef"}},false],["campaigns",{"t":"arr","of":{"t":"undef"}},false],["budget",{"t":"arr","of":{"t":"undef"}},false],["seats",{"t":"arr","of":{"t":"undef"}},false],["minyanim",{"t":"arr","of":{"t":"undef"}},false],["yahrzeits",{"t":"arr","of":{"t":"undef"}},false],["queue",{"t":"arr","of":{"t":"undef"}},false],["loans",{"t":"arr","of":{"t":"undef"}},false],["routes",{"t":"arr","of":{"t":"undef"}},false],["calls",{"t":"arr","of":{"t":"undef"}},false],["proposals",{"t":"arr","of":{"t":"undef"}},false],["groups",{"t":"arr","of":{"t":"undef"}},false],["messages",{"t":"arr","of":{"t":"undef"}},false],["log",{"t":"arr","of":{"t":"undef"}},false]]},"opt":false},{"name":"s","d":{"t":"undef"},"opt":false}],
  inner$build$last: [{"name":"i","d":{"t":"num"},"opt":false}],
  inner$build$f: [{"name":"DB","d":{"t":"obj","p":[["tariff",{"t":"obj","p":[["tuition",{"t":"num"},false],["bus",{"t":"num"},false],["books",{"t":"num"},false],["year",{"t":"str"},false]]},false],["hmonths",{"t":"arr","of":{"t":"str"}},false],["today",{"t":"obj","p":[["hd",{"t":"str"},false],["hy",{"t":"str"},false],["dow",{"t":"str"},false]]},false],["people",{"t":"arr","of":{"t":"undef"}},false],["families",{"t":"arr","of":{"t":"undef"}},false],["students",{"t":"arr","of":{"t":"undef"}},false],["classes",{"t":"arr","of":{"t":"undef"}},false],["staff",{"t":"arr","of":{"t":"undef"}},false],["payments",{"t":"arr","of":{"t":"undef"}},false],["donors",{"t":"arr","of":{"t":"undef"}},false],["donations",{"t":"arr","of":{"t":"undef"}},false],["campaigns",{"t":"arr","of":{"t":"undef"}},false],["budget",{"t":"arr","of":{"t":"undef"}},false],["seats",{"t":"arr","of":{"t":"undef"}},false],["minyanim",{"t":"arr","of":{"t":"undef"}},false],["yahrzeits",{"t":"arr","of":{"t":"undef"}},false],["queue",{"t":"arr","of":{"t":"undef"}},false],["loans",{"t":"arr","of":{"t":"undef"}},false],["routes",{"t":"arr","of":{"t":"undef"}},false],["calls",{"t":"arr","of":{"t":"undef"}},false],["proposals",{"t":"arr","of":{"t":"undef"}},false],["groups",{"t":"arr","of":{"t":"undef"}},false],["messages",{"t":"arr","of":{"t":"undef"}},false],["log",{"t":"arr","of":{"t":"undef"}},false]]},"opt":false},{"name":"sid","d":{"t":"num"},"opt":false}],
  inner$build$edge: [{"name":"c","d":{"t":"num"},"opt":false}],
  inner$build$s: [{"name":"r","d":{"t":"num"},"opt":false},{"name":"c","d":{"t":"num"},"opt":false},{"name":"st","d":{"t":"lit","v":["קבוע","שמור","מושכר","פנוי"]},"opt":false}],
  inner$build$started: [{"name":"stage","d":{"t":"str"},"opt":false}],
  inner$build$drivers: [{"name":"DB","d":{"t":"obj","p":[["tariff",{"t":"obj","p":[["tuition",{"t":"num"},false],["bus",{"t":"num"},false],["books",{"t":"num"},false],["year",{"t":"str"},false]]},false],["hmonths",{"t":"arr","of":{"t":"str"}},false],["today",{"t":"obj","p":[["hd",{"t":"str"},false],["hy",{"t":"str"},false],["dow",{"t":"str"},false]]},false],["people",{"t":"arr","of":{"t":"undef"}},false],["families",{"t":"arr","of":{"t":"undef"}},false],["students",{"t":"arr","of":{"t":"undef"}},false],["classes",{"t":"arr","of":{"t":"undef"}},false],["staff",{"t":"arr","of":{"t":"undef"}},false],["payments",{"t":"arr","of":{"t":"undef"}},false],["donors",{"t":"arr","of":{"t":"undef"}},false],["donations",{"t":"arr","of":{"t":"undef"}},false],["campaigns",{"t":"arr","of":{"t":"undef"}},false],["budget",{"t":"arr","of":{"t":"undef"}},false],["seats",{"t":"arr","of":{"t":"undef"}},false],["minyanim",{"t":"arr","of":{"t":"undef"}},false],["yahrzeits",{"t":"arr","of":{"t":"undef"}},false],["queue",{"t":"arr","of":{"t":"undef"}},false],["loans",{"t":"arr","of":{"t":"undef"}},false],["routes",{"t":"arr","of":{"t":"undef"}},false],["calls",{"t":"arr","of":{"t":"undef"}},false],["proposals",{"t":"arr","of":{"t":"undef"}},false],["groups",{"t":"arr","of":{"t":"undef"}},false],["messages",{"t":"arr","of":{"t":"undef"}},false],["log",{"t":"arr","of":{"t":"undef"}},false]]},"opt":false}],
  inner$nameOf$p: [{"name":"DB","d":{"t":"obj","p":[["tariff",{"t":"obj","p":[["tuition",{"t":"num"},false],["bus",{"t":"num"},false],["books",{"t":"num"},false],["year",{"t":"str"},false]]},false],["hmonths",{"t":"arr","of":{"t":"str"}},false],["today",{"t":"obj","p":[["hd",{"t":"str"},false],["hy",{"t":"str"},false],["dow",{"t":"str"},false]]},false],["people",{"t":"arr","of":{"t":"undef"}},false],["families",{"t":"arr","of":{"t":"undef"}},false],["students",{"t":"arr","of":{"t":"undef"}},false],["classes",{"t":"arr","of":{"t":"undef"}},false],["staff",{"t":"arr","of":{"t":"undef"}},false],["payments",{"t":"arr","of":{"t":"undef"}},false],["donors",{"t":"arr","of":{"t":"undef"}},false],["donations",{"t":"arr","of":{"t":"undef"}},false],["campaigns",{"t":"arr","of":{"t":"undef"}},false],["budget",{"t":"arr","of":{"t":"undef"}},false],["seats",{"t":"arr","of":{"t":"undef"}},false],["minyanim",{"t":"arr","of":{"t":"undef"}},false],["yahrzeits",{"t":"arr","of":{"t":"undef"}},false],["queue",{"t":"arr","of":{"t":"undef"}},false],["loans",{"t":"arr","of":{"t":"undef"}},false],["routes",{"t":"arr","of":{"t":"undef"}},false],["calls",{"t":"arr","of":{"t":"undef"}},false],["proposals",{"t":"arr","of":{"t":"undef"}},false],["groups",{"t":"arr","of":{"t":"undef"}},false],["messages",{"t":"arr","of":{"t":"undef"}},false],["log",{"t":"arr","of":{"t":"undef"}},false]]},"opt":false},{"name":"pid","d":{"t":"any"},"opt":false}],
  inner$fund$live: [{"name":"DB","d":{"t":"obj","p":[["tariff",{"t":"obj","p":[["tuition",{"t":"num"},false],["bus",{"t":"num"},false],["books",{"t":"num"},false],["year",{"t":"str"},false]]},false],["hmonths",{"t":"arr","of":{"t":"str"}},false],["today",{"t":"obj","p":[["hd",{"t":"str"},false],["hy",{"t":"str"},false],["dow",{"t":"str"},false]]},false],["people",{"t":"arr","of":{"t":"undef"}},false],["families",{"t":"arr","of":{"t":"undef"}},false],["students",{"t":"arr","of":{"t":"undef"}},false],["classes",{"t":"arr","of":{"t":"undef"}},false],["staff",{"t":"arr","of":{"t":"undef"}},false],["payments",{"t":"arr","of":{"t":"undef"}},false],["donors",{"t":"arr","of":{"t":"undef"}},false],["donations",{"t":"arr","of":{"t":"undef"}},false],["campaigns",{"t":"arr","of":{"t":"undef"}},false],["budget",{"t":"arr","of":{"t":"undef"}},false],["seats",{"t":"arr","of":{"t":"undef"}},false],["minyanim",{"t":"arr","of":{"t":"undef"}},false],["yahrzeits",{"t":"arr","of":{"t":"undef"}},false],["queue",{"t":"arr","of":{"t":"undef"}},false],["loans",{"t":"arr","of":{"t":"undef"}},false],["routes",{"t":"arr","of":{"t":"undef"}},false],["calls",{"t":"arr","of":{"t":"undef"}},false],["proposals",{"t":"arr","of":{"t":"undef"}},false],["groups",{"t":"arr","of":{"t":"undef"}},false],["messages",{"t":"arr","of":{"t":"undef"}},false],["log",{"t":"arr","of":{"t":"undef"}},false]]},"opt":false}],
  inner$fund$out: [{"name":"DB","d":{"t":"obj","p":[["tariff",{"t":"obj","p":[["tuition",{"t":"num"},false],["bus",{"t":"num"},false],["books",{"t":"num"},false],["year",{"t":"str"},false]]},false],["hmonths",{"t":"arr","of":{"t":"str"}},false],["today",{"t":"obj","p":[["hd",{"t":"str"},false],["hy",{"t":"str"},false],["dow",{"t":"str"},false]]},false],["people",{"t":"arr","of":{"t":"undef"}},false],["families",{"t":"arr","of":{"t":"undef"}},false],["students",{"t":"arr","of":{"t":"undef"}},false],["classes",{"t":"arr","of":{"t":"undef"}},false],["staff",{"t":"arr","of":{"t":"undef"}},false],["payments",{"t":"arr","of":{"t":"undef"}},false],["donors",{"t":"arr","of":{"t":"undef"}},false],["donations",{"t":"arr","of":{"t":"undef"}},false],["campaigns",{"t":"arr","of":{"t":"undef"}},false],["budget",{"t":"arr","of":{"t":"undef"}},false],["seats",{"t":"arr","of":{"t":"undef"}},false],["minyanim",{"t":"arr","of":{"t":"undef"}},false],["yahrzeits",{"t":"arr","of":{"t":"undef"}},false],["queue",{"t":"arr","of":{"t":"undef"}},false],["loans",{"t":"arr","of":{"t":"undef"}},false],["routes",{"t":"arr","of":{"t":"undef"}},false],["calls",{"t":"arr","of":{"t":"undef"}},false],["proposals",{"t":"arr","of":{"t":"undef"}},false],["groups",{"t":"arr","of":{"t":"undef"}},false],["messages",{"t":"arr","of":{"t":"undef"}},false],["log",{"t":"arr","of":{"t":"undef"}},false]]},"opt":false}],
  inner$fund$out$$step: [{"name":"live","d":{"t":"arr","of":{"t":"any"}},"opt":false}],
  inner$attendanceOf$ss: [{"name":"DB","d":{"t":"obj","p":[["tariff",{"t":"obj","p":[["tuition",{"t":"num"},false],["bus",{"t":"num"},false],["books",{"t":"num"},false],["year",{"t":"str"},false]]},false],["hmonths",{"t":"arr","of":{"t":"str"}},false],["today",{"t":"obj","p":[["hd",{"t":"str"},false],["hy",{"t":"str"},false],["dow",{"t":"str"},false]]},false],["people",{"t":"arr","of":{"t":"undef"}},false],["families",{"t":"arr","of":{"t":"undef"}},false],["students",{"t":"arr","of":{"t":"undef"}},false],["classes",{"t":"arr","of":{"t":"undef"}},false],["staff",{"t":"arr","of":{"t":"undef"}},false],["payments",{"t":"arr","of":{"t":"undef"}},false],["donors",{"t":"arr","of":{"t":"undef"}},false],["donations",{"t":"arr","of":{"t":"undef"}},false],["campaigns",{"t":"arr","of":{"t":"undef"}},false],["budget",{"t":"arr","of":{"t":"undef"}},false],["seats",{"t":"arr","of":{"t":"undef"}},false],["minyanim",{"t":"arr","of":{"t":"undef"}},false],["yahrzeits",{"t":"arr","of":{"t":"undef"}},false],["queue",{"t":"arr","of":{"t":"undef"}},false],["loans",{"t":"arr","of":{"t":"undef"}},false],["routes",{"t":"arr","of":{"t":"undef"}},false],["calls",{"t":"arr","of":{"t":"undef"}},false],["proposals",{"t":"arr","of":{"t":"undef"}},false],["groups",{"t":"arr","of":{"t":"undef"}},false],["messages",{"t":"arr","of":{"t":"undef"}},false],["log",{"t":"arr","of":{"t":"undef"}},false]]},"opt":false},{"name":"classId","d":{"t":"any"},"opt":false}],
  inner$attendanceOf$days: [{"name":"DB","d":{"t":"obj","p":[["tariff",{"t":"obj","p":[["tuition",{"t":"num"},false],["bus",{"t":"num"},false],["books",{"t":"num"},false],["year",{"t":"str"},false]]},false],["hmonths",{"t":"arr","of":{"t":"str"}},false],["today",{"t":"obj","p":[["hd",{"t":"str"},false],["hy",{"t":"str"},false],["dow",{"t":"str"},false]]},false],["people",{"t":"arr","of":{"t":"undef"}},false],["families",{"t":"arr","of":{"t":"undef"}},false],["students",{"t":"arr","of":{"t":"undef"}},false],["classes",{"t":"arr","of":{"t":"undef"}},false],["staff",{"t":"arr","of":{"t":"undef"}},false],["payments",{"t":"arr","of":{"t":"undef"}},false],["donors",{"t":"arr","of":{"t":"undef"}},false],["donations",{"t":"arr","of":{"t":"undef"}},false],["campaigns",{"t":"arr","of":{"t":"undef"}},false],["budget",{"t":"arr","of":{"t":"undef"}},false],["seats",{"t":"arr","of":{"t":"undef"}},false],["minyanim",{"t":"arr","of":{"t":"undef"}},false],["yahrzeits",{"t":"arr","of":{"t":"undef"}},false],["queue",{"t":"arr","of":{"t":"undef"}},false],["loans",{"t":"arr","of":{"t":"undef"}},false],["routes",{"t":"arr","of":{"t":"undef"}},false],["calls",{"t":"arr","of":{"t":"undef"}},false],["proposals",{"t":"arr","of":{"t":"undef"}},false],["groups",{"t":"arr","of":{"t":"undef"}},false],["messages",{"t":"arr","of":{"t":"undef"}},false],["log",{"t":"arr","of":{"t":"undef"}},false]]},"opt":false},{"name":"classId","d":{"t":"any"},"opt":false}],
  inner$attendanceOf$days$$step: [{"name":"ss","d":{"t":"arr","of":{"t":"any"}},"opt":false}],
  inner$undoLast$e: [{"name":"DB","d":{"t":"obj","p":[["tariff",{"t":"obj","p":[["tuition",{"t":"num"},false],["bus",{"t":"num"},false],["books",{"t":"num"},false],["year",{"t":"str"},false]]},false],["hmonths",{"t":"arr","of":{"t":"str"}},false],["today",{"t":"obj","p":[["hd",{"t":"str"},false],["hy",{"t":"str"},false],["dow",{"t":"str"},false]]},false],["people",{"t":"arr","of":{"t":"undef"}},false],["families",{"t":"arr","of":{"t":"undef"}},false],["students",{"t":"arr","of":{"t":"undef"}},false],["classes",{"t":"arr","of":{"t":"undef"}},false],["staff",{"t":"arr","of":{"t":"undef"}},false],["payments",{"t":"arr","of":{"t":"undef"}},false],["donors",{"t":"arr","of":{"t":"undef"}},false],["donations",{"t":"arr","of":{"t":"undef"}},false],["campaigns",{"t":"arr","of":{"t":"undef"}},false],["budget",{"t":"arr","of":{"t":"undef"}},false],["seats",{"t":"arr","of":{"t":"undef"}},false],["minyanim",{"t":"arr","of":{"t":"undef"}},false],["yahrzeits",{"t":"arr","of":{"t":"undef"}},false],["queue",{"t":"arr","of":{"t":"undef"}},false],["loans",{"t":"arr","of":{"t":"undef"}},false],["routes",{"t":"arr","of":{"t":"undef"}},false],["calls",{"t":"arr","of":{"t":"undef"}},false],["proposals",{"t":"arr","of":{"t":"undef"}},false],["groups",{"t":"arr","of":{"t":"undef"}},false],["messages",{"t":"arr","of":{"t":"undef"}},false],["log",{"t":"arr","of":{"t":"undef"}},false]]},"opt":false},{"name":"u","d":{"t":"any"},"opt":false}],
};
