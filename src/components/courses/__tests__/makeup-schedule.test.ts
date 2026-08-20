/**
 * ratchet — 🔁 תזמון-השלמה (פאזה 7): מנוע-טהור pendingMakeups (זכאים בלבד, מיון),
 * store scheduleMakeup (קובע makeupDate + יוצר תזכורת-לוח), וחיווט/גידור.
 */
import { beforeEach, describe, expect, it } from 'vitest';
import type { Enrollment } from '../../../types/domain';
import { useApp } from '../../../store/useApp';
import { pendingMakeups } from '../lib';
import detailSrc from '../CourseDetail.tsx?raw';

function enr(over: Partial<Enrollment>): Enrollment {
  return {
    id: 'e1', memberId: 'm1', courseId: 'c1', plan: 'monthly', purchased: 0, used: 0, group: '',
    absences: [], payments: [], totalDue: 0, dueDate: '', status: 'active', note: '', enrolledAt: '2026-01-01', ...over,
  };
}

describe('🔁 תזמון-השלמה — מנוע', () => {
  it('pendingMakeups: זכאים בלבד (makeup===true), לא-מתוזמן קודם, פר-חוג', () => {
    const list = [
      enr({ id: 'a', courseId: 'c1', absences: [{ date: '2026-08-01', reason: 'מחלה', makeup: true }] }),
      enr({ id: 'b', courseId: 'c1', absences: [{ date: '2026-07-01', reason: 'x', makeup: true, makeupDate: '2026-08-10' }] }), // כבר-מתוזמן
      enr({ id: 'c', courseId: 'c1', absences: [{ date: '2026-08-05', reason: 'noshow', makeup: false, noshow: true }] }), // לא-זכאי
      enr({ id: 'd', courseId: 'c2', absences: [{ date: '2026-08-01', reason: 'y', makeup: true }] }), // חוג אחר
    ];
    const got = pendingMakeups(list, 'c1');
    expect(got.map((m) => m.enrollmentId)).toEqual(['a', 'b']); // c לא-זכאי, d חוג-אחר; a(לא-מתוזמן) לפני b(מתוזמן)
    expect(got[0].date).toBe('2026-08-01');
    expect(got[1].makeupDate).toBe('2026-08-10');
  });
});

describe('🔁 store.scheduleMakeup', () => {
  beforeEach(() => {
    useApp.getState().setDb(() => ({
      families: [{ id: 'f1', name: 'כהן', phone: '', createdAt: '', status: 'active', members: [{ id: 'm1', first: 'דנה' }] } as never],
      courses: [{ id: 'c1', name: 'ציור' } as never],
      events: [],
      enrollments: [enr({ id: 'a', memberId: 'm1', courseId: 'c1', absences: [{ date: '2026-08-01', reason: 'מחלה', makeup: true }] })],
    }));
  });
  it('קובע makeupDate על החיסור התואם + יוצר תזכורת-לוח', () => {
    const before = useApp.getState().db.events.length;
    useApp.getState().scheduleMakeup('a', '2026-08-01', '2026-08-15');
    const en = useApp.getState().db.enrollments.find((e) => e.id === 'a')!;
    expect(en.absences[0].makeupDate).toBe('2026-08-15');
    const events = useApp.getState().db.events;
    expect(events.length).toBe(before + 1);
    expect(events[events.length - 1].date).toBe('2026-08-15');
    expect(events[events.length - 1].title).toContain('השלמה');
  });
});

describe('🛡 הגנות-מקור — תזמון-השלמה מחווט ומגודר', () => {
  it('CourseDetail: מקטע-השלמות מגודר courses.makeup.schedule + scheduleMakeup', () => {
    expect(detailSrc).toContain("featureOn(cfg, 'courses.makeup.schedule')");
    expect(detailSrc).toContain('pendingMakeups(db.enrollments, c.id)');
    expect(detailSrc).toContain('scheduleMakeup(m.enrollmentId, m.date, v)');
    expect(detailSrc).toContain('🔁 השלמות ממתינות');
  });
});
