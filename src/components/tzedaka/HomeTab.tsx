/**
 * 🏠 טיפול משרדי (קופות 5) — מדדים, "דורש טיפול" מ-needsCare עם כפתור
 * פעולה לכל שורה, ניהול מבצעים (tzedaka.campaigns) וקיצורי פעולה.
 */
import { useState } from 'react';
import { useApp } from '../../store/useApp';
import { featureOn, termOf } from '../../lib/config';
import { isoToday } from '../../lib/date-util';
import type { TzBox, TzCampaign } from '../../types/domain';
import { Btn, Chip, Empty, Field, FormError, Modal, Select, TextInput } from '../ui';
import { HebDateInput } from '../HebDateInput';
import { campaignProgress, campaignTotal, grandTotal, needsCare } from './lib';
import { CollectModal } from './CollectModal';
import { CoordinatorForm } from './CoordinatorForm';
import { BoxForm } from './BoxForm';

function CampaignForm(props: { campaign: TzCampaign | null; onClose: () => void }) {
  const config = useApp((s) => s.config);
  const upsertTzCampaign = useApp((s) => s.upsertTzCampaign);
  const toast = useApp((s) => s.toast);
  const c = props.campaign;
  const [f, setF] = useState({
    name: c?.name ?? '',
    start: c?.start ?? isoToday(),
    end: c?.end ?? '',
    goal: c?.goal ? String(c.goal) : '',
    active: c?.active ?? true,
    notes: c?.notes ?? '',
  });
  const [error, setError] = useState('');

  function save() {
    if (!f.name.trim()) return setError('שם ה' + termOf(config, 'entity.tzCampaign', 'מבצע') + ' הוא שדה חובה');
    upsertTzCampaign({
      id: c?.id ?? '',
      name: f.name.trim(),
      start: f.start,
      end: f.end,
      goal: Math.max(0, Math.round(+f.goal) || 0),
      active: f.active,
      notes: f.notes.trim(),
    });
    toast(c ? 'המבצע עודכן' : 'המבצע "' + f.name.trim() + '" נפתח');
    props.onClose();
  }

  return (
    <Modal title={(c ? 'עריכת ' : '➕ הוספת ') + termOf(config, 'entity.tzCampaign', 'מבצע')} onClose={props.onClose}>
      <FormError error={error} />
      <div className="form-grid">
        <Field label="שם *">
          <TextInput value={f.name} onChange={(v) => setF({ ...f, name: v })} placeholder="לדוגמה: מבצע חנוכה" />
        </Field>
        <Field label='יעד (ש"ח) — 0 = ללא'>
          <TextInput value={f.goal} onChange={(v) => setF({ ...f, goal: v })} type="number" dir="ltr" />
        </Field>
        <Field label="תחילה">
          <HebDateInput value={f.start} onChange={(v) => setF({ ...f, start: v })} />
        </Field>
        <Field label="סיום (רשות)">
          <HebDateInput value={f.end} onChange={(v) => setF({ ...f, end: v })} />
        </Field>
        <Field label="מצב">
          <Select
            value={f.active ? '1' : '0'}
            onChange={(v) => setF({ ...f, active: v === '1' })}
            options={[
              { value: '1', label: 'פעיל' },
              { value: '0', label: 'סגור' },
            ]}
          />
        </Field>
      </div>
      <Field label="הערות">
        <textarea rows={2} value={f.notes} onChange={(e) => setF({ ...f, notes: e.target.value })} />
      </Field>
      <div className="modal-actions">
        <Btn kind="primary" onClick={save}>שמירה</Btn>
        <Btn onClick={props.onClose}>ביטול</Btn>
      </div>
    </Modal>
  );
}

