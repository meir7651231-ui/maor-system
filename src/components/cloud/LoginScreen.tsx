/**
 * 🪐 מסך ההרשמה של אורביט (SIGNUP מיתוג 2) — מוצג במקום שלד האפליקציה
 * כשלארגון יש config.firebase ואין משתמש מחובר. עיצוב Claude Design: Hero
 * קוסמי (כדור-מוח, מגודר signup.hero3d) + כרטיס-זכוכית עם שתי לשוניות —
 * **כניסה / הרשמה**. ה-API של הרכיב נשמר (App מרנדר אותו באותו מקום ומייבא
 * גם את PendingApprovalScreen); ההרשמה מחוברת ל-cloudSignUp הקיים.
 *
 * גבולות: אימות = אימייל+סיסמה בלבד (בלי ספקי-זהות חיצוניים או מפתחות-גישה —
 * לא מבטיחים מה שאין); הקופי הנעול מדויק; אפס CDN (Hero + גופנים מקומיים).
 */
import { useState, type FormEvent } from 'react';
import { useApp } from '../../store/useApp';
import { SignupHero } from './SignupHero';
import { SignupWizard } from './SignupWizard';
import { EmployeeSignup } from './EmployeeSignup';
import { NewsReader } from './NewsReader';
import { CallbackModal } from './CallbackModal';
import { VideoModal } from './VideoModal';
import { NetCheckModal } from './NetCheckModal';

export function LoginScreen() {
  const config = useApp((s) => s.config);
  const dbOrgName = useApp((s) => s.db.orgName);
  const cloudSignIn = useApp((s) => s.cloudSignIn);
  const cloudResetPassword = useApp((s) => s.cloudResetPassword);
  const toast = useApp((s) => s.toast);

  const [mode, setMode] = useState<'in' | 'up' | 'emp'>('up');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  // overlays מהמוקאפ
  const [readerOpen, setReaderOpen] = useState(false);
  const [callbackOpen, setCallbackOpen] = useState(false);
  const [videoOpen, setVideoOpen] = useState(false);
  const [netCheckOpen, setNetCheckOpen] = useState(false);

  const title = config.orgName || dbOrgName || 'מאור החסד';
  const brandEmoji = config.emoji || '🕯️';

  // כניסה בלבד — ההרשמה עברה לאשף 5-השלבים (SignupWizard).
  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (busy) return;
    if (!email.trim() || !password) return setError('נא למלא אימייל וסיסמה');
    setBusy(true);
    setError('');
    try {
      await cloudSignIn(email.trim(), password);
      // ההצלחה תיקלט ב-watchAuth — המסך יוחלף אוטומטית באפליקציה
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
        <div className="orbit-stage">
          {/* הצד-השיווקי — הקופי הנעול, כפתורי "ללמוד עוד" ונקודות-אמון. בדסקטופ
              משמאל לכרטיס (ממלא את החלל הקוסמי); במובייל מעל הכרטיס. מוסתר במצב-הצלחה. */}
          {!submitted && (
            <aside className="orbit-lede">
              <div className="orbit-brand">
                <span className="orbit-brand-mark" aria-hidden>{brandEmoji}</span>
                <span className="orbit-brand-name">
                  {title}
                  <span className="orbit-brand-sub">מערכת הניהול שלכם</span>
                </span>
              </div>
              <h1 className="orbit-h1">
                כל הפעילות שלכם,<br />זורחת <em>במקום אחד.</em>
              </h1>
              <p className="orbit-sub">
                המערכת שמחברת את כל הפעילות שלכם למקום אחד — בעברית, בפשטות, ושלכם לגמרי. מוקמת במיוחד בשבילכם, בשיחת טלפון אחת.
              </p>

              {/* שלושת הכפתורים המשניים מהמוקאפ */}
              <div className="orbit-secondary">
                <button type="button" className="orbit-sbtn" aria-label="צפו בסרטון היכרות" onClick={() => setVideoOpen(true)}>
                  ▶ סרטון
                </button>
                <button type="button" className="orbit-sbtn" aria-label="קראו את העיתון" onClick={() => setReaderOpen(true)}>
                  📰 עיתון
                </button>
                <button type="button" className="orbit-sbtn" aria-label="נחזור אליכם" onClick={() => setCallbackOpen(true)}>
                  📞 חזרו אליי
                </button>
              </div>
              {/* 🩺 מאבחן-חסימות (11.8): קו מסונן חוסם כניסה — הכלי חי במסך-הכניסה */}
              <button type="button" className="orbit-util" aria-label="בדיקת תקשורת — האם הקו חוסם את המערכת" onClick={() => setNetCheckOpen(true)}>
                🩺 בדיקת תקשורת
              </button>

              <ul className="orbit-lede-points">
                <li>
                  <span aria-hidden>🔒</span> מוצפן מקצה-לקצה · שלוש שכבות גיבוי
                </li>
                <li>
                  <span aria-hidden>⚡</span> מוקמים בשיחת טלפון אחת — בלי התקנה
                </li>
                <li>
                  <span aria-hidden>🎯</span> מותאם בול לתחום שלכם
                </li>
              </ul>
            </aside>
          )}

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
                <div className="orbit-tabs" role="tablist">
                <button type="button" role="tab" className={'orbit-tab' + (mode === 'up' ? ' on' : '')} onClick={() => { setMode('up'); setError(''); }}>
                  הרשמה
                </button>
                <button type="button" role="tab" className={'orbit-tab' + (mode === 'emp' ? ' on' : '')} onClick={() => { setMode('emp'); setError(''); }}>
                  הרשמת עובד/ת
                </button>
                <button type="button" role="tab" className={'orbit-tab' + (mode === 'in' ? ' on' : '')} onClick={() => { setMode('in'); setError(''); }}>
                  כניסה
                </button>
              </div>

              {mode === 'up' ? (
                /* ההרשמה = אשף 5-שלבים (SIGNUP3): תחום→גודל→צרכים→קשר→חשבון */
                <>
                  <SignupWizard onDone={(em) => { setEmail(em); setSubmitted(true); }} />
                  <p className="orbit-fine">
                    לאחר ההרשמה — צרו קשר לאישור פתיחת המערכת. אתם מאשרים את תנאי השימוש ומדיניות הפרטיות.
                  </p>
                </>
              ) : mode === 'emp' ? (
                /* הרשמת-עובד/ת (ORGADMIN) — מייל+טלפון+סיסמה+קוד-מהמנהל ⇒ בקשה למנהל */
                <EmployeeSignup onDone={(em) => { setEmail(em); setSubmitted(true); }} />
              ) : (
                <>
                  <div className="orbit-divider">
                    <span />
                    <small>כניסה עם אימייל</small>
                    <span />
                  </div>

                  <form onSubmit={(e) => void submit(e)}>
                    <label className="orbit-label">כתובת אימייל</label>
                    <input className="orbit-input" type="email" dir="ltr" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="name@example.com" />

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
                        {eyeIcon}
                      </button>
                    </div>

                    {error && (
                      <div className="orbit-error">
                        <span aria-hidden>⚠</span>
                        <span>{error}</span>
                      </div>
                    )}

                    <button type="submit" className="orbit-primary" disabled={busy}>
                      {busy ? 'רגע…' : 'כניסה'}
                      {!busy && <span aria-hidden>←</span>}
                    </button>

                    <button type="button" className="orbit-linkbtn" onClick={() => void forgot()} disabled={busy}>
                      שכחתי סיסמה
                    </button>
                  </form>
                </>
              )}
              </>
            )}
          </div>
        </div>

        {/* בהצלחה/המתנה ה-lede (עם המותג) מוסתר — כאן נותנים הקשר-ארגון; בהרשמה המותג כבר בראש ה-lede */}
        <div style={{ position: 'relative', zIndex: 2, fontSize: 12.5, color: 'rgba(255,240,228,.5)' }}>
          {submitted && `מערכת עבור ${title}`}
        </div>
      </main>

      <footer className="orbit-footer">
        <span>© 2026 {title}</span>
        <span style={{ display: 'flex', alignItems: 'center' }}>
          <span className="dot" aria-hidden />
          מוצפן מקצה לקצה · הצפנה במנוחה · שלוש שכבות גיבוי
        </span>
      </footer>

      {readerOpen && <NewsReader onClose={() => setReaderOpen(false)} />}
      {callbackOpen && <CallbackModal onClose={() => setCallbackOpen(false)} />}
      {videoOpen && <VideoModal onClose={() => setVideoOpen(false)} />}
      {netCheckOpen && <NetCheckModal onClose={() => setNetCheckOpen(false)} />}
    </div>
  );
}

