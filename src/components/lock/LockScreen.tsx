/**
 * מסך נעילה — מקלדת ספרות להזנת קוד. משמש גם לנעילה הראשית (כניסה לכל
 * המערכת) וגם למשנית (אזור מוגן/מנהל). מאמת מול הגיבוב השמור במכשיר (store.lock)
 * וקורא ל-onUnlock בהצלחה. "שכחתי קוד" מאפס מקומית בלי לאבד נתונים.
 */
import { useEffect, useState, type CSSProperties } from 'react';
import { useApp } from '../../store/useApp';
import { verifyPin } from '../../lib/lock';

/** השהיה גדֵלה אחרי כשלונות (הגבלת-קצב מול ניחוש-המוני): 3→5ש׳, 4→15ש׳, 5+→30ש׳. */
export function cooldownFor(fails: number): number {
  return fails >= 5 ? 30000 : fails >= 4 ? 15000 : fails >= 3 ? 5000 : 0;
}

const KEYS = ['1', '2', '3', '4', '5', '6', '7', '8', '9'];

export function LockScreen({
  kind,
  onUnlock,
}: {
  kind: 'primary' | 'secondary';
  onUnlock: () => void;
}) {
  const hash = useApp((s) => s.lock[kind]);
  const clearLock = useApp((s) => s.clearLock);
  const config = useApp((s) => s.config);
  const dbOrgName = useApp((s) => s.db.orgName);
  const orgName = config.orgName || dbOrgName;

  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  // הגבלת-קצב: מונה כשלונות + חותמת-סיום להשהיה, עם ספירה-לאחור חיה
  const [fails, setFails] = useState(0);
  const [until, setUntil] = useState(0);
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (until <= now) return;
    const t = setInterval(() => setNow(Date.now()), 250);
    return () => clearInterval(t);
  }, [until, now]);
  const remainMs = Math.max(0, until - now);
  const cooling = remainMs > 0;

  const primary = kind === 'primary';

  const press = (d: string) => {
    if (busy || cooling || pin.length >= 8) return;
    setError('');
    setPin((p) => p + d);
  };
  const back = () => {
    setError('');
    setPin((p) => p.slice(0, -1));
  };

  const forgot = () => {
    const msg = primary
      ? 'לאפס את קוד הכניסה? הקוד יימחק מהמכשיר הזה והמערכת תיפתח. הנתונים יישארו — רק הנעילה תבוטל.'
      : 'לאפס את קוד המנהל? כל קודי הנעילה יימחקו מהמכשיר הזה. הנתונים יישארו.';
    if (window.confirm(msg)) {
      clearLock();
      onUnlock();
    }
  };

  const submit = async () => {
    if (busy) return;
    if (cooling) {
      setError(`יותר מדי ניסיונות — המתינו ${Math.ceil(remainMs / 1000)} שניות`);
      return;
    }
    if (pin.length < 4) {
      setError('הקוד הוא 4–8 ספרות');
      return;
    }
    setBusy(true);
    const ok = await verifyPin(pin, hash);
    setBusy(false);
    if (ok) {
      setFails(0);
      setUntil(0);
      onUnlock();
    } else {
      const nf = fails + 1;
      setFails(nf);
      const cd = cooldownFor(nf);
      if (cd) {
        setUntil(Date.now() + cd);
        setNow(Date.now());
        setError(`יותר מדי ניסיונות — המתינו ${Math.ceil(cd / 1000)} שניות`);
      } else {
        setError('קוד שגוי — נסו שוב');
      }
      setPin('');
    }
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'var(--bg)',
        padding: 16,
      }}
    >
      <div className="card" style={{ width: 'min(340px, 94vw)', padding: 24, textAlign: 'center' }}>
        {primary && config.logoDataUri && (
          <img src={config.logoDataUri} alt="" style={{ height: 48, borderRadius: 10, marginBottom: 8 }} />
        )}
        <div style={{ fontSize: 34, marginBottom: 4 }} aria-hidden>
          {primary ? '🔒' : '🔐'}
        </div>
        <h1 style={{ fontSize: 20, fontWeight: 700, color: 'var(--ink)' }}>
          {primary ? orgName : 'אזור מוגן'}
        </h1>
        <p style={{ fontSize: 13, color: 'var(--ink-faint)', margin: '4px 0 16px' }}>
          {primary ? 'הזינו את קוד הכניסה' : 'הזינו את קוד המנהל כדי להמשיך'}
        </p>

        {/* חיווי אורך הקוד — נקודות */}
        <div
          style={{ display: 'flex', justifyContent: 'center', gap: 10, minHeight: 18, marginBottom: 14 }}
          aria-label={`הוזנו ${pin.length} ספרות`}
        >
          {Array.from({ length: Math.max(4, pin.length) }).map((_, i) => (
            <span
              key={i}
              style={{
                width: 12,
                height: 12,
                borderRadius: '50%',
                background: i < pin.length ? 'var(--accent-deep)' : 'var(--line)',
              }}
            />
          ))}
        </div>

        {(error || cooling) && (
          // 🐛 נחיל-9×9 (13.8): role=alert — שגיאת-PIN/צינון תוכרז לקורא-מסך (עקבי עם מסך-ההצפנה)
          <p role="alert" style={{ color: 'var(--red)', fontSize: 13, fontWeight: 600, marginBottom: 10 }}>
            {cooling ? `יותר מדי ניסיונות — המתינו ${Math.ceil(remainMs / 1000)} שניות` : error}
          </p>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, opacity: cooling ? 0.5 : 1 }}>
          {KEYS.map((k) => (
            <button key={k} type="button" className="btn" onClick={() => press(k)} disabled={cooling} style={keyStyle}>
              {k}
            </button>
          ))}
          <button type="button" className="btn" onClick={back} disabled={cooling} style={keyStyle} aria-label="מחיקה">
            ⌫
          </button>
          <button type="button" className="btn" onClick={() => press('0')} disabled={cooling} style={keyStyle}>
            0
          </button>
          <button
            type="button"
            className="btn"
            onClick={() => void submit()}
            disabled={busy || cooling}
            style={{ ...keyStyle, background: 'var(--accent-deep)', color: 'var(--dark)', fontWeight: 700 }}
            aria-label="אישור"
          >
            ✓
          </button>
        </div>

        <button
          type="button"
          onClick={forgot}
          style={{
            background: 'none',
            border: 'none',
            color: 'var(--ink-faint)',
            fontSize: 12.5,
            textDecoration: 'underline',
            cursor: 'pointer',
            marginTop: 14,
            padding: 4,
          }}
        >
          שכחתי את הקוד
        </button>
      </div>
    </div>
  );
}

const keyStyle: CSSProperties = {
  fontSize: 20,
  padding: '14px 0',
  minWidth: 0,
  justifyContent: 'center',
};
