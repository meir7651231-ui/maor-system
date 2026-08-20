/**
 * ＋ שיבוץ לחוג מתוך כרטיס המשפחה — port של saveJoin מהמקור:
 * בוחר חוג ובן/בת משפחה בחיפוש חכם, אפשרויות הורה וירטואליות (אבא/אמא — __pf/__pm)
 * שנוצרות כ-Member רק בשמירה, הוספת בן משפחה תוך כדי שיבוץ (afterMember),
 * ורמזים מייעצים (גיל/מין) שאינם חוסמים.
 */
import { useMemo, useRef, useState } from 'react';
import type { Enrollment, Family, Member, PricingTerm } from '../../types/domain';
import { useApp } from '../../store/useApp';
import { featureOn, termOf } from '../../lib/config';
import { smartFilter } from '../../lib/search';
import { Btn, Field, FormError, Modal, Select, TextInput } from '../ui';
import { ageOf, isoToday } from './lib';
import { DAY_NAMES, PRICING_TERMS, courseFitsMember, enrollCount, groupOptionsOf, lessonTierOptions, scheduleClashText, sessionsOf, weightedQuote } from '../courses/lib';
import { MemberForm } from './MemberForm';

/** מזהים וירטואליים להורים שטרם קיימים כ-Member (כמו __pf/__pm במקור). */
const VIRT_FATHER = '__pf';
const VIRT_MOTHER = '__pm';

interface PickOption {
  id: string;
  label: string;
  terms: string[];
}

/** תווית בן משפחה — שם + גיל, עם קידומת אבא/אמא להורים (כמו במקור). */
function memberLabel(m: Member): string {
  const age = ageOf(m.birth);
  return (
    (m.isParent ? (m.gender === 'f' ? 'אמא — ' : 'אבא — ') : '') +
    m.first +
    (age != null ? ' · ' + (m.gender === 'f' ? 'בת ' : 'בן ') + age : '')
  );
}

const listBoxStyle = {
  border: '1px solid var(--line)',
  borderRadius: 10,
  marginTop: -8,
  marginBottom: 12,
  overflow: 'hidden',
  maxHeight: 180,
  overflowY: 'auto',
} as const;

const listRowStyle = {
  display: 'block',
  width: '100%',
  textAlign: 'right',
  padding: '8px 12px',
  fontSize: 13,
  fontWeight: 700,
  borderBottom: '1px solid #f2efe8',
} as const;

