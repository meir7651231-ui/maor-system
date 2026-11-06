import type { Invoice } from './domain.ts';
import { agingOf, daysOverdue, type Aging } from './format.ts';

export const isOpen = (i: Invoice) => i.status !== 'paid';

export interface Kpis { openTotal: number; overdueTotal: number; openCount: number; overdueCount: number; avgDaysLate: number; needsAction: number }
export function kpis(list: Invoice[], today: string): Kpis {
  const open = list.filter(isOpen);
  const overdue = open.filter(i => daysOverdue(i.dueAt, today) > 0);
  const late = overdue.map(i => daysOverdue(i.dueAt, today));
  return {
    openTotal: open.reduce((s, i) => s + i.amount, 0),
    overdueTotal: overdue.reduce((s, i) => s + i.amount, 0),
    openCount: open.length,
    overdueCount: overdue.length,
    avgDaysLate: late.length ? Math.round(late.reduce((a, b) => a + b, 0) / late.length) : 0,
    needsAction: needsReminder(list, today).length,
  };
}

export function agingBuckets(list: Invoice[], today: string): Record<Aging, number> {
  const r: Record<Aging, number> = { notDue: 0, d0_30: 0, d31_60: 0, d61_90: 0, d90p: 0 };
  for (const i of list.filter(isOpen)) r[agingOf(daysOverdue(i.dueAt, today))] += i.amount;
  return r;
}

/** חשבוניות שמחכות לאישור תזכורת: באיחור, לא במחלוקת/הבטחה, ואין תזכורת ב-5 הימים האחרונים. */
export function needsReminder(list: Invoice[], today: string): Invoice[] {
  return list
    .filter(i => (i.status === 'open' || i.status === 'reminded') && daysOverdue(i.dueAt, today) > 0)
    .filter(i => {
      const last = i.reminders[i.reminders.length - 1];
      return !last || daysOverdue(last.at, today) >= 5;
    })
    .sort((a, b) => b.amount - a.amount);
}
