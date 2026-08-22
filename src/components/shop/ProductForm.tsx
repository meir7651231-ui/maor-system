/**
 * טופס חבילה (חנות 4; מודל הפריטים — SHOP4, הכרעה 18): שם חובה, תיאור,
 * פעיל + רכיבים כמצביעים לפריטי הקטלוג (select + "➕ פריט חדש" inline)
 * עם דריסות רשות לשווי/מחיר-סמלי פר-חבילה (ברירת ארכיטקט). המלאי/התוקף/
 * החנות חיים על הפריט. הכסף כאן הוא שווי/מחיר-סמלי בלבד — שום קשר
 * לקבלות/תרומות (הכרעת בעלים 30.7).
 */
import { useState } from 'react';
import { useApp } from '../../store/useApp';
import { featureOn, termOf } from '../../lib/config';
import type { ShopComponentKind, ShopProduct } from '../../types/domain';
import { Btn, Field, FormError, Modal, Select, TextInput } from '../ui';
import { PhotoField } from '../PhotoField';

const NEW_ITEM_KINDS: { value: ShopComponentKind; label: string }[] = [
  { value: 'meeting', label: '🤝 פגישת ליווי' },
  { value: 'coupon', label: '🎟 קופון לחנות שותפה' },
  { value: 'gift', label: '🎁 מתנה' },
  { value: 'holidayGift', label: '🕎 מתנת-חג (מחזורית)' },
];

interface CompDraft {
  id: string;
  itemId: string;
  /** דריסות רשות פר-חבילה — ריק = ברירת המחדל מהפריט. */
  value: string;
  basePrice: string;
  notes: string;
}

