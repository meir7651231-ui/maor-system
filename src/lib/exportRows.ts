/**
 * שורות ייצוא ישיר ל-CSV (P2 פער 24, feature reports.export.full) — טהור.
 *
 * ייצוא האירועים הישיר: השדות verbatim מהלגאסי — כותרת · סוג אירוע ·
 * תאריך עברי · תאריך לועזי · שעה · משפחה · עדיפות · הערות · בוצע.
 * דרך csvx בלבד (העברית תקינה באקסל — UTF-8 BOM).
 */
import type { Db } from '../types/domain';
import type { Cell } from './csvx';
import { hebDateFull } from './hebrew';
import { EV_META } from './eventMeta';

const PRIORITY_LABEL: Record<string, string> = {
  green: 'רגיל (ירוק)',
  orange: 'בינוני (כתום)',
  red: 'דחוף (אדום)',
};

function fmtD(iso: string): string {
  if (!iso) return '';
  const [y, m, d] = iso.split('-');
  return `${d}/${m}/${y}`;
}

/** שורות ייצוא האירועים — כותרת + שורה לכל אירוע, ממוינות לפי תאריך. */
export function eventsCsvRows(db: Db): Cell[][] {
  const rows: Cell[][] = [
    ['כותרת', 'סוג אירוע', 'תאריך עברי', 'תאריך לועזי', 'שעה', 'משפחה', 'עדיפות', 'הערות', 'בוצע'],
  ];
  const evs = [...db.events].sort((a, b) => (a.date || '').localeCompare(b.date || ''));
  for (const ev of evs) {
    rows.push([
      ev.title,
      ev.customType || EV_META[ev.type].label,
      ev.date ? hebDateFull(ev.date) : '',
      fmtD(ev.date),
      ev.time || '',
      db.families.find((f) => f.id === ev.famId)?.name || '',
      PRIORITY_LABEL[ev.priority] || ev.priority,
      ev.notes || '',
      ev.done ? 'כן' : 'לא',
    ]);
  }
  return rows;
}
