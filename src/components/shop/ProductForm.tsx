/**
 * טופס מוצר (חנות 4) — שם חובה, תיאור, פעיל + עורך רכיבים: לכל רכיב סוג
 * (פגישה/קופון/מתנה/מתנת-חג), תווית, שווי, מחיר סמלי, חנות שותפה (לקופון
 * בלבד, מאחורי shop.stores) והערות. הכסף כאן הוא שווי/מחיר-סמלי בלבד —
 * שום קשר לקבלות/תרומות (הכרעת בעלים 30.7).
 */
import { useState } from 'react';
import { useApp } from '../../store/useApp';
import { featureOn, termOf } from '../../lib/config';
import type { ShopComponentKind, ShopProduct } from '../../types/domain';
import { Btn, Field, FormError, Modal, Select, TextInput } from '../ui';

const KIND_OPTIONS: { value: ShopComponentKind; label: string }[] = [
  { value: 'meeting', label: '🤝 פגישת ליווי' },
  { value: 'coupon', label: '🎟 קופון לחנות שותפה' },
  { value: 'gift', label: '🎁 מתנה' },
  { value: 'holidayGift', label: '🕎 מתנת-חג (מחזורית)' },
];

interface CompDraft {
  id: string;
  kind: ShopComponentKind;
  label: string;
  storeId: string;
  value: string;
  basePrice: string;
  notes: string;
}

export function ProductForm(props: { product: ShopProduct | null; onClose: () => void }) {
  const config = useApp((s) => s.config);
  const stores = useApp((s) => s.db.shopStores);
  const upsertShopProduct = useApp((s) => s.upsertShopProduct);
  const toast = useApp((s) => s.toast);
  const storesOn = featureOn(config, 'shop.stores');
  const p = props.product;
  const term = termOf(config, 'entity.shopProduct', 'מוצר');

  const [f, setF] = useState({ name: p?.name ?? '', desc: p?.desc ?? '', active: p?.active ?? true, notes: p?.notes ?? '' });
  const [comps, setComps] = useState<CompDraft[]>(
    (p?.components ?? []).map((c) => ({
      id: c.id,
      kind: c.kind,
      label: c.label,
      storeId: c.storeId,
      value: c.value ? String(c.value) : '',
      basePrice: c.basePrice ? String(c.basePrice) : '',
      notes: c.notes,
    })),
  );
  const [error, setError] = useState('');

  function addComp() {
    // id ריק — ה-store מנפיק nextId('shpc') בשמירה
    setComps([...comps, { id: '', kind: 'gift', label: '', storeId: '', value: '', basePrice: '', notes: '' }]);
  }
  function setComp(i: number, patch: Partial<CompDraft>) {
    setComps(comps.map((c, j) => (j === i ? { ...c, ...patch } : c)));
  }
  function removeComp(i: number) {
    setComps(comps.filter((_, j) => j !== i));
  }

  function save() {
    if (!f.name.trim()) return setError('שם ה' + term + ' הוא שדה חובה');
    for (const c of comps) {
      if (!c.label.trim()) return setError('לכל רכיב נדרשת תווית');
      const value = c.value.trim() === '' ? 0 : +c.value;
      const basePrice = c.basePrice.trim() === '' ? 0 : +c.basePrice;
      if (!Number.isFinite(value) || value < 0 || !Number.isFinite(basePrice) || basePrice < 0)
        return setError('שווי ומחיר סמלי חייבים להיות מספרים אי-שליליים');
    }
    upsertShopProduct({
      id: p?.id ?? '',
      name: f.name.trim(),
      desc: f.desc.trim(),
      ...(p?.img ? { img: p.img } : {}),
      active: f.active,
      notes: f.notes.trim(),
      components: comps.map((c) => ({
        id: c.id,
        kind: c.kind,
        label: c.label.trim(),
        storeId: c.kind === 'coupon' ? c.storeId : '',
        value: c.value.trim() === '' ? 0 : Math.round(+c.value),
        basePrice: c.basePrice.trim() === '' ? 0 : Math.round(+c.basePrice),
        notes: c.notes.trim(),
      })),
    });
    toast(p ? 'ה' + term + ' עודכן' : '"' + f.name.trim() + '" — ' + term + ' חדש בקטלוג');
    props.onClose();
  }

  return (
    <Modal title={(p ? 'עריכת ' : '➕ הוספת ') + term} onClose={props.onClose} wide>
      <FormError error={error} />
      <div className="form-grid">
        <Field label="שם *">
          <TextInput value={f.name} onChange={(v) => setF({ ...f, name: v })} placeholder='לדוגמה: מוצר חתן' />
        </Field>
        <Field label="פעיל">
          <Select
            value={f.active ? '1' : '0'}
            onChange={(v) => setF({ ...f, active: v === '1' })}
            options={[
              { value: '1', label: 'פעיל' },
              { value: '0', label: 'לא פעיל' },
            ]}
          />
        </Field>
      </div>
      <Field label="תיאור">
        <TextInput value={f.desc} onChange={(v) => setF({ ...f, desc: v })} placeholder="חבילת ליווי מלאה לחתן בר-מצווה" />
      </Field>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', margin: '10px 0 6px' }}>
        <b>רכיבי ה{term}</b>
        <Btn sm onClick={addComp}>➕ רכיב</Btn>
      </div>
      {comps.length === 0 && <div style={{ fontSize: 12.5, color: 'var(--ink-faint)', marginBottom: 8 }}>עדיין אין רכיבים — "➕ רכיב" מוסיף פגישה/קופון/מתנה/מתנת-חג</div>}
      {comps.map((c, i) => (
        <div key={i} style={{ border: '1px solid var(--line)', borderRadius: 10, padding: '10px 12px', marginBottom: 8 }}>
          <div className="form-grid">
            <Field label="סוג">
              <Select value={c.kind} onChange={(v) => setComp(i, { kind: v as ShopComponentKind })} options={KIND_OPTIONS} />
            </Field>
            <Field label="תווית *">
              <TextInput value={c.label} onChange={(v) => setComp(i, { label: v })} placeholder='לדוגמה: סט תפילין' />
            </Field>
            <Field label='שווי (ש"ח)'>
              <TextInput value={c.value} onChange={(v) => setComp(i, { value: v })} type="number" dir="ltr" placeholder="200" />
            </Field>
            <Field label='מחיר סמלי (ש"ח)'>
              <TextInput value={c.basePrice} onChange={(v) => setComp(i, { basePrice: v })} type="number" dir="ltr" placeholder="50" />
            </Field>
            {c.kind === 'coupon' && storesOn && (
              <Field label={termOf(config, 'entity.shopStore', 'חנות') + ' שותפה'}>
                <Select
                  value={c.storeId}
                  onChange={(v) => setComp(i, { storeId: v })}
                  options={[{ value: '', label: 'ללא' }, ...stores.filter((s) => s.active).map((s) => ({ value: s.id, label: s.name }))]}
                />
              </Field>
            )}
            <Field label="הערות">
              <TextInput value={c.notes} onChange={(v) => setComp(i, { notes: v })} />
            </Field>
          </div>
          <Btn sm kind="danger" onClick={() => removeComp(i)}>🗑 הסרת הרכיב</Btn>
        </div>
      ))}

      <Field label="הערות">
        <textarea rows={2} value={f.notes} onChange={(e) => setF({ ...f, notes: e.target.value })} />
      </Field>
      <div className="modal-actions">
        <Btn kind="primary" onClick={save}>שמירה</Btn>
        <Btn onClick={props.onClose}>ביטול</Btn>
      </div>
    </Modal>
  );
}
