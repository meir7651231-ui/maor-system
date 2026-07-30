/**
 * ➕ חידוש מלאי מהיר (חנות 13; עבר לפריט ב-SHOP4 — המלאי המשותף חי על
 * ShopItem, הכרעה 18) — מוסיף כמות חיובית למלאי הפריט דרך upsertShopItem.
 * פריט בלי מעקב — הזנת כמות מפעילה מעקב.
 */
import { useState } from 'react';
import { useApp } from '../../store/useApp';
import type { ShopItem } from '../../types/domain';
import { Btn, Field, FormError, Modal, TextInput } from '../ui';
import { itemRemaining } from './lib';

export function StockModal(props: { item: ShopItem; onClose: () => void }) {
  const db = useApp((s) => s.db);
  const upsertShopItem = useApp((s) => s.upsertShopItem);
  const toast = useApp((s) => s.toast);
  const it = props.item;
  const remaining = itemRemaining(db, it.id);

  const [amount, setAmount] = useState('');
  const [error, setError] = useState('');

  function save() {
    const n = Math.round(+amount);
    if (!amount.trim() || !Number.isFinite(n) || n <= 0) return setError('כמה להוסיף — מספר חיובי');
    const newStock = (it.stock ?? 0) + n;
    upsertShopItem({ ...it, stock: newStock });
    toast('המלאי עודכן — נותרו ' + ((remaining ?? 0) + n));
    props.onClose();
  }

  return (
    <Modal title={'➕ חידוש מלאי — ' + it.name} onClose={props.onClose}>
      <FormError error={error} />
      <div style={{ fontSize: 12.5, color: 'var(--ink-faint)', marginBottom: 10 }}>
        {remaining === null ? 'אין מעקב — הזנת כמות תפעיל מעקב מלאי לפריט' : 'נותרו ' + remaining + ' היום'}
      </div>
      <Field label="כמה להוסיף *">
        <TextInput value={amount} onChange={setAmount} type="number" dir="ltr" placeholder="2" />
      </Field>
      <div className="modal-actions">
        <Btn kind="primary" onClick={save}>עדכון המלאי</Btn>
        <Btn onClick={props.onClose}>ביטול</Btn>
      </div>
    </Modal>
  );
}
