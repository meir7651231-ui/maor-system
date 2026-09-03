/**
 * מנוע דשבורד-החוגים (פאזה 8) — שורה-פר-חוג עם כל מדדי-התפעול במבט-אחד:
 * רשומים · תפוסה% · רשימת-המתנה · חוב · חיסורים · בסיכון-נשירה. נגזרת טהורה
 * מהחוגים והשיבוצים הקיימים (אפס-סכמה, בלי store/DOM) — מעבר-יחיד O(E) על השיבוצים.
 */
import type { Db, Enrollment } from '../../types/domain';
import type { OrgConfig } from '../../types/config';
import { termOf } from '../../lib/config';
import { payBal } from './lib';

export interface CourseRow {
  id: string;
  name: string;
  teacher: string;
  /** רשומים תופסי-מקום — פעילים+מוקפאים (כמו enrollCount; לא הסתיימו, לא המתנה). */
  enrolled: number;
  /** תקרת-מקומות (0 = ללא-הגבלה). */
  max: number;
  /** תפוסה 0–100 (0 כשאין תקרה מוגדרת). */
  occupancy: number;
  /** רשומים ברשימת-ההמתנה (status='wait'). */
  waitlist: number;
  /** סך-יתרות-החוב הפתוחות של הרשומים (payBal). */
  debt: number;
  /** סך-החיסורים של הרשומים. */
  absences: number;
  /** מספר-התלמידים-בסיכון — פעילים עם ≥ סף-חיסורים (ברירת-מחדל 3). */
  atRisk: number;
}

export interface DashboardSummary {
  courses: number;
  enrolled: number;
  waitlist: number;
  debt: number;
  /** תפוסה-ממוצעת% על חוגים עם תקרה מוגדרת. */
  avgOccupancy: number;
  atRisk: number;
}

export interface CourseDashboard {
  rows: CourseRow[];
  summary: DashboardSummary;
  /** "החוגים-המבוקשים" — בעלי רשימת-המתנה, מהארוכה לקצרה (0 = לא-מוצג). */
  mostWanted: CourseRow[];
}

interface Agg {
  enrolled: number;
  waitlist: number;
  debt: number;
  absences: number;
  atRisk: number;
}

/** דשבורד-חוגים מלא — שורה-פר-חוג + סיכומים + החוגים-המבוקשים. טהור. */
export function courseDashboard(db: Db, opts?: { riskMinAbs?: number }): CourseDashboard {
  const riskMin = opts?.riskMinAbs ?? 3;
  const teacherName = (id: string) => db.teachers.find((t) => t.id === id)?.name ?? '—';

  // מעבר-יחיד על השיבוצים ⇒ צבירה פר-חוג (במקום סריקה-מלאה לכל חוג).
  const agg = new Map<string, Agg>();
  const bump = (id: string): Agg => {
    let a = agg.get(id);
    if (!a) {
      a = { enrolled: 0, waitlist: 0, debt: 0, absences: 0, atRisk: 0 };
      agg.set(id, a);
    }
    return a;
  };
  for (const e of db.enrollments as Enrollment[]) {
    const a = bump(e.courseId);
    if (e.status === 'wait') {
      a.waitlist++;
      continue;
    }
    if (e.status === 'ended') continue;
    // פעיל/מוקפא — תופס-מקום.
    a.enrolled++;
    a.debt += payBal(e);
    a.absences += e.absences.length;
    if (e.status === 'active' && e.absences.length >= riskMin) a.atRisk++;
  }

  const rows: CourseRow[] = db.courses.map((c) => {
    const a = agg.get(c.id) ?? { enrolled: 0, waitlist: 0, debt: 0, absences: 0, atRisk: 0 };
    const max = c.maxStudents || 0;
    const occupancy = max > 0 ? Math.round(Math.min(1, a.enrolled / max) * 100) : 0;
    return {
      id: c.id,
      name: c.name,
      teacher: teacherName(c.teacherId),
      enrolled: a.enrolled,
      max,
      occupancy,
      waitlist: a.waitlist,
      debt: a.debt,
      absences: a.absences,
      atRisk: a.atRisk,
    };
  });

  const withMax = rows.filter((r) => r.max > 0);
  const avgOccupancy = withMax.length
    ? Math.round(withMax.reduce((s, r) => s + r.occupancy, 0) / withMax.length)
    : 0;
  const summary: DashboardSummary = {
    courses: rows.length,
    enrolled: rows.reduce((s, r) => s + r.enrolled, 0),
    waitlist: rows.reduce((s, r) => s + r.waitlist, 0),
    debt: rows.reduce((s, r) => s + r.debt, 0),
    avgOccupancy,
    atRisk: rows.reduce((s, r) => s + r.atRisk, 0),
  };

  const mostWanted = rows.filter((r) => r.waitlist > 0).sort((a, b) => b.waitlist - a.waitlist);

  return { rows, summary, mostWanted };
}

/** שורות-CSV לייצוא הדשבורד (כותרת + שורה-פר-חוג). cfg אופציונלי ⇒ כותרות לפי מונחי-הארגון (בלעדיו — ביט-זהה). */
export function dashboardCsvRows(dash: CourseDashboard, cfg?: OrgConfig): (string | number)[][] {
  const T = (k: string, fb: string) => (cfg ? termOf(cfg, k, fb) : fb);
  const head = [T('entity.course', 'חוג'), T('entity.teacher', 'מורה'), 'רשומים', 'מקסימום', 'תפוסה %', 'רשימת-המתנה', 'חוב (₪)', 'חיסורים', 'בסיכון'];
  const body = dash.rows.map((r) => [
    r.name,
    r.teacher,
    r.enrolled,
    r.max || '∞',
    r.max > 0 ? r.occupancy : '—',
    r.waitlist,
    r.debt,
    r.absences,
    r.atRisk,
  ]);
  return [head, ...body];
}
