/**
 * טאב הקטלוג (חנות 4) — גריד כרטיסי מוצרים בדפוס CoordinatorsTab:
 * שם, תיאור, רכיבים לפי סוג (🤝 פגישה · 🎟 קופון · 🎁 מתנה · 🕎 מתנת-חג),
 * שיוכים פעילים וצ'יפ פעיל/לא. בתחתית — פאנלי החנויות והקריטריונים
 * (מאחורי shop.stores / shop.criteria).
 */
import { useState } from 'react';
import { useApp } from '../../store/useApp';
import { featureOn, termOf } from '../../lib/config';
import type { ShopProduct } from '../../types/domain';
import { Btn, Chip, Empty } from '../ui';
import { useArmed } from '../useArmed';
import { componentCounts, componentRemaining, productAssignments } from './lib';
import { ProductForm } from './ProductForm';
import { StoresPanel } from './StoresPanel';
import { CriteriaPanel } from './CriteriaPanel';

const KIND_ICONS: { key: 'meeting' | 'coupon' | 'gift' | 'holidayGift'; icon: string; label: string }[] = [
  { key: 'meeting', icon: '🤝', label: 'פגישה' },
  { key: 'coupon', icon: '🎟', label: 'קופון' },
  { key: 'gift', icon: '🎁', label: 'מתנה' },
  { key: 'holidayGift', icon: '🕎', label: 'מתנת-חג' },
];

export function CatalogTab() {
  const db = useApp((s) => s.db);
  const config = useApp((s) => s.config);
  const deleteShopProduct = useApp((s) => s.deleteShopProduct);
  const toast = useApp((s) => s.toast);
  const [editing, setEditing] = useState<ShopProduct | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const { armed, confirmTwice } = useArmed(featureOn(config, 'shell.armdel'));
  const storesOn = featureOn(config, 'shop.stores');
  const criteriaOn = featureOn(config, 'shop.criteria');
  const term = termOf(config, 'entity.shopProduct', 'מוצר');

  function removeProduct(p: ShopProduct) {
    if (!confirmTwice('shp-' + p.id, 'למחוק את "' + p.name + '" מהקטלוג?')) return;
    if (deleteShopProduct(p.id)) toast('"' + p.name + '" הוסר מהקטלוג');
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 10 }}>
        <Btn kind="primary" onClick={() => { setEditing(null); setFormOpen(true); }}>
          ➕ הוספת {termOf(config, 'entity.shopProduct', 'מוצר')}
        </Btn>
      </div>
      {db.shopProducts.length === 0 ? (
        <Empty>עדיין אין {term}ים בקטלוג — הוסיפו עם "➕ הוספת {term}"</Empty>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 10 }}>
          {db.shopProducts.map((p) => {
            const counts = componentCounts(p);
            const activeCount = productAssignments(db.shopAssignments, p.id).filter((a) => a.status === 'active').length;
            return (
              <div key={p.id} className="card" style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                  <span style={{ fontWeight: 800, fontSize: 15 }}>{p.name}</span>
                  <Chip on={p.active}>{p.active ? 'פעיל' : 'לא פעיל'}</Chip>
                </div>
                {p.desc && <div style={{ fontSize: 12.5, color: 'var(--ink-faint)' }}>{p.desc}</div>}
                <div style={{ fontSize: 12.5, fontWeight: 600, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {KIND_ICONS.filter((k) => counts[k.key] > 0).map((k) => (
                    <span key={k.key} title={k.label}>{k.icon + ' ' + counts[k.key]}</span>
                  ))}
                  {p.components.length === 0 && <span style={{ color: 'var(--ink-faint)' }}>ללא רכיבים</span>}
                </div>
                <div style={{ fontSize: 12.5 }}>{activeCount + ' שיוכים פעילים'}</div>
                {p.components.some((c) => c.stock !== undefined) && (
                  <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                    {p.components
                      .filter((c) => c.stock !== undefined)
                      .map((c) => {
                        const rem = componentRemaining(c.id, p.id, db.shopAssignments, c.stock) ?? 0;
                        const color = rem === 0 ? '#b91c1c' : rem <= 2 ? '#9a6414' : 'var(--green)';
                        return (
                          <span key={c.id} style={{ fontSize: 11, fontWeight: 700, color, border: '1px solid var(--line)', borderRadius: 99, padding: '1px 7px' }}>
                            {c.label + ' · נותרו ' + rem}
                          </span>
                        );
                      })}
                  </div>
                )}
                <div style={{ display: 'flex', gap: 6, marginTop: 'auto' }}>
                  <Btn sm onClick={() => { setEditing(p); setFormOpen(true); }}>✏️ עריכה</Btn>
                  <Btn sm kind="danger" onClick={() => removeProduct(p)}>
                    {armed === 'shp-' + p.id ? 'בטוח/ה? לחיצה שוב מוחקת' : '🗑 מחיקה'}
                  </Btn>
                </div>
              </div>
            );
          })}
        </div>
      )}
      {storesOn && <StoresPanel />}
      {criteriaOn && <CriteriaPanel />}
      {formOpen && <ProductForm product={editing} onClose={() => setFormOpen(false)} />}
    </div>
  );
}
