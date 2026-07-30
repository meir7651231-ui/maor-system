/**
 * כרטיס קורס — תלמידים רשומים (ניקוב, ⚙ ניהול, ✕ חיסור, שיוך קבוצה),
 * שעות פעילות וקבוצות (עורך המפגשים) ופרטי הקורס.
 */
import { useMemo, useRef, useState } from 'react';
import type { Course, Enrollment, Weekday } from '../../types/domain';
import { allMembers, useApp } from '../../store/useApp';
import { featureOn, roleOf, termOf } from '../../lib/config';
import { hebDateFull } from '../../lib/hebrew';
import { downloadCsv, type Cell } from '../../lib/csvx';
import { buildCourseDailyRows } from '../../lib/courseDaily';
import { Btn, Empty } from '../ui';
import { CourseForm } from './CourseForm';
import { EnrollModal } from './EnrollModal';
import { ManageModal } from './ManageModal';
import { AbsenceModal } from './AbsenceModal';
import { CustomExport } from '../reports/CustomExport';
import {
  DAY_NAMES,
  TINTS,
  ageOf,
  chipStyle,
  enrollCount,
  fmtDate,
  groupLabelOf,
  groupOptionsOf,
  modelMeta,
  planLabelOf,
  priceSuffix,
  punchConfirmStep,
  PUNCH_CONFIRM_MS,
  sessionsOf,
  type PunchArm,
} from './lib';

const GROUP_PALETTE: [string, string][] = [
  ['#fdf1d4', '#9a6414'],
  ['#e7edf5', '#3a5a86'],
  ['#e4f5ea', '#12803c'],
  ['#efe7f3', '#7c3aed'],
  ['#fbeef3', '#be185d'],
];

type ModalState =
  | { kind: 'edit' }
  | { kind: 'enroll' }
  | { kind: 'manage'; enrollmentId: string }
  | { kind: 'absence'; enrollmentId: string }
  | null;

