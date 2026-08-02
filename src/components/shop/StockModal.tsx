/**
 * ➕ חידוש מלאי מהיר (חנות 13; עבר לפריט ב-SHOP4 — המלאי המשותף חי על
 * ShopItem, הכרעה 18). מאז SHOP6 (חנות 25) כל חידוש נרשם כ**קליטה**
 * (addShopIntake — קנייה/תרומה-בעין, ברירת 'buy'): הרשומה ביומן-הקליטות
 * והעלאת המלאי אטומיות באותו setDb. source חופשי — בלי קישור לתורמים (בידוד).
 */
import { useState } from 'react';
import { useApp } from '../../store/useApp';
import { isoToday } from '../../lib/date-util';
import type { ShopIntake, ShopItem } from '../../types/domain';
import { Btn, Field, FormError, Modal, Select, TextInput } from '../ui';
import { itemRemaining } from './lib';

export function StockModal(props: { item: ShopItem; onClose: () => void }) {
  const db = useApp((s) => s.db);
  const addShopIntake = useApp((s) => s.addShopIntake);
  const toast = useApp((s) => s.toast);
  const it = props.item;
  const remaining = itemRemaining(db, it.id);

  const [amount, setAmount] = useState('');
  const [kind, setKind] = useState<ShopIntake['kind']>('buy');
  const [source, setSource] = useState('');
  const [cost, setCost] = useState('');
  const [expiry, setExpiry] = useState(''); // תפוגה לאצווה (SHOP10, מתכלה) — רשות
  const [error, setError] = useState('');

  function save() {
    const n = Math.round(+amount);
    if (!amount.trim() || !Number.isFinite(n) || n <= 0) return setError('כמה להוסיף — מספר חיובי');
    // בתרומה-בעין העלות 0 קבוע; בקנייה — שדה רשות (ריק = 0)
    const c = kind === 'donation' ? 0 : Math.round(+(cost || '0'));
    if (!Number.isFinite(c) || c < 0) return setError('עלות — מספר אי-שלילי');
    const ok = addShopIntake({ itemId: it.id, date: isoToday(), qty: n, kind, source: source.trim(), cost: c, note: '', ...(expiry ? { expiry } : {}) });
    if (!ok) return; // ה-store כבר הסביר בטוסט
    toast('הקליטה נרשמה — נותרו ' + ((remaining ?? 0) + n));
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
      <Field label="סוג הקליטה">
        <Select
          value={kind}
          onChange={(v) => setKind(v as ShopIntake['kind'])}
          options={[
            { value: 'buy', label: '🛒 קנייה' },
            { value: 'donation', label: '🎗 תרומה בעין' },
          ]}
        />
      </Field>
      <Field label={kind === 'donation' ? 'מי תרם (טקסט חופשי)' : 'היכן נקנה'}>
        <TextInput value={source} onChange={setSource} placeholder={kind === 'donation' ? 'משפחת לוי' : 'סיטונאות הדרום'} />
      </Field>
      {kind === 'buy' && (
        <Field label="עלות כוללת בש״ח">
          <TextInput value={cost} onChange={setCost} type="number" dir="ltr" placeholder="0" />
        </Field>
      )}
      <Field label="תפוגה (אצווה מתכלה — רשות)">
        <input type="date" value={expiry} onChange={(e) => setExpiry(e.target.value)} />
      </Field>
      <div className="modal-actions">
        <Btn kind="primary" onClick={save}>עדכון המלאי</Btn>
        <Btn onClick={props.onClose}>ביטול</Btn>
      </div>
    </Modal>
  );
}
