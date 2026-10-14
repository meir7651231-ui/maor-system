// 🔓 נוצר אוטומטית ע"י catalog/inner/scripts/open.mjs מתוך generator:new/atoms/month-label.mjs — לא לערוך ביד.
// כל פונקציה כאן = ערך-בדרך שהורם מתוך פונקציה גדולה יותר; טהורה, בלי I/O. SIGS = צורת הקלטים לקורא-ההתנהגות.
export function inner$monthLabel$y(key) {
    const [y, m] = key.split('-');
    return y;
}
export function inner$monthLabel$m(key) {
    const [y, m] = key.split('-');
    return m;
}

export const SIGS = {
  inner$monthLabel$y: [{"name":"key","d":{"t":"any"},"opt":false}],
  inner$monthLabel$m: [{"name":"key","d":{"t":"any"},"opt":false}],
};
