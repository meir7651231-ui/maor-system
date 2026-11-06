// מחשבון «שווי הזמן» (דף הנחיתה). טהור — נבדק ב-tests/lib.check.ts.
// הכרעת מאיר (6.11): משווים רק לזמן העבודה שבעל העסק מקדיש היום למעקב אחרי תשלומים — **בלי הבטחת תשואה**:
// אין "כמה כסף יחזור", אין שיעור החזר משוער ואין מכפיל. הקלט כולו של המשתמש, והתוצאה היא חשבון שלו.
export const GABI_PRICE = 119;          // ₪ לחודש, כולל מע״מ ככל שחל (docs/PRICING.md; או ₪1,190 לשנה)
export const DEFAULT_HOURLY = 150;      // ברירת מחדל לעריכה בלבד — המשתמש משנה

export interface TimeInput { hoursPerMonth: number; hourlyValue?: number }
export interface TimeOut { hours: number; hourly: number; timeValue: number; price: number; priceInHours: number }

const clamp = (n: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, Number.isFinite(n) ? n : 0));

/** כמה שווה הזמן שמוקדש היום למעקב, ומה המחיר של גבי בשעות עבודה. בלי שום הנחה על גבייה. */
export function timeValue(i: TimeInput): TimeOut {
  const hours = clamp(i.hoursPerMonth, 0, 200);
  const hourly = clamp(i.hourlyValue ?? DEFAULT_HOURLY, 0, 5000);
  return { hours, hourly, timeValue: Math.round(hours * hourly), price: GABI_PRICE,
           priceInHours: hourly > 0 ? Math.round((GABI_PRICE / hourly) * 10) / 10 : 0 };
}
