/**
 * רישום חיסור — נימוק חובה; ביטול מוקדם (48+ שעות לפני המפגש הבא) זכאי להשלמה,
 * ביטול מאוחר / No-Show מוריד ניקוב בכרטיסייה ומעדכן את מדד האמינות.
 */
import { useState } from 'react';
import type { Course } from '../../types/domain';
import { useApp } from '../../store/useApp';
import { Btn, Field, FormError, Modal, Select, TextInput } from '../ui';
import { isoToday, nextSessionDate } from './lib';

export function AbsenceModal(props: { enrollmentId: string; course: Course; onClose: () => void }) {
  const db = useApp((s) => s.db);
  const upsertEnrollment = useApp((s) => s.upsertEnrollment);
  const addCred = useApp((s) => s.addCred);
  const toast = useApp((s) => s.toast);

  const [reason, setReason] = useState('');
  const [kind, setKind] = useState<'cancel' | 'noshow'>('cancel');
  const [error, setError] = useState('');

  function save() {
    const en = db.enrollments.find((e) => e.id === props.enrollmentId);
    if (!en) return props.onClose();
    if (!reason.trim()) return setError('נימוק הוא שדה חובה');
    const ns = nextSessionDate(props.course);
    const eligible = ns ? (ns.getTime() - Date.now()) / 3600000 >= 48 : false;
    const punchDown = (kind === 'noshow' || !eligible) && en.plan === 'punch' && en.used < en.purchased;
    upsertEnrollment({
      ...en,
      absences: [
        { date: isoToday(), reason: reason.trim(), makeup: eligible && kind !== 'noshow', noshow: kind === 'noshow' },
        ...en.absences,
      ],
      used: punchDown ? en.used + 1 : en.used,
    });
    const fam = db.families.find((f) => f.members.some((m) => m.id === en.memberId));
    if (fam) {
      if (kind === 'noshow') addCred(fam.id, -20, 'No-Show: ' + props.course.name);
      else if (!eligible) addCred(fam.id, -10, 'ביטול מאוחר (<48 שעות)');
      else addCred(fam.id, 0, 'ביטול מוקדם — שימור ניקוד');
    }
    toast(
      kind === 'noshow'
        ? 'No-Show נרשם (-20 אמינות)'
        : eligible
          ? 'החיסור נרשם — זכאי/ת להשלמה'
          : 'החיסור נרשם' + (en.plan === 'punch' ? ' והניקוב ירד' : ''),
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
      <Field label="נימוק *">
        <TextInput value={reason} onChange={setReason} placeholder="לדוגמה: מחלה, אירוע משפחתי…" />
      </Field>
      <div style={{ fontSize: 12, color: 'var(--ink-faint)', marginBottom: 12 }}>
        ביטול מוקדם (48+ שעות לפני המפגש) שומר על הניקוב ומזכה בשיעור השלמה.
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
