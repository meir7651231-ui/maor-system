/**
 * ratchet — #5.5a (הכרעת בעלים "5.5aכן"): דדופ מספרי-קבלה דטרמיניסטי. כשכמה
 * רשומות חולקות אותו rid (מרוץ סנכרון), הקבלה המוקדמת-בתאריך שומרת על מספרה
 * המקורי, והאחרות ממוספרות מחדש — בלי תלות בסדר-המערך (שמיזוג-הענן משנה), כדי
 * שמספר שכבר נמסר לתורם לא יזוז בכל טעינה.
 */
import { describe, it, expect } from 'vitest';
import { planRidRenumber } from '../persist';

describe('✓ ratchet — planRidRenumber (#5.5a דדופ קבלות דטרמיניסטי)', () => {
  it('אין כפילויות ⇒ no-op מוחלט (הנתיב הרווח)', () => {
    const e = [{ rid: 'D-1', date: '2026-01-01' }, { rid: 'D-2', date: '2026-01-02' }];
    const { newRid, nextSeq } = planRidRenumber(e, 3, 'D-');
    expect(newRid).toEqual([null, null]);
    expect(nextSeq).toBe(3);
  });

  it('כפילות: המוקדם-בתאריך שומר על המספר; המאוחר ממוספר מחדש מעל המונה', () => {
    const e = [
      { rid: 'D-5', date: '2026-03-10' }, // מאוחר
      { rid: 'D-5', date: '2026-01-05' }, // מוקדם — שומר על D-5
    ];
    const { newRid, nextSeq } = planRidRenumber(e, 9, 'D-');
    expect(newRid[1]).toBeNull(); // המוקדם שומר
    expect(newRid[0]).toBe('D-9'); // המאוחר ממוספר מחדש
    expect(nextSeq).toBe(10);
  });

  it('דטרמיניסטי מול סדר-מערך הפוך — אותה קבלה (התאריך המוקדם) תמיד שומרת', () => {
    const forward = planRidRenumber([{ rid: 'R-2', date: '2026-01-01' }, { rid: 'R-2', date: '2026-02-01' }], 5, 'R-');
    const reversed = planRidRenumber([{ rid: 'R-2', date: '2026-02-01' }, { rid: 'R-2', date: '2026-01-01' }], 5, 'R-');
    // בשני הסדרים: הרשומה מ-01-01 שומרת על R-2, ומ-02-01 מקבלת R-5
    expect(forward.newRid[0]).toBeNull();
    expect(forward.newRid[1]).toBe('R-5');
    expect(reversed.newRid[1]).toBeNull();
    expect(reversed.newRid[0]).toBe('R-5');
  });

  it('שלוש כפילויות ⇒ שתיים ממוספרות מחדש למספרים נבדלים', () => {
    const e = [
      { rid: 'D-1', date: '2026-01-01' }, // מוקדם — שומר
      { rid: 'D-1', date: '2026-01-02' },
      { rid: 'D-1', date: '2026-01-03' },
    ];
    const { newRid, nextSeq } = planRidRenumber(e, 4, 'D-');
    expect(newRid[0]).toBeNull();
    expect(newRid[1]).toBe('D-4');
    expect(newRid[2]).toBe('D-5');
    expect(nextSeq).toBe(6);
  });

  it('רשומה בלי rid ⇒ מדולגת (null), לא משפיעה על המונה', () => {
    const { newRid, nextSeq } = planRidRenumber([{ date: '2026-01-01' }], 7, 'R-');
    expect(newRid).toEqual([null]);
    expect(nextSeq).toBe(7);
  });
});
