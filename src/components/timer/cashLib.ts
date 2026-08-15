/**
 * קופה רושמת — מנוע טהור (בלי store/DOM). פירוט-עודף (אילו שטרות/מטבעות
 * להחזיר), רשימת-הערכים בש"ח, וצבעי-המטבע לזיהוי-מהיר. נבדק ביחידה.
 */

/** שטרות ומטבעות בש"ח (ILS), מהגדול לקטן — לחישוב-עודף חמדני. */
export const CASH_DENOMS = [200, 100, 50, 20, 10, 5, 2, 1, 0.5, 0.1] as const;
export const BILL_VALS = [200, 100, 50, 20] as const;
export const COIN_VALS = [10, 5, 2, 1, 0.5, 0.1] as const;

export interface DenomCount {
  denom: number;
  count: number;
}

/**
 * פירוט-עודף חמדני: כמה מכל שטר/מטבע להחזיר עבור סכום. עובד ב"אגורות"
 * (שלמים) כדי להימנע משגיאות-float. סכום ≤0 ⇒ ריק.
 */
export function changeBreakdown(amount: number): DenomCount[] {
  let rem = Math.round((Number(amount) || 0) * 100);
  if (rem <= 0) return [];
  const out: DenomCount[] = [];
  for (const d of CASH_DENOMS) {
    const cents = Math.round(d * 100);
    const n = Math.floor(rem / cents);
    if (n > 0) {
      out.push({ denom: d, count: n });
      rem -= n * cents;
    }
  }
  return out;
}

/**
 * צבע-רקע לזיהוי-מהיר של הערך — מקורב לצבעי המטבע הישראלי (שטר ₪20 אדום,
 * ₪50 ירוק, ₪100 כתום, ₪200 כחול; מטבעות בכסוף/זהב). ערכי-tint רכים כדי
 * שהטקסט יישאר קריא בשני מצבי-הנושא.
 */
export function denomTint(d: number): { bg: string; ink: string } {
  switch (d) {
    case 200:
      return { bg: '#dbeafe', ink: '#1e40af' }; // כחול
    case 100:
      return { bg: '#ffedd5', ink: '#9a3412' }; // כתום
    case 50:
      return { bg: '#dcfce7', ink: '#166534' }; // ירוק
    case 20:
      return { bg: '#fee2e2', ink: '#991b1b' }; // אדום
    case 10:
      return { bg: '#fef9c3', ink: '#854d0e' }; // מטבע זהב
    case 5:
    case 2:
    case 1:
      return { bg: '#f1f5f9', ink: '#475569' }; // מטבע כסף
    default:
      return { bg: '#f5ede0', ink: '#8a6d3b' }; // אגורות — נחושת
  }
}

/** תווית ערך: '₪20' לשטרות/מטבעות שלמים, '₪0.5' לאגורות. */
export function denomLabel(d: number): string {
  return '₪' + (Number.isInteger(d) ? String(d) : String(d));
}
