// 🔓 נוצר אוטומטית ע"י catalog/inner/scripts/open.mjs מתוך generator:gen/looks/tzevet/probe.mjs — לא לערוך ביד.
// כל פונקציה כאן = ערך-בדרך שהורם מתוך פונקציה גדולה יותר; טהורה, בלי I/O. SIGS = צורת הקלטים לקורא-ההתנהגות.
export function inner$VERIFY$low(t) {
    const low = t.toLowerCase();
    return low;
}
export function inner$VERIFY$wall(t) {
    const low = t.toLowerCase();
    const wall = ['create account', 'join now', 'log in to continue', 'sign up to continue'].filter(w => low.includes(w));
    return wall;
}
export function inner$VERIFY$wall$$step(low) {
    const wall = ['create account', 'join now', 'log in to continue', 'sign up to continue'].filter(w => low.includes(w));
    return wall;
}
export function inner$VERIFY$times(t) {
    const times = (t.match(/\b([01]?\d|2[0-3]):[0-5]\d\b|\b\d{1,2}\s?(am|pm)\b/gi) || []).length;
    return times;
}
export function inner$VERIFY$words(t) {
    const low = t.toLowerCase();
    const words = ['shift', 'schedule', 'roster', 'coverage', 'who\'s working', 'timesheet'].filter(w => low.includes(w));
    return words;
}
export function inner$VERIFY$words$$step(low) {
    const words = ['shift', 'schedule', 'roster', 'coverage', 'who\'s working', 'timesheet'].filter(w => low.includes(w));
    return words;
}

export const SIGS = {
  inner$VERIFY$low: [{"name":"t","d":{"t":"str"},"opt":false}],
  inner$VERIFY$wall: [{"name":"t","d":{"t":"str"},"opt":false}],
  inner$VERIFY$wall$$step: [{"name":"low","d":{"t":"str"},"opt":false}],
  inner$VERIFY$times: [{"name":"t","d":{"t":"str"},"opt":false}],
  inner$VERIFY$words: [{"name":"t","d":{"t":"str"},"opt":false}],
  inner$VERIFY$words$$step: [{"name":"low","d":{"t":"str"},"opt":false}],
};
