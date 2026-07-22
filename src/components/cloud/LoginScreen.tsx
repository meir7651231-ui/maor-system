/**
 * מסך הכניסה לענן — מוצג במקום שלד האפליקציה כשלארגון יש config.firebase
 * ואין משתמש מחובר. כניסה בלבד (אימייל+סיסמה): אין הרשמה עצמית — משתמשים
 * נוצרים ע"י המטמיע בקונסולת Firebase. כל השגיאות בעברית.
 */
import { useState, type FormEvent } from 'react';
import { useApp } from '../../store/useApp';
import { Btn, Field, FormError, TextInput } from '../ui';

export function LoginScreen() {
  const config = useApp((s) => s.config);
  const dbOrgName = useApp((s) => s.db.orgName);
  const cloudSignIn = useApp((s) => s.cloudSignIn);
  const cloudResetPassword = useApp((s) => s.cloudResetPassword);
  const toast = useApp((s) => s.toast);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const orgName = config.orgName || dbOrgName;

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (busy) return;
    if (!email.trim() || !password) {
      setError('נא למלא אימייל וסיסמה');
      return;
    }
    setBusy(true);
    setError('');
    try {
      await cloudSignIn(email.trim(), password);
      // ההצלחה תיקלט ב-watchAuth — המסך יוחלף אוטומטית באפליקציה
    } catch (err) {
      setError(err instanceof Error ? err.message : 'הכניסה נכשלה — נסו שוב');
    } finally {
      setBusy(false);
    }
  };

  const forgot = async () => {
    if (busy) return;
    if (!email.trim()) {
      setError('הזינו את האימייל ואז לחצו "שכחתי סיסמה"');
      return;
    }
    setBusy(true);
    setError('');
    try {
      await cloudResetPassword(email.trim());
      toast('נשלח אליכם מייל לאיפוס הסיסמה ✓');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'שליחת האיפוס נכשלה — נסו שוב');
    } finally {
      setBusy(false);
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
      <div className="card" style={{ width: 'min(400px, 94vw)', padding: 24 }}>
        <div style={{ textAlign: 'center', marginBottom: 18 }}>
          {config.logoDataUri && (
            <img
              src={config.logoDataUri}
              alt=""
              style={{ height: 52, borderRadius: 10, marginBottom: 8 }}
            />
          )}
          <h1 style={{ fontSize: 22, fontWeight: 700, color: 'var(--ink)' }}>{orgName}</h1>
          <p style={{ fontSize: 13, color: 'var(--ink-faint)', marginTop: 4 }}>
            כניסה למערכת — הנתונים מסונכרנים בענן
          </p>
        </div>

        <form onSubmit={(e) => void submit(e)}>
          <Field label="אימייל">
            <TextInput value={email} onChange={setEmail} type="email" dir="ltr" placeholder="name@example.com" />
          </Field>
          <Field label="סיסמה">
            <TextInput value={password} onChange={setPassword} type="password" dir="ltr" />
          </Field>
          <FormError error={error} />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 12 }}>
            <Btn kind="primary" type="submit" disabled={busy}>
              {busy ? 'רגע…' : 'כניסה'}
            </Btn>
            <button
              type="button"
              onClick={() => void forgot()}
              disabled={busy}
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
              שכחתי סיסמה
            </button>
          </div>
        </form>

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
          הגישה נפתחת על-ידי מנהל המערכת
        </p>
      </div>
    </div>
  );
}
