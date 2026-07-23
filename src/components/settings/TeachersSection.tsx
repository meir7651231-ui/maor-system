/**
 * הגדרות ← מורים — טבלת CRUD מלאה עם כרטיס מורה לעריכה.
 * מחיקה בדפוס שתי-לחיצות; מורה עם חוגים משויכים לא נמחקת (הודעה מה-store).
 */
import { useRef, useState } from 'react';
import type { Teacher } from '../../types/domain';
import { useApp } from '../../store/useApp';
import { validIsraeliId, formatIsraeliPhone } from '../../lib/validate';
import { Btn, Empty, Field, FormError, Modal, TextInput } from '../ui';
import { HebDateInput } from '../HebDateInput';
import { Section, SectionNote } from './lib';

export function TeachersSection() {
  const teachers = useApp((s) => s.db.teachers);
  const courses = useApp((s) => s.db.courses);
  const deleteTeacher = useApp((s) => s.deleteTeacher);
  const toast = useApp((s) => s.toast);

  const [editing, setEditing] = useState<Teacher | null>(null);
  const [creating, setCreating] = useState(false);
  const [armedId, setArmedId] = useState<string | null>(null);
  const disarmTimer = useRef<number | undefined>(undefined);

  function onDelete(id: string) {
    if (armedId !== id) {
      setArmedId(id);
      window.clearTimeout(disarmTimer.current);
      disarmTimer.current = window.setTimeout(() => setArmedId((a) => (a === id ? null : a)), 3000);
      return;
    }
    setArmedId(null);
    const res = deleteTeacher(id);
    if (!res.ok) toast('⚠ ' + (res.error ?? 'לא ניתן למחוק את המורה'));
    else toast('המורה נמחקה מהמערכת');
  }

  const coursesOf = (id: string) => courses.filter((c) => c.teacherId === id).length;

  return (
    <Section
      id="sec-teachers"
      title="👩‍🏫 מורים"
      sub="לחיצה על ✎ פותחת כרטיס מלא לעריכה · מורה עם חוגים משויכים לא ניתנת למחיקה"
    >
      <div style={{ marginBottom: 10 }}>
        <Btn kind="primary" sm onClick={() => setCreating(true)}>
          + מורה
        </Btn>
      </div>
      {teachers.length === 0 ? (
        <Empty>אין מורים במערכת עדיין — הוסיפו מורה ראשונה</Empty>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table className="table">
            <thead>
              <tr>
                <th>שם</th>
                <th>טלפון</th>
                <th>אימייל</th>
                <th>התמחות</th>
                <th>תעריף לשעה</th>
                <th>חוגים</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {teachers.map((t) => (
                <tr key={t.id}>
                  <td style={{ fontWeight: 600 }}>{t.name}</td>
                  <td dir="ltr" style={{ textAlign: 'right' }}>{t.phone || '—'}</td>
                  <td dir="ltr" style={{ textAlign: 'right' }}>{t.email || '—'}</td>
                  <td>{t.specialty || '—'}</td>
                  <td>{t.payRate ? '₪' + t.payRate : '—'}</td>
                  <td>{coursesOf(t.id)}</td>
                  <td style={{ whiteSpace: 'nowrap' }}>
                    <span style={{ display: 'inline-flex', gap: 6 }}>
                      <Btn sm onClick={() => setEditing(t)} title="כרטיס מלא">
                        ✎ עריכה
                      </Btn>
                      <Btn sm kind="danger" onClick={() => onDelete(t.id)}>
                        {armedId === t.id ? 'לאשר מחיקה?' : 'מחיקה'}
                      </Btn>
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <SectionNote>כרטיס המורה משתקף בכל החוגים, בחיפוש ובייצוא.</SectionNote>

      {(creating || editing) && (
        <TeacherForm teacher={editing} onClose={() => { setEditing(null); setCreating(false); }} />
      )}
    </Section>
  );
}

interface TeacherFormState {
  name: string;
  phone: string;
  phone2: string;
  email: string;
  idNum: string;
  address: string;
  specialty: string;
  payRate: string;
  startDate: string;
  notes: string;
}

function initState(t: Teacher | null): TeacherFormState {
  return {
    name: t?.name ?? '',
    phone: t?.phone ?? '',
    phone2: t?.phone2 ?? '',
    email: t?.email ?? '',
    idNum: t?.idNum ?? '',
    address: t?.address ?? '',
    specialty: t?.specialty ?? '',
    payRate: t && t.payRate ? String(t.payRate) : '',
    startDate: t?.startDate ?? '',
    notes: t?.notes ?? '',
  };
}

function TeacherForm(props: { teacher: Teacher | null; onClose: () => void }) {
  const upsertTeacher = useApp((s) => s.upsertTeacher);
  const nextId = useApp((s) => s.nextId);
  const toast = useApp((s) => s.toast);

  const [f, setF] = useState<TeacherFormState>(() => initState(props.teacher));
  const [error, setError] = useState('');
  const set = (patch: Partial<TeacherFormState>) => setF((p) => ({ ...p, ...patch }));

  function save() {
    const name = f.name.trim();
    if (!name) return setError('שם המורה הוא שדה חובה');
    if (f.idNum.trim() && !validIsraeliId(f.idNum.trim()))
      return setError('ת"ז לא תקינה (ספרת ביקורת שגויה)');
    if (f.email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(f.email.trim()))
      return setError('כתובת האימייל לא תקינה');
    if (f.payRate.trim() && (isNaN(+f.payRate) || +f.payRate < 0))
      return setError('תעריף לשעה חייב להיות מספר');
    const existing = useApp.getState().db.teachers;
    if (!props.teacher && existing.some((x) => x.name === name))
      return setError('כבר קיימת מורה בשם הזה');

    const fields: Omit<Teacher, 'id'> = {
      name,
      phone: formatIsraeliPhone(f.phone.trim()),
      phone2: formatIsraeliPhone(f.phone2.trim()),
      email: f.email.trim(),
      idNum: f.idNum.trim(),
      address: f.address.trim(),
      specialty: f.specialty.trim(),
      payRate: f.payRate.trim() ? +f.payRate : 0,
      startDate: f.startDate,
      notes: f.notes.trim(),
    };
    if (props.teacher) {
      upsertTeacher({ ...fields, id: props.teacher.id });
      toast('כרטיס המורה עודכן — משתקף בכל החוגים, החיפוש והייצוא');
    } else {
      upsertTeacher({ ...fields, id: nextId('t') });
      toast('המורה ' + name + ' נוספה — זמינה לשיבוץ בכל חוג');
    }
    props.onClose();
  }

  return (
    <Modal title={props.teacher ? 'כרטיס מורה — עריכה מלאה' : '+ מורה חדשה'} onClose={props.onClose} wide>
      <FormError error={error} />
      <div className="form-grid">
        <Field label="שם מלא *">
          <TextInput value={f.name} onChange={(v) => set({ name: v })} />
        </Field>
        <Field label="טלפון">
          <TextInput value={f.phone} onChange={(v) => set({ phone: v })} dir="ltr" placeholder="050-0000000" />
        </Field>
        <Field label="טלפון נוסף">
          <TextInput value={f.phone2} onChange={(v) => set({ phone2: v })} dir="ltr" />
        </Field>
        <Field label="אימייל">
          <TextInput value={f.email} onChange={(v) => set({ email: v })} dir="ltr" placeholder="name@example.com" />
        </Field>
        <Field label='ת"ז'>
          <TextInput value={f.idNum} onChange={(v) => set({ idNum: v })} dir="ltr" />
        </Field>
        <Field label="כתובת">
          <TextInput value={f.address} onChange={(v) => set({ address: v })} />
        </Field>
        <Field label="התמחות">
          <TextInput value={f.specialty} onChange={(v) => set({ specialty: v })} placeholder="ציור, מוזיקה…" />
        </Field>
        <Field label='תעריף לשעה (ש"ח)'>
          <TextInput value={f.payRate} onChange={(v) => set({ payRate: v })} type="number" dir="ltr" />
        </Field>
        <Field label="תחילת עבודה">
          {/* תאריך עברי (ראשי) + לועזי — תאריך עברי חובה בכל שדה */}
          <HebDateInput value={f.startDate} onChange={(v) => set({ startDate: v })} />
        </Field>
      </div>
      <Field label="הערות">
        <textarea rows={2} value={f.notes} onChange={(e) => set({ notes: e.target.value })} />
      </Field>
      <div className="modal-actions">
        <Btn kind="primary" onClick={save}>
          שמירת כרטיס מורה
        </Btn>
        <Btn onClick={props.onClose}>ביטול</Btn>
      </div>
    </Modal>
  );
}
