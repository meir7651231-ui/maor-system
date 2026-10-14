// 🔓 נוצר אוטומטית ע"י catalog/inner/scripts/open.mjs מתוך generator:new/atoms/schedule-clash-text.mjs — לא לערוך ביד.
// כל פונקציה כאן = ערך-בדרך שהורם מתוך פונקציה גדולה יותר; טהורה, בלי I/O. SIGS = צורת הקלטים לקורא-ההתנהגות.
export function inner$scheduleClashText$other(db, e) {
    const other = db.courses.find((x) => x.id === e.courseId);
    return other;
}

export const SIGS = {
  inner$scheduleClashText$other: [{"name":"db","d":{"t":"any"},"opt":false},{"name":"e","d":{"t":"any"},"opt":false}],
};
