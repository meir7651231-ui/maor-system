// 🔓 נוצר אוטומטית ע"י catalog/inner/scripts/open.mjs מתוך orbit:functions/paymentMap.js — לא לערוך ביד.
// כל פונקציה כאן = ערך-בדרך שהורם מתוך פונקציה גדולה יותר; טהורה, בלי I/O. SIGS = צורת הקלטים לקורא-ההתנהגות.
function pick(p, ...keys) {
    for (const k of keys) {
        const v = p[k];
        if (v != null && String(v).trim() !== '')
            return String(v).trim();
    }
    return '';
}
export function inner$pickCurrency$raw(p) {
    const raw = pick(p, 'Currency', 'currency', 'cur', 'Coin');
    return raw;
}
export function inner$pickAmount$raw(p) {
    const raw = pick(p, 'Amount', 'amount', 'Sum', 'sum', 'Total');
    return raw;
}
export function inner$pickDate$raw(p) {
    const raw = pick(p, 'TransactionTime', 'Date', 'PaymentDate', 'TransactionDate');
    return raw;
}
export function inner$pickDate$m(p) {
    const raw = pick(p, 'TransactionTime', 'Date', 'PaymentDate', 'TransactionDate');
    const m = /(\d{1,2})\/(\d{1,2})\/(\d{4})/.exec(raw);
    return m;
}
export function inner$pickDate$m$$step(raw) {
    const m = /(\d{1,2})\/(\d{1,2})\/(\d{4})/.exec(raw);
    return m;
}
export function inner$mapPaymentCallback$first(params) {
    const p = params || {};
    const first = pick(p, 'FirstName', 'firstName', 'PayerFirstName');
    return first;
}
export function inner$mapPaymentCallback$first$$step(p) {
    const first = pick(p, 'FirstName', 'firstName', 'PayerFirstName');
    return first;
}
export function inner$mapPaymentCallback$last(params) {
    const p = params || {};
    const last = pick(p, 'LastName', 'lastName', 'PayerLastName');
    return last;
}
export function inner$mapPaymentCallback$last$$step(p) {
    const last = pick(p, 'LastName', 'lastName', 'PayerLastName');
    return last;
}
export function inner$sanitizeDedupKey$s(raw) {
    const s = String(raw ?? '');
    return s;
}
export function inner$sanitizeDedupKey$clean(raw) {
    const s = String(raw ?? '');
    const clean = s.replace(/[^A-Za-z0-9_-]/g, '_').slice(0, 92);
    return clean;
}
export function inner$sanitizeDedupKey$clean$$step(s) {
    const clean = s.replace(/[^A-Za-z0-9_-]/g, '_').slice(0, 92);
    return clean;
}

export const SIGS = {
  inner$pickCurrency$raw: [{"name":"p","d":{"t":"any"},"opt":false}],
  inner$pickAmount$raw: [{"name":"p","d":{"t":"any"},"opt":false}],
  inner$pickDate$raw: [{"name":"p","d":{"t":"any"},"opt":false}],
  inner$pickDate$m: [{"name":"p","d":{"t":"any"},"opt":false}],
  inner$pickDate$m$$step: [{"name":"raw","d":{"t":"str"},"opt":false}],
  inner$mapPaymentCallback$first: [{"name":"params","d":{"t":"any"},"opt":false}],
  inner$mapPaymentCallback$first$$step: [{"name":"p","d":{"t":"any"},"opt":false}],
  inner$mapPaymentCallback$last: [{"name":"params","d":{"t":"any"},"opt":false}],
  inner$mapPaymentCallback$last$$step: [{"name":"p","d":{"t":"any"},"opt":false}],
  inner$sanitizeDedupKey$s: [{"name":"raw","d":{"t":"any"},"opt":false}],
  inner$sanitizeDedupKey$clean: [{"name":"raw","d":{"t":"any"},"opt":false}],
  inner$sanitizeDedupKey$clean$$step: [{"name":"s","d":{"t":"str"},"opt":false}],
};
