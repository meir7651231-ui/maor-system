// 🔓 נוצר אוטומטית ע"י catalog/inner/scripts/open.mjs מתוך generator:new/atoms/sup12m.mjs — לא לערוך ביד.
// כל פונקציה כאן = ערך-בדרך שהורם מתוך פונקציה גדולה יותר; טהורה, בלי I/O. SIGS = צורת הקלטים לקורא-ההתנהגות.
const p2 = (n) => String(n).padStart(2, '0');
export function inner$sup12m$d(todayIso) {
    const d = new Date(todayIso + 'T12:00:00');
    return d;
}
export function inner$sup12m$cut(todayIso) {
    const d = new Date(todayIso + 'T12:00:00');
    const cut = `${d.getFullYear()}-${p2(d.getMonth() + 1)}-${p2(d.getDate())}`;
    return cut;
}
export function inner$sup12m$cut$$step(d) {
    const cut = `${d.getFullYear()}-${p2(d.getMonth() + 1)}-${p2(d.getDate())}`;
    return cut;
}

export const SIGS = {
  inner$sup12m$d: [{"name":"todayIso","d":{"t":"any"},"opt":false}],
  inner$sup12m$cut: [{"name":"todayIso","d":{"t":"any"},"opt":false}],
  inner$sup12m$cut$$step: [{"name":"d","d":{"t":"date"},"opt":false}],
};
