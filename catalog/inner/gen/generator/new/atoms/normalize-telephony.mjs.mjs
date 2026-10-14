// 🔓 נוצר אוטומטית ע"י catalog/inner/scripts/open.mjs מתוך generator:new/atoms/normalize-telephony.mjs — לא לערוך ביד.
// כל פונקציה כאן = ערך-בדרך שהורם מתוך פונקציה גדולה יותר; טהורה, בלי I/O. SIGS = צורת הקלטים לקורא-ההתנהגות.
export function inner$normalizeTelephony$numsRaw(t) {
    const numsRaw = Array.isArray(t.numbers) ? t.numbers.slice(0, 64) : [];
    return numsRaw;
}
export function inner$normalizeTelephony$forEach$kind(TEL_KINDS, T, o) {
    const kind = TEL_KINDS.includes(o.kind) ? o.kind : T.k2;
    return kind;
}
export function inner$normalizeTelephony$forEach$e164(T, o) {
    const e164 = typeof o.e164 === T.k3 ? o.e164.replace(/[^\d+()\-\s]/g, '').trim().slice(0, T.k5) : '';
    return e164;
}
export function inner$normalizeTelephony$daysRaw(t) {
    const daysRaw = Array.isArray(t.officeDays) ? t.officeDays : [0, 1, 2, 3, 4];
    return daysRaw;
}
export function inner$normalizeTelephony$officeDays(t) {
    const daysRaw = Array.isArray(t.officeDays) ? t.officeDays : [0, 1, 2, 3, 4];
    const officeDays = [
        ...new Set(daysRaw.filter((d) => Number.isInteger(d) && d >= 0 && d <= 6)),
    ].sort((a, b) => a - b);
    return officeDays;
}
export function inner$normalizeTelephony$officeDays$$step(daysRaw) {
    const officeDays = [
        ...new Set(daysRaw.filter((d) => Number.isInteger(d) && d >= 0 && d <= 6)),
    ].sort((a, b) => a - b);
    return officeDays;
}
export function inner$normalizeTelephony$cityRaw(T, t) {
    const cityRaw = typeof t.city === T.k3 ? t.city.toLowerCase().replace(/[^a-z]/g, '') : '';
    return cityRaw;
}

export const SIGS = {
  inner$normalizeTelephony$numsRaw: [{"name":"t","d":{"t":"any"},"opt":false}],
  inner$normalizeTelephony$forEach$kind: [{"name":"TEL_KINDS","d":{"t":"any"},"opt":false},{"name":"T","d":{"t":"any"},"opt":false},{"name":"o","d":{"t":"any"},"opt":false}],
  inner$normalizeTelephony$forEach$e164: [{"name":"T","d":{"t":"any"},"opt":false},{"name":"o","d":{"t":"any"},"opt":false}],
  inner$normalizeTelephony$daysRaw: [{"name":"t","d":{"t":"any"},"opt":false}],
  inner$normalizeTelephony$officeDays: [{"name":"t","d":{"t":"any"},"opt":false}],
  inner$normalizeTelephony$officeDays$$step: [{"name":"daysRaw","d":{"t":"any"},"opt":false}],
  inner$normalizeTelephony$cityRaw: [{"name":"T","d":{"t":"any"},"opt":false},{"name":"t","d":{"t":"any"},"opt":false}],
};
