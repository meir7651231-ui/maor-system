/**
 * ratchet — 🎓 אפליקציית-המורה (גל ה׳ · פאזה 9): מנוע-טהור teacher.ts (agenda פר-יום,
 * makeups פר-מורה, KPI, דוח-חודשי) + חיווט/גידור (opt-in courses.teacherapp + תפקיד-מורה).
 */
import { describe, expect, it } from 'vitest';
import type { Course, Db, Enrollment } from '../../../types/domain';
import { emptyDb } from '../../../types/domain';
import { teacherAgenda, teacherCourses, teacherKpis, teacherMakeups, teacherMonthCsvRows } from '../teacher';
import panelSrc from '../TeacherPanel.tsx?raw';
import viewSrc from '../CoursesView.tsx?raw';

function crs(over: Partial<Course>): Course {
  return { id: 'c1', name: 'ציור', teacherId: 't1', weekday: 0, time: '17:00', model: 'monthly', sessions: [], start: '', end: '', ...over } as unknown as Course;
}
function enr(over: Partial<Enrollment>): Enrollment {
  return {
    id: 'e1', memberId: 'm1', courseId: 'c1', plan: 'monthly', purchased: 0, used: 0, group: '',
    absences: [], payments: [], totalDue: 0, dueDate: '', status: 'active', note: '', enrolledAt: '2026-01-01', presents: [], ...over,
  };
}

function db(): Db {
  return {
    ...emptyDb(),
    courses: [
      { ...crs({}), id: 'c1', name: 'ציור', teacherId: 't1', weekday: 0 } as Course, // ראשון (dow 0)
      { ...crs({}), id: 'c2', name: 'גיטרה', teacherId: 't1', weekday: 2 } as Course, // שלישי — לא-היום
      { ...crs({}), id: 'c3', name: 'כדורסל', teacherId: 't2', weekday: 0 } as Course, // מורה אחרת
    ],
    families: [{ id: 'f1', name: 'כהן', phone: '', createdAt: '', status: 'active', members: [{ id: 'm1', first: 'דנה' }] } as never],
    enrollments: [
      enr({ id: 'a', courseId: 'c1', memberId: 'm1', presents: ['2026-08-16'], absences: [{ date: '2026-08-02', reason: 'מחלה', makeup: true }] }),
      enr({ id: 'b', courseId: 'c2', memberId: 'm1', status: 'active' }),
      enr({ id: 'w', courseId: 'c1', memberId: 'm1', status: 'wait' }), // המתנה — לא-נספר
      enr({ id: 'x', courseId: 'c3', memberId: 'm1' }), // מורה אחרת
    ],
  };
}

describe('🎓 אפליקציית-המורה — מנוע', () => {
  it('teacherCourses: רק החוגים של המורה', () => {
    expect(teacherCourses(db(), 't1').map((c) => c.id)).toEqual(['c1', 'c2']);
  });
  it('teacherAgenda: רק מפגשי-היום של המורה (dow מוזרק), עם סיכום-נוכחות', () => {
    const ag = teacherAgenda(db(), 't1', 0, '2026-08-16'); // ראשון
    expect(ag.map((a) => a.course.id)).toEqual(['c1']); // c2 לא-היום, c3 מורה-אחרת
    expect(ag[0].total).toBe(1); // רק a (w=המתנה מוחרג)
    expect(ag[0].present).toBe(1); // a נוכח ב-16.8
  });
  it('teacherMakeups: השלמות-זכאיות בחוגי-המורה בלבד', () => {
    const mk = teacherMakeups(db(), 't1');
    expect(mk.map((m) => m.enrollmentId)).toEqual(['a']);
  });
  it('teacherKpis: חוגים/תלמידים-חיים/מפגשים-היום/השלמות', () => {
    const k = teacherKpis(db(), 't1', 0, '2026-08-16');
    expect(k.courses).toBe(2);
    expect(k.students).toBe(2); // a(c1)+b(c2); w=המתנה מוחרג
    expect(k.todaySessions).toBe(1);
    expect(k.makeups).toBe(1);
  });
  it('teacherMonthCsvRows: שורה פר תלמיד עם נוכחות/חיסור בחודש', () => {
    const rows = teacherMonthCsvRows(db(), 't1', '2026-08', () => 'דנה · כהן');
    expect(rows[0]).toEqual(['חוג', 'תלמיד', 'נוכחויות בחודש', 'חיסורים בחודש']);
    const painting = rows.find((r) => r[0] === 'ציור');
    expect(painting).toEqual(['ציור', 'דנה · כהן', 1, 1]); // נוכחות 16.8 + חיסור 2.8
  });
});

describe('🛡 הגנות-מקור — מסך-המורה מחווט ומגודר', () => {
  it('TeacherPanel: ממחזר AttendanceSheet + teacher.ts, בלי כסף', () => {
    expect(panelSrc).toContain('teacherAgenda(db, tid');
    expect(panelSrc).toContain('AttendanceSheet');
    expect(panelSrc).toContain('teacherMonthCsvRows');
    expect(panelSrc).not.toContain('payLink');
  });
  it('CoursesView: מסך-המורה מגודר opt-in courses.teacherapp + תפקיד-מורה', () => {
    expect(viewSrc).toContain("cfg.features?.['courses.teacherapp'] === true && !!myTeacherId");
    expect(viewSrc).toContain('<TeacherPanel teacherId={myTeacherId} />');
    expect(viewSrc).toContain('🎓 המסך שלי');
  });
});
