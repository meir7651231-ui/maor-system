/**
 * מסך פענוח — מוצג כשנטענה שמירה מוצפנת ואין עדיין DEK בזיכרון.
 * שני מצבים: הזנת סיסמה, או "פתיחה עם מפתח שחזור" למי ששכח את הסיסמה.
 * בלי אחד מהם אי אפשר לגשת לנתונים (הצפנה אמיתית — אין דלת אחורית).
 */
import { useState } from 'react';
import { useApp } from '../../store/useApp';
import { Btn, Field, FormError, TextInput } from '../ui';

export function EncUnlockScreen() {
  const decryptUnlock = useApp((s) => s.decryptUnlock);
  const config = useApp((s) => s.config);
  const dbOrgName = useApp((s) => s.db.orgName);
  const orgName = config.orgName || dbOrgName;

  const [mode, setMode] = useState<'pass' | 'rec'>('pass');
  const [value, setValue] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    if (busy || !value.trim()) return;
    setBusy(true);
    setError('');
    const ok = await decryptUnlock(value.trim(), mode);
    setBusy(false);
    if (!ok) {
      setError(mode === 'pass' ? 'סיסמה שגויה — נסו שוב' : 'מפתח שחזור שגוי');
      setValue('');
    }
    // הצלחה → needDecrypt=false, App יעבור לאפליקציה
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
      <div className="card" style={{ width: 'min(400px, 94vw)', padding: 24 }}>
        <div style={{ textAlign: 'center', marginBottom: 16 }}>
          <div style={{ fontSize: 34 }} aria-hidden>
            🔐
          </div>
          <h1 style={{ fontSize: 20, fontWeight: 700, color: 'var(--ink)' }}>{orgName}</h1>
          <p style={{ fontSize: 13, color: 'var(--ink-faint)', marginTop: 4 }}>
            הנתונים מוצפנים — {mode === 'pass' ? 'הזינו את סיסמת ההצפנה' : 'הזינו את מפתח השחזור'}
          </p>
        </div>

        <Field label={mode === 'pass' ? 'סיסמת הצפנה' : 'מפתח שחזור'}>
          <TextInput
            value={value}
            onChange={setValue}
            type={mode === 'pass' ? 'password' : 'text'}
            dir="ltr"
            placeholder={mode === 'pass' ? '' : 'XXXX-XXXX-XXXX-…'}
          />
        </Field>
        <FormError error={error} />
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 12 }}>
          <Btn kind="primary" onClick={() => void submit()} disabled={busy}>
            {busy ? 'מפענח…' : 'פתיחה'}
          </Btn>
          <button
            type="button"
            onClick={() => {
              setMode(mode === 'pass' ? 'rec' : 'pass');
              setValue('');
              setError('');
            }}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--ink-soft)',
              fontSize: 13,
              textDecoration: 'underline',
              cursor: 'pointer',
              padding: 4,
            }}
          >
            {mode === 'pass' ? 'שכחתי סיסמה — פתיחה עם מפתח שחזור' : 'חזרה להזנת סיסמה'}
          </button>
        </div>
        <p
          style={{
            marginTop: 16,
            paddingTop: 12,
            borderTop: '1px solid var(--line)',
            fontSize: 12,
            color: 'var(--ink-faint)',
            textAlign: 'center',
          }}
        >
          בלי הסיסמה או מפתח השחזור לא ניתן לשחזר את הנתונים.
        </p>
      </div>
    </div>
  );
}