export function CourseDetail(props: { course: Course }) {
  const db = useApp((s) => s.db);
  const selectCourse = useApp((s) => s.selectCourse);
  const deleteCourse = useApp((s) => s.deleteCourse);
  const upsertCourse = useApp((s) => s.upsertCourse);
  const upsertEnrollment = useApp((s) => s.upsertEnrollment);
  const punch = useApp((s) => s.punch);
  const addCred = useApp((s) => s.addCred);
  const toast = useApp((s) => s.toast);
  const cfg = useApp((s) => s.config);

  const punchOn = featureOn(cfg, 'courses.punch');
  // אישור כפול לניקוב (P1.3, legacy:330-342) — דלוק כברירת מחדל כמו בקובץ החי
  const punchConfirmOn = featureOn(cfg, 'courses.punch.confirm');
  const groupsOn = featureOn(cfg, 'courses.groups');
  const printoutOn = featureOn(cfg, 'courses.printout');
  const discountsOn = featureOn(cfg, 'courses.discounts');
  // טווח כיתות + תמונת חוג (P2 פער 28)
  const gradeimgOn = featureOn(cfg, 'courses.gradeimg');
  // תפקיד מורה (P3 פריט 15) — עריכה/מחיקה מוסתרות למורה מחוברת
  const userEmail = useApp((s) => s.cloud.user?.email ?? null);
  const isTeacherUser = featureOn(cfg, 'shell.roles') && roleOf(cfg, userEmail) === 'teacher';

  const c = props.course;
  const [prevCourseId, setPrevCourseId] = useState(c.id);
  const [modal, setModal] = useState<ModalState>(null);
  const [expOpen, setExpOpen] = useState(false);
  const [noteVal, setNoteVal] = useState(c.notes);
  const [sessDay, setSessDay] = useState('0');
  const [sessTime, setSessTime] = useState('17:00');
  const [sessLabel, setSessLabel] = useState('');
  // זריון האישור הכפול לניקוב — מתפרק אוטומטית אחרי PUNCH_CONFIRM_MS (כמו בלגאסי)
  const [punchArm, setPunchArm] = useState<PunchArm | null>(null);
  const punchArmTimer = useRef(0);

  // מעבר לכרטיס קורס אחר בלי unmount (למשל בחירת חוג מפלטת הפקודות בזמן
  // שכרטיס פתוח) — הרכיב אינו ממופתח לפי id, ולכן חוצץ ההערה המקומי היה
  // נשאר של הקורס הקודם, ושמירה הייתה דורסת את הערת הקורס החדש בטקסט הישן.
  if (prevCourseId !== c.id) {
    setPrevCourseId(c.id);
    setNoteVal(c.notes);
    setModal(null);
  }

  const teacher = db.teachers.find((t) => t.id === c.teacherId);
  const room = db.rooms.find((r) => r.id === c.roomId);
  const enrolled = db.enrollments.filter((e) => e.courseId === c.id);
  // ממואיזים לפי db: allMembers רץ מחדש בכל render (גם בהקלדה), וה-.find לכל שורה
  // נתן O(מספר-שיבוצים × סה"כ-חברים). Map ממזהה→חבר הופך את זה ל-O(1) לשורה.
  const members = useMemo(() => allMembers(db), [db]);
  const memberById = useMemo(() => new Map(members.map((m) => [m.id, m])), [members]);
  const sessions = sessionsOf(c);
  // קבוצות כבויות בקונפיגורציה → התנהגות קבוצה-יחידה (אין בוררי קבוצה ואין עורך)
  const groups = groupsOn ? groupOptionsOf(c) : [];
  const mm = modelMeta(c);
  const tint = TINTS[Math.max(0, db.courses.indexOf(c)) % TINTS.length];
  const full = enrollCount(db, c.id) >= (c.maxStudents || 999);

  function doPunch(e: Enrollment) {
    if (e.status === 'paused') return toast('ה' + termOf(cfg, 'entity.enrollment', 'שיבוץ') + ' מוקפא — הפשירו אותו בניהול ה' + termOf(cfg, 'entity.enrollment', 'שיבוץ') + ' (⚙)');
    if (e.status === 'ended') return toast('ה' + termOf(cfg, 'entity.enrollment', 'שיבוץ') + ' הסתיים — ניתן לחדש בניהול ה' + termOf(cfg, 'entity.enrollment', 'שיבוץ') + ' (⚙)');
    if (e.plan === 'punch' && e.used >= e.purchased) {
      setModal({ kind: 'manage', enrollmentId: e.id });
      return;
    }
    // אישור כפול (legacy:335-338): לחיצה ראשונה מזיינת, שנייה בתוך 3ש׳ מבצעת
    const step = punchConfirmStep(punchConfirmOn, punchArm, e.id, Date.now());
    if (!step.fire) {
      setPunchArm(step.next);
      window.clearTimeout(punchArmTimer.current);
      punchArmTimer.current = window.setTimeout(() => setPunchArm(null), PUNCH_CONFIRM_MS);
      return;
    }
    setPunchArm(null);
    // כרטיסייה — דרך פעולת punch של ה-store; מנוי חודשי — רישום נוכחות ידני.
    if (e.plan === 'punch') punch(e.id);
    else upsertEnrollment({ ...e, used: e.used + 1 });
    const fam = db.families.find((f) => f.members.some((m) => m.id === e.memberId));
    if (fam) addCred(fam.id, 5, 'נוכחות (Check-in)');
    toast('הניקוב נרשם בהצלחה');
  }

  /** תדפיס למורה — CSV של התלמידים הרשומים, כולל רגישויות (port של exportCourseStudents). */
  function exportStudents() {
    const rows: Cell[][] = [
      [termOf(cfg, 'entity.student', 'תלמיד/ה'), 'גיל', termOf(cfg, 'entity.family', 'משפחה'), 'טלפון', 'קבוצה', 'מסלול', 'יתרה', 'רגישויות/רפואי', 'הערה'],
    ];
    for (const e of enrolled) {
      const m = memberById.get(e.memberId);
      const fam = db.families.find((f) => f.id === m?.famId);
      rows.push([
        m?.first ?? '',
        (m ? ageOf(m.birth) : null) ?? '',
        fam?.name ?? '',
        m?.phone || fam?.phone || '',
        e.group,
        e.plan === 'punch' ? 'כרטיסייה ' + (e.purchased - e.used) + '/' + e.purchased : 'מנוי',
        e.plan === 'punch' ? e.purchased - e.used : '',
        m?.health ?? '',
        e.note,
      ]);
    }
    downloadCsv('course-' + c.name + '.csv', rows);
    toast('רשימת ה' + termOf(cfg, 'entity.students', 'תלמידים') + ' של "' + c.name + '" ירדה — כולל רגישויות ל' + termOf(cfg, 'entity.teacher', 'מורה'));
  }

  /** דו"ח יומי מפורט — מפגש-מפגש מ-start עד end, מי פעיל כולל חיסורים. */
  function exportDaily() {
    const { rows, days } = buildCourseDailyRows(c, db);
    if (!c.start || !c.end) {
      toast('ל' + termOf(cfg, 'entity.course', 'חוג') + ' חסר תאריך התחלה/סיום — עדכנו בעריכת ה' + termOf(cfg, 'entity.course', 'חוג'));
      return;
    }
    if (days === 0) {
      toast('אין מפגשים בטווח התאריכים של ה' + termOf(cfg, 'entity.course', 'חוג'));
      return;
    }
    downloadCsv('course-daily-' + c.name + '.csv', rows);
    toast('דו"ח יומי מפורט של "' + c.name + '" ירד — ' + days + ' ימי פעילות');
  }

  function setGroup(e: Enrollment, v: string, first: string) {
    upsertEnrollment({ ...e, group: v });
    toast(v ? first + ' שויך/ה ל' + v : 'הוסר השיוך של ' + first);
  }

  /** הוספת קבוצה/מפגש לקורס. */
  function addSession() {
    const day = Math.min(5, Math.max(0, +sessDay || 0)) as Weekday;
    upsertCourse({
      ...c,
      sessions: [...sessions, { day, time: sessTime || '17:00', label: sessLabel.trim() }],
    });
    setSessLabel('');
    toast('הקבוצה נוספה ללוח הפעילות');
  }

  /** הסרת קבוצה — משאירה לפחות אחת ומסנכרנת שיבוצים ל"ללא שיוך". */
  function removeSession(i: number) {
    if (sessions.length <= 1) return toast('חייבת להישאר לפחות קבוצה אחת');
    const lbl = groupLabelOf(sessions[i], i);
    const next = sessions.filter((_, j) => j !== i);
    upsertCourse({ ...c, sessions: next, weekday: next[0].day, time: next[0].time });
    let moved = 0;
    for (const e of enrolled) {
      if (e.group === lbl) {
        upsertEnrollment({ ...e, group: '' });
        moved++;
      }
    }
    toast('הקבוצה הוסרה' + (moved ? ' · ' + moved + ' ' + termOf(cfg, 'entity.students', 'תלמידים') + ' סונכרנו ל"ללא שיוך"' : ' מלוח הפעילות'));
  }

  const groupCounts =
    groups.length > 0
      ? [
          ...sessions.map((ss, i) => {
            const v = groupLabelOf(ss, i);
            const [bg, fg] = GROUP_PALETTE[i % GROUP_PALETTE.length];
            return { label: v + ' · ' + enrolled.filter((e) => e.group === v).length, bg, fg };
          }),
          ...(enrolled.some((e) => !e.group)
            ? [{ label: 'ללא שיוך · ' + enrolled.filter((e) => !e.group).length, bg: '#eceae2', fg: '#8b8474' }]
            : []),
        ]
      : [];

  const detailRow = (label: string, value: string, color?: string) => (
    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, fontSize: 13 }}>
      <span style={{ color: 'var(--ink-faint)' }}>{label}</span>
      <span style={{ fontWeight: 700, color, textAlign: 'left' }}>{value}</span>
    </div>
  );

  return (
    <div>
      <button
        onClick={() => selectCourse(null)}
        style={{ color: 'var(--ink-faint)', fontSize: 13, fontWeight: 700, marginBottom: 10 }}
      >
        {'→ כל ' + termOf(cfg, 'nav.courses', 'חוגים')}
      </button>

      <div className="card" style={{ display: 'flex', alignItems: 'center', gap: 15, marginBottom: 14 }}>
        <div
          style={{
            width: 64,
            height: 64,
            borderRadius: 16,
            background: tint,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 22,
            fontWeight: 800,
            color: 'rgba(33,29,23,.45)',
            flex: 'none',
          }}
        >
          {c.name[0]}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
            <h1 className="page-title" style={{ marginBottom: 0 }}>
              {c.name}
            </h1>
            <span style={chipStyle(mm.bg, mm.c)}>{mm.label}</span>
          </div>
          <div style={{ fontSize: 13, color: 'var(--ink-faint)', marginTop: 3 }}>
            {(c.audience || 'כללי') + ' · ' + termOf(cfg, 'entity.teacher', 'מורה') + ': ' + (teacher?.name ?? '—') + ' · ' + (room?.name ?? '—') + ' · ' +
              (c.price ? '₪' + c.price + ' ' + priceSuffix(c.model) : '—')}
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {featureOn(cfg, 'courses.printout.custom') && (
            <Btn onClick={() => setExpOpen(true)} title='דו"ח מותאם — בחירת טווח ונתונים'>
              📊 דו"ח מותאם
            </Btn>
          )}
          {/* מורה מחוברת (P3 פריט 15): עריכה ומחיקה הן פעולות ניהול — מוסתרות */}
          {!isTeacherUser && (
            <Btn onClick={() => setModal({ kind: 'edit' })}>{'✎ עריכת ' + termOf(cfg, 'entity.course', 'חוג')}</Btn>
          )}
          {!isTeacherUser && (
          <Btn
            kind="danger"
            onClick={() => {
              const n = enrolled.length;
              const msg =
                'למחוק את ה' + termOf(cfg, 'entity.course', 'חוג') + ' "' + c.name + '"?' +
                (n ? ' פעולה זו תמחק גם את ' + n + ' ה' + termOf(cfg, 'entity.enrollments', 'שיבוצים') + ' שלו (כולל תשלומים ונוכחות).' : '') +
                '\n\nלא ניתן לבטל.';
              if (window.confirm(msg)) {
                deleteCourse(c.id);
                selectCourse(null);
                toast('ה' + termOf(cfg, 'entity.course', 'חוג') + ' נמחק');
              }
            }}
            title={'מחיקת ה' + termOf(cfg, 'entity.course', 'חוג') + ' וכל ה' + termOf(cfg, 'entity.enrollments', 'שיבוצים') + ' שלו'}
          >
            🗑 מחיקה
          </Btn>
          )}
        </div>
      </div>

      {/* הגריד רספונסיבי (global.css) — במובייל הסרגל הצדדי יורד מתחת לעמודה הראשית */}
      <div className="crs-detail-grid">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16, minWidth: 0 }}>
          <section className="card">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
              <h2 style={{ fontSize: 15, fontWeight: 800 }}>{termOf(cfg, 'entity.students', 'תלמידים') + ' רשומים'}</h2>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ fontSize: 12, color: 'var(--ink-faint)', fontWeight: 600 }}>
                  {enrollCount(db, c.id) + '/' + (c.maxStudents || '∞') + ' רשומים'}
                </span>
                {printoutOn && (
                  <Btn sm disabled={!enrolled.length} onClick={exportStudents} title={'הורדת רשימת ה' + termOf(cfg, 'entity.students', 'תלמידים') + ' כ-CSV ל' + termOf(cfg, 'entity.teacher', 'מורה') + ' — כולל רגישויות'}>
                    {'⬇ תדפיס ל' + termOf(cfg, 'entity.teacher', 'מורה')}
                  </Btn>
                )}
                {featureOn(cfg, 'courses.printout.daily') && (
                  <Btn sm onClick={exportDaily} title='דו"ח יומי מפורט — מפגש-מפגש כולל חיסורים'>
                    ⬇ דו"ח יומי מפורט
                  </Btn>
                )}
                <Btn sm disabled={full} onClick={() => setModal({ kind: 'enroll' })}>
                  {full ? 'ה' + termOf(cfg, 'entity.course', 'חוג') + ' מלא' : '➕ ' + termOf(cfg, 'entity.enrollment', 'שיבוץ')}
                </Btn>
              </div>
            </div>
            {groupCounts.length > 0 && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 9 }}>
                {groupCounts.map((g) => (
                  <span key={g.label} style={chipStyle(g.bg, g.fg)}>
                    {g.label}
                  </span>
                ))}
              </div>
            )}
            {enrolled.length === 0 ? (
              <Empty>{'אין ' + termOf(cfg, 'entity.students', 'תלמידים') + ' רשומים — לחצו על "' + termOf(cfg, 'entity.enrollment', 'שיבוץ') + ' ' + termOf(cfg, 'entity.student', 'תלמיד/ה') + '"'}</Empty>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table className="table">
                  <thead>
                    <tr>
                      <th>{termOf(cfg, 'entity.student', 'תלמיד/ה')}</th>
                      <th>{termOf(cfg, 'entity.family', 'משפחה')}</th>
                      <th>קבוצה</th>
                      <th>מסלול</th>
                      <th>יתרה</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {enrolled.map((e) => {
                      const m = memberById.get(e.memberId);
                      const isPunch = e.plan === 'punch';
                      const rem = e.purchased - e.used;
                      const barColor = rem <= 0 ? '#dc2626' : rem <= 2 ? '#d97706' : '#16a34a';
                      const noBalance = isPunch && rem <= 0;
                      const age = m ? ageOf(m.birth) : null;
                      return (
                        <tr key={e.id}>
                          <td>
                            <div style={{ fontWeight: 700 }}>{m?.first ?? '—'}</div>
                            {age != null && (
                              <div style={{ fontSize: 11, color: 'var(--ink-faint)' }}>
                                {(m?.gender === 'f' ? 'בת ' : 'בן ') + age}
                              </div>
                            )}
                          </td>
                          <td>{m ? termOf(cfg, 'entity.familyOf', 'משפחת') + ' ' + m.famName : '—'}</td>
                          <td>
                            {groups.length > 0 ? (
                              <select
                                value={e.group}
                                title="שינוי קבוצה — נשמר מיד ומשתקף בלוח"
                                onChange={(ev) => setGroup(e, ev.target.value, m?.first ?? '')}
                                style={{ padding: '4px 6px', fontSize: 12 }}
                              >
                                <option value="">ללא</option>
                                {groups.map((g) => (
                                  <option key={g.v} value={g.v}>
                                    {g.t}
                                  </option>
                                ))}
                              </select>
                            ) : (
                              '—'
                            )}
                          </td>
                          <td style={{ fontSize: 12 }}>
                            {planLabelOf(e)}
                            {e.note && (
                              <div style={{ fontSize: 11, color: '#9a6414', fontWeight: 600 }}>📝 {e.note}</div>
                            )}
                          </td>
                          <td>
                            {!punchOn ? (
                              <span style={{ fontSize: 12 }}>{planLabelOf(e)}</span>
                            ) : isPunch ? (
                              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                <div
                                  style={{
                                    width: 80,
                                    height: 6,
                                    borderRadius: 99,
                                    background: 'rgba(33,29,23,.1)',
                                    overflow: 'hidden',
                                    flex: 'none',
                                  }}
                                >
                                  <div
                                    style={{
                                      height: '100%',
                                      borderRadius: 99,
                                      background: barColor,
                                      width: Math.max(0, Math.round((rem / (e.purchased || 1)) * 100)) + '%',
                                    }}
                                  />
                                </div>
                                <span style={{ fontSize: 12, fontWeight: 700, color: barColor, whiteSpace: 'nowrap' }}>
                                  {rem + ' מתוך ' + e.purchased}
                                </span>
                              </div>
                            ) : (
                              <span style={{ fontSize: 12 }}>{e.used + ' נוכחויות מתחילת החודש'}</span>
                            )}
                          </td>
                          <td>
                            <div style={{ display: 'flex', gap: 5, alignItems: 'center' }}>
                              {punchOn && (
                                <Btn sm kind={noBalance ? 'plain' : 'primary'} onClick={() => doPunch(e)}>
                                  {noBalance ? 'חידוש ←' : punchArm?.id === e.id ? 'לאשר ניקוב?' : 'ניקוב'}
                                </Btn>
                              )}
                              <Btn
                                sm
                                title={'ניהול ' + termOf(cfg, 'entity.enrollment', 'שיבוץ') + ': קניית כרטיסייה, מסלול, הקפאה, הסרה'}
                                onClick={() => setModal({ kind: 'manage', enrollmentId: e.id })}
                              >
                                ⚙
                              </Btn>
                              <Btn
                                sm
                                title="רישום חיסור (נימוק חובה)"
                                onClick={() => setModal({ kind: 'absence', enrollmentId: e.id })}
                              >
                                ✕
                              </Btn>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          {groupsOn && (
          <section className="card">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
              <h2 style={{ fontSize: 15, fontWeight: 800 }}>שעות פעילות וקבוצות</h2>
              <span style={{ fontSize: 12, color: 'var(--ink-faint)', fontWeight: 600 }}>
                {sessions.length + (sessions.length === 1 ? ' קבוצה' : ' קבוצות')}
              </span>
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {sessions.map((ss, i) => (
                <span
                  key={i}
                  className="chip"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: 8, fontSize: 12.5 }}
                >
                  {(ss.label ? ss.label + ' · ' : '') + 'יום ' + DAY_NAMES[ss.day] + ' ' + (ss.time || '')}
                  <button
                    title="הסרת הקבוצה"
                    onClick={() => removeSession(i)}
                    style={{ color: '#b3ab9c', fontWeight: 800 }}
                  >
                    ✕
                  </button>
                </span>
              ))}
            </div>
            <div
              style={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: 8,
                alignItems: 'flex-end',
                marginTop: 12,
                paddingTop: 12,
                borderTop: '1px solid var(--line)',
              }}
            >
              <div className="field" style={{ marginBottom: 0 }}>
                <label>יום</label>
                <select value={sessDay} onChange={(e) => setSessDay(e.target.value)}>
                  {DAY_NAMES.map((d, i) => (
                    <option key={i} value={String(i)}>
                      {d}
                    </option>
                  ))}
                </select>
              </div>
              <div className="field" style={{ marginBottom: 0 }}>
                <label>שעה</label>
                <input type="time" value={sessTime} onChange={(e) => setSessTime(e.target.value)} />
              </div>
              <div className="field" style={{ marginBottom: 0, flex: 1, minWidth: 130 }}>
                <label>שם הקבוצה (רשות)</label>
                <input
                  value={sessLabel}
                  onChange={(e) => setSessLabel(e.target.value)}
                  placeholder="לדוגמה: קבוצה ב׳ / בוקר"
                />
              </div>
              <Btn kind="primary" sm onClick={addSession}>
                + הוספת קבוצה
              </Btn>
            </div>
          </section>
          )}
        </div>

        <section className="card">
          <h2 style={{ fontSize: 15, fontWeight: 800, marginBottom: 12 }}>{'פרטי ה' + termOf(cfg, 'entity.course', 'חוג')}</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
            {/* תמונת חוג + טווח כיתות (P2 פער 28, feature courses.gradeimg) */}
            {gradeimgOn && c.img && (
              <img
                src={c.img}
                alt={'תמונת ה' + termOf(cfg, 'entity.course', 'חוג')}
                style={{ width: '100%', maxHeight: 160, objectFit: 'cover', borderRadius: 12, border: '1px solid var(--line)' }}
              />
            )}
            {detailRow('קהל יעד', c.audience || 'כללי')}
            {gradeimgOn && (c.gradeMin || c.gradeMax) &&
              detailRow('כיתות', [c.gradeMin, c.gradeMax].filter(Boolean).join('–'))}
            {detailRow(termOf(cfg, 'entity.teacher', 'מורה'), teacher?.name ?? '—')}
            {detailRow('טלפון ' + termOf(cfg, 'entity.teacher', 'מורה'), teacher?.phone || '—')}
            {detailRow('מחיר מלא', c.price ? '₪' + c.price + ' ' + priceSuffix(c.model) : '—')}
            {discountsOn && detailRow(c.price1Name || 'הנחה 1', c.price1 ? '₪' + c.price1 : '—', '#12803c')}
            {discountsOn && detailRow(c.price2Name || 'הנחה 2', c.price2 ? '₪' + c.price2 : '—', '#7c3aed')}
            {detailRow('מסלול', mm.label)}
            {detailRow('סמסטר', c.semester || 'שנתי')}
            {detailRow(termOf(cfg, 'entity.room', 'חדר') + ' פעילות', room?.name ?? '—')}
            {detailRow('תפוסה', enrollCount(db, c.id) + ' מתוך ' + (c.maxStudents || '∞'))}
            {detailRow(
              'תקופת פעילות (עברי)',
              (c.start ? hebDateFull(c.start) : '—') + ' – ' + (c.end ? hebDateFull(c.end) : '—'),
              '#9a6414',
            )}
            {detailRow('בלועזי', fmtDate(c.start) + ' – ' + fmtDate(c.end))}
            <div style={{ height: 1, background: 'var(--line)' }} />
            <div style={{ fontSize: 13, color: 'var(--ink-soft)', lineHeight: 1.55 }}>
              {c.description || 'אין תיאור.'}
            </div>
            <div style={{ height: 1, background: 'var(--line)' }} />
            <div>
              <div style={{ fontSize: 12, fontWeight: 800, color: 'var(--ink-soft)', marginBottom: 5 }}>
                {'📝 הערות פנימיות על ה' + termOf(cfg, 'entity.course', 'חוג')}
              </div>
              <div style={{ display: 'flex', gap: 7 }}>
                <input
                  value={noteVal}
                  onChange={(e) => setNoteVal(e.target.value)}
                  placeholder="לדוגמה: להביא חומרים, גבייה, הסעות…"
                />
                <Btn
                  sm
                  kind="primary"
                  onClick={() => {
                    upsertCourse({ ...c, notes: noteVal.trim() });
                    toast('ההערה על ה' + termOf(cfg, 'entity.course', 'חוג') + ' נשמרה');
                  }}
                >
                  שמירה
                </Btn>
              </div>
            </div>
          </div>
        </section>
      </div>

      {modal?.kind === 'edit' && <CourseForm course={c} onClose={() => setModal(null)} />}
      {modal?.kind === 'enroll' && <EnrollModal course={c} onClose={() => setModal(null)} />}
      {modal?.kind === 'manage' && (
        <ManageModal enrollmentId={modal.enrollmentId} course={c} onClose={() => setModal(null)} />
      )}
      {modal?.kind === 'absence' && (
        <AbsenceModal enrollmentId={modal.enrollmentId} course={c} onClose={() => setModal(null)} />
      )}
      {expOpen && <CustomExport target="courses" onClose={() => setExpOpen(false)} />}
    </div>
  );
}
