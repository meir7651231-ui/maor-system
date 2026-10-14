// 🔓 נוצר אוטומטית ע"י catalog/inner/scripts/open.mjs מתוך orbit:src/lib/atoms/parts/next.ts — לא לערוך ביד.
// כל פונקציה כאן = ערך-בדרך שהורם מתוך פונקציה גדולה יותר; טהורה, בלי I/O. SIGS = צורת הקלטים לקורא-ההתנהגות.
const ok = (v, kind) => typeof v === kind && (kind !== 'number' || Number.isFinite(v)) && (kind !== 'string' || v !== '');
export function inner$nextAfter$n(count) {
    const n = typeof count === 'number' && Number.isFinite(count) ? Math.max(0, Math.floor(count)) : 1;
    return n;
}
export function inner$nextAfter$after(times, now) {
    const kind = typeof now;
    const after = times.filter((t) => ok(t, kind) && t > now);
    return after;
}
export function inner$nextAfter$after$$step(times, now, kind) {
    const after = times.filter((t) => ok(t, kind) && t > now);
    return after;
}
export function inner$firstRun$min(minLength) {
    const min = typeof minLength === 'number' && Number.isFinite(minLength) ? Math.max(1, minLength) : 1;
    return min;
}
export function inner$firstRun$at(fromIndex) {
    const at = typeof fromIndex === 'number' && Number.isFinite(fromIndex) ? fromIndex : 0;
    return at;
}
export function inner$firstRun$from(fromIndex, r) {
    const at = typeof fromIndex === 'number' && Number.isFinite(fromIndex) ? fromIndex : 0;
    const from = Math.max(r.from, at);
    return from;
}
export function inner$firstRun$from$$step(at, r) {
    const from = Math.max(r.from, at);
    return from;
}
export function inner$firstRun$length(fromIndex, r) {
    const at = typeof fromIndex === 'number' && Number.isFinite(fromIndex) ? fromIndex : 0;
    const from = Math.max(r.from, at);
    const length = r.to - from + 1;
    return length;
}
export function inner$firstRun$length$$step(r, from) {
    const length = r.to - from + 1;
    return length;
}

export const SIGS = {
  inner$nextAfter$n: [{"name":"count","d":{"t":"num"},"opt":false}],
  inner$nextAfter$after: [{"name":"times","d":{"t":"arr","of":{"t":"tp","id":"M","of":{"t":"or","of":[{"t":"str"},{"t":"num"}]}}},"opt":false},{"name":"now","d":{"t":"tp","id":"M","of":{"t":"or","of":[{"t":"str"},{"t":"num"}]}},"opt":false}],
  inner$nextAfter$after$$step: [{"name":"times","d":{"t":"arr","of":{"t":"tp","id":"M","of":{"t":"or","of":[{"t":"str"},{"t":"num"}]}}},"opt":false},{"name":"now","d":{"t":"tp","id":"M","of":{"t":"or","of":[{"t":"str"},{"t":"num"}]}},"opt":false},{"name":"kind","d":{"t":"lit","v":["string","number","bigint","boolean","symbol","undefined","object","function"]},"opt":false}],
  inner$firstRun$min: [{"name":"minLength","d":{"t":"num"},"opt":false}],
  inner$firstRun$at: [{"name":"fromIndex","d":{"t":"num"},"opt":false}],
  inner$firstRun$from: [{"name":"fromIndex","d":{"t":"num"},"opt":false},{"name":"r","d":{"t":"any"},"opt":false}],
  inner$firstRun$from$$step: [{"name":"at","d":{"t":"num"},"opt":false},{"name":"r","d":{"t":"any"},"opt":false}],
  inner$firstRun$length: [{"name":"fromIndex","d":{"t":"num"},"opt":false},{"name":"r","d":{"t":"any"},"opt":false}],
  inner$firstRun$length$$step: [{"name":"r","d":{"t":"any"},"opt":false},{"name":"from","d":{"t":"num"},"opt":false}],
};
