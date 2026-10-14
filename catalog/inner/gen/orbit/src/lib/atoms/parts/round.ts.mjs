// 🔓 נוצר אוטומטית ע"י catalog/inner/scripts/open.mjs מתוך orbit:src/lib/atoms/parts/round.ts — לא לערוך ביד.
// כל פונקציה כאן = ערך-בדרך שהורם מתוך פונקציה גדולה יותר; טהורה, בלי I/O. SIGS = צורת הקלטים לקורא-ההתנהגות.
function roundTo(value, step = 1, dir = 'nearest') {
    if (typeof value !== 'number' || !Number.isFinite(value))
        return NaN;
    const st = typeof step === 'number' && Number.isFinite(step) && step > 0 ? step : 1;
    const q0 = value / st;
    // VERIFY 14.10: צעד לא-שלם — רעש נקודה-צפה (0.3 / 0.1 = 2.9999…) מקובע לשלם הקרוב, אחרת "למטה" יורד יחידה שלמה
    // (0.3 ⇒ 0.2, ₪351.15 ⇒ ₪351.10) ועיגול-פעמיים לא נותן אותו דבר. עם צעד 1 — בדיוק כמו Math.floor/ceil/round של המקור.
    const qi = Math.round(q0);
    const q = st !== 1 && Math.abs(q0 - qi) <= 1e-9 * Math.max(1, Math.abs(q0)) ? qi : q0;
    const r = dir === 'down' ? Math.floor(q) : dir === 'up' ? Math.ceil(q) : Math.round(q);
    const out = r * st;
    return st === 1 ? out : Number(out.toFixed(12));
}
export function inner$roundTo$st(step) {
    const st = typeof step === 'number' && Number.isFinite(step) && step > 0 ? step : 1;
    return st;
}
export function inner$roundTo$q0(value, step) {
    const st = typeof step === 'number' && Number.isFinite(step) && step > 0 ? step : 1;
    const q0 = value / st;
    return q0;
}
export function inner$roundTo$q0$$step(value, st) {
    const q0 = value / st;
    return q0;
}
export function inner$roundTo$qi(value, step) {
    const st = typeof step === 'number' && Number.isFinite(step) && step > 0 ? step : 1;
    const q0 = value / st;
    const qi = Math.round(q0);
    return qi;
}
export function inner$roundTo$qi$$step(q0) {
    const qi = Math.round(q0);
    return qi;
}
export function inner$roundTo$q(value, step) {
    const st = typeof step === 'number' && Number.isFinite(step) && step > 0 ? step : 1;
    const q0 = value / st;
    const qi = Math.round(q0);
    const q = st !== 1 && Math.abs(q0 - qi) <= 1e-9 * Math.max(1, Math.abs(q0)) ? qi : q0;
    return q;
}
export function inner$roundTo$q$$step(st, q0, qi) {
    const q = st !== 1 && Math.abs(q0 - qi) <= 1e-9 * Math.max(1, Math.abs(q0)) ? qi : q0;
    return q;
}
export function inner$roundTo$r(value, step, dir) {
    const st = typeof step === 'number' && Number.isFinite(step) && step > 0 ? step : 1;
    const q0 = value / st;
    const qi = Math.round(q0);
    const q = st !== 1 && Math.abs(q0 - qi) <= 1e-9 * Math.max(1, Math.abs(q0)) ? qi : q0;
    const r = dir === 'down' ? Math.floor(q) : dir === 'up' ? Math.ceil(q) : Math.round(q);
    return r;
}
export function inner$roundTo$r$$step(dir, q) {
    const r = dir === 'down' ? Math.floor(q) : dir === 'up' ? Math.ceil(q) : Math.round(q);
    return r;
}
export function inner$roundTo$out(value, step, dir) {
    const st = typeof step === 'number' && Number.isFinite(step) && step > 0 ? step : 1;
    const q0 = value / st;
    const qi = Math.round(q0);
    const q = st !== 1 && Math.abs(q0 - qi) <= 1e-9 * Math.max(1, Math.abs(q0)) ? qi : q0;
    const r = dir === 'down' ? Math.floor(q) : dir === 'up' ? Math.ceil(q) : Math.round(q);
    const out = r * st;
    return out;
}
export function inner$roundTo$out$$step(st, r) {
    const out = r * st;
    return out;
}
export function inner$roundAll$r(step, dir, v) {
    const r = roundTo(v, step, dir);
    return r;
}
export function inner$roundAll$out$$after_loop(values, step, dir) {
    const out = [];
    for (const v of values) {
        const r = roundTo(v, step, dir);
        if (Number.isFinite(r))
            out.push(r);
    }
    return out;
}

export const SIGS = {
  inner$roundTo$st: [{"name":"step","d":{"t":"num"},"opt":false}],
  inner$roundTo$q0: [{"name":"value","d":{"t":"num"},"opt":false},{"name":"step","d":{"t":"num"},"opt":false}],
  inner$roundTo$q0$$step: [{"name":"value","d":{"t":"num"},"opt":false},{"name":"st","d":{"t":"num"},"opt":false}],
  inner$roundTo$qi: [{"name":"value","d":{"t":"num"},"opt":false},{"name":"step","d":{"t":"num"},"opt":false}],
  inner$roundTo$qi$$step: [{"name":"q0","d":{"t":"num"},"opt":false}],
  inner$roundTo$q: [{"name":"value","d":{"t":"num"},"opt":false},{"name":"step","d":{"t":"num"},"opt":false}],
  inner$roundTo$q$$step: [{"name":"st","d":{"t":"num"},"opt":false},{"name":"q0","d":{"t":"num"},"opt":false},{"name":"qi","d":{"t":"num"},"opt":false}],
  inner$roundTo$r: [{"name":"value","d":{"t":"num"},"opt":false},{"name":"step","d":{"t":"num"},"opt":false},{"name":"dir","d":{"t":"lit","v":["up","down","nearest"]},"opt":false}],
  inner$roundTo$r$$step: [{"name":"dir","d":{"t":"lit","v":["up","down","nearest"]},"opt":false},{"name":"q","d":{"t":"num"},"opt":false}],
  inner$roundTo$out: [{"name":"value","d":{"t":"num"},"opt":false},{"name":"step","d":{"t":"num"},"opt":false},{"name":"dir","d":{"t":"lit","v":["up","down","nearest"]},"opt":false}],
  inner$roundTo$out$$step: [{"name":"st","d":{"t":"num"},"opt":false},{"name":"r","d":{"t":"num"},"opt":false}],
  inner$roundAll$r: [{"name":"step","d":{"t":"num"},"opt":false},{"name":"dir","d":{"t":"lit","v":["up","down","nearest"]},"opt":false},{"name":"v","d":{"t":"any"},"opt":false}],
  inner$roundAll$out$$after_loop: [{"name":"values","d":{"t":"arr","of":{"t":"num"}},"opt":false},{"name":"step","d":{"t":"num"},"opt":false},{"name":"dir","d":{"t":"lit","v":["up","down","nearest"]},"opt":false}],
};
