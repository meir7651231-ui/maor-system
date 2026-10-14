// 🔓 נוצר אוטומטית ע"י catalog/inner/scripts/open.mjs מתוך generator:new/atoms/age-of.mjs — לא לערוך ביד.
// כל פונקציה כאן = ערך-בדרך שהורם מתוך פונקציה גדולה יותר; טהורה, בלי I/O. SIGS = צורת הקלטים לקורא-ההתנהגות.
export function inner$ageOf$d(birth, T) {
    const d = new Date(birth.slice(0, T.k1) + 'T12:00:00');
    return d;
}

export const SIGS = {
  inner$ageOf$d: [{"name":"birth","d":{"t":"any"},"opt":false},{"name":"T","d":{"t":"any"},"opt":false}],
};
