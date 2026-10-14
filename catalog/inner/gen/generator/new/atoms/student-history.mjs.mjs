// 🔓 נוצר אוטומטית ע"י catalog/inner/scripts/open.mjs מתוך generator:new/atoms/student-history.mjs — לא לערוך ביד.
// כל פונקציה כאן = ערך-בדרך שהורם מתוך פונקציה גדולה יותר; טהורה, בלי I/O. SIGS = צורת הקלטים לקורא-ההתנהגות.
export function inner$studentHistory$renewTargetIds(db) {
    const renewTargetIds = new Set(db.enrollments.map((e) => e.renewedToId).filter(Boolean));
    return renewTargetIds;
}
export function inner$studentHistory$course(db, e) {
    const course = db.courses.find((c) => c.id === e.courseId) ?? null;
    return course;
}

export const SIGS = {
  inner$studentHistory$renewTargetIds: [{"name":"db","d":{"t":"any"},"opt":false}],
  inner$studentHistory$course: [{"name":"db","d":{"t":"any"},"opt":false},{"name":"e","d":{"t":"any"},"opt":false}],
};
