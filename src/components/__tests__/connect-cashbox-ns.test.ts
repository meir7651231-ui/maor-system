/**
 * ratchet — CONNECT חיבור 7: ‏namespace לקופה הרושמת (חלק מבאג ידוע 3).
 * nsLsKey — אותו כלל בדיוק כמו LS_KEY: ‏default = מפתח ישן, אחרת
 * `base:slug`; ‏CashRegister ניגש לאחסון רק דרך ה-helper (הגנת-מקור).
 */
import { describe, expect, it } from 'vitest';
import { nsLsKey, setPersistNamespace } from '../../store/persist';
import cashSrc from '../timer/CashRegister.tsx?raw';
import timerSrc from '../timer/MoneyTimer.tsx?raw';
import redeemSrc from '../shop/RedeemModal.tsx?raw';

describe('🔌 ratchet — חיבור 7: namespace הקופה', () => {
  it('nsLsKey: ‏default בלי סיומת; אחרי setPersistNamespace — עם סיומת; default לא משנה', () => {
    // הערה: מרחב-השמות המודולרי הוא גלובלי לקובץ — הבדיקה רצה לפני קביעת slug
    expect(nsLsKey('maor_cashbox_seq')).toBe('maor_cashbox_seq');
    setPersistNamespace('default');
    expect(nsLsKey('maor_cashbox_seq')).toBe('maor_cashbox_seq');
    setPersistNamespace('org-b');
    expect(nsLsKey('maor_cashbox_seq')).toBe('maor_cashbox_seq:org-b');
    expect(nsLsKey('maor_cashbox_receipts')).toBe('maor_cashbox_receipts:org-b');
  });

  it('הגנת-מקור: כל גישת האחסון של הקופה עוברת דרך nsLsKey', () => {
    // אפס גישה ישירה — כל getItem/setItem/removeItem עם nsLsKey(...)
    const direct = /(localStorage|sessionStorage)\.(getItem|setItem|removeItem)\((?!nsLsKey)/g;
    expect(cashSrc.match(direct)).toBeNull();
    expect(cashSrc).toContain("nsLsKey(LS_SEQ)");
    expect(cashSrc).toContain("nsLsKey(LS_RECEIPTS)");
    // גם הכותבים: טיימר הכסף ומודאל המימוש כותבים דרך ה-helper
    expect(timerSrc).toContain("nsLsKey('maor_cashbox_amount')");
    expect(redeemSrc).toContain("nsLsKey('maor_cashbox_amount')");
    expect(redeemSrc).toContain("nsLsKey('maor_cashbox_client')");
  });
});
