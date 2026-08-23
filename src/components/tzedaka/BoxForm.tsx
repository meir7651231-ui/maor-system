/**
 * טופס קופה (קופות 4) — מספר פיזי חובה (אזהרה רכה על כפילות), משפחה
 * מחזיקה (בחירה או inline-create — הכרעת בעלים 6), סיווג, since, סטטוס.
 */
import { useState } from 'react';
import { useApp } from '../../store/useApp';
import { useDbWatch } from '../../store/dbWatch';
import { featureOn, termOf } from '../../lib/config';
import { emptyFamily, type TzBox, type TzBoxStatus } from '../../types/domain';
import { Btn, Field, FormError, Modal, Select, TextInput } from '../ui';
import { HebDateInput } from '../HebDateInput';
import { isoToday } from '../../lib/date-util';

const STATUS_OPTIONS: { value: TzBoxStatus; label: string }[] = [
  { value: 'home', label: '🏠 אצל משפחה' },
  { value: 'office', label: '🏢 במשרד' },
  { value: 'lost', label: '⚠ אבדה' },
  { value: 'retired', label: '📦 הוצאה משימוש' },
];

export function BoxForm(props: { box: TzBox | null; coordinatorId: string; onClose: () => void }) {
  const db = useDbWatch('families', 'tzBoxes');
  const config = useApp((s) => s.config);
  const upsertTzBox = useApp((s) => s.upsertTzBox);
  const upsertFamily = useApp((s) => s.upsertFamily);
  const nextId = useApp((s) => s.nextId);
  const toast = useApp((s) => s.toast);
  const inlineOn = featureOn(config, 'tzedaka.inlinecreate');
  const b = props.box;

  const [f, setF] = useState({
    num: b?.num ?? '',
    famId: b?.famId ?? '',
    holderKind: b?.holderKind ?? ('' as TzBox['holderKind']),
    since: b?.since ?? isoToday(),
    status: b?.status ?? ('home' as TzBoxStatus),
    notes: b?.notes ?? '',
  });
  const [error, setError] = useState('');
  const [newFamOpen, setNewFamOpen] = useState(false);
  const [newFam, setNewFam] = useState({ name: '', phone: '', kind: 'donor' as 'donor' | 'supported' });

  // אזהרה רכה — מספר קופה שכבר קיים (לא חוסם; קופות ישנות ממוחזרות לפעמים)
  const dupNum =
    f.num.trim() !== '' && db.tzBoxes.some((x) => x.id !== b?.id && x.num === f.num.trim() && x.status !== 'retired');

  function createFamily() {
    if (!newFam.name.trim()) return setError('שם ה' + termOf(config, 'entity.family', 'משפחה') + ' החדשה הוא שדה חובה');
    const id = nextId('f');
    upsertFamily({
      ...emptyFamily(),
      id,
      createdAt: isoToday(),
      name: newFam.name.trim(),
      phone: newFam.phone.trim(),
      notes: newFam.kind === 'donor' ? 'סווגה תורמת (קופות צדקה)' : 'סווגה נתמכת (קופות צדקה)',
    });
    setF({ ...f, famId: id, holderKind: newFam.kind });
    setNewFamOpen(false);
    toast(termOf(config, 'entity.familyOf', 'משפחת') + ' ' + newFam.name.trim() + ' נוצרה במערכת וקושרה לקופה');
  }

  function save() {
    if (!f.num.trim()) return setError('מספר הקופה (המודבק עליה) הוא שדה חובה');
    upsertTzBox({
      id: b?.id ?? '',
      num: f.num.trim(),
      coordinatorId: props.coordinatorId,
      famId: f.famId,
      holderKind: f.holderKind,
      since: f.since,
      status: f.status,
      notes: f.notes.trim(),
      collections: b?.collections ?? [],
    });
    toast(b ? 'הקופה עודכנה' : termOf(config, 'entity.tzBox', 'קופה') + ' ' + f.num.trim() + ' נוספה');
    props.onClose();
  }

  return (
    <Modal title={(b ? 'עריכת ' : '➕ הוספת ') + termOf(config, 'entity.tzBox', 'קופה')} onClose={props.onClose}>
      <FormError error={error} />
      {dupNum && (
        <div style={{ background: '#fdf1d4', color: '#9a6414', borderRadius: 8, padding: '7px 11px', fontSize: 12.5, marginBottom: 10 }}>
          ⚠ כבר קיימת קופה פעילה עם המספר הזה — ודאו שאין בלבול (לא חוסם)
        </div>
      )}
      <div className="form-grid">
        <Field label="מספר הקופה *">
          <TextInput value={f.num} onChange={(v) => setF({ ...f, num: v })} dir="ltr" placeholder="42" />
        </Field>
        <Field label="סטטוס">
          <Select value={f.status} onChange={(v) => setF({ ...f, status: v as TzBoxStatus })} options={STATUS_OPTIONS} />
        </Field>
        <Field label={termOf(config, 'entity.family', 'משפחה') + ' מחזיקה (רשות)'}>
          <Select
            value={f.famId}
            onChange={(v) => setF({ ...f, famId: v })}
            options={[
              { value: '', label: 'ללא — הקופה במשרד' },
              ...db.families.map((x) => ({ value: x.id, label: termOf(config, 'entity.familyOf', 'משפחת') + ' ' + x.name })),
            ]}
          />
        </Field>
        <Field label="סיווג המחזיקה">
          <Select
            value={f.holderKind}
            onChange={(v) => setF({ ...f, holderKind: (v === 'donor' || v === 'supported' ? v : '') as TzBox['holderKind'] })}
            options={[
              { value: '', label: '—' },
              { value: 'donor', label: '💛 תורמת' },
              { value: 'supported', label: '🤲 נתמכת' },
            ]}
          />
        </Field>
        <Field label="אצלם מאז">
          <HebDateInput value={f.since} onChange={(v) => setF({ ...f, since: v })} />
        </Field>
      </div>
      {inlineOn && (
        <div style={{ marginBottom: 10 }}>
          <Btn sm onClick={() => setNewFamOpen((v) => !v)}>➕ {termOf(config, 'entity.family', 'משפחה')} חדשה</Btn>
        </div>
      )}
      {inlineOn && newFamOpen && (
        <div style={{ border: '1px solid var(--line)', borderRadius: 10, padding: '10px 12px', marginBottom: 10 }}>
          <div className="form-grid">
            <Field label={'שם ה' + termOf(config, 'entity.family', 'משפחה') + ' *'}>
              <TextInput value={newFam.name} onChange={(v) => setNewFam({ ...newFam, name: v })} />
            </Field>
            <Field label="טלפון">
              <TextInput value={newFam.phone} onChange={(v) => setNewFam({ ...newFam, phone: v })} dir="ltr" />
            </Field>
            <Field label="סיווג">
              <Select
                value={newFam.kind}
                onChange={(v) => setNewFam({ ...newFam, kind: v === 'supported' ? 'supported' : 'donor' })}
                options={[
                  { value: 'donor', label: '💛 תורמת' },
                  { value: 'supported', label: '🤲 נתמכת' },
                ]}
              />
            </Field>
          </div>
          <Btn sm kind="primary" onClick={createFamily}>יצירה וקישור</Btn>
        </div>
      )}
      <Field label="הערות">
        <textarea rows={2} value={f.notes} onChange={(e) => setF({ ...f, notes: e.target.value })} />
      </Field>
      <div className="modal-actions">
        <Btn kind="primary" onClick={save}>שמירה</Btn>
        <Btn onClick={props.onClose}>ביטול</Btn>
      </div>
    </Modal>
  );
}
