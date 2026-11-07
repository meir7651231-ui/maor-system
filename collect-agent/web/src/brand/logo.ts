// ┌─────────────────────────────────────────────────────────────────────────────┐
// │ לוגו גבי — מקור יחיד. הלוגו הסופי (עיצוב מאיר, 7.11.2026):                   │
// │ היד של גבי משחררת את המטבע הירוק אל הארנק — "טיפלתי בזה. הנה הכסף."          │
// │ הערכים = ערכי-הכיוונון של הבעלים (docs/brand/concepts/gabi-final/README.md).  │
// │ להחלפה: לערוך כאן בלבד, ואז `npm run logo` (מייצר public/*.svg).              │
// │ הרכיב <LogoMark>/<Logo> (components/Logo.tsx) מרנדר מכאן — אין עותק נוסף.    │
// └─────────────────────────────────────────────────────────────────────────────┘
// טהור (בלי React/DOM) — נטען גם מסקריפט node וגם מהבדיקות.

export const BRAND = { green: '#10B981', greenOnLight: '#059669', navy: '#0F172A', cream: '#FBF8F1' } as const;
export const NAME = 'גבי';
export const SLOGAN = 'תזכורות תשלום';
export const VIEWBOX = 64;

/** ערכי-הבעלים מכלי-הכיוונון (לא לשנות בלי הכרעת מאיר). */
export const P = {
  handX: 11.1, handY: -14.8, handRot: 25, thumbRot: 6, cuffGap: 2.8, cuffW: 6.5,
  coinX: 22.5, coinY: 55, coinR: 6, coinGap: 1.6, walX: 8.4, walY: 56.1, walW: 27, walH: 17,
} as const;
const PALM = 'M9 31 C9 28.5 12.5 27.8 14 30 C16.5 35 20.5 37.8 26 37.8 C31 37.8 34.5 35.5 36.6 31.5 C38.4 28.6 41.6 28.4 43.4 30.6 C44.6 32.4 45.6 33.8 47.5 34.2 L52 35 L52 46.6 C45 46.6 40 46.4 35 46.6 C22 47.2 12 42 9.5 35 C9.2 33.8 9 32.4 9 31 Z';
const THUMB = 'M35.6 33.5 L35 22.5 C34.7 20.2 37.6 19 39 20.8 L42.4 30.5 L43.2 34 Z';
/** תיבת-התוכן של הסמל (נמדדה בדפדפן) — למרכוז על המשטח. */
const BOX = { x: 8.4, y: 8.386, w: 60.832, h: 64.714 };
/** רווח מטבע↔ארנק פר-שימוש: נמצא במיטוב-פיקסלים כך שבגדלים קטנים נשארת שורת-פיקסל נקייה (≥3:1). */
export const GAPS = { favicon: 1.6, inline: 3.8, master: P.coinGap } as const;

const f = (v: number) => +v.toFixed(3);
const wallet = (() => {
  const { walX: x, walY: y, walW: w, walH: h } = P;
  return {
    body: `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="5"/>`,
    slot: `<rect x="${f(x + 3.6)}" y="${f(y + 3.8)}" width="${f(w - 7.2)}" height="2.4" rx="1.2"/>`,
    tabOut: `<rect x="${f(x + w - 10.4)}" y="${f(y + h / 2 - 4.9)}" width="13.8" height="9.8" rx="4.9"/>`,
    tab: `<rect x="${f(x + w - 8.6)}" y="${f(y + h / 2 - 3.1)}" width="10.2" height="6.2" rx="3.1"/>`,
    dot: `<circle cx="${f(x + w - 3.8)}" cy="${f(y + h / 2)}" r="1.7"/>`,
  };
})();

export type MarkOpts = { onDark?: boolean; size?: number; gap?: number; id?: string };
/**
 * תוכן ה-SVG של הסמל בלוח 64 (בלי תג svg חיצוני).
 * onDark ⇒ דיו קרם ומטבע #10B981; אחרת דיו נייבי ומטבע #059669. המטבע הוא הירוק היחיד.
 * id ⇒ סיומת ייחודית למזהי mask/clipPath (כמה סמלים באותו עמוד).
 */
