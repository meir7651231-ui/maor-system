/**
 * הגדרות ← הצפנת-ענן (opt-in · אשכול-הפעלה SHOP10) — מגודר למייל-על בלבד.
 * מפעיל הצפנה על עותק-הענן: סיסמת-הצפנה (≠ סיסמת-הכניסה) + מפתח-שחזור חד-פעמי.
 * ההפעלה מגבה מקומית (כפוי) ואז מריצה מיגרציה שכותבת מחדש את כל מסמכי-הענן
 * מוצפנים. אין דלת-אחורית — בלי הסיסמה/מפתח-השחזור אין פענוח לעותק-הענן.
 *
 * ⚠️ הבעלים מפעיל ומריץ — הסיסמה נבחרת ומוזנת על-ידיו בלבד (לא בקוד).
 */
import { useState } from 'react';
import { useApp } from '../../store/useApp';
import { isSuperAdmin } from '../../lib/config';
import { Btn, Field, FormError, Modal, TextInput } from '../ui';
import { Section, SectionNote } from './lib';

function pwLongEnough(pw: string): boolean {
  return pw.length >= 8;
}

/** מודאל מפתח-שחזור חד-פעמי + אישור "שמרתי". */
function RecoveryModal({ code, onClose }: { code: string; onClose: () => void }) {
  const [saved, setSaved] = useState(false);
  return (
    <Modal title="🔑 מפתח שחזור לענן — שמרו אותו עכשיו" onClose={onClose}>
      <p style={{ fontSize: 13.5, lineHeight: 1.6, marginBottom: 10 }}>
        זהו <b>מפתח השחזור</b> של הצפנת-הענן. אם תשכחו את סיסמת-ההצפנה — זו הדרך <b>היחידה</b> לפתוח
        את עותק-הענן. הוא מוצג פעם אחת בלבד. העתיקו אותו למקום בטוח (מנהל סיסמאות, פתק נעול).
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
  const enableCloudEncryption = useApp((s) => s.enableCloudEncryption);
  const toast = useApp((s) => s.toast);
  const [pw, setPw] = useState('');
  const [confirm, setConfirm] = useState('');
  const [ack, setAck] = useState(false);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [recovery, setRecovery] = useState('');

  const go = async () => {
    if (busy) return;
    if (!pwLongEnough(pw)) return setError('סיסמת ההצפנה חייבת להיות לפחות 8 תווים (מומלץ משפט-סיסמה חזק)');
    if (pw !== confirm) return setError('הסיסמאות אינן תואמות');
    if (!ack) return setError('יש לאשר שהבנתם — בלי הסיסמה/מפתח-השחזור אין שחזור');
    setError('');
    setBusy(true);
    try {
      // מוריד גיבוי כפוי, כותב envelope, ומריץ מיגרציה על עותק-הענן
      const key = await enableCloudEncryption(pw);
      toast('הצפנת-הענן הופעלה — גיבוי הורד, כל הנתונים הוצפנו ✓');
      setRecovery(key);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'הפעלת הצפנת-הענן נכשלה — נסו שוב');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div>
      <SectionNote>
        <b>לפני שמפעילים:</b> ודאו שאף מכשיר אחר אינו עובד כרגע. בלחיצה יורד גיבוי מקומי מלא
        אוטומטית, ואז כל מסמכי-הענן נכתבים מחדש מוצפנים. שמרו את מפתח-השחזור שיוצג.
      </SectionNote>
      <div className="form-grid">
        <Field label="סיסמת הצפנת-ענן (8+ תווים)">
          <TextInput value={pw} onChange={setPw} type="password" dir="ltr" />
        </Field>
        <Field label="אישור סיסמה">
          <TextInput value={confirm} onChange={setConfirm} type="password" dir="ltr" />
        </Field>
      </div>
      <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, cursor: 'pointer', margin: '6px 0' }}>
        <input type="checkbox" checked={ack} onChange={(e) => setAck(e.target.checked)} style={{ width: 'auto' }} />
        אני מבין/ה: בלי הסיסמה או מפתח-השחזור לא ניתן לפענח את עותק-הענן.
      </label>
      <FormError error={error} />
      <div style={{ display: 'flex', gap: 8, marginTop: 6 }}>
        <Btn kind="primary" sm onClick={() => void go()} disabled={busy}>
          {busy ? 'מגבה ומצפין…' : 'הפעלת הצפנת-ענן'}
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

export function CloudEncryptionSection() {
  const cloudUser = useApp((s) => s.cloud.user);
  const cloudOn = useApp((s) => s.cloud.enabled);
  const cloudEncrypted = useApp((s) => s.cloud.cloudEncrypted);
  const [enabling, setEnabling] = useState(false);

  // מגודר למייל-על בלבד — לא נחשף לאף לקוח (isSuperAdmin, לא isAdminUser).
  if (!isSuperAdmin(cloudUser?.email)) return null;

  return (
    <Section
      id="sec-cloud-encryption"
      title="☁️🔐 הצפנת-ענן"
      sub="הצפנת עותק-הענן במנוחה — סיסמת-הצפנה נפרדת + מפתח-שחזור (opt-in)"
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
        <span
          style={{
            fontSize: 12,
            fontWeight: 700,
            padding: '2px 10px',
            borderRadius: 999,
            border: '1px solid var(--line)',
            color: cloudEncrypted ? 'var(--green)' : 'var(--ink-faint)',
          }}
        >
          {cloudEncrypted ? '✓ הצפנת-ענן פעילה' : 'עותק-הענן אינו מוצפן'}
        </span>
      </div>

      {!cloudOn && (
        <SectionNote>הצפנת-ענן זמינה רק כשהענן מחובר (התחברו לענן תחילה).</SectionNote>
      )}

      {cloudOn && !cloudEncrypted && !enabling && (
        <Btn kind="primary" sm onClick={() => setEnabling(true)}>
          הפעלת הצפנת-ענן
        </Btn>
      )}
      {cloudOn && !cloudEncrypted && enabling && <EnableForm onDone={() => setEnabling(false)} />}

      {cloudOn && cloudEncrypted && (
        <SectionNote>
          עותק-הענן מוצפן. מכשיר חדש שייכנס יתבקש את סיסמת-ההצפנה פעם אחת (מסך פתיחה).
        </SectionNote>
      )}

      <SectionNote>
        ⚠️ נדרש פרסום כלל Firestore ל-<code>_enc</code> (בעלים בלבד). <b>שמרו את מפתח-השחזור</b> —
        בלי הסיסמה והמפתח, עותק-הענן אבוד לצמיתות (אין דלת אחורית). ההצפנה המקומית היא ערוץ נפרד.
      </SectionNote>
    </Section>
  );
}
