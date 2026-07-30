/**
 * טאב המוטבים (חנות 5) — שיוכים מקובצים לפי משפחה עם פס התקדמות מימוש;
 * לחיצה פותחת כרטיס שיוך פנימי: רכיבי המוצר בשורות עם סטטוס מימוש
 * (✅ מומש / ⏳ ממתין) וכפתור 🎁 מימוש (RedeemModal). למתנת-חג — החג
 * הקרוב ומצב המימוש שלו. שינוי סטטוס ומחיקה (useArmed) בכרטיס.
 */
import { useState } from 'react';
import { useApp } from '../../store/useApp';
import { featureOn, termOf } from '../../lib/config';
// downloadReceipt משמש כאן אך ורק לאישור תשלום סמלי מסדרת S- — לא קבלת מס,
// ובלי שדות סעיף 46 (נאכף בהגנת-מקור ב-shop-sreceipt.test.ts)
import { downloadReceipt } from '../../lib/receipt';
import type { ShopAssignment, ShopComponent, ShopRedemption } from '../../types/domain';
import { Btn, Chip, Empty } from '../ui';
import { useArmed } from '../useArmed';
import { isoToday } from '../../lib/date-util';
import { assignmentRedeemed, beneficiaryLabel, componentRemaining, couponExpiry, itemOf, itemRemaining, upcomingHolidays } from './lib';
import { AssignmentForm } from './AssignmentForm';
import { RedeemModal } from './RedeemModal';

const STATUS_LABEL: Record<ShopAssignment['status'], string> = {
  active: '▶ פעיל',
  done: '✅ הושלם',
  stopped: '⏸ הופסק',
};

