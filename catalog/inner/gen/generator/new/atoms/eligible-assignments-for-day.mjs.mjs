// 🔓 נוצר אוטומטית ע"י catalog/inner/scripts/open.mjs מתוך generator:new/atoms/eligible-assignments-for-day.mjs — לא לערוך ביד.
// כל פונקציה כאן = ערך-בדרך שהורם מתוך פונקציה גדולה יותר; טהורה, בלי I/O. SIGS = צורת הקלטים לקורא-ההתנהגות.
export function inner$eligibleAssignmentsForDay$taken(db, dayId) {
    const taken = new Set(db.deliveries.filter((d) => d.dayId === dayId).map((d) => d.assignmentId));
    return taken;
}

export const SIGS = {
  inner$eligibleAssignmentsForDay$taken: [{"name":"db","d":{"t":"any"},"opt":false},{"name":"dayId","d":{"t":"any"},"opt":false}],
};
