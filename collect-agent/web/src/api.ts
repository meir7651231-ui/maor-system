// שכבת API מול הבקאנד של גבי (FastAPI, dry-run בלבד). אותו origin כשהממשק מוגש מ-/app/,
// או ?api=http://127.0.0.1:8000 בפיתוח. אין בקאנד ⇒ הממשק נופל לנתוני מוק (data/demo.ts).
import type { DesignSettings } from './lib/settings.ts';
import type { Channel, Customer, Invoice, InvoiceStatus, Reminder, Step } from './lib/domain.ts';
import { STEP_ORDER } from './lib/message.ts';
import { loginErrorText, readToken } from './lib/auth.ts';
import type { WeekPoint } from './lib/series.ts';
import type { OwnerMsg } from './lib/notices.ts';

/** השרת ענה 401 — צריך קוד גישה של בעל העסק. */
export class AuthError extends Error {}
/** שגיאת שרת עם קוד HTTP (כדי להציג הסבר לפי סוג הכשל). */
export class ApiError extends Error { status: number; constructor(msg: string, status: number) { super(msg); this.status = status; } }
const session = (): Storage | undefined => { try { return sessionStorage; } catch { return undefined; } };

const base = (() => {
  try { return new URLSearchParams(location.search).get('api')?.replace(/\/$/, '') ?? ''; } catch { return ''; }
})();

async function j<T>(path: string, init?: RequestInit): Promise<T> {
  const tok = readToken(session());
  const auth: Record<string, string> = tok ? { Authorization: `Bearer ${tok}` } : {};
  const r = await fetch(base + path, { ...init, headers: { 'Content-Type': 'application/json', ...auth, ...init?.headers } });
  if (r.status === 401) throw new AuthError('נדרש קוד גישה');
  if (!r.ok) {
    let msg = `${r.status}`;
    try { const b = await r.json(); msg = typeof b.detail === 'string' ? b.detail : JSON.stringify(b.detail); } catch { /* גוף לא-JSON */ }
    throw new ApiError(msg, r.status);
  }
  return r.json() as Promise<T>;
}

/** כניסת עובד (מייל+סיסמה+TOTP) ⇒ טוקן סשן. כשל ⇒ AuthError עם הודעה בעברית לפי הסטטוס (401/429/403/רשת). */
export async function loginRequest(email: string, password: string, code: string): Promise<string> {
  let r: Response;
  try {
    r = await fetch(base + '/auth/login', { method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: email.trim(), password, code: code.trim() }) });
  } catch { throw new AuthError(loginErrorText(0)); }
  if (!r.ok) throw new AuthError(loginErrorText(r.status, r.headers.get('Retry-After')));
  return (await r.json() as { token: string }).token;
}

/** יציאה: מבטל את הסשן בשרת (לא רק מוחק מהלשונית). כשל רשת לא חוסם — המחיקה המקומית קורית בכל מקרה. */
export async function logoutRequest(): Promise<void> {
  const tok = readToken(session());
  if (!tok) return;
  try { await fetch(base + '/auth/logout', { method: 'POST', headers: { Authorization: `Bearer ${tok}` } }); } catch { /* השרת לא זמין */ }
}

/** מי מחובר: עובד (שם תצוגה) או הטוקן המשותף (owner). */
export interface Me { actor: string; kind: 'user' | 'owner'; name: string }

export interface Health { status: string; dry_run: boolean; sms_provider: string; channels: string[]; /** REQUIRE_USER_LOGIN=1 ⇒ אין קוד משותף */ login_required?: boolean }
/** בקאנד חי? רק אם מצהיר dry_run — אחרת מסרבים להתחבר (מעקה: הממשק לא מדבר עם שרת ששולח באמת). */
export async function detectBackend(): Promise<Health | null> {
  try {
    const ctl = new AbortController();
    const t = setTimeout(() => ctl.abort(), 1500);
    const h = await j<Health>('/health', { signal: ctl.signal });
    clearTimeout(t);
    return h.status === 'ok' && h.dry_run === true ? h : null;
  } catch { return null; }
}

