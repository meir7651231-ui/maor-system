// 🔓 נוצר אוטומטית ע"י catalog/inner/scripts/open.mjs מתוך generator:new/atoms/intel-day-diff.mjs — לא לערוך ביד.
// כל פונקציה כאן = ערך-בדרך שהורם מתוך פונקציה גדולה יותר; טהורה, בלי I/O. SIGS = צורת הקלטים לקורא-ההתנהגות.
export function inner$dayDiff$a(iso, T) {
    const a = Date.parse(iso.slice(0, T.k2) + 'T12:00:00');
    return a;
}
export function inner$dayDiff$b(todayIso, T) {
    const b = Date.parse(todayIso.slice(0, T.k2) + 'T12:00:00');
    return b;
}

export const SIGS = {
  inner$dayDiff$a: [{"name":"iso","d":{"t":"any"},"opt":false},{"name":"T","d":{"t":"any"},"opt":false}],
  inner$dayDiff$b: [{"name":"todayIso","d":{"t":"any"},"opt":false},{"name":"T","d":{"t":"any"},"opt":false}],
};
