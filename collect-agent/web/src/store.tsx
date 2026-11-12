// מצב הממשק. שני מקורות: "חי" — הבקאנד של גבי ב-dry-run (אותו origin), או "מוק" — נתוני דמו בזיכרון.
// בשני המצבים אין שליחה אמיתית: בחי השליחה היא DryRunSender של הבקאנד; במוק רק רשומה בזיכרון.
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { DEMO_TODAY, demoBusiness, demoCustomers, demoInvoices } from './data/demo.ts';
import type { Business, Channel, Customer, Invoice, Step } from './lib/domain.ts';
import { needsReminder } from './lib/stats.ts';
import { api, loginRequest, logoutRequest, AuthError, detectBackend, fromDashboard, type Dashboard, type Health, type Draft, type Me, type OutMsg, type PendingRef, type Plan } from './api.ts';
import { TOKEN_KEY, readToken } from './lib/auth.ts';
const sessionStore = () => { try { return sessionStorage; } catch { return undefined; } };
import type { WeekPoint } from './lib/series.ts';
import { systemNotices, type Notice } from './lib/notices.ts';

/** locked = שרת חי שדורש קוד גישה (401) — לא נופלים למוק בשקט.
 *  error = יש שרת (או שיש בלשונית כניסה שמורה) אבל הטעינה נכשלה — מסך שגיאה עם «נסו שוב», לא נתוני מוק. */
