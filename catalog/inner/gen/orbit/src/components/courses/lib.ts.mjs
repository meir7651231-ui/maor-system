// 🔓 נוצר אוטומטית ע"י catalog/inner/scripts/open.mjs מתוך orbit:src/components/courses/lib.ts — לא לערוך ביד.
// כל פונקציה כאן = ערך-בדרך שהורם מתוך פונקציה גדולה יותר; טהורה, בלי I/O. SIGS = צורת הקלטים לקורא-ההתנהגות.
function sessionsOf(c) {
    return c.sessions && c.sessions.length ? c.sessions : [{ day: c.weekday, time: c.time, label: '' }];
}
const toMin = (t) => {
    const [h, m] = t.split(':').map(Number);
    return (h || 0) * 60 + (m || 0);
};
function groupLabelOf(ss, i) {
    return ss.label || 'קבוצה ' + (i + 1);
}
function planWord(model) {
    return model === 'punch'
        ? 'כרטיסייה'
        : model === 'half_year'
            ? 'מנוי חצי-שנתי'
            : model === 'year'
                ? 'מנוי שנתי'
                : 'מנוי חודשי';
}
const WEEKS_PER_MONTH = 52 / 12;
function lessonsInTerm(freq, unit, term, months = 1) {
    const f = Math.max(0, Number.isFinite(freq) ? freq : 0);
    const perWeek = unit === 'week' ? f : f / WEEKS_PER_MONTH;
    const perMonth = unit === 'month' ? f : f * WEEKS_PER_MONTH;
    const n = Math.max(1, months || 1);
    switch (term) {
        case 'once':
            return 1;
        case 'weekly':
            return perWeek;
        case 'biweekly':
            return perWeek * 2;
        case 'monthly':
            return perMonth;
        case 'months':
            return perMonth * n;
        case 'half_year':
            return perMonth * 6;
        case 'year':
            return perMonth * 12;
        default:
            return 0;
    }
}
function lessonPriceForTier(c, tier) {
    if (tier === '1' && c.lessonPrice1)
        return c.lessonPrice1;
    if (tier === '2' && c.lessonPrice2)
        return c.lessonPrice2;
    if (tier === '3' && c.lessonPrice3)
        return c.lessonPrice3;
    return c.lessonPrice || 0;
}
function paidOf(e) {
    return (e.payments || []).reduce((a, p) => a + (Number.isFinite(p.amount) ? p.amount : 0), 0);
}
function payBal(e) {
    return Math.max(0, (e.totalDue || 0) + (e.carryBalance || 0) - paidOf(e));
}
const GRADE_ORDER = ['גן', 'א', 'ב', 'ג', 'ד', 'ה', 'ו', 'ז', 'ח', 'ט', 'י', 'יא', 'יב'];
function gradeIndex(g) {
    const clean = (g || '').replace(/["'׳״]/g, '').replace(/^כיתה\s*/, '').trim();
    if (!clean)
        return -1;
    return GRADE_ORDER.indexOf(clean);
}
export function inner$fmtDate$y(iso) {
    const [y, m, d] = iso.slice(0, 10).split('-');
    return y;
}
export function inner$fmtDate$m(iso) {
    const [y, m, d] = iso.slice(0, 10).split('-');
    return m;
}
export function inner$fmtDate$d(iso) {
    const [y, m, d] = iso.slice(0, 10).split('-');
    return d;
}
export function inner$defaultCourseDates$d(today) {
    const d = new Date(today.slice(0, 10) + 'T12:00:00');
    return d;
}
export function inner$defaultCourseDates$startYear(y, m) {
    const startYear = m >= 7 ? y : y - 1;
    return startYear;
}
export function inner$presentsInMonth$ym(todayIso) {
    const ym = todayIso.slice(0, 7);
    return ym;
}
export function inner$ageOf$d(birth) {
    const d = new Date(birth.slice(0, 10) + 'T12:00:00');
    return d;
}
export function inner$ageOf$a(birth, n) {
    const d = new Date(birth.slice(0, 10) + 'T12:00:00');
    let a = n.getFullYear() - d.getFullYear();
    return a;
}
export function inner$ageOf$a$$step(d, n) {
    let a = n.getFullYear() - d.getFullYear();
    return a;
}
export function inner$ageOf$md(birth, n) {
    const d = new Date(birth.slice(0, 10) + 'T12:00:00');
    const md = n.getMonth() - d.getMonth();
    return md;
}
export function inner$ageOf$md$$step(d, n) {
    const md = n.getMonth() - d.getMonth();
    return md;
}
export function inner$groupsHintFromAudience$m(audience) {
    const m = (audience || '').match(/(\d+)\s*(?:קבוצות|פעמים)/);
    return m;
}
export function inner$groupsHintFromAudience$n(audience) {
    const m = (audience || '').match(/(\d+)\s*(?:קבוצות|פעמים)/);
    const n = parseInt(m[1], 10);
    return n;
}
export function inner$groupsHintFromAudience$n$$step(m) {
    const n = parseInt(m[1], 10);
    return n;
}
export function inner$roomsNow$day(now) {
    const day = now.getDay();
    return day;
}
export function inner$roomsNow$mins(now) {
    const mins = now.getHours() * 60 + now.getMinutes();
    return mins;
}
export function inner$roomsNow$toMin$h(t) {
    const [h, m] = t.split(':').map(Number);
    return h;
}
export function inner$roomsNow$toMin$m(t) {
    const [h, m] = t.split(':').map(Number);
    return m;
}
export function inner$roomsNow$map$start(s) {
    const start = toMin(s.time);
    return start;
}
export function inner$groupRemapOnRemoval$removed(sessions, removeIdx) {
    const removed = groupLabelOf(sessions[removeIdx], removeIdx);
    return removed;
}
export function inner$groupRemapOnRemoval$k(removeIdx) {
    let k = removeIdx + 1;
    return k;
}
export function inner$groupRemapOnRemoval$oldLabel(sessions, k) {
    const oldLabel = groupLabelOf(sessions[k], k);
    return oldLabel;
}
export function inner$groupRemapOnRemoval$newLabel(sessions, k) {
    const newLabel = groupLabelOf(sessions[k], k - 1);
    return newLabel;
}
export function inner$groupOptionsOf$ss(c) {
    const ss = sessionsOf(c);
    return ss;
}
export function inner$groupOptionsOf$map$v(s, i) {
    const v = groupLabelOf(s, i);
    return v;
}
export function inner$lessonsInTerm$f(freq) {
    const f = Math.max(0, Number.isFinite(freq) ? freq : 0);
    return f;
}
export function inner$lessonsInTerm$perWeek(freq, unit) {
    const f = Math.max(0, Number.isFinite(freq) ? freq : 0);
    const perWeek = unit === 'week' ? f : f / WEEKS_PER_MONTH;
    return perWeek;
}
export function inner$lessonsInTerm$perWeek$$step(unit, f) {
    const perWeek = unit === 'week' ? f : f / WEEKS_PER_MONTH;
    return perWeek;
}
export function inner$lessonsInTerm$perMonth(freq, unit) {
    const f = Math.max(0, Number.isFinite(freq) ? freq : 0);
    const perMonth = unit === 'month' ? f : f * WEEKS_PER_MONTH;
    return perMonth;
}
export function inner$lessonsInTerm$perMonth$$step(unit, f) {
    const perMonth = unit === 'month' ? f : f * WEEKS_PER_MONTH;
    return perMonth;
}
export function inner$lessonsInTerm$n(months) {
    const n = Math.max(1, months || 1);
    return n;
}
export function inner$lessonTierOptions$out(c) {
    const out = [{ v: '', t: 'מחיר מלא · ₪' + (c.lessonPrice || 0) }];
    return out;
}
export function inner$weightedQuote$perLesson(c, opts) {
    const perLesson = lessonPriceForTier(c, opts.tier);
    return perLesson;
}
export function inner$weightedQuote$raw(opts) {
    const raw = lessonsInTerm(opts.freq, opts.unit, opts.term, opts.months);
    return raw;
}
export function inner$nextSessionDate$t(ss) {
    const t = (ss.time || '17:00').split(':');
    return t;
}
export function inner$nextSessionDate$d(n, ss) {
    const t = (ss.time || '17:00').split(':');
    const d = new Date(n.getFullYear(), n.getMonth(), n.getDate(), +t[0], +(t[1] ?? 0) || 0);
    return d;
}
export function inner$nextSessionDate$d$$step(n, t) {
    const d = new Date(n.getFullYear(), n.getMonth(), n.getDate(), +t[0], +(t[1] ?? 0) || 0);
    return d;
}
export function inner$nextSessionDate$add(n, ss) {
    const t = (ss.time || '17:00').split(':');
    const d = new Date(n.getFullYear(), n.getMonth(), n.getDate(), +t[0], +(t[1] ?? 0) || 0);
    let add = (ss.day - d.getDay() + 7) % 7;
    return add;
}
export function inner$nextSessionDate$add$$step(ss, d) {
    let add = (ss.day - d.getDay() + 7) % 7;
    return add;
}
export function inner$planLabelOf$s(e) {
    let s = e.plan === 'punch' ? 'כרטיסייה · ' + e.purchased : planWord(e.plan);
    return s;
}
export function inner$planLabelOf$bal(e) {
    const bal = payBal(e);
    return bal;
}
export function inner$gradeIndex$clean(g) {
    const clean = (g || '').replace(/["'׳״]/g, '').replace(/^כיתה\s*/, '').trim();
    return clean;
}
export function inner$gradeFits$gi(childGrade) {
    const gi = gradeIndex(childGrade);
    return gi;
}
export function inner$gradeFits$lo(c) {
    const lo = gradeIndex(c.gradeMin);
    return lo;
}
export function inner$gradeFits$hi(c) {
    const hi = gradeIndex(c.gradeMax);
    return hi;
}
export function inner$scheduleClashText$target(course) {
    const target = sessionsOf(course);
    return target;
}
export function inner$scheduleClashText$other(db, e) {
    const other = db.courses.find((x) => x.id === e.courseId);
    return other;
}
export function inner$offerNewFamily$t(q) {
    const t = q.trim();
    return t;
}
export function inner$resolveEnrollFamily$existing(families, famSel) {
    const existing = families.find((f) => f.id === famSel);
    return existing;
}
export function inner$wheelIndexUnderPointer$step(n) {
    const step = 360 / n;
    return step;
}
export function inner$wheelIndexUnderPointer$off(rot) {
    const off = (((-rot) % 360) + 360) % 360;
    return off;
}
export function inner$roomsNow$map$busyWith$$after_loop(db, day, mins, room) {
    let busyWith;
    for (const c of db.courses) {
        if (c.roomId !== room.id)
            continue;
        for (const s of sessionsOf(c)) {
            if (s.day !== day || !s.time)
                continue;
            const start = toMin(s.time);
            if (mins >= start && mins < start + (room.slot || 60)) {
                busyWith = c;
                break;
            }
        }
        if (busyWith)
            break;
    }
    return busyWith;
}
export function inner$groupRemapOnRemoval$remap$$after_loop(sessions, removeIdx) {
    const remap = new Map();
    for (let k = removeIdx + 1; k < sessions.length; k++) {
        const oldLabel = groupLabelOf(sessions[k], k);
        const newLabel = groupLabelOf(sessions[k], k - 1);
        if (oldLabel !== newLabel)
            remap.set(oldLabel, newLabel);
    }
    return remap;
}

export const SIGS = {
  inner$fmtDate$y: [{"name":"iso","d":{"t":"str"},"opt":false}],
  inner$fmtDate$m: [{"name":"iso","d":{"t":"str"},"opt":false}],
  inner$fmtDate$d: [{"name":"iso","d":{"t":"str"},"opt":false}],
  inner$defaultCourseDates$d: [{"name":"today","d":{"t":"str"},"opt":false}],
  inner$defaultCourseDates$startYear: [{"name":"y","d":{"t":"num"},"opt":false},{"name":"m","d":{"t":"num"},"opt":false}],
  inner$presentsInMonth$ym: [{"name":"todayIso","d":{"t":"str"},"opt":false}],
  inner$ageOf$d: [{"name":"birth","d":{"t":"str"},"opt":false}],
  inner$ageOf$a: [{"name":"birth","d":{"t":"str"},"opt":false},{"name":"n","d":{"t":"date"},"opt":false}],
  inner$ageOf$a$$step: [{"name":"d","d":{"t":"date"},"opt":false},{"name":"n","d":{"t":"date"},"opt":false}],
  inner$ageOf$md: [{"name":"birth","d":{"t":"str"},"opt":false},{"name":"n","d":{"t":"date"},"opt":false}],
  inner$ageOf$md$$step: [{"name":"d","d":{"t":"date"},"opt":false},{"name":"n","d":{"t":"date"},"opt":false}],
  inner$groupsHintFromAudience$m: [{"name":"audience","d":{"t":"or","of":[{"t":"undef"},{"t":"str"}]},"opt":false}],
  inner$groupsHintFromAudience$n: [{"name":"audience","d":{"t":"or","of":[{"t":"undef"},{"t":"str"}]},"opt":false}],
  inner$groupsHintFromAudience$n$$step: [{"name":"m","d":{"t":"or","of":[{"t":"null"},{"t":"obj","n":"RegExpMatchArray","p":[["index",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true],["input",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["0",{"t":"str"},false],["groups",{"t":"or","of":[{"t":"undef"},{"t":"rec","of":{"t":"str"}}]},true],["indices",{"t":"or","of":[{"t":"undef"},{"t":"obj","n":"RegExpIndicesArray","p":[["groups",{"t":"or","of":[{"t":"undef"},{"t":"rec","of":{"t":"tup","of":[{"t":"num"},{"t":"num"}]}}]},true],["length",{"t":"num"},false],["toString",{"t":"fn"},false],["toLocaleString",{"t":"fn"},false],["pop",{"t":"fn"},false],["push",{"t":"fn"},false],["concat",{"t":"fn"},false],["join",{"t":"fn"},false],["reverse",{"t":"fn"},false],["shift",{"t":"fn"},false],["slice",{"t":"fn"},false],["sort",{"t":"fn"},false],["splice",{"t":"fn"},false],["unshift",{"t":"fn"},false],["indexOf",{"t":"fn"},false],["lastIndexOf",{"t":"fn"},false],["every",{"t":"fn"},false],["some",{"t":"fn"},false],["forEach",{"t":"fn"},false],["map",{"t":"fn"},false],["filter",{"t":"fn"},false],["reduce",{"t":"fn"},false],["reduceRight",{"t":"fn"},false],["find",{"t":"fn"},false],["findIndex",{"t":"fn"},false],["fill",{"t":"fn"},false],["copyWithin",{"t":"fn"},false],["entries",{"t":"fn"},false],["keys",{"t":"fn"},false],["values",{"t":"fn"},false],["includes",{"t":"fn"},false],["flatMap",{"t":"fn"},false],["flat",{"t":"fn"},false],["at",{"t":"fn"},false]]}]},true],["length",{"t":"num"},false],["toString",{"t":"fn"},false],["toLocaleString",{"t":"fn"},false],["pop",{"t":"fn"},false],["push",{"t":"fn"},false],["concat",{"t":"fn"},false],["join",{"t":"fn"},false],["reverse",{"t":"fn"},false],["shift",{"t":"fn"},false],["slice",{"t":"fn"},false],["sort",{"t":"fn"},false],["splice",{"t":"fn"},false],["unshift",{"t":"fn"},false],["indexOf",{"t":"fn"},false],["lastIndexOf",{"t":"fn"},false],["every",{"t":"fn"},false],["some",{"t":"fn"},false],["forEach",{"t":"fn"},false],["map",{"t":"fn"},false],["filter",{"t":"fn"},false],["reduce",{"t":"fn"},false],["reduceRight",{"t":"fn"},false],["find",{"t":"fn"},false],["findIndex",{"t":"fn"},false],["fill",{"t":"fn"},false],["copyWithin",{"t":"fn"},false],["entries",{"t":"fn"},false],["keys",{"t":"fn"},false],["values",{"t":"fn"},false],["includes",{"t":"fn"},false],["flatMap",{"t":"fn"},false],["flat",{"t":"fn"},false],["at",{"t":"fn"},false]]}]},"opt":false}],
  inner$roomsNow$day: [{"name":"now","d":{"t":"date"},"opt":false}],
  inner$roomsNow$mins: [{"name":"now","d":{"t":"date"},"opt":false}],
  inner$roomsNow$toMin$h: [{"name":"t","d":{"t":"str"},"opt":false}],
  inner$roomsNow$toMin$m: [{"name":"t","d":{"t":"str"},"opt":false}],
  inner$roomsNow$map$start: [{"name":"s","d":{"t":"obj","n":"CourseSession","p":[["day",{"t":"lit","v":[0,1,2,3,4,5]},false],["time",{"t":"str"},false],["label",{"t":"str"},false]]},"opt":false}],
  inner$groupRemapOnRemoval$removed: [{"name":"sessions","d":{"t":"arr","of":{"t":"obj","n":"CourseSession","p":[["day",{"t":"lit","v":[0,1,2,3,4,5]},false],["time",{"t":"str"},false],["label",{"t":"str"},false]]}},"opt":false},{"name":"removeIdx","d":{"t":"num"},"opt":false}],
  inner$groupRemapOnRemoval$k: [{"name":"removeIdx","d":{"t":"num"},"opt":false}],
  inner$groupRemapOnRemoval$oldLabel: [{"name":"sessions","d":{"t":"arr","of":{"t":"obj","n":"CourseSession","p":[["day",{"t":"lit","v":[0,1,2,3,4,5]},false],["time",{"t":"str"},false],["label",{"t":"str"},false]]}},"opt":false},{"name":"k","d":{"t":"num"},"opt":false}],
  inner$groupRemapOnRemoval$newLabel: [{"name":"sessions","d":{"t":"arr","of":{"t":"obj","n":"CourseSession","p":[["day",{"t":"lit","v":[0,1,2,3,4,5]},false],["time",{"t":"str"},false],["label",{"t":"str"},false]]}},"opt":false},{"name":"k","d":{"t":"num"},"opt":false}],
  inner$groupOptionsOf$ss: [{"name":"c","d":{"t":"obj","n":"Course","p":[["id",{"t":"str"},false],["name",{"t":"str"},false],["teacherId",{"t":"str"},false],["roomId",{"t":"str"},false],["description",{"t":"str"},false],["price",{"t":"num"},false],["price1",{"t":"num"},false],["price2",{"t":"num"},false],["price1Name",{"t":"str"},false],["price2Name",{"t":"str"},false],["price3",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true],["price3Name",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["model",{"t":"lit","v":["punch","monthly","half_year","year"]},false],["size",{"t":"num"},false],["start",{"t":"str"},false],["end",{"t":"str"},false],["weekday",{"t":"lit","v":[0,1,2,3,4,5]},false],["time",{"t":"str"},false],["maxStudents",{"t":"num"},false],["gender",{"t":"lit","v":["m","f","all"]},false],["ageMin",{"t":"num"},false],["ageMax",{"t":"num"},false],["cat",{"t":"str"},false],["semester",{"t":"str"},false],["sector",{"t":"str"},false],["audience",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["img",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["gradeMin",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["gradeMax",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["sessions",{"t":"arr","of":{"t":"obj","n":"CourseSession","p":[["day",{"t":"lit","v":[0,1,2,3,4,5]},false],["time",{"t":"str"},false],["label",{"t":"str"},false]]}},false],["notes",{"t":"str"},false],["files",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"obj","n":"CourseFile","p":[["id",{"t":"str"},false],["name",{"t":"str"},false],["kind",{"t":"lit","v":["link","image","file"]},false],["data",{"t":"str"},false],["mime",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["size",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true]]}}]},true],["perLesson",{"t":"or","of":[{"t":"bool"},{"t":"undef"}]},true],["lessonPrice",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true],["lessonPrice1",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true],["lessonPrice2",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true],["lessonPrice3",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true],["year",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["prevYearId",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true]]},"opt":false}],
  inner$groupOptionsOf$map$v: [{"name":"s","d":{"t":"obj","n":"CourseSession","p":[["day",{"t":"lit","v":[0,1,2,3,4,5]},false],["time",{"t":"str"},false],["label",{"t":"str"},false]]},"opt":false},{"name":"i","d":{"t":"num"},"opt":false}],
  inner$lessonsInTerm$f: [{"name":"freq","d":{"t":"num"},"opt":false}],
  inner$lessonsInTerm$perWeek: [{"name":"freq","d":{"t":"num"},"opt":false},{"name":"unit","d":{"t":"lit","v":["week","month"]},"opt":false}],
  inner$lessonsInTerm$perWeek$$step: [{"name":"unit","d":{"t":"lit","v":["week","month"]},"opt":false},{"name":"f","d":{"t":"num"},"opt":false}],
  inner$lessonsInTerm$perMonth: [{"name":"freq","d":{"t":"num"},"opt":false},{"name":"unit","d":{"t":"lit","v":["week","month"]},"opt":false}],
  inner$lessonsInTerm$perMonth$$step: [{"name":"unit","d":{"t":"lit","v":["week","month"]},"opt":false},{"name":"f","d":{"t":"num"},"opt":false}],
  inner$lessonsInTerm$n: [{"name":"months","d":{"t":"num"},"opt":false}],
  inner$lessonTierOptions$out: [{"name":"c","d":{"t":"obj","n":"Course","p":[["id",{"t":"str"},false],["name",{"t":"str"},false],["teacherId",{"t":"str"},false],["roomId",{"t":"str"},false],["description",{"t":"str"},false],["price",{"t":"num"},false],["price1",{"t":"num"},false],["price2",{"t":"num"},false],["price1Name",{"t":"str"},false],["price2Name",{"t":"str"},false],["price3",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true],["price3Name",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["model",{"t":"lit","v":["punch","monthly","half_year","year"]},false],["size",{"t":"num"},false],["start",{"t":"str"},false],["end",{"t":"str"},false],["weekday",{"t":"lit","v":[0,1,2,3,4,5]},false],["time",{"t":"str"},false],["maxStudents",{"t":"num"},false],["gender",{"t":"lit","v":["m","f","all"]},false],["ageMin",{"t":"num"},false],["ageMax",{"t":"num"},false],["cat",{"t":"str"},false],["semester",{"t":"str"},false],["sector",{"t":"str"},false],["audience",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["img",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["gradeMin",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["gradeMax",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["sessions",{"t":"arr","of":{"t":"obj","n":"CourseSession","p":[["day",{"t":"lit","v":[0,1,2,3,4,5]},false],["time",{"t":"str"},false],["label",{"t":"str"},false]]}},false],["notes",{"t":"str"},false],["files",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"obj","n":"CourseFile","p":[["id",{"t":"str"},false],["name",{"t":"str"},false],["kind",{"t":"lit","v":["link","image","file"]},false],["data",{"t":"str"},false],["mime",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["size",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true]]}}]},true],["perLesson",{"t":"or","of":[{"t":"bool"},{"t":"undef"}]},true],["lessonPrice",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true],["lessonPrice1",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true],["lessonPrice2",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true],["lessonPrice3",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true],["year",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["prevYearId",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true]]},"opt":false}],
  inner$weightedQuote$perLesson: [{"name":"c","d":{"t":"obj","n":"Course","p":[["id",{"t":"str"},false],["name",{"t":"str"},false],["teacherId",{"t":"str"},false],["roomId",{"t":"str"},false],["description",{"t":"str"},false],["price",{"t":"num"},false],["price1",{"t":"num"},false],["price2",{"t":"num"},false],["price1Name",{"t":"str"},false],["price2Name",{"t":"str"},false],["price3",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true],["price3Name",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["model",{"t":"lit","v":["punch","monthly","half_year","year"]},false],["size",{"t":"num"},false],["start",{"t":"str"},false],["end",{"t":"str"},false],["weekday",{"t":"lit","v":[0,1,2,3,4,5]},false],["time",{"t":"str"},false],["maxStudents",{"t":"num"},false],["gender",{"t":"lit","v":["m","f","all"]},false],["ageMin",{"t":"num"},false],["ageMax",{"t":"num"},false],["cat",{"t":"str"},false],["semester",{"t":"str"},false],["sector",{"t":"str"},false],["audience",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["img",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["gradeMin",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["gradeMax",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["sessions",{"t":"arr","of":{"t":"obj","n":"CourseSession","p":[["day",{"t":"lit","v":[0,1,2,3,4,5]},false],["time",{"t":"str"},false],["label",{"t":"str"},false]]}},false],["notes",{"t":"str"},false],["files",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"obj","n":"CourseFile","p":[["id",{"t":"str"},false],["name",{"t":"str"},false],["kind",{"t":"lit","v":["link","image","file"]},false],["data",{"t":"str"},false],["mime",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["size",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true]]}}]},true],["perLesson",{"t":"or","of":[{"t":"bool"},{"t":"undef"}]},true],["lessonPrice",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true],["lessonPrice1",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true],["lessonPrice2",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true],["lessonPrice3",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true],["year",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["prevYearId",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true]]},"opt":false},{"name":"opts","d":{"t":"obj","p":[["freq",{"t":"num"},false],["unit",{"t":"lit","v":["week","month"]},false],["term",{"t":"lit","v":["weekly","monthly","half_year","year","once","biweekly","months"]},false],["months",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true],["tier",{"t":"lit","v":["","1","2","3"]},false]]},"opt":false}],
  inner$weightedQuote$raw: [{"name":"opts","d":{"t":"obj","p":[["freq",{"t":"num"},false],["unit",{"t":"lit","v":["week","month"]},false],["term",{"t":"lit","v":["weekly","monthly","half_year","year","once","biweekly","months"]},false],["months",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true],["tier",{"t":"lit","v":["","1","2","3"]},false]]},"opt":false}],
  inner$nextSessionDate$t: [{"name":"ss","d":{"t":"obj","n":"CourseSession","p":[["day",{"t":"lit","v":[0,1,2,3,4,5]},false],["time",{"t":"str"},false],["label",{"t":"str"},false]]},"opt":false}],
  inner$nextSessionDate$d: [{"name":"n","d":{"t":"date"},"opt":false},{"name":"ss","d":{"t":"obj","n":"CourseSession","p":[["day",{"t":"lit","v":[0,1,2,3,4,5]},false],["time",{"t":"str"},false],["label",{"t":"str"},false]]},"opt":false}],
  inner$nextSessionDate$d$$step: [{"name":"n","d":{"t":"date"},"opt":false},{"name":"t","d":{"t":"arr","of":{"t":"str"}},"opt":false}],
  inner$nextSessionDate$add: [{"name":"n","d":{"t":"date"},"opt":false},{"name":"ss","d":{"t":"obj","n":"CourseSession","p":[["day",{"t":"lit","v":[0,1,2,3,4,5]},false],["time",{"t":"str"},false],["label",{"t":"str"},false]]},"opt":false}],
  inner$nextSessionDate$add$$step: [{"name":"ss","d":{"t":"obj","n":"CourseSession","p":[["day",{"t":"lit","v":[0,1,2,3,4,5]},false],["time",{"t":"str"},false],["label",{"t":"str"},false]]},"opt":false},{"name":"d","d":{"t":"date"},"opt":false}],
  inner$planLabelOf$s: [{"name":"e","d":{"t":"obj","n":"Enrollment","p":[["id",{"t":"str"},false],["memberId",{"t":"str"},false],["courseId",{"t":"str"},false],["plan",{"t":"lit","v":["punch","monthly","half_year","year"]},false],["purchased",{"t":"num"},false],["used",{"t":"num"},false],["group",{"t":"str"},false],["absences",{"t":"arr","of":{"t":"obj","n":"Absence","p":[["date",{"t":"str"},false],["reason",{"t":"str"},false],["makeup",{"t":"or","of":[{"t":"bool"},{"t":"undef"}]},true],["makeupDate",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["noshow",{"t":"or","of":[{"t":"bool"},{"t":"undef"}]},true],["justified",{"t":"or","of":[{"t":"bool"},{"t":"undef"}]},true]]}},false],["presents",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"str"}}]},true],["payments",{"t":"arr","of":{"t":"obj","n":"Payment","p":[["rid",{"t":"str"},false],["date",{"t":"str"},false],["amount",{"t":"num"},false],["method",{"t":"str"},false]]}},false],["totalDue",{"t":"num"},false],["dueDate",{"t":"str"},false],["dueEventId",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["status",{"t":"lit","v":["active","paused","ended","wait"]},false],["note",{"t":"str"},false],["enrolledAt",{"t":"str"},false],["endedAt",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["paidFull",{"t":"or","of":[{"t":"bool"},{"t":"undef"}]},true],["freq",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true],["freqUnit",{"t":"or","of":[{"t":"lit","v":["week","month"]},{"t":"undef"}]},true],["term",{"t":"or","of":[{"t":"lit","v":["weekly","monthly","half_year","year","once","biweekly","months"]},{"t":"undef"}]},true],["termMonths",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true],["tier",{"t":"or","of":[{"t":"lit","v":["","1","2","3"]},{"t":"undef"}]},true],["renew",{"t":"or","of":[{"t":"lit","v":["yes","no","hold"]},{"t":"undef"}]},true],["renewNote",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["renewedToId",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["year",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["plannedCharges",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"obj","n":"PlannedCharge","p":[["id",{"t":"str"},false],["date",{"t":"str"},false],["amount",{"t":"num"},false],["cur",{"t":"lit","v":["₪","$"]},false],["method",{"t":"str"},false],["cat",{"t":"str"},false],["installmentOf",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["chargedRid",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["cancelledAt",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["note",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["componentId",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["shopValue",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true],["shopHoliday",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true]]}}]},true],["carryBalance",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true]]},"opt":false}],
  inner$planLabelOf$bal: [{"name":"e","d":{"t":"obj","n":"Enrollment","p":[["id",{"t":"str"},false],["memberId",{"t":"str"},false],["courseId",{"t":"str"},false],["plan",{"t":"lit","v":["punch","monthly","half_year","year"]},false],["purchased",{"t":"num"},false],["used",{"t":"num"},false],["group",{"t":"str"},false],["absences",{"t":"arr","of":{"t":"obj","n":"Absence","p":[["date",{"t":"str"},false],["reason",{"t":"str"},false],["makeup",{"t":"or","of":[{"t":"bool"},{"t":"undef"}]},true],["makeupDate",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["noshow",{"t":"or","of":[{"t":"bool"},{"t":"undef"}]},true],["justified",{"t":"or","of":[{"t":"bool"},{"t":"undef"}]},true]]}},false],["presents",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"str"}}]},true],["payments",{"t":"arr","of":{"t":"obj","n":"Payment","p":[["rid",{"t":"str"},false],["date",{"t":"str"},false],["amount",{"t":"num"},false],["method",{"t":"str"},false]]}},false],["totalDue",{"t":"num"},false],["dueDate",{"t":"str"},false],["dueEventId",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["status",{"t":"lit","v":["active","paused","ended","wait"]},false],["note",{"t":"str"},false],["enrolledAt",{"t":"str"},false],["endedAt",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["paidFull",{"t":"or","of":[{"t":"bool"},{"t":"undef"}]},true],["freq",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true],["freqUnit",{"t":"or","of":[{"t":"lit","v":["week","month"]},{"t":"undef"}]},true],["term",{"t":"or","of":[{"t":"lit","v":["weekly","monthly","half_year","year","once","biweekly","months"]},{"t":"undef"}]},true],["termMonths",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true],["tier",{"t":"or","of":[{"t":"lit","v":["","1","2","3"]},{"t":"undef"}]},true],["renew",{"t":"or","of":[{"t":"lit","v":["yes","no","hold"]},{"t":"undef"}]},true],["renewNote",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["renewedToId",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["year",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["plannedCharges",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"obj","n":"PlannedCharge","p":[["id",{"t":"str"},false],["date",{"t":"str"},false],["amount",{"t":"num"},false],["cur",{"t":"lit","v":["₪","$"]},false],["method",{"t":"str"},false],["cat",{"t":"str"},false],["installmentOf",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["chargedRid",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["cancelledAt",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["note",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["componentId",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["shopValue",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true],["shopHoliday",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true]]}}]},true],["carryBalance",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true]]},"opt":false}],
  inner$gradeIndex$clean: [{"name":"g","d":{"t":"or","of":[{"t":"undef"},{"t":"str"}]},"opt":false}],
  inner$gradeFits$gi: [{"name":"childGrade","d":{"t":"or","of":[{"t":"undef"},{"t":"str"}]},"opt":false}],
  inner$gradeFits$lo: [{"name":"c","d":{"t":"obj","n":"Course","p":[["id",{"t":"str"},false],["name",{"t":"str"},false],["teacherId",{"t":"str"},false],["roomId",{"t":"str"},false],["description",{"t":"str"},false],["price",{"t":"num"},false],["price1",{"t":"num"},false],["price2",{"t":"num"},false],["price1Name",{"t":"str"},false],["price2Name",{"t":"str"},false],["price3",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true],["price3Name",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["model",{"t":"lit","v":["punch","monthly","half_year","year"]},false],["size",{"t":"num"},false],["start",{"t":"str"},false],["end",{"t":"str"},false],["weekday",{"t":"lit","v":[0,1,2,3,4,5]},false],["time",{"t":"str"},false],["maxStudents",{"t":"num"},false],["gender",{"t":"lit","v":["m","f","all"]},false],["ageMin",{"t":"num"},false],["ageMax",{"t":"num"},false],["cat",{"t":"str"},false],["semester",{"t":"str"},false],["sector",{"t":"str"},false],["audience",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["img",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["gradeMin",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["gradeMax",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["sessions",{"t":"arr","of":{"t":"obj","n":"CourseSession","p":[["day",{"t":"lit","v":[0,1,2,3,4,5]},false],["time",{"t":"str"},false],["label",{"t":"str"},false]]}},false],["notes",{"t":"str"},false],["files",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"obj","n":"CourseFile","p":[["id",{"t":"str"},false],["name",{"t":"str"},false],["kind",{"t":"lit","v":["link","image","file"]},false],["data",{"t":"str"},false],["mime",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["size",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true]]}}]},true],["perLesson",{"t":"or","of":[{"t":"bool"},{"t":"undef"}]},true],["lessonPrice",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true],["lessonPrice1",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true],["lessonPrice2",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true],["lessonPrice3",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true],["year",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["prevYearId",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true]]},"opt":false}],
  inner$gradeFits$hi: [{"name":"c","d":{"t":"obj","n":"Course","p":[["id",{"t":"str"},false],["name",{"t":"str"},false],["teacherId",{"t":"str"},false],["roomId",{"t":"str"},false],["description",{"t":"str"},false],["price",{"t":"num"},false],["price1",{"t":"num"},false],["price2",{"t":"num"},false],["price1Name",{"t":"str"},false],["price2Name",{"t":"str"},false],["price3",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true],["price3Name",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["model",{"t":"lit","v":["punch","monthly","half_year","year"]},false],["size",{"t":"num"},false],["start",{"t":"str"},false],["end",{"t":"str"},false],["weekday",{"t":"lit","v":[0,1,2,3,4,5]},false],["time",{"t":"str"},false],["maxStudents",{"t":"num"},false],["gender",{"t":"lit","v":["m","f","all"]},false],["ageMin",{"t":"num"},false],["ageMax",{"t":"num"},false],["cat",{"t":"str"},false],["semester",{"t":"str"},false],["sector",{"t":"str"},false],["audience",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["img",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["gradeMin",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["gradeMax",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["sessions",{"t":"arr","of":{"t":"obj","n":"CourseSession","p":[["day",{"t":"lit","v":[0,1,2,3,4,5]},false],["time",{"t":"str"},false],["label",{"t":"str"},false]]}},false],["notes",{"t":"str"},false],["files",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"obj","n":"CourseFile","p":[["id",{"t":"str"},false],["name",{"t":"str"},false],["kind",{"t":"lit","v":["link","image","file"]},false],["data",{"t":"str"},false],["mime",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["size",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true]]}}]},true],["perLesson",{"t":"or","of":[{"t":"bool"},{"t":"undef"}]},true],["lessonPrice",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true],["lessonPrice1",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true],["lessonPrice2",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true],["lessonPrice3",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true],["year",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["prevYearId",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true]]},"opt":false}],
  inner$scheduleClashText$target: [{"name":"course","d":{"t":"obj","n":"Course","p":[["id",{"t":"str"},false],["name",{"t":"str"},false],["teacherId",{"t":"str"},false],["roomId",{"t":"str"},false],["description",{"t":"str"},false],["price",{"t":"num"},false],["price1",{"t":"num"},false],["price2",{"t":"num"},false],["price1Name",{"t":"str"},false],["price2Name",{"t":"str"},false],["price3",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true],["price3Name",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["model",{"t":"lit","v":["punch","monthly","half_year","year"]},false],["size",{"t":"num"},false],["start",{"t":"str"},false],["end",{"t":"str"},false],["weekday",{"t":"lit","v":[0,1,2,3,4,5]},false],["time",{"t":"str"},false],["maxStudents",{"t":"num"},false],["gender",{"t":"lit","v":["m","f","all"]},false],["ageMin",{"t":"num"},false],["ageMax",{"t":"num"},false],["cat",{"t":"str"},false],["semester",{"t":"str"},false],["sector",{"t":"str"},false],["audience",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["img",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["gradeMin",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["gradeMax",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["sessions",{"t":"arr","of":{"t":"obj","n":"CourseSession","p":[["day",{"t":"lit","v":[0,1,2,3,4,5]},false],["time",{"t":"str"},false],["label",{"t":"str"},false]]}},false],["notes",{"t":"str"},false],["files",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"obj","n":"CourseFile","p":[["id",{"t":"str"},false],["name",{"t":"str"},false],["kind",{"t":"lit","v":["link","image","file"]},false],["data",{"t":"str"},false],["mime",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["size",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true]]}}]},true],["perLesson",{"t":"or","of":[{"t":"bool"},{"t":"undef"}]},true],["lessonPrice",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true],["lessonPrice1",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true],["lessonPrice2",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true],["lessonPrice3",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true],["year",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["prevYearId",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true]]},"opt":false}],
  inner$scheduleClashText$other: [{"name":"db","d":{"t":"obj","n":"Pick","p":[["courses",{"t":"arr","of":{"t":"obj","n":"Course","p":[["id",{"t":"str"},false],["name",{"t":"str"},false],["teacherId",{"t":"str"},false],["roomId",{"t":"str"},false],["description",{"t":"str"},false],["price",{"t":"num"},false],["price1",{"t":"num"},false],["price2",{"t":"num"},false],["price1Name",{"t":"str"},false],["price2Name",{"t":"str"},false],["price3",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true],["price3Name",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["model",{"t":"lit","v":["punch","monthly","half_year","year"]},false],["size",{"t":"num"},false],["start",{"t":"str"},false],["end",{"t":"str"},false],["weekday",{"t":"lit","v":[0,1,2,3,4,5]},false],["time",{"t":"str"},false],["maxStudents",{"t":"num"},false],["gender",{"t":"lit","v":["m","f","all"]},false],["ageMin",{"t":"num"},false],["ageMax",{"t":"num"},false],["cat",{"t":"str"},false],["semester",{"t":"str"},false],["sector",{"t":"str"},false],["audience",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["img",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["gradeMin",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["gradeMax",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["sessions",{"t":"arr","of":{"t":"obj","n":"CourseSession","p":[["day",{"t":"lit","v":[0,1,2,3,4,5]},false],["time",{"t":"str"},false],["label",{"t":"str"},false]]}},false],["notes",{"t":"str"},false],["files",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"obj","n":"CourseFile","p":[["id",{"t":"str"},false],["name",{"t":"str"},false],["kind",{"t":"lit","v":["link","image","file"]},false],["data",{"t":"str"},false],["mime",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["size",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true]]}}]},true],["perLesson",{"t":"or","of":[{"t":"bool"},{"t":"undef"}]},true],["lessonPrice",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true],["lessonPrice1",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true],["lessonPrice2",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true],["lessonPrice3",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true],["year",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["prevYearId",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true]]}},false],["enrollments",{"t":"arr","of":{"t":"obj","n":"Enrollment","p":[["id",{"t":"str"},false],["memberId",{"t":"str"},false],["courseId",{"t":"str"},false],["plan",{"t":"lit","v":["punch","monthly","half_year","year"]},false],["purchased",{"t":"num"},false],["used",{"t":"num"},false],["group",{"t":"str"},false],["absences",{"t":"arr","of":{"t":"obj","n":"Absence","p":[["date",{"t":"str"},false],["reason",{"t":"str"},false],["makeup",{"t":"or","of":[{"t":"bool"},{"t":"undef"}]},true],["makeupDate",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["noshow",{"t":"or","of":[{"t":"bool"},{"t":"undef"}]},true],["justified",{"t":"or","of":[{"t":"bool"},{"t":"undef"}]},true]]}},false],["presents",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"str"}}]},true],["payments",{"t":"arr","of":{"t":"obj","n":"Payment","p":[["rid",{"t":"str"},false],["date",{"t":"str"},false],["amount",{"t":"num"},false],["method",{"t":"str"},false]]}},false],["totalDue",{"t":"num"},false],["dueDate",{"t":"str"},false],["dueEventId",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["status",{"t":"lit","v":["active","paused","ended","wait"]},false],["note",{"t":"str"},false],["enrolledAt",{"t":"str"},false],["endedAt",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["paidFull",{"t":"or","of":[{"t":"bool"},{"t":"undef"}]},true],["freq",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true],["freqUnit",{"t":"or","of":[{"t":"lit","v":["week","month"]},{"t":"undef"}]},true],["term",{"t":"or","of":[{"t":"lit","v":["weekly","monthly","half_year","year","once","biweekly","months"]},{"t":"undef"}]},true],["termMonths",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true],["tier",{"t":"or","of":[{"t":"lit","v":["","1","2","3"]},{"t":"undef"}]},true],["renew",{"t":"or","of":[{"t":"lit","v":["yes","no","hold"]},{"t":"undef"}]},true],["renewNote",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["renewedToId",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["year",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["plannedCharges",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"obj","n":"PlannedCharge","p":[["id",{"t":"str"},false],["date",{"t":"str"},false],["amount",{"t":"num"},false],["cur",{"t":"lit","v":["₪","$"]},false],["method",{"t":"str"},false],["cat",{"t":"str"},false],["installmentOf",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["chargedRid",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["cancelledAt",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["note",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["componentId",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["shopValue",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true],["shopHoliday",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true]]}}]},true],["carryBalance",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true]]}},false]]},"opt":false},{"name":"e","d":{"t":"obj","n":"Enrollment","p":[["id",{"t":"str"},false],["memberId",{"t":"str"},false],["courseId",{"t":"str"},false],["plan",{"t":"lit","v":["punch","monthly","half_year","year"]},false],["purchased",{"t":"num"},false],["used",{"t":"num"},false],["group",{"t":"str"},false],["absences",{"t":"arr","of":{"t":"obj","n":"Absence","p":[["date",{"t":"str"},false],["reason",{"t":"str"},false],["makeup",{"t":"or","of":[{"t":"bool"},{"t":"undef"}]},true],["makeupDate",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["noshow",{"t":"or","of":[{"t":"bool"},{"t":"undef"}]},true],["justified",{"t":"or","of":[{"t":"bool"},{"t":"undef"}]},true]]}},false],["presents",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"str"}}]},true],["payments",{"t":"arr","of":{"t":"obj","n":"Payment","p":[["rid",{"t":"str"},false],["date",{"t":"str"},false],["amount",{"t":"num"},false],["method",{"t":"str"},false]]}},false],["totalDue",{"t":"num"},false],["dueDate",{"t":"str"},false],["dueEventId",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["status",{"t":"lit","v":["active","paused","ended","wait"]},false],["note",{"t":"str"},false],["enrolledAt",{"t":"str"},false],["endedAt",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["paidFull",{"t":"or","of":[{"t":"bool"},{"t":"undef"}]},true],["freq",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true],["freqUnit",{"t":"or","of":[{"t":"lit","v":["week","month"]},{"t":"undef"}]},true],["term",{"t":"or","of":[{"t":"lit","v":["weekly","monthly","half_year","year","once","biweekly","months"]},{"t":"undef"}]},true],["termMonths",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true],["tier",{"t":"or","of":[{"t":"lit","v":["","1","2","3"]},{"t":"undef"}]},true],["renew",{"t":"or","of":[{"t":"lit","v":["yes","no","hold"]},{"t":"undef"}]},true],["renewNote",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["renewedToId",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["year",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["plannedCharges",{"t":"or","of":[{"t":"undef"},{"t":"arr","of":{"t":"obj","n":"PlannedCharge","p":[["id",{"t":"str"},false],["date",{"t":"str"},false],["amount",{"t":"num"},false],["cur",{"t":"lit","v":["₪","$"]},false],["method",{"t":"str"},false],["cat",{"t":"str"},false],["installmentOf",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["chargedRid",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["cancelledAt",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["note",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["componentId",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["shopValue",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true],["shopHoliday",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true]]}}]},true],["carryBalance",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true]]},"opt":false}],
  inner$offerNewFamily$t: [{"name":"q","d":{"t":"str"},"opt":false}],
  inner$resolveEnrollFamily$existing: [{"name":"families","d":{"t":"arr","of":{"t":"tp","id":"F","of":{"t":"obj","n":"Pick","p":[["name",{"t":"str"},false],["id",{"t":"str"},false]]}}},"opt":false},{"name":"famSel","d":{"t":"str"},"opt":false}],
  inner$wheelIndexUnderPointer$step: [{"name":"n","d":{"t":"num"},"opt":false}],
  inner$wheelIndexUnderPointer$off: [{"name":"rot","d":{"t":"num"},"opt":false}],
  inner$roomsNow$map$busyWith$$after_loop: [{"name":"db","d":{"t":"obj","n":"Db","p":[["v",{"t":"num"},false],["savedAt",{"t":"str"},false],["seq",{"t":"num"},false],["receiptSeq",{"t":"num"},false],["donationSeq",{"t":"num"},false],["shopReceiptSeq",{"t":"num"},false],["families",{"t":"arr","of":{"t":"obj","n":"Family","p":[]}},false],["enrollments",{"t":"arr","of":{"t":"obj","n":"Enrollment","p":[]}},false],["courses",{"t":"arr","of":{"t":"obj","n":"Course","p":[]}},false],["events",{"t":"arr","of":{"t":"obj","n":"OrgEvent","p":[]}},false],["rooms",{"t":"arr","of":{"t":"obj","n":"Room","p":[]}},false],["teachers",{"t":"arr","of":{"t":"obj","n":"Teacher","p":[]}},false],["supporters",{"t":"arr","of":{"t":"obj","n":"Supporter","p":[]}},false],["tzCoordinators",{"t":"arr","of":{"t":"obj","n":"TzCoordinator","p":[]}},false],["tzBoxes",{"t":"arr","of":{"t":"obj","n":"TzBox","p":[]}},false],["tzCampaigns",{"t":"arr","of":{"t":"obj","n":"TzCampaign","p":[]}},false],["tzEvents",{"t":"arr","of":{"t":"obj","n":"TzEvent","p":[]}},false],["shopItems",{"t":"arr","of":{"t":"obj","n":"ShopItem","p":[]}},false],["shopProducts",{"t":"arr","of":{"t":"obj","n":"ShopProduct","p":[]}},false],["shopStores",{"t":"arr","of":{"t":"obj","n":"ShopStore","p":[]}},false],["shopCriteria",{"t":"arr","of":{"t":"obj","n":"ShopCriterion","p":[]}},false],["shopAssignments",{"t":"arr","of":{"t":"obj","n":"ShopAssignment","p":[]}},false],["shopEvents",{"t":"arr","of":{"t":"obj","n":"ShopEvent","p":[]}},false],["shopIntakes",{"t":"arr","of":{"t":"obj","n":"ShopIntake","p":[]}},false],["volunteers",{"t":"arr","of":{"t":"obj","n":"Volunteer","p":[]}},false],["distributionDays",{"t":"arr","of":{"t":"obj","n":"DistributionDay","p":[]}},false],["deliveries",{"t":"arr","of":{"t":"obj","n":"Delivery","p":[]}},false],["tasks",{"t":"arr","of":{"t":"obj","n":"WorkTask","p":[]}},false],["warehouse",{"t":"arr","of":{"t":"obj","n":"WarehouseItem","p":[]}},false],["prListings",{"t":"arr","of":{"t":"obj","n":"PrListing","p":[]}},false],["prRequests",{"t":"arr","of":{"t":"obj","n":"PrRequest","p":[]}},false],["prPosts",{"t":"arr","of":{"t":"obj","n":"PrPost","p":[]}},false],["prAds",{"t":"arr","of":{"t":"obj","n":"PrAd","p":[]}},false],["hostUnits",{"t":"arr","of":{"t":"obj","n":"HostUnit","p":[]}},false],["hostBookings",{"t":"arr","of":{"t":"obj","n":"HostBooking","p":[]}},false],["hostRecords",{"t":"arr","of":{"t":"any"}},false],["orgName",{"t":"str"},false],["orgSite",{"t":"str"},false],["orgDonate",{"t":"str"},false],["orgGoal",{"t":"num"},false]]},"opt":false},{"name":"day","d":{"t":"num"},"opt":false},{"name":"mins","d":{"t":"num"},"opt":false},{"name":"room","d":{"t":"obj","n":"Room","p":[["id",{"t":"str"},false],["name",{"t":"str"},false],["active",{"t":"bool"},false],["slot",{"t":"num"},false],["cap",{"t":"num"},false],["location",{"t":"str"},false],["rate",{"t":"num"},false],["from",{"t":"str"},false],["to",{"t":"str"},false],["access",{"t":"bool"},false],["notes",{"t":"str"},false],["eq",{"t":"rec","of":{"t":"bool"}},false]]},"opt":false}],
  inner$groupRemapOnRemoval$remap$$after_loop: [{"name":"sessions","d":{"t":"arr","of":{"t":"obj","n":"CourseSession","p":[["day",{"t":"lit","v":[0,1,2,3,4,5]},false],["time",{"t":"str"},false],["label",{"t":"str"},false]]}},"opt":false},{"name":"removeIdx","d":{"t":"num"},"opt":false}],
};
