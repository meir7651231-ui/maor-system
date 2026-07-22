/**
 * מודאל רישום תרומה — תאריך, סכום, מטבע (₪/$) וקטגוריה.
 * הצבירה (count/ils/usd/first/last) מתעדכנת אוטומטית ב-addDonation שב-store;
 * מספר האסמכתה D-{seq} מוצג בטוסט.
 */
import { useState } from 'react';
import type { Supporter } from '../../types/domain';
import { useApp } from '../../store/useApp';
import { featureOn } from '../../lib/config';
import { downloadReceipt } from '../../lib/receipt';
import { Btn, Field, FormError, Modal, Select, TextInput } from '../ui';
import { HebDateInput } from '../HebDateInput';
import { isoToday } from './lib';

export function DonationModal(props: { supporter: Supporter; onClose: () => void }) {
  const addDonation = useApp((s) => s.addDonation);
  const toast = useApp((s) => s.toast);
  const config = useApp((s) => s.config);
  const receiptsOn = featureOn(config, 'core.receipts');

  const [date, setDate] = useState(isoToday());
  const [amount, setAmount] = useState('');
  const [cur, setCur] = useState<'₪' | '$'>('₪');
  const [cat, setCat] = useState(props.supporter.cat || '');
  const [error, setError] = useState('');

  function save() {
    const amt = Math.round(Number(amount) * 100) / 100;
    if (!amount.trim() || !isFinite(amt) || amt <= 0) {
      setError('הקלידו סכום תרומה תקין');
      return;
    }
    if (!date) {
      setError('בחרו תאריך תרומה');
      return;
    }
    // מספר האסמכתה נגזר מה-seq הנוכחי — בדיוק כפי ש-addDonation שב-store מחשב אותו
    const rid = 'D-' + useApp.getState().db.seq;
    addDonation(props.supporter.id, { date, amount: amt, cur, cat: cat.trim() });
    // core.receipts כבוי — התרומה נרשמת כרגיל, רק הורדת הקבלה והטוסט שלה מדולגים
    if (receiptsOn) {
      downloadReceipt({
        rid,
        orgName: useApp.getState().config.orgName || useApp.getState().db.orgName,
        payer: props.supporter.name,
        amount: amt,
        currency: cur,
        date,
        forWhat: 'תרומה — ' + (cat.trim() || 'כללי'),
      });
    }
    toast(
      'נרשמה תרומה ' +
        (cur === '$' ? '$' : '₪') +
        amt.toLocaleString('he-IL') +
        (receiptsOn ? ' — קבלה ' + rid : '') +
        ' · הציון עודכן',
    );
    if (receiptsOn) toast('הקבלה ירדה למחשב ✓');
    props.onClose();
  }

  return (
    <Modal title={'רישום תרומה — ' + props.supporter.name} onClose={props.onClose}>
      <FormError error={error} />
      <div className="form-grid">
        <Field label="תאריך">
          <HebDateInput value={date} onChange={setDate} />
        </Field>
        <Field label="סכום">
          <TextInput value={amount} onChange={setAmount} type="number" dir="ltr" placeholder="0" />
        </Field>
        <Field label="מטבע">
          <Select
            value={cur}
            onChange={(v) => setCur(v === '$' ? '$' : '₪')}
            options={[
              { value: '₪', label: '₪ שקל' },
              { value: '$', label: '$ דולר' },
            ]}
          />
        </Field>
        <Field label="קטגוריה">
          <TextInput value={cat} onChange={setCat} placeholder="מלגות, פעילות, כללי…" />
        </Field>
      </div>
      <div className="modal-actions">
        <Btn kind="primary" onClick={save}>
          רישום התרומה
        </Btn>
        <Btn onClick={props.onClose}>ביטול</Btn>
      </div>
    </Modal>
  );
}
