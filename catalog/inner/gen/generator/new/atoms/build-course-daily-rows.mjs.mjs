// 🔓 נוצר אוטומטית ע"י catalog/inner/scripts/open.mjs מתוך generator:new/atoms/build-course-daily-rows.mjs — לא לערוך ביד.
// כל פונקציה כאן = ערך-בדרך שהורם מתוך פונקציה גדולה יותר; טהורה, בלי I/O. SIGS = צורת הקלטים לקורא-ההתנהגות.
export function inner$buildCourseDailyRows$fmtD$y(iso) {
    const [y, m, d] = iso.split('-');
    return y;
}
export function inner$buildCourseDailyRows$fmtD$m(iso) {
    const [y, m, d] = iso.split('-');
    return m;
}
export function inner$buildCourseDailyRows$fmtD$d(iso) {
    const [y, m, d] = iso.split('-');
    return d;
}
export function inner$buildCourseDailyRows$enrolls(c, db) {
    const enrolls = db.enrollments.filter((e) => e.courseId === c.id);
    return enrolls;
}
export function inner$buildCourseDailyRows$sessions(c) {
    const sessions = c.sessions && c.sessions.length ? c.sessions : [{ day: c.weekday, time: c.time, label: '' }];
    return sessions;
}
export function inner$buildCourseDailyRows$start(c) {
    const start = new Date(c.start + 'T12:00:00');
    return start;
}
export function inner$buildCourseDailyRows$end(c) {
    const end = new Date(c.end + 'T12:00:00');
    return end;
}
export function inner$buildCourseDailyRows$dow(c) {
    const start = new Date(c.start + 'T12:00:00');
    let d = new Date(start);
    const dow = d.getDay();
    return dow;
}
export function inner$buildCourseDailyRows$dow$$step(d) {
    const dow = d.getDay();
    return dow;
}
export function inner$buildCourseDailyRows$sess(c) {
    const sessions = c.sessions && c.sessions.length ? c.sessions : [{ day: c.weekday, time: c.time, label: '' }];
    const start = new Date(c.start + 'T12:00:00');
    let d = new Date(start);
    const dow = d.getDay();
    const sess = sessions.filter((ss) => ss.day === dow);
    return sess;
}
export function inner$buildCourseDailyRows$sess$$step(sessions, dow) {
    const sess = sessions.filter((ss) => ss.day === dow);
    return sess;
}
export function inner$buildCourseDailyRows$slot(T2, ss) {
    const slot = (ss.label || T2.k10) + ' · ' + (ss.time || '');
    return slot;
}
export function inner$buildCourseDailyRows$active(c, db, T2, iso, ss) {
    const enrolls = db.enrollments.filter((e) => e.courseId === c.id);
    const active = enrolls.filter((e) => e.status !== T2.k11 && // רשימת-המתנה לא בדוח-הנוכחות (עדיין לא לומד/ת)
        (!e.enrolledAt || e.enrolledAt <= iso) &&
        (!ss.label || !e.group || e.group === ss.label) &&
        (e.status !== T2.k12 || (!!e.endedAt && iso < e.endedAt)));
    return active;
}
export function inner$buildCourseDailyRows$active$$step(T2, enrolls, iso, ss) {
    const active = enrolls.filter((e) => e.status !== T2.k11 && // רשימת-המתנה לא בדוח-הנוכחות (עדיין לא לומד/ת)
        (!e.enrolledAt || e.enrolledAt <= iso) &&
        (!ss.label || !e.group || e.group === ss.label) &&
        (e.status !== T2.k12 || (!!e.endedAt && iso < e.endedAt)));
    return active;
}
export function inner$buildCourseDailyRows$mf(db, e) {
    const memberFam = new Map();
    for (const f of db.families)
        for (const m of f.members)
            memberFam.set(m.id, { first: m.first, famName: f.name });
    const mf = memberFam.get(e.memberId);
    return mf;
}
export function inner$buildCourseDailyRows$mf$$step(memberFam, e) {
    const mf = memberFam.get(e.memberId);
    return mf;
}
export function inner$buildCourseDailyRows$abs(iso, e) {
    const abs = e.absences.find((a) => a.date === iso);
    return abs;
}
export function inner$buildCourseDailyRows$dayStatus(T2, e) {
    const dayStatus = e.status === T2.k14 ? T2.k15 : T2.k16;
    return dayStatus;
}
export function inner$buildCourseDailyRows$attend(T2, iso, e) {
    const abs = e.absences.find((a) => a.date === iso);
    const attend = e.status === T2.k14
        ? T2.k15
        : abs
            ? abs.noshow
                ? T2.k17
                : T2.k18 + (abs.reason ? ' · ' + abs.reason : '')
            : T2.k19;
    return attend;
}
export function inner$buildCourseDailyRows$attend$$step(T2, e, abs) {
    const attend = e.status === T2.k14
        ? T2.k15
        : abs
            ? abs.noshow
                ? T2.k17
                : T2.k18 + (abs.reason ? ' · ' + abs.reason : '')
            : T2.k19;
    return attend;
}
export function inner$buildCourseDailyRows$memberFam$$after_loop(db) {
    const memberFam = new Map();
    for (const f of db.families)
        for (const m of f.members)
            memberFam.set(m.id, { first: m.first, famName: f.name });
    return memberFam;
}

