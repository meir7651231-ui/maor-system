/**
 * טופס אירוע ללוח הייעודי (קופות 6) — נשמר ב-db.tzEvents בלבד (בידוד:
 * לא נוגע ב-db.events ולא מופיע בלוח הראשי). מחיקה ב-useArmed.
 */
import { useState } from 'react';
import { useApp } from '../../store/useApp';
import { useDbWatch } from '../../store/dbWatch';
import { featureOn, termOf } from '../../lib/config';
import type { TzEvent } from '../../types/domain';
import { Btn, Field, FormError, Modal, Select, TextInput } from '../ui';
import { HebDateInput } from '../HebDateInput';
import { useArmed } from '../useArmed';

const KIND_OPTIONS: { value: TzEvent['kind']; label: string }[] = [
  { value: 'round', label: '🔄 סבב ריקון' },
  { value: 'campaign', label: '🎯 מבצע' },
  { value: 'reminder', label: '🔔 תזכורת' },
  { value: 'custom', label: '📌 אחר' },
];

export function TzEventModal(props: { ev: TzEvent | null; date: string; onClose: () => void }) {
  const db = useDbWatch('events', 'tzBoxes', 'tzCoordinators', 'tzEvents');
  const config = useApp((s) => s.config);
  const upsertTzEvent = useApp((s) => s.upsertTzEvent);
  const deleteTzEvent = useApp((s) => s.deleteTzEvent);
  const toast = useApp((s) => s.toast);
  const { armed, confirmTwice } = useArmed(featureOn(config, 'shell.armdel'));
  const ev = props.ev;

  const [f, setF] = useState({
    title: ev?.title ?? '',
    date: ev?.date ?? props.date,
    time: ev?.time ?? '',
    kind: ev?.kind ?? ('round' as TzEvent['kind']),
    coordinatorId: ev?.coordinatorId ?? '',
    boxId: ev?.boxId ?? '',
    notes: ev?.notes ?? '',
    done: ev?.done ?? false,
  });
  const [error, setError] = useState('');

  function save() {
    if (!f.title.trim()) return setError('כותרת היא שדה חובה');
    if (!f.date) return setError('יש לבחור תאריך');
    upsertTzEvent({ id: ev?.id ?? '', ...f, title: f.title.trim(), notes: f.notes.trim() });
    toast(ev ? 'האירוע עודכן' : 'האירוע נוסף ללוח הקופות');
    props.onClose();
  }

  return (
    <Modal title={ev ? 'עריכת אירוע — לוח הקופות' : 'אירוע חדש — לוח הקופות'} onClose={props.onClose}>
      <FormError error={error} />
      <div className="form-grid">
        <div style={{ gridColumn: '1 / -1' }}>
          <Field label="כותרת *">
            <TextInput value={f.title} onChange={(v) => setF({ ...f, title: v })} placeholder="לדוגמה: סבב ריקון שכונה א׳" />
          </Field>
        </div>
        <Field label="תאריך *">
          <HebDateInput value={f.date} onChange={(v) => setF({ ...f, date: v })} />
        </Field>
        <Field label="שעה">
          <TextInput type="time" value={f.time} onChange={(v) => setF({ ...f, time: v })} dir="ltr" />
        </Field>
        <Field label="סוג">
          <Select value={f.kind} onChange={(v) => setF({ ...f, kind: v as TzEvent['kind'] })} options={KIND_OPTIONS} />
        </Field>
        <Field label={termOf(config, 'entity.tzCoordinator', 'רכז') + ' (רשות)'}>
          <Select
            value={f.coordinatorId}
            onChange={(v) => setF({ ...f, coordinatorId: v })}
            options={[{ value: '', label: 'ללא' }, ...db.tzCoordinators.map((c) => ({ value: c.id, label: c.name }))]}
          />
        </Field>
        <Field label={termOf(config, 'entity.tzBox', 'קופה') + ' (רשות)'}>
          <Select
            value={f.boxId}
            onChange={(v) => setF({ ...f, boxId: v })}
            options={[{ value: '', label: 'ללא' }, ...db.tzBoxes.map((b) => ({ value: b.id, label: '#' + b.num }))]}
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
              if (!confirmTwice('tze-' + ev.id, 'למחוק את האירוע "' + ev.title + '"?')) {
                toast('בטוחים? לחיצה נוספת בתוך 3.5 שניות תמחק');
                return;
              }
              deleteTzEvent(ev.id);
              toast('האירוע נמחק מלוח הקופות');
              props.onClose();
            }}
          >
            {armed === 'tze-' + ev.id ? 'בטוח?' : '🗑 מחיקה'}
          </Btn>
        )}
        <Btn onClick={props.onClose}>ביטול</Btn>
      </div>
    </Modal>
  );
}
