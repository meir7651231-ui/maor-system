/**
 * קופה רושמת — קבלת מזומן: בוחרים מטבעות ושטרות לפי מה שהתקבל, המערכת מחשבת
 * "עודף להחזיר" / "חסר לתשלום", ומפיקה חשבונית (מס׳ רץ · לקוח · סכום · התקבל ·
 * עודף · שולם ✓). "סכום מדויק" ממלא בדיוק את הסכום לתשלום; "נקה" מאפס.
 *
 * עצמאי לחלוטין: החשבוניות נשמרות ב-localStorage ייעודי (maor_cashbox_receipts)
 * ומונה החשבוניות ב-maor_cashbox_seq — לא נוגע בסכמת ה-db ולא ברשומות הקיימות.
 * סכום התחלתי אופציונלי נמשך מ-sessionStorage (maor_cashbox_amount) — כך
 * "גבה תשלום" בטיימר-הכסף פותח את הקופה עם הסכום מוכן.
 *
 * גייט: core.cashbox. השם ניתן לתיוג דרך nav.cashbox.
 */
import { useMemo, useState } from 'react';
import { useApp } from '../../store/useApp';
import { termOf } from '../../lib/config';
import { Btn, Modal, TextInput } from '../ui';

const LS_RECEIPTS = 'maor_cashbox_receipts';
const LS_SEQ = 'maor_cashbox_seq';
const SS_AMOUNT = 'maor_cashbox_amount';

/** מטבעות ושטרות בש"ח (ILS). */
const COINS = [0.1, 0.5, 1, 2, 5, 10];
const BILLS = [20, 50, 100, 200];

interface Receipt {
  num: number;
  at: string;
  client: string;
  due: number;
  received: number;
  change: number;
}

function nextReceiptNum(): number {
  try {
    const n = Number(localStorage.getItem(LS_SEQ) || '0') + 1;
    localStorage.setItem(LS_SEQ, String(n));
    return n;
  } catch {
    return 1;
  }
}

function saveReceipt(r: Receipt): void {
  try {
    const raw = localStorage.getItem(LS_RECEIPTS);
    const arr = raw ? (JSON.parse(raw) as Receipt[]) : [];
    localStorage.setItem(LS_RECEIPTS, JSON.stringify([r, ...arr].slice(0, 200)));
  } catch {
    /* localStorage חסום */
  }
}

function money(n: number): string {
  return '₪' + (Math.round(n * 100) / 100).toLocaleString('he-IL');
}

export function CashRegister({ onClose }: { onClose: () => void }) {
  const config = useApp((s) => s.config);
  const toast = useApp((s) => s.toast);
  const label = termOf(config, 'nav.cashbox', 'קופה רושמת');

  // סכום התחלתי מהטיימר (אם הגיע דרך "גבה תשלום").
  const prefill = useMemo(() => {
    try {
      const v = sessionStorage.getItem(SS_AMOUNT);
      if (v) {
        sessionStorage.removeItem(SS_AMOUNT);
        return v;
      }
    } catch {
      /* חסום */
    }
    return '';
  }, []);

  const [due, setDue] = useState(prefill);
  const [client, setClient] = useState('');
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [receipt, setReceipt] = useState<Receipt | null>(null);

  const dueNum = Math.max(0, Number(due) || 0);
  const received = useMemo(
    () => Object.entries(counts).reduce((a, [d, n]) => a + Number(d) * n, 0),
    [counts],
  );
  const diff = Math.round((received - dueNum) * 100) / 100;

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
    };
    saveReceipt(r);
    setReceipt(r);
    toast('חשבונית ' + r.num + ' הופקה · שולם ✓');
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
          <div style={{ borderTop: '1px dashed var(--line)', marginTop: 8, paddingTop: 8, color: '#12803c', fontWeight: 800 }}>
            שולם ✓ · {new Date(receipt.at).toLocaleString('he-IL')}
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
          <Btn kind="primary" onClick={() => window.print()}>🖨 הדפסה</Btn>
          <Btn onClick={onClose}>סגור</Btn>
        </div>
      </Modal>
    );
  }

  return (
    <Modal title={'💵 ' + label} onClose={onClose}>
      <div className="form-grid" style={{ marginBottom: 12 }}>
        <label style={{ fontSize: 12.5, color: 'var(--ink-soft)' }}>
          סכום לתשלום (₪)
          <TextInput type="number" dir="ltr" value={due} onChange={setDue} placeholder="0" />
        </label>
        <label style={{ fontSize: 12.5, color: 'var(--ink-soft)' }}>
          {termOf(config, 'entity.family', 'לקוח')} (לא חובה)
          <TextInput value={client} onChange={setClient} placeholder="שם" />
        </label>
      </div>

      <div style={{ fontSize: 12.5, color: 'var(--ink-faint)', marginBottom: 6 }}>
        בחרו מטבעות ושטרות לפי מה שהתקבל
      </div>

      {[
        { title: 'מטבעות', vals: COINS },
        { title: 'שטרות', vals: BILLS },
      ].map((grp) => (
        <div key={grp.title} style={{ marginBottom: 10 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--ink-faint)', marginBottom: 4 }}>{grp.title}</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {grp.vals.map((d) => {
              const n = counts[String(d)] || 0;
              return (
                <button
                  key={d}
                  type="button"
                  onClick={() => bump(d, 1)}
                  onContextMenu={(e) => {
                    e.preventDefault();
                    bump(d, -1);
                  }}
                  title="לחיצה = +1 · לחיצה ימנית = −1"
                  style={{
                    minWidth: 58,
                    padding: '8px 10px',
                    borderRadius: 10,
                    border: '1px solid ' + (n > 0 ? 'var(--accent)' : 'var(--line)'),
                    background: n > 0 ? 'var(--accent)' : 'var(--panel)',
                    color: n > 0 ? 'var(--dark)' : 'var(--ink)',
                    fontWeight: 700,
                    cursor: 'pointer',
                    direction: 'ltr',
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
          <div style={{ display: 'flex', justifyContent: 'space-between', color: '#12803c', fontWeight: 700 }}>
            <span>עודף להחזיר</span>
            <span style={{ direction: 'ltr' }}>{money(diff)}</span>
          </div>
        ) : (
          <div style={{ display: 'flex', justifyContent: 'space-between', color: '#b91c1c', fontWeight: 700 }}>
            <span>חסר לתשלום</span>
            <span style={{ direction: 'ltr' }}>{money(-diff)}</span>
          </div>
        )}
      </div>

      <div style={{ display: 'flex', gap: 8 }}>
        <Btn kind="primary" onClick={finish} disabled={dueNum <= 0 || received < dueNum}>
          סיום והפקת חשבונית
        </Btn>
        <Btn onClick={onClose}>ביטול</Btn>
      </div>
    </Modal>
  );
}
