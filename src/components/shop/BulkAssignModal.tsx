/**
 * 👥 שיוך המוני + 🎁 חלוקה המונית (SHOP6 חנות 26).
 * BulkAssignModal: חבילה → סינון קריטריונים → טבלת משפחות זכאיות (הכל-מסומן,
 * בן-משפחה אופציונלי פר-שורה) → bulkAssignShop אטומי (useArmed).
 * BulkRedeemModal: רכיב + תאריך (+חג למתנת-חג) → bulkRedeem — מדלג על מי
 * שכבר קיבל, paid=0 קבוע (בלי S-), **הכול-או-כלום על מחסור מלאי**.
 */
import { useMemo, useState } from 'react';
import { useApp } from '../../store/useApp';
import { featureOn, termOf } from '../../lib/config';
import { isoToday } from '../../lib/date-util';
import type { ShopProduct } from '../../types/domain';
import { Btn, Chip, Field, FormError, Modal, Select } from '../ui';
import { HebDateInput } from '../HebDateInput';
import { useArmed } from '../useArmed';
import { eligibleFamilies, holidayNames, itemOf } from './lib';

export function BulkAssignModal(props: { onClose: () => void }) {
  const db = useApp((s) => s.db);
  const config = useApp((s) => s.config);
  const bulkAssignShop = useApp((s) => s.bulkAssignShop);
  const toast = useApp((s) => s.toast);
  const { armed, confirmTwice } = useArmed(featureOn(config, 'shell.armdel'));
  const criteriaOn = featureOn(config, 'shop.criteria');
  const term = termOf(config, 'entity.shopProduct', 'מוצר');

  const [productId, setProductId] = useState(db.shopProducts.find((p) => p.active)?.id ?? '');
  const [criterionIds, setCriterionIds] = useState<string[]>([]);
  const [excluded, setExcluded] = useState<Set<string>>(new Set());
  const [memberOf, setMemberOf] = useState<Record<string, string>>({});
  const [error, setError] = useState('');

  const eligible = useMemo(
    () => (productId ? eligibleFamilies(db, criterionIds, productId) : []),
    [db, criterionIds, productId],
  );
  const chosen = eligible.filter((e) => !excluded.has(e.famId));

  function save() {
    if (!productId) return setError('בחרו ' + term);
    if (chosen.length === 0) return setError('לא נבחרו ' + termOf(config, 'nav.families', 'משפחות'));
    if (!confirmTwice('bulk-assign', 'לשייך ' + chosen.length + ' ' + termOf(config, 'nav.families', 'משפחות') + ' ל"' + (db.shopProducts.find((p) => p.id === productId)?.name ?? '') + '"?')) return;
    const res = bulkAssignShop(
      productId,
      chosen.map((e) => ({ famId: e.famId, memberId: memberOf[e.famId] ?? '', criterionIds })),
    );
    if (!res.ok) return;
    toast(res.created + ' שיוכים נוצרו');
    props.onClose();
  }

  return (
    <Modal title="👥 שיוך המוני" onClose={props.onClose} wide>
      <FormError error={error} />
      <div className="form-grid">
        <Field label={term + ' *'}>
          <Select
            value={productId}
            onChange={setProductId}
            options={[{ value: '', label: '— בחרו —' }, ...db.shopProducts.filter((p) => p.active).map((p) => ({ value: p.id, label: p.name }))]}
          />
        </Field>
      </div>
      {criteriaOn && db.shopCriteria.length > 0 && (
        <Field label={'סינון קריטריוני זכאות (ריק = כל ה' + termOf(config, 'nav.families', 'משפחות') + ')'}>
          <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
            {db.shopCriteria.map((c) => (
              <Chip
                key={c.id}
                on={criterionIds.includes(c.id)}
                onClick={() =>
                  setCriterionIds(criterionIds.includes(c.id) ? criterionIds.filter((x) => x !== c.id) : [...criterionIds, c.id])
                }
              >
                {c.name}
              </Chip>
            ))}
          </div>
        </Field>
      )}
      <div style={{ fontSize: 12.5, color: 'var(--ink-faint)', margin: '4px 0 8px' }}>
        {productId
          ? eligible.length + ' ' + termOf(config, 'nav.families', 'משפחות') + ' זכאיות (מי שכבר משויכת לחבילה — מסוננת, אין כפל)'
          : 'בחרו ' + term + ' כדי לראות את הזכאיות'}
      </div>
      <div style={{ maxHeight: 300, overflowY: 'auto' }}>
        {eligible.map((e) => {
          const fam = db.families.find((f) => f.id === e.famId);
          return (
            <div key={e.famId} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '4px 0', borderBottom: '1px solid var(--line)' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', flex: 1 }}>
                <input
                  type="checkbox"
                  checked={!excluded.has(e.famId)}
                  onChange={() =>
                    setExcluded((prev) => {
                      const next = new Set(prev);
                      if (next.has(e.famId)) next.delete(e.famId);
                      else next.add(e.famId);
                      return next;
                    })
                  }
                />
                <span style={{ fontWeight: 700, fontSize: 13 }}>{termOf(config, 'entity.familyOf', 'משפחת') + ' ' + e.name}</span>
              </label>
              {e.memberIds.length > 0 && (
                <Select
                  value={memberOf[e.famId] ?? ''}
                  onChange={(v) => setMemberOf({ ...memberOf, [e.famId]: v })}
                  options={[
                    { value: '', label: 'כל ה' + termOf(config, 'entity.family', 'משפחה') },
                    ...e.memberIds.map((mid) => ({ value: mid, label: fam?.members.find((m) => m.id === mid)?.first ?? mid })),
                  ]}
                />
              )}
            </div>
          );
        })}
      </div>
      <div className="modal-actions">
        <Btn kind="primary" onClick={save}>
          {armed === 'bulk-assign' ? 'בטוח/ה? שוב לשיוך' : 'שייך ' + chosen.length + ' ' + termOf(config, 'nav.families', 'משפחות')}
        </Btn>
        <Btn onClick={props.onClose}>ביטול</Btn>
      </div>
    </Modal>
  );
}

