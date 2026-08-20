/**
 * קישורי-תשלום (INTEGRATIONS גל ג׳, הרחבת `payments`) — "עד-המפתח": הארגון מזין
 * את כתובת עמוד-התשלום שלו (נדרים-פלוס / Grow / קארדקום / מותאם), והמערכת בונה
 * קישור עם הסכום (והשם) ממולאים. אין סליקה בצד-שלנו — העמוד של הספק גובה;
 * הרישום במערכת נשאר ידני (סליקה-מלאה-עם-webhook = functions/, גבול-Blaze).
 *
 * ביטחון: ה-payUrl מגיע מהקונפיג (ענן!) ⇒ עובר safeHttpsUrl אצל ה-caller/כאן;
 * ההזרקות שלנו עוברות encodeURIComponent.
 */
import { safeHttpsUrl } from './config';

/** בניית קישור-תשלום: מוסיף amount/name ל-URL של הארגון.
 *  תבנית-מותאמת: `{amount}`/`{name}` ב-URL מוחלפים; אחרת מתווספים כפרמטרים
 *  ‏amount/name (המוסכמה הרווחת בעמודי-סליקה ישראליים). URL לא-https ⇒ null. */
export function payLink(payUrl: string, amount: number, name = ''): string | null {
  const base = safeHttpsUrl(payUrl);
  if (!base) return null;
  const amt = String(Math.max(0, Math.round(amount * 100) / 100));
  if (base.includes('%7Bamount%7D') || base.includes('{amount}')) {
    // תבנית-מותאמת — החלפה בתוך ה-URL (גם בצורה המקודדת שה-URL parser מייצר).
    // סכום 0 ("לא-ידוע", קישור-תרומה-כללי) ⇒ שדה-ריק, עקבי עם מצב-הפרמטרים (לא Amount=0).
    return base
      .replace(/%7Bamount%7D|\{amount\}/g, amt === '0' ? '' : encodeURIComponent(amt))
      .replace(/%7Bname%7D|\{name\}/g, encodeURIComponent(name));
  }
  const u = new URL(base);
  // כיוון-יוצא נדרים-פלוס: עמוד-הסליקה שלהם קורא **Amount/ClientName** (PascalCase),
  // לא amount/name. זיהוי-מארח ⇒ מילוי-מראש שבאמת נתפס ("המערכת לוחצת על הקישור").
  if (/(^|\.)matara\.pro$/i.test(u.hostname) && /nedarimplus/i.test(u.pathname + u.search)) {
    if (amt !== '0') u.searchParams.set('Amount', amt);
    if (name.trim()) u.searchParams.set('ClientName', name.trim());
    return u.toString();
  }
  if (amt !== '0') u.searchParams.set('amount', amt);
  if (name.trim()) u.searchParams.set('name', name.trim());
  return u.toString();
}
