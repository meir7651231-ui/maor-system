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
import { useCallback, useMemo, useState, type CSSProperties, type FormEvent } from 'react';
import { useApp } from '../../store/useApp';
import { orbitTheme } from '../../lib/orbitTheme';
import { SignupHero } from './SignupHero';
import { SignupWizard } from './SignupWizard';
import { EmployeeSignup } from './EmployeeSignup';
import { CallbackModal } from './CallbackModal';
import { StoreModal, type StoreStart } from './StoreModal';
import { ScreensReel } from './ScreensReel';
import { A11yFab } from '../A11yFab';
import { featureOn } from '../../lib/config';
import { OwnerWaButton } from './OwnerWaButton';
import { ownerWaLink, signupOwnerText, type StoreRef } from '../../lib/signupNotify';

export function LoginScreen() {
  const config = useApp((s) => s.config);
  const cloudSignIn = useApp((s) => s.cloudSignIn);
  const cloudResetPassword = useApp((s) => s.cloudResetPassword);
  const toast = useApp((s) => s.toast);

  const [mode, setMode] = useState<'in' | 'up' | 'emp'>('up');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  // 💬 הודעת-וואטסאפ לבעלים אחרי הרשמת-ארגון (null ⇒ אין כפתור: הרשמת-עובד/ת או בלי מספר-בעלים)
  const [ownerWa, setOwnerWa] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  // overlays מהמוקאפ
  const [storeOpen, setStoreOpen] = useState(false);
  const [callbackOpen, setCallbackOpen] = useState(false);
  // בחירה מהחנות ⇒ האשף נפתח מחדש (key) עם התחום מסומן והבחירות להודעה
  const [storePreset, setStorePreset] = useState<StoreRef | null>(null);
  const [wizardKey, setWizardKey] = useState(0);
  const onStoreStart = useCallback((s: StoreStart) => {
    setStorePreset({ ...(s.ed ? { vertical: s.ed } : {}), ...(s.names.length ? { names: s.names } : {}) });
    setWizardKey((k) => k + 1);
    setMode('up');
    setSubmitted(false);
    setError('');
    setStoreOpen(false);
  }, []);
  const closeStore = useCallback(() => setStoreOpen(false), []);

  // ברירת-מחדל = אורביט (הפלטפורמה שאליה נרשמים); לקוח עם orgName/emoji/accent
  // מקבל את הזהות שלו — "בהמשך זה יגיע מהאתר שלהם". שים לב: לא נופלים ל-db.orgName —
  // בשורש-הפלטפורמה הוא "מאור החסד" מנתוני-הזריעה ולא צריך למתג את אורביט.
  const title = config.orgName || 'אורביט';
  // הסמל: ארגון עם אימוג'י-מותג ⇒ האימוג'י שלו; אורביט ⇒ הסמל (כדור-רשת+טבעת, public/orbit/orbit-mark.jpg)
  const brandEmoji = config.emoji || '🪐';
  const theme = useMemo(() => orbitTheme(config.accent), [config.accent]);

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
    <div className="orbit-screen" style={theme.vars as CSSProperties}>
      <SignupHero />

      <main className="orbit-main">
        <div className="orbit-stage">
          {/* הצד-השיווקי — הקופי הנעול, כפתורי "ללמוד עוד" ונקודות-אמון. בדסקטופ
              משמאל לכרטיס (ממלא את החלל הקוסמי); במובייל מעל הכרטיס. מוסתר במצב-הצלחה. */}
          {!submitted && (
            <aside className="orbit-lede">
              <div className="orbit-brand">
                <span className="orbit-brand-mark" aria-hidden>{config.emoji ? brandEmoji : <img className="orbit-brand-img" src={`${import.meta.env.BASE_URL}orbit/orbit-mark.jpg`} alt="" width={56} height={56} />}</span>
                <span className="orbit-brand-name">
                  {title}
                  <span className="orbit-brand-sub">מערכת הניהול שלכם</span>
                </span>
              </div>
              <h1 className="orbit-h1">
                כל עסק. כל תחום.<br /><em>מערכת אחת שעושה הכול.</em>
              </h1>
              {/* 🎞 המסכים מתגלגלים מיד מתחת לכותרת (22.10) */}
              <ScreensReel onOpen={() => setStoreOpen(true)} />
              <p className="orbit-sub">
                ניהול, פתרונות מוכנים ושדרוג למערכת קיימת — מותאם לכם בהקמה, בשיחת טלפון אחת.
              </p>

              {/* 🛒 החנות (22.10, במקום סרטון+עיתון) + "חזרו אליי" */}
              <div className="orbit-secondary orbit-secondary-2">
                <button type="button" className="orbit-sbtn orbit-sbtn-hot" aria-label="החנות שלנו — כל הפתרונות" onClick={() => setStoreOpen(true)}>
                  🛒 החנות שלנו — כל הפתרונות
                </button>
                <button type="button" className="orbit-sbtn" aria-label="נחזור אליכם" onClick={() => setCallbackOpen(true)}>
                  📞 חזרו אליי
                </button>
              </div>

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
                {ownerWa && <OwnerWaButton href={ownerWa} label="שלחו לנו הודעה בוואטסאפ — לאישור מהיר" />}
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
                  <SignupWizard key={wizardKey} preset={storePreset} onDone={(em, summary) => { setEmail(em); setOwnerWa(ownerWaLink(signupOwnerText(summary))); setSubmitted(true); }} />
                  <p className="orbit-fine">
                    לאחר ההרשמה — צרו קשר לאישור פתיחת המערכת. אתם מאשרים את תנאי השימוש ומדיניות הפרטיות.
                  </p>
                </>
              ) : mode === 'emp' ? (
                /* הרשמת-עובד/ת (ORGADMIN) — מייל+טלפון+סיסמה+קוד-מהמנהל ⇒ בקשה למנהל */
                <EmployeeSignup onDone={(em) => { setEmail(em); setOwnerWa(null); setSubmitted(true); }} />
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

        {/* חתימת-הפלטפורמה במצב-הצלחה — שם-הפלטפורמה (אורביט), או שם-הלקוח white-label */}
        <div style={{ position: 'relative', zIndex: 2, fontSize: 12.5, color: 'rgba(255,240,228,.5)' }}>
          {submitted && `מערכת ${config.orgName || 'אורביט'}`}
        </div>
      </main>

      <footer className="orbit-footer">
        <span>© 2026 {title}</span>
        <span style={{ display: 'flex', alignItems: 'center' }}>
          <span className="dot" aria-hidden />
          מוצפן מקצה לקצה · הצפנה במנוחה · שלוש שכבות גיבוי
        </span>
      </footer>

      {/* ♿ הנגישות שלנו גם במסך ההרשמה (22.10) — אותו FAB ואותו דגל; בתוך המסך כי הוא שכבה z-400 */}
      {featureOn(config, 'shell.a11yfab') && <A11yFab />}
      {storeOpen && <StoreModal onClose={closeStore} onStart={onStoreStart} />}
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
  // סטטוס אמיתי (5.8 — "מאור נרשם ולא רואים בקשה"): המסך אמר "הבקשה נקלטה"
  // גם כשהכתיבה נכשלה בשקט והבעלים לא ראה כלום. עכשיו: כשל ⇒ קוד-השגיאה מוצג.
  const reqStatus = useApp((s) => s.cloud.reqStatus);
  const config = useApp((s) => s.config);
  const theme = useMemo(() => orbitTheme(config.accent), [config.accent]);
  const failed = !!reqStatus && reqStatus !== 'ok';
  return (
    <div className="orbit-screen" style={theme.vars as CSSProperties}>
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
