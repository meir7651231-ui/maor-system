/**
 * ריענון תאריכי-הדמו (ANALYSIS — הכרעת בעלים "דמו לפי תאריכים קרובים"): קובץ
 * demo.json הוא סטטי, ולכן חוגים/אירועים/ימי-חלוקה שלו "פגים" עם הזמן. הפונקציה
 * מזיזה את **תאריכי-התזמון בלבד** (חוגים · אירועים · ימי-חלוקה · שיבוצים) כך
 * שהדמו ייראה עדכני, בדלתא מ-תאריך-חיבור-הדמו עד היום.
 *
 * **לא נוגעת** בתאריכי-לידה, היסטוריית-תרומות, קבלות או כל נתון-אישי — רק תזמון.
 * טהורה (בלי store/DOM); מוחלת רק במסלולי-הדמו, לא ב-restoreDb הרגיל של גיבוי אמת.
 */
import type { Db } from '../types/domain';
import { isoLocal } from './date-util';

/** תאריך-חיבור הדמו — הבסיס לחישוב הדלתא. עדכן אם demo.json נבנה מחדש. */
export const DEMO_ANCHOR = '2026-08-02';

function daysBetween(fromIso: string, toIso: string): number {
  const a = new Date(fromIso + 'T12:00:00').getTime();
  const b = new Date(toIso + 'T12:00:00').getTime();
  if (isNaN(a) || isNaN(b)) return 0;
  return Math.round((b - a) / 86_400_000);
}

/** מזיז תאריך ISO ב-days; קלט ריק/לא-תקין מוחזר כמות-שהוא. */
function shift(iso: string, days: number): string {
  if (!iso || !/^\d{4}-\d{2}-\d{2}/.test(iso)) return iso;
  const d = new Date(iso.slice(0, 10) + 'T12:00:00');
  if (isNaN(d.getTime())) return iso;
  d.setDate(d.getDate() + days);
  return isoLocal(d);
}

export function freshenDemoDb(db: Db, todayIso: string): Db {
  const delta = daysBetween(DEMO_ANCHOR, todayIso);
  if (!delta) return db;
  return {
    ...db,
    courses: db.courses.map((c) => ({ ...c, start: shift(c.start, delta), end: shift(c.end, delta) })),
    events: db.events.map((e) => ({ ...e, date: shift(e.date, delta) })),
    distributionDays: db.distributionDays.map((d) => ({
      ...d,
      date: shift(d.date, delta),
      createdAt: shift(d.createdAt, delta),
    })),
    enrollments: db.enrollments.map((en) => ({
      ...en,
      dueDate: shift(en.dueDate, delta),
      enrolledAt: shift(en.enrolledAt, delta),
    })),
  };
}
