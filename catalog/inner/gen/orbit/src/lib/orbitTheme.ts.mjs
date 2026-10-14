// 🔓 נוצר אוטומטית ע"י catalog/inner/scripts/open.mjs מתוך orbit:src/lib/orbitTheme.ts — לא לערוך ביד.
// כל פונקציה כאן = ערך-בדרך שהורם מתוך פונקציה גדולה יותר; טהורה, בלי I/O. SIGS = צורת הקלטים לקורא-ההתנהגות.
function hexToRgb(hex) {
    const h = hex.replace('#', '');
    return { r: parseInt(h.slice(0, 2), 16), g: parseInt(h.slice(2, 4), 16), b: parseInt(h.slice(4, 6), 16) };
}
function rgbToHsl(r, g, b) {
    r /= 255;
    g /= 255;
    b /= 255;
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    const l = (max + min) / 2;
    let h = 0;
    let s = 0;
    const d = max - min;
    if (d !== 0) {
        s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
        if (max === r)
            h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
        else if (max === g)
            h = ((b - r) / d + 2) / 6;
        else
            h = ((r - g) / d + 4) / 6;
    }
    return { h: h * 360, s, l };
}
const toHex = (c) => '#' + [c.r, c.g, c.b].map((x) => Math.max(0, Math.min(255, Math.round(x))).toString(16).padStart(2, '0')).join('');
const rgbStr = (c) => `${Math.round(c.r)},${Math.round(c.g)},${Math.round(c.b)}`;
const luminance = (c) => (0.299 * c.r + 0.587 * c.g + 0.114 * c.b) / 255;
export function inner$hexToRgb$h(hex) {
    const h = hex.replace('#', '');
    return h;
}
export function inner$rgbToHsl$max(r, g, b) {
    const max = Math.max(r, g, b);
    return max;
}
export function inner$rgbToHsl$min(r, g, b) {
    const min = Math.min(r, g, b);
    return min;
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
export function inner$hslToRgb$v(l) {
    const v = Math.round(l * 255);
    return v;
}
export function inner$hslToRgb$q(s, l) {
    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    return q;
}
export function inner$hslToRgb$p(s, l) {
    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;
    return p;
}
export function inner$hslToRgb$p$$step(l, q) {
    const p = 2 * l - q;
    return p;
}
export function inner$orbitTheme$base(accent) {
    const base = hexToRgb(accent.trim());
    return base;
}
export function inner$orbitTheme$h(accent) {
    const base = hexToRgb(accent.trim());
    const { h, s, l } = rgbToHsl(base.r, base.g, base.b);
    return h;
}
export function inner$orbitTheme$h$$step(base) {
    const { h, s, l } = rgbToHsl(base.r, base.g, base.b);
    return h;
}
export function inner$orbitTheme$s(accent) {
    const base = hexToRgb(accent.trim());
    const { h, s, l } = rgbToHsl(base.r, base.g, base.b);
    return s;
}
export function inner$orbitTheme$s$$step(base) {
    const { h, s, l } = rgbToHsl(base.r, base.g, base.b);
    return s;
}
export function inner$orbitTheme$l(accent) {
    const base = hexToRgb(accent.trim());
    const { h, s, l } = rgbToHsl(base.r, base.g, base.b);
    return l;
}
export function inner$orbitTheme$l$$step(base) {
    const { h, s, l } = rgbToHsl(base.r, base.g, base.b);
    return l;
}
export function inner$orbitTheme$sat(accent) {
    const base = hexToRgb(accent.trim());
    const { h, s, l } = rgbToHsl(base.r, base.g, base.b);
    const sat = Math.max(0.35, Math.min(0.95, s));
    return sat;
}
export function inner$orbitTheme$sat$$step(s) {
    const sat = Math.max(0.35, Math.min(0.95, s));
    return sat;
}
export function inner$orbitTheme$accentHex(accent) {
    const base = hexToRgb(accent.trim());
    const accentHex = toHex(base);
    return accentHex;
}
export function inner$orbitTheme$accentHex$$step(base) {
    const accentHex = toHex(base);
    return accentHex;
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
export function inner$orbitTheme$groundHueShift(accent) {
    const base = hexToRgb(accent.trim());
    const { h, s, l } = rgbToHsl(base.r, base.g, base.b);
    const groundHueShift = h >= 15 && h <= 70 ? -12 : 0;
    return groundHueShift;
}
export function inner$orbitTheme$groundHueShift$$step(h) {
    const groundHueShift = h >= 15 && h <= 70 ? -12 : 0;
    return groundHueShift;
}
export function inner$orbitTheme$btnText(accent) {
    const base = hexToRgb(accent.trim());
    const btnText = luminance(base) > 0.62 ? '#2a1710' : '#ffffff';
    return btnText;
}
export function inner$orbitTheme$btnText$$step(base) {
    const btnText = luminance(base) > 0.62 ? '#2a1710' : '#ffffff';
    return btnText;
}
export function inner$orbitTheme$scene(accent) {
    const base = hexToRgb(accent.trim());
    const { h, s, l } = rgbToHsl(base.r, base.g, base.b);
    const scene = l > 0.86 ? 'Ice' : h >= 15 && h <= 70 ? 'Ember' : h >= 180 && h <= 265 ? 'Aurora' : 'Aurora';
    return scene;
}
export function inner$orbitTheme$scene$$step(h, l) {
    const scene = l > 0.86 ? 'Ice' : h >= 15 && h <= 70 ? 'Ember' : h >= 180 && h <= 265 ? 'Aurora' : 'Aurora';
    return scene;
}

export const SIGS = {
  inner$hexToRgb$h: [{"name":"hex","d":{"t":"str"},"opt":false}],
  inner$rgbToHsl$max: [{"name":"r","d":{"t":"num"},"opt":false},{"name":"g","d":{"t":"num"},"opt":false},{"name":"b","d":{"t":"num"},"opt":false}],
  inner$rgbToHsl$min: [{"name":"r","d":{"t":"num"},"opt":false},{"name":"g","d":{"t":"num"},"opt":false},{"name":"b","d":{"t":"num"},"opt":false}],
  inner$rgbToHsl$l: [{"name":"r","d":{"t":"num"},"opt":false},{"name":"g","d":{"t":"num"},"opt":false},{"name":"b","d":{"t":"num"},"opt":false}],
  inner$rgbToHsl$l$$step: [{"name":"max","d":{"t":"num"},"opt":false},{"name":"min","d":{"t":"num"},"opt":false}],
  inner$rgbToHsl$d: [{"name":"r","d":{"t":"num"},"opt":false},{"name":"g","d":{"t":"num"},"opt":false},{"name":"b","d":{"t":"num"},"opt":false}],
  inner$rgbToHsl$d$$step: [{"name":"max","d":{"t":"num"},"opt":false},{"name":"min","d":{"t":"num"},"opt":false}],
  inner$hslToRgb$v: [{"name":"l","d":{"t":"num"},"opt":false}],
  inner$hslToRgb$q: [{"name":"s","d":{"t":"num"},"opt":false},{"name":"l","d":{"t":"num"},"opt":false}],
  inner$hslToRgb$p: [{"name":"s","d":{"t":"num"},"opt":false},{"name":"l","d":{"t":"num"},"opt":false}],
  inner$hslToRgb$p$$step: [{"name":"l","d":{"t":"num"},"opt":false},{"name":"q","d":{"t":"num"},"opt":false}],
  inner$orbitTheme$base: [{"name":"accent","d":{"t":"or","of":[{"t":"undef"},{"t":"str"}]},"opt":false}],
  inner$orbitTheme$h: [{"name":"accent","d":{"t":"or","of":[{"t":"undef"},{"t":"str"}]},"opt":false}],
  inner$orbitTheme$h$$step: [{"name":"base","d":{"t":"obj","p":[["r",{"t":"num"},false],["g",{"t":"num"},false],["b",{"t":"num"},false]]},"opt":false}],
  inner$orbitTheme$s: [{"name":"accent","d":{"t":"or","of":[{"t":"undef"},{"t":"str"}]},"opt":false}],
  inner$orbitTheme$s$$step: [{"name":"base","d":{"t":"obj","p":[["r",{"t":"num"},false],["g",{"t":"num"},false],["b",{"t":"num"},false]]},"opt":false}],
  inner$orbitTheme$l: [{"name":"accent","d":{"t":"or","of":[{"t":"undef"},{"t":"str"}]},"opt":false}],
  inner$orbitTheme$l$$step: [{"name":"base","d":{"t":"obj","p":[["r",{"t":"num"},false],["g",{"t":"num"},false],["b",{"t":"num"},false]]},"opt":false}],
  inner$orbitTheme$sat: [{"name":"accent","d":{"t":"or","of":[{"t":"undef"},{"t":"str"}]},"opt":false}],
  inner$orbitTheme$sat$$step: [{"name":"s","d":{"t":"num"},"opt":false}],
  inner$orbitTheme$accentHex: [{"name":"accent","d":{"t":"or","of":[{"t":"undef"},{"t":"str"}]},"opt":false}],
  inner$orbitTheme$accentHex$$step: [{"name":"base","d":{"t":"obj","p":[["r",{"t":"num"},false],["g",{"t":"num"},false],["b",{"t":"num"},false]]},"opt":false}],
  inner$orbitTheme$accentRgb: [{"name":"accent","d":{"t":"or","of":[{"t":"undef"},{"t":"str"}]},"opt":false}],
  inner$orbitTheme$accentRgb$$step: [{"name":"base","d":{"t":"obj","p":[["r",{"t":"num"},false],["g",{"t":"num"},false],["b",{"t":"num"},false]]},"opt":false}],
  inner$orbitTheme$groundHueShift: [{"name":"accent","d":{"t":"or","of":[{"t":"undef"},{"t":"str"}]},"opt":false}],
  inner$orbitTheme$groundHueShift$$step: [{"name":"h","d":{"t":"num"},"opt":false}],
  inner$orbitTheme$btnText: [{"name":"accent","d":{"t":"or","of":[{"t":"undef"},{"t":"str"}]},"opt":false}],
  inner$orbitTheme$btnText$$step: [{"name":"base","d":{"t":"obj","p":[["r",{"t":"num"},false],["g",{"t":"num"},false],["b",{"t":"num"},false]]},"opt":false}],
  inner$orbitTheme$scene: [{"name":"accent","d":{"t":"or","of":[{"t":"undef"},{"t":"str"}]},"opt":false}],
  inner$orbitTheme$scene$$step: [{"name":"h","d":{"t":"num"},"opt":false},{"name":"l","d":{"t":"num"},"opt":false}],
};
