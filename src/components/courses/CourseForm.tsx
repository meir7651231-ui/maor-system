/**
 * טופס קורס — יצירה ועריכה של כל שדות Course.
 * מורה נבחרת מרשימה או נוצרת inline ('__add'); קטגוריה ומסלול תקופה תומכים ב-'__other'.
 */
import { useState } from 'react';
import type { Course, Gender, PricingModel, Teacher, Weekday } from '../../types/domain';
import { useApp } from '../../store/useApp';
import { featureOn } from '../../lib/config';
import { formatIsraeliPhone } from '../../lib/validate';
import { Btn, Field, FormError, Modal, Select, TextInput } from '../ui';
import { HebDateInput } from '../HebDateInput';
import { ADD_TEACHER, CAT_OPTIONS, courseDateError, DAY_NAMES, OTHER, OTHER_LABEL, SEMESTER_OPTIONS } from './lib';

interface CourseFormState {
  name: string;
  teacherId: string;
  newTeacherName: string;
  newTeacherPhone: string;
  roomId: string;
  description: string;
  price: string;
  price1: string;
  price2: string;
  price1Name: string;
  price2Name: string;
  model: PricingModel;
  size: string;
  start: string;
  end: string;
  weekday: string;
  time: string;
  maxStudents: string;
  gender: Gender | 'all';
  ageMin: string;
  ageMax: string;
  catSel: string;
  catOther: string;
  semSel: string;
  semOther: string;
}

function initState(course: Course | null, firstTeacherId: string, firstRoomId: string): CourseFormState {
  if (!course) {
    return {
      name: '',
      teacherId: firstTeacherId,
      newTeacherName: '',
      newTeacherPhone: '',
      roomId: firstRoomId,
      description: '',
      price: '',
      price1: '',
      price2: '',
      price1Name: '',
      price2Name: '',
      model: 'monthly',
      size: '',
      start: '2025-09-01',
      end: '2026-07-31',
      weekday: '0',
      time: '17:00',
      maxStudents: '12',
      gender: 'f',
      ageMin: '',
      ageMax: '',
      catSel: 'העשרה',
      catOther: '',
      semSel: 'שנתי',
      semOther: '',
    };
  }
  const catSel = CAT_OPTIONS.includes(course.cat) ? course.cat : course.cat ? OTHER : 'העשרה';
  const semSel = SEMESTER_OPTIONS.includes(course.semester) ? course.semester : course.semester ? OTHER : 'שנתי';
  return {
    name: course.name,
    teacherId: course.teacherId,
    newTeacherName: '',
    newTeacherPhone: '',
    roomId: course.roomId,
    description: course.description,
    price: course.price ? String(course.price) : '',
    price1: course.price1 ? String(course.price1) : '',
    price2: course.price2 ? String(course.price2) : '',
    price1Name: course.price1Name,
    price2Name: course.price2Name,
    model: course.model,
    size: course.size ? String(course.size) : '',
    start: course.start,
    end: course.end,
    weekday: String(course.weekday),
    time: course.time,
    maxStudents: String(course.maxStudents || 12),
    gender: course.gender,
    ageMin: String(course.ageMin ?? ''),
    ageMax: String(course.ageMax ?? ''),
    catSel,
    catOther: catSel === OTHER ? course.cat : '',
    semSel,
    semOther: semSel === OTHER ? course.semester : '',
  };
}

