/**
 * חותמת התאריך של "היום" — לפי אזור הזמן המקומי, לא UTC.
 *
 * למה: new Date().toISOString() מחזיר תאריך UTC. בישראל (UTC+2/+3) בין חצות
 * מקומי ל-~02:00 עדיין "אתמול" ב-UTC, כך שרשומה שנוצרת אחרי חצות (תשלום,
 * שיבוץ, רישום מעקב) הייתה מקבלת את תאריך אתמול — בעוד לוח השנה (isoOf מקומי)
 * מציג היום. מקור-אמת אחד ומקומי מונע את הפער.
 */
export function isoToday(): string {
  return isoLocal(new Date());
}

/** ISO מקומי (YYYY-MM-DD) מ-Date נתון — ללא הזחת אזור הזמן של toISOString. */
export function isoLocal(d: Date): string {
  const p2 = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p2(d.getMonth() + 1)}-${p2(d.getDate())}`;
}

/** ISO מקומי של היום פחות N ימים — לטווחי דוחות. */
export function isoDaysAgo(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return isoLocal(d);
}
