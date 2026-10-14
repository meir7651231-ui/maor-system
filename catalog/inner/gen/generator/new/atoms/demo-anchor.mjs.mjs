// 🔓 נוצר אוטומטית ע"י catalog/inner/scripts/open.mjs מתוך generator:new/atoms/demo-anchor.mjs — לא לערוך ביד.
// כל פונקציה כאן = ערך-בדרך שהורם מתוך פונקציה גדולה יותר; טהורה, בלי I/O. SIGS = צורת הקלטים לקורא-ההתנהגות.
export function inner$daysBetween$a(fromIso) {
    const a = new Date(fromIso + 'T12:00:00').getTime();
    return a;
}
export function inner$daysBetween$b(toIso) {
    const b = new Date(toIso + 'T12:00:00').getTime();
    return b;
}
export function inner$shift$d(iso) {
    const d = new Date(iso.slice(0, 10) + 'T12:00:00');
    return d;
}

export const SIGS = {
  inner$daysBetween$a: [{"name":"fromIso","d":{"t":"any"},"opt":false}],
  inner$daysBetween$b: [{"name":"toIso","d":{"t":"any"},"opt":false}],
  inner$shift$d: [{"name":"iso","d":{"t":"any"},"opt":false}],
};
