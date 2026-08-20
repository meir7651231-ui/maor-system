/**
 * 📋 גיליון-נוכחות (roll-call) — הזזת-המחט התפעולית: כל הקבוצה בבת-אחת, טאפ-אחד
 * לנוכחות, "כולם נוכחים" בקליק. נוכחות = setPresent האידמפוטני (presents[]+מונה-חודשי,
 * שער-כרטיסייה); חיסור-עם-נימוק = AbsenceModal הקיים (זכאות-השלמה/No-Show).
 * מגודר `courses.attendance.sheet`. אפס-סכמה — נגזרת מהשיבוצים הקיימים.
 */
import { useState } from 'react';
import type { Course } from '../../types/domain';
import { useApp } from '../../store/useApp';
import { termOf } from '../../lib/config';
import { hebDateFull } from '../../lib/hebrew';
import { Btn, Empty, Modal } from '../ui';
import { ageOf, isoToday, planLabelOf, sheetRoster, sheetSummary } from './lib';
import { AbsenceModal } from './AbsenceModal';

export function AttendanceSheet(props: { course: Course; onClose: () => void }) {
  const db = useApp((s) => s.db);
  const config = useApp((s) => s.config);
  const setPresent = useApp((s) => s.setPresent);
  const bulkSetPresent = useApp((s) => s.bulkSetPresent);
  const toast = useApp((s) => s.toast);
  const [absFor, setAbsFor] = useState<string | null>(null);

  const c = props.course;
  const today = isoToday();
  const roster = sheetRoster(db.enrollments, c.id);
  const { present, total } = sheetSummary(roster, today);
  const ids = roster.map((e) => e.id);

  const nameOf = (memberId: string) => {
    for (const f of db.families) {
      const m = f.members.find((x) => x.id === memberId);
      if (m) return { first: m.first, fam: f.name, age: ageOf(m.birth) };
    }
    return { first: '—', fam: '', age: null as number | null };
  };

  // חיסור-עם-נימוק מחליף זמנית את הגיליון (מונע מודאל-בתוך-מודאל, כמו JoinModal↔MemberForm)
  if (absFor) return <AbsenceModal enrollmentId={absFor} course={c} onClose={() => setAbsFor(null)} />;

  return (
    <Modal title={'📋 נוכחות — ' + c.name} onClose={props.onClose} wide>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', marginBottom: 12 }}>
        <span style={{ fontSize: 13, color: 'var(--ink-soft)' }}>{hebDateFull(today)}</span>
        <span style={{ fontSize: 13, fontWeight: 800, color: '#12803c' }}>{present + ' / ' + total + ' נוכחים'}</span>
        <div style={{ flex: 1 }} />
        <Btn
          sm
          kind="primary"
          onClick={() => {
            const n = bulkSetPresent(ids, today, true);
            toast(n ? '✓ ' + n + ' סומנו נוכחים' : 'כולם כבר מסומנים נוכחים');
          }}
        >
          ✓ כולם נוכחים
        </Btn>
        <Btn
          sm
          onClick={() => {
            const n = bulkSetPresent(ids, today, false);
            toast(n ? n + ' נוכחויות נוקו' : 'אין מה לנקות');
          }}
        >
          ○ נקה הכל
        </Btn>
      </div>

      {roster.length === 0 ? (
        <Empty>{'אין ' + termOf(config, 'entity.students', 'תלמידים') + ' רשומים ל' + termOf(config, 'entity.course', 'חוג')}</Empty>
      ) : (
        roster.map((e) => {
          const nm = nameOf(e.memberId);
          const on = (e.presents ?? []).includes(today);
          return (
            <div key={e.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0', borderBottom: '1px solid var(--line)', background: on ? 'var(--ok-bg, #eaf6ec)' : 'transparent' }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 700 }}>
                  {nm.first}
                  {nm.age != null ? ' · ' + nm.age : ''}
                </div>
                <div style={{ fontSize: 12, color: 'var(--ink-faint)' }}>
                  {termOf(config, 'entity.familyOf', 'משפחת') + ' ' + nm.fam + ' · ' + planLabelOf(e)}
                </div>
              </div>
              <Btn
                sm
                kind={on ? 'primary' : undefined}
                onClick={() => {
                  if (!setPresent(e.id, today, !on) && !on) toast('אין יתרת כרטיסייה — טענו בניהול (⚙)');
                }}
              >
                {on ? '✓ נוכח/ת' : '○ סמן נוכחות'}
              </Btn>
              <Btn sm onClick={() => setAbsFor(e.id)} title="רישום חיסור עם נימוק (זכאות-השלמה / No-Show)">
                ✕ חיסור
              </Btn>
            </div>
          );
        })
      )}
    </Modal>
  );
}