export function HomeTab(props: { onOpenCoordinator: (id: string) => void }) {
  const db = useApp((s) => s.db);
  const config = useApp((s) => s.config);
  const upsertTzCampaign = useApp((s) => s.upsertTzCampaign);
  const toast = useApp((s) => s.toast);
  const campaignsOn = featureOn(config, 'tzedaka.campaigns');
  const today = isoToday();

  const [collectFor, setCollectFor] = useState<TzBox | null>(null);
  const [coordFormOpen, setCoordFormOpen] = useState(false);
  const [boxFormFor, setBoxFormFor] = useState<string | null>(null); // coordinatorId
  const [campForm, setCampForm] = useState<{ campaign: TzCampaign | null } | null>(null);
  const [quickBoxId, setQuickBoxId] = useState('');

  const care = needsCare(db, today);
  const atHome = db.tzBoxes.filter((b) => b.status === 'home').length;
  const atOffice = db.tzBoxes.filter((b) => b.status === 'office').length;
  const lost = db.tzBoxes.filter((b) => b.status === 'lost').length;
  const activeCoords = db.tzCoordinators.filter((c) => c.active).length;
  const activeCampaign = db.tzCampaigns.find((c) => c.active);

  const careAction = (kind: string, id: string) => {
    if (kind === 'stale' || kind === 'lost') {
      const b = db.tzBoxes.find((x) => x.id === id);
      if (b) setCollectFor(b);
    } else if (kind === 'inactiveCoord') {
      props.onOpenCoordinator(id);
    } else {
      const p = db.tzCampaigns.find((x) => x.id === id);
      if (p) setCampForm({ campaign: p });
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      {/* מדדים */}
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
        <Chip on>{'🏠 אצל משפחות · ' + atHome}</Chip>
        <Chip on={false}>{'🏢 במשרד · ' + atOffice}</Chip>
        <Chip on={false}>{'⚠ אבדו · ' + lost}</Chip>
        <Chip on={false}>{'🧑‍🤝‍🧑 פעילים · ' + activeCoords}</Chip>
        <Chip on={false}>{'💰 נאסף סה"כ · ' + grandTotal(db.tzBoxes).toLocaleString('he-IL') + ' ₪'}</Chip>
        {campaignsOn && activeCampaign && (
          <Chip on={false}>
            {'🎯 ' + activeCampaign.name + ' · ' + campaignTotal(db.tzBoxes, activeCampaign.id).toLocaleString('he-IL') + ' ₪'}
          </Chip>
        )}
      </div>

      {/* קיצורי פעולה */}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        <Btn onClick={() => setCoordFormOpen(true)}>➕ {termOf(config, 'entity.tzCoordinator', 'רכז')}</Btn>
        {db.tzCoordinators.length > 0 && (
          <Btn onClick={() => setBoxFormFor(db.tzCoordinators[0].id)}>➕ {termOf(config, 'entity.tzBox', 'קופה')}</Btn>
        )}
        {db.tzBoxes.length > 0 && (
          <span style={{ display: 'inline-flex', gap: 6, alignItems: 'center' }}>
            <Select
              value={quickBoxId}
              onChange={setQuickBoxId}
              options={[
                { value: '', label: '💰 ריקון מהיר — בחרו קופה' },
                ...db.tzBoxes
                  .filter((b) => b.status === 'home' || b.status === 'office')
                  .map((b) => ({ value: b.id, label: '#' + b.num })),
              ]}
            />
            <Btn
              sm
              onClick={() => {
                const b = db.tzBoxes.find((x) => x.id === quickBoxId);
                if (b) setCollectFor(b);
                else toast('בחרו קופה לריקון');
              }}
            >
              💰
            </Btn>
          </span>
        )}
      </div>

      {/* דורש טיפול */}
      <section className="card">
        <h2 style={{ fontSize: 15, fontWeight: 800, marginBottom: 8 }}>🔔 דורש טיפול</h2>
        {care.length === 0 && <div style={{ fontSize: 13, color: 'var(--green)', fontWeight: 600 }}>הכל מטופל ✓</div>}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {care.map((item) => (
            <div key={item.kind + item.id} style={{ display: 'flex', alignItems: 'center', gap: 8, border: '1px solid var(--line)', borderRadius: 10, padding: '7px 11px' }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 700 }}>{item.label}</div>
                <div style={{ fontSize: 12, color: 'var(--ink-faint)' }}>{item.hint}</div>
              </div>
              <Btn sm onClick={() => careAction(item.kind, item.id)}>
                {item.kind === 'stale' || item.kind === 'lost' ? '💰 ריקון' : item.kind === 'inactiveCoord' ? 'לכרטיס ←' : '✎ מבצע'}
              </Btn>
            </div>
          ))}
        </div>
      </section>

      {/* מבצעים */}
      {campaignsOn && (
        <section className="card">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
            <h2 style={{ fontSize: 15, fontWeight: 800 }}>🎯 {termOf(config, 'entity.tzCampaign', 'מבצע')}ים</h2>
            <Btn kind="primary" sm onClick={() => setCampForm({ campaign: null })}>
              ➕ הוספת {termOf(config, 'entity.tzCampaign', 'מבצע')}
            </Btn>
          </div>
          {db.tzCampaigns.length === 0 && <Empty>אין מבצעים — פתחו את הראשון</Empty>}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {db.tzCampaigns.map((p) => {
              const prog = campaignProgress(p, db.tzBoxes);
              return (
                <div key={p.id} style={{ border: '1px solid var(--line)', borderRadius: 10, padding: '8px 12px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                    <span style={{ fontWeight: 800 }}>{p.name}</span>
                    <Chip on={p.active}>{p.active ? 'פעיל' : 'סגור'}</Chip>
                    <span style={{ fontSize: 12.5, color: 'var(--ink-faint)' }}>
                      {p.start + (p.end ? ' – ' + p.end : '') + ' · נאסף ' + prog.sum.toLocaleString('he-IL') + ' ₪' + (prog.goal ? ' מתוך ' + prog.goal.toLocaleString('he-IL') : '')}
                    </span>
                    <span style={{ marginInlineStart: 'auto', display: 'flex', gap: 4 }}>
                      <Btn sm onClick={() => setCampForm({ campaign: p })}>✎</Btn>
                      {p.active && (
                        <Btn
                          sm
                          onClick={() => {
                            upsertTzCampaign({ ...p, active: false });
                            toast('המבצע "' + p.name + '" נסגר');
                          }}
                        >
                          סגירה
                        </Btn>
                      )}
                    </span>
                  </div>
                  {prog.goal > 0 && (
                    <div style={{ height: 8, borderRadius: 99, background: 'rgba(33,29,23,.08)', overflow: 'hidden', marginTop: 6 }}>
                      <div style={{ height: '100%', width: prog.pct + '%', borderRadius: 99, background: 'var(--amber-deep, #d97706)' }} />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>
      )}

      {collectFor && <CollectModal box={collectFor} onClose={() => setCollectFor(null)} />}
      {coordFormOpen && <CoordinatorForm coordinator={null} onClose={() => setCoordFormOpen(false)} />}
      {boxFormFor && <BoxForm box={null} coordinatorId={boxFormFor} onClose={() => setBoxFormFor(null)} />}
      {campForm && <CampaignForm campaign={campForm.campaign} onClose={() => setCampForm(null)} />}
    </div>
  );
}
