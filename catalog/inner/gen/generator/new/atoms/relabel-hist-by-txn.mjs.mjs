// 🔓 נוצר אוטומטית ע"י catalog/inner/scripts/open.mjs מתוך generator:new/atoms/relabel-hist-by-txn.mjs — לא לערוך ביד.
// כל פונקציה כאן = ערך-בדרך שהורם מתוך פונקציה גדולה יותר; טהורה, בלי I/O. SIGS = צורת הקלטים לקורא-ההתנהגות.
export function inner$relabelHistByTxn$set(txns) {
    const set = new Set(txns.map((t) => t.trim()).filter(Boolean));
    return set;
}
export function inner$relabelHistByTxn$map$map$key(h) {
    const key = (h.txn || '').trim() || (h.ref || '').trim();
    return key;
}

export const SIGS = {
  inner$relabelHistByTxn$set: [{"name":"txns","d":{"t":"any"},"opt":false}],
  inner$relabelHistByTxn$map$map$key: [{"name":"h","d":{"t":"any"},"opt":false}],
};
