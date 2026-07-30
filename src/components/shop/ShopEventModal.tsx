/**
 * טופס אירוע ללוח הייעודי של החנות (חנות 7) — נשמר ב-db.shopEvents בלבד
 * (בידוד: לא נוגע בלוח הראשי). קישור-רשות לשיוך; מחיקה ב-useArmed.
 */
import { useState } from 'react';
import { useApp } from '../../store/useApp';
import { featureOn } from '../../lib/config';
import type { ShopEvent } from '../../types/domain';
import { Btn, Field, FormError, Modal, Select, TextInput } from '../ui';
import { HebDateInput } from '../HebDateInput';
import { useArmed } from '../useArmed';
import { beneficiaryLabel } from './lib';

const KIND_OPTIONS: { value: ShopEvent['kind']; label: string }[] = [
  { value: 'meeting', label: '🤝 פגישה' },
  { value: 'delivery', label: '📦 מסירה' },
  { value: 'holiday', label: '🕎 חג' },
  { value: 'custom', label: '📌 אחר' },
];

export function ShopEventModal(props: { ev: ShopEvent | null; date: string; onClose: () => void }) {
  const db = useApp((s) => s.db);
  const config = useApp((s) => s.config);
  const upsertShopEvent = useApp((s) => s.upsertShopEvent);
  const deleteShopEvent = useApp((s) => s.deleteShopEvent);
  const toast = useApp((s) => s.toast);
  const { armed, confirmTwice } = useArmed(featureOn(config, 'shell.armdel'));
  const ev = props.ev;

  const [f, setF] = useState({
    title: ev?.title ?? '',
    date: ev?.date ?? props.date,
    time: ev?.time ?? '',
    kind: ev?.kind ?? ('meeting' as ShopEvent['kind']),
    assignmentId: ev?.assignmentId ?? '',
    notes: ev?.notes ?? '',
    done: ev?.done ?? false,
  });
  const [error, setError] = useState('');

  function save() {
    if (!f.title.trim()) return setError('כותרת היא שדה חובה');
    if (!f.date) return setError('יש לבחור תאריך');
    upsertShopEvent({ id: ev?.id ?? '', ...f, title: f.title.trim(), notes: f.notes.trim() });
    toast(ev ? 'האירוע עודכן' : 'האירוע נוסף ללוח החנות');
    props.onClose();
  }

  return (
    <Modal title={ev ? 'עריכת אירוע — לוח החנות' : 'אירוע חדש — לוח החנות'} onClose={props.onClose}>
      <FormError error={error} />
      <div className="form-grid">
        <div style={{ gridColumn: '1 / -1' }}>
          <Field label="כותרת *">
            <TextInput value={f.title} onChange={(v) => setF({ ...f, title: v })} placeholder="לדוגמה: מסירת סט לחתן" />
          </Field>
        </div>
        <Field label="תאריך *">
          <HebDateInput value={f.date} onChange={(v) => setF({ ...f, date: v })} />
        </Field>
        <Field label="שעה">
          <TextInput type="time" value={f.time} onChange={(v) => setF({ ...f, time: v })} dir="ltr" />
        </Field>
        <Field label="סוג">
          <Select value={f.kind} onChange={(v) => setF({ ...f, kind: v as ShopEvent['kind'] })} options={KIND_OPTIONS} />
        </Field>
        <Field label="שיוך (רשות)">
          <Select
            value={f.assignmentId}
            onChange={(v) => setF({ ...f, assignmentId: v })}
            options={[
              { value: '', label: 'ללא' },
              ...db.shopAssignments.map((a) => ({
                value: a.id,
                label: beneficiaryLabel(db, a) + ' · ' + (db.shopProducts.find((p) => p.id === a.productId)?.name ?? ''),
              })),
            ]}
          />
        </Field>
        <Field label="בוצע">
          <Select
            value={f.done ? '1' : '0'}
            onChange={(v) => setF({ ...f, done: v === '1' })}
            options={[
              { value: '0', label: 'פתוח' },
              { value: '1', label: '✓ בוצע' },
            ]}
          />
        </Field>
      </div>
      <Field label="הערות">
        <textarea rows={2} value={f.notes} onChange={(e) => setF({ ...f, notes: e.target.value })} />
      </Field>
      <div className="modal-actions">
        <Btn kind="primary" onClick={save}>שמירה</Btn>
        {ev && (
          <Btn
            kind="danger"
            onClick={() => {
              if (!confirmTwice('she-' + ev.id, 'למחוק את האירוע "' + ev.title + '"?')) {
                toast('בטוחים? לחיצה נוספת בתוך 3.5 שניות תמחק');
                return;
              }
              deleteShopEvent(ev.id);
              toast('האירוע נמחק מלוח החנות');
              props.onClose();
            }}
          >
            {armed === 'she-' + ev.id ? 'בטוח?' : '🗑 מחיקה'}
          </Btn>
        )}
        <Btn onClick={props.onClose}>ביטול</Btn>
      </div>
    </Modal>
  );
}
