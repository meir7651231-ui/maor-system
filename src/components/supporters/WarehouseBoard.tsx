/**
 * מחסן-החומרים — לוח מלאי חוצה-פרויקטים (ורטיקל-הסטודיו). מציג לכל פריט:
 * מלאי · הוקצה (נגזר מרשומות-החומרים של הפרויקטים) · נותר · התרעת-מחסור, עם
 * פירוק פר-פרויקט. הוספה/עריכה/מחיקה של פריט. מגודר supporters.ayin.warehouse
 * + הקשר-מסחרי (מוסתר בעמותה). אפס-כסף/קבלות.
 */
import { useMemo, useState } from 'react';
import { useApp } from '../../store/useApp';
import { warehouseOverview, warehouseValue } from '../../lib/warehouse';
import { Btn, Empty } from '../ui';

export function WarehouseBoard(props: { onExit?: () => void }) {
  const warehouse = useApp((s) => s.db.warehouse);
  const supporters = useApp((s) => s.db.supporters);
  const upsert = useApp((s) => s.upsertWarehouseItem);
  const remove = useApp((s) => s.deleteWarehouseItem);

  const [name, setName] = useState('');
  const [unit, setUnit] = useState('');
  const [qty, setQty] = useState('');
  const [cost, setCost] = useState('');
  const [expanded, setExpanded] = useState<string | null>(null);

  const rows = useMemo(() => warehouseOverview(warehouse, supporters), [warehouse, supporters]);
  const totalValue = warehouseValue(warehouse);
  const shortCount = rows.filter((r) => r.short).length;
  const ils = (n: number) => '₪' + Math.round(n).toLocaleString('en-US');

  function add() {
    if (!name.trim()) return;
    upsert({ name, unit, qty: +qty || 0, cost: +cost || 0 });
    setName(''); setUnit(''); setQty(''); setCost('');
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
        <h1 style={{ fontSize: 22, fontWeight: 800, margin: 0 }}>🏭 מחסן-החומרים</h1>
        <span style={{ fontSize: 12.5, color: 'var(--ink-faint)' }}>
          {warehouse.length} פריטים · ערך-מלאי {ils(totalValue)}{shortCount ? ' · ' : ''}
          {shortCount ? <span style={{ color: 'var(--red, #b3261e)', fontWeight: 700 }}>⚠ {shortCount} בחוסר</span> : null}
        </span>
        {props.onExit ? <Btn onClick={props.onExit} title="חזרה למסך-הנתונים">☰ מסך הנתונים</Btn> : null}
      </div>

      {/* הוספת פריט */}
      <div className="card" style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center', padding: 12 }}>
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder="שם-החומר" style={{ flex: 1, minWidth: 130, padding: '5px 7px' }} onKeyDown={(e) => { if (e.key === 'Enter') add(); }} />
        <input value={unit} onChange={(e) => setUnit(e.target.value)} placeholder="יח׳" style={{ width: 64, padding: '5px 7px' }} />
        <input value={qty} onChange={(e) => setQty(e.target.value)} placeholder="מלאי" dir="ltr" style={{ width: 74, padding: '5px 7px' }} />
        <span style={{ color: 'var(--ink-faint)' }}>×</span>
        <input value={cost} onChange={(e) => setCost(e.target.value)} placeholder="₪ ליח׳" dir="ltr" style={{ width: 78, padding: '5px 7px' }} />
        <Btn kind="primary" onClick={add}>➕ הוספת פריט</Btn>
      </div>

      {warehouse.length === 0 ? (
        <Empty>המחסן ריק — הוסיפו פריט-מלאי ראשון למעלה.</Empty>
      ) : (
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1.6fr .7fr .8fr .8fr .8fr auto', gap: 8, padding: '9px 14px', fontSize: 11, fontWeight: 800, color: 'var(--ink-faint)', borderBottom: '1px solid var(--line)' }}>
            <span>חומר</span><span>מלאי</span><span>הוקצה</span><span>נותר</span><span>ערך</span><span></span>
          </div>
          {rows.map((r) => (
            <div key={r.item.id}>
              <div style={{ display: 'grid', gridTemplateColumns: '1.6fr .7fr .8fr .8fr .8fr auto', gap: 8, padding: '8px 14px', alignItems: 'center', borderBottom: '1px solid var(--line-soft, #efe8d9)', fontSize: 13, background: r.short ? 'var(--red-bg, #fdecec)' : 'transparent' }}>
                <span style={{ fontWeight: 700, cursor: r.byProject.length ? 'pointer' : 'default' }} onClick={() => r.byProject.length && setExpanded(expanded === r.item.id ? null : r.item.id)}>
                  {r.byProject.length ? (expanded === r.item.id ? '▾ ' : '▸ ') : ''}{r.item.name}
                </span>
                <span style={{ fontVariantNumeric: 'tabular-nums' }}>{r.item.qty}{r.item.unit ? ' ' + r.item.unit : ''}</span>
                <span style={{ fontVariantNumeric: 'tabular-nums', color: 'var(--ink-soft)' }}>{r.allocated || '—'}</span>
                <span style={{ fontVariantNumeric: 'tabular-nums', fontWeight: 700, color: r.short ? 'var(--red, #b3261e)' : 'var(--good, #2e7d32)' }}>{r.short ? '⚠ ' : ''}{r.remaining}</span>
                <span style={{ fontVariantNumeric: 'tabular-nums', direction: 'ltr' }}>{ils((+r.item.qty || 0) * (+r.item.cost || 0))}</span>
                <button onClick={() => remove(r.item.id)} title="מחיקה" style={{ color: 'var(--ink-faint)', fontWeight: 800, background: 'none', border: 'none', cursor: 'pointer' }}>🗑</button>
              </div>
              {expanded === r.item.id && r.byProject.length > 0 && (
                <div style={{ padding: '4px 26px 8px', display: 'flex', flexDirection: 'column', gap: 2, background: 'var(--panel-2, #f7f2e8)', borderBottom: '1px solid var(--line-soft, #efe8d9)' }}>
                  {r.byProject.map((p) => (
                    <div key={p.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: 'var(--ink-soft)' }}>
                      <span>{p.name}</span><span style={{ fontWeight: 700 }}>{p.qty}{r.item.unit ? ' ' + r.item.unit : ''}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
