// סבב 2 — אחרי 5 מבקרים עוינים (0/5 עברו בסבב 1). דרישות: צורה רציפה אחת, צבע אחד עובד, בלי חץ/וי/אייקון-מלאי,
// זהות בתוך הצורה (ג׳), "חוזר ונסגר ברוגע", ירוק נגיש (#059669 על בהיר), קווים ≥6 (פאביקון ≥8).
export const C = { green: '#10B981', greenA11y: '#059669', navy: '#0F172A', cream: '#FBF8F1' };
// main = צבע הצורה. בבהיר: ירוק נגיש; בכהה: ירוק המותג. mono = נייבי/קרם בלבד.
// ג׳ מודפסת: גג קצר שמאלה, עמוד אנכי עד למטה, ורגל שמתפצלת מהעמוד אלכסונית שמאלה-למטה (לא "7", לא "ב").
const GIMEL = (x, y, k, m, w) => `<path d="M${x - 9 * k} ${y} H${x} V${y + 30 * k}" fill="none" stroke="${m}" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round"/>` +
  `<path d="M${x} ${y + 19 * k} L${x - 11 * k} ${y + 30 * k}" fill="none" stroke="${m}" stroke-width="${w}" stroke-linecap="round"/>`;
export const R2 = [
  {
    id: 'ring-gimel', name: 'טבעת פתוחה עם ג׳',
    story: 'טבעת שכמעט נסגרת — מה שיצא כמעט חזר, ואין צורך לדחוף. בפנים: ג׳ של גבי. בלי חץ ובלי וי.',
    svg: m => `<path d="M44.5 9.6 A26 26 0 1 0 54.4 19.5" fill="none" stroke="${m}" stroke-width="7" stroke-linecap="round"/>` + GIMEL(37, 18, 0.95, m, 7),
  },
  {
    id: 'coin-gimel', name: 'מטבע ג׳',
    story: 'מטבע שלם — הכסף שחזר — והאות ג׳ חצובה בתוכו בחלל שלילי. בלי תנועה ובלי לחץ: הוא פשוט כאן.',
    svg: (m, bg) => `<circle cx="32" cy="32" r="27" fill="${m}"/>` + GIMEL(37, 17, 1, bg, 7),
  },
  {
    id: 'gimel-horizon', name: 'ג׳ על אופק',
    story: 'ג׳ שעומדת על קו אופק רגוע; הרגל שלה נוגעת בקו — הכול הסתדר, אין מה לרדוף.',
    svg: m => GIMEL(38, 10, 1.05, m, 8) + `<path d="M8 50 Q32 43 56 50" fill="none" stroke="${m}" stroke-width="7" stroke-linecap="round"/>`,
  },
];
// variants: color-light, color-dark, mono-light (navy), mono-dark (cream)
export const svgR2 = (c, v, px) => {
  const map = { 'light': [C.greenA11y, C.cream], 'dark': [C.green, C.navy], 'mono-light': [C.navy, C.cream], 'mono-dark': [C.cream, C.navy] }[v];
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="${px}" height="${px}" role="img" aria-label="גבי — ${c.name}">${c.svg(map[0], map[1]).trim()}</svg>`;
};
export const BG = { 'light': C.cream, 'dark': C.navy, 'mono-light': '#FFFFFF', 'mono-dark': '#000000' };