export function CourseForm(props: { course: Course | null; onClose: () => void }) {
  const db = useApp((s) => s.db);
  const upsertCourse = useApp((s) => s.upsertCourse);
  const upsertTeacher = useApp((s) => s.upsertTeacher);
  const selectCourse = useApp((s) => s.selectCourse);
  const nextId = useApp((s) => s.nextId);
  const toast = useApp((s) => s.toast);
  const cfg = useApp((s) => s.config);

  const discountsOn = featureOn(cfg, 'courses.discounts');

  const [f, setF] = useState<CourseFormState>(() =>
    initState(props.course, db.teachers[0]?.id ?? '', db.rooms[0]?.id ?? ''),
  );
  const [error, setError] = useState('');
  const set = (patch: Partial<CourseFormState>) => setF((p) => ({ ...p, ...patch }));

  function save() {
    if (!f.name.trim()) return setError('שם הקורס הוא שדה חובה');
    if (f.price && (isNaN(+f.price) || +f.price < 0)) return setError('המחיר חייב להיות מספר חיובי');
    if (f.model === 'punch' && (!f.size || +f.size <= 0))
      return setError('בכרטיסייה יש להגדיר מספר ניקובים גדול מ-0');
    let cat = f.catSel;
    if (f.catSel === OTHER) {
      if (!f.catOther.trim()) return setError('בחרתם קטגוריה "אחר" — הקלידו אותה');
      cat = f.catOther.trim();
    }
    let semester = f.semSel;
    if (f.semSel === OTHER) {
      if (!f.semOther.trim()) return setError('בחרתם מסלול "אחר" — הקלידו את שם המסלול');
      semester = f.semOther.trim();
    }
    let teacherId = f.teacherId;
    if (f.teacherId === ADD_TEACHER) {
      const tn = f.newTeacherName.trim();
      if (!tn) return setError('בחרתם "הוספת מורה" — הקלידו את שם המורה');
      const existing = db.teachers.find((t) => t.name === tn);
      if (existing) teacherId = existing.id;
      else {
        const nt: Teacher = {
          id: nextId('t'),
          name: tn,
          phone: formatIsraeliPhone(f.newTeacherPhone.trim()),
          phone2: '',
          email: '',
          idNum: '',
          address: '',
          specialty: '',
          payRate: 0,
          startDate: '',
          notes: '',
        };
        upsertTeacher(nt);
        teacherId = nt.id;
      }
    }
    const weekday = Math.min(5, Math.max(0, +f.weekday || 0)) as Weekday;
    const time = f.time || '17:00';
    const ageMin = f.ageMin === '' ? 3 : Math.max(0, +f.ageMin || 0);
    const ageMax = f.ageMax === '' ? 99 : Math.max(1, +f.ageMax || 99);
    if (ageMax < ageMin) return setError('"עד גיל" חייב להיות גדול מ"מגיל"');
    const dateErr = courseDateError(f.start, f.end);
    if (dateErr) return setError(dateErr);

    const fields = {
      name: f.name.trim(),
      teacherId,
      roomId: f.roomId,
      description: f.description,
      price: +f.price || 0,
      price1: +f.price1 || 0,
      price2: +f.price2 || 0,
      price1Name: f.price1Name.trim(),
      price2Name: f.price2Name.trim(),
      model: f.model,
      size: +f.size || 0,
      start: f.start,
      end: f.end,
      weekday,
      time,
      maxStudents: +f.maxStudents || 12,
      gender: f.gender,
      ageMin,
      ageMax,
      cat,
      semester,
    };
    const room = db.rooms.find((r) => r.id === f.roomId);
    const roomName = room ? room.name : 'החדר';

    if (props.course) {
      const sessions = props.course.sessions.length
        ? props.course.sessions.map((ss, i) => (i === 0 ? { ...ss, day: weekday, time } : ss))
        : [{ day: weekday, time, label: '' }];
      upsertCourse({ ...props.course, ...fields, sessions });
      toast('הקורס עודכן — משתקף ביומן ' + roomName + ' ובלוח');
    } else {
      const id = nextId('c');
      upsertCourse({
        ...fields,
        id,
        sector: 'הכל',
        sessions: [{ day: weekday, time, label: '' }],
        notes: '',
      });
      selectCourse(id);
      toast('הקורס "' + fields.name + '" נוצר — נכנס ליומן ' + roomName + ', ללוח ולגלגל');
    }
    props.onClose();
  }

  return (
    <Modal title={props.course ? 'עריכת קורס' : 'קורס חדש'} onClose={props.onClose} wide>
      <div className="form-grid">
        <Field label="שם הקורס *">
          <TextInput value={f.name} onChange={(v) => set({ name: v })} placeholder="לדוגמה: שחמט" />
        </Field>
        <Field label="מורה">
          <Select
            value={f.teacherId}
            onChange={(v) => set({ teacherId: v })}
            options={[
              ...db.teachers.map((t) => ({ value: t.id, label: t.name })),
              { value: ADD_TEACHER, label: '＋ הוספת מורה חדשה…' },
            ]}
          />
        </Field>
        {f.teacherId === ADD_TEACHER && (
          <>
            <Field label="שם המורה החדשה *">
              <TextInput value={f.newTeacherName} onChange={(v) => set({ newTeacherName: v })} />
            </Field>
            <Field label="טלפון המורה">
              <TextInput
                value={f.newTeacherPhone}
                onChange={(v) => set({ newTeacherPhone: v })}
                placeholder="050-0000000"
                dir="ltr"
              />
            </Field>
          </>
        )}
        <Field label="מסלול תמחור">
          <Select
            value={f.model}
            onChange={(v) =>
              set({ model: (['monthly', 'half_year', 'year', 'punch'].includes(v) ? v : 'monthly') as typeof f.model })
            }
            options={[
              { value: 'monthly', label: 'מנוי חודשי' },
              { value: 'half_year', label: 'מנוי חצי-שנתי' },
              { value: 'year', label: 'מנוי שנתי' },
              { value: 'punch', label: 'כרטיסייה (ניקובים)' },
            ]}
          />
        </Field>
        <Field label="מחיר מלא (₪)">
          <TextInput value={f.price} onChange={(v) => set({ price: v })} placeholder="180" dir="ltr" />
        </Field>
        {discountsOn && (
          <>
            <Field label="שם הנחה 1">
              <TextInput value={f.price1Name} onChange={(v) => set({ price1Name: v })} placeholder="לדוגמה: אחיות / מלגה" />
            </Field>
            <Field label="מחיר הנחה 1 (₪)">
              <TextInput value={f.price1} onChange={(v) => set({ price1: v })} placeholder="—" dir="ltr" />
            </Field>
            <Field label="שם הנחה 2">
              <TextInput value={f.price2Name} onChange={(v) => set({ price2Name: v })} placeholder="לדוגמה: אלמנות" />
            </Field>
            <Field label="מחיר הנחה 2 (₪)">
              <TextInput value={f.price2} onChange={(v) => set({ price2: v })} placeholder="—" dir="ltr" />
            </Field>
          </>
        )}
        {f.model === 'punch' && (
          <Field label="ניקובים בכרטיסייה *">
            <TextInput value={f.size} onChange={(v) => set({ size: v })} placeholder="10" dir="ltr" />
          </Field>
        )}
        <Field label="חדר פעילות *">
          <Select
            value={f.roomId}
            onChange={(v) => set({ roomId: v })}
            options={
              db.rooms.length
                ? db.rooms.map((r) => ({ value: r.id, label: r.name }))
                : [{ value: '', label: 'אין חדרים במערכת' }]
            }
          />
        </Field>
        <Field label="יום קבוע">
          <Select
            value={f.weekday}
            onChange={(v) => set({ weekday: v })}
            options={DAY_NAMES.map((d, i) => ({ value: String(i), label: d }))}
          />
        </Field>
        <Field label="שעה">
          <TextInput value={f.time} onChange={(v) => set({ time: v })} type="time" />
        </Field>
        <Field label="מקסימום תלמידים">
          <TextInput value={f.maxStudents} onChange={(v) => set({ maxStudents: v })} placeholder="12" dir="ltr" />
        </Field>
        <Field label="קטגוריה (לגלגל)">
          <Select
            value={f.catSel}
            onChange={(v) => set({ catSel: v })}
            options={[...CAT_OPTIONS.map((c) => ({ value: c, label: c })), { value: OTHER, label: OTHER_LABEL }]}
          />
        </Field>
        {f.catSel === OTHER && (
          <Field label="קטגוריה — אחר *">
            <TextInput value={f.catOther} onChange={(v) => set({ catOther: v })} placeholder="הקלידו קטגוריה…" />
          </Field>
        )}
        <Field label="מסלול תקופה">
          <Select
            value={f.semSel}
            onChange={(v) => set({ semSel: v })}
            options={[...SEMESTER_OPTIONS.map((s) => ({ value: s, label: s })), { value: OTHER, label: OTHER_LABEL }]}
          />
        </Field>
        {f.semSel === OTHER && (
          <Field label="מסלול תקופה — אחר *">
            <TextInput
              value={f.semOther}
              onChange={(v) => set({ semOther: v })}
              placeholder="לדוגמה: סמסטר ב׳, קיץ בלבד…"
            />
          </Field>
        )}
        <Field label="קהל">
          <Select
            value={f.gender}
            onChange={(v) => set({ gender: v === 'm' ? 'm' : v === 'all' ? 'all' : 'f' })}
            options={[
              { value: 'f', label: 'נשים ובנות' },
              { value: 'm', label: 'בנים' },
              { value: 'all', label: 'הכל' },
            ]}
          />
        </Field>
        <Field label="מגיל">
          <TextInput value={f.ageMin} onChange={(v) => set({ ageMin: v })} placeholder="3" dir="ltr" />
        </Field>
        <Field label="עד גיל">
          <TextInput value={f.ageMax} onChange={(v) => set({ ageMax: v })} placeholder="99" dir="ltr" />
        </Field>
        <Field label="תאריך התחלה">
          <HebDateInput value={f.start} onChange={(iso) => set({ start: iso })} />
        </Field>
        <Field label="תאריך סיום">
          <HebDateInput value={f.end} onChange={(iso) => set({ end: iso })} />
        </Field>
      </div>
      <div
        style={{
          fontSize: 12,
          fontWeight: 700,
          color: '#12803c',
          background: '#e4f5ea',
          border: '1px solid #b9dfc8',
          borderRadius: 9,
          padding: '7px 11px',
          marginBottom: 12,
        }}
      >
        ✓ החוג ישתקף אוטומטית ביומן החדר שנבחר, בלוח השנה ובגלגל "מצא חוג"
      </div>
      <Field label="תיאור — על הקורס והמורה">
        <textarea rows={2} value={f.description} onChange={(e) => set({ description: e.target.value })} />
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
