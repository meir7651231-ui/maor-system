// 🔓 נוצר אוטומטית ע"י catalog/inner/scripts/open.mjs מתוך generator:new/atoms/intel-donor-scan.mjs — לא לערוך ביד.
// כל פונקציה כאן = ערך-בדרך שהורם מתוך פונקציה גדולה יותר; טהורה, בלי I/O. SIGS = צורת הקלטים לקורא-ההתנהגות.
export function inner$donorScan$monthsBefore$y(iso) {
    const y = +iso.slice(0, 4);
    return y;
}
export function inner$donorScan$monthsBefore$m(iso) {
    const m = +iso.slice(5, 7);
    return m;
}
export function inner$donorScan$monthsBefore$ty(todayIso) {
    const ty = +todayIso.slice(0, 4);
    return ty;
}
export function inner$donorScan$monthsBefore$tm(todayIso) {
    const tm = +todayIso.slice(5, 7);
    return tm;
}
export function inner$donorScan$take$v(rate, amount, cur) {
    const v = (cur || '₪') === '$' ? amount * rate : amount;
    return v;
}

export const SIGS = {
  inner$donorScan$monthsBefore$y: [{"name":"iso","d":{"t":"any"},"opt":false}],
  inner$donorScan$monthsBefore$m: [{"name":"iso","d":{"t":"any"},"opt":false}],
  inner$donorScan$monthsBefore$ty: [{"name":"todayIso","d":{"t":"any"},"opt":false}],
  inner$donorScan$monthsBefore$tm: [{"name":"todayIso","d":{"t":"any"},"opt":false}],
  inner$donorScan$take$v: [{"name":"rate","d":{"t":"num"},"opt":false},{"name":"amount","d":{"t":"num"},"opt":false},{"name":"cur","d":{"t":"any"},"opt":false}],
};
