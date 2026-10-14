// 🔓 נוצר אוטומטית ע"י catalog/inner/scripts/open.mjs מתוך generator:new/boxes/hebrew-calendar.mjs — לא לערוך ביד.
// כל פונקציה כאן = ערך-בדרך שהורם מתוך פונקציה גדולה יותר; טהורה, בלי I/O. SIGS = צורת הקלטים לקורא-ההתנהגות.
const noon = (iso) => new Date(String(iso).slice(0, 10) + 'T12:00:00');
export function inner$fullDate$d(iso) {
    const d = noon(iso);
    return d;
}

export const SIGS = {
  inner$fullDate$d: [{"name":"iso","d":{"t":"any"},"opt":false}],
};