export function ProductForm(props: { product: ShopProduct | null; onClose: () => void }) {
  const db = useApp((s) => s.db);
  const config = useApp((s) => s.config);
  const upsertShopProduct = useApp((s) => s.upsertShopProduct);
  const upsertShopItem = useApp((s) => s.upsertShopItem);
  const nextId = useApp((s) => s.nextId);
  const toast = useApp((s) => s.toast);
  const p = props.product;
  const term = termOf(config, 'entity.shopProduct', 'מוצר');
  const itemTerm = termOf(config, 'entity.shopItem', 'פריט');

  const [f, setF] = useState({ name: p?.name ?? '', desc: p?.desc ?? '', active: p?.active ?? true, notes: p?.notes ?? '', img: p?.img ?? '' });
  const [comps, setComps] = useState<CompDraft[]>(
    (p?.components ?? []).map((c) => ({
      id: c.id,
      itemId: c.itemId,
      value: c.value === undefined ? '' : String(c.value),
      basePrice: c.basePrice === undefined ? '' : String(c.basePrice),
      notes: c.notes,
    })),
  );
  const [error, setError] = useState('');
  // ➕ פריט חדש inline — נשמר כ-ShopItem אמיתי ומקושר לרכיב
  const [newItemFor, setNewItemFor] = useState<number | null>(null);
  const [newItem, setNewItem] = useState({ name: '', kind: 'gift' as ShopComponentKind, value: '', basePrice: '' });

  function addComp() {
    // id ריק — ה-store מנפיק nextId('shpc') בשמירה
    setComps([...comps, { id: '', itemId: db.shopItems.find((i) => i.active)?.id ?? '', value: '', basePrice: '', notes: '' }]);
  }
  function setComp(i: number, patch: Partial<CompDraft>) {
    setComps(comps.map((c, j) => (j === i ? { ...c, ...patch } : c)));
  }
  function removeComp(i: number) {
    // תיקון (swarm-audit): הסרת רכיב שיש עליו מימושים ייתמה אותם בשקט — היחידות
    // חזרו למלאי (itemRemaining סופר רק רכיבים קיימים) והשורות נעלמו מכרטיס-השיוך
    // בלי אפשרות ביטול. חוסמים — כמו deleteShopProduct שחוסם על שיוכים פעילים.
    const comp = comps[i];
    if (
      comp?.id &&
      p &&
      db.shopAssignments.some((a) => a.productId === p.id && a.redemptions.some((r) => r.componentId === comp.id))
    ) {
      toast('לרכיב יש מימושים רשומים — לא ניתן להסירו; אפשר לבטל את המימושים בכרטיס ה' + termOf(config, 'entity.shopAssignment', 'שיוך') + ' או לסמן את ה' + itemTerm + ' לא-פעיל');
      return;
    }
    setComps(comps.filter((_, j) => j !== i));
  }

  function createItem(forIndex: number) {
    if (!newItem.name.trim()) return setError('שם ה' + itemTerm + ' החדש הוא שדה חובה');
    const value = newItem.value.trim() === '' ? 0 : +newItem.value;
    const basePrice = newItem.basePrice.trim() === '' ? 0 : +newItem.basePrice;
    if (!Number.isFinite(value) || value < 0 || !Number.isFinite(basePrice) || basePrice < 0)
      return setError('שווי ומחיר סמלי חייבים להיות מספרים אי-שליליים');
    const id = nextId('shi');
    upsertShopItem({
      id,
      name: newItem.name.trim(),
      kind: newItem.kind,
      storeId: '',
      value: Math.round(value),
      basePrice: Math.round(basePrice),
      active: true,
      notes: '',
    });
    setComps(comps.map((c, j) => (j === forIndex ? { ...c, itemId: id } : c)));
    setNewItemFor(null);
    setNewItem({ name: '', kind: 'gift', value: '', basePrice: '' });
    setError('');
    toast('"' + newItem.name.trim() + '" נוסף לקטלוג הפריטים וקושר');
  }

  function save() {
    if (!f.name.trim()) return setError('שם ה' + term + ' הוא שדה חובה');
    for (const c of comps) {
      if (!c.itemId) return setError('לכל רכיב נדרש ' + itemTerm + ' מהקטלוג');
      const value = c.value.trim() === '' ? undefined : +c.value;
      const basePrice = c.basePrice.trim() === '' ? undefined : +c.basePrice;
      if ((value !== undefined && (!Number.isFinite(value) || value < 0)) || (basePrice !== undefined && (!Number.isFinite(basePrice) || basePrice < 0)))
        return setError('דריסות שווי/מחיר חייבות להיות מספרים אי-שליליים (ריק = מהפריט)');
    }
    upsertShopProduct({
      id: p?.id ?? '',
      name: f.name.trim(),
      desc: f.desc.trim(),
      ...(f.img ? { img: f.img } : {}),
      active: f.active,
      notes: f.notes.trim(),
      components: comps.map((c) => {
        const item = db.shopItems.find((i) => i.id === c.itemId);
        return {
          id: c.id,
          itemId: c.itemId,
          // תמונת-מצב לתאימות (מקור האמת בפריט)
          kind: item?.kind ?? 'gift',
          label: item?.name ?? '',
          storeId: item?.storeId ?? '',
          ...(c.value.trim() === '' ? {} : { value: Math.round(+c.value) }),
          ...(c.basePrice.trim() === '' ? {} : { basePrice: Math.round(+c.basePrice) }),
          notes: c.notes.trim(),
        };
      }),
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
      {featureOn(config, 'shop.photo') && (
        <PhotoField label={'תמונת ה' + term} value={f.img || undefined} onChange={(img) => setF({ ...f, img: img ?? '' })} />
      )}

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', margin: '10px 0 6px' }}>
        <b>רכיבי ה{term} — {itemTerm}ים מהקטלוג</b>
        <Btn sm onClick={addComp}>➕ רכיב</Btn>
      </div>
      {comps.length === 0 && <div style={{ fontSize: 12.5, color: 'var(--ink-faint)', marginBottom: 8 }}>עדיין אין רכיבים — "➕ רכיב" משבץ {itemTerm} מהקטלוג</div>}
      {comps.map((c, i) => {
        const item = db.shopItems.find((x) => x.id === c.itemId);
        return (
          <div key={i} style={{ border: '1px solid var(--line)', borderRadius: 10, padding: '10px 12px', marginBottom: 8 }}>
            <div className="form-grid">
              <Field label={itemTerm + ' *'}>
                <Select
                  value={c.itemId}
                  onChange={(v) => setComp(i, { itemId: v })}
                  options={[
                    { value: '', label: '— בחירה —' },
                    ...db.shopItems.map((x) => ({ value: x.id, label: x.name + (x.active ? '' : ' (לא פעיל)') })),
                  ]}
                />
              </Field>
              <Field label={'דריסת שווי (ריק = ' + (item ? item.value.toLocaleString('he-IL') + ' ₪' : 'מהפריט') + ')'}>
                <TextInput value={c.value} onChange={(v) => setComp(i, { value: v })} type="number" dir="ltr" />
              </Field>
              <Field label={'דריסת מחיר סמלי (ריק = ' + (item ? item.basePrice.toLocaleString('he-IL') + ' ₪' : 'מהפריט') + ')'}>
                <TextInput value={c.basePrice} onChange={(v) => setComp(i, { basePrice: v })} type="number" dir="ltr" />
              </Field>
              <Field label="הערות">
                <TextInput value={c.notes} onChange={(v) => setComp(i, { notes: v })} />
              </Field>
            </div>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              <Btn sm onClick={() => setNewItemFor(newItemFor === i ? null : i)}>➕ {itemTerm} חדש</Btn>
              <Btn sm kind="danger" onClick={() => removeComp(i)}>🗑 הסרת הרכיב</Btn>
            </div>
            {newItemFor === i && (
              <div style={{ border: '1px solid var(--line)', borderRadius: 10, padding: '10px 12px', marginTop: 8 }}>
                <div className="form-grid">
                  <Field label={'שם ה' + itemTerm + ' *'}>
                    <TextInput value={newItem.name} onChange={(v) => setNewItem({ ...newItem, name: v })} placeholder="סט תפילין" />
                  </Field>
                  <Field label="סוג">
                    <Select value={newItem.kind} onChange={(v) => setNewItem({ ...newItem, kind: v as ShopComponentKind })} options={NEW_ITEM_KINDS} />
                  </Field>
                  <Field label='שווי (ש"ח)'>
                    <TextInput value={newItem.value} onChange={(v) => setNewItem({ ...newItem, value: v })} type="number" dir="ltr" placeholder="200" />
                  </Field>
                  <Field label='מחיר סמלי (ש"ח)'>
                    <TextInput value={newItem.basePrice} onChange={(v) => setNewItem({ ...newItem, basePrice: v })} type="number" dir="ltr" placeholder="50" />
                  </Field>
                </div>
                <Btn sm kind="primary" onClick={() => createItem(i)}>יצירה וקישור</Btn>
              </div>
            )}
          </div>
        );
      })}

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
