/**
 * ratchet — מנוע שעות-המנוחה (אזהרת-חייגן לפי קידומת-הטלפון). דטרמיניסטי.
 */
import { describe, expect, it } from 'vitest';
import { contactWindow, localQuiet } from '../quietHours';

describe('💛 ratchet — שעות-מנוחה לפי קידומת', () => {
  it('מספר ישראלי (05x/מקומי) — נוח ביום, לא-נוח בלילה, ללא-הסטה', () => {
    // רכז בישראל (UTC+3), 14:00 — נוח
    expect(contactWindow('050-1234567', 14, 3).quiet).toBe(false);
    // 23:00 — לא-נוח
    expect(contactWindow('050-1234567', 23, 3).quiet).toBe(true);
    // 06:00 — לא-נוח (לפני 08:00)
    expect(contactWindow('0501234567', 6, 3).quiet).toBe(true);
    // מקומי ⇒ region ריק, intl=false
    const w = contactWindow('052-9999999', 14, 3);
    expect(w.region).toBe('');
    expect(w.intl).toBe(false);
  });

  it('מספר ארה״ב (+1) — 15:00 בישראל = ~07:00 שם ⇒ עדיין לא-נוח', () => {
    // רכז UTC+3, 15:00; ארה״ב UTC-5 ⇒ הסטה -8 ⇒ 07:00 שם (<08:00) ⇒ לא-נוח
    const w = contactWindow('+1-212-5551234', 15, 3);
    expect(w.localHour).toBe(7);
    expect(w.quiet).toBe(true);
    expect(w.region).toBe('ארה״ב/קנדה');
    expect(w.intl).toBe(true);
  });

  it('מספר ארה״ב (+1) — 18:00 בישראל = 10:00 שם ⇒ נוח', () => {
    const w = contactWindow('+12125551234', 18, 3);
    expect(w.localHour).toBe(10);
    expect(w.quiet).toBe(false);
  });

  it('פורמט 00 בין-לאומי מזוהה (00972 = ישראל, בלי הסטה)', () => {
    const w = contactWindow('00972501234567', 14, 3);
    expect(w.intl).toBe(false); // ישראל ⇒ מקומי-אפקטיבית
    expect(w.quiet).toBe(false);
  });

  it('localQuiet — 22:00 מנוחה · 12:00 לא', () => {
    expect(localQuiet(22)).toBe(true);
    expect(localQuiet(12)).toBe(false);
    expect(localQuiet(7)).toBe(true);
  });
});
