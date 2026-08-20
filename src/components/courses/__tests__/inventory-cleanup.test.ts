/**
 * ratchet — ניקוי מודול-החוגים (אינוונטר-עומק 20.8, §9):
 * S4 · עמודת-היתרה ב-CourseDetail לא מכפילה את planLabelOf (היה מוצג פעמיים כשהניקוב כבוי).
 * S7 · nextSessionDate דטרמיניסטי — `now` מוזרק (ברירת-מחדל = השעון), בר-בדיקה.
 */
import { describe, expect, it } from 'vitest';
import type { Course } from '../../../types/domain';
import { nextSessionDate } from '../lib';
import detailSrc from '../CourseDetail.tsx?raw';

function course(over: Partial<Course>): Course {
  return {
    id: 'c1', name: 'ציור', teacherId: '', roomId: '', cat: '', audience: '', semester: 'שנתי',
    model: 'monthly', size: 0, price: 100, price1: 0, price2: 0, price1Name: '', price2Name: '',
    maxStudents: 20, ageMin: 0, ageMax: 0, gender: 'all', weekday: 3, time: '17:00',
    start: '2026-01-01', end: '2027-01-01', sessions: [], img: '', active: true, notes: '',
    description: '', sector: '', ...over,
  } as Course;
}

describe('🛡 S4 · עמודת-היתרה לא מכפילה את planLabelOf', () => {
  it('CourseDetail מרנדר planLabelOf(e) פעם-אחת בלבד (עמודת "מסלול")', () => {
    expect((detailSrc.match(/planLabelOf\(e\)/g) || []).length).toBe(1);
    // עמודת-היתרה עברה ל-punchOn && isPunch (בלי ענף !punchOn שהציג planLabelOf שוב)
    expect(detailSrc).toContain('punchOn && isPunch ? (');
  });
});

describe('🛡 S7 · nextSessionDate דטרמיניסטי (now מוזרק)', () => {
  it('אותו קלט+now → אותה תוצאה; המפגש הבא נופל ביום שהוגדר', () => {
    const c = course({ weekday: 3, time: '17:00' }); // יום ד'
    const now = new Date(2026, 7, 20, 12, 0); // ה', 20.8.2026 12:00
    const a = nextSessionDate(c, now);
    const b = nextSessionDate(c, now);
    expect(a?.getTime()).toBe(b?.getTime());
    expect(a?.getDay()).toBe(3); // המפגש הבא ביום ד'
  });
  it('אותו-יום אחרי שעת-המפגש ⇒ מגלגל שבוע קדימה', () => {
    const c = course({ weekday: 3, time: '17:00' });
    const now = new Date(2026, 7, 26, 18, 0); // ד', 26.8.2026 18:00 (אחרי 17:00)
    const r = nextSessionDate(c, now);
    expect(r?.getDay()).toBe(3);
    expect(Math.round(((r?.getTime() ?? 0) - now.getTime()) / 86400000)).toBe(7);
  });
});
