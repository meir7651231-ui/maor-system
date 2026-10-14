// 🔓 נוצר אוטומטית ע"י catalog/inner/scripts/open.mjs מתוך generator:new/atoms/orbit-theme.mjs — לא לערוך ביד.
// כל פונקציה כאן = ערך-בדרך שהורם מתוך פונקציה גדולה יותר; טהורה, בלי I/O. SIGS = צורת הקלטים לקורא-ההתנהגות.
function hexToRgb(hex) {
    const h = hex.replace('#', '');
    return { r: parseInt(h.slice(0, 2), 16), g: parseInt(h.slice(2, 4), 16), b: parseInt(h.slice(4, 6), 16) };
}
const rgbStr = (c) => `${Math.round(c.r)},${Math.round(c.g)},${Math.round(c.b)}`;
export function inner$orbitTheme$hexToRgb$h(hex) {
    const h = hex.replace('#', '');
    return h;
}
export function inner$orbitTheme$rgbToHsl$max(r, g, b) {
    const max = Math.max(r, g, b);
    return max;
}
export function inner$orbitTheme$rgbToHsl$min(r, g, b) {
    const min = Math.min(r, g, b);
    return min;
}
export function inner$orbitTheme$rgbToHsl$l(r, g, b) {
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    const l = (max + min) / 2;
    return l;
}
export function inner$orbitTheme$rgbToHsl$l$$step(max, min) {
    const l = (max + min) / 2;
    return l;
}
export function inner$orbitTheme$rgbToHsl$d(r, g, b) {
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    const d = max - min;
    return d;
}
export function inner$orbitTheme$rgbToHsl$d$$step(max, min) {
    const d = max - min;
    return d;
}
export function inner$orbitTheme$hslToRgb$v(T, l) {
    const v = Math.round(l * T.k14);
    return v;
}
export function inner$orbitTheme$hslToRgb$q(s, l) {
    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    return q;
}
export function inner$orbitTheme$hslToRgb$p(s, l) {
    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;
    return p;
}
export function inner$orbitTheme$hslToRgb$p$$step(l, q) {
    const p = 2 * l - q;
    return p;
}
export function inner$orbitTheme$base(accent) {
    const base = hexToRgb(accent.trim());
    return base;
}
export function inner$orbitTheme$sat(s) {
    const sat = Math.max(0.35, Math.min(0.95, s));
    return sat;
}
export function inner$orbitTheme$accentRgb(accent) {
    const base = hexToRgb(accent.trim());
    const accentRgb = rgbStr(base);
    return accentRgb;
}
export function inner$orbitTheme$accentRgb$$step(base) {
    const accentRgb = rgbStr(base);
    return accentRgb;
}
export function inner$orbitTheme$groundHueShift(T, h) {
    const groundHueShift = h >= T.k16 && h <= T.k17 ? -12 : 0;
    return groundHueShift;
}
export function inner$orbitTheme$scene(T, h, l) {
    const scene = l > 0.86 ? T.k2 : h >= T.k16 && h <= T.k17 ? T.k3 : h >= T.k19 && h <= T.k20 ? T.k4 : T.k4;
    return scene;
}

export const SIGS = {
  inner$orbitTheme$hexToRgb$h: [{"name":"hex","d":{"t":"any"},"opt":false}],
  inner$orbitTheme$rgbToHsl$max: [{"name":"r","d":{"t":"num"},"opt":false},{"name":"g","d":{"t":"num"},"opt":false},{"name":"b","d":{"t":"num"},"opt":false}],
  inner$orbitTheme$rgbToHsl$min: [{"name":"r","d":{"t":"num"},"opt":false},{"name":"g","d":{"t":"num"},"opt":false},{"name":"b","d":{"t":"num"},"opt":false}],
  inner$orbitTheme$rgbToHsl$l: [{"name":"r","d":{"t":"num"},"opt":false},{"name":"g","d":{"t":"num"},"opt":false},{"name":"b","d":{"t":"num"},"opt":false}],
  inner$orbitTheme$rgbToHsl$l$$step: [{"name":"max","d":{"t":"num"},"opt":false},{"name":"min","d":{"t":"num"},"opt":false}],
  inner$orbitTheme$rgbToHsl$d: [{"name":"r","d":{"t":"num"},"opt":false},{"name":"g","d":{"t":"num"},"opt":false},{"name":"b","d":{"t":"num"},"opt":false}],
  inner$orbitTheme$rgbToHsl$d$$step: [{"name":"max","d":{"t":"num"},"opt":false},{"name":"min","d":{"t":"num"},"opt":false}],
  inner$orbitTheme$hslToRgb$v: [{"name":"T","d":{"t":"any"},"opt":false},{"name":"l","d":{"t":"num"},"opt":false}],
  inner$orbitTheme$hslToRgb$q: [{"name":"s","d":{"t":"num"},"opt":false},{"name":"l","d":{"t":"num"},"opt":false}],
  inner$orbitTheme$hslToRgb$p: [{"name":"s","d":{"t":"num"},"opt":false},{"name":"l","d":{"t":"num"},"opt":false}],
  inner$orbitTheme$hslToRgb$p$$step: [{"name":"l","d":{"t":"num"},"opt":false},{"name":"q","d":{"t":"num"},"opt":false}],
  inner$orbitTheme$base: [{"name":"accent","d":{"t":"any"},"opt":false}],
  inner$orbitTheme$sat: [{"name":"s","d":{"t":"num"},"opt":false}],
  inner$orbitTheme$accentRgb: [{"name":"accent","d":{"t":"any"},"opt":false}],
  inner$orbitTheme$accentRgb$$step: [{"name":"base","d":{"t":"obj","p":[["r",{"t":"num"},false],["g",{"t":"num"},false],["b",{"t":"num"},false]]},"opt":false}],
  inner$orbitTheme$groundHueShift: [{"name":"T","d":{"t":"any"},"opt":false},{"name":"h","d":{"t":"num"},"opt":false}],
  inner$orbitTheme$scene: [{"name":"T","d":{"t":"any"},"opt":false},{"name":"h","d":{"t":"num"},"opt":false},{"name":"l","d":{"t":"num"},"opt":false}],
};
