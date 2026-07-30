/**
 * טאב הרכזים (קופות 4) — גריד כרטיסים בדפוס TeachersSection; לחיצה פותחת
 * את הכרטיס הפנימי (CoordinatorCard) שבו הקופות מקוננות.
 */
import { useState } from 'react';
import { useApp } from '../../store/useApp';
import { featureOn, termOf } from '../../lib/config';
import { Btn, Chip, Empty } from '../ui';
import { coordinatorBoxes, coordinatorTotal } from './lib';
import { CoordinatorForm } from './CoordinatorForm';
import { CoordinatorCard } from './CoordinatorCard';

export function CoordinatorsTab(props: { selId: string | null; onSelect: (id: string | null) => void }) {
  const db = useApp((s) => s.db);
  const config = useApp((s) => s.config);
  const scoreOn = featureOn(config, 'tzedaka.score');
  const [formOpen, setFormOpen] = useState(false);

  const selected = db.tzCoordinators.find((c) => c.id === props.selId);
  if (selected) return <CoordinatorCard coordinator={selected} onBack={() => props.onSelect(null)} />;

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 10 }}>
        <Btn kind="primary" onClick={() => setFormOpen(true)}>
          ➕ הוספת {termOf(config, 'entity.tzCoordinator', 'רכז')}
        </Btn>
      </div>
      {db.tzCoordinators.length === 0 ? (
        <Empty>
          עדיין אין {termOf(config, 'entity.tzCoordinator', 'רכז')}ים — הוסיפו עם "➕ הוספת{' '}
          {termOf(config, 'entity.tzCoordinator', 'רכז')}"
        </Empty>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(230px, 1fr))', gap: 10 }}>
          {db.tzCoordinators.map((c) => {
            const boxes = coordinatorBoxes(db.tzBoxes, c.id);
            return (
              <button
                key={c.id}
                type="button"
                className="card"
                onClick={() => props.onSelect(c.id)}
                style={{ textAlign: 'right', cursor: 'pointer', display: 'flex', flexDirection: 'column', gap: 6 }}
                title="פתיחת כרטיס הרכז/ת"
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                  <span style={{ fontWeight: 800, fontSize: 15 }}>{c.name}</span>
                  <Chip on={c.active}>{c.active ? 'פעיל/ה' : 'לא פעיל/ה'}</Chip>
                </div>
                <div style={{ fontSize: 12.5, color: 'var(--ink-faint)' }}>{c.phone || 'ללא טלפון'}</div>
                <div style={{ fontSize: 12.5, fontWeight: 600 }}>
                  {scoreOn && <span style={{ marginInlineEnd: 8 }}>{'🏆 ' + c.score + ' נק׳'}</span>}
                  {boxes.length + ' קופות · ' + coordinatorTotal(db.tzBoxes, c.id).toLocaleString('he-IL') + ' ₪'}
                </div>
              </button>
            );
          })}
        </div>
      )}
      {formOpen && <CoordinatorForm coordinator={null} onClose={() => setFormOpen(false)} />}
    </div>
  );
}
