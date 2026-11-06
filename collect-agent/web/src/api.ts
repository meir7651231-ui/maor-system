// שכבת API מול הבקאנד של גבי (FastAPI, dry-run בלבד). אותו origin כשהממשק מוגש מ-/app/,
// או ?api=http://127.0.0.1:8000 בפיתוח. אין בקאנד ⇒ הממשק נופל לנתוני מוק (data/demo.ts).
import type { Customer, Invoice, InvoiceStatus, Reminder, Step } from './lib/domain.ts';
import { STEP_ORDER } from './lib/message.ts';

const base = (() => {
  try { return new URLSearchParams(location.search).get('api')?.replace(/\/$/, '') ?? ''; } catch { return ''; }
})();

async function j<T>(path: string, init?: RequestInit): Promise<T> {
  const r = await fetch(base + path, { ...init, headers: { 'Content-Type': 'application/json', ...init?.headers } });
  if (!r.ok) {
    let msg = `${r.status}`;
    try { const b = await r.json(); msg = typeof b.detail === 'string' ? b.detail : JSON.stringify(b.detail); } catch { /* גוף לא-JSON */ }
    throw new Error(msg);
  }
  return r.json() as Promise<T>;
}

export interface Health { status: string; dry_run: boolean; sms_provider: string; channels: string[] }
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
  amount_agorot: number; currency: string; due: string | null; status: 'open' | 'closed' | string;
  days_overdue: number; reminders_sent: number;
  last_reminder: null | { id: number; step: number; status: string; template_key: string; sent_at: string | null; block_reason: string | null };
  customer_block: string | null;
}
export interface Dashboard {
  today: string;
  totals: { open_invoices: number; open_agorot: number; overdue_agorot: number; closed_invoices: number; pending_approval: number; sent_sms: number; sent_email: number; owner_inbox: number };
  invoices: DashRow[];
}
export interface PreviewMsg {
  channel: 'sms' | 'email'; provider: string; to: string; body: string;
  request: { headers?: Record<string, string> };
  length?: { chars: number; encoding: string; segments: number };
}
export interface Preview { reminder_id: number; status: string; block_reason: string | null; template_key: Step; scheduled_for: string; messages: PreviewMsg[] }
export interface Plan { id: number; customer_id: number; invoice_id: number; status: string; installments: { n: number; due: string; amount_agorot: number }[] }
export interface OutMsg { id: string; channel: 'sms' | 'email'; to: string; body: string }

export const api = {
  dashboard: () => j<Dashboard>('/dashboard'),
  pending: () => j<{ id: number; invoice_id: number; block_reason: string | null }[]>('/reminders?status=pending_approval'),
  preview: (rid: number) => j<Preview>(`/reminders/${rid}/preview`),
  approve: (rid: number) => j<unknown>(`/reminders/${rid}/approve`, { method: 'POST' }),
  dispatch: () => j<{ dry_run: true; sent: unknown[] }>('/dispatch', { method: 'POST' }),
  outbox: () => j<{ dry_run: true; messages: OutMsg[] }>('/outbox'),
  resume: (cid: number) => j<unknown>(`/customers/${cid}/resume`, { method: 'POST' }),
  plans: () => j<Plan[]>('/plans'),
  approvePlan: (pid: number) => j<{ text: string }>(`/plans/${pid}/approve`, { method: 'POST' }),
  inbound: (channel: 'sms' | 'email', sender: string, text: string) =>
    j<{ intent: string; escalate?: boolean; auto_reply?: string | null }>('/inbound', { method: 'POST', body: JSON.stringify({ channel, sender, text }) }),
};

export const BLOCK_LABEL: Record<string, string> = {
  no_contact: 'אין נייד או מייל תקין', no_payment_link: 'אין קישור תשלום מאובטח',
  opted_out: 'הלקוח ביקש הסרה', disputed: 'במחלוקת', plan_active: 'בהסדר תשלומים', paid_claim: 'טוען ששילם — לבדיקתך',
};

/** ממיר את תמונת המצב של הבקאנד למודל של הממשק. טהור (נבדק ב-tests). */
export function fromDashboard(d: Dashboard, pending: { id: number; invoice_id: number; block_reason: string | null }[]) {
  const customers: Customer[] = [];
  const invoices: Invoice[] = [];
  const pendingBy = new Map<string, { reminderId: number; block: string | null }>();
  for (const p of pending) pendingBy.set(String(p.invoice_id), { reminderId: p.id, block: p.block_reason });
  for (const r of d.invoices) {
    const cid = `c${r.invoice_id}`;
    customers.push({ id: cid, name: r.customer, phone: r.phone || undefined, email: r.email || undefined, optedOut: r.customer_block === 'opted_out',
      backendId: r.customer_id, paused: r.paused_reason ?? null });
    const status: InvoiceStatus = r.status !== 'open' ? 'paid'
      : r.customer_block === 'disputed' ? 'disputed'
      : r.customer_block === 'paid_claim' || r.customer_block === 'plan_active' ? 'promised'
      : r.reminders_sent > 0 ? 'reminded' : 'open';
    const at = (r.last_reminder?.sent_at ?? d.today).slice(0, 10);
    const reminders: Reminder[] = Array.from({ length: r.reminders_sent }, (_, i) => ({ at, step: STEP_ORDER[Math.min(i, 3)], channel: 'sms', status: 'sent' }));
    const blockNote = r.customer_block ? BLOCK_LABEL[r.customer_block] ?? r.customer_block : undefined;
    invoices.push({
      id: String(r.invoice_id), number: r.number, customerId: cid, amount: r.amount_agorot / 100,
      issuedAt: r.due ?? d.today, dueAt: r.due ?? d.today, status, payUrl: '', reminders, note: blockNote,
    });
  }
  return { customers, invoices, pendingBy, today: d.today };
}
