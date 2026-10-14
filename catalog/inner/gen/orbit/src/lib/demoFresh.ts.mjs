// 🔓 נוצר אוטומטית ע"י catalog/inner/scripts/open.mjs מתוך orbit:src/lib/demoFresh.ts — לא לערוך ביד.
// כל פונקציה כאן = ערך-בדרך שהורם מתוך פונקציה גדולה יותר; טהורה, בלי I/O. SIGS = צורת הקלטים לקורא-ההתנהגות.
const DEMO_ANCHOR = '2026-08-02';
function daysBetween(fromIso, toIso) {
    const a = new Date(fromIso + 'T12:00:00').getTime();
    const b = new Date(toIso + 'T12:00:00').getTime();
    if (isNaN(a) || isNaN(b))
        return 0;
    return Math.round((b - a) / 86_400_000);
}
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
export function inner$freshenDemoDb$delta(todayIso) {
    const delta = daysBetween(DEMO_ANCHOR, todayIso);
    return delta;
}

export const SIGS = {
  inner$daysBetween$a: [{"name":"fromIso","d":{"t":"str"},"opt":false}],
  inner$daysBetween$b: [{"name":"toIso","d":{"t":"str"},"opt":false}],
  inner$shift$d: [{"name":"iso","d":{"t":"str"},"opt":false}],
  inner$freshenDemoDb$delta: [{"name":"todayIso","d":{"t":"str"},"opt":false}],
};
