// 🔓 נוצר אוטומטית ע"י catalog/inner/scripts/open.mjs מתוך generator:new/atoms/time-to-min.mjs — לא לערוך ביד.
// כל פונקציה כאן = ערך-בדרך שהורם מתוך פונקציה גדולה יותר; טהורה, בלי I/O. SIGS = צורת הקלטים לקורא-ההתנהגות.
export function inner$timeToMin$m(t) {
    const m = /^(\d{1,2}):(\d{2})$/.exec(String(t || '').trim());
    return m;
}

export const SIGS = {
  inner$timeToMin$m: [{"name":"t","d":{"t":"any"},"opt":false}],
};
