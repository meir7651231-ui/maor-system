/**
 * טופס משפחה — יצירה ועריכה של כל שדות Family.
 * מצב משפחתי ושפה תומכים בדפוס '__other' (הקלדה חופשית); ת"ז הורים נבדקת עם ספרת ביקורת.
 */
import { useState } from 'react';
import { emptyFamily, type Family, type FamilyStatus } from '../../types/domain';
import { useApp } from '../../store/useApp';
import { validIsraeliId, formatIsraeliPhone } from '../../lib/validate';
import { Btn, Chip, Field, FormError, Modal, Select, TextInput } from '../ui';
import { isoToday, LANGUAGE_OPTIONS, MARITAL_OPTIONS, OTHER, OTHER_LABEL } from './lib';

interface FamFormState {
  name: string;
  father: string;
  fatherId: string;
  mother: string;
  motherId: string;
  phone: string;
  phone2: string;
  email: string;
  city: string;
  address: string;
  community: string;
  maritalSel: string;
  maritalOther: string;
  langSel: string;
  langOther: string;
  tzedaka: string;
  fullSefach: 'yes' | 'no';
  discount: string;
  status: FamilyStatus;
  notes: string;
}

function initState(family: Family | null): FamFormState {
  if (!family) {
    return {
      name: '',
      father: '',
      fatherId: '',
      mother: '',
      motherId: '',
      phone: '',
      phone2: '',
      email: '',
      city: '',
      address: '',
      community: 'חסידי',
      maritalSel: '',
      maritalOther: '',
      langSel: 'עברית',
      langOther: '',
      tzedaka: '',
      fullSefach: 'no',
      discount: '',
      status: 'active',
      notes: '',
    };
  }
  const maritalSel = !family.maritalStatus
    ? ''
    : MARITAL_OPTIONS.includes(family.maritalStatus)
      ? family.maritalStatus
      : OTHER;
  const langSel = !family.language
    ? 'עברית'
    : LANGUAGE_OPTIONS.includes(family.language)
      ? family.language
      : OTHER;
  return {
    name: family.name,
    father: family.father,
    fatherId: family.fatherId,
    mother: family.mother,
    motherId: family.motherId,
    phone: family.phone,
    phone2: family.phone2,
    email: family.email,
    city: family.city,
    address: family.address,
    community: family.community,
    maritalSel,
    maritalOther: maritalSel === OTHER ? family.maritalStatus : '',
    langSel,
    langOther: langSel === OTHER ? family.language : '',
    tzedaka: family.tzedaka,
    fullSefach: family.fullSefach ? 'yes' : 'no',
    discount: family.discount,
    status: family.status,
    notes: family.notes,
  };
}

