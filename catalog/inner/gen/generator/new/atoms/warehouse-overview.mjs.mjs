// 🔓 נוצר אוטומטית ע"י catalog/inner/scripts/open.mjs מתוך generator:new/atoms/warehouse-overview.mjs — לא לערוך ביד.
// כל פונקציה כאן = ערך-בדרך שהורם מתוך פונקציה גדולה יותר; טהורה, בלי I/O. SIGS = צורת הקלטים לקורא-ההתנהגות.
export function inner$warehouseOverview$map$allocated(rows) {
    const allocated = rows.reduce((a, r) => a + r.qty, 0);
    return allocated;
}
export function inner$warehouseOverview$map$remaining(item, rows) {
    const allocated = rows.reduce((a, r) => a + r.qty, 0);
    const remaining = (+item.qty || 0) - allocated;
    return remaining;
}
export function inner$warehouseOverview$map$remaining$$step(item, allocated) {
    const remaining = (+item.qty || 0) - allocated;
    return remaining;
}

export const SIGS = {
  inner$warehouseOverview$map$allocated: [{"name":"rows","d":{"t":"any"},"opt":false}],
  inner$warehouseOverview$map$remaining: [{"name":"item","d":{"t":"any"},"opt":false},{"name":"rows","d":{"t":"any"},"opt":false}],
  inner$warehouseOverview$map$remaining$$step: [{"name":"item","d":{"t":"any"},"opt":false},{"name":"allocated","d":{"t":"num"},"opt":false}],
};
