import { PRODUCT_RULES, type Channel, type Invoice } from './domain.ts';

/** אחרי 3 תזכורות: גבי עוצר ומעביר לבעל העסק. */
export const stoppedAtMax = (list: Invoice[]) => list.filter(i => i.status !== 'paid' && i.reminders.length >= PRODUCT_RULES.maxReminders);
import { agingOf, daysOverdue, ratioHalfUp, type Aging } from './format.ts';

export const isOpen = (i: Invoice) => i.status !== 'paid';

/** חשבונית בשקלים (מטבע חסר = ILS). סכומי ה-KPI והגיול לא מחברים מטבעות אחרים. */
export const isIls = (i: Invoice) => !i.currency || i.currency === 'ILS';

/** מיון «לפי סכום»: ₪ קודם (מהגבוה לנמוך), ואחריו כל מטבע אחר כקבוצה נפרדת לפי קוד המטבע.
 *  אין לנו שער המרה, ולכן $500 ו-500 ₪ לא מושווים זה לזה (הפעלה 132). */
export function byAmountDesc(a: Invoice, b: Invoice): number {
  const ca = isIls(a) ? '' : a.currency!, cb = isIls(b) ? '' : b.currency!;
  if (ca !== cb) return ca < cb ? -1 : 1;
  return b.amount - a.amount;
}

export interface Kpis { openTotal: number; overdueTotal: number; openCount: number; overdueCount: number; avgDaysLate: number; needsAction: number }
export function kpis(list: Invoice[], today: string): Kpis {
  const open = list.filter(isOpen);
  const overdue = open.filter(i => daysOverdue(i.dueAt, today) > 0);
  const late = overdue.map(i => daysOverdue(i.dueAt, today));
  return {
    // סכומים ב-₪ בלבד, כמו totals בשרת (הפעלה 131); הספירות כוללות כל מטבע
    openTotal: open.filter(isIls).reduce((s, i) => s + i.amount, 0),
    overdueTotal: overdue.filter(isIls).reduce((s, i) => s + i.amount, 0),
    openCount: open.length,
    overdueCount: overdue.length,
    avgDaysLate: ratioHalfUp(late.reduce((a, b) => a + b, 0), late.length),
    needsAction: needsReminder(list, today).length,
  };
}

/** מוק: סיכום לכל מטבע שאינו ₪ — מראה של `app/service.py _other_currency` (הפעלה 140).
 *  אותו מבנה ואותם כללים כמו `totals.other_currency` בשרת: ממוין לפי קוד המטבע, פתוח/באיחור/בסיכון (60+ יום)/נגבה,
 *  באגורות שלמות, בלי המרה ובלי חיבור בין מטבעות. אין חשבונית במטבע אחר ⇒ []. */
export function mockOtherCurrency(list: Invoice[], today: string) {
  const by = new Map<string, { currency: string; open_invoices: number; open_agorot: number; overdue_agorot: number; at_risk_agorot: number; collected_agorot: number }>();
  for (const i of list) {
    if (isIls(i)) continue;
    const c = i.currency!, ag = Math.round(i.amount * 100);
    const s = by.get(c) ?? { currency: c, open_invoices: 0, open_agorot: 0, overdue_agorot: 0, at_risk_agorot: 0, collected_agorot: 0 };
    by.set(c, s);
    if (!isOpen(i)) { s.collected_agorot += ag; continue; }
    const late = daysOverdue(i.dueAt, today);
    s.open_invoices += 1; s.open_agorot += ag;
    if (late > 0) s.overdue_agorot += ag;
    if (late > 60) s.at_risk_agorot += ag;
  }
  return [...by.keys()].sort().map(c => by.get(c)!);
}

export function agingBuckets(list: Invoice[], today: string): Record<Aging, number> {
  const r: Record<Aging, number> = { notDue: 0, d0_30: 0, d31_60: 0, d61_90: 0, d90p: 0 };
  for (const i of list.filter(isOpen).filter(isIls)) r[agingOf(daysOverdue(i.dueAt, today))] += i.amount;
  return r;
}

/** חשבוניות שמחכות לאישור תזכורת: באיחור, לא במחלוקת/הבטחה, פחות מ-3 תזכורות, ואין תזכורת ב-5 הימים האחרונים. */
export function needsReminder(list: Invoice[], today: string): Invoice[] {
  return list
    .filter(i => (i.status === 'open' || i.status === 'reminded') && daysOverdue(i.dueAt, today) > 0)
    .filter(i => i.reminders.length < PRODUCT_RULES.maxReminders)
    .filter(i => {
      const last = i.reminders[i.reminders.length - 1];
      return !last || daysOverdue(last.at, today) >= 5;
    })
    .sort((a, b) => b.amount - a.amount);
}

/** הערוצים שבהם יצאה התזכורת האחרונה. חי: מה שנרשם ביומן היוצאים (lastSent); מוק / שרת ישן: הערוץ של התזכורת האחרונה. */
export function sentChannels(inv: Invoice): Channel[] {
  if (inv.lastSent?.unknown) return inv.lastSent.channels;   // critic סבב 53: לא ממציאים 📱
  if (inv.lastSent?.channels.length) return inv.lastSent.channels;
  const last = inv.reminders.at(-1);
  return last ? [last.channel] : [];
}

/** הפעלה 164: רשימת «הסכום השתנה במקור» במסך הסקירה מוגבלת ל-DRIFT_CAP שורות (הגבוהות ראשונות, אותו מיון כמו
 *  «מיון: סכום»); השאר ⇒ «ועוד N» שמוביל לטבלת החשבוניות מסוננת לפער. בלי זה, על מאות פערים התור נדחק מתחת לרשימה. */
export const DRIFT_CAP = 5;
export function capDrift(list: Invoice[], cap = DRIFT_CAP): { shown: Invoice[]; more: number; total: number } {
  const all = list.filter(i => i.amountDrift).sort(byAmountDesc);
  return { shown: all.slice(0, cap), more: Math.max(0, all.length - cap), total: all.length };
}
