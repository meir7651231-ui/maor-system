/**
 * 🏠 טיפול משרדי (חנות 6, דפוס tzedaka/HomeTab) — מדדים, "מה מגיע וטרם
 * נמסר" מ-needsCare עם 🎁 מימוש לכל שורה, החגים הקרובים עם מונה מתנות
 * ממתינות, וקיצורי פעולה (מוצר/שיוך/מימוש מהיר).
 */
import { useState } from 'react';
import { useApp } from '../../store/useApp';
import { featureOn, termOf } from '../../lib/config';
import { downloadCsv } from '../reports/csv';
import { isoToday } from '../../lib/date-util';
import type { ShopAssignment, ShopComponent, ShopEvent } from '../../types/domain';
import { Btn, Chip, Select } from '../ui';
import {
  assignmentRedeemed,
  beneficiaryLabel,
  collectedPaid,
  givenValue,
  holidayAllowed,
  itemOf,
  needsCare,
  redemptionsCsvRows,
  subsidyTotal,
  upcomingHolidays,
  upcomingMeetings,
} from './lib';
import { ProductForm } from './ProductForm';
import { AssignmentForm } from './AssignmentForm';
import { RedeemModal } from './RedeemModal';
import { ShopEventModal } from './ShopEventModal';

export function HomeTab() {
  const db = useApp((s) => s.db);
  const config = useApp((s) => s.config);
  const toast = useApp((s) => s.toast);
  const today = isoToday();

  const [redeem, setRedeem] = useState<{ assignment: ShopAssignment; component: ShopComponent } | null>(null);
  const [meetingEv, setMeetingEv] = useState<ShopEvent | null>(null);
  const [productFormOpen, setProductFormOpen] = useState(false);
  const [assignFormOpen, setAssignFormOpen] = useState(false);
  const [quickAssignId, setQuickAssignId] = useState('');
  const [quickCompId, setQuickCompId] = useState('');

  // תיקון (swarm-audit): config מוזרק — מונחי termOf בתוויות + גידור shop.expiry
  const care = needsCare(db, today, config);
  const holidays = upcomingHolidays(today, 45);
  const meetings = upcomingMeetings(db, today, 2, config);
  const upsertShopEvent = useApp((s) => s.upsertShopEvent);
  const activeProducts = db.shopProducts.filter((p) => p.active).length;
  const activeAssignments = db.shopAssignments.filter((a) => a.status === 'active');

  // מונה "מתנות ממתינות" פר-חג — שיוך פעיל עם רכיב מתנת-חג שטרם מומש לחג
  function pendingForHoliday(h: { iso: string; name: string }): number {
    let n = 0;
    for (const a of activeAssignments) {
      const p = db.shopProducts.find((x) => x.id === a.productId);
      for (const c of p?.components ?? []) {
        const ri = itemOf(db, c);
        // חגים נבחרים (הכרעה 17) — נספרות רק מתנות לחגים שסומנו על הפריט
        if (ri.kind === 'holidayGift' && holidayAllowed(ri, h.name) && !assignmentRedeemed(a, c.id, h)) n++;
      }
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
        {/* ייצוא המימושים (CONNECT חיבור 6) — מבוטל מסומן ולא מוסתר */}
        {featureOn(config, 'shop.export') && (
          <Btn onClick={() => downloadCsv('shop-redemptions.csv', redemptionsCsvRows(db, config))}>⬇ ייצוא מימושים (CSV)</Btn>
        )}
        <Btn onClick={() => setAssignFormOpen(true)}>➕ {termOf(config, 'entity.shopAssignment', 'שיוך')}</Btn>
        {featureOn(config, 'shop.quickredeem') && db.shopAssignments.length > 0 && (
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
                  label: beneficiaryLabel(db, a, config) + ' · ' + (db.shopProducts.find((p) => p.id === a.productId)?.name ?? ''),
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

      {/* פגישות קרובות (הכרעה 22) — משטח התזכורות; ריק ⇒ לא מוצג */}
      {featureOn(config, 'shop.meeting') && meetings.length > 0 && (
        <section className="card">
          <h2 style={{ fontSize: 15, fontWeight: 800, marginBottom: 8 }}>🤝 פגישות קרובות</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {meetings.map(({ ev, who, roomName }) => (
              <div key={ev.id} style={{ display: 'flex', alignItems: 'center', gap: 8, border: '1px solid var(--line)', borderRadius: 10, padding: '7px 11px' }}>
                <Chip on={ev.date === today}>{ev.date === today ? 'היום' : 'מחר'}</Chip>
                <button
                  type="button"
                  onClick={() => setMeetingEv(ev)}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', textAlign: 'right', flex: 1, minWidth: 0, fontSize: 13, fontWeight: 700, padding: 0 }}
                  title="פתיחת הפגישה"
                >
                  {(ev.time ? ev.time + ' · ' : '') + who + (roomName ? ' · ' + roomName : '')}
                </button>
                <Btn sm onClick={() => { if (upsertShopEvent({ ...ev, done: true })) toast('הפגישה סומנה כבוצעה'); }}>
                  ✓ בוצע
                </Btn>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* החגים הקרובים */}
      {featureOn(config, 'shop.holidays') && (
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
      )}

      {/* מה מגיע וטרם נמסר */}
      {featureOn(config, 'shop.care') && (
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
      )}

      {redeem && <RedeemModal assignment={redeem.assignment} component={redeem.component} onClose={() => setRedeem(null)} />}
      {meetingEv && <ShopEventModal ev={meetingEv} date={meetingEv.date} onClose={() => setMeetingEv(null)} />}
      {productFormOpen && <ProductForm product={null} onClose={() => setProductFormOpen(false)} />}
      {assignFormOpen && <AssignmentForm assignment={null} onClose={() => setAssignFormOpen(false)} />}
    </div>
  );
}
