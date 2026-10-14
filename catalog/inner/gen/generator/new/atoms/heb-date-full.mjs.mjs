// 🔓 נוצר אוטומטית ע"י catalog/inner/scripts/open.mjs מתוך generator:new/atoms/heb-date-full.mjs — לא לערוך ביד.
// כל פונקציה כאן = ערך-בדרך שהורם מתוך פונקציה גדולה יותר; טהורה, בלי I/O. SIGS = צורת הקלטים לקורא-ההתנהגות.
export function inner$hebDateFull$d(iso, T) {
    const d = new Date(iso.slice(0, T.k4) + 'T12:00:00');
    return d;
}

export const SIGS = {
  inner$hebDateFull$d: [{"name":"iso","d":{"t":"any"},"opt":false},{"name":"T","d":{"t":"any"},"opt":false}],
};
