/**
 * ratchet — הסרת-ייעוד מפורשת בבחירה-מרובה (בקשת-בעלים 23.8).
 * הבאג: היכולת לנקות ייעוד הייתה סמויה בלבד ("שיוך ייעוד" עם שדה ריק) — למשתמש
 * לא היה כפתור גלוי "הסר ייעוד". נוסף כפתור מפורש + אישור-דו-שלבי, מגודר כמו השיוך
 * (‏purposeOn && isAdminUser). setSupportersPurpose(ids,'') מאפס forWho; הלא-מסומנים
 * שומרים את ייעודם. הגנת-מקור: הכפתור והאישור קיימים ב-JSX.
 */
import { describe, expect, it } from 'vitest';
import src from '../SupportersView.tsx?raw';

describe('🏷 ratchet — כפתור הסרת-ייעוד מפורש בבחירה-מרובה', () => {
  it('קיים כפתור "🧹 הסר ייעוד" בשורת-הבחירה (גלוי, לא רק שדה-ריק סמוי)', () => {
    expect(src).toContain("'🧹 הסר ייעוד · '");
    expect(src).toContain('setClearPurposeConfirm(true)');
  });
  it('האישור מנקה forWho דרך setSupportersPurpose(ids, "") ויוצא ממצב-בחירה', () => {
    expect(src).toContain("setSupportersPurpose(ids, '')");
    expect(src).toMatch(/clearPurposeConfirm && \(/);
  });
});
