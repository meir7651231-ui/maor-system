// 🔓 נוצר אוטומטית ע"י catalog/inner/scripts/open.mjs מתוך generator:new/atoms/attach-charge-to.mjs — לא לערוך ביד.
// כל פונקציה כאן = ערך-בדרך שהורם מתוך פונקציה גדולה יותר; טהורה, בלי I/O. SIGS = צורת הקלטים לקורא-ההתנהגות.
export function inner$attachChargeTo$idx(supporters, supId) {
    const idx = supporters.findIndex((s) => s.id === supId);
    return idx;
}
export function inner$attachChargeTo$next(supporters) {
    const next = supporters.slice();
    return next;
}

export const SIGS = {
  inner$attachChargeTo$idx: [{"name":"supporters","d":{"t":"any"},"opt":false},{"name":"supId","d":{"t":"any"},"opt":false}],
  inner$attachChargeTo$next: [{"name":"supporters","d":{"t":"any"},"opt":false}],
};
