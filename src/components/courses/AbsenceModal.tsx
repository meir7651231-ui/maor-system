/**
 * רישום חיסור (כרטיס חוג / כרטיס משפחה) — נימוק חובה; ביטול מוקדם (48+ שעות
 * לפני המפגש הבא) **או חיסור מוצדק** זכאי להשלמה והניקוב לא יורד; ביטול מאוחר
 * לא-מוצדק / No-Show מוריד ניקוב בכרטיסייה ומעדכן את מדד האמינות.
 *
 * ציד-באגים 3.8.2026 (🟡 #7): מודאל זה עקף את makeupEligibility ולא נשא את שדה
 * justified — ולכן חיסור-מוצדק שנרשם מהכרטיס (במקום מהיומן) לא היה זכאי-להשלמה
 * ואיבד ניקוב, בעוד אותו חיסור מהיומן כן. אוחד לאותה נגזרת (makeupEligibility)
 * ולאותו שדה justified כמו DiaryAbsenceModal — זכאות זהה בכל המשטחים.
 */
import { useState } from 'react';
import type { Course } from '../../types/domain';
import { useApp } from '../../store/useApp';
import { featureOn } from '../../lib/config';
import { Btn, Field, FormError, Modal, Select, TextInput } from '../ui';
import { isoToday, nextSessionDate } from './lib';
import { ABSENCE_REASON_CHIPS, makeupEligibility } from '../diary/lib';

export function AbsenceModal(props: { enrollmentId: string; course: Course; onClose: () => void }) {
  const db = useApp((s) => s.db);
  const config = useApp((s) => s.config);
  const upsertEnrollment = useApp((s) => s.upsertEnrollment);
  const addCred = useApp((s) => s.addCred);
  const toast = useApp((s) => s.toast);

  const [reason, setReason] = useState('');
  const [kind, setKind] = useState<'cancel' | 'noshow'>('cancel');
  const [justified, setJustified] = useState(false);
  const [error, setError] = useState('');

  const ns = nextSessionDate(props.course);
  const rawHrs = ns ? (ns.getTime() - Date.now()) / 3600000 : null;
  const { eligible } = makeupEligibility(kind, justified, rawHrs);

  function save() {
    const en = db.enrollments.find((e) => e.id === props.enrollmentId);
    if (!en) return props.onClose();
    if (!reason.trim()) return setError('נימוק הוא שדה חובה');
    const { eligible: elig, dropsPunch } = makeupEligibility(kind, justified, rawHrs);
    const punchDown = dropsPunch && en.plan === 'punch' && en.status === 'active' && en.used < en.purchased;
    upsertEnrollment({
      ...en,
      absences: [
        {
          date: isoToday(),
          reason: reason.trim(),
          makeup: elig,
          noshow: kind === 'noshow',
          justified: kind !== 'noshow' && justified,
        },
        ...en.absences,
      ],
      used: punchDown ? en.used + 1 : en.used,
    });
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
          : 'החיסור נרשם' + (punchDown ? ' והניקוב ירד' : ''),
    );
    props.onClose();
  }

  return (
    <Modal title="רישום חיסור" onClose={props.onClose}>
      <Field label="סוג החיסור">
        <Select
          value={kind}
          onChange={(v) => setKind(v === 'noshow' ? 'noshow' : 'cancel')}
          options={[
            { value: 'cancel', label: 'ביטול בהודעה מראש' },
            { value: 'noshow', label: 'No-Show — לא הגיע/ה ללא הודעה' },
          ]}
        />
      </Field>
      {kind === 'cancel' && featureOn(config, 'courses.makeup.justified') && (
        <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, margin: '2px 0 10px', cursor: 'pointer' }}>
          <input type="checkbox" checked={justified} onChange={(e) => setJustified(e.currentTarget.checked)} />
          <span>חיסור מוצדק (מחלה / אירוע משפחתי) — זכאי/ת להשלמה גם מתחת ל-48 שעות</span>
        </label>
      )}
      <Field label="נימוק *">
        <TextInput value={reason} onChange={setReason} placeholder="לדוגמה: מחלה, אירוע משפחתי…" />
        {/* צ'יפי-הנימוק המשותפים — קליק במקום הקלדה, עריכה חופשית נשארת */}
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 6 }}>
          {ABSENCE_REASON_CHIPS.map((c) => (
            <button key={c} type="button" className={'chip' + (reason === c ? ' on' : '')} onClick={() => setReason(c)}>
              {c}
            </button>
          ))}
        </div>
      </Field>
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
        {eligible
          ? justified
            ? '✓ חיסור מוצדק — זכאי/ת להשלמה, הניקוב לא יירד'
            : '✓ מעל 48 שעות מראש — זכאי/ת להשלמה, הניקוב לא יירד'
          : '⚠ ביטול מאוחר / No-Show — לא זכאי/ת להשלמה' +
            (kind !== 'noshow' && rawHrs != null ? ' (בעוד ' + Math.round(rawHrs) + ' שעות)' : '')}
      </div>
      <FormError error={error} />
      <div className="modal-actions">
        <Btn kind="primary" onClick={save}>
          רישום חיסור
        </Btn>
        <Btn onClick={props.onClose}>ביטול</Btn>
      </div>
    </Modal>
  );
}
