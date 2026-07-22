/** בדיקות תקינות לקלט ישראלי. */

/** בדיקת ת"ז ישראלית עם ספרת ביקורת (אלגוריתם לוהן מותאם). */
export function validIsraeliId(id: string): boolean {
  const s = String(id).trim();
  if (!/^\d{5,9}$/.test(s)) return false;
  if (!/[1-9]/.test(s)) return false; // ת"ז של אפסים בלבד אינה תקינה
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

/**
 * עיצוב טלפון ישראלי לתצוגה (פורט נאמן מ-fixPhone באב-טיפוס):
 * משלים ספרת 0 מובילה חסרה למספר בן 8/9 ספרות ומוסיף מקף מפריד —
 * ‎0XX-XXXXXXX‎ (נייד/9 ספרות) או ‎0X-XXXXXXX‎ (קווי/8 ספרות).
 * מספר שכבר מתחיל ב-0, ריק, או באורך חריג — מוחזר אחרי trim בלבד (ללא נגיעה).
 * שים לב: פונקציה נפרדת מ-normalizePhone כדי לא לשבור מפתחות זיהוי כפילויות.
 */
export function formatIsraeliPhone(raw: string): string {
  const s = String(raw || '').trim();
  let d = s.replace(/\D/g, '');
  // קידומת בינלאומית 972/00972 → 0 מקומי (מספרים מיובאים מגיעים כך)
  if (d.startsWith('00972')) d = '0' + d.slice(5);
  else if (d.startsWith('972')) d = '0' + d.slice(3);
  if (!d) return s;
  if (d[0] === '0') {
    if (d.length === 10) return d.slice(0, 3) + '-' + d.slice(3);
    if (d.length === 9) return d.slice(0, 2) + '-' + d.slice(2);
    return d;
  }
  if (d.length === 9) return '0' + d.slice(0, 2) + '-' + d.slice(2);
  if (d.length === 8) return '0' + d[0] + '-' + d.slice(1);
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

/**
 * נרמול שם להשוואה חסינת-רווחים (פורט מ-normName באב-טיפוס):
 * normSearch + הסרת כל הרווחים הפנימיים, כך ש-"בן דוד" ≡ "בןדוד".
 * לשימוש בהצלבת כפילויות שמות (audit) — לא תחליף גורף ל-normSearch.
 */
export function normName(t: string): string {
  return normSearch(t).replace(/\s/g, '');
}
