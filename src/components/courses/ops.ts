/**
 * מנוע-הקוקפיט של החוגים (פאזה 2) — "המערכת מסדרת את היום". נגזרת טהורה מהשיבוצים
 * והחוגים הקיימים (אפס-סכמה, בלי store/DOM). היום/יום-בשבוע מוזרקים ⇒ דטרמיניסטי.
 */
import type { Course, Enrollment } from '../../types/domain';
import { payBal, sessionsOf } from './lib';

/** חוגים פעילים עם מפגש היום (יום-בשבוע מוזרק) ובטווח-התאריכים. */
export function coursesToday(courses: Course[], todayDow: number, todayIso: string): Course[] {
  return courses.filter(
    (c) => (!c.end || c.end >= todayIso) && (!c.start || c.start <= todayIso) && sessionsOf(c).some((s) => s.day === todayDow),
  );
}

/** שיבוצים עם יתרת-חוב פתוחה (payBal>0), מהגבוה לנמוך. */
export function debtors(enrollments: Enrollment[]): { e: Enrollment; bal: number }[] {
  return enrollments
    .filter((e) => e.status !== 'ended')
    .map((e) => ({ e, bal: payBal(e) }))
    .filter((x) => x.bal > 0)
    .sort((a, b) => b.bal - a.bal);
}

/** כרטיסיות פעילות שעומדות להסתיים — נותרו ≤ סף (ברירת-מחדל 2), מהנמוך לגבוה. */
export function punchLowList(enrollments: Enrollment[], threshold = 2): { e: Enrollment; left: number }[] {
  return enrollments
    .filter((e) => e.status === 'active' && e.plan === 'punch')
    .map((e) => ({ e, left: Math.max(0, e.purchased - e.used) }))
    .filter((x) => x.left <= threshold)
    .sort((a, b) => a.left - b.left);
}

/** תלמידים בסיכון-נשירה — צברו ≥ סף חיסורים (ברירת-מחדל 3), מהגבוה לנמוך. */
export function dropoutRisk(enrollments: Enrollment[], minAbs = 3): { e: Enrollment; absences: number }[] {
  return enrollments
    .filter((e) => e.status === 'active')
    .map((e) => ({ e, absences: e.absences.length }))
    .filter((x) => x.absences >= minAbs)
    .sort((a, b) => b.absences - a.absences);
}

/** מדדי-על לקוקפיט: חוגים-פעילים · שיבוצים-פעילים · תפוסה-ממוצעת%. */
export function opsKpis(courses: Course[], enrollments: Enrollment[]): { activeCourses: number; enrollments: number; avgOccupancy: number } {
  const activeCourses = courses.length;
  const live = enrollments.filter((e) => e.status !== 'ended' && e.status !== 'wait');
  // תפוסה-ממוצעת: ממוצע של (רשומים/מקסימום) על חוגים עם מקסימום מוגדר
  const withMax = courses.filter((c) => (c.maxStudents || 0) > 0);
  const occ = withMax.map((c) => {
    const n = enrollments.filter((e) => e.courseId === c.id && e.status !== 'ended' && e.status !== 'wait').length;
    return Math.min(1, n / c.maxStudents);
  });
  const avgOccupancy = occ.length ? Math.round((occ.reduce((a, b) => a + b, 0) / occ.length) * 100) : 0;
  return { activeCourses, enrollments: live.length, avgOccupancy };
}

/** סך-כל פריטי-העבודה בקוקפיט (למונה-הכללי). */
export function opsTotal(courses: Course[], enrollments: Enrollment[], todayDow: number, todayIso: string): number {
  return (
    coursesToday(courses, todayDow, todayIso).length +
    debtors(enrollments).length +
    punchLowList(enrollments).length +
    dropoutRisk(enrollments).length
  );
}
