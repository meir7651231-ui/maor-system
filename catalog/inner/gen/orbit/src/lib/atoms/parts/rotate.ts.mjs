// 🔓 נוצר אוטומטית ע"י catalog/inner/scripts/open.mjs מתוך orbit:src/lib/atoms/parts/rotate.ts — לא לערוך ביד.
// כל פונקציה כאן = ערך-בדרך שהורם מתוך פונקציה גדולה יותר; טהורה, בלי I/O. SIGS = צורת הקלטים לקורא-ההתנהגות.
function turnIndex(length, n) {
    const len = Number.isFinite(length) ? Math.floor(length) : 0;
    if (len < 1)
        return -1;
    const k = Number.isFinite(n) ? Math.floor(n) : 0;
    return ((k % len) + len) % len;
}
export function inner$turnIndex$len(length) {
    const len = Number.isFinite(length) ? Math.floor(length) : 0;
    return len;
}
export function inner$turnIndex$k(n) {
    const k = Number.isFinite(n) ? Math.floor(n) : 0;
    return k;
}
export function inner$turnOf$i(list, n) {
    const i = turnIndex(list.length, n);
    return i;
}
export function inner$dayIndex$t(iso) {
    const t = Date.parse(String(iso) + 'T12:00:00Z');
    return t;
}
export function inner$fairAssign$s(start) {
    const s = Number.isFinite(start) ? Math.floor(start) : 0;
    return s;
}

export const SIGS = {
  inner$turnIndex$len: [{"name":"length","d":{"t":"num"},"opt":false}],
  inner$turnIndex$k: [{"name":"n","d":{"t":"num"},"opt":false}],
  inner$turnOf$i: [{"name":"list","d":{"t":"arr","of":{"t":"tp","id":"T","of":{"t":"any"}}},"opt":false},{"name":"n","d":{"t":"num"},"opt":false}],
  inner$dayIndex$t: [{"name":"iso","d":{"t":"str"},"opt":false}],
  inner$fairAssign$s: [{"name":"start","d":{"t":"num"},"opt":false}],
};
