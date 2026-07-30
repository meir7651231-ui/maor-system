/**
 * בונה גריד חודשי לועזי/עברי — נכס משותף למודולים המבודדים (קופות/חנות).
 * חולץ מ-buildTzGrid (BUILD-ORDER-SHOP סעיף 14) כגנרי על סוג האירוע —
 * כל רשימת אירועים עם שדה date נכנסת; טהור בלבד (בלי store/DOM).
 *
 * לועזי — 42 תאים בדפוס הלוח הראשי; עברי — החודש העברי המלא
 * (א׳ עד סוף החודש) עם ריפוד לתחילת/סוף שבוע.
 */
import type { IsoDate } from '../types/domain';
import { FULL_HOLIDAYS, hpOf, isoOf } from '../components/calendar/calLib';
import { gem, gemYear, holidayOf } from './hebrew';

export interface MonthGridCell<E> {
  iso: IsoDate;
  /** מספר לועזי (בעברי: "יום.חודש"). */
  dayNum: string;
  /** היום העברי בגימטריה. */
  hebDay: string;
  inMonth: boolean;
  holiday: string | null;
  /** חג עצירת-מלאכה (FULL_HOLIDAYS) — תצוגה מודגשת. */
  fullHoliday: boolean;
  events: E[];
}

export interface MonthGrid<E> {
  cells: MonthGridCell<E>[];
  /** כותרת ראשית (לועזי: חודש+שנה; עברי: החודש העברי בגימטריה). */
  label: string;
  subLabel: string;
  prevIso: IsoDate;
  nextIso: IsoDate;
}

const fmtMonthYear = new Intl.DateTimeFormat('he', { month: 'long', year: 'numeric' });
const fmtHebMonth = new Intl.DateTimeFormat('he-u-ca-hebrew', { month: 'long' });
const fmtHebYear = new Intl.DateTimeFormat('he-u-ca-hebrew', { year: 'numeric' });

function cellOf<E>(d: Date, inMonth: boolean, hebMode: boolean, byDate: Map<string, E[]>): MonthGridCell<E> {
  const iso = isoOf(d);
  const hol = holidayOf(d);
  return {
    iso,
    dayNum: hebMode ? d.getDate() + '.' + (d.getMonth() + 1) : String(d.getDate()),
    hebDay: gem(hpOf(iso, d).day),
    inMonth,
    holiday: hol,
    fullHoliday: !!hol && FULL_HOLIDAYS.includes(hol),
    events: byDate.get(iso) ?? [],
  };
}

/** גריד חודשי לועזי/עברי עם אירועי המודול בלבד (אין db.events — בידוד). */
export function buildMonthGrid<E extends { date: IsoDate }>(
  events: readonly E[],
  anchorIso: IsoDate,
  hebMode: boolean,
): MonthGrid<E> {
  const byDate = new Map<string, E[]>();
  for (const ev of events) {
    if (!ev.date) continue;
    const arr = byDate.get(ev.date) ?? [];
    arr.push(ev);
    byDate.set(ev.date, arr);
  }
  const anchor = new Date(anchorIso + 'T12:00:00');

  if (!hebMode) {
    const first = new Date(anchor.getFullYear(), anchor.getMonth(), 1);
    const start = new Date(first.getFullYear(), first.getMonth(), 1 - first.getDay());
    const cells: MonthGridCell<E>[] = [];
    for (let i = 0; i < 42; i++) {
      const d = new Date(start.getFullYear(), start.getMonth(), start.getDate() + i);
      cells.push(cellOf(d, d.getMonth() === anchor.getMonth(), false, byDate));
    }
    return {
      cells,
      label: fmtMonthYear.format(first),
      subLabel: fmtHebMonth.format(first) + '–' + fmtHebMonth.format(new Date(anchor.getFullYear(), anchor.getMonth() + 1, 0)),
      prevIso: isoOf(new Date(first.getFullYear(), first.getMonth() - 1, 15)),
      nextIso: isoOf(new Date(first.getFullYear(), first.getMonth() + 1, 15)),
    };
  }

  // עברי: אחורה עד א׳ בחודש, ואז קדימה עד סוף החודש העברי
  let d = new Date(anchor);
  while (hpOf(isoOf(d), d).day !== 1) d = new Date(d.getFullYear(), d.getMonth(), d.getDate() - 1);
  const first = d;
  const monthName = hpOf(isoOf(first), first).month;
  const days: Date[] = [];
  let cur = first;
  while (hpOf(isoOf(cur), cur).month === monthName && days.length < 31) {
    days.push(cur);
    cur = new Date(cur.getFullYear(), cur.getMonth(), cur.getDate() + 1);
  }
  const last = days[days.length - 1];
  // ריפוד לתחילת השבוע (ראשון) — תאים מחוץ לחודש
  const cells: MonthGridCell<E>[] = [];
  for (let i = first.getDay(); i > 0; i--)
    cells.push(cellOf(new Date(first.getFullYear(), first.getMonth(), first.getDate() - i), false, true, byDate));
  for (const day of days) cells.push(cellOf(day, true, true, byDate));
  while (cells.length % 7 !== 0) {
    const lastCell = new Date(cells[cells.length - 1].iso + 'T12:00:00');
    cells.push(cellOf(new Date(lastCell.getFullYear(), lastCell.getMonth(), lastCell.getDate() + 1), false, true, byDate));
  }
  return {
    cells,
    label: monthName + ' ' + gemYear(fmtHebYear.format(first)),
    subLabel: fmtMonthYear.format(first) + ' – ' + fmtMonthYear.format(last),
    prevIso: isoOf(new Date(first.getFullYear(), first.getMonth(), first.getDate() - 1)),
    nextIso: isoOf(new Date(last.getFullYear(), last.getMonth(), last.getDate() + 1)),
  };
}
