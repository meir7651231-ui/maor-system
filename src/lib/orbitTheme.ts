/**
 * 🎨 ערכת-הצבע של מסך ההרשמה (אורביט) — נגזרת-ארגון.
 *
 * המודל (הכרעת-בעלים): "ההרשמה הראשונה זה רק אורביט; בהמשך זה יגיע מהאתר שלהם".
 * ⇒ ברירת-מחדל (אין accent) = **אורביט**, כחול קוסמי. אם לארגון יש `config.accent`
 * — המסך נצבע בזהות שלו (טוקני-CSS + בחירת פלטת-הכדור). טהור: בלי DOM/store,
 * נבדק ביחידה. הפלט = מפת משתני-CSS (מוזרקת ל-.orbit-screen) + שם-סצנה לכדור.
 */
export type OrbitScene = 'Aurora' | 'Ember' | 'Ice';

export interface OrbitTheme {
  vars: Record<string, string>;
  scene: OrbitScene;
}

/** אורביט — כחול קוסמי (הזהות של הפלטפורמה, ביט-זהה למקור). */
export const ORBIT_BLUE: OrbitTheme = {
  vars: {
    '--o-g1': '#1a2340',
    '--o-g2': '#0d1120',
    '--o-g3': '#070a12',
    '--o-a1': 'rgba(110,168,254,0.30)',
    '--o-a2': 'rgba(140,150,255,0.20)',
    '--o-a3': 'rgba(120,200,255,0.15)',
    '--o-a4': 'rgba(110,168,254,0.12)',
    '--o-accent': '#6ea8fe',
    '--o-accent-rgb': '110,168,254',
    '--o-accent2': '#8fa8ff',
    '--o-glow': 'rgba(120,150,255,0.30)',
    '--o-btn-a': '#7d9bff',
    '--o-btn-b': '#5570ff',
    '--o-btn-text': '#ffffff',
    '--accent': '#6ea8fe',
  },
  scene: 'Aurora',
};

const HEX6 = /^#?[0-9a-fA-F]{6}$/;

function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const h = hex.replace('#', '');
  return { r: parseInt(h.slice(0, 2), 16), g: parseInt(h.slice(2, 4), 16), b: parseInt(h.slice(4, 6), 16) };
}
function rgbToHsl(r: number, g: number, b: number): { h: number; s: number; l: number } {
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
    if (max === r) h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
    else if (max === g) h = ((b - r) / d + 2) / 6;
    else h = ((r - g) / d + 4) / 6;
  }
  return { h: h * 360, s, l };
}
function hslToRgb(h: number, s: number, l: number): { r: number; g: number; b: number } {
  h = ((h % 360) + 360) % 360 / 360;
  s = Math.min(1, Math.max(0, s));
  l = Math.min(1, Math.max(0, l));
  if (s === 0) {
    const v = Math.round(l * 255);
    return { r: v, g: v, b: v };
  }
  const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
  const p = 2 * l - q;
  const hue = (t: number) => {
    if (t < 0) t += 1;
    if (t > 1) t -= 1;
    if (t < 1 / 6) return p + (q - p) * 6 * t;
    if (t < 1 / 2) return q;
    if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
    return p;
  };
  return { r: Math.round(hue(h + 1 / 3) * 255), g: Math.round(hue(h) * 255), b: Math.round(hue(h - 1 / 3) * 255) };
}
const toHex = (c: { r: number; g: number; b: number }) =>
  '#' + [c.r, c.g, c.b].map((x) => Math.max(0, Math.min(255, Math.round(x))).toString(16).padStart(2, '0')).join('');
const rgbStr = (c: { r: number; g: number; b: number }) => `${Math.round(c.r)},${Math.round(c.g)},${Math.round(c.b)}`;
/** בהירות נתפסת (0..1) — לבחירת צבע-טקסט מנוגד על הכפתור. */
const luminance = (c: { r: number; g: number; b: number }) => (0.299 * c.r + 0.587 * c.g + 0.114 * c.b) / 255;

/**
 * מחזיר ערכת-מסך לפי accent. חסר/לא-תקין ⇒ אורביט (כחול). accent תקין ⇒ ערכה
 * נגזרת: קרקע כהה בגוון-האקסנט, אַאוּרוֹרה סביב הגוון, כפתור וזוהר באקסנט, וסצנת-
 * כדור לפי הגוון (חם⇒Ember · קריר⇒Aurora · בהיר-מאוד⇒Ice).
 */
export function orbitTheme(accent?: string): OrbitTheme {
  if (!accent || !HEX6.test(accent.trim())) return ORBIT_BLUE;
  const base = hexToRgb(accent.trim());
  const { h, s, l } = rgbToHsl(base.r, base.g, base.b);
  const sat = Math.max(0.35, Math.min(0.95, s));
  const accentHex = toHex(base);
  const accentRgb = rgbStr(base);
  const accent2 = hslToRgb(h + 6, sat, Math.min(0.74, l + 0.1));
  // קרקע — כהה מאוד, גוון-האקסנט עם עומק (הסטה קלה לעבר מגנטה לחום/ורוד)
  const groundHueShift = h >= 15 && h <= 70 ? -12 : 0;
  const g1 = hslToRgb(h + groundHueShift, Math.min(0.5, sat * 0.6), 0.13);
  const g2 = hslToRgb(h + groundHueShift, Math.min(0.55, sat * 0.62), 0.075);
  const g3 = hslToRgb(h + groundHueShift, Math.min(0.5, sat * 0.6), 0.035);
  const auroraLo = rgbStr(hslToRgb(h - 18, sat, Math.min(0.66, l + 0.05)));
  const auroraHi = rgbStr(hslToRgb(h + 18, sat, Math.min(0.7, l + 0.08)));
  const btnA = hslToRgb(h, sat, Math.min(0.78, l + 0.12));
  const btnText = luminance(base) > 0.62 ? '#2a1710' : '#ffffff';
  const scene: OrbitScene = l > 0.86 ? 'Ice' : h >= 15 && h <= 70 ? 'Ember' : h >= 180 && h <= 265 ? 'Aurora' : 'Aurora';
  return {
    vars: {
      '--o-g1': toHex(g1),
      '--o-g2': toHex(g2),
      '--o-g3': toHex(g3),
      '--o-a1': `rgba(${accentRgb},0.30)`,
      '--o-a2': `rgba(${auroraHi},0.20)`,
      '--o-a3': `rgba(${auroraLo},0.15)`,
      '--o-a4': `rgba(${accentRgb},0.12)`,
      '--o-accent': accentHex,
      '--o-accent-rgb': accentRgb,
      '--o-accent2': toHex(accent2),
      '--o-glow': `rgba(${accentRgb},0.30)`,
      '--o-btn-a': toHex(btnA),
      '--o-btn-b': accentHex,
      '--o-btn-text': btnText,
      '--accent': accentHex,
    },
    scene,
  };
}
