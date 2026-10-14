// 🔓 נוצר אוטומטית ע"י catalog/inner/scripts/open.mjs מתוך generator:new/atoms/charge-to-hist.mjs — לא לערוך ביד.
// כל פונקציה כאן = ערך-בדרך שהורם מתוך פונקציה גדולה יותר; טהורה, בלי I/O. SIGS = צורת הקלטים לקורא-ההתנהגות.
export function inner$chargeToHist$ref(charge) {
    const ref = (charge.reference || '').trim();
    return ref;
}
export function inner$chargeToHist$txn(charge) {
    const txn = (charge.txnId || '').trim();
    return txn;
}
export function inner$chargeToHist$rec(charge) {
    const rec = (charge.receipt || '').trim();
    return rec;
}
export function inner$chargeToHist$l4(charge) {
    const l4 = (charge.last4 || '').trim();
    return l4;
}
export function inner$chargeToHist$keva(charge) {
    const keva = (charge.kevaId || '').trim();
    return keva;
}

export const SIGS = {
  inner$chargeToHist$ref: [{"name":"charge","d":{"t":"any"},"opt":false}],
  inner$chargeToHist$txn: [{"name":"charge","d":{"t":"any"},"opt":false}],
  inner$chargeToHist$rec: [{"name":"charge","d":{"t":"any"},"opt":false}],
  inner$chargeToHist$l4: [{"name":"charge","d":{"t":"any"},"opt":false}],
  inner$chargeToHist$keva: [{"name":"charge","d":{"t":"any"},"opt":false}],
};
