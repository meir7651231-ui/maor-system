// 🔓 נוצר אוטומטית ע"י catalog/inner/scripts/open.mjs מתוך generator:new/atoms/fmt-date.mjs — לא לערוך ביד.
// כל פונקציה כאן = ערך-בדרך שהורם מתוך פונקציה גדולה יותר; טהורה, בלי I/O. SIGS = צורת הקלטים לקורא-ההתנהגות.
export function inner$fmtDate$y(iso, T) {
    const [y, m, d] = iso.slice(0, T.k1).split('-');
    return y;
}
export function inner$fmtDate$m(iso, T) {
    const [y, m, d] = iso.slice(0, T.k1).split('-');
    return m;
}
export function inner$fmtDate$d(iso, T) {
    const [y, m, d] = iso.slice(0, T.k1).split('-');
    return d;
}

export const SIGS = {
  inner$fmtDate$y: [{"name":"iso","d":{"t":"any"},"opt":false},{"name":"T","d":{"t":"any"},"opt":false}],
  inner$fmtDate$m: [{"name":"iso","d":{"t":"any"},"opt":false},{"name":"T","d":{"t":"any"},"opt":false}],
  inner$fmtDate$d: [{"name":"iso","d":{"t":"any"},"opt":false},{"name":"T","d":{"t":"any"},"opt":false}],
};
