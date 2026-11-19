// critic סבב 172ב: מרשם בקשות העיון/התיקון/המחיקה (חוק הגנת הפרטיות §13–14) — היה רק API (GET /dsr, POST /dsr/{id}/done).
// «✓ טופל» על כרטיס ההתראה סוגר רק את ההודעה ⇒ הבקשה נשארה פתוחה, ו-sweep התריע «באיחור» לנצח.
// כאן: תצוגה טהורה של שורה במרשם + כלל הסגירה (תיעוד ≥5 תווים, כמו השרת — DsrDoneIn.min_length=5).
export interface DsrRow {
  id: number; customer_id: number | null; customer: string | null; kind: 'access' | 'correction' | 'deletion' | string;
  channel: string; received_at: string; due_at: string; status: 'open' | 'done' | string; done_at: string | null;
  note: string; days_left: number | null; overdue: boolean;
}
export const DSR_KIND: Record<string, string> = { access: 'עיון במידע', correction: 'תיקון מידע', deletion: 'מחיקת מידע' };
/** בקשה מכתובת משותפת נרשמת בלי לקוח (מנהל 319) — עד השיוך מהכרטיס בסקירה. */
export const DSR_NO_CUSTOMER = 'כתובת משותפת — לשייך מהכרטיס בסקירה';
/** critic 174 (נלווה): לקוח שהותמם (customer_id קיים, השם נמחק) — אינו «כתובת משותפת»; אין מה לשייך. */
export const DSR_ANON_CUSTOMER = 'לקוח שפרטיו נמחקו';
export const DSR_NOTE_MIN = 5;
const ddmm = (iso: string | null) => (iso ?? '').slice(0, 10).split('-').reverse().join('.');

export const dsrCanClose = (note: string) => note.trim().length >= DSR_NOTE_MIN;

export interface DsrView { id: number; who: string; kind: string; due: string; state: string; tone: 'late' | 'soon' | 'ok' | 'done'; open: boolean }
export function dsrView(r: DsrRow): DsrView {
  const open = r.status === 'open';
  const d = r.days_left ?? 0;
  const state = !open ? `טופל ${ddmm(r.done_at)}`
    : r.overdue ? `באיחור של ${-d} ${-d === 1 ? 'יום' : 'ימים'}`
    : d === 0 ? 'היום האחרון להשיב' : `נותרו ${d} ${d === 1 ? 'יום' : 'ימים'}`;
  const tone = !open ? 'done' : r.overdue ? 'late' : d <= 5 ? 'soon' : 'ok';
  return { id: r.id, who: r.customer?.trim() || (r.customer_id != null ? `${DSR_ANON_CUSTOMER} (#${r.customer_id})` : DSR_NO_CUSTOMER), kind: DSR_KIND[r.kind] ?? r.kind,
    due: ddmm(r.due_at), state, tone, open };
}
/** פתוחות קודם (המוקדמת ביותר ראשונה, כמו השרת), ואז סגורות — החדשה ראשונה. */
export function dsrSorted(rows: DsrRow[]): DsrRow[] {
  return [...rows].sort((a, b) => Number(b.status === 'open') - Number(a.status === 'open')
    || (a.status === 'open' ? a.due_at.localeCompare(b.due_at) : (b.done_at ?? '').localeCompare(a.done_at ?? '')));
}
