// סבב 18 — אחרי סבב 17 (2/5 ✓בעל-עסק ✓סימן-מסחר): הפאביקונים נקראו ↗/λ. תיקונים:
// • ג: רגל קצרה ושטוחה יותר (37° מהאופק) שנגמרת מעל קו-הבסיס — העמוד לבד על הקו (לא λ), פילט r=2 שחופף לתוך הקווים
// • שם: זנב ב 7 יח׳ אחרי העמוד · ב↔י מהודק ב-1.5 · שוליים שווים 4 יח׳ בשני צידי השילוב
// • 16: ראש ארוך (9px, עמודות 4–12), רגל קצרה שנוחתת מתחת לתחילת הראש (לא בולטת שמאלה), חריץ בין רגל לעמוד משורה 10
// • 32/48: ראש ארוך פי 2 מהבליטה הקודמת (מ-6), רגל שיוצאת גבוה יותר ונוחתת מתחת לראש
// • הפילט חופף לתוך הקו (אין תפר) · כלל גודל: חתימה ≤24px ⇒ נקודה r=5.5 (לא נעלמת)
// (היסטוריה — סבב 17:) אחרי סבב 16 (3/5 ✓בעל-עסק ✓אסטרטגיה ✓סימן-מסחר; ✗מלאכה ✗נגישות — שניהם על ריווח השם). תיקונים:
// • ריווח השם אחיד: ג–ב 6.5 למעלה / 5.5 בבסיס, ב–י 6 (נמדד) · בסיס ה-ב מיושר לראשו (בלי בליטה) · י: ראש 4 + קשת, ירידה ≈47%
// • דגש ממורכז בגוף: (29.5,27) ⇒ ראש 7 · עמוד 6 · רגל 7.4
// • 32/48: הרגל נוחתת על קו-הבסיס של העמוד (27), פילט במפשעה, תחילת הרגל בתוך העמוד (אין דליפה)
// • 16: רגל ברוחב 4 (כמו משקל העמוד באלכסון), שורות 9–13
// (היסטוריה — סבב 16:)
// • 16px: הדגש נגע ברגל באלכסון (באג שלי) — מאסטר חדש: רגל רציפה ברוחב 3 (כל שורה מוזזת פיקסל ⇒ מחוברת בצלעות),
//   דגש 2×2 ליד העמוד עם פיקסל נייבי מלא מכל צד כולל האלכסון, לוחית rx=3.5 (פרופורציונלית ל-32/48)
// • 32/48: מאסטרים מיושרים לפיקסלים (קו 4/6 על קווים שלמים, דגש על פיקסלים שלמים)
// • מפשעה: פילט r=1.5 בין הרגל לעמוד (לא זווית חדה) · ראש ארוך יותר (מ-26) ⇒ ג ולא 7/λ
// • שם: ב עם זנב קצר (4 אחרי העמוד), ריווח ב–י 6 · י עם ירידה ~47% (לא נקרא גרש/«גב׳»)
// • הוכחות: חתימת-מייל בגודל אמיתי · אייקון עם תג-התראה של iOS (הדגש לא נראה כתג)
export const C = { navy: '#0F172A', cream: '#FBF8F1', green: '#10B981', greenOnLight: '#047857' };
export const W = 9, R = 7.2;
export const GIMEL = `M26 11.5 H${44 - R} Q44 11.5 44 ${11.5 + R} V50 M44 37 L30 47.5`;
// הפילט נכנס 3 יח׳ לתוך העמוד והרגל — הקצה הגלוי היחיד שלו הוא הקשת
export const FILLET = 'M39.50 50.00 L42.5 50.00 L42.5 42.00 L40.80 39.40 L34.80 46.40 L36.30 48.40 A2 2 0 0 1 39.50 50.00 Z';
export const COIN = { cx: 29.5, cy: 27, r: 4 };
export const BET = `M-9.5 11.5 H${10.5 - R} Q10.5 11.5 10.5 ${11.5 + R} V50 M-9.5 50 H17`;
export const YOD = 'M-32 11.5 H-28 Q-23 11.5 -23 16.5 V25';
const st = (d, c) => `<path d="${d}" fill="none" stroke="${c}" stroke-width="${W}" stroke-linecap="round" stroke-linejoin="round"/>`;
export const mark = (ink, coin, r = COIN.r) => st(GIMEL, ink) + `<path d="${FILLET}" fill="${ink}"/><circle cx="${COIN.cx}" cy="${COIN.cy}" r="${r}" fill="${coin}"/>`;
export const R18 = { id: 'gimel-dagesh-7', name: 'גּ — הדגש הוא המטבע',
  story: 'ה-ג של גבי, והדגש שבתוכה הוא מטבע — הכסף חזר למקום שלו, בתוך השם. אות עברית אמיתית, נקודה במקומה, בלי פינות חדות ובלי מרדף.' };
