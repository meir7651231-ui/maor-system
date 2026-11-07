// סבב 13 — אחרי סבב 12 (2/5 ✓ בעל-עסק ✓ סימן-מסחר). תיקונים לפי המבקרים:
// • מלאכה: המטבע = דגש אמיתי — r=4.5 (קוטר 9 = הקו, לא כבד ממנו), בתוך צללית האות (1.75 יח׳ פנימה מקצה-הראש);
//   מרווחים ראש 8 · עמוד 4.25 (1.31px ב-16) · רגל ≈8.2 (נבדק). ב רחבה עם זנב 6 יח׳ אחרי העמוד; ריווח אופטי.
// • נגישות: ירוק בהיר כהה יותר #047857 (5.17:1 על קרם, 4.18 על לשונית Chrome ‎#DEE1E6‎) ·
//   פאביקון אחד שמתחלף לפי prefers-color-scheme · אריח במאסטר לכל גודל-פלטפורמה עם קו-שיער של פיקסל-מכשיר אחד בדיוק,
//   בצורת סקווירקל (על-אליפסה n=5, כמו מסכת iOS) — נשאר גם אחרי מסכה, וב-512 הוא 1px בלבד (לא "מסגרת").
export const C = { navy: '#0F172A', cream: '#FBF8F1', green: '#10B981', greenOnLight: '#047857' };
export const GIMEL = 'M27 11.5 H35 Q42 11.5 42 18.5 V50 M42 40 L27 50';
export const COIN = { cx: 28.75, cy: 28.5, r: 4.5 };
export const BET = 'M-17 11.5 H-1 Q7 11.5 7 19.5 V50 M-18 50 H13';
export const YOD = 'M-40 11.5 H-37 Q-32 11.5 -32 16.5 V27';
const st = (d, c, w = 9) => `<path d="${d}" fill="none" stroke="${c}" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round"/>`;
export const mark = (ink, coin, w = 9) => st(GIMEL, ink, w) + `<circle cx="${COIN.cx}" cy="${COIN.cy}" r="${COIN.r}" fill="${coin}"/>`;
export const R13 = { id: 'gimel-dagesh-2', name: 'גּ — הדגש הוא המטבע',
  story: 'ה-ג של גבי, והדגש שבתוכה הוא מטבע: הכסף חזר למקום שלו, בתוך השם. אות עברית אמיתית, נקודה במקומה, בלי פינות חדות ובלי מרדף.' };
// סקווירקל (על-אליפסה n=5) סביב (32,32) בחצי-רוחב a
const squircle = a => { const n = 5, pts = [];
  for (let i = 0; i < 96; i++) { const t = (i / 96) * 2 * Math.PI, c = Math.cos(t), s = Math.sin(t);
    pts.push([32 + a * Math.sign(c) * Math.abs(c) ** (2 / n), 32 + a * Math.sign(s) * Math.abs(s) ** (2 / n)]); }
  return 'M' + pts.map(p => p.map(v => v.toFixed(3)).join(' ')).join(' L') + ' Z'; };
// אריח לגודל פלט px: קו-שיער ברוחב פיקסל-מכשיר אחד, ממורכז בפיקסל השני מהקצה
export const tileSvg = px => { const u = 64 / px, a = 32 - 1.5 * u, s = 0.8, tx = 32 - 33.75 * s, ty = 32 - 30.75 * s;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="${px}" height="${px}" role="img" aria-label="גבי"><path d="${squircle(32)}" fill="${C.navy}"/><path d="${squircle(a)}" fill="none" stroke="${C.cream}" stroke-opacity="0.55" stroke-width="${u.toFixed(4)}"/><g transform="translate(${tx} ${ty}) scale(${s})">${mark(C.cream, C.green)}</g></svg>`; };
export const TILE_SIZES = [48, 64, 96, 120, 128, 152, 167, 180, 192, 512, 1024];
// פאביקון יחיד: מתחלף לפי ערכת-המערכת
export const faviconSvg = () => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="7.5 5 52 52" role="img" aria-label="גבי"><style>.i{stroke:${C.navy}}.c{fill:${C.greenOnLight}}@media (prefers-color-scheme:dark){.i{stroke:${C.cream}}.c{fill:${C.green}}}</style><path class="i" d="${GIMEL}" fill="none" stroke-width="9" stroke-linecap="round" stroke-linejoin="round"/><circle class="c" cx="${COIN.cx}" cy="${COIN.cy}" r="${COIN.r}"/></svg>`;
export const VARIANTS = {
  'light': { bg: C.cream, svg: () => mark(C.navy, C.greenOnLight) },
  'dark': { bg: C.navy, svg: () => mark(C.cream, C.green) },
  'mono-light': { bg: '#FFFFFF', svg: () => mark('#000000', '#000000') },
  'mono-dark': { bg: '#000000', svg: () => mark('#FFFFFF', '#FFFFFF') },
  'tab-light': { bg: '#DEE1E6', svg: () => mark(C.navy, C.greenOnLight) },
  'tab-dark': { bg: '#202124', svg: () => mark(C.cream, C.green) },
};
const vb = px => px <= 32 ? '7.5 5 52 52' : '0 0 64 64';
export const svgR13 = (v, px) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${vb(px)}" width="${px}" height="${px}" role="img" aria-label="גבי">${VARIANTS[v].svg(px)}</svg>`;
export const lockupSvg = (ink, coin, h = 64) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="-48 3 98 56" height="${h}" width="${(h * 98 / 56).toFixed(1)}" role="img" aria-label="גבי">${mark(ink, coin, 8)}${st(BET, ink, 8)}${st(YOD, ink, 8)}</svg>`;
