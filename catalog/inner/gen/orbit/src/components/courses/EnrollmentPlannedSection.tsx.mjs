// 🔓 נוצר אוטומטית ע"י catalog/inner/scripts/open.mjs מתוך orbit:src/components/courses/EnrollmentPlannedSection.tsx — לא לערוך ביד.
// כל פונקציה כאן = ערך-בדרך שהורם מתוך פונקציה גדולה יותר; טהורה, בלי I/O. SIGS = צורת הקלטים לקורא-ההתנהגות.
export function inner$fmt$y(iso) {
    const [y, m, d] = iso.split('-');
    return y;
}
export function inner$fmt$m(iso) {
    const [y, m, d] = iso.split('-');
    return m;
}
export function inner$fmt$d(iso) {
    const [y, m, d] = iso.split('-');
    return d;
}
export function inner$EnrollmentPlannedSection$map$bg(pl, overdue) {
    const chargedOk = !!pl.chargedRid;
    const cancelled = !!pl.cancelledAt;
    const bg = chargedOk ? '#f0fdf4' : cancelled ? '#fef2f2' : overdue ? '#fef3c7' : 'var(--bg-1)';
    return bg;
}
export function inner$EnrollmentPlannedSection$map$bg$$step(chargedOk, cancelled, overdue) {
    const bg = chargedOk ? '#f0fdf4' : cancelled ? '#fef2f2' : overdue ? '#fef3c7' : 'var(--bg-1)';
    return bg;
}
export function inner$EnrollmentPlannedSection$map$border(pl, overdue) {
    const chargedOk = !!pl.chargedRid;
    const cancelled = !!pl.cancelledAt;
    const border = chargedOk ? '#86efac' : cancelled ? '#fca5a5' : overdue ? '#fbbf24' : 'var(--stroke)';
    return border;
}
export function inner$EnrollmentPlannedSection$map$border$$step(chargedOk, cancelled, overdue) {
    const border = chargedOk ? '#86efac' : cancelled ? '#fca5a5' : overdue ? '#fbbf24' : 'var(--stroke)';
    return border;
}
export function inner$AddEnrollPlanModal$n(count) {
    const n = Math.max(1, parseInt(count || '0', 10) || 0);
    return n;
}
export function inner$AddEnrollPlanModal$amt(amount) {
    const amt = Math.round(Math.max(0, parseFloat(amount || '0') || 0) * 100) / 100;
    return amt;
}
export function inner$AddEnrollPlanModal$total(count, amount) {
    const n = Math.max(1, parseInt(count || '0', 10) || 0);
    const amt = Math.round(Math.max(0, parseFloat(amount || '0') || 0) * 100) / 100;
    const total = amt * n;
    return total;
}
export function inner$AddEnrollPlanModal$total$$step(n, amt) {
    const total = amt * n;
    return total;
}

export const SIGS = {
  inner$fmt$y: [{"name":"iso","d":{"t":"str"},"opt":false}],
  inner$fmt$m: [{"name":"iso","d":{"t":"str"},"opt":false}],
  inner$fmt$d: [{"name":"iso","d":{"t":"str"},"opt":false}],
  inner$EnrollmentPlannedSection$map$bg: [{"name":"pl","d":{"t":"obj","n":"PlannedCharge","p":[["id",{"t":"str"},false],["date",{"t":"str"},false],["amount",{"t":"num"},false],["cur",{"t":"lit","v":["₪","$"]},false],["method",{"t":"str"},false],["cat",{"t":"str"},false],["installmentOf",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["chargedRid",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["cancelledAt",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["note",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["componentId",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["shopValue",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true],["shopHoliday",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true]]},"opt":false},{"name":"overdue","d":{"t":"bool"},"opt":false}],
  inner$EnrollmentPlannedSection$map$bg$$step: [{"name":"chargedOk","d":{"t":"bool"},"opt":false},{"name":"cancelled","d":{"t":"bool"},"opt":false},{"name":"overdue","d":{"t":"bool"},"opt":false}],
  inner$EnrollmentPlannedSection$map$border: [{"name":"pl","d":{"t":"obj","n":"PlannedCharge","p":[["id",{"t":"str"},false],["date",{"t":"str"},false],["amount",{"t":"num"},false],["cur",{"t":"lit","v":["₪","$"]},false],["method",{"t":"str"},false],["cat",{"t":"str"},false],["installmentOf",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["chargedRid",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["cancelledAt",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["note",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["componentId",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["shopValue",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true],["shopHoliday",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true]]},"opt":false},{"name":"overdue","d":{"t":"bool"},"opt":false}],
  inner$EnrollmentPlannedSection$map$border$$step: [{"name":"chargedOk","d":{"t":"bool"},"opt":false},{"name":"cancelled","d":{"t":"bool"},"opt":false},{"name":"overdue","d":{"t":"bool"},"opt":false}],
  inner$AddEnrollPlanModal$n: [{"name":"count","d":{"t":"str"},"opt":false}],
  inner$AddEnrollPlanModal$amt: [{"name":"amount","d":{"t":"str"},"opt":false}],
  inner$AddEnrollPlanModal$total: [{"name":"count","d":{"t":"str"},"opt":false},{"name":"amount","d":{"t":"str"},"opt":false}],
  inner$AddEnrollPlanModal$total$$step: [{"name":"n","d":{"t":"num"},"opt":false},{"name":"amt","d":{"t":"num"},"opt":false}],
};
