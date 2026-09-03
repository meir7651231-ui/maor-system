/**
 * ratchet — 📊 דשבורד-חוגים (פאזה 8): מנוע-טהור courseDashboard (שורה-פר-חוג,
 * תפוסה%, המתנה, חוב, חיסורים, בסיכון), סיכומים, החוגים-המבוקשים, CSV — וחיווט/גידור.
 */
import { describe, expect, it } from 'vitest';
import type { Course, Db, Enrollment } from '../../../types/domain';
import type { OrgConfig } from '../../../types/config';
import { emptyDb } from '../../../types/domain';
import { courseDashboard, dashboardCsvRows } from '../dashboard';
import dashSrc from '../CoursesDashboard.tsx?raw';
import viewSrc from '../CoursesView.tsx?raw';

function enr(over: Partial<Enrollment>): Enrollment {
  return {
    id: 'e1', memberId: 'm1', courseId: 'c1', plan: 'monthly', purchased: 0, used: 0, group: '',
    absences: [], payments: [], totalDue: 0, dueDate: '', status: 'active', note: '', enrolledAt: '2026-01-01', ...over,
  };
}
function crs(id: string, name: string, over: Partial<Course> = {}): Course {
  return { id, name, teacherId: over.teacherId ?? '', maxStudents: over.maxStudents ?? 0, ...over } as unknown as Course;
}
function abs(n: number) {
  return Array.from({ length: n }, (_, i) => ({ date: '2026-08-0' + (i + 1), reason: 'x', makeup: false }));
}

function db(): Db {
  return {
    ...emptyDb(),
    teachers: [{ id: 't1', name: 'רבקה' } as Db['teachers'][number]],
    courses: [crs('c1', 'ציור', { teacherId: 't1', maxStudents: 4 }), crs('c2', 'ריקוד', { maxStudents: 2 })],
    enrollments: [
      // c1: 3 פעילים (מתוך 4 = 75%), אחד חייב 200, אחד עם 3 חיסורים (בסיכון)
      enr({ id: 'a', courseId: 'c1', totalDue: 300, payments: [{ rid: 'R-1', date: '', amount: 100, method: '' }] }),
      enr({ id: 'b', courseId: 'c1', absences: abs(3) }),
      enr({ id: 'c', courseId: 'c1', status: 'paused' }),
      enr({ id: 'e', courseId: 'c1', status: 'ended' }), // הסתיים — לא נספר
      // c2: 2 פעילים (מתוך 2 = 100% מלא), + 2 בהמתנה (מבוקש)
      enr({ id: 'd', courseId: 'c2' }),
      enr({ id: 'f', courseId: 'c2' }),
      enr({ id: 'w1', courseId: 'c2', status: 'wait' }),
      enr({ id: 'w2', courseId: 'c2', status: 'wait' }),
    ],
  };
}

describe('📊 דשבורד-חוגים — מנוע', () => {
  it('courseDashboard: שורה-פר-חוג עם רשומים/תפוסה/המתנה/חוב/חיסורים/בסיכון', () => {
    const d = courseDashboard(db());
    const c1 = d.rows.find((r) => r.id === 'c1')!;
    const c2 = d.rows.find((r) => r.id === 'c2')!;
    expect(c1.enrolled).toBe(3); // active+paused, בלי ended/wait
    expect(c1.max).toBe(4);
    expect(c1.occupancy).toBe(75);
    expect(c1.teacher).toBe('רבקה');
    expect(c1.debt).toBe(200);
    expect(c1.absences).toBe(3);
    expect(c1.atRisk).toBe(1); // b עם 3 חיסורים
    expect(c1.waitlist).toBe(0);
    expect(c2.enrolled).toBe(2);
    expect(c2.occupancy).toBe(100);
    expect(c2.waitlist).toBe(2);
  });
  it('סיכומים: סך-רשומים, תפוסה-ממוצעת, חוב, המתנה, בסיכון', () => {
    const s = courseDashboard(db()).summary;
    expect(s.courses).toBe(2);
    expect(s.enrolled).toBe(5); // 3+2
    expect(s.waitlist).toBe(2);
    expect(s.debt).toBe(200);
    expect(s.atRisk).toBe(1);
    expect(s.avgOccupancy).toBe(88); // ממוצע(75,100)=87.5 ⇒ 88
  });
  it('mostWanted: החוגים-המבוקשים לפי רשימת-המתנה (הארוכה ראשונה)', () => {
    const mw = courseDashboard(db()).mostWanted;
    expect(mw.map((r) => r.id)).toEqual(['c2']); // רק c2 עם המתנה
    expect(mw[0].waitlist).toBe(2);
  });
  it('dashboardCsvRows: כותרת + שורה-פר-חוג', () => {
    const csv = dashboardCsvRows(courseDashboard(db()));
    expect(csv[0]).toEqual(['חוג', 'מורה', 'רשומים', 'מקסימום', 'תפוסה %', 'רשימת-המתנה', 'חוב (₪)', 'חיסורים', 'בסיכון']);
    expect(csv.length).toBe(3); // כותרת + 2 חוגים
  });
  // 🐛 TP-1 (3.9): כותרות ה-CSV 'חוג'/'מורה' היו קשיחות — חבילה מסחרית ('חבילה'/'מטפל') הורידה קובץ במונחי-עמותה.
  it('dashboardCsvRows עם cfg: כותרות לפי מונחי-הארגון; בלי cfg — ביט-זהה', () => {
    const cfg = { terms: { 'entity.course': 'חבילה', 'entity.teacher': 'מטפל' } } as unknown as OrgConfig;
    expect(dashboardCsvRows(courseDashboard(db()), cfg)[0].slice(0, 2)).toEqual(['חבילה', 'מטפל']);
    expect(dashboardCsvRows(courseDashboard(db()))[0].slice(0, 2)).toEqual(['חוג', 'מורה']);
  });
  it('חוג ללא-תקרה: תפוסה 0 ולא משתתף בממוצע', () => {
    const d = courseDashboard({ ...emptyDb(), courses: [crs('x', 'פתוח', { maxStudents: 0 })], enrollments: [enr({ courseId: 'x' })] });
    expect(d.rows[0].occupancy).toBe(0);
    expect(d.summary.avgOccupancy).toBe(0); // אין חוג עם תקרה ⇒ 0
  });
});

describe('🛡 הגנות-מקור — דשבורד מחווט ומגודר', () => {
  it('CoursesDashboard: courseDashboard + downloadCsv + core.export, אפס-נגיעה-בקבלות', () => {
    expect(dashSrc).toContain('courseDashboard(db)');
    expect(dashSrc).toContain('dashboardCsvRows(dash, config)'); // TP-1: ה-CSV מקבל את מונחי-הארגון
    expect(dashSrc).not.toContain('title="📊 דשבורד חוגים — מבט-על"'); // TP-4: כותרת-המודאל דרך termOf
    expect(dashSrc).toContain('downloadCsv(');
    expect(dashSrc).toContain("featureOn(config, 'core.export')");
    expect(dashSrc).toContain('אפס-נגיעה-בקבלות');
  });
  it('CoursesView: כפתור-דשבורד מגודר courses.dashboard (ולא-מורה)', () => {
    expect(viewSrc).toContain("featureOn(cfg, 'courses.dashboard') && !myTeacherId");
    expect(viewSrc).toContain('<CoursesDashboard onClose');
    expect(viewSrc).toContain('📊 דשבורד');
  });
});
