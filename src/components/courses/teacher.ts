/**
 * מנוע אפליקציית-המורה (גל ה׳ · פאזה 9) — נגזרת-טהורה המצומצמת לחוגים-של-המורה בלבד:
 * מפגשי-היום עם רוסטר, השלמות-ממתינות, דוח-חודשי, ומדדי-על. אפס-סכמה, בלי store/DOM.
 * היום/יום-בשבוע מוזרקים ⇒ דטרמיניסטי. ממחזר את הפרימיטיבים הקיימים (coursesToday,
 * sheetRoster, pendingMakeups, presentsInMonth) — תפקיד-המורה כבר מגודר ב-coursesOfTeacher.
 */
import type { Course, Db, Enrollment } from '../../types/domain';
import { presentsInMonth, sheetRoster, sheetSummary, pendingMakeups, type MakeupItem } from './lib';
import { coursesToday } from './ops';

/** החוגים של המורה (teacherId על החוג). */
export function teacherCourses(db: Db, teacherId: string): Course[] {
  return db.courses.filter((c) => c.teacherId === teacherId);
}

export interface AgendaItem {
  course: Course;
  roster: Enrollment[];
  present: number;
  total: number;
}

/** מפגשי-היום של המורה — החוגים-שלה שיש להם מפגש היום, עם רוסטר וסיכום-נוכחות. */
export function teacherAgenda(db: Db, teacherId: string, todayDow: number, todayIso: string): AgendaItem[] {
  return coursesToday(teacherCourses(db, teacherId), todayDow, todayIso).map((c) => {
    const roster = sheetRoster(db.enrollments, c.id);
    const { present, total } = sheetSummary(roster, todayIso);
    return { course: c, roster, present, total };
  });
}

/** השלמות-ממתינות בחוגי-המורה בלבד (חיסורים-זכאים). */
export function teacherMakeups(db: Db, teacherId: string): MakeupItem[] {
  const mine = new Set(teacherCourses(db, teacherId).map((c) => c.id));
  return pendingMakeups(db.enrollments).filter((m) => mine.has(m.courseId));
}

export interface TeacherKpis {
  courses: number;
  students: number;
  todaySessions: number;
  makeups: number;
}

/** מדדי-על למסך-המורה. students = שיבוצים-חיים (לא-הסתיימו/לא-המתנה) בחוגי-המורה. */
export function teacherKpis(db: Db, teacherId: string, todayDow: number, todayIso: string): TeacherKpis {
  const mine = new Set(teacherCourses(db, teacherId).map((c) => c.id));
  const students = db.enrollments.filter(
    (e) => mine.has(e.courseId) && e.status !== 'ended' && e.status !== 'wait',
  ).length;
  return {
    courses: mine.size,
    students,
    todaySessions: teacherAgenda(db, teacherId, todayDow, todayIso).length,
    makeups: teacherMakeups(db, teacherId).length,
  };
}

/**
 * דוח-חודשי למורה — שורה פר (חוג × תלמיד): נוכחויות-בחודש + חיסורים-בחודש.
 * ym = 'YYYY-MM'. שמות מסופקים דרך nameOf (המשפחות נשארות ב-store, לא כאן).
 */
export function teacherMonthCsvRows(
  db: Db,
  teacherId: string,
  ym: string,
  nameOf: (memberId: string) => string,
): (string | number)[][] {
  const head = ['חוג', 'תלמיד', 'נוכחויות בחודש', 'חיסורים בחודש'];
  const body: (string | number)[][] = [];
  for (const c of teacherCourses(db, teacherId)) {
    for (const e of sheetRoster(db.enrollments, c.id)) {
      const present = presentsInMonth(e.presents, ym + '-01');
      const absent = e.absences.filter((a) => (a.date || '').slice(0, 7) === ym).length;
      body.push([c.name, nameOf(e.memberId), present, absent]);
    }
  }
  return [head, ...body];
}
