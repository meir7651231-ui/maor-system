// 🔓 נוצר אוטומטית ע"י catalog/inner/scripts/open.mjs מתוך generator:new/boxes/planned.mjs — לא לערוך ביד.
// כל פונקציה כאן = ערך-בדרך שהורם מתוך פונקציה גדולה יותר; טהורה, בלי I/O. SIGS = צורת הקלטים לקורא-ההתנהגות.
function isOpenPlan(p) {
    return !p.chargedRid && !p.cancelledAt;
}
function openPlans(o) {
    return (o.plannedCharges || []).filter(isOpenPlan);
}
export function inner$plannedNextDate$open(o) {
    const open = openPlans(o);
    return open;
}
export function inner$addMonthsClamped$ys(iso) {
    const [ys, ms, ds] = iso.split('-').map((s) => parseInt(s, 10));
    return ys;
}
export function inner$addMonthsClamped$ms(iso) {
    const [ys, ms, ds] = iso.split('-').map((s) => parseInt(s, 10));
    return ms;
}
export function inner$addMonthsClamped$ds(iso) {
    const [ys, ms, ds] = iso.split('-').map((s) => parseInt(s, 10));
    return ds;
}
export function inner$addMonthsClamped$m0(iso) {
    const [ys, ms, ds] = iso.split('-').map((s) => parseInt(s, 10));
    const m0 = (ms || 1) - 1;
    return m0;
}
export function inner$addMonthsClamped$m0$$step(ms) {
    const m0 = (ms || 1) - 1;
    return m0;
}
export function inner$addMonthsClamped$target(iso, months) {
    const [ys, ms, ds] = iso.split('-').map((s) => parseInt(s, 10));
    const y0 = ys || 1970;
    const m0 = (ms || 1) - 1;
    const target = new Date(y0, m0 + months, 1, 12, 0, 0);
    return target;
}
export function inner$addMonthsClamped$target$$step(months, y0, m0) {
    const target = new Date(y0, m0 + months, 1, 12, 0, 0);
    return target;
}
export function inner$addMonthsClamped$lastDay(iso, months) {
    const [ys, ms, ds] = iso.split('-').map((s) => parseInt(s, 10));
    const y0 = ys || 1970;
    const m0 = (ms || 1) - 1;
    const target = new Date(y0, m0 + months, 1, 12, 0, 0);
    const lastDay = new Date(target.getFullYear(), target.getMonth() + 1, 0).getDate();
    return lastDay;
}
export function inner$addMonthsClamped$lastDay$$step(target) {
    const lastDay = new Date(target.getFullYear(), target.getMonth() + 1, 0).getDate();
    return lastDay;
}
export function inner$addMonthsClamped$y(iso, months) {
    const [ys, ms, ds] = iso.split('-').map((s) => parseInt(s, 10));
    const y0 = ys || 1970;
    const m0 = (ms || 1) - 1;
    const target = new Date(y0, m0 + months, 1, 12, 0, 0);
    const y = target.getFullYear();
    return y;
}
export function inner$addMonthsClamped$y$$step(target) {
    const y = target.getFullYear();
    return y;
}
export function inner$addMonthsClamped$mm(iso, months) {
    const [ys, ms, ds] = iso.split('-').map((s) => parseInt(s, 10));
    const y0 = ys || 1970;
    const m0 = (ms || 1) - 1;
    const target = new Date(y0, m0 + months, 1, 12, 0, 0);
    const mm = String(target.getMonth() + 1).padStart(2, '0');
    return mm;
}
export function inner$addMonthsClamped$mm$$step(target) {
    const mm = String(target.getMonth() + 1).padStart(2, '0');
    return mm;
}
export function inner$addMonthsClamped$dd(iso, months) {
    const [ys, ms, ds] = iso.split('-').map((s) => parseInt(s, 10));
    const y0 = ys || 1970;
    const m0 = (ms || 1) - 1;
    const target = new Date(y0, m0 + months, 1, 12, 0, 0);
    const dd = String(target.getDate()).padStart(2, '0');
    return dd;
}
export function inner$addMonthsClamped$dd$$step(target) {
    const dd = String(target.getDate()).padStart(2, '0');
    return dd;
}
export function inner$planCharges$gap(spec) {
    const gap = Math.max(1, spec.gapMonths || 1);
    return gap;
}

export const SIGS = {
  inner$plannedNextDate$open: [{"name":"o","d":{"t":"any"},"opt":false}],
  inner$addMonthsClamped$ys: [{"name":"iso","d":{"t":"any"},"opt":false}],
  inner$addMonthsClamped$ms: [{"name":"iso","d":{"t":"any"},"opt":false}],
  inner$addMonthsClamped$ds: [{"name":"iso","d":{"t":"any"},"opt":false}],
  inner$addMonthsClamped$m0: [{"name":"iso","d":{"t":"any"},"opt":false}],
  inner$addMonthsClamped$m0$$step: [{"name":"ms","d":{"t":"any"},"opt":false}],
  inner$addMonthsClamped$target: [{"name":"iso","d":{"t":"any"},"opt":false},{"name":"months","d":{"t":"any"},"opt":false}],
  inner$addMonthsClamped$target$$step: [{"name":"months","d":{"t":"any"},"opt":false},{"name":"y0","d":{"t":"any"},"opt":false},{"name":"m0","d":{"t":"num"},"opt":false}],
  inner$addMonthsClamped$lastDay: [{"name":"iso","d":{"t":"any"},"opt":false},{"name":"months","d":{"t":"any"},"opt":false}],
  inner$addMonthsClamped$lastDay$$step: [{"name":"target","d":{"t":"date"},"opt":false}],
  inner$addMonthsClamped$y: [{"name":"iso","d":{"t":"any"},"opt":false},{"name":"months","d":{"t":"any"},"opt":false}],
  inner$addMonthsClamped$y$$step: [{"name":"target","d":{"t":"date"},"opt":false}],
  inner$addMonthsClamped$mm: [{"name":"iso","d":{"t":"any"},"opt":false},{"name":"months","d":{"t":"any"},"opt":false}],
  inner$addMonthsClamped$mm$$step: [{"name":"target","d":{"t":"date"},"opt":false}],
  inner$addMonthsClamped$dd: [{"name":"iso","d":{"t":"any"},"opt":false},{"name":"months","d":{"t":"any"},"opt":false}],
  inner$addMonthsClamped$dd$$step: [{"name":"target","d":{"t":"date"},"opt":false}],
  inner$planCharges$gap: [{"name":"spec","d":{"t":"any"},"opt":false}],
};
