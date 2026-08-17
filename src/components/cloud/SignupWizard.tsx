/**
 * אשף ההרשמה של אורביט (SIGNUP3) — 5 שלבים בתוך כרטיס-הזכוכית: תחום → גודל →
 * צרכים → פרטי קשר → חשבון. בסיום קורא ל-cloudSignUp עם הפרופיל (industry/size/
 * needs) ⇒ נזרע ל-platformRequests, כך שהבעלים רואה הקשר עשיר לפני האישור.
 * הלוגיקה הטהורה (קבועים + wizardStepError) חיה ב-lib/signupWizard.
 */
import { useState } from 'react';
import { useApp } from '../../store/useApp';
import {
  EMPTY_WIZARD,
  ORG_NEEDS,
  ORG_SIZES,
  WIZARD_INDUSTRIES,
  WIZARD_STEPS,
  wizardStepError,
  type WizardState,
} from '../../lib/signupWizard';

const STEP_TITLES = ['מה תחום העסק?', 'מה גודל הארגון?', 'מה חשוב לכם?', 'פרטי הקשר', 'חשבון הכניסה'];
const STEP_SUBS = [
  'נתפור לכם מערכת מדויקת לתחום שלכם',
  'נכוונן את היקף המערכת',
  'בחרו כל מה שרלוונטי — או דלגו',
  'נחזור אליכם לאישור בטלפון',
  'האימייל והסיסמה שישמשו לכניסה עתידית',
];

const choiceCls = (on: boolean) => 'orbit-choice' + (on ? ' on' : '');

