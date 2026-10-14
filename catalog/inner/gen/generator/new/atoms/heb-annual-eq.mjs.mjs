// 🔓 נוצר אוטומטית ע"י catalog/inner/scripts/open.mjs מתוך generator:new/atoms/heb-annual-eq.mjs — לא לערוך ביד.
// כל פונקציה כאן = ערך-בדרך שהורם מתוך פונקציה גדולה יותר; טהורה, בלי I/O. SIGS = צורת הקלטים לקורא-ההתנהגות.
export function inner$hebAnnualEq$qi(query, seq) {
    const qi = seq.indexOf(query.month);
    return qi;
}
export function inner$hebAnnualEq$prev(query, seq) {
    const qi = seq.indexOf(query.month);
    const prev = qi > 0 ? seq[qi - 1] : null;
    return prev;
}
export function inner$hebAnnualEq$prev$$step(seq, qi) {
    const prev = qi > 0 ? seq[qi - 1] : null;
    return prev;
}
export function inner$hebAnnualEq$prevMatches(anchor, query, T, seq) {
    const qi = seq.indexOf(query.month);
    const prev = qi > 0 ? seq[qi - 1] : null;
    const prevMatches = prev === anchor.month || (anchor.month === T.k2 && prev === T.k1);
    return prevMatches;
}
export function inner$hebAnnualEq$prevMatches$$step(anchor, T, prev) {
    const prevMatches = prev === anchor.month || (anchor.month === T.k2 && prev === T.k1);
    return prevMatches;
}

export const SIGS = {
  inner$hebAnnualEq$qi: [{"name":"query","d":{"t":"any"},"opt":false},{"name":"seq","d":{"t":"any"},"opt":false}],
  inner$hebAnnualEq$prev: [{"name":"query","d":{"t":"any"},"opt":false},{"name":"seq","d":{"t":"any"},"opt":false}],
  inner$hebAnnualEq$prev$$step: [{"name":"seq","d":{"t":"any"},"opt":false},{"name":"qi","d":{"t":"num"},"opt":false}],
  inner$hebAnnualEq$prevMatches: [{"name":"anchor","d":{"t":"any"},"opt":false},{"name":"query","d":{"t":"any"},"opt":false},{"name":"T","d":{"t":"any"},"opt":false},{"name":"seq","d":{"t":"any"},"opt":false}],
  inner$hebAnnualEq$prevMatches$$step: [{"name":"anchor","d":{"t":"any"},"opt":false},{"name":"T","d":{"t":"any"},"opt":false},{"name":"prev","d":{"t":"any"},"opt":false}],
};
