// 🔓 נוצר אוטומטית ע"י catalog/inner/scripts/open.mjs מתוך generator:new/atoms/fam-enrollments.mjs — לא לערוך ביד.
// כל פונקציה כאן = ערך-בדרך שהורם מתוך פונקציה גדולה יותר; טהורה, בלי I/O. SIGS = צורת הקלטים לקורא-ההתנהגות.
export function inner$famEnrollments$ids(fam) {
    const ids = new Set(fam.members.map((m) => m.id));
    return ids;
}

export const SIGS = {
  inner$famEnrollments$ids: [{"name":"fam","d":{"t":"any"},"opt":false}],
};
