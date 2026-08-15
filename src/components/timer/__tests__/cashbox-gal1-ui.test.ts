/**
 * ratchet — קופה רושמת גל-1 (בקשת-בעלים "רעיונות לעיצוב · צא לדרך"):
 * הגנת-מקור על החיווט — פירוט-עודף בסיכום ובחשבונית, היסטוריית-חשבוניות,
 * צבעי-מטבע, וסכומים-מהירים. כל היכולות הקיימות נשמרו (additive).
 */
import { describe, expect, it } from 'vitest';
import src from '../CashRegister.tsx?raw';

describe('💵 ratchet — קופה רושמת גל-1: עיצוב+יכולות (הגנת-מקור)', () => {
  it('פירוט-העודף מוצג בסיכום החי ובחשבונית', () => {
    expect(src).toContain('<ChangeChips amount={diff} />');
    expect(src).toContain('<ChangeChips amount={receipt.change} />');
    expect(src).toContain('function ChangeChips');
    expect(src).toContain("from './cashLib'");
  });

  it('היסטוריית-חשבוניות: כפתור + תצוגה מ-localStorage', () => {
    expect(src).toContain('setShowHistory(true)');
    expect(src).toContain('function readReceipts');
    expect(src).toContain('🧾 חשבוניות');
  });

  it('צבעי-מטבע (denomTint) + סכומים-מהירים — אבל היכולות הקיימות נשמרו', () => {
    expect(src).toContain('denomTint(d)');
    expect(src).toContain('QUICK_DUE');
    // אינווריאנט — לא אבדה אף יכולת קיימת:
    expect(src).toContain('סיום והפקת חשבונית'); // הפקה
    expect(src).toContain('סכום מדויק'); // מילוי-מדויק
    expect(src).toContain('nsLsKey(LS_RECEIPTS)'); // בידוד פר-ארגון
  });
});
