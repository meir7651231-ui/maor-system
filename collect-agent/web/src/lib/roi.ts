// מחשבון החזר (דף הנחיתה v2). טהור — נבדק ב-tests/lib.check.ts.
// ⚠️ הערכה, לא הבטחה: שיעור ההחזר הוא השערת מוצר שמוצגת למשתמש כפרמטר, לא נתון מדוד.
export const GABI_PRICE = 119;          // ₪ לחודש, לפני מע״מ (השערת תמחור, הנחיית מנהל 6.11)
export const DEFAULT_RECOVERY = 0.3;    // השערה: 30% מהחוב שבאיחור חוזר מוקדם יותר בזכות תזכורות

export interface RoiInput { monthlyInvoiced: number; latePct: number; recovery?: number; hourlyValue?: number; hoursChasing?: number }
export interface RoiOut { lateAmount: number; recovered: number; timeSaved: number; net: number; multiple: number }

const clamp = (n: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, Number.isFinite(n) ? n : 0));

export function roi(i: RoiInput): RoiOut {
  const invoiced = clamp(i.monthlyInvoiced, 0, 10_000_000);
  const late = clamp(i.latePct, 0, 100) / 100;
  const rec = clamp(i.recovery ?? DEFAULT_RECOVERY, 0, 1);
  const lateAmount = Math.round(invoiced * late);
  const recovered = Math.round(lateAmount * rec);
  const timeSaved = Math.round(clamp(i.hoursChasing ?? 4, 0, 200) * clamp(i.hourlyValue ?? 150, 0, 5000));
  const net = recovered + timeSaved - GABI_PRICE;
  return { lateAmount, recovered, timeSaved, net, multiple: Math.round(((recovered + timeSaved) / GABI_PRICE) * 10) / 10 };
}
