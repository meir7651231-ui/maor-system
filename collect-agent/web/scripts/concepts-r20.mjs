// סבב 20 — אחרי סבב 19 (3/5 ✓בעל-עסק ✓סימן-מסחר ✓נגישות; ✗אסטרטגיה: צבע הנקודה; ✗מלאכה). תיקונים:
// • צבע: נקודה על בהיר = #059669 (הירוק הנגיש של הפלטה; 3.55:1 קרם, 3.77:1 לבן) — לא צבע חמישי
// • מתאר יחיד: כל אות היא <path> מלא אחד (קו→buffer עגול, איחוד, "סגירה" r=2 = פילט במפשעה) — אין תפרים;
//   המקור: concepts-r20-outline.py ⇒ concepts-r20-outlines.json
// • ג: ראש קצר ב-2 (מ-28), רגל ארוכה יותר (44,36)→(29,45.5) שנגמרת מתחת לתחילת הראש, מורמת 4.5 (לא λ, אבל עם כף)
// • דגש r=4.5 = עובי הקו (במאסטר); בחתימה קטנה r=5.5 · מרווחים ראש 6.5 · עמוד 5 · רגל 6.1
// • מרכוז: לפי מרכז-מסה (38.3) ותיבה (36) ⇒ עוגן 37.5 — הגליף זז שמאלה באריחים
// • 16: כתף מעוגלת (פיקסל פינה הוסר), רגל מחוברת בשתי שורות, הוזז עמודה שמאלה · 32/48: בלי פילט (נוצר טריז), נקודה = עובי הקו
import { readFileSync } from 'node:fs';
const O = JSON.parse(readFileSync(new URL('./concepts-r20-outlines.json', import.meta.url), 'utf8'));
export const C = { navy: '#0F172A', cream: '#FBF8F1', green: '#10B981', greenOnLight: '#059669' };
export const COIN = { cx: 30, cy: 27, r: 4.5 };
export const mark = (ink, coin, r = COIN.r) => `<path d="${O.gimel}" fill="${ink}"/><circle cx="${COIN.cx}" cy="${COIN.cy}" r="${r}" fill="${coin}"/>`;
export const R20 = { id: 'gimel-dagesh-9', name: 'גּ — הדגש הוא המטבע',
  story: 'ה-ג של גבי, והדגש שבתוכה הוא מטבע — הכסף חזר למקום שלו, בתוך השם. אות עברית אמיתית, נקודה במקומה, בלי פינות חדות ובלי מרדף.' };
const AX = 37.5, AY = 30.75;
const centered = (ink, coin, s) => `<g transform="translate(${(32 - AX * s).toFixed(2)} ${(32 - AY * s).toFixed(2)}) scale(${s})">${mark(ink, coin)}</g>`;
export const tileSvg = (px = 1024) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="${px}" height="${px}" role="img" aria-label="גבי"><rect width="64" height="64" fill="${C.navy}"/>${centered(C.cream, C.green, 0.8)}</svg>`;
export const iosDarkSvg = () => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="1024" height="1024" role="img" aria-label="גבי">${centered(C.cream, C.green, 0.8)}</svg>`;
export const adaptiveFg = () => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="432" height="432">${centered(C.cream, C.green, 0.62)}</svg>`;
export const adaptiveBg = () => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="432" height="432"><rect width="64" height="64" fill="${C.navy}"/></svg>`;
export const adaptiveMono = () => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="432" height="432">${centered('#000000', '#000000', 0.62)}</svg>`;
// 16: ראש עמודות 3–10 שורות 2–4 · עמוד 9–11 (פיקסל הכתף (11,2) ריק) · רגל: 6–8 בשורות 9–10, 5–7 בשורה 11, 4–6 בשורה 12 · דגש 5–6×6–7
export const PIX = {
  ink: [[3, 2, 8, 3], [9, 2, 2, 12], [11, 3, 1, 11], [6, 9, 3, 2], [5, 11, 3, 1], [4, 12, 3, 1]],
  dot: [[5, 6, 2, 2]],
};
export const favPixel = (px = 16) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" width="${px}" height="${px}" shape-rendering="crispEdges" role="img" aria-label="גבי"><rect width="16" height="16" rx="3.5" fill="${C.navy}" shape-rendering="geometricPrecision"/>${PIX.ink.map(([x, y, w, h]) => `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${C.cream}"/>`).join('')}${PIX.dot.map(([x, y, w, h]) => `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${C.green}"/>`).join('')}</svg>`;
// 32: קו 4 · ראש y4–8 מ-x7 · עמוד x19–23 · דגש (14,13) r2 = 12–16×11–15 · רגל מורמת (21,18.5)→(13,23.5)
const G32 = 'M9 6 H18 Q21 6 21 9 V27 M21 18.5 L13 23.5';
// 48: קו 6 · ראש y6–12 מ-x10 · עמוד x29–35 · דגש (21,19) r3 = 18–24×16–22
const G48 = 'M13 9 H27.5 Q32 9 32 13.5 V40.5 M31.5 27.75 L19.5 35.25';
export const fav32 = (px = 32) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" width="${px}" height="${px}" role="img" aria-label="גבי"><rect width="32" height="32" rx="7" fill="${C.navy}"/><path d="${G32}" fill="none" stroke="${C.cream}" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/><circle cx="14" cy="13" r="2" fill="${C.green}"/></svg>`;
export const fav48 = (px = 48) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" width="${px}" height="${px}" role="img" aria-label="גבי"><rect width="48" height="48" rx="10.5" fill="${C.navy}"/><path d="${G48}" fill="none" stroke="${C.cream}" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"/><circle cx="21" cy="19" r="3" fill="${C.green}"/></svg>`;
// מאסטר וקטורי בלוח 64: אותו עוגן אופטי
const inBox = inner => `<g transform="translate(${32 - AX} ${32 - AY})">${inner}</g>`;
export const VARIANTS = {
  'light': { bg: C.cream, svg: () => inBox(mark(C.navy, C.greenOnLight)) },
  'dark': { bg: C.navy, svg: () => inBox(mark(C.cream, C.green)) },
  'mono-light': { bg: '#FFFFFF', svg: () => inBox(mark('#000000', '#000000')) },
  'mono-dark': { bg: '#000000', svg: () => inBox(mark('#FFFFFF', '#FFFFFF')) },
};
export const svgR20 = (v, px) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${px <= 32 ? '6 6 52 52' : '0 0 64 64'}" width="${px}" height="${px}" role="img" aria-label="גבי">${VARIANTS[v].svg(px)}</svg>`;
// שם: כל אות מתאר יחיד · ג ראש↔ב עמוד 8 · מינימום ג↔ב 6.2 · ב↔י 5.6 · שוליים 4
export const lockupSvg = (ink, coin, h = 64, rr = h <= 24 ? 5.5 : COIN.r) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="-40.5 3 93 56" height="${h}" width="${(h * 93 / 56).toFixed(1)}" role="img" aria-label="גבי"><path d="${O.gimel}" fill="${ink}"/><circle cx="${COIN.cx}" cy="${COIN.cy}" r="${rr}" fill="${coin}"/><path d="${O.bet}" fill="${ink}"/><path d="${O.yod}" fill="${ink}"/></svg>`;
