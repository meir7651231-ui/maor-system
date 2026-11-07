// סבב 14 — אחרי סבב 13 (1/5). תיקונים לפי המבקרים:
// • מלאכה: מרווחי הדגש מאוזנים (ראש 7 · עמוד 5.5 · רגל 7.8, נבדק) · החיבור הוגבה (y=37) · כף-רגל רכה שנוחתת ופונה (פרט מצויר שאין בפונט)
//   · מרכוז אופטי (המסה ימנית ⇒ הזזה שמאלה) · מאסטר 16px מצויר על רשת פיקסלים (קו 3px שלם, דגש 3px, מרווח ≥1px)
// • שילוב: ליגטורה — רגל ה-ג ממשיכה והופכת לבסיס של ה-ב (התכונה הבעלית של סימן-המילה) · קו 8 לכל האותיות · דגש r=4 (= הקו)
//   · י: ראש 7 יח׳ וירידה 13.5 (לא נקרא כמקף) · ריווח 8–9
// • נגישות/פלטפורמות: פאביקון = לוחית נייבי + אות קרם + דגש #10B981 — רינדור אחד לכל כרום (בהיר/כהה/גלישה-בסתר), + PNG 16/32/48 + ICO
//   · אריחי אפליקציה מלאים-לקצה (אטומים, בלי מסכה ובלי קו-שיער — המערכת מציירת את הצורה) · נכס iOS "Dark" (אות על שקוף, המערכת מציירת לוחית כהה)
//   · Android adaptive: חזית (אזור-בטוח 66%) + רקע + מונוכרום
export const C = { navy: '#0F172A', cream: '#FBF8F1', green: '#10B981', greenOnLight: '#047857' };
export const GIMEL = 'M27 11.5 H35 Q42 11.5 42 18.5 V50 M42 37 L31 47 Q28.5 50 25 50';
export const COIN = { cx: 27.5, cy: 27.5, r: 4.5 };
// סימן-מילה (קו 8): ג → ליגטורה לבסיס ה-ב
export const WORD = {
  gimel: 'M27 11.5 H35 Q42 11.5 42 18.5 V50 M42 37 L31 47 Q28.5 50 25 50 H-11',
  bet: 'M-10 11.5 H2 Q10 11.5 10 19.5 V50',
  yod: 'M-34 11.5 H-32 Q-27 11.5 -27 16.5 V25',
  coin: { cx: 27.5, cy: 27.5, r: 4 },
};
const st = (d, c, w = 9) => `<path d="${d}" fill="none" stroke="${c}" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round"/>`;
export const mark = (ink, coin) => st(GIMEL, ink) + `<circle cx="${COIN.cx}" cy="${COIN.cy}" r="${COIN.r}" fill="${coin}"/>`;
export const R14 = { id: 'gimel-dagesh-3', name: 'גּ — הדגש הוא המטבע · ליגטורה',
  story: 'ה-ג של גבי והדגש שבתוכה הוא מטבע — הכסף חזר למקום שלו. בשם המלא הרגל של ה-ג נוחתת וממשיכה להיות הבסיס של ה-ב: קו אחד שיוצא וחוזר.' };
// מרכז-מסה ≈ (35,31) ⇒ הזזה למרכז 32,32
const centered = (ink, coin, s) => `<g transform="translate(${(32 - 35 * s).toFixed(2)} ${(32 - 31 * s).toFixed(2)}) scale(${s})">${mark(ink, coin)}</g>`;
// אריח אפליקציה: ריבוע מלא-לקצה, אטום (iOS/Android מסיכים בעצמם)
export const tileSvg = (px = 1024) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="${px}" height="${px}" role="img" aria-label="גבי"><rect width="64" height="64" fill="${C.navy}"/>${centered(C.cream, C.green, 0.8)}</svg>`;
export const iosDarkSvg = () => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="1024" height="1024" role="img" aria-label="גבי">${centered(C.cream, C.green, 0.8)}</svg>`;
export const adaptiveFg = () => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="432" height="432">${centered(C.cream, C.green, 0.62)}</svg>`;
export const adaptiveBg = () => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="432" height="432"><rect width="64" height="64" fill="${C.navy}"/></svg>`;
export const adaptiveMono = () => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="432" height="432">${centered('#000000', '#000000', 0.62)}</svg>`;
// פאביקון: לוחית נייבי — אותו רינדור בכל כרום. ≤16: מאסטר רשת-פיקסלים; 24/32: הגיאומטריה הראשית
export const fav16 = () => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" width="16" height="16" role="img" aria-label="גבי"><rect width="16" height="16" rx="3.5" fill="${C.navy}"/><path d="M7 3.5 H9.5 Q11.5 3.5 11.5 5.5 V12.5 M11.5 9.5 L8.75 11.75 Q8 12.5 6.5 12.5" fill="none" stroke="${C.cream}" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/><circle cx="6.5" cy="7.5" r="1.5" fill="${C.green}"/></svg>`;
export const favBig = (px = 32) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="${px}" height="${px}" role="img" aria-label="גבי"><rect width="64" height="64" rx="14" fill="${C.navy}"/>${centered(C.cream, C.green, 0.86)}</svg>`;
export const VARIANTS = {
  'light': { bg: C.cream, svg: () => mark(C.navy, C.greenOnLight) },
  'dark': { bg: C.navy, svg: () => mark(C.cream, C.green) },
  'mono-light': { bg: '#FFFFFF', svg: () => mark('#000000', '#000000') },
  'mono-dark': { bg: '#000000', svg: () => mark('#FFFFFF', '#FFFFFF') },
};
export const svgR14 = (v, px) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${px <= 32 ? '6 4 52 52' : '0 0 64 64'}" width="${px}" height="${px}" role="img" aria-label="גבי">${VARIANTS[v].svg(px)}</svg>`;
export const lockupSvg = (ink, coin, h = 64) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="-46 3 96 56" height="${h}" width="${(h * 96 / 56).toFixed(1)}" role="img" aria-label="גבי">${st(WORD.gimel, ink, 8)}${st(WORD.bet, ink, 8)}${st(WORD.yod, ink, 8)}<circle cx="${WORD.coin.cx}" cy="${WORD.coin.cy}" r="${WORD.coin.r}" fill="${coin}"/></svg>`;
