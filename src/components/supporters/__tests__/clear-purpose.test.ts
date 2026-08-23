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

  // בקשת-בעלים 23.8 "כל היכולות האלה רק למנהל" — כל פעולות הבחירה-המרובה מגודרות מנהל
  it('כל יכולות הבחירה-המרובה למנהל בלבד (כניסה + מחיקה + שיוך + הסרה)', () => {
    // הכניסה עצמה (☑ בחירה) — עובד/ת לא-מנהל/ת כלל לא נכנס/ת
    expect(src).toMatch(/featureOn\(config, 'supporters\.bulkselect'\) && isAdminUser\(config, cloudEmail\)/);
    // מחיקה-המונית — מנהל בלבד (לא רק דגל-פיצ'ר)
    expect(src).toMatch(/featureOn\(config, 'supporters\.bulkdelete'\) && isAdminUser\(config, cloudEmail\)/);
    // שיוך + הסרת ייעוד — שני מופעי isAdminUser תחת purposeOn (כבר היו)
    expect((src.match(/purposeOn && isAdminUser\(config, cloudEmail\)/g) ?? []).length).toBeGreaterThanOrEqual(2);
  });
});