export function BulkRedeemModal(props: { product: ShopProduct; onClose: () => void }) {
  const db = useApp((s) => s.db);
  const bulkRedeem = useApp((s) => s.bulkRedeem);
  const toast = useApp((s) => s.toast);
  const [componentId, setComponentId] = useState(props.product.components[0]?.id ?? '');
  const [date, setDate] = useState(isoToday());
  const [holiday, setHoliday] = useState('');
  const [error, setError] = useState('');

  const comp = props.product.components.find((c) => c.id === componentId);
  const isHoliday = comp ? itemOf(db, comp).kind === 'holidayGift' : false;

  function save() {
    if (!comp) return setError('בחרו רכיב');
    if (isHoliday && !holiday) return setError('בחרו חג למתנת-החג');
    const res = bulkRedeem(props.product.id, componentId, { date, holiday: isHoliday ? holiday : '' });
    if (!res.ok) return; // ה-store הסביר בטוסט (כולל "חסרות K יחידות" — הכול-או-כלום)
    toast('חולק ל-' + res.created + ' מוטבים ✓');
    props.onClose();
  }

  return (
    <Modal title={'🎁 סימון חולק לכולם — ' + props.product.name} onClose={props.onClose}>
      <FormError error={error} />
      <div style={{ fontSize: 12.5, color: 'var(--ink-faint)', marginBottom: 8 }}>
        מימוש לכל שיוך פעיל שטרם קיבל (מי שקיבל — מדולג). חלוקה = מתנה, בלי
        תשלום ובלי אישור S-; גבייה פרטנית נשארת במימוש הבודד. מלאי חסר עוצר
        את הכול — אין חלוקה חלקית.
      </div>
      <Field label="רכיב *">
        <Select
          value={componentId}
          onChange={setComponentId}
          options={props.product.components.map((c) => ({ value: c.id, label: itemOf(db, c).name }))}
        />
      </Field>
      <Field label="תאריך">
        {/* UX סבב-ז׳: קלט דו-לוחי — חלוקה-המונית נקבעת לרוב לקראת חג עברי */}
        <HebDateInput value={date} onChange={setDate} />
      </Field>
      {isHoliday && (
        <Field label="חג *">
          <Select
            value={holiday}
            onChange={setHoliday}
            options={[{ value: '', label: '— בחרו חג —' }, ...holidayNames().map((h) => ({ value: h, label: h }))]}
          />
        </Field>
      )}
      <div className="modal-actions">
        <Btn kind="primary" onClick={save}>🎁 חלוקה לכולם</Btn>
        <Btn onClick={props.onClose}>ביטול</Btn>
      </div>
    </Modal>
  );
}