export function SignupWizard({ onDone }: { onDone: (email: string) => void }) {
  const cloudSignUp = useApp((s) => s.cloudSignUp);
  const [step, setStep] = useState(0);
  const [s, setS] = useState<WizardState>(EMPTY_WIZARD);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const set = (patch: Partial<WizardState>) => setS((p) => ({ ...p, ...patch }));

  const toggleNeed = (id: string) =>
    setS((p) => ({ ...p, needs: p.needs.includes(id) ? p.needs.filter((n) => n !== id) : [...p.needs, id] }));

  const next = async () => {
    const err = wizardStepError(step, s);
    if (err) return setError(err);
    setError('');
    if (step < WIZARD_STEPS - 1) {
      setStep((v) => v + 1);
      return;
    }
    // שלב אחרון — הרשמה
    if (busy) return;
    setBusy(true);
    try {
      await cloudSignUp(s.orgName, s.contactName, s.phone, s.email.trim(), s.password, {
        industry: s.industry,
        size: s.size,
        needs: s.needs,
      });
      onDone(s.email.trim());
    } catch (e) {
      setError(e instanceof Error ? e.message : 'ההרשמה נכשלה — נסו שוב');
    } finally {
      setBusy(false);
    }
  };

  const back = () => {
    setError('');
    setStep((v) => Math.max(0, v - 1));
  };

  return (
    <div>
      {/* פס התקדמות — 5 נקודות */}
      <div style={{ display: 'flex', gap: 6, margin: '2px 0 14px', justifyContent: 'center' }} aria-hidden>
        {Array.from({ length: WIZARD_STEPS }, (_, i) => (
          <span
            key={i}
            style={{
              width: i === step ? 22 : 8,
              height: 8,
              borderRadius: 99,
              background: i <= step ? 'var(--accent, #6ea8fe)' : 'rgba(255,255,255,.2)',
              transition: 'width .15s, background .15s',
            }}
          />
        ))}
      </div>

      <div style={{ fontSize: 12.5, color: 'rgba(255,255,255,.55)', textAlign: 'center', marginBottom: 2 }}>
        שלב {step + 1} מתוך {WIZARD_STEPS}
      </div>
      <h2 style={{ fontSize: 21, fontWeight: 700, margin: '0 0 4px', textAlign: 'center' }}>{STEP_TITLES[step]}</h2>
      <p style={{ fontSize: 13, color: 'rgba(255,255,255,.6)', textAlign: 'center', margin: '0 0 16px' }}>{STEP_SUBS[step]}</p>

      {/* שלב 0 — תחום */}
      {step === 0 && (
        <div style={{ maxHeight: '46vh', overflowY: 'auto' }}>
          {WIZARD_INDUSTRIES.map((ind) => (
            <button key={ind.id} type="button" className={choiceCls(s.industry === ind.id)} onClick={() => { set({ industry: ind.id }); setError(''); }}>
              <span className="orbit-choice-ico" aria-hidden>{ind.emoji}</span>
              <span style={{ flex: 1 }}>
                <span style={{ display: 'block', fontWeight: 700, fontSize: 14.5 }}>{ind.label}</span>
                <span style={{ display: 'block', fontSize: 12, color: 'rgba(255,255,255,.55)' }}>{ind.sub}</span>
              </span>
              {s.industry === ind.id && <span className="orbit-choice-check" aria-hidden>✓</span>}
            </button>
          ))}
        </div>
      )}

      {/* שלב 1 — גודל */}
      {step === 1 && (
        <div>
          {ORG_SIZES.map((sz) => (
            <button key={sz.id} type="button" className={choiceCls(s.size === sz.id)} onClick={() => { set({ size: sz.id }); setError(''); }}>
              <span style={{ flex: 1 }}>
                <span style={{ display: 'block', fontWeight: 700, fontSize: 15 }}>{sz.label}</span>
                <span style={{ display: 'block', fontSize: 12, color: 'rgba(255,255,255,.55)' }}>{sz.sub}</span>
              </span>
              {s.size === sz.id && <span className="orbit-choice-check" aria-hidden>✓</span>}
            </button>
          ))}
        </div>
      )}

      {/* שלב 2 — צרכים (רב-בחירה) */}
      {step === 2 && (
        <div style={{ maxHeight: '46vh', overflowY: 'auto' }}>
          {ORG_NEEDS.map((n) => (
            <button key={n.id} type="button" className={choiceCls(s.needs.includes(n.id))} onClick={() => toggleNeed(n.id)}>
              <span className="orbit-choice-ico" aria-hidden>{n.emoji}</span>
              <span style={{ flex: 1, fontWeight: 600, fontSize: 14 }}>{n.label}</span>
              <span aria-hidden style={{ fontSize: 17, opacity: s.needs.includes(n.id) ? 1 : 0.3 }}>{s.needs.includes(n.id) ? '☑' : '☐'}</span>
            </button>
          ))}
        </div>
      )}

      {/* שלב 3 — פרטי קשר */}
      {step === 3 && (
        <div>
          <label className="orbit-label">שם הארגון *</label>
          <input className="orbit-input" value={s.orgName} onChange={(e) => set({ orgName: e.target.value })} placeholder="עמותת אור" />
          <label className="orbit-label">שם איש קשר *</label>
          <input className="orbit-input" value={s.contactName} onChange={(e) => set({ contactName: e.target.value })} placeholder="ישראל ישראלי" />
          <label className="orbit-label">טלפון (נחזור אליכם לאישור) *</label>
          <input className="orbit-input" type="tel" dir="ltr" value={s.phone} onChange={(e) => set({ phone: e.target.value })} placeholder="050-1234567" />
        </div>
      )}

      {/* שלב 4 — חשבון */}
      {step === 4 && (
        <div>
          <label className="orbit-label">כתובת אימייל</label>
          <input className="orbit-input" type="email" dir="ltr" value={s.email} onChange={(e) => set({ email: e.target.value })} placeholder="name@example.com" />
          <div className="orbit-note">
            <span aria-hidden>⚠</span>
            <div>האימייל הזה ישמש ככניסה עתידית לאתר. ודאו שזו הכתובת הנכונה — וזכרו את הסיסמה שתבחרו.</div>
          </div>
          <label className="orbit-label">סיסמה</label>
          <div className="orbit-pass-wrap">
            <input
              className="orbit-input"
              type={showPass ? 'text' : 'password'}
              dir="ltr"
              style={{ paddingInlineStart: 46 }}
              value={s.password}
              onChange={(e) => set({ password: e.target.value })}
              placeholder="בחרו סיסמה חזקה"
            />
            <button type="button" className="orbit-pass-toggle" onClick={() => setShowPass((v) => !v)} aria-label="הצג או הסתר סיסמה">
              {showPass ? '🙈' : '👁'}
            </button>
          </div>
          <label className="orbit-label">אימות סיסמה</label>
          <input className="orbit-input" type={showPass ? 'text' : 'password'} dir="ltr" value={s.password2} onChange={(e) => set({ password2: e.target.value })} />
        </div>
      )}

      {error && (
        <div className="orbit-error">
          <span aria-hidden>⚠</span>
          <span>{error}</span>
        </div>
      )}

      <div style={{ display: 'flex', gap: 8, marginTop: 14 }}>
        {step > 0 && (
          <button type="button" className="orbit-sbtn" style={{ flex: 'none', padding: '0 18px' }} onClick={back} disabled={busy}>
            → הקודם
          </button>
        )}
        {/* שלב הצרכים אופציונלי — כפתור "דלגו" */}
        {step === 2 && s.needs.length === 0 && (
          <button type="button" className="orbit-linkbtn" style={{ flex: 'none' }} onClick={() => void next()} disabled={busy}>
            דלגו
          </button>
        )}
        <button type="button" className="orbit-primary" style={{ flex: 1 }} onClick={() => void next()} disabled={busy}>
          {busy ? 'רגע…' : step === WIZARD_STEPS - 1 ? 'בוא נתחיל' : 'הבא'}
          {!busy && <span aria-hidden>←</span>}
        </button>
      </div>
    </div>
  );
}
