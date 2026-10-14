// 🔓 נוצר אוטומטית ע"י catalog/inner/scripts/open.mjs מתוך generator:new/atoms/receipt-verify-code.mjs — לא לערוך ביד.
// כל פונקציה כאן = ערך-בדרך שהורם מתוך פונקציה גדולה יותר; טהורה, בלי I/O. SIGS = צורת הקלטים לקורא-ההתנהגות.
export function inner$receiptVerifyCode$s(rid, amount, currency, date, T) {
    const s = rid + '|' + amount + '|' + (currency || '₪') + '|' + date.slice(0, T.k1);
    return s;
}
export function inner$receiptVerifyCode$code(rid, amount, currency, date, T) {
    const s = rid + '|' + amount + '|' + (currency || '₪') + '|' + date.slice(0, T.k1);
    let h = T.k2;
    for (let i = 0; i < s.length; i++) {
        h ^= s.charCodeAt(i);
        h = Math.imul(h, T.k3) >>> 0;
    }
    const code = h.toString(T.k4).toUpperCase().padStart(7, '0').slice(-6);
    return code;
}
export function inner$receiptVerifyCode$code$$step(T, h) {
    const code = h.toString(T.k4).toUpperCase().padStart(7, '0').slice(-6);
    return code;
}
export function inner$receiptVerifyCode$h$$after_loop(rid, amount, currency, date, T) {
    const s = rid + '|' + amount + '|' + (currency || '₪') + '|' + date.slice(0, T.k1);
    let h = T.k2;
    for (let i = 0; i < s.length; i++) {
        h ^= s.charCodeAt(i);
        h = Math.imul(h, T.k3) >>> 0;
    }
    return h;
}

export const SIGS = {
  inner$receiptVerifyCode$s: [{"name":"rid","d":{"t":"any"},"opt":false},{"name":"amount","d":{"t":"any"},"opt":false},{"name":"currency","d":{"t":"any"},"opt":false},{"name":"date","d":{"t":"any"},"opt":false},{"name":"T","d":{"t":"any"},"opt":false}],
  inner$receiptVerifyCode$code: [{"name":"rid","d":{"t":"any"},"opt":false},{"name":"amount","d":{"t":"any"},"opt":false},{"name":"currency","d":{"t":"any"},"opt":false},{"name":"date","d":{"t":"any"},"opt":false},{"name":"T","d":{"t":"any"},"opt":false}],
  inner$receiptVerifyCode$code$$step: [{"name":"T","d":{"t":"any"},"opt":false},{"name":"h","d":{"t":"any"},"opt":false}],
  inner$receiptVerifyCode$h$$after_loop: [{"name":"rid","d":{"t":"any"},"opt":false},{"name":"amount","d":{"t":"any"},"opt":false},{"name":"currency","d":{"t":"any"},"opt":false},{"name":"date","d":{"t":"any"},"opt":false},{"name":"T","d":{"t":"any"},"opt":false}],
};