/**
 * מסך ההמתנה (ענן 3) — משתמש מחובר ללא חברות-ארגון: הבקשה נקלטה וממתינה
 * לאישור הבעלים. לא האפליקציה — שער-החברות ב-App מציג אותו במקומה.
 */
export function PendingApprovalScreen() {
  const cloudSignOut = useApp((s) => s.cloudSignOut);
  // סטטוס אמיתי (5.8 — "מאור נרשם ולא רואים בקשה"): המסך אמר "הבקשה נקלטה"
  // גם כשהכתיבה נכשלה בשקט והבעלים לא ראה כלום. עכשיו: כשל ⇒ קוד-השגיאה מוצג.
  const reqStatus = useApp((s) => s.cloud.reqStatus);
  const failed = !!reqStatus && reqStatus !== 'ok';
  return (
    <div className="orbit-screen">
      <SignupHero />
      <main className="orbit-main" style={{ alignItems: 'center', justifyContent: 'center' }}>
        <div className="orbit-card" style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 40, marginBottom: 10 }}>{failed ? '⚠️' : '⏳'}</div>
          <h1 style={{ fontSize: 22, fontWeight: 800, marginBottom: 8 }}>{failed ? 'הבקשה לא נקלטה' : 'הבקשה נקלטה'}</h1>
          {failed ? (
            <p style={{ fontSize: 13.5, color: 'rgba(255,255,255,.7)', lineHeight: 1.7 }}>
              רישום-הבקשה בענן נכשל
              <span dir="ltr" style={{ fontWeight: 700 }}>{' (' + reqStatus + ') '}</span>
              — מסרו את הקוד הזה למנהל הפלטפורמה.
              <br />
              ננסה שוב אוטומטית בהתחברות הבאה.
            </p>
          ) : (
            <p style={{ fontSize: 13.5, color: 'rgba(255,255,255,.7)', lineHeight: 1.7 }}>
              המערכת שלכם ממתינה לאישור מנהל הפלטפורמה.
              <br />
              לאחר האישור — התחברו שוב ותקבלו מערכת מוכנה.
            </p>
          )}
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
