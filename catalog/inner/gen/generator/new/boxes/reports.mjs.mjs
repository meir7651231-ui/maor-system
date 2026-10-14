// 🔓 נוצר אוטומטית ע"י catalog/inner/scripts/open.mjs מתוך generator:new/boxes/reports.mjs — לא לערוך ביד.
// כל פונקציה כאן = ערך-בדרך שהורם מתוך פונקציה גדולה יותר; טהורה, בלי I/O. SIGS = צורת הקלטים לקורא-ההתנהגות.
export function inner$fmtDate$y(iso) {
    const [y, m, d] = iso.slice(0, 10).split('-');
    return y;
}
export function inner$fmtDate$m(iso) {
    const [y, m, d] = iso.slice(0, 10).split('-');
    return m;
}
export function inner$fmtDate$d(iso) {
    const [y, m, d] = iso.slice(0, 10).split('-');
    return d;
}

export const SIGS = {
  inner$fmtDate$y: [{"name":"iso","d":{"t":"any"},"opt":false}],
  inner$fmtDate$m: [{"name":"iso","d":{"t":"any"},"opt":false}],
  inner$fmtDate$d: [{"name":"iso","d":{"t":"any"},"opt":false}],
};
