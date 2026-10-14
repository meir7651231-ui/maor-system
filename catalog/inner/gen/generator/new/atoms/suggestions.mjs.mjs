// 🔓 נוצר אוטומטית ע"י catalog/inner/scripts/open.mjs מתוך generator:new/atoms/suggestions.mjs — לא לערוך ביד.
// כל פונקציה כאן = ערך-בדרך שהורם מתוך פונקציה גדולה יותר; טהורה, בלי I/O. SIGS = צורת הקלטים לקורא-ההתנהגות.
export function inner$suggestions$activeFams(db, T2) {
    const activeFams = db.families.filter((f) => f.status === T2.k1);
    return activeFams;
}
export function inner$suggestions$rem(e) {
    const rem = e.purchased - e.used;
    return rem;
}
export function inner$suggestions$course(db, e) {
    const course = db.courses.find((c) => c.id === e.courseId);
    return course;
}
export function inner$suggestions$fam(db, e) {
    const fam = db.families.find((f) => f.members.some((m) => m.id === e.memberId));
    return fam;
}
export function inner$suggestions$member(db, e) {
    const fam = db.families.find((f) => f.members.some((m) => m.id === e.memberId));
    const member = fam?.members.find((m) => m.id === e.memberId);
    return member;
}
export function inner$suggestions$member$$step(e, fam) {
    const member = fam?.members.find((m) => m.id === e.memberId);
    return member;
}

export const SIGS = {
  inner$suggestions$activeFams: [{"name":"db","d":{"t":"any"},"opt":false},{"name":"T2","d":{"t":"any"},"opt":false}],
  inner$suggestions$rem: [{"name":"e","d":{"t":"any"},"opt":false}],
  inner$suggestions$course: [{"name":"db","d":{"t":"any"},"opt":false},{"name":"e","d":{"t":"any"},"opt":false}],
  inner$suggestions$fam: [{"name":"db","d":{"t":"any"},"opt":false},{"name":"e","d":{"t":"any"},"opt":false}],
  inner$suggestions$member: [{"name":"db","d":{"t":"any"},"opt":false},{"name":"e","d":{"t":"any"},"opt":false}],
  inner$suggestions$member$$step: [{"name":"e","d":{"t":"any"},"opt":false},{"name":"fam","d":{"t":"any"},"opt":false}],
};