function AssignmentCard(props: { assignment: ShopAssignment; onBack: () => void }) {
  const db = useApp((s) => s.db);
  const config = useApp((s) => s.config);
  const upsertShopAssignment = useApp((s) => s.upsertShopAssignment);
  const deleteShopAssignment = useApp((s) => s.deleteShopAssignment);
  const voidShopRedemption = useApp((s) => s.voidShopRedemption);
  const toast = useApp((s) => s.toast);
  const { armed, confirmTwice } = useArmed(featureOn(config, 'shell.armdel'));
  const a = props.assignment;
  const product = db.shopProducts.find((p) => p.id === a.productId);
  const [redeeming, setRedeeming] = useState<ShopComponent | null>(null);
  const [editOpen, setEditOpen] = useState(false);
  const nextHolidays = upcomingHolidays(isoToday(), 45);

  function remove() {
    if (!confirmTwice('sha-' + a.id, 'למחוק את ה' + termOf(config, 'entity.shopAssignment', 'שיוך') + '? המימושים יימחקו איתו')) return;
    deleteShopAssignment(a.id);
    toast('ה' + termOf(config, 'entity.shopAssignment', 'שיוך') + ' נמחק');
    props.onBack();
  }

  /** ביטול עם סימון (הכרעה 14) — דו-קליק, סיבה רשות; הרשומה וה-S- נשארים. */
  function voidRedemption(r: ShopRedemption) {
    if (!confirmTwice('shr-' + r.id, 'לבטל את המימוש' + (r.rid ? ' (' + r.rid + ')' : '') + '? הרשומה תסומן ולא תימחק')) return;
    const reason = window.prompt('סיבת הביטול (רשות):') ?? '';
    if (voidShopRedemption(a.id, r.id, reason)) toast('המימוש בוטל — הרשומה נשארה מתועדת' + (r.rid ? ' (' + r.rid + ')' : ''));
  }

  /** הורדת אישור תשלום סמלי S- — אינו קבלת מס ואינו נושא שדות סעיף 46. */
  function downloadConfirmation(r: ShopRedemption, comp: ShopComponent) {
    if (!r.rid) return;
    downloadReceipt({
      rid: r.rid,
      orgName: config.orgName || db.orgName,
      payer: beneficiaryLabel(db, a),
      amount: r.paid,
      date: r.date,
      forWhat: 'מימוש: ' + itemOf(db, comp).name + ' (' + (product?.name ?? '') + ') · אישור תשלום — אינו קבלה לצורכי מס',
      taxReceipt: false,
    });
  }

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 10 }}>
        <Btn sm onClick={props.onBack}>→ חזרה</Btn>
        <b style={{ fontSize: 15 }}>{beneficiaryLabel(db, a)}</b>
        <span>{'· ' + (product?.name ?? 'מוצר שנמחק')}</span>
        {/* מובייל (SHOP4 סעיף 3): שורת הפעולות נשברת מסודר — wrap + gap אחיד */}
        <span style={{ marginInlineStart: 'auto', display: 'flex', flexWrap: 'wrap', gap: 6, alignItems: 'center', justifyContent: 'flex-end' }}>
          <select
            value={a.status}
            onChange={(e) => upsertShopAssignment({ ...a, status: e.target.value as ShopAssignment['status'] })}
            title="סטטוס השיוך"
          >
            {(Object.keys(STATUS_LABEL) as ShopAssignment['status'][]).map((s) => (
              <option key={s} value={s}>{STATUS_LABEL[s]}</option>
            ))}
          </select>
          <Btn sm onClick={() => setEditOpen(true)}>✏️ עריכה</Btn>
          <Btn sm kind="danger" onClick={remove}>{armed === 'sha-' + a.id ? 'בטוח/ה? שוב מוחקת' : '🗑 מחיקה'}</Btn>
        </span>
      </div>
      {!product ? (
        <Empty>המוצר של השיוך אינו בקטלוג</Empty>
      ) : product.components.length === 0 ? (
        <Empty>למוצר אין רכיבים — הוסיפו בעריכת המוצר בקטלוג</Empty>
      ) : (
        product.components.map((c) => {
          const ri = itemOf(db, c);
          const nextH = ri.kind === 'holidayGift' ? nextHolidays[0] : undefined;
          const done = ri.kind === 'holidayGift' ? !!nextH && assignmentRedeemed(a, c.id, nextH) : assignmentRedeemed(a, c.id);
          const reds = a.redemptions.filter((r) => r.componentId === c.id);
          // מלאי משותף (הכרעה 18) — הנותר נספר על הפריט; נתון טרום-מיגרציה נופל לרכיב
          const rem = c.itemId ? itemRemaining(db, c.itemId) : componentRemaining(c.id, product.id, db.shopAssignments, c.stock);
          return (
            <div key={c.id} className="card" style={{ marginBottom: 8 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                <span style={{ fontWeight: 700 }}>{ri.name}</span>
                {rem !== null && (
                  <span style={{ fontSize: 11, fontWeight: 700, color: rem === 0 ? '#b91c1c' : rem <= 2 ? '#9a6414' : 'var(--green)', border: '1px solid var(--line)', borderRadius: 99, padding: '1px 7px' }}>
                    {'נותרו ' + rem}
                  </span>
                )}
                {ri.kind === 'holidayGift' && nextH && (
                  <span style={{ fontSize: 12.5, color: 'var(--ink-faint)' }}>{'החג הקרוב: ' + nextH.name + ' (' + nextH.iso + ')'}</span>
                )}
                {ri.kind === 'holidayGift' && !!ri.holidays?.length && (
                  <span style={{ fontSize: 12.5, color: 'var(--ink-faint)' }}>{'לחגים: ' + ri.holidays.join(' · ')}</span>
                )}
                {ri.kind === 'coupon' && couponExpiry(a, ri) && (
                  <span style={{ fontSize: 12.5, fontWeight: 700, color: couponExpiry(a, ri) < isoToday() ? '#b91c1c' : 'var(--ink-faint)' }}>
                    {couponExpiry(a, ri) < isoToday() ? 'פג תוקף ב-' + couponExpiry(a, ri) : 'בתוקף עד ' + couponExpiry(a, ri)}
                  </span>
                )}
                {!done && <span style={{ fontSize: 12.5 }}>⏳ ממתין</span>}
                <span style={{ marginInlineStart: 'auto' }}>
                  <Btn sm kind="primary" onClick={() => setRedeeming(c)}>🎁 מימוש</Btn>
                </span>
              </div>
              {reds.map((r) => (
                <div key={r.id} style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginTop: 6, fontSize: 12.5 }}>
                  <span style={{ textDecoration: r.voidedAt ? 'line-through' : undefined }}>
                    {(r.voidedAt ? '' : '✅ ') + 'מומש ב-' + r.date + ' · שולם ' + r.paid.toLocaleString('he-IL') + ' ₪' + (r.rid ? ' · ' + r.rid : '')}
                  </span>
                  {r.voidedAt && (
                    <span
                      title={r.voidReason || 'ללא סיבה'}
                      style={{ fontSize: 11, fontWeight: 700, color: '#b91c1c', border: '1px solid var(--line)', borderRadius: 99, padding: '1px 7px' }}
                    >
                      {'🚫 מבוטל ב-' + r.voidedAt}
                    </span>
                  )}
                  <span style={{ marginInlineStart: 'auto', display: 'flex', gap: 6 }}>
                    {/* מבוטל — בלי הורדת אישור (הרישום במערכת הוא התיעוד); ה-rid נשאר מוצג */}
                    {!r.voidedAt && r.rid && (
                      <Btn sm onClick={() => downloadConfirmation(r, c)} title="אישור תשלום — אינו קבלה לצורכי מס">
                        🧾 אישור
                      </Btn>
                    )}
                    {!r.voidedAt && (
                      <Btn sm kind="danger" onClick={() => voidRedemption(r)}>
                        {armed === 'shr-' + r.id ? 'בטוח/ה? שוב מבטלת' : '🚫 ביטול'}
                      </Btn>
                    )}
                  </span>
                </div>
              ))}
            </div>
          );
        })
      )}
      {redeeming && <RedeemModal assignment={a} component={redeeming} onClose={() => setRedeeming(null)} />}
      {editOpen && <AssignmentForm assignment={a} onClose={() => setEditOpen(false)} />}
    </div>
  );
}

