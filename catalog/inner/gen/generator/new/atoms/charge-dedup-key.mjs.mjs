// 🔓 נוצר אוטומטית ע"י catalog/inner/scripts/open.mjs מתוך generator:new/atoms/charge-dedup-key.mjs — לא לערוך ביד.
// כל פונקציה כאן = ערך-בדרך שהורם מתוך פונקציה גדולה יותר; טהורה, בלי I/O. SIGS = צורת הקלטים לקורא-ההתנהגות.
export function inner$chargeDedupKey$txn(charge) {
    const txn = (charge.txnId || '').trim();
    return txn;
}
export function inner$chargeDedupKey$ref(charge) {
    const ref = (charge.reference || '').trim();
    return ref;
}

export const SIGS = {
  inner$chargeDedupKey$txn: [{"name":"charge","d":{"t":"any"},"opt":false}],
  inner$chargeDedupKey$ref: [{"name":"charge","d":{"t":"any"},"opt":false}],
};
