/** בדיקות תקינות לקלט ישראלי. */

/** בדיקת ת"ז ישראלית עם ספרת ביקורת (אלגוריתם לוהן מותאם). */
export function validIsraeliId(id: string): boolean {
  const s = String(id).trim();
  if (!/^\d{5,9}$/.test(s)) return false;
  const p = s.padStart(9, '0');
  let sum = 0;
  for (let i = 0; i < 9; i++) {
    let d = +p[i] * (i % 2 === 0 ? 1 : 2);
    if (d > 9) d -= 9;
    sum += d;
  }
  return sum % 10 === 0;
}

/** נרמול טלפון: מסיר רווחים/מקפים, מוסיף 0 מוביל אם חסר. */
export function normalizePhone(raw: string): string {
  let s = String(raw || '').replace(/[\s\-().]/g, '');
  if (/^972/.test(s)) s = '0' + s.slice(3);
  if (/^\+972/.test(raw)) s = '0' + raw.replace(/[\s\-().]/g, '').slice(4);
  return s;
}

/** נרמול טקסט לחיפוש עברי: מסיר ניקוד, אותיות סופיות → רגילות, גרשיים. */
export function normSearch(t: string): string {
  return String(t || '')
    .toLowerCase()
    .replace(/[֑-ׇ]/g, '')
    .replace(/[ךםןףץ]/g, (ch) => (({ ך: 'כ', ם: 'מ', ן: 'נ', ף: 'פ', ץ: 'צ' }) as Record<string, string>)[ch])
    .replace(/['"׳״\-–._]/g, '')
    .trim();
}
