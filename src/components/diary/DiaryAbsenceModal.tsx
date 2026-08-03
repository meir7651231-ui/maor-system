/**
 * רישום חיסור מתוך יומן החדרים — נימוק חובה; ביטול מוקדם (48+ שעות לפני
 * המפגש הבא) זכאי להשלמה; ביטול מאוחר / No-Show מוריד ניקוב בכרטיסייה
 * ומעדכן את מדד האמינות. שמירה דרך addAbsence + punch של ה-store.
 */
import { useState } from 'react';
import type { Course } from '../../types/domain';
import { useApp } from '../../store/useApp';
import { Btn, Field, FormError, Modal, Select, TextInput } from '../ui';
import { DAY_NAMES, isoToday, makeupEligibility, nextSessionDate, pad2 } from './lib';

export function DiaryAbsenceModal(props: {
  enrollmentId: string;
  course: Course;
  who: string;
  onClose: () => void;
}) {
  const db = useApp((s) => s.db);
  const addAbsence = useApp((s) => s.addAbsence);
  const punch = useApp((s) => s.punch);
  const addCred = useApp((s) => s.addCred);
  const toast = useApp((s) => s.toast);

  const [reason, setReason] = useState('');
  const [kind, setKind] = useState<'cancel' | 'noshow'>('cancel');
  const [justified, setJustified] = useState(false);
  const [error, setError] = useState('');

  const en = db.enrollments.find((e) => e.id === props.enrollmentId);
  if (!en) return null;

  const ns = nextSessionDate(props.course);
  const rawHrs = ns ? (ns.getTime() - Date.now()) / 3600000 : null;
  const hrs = rawHrs != null ? Math.round(rawHrs) : null;
  // #7: זכאות = מוצדק או ביטול-מוקדם (≥48ש׳); No-Show לעולם לא זכאי.
  const { eligible } = makeupEligibility(kind, justified, rawHrs);

  const sessionLabel = ns
    ? 'המפגש הקרוב: יום ' + DAY_NAMES[ns.getDay()] + ' ' + pad2(ns.getHours()) + ':' + pad2(ns.getMinutes()) + ' — בעוד ' + hrs + ' שעות'
    : '';
  const eligLabel = eligible
    ? (justified ? '✓ חיסור מוצדק — זכאי/ת להשלמה, הניקוב לא יירד' : '✓ מעל 48 שעות מראש — זכאי/ת להשלמה, הניקוב לא יירד')
    : '⚠ רשלנות / פחות מ-48 שעות — לא זכאי/ת להשלמה' + (en.plan === 'punch' && en.status === 'active' ? ', הניקוב יירד' : '');

  function save() {
    if (!en) return props.onClose();
    if (!reason.trim()) return setError('נימוק הוא שדה חובה');
    const { eligible: elig, dropsPunch } = makeupEligibility(kind, justified, rawHrs);
    addAbsence(en.id, {
      date: isoToday(),
      reason: reason.trim(),
      makeup: elig,
      noshow: kind === 'noshow',
      justified: kind !== 'noshow' && justified,
    });
    // רשלנות (ביטול מאוחר לא-מוצדק) / No-Show בכרטיסייה — הניקוב יורד
    if (dropsPunch && en.plan === 'punch' && en.status === 'active' && en.used < en.purchased) punch(en.id);
    const fam = db.families.find((f) => f.members.some((m) => m.id === en.memberId));
    if (fam) {
      if (kind === 'noshow') addCred(fam.id, -20, 'No-Show: ' + props.course.name);
      else if (elig) addCred(fam.id, 0, justified ? 'חיסור מוצדק — שימור ניקוד' : 'ביטול מוקדם — שימור ניקוד');
      else addCred(fam.id, -10, 'ביטול מאוחר (<48 שעות, לא מוצדק)');
    }
    toast(
      kind === 'noshow'
        ? 'No-Show נרשם (-20 אמינות)'
        : elig
          ? 'החיסור נרשם — זכאי/ת להשלמה'
          : 'החיסור נרשם' + (en.plan === 'punch' && en.status === 'active' ? ' והניקוב ירד' : ''),
    );
    props.onClose();
  }

  return (
    <Modal title="רישום חיסור" onClose={props.onClose}>
      <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 3 }}>{props.who}</div>
      {sessionLabel && <div style={{ fontSize: 12, color: 'var(--ink-faint)', marginBottom: 10 }}>{sessionLabel}</div>}
      <div
        style={{
          fontSize: 12.5,
          fontWeight: 700,
          padding: '8px 12px',
          borderRadius: 10,
          background: eligible ? '#e4f5ea' : '#fdf1d4',
          color: eligible ? '#12803c' : '#9a6414',
          marginBottom: 12,
        }}
      >
        {eligLabel}
      </div>
      <Field label="סוג ההיעדרות">
        <Select
          value={kind}
          onChange={(v) => setKind(v === 'noshow' ? 'noshow' : 'cancel')}
          options={[
            { value: 'cancel', label: 'ביטול מראש' },
            { value: 'noshow', label: 'לא הגיעה כלל — No-Show (‎-20 אמינות)' },
          ]}
        />
      </Field>
      {kind === 'cancel' && (
        <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, margin: '2px 0 10px', cursor: 'pointer' }}>
          <input type="checkbox" checked={justified} onChange={(e) => setJustified(e.currentTarget.checked)} />
          <span>חיסור מוצדק (מחלה / אירוע משפחתי) — זכאי/ת להשלמה גם מתחת ל-48 שעות</span>
        </label>
      )}
      <Field label="נימוק החיסור *">
        <TextInput value={reason} onChange={setReason} placeholder="לדוגמה: מחלה, אירוע משפחתי…" />
      </Field>
      <FormError error={error} />
      <div className="modal-actions">
        <Btn kind="primary" onClick={save}>
          שמירת חיסור
        </Btn>
        <Btn onClick={props.onClose}>ביטול</Btn>
      </div>
    </Modal>
  );
}
