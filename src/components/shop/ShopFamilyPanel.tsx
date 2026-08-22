/**
 * פאנל חבילות השירות בכרטיס המשפחה (CONNECT חיבור 2) — **תצוגה בלבד**:
 * שיוכים פעילים (חבילה, התקדמות מימוש) + "מגיע וטרם נמסר" מ-needsCare
 * המסונן למשפחה, וכפתור יחיד "פתח בעמודה". אפס פעולות כתיבה — הבידוד
 * נשמר; מאחורי shop.familypanel.
 */
import { useApp } from '../../store/useApp';
import { termOf } from '../../lib/config';
import { isoToday } from '../../lib/date-util';
import { Btn } from '../ui';
import { SHOP_HOLIDAY_DUE_DAYS, componentRedeemedNow, needsCare, upcomingHolidays } from './lib';

export function ShopFamilyPanel(props: { famId: string }) {
  const db = useApp((s) => s.db);
  const config = useApp((s) => s.config);
  const go = useApp((s) => s.go);
  const assignments = db.shopAssignments.filter((a) => a.famId === props.famId && a.status === 'active');
  if (assignments.length === 0) return null;
  const ids = new Set(assignments.map((a) => a.id));
  // תיקון (swarm-audit): config מוזרק — מונחי termOf בתוויות + גידור shop.expiry
  const pending = needsCare(db, isoToday(), config).filter((x) => ids.has(x.assignmentId));
  const dueHolidays = upcomingHolidays(isoToday(), SHOP_HOLIDAY_DUE_DAYS);

  return (
    <section className="card" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
        <h2 style={{ fontSize: 16, fontWeight: 700 }}>🛍 חבילות שירות</h2>
        <Btn sm onClick={() => go('shop')}>פתח בעמודה ←</Btn>
      </div>
      {assignments.map((a) => {
        const product = db.shopProducts.find((p) => p.id === a.productId);
        const total = product?.components.length ?? 0;
        // תיקון (swarm-audit): מתנת-חג פר-חג-ושנה-עברית — לא "מומש אי-פעם" (מצג '3/3'
        // בעוד needsCare התריע שהמתנה של השנה מגיעה)
        const done = product ? product.components.filter((c) => componentRedeemedNow(db, a, c, dueHolidays)).length : 0;
        return (
          <div key={a.id} style={{ display: 'flex', gap: 8, flexWrap: 'wrap', fontSize: 13 }}>
            <b>{product?.name ?? termOf(config, 'entity.shopProduct', 'מוצר')}</b>
            <span style={{ color: 'var(--ink-faint)' }}>{'מומשו ' + done + '/' + total}</span>
          </div>
        );
      })}
      {pending.length > 0 && (
        <div style={{ fontSize: 12.5 }}>
          <b>מגיע וטרם נמסר:</b>
          {pending.slice(0, 5).map((x) => (
            <div key={x.kind + x.assignmentId + x.componentId + x.hint} style={{ color: 'var(--ink-faint)' }}>
              {'· ' + x.label + ' — ' + x.hint}
            </div>
          ))}
          {pending.length > 5 && <div style={{ color: 'var(--ink-faint)' }}>{'+' + (pending.length - 5) + ' נוספים בעמודה'}</div>}
        </div>
      )}
    </section>
  );
}
