import { describe, expect, it } from 'vitest';
import appSrc from '../../App.tsx?raw';
import cashSrc from '../../components/timer/CashRegister.tsx?raw';
import reenrollSrc from '../../components/courses/ReenrollView.tsx?raw';
import { isoToday } from '../date-util';

/**
 * 🐛 באג-אזור-זמן (13.9.2026): שלושה מקומות חישבו "היום" עם
 * `new Date().toISOString().slice(0, 10)` — round-trip דרך UTC. בישראל (UTC+2/+3)
 * בין חצות מקומי ל-~02:00 זה מחזיר את תאריך *מחר*, כך ש:
 *   • CashRegister.isToday — "האם החשבונית מהיום?" יצא שגוי סביב חצות
 *   • App — זריעת-תזכורות-שעברו נזרעה עם "היום" שגוי
 *   • ReenrollView — תווית-שנת-הלימודים בקובץ-הייצוא יצאה שגויה
 * חוק-הפרויקט (docstring של date-util + CLAUDE.md "isoToday מ-date-util ולא
 * toISOString") — צהריים-מקומי, מקור-אמת אחד. זוהה ע"י מחולל-הסיכונים
 * (deepfiles · גלאי "תאריך-UTC"), ותוקן ל-isoToday().
 */
describe('🛡 ratchet — באג-תאריך-UTC: isoToday() ולא toISOString().slice(0,10)', () => {
  const BAD = /new Date\(\)\.toISOString\(\)\.slice\(0,\s*10\)/;

  it('CashRegister — "האם זה היום?" עבר ל-isoToday (בלי toISOString-מקומי)', () => {
    expect(cashSrc).not.toMatch(BAD);
    expect(cashSrc).toContain('=== isoToday()');
  });

  it('App — זריעת-התזכורות עברה ל-isoToday', () => {
    expect(appSrc).not.toMatch(/seedOverduePlannedReminders\(new Date\(\)\.toISOString/);
    expect(appSrc).toContain('seedOverduePlannedReminders(isoToday())');
  });

  it('ReenrollView — תווית-השנה עברה ל-isoToday', () => {
    expect(reenrollSrc).not.toMatch(BAD);
    expect(reenrollSrc).toContain('academicYearLabel(isoToday())');
  });

  it('isoToday מחזיר תאריך-מקומי תקין (YYYY-MM-DD)', () => {
    expect(isoToday()).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });
});
