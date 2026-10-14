// 🔓 נוצר אוטומטית ע"י catalog/inner/scripts/open.mjs מתוך orbit:src/lib/publicSite.ts — לא לערוך ביד.
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
function rgbToHsl(r, g, b) {
    r /= 255;
    g /= 255;
    b /= 255;
    const max = Math.max(r, g, b), min = Math.min(r, g, b), d = max - min;
    const l = (max + min) / 2;
    let h = 0, s = 0;
    if (d) {
        s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
        if (max === r)
            h = ((g - b) / d + (g < b ? 6 : 0));
        else if (max === g)
            h = (b - r) / d + 2;
        else
            h = (r - g) / d + 4;
        h *= 60;
    }
    return [h, s, l];
}
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
export function inner$hslToRgb$x(h, s, l) {
    const c = (1 - Math.abs(2 * l - 1)) * s;
    const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
    return x;
}
export function inner$hslToRgb$x$$step(h, c) {
    const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
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
export function inner$sitePalette$base(accent) {
    const base = accent && accent.trim() ? hexToRgb(accent) : null;
    return base;
}
export function inner$sitePalette$h(accent) {
    const base = accent && accent.trim() ? hexToRgb(accent) : null;
    const [h, s0] = rgbToHsl(base[0], base[1], base[2]);
    return h;
}
export function inner$sitePalette$h$$step(base) {
    const [h, s0] = rgbToHsl(base[0], base[1], base[2]);
    return h;
}
export function inner$sitePalette$s0(accent) {
    const base = accent && accent.trim() ? hexToRgb(accent) : null;
    const [h, s0] = rgbToHsl(base[0], base[1], base[2]);
    return s0;
}
export function inner$sitePalette$s0$$step(base) {
    const [h, s0] = rgbToHsl(base[0], base[1], base[2]);
    return s0;
}
export function inner$sitePalette$s(accent) {
    const base = accent && accent.trim() ? hexToRgb(accent) : null;
    const [h, s0] = rgbToHsl(base[0], base[1], base[2]);
    const s = Math.max(0.42, Math.min(0.86, s0));
    return s;
}
export function inner$sitePalette$s$$step(s0) {
    const s = Math.max(0.42, Math.min(0.86, s0));
    return s;
}
export function inner$siteVocab$en(lang) {
    const en = lang === 'en';
    return en;
}
export function inner$campaignProgress$goal(c) {
    const goal = typeof c?.goal === 'number' && c.goal > 0 ? c.goal : 0;
    return goal;
}
export function inner$campaignProgress$raised(c) {
    const raised = typeof c?.raised === 'number' && c.raised > 0 ? c.raised : 0;
    return raised;
}
export function inner$campaignProgress$pct(c) {
    const goal = typeof c?.goal === 'number' && c.goal > 0 ? c.goal : 0;
    const raised = typeof c?.raised === 'number' && c.raised > 0 ? c.raised : 0;
    const pct = goal > 0 ? Math.max(0, Math.min(100, Math.round((raised / goal) * 100))) : 0;
    return pct;
}
export function inner$campaignProgress$pct$$step(goal, raised) {
    const pct = goal > 0 ? Math.max(0, Math.min(100, Math.round((raised / goal) * 100))) : 0;
    return pct;
}
export function inner$campaignProgress$t(c) {
    const t = Date.parse(c.end.slice(0, 10) + 'T00:00:00');
    return t;
}
export function inner$campaignProgress$diff(c, nowMs) {
    const t = Date.parse(c.end.slice(0, 10) + 'T00:00:00');
    const diff = Math.ceil((t - nowMs) / 86_400_000);
    return diff;
}
export function inner$campaignProgress$diff$$step(nowMs, t) {
    const diff = Math.ceil((t - nowMs) / 86_400_000);
    return diff;
}
export function inner$siteDonateUrl$payUrl(pay) {
    const payUrl = pay && typeof pay.payUrl === 'string' ? pay.payUrl : '';
    return payUrl;
}

export const SIGS = {
  inner$hexToRgb$m: [{"name":"hex","d":{"t":"str"},"opt":false}],
  inner$hexToRgb$n: [{"name":"h","d":{"t":"str"},"opt":false}],
  inner$rgbToHsl$max: [{"name":"r","d":{"t":"num"},"opt":false},{"name":"g","d":{"t":"num"},"opt":false},{"name":"b","d":{"t":"num"},"opt":false}],
  inner$rgbToHsl$min: [{"name":"r","d":{"t":"num"},"opt":false},{"name":"g","d":{"t":"num"},"opt":false},{"name":"b","d":{"t":"num"},"opt":false}],
  inner$rgbToHsl$d: [{"name":"r","d":{"t":"num"},"opt":false},{"name":"g","d":{"t":"num"},"opt":false},{"name":"b","d":{"t":"num"},"opt":false}],
  inner$rgbToHsl$d$$step: [{"name":"max","d":{"t":"num"},"opt":false},{"name":"min","d":{"t":"num"},"opt":false}],
  inner$rgbToHsl$l: [{"name":"r","d":{"t":"num"},"opt":false},{"name":"g","d":{"t":"num"},"opt":false},{"name":"b","d":{"t":"num"},"opt":false}],
  inner$rgbToHsl$l$$step: [{"name":"max","d":{"t":"num"},"opt":false},{"name":"min","d":{"t":"num"},"opt":false}],
  inner$hslToRgb$c: [{"name":"s","d":{"t":"num"},"opt":false},{"name":"l","d":{"t":"num"},"opt":false}],
  inner$hslToRgb$x: [{"name":"h","d":{"t":"num"},"opt":false},{"name":"s","d":{"t":"num"},"opt":false},{"name":"l","d":{"t":"num"},"opt":false}],
  inner$hslToRgb$x$$step: [{"name":"h","d":{"t":"num"},"opt":false},{"name":"c","d":{"t":"num"},"opt":false}],
  inner$hslToRgb$m: [{"name":"s","d":{"t":"num"},"opt":false},{"name":"l","d":{"t":"num"},"opt":false}],
  inner$hslToRgb$m$$step: [{"name":"l","d":{"t":"num"},"opt":false},{"name":"c","d":{"t":"num"},"opt":false}],
  inner$sitePalette$base: [{"name":"accent","d":{"t":"or","of":[{"t":"undef"},{"t":"str"}]},"opt":false}],
  inner$sitePalette$h: [{"name":"accent","d":{"t":"or","of":[{"t":"undef"},{"t":"str"}]},"opt":false}],
  inner$sitePalette$h$$step: [{"name":"base","d":{"t":"or","of":[{"t":"null"},{"t":"tup","of":[{"t":"num"},{"t":"num"},{"t":"num"}]}]},"opt":false}],
  inner$sitePalette$s0: [{"name":"accent","d":{"t":"or","of":[{"t":"undef"},{"t":"str"}]},"opt":false}],
  inner$sitePalette$s0$$step: [{"name":"base","d":{"t":"or","of":[{"t":"null"},{"t":"tup","of":[{"t":"num"},{"t":"num"},{"t":"num"}]}]},"opt":false}],
  inner$sitePalette$s: [{"name":"accent","d":{"t":"or","of":[{"t":"undef"},{"t":"str"}]},"opt":false}],
  inner$sitePalette$s$$step: [{"name":"s0","d":{"t":"num"},"opt":false}],
  inner$siteVocab$en: [{"name":"lang","d":{"t":"lit","v":["he","en","yi"]},"opt":false}],
  inner$campaignProgress$goal: [{"name":"c","d":{"t":"or","of":[{"t":"undef"},{"t":"obj","p":[["goal",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true],["raised",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true],["end",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["currency",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true]]}]},"opt":false}],
  inner$campaignProgress$raised: [{"name":"c","d":{"t":"or","of":[{"t":"undef"},{"t":"obj","p":[["goal",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true],["raised",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true],["end",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["currency",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true]]}]},"opt":false}],
  inner$campaignProgress$pct: [{"name":"c","d":{"t":"or","of":[{"t":"undef"},{"t":"obj","p":[["goal",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true],["raised",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true],["end",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["currency",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true]]}]},"opt":false}],
  inner$campaignProgress$pct$$step: [{"name":"goal","d":{"t":"num"},"opt":false},{"name":"raised","d":{"t":"num"},"opt":false}],
  inner$campaignProgress$t: [{"name":"c","d":{"t":"or","of":[{"t":"undef"},{"t":"obj","p":[["goal",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true],["raised",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true],["end",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["currency",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true]]}]},"opt":false}],
  inner$campaignProgress$diff: [{"name":"c","d":{"t":"or","of":[{"t":"undef"},{"t":"obj","p":[["goal",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true],["raised",{"t":"or","of":[{"t":"undef"},{"t":"num"}]},true],["end",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true],["currency",{"t":"or","of":[{"t":"undef"},{"t":"str"}]},true]]}]},"opt":false},{"name":"nowMs","d":{"t":"num"},"opt":false}],
  inner$campaignProgress$diff$$step: [{"name":"nowMs","d":{"t":"num"},"opt":false},{"name":"t","d":{"t":"num"},"opt":false}],
  inner$siteDonateUrl$payUrl: [{"name":"pay","d":{"t":"or","of":[{"t":"undef"},{"t":"obj","p":[["enabled",{"t":"bool"},false]]}]},"opt":false}],
};
