// 🔓 נוצר אוטומטית ע"י catalog/inner/scripts/open.mjs מתוך generator:machtzev/ds-pure.mjs — לא לערוך ביד.
// כל פונקציה כאן = ערך-בדרך שהורם מתוך פונקציה גדולה יותר; טהורה, בלי I/O. SIGS = צורת הקלטים לקורא-ההתנהגות.
export function inner$color$m(v) {
    const m = v.match(/rgba?\(([^)]+)\)/);
    return m;
}
export function inner$color$r(v) {
    const m = v.match(/rgba?\(([^)]+)\)/);
    const [r, g, b, a = '1'] = m[1].split(',').map(s => s.trim());
    return r;
}
export function inner$color$r$$step(m) {
    const [r, g, b, a = '1'] = m[1].split(',').map(s => s.trim());
    return r;
}
export function inner$color$g(v) {
    const m = v.match(/rgba?\(([^)]+)\)/);
    const [r, g, b, a = '1'] = m[1].split(',').map(s => s.trim());
    return g;
}
export function inner$color$g$$step(m) {
    const [r, g, b, a = '1'] = m[1].split(',').map(s => s.trim());
    return g;
}
export function inner$color$b(v) {
    const m = v.match(/rgba?\(([^)]+)\)/);
    const [r, g, b, a = '1'] = m[1].split(',').map(s => s.trim());
    return b;
}
export function inner$color$b$$step(m) {
    const [r, g, b, a = '1'] = m[1].split(',').map(s => s.trim());
    return b;
}
export function inner$color$a(v) {
    const m = v.match(/rgba?\(([^)]+)\)/);
    const [r, g, b, a = '1'] = m[1].split(',').map(s => s.trim());
    return a;
}
export function inner$color$a$$step(m) {
    const [r, g, b, a = '1'] = m[1].split(',').map(s => s.trim());
    return a;
}

export const SIGS = {
  inner$color$m: [{"name":"v","d":{"t":"any"},"opt":false}],
  inner$color$r: [{"name":"v","d":{"t":"any"},"opt":false}],
  inner$color$r$$step: [{"name":"m","d":{"t":"any"},"opt":false}],
  inner$color$g: [{"name":"v","d":{"t":"any"},"opt":false}],
  inner$color$g$$step: [{"name":"m","d":{"t":"any"},"opt":false}],
  inner$color$b: [{"name":"v","d":{"t":"any"},"opt":false}],
  inner$color$b$$step: [{"name":"m","d":{"t":"any"},"opt":false}],
  inner$color$a: [{"name":"v","d":{"t":"any"},"opt":false}],
  inner$color$a$$step: [{"name":"m","d":{"t":"any"},"opt":false}],
};
