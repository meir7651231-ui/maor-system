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

  // בקשת-בעלים 23.8: מנהל/בעלים תמיד; עובד/ת רק אם הודלק לו/ה (bulkGranted)
  it('כל יכולות הבחירה-המרובה מגודרות bulkGranted (מנהל/בעלים או הדלקה-פר-עובד)', () => {
    // ההגדרה: מנהל/בעלים תמיד, אחרת רק אם features[key]===true בקונפיג-האפקטיבי
    expect(src).toContain('const canBulkManage = isAdminUser(config, cloudEmail) || isOrgMgr');
    // ביקורת-e2e 1.9: false מפורש מכבה גם למנהל (חוזה-הדגלים) — הצורה המחוזקת
    expect(src).toContain('const bulkGranted = (key: string) => config.features?.[key] !== false && (canBulkManage || config.features?.[key] === true)');
    // הכניסה (☑ בחירה) + מחיקה-המונית + שיוך/הסרת-ייעוד — כולן דרך bulkGranted
    expect(src).toContain("bulkGranted('supporters.bulkselect')");
    expect(src).toContain("bulkGranted('supporters.bulkdelete')");
    expect((src.match(/purposeOn && bulkGranted\('supporters\.purpose'\)/g) ?? []).length).toBeGreaterThanOrEqual(2);
    // אין יותר גידור-קשיח isAdminUser על כפתורי-הבחירה (חוסם הדלקה-פר-עובד)
    expect(src).not.toContain("supporters.bulkselect') && isAdminUser");
  });
});
