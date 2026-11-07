// סבב 25 — אחרי סבב 24 (✓בעל-עסק ✓אסטרטגיה ✓סימן-מסחר; ✗מלאכה). תיקונים:
// • דילול הראשים: עקומה פרוסה לכל אורך הבר (ידיות ב-⅓), גם ב-י (ראש באורך 3 כדי שיהיה מקום) — כלל אחד באמת
// • גלישה אופטית: כיפת העמוד של ג יורדת 0.7 מתחת לקו-הבסיס (עגול מול שטוח)
// • דגש = 0.72 מעובי הקו (r=3.25) ממורכז בבטן (31.5,26.5) — נקרא כדגש, לא כעין
// • רגל דקה ב-10% (8.1) ⇒ אין 'קשר' כהה בחיבור · 32/48: אותה זווית רגל כמו המאסטר
// • ריווח: ב קרובה יותר ל-ג (ראשים 9.9→ 7.4 בעמוד), ג↔ב מינ׳ 5.25, ב↔י 5.27
// • מרכוז לפי מרכז-מסה (39.25,29.56) ⇒ עוגן (38.5,30)
// (היסטוריה — סבב 24:) סבב 24 — אחרי סבב 23 (3/5 ✓בעל-עסק ✓אסטרטגיה ✓סימן-מסחר; ✗מלאכה ✗נגישות). תיקונים:
// • פיצוי אופטי בלי 'שקע': הקצה העליון של כל ראש ישר לגמרי; הדילול (8%) רק בקצה הפנימי, בשיפוע ארוך לכל אורך הראש
// • ג: רגל שטוחה ומורמת יותר (44,36)→(30,43.5) ⇒ המפשעה נפתחת לזווית רחבה, פילט r=2.5 (לא 'נגיסה')
// • ב: בסיס אופקי דק ב-8% מלמעלה (תחתית ישרה על הקו), זנב = 2 יח׳ ישרות + כיפה, פילטים r=1.6 משני צידי העמוד
// • י: אותו ראש ואותה כתף (רדיוסים 11.7/2.7) כמו ג ו-ב — כלל אחד לשלוש האותיות
// • 32/48: ראש ועמוד על פיקסלים שלמים (ללא דילול בגדלים קטנים) · 16: ראש 3 שורות מעוגל, דגש מוזח פנימה, רגל שטוחה מורמת
// • לוח: תצוגת-קישור בלי שקיפות (הנקודה נשארת #059669) ועם «באמצעות» · מדידות בבריף נמדדו מהקבצים
// (היסטוריה — סבב 23:) סבב 23 — אחרי סבב 22 (0/5 — לוח שבור + פגמי מתאר ב-ב וב-י). תיקונים:
// • ב: כלל אחד לכל האופקיים (ראש וגם בסיס דקים ב-8%) · זנב = כיפה שמרכזה על קו העמוד החיצוני ומתחברת בעקומה משיקה (בלי גוש/פינה)
//   · פילט r=1.6 בין הבסיס לעמוד מבפנים (כמו ב-ג)
// • י: ראש עגול → קשת r=6 → גבעול; 7 צמתים, משיק-רציף, בלי מדרגות או קוביות מנוונות · ירידה 52%
// • ריווח: ג↔ב מינ׳ 6.1 (8.9 בראשים) · ב↔י 5.8 · 16: תיאור מדויק = הפיקסלים · הגשה: בלי מלבן רקע
// • לוח: אריחי iOS-כהה/Android מוצגים, + Android מונוכרום, + כותרת עמוד-תשלום ותצוגה-מקדימה של קישור
// (היסטוריה — סבב 22:) סבב 22 — אחרי סבב 21 (3/5 ✓בעל-עסק ✓אסטרטגיה ✓נגישות; ✗מלאכה ✗סימן-מסחר — שניהם על איכות המתאר). תיקונים:
// • מתאר אנליטי נקי במקום פוליגון: כל אות = נתיב סגור אחד של קווים, קשתות (A) וקוביות (C) — 15–18 צמתים, משיק-רציף,
//   בלי קפיצות בחיבורים; פיצוי אופטי (ראש דק ב-8%) עובר בעקומה חלקה אל הכתף; פילטים r=1.6 מצוירים כקשתות (לא "סגירה")
//   המקור: concepts-r25-outline.py ⇒ concepts-r25-outlines.json
// • זנב ה-ב: כיפה עגולה אחת שהעמוד נכנס לתוכה (לא גוש) · י בלי פיצוי (ראש קצר — בלי מדרגה)
// • 32/48: אותו שלד, עם "מלכודת דיו" — רגל דקה ב-15% ומחוברת 2 יח׳ גבוה יותר כך שהמפשעה נשארת פתוחה בפיקסלים
// • 16: ראש 2 שורות; דגש עם 2 פיקסלי רווח מהראש ומהעמוד; רגל אלכסונית פתוחה כמו ב-32/48
// • קבצי הגשה: לוח שמתחיל ב-0,0, בלי aria-label שגוי (הסמל = "ג")
import { readFileSync } from 'node:fs';
const O = JSON.parse(readFileSync(new URL('./concepts-r25-outlines.json', import.meta.url), 'utf8'));
export const C = { navy: '#0F172A', cream: '#FBF8F1', green: '#10B981', greenOnLight: '#059669' };
export const COIN = { cx: 31.5, cy: 26.5, r: 3.25 };
export const mark = (ink, coin) => `<path d="${O.gimel}" fill="${ink}"/><circle cx="${COIN.cx}" cy="${COIN.cy}" r="${COIN.r}" fill="${coin}"/>`;
export const R25 = { id: 'gimel-dagesh-14', name: 'גּ — הדגש הוא המטבע',
  story: 'ה-ג של גבי, והדגש שבתוכה הוא מטבע — הכסף חזר למקום שלו, בתוך השם. אות עברית אמיתית, נקודה במקומה, בלי פינות חדות ובלי מרדף.' };
