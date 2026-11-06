// סבב 9 — אחרי סבב 8 (1/5: "המטבע לא נקרא כמטבע", "אות מפונט", ריווח שילוב, אריח שנעלם במערכת כהה).
// כיוון: «הכסף בבית» — מטבע עגול ונפרד יושב בתוך ה-ג, מתחת לראש ומשמאל לעמוד.
// • בעברית נקודה בתוך אות היא דגש ⇒ «גּ» נקראת ג (לא גרש: נקודה בפינה השמאלית-עליונה הייתה הופכת ל-ג׳=J; לא פּ)
// • המטבע אלמנט נפרד עם רווח ≥4 יח׳ מכל קו (אין תפר, אין "כדור בקצה") · ירוק רק במטבע; על בהיר #059669 (3.55:1), על כהה #10B981
// • אריח אוניברסלי: נייבי + מסגרת קרם מובנית (בלי וריאנט מותנה) — נראה על כל רקע מערכת
export const C = { navy: '#0F172A', cream: '#FBF8F1', green: '#10B981', greenA11y: '#059669' };
export const W = 9;
export const GIMEL = 'M24 13.5 H38 Q44 13.5 44 19.5 V49 M44 36 L25 49';
export const COIN = { cx: 28.5, cy: 29, r: 7 };
export const BET = 'M-14 13.5 H-2 Q4 13.5 4 19.5 V49 M-15 49 H8';
export const YOD = 'M-38 13.5 H-35 Q-31 13.5 -31 17.5 V28';
const st = (d, c) => `<path d="${d}" fill="none" stroke="${c}" stroke-width="${W}" stroke-linecap="round" stroke-linejoin="round"/>`;
const mark = (ink, coin) => st(GIMEL, ink) + `<circle cx="${COIN.cx}" cy="${COIN.cy}" r="${COIN.r}" fill="${coin}"/>`;
export const R9 = { id: 'gimel-home', name: 'הכסף בבית',
  story: 'המטבע חזר ונח בתוך ה-ג של גבי — מתחת לגג, ליד העמוד, בדיוק במקומו. בעברית נקודה בתוך אות היא דגש, אז ה-ג נשארת ג. בלי מרדף, בלי פינות חדות.' };
// אריח: מסגרת קרם מובנית (2.5 יח׳ בגדול, 4 יח׳ = 1px ב-16/24) ⇒ קצה האריח נראה גם על רקע מערכת כהה
const tile = px => { const small = px <= 24, s = small ? 0.98 : 0.8, rw = small ? 4 : 2.5, o = (64 - 64 * s) / 2;
  return `<rect x="${rw / 2}" y="${rw / 2}" width="${64 - rw}" height="${64 - rw}" rx="${15 - rw / 2}" fill="${C.navy}" stroke="${C.cream}" stroke-width="${rw}"/><g transform="translate(${o - 2 * s} ${o + 0.5 * s}) scale(${s})">${mark(C.cream, C.green)}</g>`; };
export const VARIANTS = {
  'light': { bg: C.cream, svg: () => mark(C.navy, C.greenA11y) },
  'dark': { bg: C.navy, svg: () => mark(C.cream, C.green) },
  'mono-light': { bg: '#FFFFFF', svg: () => mark('#000000', '#000000') },
  'mono-dark': { bg: '#000000', svg: () => mark('#FFFFFF', '#FFFFFF') },
  'app-icon': { bg: C.cream, svg: px => tile(px) },
  'app-icon-darkos': { bg: '#2C2C2E', svg: px => tile(px) }, // אותו קובץ בדיוק — רק הרקע שונה
};
// פאביקון עצמאי ≤32px: viewBox צמוד 52 (ריפוד אנכי 3.75 יח׳)
const vb = (v, px) => (px <= 32 && !v.startsWith('app')) ? '8 5 52 52' : '0 0 64 64';
export const svgR9 = (v, px) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${vb(v, px)}" width="${px}" height="${px}" role="img" aria-label="גבי">${VARIANTS[v].svg(px)}</svg>`;
// שילוב: «גּבי» באותו קו; רווח בין-אותיות זהה (7 יח׳ בין הקצוות) ג–ב וב–י
export const lockupSvg = (ink, coin, h = 64) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="-46 4 98 54" height="${h}" width="${(h * 98 / 54).toFixed(1)}" role="img" aria-label="גבי">${mark(ink, coin)}${st(BET, ink)}${st(YOD, ink)}</svg>`;