export function FamilyForm(props: { family: Family | null; onClose: () => void }) {
  const upsertFamily = useApp((s) => s.upsertFamily);
  const selectFamily = useApp((s) => s.selectFamily);
  const nextId = useApp((s) => s.nextId);
  const toast = useApp((s) => s.toast);
  const families = useApp((s) => s.db.families);
  const communities = [...new Set(families.map((fam) => fam.community).filter(Boolean))];

  const [f, setF] = useState<FamFormState>(() => initState(props.family));
  const [error, setError] = useState('');

  const set = (patch: Partial<FamFormState>) => setF((p) => ({ ...p, ...patch }));

  function save() {
    const name = f.name.trim();
    if (!name) return setError('שם משפחה הוא שדה חובה');
    if (f.maritalSel === OTHER && !f.maritalOther.trim())
      return setError('בחרתם "אחר" במצב משפחתי — הקלידו את הערך');
    if (f.fatherId.trim() && !validIsraeliId(f.fatherId.trim()))
      return setError('ת"ז האב אינה תקינה (ספרת ביקורת שגויה)');
    if (f.motherId.trim() && !validIsraeliId(f.motherId.trim()))
      return setError('ת"ז האם אינה תקינה (ספרת ביקורת שגויה)');
    if (f.langSel === OTHER && !f.langOther.trim()) return setError('בחרתם שפה "אחר" — הקלידו את השפה');

    const fields = {
      name,
      father: f.father.trim(),
      fatherId: f.fatherId.trim(),
      mother: f.mother.trim(),
      motherId: f.motherId.trim(),
      // עקבי עם טופס התומכ/ת: מנרמלים לפורמט ישראלי בשמירה (0 מוביל, 972→0, מקפים)
      phone: formatIsraeliPhone(f.phone),
      phone2: formatIsraeliPhone(f.phone2),
      email: f.email.trim(),
      city: f.city.trim(),
      address: f.address.trim(),
      community: f.community.trim() || 'כללי',
      maritalStatus: f.maritalSel === OTHER ? f.maritalOther.trim() : f.maritalSel,
      language: f.langSel === OTHER ? f.langOther.trim() : f.langSel,
      tzedaka: f.tzedaka.trim(),
      fullSefach: f.fullSefach === 'yes',
      discount: f.discount.trim(),
      status: f.status,
      notes: f.notes,
    };

    if (props.family) {
      upsertFamily({ ...props.family, ...fields });
      toast('פרטי המשפחה עודכנו');
    } else {
      const id = nextId('f');
      upsertFamily({ ...emptyFamily(), ...fields, id, createdAt: isoToday() });
      selectFamily(id);
      toast('משפחת ' + name + ' נוצרה');
    }
    props.onClose();
  }

  return (
    <Modal title={props.family ? 'עריכת משפחה — ' + props.family.name : 'משפחה חדשה'} onClose={props.onClose} wide>
      <div className="form-grid">
        <Field label="שם משפחה *">
          <TextInput value={f.name} onChange={(v) => set({ name: v })} placeholder="כהן" />
        </Field>
        <Field label="טלפון ראשי">
          <TextInput value={f.phone} onChange={(v) => set({ phone: v })} placeholder="052-0000000" dir="ltr" />
        </Field>
        <Field label="שם האב">
          <TextInput value={f.father} onChange={(v) => set({ father: v })} />
        </Field>
        <Field label={'ת"ז האב'}>
          <TextInput value={f.fatherId} onChange={(v) => set({ fatherId: v })} placeholder="9 ספרות" dir="ltr" />
        </Field>
        <Field label="שם האם">
          <TextInput value={f.mother} onChange={(v) => set({ mother: v })} />
        </Field>
        <Field label={'ת"ז האם'}>
          <TextInput value={f.motherId} onChange={(v) => set({ motherId: v })} placeholder="9 ספרות" dir="ltr" />
        </Field>
        <Field label="טלפון נוסף">
          <TextInput value={f.phone2} onChange={(v) => set({ phone2: v })} dir="ltr" />
        </Field>
        <Field label="אימייל">
          <TextInput value={f.email} onChange={(v) => set({ email: v })} dir="ltr" />
        </Field>
        <Field label="כתובת">
          <TextInput value={f.address} onChange={(v) => set({ address: v })} placeholder="רחוב ומספר" />
        </Field>
        <Field label="עיר">
          <TextInput value={f.city} onChange={(v) => set({ city: v })} />
        </Field>
        <Field label="מצב משפחתי">
          <Select
            value={f.maritalSel}
            onChange={(v) => set({ maritalSel: v })}
            options={[
              { value: '', label: 'לא ידוע' },
              ...MARITAL_OPTIONS.map((o) => ({ value: o, label: o })),
              { value: OTHER, label: OTHER_LABEL },
            ]}
          />
        </Field>
        <Field label="שפה מדוברת">
          <Select
            value={f.langSel}
            onChange={(v) => set({ langSel: v })}
            options={[
              ...LANGUAGE_OPTIONS.map((o) => ({ value: o, label: o })),
              { value: OTHER, label: OTHER_LABEL },
            ]}
          />
        </Field>
        {f.maritalSel === OTHER && (
          <Field label="מצב משפחתי — אחר *">
            <TextInput
              value={f.maritalOther}
              onChange={(v) => set({ maritalOther: v })}
              placeholder="הקלידו מצב משפחתי…"
            />
          </Field>
        )}
        {f.langSel === OTHER && (
          <Field label="שפה — אחר *">
            <TextInput value={f.langOther} onChange={(v) => set({ langOther: v })} placeholder="הקלידו שפה…" />
          </Field>
        )}
        <Field label="תת-קהילה (בחירה או הקלדה)">
          <TextInput
            value={f.community}
            onChange={(v) => set({ community: v })}
            placeholder="בחרו מהרשימה או הקלידו חדשה…"
          />
        </Field>
        <Field label="קופת צדקה">
          <TextInput value={f.tzedaka} onChange={(v) => set({ tzedaka: v })} placeholder="לדוגמה: קופת העיר" />
        </Field>
        <Field label="הנחה">
          <TextInput value={f.discount} onChange={(v) => set({ discount: v })} placeholder="לדוגמה: הנחת אחים 10%" />
        </Field>
        <Field label="ספח מלא">
          <Select
            value={f.fullSefach}
            onChange={(v) => set({ fullSefach: v === 'yes' ? 'yes' : 'no' })}
            options={[
              { value: 'no', label: 'חסר' },
              { value: 'yes', label: 'קיים ✓' },
            ]}
          />
        </Field>
        <Field label="סטטוס">
          <Select
            value={f.status}
            onChange={(v) => set({ status: v === 'pending' ? 'pending' : v === 'inactive' ? 'inactive' : 'active' })}
            options={[
              { value: 'active', label: 'פעילה' },
              { value: 'pending', label: 'ממתינה' },
              { value: 'inactive', label: 'לא פעילה' },
            ]}
          />
        </Field>
      </div>
      {communities.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 12, alignItems: 'center' }}>
          <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--ink-faint)' }}>תת-קהילות קיימות:</span>
          {communities.map((c) => (
            <Chip key={c} on={f.community === c} onClick={() => set({ community: c })}>
              {c}
            </Chip>
          ))}
        </div>
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
