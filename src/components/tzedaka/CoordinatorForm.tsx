/**
 * טופס רכז/ת קופות (קופות 4) — שם חובה, קישור-רשות לבן-משפחה קיים,
 * ומאחורי tzedaka.inlinecreate: יצירת משפחה/בן-משפחה חדשים כרשומות CRM
 * אמיתיות (הכרעת בעלים 6 — upsertFamily/upsertMember הקיימים; תשתית
 * משותפת, לא זליגת נתוני-מודול).
 */
import { useState } from 'react';
import { useApp } from '../../store/useApp';
import { featureOn, termOf } from '../../lib/config';
import { emptyFamily, emptyMember, type TzCoordinator } from '../../types/domain';
import { Btn, Field, FormError, Modal, Select, TextInput } from '../ui';
import { HebDateInput } from '../HebDateInput';
import { isoToday } from '../../lib/date-util';

export function CoordinatorForm(props: { coordinator: TzCoordinator | null; onClose: () => void }) {
  const db = useApp((s) => s.db);
  const config = useApp((s) => s.config);
  const upsertTzCoordinator = useApp((s) => s.upsertTzCoordinator);
  const upsertFamily = useApp((s) => s.upsertFamily);
  const upsertMember = useApp((s) => s.upsertMember);
  const nextId = useApp((s) => s.nextId);
  const toast = useApp((s) => s.toast);
  const inlineOn = featureOn(config, 'tzedaka.inlinecreate');
  const c = props.coordinator;

  const [f, setF] = useState({
    name: c?.name ?? '',
    phone: c?.phone ?? '',
    active: c?.active ?? true,
    startDate: c?.startDate ?? isoToday(),
    notes: c?.notes ?? '',
    famId: c?.famId ?? '',
    memberId: c?.memberId ?? '',
  });
  const [error, setError] = useState('');
  // הוספת לא-רשומים (tzedaka.inlinecreate)
  const [newFamOpen, setNewFamOpen] = useState(false);
  const [newFam, setNewFam] = useState({ name: '', phone: '', kind: 'donor' as 'donor' | 'supported' });
  const [newMemOpen, setNewMemOpen] = useState(false);
  const [newMem, setNewMem] = useState({ first: '', gender: 'f' as 'm' | 'f', isParent: false });

  const fam = db.families.find((x) => x.id === f.famId);

  function createFamily() {
    if (!newFam.name.trim()) return setError('שם ה' + termOf(config, 'entity.family', 'משפחה') + ' החדשה הוא שדה חובה');
    const id = nextId('f');
    upsertFamily({
      ...emptyFamily(),
      id,
      createdAt: isoToday(),
      name: newFam.name.trim(),
      phone: newFam.phone.trim(),
      // הסיווג נרשם בהערות הכרטיס — קריא לכל צוות המשרד
      notes: newFam.kind === 'donor' ? 'סווגה תורמת (קופות צדקה)' : 'סווגה נתמכת (קופות צדקה)',
    });
    setF({ ...f, famId: id, memberId: '' });
    setNewFamOpen(false);
    toast(termOf(config, 'entity.familyOf', 'משפחת') + ' ' + newFam.name.trim() + ' נוצרה במערכת וקושרה');
  }

  function createMember() {
    if (!f.famId) return setError('בחרו קודם ' + termOf(config, 'entity.family', 'משפחה'));
    if (!newMem.first.trim()) return setError('שם הילד/ההורה החדש הוא שדה חובה');
    const id = nextId('m');
    upsertMember(f.famId, {
      ...emptyMember(),
      id,
      first: newMem.first.trim(),
      gender: newMem.gender,
      ...(newMem.isParent ? { isParent: true } : {}),
    });
    setF({ ...f, memberId: id });
    setNewMemOpen(false);
    toast(newMem.first.trim() + ' נוסף/ה לכרטיס ה' + termOf(config, 'entity.family', 'משפחה') + ' וקושר/ה');
  }

  function save() {
    if (!f.name.trim()) return setError('שם ה' + termOf(config, 'entity.tzCoordinator', 'רכז') + ' הוא שדה חובה');
    upsertTzCoordinator({
      id: c?.id ?? '',
      name: f.name.trim(),
      famId: f.famId,
      memberId: f.memberId,
      phone: f.phone.trim(),
      notes: f.notes.trim(),
      active: f.active,
      startDate: f.startDate,
      score: c?.score ?? 0,
      scoreLog: c?.scoreLog ?? [],
    });
    toast(c ? 'כרטיס ה' + termOf(config, 'entity.tzCoordinator', 'רכז') + ' עודכן' : f.name.trim() + ' — ' + termOf(config, 'entity.tzCoordinator', 'רכז') + ' חדש/ה במערכת');
    props.onClose();
  }

  return (
    <Modal title={(c ? 'עריכת ' : '➕ הוספת ') + termOf(config, 'entity.tzCoordinator', 'רכז')} onClose={props.onClose}>
      <FormError error={error} />
      <div className="form-grid">
        <Field label="שם מלא *">
          <TextInput value={f.name} onChange={(v) => setF({ ...f, name: v })} />
        </Field>
        <Field label="טלפון">
          <TextInput value={f.phone} onChange={(v) => setF({ ...f, phone: v })} dir="ltr" placeholder="050-0000000" />
        </Field>
        <Field label="תחילת פעילות">
          <HebDateInput value={f.startDate} onChange={(v) => setF({ ...f, startDate: v })} />
        </Field>
        <Field label="פעיל/ה">
          <Select
            value={f.active ? '1' : '0'}
            onChange={(v) => setF({ ...f, active: v === '1' })}
            options={[
              { value: '1', label: 'פעיל/ה' },
              { value: '0', label: 'לא פעיל/ה' },
            ]}
          />
        </Field>
        <Field label={'קישור ל' + termOf(config, 'entity.family', 'משפחה') + ' (רשות)'}>
          <Select
            value={f.famId}
            onChange={(v) => setF({ ...f, famId: v, memberId: '' })}
            options={[
              { value: '', label: 'ללא קישור' },
              ...db.families.map((x) => ({ value: x.id, label: termOf(config, 'entity.familyOf', 'משפחת') + ' ' + x.name })),
            ]}
          />
        </Field>
        {fam && (
          <Field label={termOf(config, 'entity.member', 'בן/בת המשפחה') + ' (רשות)'}>
            <Select
              value={f.memberId}
              onChange={(v) => setF({ ...f, memberId: v })}
              options={[
                { value: '', label: 'ללא' },
                ...fam.members.map((m) => ({ value: m.id, label: m.first + (m.isParent ? ' (הורה)' : '') })),
              ]}
            />
          </Field>
        )}
      </div>
      {inlineOn && (
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 10 }}>
          <Btn sm onClick={() => setNewFamOpen((v) => !v)}>➕ {termOf(config, 'entity.family', 'משפחה')} חדשה</Btn>
          {fam && <Btn sm onClick={() => setNewMemOpen((v) => !v)}>➕ ילד/הורה חדש</Btn>}
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
      {inlineOn && newMemOpen && fam && (
        <div style={{ border: '1px solid var(--line)', borderRadius: 10, padding: '10px 12px', marginBottom: 10 }}>
          <div className="form-grid">
            <Field label="שם פרטי *">
              <TextInput value={newMem.first} onChange={(v) => setNewMem({ ...newMem, first: v })} />
            </Field>
            <Field label="מגדר">
              <Select
                value={newMem.gender}
                onChange={(v) => setNewMem({ ...newMem, gender: v === 'm' ? 'm' : 'f' })}
                options={[
                  { value: 'f', label: 'בת' },
                  { value: 'm', label: 'בן' },
                ]}
              />
            </Field>
            <Field label="תפקיד">
              <Select
                value={newMem.isParent ? '1' : '0'}
                onChange={(v) => setNewMem({ ...newMem, isParent: v === '1' })}
                options={[
                  { value: '0', label: 'ילד/ה' },
                  { value: '1', label: 'הורה' },
                ]}
              />
            </Field>
          </div>
          <Btn sm kind="primary" onClick={createMember}>יצירה וקישור</Btn>
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
