/**
 * ratchet — #14 (הכרעת בעלים 9.8 "לכולל"): המונים ה**שמורים** (count/ils/usd)
 * נשארים **קבלות-בלבד** (donations); הקובץ-ההיסטורי (hist) מתווסף ב**תצוגה**
 * בלבד (supCount/supIls/supUsd/supLast ב-supporters/lib). לכן supporterAggregates
 * סוכם donations בלבד.
 *
 * 🐛 באג שנתפס ע"י נחיל-9×9 (13.8): הגרסה הקודמת סכמה גם hist למונים השמורים,
 * ואז שכבת-התצוגה הוסיפה hist שוב ⇒ כל תורם עם קובץ-היסטורי הוצג עם
 * ₪ = קבלות + 2×hist (כרטיס/רשימה/RFM/CSV). הנעילה: כאן donations-בלבד.
 */
import { describe, it, expect } from 'vitest';
import { supporterAggregates } from '../supporterAgg';

describe('✓ ratchet — supporterAggregates (#14 מונים שמורים = קבלות בלבד, לא כולל hist)', () => {
  it('סוכם רק donations (קבלות); hist לא נספר כאן — נמנע כפל-ספירה מול התצוגה', () => {
    const agg = supporterAggregates({
      donations: [
        { rid: 'D-1', date: '2026-03-01', amount: 100, cur: '₪', cat: '' },
        { rid: 'D-2', date: '2026-04-01', amount: 50, cur: '$', cat: '' },
      ],
      hist: [
        { d: '2024-01-01', a: 300 }, // ₪ — לא נספר במונה השמור
        { d: '2024-02-01', a: 20, c: '$' }, // $ — לא נספר במונה השמור
      ],
    });
    expect(agg.count).toBe(2); // 2 קבלות בלבד (hist מתווסף בתצוגה)
    expect(agg.ils).toBe(100); // רק הקבלה בשקל — לא 400
    expect(agg.usd).toBe(50); // רק הקבלה בדולר — לא 70
    expect(agg.first).toBe('2026-03-01'); // מתוך ה-donations בלבד
    expect(agg.last).toBe('2026-04-01');
  });

  it('בסיס-מיובא ב-hist בלבד (בלי קבלות) ⇒ מונה-שמור 0 (התצוגה תוסיף אותו)', () => {
    const agg = supporterAggregates({ donations: [], hist: [{ d: '2020-05-05', a: 5000 }] });
    expect(agg.count).toBe(0);
    expect(agg.ils).toBe(0);
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
