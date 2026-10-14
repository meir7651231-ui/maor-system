// 🔓 נוצר אוטומטית ע"י catalog/inner/scripts/open.mjs מתוך generator:new/atoms/wheel-index-under-pointer.mjs — לא לערוך ביד.
// כל פונקציה כאן = ערך-בדרך שהורם מתוך פונקציה גדולה יותר; טהורה, בלי I/O. SIGS = צורת הקלטים לקורא-ההתנהגות.
export function inner$wheelIndexUnderPointer$step(n, T) {
    const step = T.k1 / n;
    return step;
}
export function inner$wheelIndexUnderPointer$off(rot, T) {
    const off = (((-rot) % T.k1) + T.k1) % T.k1;
    return off;
}

export const SIGS = {
  inner$wheelIndexUnderPointer$step: [{"name":"n","d":{"t":"num"},"opt":false},{"name":"T","d":{"t":"any"},"opt":false}],
  inner$wheelIndexUnderPointer$off: [{"name":"rot","d":{"t":"num"},"opt":false},{"name":"T","d":{"t":"any"},"opt":false}],
};
