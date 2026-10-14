// 🔓 נוצר אוטומטית ע"י catalog/inner/scripts/open.mjs מתוך generator:new/atoms/coral-palette.mjs — לא לערוך ביד.
// כל פונקציה כאן = ערך-בדרך שהורם מתוך פונקציה גדולה יותר; טהורה, בלי I/O. SIGS = צורת הקלטים לקורא-ההתנהגות.
export function inner$hexToRgb$m(hex) {
    const m = /^#?([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(hex.trim());
    return m;
}
export function inner$hexToRgb$n(h) {
    const n = parseInt(h, 16);
    return n;
}
export function inner$rgbToHsl$max(r, g, b) {
    const max = Math.max(r, g, b);
    return max;
}
export function inner$rgbToHsl$min(r, g, b) {
    const min = Math.min(r, g, b);
    return min;
}
export function inner$rgbToHsl$d(r, g, b) {
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    const d = max - min;
    return d;
}
export function inner$rgbToHsl$d$$step(max, min) {
    const d = max - min;
    return d;
}
export function inner$rgbToHsl$l(r, g, b) {
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    const l = (max + min) / 2;
    return l;
}
export function inner$rgbToHsl$l$$step(max, min) {
    const l = (max + min) / 2;
    return l;
}
export function inner$hslToRgb$c(s, l) {
    const c = (1 - Math.abs(2 * l - 1)) * s;
    return c;
}
export function inner$hslToRgb$x(h, s, l, T) {
    const c = (1 - Math.abs(2 * l - 1)) * s;
    const x = c * (1 - Math.abs(((h / T.k5) % 2) - 1));
    return x;
}
export function inner$hslToRgb$x$$step(h, T, c) {
    const x = c * (1 - Math.abs(((h / T.k5) % 2) - 1));
    return x;
}
export function inner$hslToRgb$m(s, l) {
    const c = (1 - Math.abs(2 * l - 1)) * s;
    const m = l - c / 2;
    return m;
}
export function inner$hslToRgb$m$$step(l, c) {
    const m = l - c / 2;
    return m;
}

export const SIGS = {
  inner$hexToRgb$m: [{"name":"hex","d":{"t":"any"},"opt":false}],
  inner$hexToRgb$n: [{"name":"h","d":{"t":"str"},"opt":false}],
  inner$rgbToHsl$max: [{"name":"r","d":{"t":"num"},"opt":false},{"name":"g","d":{"t":"num"},"opt":false},{"name":"b","d":{"t":"num"},"opt":false}],
  inner$rgbToHsl$min: [{"name":"r","d":{"t":"num"},"opt":false},{"name":"g","d":{"t":"num"},"opt":false},{"name":"b","d":{"t":"num"},"opt":false}],
  inner$rgbToHsl$d: [{"name":"r","d":{"t":"num"},"opt":false},{"name":"g","d":{"t":"num"},"opt":false},{"name":"b","d":{"t":"num"},"opt":false}],
  inner$rgbToHsl$d$$step: [{"name":"max","d":{"t":"num"},"opt":false},{"name":"min","d":{"t":"num"},"opt":false}],
  inner$rgbToHsl$l: [{"name":"r","d":{"t":"num"},"opt":false},{"name":"g","d":{"t":"num"},"opt":false},{"name":"b","d":{"t":"num"},"opt":false}],
  inner$rgbToHsl$l$$step: [{"name":"max","d":{"t":"num"},"opt":false},{"name":"min","d":{"t":"num"},"opt":false}],
  inner$hslToRgb$c: [{"name":"s","d":{"t":"num"},"opt":false},{"name":"l","d":{"t":"num"},"opt":false}],
  inner$hslToRgb$x: [{"name":"h","d":{"t":"num"},"opt":false},{"name":"s","d":{"t":"num"},"opt":false},{"name":"l","d":{"t":"num"},"opt":false},{"name":"T","d":{"t":"any"},"opt":false}],
  inner$hslToRgb$x$$step: [{"name":"h","d":{"t":"num"},"opt":false},{"name":"T","d":{"t":"any"},"opt":false},{"name":"c","d":{"t":"num"},"opt":false}],
  inner$hslToRgb$m: [{"name":"s","d":{"t":"num"},"opt":false},{"name":"l","d":{"t":"num"},"opt":false}],
  inner$hslToRgb$m$$step: [{"name":"l","d":{"t":"num"},"opt":false},{"name":"c","d":{"t":"num"},"opt":false}],
};
