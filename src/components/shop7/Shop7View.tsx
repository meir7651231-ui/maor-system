/**
 * עמודת החלוקה (SHOP7 — מבודד). מתנדבים · ימי-חלוקה · לוח-מסירות.
 * המסירה נגזרת משיוך-חנות פעיל (SHOP6), משויכת למתנדב, ומתקדמת **קדימה**
 * (איסוף→בדרך→נמסר). אפס נגיעה בכסף/קבלות — תיעוד-מסירה בלבד.
 */
import { useMemo, useState } from 'react';
import { useApp } from '../../store/useApp';
import { featureOn, termOf } from '../../lib/config';
import { isoToday } from '../../lib/date-util';
import { hebDateFull } from '../../lib/hebrew';
import { downloadCsv, downloadText } from '../reports/csv';
import { Btn, Chip, Empty, Field, Modal, PageHead, Select, TextInput } from '../ui';
import type { DistributionDay, Volunteer } from '../../types/domain';
import {
  dayProgress,
  deliveriesCsvRows,
  deliveriesOfDay,
  deliveryListLines,
  eligibleAssignmentsForDay,
  filterVolunteers,
  statusLabel,
  volunteerLoadHint,
} from './lib';

type Tab = 'volunteers' | 'days';

export function Shop7View() {
  const config = useApp((s) => s.config);
  const [tab, setTab] = useState<Tab>('days');
  const volWord = termOf(config, 'entity.volunteer', 'מתנדב');

  return (
    <div>
      <PageHead
        title={'🚚 ' + termOf(config, 'nav.shop7', 'חלוקה')}
        sub="מתנדבים, ימי-חלוקה ומעקב מסירות — צורך את שיוכי-החנות הפעילים; מבודד מהכסף"
      />
      <div style={{ display: 'flex', gap: 8, marginBottom: 14, flexWrap: 'wrap' }}>
        <Chip on={tab === 'days'} onClick={() => setTab('days')}>📦 ימי חלוקה</Chip>
        <Chip on={tab === 'volunteers'} onClick={() => setTab('volunteers')}>🦺 {volWord}ים</Chip>
      </div>
      {tab === 'volunteers' ? <VolunteersTab /> : <DaysTab />}
    </div>
  );
}

