// 🔓 נוצר אוטומטית ע"י catalog/inner/scripts/open.mjs מתוך generator:new/atoms/freshen-demo-db.mjs — לא לערוך ביד.
// כל פונקציה כאן = ערך-בדרך שהורם מתוך פונקציה גדולה יותר; טהורה, בלי I/O. SIGS = צורת הקלטים לקורא-ההתנהגות.
function daysBetween(fromIso, toIso, T) {
    const a = new Date(fromIso + 'T12:00:00').getTime();
    const b = new Date(toIso + 'T12:00:00').getTime();
    if (isNaN(a) || isNaN(b))
        return 0;
    return Math.round((b - a) / T.k1);
}
export function inner$daysBetween$a(fromIso) {
    const a = new Date(fromIso + 'T12:00:00').getTime();
    return a;
}
export function inner$daysBetween$b(toIso) {
    const b = new Date(toIso + 'T12:00:00').getTime();
    return b;
}
export function inner$shift$d(iso, T) {
    const d = new Date(iso.slice(0, T.k2) + 'T12:00:00');
    return d;
}
export function inner$freshenDemoDb$delta(todayIso, anchorIso, T) {
    const delta = daysBetween(anchorIso, todayIso, T);
    return delta;
}

export const SIGS = {
  inner$daysBetween$a: [{"name":"fromIso","d":{"t":"any"},"opt":false}],
  inner$daysBetween$b: [{"name":"toIso","d":{"t":"any"},"opt":false}],
  inner$shift$d: [{"name":"iso","d":{"t":"any"},"opt":false},{"name":"T","d":{"t":"any"},"opt":false}],
  inner$freshenDemoDb$delta: [{"name":"todayIso","d":{"t":"any"},"opt":false},{"name":"anchorIso","d":{"t":"any"},"opt":false},{"name":"T","d":{"t":"any"},"opt":false}],
};