export const markInner = ({ onDark = false, size = 52, gap = GAPS.master, id = 'g' }: MarkOpts = {}): string => {
  const ink = onDark ? BRAND.cream : BRAND.navy;
  const coin = onDark ? BRAND.green : BRAND.greenOnLight;
  const k = size / Math.max(BOX.w, BOX.h);
  const tx = f(32 - k * (BOX.x + BOX.w / 2)), ty = f(32 - k * (BOX.y + BOX.h / 2));
  return `<defs><mask id="w-${id}" maskUnits="userSpaceOnUse" x="-100" y="-100" width="300" height="300">`
    + `<g fill="#fff">${wallet.body}${wallet.tabOut}</g><g fill="#000">${wallet.slot}${wallet.tabOut}</g>`
    + `<g fill="#fff">${wallet.tab}</g><g fill="#000">${wallet.dot}</g></mask>`
    + `<clipPath id="c-${id}"><rect x="-300" y="-300" width="600" height="${f(300 + P.walY - gap)}"/></clipPath></defs>`
    + `<g transform="translate(${tx} ${ty}) scale(${f(k)})">`
    + `<g transform="translate(${P.handX} ${P.handY}) rotate(${P.handRot} 32 32) translate(0 82) scale(1 -1)" fill="${ink}">`
    + `<path d="${PALM}"/><path d="${THUMB}" transform="rotate(${P.thumbRot} 39.4 31)"/>`
    + `<rect x="${f(52 + P.cuffGap)}" y="33" width="${P.cuffW}" height="16" rx="2.4"/></g>`
    + `<rect x="${f(P.walX - 5)}" y="${f(P.walY - 6)}" width="${P.walW + 12}" height="${P.walH + 12}" fill="${ink}" mask="url(#w-${id})"/>`
    + `<circle cx="${P.coinX}" cy="${P.coinY}" r="${P.coinR}" fill="${coin}" clip-path="url(#c-${id})"/></g>`;
};

/** אריח נייבי (אייקון/פאביקון) — הסמל בקרם עליו. */
export const TILE = `<rect width="${VIEWBOX}" height="${VIEWBOX}" rx="14" fill="${BRAND.navy}"/>`;

const svg = (w: number, inner: string, label = NAME) =>
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${VIEWBOX}" role="img" aria-label="${label}">${inner}</svg>\n`;

/** קובץ SVG שלם של הסמל. tile ⇒ על אריח נייבי (קרם+ירוק). */
export const markSvg = (tile: boolean, gap: number = GAPS.master): string =>
  svg(VIEWBOX, tile ? TILE + markInner({ onDark: true, size: 54, gap, id: 't' }) : markInner({ gap, id: 'm' }));

/** סמל + שם + תיאור (לרקע בהיר). */
export const wordmarkSvg = (): string =>
  svg(220, `<g>${markInner({ gap: GAPS.inline, id: 'l' })}</g>`
    + `<text x="76" y="38" font-family="Rubik, Heebo, Arial, sans-serif" font-weight="800" font-size="34" fill="${BRAND.navy}">${NAME}</text>`
    + `<text x="76" y="56" font-family="Heebo, Arial, sans-serif" font-weight="500" font-size="12" fill="#475569">${SLOGAN}</text>`,
  `${NAME} – ${SLOGAN}`);

/** הקבצים הציבוריים שנגזרים מהמקור (נכתבים ב-`npm run logo`, ונבדקים שלא סטו). */
export const PUBLIC_FILES: Record<string, string> = {
  'logo-mark.svg': markSvg(false),
  'favicon.svg': markSvg(true, GAPS.favicon),   // אריח נייבי: נראה על לשונית בהירה וכהה
  'logo.svg': wordmarkSvg(),
};
