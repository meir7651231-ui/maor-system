/**
 * הגדרות ← הצפנת נתונים — הפעלה/כיבוי הצפנה במנוחה + החלפת סיסמה.
 * בהפעלה מוצג "מפתח שחזור" חד-פעמי שיש לשמור: הוא הדרך היחידה לשחזר אם
 * הסיסמה נשכחת. זו הצפנה אמיתית — בלי סיסמה/מפתח שחזור אין גישה לנתונים.
 */
import { useState } from 'react';
import { useApp } from '../../store/useApp';
import { Btn, Field, FormError, Modal, TextInput } from '../ui';
import { Section, SectionNote } from './lib';

function pwLongEnough(pw: string): boolean {
  return pw.length >= 6;
}

/** מודאל שמציג את מפתח השחזור פעם אחת עם אישור "שמרתי". */
function RecoveryModal({ code, onClose }: { code: string; onClose: () => void }) {
  const [saved, setSaved] = useState(false);
  return (
    <Modal title="🔑 מפתח שחזור — שמרו אותו עכשיו" onClose={onClose}>
      <p style={{ fontSize: 13.5, lineHeight: 1.6, marginBottom: 10 }}>
        זהו <b>מפתח השחזור</b>. אם תשכחו את הסיסמה — זו הדרך <b>היחידה</b> לפתוח את הנתונים. הוא מוצג
        פעם אחת בלבד. העתיקו אותו למקום בטוח (מנהל סיסמאות, פתק במקום נעול).
      </p>
      <div
        dir="ltr"
        style={{
          fontFamily: 'monospace',
          fontSize: 18,
          fontWeight: 700,
          letterSpacing: 1,
          textAlign: 'center',
          padding: '14px 10px',
          borderRadius: 8,
          border: '1px dashed var(--accent-deep)',
          background: 'var(--bg)',
          color: 'var(--ink)',
          userSelect: 'all',
          marginBottom: 12,
        }}
      >
        {code}
      </div>
      <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
        <Btn sm onClick={() => void navigator.clipboard?.writeText(code)}>
          העתקה
        </Btn>
      </div>
      <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13.5, cursor: 'pointer' }}>
        <input type="checkbox" checked={saved} onChange={(e) => setSaved(e.target.checked)} style={{ width: 'auto' }} />
        שמרתי את מפתח השחזור במקום בטוח
      </label>
      <div className="modal-actions">
        <Btn kind="primary" onClick={onClose} disabled={!saved}>
          סיום
        </Btn>
      </div>
    </Modal>
  );
}

