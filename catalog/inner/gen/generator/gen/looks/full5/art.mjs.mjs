// 🔓 נוצר אוטומטית ע"י catalog/inner/scripts/open.mjs מתוך generator:gen/looks/full5/art.mjs — לא לערוך ביד.
// כל פונקציה כאן = ערך-בדרך שהורם מתוך פונקציה גדולה יותר; טהורה, בלי I/O. SIGS = צורת הקלטים לקורא-ההתנהגות.
const hash = (s) => { let h = 2166136261; for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
} return h >>> 0; };
const rnd = (seed) => { let t = seed >>> 0; return () => { t += 0x6D2B79F5; let x = Math.imul(t ^ t >>> 15, 1 | t); x ^= x + Math.imul(x ^ x >>> 7, 61 | x); return ((x ^ x >>> 14) >>> 0) / 4294967296; }; };
const seedOf = (k) => rnd(hash(String(k)));
export function inner$rnd$t(seed) {
    let t = seed >>> 0;
    return t;
}
export function inner$rnd$fn$x(t) {
    let x = Math.imul(t ^ t >>> 15, 1 | t);
    return x;
}
export function inner$cover$r(key) {
    const r = seedOf(key);
    return r;
}
export function inner$appIcon$r(key) {
    const r = seedOf(key);
    return r;
}
export function inner$scene$r(key) {
    const r = seedOf(key);
    return r;
}
export function inner$coin$r(key) {
    const r = seedOf(key);
    return r;
}
export function inner$hash$h$$after_loop(s) {
    let h = 2166136261;
    for (let i = 0; i < s.length; i++) {
        h ^= s.charCodeAt(i);
        h = Math.imul(h, 16777619);
    }
    return h;
}

export const SIGS = {
  inner$rnd$t: [{"name":"seed","d":{"t":"any"},"opt":false}],
  inner$rnd$fn$x: [{"name":"t","d":{"t":"num"},"opt":false}],
  inner$cover$r: [{"name":"key","d":{"t":"any"},"opt":false}],
  inner$appIcon$r: [{"name":"key","d":{"t":"any"},"opt":false}],
  inner$scene$r: [{"name":"key","d":{"t":"any"},"opt":false}],
  inner$coin$r: [{"name":"key","d":{"t":"any"},"opt":false}],
  inner$hash$h$$after_loop: [{"name":"s","d":{"t":"any"},"opt":false}],
};
