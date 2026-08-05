/**
 * טופס קורס — יצירה ועריכה של כל שדות Course.
 * מורה נבחרת מרשימה או נוצרת inline ('__add'); קטגוריה ומסלול תקופה תומכים ב-'__other'.
 */
import { useState } from 'react';
import type { Course, Gender, PricingModel, Teacher, Weekday } from '../../types/domain';
import { useApp } from '../../store/useApp';
import { featureOn, termOf } from '../../lib/config';
import { formatIsraeliPhone } from '../../lib/validate';
import { Btn, Field, FormError, Modal, Select, TextInput } from '../ui';
import { HebDateInput } from '../HebDateInput';
import { pickAndCompressImage } from '../../lib/imagePick';
import { ADD_TEACHER, CAT_OPTIONS, courseDateError, DAY_NAMES, defaultCourseDates, GRADE_ORDER, gradeIndex, OTHER, OTHER_LABEL, SEMESTER_OPTIONS } from './lib';

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
  /** טווח כיתות + תמונת חוג (P2 פער 28, feature courses.gradeimg). */
  gradeMin: string;
  gradeMax: string;
  img: string;
}

function initState(course: Course | null, firstTeacherId: string, firstRoomId: string): CourseFormState {
  if (!course) {
    // טווח שנת-הלימודים מחושב מהיום — לא literal קשיח שפג-תוקף ומעלים חוגים חדשים.
    const sy = defaultCourseDates();
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
      start: sy.start,
      end: sy.end,
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
      gradeMin: '',
      gradeMax: '',
      img: '',
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
    gradeMin: course.gradeMin || '',
    gradeMax: course.gradeMax || '',
    img: course.img || '',
  };
}

