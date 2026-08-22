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
  // תלמידים ייחודיים (Set על memberId) — תלמיד/ה ב-2 חוגי-אותה-מורה נספר/ת פעם-אחת;
  // קודם ‏.length על שיבוצים ניפח את המונה תחת התווית "תלמידים".
  const students = new Set(
    db.enrollments.filter((e) => mine.has(e.courseId) && e.status !== 'ended' && e.status !== 'wait').map((e) => e.memberId),
  ).size;
  return {
    courses: mine.size,
    students,
    todaySessions: teacherAgenda(db, teacherId, todayDow, todayIso).length,
    // "ממתינות" = שטרם תוזמנו (!makeupDate) — כמו המונה בכרטיס-החוג (CourseDetail);
    // ספירת השלמות שכבר נקבע להן תאריך ניפחה את ה-KPI בשקר.
    makeups: teacherMakeups(db, teacherId).filter((m) => !m.makeupDate).length,
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
  const monthFirst = ym + '-01';
  for (const c of teacherCourses(db, teacherId)) {
    // לא sheetRoster (שמפיל 'ended' ללא-תנאי): תלמיד/ה שסיימ/ה באמצע-החודש —
    // או חוג שלם אחרי bulkEndCourse — נעלמו רטרואקטיבית מדוח אותו חודש. כמו
    // buildCourseDailyRows: 'ended' נכלל כשה-endedAt מאוחר מתחילת-החודש (כלומר
    // היו לו ימים בחודש-הדוח); 'ended' ישן בלי endedAt מוחרג (אין תאריך אמין).
    // 'wait' (רשימת-המתנה) מוחרג — עדיין לא משתתפ/ת.
    const roster = db.enrollments.filter(
      (e) =>
        e.courseId === c.id &&
        e.status !== 'wait' &&
        (e.status !== 'ended' || (!!e.endedAt && e.endedAt > monthFirst)),
    );
    for (const e of roster) {
      const present = presentsInMonth(e.presents, ym + '-01');
      const absent = e.absences.filter((a) => (a.date || '').slice(0, 7) === ym).length;
      body.push([c.name, nameOf(e.memberId), present, absent]);
    }
  }
  return [head, ...body];
}
