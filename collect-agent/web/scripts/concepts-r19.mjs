// סבב 19 — אחרי סבב 18 (2/5 ✓בעל-עסק ✓אסטרטגיה; ✗מלאכה ✗סימן-מסחר). תיקונים:
// • ג: הרגל מורמת בבירור מקו-הבסיס (תחתית הכיפה 48.5 מול 54.5 של העמוד — 6 יח׳), (44,36)→(31,44); פילט r=2 חופף
// • מאסטר וקטורי ממורכז בלוח שלו (תיבה x 21.5–48.5 ⇒ הזזה −4, מרכז אופטי 1 שמאלה מהגיאומטרי)
// • שם: מרווחים לפי קווי-המתאר — ג ראש↔ב עמוד 6.5 · כיפת זנב-ב↔כיפת רגל-ג 6.2 · ב↔י 5.5
// • 32 ו-48: מאסטרים נפרדים, ממורכזים, כל הקצוות (ראש/עמוד/דגש) על פיקסלים שלמים, עם אותו פילט ואותה רגל מורמת
// • 16: רגל בעובי 2–3px (2px באלכסון), מחוברת לעמוד בשתי שורות, מורמת פיקסל מעל קו-הבסיס
export const C = { navy: '#0F172A', cream: '#FBF8F1', green: '#10B981', greenOnLight: '#047857' };
export const W = 9, R = 7.2;
export const GIMEL = `M26 11.5 H${44 - R} Q44 11.5 44 ${11.5 + R} V50 M44 36 L31 44`;
export const FILLET = 'M39.50 47.63 L42.47 47.63 L42.47 40.00 L40.55 38.12 L35.15 43.82 L36.45 45.93 A2 2 0 0 1 39.50 47.63 Z';
export const COIN = { cx: 29.5, cy: 27, r: 4 };
export const BET = `M-9.5 11.5 H${10.5 - R} Q10.5 11.5 10.5 ${11.5 + R} V50 M-9.5 50 H17`;
export const YOD = 'M-33 11.5 H-29 Q-24 11.5 -24 16.5 V25';
const st = (d, c, w = W) => `<path d="${d}" fill="none" stroke="${c}" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round"/>`;
export const mark = (ink, coin, r = COIN.r) => st(GIMEL, ink) + `<path d="${FILLET}" fill="${ink}"/><circle cx="${COIN.cx}" cy="${COIN.cy}" r="${r}" fill="${coin}"/>`;
export const R19 = { id: 'gimel-dagesh-8', name: 'גּ — הדגש הוא המטבע',
  story: 'ה-ג של גבי, והדגש שבתוכה הוא מטבע — הכסף חזר למקום שלו, בתוך השם. אות עברית אמיתית, נקודה במקומה, בלי פינות חדות ובלי מרדף.' };
// מרכז אופטי: תיבה x 21.5–48.5 (מרכז 35) y 7–54.5 (מרכז 30.75) ⇒ מרכז אופטי (34,30.75)
const centered = (ink, coin, s) => `<g transform="translate(${(32 - 34 * s).toFixed(2)} ${(32 - 30.75 * s).toFixed(2)}) scale(${s})">${mark(ink, coin)}</g>`;
export const tileSvg = (px = 1024) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="${px}" height="${px}" role="img" aria-label="גבי"><rect width="64" height="64" fill="${C.navy}"/>${centered(C.cream, C.green, 0.8)}</svg>`;
export const iosDarkSvg = () => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="1024" height="1024" role="img" aria-label="גבי">${centered(C.cream, C.green, 0.8)}</svg>`;
export const adaptiveFg = () => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="432" height="432">${centered(C.cream, C.green, 0.62)}</svg>`;
export const adaptiveBg = () => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="432" height="432"><rect width="64" height="64" fill="${C.navy}"/></svg>`;
export const adaptiveMono = () => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="432" height="432">${centered('#000000', '#000000', 0.62)}</svg>`;
// 16: ראש 3 שורות עמודות 4–12 · עמוד 10–12 שורות 2–13 · רגל שורות 9–12 (מורמת) · דגש 6–7×6–7
export const PIX = {
  ink: [[4, 2, 9, 3], [10, 2, 3, 12], [8, 9, 2, 1], [7, 10, 3, 1], [6, 11, 3, 1], [5, 12, 3, 1]],
  dot: [[6, 6, 2, 2]],
};
export const favPixel = (px = 16) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" width="${px}" height="${px}" shape-rendering="crispEdges" role="img" aria-label="גבי"><rect width="16" height="16" rx="3.5" fill="${C.navy}" shape-rendering="geometricPrecision"/>${PIX.ink.map(([x, y, w, h]) => `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${C.cream}"/>`).join('')}${PIX.dot.map(([x, y, w, h]) => `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${C.green}"/>`).join('')}</svg>`;
// 32: קו 4 · ראש y4–8 מ-x6 · עמוד x20–24 · דגש (15,13) r2 = 13–17×11–15 · רגל (21.5,18.5)→(13.5,24)
const G32 = 'M8 6 H19 Q22 6 22 9 V27 M21.5 18.5 L13.5 24';
const F32 = 'M20.00 24.01 L21.32 24.01 L21.32 20.38 L20.49 19.48 L17.86 22.25 L18.46 23.17 A1 1 0 0 1 20.00 24.01 Z';
// 48: קו 6 · ראש y6–12 · עמוד x30–36 · דגש (22,19) r3 = 19–25×16–22
const G48 = 'M12 9 H28.5 Q33 9 33 13.5 V40.5 M32.25 27.75 L20.25 36';
const F48 = 'M30.00 36.02 L31.98 36.02 L31.98 30.56 L30.73 29.22 L26.79 33.38 L27.69 34.76 A1.5 1.5 0 0 1 30.00 36.02 Z';
export const fav32 = (px = 32) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" width="${px}" height="${px}" role="img" aria-label="גבי"><rect width="32" height="32" rx="7" fill="${C.navy}"/><path d="${G32}" fill="none" stroke="${C.cream}" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/><path d="${F32}" fill="${C.cream}"/><circle cx="15" cy="13" r="2" fill="${C.green}"/></svg>`;
export const fav48 = (px = 48) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" width="${px}" height="${px}" role="img" aria-label="גבי"><rect width="48" height="48" rx="10.5" fill="${C.navy}"/><path d="${G48}" fill="none" stroke="${C.cream}" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"/><path d="${F48}" fill="${C.cream}"/><circle cx="22" cy="19" r="3" fill="${C.green}"/></svg>`;
const inBox = (inner) => `<g transform="translate(-3 1.25)">${inner}</g>`;
export const VARIANTS = {
  'light': { bg: C.cream, svg: () => inBox(mark(C.navy, C.greenOnLight)) },
  'dark': { bg: C.navy, svg: () => inBox(mark(C.cream, C.green)) },
  'mono-light': { bg: '#FFFFFF', svg: () => inBox(mark('#000000', '#000000')) },
  'mono-dark': { bg: '#000000', svg: () => inBox(mark('#FFFFFF', '#FFFFFF')) },
};
export const svgR19 = (v, px) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${px <= 32 ? '6 6 52 52' : '0 0 64 64'}" width="${px}" height="${px}" role="img" aria-label="גבי">${VARIANTS[v].svg(px)}</svg>`;
export const lockupSvg = (ink, coin, h = 64, rr = h <= 24 ? 5.5 : COIN.r) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="-41.5 3 94 56" height="${h}" width="${(h * 94 / 56).toFixed(1)}" role="img" aria-label="גבי">${mark(ink, coin, rr)}${st(BET, ink)}${st(YOD, ink)}</svg>`;
