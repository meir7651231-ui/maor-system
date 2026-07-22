/**
 * היסטוריית חיסורים של תלמיד/ה בשיבוץ — תאריך, נימוק וסטטוס
 * (זכאי/ת להשלמה · ביטול מאוחר · No-Show), כולל יתרת כרטיסייה.
 */
import { useApp } from '../../store/useApp';
import type { Absence } from '../../types/domain';
import { Btn, Empty, Modal } from '../ui';
import { chipStyle, fmtDate, planLabelOf } from './lib';

function absenceMeta(a: Absence): { label: string; bg: string; c: string } {
  if (a.noshow) return { label: 'No-Show', bg: '#fdeaea', c: '#b91c1c' };
  if (a.makeup) return { label: 'זכאי/ת להשלמה', bg: '#e4f5ea', c: '#12803c' };
  return { label: 'ביטול מאוחר', bg: '#fdf1d4', c: '#9a6414' };
}

export function AbsenceHistoryModal(props: { enrollmentId: string; who: string; onClose: () => void }) {
  const db = useApp((s) => s.db);
  const en = db.enrollments.find((e) => e.id === props.enrollmentId);
  if (!en) return null;

  return (
    <Modal title={'היסטוריית חיסורים — ' + props.who} onClose={props.onClose}>
      <div style={{ fontSize: 13, color: 'var(--ink-faint)', marginBottom: 10 }}>
        {planLabelOf(en)} · {en.absences.length} חיסורים מתועדים
      </div>
      {en.absences.length === 0 ? (
        <Empty>אין חיסורים מתועדים</Empty>
      ) : (
        <table className="table">
          <thead>
            <tr>
              <th>תאריך</th>
              <th>נימוק</th>
              <th>סטטוס</th>
            </tr>
          </thead>
          <tbody>
            {en.absences.map((a, i) => {
              const meta = absenceMeta(a);
              return (
                <tr key={i}>
                  <td style={{ whiteSpace: 'nowrap' }}>{fmtDate(a.date)}</td>
                  <td>{a.reason || '—'}</td>
                  <td>
                    <span style={chipStyle(meta.bg, meta.c)}>{meta.label}</span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
      <div className="modal-actions">
        <Btn onClick={props.onClose}>סגירה</Btn>
      </div>
    </Modal>
  );
}
