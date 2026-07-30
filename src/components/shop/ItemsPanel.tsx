/**
 * פאנל פריטי הקטלוג (SHOP4, הכרעה 18) — הפריט הוא בעל המלאי/התוקף/החנות,
 * משותף בין חבילות. רשימה + הוספה/עריכה/מחיקה (useArmed) + חידוש מלאי
 * (StockModal). מחיקה חסומה כשהפריט משובץ בחבילה.
 */
import { useState } from 'react';
import { useApp } from '../../store/useApp';
import { featureOn, termOf } from '../../lib/config';
import type { ShopComponentKind, ShopItem } from '../../types/domain';
import { Btn, Chip, Field, FormError, Select, TextInput } from '../ui';
import { useArmed } from '../useArmed';
import { itemRemaining } from './lib';
import { StockModal } from './StockModal';

const KIND_OPTIONS: { value: ShopComponentKind; label: string }[] = [
  { value: 'meeting', label: '🤝 פגישת ליווי' },
  { value: 'coupon', label: '🎟 קופון לחנות שותפה' },
  { value: 'gift', label: '🎁 מתנה' },
  { value: 'holidayGift', label: '🕎 מתנת-חג (מחזורית)' },
];

const EMPTY = { name: '', kind: 'gift' as ShopComponentKind, storeId: '', value: '', basePrice: '', stock: '', validDays: '', active: true, notes: '' };

