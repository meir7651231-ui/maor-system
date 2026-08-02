/**
 * ratchet — #6 (הכרעת בעלים "מוסיף/מסיר") + #10 (מונה חודשי): setPresent הוא
 * החלפת-נוכחות פר-מפגש אידמפוטנטית ששומרת על used כמונה-הכסף, ו-presentsInMonth
 * סופר נוכחות בחודש הנוכחי (מתאפס חודשית; ההיסטוריה ב-used).
 */
import { beforeEach, describe, expect, it } from 'vitest';
import { useApp } from '../useApp';
import { emptyDb } from '../../types/domain';
import type { Db, Enrollment } from '../../types/domain';
import { presentsInMonth } from '../../components/courses/lib';

function enr(over: Partial<Enrollment> = {}): Enrollment {
  return {
    id: 'e1', memberId: 'm1', courseId: 'c1', plan: 'punch', purchased: 10, used: 0, group: '',
    absences: [], payments: [], totalDue: 0, dueDate: '', status: 'active', note: '', enrolledAt: '2026-01-01',
    ...over,
  };
}
function seed(over: Partial<Enrollment> = {}): Db {
  return { ...emptyDb(), enrollments: [enr(over)] };
}

beforeEach(() => useApp.getState().setDb(() => seed()));
const E = () => useApp.getState().db.enrollments[0];

describe('✓ ratchet — setPresent (החלפת-נוכחות פר-מפגש)', () => {
  it('רישום: מוסיף תאריך ל-presents ומעלה used', () => {
    expect(useApp.getState().setPresent('e1', '2026-08-15', true)).toBe(true);
    expect(E().presents).toEqual(['2026-08-15']);
    expect(E().used).toBe(1);
  });

  it('אידמפוטנטי: לחיצה חוזרת על אותו תאריך (present=true) לא מוסיפה שוב', () => {
    useApp.getState().setPresent('e1', '2026-08-15', true);
    useApp.getState().setPresent('e1', '2026-08-15', true);
    expect(E().presents).toEqual(['2026-08-15']); // לא כפול
    expect(E().used).toBe(1); // לא כפל-ספירה (הבאג המקורי)
  });

  it('ביטול: לחיצה שנייה (present=false) מסירה את התאריך ומורידה used', () => {
    useApp.getState().setPresent('e1', '2026-08-15', true);
    useApp.getState().setPresent('e1', '2026-08-15', false);
    expect(E().presents).toEqual([]);
    expect(E().used).toBe(0);
  });

  it('שער-יתרה: אין יתרת-כרטיסייה (used=purchased) ⇒ מחזיר false, בלי שינוי', () => {
    useApp.getState().setDb(() => seed({ used: 10, purchased: 10 }));
    expect(useApp.getState().setPresent('e1', '2026-08-15', true)).toBe(false);
    expect(E().used).toBe(10);
    expect(E().presents ?? []).toEqual([]);
  });

  it('שני מפגשים שונים נספרים בנפרד; used לא יורד מתחת ל-0', () => {
    useApp.getState().setPresent('e1', '2026-08-10', true);
    useApp.getState().setPresent('e1', '2026-08-17', true);
    expect(E().used).toBe(2);
    expect(E().presents).toEqual(['2026-08-10', '2026-08-17']);
  });
});

describe('🗓️ ratchet — presentsInMonth (#10 מונה חודשי)', () => {
  it('סופר רק תאריכי החודש הנוכחי; שאר החודשים לא נספרים', () => {
    const presents = ['2026-08-03', '2026-08-20', '2026-07-30', '2026-09-01'];
    expect(presentsInMonth(presents, '2026-08-15')).toBe(2);
    expect(presentsInMonth(presents, '2026-07-15')).toBe(1);
    expect(presentsInMonth(undefined, '2026-08-15')).toBe(0); // ניקובי-עבר בלי תאריך
  });
});
