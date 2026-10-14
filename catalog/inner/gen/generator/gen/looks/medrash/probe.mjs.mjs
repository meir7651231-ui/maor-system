// 🔓 נוצר אוטומטית ע"י catalog/inner/scripts/open.mjs מתוך generator:gen/looks/medrash/probe.mjs — לא לערוך ביד.
// כל פונקציה כאן = ערך-בדרך שהורם מתוך פונקציה גדולה יותר; טהורה, בלי I/O. SIGS = צורת הקלטים לקורא-ההתנהגות.
export function inner$VERIFY$low(t) {
    const low = t.toLowerCase();
    return low;
}
export function inner$VERIFY$wall(t) {
    const low = t.toLowerCase();
    const wallWords = ['create account', 'join now', 'sign up to continue', 'log in to continue', 'password (6+', 'agree & join'];
    const wall = wallWords.filter(w => low.includes(w));
    return wall;
}
export function inner$VERIFY$wall$$step(low, wallWords) {
    const wall = wallWords.filter(w => low.includes(w));
    return wall;
}
export function inner$VERIFY$times(t) {
    const times = t.match(/\b([01]?\d|2[0-3]):[0-5]\d\b/g) || [];
    return times;
}
export function inner$VERIFY$rows(byRow) {
    const rows = Object.values(byRow).filter(n => n >= 5);
    return rows;
}

export const SIGS = {
  inner$VERIFY$low: [{"name":"t","d":{"t":"str"},"opt":false}],
  inner$VERIFY$wall: [{"name":"t","d":{"t":"str"},"opt":false}],
  inner$VERIFY$wall$$step: [{"name":"low","d":{"t":"str"},"opt":false},{"name":"wallWords","d":{"t":"arr","of":{"t":"str"}},"opt":false}],
  inner$VERIFY$times: [{"name":"t","d":{"t":"str"},"opt":false}],
  inner$VERIFY$rows: [{"name":"byRow","d":{"t":"obj","n":"byRow","p":[]},"opt":false}],
};