const AX = 38.5, AY = 30;
const centered = (ink, coin, s) => `<g transform="translate(${(32 - AX * s).toFixed(2)} ${(32 - AY * s).toFixed(2)}) scale(${s})">${mark(ink, coin)}</g>`;
const svgOpen = (w, h, px, label = 'ג') => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${px}" height="${+(px * h / w).toFixed(1)}" role="img" aria-label="${label}">`;
export const tileSvg = (px = 1024) => `${svgOpen(64, 64, px)}<rect width="64" height="64" fill="${C.navy}"/>${centered(C.cream, C.green, 0.92)}</svg>`;
export const iosDarkSvg = () => `${svgOpen(64, 64, 1024)}${centered(C.cream, C.green, 0.92)}</svg>`;
export const adaptiveFg = () => `${svgOpen(64, 64, 432)}${centered(C.cream, C.green, 0.66)}</svg>`;
export const adaptiveBg = () => `${svgOpen(64, 64, 432)}<rect width="64" height="64" fill="${C.navy}"/></svg>`;
export const adaptiveMono = () => `${svgOpen(64, 64, 432)}${centered('#000000', '#000000', 0.66)}</svg>`;
// 16 (בדיוק כמו בקובץ, מוזז עמודה שמאלה למרכוז-מסה): ראש שורות 2–4 (שורה 2 ו-4 עמודות 5–7, שורה 3 עמודות 4–7) מחובר לעמוד 8–10 עד שורה 13,
//     פיקסל הכתף (10,2) ריק · רגל: שורה 9 6–7 · 10 5–7 · 11 4–6 (מורמת 2) · דגש 2×2 עמודות 5–6 שורות 6–7
export const PIX = {
  ink: [[5, 2, 3, 1], [4, 3, 4, 1], [5, 4, 3, 1], [8, 2, 2, 12], [10, 3, 1, 11], [6, 9, 2, 1], [5, 10, 3, 1], [4, 11, 3, 1]],
  dot: [[5, 6, 2, 2]],
};
export const favPixel = (px = 16) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" width="${px}" height="${px}" shape-rendering="crispEdges" role="img" aria-label="ג"><rect width="16" height="16" rx="3.5" fill="${C.navy}" shape-rendering="geometricPrecision"/>${PIX.ink.filter(r => r[2] && r[3]).map(([x, y, w, h]) => `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${C.cream}"/>`).join('')}${PIX.dot.map(([x, y, w, h]) => `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${C.green}"/>`).join('')}</svg>`;
export const fav32 = (px = 32) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" width="${px}" height="${px}" role="img" aria-label="ג"><rect width="32" height="32" rx="7" fill="${C.navy}"/><g transform="translate(-2.5 0.75) scale(0.5)"><path d="${O.g32}" fill="${C.cream}"/></g><circle cx="12.5" cy="14.5" r="2.5" fill="${C.green}"/></svg>`;
export const fav48 = (px = 48) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" width="${px}" height="${px}" role="img" aria-label="ג"><rect width="48" height="48" rx="10.5" fill="${C.navy}"/><g transform="translate(-2.5 0.874) scale(0.75)"><path d="${O.g48}" fill="${C.cream}"/></g><circle cx="20" cy="22" r="3" fill="${C.green}"/></svg>`;
// מאסטר וקטורי בלוח 64 (0,0), מרוכז לפי העוגן האופטי
const inBox = inner => `<g transform="translate(${32 - AX} ${32 - AY})">${inner}</g>`;
export const VARIANTS = {
  'light': { bg: C.cream, svg: () => inBox(mark(C.navy, C.greenOnLight)) },
  'dark': { bg: C.navy, svg: () => inBox(mark(C.cream, C.green)) },
  'mono-light': { bg: '#FFFFFF', svg: () => inBox(mark('#000000', '#000000')) },
  'mono-dark': { bg: '#000000', svg: () => inBox(mark('#FFFFFF', '#FFFFFF')) },
};
export const svgR25 = (v, px) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${px <= 32 ? '6 6 52 52' : '0 0 64 64'}" width="${px}" height="${px}" role="img" aria-label="ג">${VARIANTS[v].svg(px)}</svg>`;
// שם (נמדד): x −34.84…48.5, y 7…55.2 ⇒ לוח 0,0 עם שוליים 4 מכל צד: הזזה (+38.84, −3), גודל 91.34×56.2
export const LOCKUP_MIN_PX = 28;
const word = (ink, coin) => `<g transform="translate(38.84 -3)"><path d="${O.gimel}" fill="${ink}"/><circle cx="${COIN.cx}" cy="${COIN.cy}" r="${COIN.r}" fill="${coin}"/><path d="${O.bet}" fill="${ink}"/><path d="${O.yod}" fill="${ink}"/></g>`;
export const lockupSvg = (ink, coin, h = 64) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 91.34 56.2" height="${h}" width="${(h * 91.34 / 56.2).toFixed(1)}" role="img" aria-label="גבי">${word(ink, coin)}</svg>`;
// דגם להגשה: סמל-משולב שחור-על-לבן (סמל + שם, בלי שורת-תיאור), לוח 0,0
export const filingSvg = () => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 91.34 56.2" width="1827" height="1124">${word('#000000', '#000000')}</svg>`;
