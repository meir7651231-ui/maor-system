// 🔓 נוצר אוטומטית ע"י catalog/inner/scripts/open.mjs מתוך generator:new/atoms/repair-cards-from-rows.mjs — לא לערוך ביד.
// כל פונקציה כאן = ערך-בדרך שהורם מתוך פונקציה גדולה יותר; טהורה, בלי I/O. SIGS = צורת הקלטים לקורא-ההתנהגות.
export function inner$repairCardsFromRows$k(r) {
    const k = (r.txnId || '').trim() || (r.reference || '').trim();
    return k;
}
export function inner$repairCardsFromRows$map$map$key(h) {
    const key = (h.txn || '').trim() || (h.ref || '').trim();
    return key;
}
export function inner$repairCardsFromRows$map$map$row(map, h) {
    const key = (h.txn || '').trim() || (h.ref || '').trim();
    const row = key ? map.get(key) : undefined;
    return row;
}
export function inner$repairCardsFromRows$map$map$row$$step(map, key) {
    const row = key ? map.get(key) : undefined;
    return row;
}
export function inner$repairCardsFromRows$map$$after_loop(rows) {
    const map = new Map();
    for (const r of rows) {
        const k = (r.txnId || '').trim() || (r.reference || '').trim();
        if (k && !map.has(k))
            map.set(k, r);
    }
    return map;
}

export const SIGS = {
  inner$repairCardsFromRows$k: [{"name":"r","d":{"t":"any"},"opt":false}],
  inner$repairCardsFromRows$map$map$key: [{"name":"h","d":{"t":"any"},"opt":false}],
  inner$repairCardsFromRows$map$map$row: [{"name":"map","d":{"t":"map","k":{"t":"any"},"v":{"t":"any"}},"opt":false},{"name":"h","d":{"t":"any"},"opt":false}],
  inner$repairCardsFromRows$map$map$row$$step: [{"name":"map","d":{"t":"map","k":{"t":"any"},"v":{"t":"any"}},"opt":false},{"name":"key","d":{"t":"any"},"opt":false}],
  inner$repairCardsFromRows$map$$after_loop: [{"name":"rows","d":{"t":"any"},"opt":false}],
};
