/**
 * טלפוניה — קישורי `tel:` טהורים (click-to-call). downstream לחלוטין: המכשיר או
 * הסופטפון הרשום למרכזיית-הארגון מבצע את החיוג — אפס API, אפס ספק, אפס עלות-שוטפת.
 * הטלפונים שמורים בפורמט המקומי המעוצב (`0XX-XXXXXXX`); `tel:` מקבל אותם כמעט
 * כמות-שהם — רק ניקוי תווים שאינם ספרה/‎+‎ (אותה מוסכמה כמו החיוג הקיים באפליקציה).
 */

/** קישור-חיוג מטלפון שמור: מנקה לספרות/‎+‎; קצר-מדי ⇒ null (אין כפתור). */
export function telHref(phone: string): string | null {
  const cleaned = (phone || '').replace(/[^\d+]/g, '');
  const digits = cleaned.replace(/\D/g, '');
  if (digits.length < 6) return null; // קצר מדי = לא מספר-חיוג תקין
  return 'tel:' + cleaned;
}
