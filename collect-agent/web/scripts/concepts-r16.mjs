// סבב 16 — אחרי סבב 15 (1/5). תיקונים:
// • 16px: הדגש נגע ברגל באלכסון (באג שלי) — מאסטר חדש: רגל רציפה ברוחב 3 (כל שורה מוזזת פיקסל ⇒ מחוברת בצלעות),
//   דגש 2×2 ליד העמוד עם פיקסל נייבי מלא מכל צד כולל האלכסון, לוחית rx=3.5 (פרופורציונלית ל-32/48)
// • 32/48: מאסטרים מיושרים לפיקסלים (קו 4/6 על קווים שלמים, דגש על פיקסלים שלמים)
// • מפשעה: פילט r=1.5 בין הרגל לעמוד (לא זווית חדה) · ראש ארוך יותר (מ-26) ⇒ ג ולא 7/λ
// • שם: ב עם זנב קצר (4 אחרי העמוד), ריווח ב–י 6 · י עם ירידה ~47% (לא נקרא גרש/«גב׳»)
// • הוכחות: חתימת-מייל בגודל אמיתי · אייקון עם תג-התראה של iOS (הדגש לא נראה כתג)
export const C = { navy: '#0F172A', cream: '#FBF8F1', green: '#10B981', greenOnLight: '#047857' };
export const W = 9, R = 7.2;
export const GIMEL = `M26 11.5 H${44 - R} Q44 11.5 44 ${11.5 + R} V50 M44 35 L29 50`;
export const FILLET = 'M39.5 45.86 L39.5 49.48 A1.5 1.5 0 0 0 36.94 48.42 Z';
export const COIN = { cx: 31, cy: 27, r: 4 };
export const BET = `M-14 11.5 H${6 - R} Q6 11.5 6 ${11.5 + R} V50 M-15 50 H10`;
export const YOD = `M-34.5 11.5 H${-29 - 5} Q-29 11.5 -29 16.5 V29.5`;
const st = (d, c) => `<path d="${d}" fill="none" stroke="${c}" stroke-width="${W}" stroke-linecap="round" stroke-linejoin="round"/>`;
export const mark = (ink, coin) => st(GIMEL, ink) + `<path d="${FILLET}" fill="${ink}"/><circle cx="${COIN.cx}" cy="${COIN.cy}" r="${COIN.r}" fill="${coin}"/>`;
export const R16 = { id: 'gimel-dagesh-5', name: 'גּ — הדגש הוא המטבע',
  story: 'ה-ג של גבי, והדגש שבתוכה הוא מטבע — הכסף חזר למקום שלו, בתוך השם. אות עברית אמיתית, נקודה במקומה, בלי פינות חדות ובלי מרדף.' };
const centered = (ink, coin, s) => `<g transform="translate(${(32 - 36 * s).toFixed(2)} ${(32 - 31 * s).toFixed(2)}) scale(${s})">${mark(ink, coin)}</g>`;
export const tileSvg = (px = 1024) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="${px}" height="${px}" role="img" aria-label="גבי"><rect width="64" height="64" fill="${C.navy}"/>${centered(C.cream, C.green, 0.8)}</svg>`;
export const iosDarkSvg = () => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="1024" height="1024" role="img" aria-label="גבי">${centered(C.cream, C.green, 0.8)}</svg>`;
export const adaptiveFg = () => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="432" height="432">${centered(C.cream, C.green, 0.62)}</svg>`;
export const adaptiveBg = () => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="432" height="432"><rect width="64" height="64" fill="${C.navy}"/></svg>`;
export const adaptiveMono = () => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="432" height="432">${centered('#000000', '#000000', 0.62)}</svg>`;
// 16px: [x,y,w,h]. ראש שורות 2–4 עמודות 5–12 · עמוד 10–12 שורות 2–13 · רגל 3 פיקסלים, מוזזת פיקסל לשורה, שורות 9–13 · דגש 7–8×6–7
export const PIX = {
  ink: [[5, 2, 8, 3], [10, 2, 3, 12], [8, 9, 3, 1], [7, 10, 3, 1], [6, 11, 3, 1], [5, 12, 3, 1], [4, 13, 3, 1]],
  dot: [[7, 6, 2, 2]],
};
export const favPixel = (px = 16) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" width="${px}" height="${px}" shape-rendering="crispEdges" role="img" aria-label="גבי"><rect width="16" height="16" rx="3.5" fill="${C.navy}" shape-rendering="geometricPrecision"/>${PIX.ink.map(([x, y, w, h]) => `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${C.cream}"/>`).join('')}${PIX.dot.map(([x, y, w, h]) => `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${C.green}"/>`).join('')}</svg>`;
// 32 (וגם 48 = ×1.5): קו 4 — ראש שורות 4–8, עמוד עמודות 18–22, דגש עמודות 12–16 שורות 10–14
const G32 = 'M11 6 H17 Q20 6 20 9 V27 M20 17 L12.5 25';
export const favHinted = (px = 32) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" width="${px}" height="${px}" role="img" aria-label="גבי"><rect width="32" height="32" rx="7" fill="${C.navy}"/><path d="${G32}" fill="none" stroke="${C.cream}" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/><circle cx="14" cy="12" r="2" fill="${C.green}"/></svg>`;
export const VARIANTS = {
  'light': { bg: C.cream, svg: () => mark(C.navy, C.greenOnLight) },
  'dark': { bg: C.navy, svg: () => mark(C.cream, C.green) },
  'mono-light': { bg: '#FFFFFF', svg: () => mark('#000000', '#000000') },
  'mono-dark': { bg: '#000000', svg: () => mark('#FFFFFF', '#FFFFFF') },
};
export const svgR16 = (v, px) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${px <= 32 ? '9.5 5 52 52' : '0 0 64 64'}" width="${px}" height="${px}" role="img" aria-label="גבי">${VARIANTS[v].svg(px)}</svg>`;
export const lockupSvg = (ink, coin, h = 64) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="-40 3 92 56" height="${h}" width="${(h * 92 / 56).toFixed(1)}" role="img" aria-label="גבי">${mark(ink, coin)}${st(BET, ink)}${st(YOD, ink)}</svg>`;
