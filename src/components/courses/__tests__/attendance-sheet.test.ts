/**
 * ratchet — 📋 גיליון-נוכחות (roll-call, פאזה 1): מנוע-טהור (sheetRoster/sheetSummary),
 * נוכחות-אצווה בסטור (bulkSetPresent — אידמפוטני, שער-כרטיסייה, setDb אחד), וחיווט/גידור.
 */
import { beforeEach, describe, expect, it } from 'vitest';
import { useApp } from '../../../store/useApp';
import { sheetRoster, sheetSummary } from '../lib';
import type { Enrollment } from '../../../types/domain';
import sheetSrc from '../AttendanceSheet.tsx?raw';
import detailSrc from '../CourseDetail.tsx?raw';

function enr(over: Partial<Enrollment>): Enrollment {
  return {
    id: 'e1', memberId: 'm1', courseId: 'c1', plan: 'monthly', purchased: 0, used: 0, group: '',
    absences: [], payments: [], totalDue: 0, dueDate: '', status: 'active', note: '', enrolledAt: '2026-01-01', ...over,
  };
}

describe('📋 גיליון-נוכחות — מנוע טהור', () => {
  it('sheetRoster: פעילים/מוקפאים בלבד (לא שהסתיימו), פר-חוג', () => {
    const list = [
      enr({ id: 'a', courseId: 'c1' }),
      enr({ id: 'b', courseId: 'c1', status: 'paused' }),
      enr({ id: 'c', courseId: 'c1', status: 'ended' }),
      enr({ id: 'd', courseId: 'c2' }),
    ];
    expect(sheetRoster(list, 'c1').map((e) => e.id)).toEqual(['a', 'b']);
  });
  it('sheetSummary: סופר נוכחים לפי-תאריך', () => {
    const roster = [enr({ id: 'a', presents: ['2026-08-20'] }), enr({ id: 'b' }), enr({ id: 'c', presents: ['2026-08-19'] })];
    expect(sheetSummary(roster, '2026-08-20')).toEqual({ present: 1, total: 3 });
  });
});

describe('📋 store.bulkSetPresent — אצווה אידמפוטנית', () => {
  beforeEach(() => {
    useApp.getState().setDb(() => ({
      families: [],
      enrollments: [
        enr({ id: 'a', plan: 'monthly' }),
        enr({ id: 'b', plan: 'punch', purchased: 5, used: 0 }),
        enr({ id: 'x', plan: 'punch', purchased: 2, used: 2 }), // כרטיסייה מלאה
      ],
    }));
  });
  it('מסמן את כל הרשימה נוכחים; שער-כרטיסייה חוסם מלא', () => {
    const n = useApp.getState().bulkSetPresent(['a', 'b', 'x'], '2026-08-20', true);
    expect(n).toBe(2); // a + b ; x חסום (אין יתרה)
    const db = useApp.getState().db;
    expect(db.enrollments.find((e) => e.id === 'a')!.presents).toContain('2026-08-20');
    expect(db.enrollments.find((e) => e.id === 'b')!.used).toBe(1);
    expect(db.enrollments.find((e) => e.id === 'x')!.presents ?? []).not.toContain('2026-08-20');
  });
  it('אידמפוטני — קריאה חוזרת לא מוסיפה', () => {
    useApp.getState().bulkSetPresent(['a'], '2026-08-20', true);
    const n = useApp.getState().bulkSetPresent(['a'], '2026-08-20', true);
    expect(n).toBe(0);
    expect(useApp.getState().db.enrollments.find((e) => e.id === 'a')!.presents).toEqual(['2026-08-20']);
  });
  it('נקה — מסיר תאריך ומוריד used', () => {
    useApp.getState().bulkSetPresent(['b'], '2026-08-20', true);
    const n = useApp.getState().bulkSetPresent(['b'], '2026-08-20', false);
    expect(n).toBe(1);
    const b = useApp.getState().db.enrollments.find((e) => e.id === 'b')!;
    expect(b.presents).not.toContain('2026-08-20');
    expect(b.used).toBe(0);
  });
});

describe('🛡 הגנות-מקור — גיליון-נוכחות מחווט ומגודר', () => {
  it('AttendanceSheet: bulkSetPresent + setPresent + AbsenceModal', () => {
    expect(sheetSrc).toContain('bulkSetPresent(ids, today, true)');
    expect(sheetSrc).toContain('setPresent(e.id, today, !on)');
    expect(sheetSrc).toContain('AbsenceModal');
  });
  it('CourseDetail: הכפתור מגודר courses.attendance.sheet ופותח kind:sheet', () => {
    expect(detailSrc).toContain("featureOn(cfg, 'courses.attendance.sheet')");
    expect(detailSrc).toContain("kind: 'sheet'");
    expect(detailSrc).toContain('<AttendanceSheet course={c}');
  });
});
