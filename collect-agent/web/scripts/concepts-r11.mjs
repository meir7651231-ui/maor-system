// סבב 11 — אחרי סבב 10 (2/5 ✓ בעל-עסק ✓ אסטרטגיה; ✗ מלאכה: עקב/a, אריח-טבעת; ✗ נגישות: אריח ≤24; ✗ סימן-מסחר: "אות מוקלדת").
// השינוי המרכזי: המטבע נכנס לכתף — האות "מפנה לו מקום": הקו נגזר סביב המטבע (נגיסה), נשאר חצי קו.
//   זה פרט שאין לשום פונט (קו שמשנה עובי כי משהו יושב בו), נראה גם ב-24, ונשמר במונו.
// • נגיסה = עיגול r+4 סביב המטבע (r=6.5) ⇒ מרווח 4 יח׳ מכל קו (1.23px ב-16) · עובי שארית בכתף 4.55 (≈ חצי קו)
// • עקב קצר יותר (הרגל יוצאת ב-y=42.5) · ב בכתף זהה ל-ג (15.5) — מערכת עיקול אחת
// • אריח רק ≥48px, בלי טבעת פנימית: קו-שפה דק בקרם צמוד לקצה (בתוך אזור-הבטיחות) · ≤32px = הסימן לבדו (פאביקון)
export const C = { navy: '#0F172A', cream: '#FBF8F1', green: '#10B981', greenA11y: '#059669' };
export const W = 9;
export const COIN = { cx: 33.5, cy: 23.5, r: 6.5, gap: 4 };
export const GIMEL = 'M19 11.5 H30 A15.5 15.5 0 0 1 45.5 27 V50 M45.5 42.5 L30 50';
export const BET = 'M-17 11.5 H-12 A15.5 15.5 0 0 1 3.5 27 V50 M-18 50 H13';
export const YOD = 'M-43 11.5 H-38.5 A6 6 0 0 1 -32.5 17.5 V28';
let uid = 0;
const st = (d, c, mask) => `<path${mask ? ` mask="url(#${mask})"` : ''} d="${d}" fill="none" stroke="${c}" stroke-width="${W}" stroke-linecap="round" stroke-linejoin="round"/>`;
const mark = (ink, coin) => { const m = `bite${uid++}`;
  return `<mask id="${m}" maskUnits="userSpaceOnUse" x="-64" y="0" width="192" height="64"><rect x="-64" width="192" height="64" fill="#fff"/><circle cx="${COIN.cx}" cy="${COIN.cy}" r="${COIN.r + COIN.gap}" fill="#000"/></mask>${st(GIMEL, ink, m)}<circle cx="${COIN.cx}" cy="${COIN.cy}" r="${COIN.r}" fill="${coin}"/>`; };
export const R11 = { id: 'gimel-room', name: 'המקום של הכסף',
  story: 'המטבע חזר הביתה, והאות מפנה לו מקום: הכתף של ה-ג נעשית דקה בדיוק איפה שהמטבע יושב. בעברית נקודה בתוך אות היא דגש — ה-ג נשארת ג. רך, רגוע, בלי מרדף.' };
// אריח ≥48: מרכז תיבת-הסימן (32.25,30.75) מוזז אל (31,32) — המסה ימנית
const tile = () => { const s = 0.8, tx = 31 - 32.25 * s, ty = 32 - 30.75 * s;
  return `<rect width="64" height="64" rx="15" fill="${C.navy}"/><rect x="1.5" y="1.5" width="61" height="61" rx="13.5" fill="none" stroke="${C.cream}" stroke-opacity="0.55" stroke-width="1.25"/><g transform="translate(${tx} ${ty}) scale(${s})">${mark(C.cream, C.green)}</g>`; };
export const VARIANTS = {
  'light': { bg: C.cream, svg: () => mark(C.navy, C.greenA11y) },
  'dark': { bg: C.navy, svg: () => mark(C.cream, C.green) },
  'mono-light': { bg: '#FFFFFF', svg: () => mark('#000000', '#000000') },
  'mono-dark': { bg: '#000000', svg: () => mark('#FFFFFF', '#FFFFFF') },
  // ≤32px אין אריח: פאביקון = הסימן לבדו (בהיר/כהה לפי הרקע)
  'app-icon': { bg: C.cream, svg: px => px <= 32 ? mark(C.navy, C.greenA11y) : tile() },
  'app-icon-darkos': { bg: '#2C2C2E', svg: px => px <= 32 ? mark(C.cream, C.green) : tile() },
};
const vb = (v, px) => px <= 32 ? '7 4 52 52' : '0 0 64 64';
export const svgR11 = (v, px) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${vb(v, px)}" width="${px}" height="${px}" role="img" aria-label="גבי">${VARIANTS[v].svg(px)}</svg>`;
export const lockupSvg = (ink, coin, h = 64) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="-52 3 106 56" height="${h}" width="${(h * 106 / 56).toFixed(1)}" role="img" aria-label="גבי">${mark(ink, coin)}${st(BET, ink)}${st(YOD, ink)}</svg>`;
