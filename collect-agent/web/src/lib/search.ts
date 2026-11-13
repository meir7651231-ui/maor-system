/** הפעלה 171: חיפוש ב-/app/ — אותם כללים כמו `found` ב-app/ui.html (הפעלות 168–169), כדי ששני המסכים
 *  ימצאו את אותו לקוח לאותה הקלדה:
 *  - טקסט: בלי ניקוד/טעמים, רווחים כפולים מכווצים, בלי תלות ברישיות; מחפש בשם ובמספרי החשבוניות.
 *  - ספרות בלבד (גם עם מקפים/רווחים/סוגריים/+): משווה ספרות מול כל מספר חשבונית לחוד ומול הטלפון,
 *    כך ש-«050-123» מוצא «0501234567».
 *  - תזכורת מאוחדת: כל מספר נבדק לחוד, בלי הדבקה (אחרת «1001»+«1002» ⇒ «10011002» ו-«0110» היה נמצא).
 *  טהור — נבדק ב-tests/lib.check.ts, ונעול מול ui.html במגן-מקור. */
export const normQ = (v: unknown) => String(v ?? '').replace(/[\u0591-\u05C7]/g, '').replace(/\s+/g, ' ').trim().toLowerCase();
export const digitsOf = (v: unknown) => String(v ?? '').replace(/\D/g, '');

export function found(q: string, name: string | undefined, num: string | readonly string[] | undefined, phone?: string): boolean {
  const t = normQ(q);
  if (!t) return true;
  const ns: string[] = num == null ? [] : typeof num === 'string' ? [num] : [...num];
  if (/^[\d\s\-+()]+$/.test(t)) {
    const d = digitsOf(t);
    return !!d && (ns.some(n => digitsOf(n).includes(d)) || digitsOf(phone).includes(d));
  }
  return normQ(name).includes(t) || ns.some(n => normQ(n).includes(t));
}