export interface DashRow {
  invoice_id: number; number: string; customer: string; phone: string; email: string;
  customer_id?: number; paused_reason?: string | null;
  source?: 'api' | 'csv';
  amount_agorot: number; currency: string; due: string | null; status: 'open' | 'closed' | string;
  days_overdue: number; reminders_sent: number;
  /** הפעלה 137: התזכורת האחרונה שבאמת יצאה (מתי ובאיזה ערוצים). חסר בשרת ישן. */
  last_sent?: null | { sent_at: string | null; channels: string[]; unknown?: boolean };
  last_reminder: null | { id: number; step: number; status: string; template_key: string; sent_at: string | null; block_reason: string | null };
  customer_block: string | null;
}
/** סיכום למטבע שאינו ₪ (app/service.py _other_currency). הסכומים ב-totals הם ₪ בלבד. */
export interface OtherCurrency { currency: string; open_invoices: number; open_agorot: number; overdue_agorot: number; at_risk_agorot: number; collected_agorot: number }
export interface Dashboard {
  today: string;
  totals: { open_invoices: number; open_agorot: number; overdue_agorot: number; closed_invoices: number; pending_approval: number; sent_sms: number; sent_email: number; owner_inbox: number;
    other_currency?: OtherCurrency[];
    collected_agorot?: number; recovery_rate_pct?: number; avg_days_overdue?: number; at_risk_agorot?: number;
    reminders_sent?: number; customers_messaged?: number; reply_rate_pct?: number;
    /** חשבוניות CSV פתוחות שלא הופיעו בייבוא האחרון — אולי כבר שולמו */ csv_unverified?: number };
  series?: WeekPoint[];
  invoices: DashRow[];
}
export interface PreviewMsg {
  channel: 'sms' | 'email'; provider: string; to: string; body: string;
  request: { headers?: Record<string, string> };
  length?: { chars: number; encoding: string; segments: number };
}
export interface AmountCheck { number: string; amount_agorot: number; usual_agorot: number; currency: string }
export interface Preview { reminder_id: number; status: string; block_reason: string | null; template_key: Step; scheduled_for: string; messages: PreviewMsg[]; amount_check?: AmountCheck[];
  /** הפעלה 135: תזכורת מאוחדת — כל המספרים, כמה חשבוניות, הסה״כ לפי מטבע, והאם יש בה חשבונית מ-CSV */
  needs_confirm_open?: boolean; numbers?: string[]; invoice_count?: number; total_text?: string }
/** תזכורת שממתינה לאישור, לפי חשבונית העוגן. count/totalText רק כשהתזכורת כוללת יותר מחשבונית אחת. */
export interface PendingRef { reminderId: number; block: string | null; count?: number; totalText?: string }
export interface PendingRow { id: number; invoice_id: number; invoice_ids?: number[]; block_reason: string | null; invoice_count?: number; total_text?: string }
export interface Plan { id: number; customer_id: number; invoice_id: number; status: string; installments: { n: number; due: string; amount_agorot: number }[]; amount_check?: AmountCheck[] }
export interface Draft {
  id: number; customer_id: number; customer: string; channel: 'sms' | 'email'; to_addr: string; body: string;
  intent: string; status: 'pending_approval' | 'needs_owner' | string; escalate: 'urgent' | 'normal' | 'none' | string;
  owner_summary: string; owner_actions: string[]; plan_id: number | null; created_at: string;
  amount_check?: AmountCheck[];
}
export interface InboundResult { intent: string; escalate?: boolean; escalation?: string; auto_reply?: string | null; draft_id?: number | null; owner_summary?: string; owner_actions?: string[] }
export interface OutMsg { id: string; channel: 'sms' | 'email'; to: string; body: string }

