/**
 * 🔔 תזכורת לקופה (בקשת-בעלים 22.10) — תאריך, הערה, וסוג: חד-פעמית / כל חודש / כל שנה
 * (לפי הלוח העברי). נשמרת כאירוע tzEvents מסוג reminder המקושר לקופה ולרכז שלה —
 * כך היא מופיעה בלוח הקופות, בשורת-הקופה ובטיפול כשמגיע זמנה. אותו מודאל ליצירה ולעריכה.
 */
import { useState } from 'react';
import { useApp } from '../../store/useApp';
import { featureOn, termOf } from '../../lib/config';
import { isoToday } from '../../lib/date-util';
import type { TzBox, TzEvent } from '../../types/domain';
import { Btn, Field, FormError, Modal, Select, TextInput } from '../ui';
import { HebDateInput } from '../HebDateInput';
import { useArmed } from '../useArmed';
import { TZ_RECUR_LABEL, type TzRecurKey } from './lib';

const RECUR_OPTIONS: { value: TzRecurKey; label: string }[] = (['once', 'monthly', 'yearly'] as const).map((k) => ({
  value: k,
  label: TZ_RECUR_LABEL[k],
}));

export function TzReminderModal(props: { box: TzBox; ev: TzEvent | null; onClose: () => void }) {
  const config = useApp((s) => s.config);
  const upsertTzEvent = useApp((s) => s.upsertTzEvent);
  const deleteTzEvent = useApp((s) => s.deleteTzEvent);
  const toast = useApp((s) => s.toast);
  const { armed, confirmTwice } = useArmed(featureOn(config, 'shell.armdel'));
  const ev = props.ev;
  const [f, setF] = useState({ date: ev?.date ?? isoToday(), note: ev?.title ?? '', recur: (ev?.recur ?? 'once') as TzRecurKey });
  const [error, setError] = useState('');

  function save() {
    if (!f.note.trim()) return setError('כתבו בהערה מה צריך לעשות');
    if (!f.date) return setError('יש לבחור תאריך');
    const base: TzEvent = ev ?? {
      id: '',
      title: '',
      date: '',
      time: '',
      kind: 'reminder',
      coordinatorId: props.box.coordinatorId,
      boxId: props.box.id,
      notes: '',
      done: false,
    };
    // שינוי תאריך/סוג מתחיל את הסדרה מחדש — המופעים שסומנו שייכים לסדרה הקודמת
    const restarted = !!ev && (ev.date !== f.date || (ev.recur ?? 'once') !== f.recur);
    const { recur: _r, doneDates: _d, ...rest } = base;
    upsertTzEvent({
      ...rest,
      title: f.note.trim(),
      date: f.date,
      ...(f.recur === 'once' ? {} : { recur: f.recur }),
      ...(!restarted && base.doneDates ? { doneDates: base.doneDates } : {}),
      done: restarted ? false : base.done,
    });
    toast(ev ? 'התזכורת עודכנה' : 'התזכורת נוספה ללוח הקופות · ' + TZ_RECUR_LABEL[f.recur]);
    props.onClose();
  }

  return (
    <Modal title={(ev ? '✏️ עריכת תזכורת · ' : '🔔 תזכורת חדשה · ') + termOf(config, 'entity.tzBox', 'קופה') + ' ' + props.box.num} onClose={props.onClose}>
      <FormError error={error} />
      <div className="form-grid">
        <Field label={f.recur === 'once' ? 'תאריך *' : 'מתאריך *'}>
          <HebDateInput value={f.date} onChange={(v) => setF({ ...f, date: v })} />
        </Field>
        <Field label="סוג התזכורת">
          <Select value={f.recur} onChange={(v) => setF({ ...f, recur: v as TzRecurKey })} options={RECUR_OPTIONS} />
        </Field>
      </div>
      <Field label="הערה *">
        <TextInput value={f.note} onChange={(v) => setF({ ...f, note: v })} placeholder="לדוגמה: לרוקן לפני חנוכה" />
      </Field>
      <div className="modal-actions">
        <Btn kind="primary" onClick={save}>{ev ? 'שמירה' : 'הוספת התזכורת'}</Btn>
        {ev && (
          <Btn
            kind="danger"
            onClick={() => {
              if (!confirmTwice('tzr-' + ev.id, 'למחוק את התזכורת "' + ev.title + '"?')) {
                toast('בטוחים? לחיצה נוספת בתוך 3.5 שניות תמחק את התזכורת');
                return;
              }
              deleteTzEvent(ev.id);
              toast('התזכורת נמחקה');
              props.onClose();
            }}
          >
            {armed === 'tzr-' + ev.id ? 'בטוח?' : '🗑 מחיקה'}
          </Btn>
        )}
        <Btn onClick={props.onClose}>ביטול</Btn>
      </div>
    </Modal>
  );
}
