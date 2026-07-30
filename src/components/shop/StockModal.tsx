/**
 * ➕ חידוש מלאי מהיר (חנות 13, הכרעת בעלים 13) — מיני-מודאל מהקטלוג:
 * מוסיף כמות חיובית למלאי הרכיב דרך upsertShopProduct. רכיב בלי מעקב —
 * הזנת כמות מפעילה מעקב (stock מתחיל מהכמות שהוזנה).
 */
import { useState } from 'react';
import { useApp } from '../../store/useApp';
import type { ShopComponent, ShopProduct } from '../../types/domain';
import { Btn, Field, FormError, Modal, TextInput } from '../ui';
import { componentRemaining } from './lib';

export function StockModal(props: { product: ShopProduct; component: ShopComponent; onClose: () => void }) {
  const assignments = useApp((s) => s.db.shopAssignments);
  const upsertShopProduct = useApp((s) => s.upsertShopProduct);
  const toast = useApp((s) => s.toast);
  const p = props.product;
  const c = props.component;
  const remaining = componentRemaining(c.id, p.id, assignments, c.stock);

  const [amount, setAmount] = useState('');
  const [error, setError] = useState('');

  function save() {
    const n = Math.round(+amount);
    if (!amount.trim() || !Number.isFinite(n) || n <= 0) return setError('כמה להוסיף — מספר חיובי');
    const newStock = (c.stock ?? 0) + n;
    upsertShopProduct({
      ...p,
      components: p.components.map((x) => (x.id === c.id ? { ...x, stock: newStock } : x)),
    });
    const newRemaining = componentRemaining(c.id, p.id, assignments, newStock) ?? newStock;
    toast('המלאי עודכן — נותרו ' + newRemaining);
    props.onClose();
  }

  return (
    <Modal title={'➕ חידוש מלאי — ' + c.label} onClose={props.onClose}>
      <FormError error={error} />
      <div style={{ fontSize: 12.5, color: 'var(--ink-faint)', marginBottom: 10 }}>
        {remaining === null ? 'אין מעקב — הזנת כמות תפעיל מעקב מלאי לרכיב' : 'נותרו ' + remaining + ' היום'}
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
