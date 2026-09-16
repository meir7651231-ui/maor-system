/**
 * ⬇ ייצוא רשימת-המורות המלאה ל-CSV (בקשת-בעלים 16.9 "הורדת נתונים רשימה מלאה של המורות").
 * טהור — בלי store/DOM. ת"ז ותעריף רק במצב ייצוא-מלא (reports.export.full) — כמו שאר הייצואים.
 * שמות-החוגים של כל מורה נגזרים מ-courses (teacherId).
 */
import type { Course, Teacher } from '../types/domain';

export interface TeachersCsvOpts {
  /** ייצוא-מלא: כולל ת"ז, תעריף, פרטי-תשלום. */
  full: boolean;
  /** מונח "מורה" (termOf) לכותרות. */
  teacherLabel: string;
  courseLabel: string;
}

export function teachersCsvRows(teachers: readonly Teacher[], courses: readonly Course[], o: TeachersCsvOpts): (string | number)[][] {
  const head: string[] = ['שם ה' + o.teacherLabel, 'טלפון', 'טלפון נוסף', 'אימייל', 'כתובת', 'תחום', 'תאריך התחלה', o.courseLabel + ' פעילים', 'הערות'];
  if (o.full) head.splice(4, 0, 'ת"ז');
  if (o.full) head.push('תעריף שעתי ₪', 'סגנון תשלום', 'בנק', 'סניף', 'חשבון');
  const rows: (string | number)[][] = [head];
  const byTeacher = new Map<string, string[]>();
  for (const c of courses) {
    if (!c.teacherId) continue;
    const arr = byTeacher.get(c.teacherId) ?? [];
    arr.push(c.name);
    byTeacher.set(c.teacherId, arr);
  }
  const sorted = [...teachers].sort((a, b) => a.name.localeCompare(b.name, 'he'));
  for (const t of sorted) {
    const pay = (t as Teacher & { payStyle?: string; bankName?: string; bankBranch?: string; bankAccount?: string });
    const row: (string | number)[] = [t.name, t.phone || '', t.phone2 || '', t.email || '', t.address || '', t.specialty || '', t.startDate || '', (byTeacher.get(t.id) ?? []).join(' · '), t.notes || ''];
    if (o.full) row.splice(4, 0, t.idNum || '');
    if (o.full) row.push(t.payRate || 0, pay.payStyle || '', pay.bankName || '', pay.bankBranch || '', pay.bankAccount || '');
    rows.push(row);
  }
  return rows;
}
