/**
 * הגדרות ← מורים — טבלת CRUD מלאה עם כרטיס מורה לעריכה.
 * מחיקה בדפוס שתי-לחיצות; מורה עם חוגים משויכים לא נמחקת (הודעה מה-store).
 */
import { useRef, useState } from 'react';
import type { Teacher } from '../../types/domain';
import { useApp } from '../../store/useApp';
import { validIsraeliId, formatIsraeliPhone } from '../../lib/validate';
import { isoToday } from '../../lib/date-util';
import { Btn, Empty, Field, FormError, Modal, TextInput } from '../ui';
import { termOf } from '../../lib/config';
import { HebDateInput } from '../HebDateInput';
import { Section, SectionNote } from './lib';

export function TeachersSection() {
  const teachers = useApp((s) => s.db.teachers);
  const courses = useApp((s) => s.db.courses);
  const deleteTeacher = useApp((s) => s.deleteTeacher);
  const toast = useApp((s) => s.toast);
  const config = useApp((s) => s.config);
  const teacher = termOf(config, 'entity.teacher', 'מורה');
  // רבים: אם המונח ברירת-המחדל ("מורה") — "מורים"; אחרת המונח כמות-שהוא (אין מפתח-רבים).
  const teachersT = teacher === 'מורה' ? 'מורים' : teacher;

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
    if (!res.ok) toast('⚠ ' + (res.error ?? 'לא ניתן למחוק את ה' + teacher));
    else toast('ה' + teacher + ' נמחק/ה מהמערכת');
  }

  const coursesOf = (id: string) => courses.filter((c) => c.teacherId === id).length;

  return (
    <Section
      id="sec-teachers"
      title={'👩‍🏫 ' + teachersT}
      sub={'לחיצה על ✎ פותחת כרטיס מלא לעריכה · ' + teacher + ' עם ' + termOf(config, 'nav.courses', 'חוגים') + ' משויכים לא ניתן/ת למחיקה'}
    >
      <div style={{ marginBottom: 10 }}>
        <Btn kind="primary" sm onClick={() => setCreating(true)}>
          {'➕ הוספת ' + teacher}
        </Btn>
      </div>
      {teachers.length === 0 ? (
        <Empty>{'אין ' + teachersT + ' עדיין — הוסיפו ' + teacher + ' ראשון/ה'}</Empty>
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
                <th>{termOf(config, 'nav.courses', 'חוגים')}</th>
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
      <SectionNote>{'כרטיס ה' + teacher + ' משתקף בכל ה' + termOf(config, 'nav.courses', 'חוגים') + ', בחיפוש ובייצוא.'}</SectionNote>

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
  const config = useApp((s) => s.config);
  const teacher = termOf(config, 'entity.teacher', 'מורה');
  // כרטיס מורה מלא (P3 פריט 10): חוגי המורה + תזכורת קשר
  const courses = useApp((s) => s.db.courses);
  const enrollments = useApp((s) => s.db.enrollments);
  const upsertEvent = useApp((s) => s.upsertEvent);
  const selectCourse = useApp((s) => s.selectCourse);
  const go = useApp((s) => s.go);
  const myCourses = props.teacher ? courses.filter((c) => c.teacherId === props.teacher!.id) : [];
  const myStudents = myCourses.reduce(
    (n, c) => n + enrollments.filter((e) => e.courseId === c.id && e.status !== 'ended').length,
    0,
  );

  function callReminder() {
    if (!props.teacher) return;
    upsertEvent({
      id: nextId('ev'),
      title: 'תזכורת קשר — ' + teacher + ': ' + props.teacher.name,
      date: isoToday(),
      time: '',
      type: 'call',
      customType: '',
      notes: props.teacher.phone || '',
      price: 0,
      roomId: '',
      famId: '',
      priority: 'orange',
      done: false,
    });
    toast('תזכורת קשר ל' + props.teacher.name + ' נוספה ללוח להיום');
  }

  const [f, setF] = useState<TeacherFormState>(() => initState(props.teacher));
  const [error, setError] = useState('');
  const set = (patch: Partial<TeacherFormState>) => setF((p) => ({ ...p, ...patch }));

  function save() {
    const name = f.name.trim();
    if (!name) return setError('שם ה' + teacher + ' הוא שדה חובה');
    if (f.idNum.trim() && !validIsraeliId(f.idNum.trim()))
      return setError('ת"ז לא תקינה (ספרת ביקורת שגויה)');
    if (f.email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(f.email.trim()))
      return setError('כתובת האימייל לא תקינה');
    if (f.payRate.trim() && (isNaN(+f.payRate) || +f.payRate < 0))
      return setError('תעריף לשעה חייב להיות מספר');
    const existing = useApp.getState().db.teachers;
    if (!props.teacher && existing.some((x) => x.name === name))
      return setError('כבר קיים/ת ' + teacher + ' בשם הזה');

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
      toast('כרטיס ה' + teacher + ' עודכן — משתקף בכל ה' + termOf(config, 'nav.courses', 'חוגים') + ', החיפוש והייצוא');
    } else {
      upsertTeacher({ ...fields, id: nextId('t') });
      toast('ה' + teacher + ' ' + name + ' נוסף/ה — זמין/ה ל' + termOf(config, 'entity.enrollment', 'שיבוץ') + ' בכל ' + termOf(config, 'entity.course', 'חוג'));
    }
    props.onClose();
  }

  return (
    <Modal title={props.teacher ? 'כרטיס ' + teacher + ' — עריכה מלאה' : '+ ' + teacher + ' חדש/ה'} onClose={props.onClose} wide>
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
      {/* P3 פריט 10 — חוגי המורה עם קפיצה לחוג + סטטיסטיקת תלמידים + 📞 תזכורת קשר */}
      {props.teacher && (
        <div style={{ border: '1px solid var(--line)', borderRadius: 10, padding: '10px 12px', marginBottom: 12 }}>
          <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 6 }}>
            {'ה' + termOf(config, 'nav.courses', 'חוגים') + ' של ה' + teacher + ' (' + myCourses.length + ') · ' + myStudents + ' ' + termOf(config, 'entity.students', 'תלמידים')}
          </div>
          {myCourses.length === 0 && (
            <div style={{ fontSize: 12.5, color: 'var(--ink-faint)' }}>{'אין ' + termOf(config, 'nav.courses', 'חוגים') + ' משויכים'}</div>
          )}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {myCourses.map((c) => (
              <button
                key={c.id}
                type="button"
                className="chip"
                style={{ cursor: 'pointer' }}
                title="מעבר לכרטיס החוג"
                onClick={() => {
                  selectCourse(c.id);
                  go('courses');
                  props.onClose();
                }}
              >
                {c.name + ' ←'}
              </button>
            ))}
          </div>
          <div style={{ marginTop: 8 }}>
            <Btn sm onClick={callReminder} title="יצירת אירוע שיחה בלוח להיום">
              📞 תזכורת קשר
            </Btn>
          </div>
        </div>
      )}
      <div className="modal-actions">
        <Btn kind="primary" onClick={save}>
          {'שמירת כרטיס ' + teacher}
        </Btn>
        <Btn onClick={props.onClose}>ביטול</Btn>
      </div>
    </Modal>
  );
}