const centered = (ink, coin, s) => `<g transform="translate(${(32 - 36 * s).toFixed(2)} ${(32 - 31 * s).toFixed(2)}) scale(${s})">${mark(ink, coin)}</g>`;
export const tileSvg = (px = 1024) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="${px}" height="${px}" role="img" aria-label="גבי"><rect width="64" height="64" fill="${C.navy}"/>${centered(C.cream, C.green, 0.8)}</svg>`;
export const iosDarkSvg = () => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="1024" height="1024" role="img" aria-label="גבי">${centered(C.cream, C.green, 0.8)}</svg>`;
export const adaptiveFg = () => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="432" height="432">${centered(C.cream, C.green, 0.62)}</svg>`;
export const adaptiveBg = () => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="432" height="432"><rect width="64" height="64" fill="${C.navy}"/></svg>`;
export const adaptiveMono = () => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="432" height="432">${centered('#000000', '#000000', 0.62)}</svg>`;
// 16px: [x,y,w,h]. ראש שורות 2–4 עמודות 5–12 · עמוד 10–12 שורות 2–13 · רגל 3 פיקסלים, מוזזת פיקסל לשורה, שורות 9–13 · דגש 7–8×6–7
export const PIX = {
  ink: [[4, 2, 9, 3], [10, 2, 3, 12], [7, 9, 3, 1], [5, 10, 4, 1], [4, 11, 3, 2]],
  dot: [[6, 6, 2, 2]],
};
export const favPixel = (px = 16) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" width="${px}" height="${px}" shape-rendering="crispEdges" role="img" aria-label="גבי"><rect width="16" height="16" rx="3.5" fill="${C.navy}" shape-rendering="geometricPrecision"/>${PIX.ink.map(([x, y, w, h]) => `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${C.cream}"/>`).join('')}${PIX.dot.map(([x, y, w, h]) => `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${C.green}"/>`).join('')}</svg>`;
// 32 (וגם 48 = ×1.5): קו 4 — ראש שורות 4–8, עמוד עמודות 18–22, דגש עמודות 12–16 שורות 10–14
const G32 = 'M6 6 H17 Q20 6 20 9 V27 M19.5 19.5 L11 25.5';
const F32 = 'M18 23.83 L18 25.64 A0.75 0.75 0 0 0 16.72 25.11 Z';
export const favHinted = (px = 32) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" width="${px}" height="${px}" role="img" aria-label="גבי"><rect width="32" height="32" rx="7" fill="${C.navy}"/><path d="${G32}" fill="none" stroke="${C.cream}" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/><circle cx="12.5" cy="13" r="2" fill="${C.green}"/></svg>`;
export const VARIANTS = {
  'light': { bg: C.cream, svg: () => mark(C.navy, C.greenOnLight) },
  'dark': { bg: C.navy, svg: () => mark(C.cream, C.green) },
  'mono-light': { bg: '#FFFFFF', svg: () => mark('#000000', '#000000') },
  'mono-dark': { bg: '#000000', svg: () => mark('#FFFFFF', '#FFFFFF') },
};
export const svgR18 = (v, px) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${px <= 32 ? '9.5 5 52 52' : '0 0 64 64'}" width="${px}" height="${px}" role="img" aria-label="גבי">${VARIANTS[v].svg(px)}</svg>`;
export const lockupSvg = (ink, coin, h = 64, rr = h <= 24 ? 5.5 : COIN.r) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="-40.5 3 93 56" height="${h}" width="${(h * 93 / 56).toFixed(1)}" role="img" aria-label="גבי">${mark(ink, coin, rr)}${st(BET, ink)}${st(YOD, ink)}</svg>`;
