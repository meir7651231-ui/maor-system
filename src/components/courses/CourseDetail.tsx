/**
 * כרטיס קורס — תלמידים רשומים (ניקוב, ⚙ ניהול, ✕ חיסור, שיוך קבוצה),
 * שעות פעילות וקבוצות (עורך המפגשים) ופרטי הקורס.
 */
import { useState } from 'react';
import type { Course, Enrollment, Weekday } from '../../types/domain';
import { allMembers, useApp } from '../../store/useApp';
import { featureOn } from '../../lib/config';
import { hebDateFull } from '../../lib/hebrew';
import { downloadCsv, type Cell } from '../../lib/csvx';
import { Btn, Empty } from '../ui';
import { CourseForm } from './CourseForm';
import { EnrollModal } from './EnrollModal';
import { ManageModal } from './ManageModal';
import { AbsenceModal } from './AbsenceModal';
import {
  DAY_NAMES,
  TINTS,
  ageOf,
  chipStyle,
  fmtDate,
  groupLabelOf,
  groupOptionsOf,
  modelMeta,
  planLabelOf,
  sessionsOf,
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
  const upsertCourse = useApp((s) => s.upsertCourse);
  const upsertEnrollment = useApp((s) => s.upsertEnrollment);
  const punch = useApp((s) => s.punch);
  const addCred = useApp((s) => s.addCred);
  const toast = useApp((s) => s.toast);
  const cfg = useApp((s) => s.config);

  const punchOn = featureOn(cfg, 'courses.punch');
  const groupsOn = featureOn(cfg, 'courses.groups');
  const printoutOn = featureOn(cfg, 'courses.printout');
  const discountsOn = featureOn(cfg, 'courses.discounts');

  const c = props.course;
  const [modal, setModal] = useState<ModalState>(null);
  const [noteVal, setNoteVal] = useState(c.notes);
  const [sessDay, setSessDay] = useState('0');
  const [sessTime, setSessTime] = useState('17:00');
  const [sessLabel, setSessLabel] = useState('');

  const teacher = db.teachers.find((t) => t.id === c.teacherId);
  const room = db.rooms.find((r) => r.id === c.roomId);
  const enrolled = db.enrollments.filter((e) => e.courseId === c.id);
  const members = allMembers(db);
  const sessions = sessionsOf(c);
  // קבוצות כבויות בקונפיגורציה → התנהגות קבוצה-יחידה (אין בוררי קבוצה ואין עורך)
  const groups = groupsOn ? groupOptionsOf(c) : [];
  const mm = modelMeta(c);
  const tint = TINTS[Math.max(0, db.courses.indexOf(c)) % TINTS.length];
  const full = enrolled.length >= (c.maxStudents || 999);

  function doPunch(e: Enrollment) {
    if (e.status === 'paused') return toast('השיבוץ מוקפא — הפשירו אותו בניהול השיבוץ (⚙)');
    if (e.status === 'ended') return toast('השיבוץ הסתיים — ניתן לחדש בניהול השיבוץ (⚙)');
    if (e.plan === 'punch' && e.used >= e.purchased) {
      setModal({ kind: 'manage', enrollmentId: e.id });
      return;
    }
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
      ['תלמיד/ה', 'גיל', 'משפחה', 'טלפון', 'קבוצה', 'מסלול', 'יתרה', 'רגישויות/רפואי', 'הערה'],
    ];
    for (const e of enrolled) {
      const m = members.find((x) => x.id === e.memberId);
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
    toast('רשימת התלמידים של "' + c.name + '" ירדה — כולל רגישויות למורה');
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
    upsertCourse({ ...c, sessions: next });
    let moved = 0;
    for (const e of enrolled) {
      if (e.group === lbl) {
        upsertEnrollment({ ...e, group: '' });
        moved++;
      }
    }
    toast('הקבוצה הוסרה' + (moved ? ' · ' + moved + ' תלמידים סונכרנו ל"ללא שיוך"' : ' מלוח הפעילות'));
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
        → כל הקורסים
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
            {(c.audience || 'כללי') + ' · מורה: ' + (teacher?.name ?? '—') + ' · ' + (room?.name ?? '—') + ' · ' +
              (c.price ? '₪' + c.price + ' לחודש' : '—')}
          </div>
        </div>
        <Btn onClick={() => setModal({ kind: 'edit' })}>✎ עריכת קורס</Btn>
      </div>

      {/* הגריד רספונסיבי (global.css) — במובייל הסרגל הצדדי יורד מתחת לעמודה הראשית */}
      <div className="crs-detail-grid">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16, minWidth: 0 }}>
          <section className="card">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
              <h2 style={{ fontSize: 15, fontWeight: 800 }}>תלמידים רשומים</h2>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ fontSize: 12, color: 'var(--ink-faint)', fontWeight: 600 }}>
                  {enrolled.length + '/' + (c.maxStudents || '∞') + ' רשומים'}
                </span>
                {printoutOn && (
                  <Btn sm disabled={!enrolled.length} onClick={exportStudents} title="הורדת רשימת התלמידים כ-CSV למורה — כולל רגישויות">
                    ⬇ תדפיס למורה
                  </Btn>
                )}
                <Btn sm disabled={full} onClick={() => setModal({ kind: 'enroll' })}>
                  {full ? 'הקורס מלא' : '+ שיבוץ תלמיד'}
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
              <Empty>אין תלמידים רשומים — לחצו על "שיבוץ תלמיד"</Empty>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table className="table">
                  <thead>
                    <tr>
                      <th>תלמיד/ה</th>
                      <th>משפחה</th>
                      <th>קבוצה</th>
                      <th>מסלול</th>
                      <th>יתרה</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {enrolled.map((e) => {
                      const m = members.find((x) => x.id === e.memberId);
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
                          <td>{m ? 'משפחת ' + m.famName : '—'}</td>
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
                                  {noBalance ? 'חידוש ←' : 'ניקוב'}
                                </Btn>
                              )}
                              <Btn
                                sm
                                title="ניהול שיבוץ: קניית כרטיסייה, מסלול, הקפאה, הסרה"
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
          <h2 style={{ fontSize: 15, fontWeight: 800, marginBottom: 12 }}>פרטי הקורס</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
            {detailRow('קהל יעד', c.audience || 'כללי')}
            {detailRow('מורה', teacher?.name ?? '—')}
            {detailRow('טלפון המורה', teacher?.phone || '—')}
            {detailRow('מחיר מלא', c.price ? '₪' + c.price + ' לחודש' : '—')}
            {discountsOn && detailRow(c.price1Name || 'הנחה 1', c.price1 ? '₪' + c.price1 : '—', '#12803c')}
            {discountsOn && detailRow(c.price2Name || 'הנחה 2', c.price2 ? '₪' + c.price2 : '—', '#7c3aed')}
            {detailRow('מסלול', mm.label)}
            {detailRow('סמסטר', c.semester || 'שנתי')}
            {detailRow('חדר פעילות', room?.name ?? '—')}
            {detailRow('תפוסה', enrolled.length + ' מתוך ' + (c.maxStudents || '∞'))}
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
                📝 הערות פנימיות על החוג
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
                    toast('ההערה על החוג נשמרה');
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
    </div>
  );
}
