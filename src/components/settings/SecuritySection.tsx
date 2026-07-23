/**
 * הגדרות ← נעילת גישה — ניהול שני קודים:
 * ראשית (כניסה לכל המערכת) ומשנית ("מנהל", לאזורים רגישים + בחירת אזורים).
 * הקוד נשמר מגובב במכשיר בלבד (localStorage, ראה lib/lock) — לא בגיבוי ולא
 * בענן. הגנת-גישה מפני עיון מזדמן, לא הצפנת נתונים.
 */
import { useState } from 'react';
import { useApp } from '../../store/useApp';
import { Btn, Chip, Field, FormError, TextInput } from '../ui';
import { Section, SectionNote } from './lib';
import { isValidPin, LOCK_ZONES, DEFAULT_LOCK_ZONES } from '../../lib/lock';

function CodeManager({ kind, title, desc }: { kind: 'primary' | 'secondary'; title: string; desc: string }) {
  const isSet = useApp((s) => !!s.lock[kind]);
  const setLockCode = useApp((s) => s.setLockCode);
  const toast = useApp((s) => s.toast);

  const [open, setOpen] = useState(false);
  const [pin, setPin] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const reset = () => {
    setPin('');
    setConfirm('');
    setError('');
    setOpen(false);
  };

  const save = async () => {
    if (busy) return;
    if (!isValidPin(pin)) return setError('הקוד חייב להיות 4–8 ספרות');
    if (pin !== confirm) return setError('הקודים אינם תואמים');
    setBusy(true);
    await setLockCode(kind, pin);
    setBusy(false);
    toast(isSet ? 'הקוד עודכן ✓' : 'הקוד נקבע — הנעילה פעילה ✓');
    reset();
  };

  const remove = async () => {
    if (busy) return;
    if (!window.confirm('להסיר את הקוד? הנעילה תבוטל.')) return;
    setBusy(true);
    await setLockCode(kind, null);
    setBusy(false);
    toast('הקוד הוסר — הנעילה בוטלה');
    reset();
  };

  return (
    <div style={{ border: '1px solid var(--line)', borderRadius: 10, padding: 12, marginBottom: 10 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
        <b style={{ flex: 1, minWidth: 0 }}>{title}</b>
        <span
          style={{
            fontSize: 12,
            fontWeight: 700,
            padding: '2px 10px',
            borderRadius: 999,
            border: '1px solid var(--line)',
            color: isSet ? 'var(--green)' : 'var(--ink-faint)',
          }}
        >
          {isSet ? '✓ מוגדר' : 'כבוי'}
        </span>
      </div>
      <p style={{ fontSize: 12.5, color: 'var(--ink-faint)', margin: '4px 0 8px' }}>{desc}</p>

      {!open ? (
        <div style={{ display: 'flex', gap: 8 }}>
          <Btn sm kind="primary" onClick={() => setOpen(true)}>
            {isSet ? 'שינוי קוד' : 'קביעת קוד'}
          </Btn>
          {isSet && (
            <Btn sm onClick={() => void remove()}>
              הסרת קוד
            </Btn>
          )}
        </div>
      ) : (
        <div>
          <div className="form-grid">
            <Field label="קוד (4–8 ספרות)">
              <TextInput value={pin} onChange={setPin} type="password" dir="ltr" placeholder="••••" />
            </Field>
            <Field label="אישור הקוד">
              <TextInput value={confirm} onChange={setConfirm} type="password" dir="ltr" placeholder="••••" />
            </Field>
          </div>
          <FormError error={error} />
          <div style={{ display: 'flex', gap: 8, marginTop: 6 }}>
            <Btn sm kind="primary" onClick={() => void save()} disabled={busy}>
              שמירה
            </Btn>
            <Btn sm onClick={reset}>ביטול</Btn>
          </div>
        </div>
      )}
    </div>
  );
}

function SecondaryZones() {
  const secondarySet = useApp((s) => !!s.lock.secondary);
  const zones = useApp((s) => s.lock.zones);
  const setLockZones = useApp((s) => s.setLockZones);
  if (!secondarySet) return null;
  const active = zones ?? DEFAULT_LOCK_ZONES;
  const toggle = (key: string) =>
    setLockZones(active.includes(key) ? active.filter((z) => z !== key) : [...active, key]);
  return (
    <Field label="אזורים שהקוד המשני מגן עליהם">
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
        {LOCK_ZONES.map((z) => (
          <Chip key={z.key} on={active.includes(z.key)} onClick={() => toggle(z.key)}>
            {z.label}
          </Chip>
        ))}
      </div>
    </Field>
  );
}

function LockNowButton() {
  const hasCode = useApp((s) => !!s.lock.primary || !!s.lock.secondary);
  const lockNow = useApp((s) => s.lockNow);
  if (!hasCode) return null;
  return (
    <div style={{ marginBottom: 10 }}>
      <Btn kind="primary" onClick={lockNow}>
        🔒 נעילה עכשיו
      </Btn>
      <span style={{ fontSize: 12, color: 'var(--ink-faint)', marginInlineStart: 8 }}>
        נועל מיד — הכניסה הבאה תדרוש קוד.
      </span>
    </div>
  );
}

export function SecuritySection() {
  return (
    <Section
      id="sec-security"
      title="🔒 נעילת גישה"
      sub="קוד כניסה למערכת וקוד מנהל לאזורים רגישים · הדמו נשאר פתוח כל עוד לא נקבע קוד"
    >
      <LockNowButton />
      <CodeManager
        kind="primary"
        title="🔒 נעילה ראשית — כניסה למערכת"
        desc="בלי הקוד הזה אי אפשר להיכנס למערכת כלל. נדרש פעם אחת בכל פתיחת דפדפן."
      />
      <CodeManager
        kind="secondary"
        title="🔐 נעילה משנית — קוד מנהל"
        desc="קוד נוסף שמגן על האזורים הרגישים (למטה). מאפשר לתת גישה יומיומית בלי לחשוף ניהול."
      />
      <SecondaryZones />
      <SectionNote>
        הקודים נשמרים מגובבים <b>במכשיר הזה בלבד</b> — לא בגיבוי ולא בענן, כך שכל מכשיר נועל בנפרד.
        זו הגנת-גישה מפני עיון מזדמן, לא הצפנת נתונים (מי שניגש למכשיר טכנית יכול לעקוף).
        שכחתם קוד? במסך הנעילה יש "שכחתי את הקוד" — איפוס מקומי בלי לאבד נתונים.
      </SectionNote>
    </Section>
  );
}
