/**
 * קופה רושמת — קבלת מזומן: בוחרים מטבעות ושטרות לפי מה שהתקבל, המערכת מחשבת
 * "עודף להחזיר" / "חסר לתשלום", ומפיקה חשבונית (מס׳ רץ · לקוח · סכום · התקבל ·
 * עודף · שולם ✓). "סכום מדויק" ממלא בדיוק את הסכום לתשלום; "נקה" מאפס.
 *
 * עצמאי לחלוטין: החשבוניות נשמרות ב-localStorage ייעודי (maor_cashbox_receipts)
 * ומונה החשבוניות ב-maor_cashbox_seq — לא נוגע בסכמת ה-db ולא ברשומות הקיימות.
 * סכום התחלתי אופציונלי נמשך מ-sessionStorage (maor_cashbox_amount) — כך
 * "גבה תשלום" בטיימר-הכסף פותח את הקופה עם הסכום מוכן; שם לקוח ממולא
 * נמשך מ-maor_cashbox_client (SHOP5 — "💵 גבייה בקופה" ממודאל המימוש;
 * הקופה נשארת כלי ספירה נפרד — האמת הכספית במימושים+S-).
 *
 * גייט: core.cashbox. השם ניתן לתיוג דרך nav.cashbox.
 */
import { useMemo, useState, type Dispatch, type SetStateAction } from 'react';
import { useApp } from '../../store/useApp';
import { termOf } from '../../lib/config';
import { guardExport } from '../../lib/exportGate';
import { Btn, Modal, TextInput } from '../ui';
// מפתחות הקופה ממורחבי-שמות פר-ארגון (CONNECT חיבור 7 — חלק מבאג ידוע 3)
import { nsLsKey } from '../../store/persist';
// גל-1/2: מנוע פירוט-עודף + צבעי-מטבע + מתמטיקת-משמרת (טהור, נבדק ביחידה)
import { BILL_VALS, COIN_VALS, cashSuggestions, changeBreakdown, countsTotal, denomTint, drawerDiff, expectedDrawer, filterCashSuggest, payerSuggestions } from './cashLib';

const LS_RECEIPTS = 'maor_cashbox_receipts';
const LS_SEQ = 'maor_cashbox_seq';
const SS_AMOUNT = 'maor_cashbox_amount';
const SS_CLIENT = 'maor_cashbox_client';
// גל-2: משמרת פעילה + יומן-סגירות (Z), פר-ארגון (nsLsKey)
const LS_SHIFT = 'maor_cashbox_shift';
const LS_SHIFT_LOG = 'maor_cashbox_shifts';

/** מטבעות ושטרות בש"ח (ILS) — מקור-אמת יחיד ב-cashLib. */
const COINS = [...COIN_VALS].sort((a, b) => a - b);
const BILLS = [...BILL_VALS].sort((a, b) => a - b);

interface CartItem {
  name: string;
  amount: number;
}
interface Receipt {
  num: number;
  at: string;
  client: string;
  due: number;
  received: number;
  change: number;
  /** עגלת-פריטים (על מה שילמו) — אופציונלי; חסר = תשלום-סכום בלבד. */
  items?: CartItem[];
}

function readReceipts(): Receipt[] {
  try {
    const raw = localStorage.getItem(nsLsKey(LS_RECEIPTS));
    return raw ? (JSON.parse(raw) as Receipt[]) : [];
  } catch {
    return [];
  }
}

function isToday(iso: string): boolean {
  return iso.slice(0, 10) === new Date().toISOString().slice(0, 10);
}

/* ───────── משמרת / סגירת-קופה (גל-2) ───────── */
interface Shift {
  openedAt: string;
  /** סך-המזומן בפתיחה (סכום ספירת-הפתיחה לפי סוג). */
  float: number;
  /** סך-הצ'קים בפתיחה (₪). */
  checks?: number;
  /** אמצעי-תשלום אחר בפתיחה (כרטיס/אשראי וכו', ₪). */
  other?: number;
}
interface ShiftClose {
  closedAt: string;
  openedAt: string;
  float: number;
  sales: number;
  count: number;
  counted: number;
  diff: number;
  /** צ'קים בפתיחה ובסגירה (₪) — לתיעוד (לא-מזומן). */
  openChecks?: number;
  closeChecks?: number;
  openOther?: number;
  closeOther?: number;
}

