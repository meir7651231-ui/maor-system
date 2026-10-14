// 🔓 נוצר אוטומטית ע"י catalog/inner/scripts/open.mjs מתוך generator:new/atoms/gematria.mjs — לא לערוך ביד.
// כל פונקציה כאן = ערך-בדרך שהורם מתוך פונקציה גדולה יותר; טהורה, בלי I/O. SIGS = צורת הקלטים לקורא-ההתנהגות.
export function inner$gem$s(n, H, T2) {
    let s = H[Math.floor(n / T2.k5)] || '';
    return s;
}
export function inner$gem$r(n, T2) {
    const r = n % T2.k5;
    return r;
}

export const SIGS = {
  inner$gem$s: [{"name":"n","d":{"t":"num"},"opt":false},{"name":"H","d":{"t":"any"},"opt":false},{"name":"T2","d":{"t":"any"},"opt":false}],
  inner$gem$r: [{"name":"n","d":{"t":"num"},"opt":false},{"name":"T2","d":{"t":"any"},"opt":false}],
};
