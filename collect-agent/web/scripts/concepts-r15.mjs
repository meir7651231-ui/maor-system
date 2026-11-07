// סבב 15 — אחרי סבב 14 (2/5 ✓אסטרטגיה ✓בעל-עסק). תיקונים:
// • סימן-מסחר: הליגטורה הוסרה — היא הפכה את ה-ג לצורת ב (נקרא «בּרי»). כל אות עומדת בפני עצמה; ב עם זנב-בסיס משלה.
// • מלאכה: הרגל יוצאת ב-55% מהגובה (y=35) ⇒ פתח אמיתי בין הרגל לעמוד · הדגש קרוב לעמוד ובאמצע הגוף (31,27) r=4
//   (מרווחים ראש 7 · עמוד 4.5 · רגל 6.35, נבדק) · אותו ציור ג בדיוק בסמל ובשם (קו 9, רדיוס פינה = 0.8×קו בכל האותיות)
// • 16px: מאסטר פיקסלים אמיתי — מלבנים שלמים על רשת 16 (קו 3px, דגש 2×2, פתחים ≥1px), crispEdges;
//   favicon.svg הוא אותו ציור (מוכפל ×2 ל-32 בדיוק)
export const C = { navy: '#0F172A', cream: '#FBF8F1', green: '#10B981', greenOnLight: '#047857' };
export const W = 9, R = 7.2;
export const GIMEL = `M28 11.5 H${44 - R} Q44 11.5 44 ${11.5 + R} V50 M44 35 L29 50`;
export const COIN = { cx: 31, cy: 27, r: 4 };
export const BET = `M-14 11.5 H${6 - R} Q6 11.5 6 ${11.5 + R} V50 M-15 50 H13`;
export const YOD = `M-40.5 11.5 H${-33 - R} Q-33 11.5 -33 ${11.5 + R} V27`;
const st = (d, c) => `<path d="${d}" fill="none" stroke="${c}" stroke-width="${W}" stroke-linecap="round" stroke-linejoin="round"/>`;
export const mark = (ink, coin) => st(GIMEL, ink) + `<circle cx="${COIN.cx}" cy="${COIN.cy}" r="${COIN.r}" fill="${coin}"/>`;
export const R15 = { id: 'gimel-dagesh-4', name: 'גּ — הדגש הוא המטבע',
  story: 'ה-ג של גבי, והדגש שבתוכה הוא מטבע — הכסף חזר למקום שלו, בתוך השם. אות עברית אמיתית, נקודה במקומה, בלי פינות חדות ובלי מרדף.' };
// מרכז-מסה ≈ (36.5,31) ⇒ הזזה
const centered = (ink, coin, s) => `<g transform="translate(${(32 - 36.5 * s).toFixed(2)} ${(32 - 31 * s).toFixed(2)}) scale(${s})">${mark(ink, coin)}</g>`;
export const tileSvg = (px = 1024) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="${px}" height="${px}" role="img" aria-label="גבי"><rect width="64" height="64" fill="${C.navy}"/>${centered(C.cream, C.green, 0.8)}</svg>`;
export const iosDarkSvg = () => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="1024" height="1024" role="img" aria-label="גבי">${centered(C.cream, C.green, 0.8)}</svg>`;
export const adaptiveFg = () => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="432" height="432">${centered(C.cream, C.green, 0.62)}</svg>`;
export const adaptiveBg = () => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="432" height="432"><rect width="64" height="64" fill="${C.navy}"/></svg>`;
export const adaptiveMono = () => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="432" height="432">${centered('#000000', '#000000', 0.62)}</svg>`;
// מאסטר 16: [x,y,w,h] בפיקסלים שלמים. גליף בעמודות 4–12 (מרכז-מסה ≈8), שורות 2–13
export const PIX = {
  ink: [[5, 2, 6, 3], [9, 2, 3, 12], [7, 8, 2, 2], [5, 10, 2, 2], [3, 12, 3, 2]],
  dot: [[5, 6, 2, 2]],
};
export const favPixel = (px = 16) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" width="${px}" height="${px}" shape-rendering="crispEdges" role="img" aria-label="גבי"><rect width="16" height="16" rx="3" fill="${C.navy}" shape-rendering="geometricPrecision"/>${PIX.ink.map(([x, y, w, h]) => `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${C.cream}"/>`).join('')}${PIX.dot.map(([x, y, w, h]) => `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${C.green}"/>`).join('')}</svg>`;
export const favBig = (px = 48) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="${px}" height="${px}" role="img" aria-label="גבי"><rect width="64" height="64" rx="14" fill="${C.navy}"/>${centered(C.cream, C.green, 0.86)}</svg>`;
export const VARIANTS = {
  'light': { bg: C.cream, svg: () => mark(C.navy, C.greenOnLight) },
  'dark': { bg: C.navy, svg: () => mark(C.cream, C.green) },
  'mono-light': { bg: '#FFFFFF', svg: () => mark('#000000', '#000000') },
  'mono-dark': { bg: '#000000', svg: () => mark('#FFFFFF', '#FFFFFF') },
};
export const svgR15 = (v, px) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${px <= 32 ? '10.5 5 52 52' : '0 0 64 64'}" width="${px}" height="${px}" role="img" aria-label="גבי">${VARIANTS[v].svg(px)}</svg>`;
export const lockupSvg = (ink, coin, h = 64) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="-47 3 99 56" height="${h}" width="${(h * 99 / 56).toFixed(1)}" role="img" aria-label="גבי">${mark(ink, coin)}${st(BET, ink)}${st(YOD, ink)}</svg>`;