function readShift(): Shift | null {
  try {
    const raw = localStorage.getItem(nsLsKey(LS_SHIFT));
    return raw ? (JSON.parse(raw) as Shift) : null;
  } catch {
    return null;
  }
}
function writeShift(s: Shift | null): void {
  try {
    if (s) localStorage.setItem(nsLsKey(LS_SHIFT), JSON.stringify(s));
    else localStorage.removeItem(nsLsKey(LS_SHIFT));
  } catch {
    /* חסום */
  }
}
function appendShiftClose(z: ShiftClose): void {
  try {
    const raw = localStorage.getItem(nsLsKey(LS_SHIFT_LOG));
    const arr = raw ? (JSON.parse(raw) as ShiftClose[]) : [];
    localStorage.setItem(nsLsKey(LS_SHIFT_LOG), JSON.stringify([z, ...arr].slice(0, 100)));
  } catch {
    /* חסום */
  }
}
/** גבייה מאז פתיחת-המשמרת: כל חשבונית שהופקה מאז openedAt (net = due). */
function salesSince(openedAt: string): { sales: number; count: number } {
  const rows = readReceipts().filter((r) => r.at >= openedAt);
  return { sales: Math.round(rows.reduce((a, r) => a + r.due, 0) * 100) / 100, count: rows.length };
}

function nextReceiptNum(): number {
  try {
    const n = Number(localStorage.getItem(nsLsKey(LS_SEQ)) || '0') + 1;
    localStorage.setItem(nsLsKey(LS_SEQ), String(n));
    return n;
  } catch {
    return 1;
  }
}

function saveReceipt(r: Receipt): void {
  try {
    const raw = localStorage.getItem(nsLsKey(LS_RECEIPTS));
    const arr = raw ? (JSON.parse(raw) as Receipt[]) : [];
    localStorage.setItem(nsLsKey(LS_RECEIPTS), JSON.stringify([r, ...arr].slice(0, 200)));
  } catch {
    /* localStorage חסום */
  }
}

function money(n: number): string {
  return '₪' + (Math.round(n * 100) / 100).toLocaleString('he-IL');
}

/** רצועת "אילו שטרות/מטבעות להחזיר" — פירוט-העודף (גל-1, בקשת-בעלים). */
function ChangeChips({ amount }: { amount: number }) {
  const parts = changeBreakdown(amount);
  if (!parts.length) return null;
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, marginTop: 4 }}>
      {parts.map((p) => {
        const t = denomTint(p.denom);
        return (
          <span
            key={p.denom}
            style={{
              direction: 'ltr',
              fontSize: 12.5,
              fontWeight: 800,
              padding: '3px 9px',
              borderRadius: 999,
              background: t.bg,
              color: t.ink,
              border: '1px solid var(--line)',
            }}
          >
            ₪{p.denom} ×{p.count}
          </span>
        );
      })}
    </div>
  );
}

/** סכומים-מהירים למילוי הסכום-לתשלום. */
const QUICK_DUE = [10, 20, 50, 100, 200];

/** שדות אמצעי-תשלום לא-מזומן (צ'קים / אחר) — פתיחה וסגירה. */
function TenderFields(props: {
  checks: string;
  other: string;
  onChecks: (v: string) => void;
  onOther: (v: string) => void;
}) {
  return (
    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', margin: '4px 0 8px' }}>
      <label style={{ flex: 1, minWidth: 120, fontSize: 12.5, color: 'var(--ink-soft)' }}>
        🧾 צ'קים (₪)
        <TextInput type="number" dir="ltr" value={props.checks} onChange={props.onChecks} placeholder="0" />
      </label>
      <label style={{ flex: 1, minWidth: 120, fontSize: 12.5, color: 'var(--ink-soft)' }}>
        💳 אחר (₪)
        <TextInput type="number" dir="ltr" value={props.other} onChange={props.onOther} placeholder="0" />
      </label>
    </div>
  );
}

/** לוח-הקשה של מטבעות/שטרות — משותף לקבלת-תשלום ולספירת-מגירה (גל-2). */
function DenomPad({ counts, onBump }: { counts: Record<string, number>; onBump: (d: number, by: number) => void }) {
  return (
    <>
      {[
        { title: 'מטבעות', vals: COINS },
        { title: 'שטרות', vals: BILLS },
      ].map((grp) => (
        <div key={grp.title} style={{ marginBottom: 10 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--ink-faint)', marginBottom: 4 }}>{grp.title}</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {grp.vals.map((d) => {
              const n = counts[String(d)] || 0;
              const t = denomTint(d);
              return (
                <button
                  key={d}
                  type="button"
                  onClick={() => onBump(d, 1)}
                  onContextMenu={(e) => {
                    e.preventDefault();
                    onBump(d, -1);
                  }}
                  title="לחיצה = +1 · לחיצה ימנית = −1"
                  style={{
                    minWidth: 58,
                    padding: '8px 10px',
                    borderRadius: 10,
                    border: '2px solid ' + (n > 0 ? 'var(--accent-deep, var(--accent))' : t.bg),
                    background: t.bg,
                    color: t.ink,
                    fontWeight: 800,
                    cursor: 'pointer',
                    direction: 'ltr',
                    boxShadow: n > 0 ? '0 0 0 2px var(--accent)' : undefined,
                  }}
                >
                  ₪{d}
                  {n > 0 && <span style={{ fontSize: 11 }}> ×{n}</span>}
                </button>
              );
            })}
          </div>
        </div>
      ))}
    </>
  );
}