export const api = {
  me: () => j<Me>('/auth/me'),
  dashboard: () => j<Dashboard>('/dashboard'),
  // invoice_id = העוגן של תזכורת מאוחדת; invoice_ids = כל החשבוניות שבהודעה
  pending: () => j<PendingRow[]>('/reminders?status=pending_approval&view=summary'),
  preview: (rid: number) => j<Preview>(`/reminders/${rid}/preview`),
  /** confirmOpen: לחשבונית מ-CSV בעל העסק מאשר במפורש שהסכום עדיין פתוח (השרת מחייב; תוקף 24 ש׳). */
  /** confirmAmount (הפעלה 123): סכום חריג מאוד מהרגיל ללקוח — בעל העסק מאשר במפורש שהסכום נכון (השרת מחייב). */
  approve: (rid: number, confirmOpen = false, confirmAmount = false) => {
    const body = { ...(confirmOpen ? { confirm_open: true } : {}), ...(confirmAmount ? { confirm_amount: true } : {}) };
    return j<unknown>(`/reminders/${rid}/approve`, { method: 'POST', ...(Object.keys(body).length ? { body: JSON.stringify(body) } : {}) });
  },
  dispatch: () => j<{ dry_run: true; sent: unknown[] }>('/dispatch', { method: 'POST' }),
  outbox: () => j<{ dry_run: true; messages: OutMsg[] }>('/outbox'),
  resume: (cid: number) => j<unknown>(`/customers/${cid}/resume`, { method: 'POST' }),
  plans: () => j<Plan[]>('/plans'),
  ownerInbox: () => j<OwnerMsg[]>('/owner/inbox'),
  ownerDone: (id: number) => j<unknown>(`/owner/inbox/${id}/done`, { method: 'POST' }),
  /** confirmAmount (critic סבב 49): הסדר על סכום חריג — אישור מפורש (השרת מחייב). */
  approvePlan: (pid: number, confirmAmount = false) => j<{ text: string }>(`/plans/${pid}/approve`, { method: 'POST', ...(confirmAmount ? { body: JSON.stringify({ confirm_amount: true }) } : {}) }),
  drafts: () => j<Draft[]>('/conversation/drafts'),
  /** confirmAmount (critic סבב 48): טיוטה עם כסף ללקוח עם סכום חריג — אישור מפורש (השרת מחייב). */
  approveDraft: (id: number, body?: string, confirmAmount = false) => j<{ status: string }>(`/conversation/drafts/${id}/approve`, { method: 'POST', body: JSON.stringify({ ...(body === undefined ? {} : { body }), ...(confirmAmount ? { confirm_amount: true } : {}) }) }),
  rejectDraft: (id: number) => j<unknown>(`/conversation/drafts/${id}/reject`, { method: 'POST' }),
  settings: () => j<DesignSettings>('/settings'),
  saveSettings: (patch: Record<string, unknown>) => j<DesignSettings>('/settings', { method: 'PUT', body: JSON.stringify(patch) }),
  importCsv: (csv: string) => j<{ imported: number; credits?: number; date_order?: string; amount_check?: AmountCheck[]; rejected: { row: number; reason: string }[] }>('/settings/source/csv',
    { method: 'POST', body: csv, headers: { 'Content-Type': 'text/csv; charset=utf-8' } }),
  inbound: (channel: 'sms' | 'email', sender: string, text: string) =>
    j<InboundResult>('/inbound', { method: 'POST', body: JSON.stringify({ channel, sender, text }) }),
};

/** עמוד החייב — ציבורי (בלי טוקן), מינימום מידע. */
export interface PayerView {
  code: string; business: string; number: string; amount: string; amount_agorot: number; currency: string;
  due: string | null; open: boolean; opted_out: boolean; can_pay: boolean; methods: PayMethod[]; plan_options: number[]; dry_run: boolean;
  pay_host?: string; pay_provider?: string;
  /** critic 15.1/2.12: הודעה מאוחדת ⇒ כל החשבוניות שבה (לפי מועד) + סה״כ. אחת ⇒ invoices.length===1 */
  invoices?: PayerInvoice[]; count?: number; total?: string; total_agorot?: number;
  /** קישור תשלום אחד לכולן (עמוד קבוע של העסק) ⇒ כפתור אחד; אחרת כפתור לכל חשבונית */
  pay_shared?: boolean;
  /** ר-13: «למה קיבלתם» ופרטיות — אותו מקור כמו /p ו-/u בשרת (legal.privacy_points) */
  legal?: { why: string; controller: string; use: string; retention: string; contact: string; label: string };
}
export interface PayerInvoice { number: string; due: string | null; amount: string; amount_agorot: number; code: string; can_pay: boolean }
// review חור 4: כפתור ניטרלי אחד לעמוד התשלום של העסק (בלי Bit/Apple — סימני מסחר)
export type PayMethod = 'page';
export const payer = {
  view: (code: string) => j<PayerView>(`/api/pay/${encodeURIComponent(code)}`),
  act: (code: string, action: 'paid' | 'plan' | 'stop', installments?: number) =>
    j<{ action: string; ok: boolean }>(`/api/pay/${encodeURIComponent(code)}/${action}`, { method: 'POST', body: JSON.stringify(installments ? { installments } : {}) }),
  goUrl: (code: string, m: PayMethod) => `${base}/pay/${encodeURIComponent(code)}/go?method=${m}`,
};

export const BLOCK_LABEL: Record<string, string> = {
  no_contact: 'אין נייד או מייל תקין', no_payment_link: 'אין קישור תשלום מאובטח',
  opted_out: 'הלקוח ביקש הסרה', disputed: 'במחלוקת', plan_active: 'בהסדר תשלומים', paid_claim: 'טוען ששילם — לבדיקתך',
  credit_review: 'זיכוי לא משויך — לבדיקתך',
  compliance: 'הנוסח נחסם במסנן הניסוח — לתקן את שם העסק או את הנוסח',
  no_reply_to: 'ללקוח יש רק מייל ולא הוגדרה כתובת תשובה לעסק — להגדיר בהגדרות',
};

