/**
 * פאנל החנויות השותפות (חנות 4, מאחורי shop.stores) — מתקפל בתחתית
 * הקטלוג: רשימה + הוספה/עריכה/מחיקה (useArmed). מחיקת חנות מנקה את
 * ההצבעה בקופונים (storeId:'') — הרכיבים לא אובדים (הכרעה 5).
 */
import { useState } from 'react';
import { useApp } from '../../store/useApp';
import { featureOn, termOf } from '../../lib/config';
import type { ShopStore } from '../../types/domain';
import { Btn, Chip, Field, FormError, TextInput } from '../ui';
import { useArmed } from '../useArmed';

const EMPTY = { name: '', contact: '', phone: '', active: true, notes: '' };

export function StoresPanel() {
  const stores = useApp((s) => s.db.shopStores);
  const config = useApp((s) => s.config);
  const upsertShopStore = useApp((s) => s.upsertShopStore);
  const deleteShopStore = useApp((s) => s.deleteShopStore);
  const toast = useApp((s) => s.toast);
  const { armed, confirmTwice } = useArmed(featureOn(config, 'shell.armdel'));
  const term = termOf(config, 'entity.shopStore', 'חנות');

  const [open, setOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [f, setF] = useState(EMPTY);
  const [error, setError] = useState('');

  function startEdit(s: ShopStore) {
    setEditId(s.id);
    setF({ name: s.name, contact: s.contact, phone: s.phone, active: s.active, notes: s.notes });
  }
  function save() {
    if (!f.name.trim()) return setError('שם ה' + term + ' הוא שדה חובה');
    upsertShopStore({ id: editId ?? '', name: f.name.trim(), contact: f.contact.trim(), phone: f.phone.trim(), active: f.active, notes: f.notes.trim() });
    toast(editId ? 'ה' + term + ' עודכנה' : '"' + f.name.trim() + '" נוספה לרשימת השותפות');
    setEditId(null);
    setF(EMPTY);
    setError('');
  }
  function remove(s: ShopStore) {
    if (!confirmTwice('shs-' + s.id, 'למחוק את "' + s.name + '"? הקופונים יישארו בלי חנות')) return;
    deleteShopStore(s.id);
    toast('"' + s.name + '" הוסרה — הקופונים שהצביעו עליה נשארו ללא חנות');
  }

  return (
    <div className="card" style={{ marginTop: 14 }}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        style={{ background: 'none', border: 'none', cursor: 'pointer', fontWeight: 800, fontSize: 14, padding: 0 }}
        aria-expanded={open}
      >
        {(open ? '▼' : '◀') + ' 🏬 ' + term + 'ות שותפות (' + stores.length + ')'}
      </button>
      {open && (
        <div style={{ marginTop: 10 }}>
          {stores.map((s) => (
            <div key={s.id} style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', padding: '6px 0', borderBottom: '1px solid var(--line)' }}>
              <span style={{ fontWeight: 700 }}>{s.name}</span>
              <Chip on={s.active}>{s.active ? 'פעילה' : 'לא פעילה'}</Chip>
              <span style={{ fontSize: 12.5, color: 'var(--ink-faint)' }}>{[s.contact, s.phone].filter(Boolean).join(' · ')}</span>
              <span style={{ marginInlineStart: 'auto', display: 'flex', gap: 6 }}>
                <Btn sm onClick={() => startEdit(s)}>✏️</Btn>
                <Btn sm kind="danger" onClick={() => remove(s)}>{armed === 'shs-' + s.id ? 'שוב למחיקה' : '🗑'}</Btn>
              </span>
            </div>
          ))}
          <FormError error={error} />
          <div className="form-grid" style={{ marginTop: 10 }}>
            <Field label={'שם ה' + term + ' *'}>
              <TextInput value={f.name} onChange={(v) => setF({ ...f, name: v })} placeholder="ריהוט העיר" />
            </Field>
            <Field label="איש קשר">
              <TextInput value={f.contact} onChange={(v) => setF({ ...f, contact: v })} />
            </Field>
            <Field label="טלפון">
              <TextInput value={f.phone} onChange={(v) => setF({ ...f, phone: v })} dir="ltr" placeholder="050-0000000" />
            </Field>
          </div>
          <div style={{ display: 'flex', gap: 6 }}>
            <Btn sm kind="primary" onClick={save}>{editId ? 'עדכון' : '➕ הוספת ' + termOf(config, 'entity.shopStore', 'חנות')}</Btn>
            {editId && <Btn sm onClick={() => { setEditId(null); setF(EMPTY); }}>ביטול עריכה</Btn>}
          </div>
        </div>
      )}
    </div>
  );
}
