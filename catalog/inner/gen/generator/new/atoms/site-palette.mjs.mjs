// 🔓 נוצר אוטומטית ע"י catalog/inner/scripts/open.mjs מתוך generator:new/atoms/site-palette.mjs — לא לערוך ביד.
// כל פונקציה כאן = ערך-בדרך שהורם מתוך פונקציה גדולה יותר; טהורה, בלי I/O. SIGS = צורת הקלטים לקורא-ההתנהגות.
function hexToRgb(hex) {
    const m = /^#?([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(hex.trim());
    if (!m)
        return null;
    let h = m[1];
    if (h.length === 3)
        h = h[0] + h[0] + h[1] + h[1] + h[2] + h[2];
    const n = parseInt(h, 16);
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}
export function inner$sitePalette$hexToRgb$m(hex) {
    const m = /^#?([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(hex.trim());
    return m;
}
export function inner$sitePalette$hexToRgb$n(h) {
    const n = parseInt(h, 16);
    return n;
}
export function inner$sitePalette$rgbToHsl$max(r, g, b) {
    const max = Math.max(r, g, b);
    return max;
}
export function inner$sitePalette$rgbToHsl$min(r, g, b) {
    const min = Math.min(r, g, b);
    return min;
}
export function inner$sitePalette$rgbToHsl$d(r, g, b) {
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    const d = max - min;
    return d;
}
export function inner$sitePalette$rgbToHsl$d$$step(max, min) {
    const d = max - min;
    return d;
}
export function inner$sitePalette$rgbToHsl$l(r, g, b) {
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    const l = (max + min) / 2;
    return l;
}
export function inner$sitePalette$rgbToHsl$l$$step(max, min) {
    const l = (max + min) / 2;
    return l;
}
export function inner$sitePalette$hslToRgb$c(s, l) {
    const c = (1 - Math.abs(2 * l - 1)) * s;
    return c;
}
export function inner$sitePalette$hslToRgb$x(T, h, s, l) {
    const c = (1 - Math.abs(2 * l - 1)) * s;
    const x = c * (1 - Math.abs(((h / T.k2) % 2) - 1));
    return x;
}
export function inner$sitePalette$hslToRgb$x$$step(T, h, c) {
    const x = c * (1 - Math.abs(((h / T.k2) % 2) - 1));
    return x;
}
export function inner$sitePalette$hslToRgb$m(s, l) {
    const c = (1 - Math.abs(2 * l - 1)) * s;
    const m = l - c / 2;
    return m;
}
export function inner$sitePalette$hslToRgb$m$$step(l, c) {
    const m = l - c / 2;
    return m;
}
export function inner$sitePalette$base(accent) {
    const base = accent && accent.trim() ? hexToRgb(accent) : null;
    return base;
}
export function inner$sitePalette$s(s0) {
    const s = Math.max(0.42, Math.min(0.86, s0));
    return s;
}

export const SIGS = {
  inner$sitePalette$hexToRgb$m: [{"name":"hex","d":{"t":"any"},"opt":false}],
  inner$sitePalette$hexToRgb$n: [{"name":"h","d":{"t":"str"},"opt":false}],
  inner$sitePalette$rgbToHsl$max: [{"name":"r","d":{"t":"num"},"opt":false},{"name":"g","d":{"t":"num"},"opt":false},{"name":"b","d":{"t":"num"},"opt":false}],
  inner$sitePalette$rgbToHsl$min: [{"name":"r","d":{"t":"num"},"opt":false},{"name":"g","d":{"t":"num"},"opt":false},{"name":"b","d":{"t":"num"},"opt":false}],
  inner$sitePalette$rgbToHsl$d: [{"name":"r","d":{"t":"num"},"opt":false},{"name":"g","d":{"t":"num"},"opt":false},{"name":"b","d":{"t":"num"},"opt":false}],
  inner$sitePalette$rgbToHsl$d$$step: [{"name":"max","d":{"t":"num"},"opt":false},{"name":"min","d":{"t":"num"},"opt":false}],
  inner$sitePalette$rgbToHsl$l: [{"name":"r","d":{"t":"num"},"opt":false},{"name":"g","d":{"t":"num"},"opt":false},{"name":"b","d":{"t":"num"},"opt":false}],
  inner$sitePalette$rgbToHsl$l$$step: [{"name":"max","d":{"t":"num"},"opt":false},{"name":"min","d":{"t":"num"},"opt":false}],
  inner$sitePalette$hslToRgb$c: [{"name":"s","d":{"t":"num"},"opt":false},{"name":"l","d":{"t":"num"},"opt":false}],
  inner$sitePalette$hslToRgb$x: [{"name":"T","d":{"t":"any"},"opt":false},{"name":"h","d":{"t":"num"},"opt":false},{"name":"s","d":{"t":"num"},"opt":false},{"name":"l","d":{"t":"num"},"opt":false}],
  inner$sitePalette$hslToRgb$x$$step: [{"name":"T","d":{"t":"any"},"opt":false},{"name":"h","d":{"t":"num"},"opt":false},{"name":"c","d":{"t":"num"},"opt":false}],
  inner$sitePalette$hslToRgb$m: [{"name":"s","d":{"t":"num"},"opt":false},{"name":"l","d":{"t":"num"},"opt":false}],
  inner$sitePalette$hslToRgb$m$$step: [{"name":"l","d":{"t":"num"},"opt":false},{"name":"c","d":{"t":"num"},"opt":false}],
  inner$sitePalette$base: [{"name":"accent","d":{"t":"any"},"opt":false}],
  inner$sitePalette$s: [{"name":"s0","d":{"t":"num"},"opt":false}],
};
