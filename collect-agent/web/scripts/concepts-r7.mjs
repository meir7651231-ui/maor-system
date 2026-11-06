// סבב 7 — אחרי סבב 6 (0/5; תפר בין שני נתיבים, חיתוך שלא מקביל באמת, חריץ שנסתם ב-16, אצבע רחבה, גמגום בשילוב).
// • נתיב אחד סגור (אין תפר) · חיתוך הראש ורגל באותה זווית בדיוק — 45° (נבדק בבדיקה)
// • ראש 8.5 < עמוד 9.5 (אופטי) · מפשעה רחבה: בסיס 11 יח׳ (2.75px ב-16) · כף רגל 10.5 עם קצה קהה
// • בשילוב: הסימן הוא ה-ג של המילה «גבי» — אין אות כפולה
export const C = { green: '#10B981', navy: '#0F172A', cream: '#FBF8F1', rim: '#334155' };
export const PATH = 'M27 11 H41 Q44.5 11 44.5 14.5 V53 H35 V42 L24 53 H13.5 V51.5 L35 30 V25 Q35 19.5 29.5 19.5 H18.5 Z';
const DX = 1.5; // מרכוז לפי מסה (המסה ימנית)
const gimel = ink => `<path transform="translate(${DX} 0)" d="${PATH}" fill="${ink}"/>`;
export const R7 = { id: 'gimel-parallel', name: 'ג המקבילה',
  story: 'האות ג של גבי בצורה אחת: הראש נחתך באותה זווית בדיוק כמו הרגל, שני קווים מקבילים — היציאה והחזרה. הסימן הוא גם ה-ג של המילה «גבי».' };
const tile = (scale, rim) => { const s = scale, o = (64 - 64 * s) / 2;
  return `<rect x="0.75" y="0.75" width="62.5" height="62.5" rx="14.5" fill="${C.navy}"${rim ? ` stroke="${C.rim}" stroke-width="1.5"` : ''}/><g transform="translate(${o} ${o + 0.5}) scale(${s})">${gimel(C.cream)}</g>`; };
export const VARIANTS = {
  'light': { bg: C.cream, svg: () => gimel(C.navy) },
  'dark': { bg: C.navy, svg: () => gimel(C.cream) },
  'mono-light': { bg: '#FFFFFF', svg: () => gimel('#000000') },
  'mono-dark': { bg: '#000000', svg: () => gimel('#FFFFFF') },
  // באריח: 0.82 בגדלים גדולים, 0.9 ב-24/16 (פחות שוליים, יותר פיקסלים לסימן) + שפה בהירה לרקע מערכת כהה
  'app-icon': { bg: C.cream, svg: px => tile(px <= 24 ? 0.9 : 0.82, true) },
};
export const svgR7 = (v, px) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="${px}" height="${px}" role="img" aria-label="גבי">${VARIANTS[v].svg(px)}</svg>`;
