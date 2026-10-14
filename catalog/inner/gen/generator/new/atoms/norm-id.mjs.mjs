// 🔓 נוצר אוטומטית ע"י catalog/inner/scripts/open.mjs מתוך generator:new/atoms/norm-id.mjs — לא לערוך ביד.
// כל פונקציה כאן = ערך-בדרך שהורם מתוך פונקציה גדולה יותר; טהורה, בלי I/O. SIGS = צורת הקלטים לקורא-ההתנהגות.
export function inner$normId$d(s) {
    const d = (s || '').replace(/\D/g, '');
    return d;
}

export const SIGS = {
  inner$normId$d: [{"name":"s","d":{"t":"any"},"opt":false}],
};
