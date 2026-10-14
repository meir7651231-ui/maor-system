// 🔓 נוצר אוטומטית ע"י catalog/inner/scripts/open.mjs מתוך generator:new/atoms/doc-skey.mjs — לא לערוך ביד.
// כל פונקציה כאן = ערך-בדרך שהורם מתוך פונקציה גדולה יותר; טהורה, בלי I/O. SIGS = צורת הקלטים לקורא-ההתנהגות.
export function inner$docSkey$spId(data, T) {
    const spId = typeof data.spId === T.k3 ? data.spId : '';
    return spId;
}

export const SIGS = {
  inner$docSkey$spId: [{"name":"data","d":{"t":"any"},"opt":false},{"name":"T","d":{"t":"any"},"opt":false}],
};
