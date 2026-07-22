/**
 * הגדרות ← חדרים — טבלת חדרים + מודאל הגדרות חדר מלא
 * (סטטוס, משבצת, קיבולת, שעות, תעריף, נגישות, ציוד והערות תפעול).
 * אין מחיקת חדר ב-store — חדר שיצא משימוש מסמנים כמושבת.
 */
import { useState } from 'react';
import type { Room } from '../../types/domain';
import { useApp } from '../../store/useApp';
import { Btn, Chip, Empty, Field, FormError, Modal, Select, TextInput } from '../ui';
import { ROOM_EQUIPMENT, Section, SectionNote } from './lib';

const SLOT_OPTIONS = ['30', '45', '60', '90'].map((v) => ({ value: v, label: v + ' דקות' }));
const YES_NO = (yes: string, no: string) => [
  { value: 'yes', label: yes },
  { value: 'no', label: no },
];

export function RoomsSection() {
  const rooms = useApp((s) => s.db.rooms);
  const upsertRoom = useApp((s) => s.upsertRoom);
  const [editing, setEditing] = useState<Room | null>(null);
  const [creating, setCreating] = useState(false);

  const eqSummary = (r: Room) => {
    const on = Object.keys(r.eq ?? {}).filter((k) => r.eq[k]);
    return on.length ? on.join(' · ') : '—';
  };

  return (
    <Section
      id="sec-rooms"
      title="🚪 חדרים"
      sub="חדרי הפעילות משמשים את יומן החדרים ואת שיבוץ החוגים · חדר שאינו בשימוש מסמנים כמושבת"
    >
      <div style={{ marginBottom: 10 }}>
        <Btn kind="primary" sm onClick={() => setCreating(true)}>
          + חדר חדש
        </Btn>
      </div>
      {rooms.length === 0 ? (
        <Empty>אין חדרים במערכת עדיין — הוסיפו חדר ראשון</Empty>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table className="table">
            <thead>
              <tr>
                <th>שם</th>
                <th>סטטוס</th>
                <th>משבצת</th>
                <th>קיבולת</th>
                <th>שעות פעילות</th>
                <th>מיקום</th>
                <th>ציוד</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {rooms.map((r) => (
                <tr key={r.id}>
                  <td style={{ fontWeight: 600 }}>
                    {r.name}
                    {r.access ? ' ♿' : ''}
                  </td>
                  <td>
                    <Chip on={r.active} onClick={() => upsertRoom({ ...r, active: !r.active })}>
                      {r.active ? 'פעיל' : 'מושבת'}
                    </Chip>
                  </td>
                  <td>{r.slot ? r.slot + ' דק׳' : '—'}</td>
                  <td>{r.cap || '—'}</td>
                  <td dir="ltr" style={{ textAlign: 'right' }}>
                    {r.from && r.to ? `${r.from}–${r.to}` : '—'}
                  </td>
                  <td>{r.location || '—'}</td>
                  <td style={{ maxWidth: 220, fontSize: 12.5, color: 'var(--ink-soft)' }}>{eqSummary(r)}</td>
                  <td>
                    <Btn sm onClick={() => setEditing(r)} title="הגדרות חדר">
                      ⚙ הגדרות
                    </Btn>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <SectionNote>לחיצה על סטטוס מפעילה/משביתה את החדר מיידית — משתקף ביומן החדרים.</SectionNote>

      {(creating || editing) && (
        <RoomForm room={editing} onClose={() => { setEditing(null); setCreating(false); }} />
      )}
    </Section>
  );
}

interface RoomFormState {
  name: string;
  activeSel: string;
  slot: string;
  cap: string;
  location: string;
  rate: string;
  from: string;
  to: string;
  accessSel: string;
  notes: string;
  eq: Record<string, boolean>;
}

function initState(r: Room | null): RoomFormState {
  return {
    name: r?.name ?? '',
    activeSel: !r || r.active ? 'yes' : 'no',
    slot: String(r?.slot || 60),
    cap: r && r.cap ? String(r.cap) : '',
    location: r?.location ?? '',
    rate: r && r.rate ? String(r.rate) : '',
    from: r?.from || '08:00',
    to: r?.to || '20:00',
    accessSel: r?.access ? 'yes' : 'no',
    notes: r?.notes ?? '',
    eq: { ...(r?.eq ?? {}) },
  };
}

function RoomForm(props: { room: Room | null; onClose: () => void }) {
  const upsertRoom = useApp((s) => s.upsertRoom);
  const nextId = useApp((s) => s.nextId);
  const toast = useApp((s) => s.toast);

  const [f, setF] = useState<RoomFormState>(() => initState(props.room));
  const [error, setError] = useState('');
  const set = (patch: Partial<RoomFormState>) => setF((p) => ({ ...p, ...patch }));

  // רשימת הצ'יפים: הציוד הסטנדרטי + מפתחות קיימים שאינם ברשימה (נשמרים בעריכה)
  const eqKeys = [...ROOM_EQUIPMENT, ...Object.keys(f.eq).filter((k) => !ROOM_EQUIPMENT.includes(k))];

  function save() {
    const name = f.name.trim();
    if (!name) return setError('שם החדר הוא שדה חובה');
    const rooms = useApp.getState().db.rooms;
    if (!props.room && rooms.some((r) => r.name === name)) return setError('כבר קיים חדר בשם הזה');

    const fields: Omit<Room, 'id'> = {
      name,
      active: f.activeSel === 'yes',
      slot: +f.slot || 60,
      cap: +f.cap || 0,
      location: f.location.trim(),
      rate: +f.rate || 0,
      from: f.from || '08:00',
      to: f.to || '20:00',
      access: f.accessSel === 'yes',
      notes: f.notes.trim(),
      eq: f.eq,
    };
    if (props.room) {
      upsertRoom({ ...fields, id: props.room.id });
      toast('הגדרות החדר נשמרו — משתקפות ביומן ובלוח');
    } else {
      upsertRoom({ ...fields, id: nextId('r') });
      toast('החדר "' + name + '" נוסף בהצלחה');
    }
    props.onClose();
  }

  return (
    <Modal title={props.room ? '⚙ הגדרות חדר — ' + props.room.name : '+ חדר חדש'} onClose={props.onClose} wide>
      <FormError error={error} />
      <div className="form-grid">
        <Field label="שם החדר *">
          <TextInput value={f.name} onChange={(v) => set({ name: v })} />
        </Field>
        <Field label="סטטוס">
          <Select value={f.activeSel} onChange={(v) => set({ activeSel: v })} options={YES_NO('פעיל', 'מושבת')} />
        </Field>
        <Field label="משך משבצת ביומן">
          <Select value={f.slot} onChange={(v) => set({ slot: v })} options={SLOT_OPTIONS} />
        </Field>
        <Field label="קיבולת (משתתפים)">
          <TextInput value={f.cap} onChange={(v) => set({ cap: v })} type="number" dir="ltr" placeholder="20" />
        </Field>
        <Field label="מיקום / קומה">
          <TextInput value={f.location} onChange={(v) => set({ location: v })} placeholder="קומה ב׳, אגף מזרחי" />
        </Field>
        <Field label="תעריף השכרה לשעה (₪)">
          <TextInput value={f.rate} onChange={(v) => set({ rate: v })} type="number" dir="ltr" />
        </Field>
        <Field label="פעילות משעה">
          <TextInput value={f.from} onChange={(v) => set({ from: v })} type="time" dir="ltr" />
        </Field>
        <Field label="עד שעה">
          <TextInput value={f.to} onChange={(v) => set({ to: v })} type="time" dir="ltr" />
        </Field>
        <Field label="נגישות לעגלות / כיסא גלגלים">
          <Select value={f.accessSel} onChange={(v) => set({ accessSel: v })} options={YES_NO('נגיש ✓', 'לא נגיש')} />
        </Field>
      </div>
      <Field label="ציוד בחדר">
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
          {eqKeys.map((k) => (
            <Chip key={k} on={!!f.eq[k]} onClick={() => set({ eq: { ...f.eq, [k]: !f.eq[k] } })}>
              {k}
            </Chip>
          ))}
        </div>
      </Field>
      <Field label="הערות תפעול">
        <textarea
          rows={2}
          value={f.notes}
          onChange={(e) => set({ notes: e.target.value })}
          placeholder="מפתח אצל אב הבית, לא להזיז את הפסנתר…"
        />
      </Field>
      <div className="modal-actions">
        <Btn kind="primary" onClick={save}>
          שמירת הגדרות
        </Btn>
        <Btn onClick={props.onClose}>ביטול</Btn>
      </div>
    </Modal>
  );
}
