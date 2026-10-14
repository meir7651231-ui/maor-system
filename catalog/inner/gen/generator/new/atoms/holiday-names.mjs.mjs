// 🔓 נוצר אוטומטית ע"י catalog/inner/scripts/open.mjs מתוך generator:new/atoms/holiday-names.mjs — לא לערוך ביד.
// כל פונקציה כאן = ערך-בדרך שהורם מתוך פונקציה גדולה יותר; טהורה, בלי I/O. SIGS = צורת הקלטים לקורא-ההתנהגות.
export function inner$holidayNames$d(i) {
    const start = new Date('2026-01-01T12:00:00');
    const d = new Date(start.getFullYear(), start.getMonth(), start.getDate() + i);
    return d;
}
export function inner$holidayNames$d$$step(start, i) {
    const d = new Date(start.getFullYear(), start.getMonth(), start.getDate() + i);
    return d;
}

export const SIGS = {
  inner$holidayNames$d: [{"name":"i","d":{"t":"num"},"opt":false}],
  inner$holidayNames$d$$step: [{"name":"start","d":{"t":"date"},"opt":false},{"name":"i","d":{"t":"num"},"opt":false}],
};
