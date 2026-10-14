// 🔓 נוצר אוטומטית ע"י catalog/inner/scripts/open.mjs מתוך generator:new/atoms/attach-charges-bulk.mjs — לא לערוך ביד.
// כל פונקציה כאן = ערך-בדרך שהורם מתוך פונקציה גדולה יותר; טהורה, בלי I/O. SIGS = צורת הקלטים לקורא-ההתנהגות.
export function inner$attachChargesBulk$byId(supporters) {
    const byId = new Map(supporters.map((s, i) => [s.id, i]));
    return byId;
}
export function inner$attachChargesBulk$next(supporters) {
    const next = supporters.slice();
    return next;
}
export function inner$attachChargesBulk$idx(supporters, supId) {
    const byId = new Map(supporters.map((s, i) => [s.id, i]));
    const idx = byId.get(supId);
    return idx;
}
export function inner$attachChargesBulk$idx$$step(byId, supId) {
    const idx = byId.get(supId);
    return idx;
}

export const SIGS = {
  inner$attachChargesBulk$byId: [{"name":"supporters","d":{"t":"any"},"opt":false}],
  inner$attachChargesBulk$next: [{"name":"supporters","d":{"t":"any"},"opt":false}],
  inner$attachChargesBulk$idx: [{"name":"supporters","d":{"t":"any"},"opt":false},{"name":"supId","d":{"t":"any"},"opt":false}],
  inner$attachChargesBulk$idx$$step: [{"name":"byId","d":{"t":"map","k":{"t":"any"},"v":{"t":"any"}},"opt":false},{"name":"supId","d":{"t":"any"},"opt":false}],
};
