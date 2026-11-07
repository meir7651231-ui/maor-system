// סבב 10 — אחרי סבב 9 (1/5: "נקרא a/ə ב-16", מרווח מטבע-רגל 3 ולא 4, "סתם אות+נקודה", מסגרת אריח שמסכת-מערכת חותכת).
// כיוון: «הכסף בבית» — האות עוטפת את המטבע.
// • הכתף של ה-ג היא קשת קונצנטרית למטבע ⇒ מרווח קבוע 4.5 יח׳ סביבו (ראש, כתף, עמוד) — גיאומטריה בבעלות שאין לאף ג בפונט
// • הרגל יוצאת נמוך (y=40.5) ובשיפוע מתון ⇒ אין טריז סתום, והקערה לא נסגרת ל-a
// • המטבע r=6.5 (1.44× הקו); מרווח למטבע ≥4.5 מכל קו (נבדק בבדיקה — כולל הרגל)
// • אריח: טבעת קרם פנימית (משובצת 4 יח׳ פנימה) — בטוחה למסכות iOS/Android, נראית על כל רקע
export const C = { navy: '#0F172A', cream: '#FBF8F1', green: '#10B981', greenA11y: '#059669' };
export const W = 9;
export const COIN = { cx: 30, cy: 27, r: 6.5 };
export const SHOULDER = 15.5; // רדיוס קו-האמצע של הכתף = r + מרווח 4.5 + חצי קו 4.5
export const GIMEL = `M19 11.5 H30 A${SHOULDER} ${SHOULDER} 0 0 1 45.5 27 V50 M45.5 40.5 L29.5 50`;
export const BET = 'M-15 11.5 H-6.5 A10 10 0 0 1 3.5 21.5 V50 M-16 50 H9';
export const YOD = 'M-41 11.5 H-37 A5.5 5.5 0 0 1 -31.5 17 V28';
const st = (d, c) => `<path d="${d}" fill="none" stroke="${c}" stroke-width="${W}" stroke-linecap="round" stroke-linejoin="round"/>`;
const mark = (ink, coin) => st(GIMEL, ink) + `<circle cx="${COIN.cx}" cy="${COIN.cy}" r="${COIN.r}" fill="${coin}"/>`;
export const R10 = { id: 'gimel-shelter', name: 'הכסף בבית · האות עוטפת',
  story: 'המטבע חזר הביתה: הכתף של ה-ג מתעגלת סביבו במרחק שווה, כמו גג. בעברית נקודה בתוך אות היא דגש — ה-ג נשארת ג. רך, רגוע, בלי מרדף.' };
// מרכוז אופטי: מרכז-המסה של הסימן ≈ (34,30) ⇒ הזזה של ‎-2‎ באריח
const tile = px => { const small = px <= 24, s = small ? 0.9 : 0.74, o = (64 - 64 * s) / 2, rw = small ? 4 : 2.5, ins = small ? 5 : 5.5;
  return `<rect width="64" height="64" rx="15" fill="${C.navy}"/><rect x="${ins}" y="${ins}" width="${64 - 2 * ins}" height="${64 - 2 * ins}" rx="${15 - ins + 1}" fill="none" stroke="${C.cream}" stroke-width="${rw}" opacity="${small ? 1 : 0.9}"/><g transform="translate(${o - 2 * s} ${o - 0.5 * s}) scale(${s})">${mark(C.cream, C.green)}</g>`; };
export const VARIANTS = {
  'light': { bg: C.cream, svg: () => mark(C.navy, C.greenA11y) },
  'dark': { bg: C.navy, svg: () => mark(C.cream, C.green) },
  'mono-light': { bg: '#FFFFFF', svg: () => mark('#000000', '#000000') },
  'mono-dark': { bg: '#000000', svg: () => mark('#FFFFFF', '#FFFFFF') },
  'app-icon': { bg: C.cream, svg: px => tile(px) },
  'app-icon-darkos': { bg: '#2C2C2E', svg: px => tile(px) }, // אותו קובץ — רק הרקע שונה
};
const vb = (v, px) => (px <= 32 && !v.startsWith('app')) ? '7 4 52 52' : '0 0 64 64';
export const svgR10 = (v, px) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${vb(v, px)}" width="${px}" height="${px}" role="img" aria-label="גבי">${VARIANTS[v].svg(px)}</svg>`;
export const lockupSvg = (ink, coin, h = 64) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="-50 3 104 56" height="${h}" width="${(h * 104 / 56).toFixed(1)}" role="img" aria-label="גבי">${mark(ink, coin)}${st(BET, ink)}${st(YOD, ink)}</svg>`;
