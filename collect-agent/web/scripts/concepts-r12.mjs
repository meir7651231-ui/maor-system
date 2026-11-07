// סבב 12 — אחרי סבבים 10–11 (2/5 ו-1/5): ה-ג היה רחב מדי (נקרא ר/ד, "ראש ציפור עם עין"), המטבע נדחק לפינה ונקרא עין,
//   ואריח עם טבעת/קו "נראה כמו חותמת". התיקונים:
// • פרופורציה של ג אמיתית: ראש קצר (‎29–42‎), יחס רוחב/גובה ≈0.55 (כמו Rubik/Heebo) — הרגל נושאת את הרוחב
// • המטבע במקום הדגש האמיתי: משמאל לעמוד, באמצע בין הראש לרגל ⇒ «גּ» ולא עין/ציפור · r=6 (1.33× הקו)
//   מרווחים: ראש 6 · עמוד 4.5 · רגל 7.45 (נבדק) — ≥1.38px ב-16
// • אריח: נייבי, בלי מסגרת פנימית; קו-שפה קרם 55% בתוך הקצה, מיושר לפיקסלים לכל מאסטר (48/64/512) — 4.5:1 על #2C2C2E
// • שילוב: קו 8 (קל יותר מהסמל), ב רחבה מ-ג (פרופורציה עברית), ריווח אופטי
export const C = { navy: '#0F172A', cream: '#FBF8F1', green: '#10B981', greenA11y: '#059669' };
export const GIMEL = 'M29 11.5 H35 Q42 11.5 42 18.5 V50 M42 40 L25 50';
export const COIN = { cx: 27, cy: 28, r: 6 };
export const BET = 'M-18 11.5 H2 Q10 11.5 10 19.5 V50 M-19 50 H12';
export const YOD = 'M-41 11.5 H-38 Q-33 11.5 -33 16.5 V27';
const st = (d, c, w = 9) => `<path d="${d}" fill="none" stroke="${c}" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round"/>`;
const mark = (ink, coin, w = 9) => st(GIMEL, ink, w) + `<circle cx="${COIN.cx}" cy="${COIN.cy}" r="${COIN.r}" fill="${coin}"/>`;
export const R12 = { id: 'gimel-dagesh', name: 'גּ — המטבע במקום הדגש',
  story: 'ה-ג של גבי, והנקודה שבתוכה היא מטבע — בדיוק במקום שבו עברית שמה דגש. הכסף חזר למקום שלו, בתוך השם. רגוע, מכובד, בלי מרדף.' };
// קו-שפה מיושר-פיקסלים: [מרכז, רוחב] ביחידות 64 לכל מאסטר
const EDGE = { 48: [2, 4 / 3], 64: [2.5, 1], big: [2, 0.5] };
const tile = px => { const [c, w] = EDGE[px] || EDGE.big, s = 0.82, tx = 32 - 33.25 * s, ty = 32 - 30.75 * s;
  return `<rect width="64" height="64" rx="15" fill="${C.navy}"/><rect x="${c}" y="${c}" width="${64 - 2 * c}" height="${64 - 2 * c}" rx="${15 - c}" fill="none" stroke="${C.cream}" stroke-opacity="0.55" stroke-width="${w}"/><g transform="translate(${tx} ${ty}) scale(${s})">${mark(C.cream, C.green)}</g>`; };
export const VARIANTS = {
  'light': { bg: C.cream, svg: () => mark(C.navy, C.greenA11y) },
  'dark': { bg: C.navy, svg: () => mark(C.cream, C.green) },
  'mono-light': { bg: '#FFFFFF', svg: () => mark('#000000', '#000000') },
  'mono-dark': { bg: '#000000', svg: () => mark('#FFFFFF', '#FFFFFF') },
  'app-icon': { bg: C.cream, svg: px => px <= 32 ? mark(C.navy, C.greenA11y) : tile(px) },
  'app-icon-darkos': { bg: '#2C2C2E', svg: px => px <= 32 ? mark(C.cream, C.green) : tile(px) },
};
// סימן לבד ≤32: viewBox צמוד 52 (תיבת הסימן x 20.5–46.5, y 7–54.5)
const vb = (v, px) => px <= 32 ? '7.5 5 52 52' : '0 0 64 64';
export const svgR12 = (v, px) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${vb(v, px)}" width="${px}" height="${px}" role="img" aria-label="גבי">${VARIANTS[v].svg(px)}</svg>`;
export const tileSvg = px => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="${px}" height="${px}" role="img" aria-label="גבי">${tile(px)}</svg>`;
export const lockupSvg = (ink, coin, h = 64) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="-49 3 99 56" height="${h}" width="${(h * 99 / 56).toFixed(1)}" role="img" aria-label="גבי">${mark(ink, coin, 8)}${st(BET, ink, 8)}${st(YOD, ink, 8)}</svg>`;
