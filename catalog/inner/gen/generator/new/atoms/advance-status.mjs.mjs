// 🔓 נוצר אוטומטית ע"י catalog/inner/scripts/open.mjs מתוך generator:new/atoms/advance-status.mjs — לא לערוך ביד.
// כל פונקציה כאן = ערך-בדרך שהורם מתוך פונקציה גדולה יותר; טהורה, בלי I/O. SIGS = צורת הקלטים לקורא-ההתנהגות.
export function inner$advanceStatus$i(status, ORDER) {
    const i = ORDER.indexOf(status);
    return i;
}

export const SIGS = {
  inner$advanceStatus$i: [{"name":"status","d":{"t":"any"},"opt":false},{"name":"ORDER","d":{"t":"any"},"opt":false}],
};