export function CashRegister({ onClose }: { onClose: () => void }) {
  const config = useApp((s) => s.config);
  const toast = useApp((s) => s.toast);
  const db = useApp((s) => s.db);
  const label = termOf(config, 'nav.cashbox', 'קופה רושמת');

  // סכום התחלתי מהטיימר (אם הגיע דרך "גבה תשלום").
  const prefill = useMemo(() => {
    try {
      const v = sessionStorage.getItem(nsLsKey(SS_AMOUNT));
      if (v) {
        sessionStorage.removeItem(nsLsKey(SS_AMOUNT));
        return v;
      }
    } catch {
      /* חסום */
    }
    return '';
  }, []);

  // שם לקוח ממולא (מהמימוש בחנות) — אותו דפוס כמו הסכום
  const prefillClient = useMemo(() => {
    try {
      const v = sessionStorage.getItem(nsLsKey(SS_CLIENT));
      if (v) {
        sessionStorage.removeItem(nsLsKey(SS_CLIENT));
        return v;
      }
    } catch {
      /* חסום */
    }
    return '';
  }, []);

  const [due, setDue] = useState(prefill);
  const [client, setClient] = useState(prefillClient);
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [receipt, setReceipt] = useState<Receipt | null>(null);
  const [showHistory, setShowHistory] = useState(false);
  // עגלת-פריטים (בקשת-בעלים "עגלה על מה הוא משלם"): הסכום נבנה משורות מוצר+מחיר
  const [cart, setCart] = useState<CartItem[]>([]);
  const [itemName, setItemName] = useState('');
  const [itemAmt, setItemAmt] = useState('');
  // 🛒 הקלדה-חכמה (17.8): הצעות דברים-קיימים (חוגים). suppress=הוסתר אחרי בחירה.
  const [suppressSug, setSuppressSug] = useState(false);
  const suggestions = useMemo(() => cashSuggestions(db.courses), [db.courses]);
  const sugMatches = useMemo(() => (suppressSug ? [] : filterCashSuggest(suggestions, itemName)), [suggestions, itemName, suppressSug]);
  // 🧑 הקלדה-חכמה ל"על מי" (18.8): הצעות משפחות/תורמים קיימים. בחירה ממלאת שם-לקוח.
  const [suppressPayer, setSuppressPayer] = useState(!!prefillClient);
  const payerSug = useMemo(() => payerSuggestions(db.families, db.supporters), [db.families, db.supporters]);
  const payerMatches = useMemo(() => (suppressPayer ? [] : filterCashSuggest(payerSug, client)), [payerSug, client, suppressPayer]);
  // גל-2: משמרת / סגירת-קופה
  const [shift, setShift] = useState<Shift | null>(() => readShift());
  const [shiftPanel, setShiftPanel] = useState(false);
  const [closing, setClosing] = useState(false);
  // פתיחת-משמרת לפי-סוג: ספירת-מזומן (openCounts) + צ'קים + אחר
  const [openCounts, setOpenCounts] = useState<Record<string, number>>({});
  const [openChecks, setOpenChecks] = useState('');
  const [openOther, setOpenOther] = useState('');
  const [drawerCounts, setDrawerCounts] = useState<Record<string, number>>({});
  const [closeChecks, setCloseChecks] = useState('');
  const [closeOther, setCloseOther] = useState('');
  const [zReport, setZReport] = useState<ShiftClose | null>(null);

  const mkBump = (setter: Dispatch<SetStateAction<Record<string, number>>>) => (d: number, by: number) =>
    setter((c) => {
      const n = Math.max(0, (c[String(d)] || 0) + by);
      const next = { ...c };
      if (n === 0) delete next[String(d)];
      else next[String(d)] = n;
      return next;
    });
  const bumpDrawer = mkBump(setDrawerCounts);
  const bumpOpen = mkBump(setOpenCounts);

  function openShift() {
    const f = countsTotal(openCounts);
    const s: Shift = {
      openedAt: new Date().toISOString(),
      float: f,
      ...(Number(openChecks) > 0 ? { checks: Math.round(Number(openChecks) * 100) / 100 } : {}),
      ...(Number(openOther) > 0 ? { other: Math.round(Number(openOther) * 100) / 100 } : {}),
    };
    writeShift(s);
    setShift(s);
    setOpenCounts({});
    setOpenChecks('');
    setOpenOther('');
    toast('משמרת נפתחה · קופת-פתיחה ' + money(f));
  }

  function doClose() {
    if (!shift) return;
    const counted = countsTotal(drawerCounts);
    const { sales, count } = salesSince(shift.openedAt);
    const expected = expectedDrawer(shift.float, sales);
    const z: ShiftClose = {
      closedAt: new Date().toISOString(),
      openedAt: shift.openedAt,
      float: shift.float,
      sales,
      count,
      counted,
      diff: drawerDiff(counted, expected),
      ...(shift.checks ? { openChecks: shift.checks } : {}),
      ...(shift.other ? { openOther: shift.other } : {}),
      ...(Number(closeChecks) > 0 ? { closeChecks: Math.round(Number(closeChecks) * 100) / 100 } : {}),
      ...(Number(closeOther) > 0 ? { closeOther: Math.round(Number(closeOther) * 100) / 100 } : {}),
    };
    appendShiftClose(z);
    writeShift(null);
    setShift(null);
    setDrawerCounts({});
    setClosing(false);
    setShiftPanel(false);
    setZReport(z);
    toast('הקופה נסגרה · דוח-Z הופק');
  }

  // עגלה פעילה ⇒ הסכום-לתשלום נבנה מהפריטים; אחרת השדה הידני.
  const cartTotal = useMemo(() => Math.round(cart.reduce((a, it) => a + it.amount, 0) * 100) / 100, [cart]);
  const dueNum = cart.length ? cartTotal : Math.max(0, Number(due) || 0);
  const received = useMemo(
    () => Object.entries(counts).reduce((a, [d, n]) => a + Number(d) * n, 0),
    [counts],
  );
  const diff = Math.round((received - dueNum) * 100) / 100;

  const addItem = () => {
    const amt = Math.round((Number(itemAmt) || 0) * 100) / 100;
    if (amt <= 0) {
      toast('הזינו מחיר לפריט');
      return;
    }
    setCart((c) => [...c, { name: itemName.trim() || 'פריט', amount: amt }]);
    setItemName('');
    setItemAmt('');
  };
  const removeItem = (i: number) => setCart((c) => c.filter((_, idx) => idx !== i));

  const bump = (d: number, by: number) =>
    setCounts((c) => {
      const n = Math.max(0, (c[String(d)] || 0) + by);
      const next = { ...c };
      if (n === 0) delete next[String(d)];
      else next[String(d)] = n;
      return next;
    });

  const exact = () => {
    // ממלא בשטרות/מטבעות הגדולים ביותר עד הסכום המדויק (חמדני).
    let rem = Math.round(dueNum * 100);
    const next: Record<string, number> = {};
    for (const d of [...BILLS, ...COINS].sort((a, b) => b - a)) {
      const cents = Math.round(d * 100);
      const n = Math.floor(rem / cents);
      if (n > 0) {
        next[String(d)] = n;
        rem -= n * cents;
      }
    }
    setCounts(next);
  };

  function finish() {
    if (dueNum <= 0) {
      toast('הזינו סכום לתשלום');
      return;
    }
    if (received < dueNum) {
      toast('חסר לתשלום ' + money(dueNum - received));
      return;
    }
    const r: Receipt = {
      num: nextReceiptNum(),
      at: new Date().toISOString(),
      client: client.trim(),
      due: dueNum,
      received,
      change: diff,
      ...(cart.length ? { items: cart } : {}),
    };
    saveReceipt(r);
    setReceipt(r);
    setCart([]);
    toast('חשבונית ' + r.num + ' הופקה · שולם ✓');
  }

  // גל-2: דוח סגירת-קופה (Z) — לאחר ספירת-המגירה.
  if (zReport) {
    const z = zReport;
    const diffLabel = z.diff === 0 ? 'מאוזן ✓' : z.diff > 0 ? 'עודף' : 'חוסר';
    const diffColor = z.diff === 0 ? '#12803c' : z.diff > 0 ? '#9a6414' : '#b91c1c';
    const row = (l: string, v: string, bold?: boolean) => (
      <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: bold ? 800 : 400 }}>
        <span>{l}</span>
        <span style={{ direction: 'ltr' }}>{v}</span>
      </div>
    );
    return (
      <Modal title={'🧾 דוח סגירת-קופה (Z)'} onClose={onClose}>
        <div style={{ border: '1px solid var(--line)', borderRadius: 12, padding: 16, background: 'var(--bg)', fontSize: 14, lineHeight: 1.9 }}>
          <div style={{ fontWeight: 800, fontSize: 16, marginBottom: 8 }}>{config.orgName || label}</div>
          {row('נפתחה', new Date(z.openedAt).toLocaleString('he-IL'))}
          {row('נסגרה', new Date(z.closedAt).toLocaleString('he-IL'))}
          <div style={{ borderTop: '1px dashed var(--line)', margin: '6px 0', paddingTop: 6 }}>
            {row('קופת-פתיחה (מזומן)', money(z.float))}
            {row(z.count + ' חשבוניות · גבייה', money(z.sales))}
            {row('צפוי במגירה', money(z.float + z.sales), true)}
            {row('נספר בפועל (מזומן)', money(z.counted), true)}
          </div>
          <div style={{ borderTop: '1px dashed var(--line)', marginTop: 6, paddingTop: 6, color: diffColor, fontWeight: 800, display: 'flex', justifyContent: 'space-between' }}>
            <span>{diffLabel} (מזומן)</span>
            <span style={{ direction: 'ltr' }}>{money(Math.abs(z.diff))}</span>
          </div>
          {(z.openChecks || z.closeChecks || z.openOther || z.closeOther) && (
            <div style={{ borderTop: '1px dashed var(--line)', marginTop: 6, paddingTop: 6 }}>
              {(z.openChecks || z.closeChecks) && row("🧾 צ'קים (פתיחה → סגירה)", money(z.openChecks ?? 0) + ' → ' + money(z.closeChecks ?? 0))}
              {(z.openOther || z.closeOther) && row('💳 אחר (פתיחה → סגירה)', money(z.openOther ?? 0) + ' → ' + money(z.closeOther ?? 0))}
            </div>
          )}
        </div>
        <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
          <Btn kind="primary" onClick={() => { if (guardExport()) window.print(); }}>🖨 הדפסה</Btn>
          <Btn onClick={onClose}>סגור</Btn>
        </div>
      </Modal>
    );
  }

  // גל-2: פאנל-המשמרת — פתיחה / מצב / סגירה-בספירה.
  if (shiftPanel) {
    // מצב סגירה: ספירת-המגירה בפועל מול הצפוי.
    if (shift && closing) {
      const counted = countsTotal(drawerCounts);
      const { sales } = salesSince(shift.openedAt);
      const expected = expectedDrawer(shift.float, sales);
      const d = drawerDiff(counted, expected);
      return (
        <Modal title={'🔢 ספירת מגירה — סגירת ' + label} onClose={onClose}>
          <div style={{ fontSize: 12.5, color: 'var(--ink-faint)', marginBottom: 6 }}>
            ספרו את המזומן במגירה — לחיצה על ערך = +1
          </div>
          <DenomPad counts={drawerCounts} onBump={bumpDrawer} />
          <TenderFields checks={closeChecks} other={closeOther} onChecks={setCloseChecks} onOther={setCloseOther} />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4, padding: '10px 12px', borderRadius: 10, background: 'var(--bg)', border: '1px solid var(--line)', margin: '4px 0 12px', fontSize: 14 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>נספר במגירה (מזומן)</span><b style={{ direction: 'ltr' }}>{money(counted)}</b></div>
            <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--ink-soft)' }}><span>צפוי (פתיחה + גבייה)</span><span style={{ direction: 'ltr' }}>{money(expected)}</span></div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 800, color: d === 0 ? '#12803c' : d > 0 ? '#9a6414' : '#b91c1c' }}>
              <span>{d === 0 ? 'מאוזן ✓' : d > 0 ? 'עודף' : 'חוסר'}</span>
              <span style={{ direction: 'ltr' }}>{money(Math.abs(d))}</span>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <Btn kind="primary" onClick={doClose}>סיום וסגירת קופה</Btn>
            <Btn onClick={() => setClosing(false)}>ביטול</Btn>
          </div>
        </Modal>
      );
    }
    // מצב פתוח/סגור: מידע + פתיחה או מעבר-לסגירה.
    const info = shift ? salesSince(shift.openedAt) : { sales: 0, count: 0 };
    return (
      <Modal title={'🗂 משמרת ה' + label} onClose={onClose}>
        {shift ? (
          <>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4, padding: '10px 12px', borderRadius: 10, background: 'var(--bg)', border: '1px solid var(--line)', marginBottom: 12, fontSize: 14 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--ink-soft)' }}><span>נפתחה</span><span style={{ direction: 'ltr' }}>{new Date(shift.openedAt).toLocaleString('he-IL')}</span></div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>קופת-פתיחה (מזומן)</span><span style={{ direction: 'ltr' }}>{money(shift.float)}</span></div>
              {!!shift.checks && <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--ink-soft)' }}><span>🧾 צ'קים בפתיחה</span><span style={{ direction: 'ltr' }}>{money(shift.checks)}</span></div>}
              {!!shift.other && <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--ink-soft)' }}><span>💳 אחר בפתיחה</span><span style={{ direction: 'ltr' }}>{money(shift.other)}</span></div>}
              <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>{info.count} חשבוניות · גבייה</span><span style={{ direction: 'ltr' }}>{money(info.sales)}</span></div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 800, borderTop: '1px dashed var(--line)', marginTop: 4, paddingTop: 4 }}><span>צפוי במגירה</span><b style={{ direction: 'ltr' }}>{money(shift.float + info.sales)}</b></div>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <Btn kind="primary" onClick={() => { setDrawerCounts({}); setClosing(true); }}>סגירת קופה (ספירה)</Btn>
              <Btn onClick={() => setShiftPanel(false)}>← חזרה</Btn>
            </div>
          </>
        ) : (
          <>
            <div style={{ fontSize: 13, color: 'var(--ink-soft)', marginBottom: 8 }}>
              ספרו את המגירה בפתיחה — כמה יש מכל סוג (לחיצה = +1):
            </div>
            <DenomPad counts={openCounts} onBump={bumpOpen} />
            <TenderFields
              checks={openChecks}
              other={openOther}
              onChecks={setOpenChecks}
              onOther={setOpenOther}
            />
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 12px', borderRadius: 10, background: 'var(--bg)', border: '1px solid var(--line)', margin: '4px 0 12px', fontSize: 14, fontWeight: 800 }}>
              <span>סה״כ מזומן בפתיחה</span>
              <b style={{ direction: 'ltr' }}>{money(countsTotal(openCounts))}</b>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <Btn kind="primary" onClick={openShift}>פתיחת משמרת</Btn>
              <Btn onClick={() => setShiftPanel(false)}>← חזרה</Btn>
            </div>
          </>
        )}
      </Modal>
    );
  }

  // גל-1: היסטוריית-חשבוניות — הרשומות נשמרו תמיד, עכשיו יש איפה לראותן.
  if (showHistory) {
    const all = readReceipts();
    const today = all.filter((r) => isToday(r.at));
    const todayTotal = today.reduce((a, r) => a + r.due, 0);
    return (
      <Modal title={'🧾 חשבוניות ה' + label} onClose={onClose}>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            padding: '10px 12px',
            borderRadius: 10,
            background: 'var(--bg)',
            border: '1px solid var(--line)',
            marginBottom: 10,
            fontWeight: 700,
          }}
        >
          <span>היום: {today.length} חשבוניות</span>
          <b style={{ direction: 'ltr' }}>{money(todayTotal)}</b>
        </div>
        {all.length === 0 ? (
          <div style={{ color: 'var(--ink-faint)', padding: '18px 4px', textAlign: 'center' }}>
            עדיין לא הופקו חשבוניות בקופה.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, maxHeight: '52vh', overflowY: 'auto' }}>
            {all.map((r) => (
              <button
                key={r.num + '_' + r.at}
                type="button"
                onClick={() => { setReceipt(r); setShowHistory(false); }}
                title="פתיחה והדפסה חוזרת"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  textAlign: 'start',
                  padding: '9px 12px',
                  borderRadius: 10,
                  border: '1px solid var(--line)',
                  background: 'var(--panel)',
                  cursor: 'pointer',
                }}
              >
                <span style={{ fontWeight: 800, minWidth: 38 }}>#{r.num}</span>
                <span style={{ flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {r.client || '—'}
                  <span style={{ display: 'block', fontSize: 11.5, color: 'var(--ink-faint)' }}>
                    {new Date(r.at).toLocaleString('he-IL')}
                  </span>
                </span>
                <b style={{ direction: 'ltr' }}>{money(r.due)}</b>
              </button>
            ))}
          </div>
        )}
        <div className="modal-actions">
          <Btn onClick={() => setShowHistory(false)}>← חזרה לקופה</Btn>
        </div>
      </Modal>
    );
  }

  // תצוגת חשבונית לאחר סיום
  if (receipt) {
    return (
      <Modal title={'🧾 חשבונית מס׳ ' + receipt.num} onClose={onClose}>
        <div
          style={{
            border: '1px solid var(--line)',
            borderRadius: 12,
            padding: 16,
            background: 'var(--bg)',
            fontSize: 14,
            lineHeight: 1.9,
          }}
        >
          <div style={{ fontWeight: 800, fontSize: 16, marginBottom: 8 }}>{config.orgName || 'חשבונית'}</div>
          {receipt.client && <div>לקוח: {receipt.client}</div>}
          {receipt.items && receipt.items.length > 0 && (
            <div style={{ borderTop: '1px dashed var(--line)', borderBottom: '1px dashed var(--line)', margin: '6px 0', padding: '6px 0' }}>
              {receipt.items.map((it, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                  <span>{it.name}</span>
                  <span style={{ direction: 'ltr' }}>{money(it.amount)}</span>
                </div>
              ))}
            </div>
          )}
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span>סה״כ לתשלום</span>
            <b style={{ direction: 'ltr' }}>{money(receipt.due)}</b>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span>התקבל מזומן</span>
            <span style={{ direction: 'ltr' }}>{money(receipt.received)}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span>עודף</span>
            <span style={{ direction: 'ltr' }}>{money(receipt.change)}</span>
          </div>
          {receipt.change > 0 && (
            <div style={{ marginTop: 2 }}>
              <span style={{ fontSize: 12, color: 'var(--ink-faint)' }}>להחזיר:</span>
              <ChangeChips amount={receipt.change} />
            </div>
          )}
          <div style={{ borderTop: '1px dashed var(--line)', marginTop: 8, paddingTop: 8, color: '#12803c', fontWeight: 800 }}>
            שולם ✓ · {new Date(receipt.at).toLocaleString('he-IL')}
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
          <Btn kind="primary" onClick={() => { if (guardExport()) window.print(); }}>🖨 הדפסה</Btn>
          <Btn onClick={onClose}>סגור</Btn>
        </div>
      </Modal>
    );
  }

  return (
    <Modal title={'💵 ' + label} onClose={onClose}>
      <div className="form-grid" style={{ marginBottom: 12 }}>
        <label style={{ fontSize: 12.5, color: 'var(--ink-soft)' }}>
          סכום לתשלום (₪){cart.length ? ' — מהעגלה' : ''}
          {cart.length ? (
            <div style={{ direction: 'ltr', textAlign: 'left', padding: '8px 10px', borderRadius: 8, border: '1px solid var(--line)', background: 'var(--bg)', fontWeight: 800 }}>
              {money(cartTotal)}
            </div>
          ) : (
            <TextInput type="number" dir="ltr" value={due} onChange={setDue} placeholder="0" />
          )}
        </label>
        <label style={{ fontSize: 12.5, color: 'var(--ink-soft)', position: 'relative' }}>
          {termOf(config, 'entity.family', 'לקוח')} (לא חובה)
          <TextInput
            value={client}
            onChange={(v) => { setClient(v); setSuppressPayer(false); }}
            placeholder="שם — הקלידו לחיפוש משפחה/תורם קיים"
          />
          {payerMatches.length > 0 && (
            <div
              style={{ position: 'absolute', top: '100%', insetInlineStart: 0, insetInlineEnd: 0, zIndex: 20, background: 'var(--panel)', border: '1px solid var(--line)', borderRadius: 8, marginTop: 2, boxShadow: '0 6px 18px rgba(0,0,0,.14)', maxHeight: 210, overflowY: 'auto' }}
            >
              {payerMatches.map((p, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => { setClient(p.name); setSuppressPayer(true); }}
                  style={{ display: 'flex', width: '100%', alignItems: 'center', justifyContent: 'space-between', gap: 8, padding: '7px 10px', border: 'none', borderBottom: i < payerMatches.length - 1 ? '1px solid var(--line)' : 'none', background: 'transparent', cursor: 'pointer', textAlign: 'start', fontSize: 13 }}
                >
                  <span style={{ display: 'flex', gap: 6, alignItems: 'center', minWidth: 0 }}>
                    <span style={{ fontSize: 10.5, color: 'var(--ink-faint)', border: '1px solid var(--line)', borderRadius: 6, padding: '1px 5px', flexShrink: 0 }}>{p.hint}</span>
                    <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.name}</span>
                  </span>
                  {p.sub && <span style={{ direction: 'ltr', fontSize: 11.5, color: 'var(--ink-faint)', flexShrink: 0 }}>{p.sub}</span>}
                </button>
              ))}
            </div>
          )}
        </label>
      </div>

      {/* בקשת-בעלים: עגלה — על מה משלמים (שם + מחיר). ריק ⇒ תשלום-סכום כרגיל. */}
      <div style={{ marginBottom: 12, border: '1px solid var(--line)', borderRadius: 10, padding: '10px 12px', background: 'var(--panel)' }}>
        <div style={{ fontSize: 12.5, fontWeight: 800, color: 'var(--ink-soft)', marginBottom: 6 }}>🛒 עגלה — על מה משלמים (רשות)</div>
        {cart.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginBottom: 8 }}>
            {cart.map((it, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13 }}>
                <span style={{ flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{it.name}</span>
                <span style={{ direction: 'ltr', fontWeight: 700 }}>{money(it.amount)}</span>
                <button type="button" onClick={() => removeItem(i)} title="הסרה" style={{ border: 'none', background: 'transparent', color: '#b91c1c', cursor: 'pointer', fontSize: 15, lineHeight: 1 }}>✕</button>
              </div>
            ))}
            <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px dashed var(--line)', marginTop: 2, paddingTop: 4, fontWeight: 800 }}>
              <span>סה״כ עגלה</span>
              <span style={{ direction: 'ltr' }}>{money(cartTotal)}</span>
            </div>
          </div>
        )}
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          <div style={{ flex: 2, minWidth: 120, position: 'relative' }}>
            <TextInput
              value={itemName}
              onChange={(v) => { setItemName(v); setSuppressSug(false); }}
              placeholder="שם הפריט — הקלידו לחיפוש חוג קיים"
            />
            {sugMatches.length > 0 && (
              <div
                style={{ position: 'absolute', top: '100%', insetInlineStart: 0, insetInlineEnd: 0, zIndex: 20, background: 'var(--panel)', border: '1px solid var(--line)', borderRadius: 8, marginTop: 2, boxShadow: '0 6px 18px rgba(0,0,0,.14)', maxHeight: 210, overflowY: 'auto' }}
              >
                {sugMatches.map((s, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => { setItemName(s.name); if (s.amount > 0) setItemAmt(String(s.amount)); setSuppressSug(true); }}
                    style={{ display: 'flex', width: '100%', alignItems: 'center', justifyContent: 'space-between', gap: 8, padding: '7px 10px', border: 'none', borderBottom: i < sugMatches.length - 1 ? '1px solid var(--line)' : 'none', background: 'transparent', cursor: 'pointer', textAlign: 'start', fontSize: 13 }}
                  >
                    <span style={{ display: 'flex', gap: 6, alignItems: 'center', minWidth: 0 }}>
                      <span style={{ fontSize: 10.5, color: 'var(--ink-faint)', border: '1px solid var(--line)', borderRadius: 6, padding: '1px 5px', flexShrink: 0 }}>{s.hint}</span>
                      <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.name}</span>
                    </span>
                    {s.amount > 0 && <span style={{ direction: 'ltr', fontWeight: 700, flexShrink: 0 }}>{money(s.amount)}</span>}
                  </button>
                ))}
              </div>
            )}
          </div>
          <div style={{ flex: 1, minWidth: 80 }}>
            <TextInput type="number" dir="ltr" value={itemAmt} onChange={setItemAmt} placeholder="₪ מחיר" />
          </div>
          <Btn sm kind="primary" onClick={addItem}>➕ הוסף</Btn>
        </div>
      </div>

      {/* גל-1: סכומים-מהירים למילוי הסכום-לתשלום (מוסתר כשעגלה פעילה) */}
      {!cart.length && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 12 }}>
          {QUICK_DUE.map((q) => (
            <button
              key={q}
              type="button"
              onClick={() => setDue(String((Number(due) || 0) + q))}
              style={{
                direction: 'ltr',
                fontSize: 12.5,
                fontWeight: 700,
                padding: '4px 11px',
                borderRadius: 999,
                border: '1px solid var(--line)',
                background: 'var(--panel)',
                color: 'var(--ink-soft)',
                cursor: 'pointer',
              }}
            >
              +₪{q}
            </button>
          ))}
          <button
            type="button"
            onClick={() => setDue('')}
            title="איפוס הסכום"
            style={{ fontSize: 12.5, fontWeight: 700, padding: '4px 11px', borderRadius: 999, border: '1px solid var(--line)', background: 'var(--panel)', color: 'var(--ink-faint)', cursor: 'pointer' }}
          >
            ⌫ איפוס
          </button>
        </div>
      )}

      <div style={{ fontSize: 12.5, color: 'var(--ink-faint)', marginBottom: 6 }}>
        בחרו מטבעות ושטרות לפי מה שהתקבל
      </div>

      <DenomPad counts={counts} onBump={bump} />

      <div style={{ display: 'flex', gap: 6, margin: '8px 0 12px' }}>
        <Btn sm onClick={exact}>סכום מדויק</Btn>
        <Btn sm onClick={() => setCounts({})}>נקה</Btn>
      </div>

      {/* סיכום */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 4,
          padding: '10px 12px',
          borderRadius: 10,
          background: 'var(--bg)',
          border: '1px solid var(--line)',
          marginBottom: 12,
          fontSize: 14,
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span>התקבל</span>
          <b style={{ direction: 'ltr' }}>{money(received)}</b>
        </div>
        {diff >= 0 ? (
          <>
            <div style={{ display: 'flex', justifyContent: 'space-between', color: '#12803c', fontWeight: 700 }}>
              <span>עודף להחזיר</span>
              <span style={{ direction: 'ltr' }}>{money(diff)}</span>
            </div>
            {diff > 0 && <ChangeChips amount={diff} />}
          </>
        ) : (
          <div style={{ display: 'flex', justifyContent: 'space-between', color: '#b91c1c', fontWeight: 700 }}>
            <span>חסר לתשלום</span>
            <span style={{ direction: 'ltr' }}>{money(-diff)}</span>
          </div>
        )}
      </div>

      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        <Btn kind="primary" onClick={finish} disabled={dueNum <= 0 || received < dueNum}>
          סיום והפקת חשבונית
        </Btn>
        <Btn onClick={() => setShowHistory(true)}>🧾 חשבוניות</Btn>
        <Btn onClick={() => setShiftPanel(true)} title="פתיחה/סגירה של משמרת + דוח-Z">
          {shift ? '🗂 משמרת פעילה' : '🗂 משמרת'}
        </Btn>
        <Btn onClick={onClose}>ביטול</Btn>
      </div>
    </Modal>
  );
}
