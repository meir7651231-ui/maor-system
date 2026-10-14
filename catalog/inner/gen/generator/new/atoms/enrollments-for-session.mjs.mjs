// 🔓 נוצר אוטומטית ע"י catalog/inner/scripts/open.mjs מתוך generator:new/atoms/enrollments-for-session.mjs — לא לערוך ביד.
// כל פונקציה כאן = ערך-בדרך שהורם מתוך פונקציה גדולה יותר; טהורה, בלי I/O. SIGS = צורת הקלטים לקורא-ההתנהגות.
export function inner$enrollmentsForSession$all(db, c) {
    const all = db.enrollments.filter((e) => e.courseId === c.id);
    return all;
}

export const SIGS = {
  inner$enrollmentsForSession$all: [{"name":"db","d":{"t":"any"},"opt":false},{"name":"c","d":{"t":"any"},"opt":false}],
};
