/**
 * 📅 מנוע טהור · חיובים-מתוכננים (planned charges) — supporters.plannedcharges
 * ----------------------------------------------------------------------------
 * "כאני מגדיר חיוב אני רושם מתי החיוב יתבצע ובכמה תשלומים, אבל לא מוציא
 *  חשבונית על אשראי — רק שהחיוב יירד זה יסתנכרן" (בקשת-בעלים 25.8).
 *
 * לוגיקה בלבד — בלי store ו-DOM (מוסכמת-הטוהר של הפרויקט). כל הפונקציות
 * דטרמיניסטיות (ה"היום" מוזרק כשצריך), additive לחלוטין ואינן נוגעות בכספים
 * או ב-donationSeq של הענן. יצירת ה-Donation-בפועל (עם `D-`) קוראת ל-store,
 * בסדרה הרציפה — כאן רק זריעה/חישוב/פריסת-תאריכים.
 *
 * אינווריאנטים:
 *  • plan פתוח = `!chargedRid && !cancelledAt` (chargedRid ריק ⇒ עדיין הבטחה).
 *  • plan שכבר חויב (`chargedRid` מלא) לא נספר ביתרה-מתוכננת (הוא כבר קבלה).
 *  • plan מבוטל (`cancelledAt` מלא) לא נספר.
 *  • pending לפי-מטבע — ₪/$ נספרים בנפרד (עקבי עם `ils`/`usd` על התומך).
 */
import type { PlannedCharge } from '../../types/domain';

/** מרכב-פלנים: כל אובייקט (Supporter/Enrollment) שיש לו plannedCharges? — גנרי
 *  לשימוש-חוזר של אותן פונקציות-חישוב בין מודולים (25.8). */
export interface HasPlannedCharges {
  plannedCharges?: PlannedCharge[];
}

/** האם החיוב פעיל (עדיין ממתין לחיוב)? */
export function isOpenPlan(p: PlannedCharge): boolean {
  return !p.chargedRid && !p.cancelledAt;
}

/** רק החיובים הפתוחים של הישות. */
export function openPlans(o: HasPlannedCharges): PlannedCharge[] {
  return (o.plannedCharges || []).filter(isOpenPlan);
}

/** סכום פתוח בשקלים (חיובים בשקל, לא-חויבו-עדיין ולא-בוטלו). */
export function pendingIls(o: HasPlannedCharges): number {
  return openPlans(o).filter((p) => p.cur === '₪').reduce((a, p) => a + (Number.isFinite(p.amount) ? p.amount : 0), 0);
}

/** סכום פתוח בדולרים. */
export function pendingUsd(o: HasPlannedCharges): number {
  return openPlans(o).filter((p) => p.cur === '$').reduce((a, p) => a + (Number.isFinite(p.amount) ? p.amount : 0), 0);
}

/** התאריך של החיוב-הפתוח הקרוב-ביותר (ISO); '' = אין פתוחים. */
export function plannedNextDate(o: HasPlannedCharges): string {
  const open = openPlans(o);
  if (!open.length) return '';
  return open.map((p) => p.date).sort()[0];
}

/** חיובים-פתוחים שכבר עבר תאריכם ומעולם לא חויבו (איחור). */
export function overduePlans(o: HasPlannedCharges, todayIso: string): PlannedCharge[] {
  return openPlans(o).filter((p) => p.date < todayIso);
}

/** הבא-בזמן (הקרוב שעדיין לא-עבר). undefined = אין. */
export function nextUpcomingPlan(o: HasPlannedCharges, todayIso: string): PlannedCharge | undefined {
  return openPlans(o)
    .filter((p) => p.date >= todayIso)
    .sort((a, b) => a.date.localeCompare(b.date))[0];
}

/**
 * הזזת חודשים כלפי-מעלה על תאריך-ISO, עם קלמפ ליום-האחרון-בחודש-היעד:
 * ‏31.1 + 1 = 28/29.2 (לא 3.3). כך פריסת-תשלומים לא בורחת לתחילת החודש הבא.
 */
export function addMonthsClamped(iso: string, months: number): string {
  const [ys, ms, ds] = iso.split('-').map((s) => parseInt(s, 10));
  const y0 = ys || 1970;
  const m0 = (ms || 1) - 1;
  const d0 = ds || 1;
  // ‏Date עם יום-1 של החודש היעד כדי לא לגלוש (30.1 → יום-31 בחודש-פברואר).
  const target = new Date(y0, m0 + months, 1, 12, 0, 0);
  const lastDay = new Date(target.getFullYear(), target.getMonth() + 1, 0).getDate();
  target.setDate(Math.min(d0, lastDay));
  const y = target.getFullYear();
  const mm = String(target.getMonth() + 1).padStart(2, '0');
  const dd = String(target.getDate()).padStart(2, '0');
  return `${y}-${mm}-${dd}`;
}

/** קלט לזריעת-פריסה (planCharges). */
export interface PlanSpec {
  firstDate: string;
  count: number;
  amount: number;      // סכום פר-תשלום (לא-סכום-כולל)
  cur: '₪' | '$';
  method: string;
  cat: string;
  note?: string;
  /** מרווח בחודשים בין תשלומים (ברירת-מחדל 1 = חודשי). */
  gapMonths?: number;
  /** מזהה-קבוצה (installmentOf) — יוזרק לכל שורות-הפריסה. */
  groupId: string;
  /** ‏nextId('pc') — מוזרק מבחוץ (כמו בכל מנוע-טהור בפרויקט). */
  ids: string[];
}

/** זריעת פריסת-תשלומים אחידה — N שורות PlannedCharge בפערים שווים. */
export function planCharges(spec: PlanSpec): PlannedCharge[] {
  const gap = Math.max(1, spec.gapMonths || 1);
  const out: PlannedCharge[] = [];
  for (let i = 0; i < spec.count; i++) {
    out.push({
      id: spec.ids[i] || `pc_${i}`,
      date: i === 0 ? spec.firstDate : addMonthsClamped(spec.firstDate, i * gap),
      amount: spec.amount,
      cur: spec.cur,
      method: spec.method,
      cat: spec.cat,
      installmentOf: spec.groupId,
      ...(spec.note ? { note: spec.note } : {}),
    });
  }
  return out;
}
