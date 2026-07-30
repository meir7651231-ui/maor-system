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

/* ---------- ייצוא בפורמט הייבוא (P3 פריט 4, לגאסי exportImportFormat) ----------
 * "ייצא → ערוך באקסל → החזר": הנתונים הקיימים באותן עמודות שהייבוא מקבל.
 * לעיניים קיים מ-P0.4 (maor-ayin-eyes.csv); כאן משפחות (13 עמודות של
 * familiesImport) ותומכות (7 העמודות של SupporterImport). */

/** משפחות בפורמט ייבוא 13 העמודות — מיפוי parseFamiliesCsv (legacy:944-960). */
export function familiesImportFormatRows(db: Db): Cell[][] {
  const rows: Cell[][] = [
    ['שם', 'ת"ז אב', 'טלפון', 'שם האם', 'ת"ז אם', 'טלפון 2', 'עיר', 'כתובת', '', 'אלמן', 'קהילה', '', 'הערות'],
  ];
  for (const f of db.families) {
    rows.push([
      f.name, f.fatherId, f.phone, f.mother, f.motherId, f.phone2, f.city, f.address, '',
      (f.maritalStatus || '').includes('אלמן') ? 'אלמן' : '', f.community, '', f.notes,
    ]);
  }
  return rows;
}

/** תומכות בפורמט ייבוא 7 העמודות של SupporterImport (הצלבה לפי שם). */
export function supportersImportFormatRows(db: Db): Cell[][] {
  const rows: Cell[][] = [['שם', 'טלפון', 'אימייל', 'ת"ז', 'כתובת', 'קטגוריה', 'עבור']];
  for (const sp of db.supporters) {
    rows.push([sp.name, sp.phone, sp.email, sp.idNum, sp.address, sp.cat, sp.forWho]);
  }
  return rows;
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
