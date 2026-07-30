/**
 * מסך הכניסה לענן — מוצג במקום שלד האפליקציה כשלארגון יש config.firebase
 * ואין משתמש מחובר. מאז CLOUD2 (ענן 3) יש שתי לשוניות: **כניסה** (כמו היום)
 * ו**הרשמה** עצמית — יצירת משתמש + בקשה ממתינה; הנרשם רואה מסך "הבקשה
 * נקלטה" עד שהבעלים מאשר (שער-החברות ב-App). כל השגיאות בעברית.
 */
import { useState, type FormEvent } from 'react';
import { useApp } from '../../store/useApp';
import { signUpError } from '../../lib/config';
import { Btn, Field, FormError, TextInput } from '../ui';

export function LoginScreen() {
  const config = useApp((s) => s.config);
  const dbOrgName = useApp((s) => s.db.orgName);
  const cloudSignIn = useApp((s) => s.cloudSignIn);
  const cloudSignUp = useApp((s) => s.cloudSignUp);
  const cloudResetPassword = useApp((s) => s.cloudResetPassword);
  const toast = useApp((s) => s.toast);

  const [mode, setMode] = useState<'in' | 'up'>('in');
  const [orgName, setOrgName] = useState('');
  const [contactName, setContactName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [password2, setPassword2] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const title = config.orgName || dbOrgName;

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (busy) return;
    if (mode === 'up') {
      const err = signUpError(orgName, contactName, phone, email, password, password2);
      if (err) return setError(err);
    } else if (!email.trim() || !password) {
      return setError('נא למלא אימייל וסיסמה');
    }
    setBusy(true);
    setError('');
    try {
      if (mode === 'up') {
        await cloudSignUp(orgName, contactName, phone, email.trim(), password);
        // המשתמש כעת מחובר; שער-החברות ב-App יציג את מסך ההמתנה
      } else {
        await cloudSignIn(email.trim(), password);
        // ההצלחה תיקלט ב-watchAuth — המסך יוחלף אוטומטית באפליקציה
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'הפעולה נכשלה — נסו שוב');
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
          <h1 style={{ fontSize: 22, fontWeight: 700, color: 'var(--ink)' }}>{title}</h1>
          <p style={{ fontSize: 13, color: 'var(--ink-faint)', marginTop: 4 }}>
            {mode === 'in' ? 'כניסה למערכת — הנתונים מסונכרנים בענן' : 'הרשמה — פתיחת מערכת חדשה לארגון שלכם'}
          </p>
        </div>

        <div style={{ display: 'flex', gap: 6, marginBottom: 14 }} role="tablist">
          <Btn sm kind={mode === 'in' ? 'primary' : undefined} onClick={() => { setMode('in'); setError(''); }}>
            כניסה
          </Btn>
          <Btn sm kind={mode === 'up' ? 'primary' : undefined} onClick={() => { setMode('up'); setError(''); }}>
            הרשמה
          </Btn>
        </div>

        <form onSubmit={(e) => void submit(e)}>
          {mode === 'up' && (
            <>
              <Field label="שם הארגון *">
                <TextInput value={orgName} onChange={setOrgName} placeholder="עמותת אור" />
              </Field>
              {/* הזרימה מבוססת שיחה חוזרת (עדכון פקודה 30.7) — איש קשר וטלפון חובה */}
              <Field label="שם איש קשר *">
                <TextInput value={contactName} onChange={setContactName} placeholder="ישראל ישראלי" />
              </Field>
              <Field label="טלפון (נחזור אליכם לאישור) *">
                <TextInput value={phone} onChange={setPhone} type="tel" dir="ltr" placeholder="050-1234567" />
              </Field>
            </>
          )}
          <Field label="אימייל">
            <TextInput value={email} onChange={setEmail} type="email" dir="ltr" placeholder="name@example.com" />
          </Field>
          <Field label="סיסמה">
            <TextInput value={password} onChange={setPassword} type="password" dir="ltr" />
          </Field>
          {mode === 'up' && (
            <Field label="אימות סיסמה">
              <TextInput value={password2} onChange={setPassword2} type="password" dir="ltr" />
            </Field>
          )}
          <FormError error={error} />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 12 }}>
            <Btn kind="primary" type="submit" disabled={busy}>
              {busy ? 'רגע…' : mode === 'in' ? 'כניסה' : 'הרשמה'}
            </Btn>
            {mode === 'in' && (
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
            )}
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
          {mode === 'in' ? 'הגישה נפתחת על-ידי מנהל המערכת' : 'לאחר ההרשמה — צרו קשר לאישור פתיחת המערכת'}
        </p>
      </div>
    </div>
  );
}

/**
 * מסך ההמתנה (ענן 3) — משתמש מחובר ללא חברות-ארגון: הבקשה נקלטה וממתינה
 * לאישור הבעלים. לא האפליקציה — שער-החברות ב-App מציג אותו במקומה.
 */
export function PendingApprovalScreen() {
  const cloudSignOut = useApp((s) => s.cloudSignOut);
  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg)', padding: 16 }}>
      <div className="card" style={{ width: 'min(420px, 94vw)', padding: 24, textAlign: 'center' }}>
        <div style={{ fontSize: 40, marginBottom: 10 }}>⏳</div>
        <h1 style={{ fontSize: 20, fontWeight: 800, marginBottom: 8 }}>הבקשה נקלטה!</h1>
        <p style={{ fontSize: 13.5, color: 'var(--ink-soft)', lineHeight: 1.7 }}>
          נאשר בהקדם — נחזור אליכם בטלפון שהשארתם.
          <br />
          לאחר האישור — התחברו שוב ותקבלו מערכת מוכנה.
        </p>
        <div style={{ marginTop: 16 }}>
          <Btn onClick={() => void cloudSignOut()}>יציאה</Btn>
        </div>
      </div>
    </div>
  );
}
