/**
 * ratchet — 📑 שכפול-חוג + 🎓 סיום-סמסטר (פאזה 4): מנוע-טהור duplicateCourse,
 * store bulkEndCourse (setDb אחד; wait/ended/חוג-אחר לא-נגעו), וחיווט/גידור.
 */
import { beforeEach, describe, expect, it } from 'vitest';
import type { Course, Enrollment } from '../../../types/domain';
import { useApp } from '../../../store/useApp';
import { duplicateCourse } from '../lib';
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
function enr(over: Partial<Enrollment>): Enrollment {
  return {
    id: 'e1', memberId: 'm1', courseId: 'c1', plan: 'monthly', purchased: 0, used: 0, group: '',
    absences: [], payments: [], totalDue: 0, dueDate: '', status: 'active', note: '', enrolledAt: '2026-01-01', ...over,
  };
}

describe('📑 שכפול-חוג — מנוע', () => {
  it('מעתיק את כל השדות עם id/תאריכים חדשים ושם "(עותק)"', () => {
    const c = course({ id: 'c1', name: 'ציור', teacherId: 't1', price: 200 });
    const d = duplicateCourse(c, 'c2', { start: '2026-09-01', end: '2027-07-31' });
    expect(d.id).toBe('c2');
    expect(d.name).toBe('ציור (עותק)');
    expect(d.start).toBe('2026-09-01');
    expect(d.end).toBe('2027-07-31');
    expect(d.teacherId).toBe('t1'); // נשמר
    expect(d.price).toBe(200);
  });
});

describe('🎓 store.bulkEndCourse — סיום-סמסטר', () => {
  beforeEach(() => {
    useApp.getState().setDb(() => ({
      enrollments: [
        enr({ id: 'a', courseId: 'c1', status: 'active' }),
        enr({ id: 'p', courseId: 'c1', status: 'paused' }),
        enr({ id: 'w', courseId: 'c1', status: 'wait' }),
        enr({ id: 'x', courseId: 'c1', status: 'ended' }),
        enr({ id: 'other', courseId: 'c2', status: 'active' }),
      ],
    }));
  });
  it('פעילים/מוקפאים ⇒ ended+endedAt; wait/ended/חוג-אחר לא נגעו', () => {
    const n = useApp.getState().bulkEndCourse('c1', '2026-08-20');
    expect(n).toBe(2);
    const by = (id: string) => useApp.getState().db.enrollments.find((e) => e.id === id)!;
    expect(by('a').status).toBe('ended');
    expect(by('a').endedAt).toBe('2026-08-20');
    expect(by('p').status).toBe('ended');
    expect(by('w').status).toBe('wait'); // רשימת-המתנה לא נגעה
    expect(by('x').status).toBe('ended');
    expect(by('x').endedAt).toBeUndefined(); // כבר-ended, לא-נדרס
    expect(by('other').status).toBe('active'); // חוג אחר
  });
});

describe('🛡 הגנות-מקור — CourseDetail מגודר courses.bulkadmin', () => {
  it('שכפול + סיום-סמסטר מחווטים ומגודרים', () => {
    expect(detailSrc).toContain("featureOn(cfg, 'courses.bulkadmin')");
    expect(detailSrc).toContain('duplicateCourse(c, id, defaultCourseDates())');
    expect(detailSrc).toContain('bulkEndCourse(c.id, isoToday())');
    expect(detailSrc).toContain('📑 שכפל');
  });
});
