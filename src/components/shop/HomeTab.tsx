/**
 * 🏠 טיפול משרדי (חנות 6, דפוס tzedaka/HomeTab) — מדדים, "מה מגיע וטרם
 * נמסר" מ-needsCare עם 🎁 מימוש לכל שורה, החגים הקרובים עם מונה מתנות
 * ממתינות, וקיצורי פעולה (מוצר/שיוך/מימוש מהיר).
 */
import { useState } from 'react';
import { useApp } from '../../store/useApp';
import { termOf } from '../../lib/config';
import { isoToday } from '../../lib/date-util';
import type { ShopAssignment, ShopComponent } from '../../types/domain';
import { Btn, Chip, Select } from '../ui';
import {
  assignmentRedeemed,
  beneficiaryLabel,
  collectedPaid,
  givenValue,
  itemOf,
  needsCare,
  subsidyTotal,
  upcomingHolidays,
} from './lib';
import { ProductForm } from './ProductForm';
import { AssignmentForm } from './AssignmentForm';
import { RedeemModal } from './RedeemModal';

export function HomeTab() {
  const db = useApp((s) => s.db);
  const config = useApp((s) => s.config);
  const toast = useApp((s) => s.toast);
  const today = isoToday();

  const [redeem, setRedeem] = useState<{ assignment: ShopAssignment; component: ShopComponent } | null>(null);
  const [productFormOpen, setProductFormOpen] = useState(false);
  const [assignFormOpen, setAssignFormOpen] = useState(false);
  const [quickAssignId, setQuickAssignId] = useState('');
  const [quickCompId, setQuickCompId] = useState('');

  const care = needsCare(db, today);
  const holidays = upcomingHolidays(today, 45);
  const activeProducts = db.shopProducts.filter((p) => p.active).length;
  const activeAssignments = db.shopAssignments.filter((a) => a.status === 'active');

  // מונה "מתנות ממתינות" פר-חג — שיוך פעיל עם רכיב מתנת-חג שטרם מומש לחג
  function pendingForHoliday(h: { iso: string; name: string }): number {
    let n = 0;
    for (const a of activeAssignments) {
      const p = db.shopProducts.find((x) => x.id === a.productId);
      for (const c of p?.components ?? [])
        if (itemOf(db, c).kind === 'holidayGift' && !assignmentRedeemed(a, c.id, h)) n++;
    }
    return n;
  }

  function openRedeem(assignmentId: string, componentId: string) {
    const a = db.shopAssignments.find((x) => x.id === assignmentId);
    const p = a && db.shopProducts.find((x) => x.id === a.productId);
    const c = p?.components.find((x) => x.id === componentId);
    if (a && c) setRedeem({ assignment: a, component: c });
    else toast('הרכיב לא נמצא — ייתכן שהמוצר השתנה');
  }

  const quickAssign = db.shopAssignments.find((a) => a.id === quickAssignId);
  const quickProduct = quickAssign && db.shopProducts.find((p) => p.id === quickAssign.productId);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      {/* מדדים */}
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
        <Chip on>{'🛍 מוצרים פעילים · ' + activeProducts}</Chip>
        <Chip on={false}>{'👥 שיוכים פעילים · ' + activeAssignments.length}</Chip>
        <Chip on={false}>{'🎁 שווי שניתן · ' + givenValue(db.shopAssignments).toLocaleString('he-IL') + ' ₪'}</Chip>
        <Chip on={false}>{'💳 שולם סמלי · ' + collectedPaid(db.shopAssignments).toLocaleString('he-IL') + ' ₪'}</Chip>
        <Chip on={false}>{'🤲 סובסידיה · ' + subsidyTotal(db.shopAssignments).toLocaleString('he-IL') + ' ₪'}</Chip>
      </div>

      {/* קיצורי פעולה */}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
        <Btn onClick={() => setProductFormOpen(true)}>➕ {termOf(config, 'entity.shopProduct', 'מוצר')}</Btn>
        <Btn onClick={() => setAssignFormOpen(true)}>➕ {termOf(config, 'entity.shopAssignment', 'שיוך')}</Btn>
        {db.shopAssignments.length > 0 && (
          <span style={{ display: 'inline-flex', gap: 6, alignItems: 'center', flexWrap: 'wrap' }}>
            <Select
              value={quickAssignId}
              onChange={(v) => {
                setQuickAssignId(v);
                setQuickCompId('');
              }}
              options={[
                { value: '', label: '🎁 מימוש מהיר — בחרו שיוך' },
                ...activeAssignments.map((a) => ({
                  value: a.id,
                  label: beneficiaryLabel(db, a) + ' · ' + (db.shopProducts.find((p) => p.id === a.productId)?.name ?? ''),
                })),
              ]}
            />
            {quickProduct && (
              <Select
                value={quickCompId}
                onChange={setQuickCompId}
                options={[
                  { value: '', label: 'בחרו רכיב' },
                  ...quickProduct.components.map((c) => ({ value: c.id, label: itemOf(db, c).name })),
                ]}
              />
            )}
            <Btn
              sm
              onClick={() => {
                if (quickAssignId && quickCompId) openRedeem(quickAssignId, quickCompId);
                else toast('בחרו שיוך ורכיב למימוש');
              }}
            >
              🎁
            </Btn>
          </span>
        )}
      </div>

      {/* החגים הקרובים */}
      <section className="card">
        <h2 style={{ fontSize: 15, fontWeight: 800, marginBottom: 8 }}>🕎 החגים הקרובים ומי מקבל מה</h2>
        {holidays.length === 0 ? (
          <div style={{ fontSize: 13, color: 'var(--ink-faint)' }}>אין חגים ב-45 הימים הקרובים</div>
        ) : (
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {holidays.map((h) => {
              const pending = pendingForHoliday(h);
              return (
                <Chip key={h.name} on={pending > 0}>
                  {h.name + ' · ' + h.iso + (pending ? ' · ' + pending + ' מתנות ממתינות' : '')}
                </Chip>
              );
            })}
          </div>
        )}
      </section>

      {/* מה מגיע וטרם נמסר */}
      <section className="card">
        <h2 style={{ fontSize: 15, fontWeight: 800, marginBottom: 8 }}>🔔 מה מגיע וטרם נמסר</h2>
        {care.length === 0 && <div style={{ fontSize: 13, color: 'var(--green)', fontWeight: 600 }}>הכל נמסר ✓</div>}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {care.map((item) => (
            <div
              key={item.kind + item.assignmentId + item.componentId + item.hint}
              style={{ display: 'flex', alignItems: 'center', gap: 8, border: '1px solid var(--line)', borderRadius: 10, padding: '7px 11px' }}
            >
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 700 }}>{item.label}</div>
                <div style={{ fontSize: 12, color: 'var(--ink-faint)' }}>{item.hint}</div>
              </div>
              {/* stockOut הוא התרעת רכש — אין שיוך לממש */}
              {item.assignmentId && <Btn sm onClick={() => openRedeem(item.assignmentId, item.componentId)}>🎁 מימוש</Btn>}
            </div>
          ))}
        </div>
      </section>

      {redeem && <RedeemModal assignment={redeem.assignment} component={redeem.component} onClose={() => setRedeem(null)} />}
      {productFormOpen && <ProductForm product={null} onClose={() => setProductFormOpen(false)} />}
      {assignFormOpen && <AssignmentForm assignment={null} onClose={() => setAssignFormOpen(false)} />}
    </div>
  );
}
