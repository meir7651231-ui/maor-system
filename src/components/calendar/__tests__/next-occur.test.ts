/**
 * ratchet — המופע הבא של אירוע חוזר (מעבר 199/199; לגאסי nextOccurLabel).
 * nextOccurIso: סריקה עד 400 ימים מ-fromIso להתאמת חודש+יום עבריים
 * (hebAnnualEq); לא-חוזר/בלי תאריך ⇒ ''. עקבי עם dayItems וה-export.
 */
import { describe, expect, it } from 'vitest';
import { hpOf, isoOf, nextOccurIso } from '../calLib';
import { hebAnnualEq } from '../../../lib/hebrew';

describe('🔁 ratchet — nextOccurIso (לגאסי nextOccurLabel)', () => {
  it('אזכרה: המופע שנמצא הוא באמת היום העברי המקביל, בתוך 400 ימים', () => {
    const iso = nextOccurIso({ type: 'memorial', date: '2024-08-10' }, '2026-07-30');
    expect(iso).not.toBe('');
    expect(iso >= '2026-07-30').toBe(true);
    const d = new Date(iso + 'T12:00:00');
    expect(hebAnnualEq(hpOf('2024-08-10'), hpOf(isoOf(d), d))).toBe(true);
  });

  it('אירוע לא-חוזר או בלי תאריך ⇒ ריק', () => {
    expect(nextOccurIso({ type: 'org', date: '2026-08-10' }, '2026-07-30')).toBe('');
    expect(nextOccurIso({ type: 'memorial', date: '' }, '2026-07-30')).toBe('');
  });

  it('אירוע חוזר שנוצר בעתיד — לא מוחזר מופע לפני תאריך היצירה', () => {
    const iso = nextOccurIso({ type: 'memorial', date: '2027-01-05' }, '2026-07-30');
    expect(iso === '' || iso >= '2027-01-05').toBe(true);
  });
});
