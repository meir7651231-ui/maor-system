// סבב 6 — אחרי סבב 5 (5/5 FAIL): הרגל המנותקת = "כמוסה" + "רגל שבורה" + האות נקראת ר.
// כיוון חדש: ג טיפוגרפית בנויה מצורות מלאות, צבע אחד בכל הגרסאות.
// • ראש עם חיתוך אלכסוני מקביל לרגל (החתימה של הסימן) · עמוד ישר · רגל מחוברת שיוצאת מהבסיס
// • שתי כפות שטוחות על אותו קו בסיס (טיפוגרפיה, לא צינור) · פינה פנימית מעוגלת · פתח רגל-עמוד ≥5 יח׳ (≥1.25px ב-16)
// • בלי ירוק בסימן: נייבי/קרם/שחור/לבן. הירוק נשאר צבע ממשק בלבד (לא morning, לא כמוסה)
export const C = { green: '#10B981', navy: '#0F172A', cream: '#FBF8F1' };
const gimel = ink => `
  <path d="M25.5 11 H40 Q43.5 11 43.5 14.5 V53 H34.5 V24.5 Q34.5 21 31 21 H21.8 Z" fill="${ink}"/>
  <path d="M34.5 34.5 V46 L28.4 53 H16.2 Z" fill="${ink}"/>`;
export const R6 = { id: 'gimel-typographic', name: 'ג טיפוגרפית',
  story: 'האות ג של גבי, ציור אחד שלם: ראש בחיתוך אלכסוני שמקביל לרגל, ושתי כפות שעומדות יציב על אותו קו. רגוע, מסודר, עומד על הרגליים — הכסף במקום.' };
export const VARIANTS = {
  'light': { bg: C.cream, svg: () => gimel(C.navy) },
  'dark': { bg: C.navy, svg: () => gimel(C.cream) },
  'mono-light': { bg: '#FFFFFF', svg: () => gimel('#000000') },
  'mono-dark': { bg: '#000000', svg: () => gimel('#FFFFFF') },
  'app-icon': { bg: C.cream, svg: () => `<rect width="64" height="64" rx="15" fill="${C.navy}"/><g transform="translate(3.6 3.2) scale(0.9)">${gimel(C.cream)}</g>` },
};
export const svgR6 = (v, px) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="${px}" height="${px}" role="img" aria-label="גבי">${VARIANTS[v].svg(px).trim()}</svg>`;
