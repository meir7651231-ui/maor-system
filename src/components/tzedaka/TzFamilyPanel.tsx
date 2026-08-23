/**
 * פאנל קופות הצדקה בכרטיס המשפחה (CONNECT חיבור 2) — **תצוגה בלבד**:
 * קופות שהמשפחה מחזיקה + רכזים שהם בני הבית, וכפתור יחיד "פתח בעמודה".
 * אפס פעולות כתיבה — הבידוד נשמר; מאחורי tzedaka.familypanel.
 */
import { useApp } from '../../store/useApp';
import { useDbWatch } from '../../store/dbWatch';
import { termOf } from '../../lib/config';
import { Btn } from '../ui';
import { lastCollectionIso } from './lib';

export function TzFamilyPanel(props: { famId: string }) {
  const db = useDbWatch('tzBoxes', 'tzCoordinators');
  const config = useApp((s) => s.config);
  const go = useApp((s) => s.go);
  const boxes = db.tzBoxes.filter((b) => b.famId === props.famId && b.status === 'home');
  const coords = db.tzCoordinators.filter((c) => c.famId === props.famId);
  if (boxes.length === 0 && coords.length === 0) return null;

  return (
    <section className="card" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
        <h2 style={{ fontSize: 16, fontWeight: 700 }}>🪙 {termOf(config, 'nav.tzedaka', 'קופות צדקה')} בבית</h2>
        <Btn sm onClick={() => go('tzedaka')}>פתח בעמודה ←</Btn>
      </div>
      {boxes.map((b) => {
        const coord = db.tzCoordinators.find((c) => c.id === b.coordinatorId);
        const last = lastCollectionIso(b);
        return (
          <div key={b.id} style={{ display: 'flex', gap: 8, flexWrap: 'wrap', fontSize: 13, borderBottom: '1px solid var(--line)', paddingBottom: 6 }}>
            <b>{'#' + b.num}</b>
            {coord && <span>{termOf(config, 'entity.tzCoordinator', 'רכז') + ': ' + coord.name}</span>}
            <span style={{ color: 'var(--ink-faint)' }}>{last ? 'ריקון אחרון: ' + last : 'טרם רוקנה'}</span>
          </div>
        );
      })}
      {coords.map((c) => (
        <div key={c.id} style={{ fontSize: 13 }}>
          {'🧑‍🤝‍🧑 ' + c.name + ' — ' + termOf(config, 'entity.tzCoordinator', 'רכז') + (c.active ? '' : ' (לא פעיל/ה)')}
        </div>
      ))}
    </section>
  );
}
