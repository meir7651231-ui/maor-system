// 🔓 נוצר אוטומטית ע"י catalog/inner/scripts/open.mjs מתוך generator:new/boxes/origin-guard.mjs — לא לערוך ביד.
// כל פונקציה כאן = ערך-בדרך שהורם מתוך פונקציה גדולה יותר; טהורה, בלי I/O. SIGS = צורת הקלטים לקורא-ההתנהגות.
function normHost(h) {
    return (h || '').toLowerCase().trim().replace(/:\d+$/, '').replace(/^www\./, '');
}
export function inner$foreignHost$h(hostname) {
    const h = normHost(hostname);
    return h;
}
export function inner$foreignHost$list(allowed) {
    const list = allowed.map(normHost).filter(Boolean);
    return list;
}

export const SIGS = {
  inner$foreignHost$h: [{"name":"hostname","d":{"t":"any"},"opt":false}],
  inner$foreignHost$list: [{"name":"allowed","d":{"t":"any"},"opt":false}],
};
