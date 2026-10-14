// 🔓 נוצר אוטומטית ע"י catalog/inner/scripts/open.mjs מתוך generator:new/atoms/col-ref-to-index.mjs — לא לערוך ביד.
// כל פונקציה כאן = ערך-בדרך שהורם מתוך פונקציה גדולה יותר; טהורה, בלי I/O. SIGS = צורת הקלטים לקורא-ההתנהגות.
export function inner$colRefToIndex$m(ref) {
    const m = /^([A-Z]+)/.exec(ref);
    return m;
}
export function inner$colRefToIndex$n$$after_loop(ref, T) {
    const m = /^([A-Z]+)/.exec(ref);
    let n = 0;
    for (const ch of m[1])
        n = n * T.k1 + (ch.charCodeAt(0) - 64);
    return n;
}

export const SIGS = {
  inner$colRefToIndex$m: [{"name":"ref","d":{"t":"any"},"opt":false}],
  inner$colRefToIndex$n$$after_loop: [{"name":"ref","d":{"t":"any"},"opt":false},{"name":"T","d":{"t":"any"},"opt":false}],
};
