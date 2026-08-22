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
import { filterItems, holidayNames, itemRemaining } from './lib';
import { StockModal } from './StockModal';

const KIND_OPTIONS: { value: ShopComponentKind; label: string }[] = [
  { value: 'meeting', label: '🤝 פגישת ליווי' },
  { value: 'coupon', label: '🎟 קופון לחנות שותפה' },
  { value: 'gift', label: '🎁 מתנה' },
  { value: 'holidayGift', label: '🕎 מתנת-חג (מחזורית)' },
];

const EMPTY = { name: '', kind: 'gift' as ShopComponentKind, storeId: '', value: '', basePrice: '', stock: '', minStock: '', validDays: '', holidays: [] as string[], active: true, notes: '' };

export function ItemsPanel() {
  const db = useApp((s) => s.db);
  const config = useApp((s) => s.config);
  const upsertShopItem = useApp((s) => s.upsertShopItem);
  const deleteShopItem = useApp((s) => s.deleteShopItem);
  const mergeShopItems = useApp((s) => s.mergeShopItems);
  const removeShopWait = useApp((s) => s.removeShopWait);
  const toast = useApp((s) => s.toast);
  const { armed, confirmTwice } = useArmed(featureOn(config, 'shell.armdel'));
  const storesOn = featureOn(config, 'shop.stores');
  const term = termOf(config, 'entity.shopItem', 'פריט');

  const [open, setOpen] = useState(true);
  const [editId, setEditId] = useState<string | null>(null);
  const [f, setF] = useState(EMPTY);
  const [error, setError] = useState('');
  const [stockFor, setStockFor] = useState<ShopItem | null>(null);
  // מיזוג פריטים כפולים (הכרעה 21) — מקור נבחר + יעד מאותו סוג
  const [mergeFrom, setMergeFrom] = useState<ShopItem | null>(null);
  const [mergeTarget, setMergeTarget] = useState('');
  // חיפוש + צ'יפי מצב-מלאי (UX סינון 2) — filterItems הטהור
  const [itemQ, setItemQ] = useState('');
  const [stockState, setStockState] = useState<'' | 'out' | 'low' | 'untracked'>('');

  function startEdit(i: ShopItem) {
    setEditId(i.id);
    setF({
      name: i.name,
      kind: i.kind,
      storeId: i.storeId,
      value: i.value ? String(i.value) : '',
      basePrice: i.basePrice ? String(i.basePrice) : '',
      stock: i.stock === undefined ? '' : String(i.stock),
      minStock: i.minStock === undefined ? '' : String(i.minStock),
      validDays: i.validDays === undefined ? '' : String(i.validDays),
      holidays: i.holidays ?? [],
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
    if (f.minStock.trim() !== '' && (!Number.isFinite(+f.minStock) || +f.minStock < 0))
      return setError('מלאי מינימום חייב להיות מספר אי-שלילי (ריק = בלי התרעה)');
    if (f.validDays.trim() !== '' && (!Number.isFinite(+f.validDays) || +f.validDays < 0))
      return setError('ימי תוקף חייבים להיות מספר אי-שלילי (ריק = ללא תוקף)');
    // תיקון (swarm-audit): ה-upsert מחליף את הרשומה כולה — בנייה מאפס מחקה בשקט
    // שדות שאינם בטופס (waits — רשימת ההמתנה נמחקה בכל שינוי-שם!). הרשומה נבנית
    // {...existing, ...שדות-הטופס}; שדות-רשות שרוקנו בטופס נמחקים במפורש (כמו קודם).
    const existing = editId ? db.shopItems.find((x) => x.id === editId) : undefined;
    const saved: ShopItem = {
      ...(existing as ShopItem | undefined),
      id: editId ?? '',
      name: f.name.trim(),
      kind: f.kind,
      storeId: f.kind === 'coupon' ? f.storeId : '',
      value: Math.round(value),
      basePrice: Math.round(basePrice),
      active: f.active,
      notes: f.notes.trim(),
    };
    if (f.stock.trim() === '') delete saved.stock;
    else saved.stock = Math.max(0, Math.round(+f.stock));
    // מלאי מינימום (SHOP6) — מתחתיו נדלקת התרעת "להצטייד" (restock)
    if (f.minStock.trim() === '') delete saved.minStock;
    else saved.minStock = Math.max(0, Math.round(+f.minStock));
    if (f.kind === 'coupon' && f.validDays.trim() !== '') saved.validDays = Math.max(0, Math.round(+f.validDays));
    else delete saved.validDays;
    // חגים נבחרים (הכרעה 17) — ריק = כל החגים (לא נשמר)
    if (f.kind === 'holidayGift' && f.holidays.length > 0) saved.holidays = f.holidays;
    else delete saved.holidays;
    upsertShopItem(saved);
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
          {featureOn(config, 'shop.stockfilter') && (
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center', marginBottom: 8 }}>
              <TextInput value={itemQ} onChange={setItemQ} placeholder={'🔍 חיפוש ' + term} />
              {(
                [
                  ['out', '🔴 אזל'],
                  ['low', '🟠 נמוך'],
                  ['untracked', '⚪ ללא מעקב'],
                ] as const
              ).map(([key, label]) => (
                <Chip key={key} on={stockState === key} onClick={() => setStockState(stockState === key ? '' : key)}>
                  {label}
                </Chip>
              ))}
            </div>
          )}
          {filterItems(db, itemQ, stockState).map((i) => {
            const rem = itemRemaining(db, i.id);
            const kindLabel = KIND_OPTIONS.find((k) => k.value === i.kind)?.label ?? i.kind;
            const waits = i.waits ?? [];
            return (
              <div key={i.id} style={{ padding: '6px 0', borderBottom: '1px solid var(--line)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
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
                  {featureOn(config, 'shop.stock') && <Btn sm onClick={() => setStockFor(i)} title="חידוש מלאי">➕ מלאי</Btn>}
                  {featureOn(config, 'shop.merge') && (
                    <Btn sm onClick={() => { setMergeFrom(mergeFrom?.id === i.id ? null : i); setMergeTarget(''); }} title="מיזוג פריט כפול לתוך פריט אחר">
                      ⇄ מיזוג לתוך…
                    </Btn>
                  )}
                  <Btn sm onClick={() => startEdit(i)}>✏️</Btn>
                  <Btn sm kind="danger" onClick={() => remove(i)}>{armed === 'shi-' + i.id ? 'שוב למחיקה' : '🗑'}</Btn>
                </span>
              </div>
              {/* רשימת ההמתנה של הפריט (SHOP6 חנות 27) — שם, תאריך, הסרה */}
              {featureOn(config, 'shop.waitlist') && waits.length > 0 && (
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center', marginTop: 4, fontSize: 12 }}>
                  <span style={{ fontWeight: 700, color: '#9a6414' }}>{'⏳ ' + waits.length + ' ממתינים:'}</span>
                  {waits.map((w) => {
                    const wf = db.families.find((f) => f.id === w.famId);
                    return (
                      <span key={w.famId} style={{ display: 'inline-flex', alignItems: 'center', gap: 4, border: '1px solid var(--line)', borderRadius: 99, padding: '1px 4px 1px 8px' }}>
                        {(wf ? termOf(config, 'entity.familyOf', 'משפחת') + ' ' + wf.name : w.famId) + ' · ' + w.date}
                        <button
                          type="button"
                          title="הסרה מרשימת ההמתנה"
                          onClick={() => { removeShopWait(i.id, w.famId); toast('הוסרה מרשימת ההמתנה'); }}
                          style={{ border: 'none', background: 'var(--line)', borderRadius: 99, width: 16, height: 16, lineHeight: '14px', fontSize: 11, cursor: 'pointer', padding: 0 }}
                        >
                          ×
                        </button>
                      </span>
                    );
                  })}
                </div>
              )}
              </div>
            );
          })}
          {mergeFrom && (
            <div style={{ border: '1px solid var(--line)', borderRadius: 10, padding: '10px 12px', margin: '10px 0' }}>
              <div style={{ fontSize: 12.5, fontWeight: 700, marginBottom: 6 }}>
                {'⇄ מיזוג "' + mergeFrom.name + '" לתוך… (אותו סוג בלבד; המלאי מתחבר, המימושים נשמרים)'}
              </div>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
                <Select
                  value={mergeTarget}
                  onChange={setMergeTarget}
                  options={[
                    { value: '', label: '— בחרו פריט יעד —' },
                    ...db.shopItems
                      .filter((x) => x.id !== mergeFrom.id && x.kind === mergeFrom.kind)
                      .map((x) => ({ value: x.id, label: x.name })),
                  ]}
                />
                <Btn
                  sm
                  kind="danger"
                  onClick={() => {
                    if (!mergeTarget) return;
                    if (!confirmTwice('merge-' + mergeFrom.id, 'למזג את "' + mergeFrom.name + '"? הפעולה אינה הפיכה')) return;
                    if (mergeShopItems(mergeTarget, mergeFrom.id)) {
                      const rem = itemRemaining(useApp.getState().db, mergeTarget);
                      toast('מוזג — ' + (rem === null ? 'ללא מעקב מלאי' : 'הנותר ' + rem));
                      setMergeFrom(null);
                      setMergeTarget('');
                    }
                  }}
                >
                  {armed === 'merge-' + mergeFrom.id ? 'בטוח/ה? שוב ממזגת' : '⇄ מיזוג'}
                </Btn>
                <Btn sm onClick={() => { setMergeFrom(null); setMergeTarget(''); }}>ביטול</Btn>
              </div>
            </div>
          )}
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
            <Field label="מלאי מינימום (ריק = בלי התרעה)">
              <TextInput value={f.minStock} onChange={(v) => setF({ ...f, minStock: v })} type="number" dir="ltr" placeholder="2" />
            </Field>
            {f.kind === 'coupon' && (
              <Field label="ימי תוקף (ריק = ללא תוקף)">
                <TextInput value={f.validDays} onChange={(v) => setF({ ...f, validDays: v })} type="number" dir="ltr" placeholder="90" />
              </Field>
            )}
            {f.kind === 'holidayGift' && (
              <div style={{ gridColumn: '1 / -1' }}>
                <Field label="חגים נבחרים (ריק = כל החגים)">
                  <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                    {holidayNames().map((h) => (
                      <Chip
                        key={h}
                        on={f.holidays.includes(h)}
                        onClick={() =>
                          setF({
                            ...f,
                            holidays: f.holidays.includes(h) ? f.holidays.filter((x) => x !== h) : [...f.holidays, h],
                          })
                        }
                      >
                        {h}
                      </Chip>
                    ))}
                  </div>
                </Field>
              </div>
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
