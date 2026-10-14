// 🔓 נוצר אוטומטית ע"י catalog/inner/scripts/open.mjs מתוך generator:new/atoms/events-csv-rows.mjs — לא לערוך ביד.
// כל פונקציה כאן = ערך-בדרך שהורם מתוך פונקציה גדולה יותר; טהורה, בלי I/O. SIGS = צורת הקלטים לקורא-ההתנהגות.
export function inner$eventsCsvRows$fmtD$y(iso) {
    const [y, m, d] = iso.split('-');
    return y;
}
export function inner$eventsCsvRows$fmtD$m(iso) {
    const [y, m, d] = iso.split('-');
    return m;
}
export function inner$eventsCsvRows$fmtD$d(iso) {
    const [y, m, d] = iso.split('-');
    return d;
}
export function inner$eventsCsvRows$evs(db) {
    const evs = [...db.events].sort((a, b) => (a.date || '').localeCompare(b.date || ''));
    return evs;
}

export const SIGS = {
  inner$eventsCsvRows$fmtD$y: [{"name":"iso","d":{"t":"any"},"opt":false}],
  inner$eventsCsvRows$fmtD$m: [{"name":"iso","d":{"t":"any"},"opt":false}],
  inner$eventsCsvRows$fmtD$d: [{"name":"iso","d":{"t":"any"},"opt":false}],
  inner$eventsCsvRows$evs: [{"name":"db","d":{"t":"any"},"opt":false}],
};
