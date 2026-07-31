/**
 * 🪐 מסך ההרשמה של אורביט (SIGNUP מיתוג 2) — מוצג במקום שלד האפליקציה
 * כשלארגון יש config.firebase ואין משתמש מחובר. עיצוב Claude Design: Hero
 * קוסמי (כדור-מוח, מגודר signup.hero3d) + כרטיס-זכוכית עם שתי לשוניות —
 * **כניסה / הרשמה**. ה-API של הרכיב נשמר (App מרנדר אותו באותו מקום ומייבא
 * גם את PendingApprovalScreen); ההרשמה מחוברת ל-cloudSignUp הקיים.
 *
 * גבולות: אימות = אימייל+סיסמה בלבד (בלי Google/Apple/Passkey/WebAuthn —
 * לא מבטיחים מה שאין); הקופי הנעול מדויק; אפס CDN (Hero + גופנים מקומיים).
 */
import { useState, type FormEvent } from 'react';
import { useApp } from '../../store/useApp';
import { signUpError } from '../../lib/config';
import { SignupHero } from './SignupHero';
import { NewsReader } from './NewsReader';
import { CallbackModal } from './CallbackModal';

export function LoginScreen() {
  const config = useApp((s) => s.config);
  const dbOrgName = useApp((s) => s.db.orgName);
  const cloudSignIn = useApp((s) => s.cloudSignIn);
  const cloudSignUp = useApp((s) => s.cloudSignUp);
  const cloudResetPassword = useApp((s) => s.cloudResetPassword);
  const toast = useApp((s) => s.toast);

  const [mode, setMode] = useState<'in' | 'up'>('up');
  const [orgName, setOrgName] = useState('');
  const [contactName, setContactName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [password2, setPassword2] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  // overlays מהמוקאפ
  const [readerOpen, setReaderOpen] = useState(false);
  const [callbackOpen, setCallbackOpen] = useState(false);

  const title = config.orgName || dbOrgName || 'אורביט';

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
        setSubmitted(true);
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
    if (!email.trim()) return setError('הזינו את האימייל ואז לחצו "שכחתי סיסמה"');
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

  const eyeIcon = showPass ? '🙈' : '👁';

  return (
    <div className="orbit-screen">
      <SignupHero />

      <main className="orbit-main">
        <div className="orbit-card">
          {submitted ? (
            <div className="orbit-success">
              <div className="orbit-success-icon">✓</div>
              <h2 style={{ margin: '0 0 8px', fontSize: 25, fontWeight: 700 }}>הבקשה נקלטה!</h2>
              <p style={{ margin: '0 0 4px', fontSize: 14, color: 'rgba(255,255,255,.6)', lineHeight: 1.55 }}>
                נאשר בהקדם — נחזור אליכם בטלפון שהשארתם. לאחר האישור התחברו שוב עם
              </p>
              <p dir="ltr" style={{ margin: '0 0 22px', fontSize: 15, fontWeight: 600, color: '#fff', wordBreak: 'break-all' }}>
                {email}
              </p>
              <button
                type="button"
                className="orbit-sbtn"
                style={{ display: 'inline-flex', padding: '0 22px' }}
                onClick={() => {
                  setSubmitted(false);
                  setMode('in');
                }}
              >
                למסך הכניסה
              </button>
            </div>
          ) : (
            <>
              {/* הקופי הנעול (אורביט) */}
              <h1 className="orbit-h1">
                העסק שלכם לא צריך עוד תוכנה. הוא צריך <em>מוח</em>.
              </h1>
              <p className="orbit-sub">
                אורביט היא מערכת ההפעלה שמחברת את כל העסק למקום אחד — ונבנית במיוחד בשבילכם, בשיחת טלפון אחת.
              </p>

              {/* שלושת הכפתורים המשניים מהמוקאפ */}
              <div className="orbit-secondary">
                <button
                  type="button"
                  className="orbit-sbtn"
                  aria-label="צפו בסרטון: מה זה אורביט"
                  onClick={() => toast('הסיור המצולם יתווסף בקרוב — בינתיים אפשר לקרוא את העיתון')}
                >
                  ▶ סרטון
                </button>
                <button type="button" className="orbit-sbtn" aria-label="קראו את העיתון של אורביט" onClick={() => setReaderOpen(true)}>
                  📰 עיתון
                </button>
                <button type="button" className="orbit-sbtn" aria-label="נחזור אליכם" onClick={() => setCallbackOpen(true)}>
                  📞 חזרו אליי
                </button>
              </div>

              <div className="orbit-tabs" role="tablist">
                <button type="button" role="tab" className={'orbit-tab' + (mode === 'up' ? ' on' : '')} onClick={() => { setMode('up'); setError(''); }}>
                  הרשמה
                </button>
                <button type="button" role="tab" className={'orbit-tab' + (mode === 'in' ? ' on' : '')} onClick={() => { setMode('in'); setError(''); }}>
                  כניסה
                </button>
              </div>

              <div className="orbit-divider">
                <span />
                <small>{mode === 'up' ? 'הרשמה עם אימייל' : 'כניסה עם אימייל'}</small>
                <span />
              </div>

              <form onSubmit={(e) => void submit(e)}>
                {mode === 'up' && (
                  <>
                    <label className="orbit-label">שם הארגון *</label>
                    <input className="orbit-input" value={orgName} onChange={(e) => setOrgName(e.target.value)} placeholder="עמותת אור" />
                    <label className="orbit-label">שם איש קשר *</label>
                    <input className="orbit-input" value={contactName} onChange={(e) => setContactName(e.target.value)} placeholder="ישראל ישראלי" />
                    <label className="orbit-label">טלפון (נחזור אליכם לאישור) *</label>
                    <input className="orbit-input" type="tel" dir="ltr" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="050-1234567" />
                  </>
                )}

                <label className="orbit-label">כתובת אימייל</label>
                <input className="orbit-input" type="email" dir="ltr" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="name@example.com" />
                {mode === 'up' && (email.length > 0 || phone.length > 0) && (
                  <div className="orbit-note">
                    <span aria-hidden>⚠</span>
                    <div>האימייל הזה ישמש ככניסה עתידית לאתר. ודאו שזו הכתובת הנכונה — וזכרו את הסיסמה שתבחרו.</div>
                  </div>
                )}

                <label className="orbit-label">סיסמה</label>
                <div className="orbit-pass-wrap">
                  <input
                    className="orbit-input"
                    type={showPass ? 'text' : 'password'}
                    dir="ltr"
                    style={{ paddingInlineStart: 46 }}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder={mode === 'up' ? 'בחרו סיסמה חזקה' : ''}
                  />
                  <button type="button" className="orbit-pass-toggle" onClick={() => setShowPass((v) => !v)} aria-label="הצג או הסתר סיסמה">
                    {eyeIcon}
                  </button>
                </div>

                {mode === 'up' && (
                  <>
                    <label className="orbit-label">אימות סיסמה</label>
                    <input
                      className="orbit-input"
                      type={showPass ? 'text' : 'password'}
                      dir="ltr"
                      value={password2}
                      onChange={(e) => setPassword2(e.target.value)}
                    />
                  </>
                )}

                {error && (
                  <div className="orbit-error">
                    <span aria-hidden>⚠</span>
                    <span>{error}</span>
                  </div>
                )}

                <button type="submit" className="orbit-primary" disabled={busy}>
                  {busy ? 'רגע…' : mode === 'up' ? 'בוא נתחיל' : 'כניסה'}
                  {!busy && <span aria-hidden>←</span>}
                </button>

                {mode === 'in' && (
                  <button type="button" className="orbit-linkbtn" onClick={() => void forgot()} disabled={busy}>
                    שכחתי סיסמה
                  </button>
                )}
              </form>

              {mode === 'up' && (
                <p className="orbit-fine">
                  לאחר ההרשמה — צרו קשר לאישור פתיחת המערכת. אתם מאשרים את תנאי השימוש ומדיניות הפרטיות.
                </p>
              )}
            </>
          )}
        </div>

        <div style={{ position: 'relative', zIndex: 2, fontSize: 12.5, color: 'rgba(255,255,255,.5)' }}>
          {title !== 'אורביט' && `מערכת עבור ${title}`}
        </div>
      </main>

      <footer className="orbit-footer">
        <span>© 2026 ORBIT</span>
        <span style={{ display: 'flex', alignItems: 'center' }}>
          <span className="dot" aria-hidden />
          מוצפן מקצה לקצה · הצפנה במנוחה · שלוש שכבות גיבוי
        </span>
      </footer>

      {readerOpen && <NewsReader onClose={() => setReaderOpen(false)} />}
      {callbackOpen && <CallbackModal onClose={() => setCallbackOpen(false)} />}
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
    <div className="orbit-screen">
      <SignupHero />
      <main className="orbit-main" style={{ alignItems: 'center', justifyContent: 'center' }}>
        <div className="orbit-card" style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 40, marginBottom: 10 }}>⏳</div>
          <h1 style={{ fontSize: 22, fontWeight: 800, marginBottom: 8 }}>הבקשה נקלטה</h1>
          <p style={{ fontSize: 13.5, color: 'rgba(255,255,255,.7)', lineHeight: 1.7 }}>
            המערכת שלכם ממתינה לאישור מנהל הפלטפורמה.
            <br />
            לאחר האישור — התחברו שוב ותקבלו מערכת מוכנה.
          </p>
          <div style={{ marginTop: 16 }}>
            <button type="button" className="orbit-sbtn" style={{ display: 'inline-flex', padding: '0 22px' }} onClick={() => void cloudSignOut()}>
              יציאה
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
