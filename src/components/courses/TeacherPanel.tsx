/**
 * 🎓 אפליקציית-המורה (גל ה׳ · פאזה 9) — המסך המצומצם של המורה: מפגשי-היום שלה עם
 * נוכחות-בטאפ (ממחזר את AttendanceSheet), השלמות-ממתינות, ודוח-חודשי. נגזרת-טהורה
 * (teacher.ts) מהחוגים-שלה בלבד. מגודר opt-in `courses.teacherapp===true` + תפקיד-מורה.
 * אפס-כסף · אפס-סכמה · אפס-חשיפת-נתונים-חדשה (המורה כבר רואה רק את החוגים-שלה).
 */
import { useMemo, useState } from 'react';
import type { Course } from '../../types/domain';
import { useApp } from '../../store/useApp';
import { featureOn, termOf } from '../../lib/config';
import { hebDateFull } from '../../lib/hebrew';
import { Btn, Empty } from '../ui';
import { downloadCsv } from '../../lib/csvx';
import { AttendanceSheet } from './AttendanceSheet';
import { ClassBroadcast } from './ClassBroadcast';
import { isoToday } from './lib';
import { teacherAgenda, teacherKpis, teacherMakeups, teacherMonthCsvRows } from './teacher';

function Kpi(props: { n: number | string; label: string }) {
  return (
    <div style={{ flex: 1, minWidth: 92, background: 'var(--surface-2, #fafaf7)', border: '1px solid var(--line)', borderRadius: 12, padding: '10px 12px' }}>
      <div style={{ fontSize: 22, fontWeight: 900 }}>{props.n}</div>
      <div style={{ fontSize: 12, color: 'var(--ink-faint)', fontWeight: 600 }}>{props.label}</div>
    </div>
  );
}

export function TeacherPanel(props: { teacherId: string }) {
  const db = useApp((s) => s.db);
  const config = useApp((s) => s.config);
  const selectCourse = useApp((s) => s.selectCourse);
  const toast = useApp((s) => s.toast);
  const [sheetFor, setSheetFor] = useState<Course | null>(null);
  const [bcastFor, setBcastFor] = useState<Course | null>(null);

  const today = isoToday();
  const dow = useMemo(() => new Date(today + 'T12:00:00').getDay(), [today]);
  const tid = props.teacherId;
  const kpis = useMemo(() => teacherKpis(db, tid, dow, today), [db, tid, dow, today]);
  const agenda = useMemo(() => teacherAgenda(db, tid, dow, today), [db, tid, dow, today]);
  const makeups = useMemo(() => teacherMakeups(db, tid), [db, tid]);

  const broadcastOn = featureOn(config, 'courses.broadcast');
  const exportOn = featureOn(config, 'core.export');
  // גיליון-הנוכחות המהיר — כבוי ⇒ כפתור "📋 נוכחות" מוסתר (כמו בכרטיס-החוג)
  const sheetOn = featureOn(config, 'courses.attendance.sheet');
  const courseWord = termOf(config, 'entity.course', 'חוג');

  const memberName = (memberId: string) => {
    for (const f of db.families) {
      const m = f.members.find((x) => x.id === memberId);
      if (m) return m.first + ' · ' + f.name;
    }
    return '—';
  };

  if (sheetFor) return <AttendanceSheet course={sheetFor} onClose={() => setSheetFor(null)} />;
  if (bcastFor) return <ClassBroadcast course={bcastFor} onClose={() => setBcastFor(null)} />;

  const courseName = (id: string) => db.courses.find((c) => c.id === id)?.name ?? '—';

  const exportMonth = () => {
    const ym = today.slice(0, 7);
    downloadCsv('teacher-' + ym + '.csv', teacherMonthCsvRows(db, tid, ym, memberName));
    toast('הדוח החודשי יוצא');
  };

  return (
    <div>
      <div style={{ fontSize: 13, color: 'var(--ink-soft)', marginBottom: 10 }}>{hebDateFull(today)}</div>

      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 14 }}>
        <Kpi n={kpis.courses} label={'ה' + termOf(config, 'nav.courses', 'חוגים') + ' שלי'} />
        <Kpi n={kpis.students} label={termOf(config, 'entity.students', 'תלמידים')} />
        <Kpi n={kpis.todaySessions} label="מפגשים היום" />
        <Kpi n={kpis.makeups} label="השלמות ממתינות" />
      </div>

      <section className="card" style={{ marginBottom: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: 8 }}>
          <h3 style={{ fontSize: 14, fontWeight: 800, flex: 1 }}>
            📅 המפגשים שלי היום {agenda.length > 0 && <span style={{ color: 'var(--accent)' }}>· {agenda.length}</span>}
          </h3>
          {exportOn && (
            <Btn sm onClick={exportMonth} title="דוח-נוכחות חודשי לכל החוגים שלי">
              ⬇ דוח חודשי
            </Btn>
          )}
        </div>
        {agenda.length === 0 ? (
          <div style={{ fontSize: 12.5, color: 'var(--ink-faint)' }}>אין מפגשי {courseWord} היום 🎉</div>
        ) : (
          agenda.map(({ course, present, total }) => (
            <div key={course.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0', borderBottom: '1px solid var(--line)' }}>
              <button
                type="button"
                onClick={() => selectCourse(course.id)}
                title={'פתיחת כרטיס ה' + courseWord}
                style={{ flex: 1, minWidth: 0, textAlign: 'right', background: 'transparent', border: 'none', cursor: 'pointer', padding: 0 }}
              >
                <div style={{ fontWeight: 700 }}>{course.name}</div>
                <div style={{ fontSize: 12, color: 'var(--ink-faint)' }}>{present + ' / ' + total + ' נוכחים'}</div>
              </button>
              {broadcastOn && (
                <Btn sm onClick={() => setBcastFor(course)} title="הודעת-WhatsApp לכל הכיתה">
                  📢
                </Btn>
              )}
              {sheetOn && (
                <Btn sm kind="primary" onClick={() => setSheetFor(course)}>
                  📋 נוכחות
                </Btn>
              )}
            </div>
          ))
        )}
      </section>

      <section className="card">
        <h3 style={{ fontSize: 14, fontWeight: 800, marginBottom: 8 }}>
          🔁 השלמות ממתינות {makeups.length > 0 && <span style={{ color: 'var(--accent)' }}>· {makeups.length}</span>}
        </h3>
        {makeups.length === 0 ? (
          <Empty>אין השלמות ממתינות</Empty>
        ) : (
          makeups.slice(0, 12).map((m, i) => (
            <button
              key={m.enrollmentId + m.date + i}
              type="button"
              onClick={() => selectCourse(m.courseId)}
              style={{ display: 'flex', width: '100%', alignItems: 'center', gap: 10, textAlign: 'right', padding: '7px 0', borderBottom: '1px solid var(--line)', background: 'transparent' }}
            >
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 700, fontSize: 13.5 }}>{memberName(m.memberId)}</div>
                <div style={{ fontSize: 12, color: 'var(--ink-faint)' }}>
                  {courseName(m.courseId) + ' · חיסור ' + m.date.slice(8, 10) + '/' + m.date.slice(5, 7)}
                </div>
              </div>
              <span style={{ fontSize: 12, fontWeight: 800, color: m.makeupDate ? '#12803c' : '#9a6414', whiteSpace: 'nowrap' }}>
                {m.makeupDate ? 'נקבע' : 'לתזמן'}
              </span>
              <span style={{ color: 'var(--ink-faint)' }}>‹</span>
            </button>
          ))
        )}
      </section>
    </div>
  );
}
