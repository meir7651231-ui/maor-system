// סבב 21 — אחרי סבב 20 (4/5; ✗ מלאכה בלבד). תיקונים:
// • שלד אחד לכל הגדלים: 32 ו-48 הם אותו מתאר וקטורי בדיוק (אותה פרופורציית ראש/רגל/הרמה/דגש), מוקטן,
//   עם קו כבד יותר בגדלים קטנים (32: 10 יח׳ = 5px · 48: 9.33 = 7px) וקצות העמוד על פיקסלים שלמים — לא ציורים נפרדים
// • פיצוי אופטי: אופקיים (ראש, בסיס ה-ב) דקים ב-8% מהאנכיים · פילט במפשעה r=1.2 (בלי "גבשושית")
// • שם: י צרה (56% מרוחב ה-ג) · ריווח: ג↔ב 6.6 מינ׳ (7.4 בראש) · ב↔י 5.7
// • דגש אחד בכל המערכת (r=4.5 = הקו); במקום דגש מוגדל — גודל-מינימום לשם: 28px גובה (חתימת-מייל ב-28)
// • אריח: הגליף 0.92 מהלוח (במקום 0.8), עוגן אופטי (37,30.75)
// • 16: כיפות מעוגלות (פיקסלי פינה הוסרו), רגל אלכסונית ברוחב 3 מורמת 2 פיקסלים, דגש עם פיקסל רווח אחד מכל צד
import { readFileSync } from 'node:fs';
const O = JSON.parse(readFileSync(new URL('./concepts-r21-outlines.json', import.meta.url), 'utf8'));
export const C = { navy: '#0F172A', cream: '#FBF8F1', green: '#10B981', greenOnLight: '#059669' };
export const COIN = { cx: 30, cy: 27, r: 4.5 };
export const mark = (ink, coin) => `<path d="${O.gimel}" fill="${ink}"/><circle cx="${COIN.cx}" cy="${COIN.cy}" r="${COIN.r}" fill="${coin}"/>`;
export const R21 = { id: 'gimel-dagesh-10', name: 'גּ — הדגש הוא המטבע',
  story: 'ה-ג של גבי, והדגש שבתוכה הוא מטבע — הכסף חזר למקום שלו, בתוך השם. אות עברית אמיתית, נקודה במקומה, בלי פינות חדות ובלי מרדף.' };
const AX = 37, AY = 30.75;
const centered = (ink, coin, s) => `<g transform="translate(${(32 - AX * s).toFixed(2)} ${(32 - AY * s).toFixed(2)}) scale(${s})">${mark(ink, coin)}</g>`;
export const tileSvg = (px = 1024) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="${px}" height="${px}" role="img" aria-label="גבי"><rect width="64" height="64" fill="${C.navy}"/>${centered(C.cream, C.green, 0.92)}</svg>`;
export const iosDarkSvg = () => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="1024" height="1024" role="img" aria-label="גבי">${centered(C.cream, C.green, 0.92)}</svg>`;
export const adaptiveFg = () => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="432" height="432">${centered(C.cream, C.green, 0.66)}</svg>`;
export const adaptiveBg = () => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="432" height="432"><rect width="64" height="64" fill="${C.navy}"/></svg>`;
export const adaptiveMono = () => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="432" height="432">${centered('#000000', '#000000', 0.66)}</svg>`;
// 16: ראש עמודות 3–10 שורות 2–4 (פיקסלי פינה (3,2),(3,4) ו-(11,2) ריקים ⇒ כיפות מעוגלות) · עמוד 9–11 עד שורה 13 ·
//     רגל ברוחב 3: שורה 9 6–8 · 10 5–7 · 11 4–6 (מורמת 2) · דגש 6–7×6–7 ⇒ פיקסל רווח אחד לראש/לעמוד/לרגל
export const PIX = {
  ink: [[4, 2, 6, 3], [3, 3, 1, 1], [9, 2, 2, 12], [11, 3, 1, 11], [6, 9, 3, 1], [5, 10, 3, 1], [4, 11, 3, 1]],
  dot: [[6, 6, 2, 2]],
};
export const favPixel = (px = 16) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" width="${px}" height="${px}" shape-rendering="crispEdges" role="img" aria-label="גבי"><rect width="16" height="16" rx="3.5" fill="${C.navy}" shape-rendering="geometricPrecision"/>${PIX.ink.map(([x, y, w, h]) => `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${C.cream}"/>`).join('')}${PIX.dot.map(([x, y, w, h]) => `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${C.green}"/>`).join('')}</svg>`;
// 32/48: אותו מתאר (מוקטן מהשלד) · דגש על פיקסלים שלמים
export const fav32 = (px = 32) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" width="${px}" height="${px}" role="img" aria-label="גבי"><rect width="32" height="32" rx="7" fill="${C.navy}"/><path d="${O.g32}" fill="${C.cream}"/><circle cx="12.5" cy="14.5" r="2.5" fill="${C.green}"/></svg>`;
export const fav48 = (px = 48) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" width="${px}" height="${px}" role="img" aria-label="גבי"><rect width="48" height="48" rx="10.5" fill="${C.navy}"/><path d="${O.g48}" fill="${C.cream}"/><circle cx="20" cy="22" r="3" fill="${C.green}"/></svg>`;
const inBox = inner => `<g transform="translate(${32 - AX} ${32 - AY})">${inner}</g>`;
export const VARIANTS = {
  'light': { bg: C.cream, svg: () => inBox(mark(C.navy, C.greenOnLight)) },
  'dark': { bg: C.navy, svg: () => inBox(mark(C.cream, C.green)) },
  'mono-light': { bg: '#FFFFFF', svg: () => inBox(mark('#000000', '#000000')) },
  'mono-dark': { bg: '#000000', svg: () => inBox(mark('#FFFFFF', '#FFFFFF')) },
};
export const svgR21 = (v, px) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${px <= 32 ? '6 6 52 52' : '0 0 64 64'}" width="${px}" height="${px}" role="img" aria-label="גבי">${VARIANTS[v].svg(px)}</svg>`;
// שם: י ב-x −31.1…−17.5 ⇒ שוליים 4: ‎−35.1…52.5
export const LOCKUP_MIN_PX = 28;
export const lockupSvg = (ink, coin, h = 64) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="-35.1 3 87.6 56" height="${h}" width="${(h * 87.6 / 56).toFixed(1)}" role="img" aria-label="גבי"><path d="${O.gimel}" fill="${ink}"/><circle cx="${COIN.cx}" cy="${COIN.cy}" r="${COIN.r}" fill="${coin}"/><path d="${O.bet}" fill="${ink}"/><path d="${O.yod}" fill="${ink}"/></svg>`;
