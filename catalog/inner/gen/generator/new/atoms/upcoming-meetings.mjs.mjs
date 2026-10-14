// 🔓 נוצר אוטומטית ע"י catalog/inner/scripts/open.mjs מתוך generator:new/atoms/upcoming-meetings.mjs — לא לערוך ביד.
// כל פונקציה כאן = ערך-בדרך שהורם מתוך פונקציה גדולה יותר; טהורה, בלי I/O. SIGS = צורת הקלטים לקורא-ההתנהגות.
export function inner$upcomingMeetings$end(todayIso) {
    const end = new Date(todayIso + 'T12:00:00');
    return end;
}
export function inner$upcomingMeetings$map$a(db, ev) {
    const a = db.shopAssignments.find((x) => x.id === ev.assignmentId);
    return a;
}

export const SIGS = {
  inner$upcomingMeetings$end: [{"name":"todayIso","d":{"t":"any"},"opt":false}],
  inner$upcomingMeetings$map$a: [{"name":"db","d":{"t":"any"},"opt":false},{"name":"ev","d":{"t":"any"},"opt":false}],
};
