/**
 * ratchet — 🎯 קוקפיט-חוגים (פאזה 2): מנוע-טהור ops.ts (נגזרת דטרמיניסטית) + חיווט/גידור.
 * opt-in מפורש `courses.cockpit===true` — במכוון לא featureOn (ברירת-מחדל on הייתה מדליקה לחי).
 */
import { describe, expect, it } from 'vitest';
import type { Course, Enrollment } from '../../../types/domain';
import { coursesToday, debtors, dropoutRisk, opsKpis, punchLowList } from '../ops';
import viewSrc from '../CoursesView.tsx?raw';
import cockpitSrc from '../CoursesCockpit.tsx?raw';

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
const AB = { date: '2026-08-01', reason: 'מחלה' };

describe('🎯 קוקפיט-חוגים — מנוע ops', () => {
  it('coursesToday: מפגש ביום-הנוכחי ובטווח-התאריכים בלבד', () => {
    const c = course({ weekday: 3 });
    expect(coursesToday([c], 3, '2026-08-20').map((x) => x.id)).toEqual(['c1']);
    expect(coursesToday([c], 2, '2026-08-20')).toEqual([]); // יום אחר
    expect(coursesToday([course({ id: 'z', weekday: 3, end: '2026-01-01' })], 3, '2026-08-20')).toEqual([]); // הסתיים
  });
  it('debtors: payBal>0, מהגבוה-לנמוך, בלי ended ובלי wait', () => {
    const a = enr({ id: 'a', totalDue: 200, payments: [{ rid: 'R-1', date: '', amount: 50, method: '' }] }); // 150
    const b = enr({ id: 'b', totalDue: 100 }); // 100
    const paid = enr({ id: 'p', totalDue: 100, payments: [{ rid: 'R-2', date: '', amount: 100, method: '' }] }); // 0
    const ended = enr({ id: 'x', totalDue: 500, status: 'ended' });
    // ratchet — הבאג: debtors החריג רק 'ended' וספר יתרות של רשימת-המתנה, כך
    // שה"חייבים" בקוקפיט סתר את מרכז-הגבייה (CollectionCenter מחריג wait).
    // ממתין/ה לא חייב/ת כסף — עוד לא לומד/ת.
    const wait = enr({ id: 'w', totalDue: 300, status: 'wait' });
    expect(debtors([b, a, paid, ended, wait]).map((d) => d.e.id)).toEqual(['a', 'b']);
  });
  it('punchLowList: כרטיסייה פעילה עם ≤ סף (2)', () => {
    const low = enr({ id: 'l', plan: 'punch', purchased: 10, used: 9 }); // 1
    const ok = enr({ id: 'o', plan: 'punch', purchased: 10, used: 3 }); // 7
    const monthly = enr({ id: 'm', plan: 'monthly' });
    expect(punchLowList([ok, low, monthly]).map((x) => x.e.id)).toEqual(['l']);
  });
  it('dropoutRisk: ≥3 חיסורים, פעיל בלבד', () => {
    const risk = enr({ id: 'r', absences: [AB, AB, AB] });
    const few = enr({ id: 'f', absences: [AB] });
    const endedRisk = enr({ id: 'e', absences: [AB, AB, AB, AB], status: 'ended' });
    expect(dropoutRisk([few, risk, endedRisk]).map((x) => x.e.id)).toEqual(['r']);
  });
  it('opsKpis: חוגים-פעילים · שיבוצים (בלי ended) · תפוסה%', () => {
    const k = opsKpis([course({ maxStudents: 10 })], [enr({ id: '1' }), enr({ id: '2' }), enr({ id: '3', status: 'ended' })], '2026-08-20');
    expect(k.activeCourses).toBe(1);
    expect(k.enrollments).toBe(2);
    expect(k.avgOccupancy).toBe(20); // 2/10
  });
  it("opsKpis: 'פעילים' = שטרם הסתיימו (c.end >= היום) — לא כל החוגים אי-פעם", () => {
    // ratchet — הבאג: activeCourses = courses.length ספר גם חוגים שהסתיימו מזמן,
    // בסתירה לתווית "חוגים פעילים" (coursesToday כן מסנן לפי end). היום מוזרק.
    const live = course({ id: 'live', end: '2027-01-01' });
    const old = course({ id: 'old', end: '2026-01-01' });
    const noEnd = course({ id: 'ne', end: '' });
    const k = opsKpis([live, old, noEnd], [], '2026-08-20');
    expect(k.activeCourses).toBe(2); // live + noEnd; old הסתיים
  });
});

describe('🛡 הגנות-מקור — קוקפיט מחווט ומגודר opt-in', () => {
  it('CoursesView: opt-in מפורש (=== true) + מתג + רכיב', () => {
    expect(viewSrc).toContain("cfg.features?.['courses.cockpit'] === true");
    expect(viewSrc).toContain('<CoursesCockpit />');
    expect(viewSrc).toContain('🎯 חלון-העבודה');
  });
  it('CoursesCockpit: נגזרת מ-ops (coursesToday/debtors/punchLowList/dropoutRisk)', () => {
    expect(cockpitSrc).toContain('coursesToday(');
    expect(cockpitSrc).toContain('debtors(');
    expect(cockpitSrc).toContain('punchLowList(');
    expect(cockpitSrc).toContain('dropoutRisk(');
  });
});
