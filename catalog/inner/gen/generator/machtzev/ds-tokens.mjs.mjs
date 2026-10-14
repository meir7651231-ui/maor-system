// 🔓 נוצר אוטומטית ע"י catalog/inner/scripts/open.mjs מתוך generator:machtzev/ds-tokens.mjs — לא לערוך ביד.
// כל פונקציה כאן = ערך-בדרך שהורם מתוך פונקציה גדולה יותר; טהורה, בלי I/O. SIGS = צורת הקלטים לקורא-ההתנהגות.
const hx = (h) => [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)];
export function inner$scaleRgb$r(hex) {
    const [r, g, b] = hx(hex);
    return r;
}
export function inner$scaleRgb$g(hex) {
    const [r, g, b] = hx(hex);
    return g;
}
export function inner$scaleRgb$b(hex) {
    const [r, g, b] = hx(hex);
    return b;
}
export function inner$mix$A(a) {
    const A = hx(a);
    return A;
}
export function inner$mix$B(b) {
    const B = hx(b);
    return B;
}
export function inner$map$a1(lvl) {
    const a1 = (0x0A + lvl * 5).toString(16).padStart(2, '0').toUpperCase();
    return a1;
}
export function inner$map$a2(lvl) {
    const a2 = (0x08 + lvl * 3).toString(16).padStart(2, '0').toUpperCase();
    return a2;
}
export function inner$map$blur1(lvl) {
    const blur1 = 2 * lvl * lvl;
    return blur1;
}
export function inner$map$y1(lvl) {
    const y1 = lvl * lvl;
    return y1;
}
export function inner$map$blur2(lvl) {
    const blur2 = lvl + 1;
    return blur2;
}
export function inner$map$y2(lvl) {
    const y2 = Math.max(1, lvl - 1);
    return y2;
}

export const SIGS = {
  inner$scaleRgb$r: [{"name":"hex","d":{"t":"any"},"opt":false}],
  inner$scaleRgb$g: [{"name":"hex","d":{"t":"any"},"opt":false}],
  inner$scaleRgb$b: [{"name":"hex","d":{"t":"any"},"opt":false}],
  inner$mix$A: [{"name":"a","d":{"t":"any"},"opt":false}],
  inner$mix$B: [{"name":"b","d":{"t":"any"},"opt":false}],
  inner$map$a1: [{"name":"lvl","d":{"t":"num"},"opt":false}],
  inner$map$a2: [{"name":"lvl","d":{"t":"num"},"opt":false}],
  inner$map$blur1: [{"name":"lvl","d":{"t":"num"},"opt":false}],
  inner$map$y1: [{"name":"lvl","d":{"t":"num"},"opt":false}],
  inner$map$blur2: [{"name":"lvl","d":{"t":"num"},"opt":false}],
  inner$map$y2: [{"name":"lvl","d":{"t":"num"},"opt":false}],
};
