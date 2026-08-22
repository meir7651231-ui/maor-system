/**
 * 💰 ריקון קופה (קופות 4) — תאריך, סכום חובה, שיוך למבצע פעיל (מאחורי
 * tzedaka.campaigns), הערה. הכסף נרשם ב-addTzCollection בלבד — מבודד
 * מקבלות/תרומות (הכרעת בעלים 30.7); אין כאן שום ייבוא מ-supporters/receipt.
 */
import { useState } from 'react';
import { useApp } from '../../store/useApp';
import { featureOn, termOf } from '../../lib/config';
import type { TzBox } from '../../types/domain';
import { Btn, Field, FormError, Modal, Select, TextInput } from '../ui';
import { HebDateInput } from '../HebDateInput';
import { isoToday } from '../../lib/date-util';

export function CollectModal(props: { box: TzBox; onClose: () => void }) {
  const config = useApp((s) => s.config);
  const campaigns = useApp((s) => s.db.tzCampaigns);
  const addTzCollection = useApp((s) => s.addTzCollection);
  const toast = useApp((s) => s.toast);
  const campaignsOn = featureOn(config, 'tzedaka.campaigns');
  const active = campaigns.filter((c) => c.active);

  const [f, setF] = useState({ date: isoToday(), amount: '', campaignId: active[0]?.id ?? '', note: '' });
  const [error, setError] = useState('');

  function save() {
    const amount = Math.round(+f.amount);
    if (!f.amount.trim() || !Number.isFinite(amount) || amount <= 0)
      return setError('סכום הריקון חייב להיות מספר חיובי בש"ח');
    // תיקון (swarm-audit): תאריך ריק (ניקוי בשדה הלועזי של HebDateInput) נכתב verbatim
    // לריקון — הקופה מוצגת 'טרם רוקנה' לנצח, staleBoxes ממשיך להתריע והרצף נשבר.
    // חוסמים כמו TzEventModal.
    if (!f.date) return setError('יש לבחור תאריך');
    const res = addTzCollection(props.box.id, {
      date: f.date,
      amount,
      campaignId: campaignsOn ? f.campaignId : '',
      note: f.note.trim(),
    });
    if (!res.ok) return; // ה-store כבר הציג טוסט דחייה
    toast('נרשם ריקון ' + amount.toLocaleString('he-IL') + ' ₪' + (res.delta ? ' · +' + res.delta + ' נק׳' : ''));
    props.onClose();
  }

  return (
    <Modal title={'💰 ריקון ' + termOf(config, 'entity.tzBox', 'קופה') + ' ' + props.box.num} onClose={props.onClose}>
      <FormError error={error} />
      <div className="form-grid">
        <Field label="תאריך הריקון">
          <HebDateInput value={f.date} onChange={(v) => setF({ ...f, date: v })} />
        </Field>
        <Field label='סכום (ש"ח) *'>
          <TextInput value={f.amount} onChange={(v) => setF({ ...f, amount: v })} type="number" dir="ltr" placeholder="120" />
        </Field>
        {campaignsOn && active.length > 0 && (
          <Field label={termOf(config, 'entity.tzCampaign', 'מבצע')}>
            <Select
              value={f.campaignId}
              onChange={(v) => setF({ ...f, campaignId: v })}
              options={[{ value: '', label: 'ללא שיוך' }, ...active.map((c) => ({ value: c.id, label: c.name }))]}
            />
          </Field>
        )}
      </div>
      <Field label="הערה">
        <TextInput value={f.note} onChange={(v) => setF({ ...f, note: v })} placeholder="לדוגמה: נאסף בסבב חודשי" />
      </Field>
      <div className="modal-actions">
        <Btn kind="primary" onClick={save}>רישום הריקון</Btn>
        <Btn onClick={props.onClose}>ביטול</Btn>
      </div>
    </Modal>
  );
}
