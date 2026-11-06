// סבב 3 — מועמד אחד שמאחד את סבב 2 (0/3, 15/15 FAIL). תיקונים:
// • שלד ג׳ חדש: גג כבד עם חיתוך אלכסוני משלו (לא גופן), עמוד מקוצר, רגל שמתפצלת גבוה ונגמרת מעל קו הבסיס ⇒ פתח ≥10 יח׳ (לא "1" ב-16px)
// • אופק ⇒ חיוך (קעור כלפי מעלה), מנותק מהאות ברווח ≥ עובי קו; רוחב ≈ האות +20%
// • בלי עיגול/טבעת (מונוגרמה גנרית / כפתור Power); נייבי/קרם נושאים את הזהות, הירוק רק בחיוך (לא morning)
// • אריח אפליקציה/פאביקון ייעודי: ריבוע מעוגל נייבי, ג׳ קרם, חיוך ירוק
export const C = { green: '#10B981', greenA11y: '#059669', navy: '#0F172A', cream: '#FBF8F1' };
const mark = (ink, accent) => `
  <path d="M16 9 H39 V18 H20.5 Z" fill="${ink}"/>
  <path d="M35 14 V39" fill="none" stroke="${ink}" stroke-width="8" stroke-linecap="round"/>
  <path d="M35 24 L23.5 36" fill="none" stroke="${ink}" stroke-width="8" stroke-linecap="round"/>
  <path d="M14 50 Q30.5 55.5 47 50" fill="none" stroke="${accent}" stroke-width="7" stroke-linecap="round"/>`;
export const R3 = { id: 'gimel-smile-horizon', name: 'ג׳ וחיוך-אופק',
  story: 'ג׳ של גבי עומדת מעל קו אופק מחייך: הכול הסתדר, הכסף בדרך, ואין מה לרדוף. בלי מטבע, בלי חץ, בלי מסגרת.' };
export const VARIANTS = {
  'light': { bg: C.cream, svg: () => mark(C.navy, C.greenA11y) },
  'dark': { bg: C.navy, svg: () => mark(C.cream, C.green) },
  'mono-light': { bg: '#FFFFFF', svg: () => mark(C.navy, C.navy) },
  'mono-dark': { bg: '#000000', svg: () => mark(C.cream, C.cream) },
  'app-icon': { bg: C.cream, svg: () => `<rect width="64" height="64" rx="15" fill="${C.navy}"/><g transform="translate(5.8 4.2) scale(0.82)">${mark(C.cream, C.green)}</g>` },
};
export const svgR3 = (v, px) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="${px}" height="${px}" role="img" aria-label="גבי">${VARIANTS[v].svg().trim()}</svg>`;
