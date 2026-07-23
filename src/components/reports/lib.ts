/** חישובים משותפים למסך הדוחות — פונקציות טהורות בלבד. */

import type { Db, Enrollment } from '../../types/domain';
import { allMembers, type MemberWithFamily } from '../../store/useApp';
import { isoToday as isoTodayLocal } from '../../lib/date-util';

/** טווח תאריכים — ISO או '' (ללא גבול). */
export interface DateRange {
  from: string;
  to: string;
}

export function isoToday(): string {
  return isoTodayLocal();
}

/** תצוגת תאריך DD/MM/YYYY (פנימית נשמר ISO). */
export function fmtDate(iso: string): string {
  if (!iso) return '';
  const [y, m, d] = iso.slice(0, 10).split('-');
  if (!y || !m || !d) return iso; // קלט פגום → מוחזר כמו-שהוא (בלי "undefined/undefined/..")
  return `${d}/${m}/${y}`;
}

export function inRange(iso: string, r: DateRange): boolean {
  if (!iso) return false;
  if (r.from && iso < r.from) return false;
  if (r.to && iso > r.to) return false;
  return true;
}

export function rangeLabel(r: DateRange): string {
  if (!r.from && !r.to) return 'כל התאריכים';
  if (r.from && r.to) return `${fmtDate(r.from)} – ${fmtDate(r.to)}`;
  return r.from ? 'מ-' + fmtDate(r.from) : 'עד ' + fmtDate(r.to);
}

/** סה"כ ששולם בשיבוץ (כל התשלומים). */
export function paidOf(e: Enrollment): number {
  return (e.payments || []).reduce((a, p) => a + (Number.isFinite(p.amount) ? p.amount : 0), 0);
}

/** תשלומים שהתקבלו בתוך טווח התאריכים. */
export function paidInRange(e: Enrollment, r: DateRange): number {
  return (e.payments || [])
    .filter((p) => inRange(p.date, r))
    .reduce((a, p) => a + (Number.isFinite(p.amount) ? p.amount : 0), 0);
}

/** יתרת חוב — סה"כ עסקה פחות ששולם, לא שלילית (כמו payBal במקור). */
export function balanceOf(e: Enrollment): number {
  return Math.max(0, (e.totalDue || 0) - paidOf(e));
}

/** מפתח חודש YYYY-MM מתאריך ISO. */
export function monthKey(iso: string): string {
  return iso.slice(0, 7);
}

/** תצוגת חודש MM/YYYY. */
export function monthLabel(key: string): string {
  const [y, m] = key.split('-');
  return `${m}/${y}`;
}

/** אינדקס בן-משפחה לפי מזהה — שם + שם משפחה. */
export function nameIndex(db: Db): Map<string, MemberWithFamily> {
  const map = new Map<string, MemberWithFamily>();
  for (const m of allMembers(db)) map.set(m.id, m);
  return map;
}

export const STATUS_LABEL: Record<string, string> = {
  active: 'פעילה',
  pending: 'ממתינה',
  inactive: 'לא פעילה',
};

/** ספירה לפי מפתח — מוחזר ממוין מהגדול לקטן. */
export function countBy<T>(items: T[], key: (t: T) => string): [string, number][] {
  const m = new Map<string, number>();
  for (const it of items) {
    const k = key(it);
    m.set(k, (m.get(k) ?? 0) + 1);
  }
  return [...m.entries()].sort((a, b) => b[1] - a[1]);
}
