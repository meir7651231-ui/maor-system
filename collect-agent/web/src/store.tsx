// מצב הממשק. שני מקורות: "חי" — הבקאנד של גבי ב-dry-run (אותו origin), או "מוק" — נתוני דמו בזיכרון.
// בשני המצבים אין שליחה אמיתית: בחי השליחה היא DryRunSender של הבקאנד; במוק רק רשומה בזיכרון.
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { DEMO_TODAY, demoBusiness, demoCustomers, demoInvoices } from './data/demo.ts';
import type { Business, Channel, Customer, Invoice, Step } from './lib/domain.ts';
import { needsReminder } from './lib/stats.ts';
import { api, detectBackend, fromDashboard, type Dashboard, type Health, type OutMsg, type Plan } from './api.ts';

export type Mode = 'loading' | 'live' | 'mock';
interface Ctx {
  mode: Mode;
  health: Health | null;
  today: string;
  business: Business;
  setBusiness: (b: Business) => void;
  customers: Customer[];
  invoices: Invoice[];
  /** התור לאישור: במוק — נגזר מכללי הסולם; בחי — התזכורות שהבקאנד תכנן ומחכות לאישור. */
  queue: Invoice[];
  pendingOf: (invoiceId: string) => { reminderId: number; block: string | null } | undefined;
  totals: Dashboard['totals'] | null;
  outbox: OutMsg[];
  plans: Plan[];
  customerOf: (id: string) => Customer;
  approveAndSend: (invoiceId: string, step: Step, channels: Channel[]) => Promise<void>;
  markPaid: (invoiceId: string) => void;
  reload: () => Promise<void>;
  toast: string | null;
  showToast: (t: string) => void;
}
const C = createContext<Ctx | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [mode, setMode] = useState<Mode>('loading');
  const [health, setHealth] = useState<Health | null>(null);
  const [business, setBusiness] = useState(demoBusiness);
  const [customers, setCustomers] = useState<Customer[]>(demoCustomers);
  const [invoices, setInvoices] = useState<Invoice[]>(demoInvoices);
  const [today, setToday] = useState(DEMO_TODAY);
  const [pendingBy, setPendingBy] = useState(new Map<string, { reminderId: number; block: string | null }>());
  const [totals, setTotals] = useState<Dashboard['totals'] | null>(null);
  const [outbox, setOutbox] = useState<OutMsg[]>([]);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [toast, setToast] = useState<string | null>(null);
  const showToast = useCallback((t: string) => { setToast(t); window.setTimeout(() => setToast(null), 3600); }, []);

  const reload = useCallback(async () => {
    const [d, p, o, pl] = await Promise.all([api.dashboard(), api.pending(), api.outbox(), api.plans()]);
    const m = fromDashboard(d, p);
    setCustomers(m.customers); setInvoices(m.invoices); setPendingBy(m.pendingBy); setToday(m.today);
    setTotals(d.totals); setOutbox(o.messages); setPlans(pl);
    // שם העסק בחי = הקידומת של הודעות השרת ("סטודיו דמו: …") — כך הממשק לא ממציא שם
    const biz = o.messages.find(x => x.channel === 'sms')?.body.split(':')[0];
    if (biz && biz.length < 40) setBusiness(b => ({ ...b, name: biz, ownerName: biz }));
  }, []);

  useEffect(() => {
    let off = false;
    detectBackend().then(async h => {
      if (off) return;
      if (!h) { setMode('mock'); return; }
      try {
        await reload();
        setHealth(h);
        setBusiness(b => ({ ...b, smsProvider: (['019', 'inforu', 'twilio'].includes(h.sms_provider) ? h.sms_provider : b.smsProvider) as Business['smsProvider'] }));
        setMode('live');
      } catch { setMode('mock'); }
    });
    return () => { off = true; };
  }, [reload]);

  const value = useMemo<Ctx>(() => {
    const live = mode === 'live';
    const customerOf = (id: string) => customers.find(c => c.id === id)!;
    return {
      mode, health, today, business, setBusiness, customers, invoices, totals, outbox, plans, reload, toast, showToast, customerOf,
      queue: live ? invoices.filter(i => pendingBy.has(i.id)) : needsReminder(invoices, today),
      pendingOf: id => pendingBy.get(id),
      approveAndSend: async (id, step, channels) => {
        if (live) {
          const p = pendingBy.get(id);
          if (!p) throw new Error('אין תזכורת שממתינה לאישור לחשבונית הזו');
          await api.approve(p.reminderId);
          const r = await api.dispatch();
          await reload();
          showToast(`✓ אושר · ${r.sent.length ? `${r.sent.length} תזכורות יצאו ב-dry-run (ביומן היוצאים)` : 'נכנס לתור — ייצא בחלון השליחה הבא'} · לא נשלחה הודעה אמיתית`);
          return;
        }
        setInvoices(list => list.map(i => i.id !== id ? i : {
          ...i, status: i.status === 'open' ? 'reminded' : i.status,
          reminders: [...i.reminders, ...channels.map(channel => ({ at: today, step, channel, status: 'sent' as const }))],
        }));
        showToast('✓ אושר ונכנס לתור השליחה (דמו — לא נשלחה הודעה אמיתית)');
      },
      markPaid: id => { setInvoices(l => l.map(i => i.id === id ? { ...i, status: 'paid' } : i)); showToast('סומן כשולם 🎉'); },
    };
  }, [mode, health, today, business, customers, invoices, pendingBy, totals, outbox, plans, reload, toast, showToast]);
  return <C.Provider value={value}>{children}</C.Provider>;
}
export const useApp = () => {
  const v = useContext(C);
  if (!v) throw new Error('useApp מחוץ ל-AppProvider');
  return v;
};