export type Mode = 'loading' | 'live' | 'mock' | 'locked' | 'error';
/** תוצאת קוד הגישה המשותף: ok · bad = השרת דחה את הקוד (401) · down = השרת לא ענה או נכשל (5xx/רשת), הקוד לא נבדק. */
export type UnlockResult = 'ok' | 'bad' | 'down';
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
  pendingOf: (invoiceId: string) => PendingRef | undefined;
  /** חשבונית שכלולה בתזכורת מאוחדת ואינה העוגן ⇒ חשבונית העוגן (שעליה התזכורת מוצגת ומאושרת). */
  mergedAnchorOf: (invoiceId: string) => Invoice | undefined;
  totals: Dashboard['totals'] | null;
  series: WeekPoint[] | null;
  /** הדבקת קוד גישה (מצב locked) ⇒ ניסיון חיבור מחדש. */
  unlock: (token: string) => Promise<UnlockResult>;
  /** הפעלה 142: רענון מהשרת נכשל באמצע עבודה (מצב חי) ⇒ מה שמוצג אולי כבר לא עדכני. מתאפס ברענון מוצלח. */
  stale: boolean;
  /** מצב error ⇒ ניסיון חיבור מחדש (בדיקת שרת + טעינה). */
  retry: () => Promise<void>;
  /** כניסת עובד: מייל+סיסמה+קוד. מחזיר null בהצלחה, אחרת הודעת שגיאה בעברית. */
  login: (email: string, password: string, code: string) => Promise<string | null>;
  /** יציאה: מבטל את הסשן בשרת, מוחק אותו מהלשונית ומנקה את הנתונים מהזיכרון. */
  logout: () => Promise<void>;
  /** מי מחובר בחי (עובד ⇒ שם; טוקן משותף ⇒ owner). null במוק/לפני כניסה. */
  me: Me | null;
  /** הסבר למסך הכניסה (למשל: פג תוקף הסשן באמצע עבודה). */
  authNote: string | null;
  outbox: OutMsg[];
  plans: Plan[];
  drafts: Draft[];
  /** הודעות מערכת לבעל העסק (סוף ניסיון, 3 תזכורות מוצו, חשבונית ישנה, SMS לא נמסר) — חי בלבד. */
  notices: Notice[];
  customerOf: (id: string) => Customer;
  approveAndSend: (invoiceId: string, step: Step, channels: Channel[], opts?: { confirmOpen?: boolean; confirmAmount?: boolean }) => Promise<void>;
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
  const [pendingBy, setPendingBy] = useState(new Map<string, PendingRef>());
  const [mergedBy, setMergedBy] = useState(new Map<string, string>());
  const [totals, setTotals] = useState<Dashboard['totals'] | null>(null);
  const [series, setSeries] = useState<WeekPoint[] | null>(null);
  const [outbox, setOutbox] = useState<OutMsg[]>([]);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [drafts, setDrafts] = useState<Draft[]>([]);
  const [notices, setNotices] = useState<Notice[]>([]);
  const [toast, setToast] = useState<string | null>(null);
  const [me, setMe] = useState<Me | null>(null);
  const [authNote, setAuthNote] = useState<string | null>(null);
  const [stale, setStale] = useState(false);
  const modeRef = useRef<Mode>('loading');
  useEffect(() => { modeRef.current = mode; }, [mode]);
  const showToast = useCallback((t: string) => { setToast(t); window.setTimeout(() => setToast(null), 3600); }, []);

  /** מנקה את הסשן ואת המידע האישי מהזיכרון (יציאה / סשן שפג) ⇒ מסך הכניסה. */
  const dropSession = useCallback((note: string | null) => {
    try { sessionStorage.removeItem(TOKEN_KEY); } catch { /* פרטי/חסום */ }
    setMe(null); setCustomers([]); setInvoices([]); setPendingBy(new Map()); setMergedBy(new Map()); setTotals(null); setSeries(null);
    setOutbox([]); setPlans([]); setDrafts([]); setNotices([]);
    setAuthNote(note); setStale(false); setMode('locked');
  }, []);

  const load = useCallback(async () => {
    const d = await api.dashboard(); // בקשה אחת קודם: קוד שגוי ⇒ 401 יחיד, לא חמישה
    const [p, o, pl, dr, ib, who] = await Promise.all([api.pending(), api.outbox(), api.plans(), api.drafts().catch(() => [] as Draft[]),
      api.ownerInbox().catch(() => []), api.me().catch(() => null)]);
    setMe(who);
    const m = fromDashboard(d, p);
    setCustomers(m.customers); setInvoices(m.invoices); setPendingBy(m.pendingBy); setMergedBy(m.mergedBy); setToday(m.today);
    setTotals(d.totals); setSeries(d.series ?? null); setOutbox(o.messages); setPlans(pl); setDrafts(dr); setNotices(systemNotices(ib));
    // שם העסק בחי = הקידומת של הודעות השרת ("סטודיו דמו: …") — כך הממשק לא ממציא שם
    const biz = o.messages.find(x => x.channel === 'sms')?.body.split(':')[0];
    if (biz && biz.length < 40) setBusiness(b => ({ ...b, name: biz, ownerName: biz }));
  }, []);
  // 401 באמצע עבודה (הסשן פג אחרי 12 ש׳, העובד הושבת, יציאה מלשונית אחרת) ⇒ חזרה למסך הכניסה עם הסבר,
  // בלי להשאיר נתוני חייבים על המסך. לפני הכניסה (מצב locked) 401 הוא פשוט «קוד שגוי».
  const reload = useCallback(async () => {
    try { await load(); setStale(false); } catch (e) {
      if (e instanceof AuthError) { if (modeRef.current === 'live') dropSession('תוקף הכניסה פג. היכנסו שוב כדי להמשיך'); }
      // הפעלה 142: רענון שנכשל (5xx/רשת) במצב חי נבלע בשקט והמסך המשיך להציג נתונים ישנים בלי סימן.
      else if (modeRef.current === 'live') setStale(true);
      throw e;
    }
  }, [load, dropSession]);

  // הפעלה 141: טעינה שנכשלת אחרי שהשרת ענה ל-/health (או כשיש כניסה שמורה והשרת לא עונה) נפלה למוק בשקט,
  // ובעל עסק מחובר ראה לקוחות וסכומים בדויים כאילו הם שלו. עכשיו: מצב error עם «נסו שוב». מוק = רק כשאין שרת ואין כניסה.
  const gen = useRef(0);
  const connect = useCallback(async () => {
    const my = ++gen.current;
    const set = (m: Mode) => { if (gen.current === my) setMode(m); };
    set('loading');
    const h = await detectBackend();
    if (gen.current !== my) return;
    const tok = readToken(sessionStore());
    if (!h) { set(tok ? 'error' : 'mock'); return; }
    setHealth(h);
    if (!tok) { set('locked'); return; } // אין קוד ⇒ ישר לשער, בלי בקשות שנועדו להיכשל
    try {
      await reload();
      setBusiness(b => ({ ...b, smsProvider: (['019', 'inforu'].includes(h.sms_provider) ? h.sms_provider : b.smsProvider) as Business['smsProvider'] }));
      set('live');
    } catch (e) { set(e instanceof AuthError ? 'locked' : 'error'); }
  }, [reload]);
  useEffect(() => {
    void connect();
    return () => { gen.current++; };
  }, [connect]);

  const value = useMemo<Ctx>(() => {
    const live = mode === 'live';
    const customerOf = (id: string) => customers.find(c => c.id === id)!;
    return {
      mode, health, today, business, setBusiness, customers, invoices, totals, series, outbox,
      unlock: async (token: string) => {
        try { sessionStorage.setItem(TOKEN_KEY, token.trim()); } catch { /* פרטי/חסום */ }
        try { await reload(); setAuthNote(null); setMode('live'); return 'ok'; } catch (e) {
          try { sessionStorage.removeItem(TOKEN_KEY); } catch { /* */ }   // קוד שלא אומת לא נשאר בלשונית
          // הפעלה 142: רק 401 הוא «קוד שגוי». 5xx/רשת ⇒ הקוד לא נבדק בכלל, ואסור לומר למשתמש שהוא שגוי.
          return e instanceof AuthError ? 'bad' : 'down';
        }
      },
      login: async (email: string, password: string, code: string) => {
        let tok: string;
        try { tok = await loginRequest(email, password, code); } catch (e) { return e instanceof Error ? e.message : 'הכניסה נכשלה'; }
        try { sessionStorage.setItem(TOKEN_KEY, tok); } catch { /* פרטי/חסום */ }
        try { await reload(); setAuthNote(null); setMode('live'); return null; } catch { return 'הכניסה הצליחה אך הטעינה נכשלה. נסו לרענן'; }
      },
      logout: async () => {
        await logoutRequest();
        dropSession(null);
        showToast('יצאת מהמערכת. הסשן בוטל גם בשרת');
      },
      me, authNote, stale, plans, drafts, notices, reload, toast, showToast, customerOf, retry: connect,
      // התור של המוק מוצג רק במצב מוק (לא בזמן טעינה/שגיאה — אחרת התג בניווט מציג ספירה בדויה)
      queue: live ? invoices.filter(i => pendingBy.has(i.id)) : mode === 'mock' ? needsReminder(invoices, today) : [],
      pendingOf: id => pendingBy.get(id),
      mergedAnchorOf: id => { const a = mergedBy.get(id); return a ? invoices.find(i => i.id === a) : undefined; },
      approveAndSend: async (id, step, channels, opts) => {
        if (live) {
          const p = pendingBy.get(id);
          if (!p) throw new Error('אין תזכורת שממתינה לאישור לחשבונית הזו');
          await api.approve(p.reminderId, !!opts?.confirmOpen, !!opts?.confirmAmount);
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
  }, [mode, health, today, business, customers, invoices, pendingBy, mergedBy, totals, series, outbox, plans, drafts, notices, reload, toast, showToast, me, authNote, stale, dropSession, connect]);
  return <C.Provider value={value}>{children}</C.Provider>;
}
export const useApp = () => {
  const v = useContext(C);
  if (!v) throw new Error('useApp מחוץ ל-AppProvider');
  return v;
};
