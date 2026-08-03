/**
 * ratchet — #5 (הכרעת בעלים "5 כן"): מזהי nextId חסינים להתנגשות בין-מכשירית.
 * שני מכשירים באותו seq עם תגי-מכשיר שונים ⇒ מזהים נבדלים ⇒ שניהם שורדים
 * את מיזוג-הענן במקום שאחד ידרוס את השני בשקט.
 */
import { describe, it, expect } from 'vitest';
import { makeId } from '../ids';

describe('✓ ratchet — makeId (#5 מזהים חסיני-התנגשות)', () => {
  it('אותו seq + תגי-מכשיר שונים ⇒ מזהים נבדלים', () => {
    expect(makeId('fam', 100, 'k3f9x')).not.toBe(makeId('fam', 100, 'b7c2m'));
  });

  it('תג ריק ⇒ פורמט קודם `prefix+seq` (תאימות-לאחור / דטרמיניסטי בטסטים)', () => {
    expect(makeId('fam', 100, '')).toBe('fam100');
    expect(makeId('ev', 0, '')).toBe('ev0');
  });

  it('אותו מכשיר (אותו תג) ⇒ seq שונה עדיין נותן מזהים נבדלים', () => {
    expect(makeId('mem', 5, 'aaaaa')).not.toBe(makeId('mem', 6, 'aaaaa'));
  });
});
