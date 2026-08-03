/**
 * ratchet — #7 (הכרעת בעלים "תלוי אם מוצדק או רשלנות"): זכאות-השלמה תלויה בסיבה,
 * לא רק בשעון 48ש׳. חיסור מוצדק זכאי תמיד; ביטול-מוקדם נשמר זכאי (אפס אובדן-
 * יכולת); רשלנות/מאוחר לא-מוצדק אינו זכאי והניקוב יורד; No-Show לעולם לא זכאי.
 */
import { describe, it, expect } from 'vitest';
import { makeupEligibility } from '../lib';

describe('✓ ratchet — makeupEligibility (#7 זכאות לפי סיבה)', () => {
  it('חיסור מוצדק מתחת ל-48 שעות ⇒ זכאי, הניקוב לא יורד', () => {
    expect(makeupEligibility('cancel', true, 2)).toEqual({ eligible: true, dropsPunch: false });
  });

  it('ביטול מוקדם (≥48ש׳) בלי "מוצדק" ⇒ עדיין זכאי (שימור המודל הקיים)', () => {
    expect(makeupEligibility('cancel', false, 72)).toEqual({ eligible: true, dropsPunch: false });
  });

  it('רשלנות: ביטול מאוחר לא-מוצדק ⇒ לא זכאי, הניקוב יורד', () => {
    expect(makeupEligibility('cancel', false, 2)).toEqual({ eligible: false, dropsPunch: true });
  });

  it('No-Show ⇒ לעולם לא זכאי, הניקוב יורד — גם אם סומן מוצדק', () => {
    expect(makeupEligibility('noshow', true, 100)).toEqual({ eligible: false, dropsPunch: true });
  });

  it('אין מפגש-הבא (rawHrs=null) + לא מוצדק ⇒ לא זכאי', () => {
    expect(makeupEligibility('cancel', false, null)).toEqual({ eligible: false, dropsPunch: true });
  });
});
