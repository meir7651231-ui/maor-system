// 🔓 נוצר אוטומטית ע"י catalog/inner/scripts/open.mjs מתוך generator:new/atoms/upcoming-holidays.mjs — לא לערוך ביד.
// כל פונקציה כאן = ערך-בדרך שהורם מתוך פונקציה גדולה יותר; טהורה, בלי I/O. SIGS = צורת הקלטים לקורא-ההתנהגות.
export function inner$upcomingHolidays$start(fromIso) {
    const start = new Date(fromIso + 'T12:00:00');
    return start;
}
export function inner$upcomingHolidays$d(fromIso, i) {
    const start = new Date(fromIso + 'T12:00:00');
    const d = new Date(start.getFullYear(), start.getMonth(), start.getDate() + i);
    return d;
}
export function inner$upcomingHolidays$d$$step(start, i) {
    const d = new Date(start.getFullYear(), start.getMonth(), start.getDate() + i);
    return d;
}

export const SIGS = {
  inner$upcomingHolidays$start: [{"name":"fromIso","d":{"t":"any"},"opt":false}],
  inner$upcomingHolidays$d: [{"name":"fromIso","d":{"t":"any"},"opt":false},{"name":"i","d":{"t":"num"},"opt":false}],
  inner$upcomingHolidays$d$$step: [{"name":"start","d":{"t":"date"},"opt":false},{"name":"i","d":{"t":"num"},"opt":false}],
};
