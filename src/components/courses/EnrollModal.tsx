/**
 * שיבוץ תלמיד/ה לקורס — בוחר תלמיד עם חיפוש חכם על כל בני המשפחות,
 * בדיקת תפוסה (maxStudents), כפילות, ניקובים בכרטיסייה ושיוך קבוצה.
 */
import { useMemo, useState } from 'react';
import type { Course, Enrollment, Family, Member } from '../../types/domain';
import { emptyFamily } from '../../types/domain';
import { allMembers, useApp } from '../../store/useApp';
import { featureOn, termOf } from '../../lib/config';
import { smartFilter } from '../../lib/search';
import { formatIsraeliPhone } from '../../lib/validate';
import { Btn, Field, FormError, Modal, Select, TextInput } from '../ui';
import { HebDateInput } from '../HebDateInput';
import type { PricingTerm } from '../../types/domain';
import {
  ENROLL_NEW_FAMILY,
  PRICING_TERMS,
  ageOf,
  courseFitsMember,
  enrollCount,
  groupOptionsOf,
  isoToday,
  lessonTierOptions,
  offerNewFamily,
  resolveEnrollFamily,
  scheduleClashText,
  weightedQuote,
} from './lib';

export function EnrollModal(props: { course: Course; onClose: () => void }) {
  const db = useApp((s) => s.db);
  const upsertEnrollment = useApp((s) => s.upsertEnrollment);
  const upsertFamily = useApp((s) => s.upsertFamily);
  const upsertMember = useApp((s) => s.upsertMember);
  const nextId = useApp((s) => s.nextId);
  const toast = useApp((s) => s.toast);
  const cfg = useApp((s) => s.config);

  const punchOn = featureOn(cfg, 'courses.punch');
  const groupsOn = featureOn(cfg, 'courses.groups');
  // סינון שיבוץ חכם (P1.7, הכרעה 3) — מועמדים מתאימים לגיל/מגדר החוג + "הצג הכל"
  const smartOn = featureOn(cfg, 'courses.enroll.smartfilter');
  // תלמיד/ה חדש/ה + משפחה חדשה בלי לצאת מהמסך (P1.10, legacy saveEnrollNew)
  const inlineOn = featureOn(cfg, 'courses.enroll.inlinecreate');

  const c = props.course;
  // תמחור משוקלל פר-שיעור (בקשת-בעלים 13.8 ב') — פעיל רק כשהחוג מוגדר perLesson
  const perLessonOn = featureOn(cfg, 'courses.perlesson') && !!c.perLesson;
  const [q, setQ] = useState('');
  const [listOpen, setListOpen] = useState(false);
  const [memberId, setMemberId] = useState('');
  const [purchased, setPurchased] = useState(c.size ? String(c.size) : '12');
  const [group, setGroup] = useState('');
  const [error, setError] = useState('');
  const [showAll, setShowAll] = useState(false);
  // בחירת התדירות/התקופה/ההנחה בתמחור המשוקלל
  const [freq, setFreq] = useState('1');
  const [freqUnit, setFreqUnit] = useState<'week' | 'month'>('week');
  const [term, setTerm] = useState<PricingTerm>('monthly');
  const [termMonths, setTermMonths] = useState('3');
  const [tier, setTier] = useState<'' | '1' | '2' | '3'>('');

  const quote = perLessonOn
    ? weightedQuote(c, { freq: +freq || 0, unit: freqUnit, term, months: +termMonths || 1, tier })
    : null;
  /** שדות-התמחור-המשוקלל להטמעה בשיבוץ (totalDue + פרמטרי הבחירה). */
  const pricingFields = perLessonOn
    ? { totalDue: quote!.total, freq: +freq || 0, freqUnit, term, termMonths: term === 'months' ? +termMonths || 1 : undefined, tier }
    : { totalDue: 0 };
  const tierOptions = perLessonOn ? lessonTierOptions(c) : [];

  const groups = groupsOn ? groupOptionsOf(c) : [];

  /** מועמדים לשיבוץ — כל בני המשפחות שעדיין לא משובצים לקורס הזה. */
  const options = useMemo(() => {
    const enrolledIds = new Set(db.enrollments.filter((e) => e.courseId === c.id).map((e) => e.memberId));
    return allMembers(db)
      .filter((m) => !enrolledIds.has(m.id))
      .map((m) => ({
        id: m.id,
        gender: m.gender,
        birth: m.birth,
        grade: m.grade,
        label:
          (m.isParent ? (m.gender === 'f' ? 'אמא — ' : 'אבא — ') : '') +
          m.first +
          ' · ' +
          termOf(cfg, 'entity.familyOf', 'משפחת') +
          ' ' +
          m.famName,
        terms: [m.first, m.famName, (m.phone || '').replace(/\D/g, ''), m.idNum].filter(Boolean),
      }));
  }, [db, c.id, cfg]);

  // המתאימים לחוג לפי גיל/מגדר — בלי תלות במתג, כדי שהמתג לא ייעלם אחרי "הצג הכל".
  // כיתה נבדקת רק כש-courses.gradeimg פעיל (P2 פער 28) — אותו "הצג הכל" רך.
  const gradeimgOn = featureOn(cfg, 'courses.gradeimg');
  const fitted = useMemo(
    () =>
      smartOn
        ? options.filter((o) => courseFitsMember(c, o.gender, ageOf(o.birth), gradeimgOn ? o.grade : undefined))
        : options,
    [smartOn, options, c, gradeimgOn],
  );
  const hiddenCount = options.length - fitted.length;
  const shownOptions = showAll ? options : fitted;

  // חיפוש חכם — סבלני לשגיאות הקלדה ולתעתיק, לפי שם/משפחה/טלפון/ת"ז
  const matches = useMemo(() => {
    if (!q.trim()) return shownOptions.slice(0, 7);
    return smartFilter(q, shownOptions, (o) => o.terms, 7);
  }, [q, shownOptions]);

  // אזהרת התנגשות לו"ז מול השיבוצים הקיימים של הילד הנבחר (P1.7) — מייעץ, לא חוסם
  const clash = smartOn && memberId ? scheduleClashText(db, memberId, c) : null;

  // ── תלמיד/ה חדש/ה + משפחה (P1.10, legacy saveEnrollNew 1318-1339) ──
  const [newOpen, setNewOpen] = useState(false);
  const [famQ, setFamQ] = useState('');
  const [famListOpen, setFamListOpen] = useState(false);
  const [famSel, setFamSel] = useState(''); // id של משפחה קיימת או ENROLL_NEW_FAMILY
  const [newFamName, setNewFamName] = useState('');
  const [newFamPhone, setNewFamPhone] = useState('');
  const [nFirst, setNFirst] = useState('');
  const [nGender, setNGender] = useState<'m' | 'f'>('f'); // ברירת הלגאסי: 'f'
  const [nBirth, setNBirth] = useState('');

  const famMatches = useMemo(() => {
    const opts = db.families.map((f) => ({
      id: f.id,
      label: termOf(cfg, 'entity.familyOf', 'משפחת') + ' ' + f.name + (f.city ? ' · ' + f.city : ''),
      terms: [f.name, f.father, f.mother, f.city].filter(Boolean),
    }));
    const list = famQ.trim() ? smartFilter(famQ, opts, (o) => o.terms, 6) : opts.slice(0, 6);
    // "＋ משפחה חדשה" — רק לשאילתה ≥2 תווים בלי התאמה מדויקת (legacy:2188)
    if (offerNewFamily(db.families, famQ)) {
      list.push({
        id: ENROLL_NEW_FAMILY,
        label: '＋ ' + termOf(cfg, 'entity.family', 'משפחה') + ' חדשה: "' + famQ.trim() + '" — יצירה ושיבוץ בלי לצאת מהמסך',
        terms: [],
      });
    }
    return list;
  }, [famQ, db.families, cfg]);

  /** שמירת תלמיד/ה חדש/ה — יצירת משפחה (עם דה-דופ), הוספת בן-משפחה ושיבוץ. */
  function saveNew() {
    const resolved = resolveEnrollFamily(db.families, famSel, newFamName);
    if (!resolved.fam && !resolved.create)
      return setError('יש לבחור ' + termOf(cfg, 'entity.family', 'משפחה') + ' מהרשימה — או להקליד שם חדש ולבחור "＋ ' + termOf(cfg, 'entity.family', 'משפחה') + ' חדשה"');
    if (!nFirst.trim()) return setError('שם פרטי הוא שדה חובה');
    if (enrollCount(db, c.id) >= (c.maxStudents || 999))
      return setError('ה' + termOf(cfg, 'entity.course', 'חוג') + ' מלא — הגעתם למקסימום ה' + termOf(cfg, 'entity.students', 'תלמידים') + ' שהוגדר');
    const isPunch = c.model === 'punch';
    const bought = isPunch ? +(purchased || c.size || 12) : 0;
    if (isPunch && (isNaN(bought) || bought <= 0 || !Number.isInteger(bought)))
      return setError('מספר ניקובים חייב להיות גדול מ-0');

    let fam: Pick<Family, 'id' | 'name'>;
    let famCreated = false;
    if (resolved.fam) {
      fam = resolved.fam;
    } else {
      const fresh: Family = {
        ...emptyFamily(),
        id: nextId('f'),
        createdAt: isoToday(),
        name: newFamName.trim(),
        phone: formatIsraeliPhone(newFamPhone.trim()),
      };
      upsertFamily(fresh);
      fam = fresh;
      famCreated = true;
    }
    const m: Member = {
      id: nextId('m'),
      first: nFirst.trim(),
      gender: nGender,
      birth: nBirth,
      idNum: '', phone: '', phone2: '', school: '', grade: '', health: '',
      mSefach: false, mInvite: false, mRecommend: false, mPhotos: false, mVideos: false, notes: '',
    };
    upsertMember(fam.id, m);
    upsertEnrollment({
      id: nextId('e'),
      memberId: m.id,
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
    });
    toast(
      (famCreated ? termOf(cfg, 'entity.familyOf', 'משפחת') + ' ' + fam.name + ' נוצרה, ' : '') +
        m.first + ' נוסף/ה ל' + termOf(cfg, 'entity.familyOf', 'משפחת') + ' ' + fam.name + ' ושובצ/ה ל"' + c.name + '"',
    );
    props.onClose();
  }

  function pick(id: string, label: string) {
    setMemberId(id);
    setQ(label);
    setListOpen(false);
    setError('');
  }

  function save() {
    if (!memberId) return setError('יש לבחור ' + termOf(cfg, 'entity.student', 'תלמיד/ה'));
    if (db.enrollments.some((e) => e.memberId === memberId && e.courseId === c.id))
      return setError('כבר משובץ/ת ל' + termOf(cfg, 'entity.course', 'חוג') + ' הזה');
    if (enrollCount(db, c.id) >= (c.maxStudents || 999))
      return setError('ה' + termOf(cfg, 'entity.course', 'חוג') + ' מלא — הגעתם למקסימום ה' + termOf(cfg, 'entity.students', 'תלמידים') + ' שהוגדר');
    const isPunch = c.model === 'punch';
    const bought = isPunch ? +(purchased || c.size || 12) : 0;
    if (isPunch && (isNaN(bought) || bought <= 0 || !Number.isInteger(bought)))
      return setError('מספר ניקובים חייב להיות גדול מ-0');

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
    toast('ה' + termOf(cfg, 'entity.student', 'תלמיד/ה') + ' שובצ/ה ל' + termOf(cfg, 'entity.course', 'חוג'));
    props.onClose();
  }

  return (
    <Modal title={termOf(cfg, 'entity.enrollment', 'שיבוץ') + ' ל' + termOf(cfg, 'entity.course', 'חוג')} onClose={props.onClose}>
      {/* מתג "הצג הכל" — כשהסינון החכם מסתיר מועמדים שאינם בטווח הגיל/מגדר */}
      {smartOn && hiddenCount > 0 && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6, fontSize: 12.5 }}>
          <span style={{ color: 'var(--ink-soft)', fontWeight: 600 }}>
            {showAll
              ? 'מוצגים כולם (' + hiddenCount + ' מחוץ להתאמת ה' + termOf(cfg, 'entity.course', 'חוג') + ')'
              : hiddenCount + ' מועמדים הוסתרו (מחוץ לגיל/מגדר של ה' + termOf(cfg, 'entity.course', 'חוג') + ')'}
          </span>
          <button type="button" className="chip" onClick={() => setShowAll((v) => !v)}>
            {showAll ? 'סינון מותאם ✓' : 'הצג הכל'}
          </button>
        </div>
      )}
      <Field label={termOf(cfg, 'entity.student', 'תלמיד/ה') + ' * (הקלדה חכמה — שם או ' + termOf(cfg, 'entity.family', 'משפחה') + ')'}>
        <TextInput
          value={q}
          onChange={(v) => {
            setQ(v);
            setListOpen(true);
            setMemberId('');
          }}
          placeholder="הקלידו שם — חיזוי חכם ותיקון שגיאות…"
        />
      </Field>
      {listOpen && (
        <div
          style={{
            border: '1px solid var(--line)',
            borderRadius: 10,
            marginTop: -8,
            marginBottom: 12,
            overflow: 'hidden',
            maxHeight: 180,
            overflowY: 'auto',
          }}
        >
          {matches.map((o) => (
            <button
              key={o.id}
              type="button"
              onClick={() => pick(o.id, o.label)}
              style={{
                display: 'block',
                width: '100%',
                textAlign: 'right',
                padding: '8px 12px',
                fontSize: 13,
                fontWeight: 700,
                borderBottom: '1px solid #f2efe8',
              }}
            >
              {o.label}
            </button>
          ))}
          {matches.length === 0 && (
            <div style={{ padding: '8px 12px', fontSize: 12.5, color: 'var(--ink-faint)' }}>
              {'לא נמצאו ' + termOf(cfg, 'entity.students', 'תלמידים') + ' פנויים — בדקו את האיות או הוסיפו בן משפחה במסך המשפחות'}
            </div>
          )}
        </div>
      )}
      {groups.length > 0 && (
        <Field label={'קבוצה — מסונכרן לקבוצות ה' + termOf(cfg, 'entity.course', 'חוג')}>
          <Select
            value={group}
            onChange={setGroup}
            options={[{ value: '', label: 'ללא שיוך' }, ...groups.map((g) => ({ value: g.v, label: g.t }))]}
          />
        </Field>
      )}
      {punchOn && c.model === 'punch' && (
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
              {/* 🐛 נחיל-עמוק (13.8): "×" רמז לשוויון-מכפלה שלא מסתדר עם הסכום (עיגול
                  חצאי-שיעורים לתצוגה). תיאור שני הנתונים בלי לטעון שמכפלתם = הסה"כ. */}
              {' · ' + quote.lessons + ' שיעורים · ₪' + quote.perLesson + ' לשיעור'}
            </span>
          </div>
        </div>
      )}
      {clash && (
        <div style={{ fontSize: 12.5, fontWeight: 700, color: '#b91c1c', marginBottom: 8 }}>{clash}</div>
      )}

      {/* תלמיד/ה חדש/ה + משפחה — בלי לצאת מהמסך (P1.10, legacy saveEnrollNew) */}
      {inlineOn && (
        <div style={{ border: '1.5px dashed var(--line)', borderRadius: 12, padding: '10px 12px', marginBottom: 10 }}>
          <button
            type="button"
            onClick={() => setNewOpen((v) => !v)}
            style={{ fontSize: 13, fontWeight: 800, background: 'transparent', cursor: 'pointer', padding: 0 }}
          >
            {(newOpen ? '▲ ' : '▼ ') + '➕ ' + termOf(cfg, 'entity.student', 'תלמיד/ה') + ' חדש/ה — כולל ' + termOf(cfg, 'entity.family', 'משפחה') + ' חדשה, בלי לצאת מהמסך'}
          </button>
          {newOpen && (
            <div style={{ marginTop: 8 }}>
              <Field label={termOf(cfg, 'entity.family', 'משפחה') + ' * (חיפוש — או הקלדת שם חדש)'}>
                <TextInput
                  value={famQ}
                  onChange={(v) => {
                    setFamQ(v);
                    setFamListOpen(true);
                    setFamSel('');
                    setNewFamName('');
                  }}
                  placeholder={'הקלידו שם ' + termOf(cfg, 'entity.family', 'משפחה') + ' קיימת או חדשה…'}
                />
              </Field>
              {famListOpen && famMatches.length > 0 && (
                <div style={{ border: '1px solid var(--line)', borderRadius: 10, marginTop: -8, marginBottom: 12, overflow: 'hidden', maxHeight: 160, overflowY: 'auto' }}>
                  {famMatches.map((o) => (
                    <button
                      key={o.id}
                      type="button"
                      onClick={() => {
                        setFamSel(o.id);
                        if (o.id === ENROLL_NEW_FAMILY) setNewFamName(famQ.trim());
                        setFamQ(o.id === ENROLL_NEW_FAMILY ? '＋ חדשה: ' + famQ.trim() : o.label);
                        setFamListOpen(false);
                        setError('');
                      }}
                      style={{ display: 'block', width: '100%', textAlign: 'right', padding: '8px 12px', fontSize: 13, fontWeight: 700, borderBottom: '1px solid #f2efe8', color: o.id === ENROLL_NEW_FAMILY ? '#9a6414' : undefined }}
                    >
                      {o.label}
                    </button>
                  ))}
                </div>
              )}
              {famSel === ENROLL_NEW_FAMILY && (
                <Field label={'טלפון ל' + termOf(cfg, 'entity.family', 'משפחה') + ' החדשה (רשות)'}>
                  <TextInput value={newFamPhone} onChange={setNewFamPhone} placeholder="050-0000000" dir="ltr" />
                </Field>
              )}
              <div className="form-grid">
                <Field label="שם פרטי *">
                  <TextInput value={nFirst} onChange={setNFirst} placeholder="לדוגמה: רבקה" />
                </Field>
                <Field label="בן/בת">
                  <Select
                    value={nGender}
                    onChange={(v) => setNGender(v === 'm' ? 'm' : 'f')}
                    options={[
                      { value: 'f', label: 'בת' },
                      { value: 'm', label: 'בן' },
                    ]}
                  />
                </Field>
              </div>
              <Field label="תאריך לידה (רשות)">
                <HebDateInput value={nBirth} onChange={setNBirth} />
              </Field>
              <Btn kind="primary" onClick={saveNew}>
                {'➕ יצירה ו' + termOf(cfg, 'entity.enrollment', 'שיבוץ')}
              </Btn>
            </div>
          )}
        </div>
      )}

      <FormError error={error} />
      <div className="modal-actions">
        <Btn kind="primary" onClick={save}>
          {termOf(cfg, 'entity.enrollment', 'שיבוץ')}
        </Btn>
        <Btn onClick={props.onClose}>ביטול</Btn>
      </div>
    </Modal>
  );
}