function EnableForm({ onDone }: { onDone: () => void }) {
  const enableEncryption = useApp((s) => s.enableEncryption);
  const [pw, setPw] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [recovery, setRecovery] = useState('');

  const go = async () => {
    if (busy) return;
    if (!pwLongEnough(pw)) return setError('סיסמת ההצפנה חייבת להיות לפחות 6 תווים (מומלץ משפט-סיסמה חזק)');
    if (pw !== confirm) return setError('הסיסמאות אינן תואמות');
    setBusy(true);
    try {
      const key = await enableEncryption(pw);
      setRecovery(key);
    } catch {
      setError('הפעלת ההצפנה נכשלה — נסו שוב');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div>
      <div className="form-grid">
        <Field label="סיסמת הצפנה (6+ תווים)">
          <TextInput value={pw} onChange={setPw} type="password" dir="ltr" />
        </Field>
        <Field label="אישור סיסמה">
          <TextInput value={confirm} onChange={setConfirm} type="password" dir="ltr" />
        </Field>
      </div>
      <FormError error={error} />
      <div style={{ display: 'flex', gap: 8, marginTop: 6 }}>
        <Btn kind="primary" sm onClick={() => void go()} disabled={busy}>
          {busy ? 'מצפין…' : 'הפעלת הצפנה'}
        </Btn>
        <Btn sm onClick={onDone}>ביטול</Btn>
      </div>
      {recovery && (
        <RecoveryModal
          code={recovery}
          onClose={() => {
            setRecovery('');
            onDone();
          }}
        />
      )}
    </div>
  );
}

function ChangePwForm({ onDone }: { onDone: () => void }) {
  const changePw = useApp((s) => s.changeEncryptionPassword);
  const toast = useApp((s) => s.toast);
  const [oldPw, setOldPw] = useState('');
  const [pw, setPw] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const go = async () => {
    if (busy) return;
    if (!pwLongEnough(pw)) return setError('הסיסמה החדשה חייבת להיות לפחות 6 תווים');
    if (pw !== confirm) return setError('הסיסמאות אינן תואמות');
    setBusy(true);
    const ok = await changePw(oldPw, pw);
    setBusy(false);
    if (!ok) return setError('הסיסמה הנוכחית שגויה');
    toast('סיסמת ההצפנה עודכנה ✓');
    onDone();
  };

  return (
    <div>
      <Field label="סיסמה נוכחית">
        <TextInput value={oldPw} onChange={setOldPw} type="password" dir="ltr" />
      </Field>
      <div className="form-grid">
        <Field label="סיסמה חדשה (6+)">
          <TextInput value={pw} onChange={setPw} type="password" dir="ltr" />
        </Field>
        <Field label="אישור סיסמה חדשה">
          <TextInput value={confirm} onChange={setConfirm} type="password" dir="ltr" />
        </Field>
      </div>
      <FormError error={error} />
      <div style={{ display: 'flex', gap: 8, marginTop: 6 }}>
        <Btn kind="primary" sm onClick={() => void go()} disabled={busy}>
          שמירה
        </Btn>
        <Btn sm onClick={onDone}>ביטול</Btn>
      </div>
    </div>
  );
}

export function EncryptionSection() {
  const encrypted = useApp((s) => s.encrypted);
  const disableEncryption = useApp((s) => s.disableEncryption);
  const cloudOn = useApp((s) => s.cloud.enabled);
  const [enabling, setEnabling] = useState(false);
  const [changing, setChanging] = useState(false);

  const disable = () => {
    if (window.confirm('לבטל את ההצפנה? הנתונים יישמרו שוב גלויים במכשיר.')) void disableEncryption();
  };

  return (
    <Section
      id="sec-encryption"
      title="🔐 הצפנת נתונים"
      sub="הצפנה אמיתית של הנתונים במכשיר — מוגנת בסיסמה, עם מפתח שחזור חד-פעמי"
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
        <span
          style={{
            fontSize: 12,
            fontWeight: 700,
            padding: '2px 10px',
            borderRadius: 999,
            border: '1px solid var(--line)',
            color: encrypted ? 'var(--green)' : 'var(--ink-faint)',
          }}
        >
          {encrypted ? '✓ הצפנה פעילה' : 'לא מוצפן'}
        </span>
      </div>

      {!encrypted && !enabling && (
        <Btn kind="primary" sm onClick={() => setEnabling(true)}>
          הפעלת הצפנה
        </Btn>
      )}
      {!encrypted && enabling && <EnableForm onDone={() => setEnabling(false)} />}

      {encrypted && !changing && (
        <div style={{ display: 'flex', gap: 8 }}>
          <Btn sm kind="primary" onClick={() => setChanging(true)}>
            החלפת סיסמה
          </Btn>
          <Btn sm onClick={disable}>ביטול הצפנה</Btn>
        </div>
      )}
      {encrypted && changing && <ChangePwForm onDone={() => setChanging(false)} />}

      {cloudOn && (
        <SectionNote>
          שימו לב: ההצפנה מגנה על העותק המקומי במכשיר. סנכרון הענן הוא ערוץ נפרד.
        </SectionNote>
      )}
      <SectionNote>
        ההצפנה חלה על השמירה במכשיר ועל קובצי הגיבוי. <b>שמרו את מפתח השחזור</b> — אם תשכחו את
        הסיסמה ואת המפתח, הנתונים אבודים לצמיתות (אין דלת אחורית). מומלץ בנוסף לשמור גיבוי.
      </SectionNote>
    </Section>
  );
}
