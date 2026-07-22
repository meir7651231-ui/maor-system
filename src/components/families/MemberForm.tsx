/**
 * טופס בן/בת משפחה — כל שדות Member: לידה עם תצוגת תאריך עברי חי,
 * מידע רפואי, הסכמות תיעוד ומדיה (צ'יפים) ות"ז עם ספרת ביקורת.
 */
import { useState } from 'react';
import type { Gender, Member } from '../../types/domain';
import { useApp } from '../../store/useApp';
import { featureOn } from '../../lib/config';
import { validIsraeliId } from '../../lib/validate';
import { hebDateFull } from '../../lib/hebrew';
import { Btn, Chip, Field, FormError, Modal, Select, TextInput } from '../ui';
import { HebDateInput } from '../HebDateInput';
import { ageOf } from './lib';

const MEDIA: { key: keyof MemberMedia; label: string }[] = [
  { key: 'mSefach', label: 'ספח' },
  { key: 'mInvite', label: 'הזמנה' },
  { key: 'mRecommend', label: 'המלצה' },
  { key: 'mPhotos', label: 'תמונות' },
  { key: 'mVideos', label: 'סרטונים' },
];

interface MemberMedia {
  mSefach: boolean;
  mInvite: boolean;
  mRecommend: boolean;
  mPhotos: boolean;
  mVideos: boolean;
}

interface MemberFormState extends MemberMedia {
  first: string;
  gender: Gender;
  birth: string;
  idNum: string;
  phone: string;
  phone2: string;
  school: string;
  grade: string;
  health: string;
  notes: string;
}

function initState(member: Member | null): MemberFormState {
  return {
    first: member?.first ?? '',
    gender: member?.gender ?? 'm',
    birth: member?.birth ?? '',
    idNum: member?.idNum ?? '',
    phone: member?.phone ?? '',
    phone2: member?.phone2 ?? '',
    school: member?.school ?? '',
    grade: member?.grade ?? '',
    health: member?.health ?? '',
    mSefach: member?.mSefach ?? false,
    mInvite: member?.mInvite ?? false,
    mRecommend: member?.mRecommend ?? false,
    mPhotos: member?.mPhotos ?? false,
    mVideos: member?.mVideos ?? false,
    notes: member?.notes ?? '',
  };
}

export function MemberForm(props: { famId: string; member: Member | null; onClose: () => void }) {
  const upsertMember = useApp((s) => s.upsertMember);
  const nextId = useApp((s) => s.nextId);
  const toast = useApp((s) => s.toast);
  const config = useApp((s) => s.config);
  const mediaOn = featureOn(config, 'families.media');

  const [f, setF] = useState<MemberFormState>(() => initState(props.member));
  const [error, setError] = useState('');

  const set = (patch: Partial<MemberFormState>) => setF((p) => ({ ...p, ...patch }));

  const age = ageOf(f.birth);
  const hebLine = f.birth
    ? (f.gender === 'f' ? 'בת ' : 'בן ') + (age ?? '') + ' · תאריך עברי: ' + hebDateFull(f.birth)
    : 'בחרו תאריך לידה — התאריך העברי יחושב אוטומטית';

  function save() {
    const first = f.first.trim();
    if (!first) return setError('שם פרטי הוא שדה חובה');
    if (f.idNum.trim() && !validIsraeliId(f.idNum.trim()))
      return setError('מספר ת"ז אינו תקין (ספרת ביקורת שגויה)');

    const member: Member = {
      id: props.member?.id ?? nextId('m'),
      first,
      gender: f.gender,
      birth: f.birth,
      idNum: f.idNum.trim(),
      phone: f.phone.trim(),
      phone2: f.phone2.trim(),
      school: f.school.trim(),
      grade: f.grade.trim(),
      health: f.health.trim(),
      mSefach: f.mSefach,
      mInvite: f.mInvite,
      mRecommend: f.mRecommend,
      mPhotos: f.mPhotos,
      mVideos: f.mVideos,
      notes: f.notes,
    };
    if (props.member?.isParent) member.isParent = true;
    upsertMember(props.famId, member);
    toast(props.member ? 'פרטי ' + first + ' עודכנו' : first + ' נוסף/ה למשפחה');
    props.onClose();
  }

  return (
    <Modal
      title={props.member ? 'עריכת ' + props.member.first : 'הוספת בן משפחה'}
      onClose={props.onClose}
    >
      <div className="form-grid">
        <Field label="שם פרטי *">
          <TextInput value={f.first} onChange={(v) => set({ first: v })} />
        </Field>
        <Field label="מין">
          <Select
            value={f.gender}
            onChange={(v) => set({ gender: v === 'f' ? 'f' : 'm' })}
            options={[
              { value: 'm', label: 'בן' },
              { value: 'f', label: 'בת' },
            ]}
          />
        </Field>
        <Field label="תאריך לידה">
          <HebDateInput value={f.birth} onChange={(iso) => set({ birth: iso })} />
        </Field>
        <Field label={'ת"ז (רשות)'}>
          <TextInput value={f.idNum} onChange={(v) => set({ idNum: v })} placeholder="9 ספרות" dir="ltr" />
        </Field>
      </div>
      <div
        style={{
          background: '#faf6ec',
          border: '1px solid #eee3c8',
          borderRadius: 10,
          padding: '8px 12px',
          fontSize: 12.5,
          fontWeight: 600,
          color: '#9a6414',
          marginBottom: 12,
        }}
      >
        <span style={{ color: '#b45309' }}>✦ </span>
        {hebLine}
      </div>
      <div className="form-grid">
        <Field label="טלפון 1">
          <TextInput value={f.phone} onChange={(v) => set({ phone: v })} placeholder="050-0000000" dir="ltr" />
        </Field>
        <Field label="טלפון 2">
          <TextInput value={f.phone2} onChange={(v) => set({ phone2: v })} dir="ltr" />
        </Field>
        <Field label="מוסד לימודים">
          <TextInput value={f.school} onChange={(v) => set({ school: v })} placeholder={'לדוגמה: ת"ת אור החיים'} />
        </Field>
        <Field label="כיתה">
          <TextInput value={f.grade} onChange={(v) => set({ grade: v })} placeholder="ה׳" />
        </Field>
      </div>
      <Field label="רגישויות / מידע רפואי">
        <TextInput value={f.health} onChange={(v) => set({ health: v })} placeholder="אלרגיות, תרופות, מגבלות…" />
      </Field>
      {mediaOn && (
        <Field label="תיעוד ומדיה — מה קיים בתיק?">
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7 }}>
            {MEDIA.map((mc) => (
              <Chip key={mc.key} on={f[mc.key]} onClick={() => set({ [mc.key]: !f[mc.key] } as Partial<MemberFormState>)}>
                {mc.label}
              </Chip>
            ))}
          </div>
        </Field>
      )}
      <Field label="הערות">
        <textarea rows={2} value={f.notes} onChange={(e) => set({ notes: e.target.value })} />
      </Field>
      <FormError error={error} />
      <div className="modal-actions">
        <Btn kind="primary" onClick={save}>
          שמירה
        </Btn>
        <Btn onClick={props.onClose}>ביטול</Btn>
      </div>
    </Modal>
  );
}
