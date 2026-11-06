// סבב 5 — אחרי סבב 4 (5/5 FAIL, "כמעט עובר"). תיקונים:
// • פרט בבעלות שמחזיק גם בצבע אחד: הרגל מנותקת מהעמוד ברווח קבוע, ונגמרת בקצה שמתעקל חזרה למעלה — "הצעד שחוזר" בצורה, לא בצבע
// • הרגל יוצאת מבסיס העמוד; ראש קצר; פינה פנימית מעוגלת (רדיוס קו-מרכז 8); מרכוז לפי מסה
// • צבע משני בלבד: נייבי/קרם הם הזהות; ירוק רק ברגל ורק מ-32px ומעלה. 16/24px = צבע אחד, גרסה ייעודית בלי רווח
export const C = { green: '#10B981', greenA11y: '#059669', navy: '#0F172A', cream: '#FBF8F1' };
const W = 9;
// גדול: רגל מנותקת ומתעקלת חזרה. קטן (≤24): אותה צללית, רגל מחוברת ועבה יותר.
const gimel = (ink, leg, small) => small
  ? `<path d="M37 41 L24.5 52.5" fill="none" stroke="${ink}" stroke-width="11" stroke-linecap="round"/>
     <path d="M23 12 H30 Q38 12 38 20 V53" fill="none" stroke="${ink}" stroke-width="11" stroke-linecap="round" stroke-linejoin="round"/>`
  // רגל ישרה בזווית ג מודפסת, מנותקת מהעמוד ברווח קבוע (≈3.5 יח׳) — הפרט שבבעלות, נשמר גם בצבע אחד
  : `<path d="M24 11 H30 Q38 11 38 19 V53" fill="none" stroke="${ink}" stroke-width="${W}" stroke-linecap="round" stroke-linejoin="round"/>
     <path d="M26 42.5 L18.5 51.5" fill="none" stroke="${leg}" stroke-width="${W}" stroke-linecap="round"/>`;
export const R5 = { id: 'gimel-returning-step', name: 'ג והצעד שחוזר',
  story: 'האות ג של גבי. הרגל שלה מנותקת לרגע מהעמוד — הצעד שיצא וחוזר: הכסף חוזר, בלי שתצטרך לרדוף. הפרט נשאר גם בצבע אחד.' };
export const VARIANTS = {
  'light': { bg: C.cream, svg: s => s ? gimel(C.navy, C.navy, true) : gimel(C.navy, C.greenA11y) },
  'dark': { bg: C.navy, svg: s => s ? gimel(C.cream, C.cream, true) : gimel(C.cream, C.green) },
  'mono-light': { bg: '#FFFFFF', svg: s => gimel(C.navy, C.navy, s) },
  'mono-dark': { bg: '#000000', svg: s => gimel(C.cream, C.cream, s) },
  'app-icon': { bg: C.cream, svg: s => `<rect width="64" height="64" rx="15" fill="${C.navy}"/><g transform="translate(6.4 4.8) scale(0.8)">${s ? gimel(C.cream, C.cream, true) : gimel(C.cream, C.green)}</g>` },
};
export const svgR5 = (v, px) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="${px}" height="${px}" role="img" aria-label="גבי">${VARIANTS[v].svg(px <= 24).trim()}</svg>`;
