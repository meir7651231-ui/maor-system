/** מנהל 334: כרטיס «הסדרי תשלומים» — אחרי שבעל העסק אישר הסדר, הוא נעלם מהמסך (רק `proposed` הוצג), וגם הסדר
 *  שהוחמץ (332) נראה רק בכרטיס חד-פעמי. טהור: בלי React/רשת — נבדק ב-tests/lib.check.ts. */
import { queueReasonText } from './draftQueue.ts';
export type PlanProgress = {
  total_agorot: number; paid_agorot: number; open_agorot: number; done: number; count: number;
  next: { n: number; due: string; amount_agorot: number } | null;
  /** מבקר 185 🔴: מטבע ההסדר (חסר ⇒ ILS, תאימות לשרת ישן) */
  currency?: string;
};
export type PlanRow = {
  id: number; status: string; progress?: PlanProgress | null; currency?: string;
  /** מנהל 447 (מבקר 273🟡): ההסדר אושר אבל ההצעה עדיין בתור (שירות עצור / מחוץ לחלון / עצירת שחזור) */
  offer_queued?: boolean; queued_reason?: string;
};

export type PlanTone = 'good' | 'warn' | 'done';
/** תג מצב. רק המצבים שמוצגים בכרטיס; `proposed` (ב«דורש טיפול»), `superseded`/`rejected`/אחר ⇒ null. */
export const PLAN_BADGE: Record<string, { label: string; tone: PlanTone; hint: string }> = {
  approved: { label: 'פעיל', tone: 'good', hint: 'גבי לא שולח תזכורות על החוב הזה כל עוד משלמים לפי הלוח' },
  missed: { label: 'תשלום לא התקבל', tone: 'warn', hint: 'התזכורות הרגילות חזרו — ממתינות לאישורכם' },
  completed: { label: 'הושלם', tone: 'done', hint: 'כל התשלומים בהסדר התקבלו' },
};
export const planBadge = (status: string) => PLAN_BADGE[status] ?? null;

/** מנהל 447 (מבקר 273🟡): הסדר שההצעה שלו בתור — לא «פעיל»: ללקוח עוד לא נשלח דבר, ואם תחכה יותר מ-4 ימים
 *  היא תבוטל (inbox._withdraw_if_stale) וההסדר ייעלם מהלוח. */
export function planBadgeFor(p: Pick<PlanRow, 'status' | 'offer_queued' | 'queued_reason'>) {
  if (p.status === 'approved' && p.offer_queued) {
    return { label: '⏳ ההצעה טרם נשלחה', tone: 'warn' as PlanTone,
      hint: `ללקוח עוד לא נשלח דבר. ההצעה ${queueReasonText(p.queued_reason)}. `
        + 'אם תחכה יותר מ-4 ימים, היא תבוטל ותצטרכו לאשר הצעה חדשה.' };
  }
  return planBadge(p.status);
}

const ORDER: Record<string, number> = { missed: 0, approved: 1, completed: 2 };
/** מה מוצג: הוחמצו ראשונים, אחריהם פעילים לפי מועד התשלום הבא, ובסוף עד `doneCap` שהושלמו (החדשים). */
export function plansVisible<T extends PlanRow>(plans: readonly T[], doneCap = 3): T[] {
  const shown = plans.filter(p => p.status in ORDER && p.progress);
  const done = shown.filter(p => p.status === 'completed').sort((a, b) => b.id - a.id).slice(0, doneCap);
  const rest = shown.filter(p => p.status !== 'completed').sort((a, b) =>
    ORDER[a.status] - ORDER[b.status] || (a.progress!.next?.due ?? '9').localeCompare(b.progress!.next?.due ?? '9') || a.id - b.id);
  return [...rest, ...done];
}

/** אחוז ששולם (0–100, מעוגל מטה — «100%» רק כששולם הכול). */
export function paidPct(p: PlanProgress): number {
  if (p.total_agorot <= 0) return 0;
  return Math.max(0, Math.min(100, Math.floor((p.paid_agorot * 100) / p.total_agorot)));
}

const dmy = (iso: string) => iso.split('-').reverse().join('.');
/** שורת «הבא»: מה התשלום הבא ומתי; באיחור — כמה ימים. */
export function nextLine(p: PlanProgress, today: string, fmt: (ils: number) => string): string {
  if (!p.next) return 'כל התשלומים התקבלו';
  const late = Math.round((Date.parse(`${today}T12:00:00`) - Date.parse(`${p.next.due}T12:00:00`)) / 86_400_000);
  const base = `תשלום ${p.next.n} מתוך ${p.count} · ${fmt(p.next.amount_agorot / 100)} · ${dmy(p.next.due)}`;
  return late > 0 ? `${base} (באיחור של ${late} ימים)` : base;
}
