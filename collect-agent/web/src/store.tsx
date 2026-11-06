// מצב דמו בזיכרון (React context). אין רשת — "שליחה" רק מוסיפה רשומה ומציגה הודעה.
import { createContext, useContext, useMemo, useState, type ReactNode } from 'react';
import { DEMO_TODAY, demoBusiness, demoCustomers, demoInvoices } from './data/demo.ts';
import type { Business, Channel, Customer, Invoice, Step } from './lib/domain.ts';

interface Ctx {
  today: string;
  business: Business;
  setBusiness: (b: Business) => void;
  customers: Customer[];
  invoices: Invoice[];
  customerOf: (id: string) => Customer;
  approveAndSend: (invoiceId: string, step: Step, channels: Channel[]) => void;
  markPaid: (invoiceId: string) => void;
  toast: string | null;
  showToast: (t: string) => void;
}
const C = createContext<Ctx | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [business, setBusiness] = useState(demoBusiness);
  const [invoices, setInvoices] = useState(demoInvoices);
  const [toast, setToast] = useState<string | null>(null);
  const value = useMemo<Ctx>(() => {
    const showToast = (t: string) => { setToast(t); window.setTimeout(() => setToast(null), 3200); };
    return {
      today: DEMO_TODAY, business, setBusiness, customers: demoCustomers, invoices,
      customerOf: id => demoCustomers.find(c => c.id === id)!,
      approveAndSend: (id, step, channels) => {
        setInvoices(list => list.map(i => i.id !== id ? i : {
          ...i, status: i.status === 'open' ? 'reminded' : i.status,
          reminders: [...i.reminders, ...channels.map(channel => ({ at: DEMO_TODAY, step, channel, status: 'sent' as const }))],
        }));
        showToast('✓ אושר ונכנס לתור השליחה (דמו — לא נשלחה הודעה אמיתית)');
      },
      markPaid: id => { setInvoices(l => l.map(i => i.id === id ? { ...i, status: 'paid' } : i)); showToast('סומן כשולם 🎉'); },
      toast, showToast,
    };
  }, [business, invoices, toast]);
  return <C.Provider value={value}>{children}</C.Provider>;
}
export const useApp = () => {
  const v = useContext(C);
  if (!v) throw new Error('useApp מחוץ ל-AppProvider');
  return v;
};
