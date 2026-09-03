/**
 * 🎯 קוקפיט-חוגים (פאזה 2) — "המערכת מסדרת את היום": נוכחות-להיום · חייבים ·
 * כרטיסיות-שנגמרות · בסיכון-נשירה, במסך-אחד. נגזרת טהורה (ops.ts) מהנתונים הקיימים.
 * כל קליק → פתיחת כרטיס-החוג (שם הפעולות). מגודר opt-in `courses.cockpit===true`.
 */
import type { ReactNode } from 'react';
import { useApp } from '../../store/useApp';
import { useDbWatch } from '../../store/dbWatch';
import { featureOn, termOf } from '../../lib/config';
import { isoToday, planLabelOf } from './lib';
import { coursesToday, debtors, dropoutRisk, opsKpis, punchLowList } from './ops';

function Kpi(props: { n: number | string; label: string; suffix?: string }) {
  return (
    <div style={{ flex: 1, minWidth: 92, background: 'var(--surface-2, #fafaf7)', border: '1px solid var(--line)', borderRadius: 12, padding: '10px 12px' }}>
      <div style={{ fontSize: 22, fontWeight: 900 }}>
        {props.n}
        {props.suffix}
      </div>
      <div style={{ fontSize: 12, color: 'var(--ink-faint)', fontWeight: 600 }}>{props.label}</div>
    </div>
  );
}

function Group(props: { title: string; count: number; empty: string; children: ReactNode }) {
  return (
    <section className="card" style={{ marginBottom: 12 }}>
      <h3 style={{ fontSize: 14, fontWeight: 800, marginBottom: 8 }}>
        {props.title} {props.count > 0 && <span style={{ color: 'var(--accent)' }}>· {props.count}</span>}
      </h3>
      {props.count === 0 ? <div style={{ fontSize: 12.5, color: 'var(--ink-faint)' }}>{props.empty}</div> : props.children}
    </section>
  );
}

const CAP = 8;

export function CoursesCockpit() {
  const db = useDbWatch('courses', 'enrollments', 'families');
  const config = useApp((s) => s.config);
  const selectCourse = useApp((s) => s.selectCourse);

  // קבוצות-הקוקפיט מכבדות את דגלי-המקור: חייבים ⇐ courses.payments · כרטיסיות ⇐ courses.punch
  const paymentsOn = featureOn(config, 'courses.payments');
  const punchOn = featureOn(config, 'courses.punch');

  const today = isoToday();
  const dow = new Date(today + 'T12:00:00').getDay();
  const kpis = opsKpis(db.courses, db.enrollments, today);
  const todayC = coursesToday(db.courses, dow, today);
  const debt = debtors(db.enrollments);
  const low = punchLowList(db.enrollments);
  const risk = dropoutRisk(db.enrollments);

  const courseName = (id: string) => db.courses.find((c) => c.id === id)?.name ?? '—';
  const memberName = (memberId: string) => {
    for (const f of db.families) {
      const m = f.members.find((x) => x.id === memberId);
      if (m) return m.first + ' · ' + f.name;
    }
    return '—';
  };

  const Row = (props: { onClick: () => void; main: string; sub: string; tag?: string; tagColor?: string }) => (
    <button
      type="button"
      onClick={props.onClick}
      style={{ display: 'flex', width: '100%', alignItems: 'center', gap: 10, textAlign: 'right', padding: '7px 0', borderBottom: '1px solid var(--line)', background: 'transparent' }}
    >
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontWeight: 700, fontSize: 13.5 }}>{props.main}</div>
        <div style={{ fontSize: 12, color: 'var(--ink-faint)' }}>{props.sub}</div>
      </div>
      {props.tag && <span style={{ fontSize: 12, fontWeight: 800, color: props.tagColor || 'var(--accent)', whiteSpace: 'nowrap' }}>{props.tag}</span>}
      <span style={{ color: 'var(--ink-faint)' }}>‹</span>
    </button>
  );

  const more = (n: number) => n > CAP && <div style={{ fontSize: 12, color: 'var(--ink-faint)', marginTop: 6 }}>ועוד {n - CAP}…</div>;
  const course = termOf(config, 'entity.course', 'חוג');

  return (
    <div>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 14 }}>
        <Kpi n={kpis.activeCourses} label={termOf(config, 'nav.courses', 'חוגים') + ' פעילים'} />
        <Kpi n={kpis.enrollments} label={termOf(config, 'entity.enrollments', 'שיבוצים')} />
        <Kpi n={kpis.avgOccupancy} suffix="%" label="תפוסה ממוצעת" />
        <Kpi n={todayC.length} label="מפגשים היום" />
      </div>

      <Group title={'📋 נוכחות להיום'} count={todayC.length} empty={'אין מפגשי ' + course + ' היום'}>
        {todayC.slice(0, CAP).map((c) => (
          <Row key={c.id} onClick={() => selectCourse(c.id)} main={c.name} sub={'פתחו את הכרטיס → "📋 נוכחות"'} tag="נוכחות" />
        ))}
        {more(todayC.length)}
      </Group>

      {paymentsOn && (
        <Group title={'💰 חייבים'} count={debt.length} empty="אין יתרות-חוב פתוחות">
          {debt.slice(0, CAP).map(({ e, bal }) => (
            <Row key={e.id} onClick={() => selectCourse(e.courseId)} main={memberName(e.memberId)} sub={courseName(e.courseId)} tag={'₪' + bal.toLocaleString('he-IL')} tagColor="#b91c1c" />
          ))}
          {more(debt.length)}
        </Group>
      )}

      {punchOn && (
        <Group title={'🎫 כרטיסיות שנגמרות'} count={low.length} empty="אין כרטיסיות שעומדות להסתיים">
          {low.slice(0, CAP).map(({ e, left }) => (
            <Row key={e.id} onClick={() => selectCourse(e.courseId)} main={memberName(e.memberId)} sub={courseName(e.courseId) + ' · ' + planLabelOf(e)} tag={'נותרו ' + left} tagColor={left === 0 ? '#b91c1c' : '#9a6414'} />
          ))}
          {more(low.length)}
        </Group>
      )}

      <Group title={'⚠️ בסיכון-נשירה'} count={risk.length} empty={'אין ' + termOf(config, 'entity.students', 'תלמידים') + ' בסיכון (3+ חיסורים)'}>
        {risk.slice(0, CAP).map(({ e, absences }) => (
          <Row key={e.id} onClick={() => selectCourse(e.courseId)} main={memberName(e.memberId)} sub={courseName(e.courseId)} tag={absences + ' חיסורים'} tagColor="#9a6414" />
        ))}
        {more(risk.length)}
      </Group>
    </div>
  );
}
