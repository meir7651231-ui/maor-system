/**
 * טופס תומכ/ת — כרטיס מלא: פרטי קשר, ת"ז (עם ספרת ביקורת), קטגוריה,
 * ייעוד התרומה והערות. יצירה ועריכה באותו מודאל.
 */
import { useState } from 'react';
import type { Supporter } from '../../types/domain';
import { useApp } from '../../store/useApp';
import { normSearch, validIsraeliId } from '../../lib/validate';
import { Btn, Field, FormError, Modal, TextInput } from '../ui';
import { fixPhone } from './lib';

export interface SupporterFormProps {
  /** null — תומכת חדשה. */
  supporter: Supporter | null;
  /** נסגר עם id כשנוצרה תומכת חדשה (לפתיחת הכרטיס). */
  onClose: (newId?: string) => void;
}

export function SupporterForm(props: SupporterFormProps) {
  const upsertSupporter = useApp((s) => s.upsertSupporter);
  const nextId = useApp((s) => s.nextId);
  const toast = useApp((s) => s.toast);

  const sp = props.supporter;
  const [f, setF] = useState({
    name: sp?.name ?? '',
    phone: sp?.phone ?? '',
    email: sp?.email ?? '',
    address: sp?.address ?? '',
    idNum: sp?.idNum ?? '',
    cat: sp?.cat ?? '',
    forWho: sp?.forWho ?? '',
    notes: sp?.notes ?? '',
  });
  const [error, setError] = useState('');

  const set = (k: keyof typeof f) => (v: string) => setF({ ...f, [k]: v });

  function save() {
    if (!f.name.trim()) {
      setError('שם התומכ/ת הוא שדה חובה');
      return;
    }
    const idn = f.idNum.trim();
    if (idn && !validIsraeliId(idn.replace(/\D/g, ''))) {
      setError('ת"ז לא תקינה — ספרת ביקורת שגויה');
      return;
    }
    const vals = {
      name: f.name.trim(),
      phone: fixPhone(f.phone.trim()),
      email: f.email.trim(),
      address: f.address.trim(),
      idNum: idn,
      cat: f.cat.trim(),
      forWho: f.forWho.trim(),
      notes: f.notes.trim(),
    };

    if (sp) {
      upsertSupporter({ ...sp, ...vals });
      toast('כרטיס התומכ/ת עודכן — משתקף מיד בטבלה, בחיפוש ובגיבוי');
      props.onClose();
      return;
    }

    // מניעת כפילות — שם מנורמל זהה + טלפון תואם (או חסר), כמו במקור
    const digits = vals.phone.replace(/\D/g, '');
    const dup = useApp
      .getState()
      .db.supporters.some(
        (x) =>
          normSearch(x.name) === normSearch(vals.name) &&
          (!digits || !x.phone || x.phone.replace(/\D/g, '') === digits),
      );
    if (dup) {
      setError('תומכת בשם הזה כבר קיימת — פתחו את הכרטיס שלה מהטבלה');
      return;
    }

    const id = nextId('sp');
    upsertSupporter({
      id,
      ...vals,
      count: 0,
      ils: 0,
      usd: 0,
      first: '',
      last: '',
      nextDate: '',
      donations: [],
    });
    toast('התומכת "' + vals.name + '" נוספה — אפשר לרשום לה תרומה בכרטיס');
    props.onClose(id);
  }

  return (
    <Modal
      title={sp ? 'כרטיס תומכ/ת — עריכה מלאה' : 'תומכת חדשה — כרטיס מלא'}
      onClose={() => props.onClose()}
    >
      <FormError error={error} />
      <div className="form-grid">
        <Field label="שם מלא *">
          <TextInput value={f.name} onChange={set('name')} placeholder="שם התומכ/ת או המשפחה" />
        </Field>
        <Field label="טלפון">
          <TextInput value={f.phone} onChange={set('phone')} dir="ltr" placeholder="050-0000000" />
        </Field>
        <Field label="אימייל">
          <TextInput value={f.email} onChange={set('email')} dir="ltr" type="email" />
        </Field>
        <Field label='ת"ז'>
          <TextInput value={f.idNum} onChange={set('idNum')} dir="ltr" placeholder="לקבלות מס" />
        </Field>
        <Field label="כתובת">
          <TextInput value={f.address} onChange={set('address')} />
        </Field>
        <Field label="קטגוריה">
          <TextInput value={f.cat} onChange={set('cat')} placeholder="קרן / עסק / פרטי…" />
        </Field>
        <Field label="ייעוד התרומה (עבור)">
          <TextInput value={f.forWho} onChange={set('forWho')} placeholder="מלגות, פעילות, כללי…" />
        </Field>
        <Field label="הערות">
          <TextInput value={f.notes} onChange={set('notes')} />
        </Field>
      </div>
      <div className="modal-actions">
        <Btn kind="primary" onClick={save}>
          שמירה
        </Btn>
        <Btn onClick={() => props.onClose()}>ביטול</Btn>
      </div>
    </Modal>
  );
}
