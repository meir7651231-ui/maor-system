// ┌─────────────────────────────────────────────────────────────────────────────┐
// │ לוגו גבי — מקור יחיד. לוגו זמני עד סבב קונספט חדש (הכרעת מאיר).              │
// │ להחלפת לוגו: לערוך רק את GLYPH (ואם צריך VIEWBOX), ואז `npm run logo`        │
// │ שמייצר את public/logo-mark.svg, public/favicon.svg ו-public/logo.svg.         │
// │ הרכיב <LogoMark>/<Logo> (components/Logo.tsx) מרנדר מכאן — אין עותק נוסף.    │
// └─────────────────────────────────────────────────────────────────────────────┘
// טהור (בלי React/DOM) — נטען גם מסקריפט node וגם מהבדיקות.

export const BRAND = { green: '#10B981', navy: '#0F172A', cream: '#FBF8F1' } as const;
export const NAME = 'גבי';
export const SLOGAN = 'תזכורות תשלום';
export const VIEWBOX = 64;

/** הסמל עצמו: ג עם בסיס מחייך; העין תמיד navy (הכרעת מאיר — גם על רקע כהה). */
export const GLYPH = [
  `<path d="M22 13h12a4 4 0 0 1 4 4v20" fill="none" stroke="${BRAND.green}" stroke-width="7" stroke-linecap="round" stroke-linejoin="round"/>`,
  `<path d="M38 37l-11 9" fill="none" stroke="${BRAND.green}" stroke-width="7" stroke-linecap="round"/>`,
  `<path d="M14 50q18 12 36 0" fill="none" stroke="${BRAND.green}" stroke-width="5" stroke-linecap="round"/>`,
  `<circle cx="48" cy="21" r="4.5" fill="${BRAND.navy}"/>`,
].join('');

/** אריח קרם מאחורי הסמל — חובה על רקע כהה (כדי שהעין ה-navy תיראה), ובפאביקון. */
export const TILE = `<rect width="${VIEWBOX}" height="${VIEWBOX}" rx="14" fill="${BRAND.cream}"/>`;

/** תוכן ה-SVG של הסמל (בלי תג svg חיצוני). */
export const markInner = (tile: boolean): string => (tile ? TILE : '') + GLYPH;

/** קובץ SVG שלם של הסמל. */
export const markSvg = (tile: boolean): string =>
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${VIEWBOX} ${VIEWBOX}" role="img" aria-label="${NAME}">${markInner(tile)}</svg>\n`;

/** סמל + שם + תיאור (לרקע בהיר). */
export const wordmarkSvg = (): string =>
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 220 ${VIEWBOX}" role="img" aria-label="${NAME} – ${SLOGAN}">` +
  `<g>${GLYPH}</g>` +
  `<text x="76" y="38" font-family="Rubik, Heebo, Arial, sans-serif" font-weight="800" font-size="34" fill="${BRAND.navy}">${NAME}</text>` +
  `<text x="76" y="56" font-family="Heebo, Arial, sans-serif" font-weight="500" font-size="12" fill="#475569">${SLOGAN}</text></svg>\n`;

/** הקבצים הציבוריים שנגזרים מהמקור (נכתבים ב-`npm run logo`, ונבדקים שלא סטו). */
export const PUBLIC_FILES: Record<string, string> = {
  'logo-mark.svg': markSvg(true),
  'favicon.svg': markSvg(true),   // לשונית דפדפן כהה ⇒ אריח כדי שהעין תיראה
  'logo.svg': wordmarkSvg(),
};
