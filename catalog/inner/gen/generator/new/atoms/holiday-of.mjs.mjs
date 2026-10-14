// 🔓 נוצר אוטומטית ע"י catalog/inner/scripts/open.mjs מתוך generator:new/atoms/holiday-of.mjs — לא לערוך ביד.
// כל פונקציה כאן = ערך-בדרך שהורם מתוך פונקציה גדולה יותר; טהורה, בלי I/O. SIGS = צורת הקלטים לקורא-ההתנהגות.
export function inner$holidayOf$key(p) {
    const key = `${p.month} ${p.day}`;
    return key;
}

export const SIGS = {
  inner$holidayOf$key: [{"name":"p","d":{"t":"any"},"opt":false}],
};
