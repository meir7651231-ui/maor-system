// 🔓 נוצר אוטומטית ע"י catalog/inner/scripts/open.mjs מתוך generator:new/atoms/fam-history-of.mjs — לא לערוך ביד.
// כל פונקציה כאן = ערך-בדרך שהורם מתוך פונקציה גדולה יותר; טהורה, בלי I/O. SIGS = צורת הקלטים לקורא-ההתנהגות.
export function inner$famHistoryOf$ids(fam) {
    const ids = new Set(fam.members.map((m) => m.id));
    return ids;
}
export function inner$famHistoryOf$first(fam, e) {
    const first = fam.members.find((x) => x.id === e.memberId)?.first ?? '';
    return first;
}
export function inner$famHistoryOf$cname(db, e) {
    const cname = db.courses.find((x) => x.id === e.courseId)?.name ?? '';
    return cname;
}

export const SIGS = {
  inner$famHistoryOf$ids: [{"name":"fam","d":{"t":"any"},"opt":false}],
  inner$famHistoryOf$first: [{"name":"fam","d":{"t":"any"},"opt":false},{"name":"e","d":{"t":"any"},"opt":false}],
  inner$famHistoryOf$cname: [{"name":"db","d":{"t":"any"},"opt":false},{"name":"e","d":{"t":"any"},"opt":false}],
};
