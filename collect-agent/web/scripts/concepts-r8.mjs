// סבב 8 — אחרי סבב 7 (1/5: "אות מפונט", "קר/סמכותי כמו בנק", חיתוך שלא נראה, מפשעה נסתמת ב-16, שפת-אריח חלשה).
// כיוון: ג רכה עם "מטבע" בקצה הראש — פרט שאין לאף ג בפונט, נראה גם ב-24, ומרכך את הטון.
// • אלמנט אחד: <path> אחד עם קו 9 וקצוות עגולים; העיגול בראש הוא תת-נתיב (עיגול r=3 בקו 9 ⇒ דיסקה r=7.5) — אין תפר
// • הרגל יוצאת גבוה מהעמוד ⇒ מפשעה פתוחה · כל הפינות עגולות באותה שפה (רדיוס הקו)
// • סמל־מילה: «גבי» כולה מצוירת באותו קו — לא פונט; ה-ג עם המטבע מובילה
export const C = { navy: '#0F172A', cream: '#FBF8F1', rimDark: '#64748B' };
export const W = 9;
const BALL = 'M20.5 16.5 a3 3 0 1 0 6 0 a3 3 0 1 0 -6 0';
export const GIMEL = `M27 15.5 H32.5 Q38.5 15.5 38.5 21.5 V48.5 M38.5 33.5 L24.5 48.5 ${BALL}`;
// «בי» באותו קו (משמאל ל-ג; RTL)
export const BET = 'M-23 15.5 H-4 Q2 15.5 2 21.5 V48.5 M-24 48.5 H6';
export const YOD = 'M-40 15.5 H-37 Q-33 15.5 -33 19.5 V28';
const ink = (d, c) => `<path d="${d}" fill="none" stroke="${c}" stroke-width="${W}" stroke-linecap="round" stroke-linejoin="round"/>`;
const gimel = c => ink(GIMEL, c);
export const R8 = { id: 'gimel-coin', name: 'ג והמטבע',
  story: 'הכסף שחזר נח בראש האות: ג של גבי בקו אחד רך, ובקצה הראש עיגול מלא — המטבע שחזר הביתה, והנקודה שסוגרת את העניין. בלי פינות חדות, בלי איום.' };
const tile = (s, rim) => { const o = (64 - 64 * s) / 2;
  return `<rect x="${rim ? 2 : 0}" y="${rim ? 2 : 0}" width="${rim ? 60 : 64}" height="${rim ? 60 : 64}" rx="${rim ? 13 : 15}" fill="${C.navy}"${rim ? ` stroke="${C.rimDark}" stroke-width="4"` : ''}/><g transform="translate(${o + 1.5 * s} ${o + 0.5}) scale(${s})">${gimel(C.cream)}</g>`; };
export const VARIANTS = {
  'light': { bg: C.cream, svg: () => gimel(C.navy) },
  'dark': { bg: C.navy, svg: () => gimel(C.cream) },
  'mono-light': { bg: '#FFFFFF', svg: () => gimel('#000000') },
  'mono-dark': { bg: '#000000', svg: () => gimel('#FFFFFF') },
  'app-icon': { bg: C.cream, svg: px => tile(px <= 24 ? 0.95 : 0.82, false) },
  // למערכת כהה: שפה #64748B ברוחב 4 יח׳ (=1px ב-16) — 4.2:1 מול שחור
  'app-icon-darkos': { bg: '#000000', svg: px => tile(px <= 24 ? 0.95 : 0.82, true) },
};
// פאביקון עצמאי ≤32px: viewBox צמוד (ריפוד ~4 יח׳) במקום רשת 64
const vb = (v, px) => (px <= 32 && !v.startsWith('app')) ? '6 7 48 48' : '0 0 64 64';
export const svgR8 = (v, px) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${vb(v, px)}" width="${px}" height="${px}" role="img" aria-label="גבי">${VARIANTS[v].svg(px)}</svg>`;
export const lockupSvg = (c, h = 64) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="-47 6 93 52" height="${h}" width="${h * 93 / 52}" role="img" aria-label="גבי">${ink(GIMEL, c)}${ink(BET, c)}${ink(YOD, c)}</svg>`;