/** critic סבב 32: סיבות שבהן התזכורת רק **חזרה לאישור** (השרת מאשר אותן). הממשק השבית אותן כ«חסום». */
export const REAPPROVE_LABEL: Record<string, string> = {
  approval_expired: 'האישור הקודם פג (חיכה יותר מ-7 ימים) — לאשר מחדש',
  approval_invalidated: 'הנוסח השתנה מאז האישור — לאשר מחדש',
  amount_changed: 'הסכום התעדכן מהמקור — לבדוק ולאשר מחדש',
  amount_check: 'סכום חריג מאוד מהרגיל ללקוח — לבדוק שהוא נכון ולאשר במפורש',
  csv_stale: 'עברו יותר מ-24 שעות מאישור «הסכום עדיין פתוח» — לוודא שוב ולאשר מחדש',
  csv_missing_from_import: 'החשבונית לא הופיעה בייבוא ה-CSV האחרון (אולי שולמה?) — לבדוק ולאשר מחדש',
};

/** 'hard' = אסור לאשר (כפתור מושבת) · 'reapprove' = מותר, עם הסבר · null = אין. לא מוכר ⇒ 'hard' (שמרני). */
export function blockKind(b: string | null | undefined): 'hard' | 'reapprove' | null {
  if (!b) return null;
  return b in REAPPROVE_LABEL ? 'reapprove' : 'hard';
}

/** ממיר את תמונת המצב של הבקאנד למודל של הממשק. טהור (נבדק ב-tests). */
export function fromDashboard(d: Dashboard, pending: PendingRow[]) {
  const customers: Customer[] = [];
  const invoices: Invoice[] = [];
  const pendingBy = new Map<string, PendingRef>();
  for (const p of pending) pendingBy.set(String(p.invoice_id), { reminderId: p.id, block: p.block_reason,
    ...((p.invoice_count ?? 1) > 1 ? { count: p.invoice_count, totalText: p.total_text } : {}) });
  // הפעלה 136: שאר החשבוניות של תזכורת מאוחדת (לא העוגן) ⇒ מזהה חשבונית העוגן, כדי לסמן אותן «בתזכורת מאוחדת»
  const mergedBy = new Map<string, string>();
  for (const p of pending) for (const iid of p.invoice_ids ?? []) if (iid !== p.invoice_id) mergedBy.set(String(iid), String(p.invoice_id));
  for (const r of d.invoices) {
    const cid = `c${r.invoice_id}`;
    customers.push({ id: cid, name: r.customer, phone: r.phone || undefined, email: r.email || undefined, optedOut: r.customer_block === 'opted_out',
      backendId: r.customer_id, paused: r.paused_reason ?? null });
    const status: InvoiceStatus = r.status !== 'open' ? 'paid'
      : r.customer_block === 'disputed' ? 'disputed'
      : r.customer_block === 'paid_claim' || r.customer_block === 'plan_active' ? 'promised'
      : r.reminders_sent > 0 ? 'reminded' : 'open';
    // הפעלה 137: המועד והערוץ מ-last_sent (מה שיצא בפועל). last_reminder הוא השלב הגבוה, ויכול להיות
    // טיוטה בתור בלי sent_at ⇒ פעם הוצג כאן התאריך של היום. שרת ישן (בלי last_sent) ⇒ כמו קודם.
    const ls = r.last_sent;
    const sentChannels = (ls?.channels ?? []).filter((c): c is Channel => c === 'sms' || c === 'email');
    const at = (ls !== undefined ? ls?.sent_at ?? '' : r.last_reminder?.sent_at ?? d.today).slice(0, 10);
    const channel: Channel = sentChannels.length && !sentChannels.includes('sms') ? 'email' : 'sms';
    const reminders: Reminder[] = Array.from({ length: r.reminders_sent }, (_, i) => ({ at, step: STEP_ORDER[Math.min(i, 3)], channel, status: 'sent' }));
    // critic סבב 53: הניסיון האחרון נקטע (send_unknown) ⇒ לא מציגים תאריך/ערוץ של תזכורת ישנה יותר
    const lastSent = ls ? { at: at || null, channels: sentChannels, unknown: !!ls.unknown } : undefined;
    const blockNote = r.customer_block ? BLOCK_LABEL[r.customer_block] ?? r.customer_block : undefined;
    invoices.push({
      id: String(r.invoice_id), source: r.source === 'csv' ? 'csv' : 'api', number: r.number, customerId: cid, amount: r.amount_agorot / 100,
      issuedAt: r.due ?? d.today, dueAt: r.due ?? d.today, status, payUrl: '', reminders, note: blockNote,
      ...(r.currency && r.currency !== 'ILS' ? { currency: r.currency } : {}),
      ...(lastSent ? { lastSent } : {}),
    });
  }
  return { customers, invoices, pendingBy, mergedBy, today: d.today };
}