export function CourseForm(props: { course: Course | null; onClose: () => void }) {
  const db = useApp((s) => s.db);
  const upsertCourse = useApp((s) => s.upsertCourse);
  const upsertTeacher = useApp((s) => s.upsertTeacher);
  const upsertRoom = useApp((s) => s.upsertRoom);
  const selectCourse = useApp((s) => s.selectCourse);
  const nextId = useApp((s) => s.nextId);
  const toast = useApp((s) => s.toast);
  // UX סבב-ה׳: יצירת-חדר inline — סוגר את מבוי-הסתום 'חדר חובה שנוצר רק בהגדרות'
  const [newRoomName, setNewRoomName] = useState<string | null>(null);
  // UX סבב-ה׳: חוג חדש — ליבה בלבד; עריכה — הכול פתוח
  const [advOpen, setAdvOpen] = useState(!!props.course);
  const cfg = useApp((s) => s.config);

  const discountsOn = featureOn(cfg, 'courses.discounts');
  // טווח כיתות + תמונת חוג (P2 פער 28)
  const gradeimgOn = featureOn(cfg, 'courses.gradeimg');

  const [f, setF] = useState<CourseFormState>(() =>
    initState(props.course, db.teachers[0]?.id ?? '', db.rooms[0]?.id ?? ''),
  );
  const [error, setError] = useState('');
  const set = (patch: Partial<CourseFormState>) => setF((p) => ({ ...p, ...patch }));

  function save() {
    if (!f.name.trim()) return setError('שם ה' + termOf(cfg, 'entity.course', 'חוג') + ' הוא שדה חובה');
    if (!f.roomId) return setError('יש לבחור ' + termOf(cfg, 'entity.room', 'חדר') + ' פעילות');
    if ([f.price, f.price1, f.price2].some((p) => p && (isNaN(+p) || +p < 0)))
      return setError('המחיר חייב להיות מספר חיובי');
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
    const weekday = Math.min(5, Math.max(0, +f.weekday || 0)) as Weekday;
    const time = f.time || '17:00';
    const ageMin = f.ageMin === '' ? 3 : Math.max(0, +f.ageMin || 0);
    const ageMax = f.ageMax === '' ? 99 : Math.max(1, +f.ageMax || 99);
    if (ageMax < ageMin) return setError('"עד גיל" חייב להיות גדול מ"מגיל"');
    if (f.gradeMin && f.gradeMax && gradeIndex(f.gradeMax) < gradeIndex(f.gradeMin))
      return setError('"עד כיתה" חייבת להיות אחרי "מכיתה"');
    const dateErr = courseDateError(f.start, f.end, cfg);
    if (dateErr) return setError(dateErr);
    let teacherId = f.teacherId;
    if (f.teacherId === ADD_TEACHER) {
      const tn = f.newTeacherName.trim();
      if (!tn) return setError('בחרתם "הוספת ' + termOf(cfg, 'entity.teacher', 'מורה') + '" — הקלידו את שם ה' + termOf(cfg, 'entity.teacher', 'מורה'));
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
      gradeMin: f.gradeMin,
      gradeMax: f.gradeMax,
      img: f.img,
    };
    const room = db.rooms.find((r) => r.id === f.roomId);
    const roomName = room ? room.name : 'ה' + termOf(cfg, 'entity.room', 'חדר');

    if (props.course) {
      const sessions = props.course.sessions.length
        ? props.course.sessions.map((ss, i) => (i === 0 ? { ...ss, day: weekday, time } : ss))
        : [{ day: weekday, time, label: '' }];
      upsertCourse({ ...props.course, ...fields, sessions });
      toast('ה' + termOf(cfg, 'entity.course', 'חוג') + ' עודכן — משתקף ביומן ' + roomName + ' ובלוח');
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
      toast('ה' + termOf(cfg, 'entity.course', 'חוג') + ' "' + fields.name + '" נוצר — נכנס ליומן ' + roomName + ', ללוח ולגלגל');
    }
    props.onClose();
  }

  return (
    <Modal
      title={
        props.course
          ? 'עריכת ' + termOf(cfg, 'entity.course', 'חוג')
          : 'הוספת ' + termOf(cfg, 'entity.course', 'חוג')
      }
      onClose={props.onClose}
      wide
    >
      <div className="form-grid">
        <Field label={'שם ה' + termOf(cfg, 'entity.course', 'חוג') + ' *'}>
          <TextInput value={f.name} onChange={(v) => set({ name: v })} placeholder="לדוגמה: שחמט" />
        </Field>
        <Field label={termOf(cfg, 'entity.teacher', 'מורה')}>
          <Select
            value={f.teacherId}
            onChange={(v) => set({ teacherId: v })}
            options={[
              ...db.teachers.map((t) => ({ value: t.id, label: t.name })),
              { value: ADD_TEACHER, label: '＋ הוספת ' + termOf(cfg, 'entity.teacher', 'מורה') + '…' },
            ]}
          />
        </Field>
        {f.teacherId === ADD_TEACHER && (
          <>
            <Field label={'שם ' + termOf(cfg, 'entity.teacher', 'המורה') + ' *'}>
              <TextInput value={f.newTeacherName} onChange={(v) => set({ newTeacherName: v })} />
            </Field>
            <Field label={'טלפון ' + termOf(cfg, 'entity.teacher', 'המורה')}>
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
        {f.model === 'punch' && (
          <Field label="ניקובים בכרטיסייה *">
            <TextInput value={f.size} onChange={(v) => set({ size: v })} placeholder="10" dir="ltr" />
          </Field>
        )}
        <Field label={termOf(cfg, 'entity.room', 'חדר') + ' פעילות *'}>
          <Select
            value={f.roomId}
            onChange={(v) => set({ roomId: v })}
            options={
              db.rooms.length
                ? db.rooms.map((r) => ({ value: r.id, label: r.name }))
                : [{ value: '', label: 'אין ' + termOf(cfg, 'entity.rooms', 'חדרים') + ' במערכת' }]
            }
          />
          {/* UX סבב-ה׳: '➕ חדר חדש' בלי לצאת מהטופס (המבוי-הסתום: חדר חובה,
              נוצר רק בהגדרות ⇒ טופס-החוג נתקע לארגון טרי). ברירות-מחדל שפויות;
              כוונון מלא — בהגדרות←חדרים כרגיל. */}
          {newRoomName === null ? (
            <button
              type="button"
              onClick={() => setNewRoomName('')}
              style={{ fontSize: 12, color: 'var(--accent-deep, var(--accent))', background: 'none', border: 'none', cursor: 'pointer', padding: '4px 0', textAlign: 'start', fontWeight: 700 }}
            >
              {'➕ ' + termOf(cfg, 'entity.room', 'חדר') + ' חדש'}
            </button>
          ) : (
            <div style={{ display: 'flex', gap: 6, marginTop: 6 }}>
              <TextInput value={newRoomName} onChange={setNewRoomName} placeholder={'שם ה' + termOf(cfg, 'entity.room', 'חדר')} />
              <Btn
                sm
                kind="primary"
                onClick={() => {
                  const name = (newRoomName || '').trim();
                  if (!name) return;
                  const id = nextId('rm');
                  upsertRoom({ id, name, active: true, slot: 60, cap: 20, location: '', rate: 0, from: '08:00', to: '22:00', access: true, notes: '', eq: {} });
                  set({ roomId: id });
                  setNewRoomName(null);
                  toast('✓ ' + name + ' נוצר ונבחר — כוונון מלא בהגדרות');
                }}
              >
                יצירה
              </Btn>
              <Btn sm onClick={() => setNewRoomName(null)}>ביטול</Btn>
            </div>
          )}
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
      </div>
      {/* UX סבב-ה׳: ~24 שדות ⇒ ליבה (שם/מורה/מחיר/חדר/יום/שעה/תאריכים) +
          "הגדרות מתקדמות ▾" — תמחור-מסלולים, הנחות, קטגוריה, קהל, גילאים, תמונה.
          חוג חדש = מקופל; עריכה = פתוח. אפס אובדן-יכולת. */}
      <button
        type="button"
        onClick={() => setAdvOpen((v) => !v)}
        style={{ background: 'none', border: 'none', cursor: 'pointer', fontWeight: 700, fontSize: 13, color: 'var(--accent-deep, var(--accent))', padding: '2px 0 10px', textAlign: 'start' }}
      >
        {(advOpen ? '▲ פחות הגדרות' : '▼ הגדרות מתקדמות') + ' — מסלולי-תמחור, הנחות, קהל, גילאים, תמונה…'}
      </button>
      {advOpen && (
        <div className="form-grid">
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
        <Field label={'מקסימום ' + termOf(cfg, 'entity.students', 'תלמידים')}>
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
        {gradeimgOn && (
          <>
            <Field label="מכיתה">
              <Select
                value={f.gradeMin}
                onChange={(v) => set({ gradeMin: v })}
                options={[{ value: '', label: 'ללא הגבלה' }, ...GRADE_ORDER.map((g) => ({ value: g, label: g }))]}
              />
            </Field>
            <Field label="עד כיתה">
              <Select
                value={f.gradeMax}
                onChange={(v) => set({ gradeMax: v })}
                options={[{ value: '', label: 'ללא הגבלה' }, ...GRADE_ORDER.map((g) => ({ value: g, label: g }))]}
              />
            </Field>
            <div style={{ gridColumn: '1 / -1' }}>
              <Field label={'תמונת ה' + termOf(cfg, 'entity.course', 'חוג')}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                  {f.img && (
                    <img src={f.img} alt="" style={{ width: 56, height: 56, objectFit: 'cover', borderRadius: 10, border: '1px solid var(--line)' }} />
                  )}
                  <label className="btn" style={{ cursor: 'pointer', display: 'inline-flex' }}>
                    {f.img ? 'החלפת תמונה…' : 'העלאת תמונה…'}
                    <input
                      type="file"
                      accept="image/*"
                      style={{ display: 'none' }}
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        e.target.value = '';
                        if (!file) return;
                        // כיווץ ל-thumbnail (פיצ'ר גלריה) — נשמר ב-DB, בלי לפוצץ את
                        // מכסת ה-localStorage בתמונה מלאה; נוסע עם הסנכרון והגיבוי.
                        void pickAndCompressImage(file).then((img) => set({ img })).catch(() => {});
                      }}
                    />
                  </label>
                  {f.img && (
                    <Btn sm onClick={() => set({ img: '' })}>
                      הסרה
                    </Btn>
                  )}
                </div>
              </Field>
            </div>
          </>
        )}
        <Field label="תאריך התחלה">
          <HebDateInput value={f.start} onChange={(iso) => set({ start: iso })} />
        </Field>
        <Field label="תאריך סיום">
          <HebDateInput value={f.end} onChange={(iso) => set({ end: iso })} />
        </Field>
        </div>
      )}
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
        {'✓ ה' + termOf(cfg, 'entity.course', 'חוג') + ' ישתקף אוטומטית ביומן ה' + termOf(cfg, 'entity.room', 'חדר') + ' שנבחר, בלוח השנה ובגלגל "מצא ' + termOf(cfg, 'entity.course', 'חוג') + '"'}
      </div>
      <Field label={'תיאור — על ה' + termOf(cfg, 'entity.course', 'חוג') + ' וה' + termOf(cfg, 'entity.teacher', 'מורה')}>
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
