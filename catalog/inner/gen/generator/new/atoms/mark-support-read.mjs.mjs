// 🔓 נוצר אוטומטית ע"י catalog/inner/scripts/open.mjs מתוך generator:new/atoms/mark-support-read.mjs — לא לערוך ביד.
// כל פונקציה כאן = ערך-בדרך שהורם מתוך פונקציה גדולה יותר; טהורה, בלי I/O. SIGS = צורת הקלטים לקורא-ההתנהגות.
export function inner$markSupportRead$field(side, T) {
    const field = side === T.k1 ? T.k2 : T.k3;
    return field;
}

export const SIGS = {
  inner$markSupportRead$field: [{"name":"side","d":{"t":"any"},"opt":false},{"name":"T","d":{"t":"any"},"opt":false}],
};
