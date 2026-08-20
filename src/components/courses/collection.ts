/**
 * מנוע מרכז-הגבייה (פאזה 5) — "כל החייבים" חוצה-חוגים. נגזרת טהורה מ-payBal הקיים
 * (אפס-סכמה, אפס-נגיעה-בקבלות — רק תזכורת). ממוין מהחוב-הגבוה.
 */
import type { Db, Enrollment } from '../../types/domain';
import { payBal } from './lib';

export interface DebtRow {
  id: string; // מזהה-השיבוץ
  memberId: string;
  name: string; // שם + משפחה
  phone: string; // טלפון-המשפחה (לקשר)
  courseId: string;
  courseName: string;
  bal: number;
}

/** כל השיבוצים הפעילים/מוקפאים עם יתרת-חוב פתוחה, מועשרים בשם/טלפון/חוג, מהגבוה. */
export function collectionList(db: Db): DebtRow[] {
  const courseName = (id: string) => db.courses.find((c) => c.id === id)?.name ?? '—';
  const rows: DebtRow[] = [];
  for (const e of db.enrollments as Enrollment[]) {
    if (e.status === 'ended' || e.status === 'wait') continue;
    const bal = payBal(e);
    if (bal <= 0) continue;
    let name = '—';
    let phone = '';
    for (const f of db.families) {
      const m = f.members.find((x) => x.id === e.memberId);
      if (m) {
        name = m.first + ' · ' + f.name;
        phone = f.phone || m.phone || '';
        break;
      }
    }
    rows.push({ id: e.id, memberId: e.memberId, name, phone, courseId: e.courseId, courseName: courseName(e.courseId), bal });
  }
  return rows.sort((a, b) => b.bal - a.bal);
}

/** סך-כל החוב הפתוח. */
export function collectionTotal(rows: DebtRow[]): number {
  return rows.reduce((a, r) => a + r.bal, 0);
}

/** שורות-CSV לייצוא מרכז-הגבייה (כותרת + נתונים). */
export function collectionCsvRows(rows: DebtRow[]): (string | number)[][] {
  return [['שם', 'חוג', 'טלפון', 'יתרת חוב (₪)'], ...rows.map((r) => [r.name, r.courseName, r.phone, r.bal])];
}

/** נוסח-תזכורת ידידותי לגבייה (WhatsApp) — לא קבלה, רק תזכורת. */
export function collectionMessage(r: DebtRow, orgName: string): string {
  return (
    'שלום, כאן ' +
    (orgName || 'העמותה') +
    '. תזכורת ידידותית: נותרה יתרת-תשלום של ₪' +
    r.bal.toLocaleString('he-IL') +
    ' עבור "' +
    r.courseName +
    '". תודה!'
  );
}
