// 🔓 נוצר אוטומטית ע"י catalog/inner/scripts/open.mjs מתוך generator:new/atoms/delivery-list-lines.mjs — לא לערוך ביד.
// כל פונקציה כאן = ערך-בדרך שהורם מתוך פונקציה גדולה יותר; טהורה, בלי I/O. SIGS = צורת הקלטים לקורא-ההתנהגות.
export function inner$deliveryListLines$arr(byVol, r) {
    const arr = byVol.get(r.volunteerName) ?? [];
    return arr;
}
export function inner$deliveryListLines$byVol$$after_loop(rows) {
    const byVol = new Map();
    for (const r of rows) {
        const arr = byVol.get(r.volunteerName) ?? [];
        arr.push(r);
        byVol.set(r.volunteerName, arr);
    }
    return byVol;
}

export const SIGS = {
  inner$deliveryListLines$arr: [{"name":"byVol","d":{"t":"map","k":{"t":"any"},"v":{"t":"any"}},"opt":false},{"name":"r","d":{"t":"any"},"opt":false}],
  inner$deliveryListLines$byVol$$after_loop: [{"name":"rows","d":{"t":"any"},"opt":false}],
};
