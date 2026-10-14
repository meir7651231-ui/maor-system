// 🔓 נוצר אוטומטית ע"י catalog/inner/scripts/open.mjs מתוך generator:new/atoms/build-reenroll-rows.mjs — לא לערוך ביד.
// כל פונקציה כאן = ערך-בדרך שהורם מתוך פונקציה גדולה יותר; טהורה, בלי I/O. SIGS = צורת הקלטים לקורא-ההתנהגות.
export function inner$buildReenrollRows$includeRenewed(filter) {
    const includeRenewed = filter.includeRenewed !== false;
    return includeRenewed;
}
export function inner$buildReenrollRows$q(filter) {
    const q = (filter.q ?? '').trim();
    return q;
}
export function inner$buildReenrollRows$course(db, e) {
    const course = db.courses.find((c) => c.id === e.courseId) ?? null;
    return course;
}
export function inner$buildReenrollRows$hay(db, e, member, family) {
    const course = db.courses.find((c) => c.id === e.courseId) ?? null;
    const memberName = member?.first ?? '';
    const courseName = course?.name ?? '';
    const hay = `${memberName} ${family} ${courseName}`;
    return hay;
}
export function inner$buildReenrollRows$hay$$step(family, memberName, courseName) {
    const hay = `${memberName} ${family} ${courseName}`;
    return hay;
}
export function inner$buildReenrollRows$words(filter) {
    const q = (filter.q ?? '').trim();
    const words = q.split(/\s+/).filter(Boolean);
    return words;
}
export function inner$buildReenrollRows$words$$step(q) {
    const words = q.split(/\s+/).filter(Boolean);
    return words;
}

export const SIGS = {
  inner$buildReenrollRows$includeRenewed: [{"name":"filter","d":{"t":"any"},"opt":false}],
  inner$buildReenrollRows$q: [{"name":"filter","d":{"t":"any"},"opt":false}],
  inner$buildReenrollRows$course: [{"name":"db","d":{"t":"any"},"opt":false},{"name":"e","d":{"t":"any"},"opt":false}],
  inner$buildReenrollRows$hay: [{"name":"db","d":{"t":"any"},"opt":false},{"name":"e","d":{"t":"any"},"opt":false},{"name":"member","d":{"t":"any"},"opt":false},{"name":"family","d":{"t":"any"},"opt":false}],
  inner$buildReenrollRows$hay$$step: [{"name":"family","d":{"t":"any"},"opt":false},{"name":"memberName","d":{"t":"any"},"opt":false},{"name":"courseName","d":{"t":"any"},"opt":false}],
  inner$buildReenrollRows$words: [{"name":"filter","d":{"t":"any"},"opt":false}],
  inner$buildReenrollRows$words$$step: [{"name":"q","d":{"t":"any"},"opt":false}],
};
