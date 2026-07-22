/**
 * חותמת "היום" מקומית (לא UTC) — כדי שרשומה שנוצרת אחרי חצות מקומי לא תקבל
 * את תאריך אתמול (כפי ש-toISOString היה מחזיר באזור זמן ממזרח ל-UTC כמו ישראל).
 */
import { describe, expect, it } from 'vitest';
import { isoToday, isoLocal, isoDaysAgo } from '../date-util';

describe('date-util — תאריך מקומי', () => {
  it('isoLocal מרכיב YYYY-MM-DD מרכיבי הזמן המקומיים', () => {
    // 2026-03-15 בשעה מקומית כלשהי → אותו יום, לא מושפע משעה
    const d = new Date(2026, 2, 15, 23, 30, 0); // 15 במרץ, 23:30 מקומי
    expect(isoLocal(d)).toBe('2026-03-15');
    const d2 = new Date(2026, 2, 15, 0, 5, 0); // 15 במרץ, 00:05 מקומי
    expect(isoLocal(d2)).toBe('2026-03-15');
  });

  it('isoToday שווה לחישוב המקומי (ולא ל-UTC אחרי חצות מזרחית)', () => {
    const now = new Date();
    const p2 = (n: number) => String(n).padStart(2, '0');
    const localExpected = `${now.getFullYear()}-${p2(now.getMonth() + 1)}-${p2(now.getDate())}`;
    expect(isoToday()).toBe(localExpected);
  });

  it('פורמט תקין YYYY-MM-DD', () => {
    expect(isoToday()).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(isoDaysAgo(30)).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it('isoDaysAgo(30) מוקדם מהיום', () => {
    expect(isoDaysAgo(30) < isoToday()).toBe(true);
  });

  it('isoDaysAgo(0) = היום', () => {
    expect(isoDaysAgo(0)).toBe(isoToday());
  });
});
