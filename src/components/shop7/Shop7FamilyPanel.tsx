/**
 * פאנל החלוקה בכרטיס המשפחה (CONNECT — **תצוגה בלבד**): מסירות המשפחה
 * וסטטוסן (איסוף/בדרך/נמסר), עם כפתור "פתח בעמודה". אפס פעולות כתיבה —
 * הבידוד נשמר; מאחורי shop7.familypanel.
 */
import { useApp } from '../../store/useApp';
import { termOf } from '../../lib/config';
import { Btn } from '../ui';
import { deliveriesOfFamily, statusLabel } from './lib';

export function Shop7FamilyPanel(props: { famId: string }) {
  const db = useApp((s) => s.db);
  const config = useApp((s) => s.config);
  const go = useApp((s) => s.go);
  const deliveries = deliveriesOfFamily(db, props.famId);
  if (deliveries.length === 0) return null;

  const dayLabel = (id: string) => db.distributionDays.find((d) => d.id === id)?.title || 'יום חלוקה';
  const volLabel = (id: string) => db.volunteers.find((v) => v.id === id)?.name ?? '—';
  const color = (s: string) => (s === 'delivered' ? '#16a34a' : s === 'enroute' ? '#d97706' : '#64748b');

  return (
    <section className="card" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
        <h2 style={{ fontSize: 16, fontWeight: 700 }}>🚚 {termOf(config, 'nav.shop7', 'חלוקה')}</h2>
        <Btn sm onClick={() => go('shop7')}>פתח בעמודה ←</Btn>
      </div>
      {deliveries.map((d) => (
        <div key={d.id} style={{ display: 'flex', gap: 8, flexWrap: 'wrap', fontSize: 13, alignItems: 'baseline' }}>
          <b>{dayLabel(d.dayId)}</b>
          <span style={{ color: 'var(--ink-faint)' }}>· {volLabel(d.volunteerId)}</span>
          <span style={{ fontWeight: 700, color: color(d.status) }}>· {statusLabel(d.status)}</span>
        </div>
      ))}
    </section>
  );
}
