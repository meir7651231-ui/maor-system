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
  if (s.startsWith('972')) s = '0' + s.slice(3);
  if (raw.startsWith('+972')) s = '0' + raw.replace(/[\s\-().]/g, '').slice(4);
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

/**
 * תארים/כינויי-כבוד עבריים (אחרי normSearch — בלי גרש/גרשיים/ניקוד). מוסרים
 * מהשם רק כטוקן-שלם (כדי ש-"מרים" לא ייחתך מ-"מר"). לא כולל בן/בר (פטרונים לגיטימי).
 */
const NAME_TITLES = new Set([
  'ר', 'רבי', 'הרב', 'הרבנית', 'הרהג', 'הרהח', 'הגר', 'מוהרר', 'אדמור', 'מרת', 'מר', 'גב', 'הגב',
  'דר', 'פרופ', 'הבחור', 'הבהח', 'הת', 'משפ', 'משפחת',
  // סיומות-כבוד:
  'שליטא', 'זצל', 'זצוקל', 'זקל', 'זל', 'עה', 'היד', 'נרו', 'ניו', 'ני', 'היו',
]);

/**
 * מפתח-שם **חסין-סדר** להשוואת-כפילויות (נדרים משפחה-קודם "בן צבי רחל" מול מאור
 * פרטי-קודם "רחל בן צבי"): normSearch (מסיר ניקוד/סופיות/גרשיים) → פיצול-מילים →
 * הסרת-תארים → **מיון** → חיבור. כך "בן צבי רחל" ≡ "רחל בן צבי". ריק כשאין ≥1 טוקן.
 */
export function nameSortKey(t: string): string {
  const tokens = normSearch(t)
    .split(/\s+/)
    .filter((w) => w && !NAME_TITLES.has(w));
  return tokens.slice().sort().join(' ');
}
