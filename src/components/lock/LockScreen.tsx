/**
 * מסך נעילה — מקלדת ספרות להזנת קוד. משמש גם לנעילה הראשית (כניסה לכל
 * המערכת) וגם למשנית (אזור מוגן/מנהל). מאמת מול הגיבוב השמור ב-db.security
 * וקורא ל-onUnlock בהצלחה. אין דלף של הקוד — רק אימות גיבוב.
 */
import { useState, type CSSProperties } from 'react';
import { useApp } from '../../store/useApp';
import { verifyPin } from '../../lib/lock';

const KEYS = ['1', '2', '3', '4', '5', '6', '7', '8', '9'];

export function LockScreen({
  kind,
  onUnlock,
}: {
  kind: 'primary' | 'secondary';
  onUnlock: () => void;
}) {
  const hash = useApp((s) => s.db.security[kind]);
  const config = useApp((s) => s.config);
  const dbOrgName = useApp((s) => s.db.orgName);
  const orgName = config.orgName || dbOrgName;

  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const primary = kind === 'primary';

  const press = (d: string) => {
    if (busy || pin.length >= 8) return;
    setError('');
    setPin((p) => p + d);
  };
  const back = () => {
    setError('');
    setPin((p) => p.slice(0, -1));
  };

  const submit = async () => {
    if (busy || pin.length < 4) {
      setError('הקוד הוא 4–8 ספרות');
      return;
    }
    setBusy(true);
    const ok = await verifyPin(pin, hash);
    setBusy(false);
    if (ok) {
      onUnlock();
    } else {
      setError('קוד שגוי — נסו שוב');
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

        {error && (
          <p style={{ color: 'var(--red)', fontSize: 13, fontWeight: 600, marginBottom: 10 }}>{error}</p>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
          {KEYS.map((k) => (
            <button key={k} type="button" className="btn" onClick={() => press(k)} style={keyStyle}>
              {k}
            </button>
          ))}
          <button type="button" className="btn" onClick={back} style={keyStyle} aria-label="מחיקה">
            ⌫
          </button>
          <button type="button" className="btn" onClick={() => press('0')} style={keyStyle}>
            0
          </button>
          <button
            type="button"
            className="btn"
            onClick={() => void submit()}
            disabled={busy}
            style={{ ...keyStyle, background: 'var(--accent-deep)', color: 'var(--dark)', fontWeight: 700 }}
            aria-label="אישור"
          >
            ✓
          </button>
        </div>
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
