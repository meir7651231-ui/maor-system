/**
 * רצ'ט — migrate מנרמל שדות-רשימה פנימיים ל-[] (פאס-6 של הנחיל, HIGH). מסמך
 * שהגיע מהענן/גיבוי ללא enrollments[].payments / .absences או supporters[].donations
 * היה משאיר אותם undefined, וקוד ש-.map/.filter עליהם (paidOf, sessionsOf, דוחות)
 * היה קורס. כאן: אחרי migrate כל שדות-הרשימה קיימים כמערך.
 */
import { describe, expect, it } from 'vitest';
import { migrate } from '../persist';
import { emptyDb } from '../../types/domain';

describe('🧩 ratchet — migrate מנרמל שדות-רשימה חסרים ל-[] (פאס-6)', () => {
  it('enrollment ללא payments/absences ו-supporter ללא donations → מערכים ריקים', () => {
    const raw = {
      ...emptyDb(),
      enrollments: [{ id: 'e1', memberId: 'm1', courseId: 'c1', plan: 'monthly', status: 'active' }],
      supporters: [{ id: 'sp1', name: 'כהן' }],
    } as unknown;
    const m = migrate(raw)!;
    expect(Array.isArray(m.enrollments[0].payments)).toBe(true);
    expect(m.enrollments[0].payments).toEqual([]);
    expect(Array.isArray(m.enrollments[0].absences)).toBe(true);
    expect(m.enrollments[0].absences).toEqual([]);
    expect(Array.isArray(m.supporters[0].donations)).toBe(true);
    expect(m.supporters[0].donations).toEqual([]);
  });

  it('רשימות קיימות נשמרות (לא נמחקות)', () => {
    const raw = {
      ...emptyDb(),
      enrollments: [
        {
          id: 'e1', memberId: 'm1', courseId: 'c1', plan: 'monthly', status: 'active',
          payments: [{ rid: 'R-1', date: '2026-01-01', amount: 100, method: 'מזומן' }],
          absences: [{ date: '2026-01-02' }],
        },
      ],
      supporters: [{ id: 'sp1', name: 'לוי', donations: [{ rid: 'D-1', date: '2026-01-01', amount: 50, cur: '₪', cat: 'כללי' }] }],
    } as unknown;
    const m = migrate(raw)!;
    expect(m.enrollments[0].payments).toHaveLength(1);
    expect(m.enrollments[0].absences).toHaveLength(1);
    expect(m.supporters[0].donations).toHaveLength(1);
  });

  // 🐛 נחיל-עמוק (13.8): המיגרציה שכתבה כל איבר-hist מחדש כ-{d,a,c} בלבד, ומחקה
  // את מטא-דאטת-הסליקה (ref/txn/receipt/brand/last4/clearer/pays/status) בכל טעינה.
  it('hist שומר את מטא-דאטת-הסליקה המלאה (לא מוחק ref/txn/last4/…)', () => {
    const raw = {
      ...emptyDb(),
      supporters: [
        {
          id: 'sp1', name: 'לוי',
          hist: [
            { d: '2026-01-01', a: 250, c: '₪', ref: 'A123', txn: 'T99', receipt: 'RC7', brand: 'ויזה', last4: '4321', clearer: 'ישראכרט', pays: 3, status: 'אושר' },
            { d: '2026-02-01', a: 100, c: 'USD' }, // מטבע לא-מוכר → נמחק בנרמול, השאר נשמר
          ],
        },
      ],
    } as unknown;
    const m = migrate(raw)!;
    const h = m.supporters[0].hist!;
    expect(h).toHaveLength(2);
    expect(h[0]).toMatchObject({ d: '2026-01-01', a: 250, c: '₪', ref: 'A123', txn: 'T99', receipt: 'RC7', brand: 'ויזה', last4: '4321', clearer: 'ישראכרט', pays: 3, status: 'אושר' });
    expect('c' in h[1]).toBe(false); // מטבע לא-מוכר לא נשמר
  });
});