export const SIGS = {
  inner$buildCourseDailyRows$fmtD$y: [{"name":"iso","d":{"t":"any"},"opt":false}],
  inner$buildCourseDailyRows$fmtD$m: [{"name":"iso","d":{"t":"any"},"opt":false}],
  inner$buildCourseDailyRows$fmtD$d: [{"name":"iso","d":{"t":"any"},"opt":false}],
  inner$buildCourseDailyRows$enrolls: [{"name":"c","d":{"t":"any"},"opt":false},{"name":"db","d":{"t":"any"},"opt":false}],
  inner$buildCourseDailyRows$sessions: [{"name":"c","d":{"t":"any"},"opt":false}],
  inner$buildCourseDailyRows$start: [{"name":"c","d":{"t":"any"},"opt":false}],
  inner$buildCourseDailyRows$end: [{"name":"c","d":{"t":"any"},"opt":false}],
  inner$buildCourseDailyRows$dow: [{"name":"c","d":{"t":"any"},"opt":false}],
  inner$buildCourseDailyRows$dow$$step: [{"name":"d","d":{"t":"date"},"opt":false}],
  inner$buildCourseDailyRows$sess: [{"name":"c","d":{"t":"any"},"opt":false}],
  inner$buildCourseDailyRows$sess$$step: [{"name":"sessions","d":{"t":"any"},"opt":false},{"name":"dow","d":{"t":"num"},"opt":false}],
  inner$buildCourseDailyRows$slot: [{"name":"T2","d":{"t":"any"},"opt":false},{"name":"ss","d":{"t":"any"},"opt":false}],
  inner$buildCourseDailyRows$active: [{"name":"c","d":{"t":"any"},"opt":false},{"name":"db","d":{"t":"any"},"opt":false},{"name":"T2","d":{"t":"any"},"opt":false},{"name":"iso","d":{"t":"str"},"opt":false},{"name":"ss","d":{"t":"any"},"opt":false}],
  inner$buildCourseDailyRows$active$$step: [{"name":"T2","d":{"t":"any"},"opt":false},{"name":"enrolls","d":{"t":"any"},"opt":false},{"name":"iso","d":{"t":"str"},"opt":false},{"name":"ss","d":{"t":"any"},"opt":false}],
  inner$buildCourseDailyRows$mf: [{"name":"db","d":{"t":"any"},"opt":false},{"name":"e","d":{"t":"any"},"opt":false}],
  inner$buildCourseDailyRows$mf$$step: [{"name":"memberFam","d":{"t":"map","k":{"t":"any"},"v":{"t":"any"}},"opt":false},{"name":"e","d":{"t":"any"},"opt":false}],
  inner$buildCourseDailyRows$abs: [{"name":"iso","d":{"t":"str"},"opt":false},{"name":"e","d":{"t":"any"},"opt":false}],
  inner$buildCourseDailyRows$dayStatus: [{"name":"T2","d":{"t":"any"},"opt":false},{"name":"e","d":{"t":"any"},"opt":false}],
  inner$buildCourseDailyRows$attend: [{"name":"T2","d":{"t":"any"},"opt":false},{"name":"iso","d":{"t":"str"},"opt":false},{"name":"e","d":{"t":"any"},"opt":false}],
  inner$buildCourseDailyRows$attend$$step: [{"name":"T2","d":{"t":"any"},"opt":false},{"name":"e","d":{"t":"any"},"opt":false},{"name":"abs","d":{"t":"any"},"opt":false}],
  inner$buildCourseDailyRows$memberFam$$after_loop: [{"name":"db","d":{"t":"any"},"opt":false}],
};