export function ItemsPanel() {
  const db = useApp((s) => s.db);
  const config = useApp((s) => s.config);
  const upsertShopItem = useApp((s) => s.upsertShopItem);
  const deleteShopItem = useApp((s) => s.deleteShopItem);
  const toast = useApp((s) => s.toast);
  const { armed, confirmTwice } = useArmed(featureOn(config, 'shell.armdel'));
  const storesOn = featureOn(config, 'shop.stores');
  const term = termOf(config, 'entity.shopItem', 'פריט');

  const [open, setOpen] = useState(true);
  const [editId, setEditId] = useState<string | null>(null);
  const [f, setF] = useState(EMPTY);
  const [error, setError] = useState('');
  const [stockFor, setStockFor] = useState<ShopItem | null>(null);

  function startEdit(i: ShopItem) {
    setEditId(i.id);
    setF({
      name: i.name,
      kind: i.kind,
      storeId: i.storeId,
      value: i.value ? String(i.value) : '',
      basePrice: i.basePrice ? String(i.basePrice) : '',
      stock: i.stock === undefined ? '' : String(i.stock),
      validDays: i.validDays === undefined ? '' : String(i.validDays),
      active: i.active,
      notes: i.notes,
    });
  }

  function save() {
    if (!f.name.trim()) return setError('שם ה' + term + ' הוא שדה חובה');
    const value = f.value.trim() === '' ? 0 : +f.value;
    const basePrice = f.basePrice.trim() === '' ? 0 : +f.basePrice;
    if (!Number.isFinite(value) || value < 0 || !Number.isFinite(basePrice) || basePrice < 0)
      return setError('שווי ומחיר סמלי חייבים להיות מספרים אי-שליליים');
    if (f.stock.trim() !== '' && (!Number.isFinite(+f.stock) || +f.stock < 0))
      return setError('מלאי חייב להיות מספר אי-שלילי (ריק = ללא מעקב)');
    if (f.validDays.trim() !== '' && (!Number.isFinite(+f.validDays) || +f.validDays < 0))
      return setError('ימי תוקף חייבים להיות מספר אי-שלילי (ריק = ללא תוקף)');
    upsertShopItem({
      id: editId ?? '',
      name: f.name.trim(),
      kind: f.kind,
      storeId: f.kind === 'coupon' ? f.storeId : '',
      value: Math.round(value),
      basePrice: Math.round(basePrice),
      ...(f.stock.trim() === '' ? {} : { stock: Math.max(0, Math.round(+f.stock)) }),
      ...(f.kind === 'coupon' && f.validDays.trim() !== '' ? { validDays: Math.max(0, Math.round(+f.validDays)) } : {}),
      active: f.active,
      notes: f.notes.trim(),
    });
    toast(editId ? 'ה' + term + ' עודכן' : '"' + f.name.trim() + '" נוסף לקטלוג הפריטים');
    setEditId(null);
    setF(EMPTY);
    setError('');
  }

  function remove(i: ShopItem) {
    if (!confirmTwice('shi-' + i.id, 'למחוק את "' + i.name + '" מקטלוג הפריטים?')) return;
    if (deleteShopItem(i.id)) toast('"' + i.name + '" הוסר מקטלוג הפריטים');
  }

  return (
    <div className="card" style={{ marginTop: 14 }}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        style={{ background: 'none', border: 'none', cursor: 'pointer', fontWeight: 800, fontSize: 14, padding: 0 }}
        aria-expanded={open}
      >
        {(open ? '▼' : '◀') + ' 📦 ' + term + 'ים (' + db.shopItems.length + ')'}
      </button>
      {open && (
        <div style={{ marginTop: 10 }}>
          {db.shopItems.map((i) => {
            const rem = itemRemaining(db, i.id);
            const kindLabel = KIND_OPTIONS.find((k) => k.value === i.kind)?.label ?? i.kind;
            return (
              <div key={i.id} style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', padding: '6px 0', borderBottom: '1px solid var(--line)' }}>
                <span style={{ fontWeight: 700 }}>{i.name}</span>
                <span style={{ fontSize: 12 }}>{kindLabel}</span>
                <Chip on={i.active}>{i.active ? 'פעיל' : 'לא פעיל'}</Chip>
                <span style={{ fontSize: 12.5, color: 'var(--ink-faint)' }}>
                  {'שווי ' + i.value.toLocaleString('he-IL') + ' ₪ · סמלי ' + i.basePrice.toLocaleString('he-IL') + ' ₪'}
                </span>
                {rem !== null && (
                  <span style={{ fontSize: 11, fontWeight: 700, color: rem === 0 ? '#b91c1c' : rem <= 2 ? '#9a6414' : 'var(--green)', border: '1px solid var(--line)', borderRadius: 99, padding: '1px 7px' }}>
                    {'נותרו ' + rem}
                  </span>
                )}
                <span style={{ marginInlineStart: 'auto', display: 'flex', gap: 6 }}>
                  <Btn sm onClick={() => setStockFor(i)} title="חידוש מלאי">➕ מלאי</Btn>
                  <Btn sm onClick={() => startEdit(i)}>✏️</Btn>
                  <Btn sm kind="danger" onClick={() => remove(i)}>{armed === 'shi-' + i.id ? 'שוב למחיקה' : '🗑'}</Btn>
                </span>
              </div>
            );
          })}
          <FormError error={error} />
          <div className="form-grid" style={{ marginTop: 10 }}>
            <Field label={'שם ה' + term + ' *'}>
              <TextInput value={f.name} onChange={(v) => setF({ ...f, name: v })} placeholder="סט תפילין" />
            </Field>
            <Field label="סוג">
              <Select value={f.kind} onChange={(v) => setF({ ...f, kind: v as ShopComponentKind })} options={KIND_OPTIONS} />
            </Field>
            <Field label='שווי (ש"ח)'>
              <TextInput value={f.value} onChange={(v) => setF({ ...f, value: v })} type="number" dir="ltr" placeholder="200" />
            </Field>
            <Field label='מחיר סמלי (ש"ח)'>
              <TextInput value={f.basePrice} onChange={(v) => setF({ ...f, basePrice: v })} type="number" dir="ltr" placeholder="50" />
            </Field>
            <Field label="מלאי (ריק = ללא מעקב)">
              <TextInput value={f.stock} onChange={(v) => setF({ ...f, stock: v })} type="number" dir="ltr" placeholder="3" />
            </Field>
            {f.kind === 'coupon' && (
              <Field label="ימי תוקף (ריק = ללא תוקף)">
                <TextInput value={f.validDays} onChange={(v) => setF({ ...f, validDays: v })} type="number" dir="ltr" placeholder="90" />
              </Field>
            )}
            {f.kind === 'coupon' && storesOn && (
              <Field label={termOf(config, 'entity.shopStore', 'חנות') + ' שותפה'}>
                <Select
                  value={f.storeId}
                  onChange={(v) => setF({ ...f, storeId: v })}
                  options={[{ value: '', label: 'ללא' }, ...db.shopStores.filter((s) => s.active).map((s) => ({ value: s.id, label: s.name }))]}
                />
              </Field>
            )}
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
          <div style={{ display: 'flex', gap: 6 }}>
            <Btn sm kind="primary" onClick={save}>{editId ? 'עדכון' : '➕ הוספת ' + termOf(config, 'entity.shopItem', 'פריט')}</Btn>
            {editId && <Btn sm onClick={() => { setEditId(null); setF(EMPTY); }}>ביטול עריכה</Btn>}
          </div>
        </div>
      )}
      {stockFor && <StockModal item={stockFor} onClose={() => setStockFor(null)} />}
    </div>
  );
}