// ── מתנדבים ─────────────────────────────────────────────────────────────
function VolunteersTab() {
  const config = useApp((s) => s.config);
  const volunteers = useApp((s) => s.db.volunteers);
  const upsertVolunteer = useApp((s) => s.upsertVolunteer);
  const deleteVolunteer = useApp((s) => s.deleteVolunteer);
  const [q, setQ] = useState('');
  const [editing, setEditing] = useState<Volunteer | null | undefined>(undefined);
  const volWord = termOf(config, 'entity.volunteer', 'מתנדב');
  const shown = useMemo(() => filterVolunteers(volunteers, q), [volunteers, q]);

  return (
    <div>
      <div style={{ display: 'flex', gap: 8, marginBottom: 12, flexWrap: 'wrap' }}>
        <div style={{ flex: 1, minWidth: 180 }}>
          <TextInput value={q} onChange={setQ} placeholder={'חיפוש ' + volWord + '…'} />
        </div>
        <Btn kind="primary" onClick={() => setEditing(null)}>➕ הוספת {volWord}</Btn>
      </div>
      {shown.length === 0 ? (
        <Empty>אין {volWord}ים עדיין — הוסיפו את הראשון.</Empty>
      ) : (
        <table className="table">
          <thead>
            <tr><th>שם</th><th>טלפון</th><th>אזור</th><th>קיבולת</th><th>סטטוס</th><th></th></tr>
          </thead>
          <tbody>
            {shown.map((v) => (
              <tr key={v.id}>
                <td style={{ fontWeight: 600 }}>{v.name}</td>
                <td dir="ltr">{v.phone || '—'}</td>
                <td>{v.area || '—'}</td>
                <td>{v.maxDeliveries != null ? v.maxDeliveries : '—'}</td>
                <td>{v.active ? '✓ פעיל' : 'לא פעיל'}</td>
                <td>
                  <div style={{ display: 'flex', gap: 4 }}>
                    <Btn sm onClick={() => setEditing(v)}>✎</Btn>
                    <Btn sm kind="danger" onClick={() => deleteVolunteer(v.id)}>🗑</Btn>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      {editing !== undefined && (
        <VolunteerForm
          volunteer={editing}
          onClose={() => setEditing(undefined)}
          onSave={(v) => { upsertVolunteer(v); setEditing(undefined); }}
        />
      )}
    </div>
  );
}

function VolunteerForm(props: { volunteer: Volunteer | null; onClose: () => void; onSave: (v: Volunteer) => void }) {
  const config = useApp((s) => s.config);
  const v = props.volunteer;
  const [name, setName] = useState(v?.name ?? '');
  const [phone, setPhone] = useState(v?.phone ?? '');
  const [area, setArea] = useState(v?.area ?? '');
  const [maxD, setMaxD] = useState(v?.maxDeliveries != null ? String(v.maxDeliveries) : '');
  const [active, setActive] = useState(v?.active ?? true);
  const [note, setNote] = useState(v?.note ?? '');
  const [error, setError] = useState('');
  const volWord = termOf(config, 'entity.volunteer', 'מתנדב');

  function save() {
    if (!name.trim()) return setError('שם חובה');
    const max = maxD.trim() ? Number(maxD) : undefined;
    if (max != null && (!Number.isFinite(max) || max < 0)) return setError('קיבולת חייבת להיות מספר חיובי');
    props.onSave({
      id: v?.id ?? '',
      name: name.trim(),
      phone: phone.trim(),
      area: area.trim() || undefined,
      maxDeliveries: max,
      active,
      note: note.trim(),
      createdAt: v?.createdAt ?? isoToday(),
    });
  }

  return (
    <Modal title={(v ? 'עריכת ' : 'הוספת ') + volWord} onClose={props.onClose}>
      <Field label="שם *"><TextInput value={name} onChange={setName} placeholder="שם המתנדב" /></Field>
      <Field label="טלפון"><TextInput value={phone} onChange={setPhone} dir="ltr" placeholder="050-1234567" /></Field>
      <Field label="אזור חלוקה (רמז, לא-חוסם)"><TextInput value={area} onChange={setArea} placeholder="שכונה / עיר" /></Field>
      <Field label="קיבולת מסירות ליום (רמז)"><TextInput value={maxD} onChange={setMaxD} dir="ltr" placeholder="למשל 10" /></Field>
      <Field label="הערה"><TextInput value={note} onChange={setNote} /></Field>
      <label style={{ display: 'flex', gap: 8, alignItems: 'center', margin: '6px 0', fontSize: 13.5 }}>
        <input type="checkbox" checked={active} onChange={(e) => setActive(e.target.checked)} /> פעיל
      </label>
      {error && <div style={{ color: '#b91c1c', fontSize: 13, fontWeight: 600 }}>{error}</div>}
      <div className="modal-actions">
        <Btn kind="primary" onClick={save}>שמירה</Btn>
        <Btn onClick={props.onClose}>ביטול</Btn>
      </div>
    </Modal>
  );
}

// ── ימי חלוקה + לוח מסירות ───────────────────────────────────────────────
function DaysTab() {
  const days = useApp((s) => s.db.distributionDays);
  const db = useApp((s) => s.db);
  const config = useApp((s) => s.config);
  const upsertDay = useApp((s) => s.upsertDistributionDay);
  const deleteDay = useApp((s) => s.deleteDistributionDay);
  const closeDay = useApp((s) => s.closeDistributionDay);
  const [openDay, setOpenDay] = useState<string | null>(null);
  const [formOpen, setFormOpen] = useState(false);

  const sorted = useMemo(() => [...days].sort((a, b) => (a.date < b.date ? 1 : -1)), [days]);

  if (openDay) {
    const day = days.find((d) => d.id === openDay);
    if (!day) { setOpenDay(null); return null; }
    return <DayBoard day={day} onBack={() => setOpenDay(null)} />;
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginBottom: 12 }}>
        {featureOn(config, 'shop7.export') && db.deliveries.length > 0 && (
          <Btn sm onClick={() => downloadCsv('deliveries.csv', deliveriesCsvRows(db))}>⬇ ייצוא מסירות (CSV)</Btn>
        )}
        <Btn kind="primary" onClick={() => setFormOpen(true)}>➕ יום חלוקה חדש</Btn>
      </div>
      {sorted.length === 0 ? (
        <Empty>אין ימי-חלוקה עדיין — צרו את הראשון ושייכו אליו מסירות.</Empty>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {sorted.map((d) => {
            const p = dayProgress(db, d.id);
            return (
              <div key={d.id} style={{ border: '1px solid var(--line)', borderRadius: 12, padding: '10px 14px', display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                <div style={{ flex: 1, minWidth: 160 }}>
                  <div style={{ fontWeight: 700 }}>{d.title || 'יום חלוקה'} {d.closed && <span style={{ color: 'var(--ink-faint)', fontWeight: 400 }}>· סגור</span>}</div>
                  <div style={{ fontSize: 12.5, color: 'var(--ink-faint)' }}>{hebDateFull(d.date)}</div>
                </div>
                <div style={{ fontSize: 12.5 }}>
                  <b>{p.delivered}</b>/{p.total} נמסרו {p.enroute > 0 && `· ${p.enroute} בדרך`} {p.pickup > 0 && `· ${p.pickup} לאיסוף`}
                </div>
                <div style={{ display: 'flex', gap: 4 }}>
                  <Btn sm kind="primary" onClick={() => setOpenDay(d.id)}>לוח מסירות ←</Btn>
                  <Btn sm onClick={() => closeDay(d.id, !d.closed)}>{d.closed ? 'פתח' : 'סגור'}</Btn>
                  <Btn sm kind="danger" onClick={() => deleteDay(d.id)}>🗑</Btn>
                </div>
              </div>
            );
          })}
        </div>
      )}
      {formOpen && (
        <DayForm
          onClose={() => setFormOpen(false)}
          onSave={(d) => { upsertDay(d); setFormOpen(false); }}
        />
      )}
    </div>
  );
}

function DayForm(props: { onClose: () => void; onSave: (d: DistributionDay) => void }) {
  const [title, setTitle] = useState('');
  const [date, setDate] = useState(isoToday());
  const [note, setNote] = useState('');
  return (
    <Modal title="יום חלוקה חדש" onClose={props.onClose}>
      <Field label="כותרת"><TextInput value={title} onChange={setTitle} placeholder="חלוקת חג / שבועי" /></Field>
      <Field label="תאריך *"><input type="date" value={date} onChange={(e) => setDate(e.target.value)} /></Field>
      <Field label="הערה"><TextInput value={note} onChange={setNote} /></Field>
      <div className="modal-actions">
        <Btn kind="primary" onClick={() => date && props.onSave({ id: '', date, title: title.trim(), note: note.trim(), closed: false, createdAt: isoToday() })}>שמירה</Btn>
        <Btn onClick={props.onClose}>ביטול</Btn>
      </div>
    </Modal>
  );
}

function DayBoard(props: { day: DistributionDay; onBack: () => void }) {
  const db = useApp((s) => s.db);
  const config = useApp((s) => s.config);
  const advance = useApp((s) => s.advanceDelivery);
  const unassign = useApp((s) => s.unassignDelivery);
  const setNote = useApp((s) => s.setDeliveryNote);
  const [assignOpen, setAssignOpen] = useState(false);

  const rows = deliveriesOfDay(db, props.day.id);
  const famName = (id: string) => db.families.find((f) => f.id === id)?.name ?? '—';
  const volName = (id: string) => db.volunteers.find((v) => v.id === id)?.name ?? '—';
  const prodName = (asgId: string) => {
    const a = db.shopAssignments.find((x) => x.id === asgId);
    return db.shopProducts.find((p) => p.id === a?.productId)?.name ?? '—';
  };
  const statusColor = (s: string) => (s === 'delivered' ? '#16a34a' : s === 'enroute' ? '#d97706' : '#64748b');

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12, flexWrap: 'wrap' }}>
        <Btn sm onClick={props.onBack}>→ כל הימים</Btn>
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 800, fontSize: 16 }}>{props.day.title || 'יום חלוקה'} · {hebDateFull(props.day.date)}</div>
        </div>
        {featureOn(config, 'shop7.export') && rows.length > 0 && (
          <Btn
            sm
            onClick={() =>
              downloadText(
                'deliveries-' + props.day.date + '.txt',
                deliveryListLines(rows.map((d) => ({ ...d, familyName: famName(d.familyId), volunteerName: volName(d.volunteerId) }))),
              )
            }
          >
            🖨 תדפיס מסירות
          </Btn>
        )}
        {!props.day.closed && <Btn kind="primary" onClick={() => setAssignOpen(true)}>➕ שיוך מסירה</Btn>}
      </div>
      {rows.length === 0 ? (
        <Empty>אין מסירות ביום זה — שייכו שיוך-חנות פעיל למתנדב.</Empty>
      ) : (
        <table className="table">
          <thead>
            <tr><th>משפחה</th><th>מוצר</th><th>מתנדב</th><th>סטטוס</th><th>הערה</th><th></th></tr>
          </thead>
          <tbody>
            {rows.map((d) => (
              <tr key={d.id}>
                <td style={{ fontWeight: 600 }}>{famName(d.familyId)}</td>
                <td>{prodName(d.assignmentId)}</td>
                <td>{volName(d.volunteerId)}</td>
                <td style={{ fontWeight: 700, color: statusColor(d.status) }}>{statusLabel(d.status)}</td>
                <td>
                  <TextInput value={d.note} onChange={(val) => setNote(d.id, val)} placeholder="—" />
                </td>
                <td>
                  <div style={{ display: 'flex', gap: 4 }}>
                    {d.status !== 'delivered' && (
                      <Btn sm kind="primary" onClick={() => advance(d.id)}>
                        {d.status === 'pickup' ? 'נאסף →' : 'נמסר ✓'}
                      </Btn>
                    )}
                    <Btn sm kind="danger" onClick={() => unassign(d.id)}>🗑</Btn>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      {assignOpen && <AssignPanel dayId={props.day.id} onClose={() => setAssignOpen(false)} />}
    </div>
  );
}

function AssignPanel(props: { dayId: string; onClose: () => void }) {
  const db = useApp((s) => s.db);
  const assign = useApp((s) => s.assignDelivery);
  const [volId, setVolId] = useState('');
  const [error, setError] = useState('');

  const eligible = eligibleAssignmentsForDay(db, props.dayId);
  const famName = (id: string) => db.families.find((f) => f.id === id)?.name ?? '—';
  const prodName = (pid: string) => db.shopProducts.find((p) => p.id === pid)?.name ?? '—';
  const activeVols = db.volunteers.filter((v) => v.active);

  function doAssign(asgId: string) {
    if (!volId) return setError('בחרו מתנדב');
    const r = assign(props.dayId, asgId, volId);
    if (!r.ok) setError('השיוך נכשל');
  }

  return (
    <Modal title="שיוך מסירה — בחרו מתנדב ושיוך-חנות" onClose={props.onClose} wide>
      <Field label="מתנדב *">
        <Select
          value={volId}
          onChange={setVolId}
          options={[{ value: '', label: '— בחרו מתנדב —' }, ...activeVols.map((v) => {
            const hint = volunteerLoadHint(db, v, props.dayId);
            return { value: v.id, label: v.name + (hint && hint.count > 0 ? ` (${hint.count} מסירות${hint.over ? ' · מעל הקיבולת' : ''})` : '') };
          })]}
        />
      </Field>
      {error && <div style={{ color: '#b91c1c', fontSize: 13, fontWeight: 600, marginBottom: 6 }}>{error}</div>}
      <div style={{ fontSize: 12.5, color: 'var(--ink-faint)', marginBottom: 6 }}>שיוכי-חנות פעילים שטרם משובצים ({eligible.length}):</div>
      {eligible.length === 0 ? (
        <Empty>אין שיוכי-חנות פעילים פנויים — צרו שיוך בעמודת החנות קודם.</Empty>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, maxHeight: '46vh', overflowY: 'auto' }}>
          {eligible.map((a) => (
            <div key={a.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 10px', border: '1px solid var(--line)', borderRadius: 10 }}>
              <span style={{ flex: 1, fontWeight: 600 }}>{famName(a.famId)}</span>
              <span style={{ fontSize: 12.5, color: 'var(--ink-faint)' }}>{prodName(a.productId)}</span>
              <Btn sm kind="primary" onClick={() => doAssign(a.id)}>שייך למתנדב ←</Btn>
            </div>
          ))}
        </div>
      )}
    </Modal>
  );
}
