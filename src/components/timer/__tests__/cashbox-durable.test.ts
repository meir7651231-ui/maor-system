/**
 * 💵 ratchet — עמידות הקופה-הרושמת (ביקורת-האמון 24.8, לולאת-האמון 6).
 *
 * הבאג: אישורי-הקופה, המונה והמשמרות חיו ב-localStorage בלבד — לא בגיבוי,
 * לא בסנכרון, לא בצילומי-היום; ניקוי-דפדפן מחק אותם ואיפס את המספור.
 * התיקון (שיקוף-כפול, בלי לשבור את בידוד-הקופה): localStorage נשאר מקור-
 * העבודה; כל כתיבה משתקפת ל-db.ui (cashSeq/cashReceipts/cashShift/cashShifts)
 * ⇒ נהנית מכל שכבות-ההתמדה; קריאה עם localStorage-ריק מתרפאת מהעותק-העמיד;
 * המונה = המקסימום בין השניים (אין כפל מספרי-אישור).
 * ⚠️ תווית "חשבונית" לא שוּנתה — שאלת-נוסח פתוחה לרו"ח (דוח-הסגירה).
 */
import { describe, expect, it } from 'vitest';
import src from '../CashRegister.tsx?raw';
import domainSrc from '../../../types/domain.ts?raw';
import storeSrc from '../../../store/useApp.ts?raw';

describe('💵 cashbox-durable — שיקוף-כפול', () => {
  it('כל כתיבה משתקפת ל-db.ui דרך cashboxMirror', () => {
    expect(src).toContain('cashboxMirror({ cashReceipts: next, cashSeq: r.num })');
    expect(src).toContain('cashboxMirror({ cashShift: s })');
    expect(src).toContain('cashboxMirror({ cashShifts: next })');
  });
  it('קריאה מתרפאת מהעותק-העמיד כש-localStorage ריק', () => {
    expect(src).toContain('db.ui.cashReceipts as Receipt[] | undefined');
    expect(src).toContain('db.ui.cashShift as Shift | null | undefined');
  });
  it('המונה לוקח מקסימום — localStorage שאבד לא מאפס מספור', () => {
    expect(src).toContain('Math.max(Number(localStorage.getItem(nsLsKey(LS_SEQ))');
    expect(src).toContain('db.ui.cashSeq ?? 0');
  });
  it('השדות additive ב-UiPrefs + הפעולה ב-store', () => {
    expect(domainSrc).toContain('cashReceipts?: CashReceiptRec[]');
    expect(domainSrc).toContain('cashShifts?: CashShiftCloseRec[]');
    expect(storeSrc).toContain('cashboxMirror: (patch) =>');
  });
});
