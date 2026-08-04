/**
 * הרשמת-עובד/ת (ORGADMIN — "קוד מהבוס") — לשונית שלישית במסך-האחיד. העובד/ת
 * ממלא/ת מייל · טלפון · סיסמה · קוד-הזמנה מהמנהל, ונשלחת בקשת-הצטרפות לארגון
 * שהקוד מצביע עליו (לא בקשת-ארגון-חדש). אחרי אישור-המנהל — כניסה רגילה מנתבת
 * אוטומטית לארגון. עיצוב זהה לטופס-הכניסה (orbit-*).
 */
import { useState, type FormEvent } from 'react';
import { useApp } from '../../store/useApp';

export function EmployeeSignup(props: { onDone: (email: string) => void }) {
  const cloudEmployeeSignUp = useApp((s) => s.cloudEmployeeSignUp);

  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [code, setCode] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    setError('');
    try {
      await cloudEmployeeSignUp(email, phone, password, code);
      props.onDone(email.trim());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'ההרשמה נכשלה — נסו שוב');
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <div className="orbit-divider">
        <span />
        <small>הרשמת עובד/ת — עם קוד מהמנהל</small>
        <span />
      </div>

      <form onSubmit={(e) => void submit(e)}>
        <label className="orbit-label">כתובת אימייל</label>
        <input className="orbit-input" type="email" dir="ltr" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="name@example.com" />

        <label className="orbit-label">טלפון</label>
        <input className="orbit-input" type="tel" dir="ltr" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="050-0000000" />

        <label className="orbit-label">סיסמה</label>
        <div className="orbit-pass-wrap">
          <input
            className="orbit-input"
            type={showPass ? 'text' : 'password'}
            dir="ltr"
            style={{ paddingInlineStart: 46 }}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <button type="button" className="orbit-pass-toggle" onClick={() => setShowPass((v) => !v)} aria-label="הצג או הסתר סיסמה">
            {showPass ? '🙈' : '👁'}
          </button>
        </div>

        <label className="orbit-label">קוד-הזמנה מהמנהל</label>
        <input className="orbit-input" type="text" dir="ltr" value={code} onChange={(e) => setCode(e.target.value)} placeholder="org.xxxxxxxx" />

        {error && (
          <div className="orbit-error">
            <span aria-hidden>⚠</span>
            <span>{error}</span>
          </div>
        )}

        <button type="submit" className="orbit-primary" disabled={busy}>
          {busy ? 'רגע…' : 'שליחת בקשה'}
          {!busy && <span aria-hidden>←</span>}
        </button>
      </form>
      <p className="orbit-fine">
        לא קיבלתם קוד? בקשו מהמנהל של הארגון. הבקשה תופיע אצלו לאישור, ואז תוכלו להיכנס עם המייל והסיסמה.
      </p>
    </>
  );
}
