/**
 * ratchet — #14 (הכרעת בעלים "כל מה שיעלה בקובץ"): מצבורי-התומכת נגזרים מ**כל**
 * מה שבקובץ — donations (קבלות) + hist (הקובץ ההיסטורי) יחד. הבסיס-המיובא לא
 * מתאפס: הוא נמצא ב-hist ולכן נספר. ils=₪ (ריק=שקל), usd=$.
 */
import { describe, it, expect } from 'vitest';
import { supporterAggregates } from '../supporterAgg';

describe('✓ ratchet — supporterAggregates (#14 מצבור = donations + hist)', () => {
  it('סופר וסוכם גם קבלות וגם הקובץ ההיסטורי', () => {
    const agg = supporterAggregates({
      donations: [
        { rid: 'D-1', date: '2026-03-01', amount: 100, cur: '₪', cat: '' },
        { rid: 'D-2', date: '2026-04-01', amount: 50, cur: '$', cat: '' },
      ],
      hist: [
        { d: '2024-01-01', a: 300 }, // ₪ (ברירת-מחדל)
        { d: '2024-02-01', a: 20, c: '$' },
      ],
    });
    expect(agg.count).toBe(4); // 2 קבלות + 2 היסטוריות
    expect(agg.ils).toBe(400); // 100 + 300
    expect(agg.usd).toBe(70); // 50 + 20
    expect(agg.first).toBe('2024-01-01'); // הכי מוקדם — מ-hist
    expect(agg.last).toBe('2026-04-01'); // הכי מאוחר — מ-donations
  });

  it('בסיס-מיובא ב-hist בלבד (בלי קבלות) נספר במלואו — לא מתאפס', () => {
    const agg = supporterAggregates({ donations: [], hist: [{ d: '2020-05-05', a: 5000 }] });
    expect(agg.count).toBe(1);
    expect(agg.ils).toBe(5000);
    expect(agg.usd).toBe(0);
  });

  it('ריק לגמרי ⇒ אפסים', () => {
    expect(supporterAggregates({ donations: [], hist: [] })).toEqual({ count: 0, ils: 0, usd: 0, first: '', last: '' });
  });

  it('סכומים לא-סופיים מנוטרלים ל-0 (לא NaN)', () => {
    const agg = supporterAggregates({
      donations: [{ rid: 'D-1', date: '2026-01-01', amount: NaN as unknown as number, cur: '₪', cat: '' }],
      hist: [],
    });
    expect(agg.ils).toBe(0);
  });
});