export function AssignmentsTab() {
  const db = useApp((s) => s.db);
  const config = useApp((s) => s.config);
  const [selId, setSelId] = useState<string | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const term = termOf(config, 'entity.shopAssignment', 'שיוך');

  const selected = db.shopAssignments.find((a) => a.id === selId);
  if (selected) return <AssignmentCard assignment={selected} onBack={() => setSelId(null)} />;

  // קיבוץ לפי משפחה — סדר הופעה ראשון
  const groups: { famId: string; list: ShopAssignment[] }[] = [];
  for (const a of db.shopAssignments) {
    const g = groups.find((x) => x.famId === a.famId);
    if (g) g.list.push(a);
    else groups.push({ famId: a.famId, list: [a] });
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 10 }}>
        <Btn kind="primary" onClick={() => setFormOpen(true)}>
          ➕ הוספת {termOf(config, 'entity.shopAssignment', 'שיוך')}
        </Btn>
      </div>
      {db.shopAssignments.length === 0 ? (
        <Empty>עדיין אין {term}ים — הוסיפו עם "➕ הוספת {term}"</Empty>
      ) : (
        groups.map((g) => {
          const famName = db.families.find((x) => x.id === g.famId)?.name ?? 'לא ידועה';
          return (
            <div key={g.famId} style={{ marginBottom: 14 }}>
              <div style={{ fontWeight: 800, marginBottom: 6 }}>{termOf(config, 'entity.familyOf', 'משפחת') + ' ' + famName}</div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 10 }}>
                {g.list.map((a) => {
                  const product = db.shopProducts.find((p) => p.id === a.productId);
                  const total = product?.components.length ?? 0;
                  const doneCount = product ? product.components.filter((c) => assignmentRedeemed(a, c.id)).length : 0;
                  return (
                    <button
                      key={a.id}
                      type="button"
                      className="card"
                      onClick={() => setSelId(a.id)}
                      style={{ textAlign: 'right', cursor: 'pointer', display: 'flex', flexDirection: 'column', gap: 6 }}
                      title="פתיחת כרטיס השיוך"
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                        <span style={{ fontWeight: 800 }}>{product?.name ?? 'מוצר שנמחק'}</span>
                        <Chip on={a.status === 'active'}>{STATUS_LABEL[a.status]}</Chip>
                      </div>
                      <div style={{ fontSize: 12.5, color: 'var(--ink-faint)' }}>{beneficiaryLabel(db, a)}</div>
                      <div style={{ fontSize: 12.5 }}>
                        {'מומשו ' + doneCount + '/' + total + ' רכיבים'}
                        <div style={{ background: 'var(--line)', borderRadius: 6, height: 6, marginTop: 4 }}>
                          <div
                            style={{
                              width: (total ? Math.round((doneCount / total) * 100) : 0) + '%',
                              background: 'var(--brand)',
                              height: 6,
                              borderRadius: 6,
                            }}
                          />
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })
      )}
      {formOpen && <AssignmentForm assignment={null} onClose={() => setFormOpen(false)} />}
    </div>
  );
}