export function JoinModal(props: { family: Family; onClose: () => void }) {
  const db = useApp((s) => s.db);
  const upsertMember = useApp((s) => s.upsertMember);
  const upsertEnrollment = useApp((s) => s.upsertEnrollment);
  const nextId = useApp((s) => s.nextId);
  const toast = useApp((s) => s.toast);
  const config = useApp((s) => s.config);

  // המשפחה נקראת חיה מה-store — כך בן משפחה שנוסף תוך כדי שיבוץ מופיע מיד
  const fam = db.families.find((f) => f.id === props.family.id) ?? props.family;

  const [memberQ, setMemberQ] = useState('');
  const [memberListOpen, setMemberListOpen] = useState(false);
  const [memberSel, setMemberSel] = useState('');
  const [courseQ, setCourseQ] = useState('');
  const [courseListOpen, setCourseListOpen] = useState(false);
  const [courseId, setCourseId] = useState('');
  const [purchased, setPurchased] = useState('');
  const [group, setGroup] = useState('');
  // תמחור משוקלל פר-שיעור — זהה ל-EnrollModal (תיקון S1: לא לקבוע totalDue:0 תמיד)
  const [freq, setFreq] = useState('1');
  const [freqUnit, setFreqUnit] = useState<'week' | 'month'>('week');
  const [term, setTerm] = useState<PricingTerm>('monthly');
  const [termMonths, setTermMonths] = useState('3');
  const [tier, setTier] = useState<'' | '1' | '2' | '3'>('');
  const [error, setError] = useState('');
  const [memberFormOpen, setMemberFormOpen] = useState(false);
  // סינון שיבוץ חכם (P1.7, הכרעה 3) — סינון רך לפי גיל/מגדר עם מתג "הצג הכל"
  const smartOn = featureOn(config, 'courses.enroll.smartfilter');
  const [showAll, setShowAll] = useState(false);
  const membersBefore = useRef<Set<string>>(new Set());

  /** בני המשפחה + הורים וירטואליים כשיש שם הורה בלי Member תואם (isParent). */
  const memberOptions = useMemo<PickOption[]>(() => {
    const opts: PickOption[] = fam.members.map((m) => ({
      id: m.id,
      label: memberLabel(m),
      terms: [memberLabel(m), m.first, fam.name],
    }));
    if (fam.father && !fam.members.some((x) => x.isParent && x.gender === 'm'))
      opts.push({ id: VIRT_FATHER, label: 'אבא — ' + fam.father, terms: ['אבא', fam.father] });
    if (fam.mother && !fam.members.some((x) => x.isParent && x.gender === 'f'))
      opts.push({ id: VIRT_MOTHER, label: 'אמא — ' + fam.mother, terms: ['אמא', fam.mother] });
    return opts;
  }, [fam]);

  /** חוגים פעילים — שטרם הסתיימו לפי תאריך הסיום. */
  const courseOptions = useMemo<PickOption[]>(() => {
    const today = isoToday();
    const teacherName = (id: string) => db.teachers.find((t) => t.id === id)?.name ?? '—';
    return db.courses
      .filter((c) => !c.end || c.end >= today)
      .map((c) => ({
        id: c.id,
        label: c.name + ' · ' + teacherName(c.teacherId) + ' · יום ' + DAY_NAMES[sessionsOf(c)[0].day],
        terms: [c.name, c.cat, teacherName(c.teacherId)],
      }));
  }, [db.courses, db.teachers]);

  const memberMatches = useMemo(
    () => (memberQ.trim() ? smartFilter(memberQ, memberOptions, (o) => o.terms, 7) : memberOptions.slice(0, 7)),
    [memberQ, memberOptions],
  );

  const course = db.courses.find((c) => c.id === courseId);
  const groups = course ? groupOptionsOf(course) : [];
  // תמחור משוקלל פר-שיעור (13.8 ב') — פעיל רק כשהחוג הנבחר perLesson. זהה ל-EnrollModal
  // כדי ששיבוץ מכרטיס-המשפחה ומכרטיס-החוג ייתנו totalDue זהה (קודם קובע 0 תמיד — S1).
  const perLessonOn = featureOn(config, 'courses.perlesson') && !!course?.perLesson;
  const tierOptions = perLessonOn && course ? lessonTierOptions(course) : [];
  const quote =
    perLessonOn && course ? weightedQuote(course, { freq: +freq || 0, unit: freqUnit, term, months: +termMonths || 1, tier }) : null;
  /** שדות-התמחור להטמעה בשיבוץ (totalDue + פרמטרי-הבחירה) — זהה ל-EnrollModal. */
  const pricingFields = perLessonOn && quote
    ? { totalDue: quote.total, freq: +freq || 0, freqUnit, term, termMonths: term === 'months' ? +termMonths || 1 : undefined, tier }
    : { totalDue: 0 };

  /** בן המשפחה הנבחר (או ייצוג ההורה הווירטואלי) — לרמזי הגיל/מין. */
  const jm: { first: string; gender: 'm' | 'f'; birth: string; grade?: string } | undefined =
    memberSel === VIRT_FATHER
      ? { first: fam.father, gender: 'm', birth: '' }
      : memberSel === VIRT_MOTHER
        ? { first: fam.mother, gender: 'f', birth: '' }
        : fam.members.find((x) => x.id === memberSel);

  // סינון החוגים לפי גיל/מגדר הילד הנבחר (P1.7) — רך: "הצג הכל" מחזיר את כולם.
  // המתאימים מחושבים בלי תלות במתג, כדי שהמתג לא ייעלם אחרי "הצג הכל".
  // כיתה נבדקת רק כש-courses.gradeimg פעיל (P2 פער 28).
  const gradeimgOn = featureOn(config, 'courses.gradeimg');
  const fittedCourseOptions = useMemo(() => {
    if (!smartOn || !jm) return courseOptions;
    const age = ageOf(jm.birth);
    return courseOptions.filter((o) => {
      const c = db.courses.find((x) => x.id === o.id);
      return !c || courseFitsMember(c, jm.gender, age, gradeimgOn ? jm.grade : undefined);
    });
  }, [smartOn, jm, courseOptions, db.courses, gradeimgOn]);
  const hiddenCount = courseOptions.length - fittedCourseOptions.length;
  const shownCourseOptions = showAll ? courseOptions : fittedCourseOptions;

  const courseMatches = useMemo(
    () => (courseQ.trim() ? smartFilter(courseQ, shownCourseOptions, (o) => o.terms, 7) : shownCourseOptions.slice(0, 7)),
    [courseQ, shownCourseOptions],
  );

  /** רמזים מייעצים — לא חוסמים שמירה (wording מהמקור). */
  const hints: { t: string; c: string }[] = [];
  if (smartOn && jm && course && memberSel && memberSel !== VIRT_FATHER && memberSel !== VIRT_MOTHER) {
    // אזהרת התנגשות לו"ז מול השיבוצים הקיימים של הילד (P1.7) — מייעץ, לא חוסם
    const clash = scheduleClashText(db, memberSel, course);
    if (clash) hints.push({ t: clash, c: '#b91c1c' });
  }
  if (jm && course) {
    const a = ageOf(jm.birth);
    const lo = course.ageMin || 3;
    const hi = course.ageMax || 99;
    if (a != null) {
      hints.push(
        a >= lo && a <= hi
          ? { t: '✓ גיל מתאים — ' + a + ' (טווח החוג ' + lo + '–' + hi + ')', c: '#12803c' }
          : { t: 'שימו לב: גיל ' + a + ' מחוץ לטווח המומלץ (' + lo + '–' + hi + ')', c: '#9a6414' },
      );
    }
    if (course.gender !== 'all' && course.gender !== jm.gender)
      hints.push({
        t: course.gender === 'm'
          ? 'ה' + termOf(config, 'entity.course', 'חוג') + ' מיועד לבנים בלבד'
          : 'ה' + termOf(config, 'entity.course', 'חוג') + ' מיועד לבנות בלבד',
        c: '#9a6414',
      });
  }

  function pickMember(o: PickOption) {
    setMemberSel(o.id);
    setMemberQ(o.label);
    setMemberListOpen(false);
    setError('');
  }

  function pickCourse(o: PickOption) {
    const c = db.courses.find((x) => x.id === o.id);
    setCourseId(o.id);
    setCourseQ(o.label);
    setCourseListOpen(false);
    setGroup('');
    if (c?.model === 'punch') setPurchased(String(c.size || 12));
    setError('');
  }

  /** ＋ בן/בת משפחה חדש/ה — פותח את MemberForm וחוזר לשיבוץ עם הנבחר/ת (afterMember). */
  function openMemberForm() {
    membersBefore.current = new Set(fam.members.map((m) => m.id));
    setMemberListOpen(false);
    setMemberFormOpen(true);
  }

  function closeMemberForm() {
    setMemberFormOpen(false);
    const cur = useApp.getState().db.families.find((f) => f.id === fam.id);
    const added = cur?.members.find((m) => !membersBefore.current.has(m.id));
    if (added) pickMember({ id: added.id, label: memberLabel(added), terms: [] });
  }

  function save() {
    if (!memberSel) return setError('יש לבחור ילד/ה או הורה');
    const c = db.courses.find((x) => x.id === courseId);
    if (!c) return setError('יש לבחור ' + termOf(config, 'entity.course', 'חוג'));

    // הורה וירטואלי — אם כבר קיים Member הורה מאותו המין, משתמשים בו
    const isVirtual = memberSel === VIRT_FATHER || memberSel === VIRT_MOTHER;
    const isMother = memberSel === VIRT_MOTHER;
    const existingParent = isVirtual
      ? fam.members.find((x) => x.isParent && x.gender === (isMother ? 'f' : 'm'))
      : undefined;
    const resolvedId = isVirtual ? existingParent?.id : memberSel;

    if (resolvedId && db.enrollments.some((e) => e.memberId === resolvedId && e.courseId === c.id))
      return setError('כבר משובץ/ת ל' + termOf(config, 'entity.course', 'חוג'));
    const n = enrollCount(db, c.id);
    if (n >= (c.maxStudents || 999))
      return setError('ה' + termOf(config, 'entity.course', 'חוג') + ' מלא/ה (' + n + '/' + c.maxStudents + ')');
    const isPunch = c.model === 'punch';
    const bought = isPunch ? +(purchased || c.size || 12) : 0;
    if (isPunch && (isNaN(bought) || bought <= 0 || !Number.isInteger(bought)))
      return setError('מספר ניקובים חייב להיות גדול מ-0');

    let memberId = resolvedId;
    if (!memberId) {
      // יצירת ההורה כ-Member בשמירה בלבד (port של זרימת __pf/__pm)
      const pm: Member = {
        id: nextId('mp'),
        first: (isMother ? fam.mother : fam.father) || (isMother ? 'אמא' : 'אבא'),
        gender: isMother ? 'f' : 'm',
        birth: '',
        idNum: '',
        phone: fam.phone,
        phone2: fam.phone2,
        school: '',
        grade: '',
        health: '',
        mSefach: false,
        mInvite: false,
        mRecommend: false,
        mPhotos: false,
        mVideos: false,
        notes: '',
        isParent: true,
      };
      upsertMember(fam.id, pm);
      memberId = pm.id;
    }

    const enrollment: Enrollment = {
      id: nextId('e'),
      memberId,
      courseId: c.id,
      plan: c.model,
      purchased: bought,
      used: 0,
      group,
      absences: [],
      payments: [],
      dueDate: '',
      status: 'active',
      note: '',
      enrolledAt: isoToday(),
      ...pricingFields,
    };
    upsertEnrollment(enrollment);
    const first = isVirtual
      ? (isMother ? fam.mother : fam.father) || (isMother ? 'אמא' : 'אבא')
      : fam.members.find((x) => x.id === memberId)?.first ?? '';
    toast(first + ' שובצ/ה ל"' + c.name + '"');
    props.onClose();
  }

  // תוך כדי הוספת בן משפחה — טופס ה-Member מוצג במקום מודאל השיבוץ, והמצב נשמר
  if (memberFormOpen) return <MemberForm famId={fam.id} member={null} onClose={closeMemberForm} />;

  return (
    <Modal
      title={
        termOf(config, 'entity.enrollment', 'שיבוץ') +
        ' ל' +
        termOf(config, 'entity.course', 'חוג') +
        ' — ' +
        termOf(config, 'entity.familyOf', 'משפחת') +
        ' ' +
        fam.name
      }
      onClose={props.onClose}
    >
      <Field label="ילד/ה או הורה * (הקלדה חכמה)">
        <TextInput
          value={memberQ}
          onChange={(v) => {
            setMemberQ(v);
            setMemberListOpen(true);
            setMemberSel('');
          }}
          placeholder="הקלידו שם — חיזוי חכם ותיקון שגיאות…"
        />
      </Field>
      {memberListOpen && (
        <div style={listBoxStyle}>
          {memberMatches.map((o) => (
            <button key={o.id} type="button" onClick={() => pickMember(o)} style={listRowStyle}>
              {o.label}
            </button>
          ))}
          <button
            type="button"
            onClick={openMemberForm}
            style={{ ...listRowStyle, color: '#9a6414', borderBottom: 'none' }}
          >
            {'➕ הוספת ' +
              termOf(config, 'entity.member', 'בן/בת משפחה') +
              ' — הוספה מהירה וחזרה אוטומטית ל' +
              termOf(config, 'entity.enrollment', 'שיבוץ')}
          </button>
        </div>
      )}

      {/* מתג "הצג הכל" — כשהסינון החכם מסתיר חוגים שאינם מתאימים לגיל/מגדר */}
      {smartOn && jm && hiddenCount > 0 && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6, fontSize: 12.5 }}>
          <span style={{ color: 'var(--ink-soft)', fontWeight: 600 }}>
            {showAll
              ? 'מוצגים כל ה' + termOf(config, 'nav.courses', 'חוגים') + ' (' + hiddenCount + ' מחוץ להתאמה)'
              : hiddenCount + ' ' + termOf(config, 'nav.courses', 'חוגים') + ' הוסתרו (לא מתאימים לגיל/מגדר)'}
          </span>
          <button type="button" className="chip" onClick={() => setShowAll((v) => !v)}>
            {showAll ? 'סינון מותאם ✓' : 'הצג הכל'}
          </button>
        </div>
      )}
      <Field label={termOf(config, 'entity.course', 'חוג') + ' * (שם, קטגוריה או מורה)'}>
        <TextInput
          value={courseQ}
          onChange={(v) => {
            setCourseQ(v);
            setCourseListOpen(true);
            setCourseId('');
          }}
          placeholder={'הקלידו שם ' + termOf(config, 'entity.course', 'חוג') + ', קטגוריה או מורה…'}
        />
      </Field>
      {courseListOpen && (
        <div style={listBoxStyle}>
          {courseMatches.map((o) => (
            <button key={o.id} type="button" onClick={() => pickCourse(o)} style={listRowStyle}>
              {o.label}
            </button>
          ))}
          {courseMatches.length === 0 && (
            <div style={{ padding: '8px 12px', fontSize: 12.5, color: 'var(--ink-faint)' }}>
              לא נמצאו {termOf(config, 'nav.courses', 'חוגים')} פעילים תואמים — בדקו את האיות
            </div>
          )}
        </div>
      )}

      {hints.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginBottom: 12 }}>
          {hints.map((h, i) => (
            <div key={i} style={{ fontSize: 12.5, fontWeight: 700, color: h.c }}>
              {h.t}
            </div>
          ))}
        </div>
      )}

      {groups.length > 0 && (
        <Field label={'קבוצה — מסונכרן לקבוצות ה' + termOf(config, 'entity.course', 'חוג')}>
          <Select
            value={group}
            onChange={setGroup}
            options={[{ value: '', label: 'ללא שיוך' }, ...groups.map((g) => ({ value: g.v, label: g.t }))]}
          />
        </Field>
      )}
      {course?.model === 'punch' && (
        <Field label="ניקובים בכרטיסייה">
          <TextInput value={purchased} onChange={setPurchased} placeholder="12" dir="ltr" />
        </Field>
      )}
      {perLessonOn && quote && (
        <div style={{ border: '1px solid var(--line)', borderRadius: 12, padding: '10px 12px', marginBottom: 10, background: 'var(--surface-2, #fafaf7)' }}>
          <div style={{ fontSize: 13, fontWeight: 800, marginBottom: 8 }}>💡 תמחור משוקלל פר-שיעור</div>
          <div className="form-grid">
            <Field label="תדירות">
              <div style={{ display: 'flex', gap: 6 }}>
                <TextInput value={freq} onChange={setFreq} dir="ltr" type="number" />
                <Select
                  value={freqUnit}
                  onChange={(v) => setFreqUnit(v === 'month' ? 'month' : 'week')}
                  options={[
                    { value: 'week', label: 'פעמים בשבוע' },
                    { value: 'month', label: 'פעמים בחודש' },
                  ]}
                />
              </div>
            </Field>
            <Field label="תקופת חיוב">
              <Select value={term} onChange={(v) => setTerm(v as PricingTerm)} options={PRICING_TERMS.map((t) => ({ value: t.v, label: t.t }))} />
            </Field>
            {term === 'months' && (
              <Field label="מספר חודשים">
                <TextInput value={termMonths} onChange={setTermMonths} dir="ltr" type="number" />
              </Field>
            )}
            {tierOptions.length > 1 && (
              <Field label="הנחת הלקוח">
                <Select value={tier} onChange={(v) => setTier(v === '1' ? '1' : v === '2' ? '2' : v === '3' ? '3' : '')} options={tierOptions.map((o) => ({ value: o.v, label: o.t }))} />
              </Field>
            )}
          </div>
          <div style={{ marginTop: 6, fontSize: 14, fontWeight: 800, color: '#12803c' }}>
            {'סה"כ ל' + PRICING_TERMS.find((t) => t.v === term)?.t + ': ₪' + quote.total}
            <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--ink-faint)' }}>
              {' · ' + quote.lessons + ' שיעורים · ₪' + quote.perLesson + ' לשיעור'}
            </span>
          </div>
        </div>
      )}
      <FormError error={error} />
      <div className="modal-actions">
        <Btn kind="primary" onClick={save}>
          {termOf(config, 'entity.enrollment', 'שיבוץ')}
        </Btn>
        <Btn onClick={props.onClose}>ביטול</Btn>
      </div>
    </Modal>
  );
}
