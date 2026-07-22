/**
 * פאנל נוכחות למפגש ביומן החדרים — המשובצים לקורס/לקבוצה של המפגש,
 * עם פעולות לכל תלמיד/ה: ✓ נוכחות (ניקוב), ✕ רישום חיסור, 📜 היסטוריה.
 */
import { useState } from 'react';
import type { Course, Enrollment } from '../../types/domain';
import { allMembers, useApp } from '../../store/useApp';
import { Btn, Empty } from '../ui';
import { chipStyle, enrollStatusMeta, enrollmentsForSession, planLabelOf } from './lib';
import { DiaryAbsenceModal } from './DiaryAbsenceModal';
import { AbsenceHistoryModal } from './AbsenceHistoryModal';

export function AttendancePanel(props: { course: Course; sessionIndex: number }) {
  const db = useApp((s) => s.db);
  const punch = useApp((s) => s.punch);
  const upsertEnrollment = useApp((s) => s.upsertEnrollment);
  const addCred = useApp((s) => s.addCred);
  const toast = useApp((s) => s.toast);

  const [absFor, setAbsFor] = useState<{ id: string; who: string } | null>(null);
  const [histFor, setHistFor] = useState<{ id: string; who: string } | null>(null);

  const members = allMembers(db);
  const rows = enrollmentsForSession(db, props.course, props.sessionIndex).map((e) => ({
    e,
    m: members.find((m) => m.id === e.memberId),
  }));

  function nameOf(row: { e: Enrollment; m?: { first: string; famName: string } }): string {
    return row.m ? `${row.m.first} ${row.m.famName}`.trim() : 'תלמיד/ה לא נמצא/ה';
  }

  /** רישום נוכחות — כרטיסייה דרך punch של ה-store; מנוי חודשי — מונה ידני (כמו במקור). */
  function present(e: Enrollment) {
    if (e.status === 'paused') return toast('השיבוץ מוקפא — הפשירו אותו בניהול השיבוץ (⚙)');
    if (e.status === 'ended') return toast('השיבוץ הסתיים — ניתן לחדש בניהול השיבוץ (⚙)');
    if (e.plan === 'punch' && e.used >= e.purchased) return toast('אין יתרת שיעורים — נדרש חידוש כרטיסייה');
    if (e.plan === 'punch') punch(e.id);
    else upsertEnrollment({ ...e, used: e.used + 1 });
    const fam = db.families.find((f) => f.members.some((m) => m.id === e.memberId));
    if (fam) addCred(fam.id, 5, 'נוכחות (Check-in)');
    toast('הניקוב נרשם בהצלחה');
  }

  return (
    <div
      style={{
        margin: '2px 0 8px',
        border: '1px solid var(--line)',
        borderRadius: 10,
        background: '#faf8f2',
        padding: '8px 12px',
      }}
    >
      {rows.length === 0 ? (
        <Empty>אין תלמידים משובצים למפגש זה</Empty>
      ) : (
        <table className="table">
          <thead>
            <tr>
              <th>תלמיד/ה</th>
              <th>מסלול</th>
              <th>חיסורים</th>
              <th style={{ width: 190 }}>נוכחות</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => {
              const st = enrollStatusMeta(row.e);
              const who = nameOf(row) + ' · ' + props.course.name;
              return (
                <tr key={row.e.id}>
                  <td>
                    <span style={{ fontWeight: 600 }}>{nameOf(row)}</span>
                    {st && (
                      <span style={{ ...chipStyle(st.bg, st.c), marginInlineStart: 6 }}>{st.label}</span>
                    )}
                  </td>
                  <td style={{ whiteSpace: 'nowrap' }}>{planLabelOf(row.e)}</td>
                  <td>{row.e.absences.length || '—'}</td>
                  <td>
                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                      <Btn sm kind="primary" title="רישום נוכחות (ניקוב)" onClick={() => present(row.e)}>
                        ✓ נוכח/ת
                      </Btn>
                      <Btn sm title="רישום חיסור (נימוק חובה)" onClick={() => setAbsFor({ id: row.e.id, who })}>
                        ✕ חיסור
                      </Btn>
                      <Btn sm title="היסטוריית חיסורים" onClick={() => setHistFor({ id: row.e.id, who: nameOf(row) })}>
                        📜
                      </Btn>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}

      {absFor && (
        <DiaryAbsenceModal
          enrollmentId={absFor.id}
          course={props.course}
          who={absFor.who}
          onClose={() => setAbsFor(null)}
        />
      )}
      {histFor && (
        <AbsenceHistoryModal enrollmentId={histFor.id} who={histFor.who} onClose={() => setHistFor(null)} />
      )}
    </div>
  );
}
