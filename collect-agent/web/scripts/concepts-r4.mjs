// סבב 4 — אחרי סבב 3 (5/5 FAIL): "7/חץ ↗", "חיוך אמזון", לוח עם שקיפות (צבעים שגויים), אייקון כ"שולח" ב-SMS.
// • האות ג (בלי גרש) בנויה מהצורה המודפסת שישראלים מכירים (Rubik/Heebo): ראש קצר, עמוד עד קו הבסיס,
//   רגל קצרה שיוצאת מחלקו התחתון של העמוד שמאלה-למטה. עובי אחיד, קצוות מעוגלים, ממורכז אופטית.
// • הרגל — "הצעד שחוזר" — היא הפרט הירוק. בלי קו מתחת (אמזון), בלי טבעת/עיגול (Power/מונוגרמה), בלי עין (פרצוף).
// • גרסת 16px ייעודית: קו עבה יותר ורגל קצרה יותר כדי שהפתח יישאר ≥2px.
export const C = { green: '#10B981', greenA11y: '#059669', navy: '#0F172A', cream: '#FBF8F1' };
const W = 9;
const gimel = (ink, leg, w = W, small = false) => {
  const legEnd = small ? 'L24.5 51' : 'L23 51';
  // הרגל מצוירת ראשונה (מתחת), העמוד מעליה — הרגל "יוצאת" מהעמוד בלי בליטה של הקצה המעוגל
  return `<path d="M39.5 36.5 ${legEnd}" fill="none" stroke="${leg}" stroke-width="${w}" stroke-linecap="round"/>` +
         `<path d="M24 13.5 H35.5 Q39.5 13.5 39.5 17.5 V51" fill="none" stroke="${ink}" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round"/>`;
};
export const R4 = { id: 'gimel-green-leg', name: 'ג שהרגל שלה חוזרת',
  story: 'האות ג של גבי, כמו שכל ישראלי קורא אותה. הרגל — הצעד שחוזר — בירוק: הכסף חוזר, בלי שתצטרך לרדוף. שקט, בלי חצים ובלי מסגרות.' };
export const VARIANTS = {
  'light': { bg: C.cream, svg: (s) => gimel(C.navy, C.greenA11y, s ? 10.5 : W, s) },
  'dark': { bg: C.navy, svg: (s) => gimel(C.cream, C.green, s ? 10.5 : W, s) },
  'mono-light': { bg: '#FFFFFF', svg: (s) => gimel(C.navy, C.navy, s ? 10.5 : W, s) },
  'mono-dark': { bg: '#000000', svg: (s) => gimel(C.cream, C.cream, s ? 10.5 : W, s) },
  'app-icon': { bg: C.cream, svg: (s) => `<rect width="64" height="64" rx="15" fill="${C.navy}"/><g transform="translate(3.2 3.2) scale(0.9)">${gimel(C.cream, C.green, s ? 11 : W, s)}</g>` },
};
export const svgR4 = (v, px) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="${px}" height="${px}" role="img" aria-label="גבי">${VARIANTS[v].svg(px <= 16).trim()}</svg>`;
