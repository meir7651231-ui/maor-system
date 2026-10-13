/**
 * 👨‍🍳 צוות המטבח (staffModal / staffEdit / staffCard של המקור): כרטיסים עם תפקיד-אימוג׳י, עומס פעיל, 📞, 💬
 * (הרחבת-וואטסאפ), ✏️, ✕ (hosting.delete — מנקה את כל השיבוצים); עריכה (9 תפקידים); כרטיס-צוות עם הארוחות הפעילות.
 */
import { useState } from 'react';
import { useApp } from '../../store/useApp';
import { waHref } from '../../lib/wa';
import type { HostStaff } from '../../types/domain';
import { useHostData, useHostEnv } from './hooks';
import { FInput, FSelect, HModal, clickable, h, useHostUi } from './hui';
import { fmtDM, initialsOf, telHref } from './lib';
import { isMealActive, staffActiveMeals, staffRoleIn } from './kitchen';
import { K_ROLES, ROLE_EMO } from './labels';

export function StaffDialog() {
  const d = useHostData();
  const env = useHostEnv();
  const ui = useHostUi();
  const del = useApp((s) => s.deleteHostRecord);
  const loads = d.staff.map((s) => staffActiveMeals(s.id, d.meals).length);
  const maxL = Math.max(1, ...loads);
  const totalActive = d.meals.filter(isMealActive).length;
  return (
    <HModal
      title="👨‍🍳 צוות המטבח"
      maxWidth={700}
      onClose={ui.close}
      footer={
        <button type="button" className={h('btn ghost')} onClick={ui.close}>
          סגור
        </button>
      }
    >
      <div className="h-rowbtn" style={{ alignItems: 'center' }}>
        <button type="button" className={h('btn')} onClick={() => ui.open({ k: 'staffEdit', id: null })}>
          ＋ איש-צוות
        </button>
        <span style={{ fontSize: 12.5, color: 'var(--h-dim)', fontWeight: 700 }}>
          👥 {d.staff.length} אנשי-צוות · 🍽️ {totalActive} ארוחות פעילות
        </span>
      </div>
      {d.staff.length ? (
        <div className="h-stgrid h-dashfx">
          {d.staff.map((s, i) => {
            const n = loads[i];
            const re = ROLE_EMO[s.role] ?? '👨‍🍳';
            const wa = env.wa && s.phone ? waHref(s.phone, '', env.waApp) : null;
            return (
              <div key={s.id} className="h-stcard">
                <div className="h-st-top" {...clickable(() => ui.open({ k: 'staffCard', id: s.id }))}>
                  <div className="h-st-av">
                    {initialsOf(s.name)}
                    <span className="h-st-emo">{re}</span>
                  </div>
                  <div className="h-st-id">
                    <div className="h-st-nm">{s.name}</div>
                    <div className="h-st-role">
                      {re} {s.role || 'איש-צוות'}
                    </div>
                  </div>
                </div>
                <div className="h-st-load">
                  <div className="h-stl-top">
                    <span>עומס פעיל</span>
                    <span>{n} ארוחות</span>
                  </div>
                  <div className="h-stl-bar">
                    <i style={{ width: Math.round((n / maxL) * 100) + '%' }} />
                  </div>
                </div>
                <div className="h-st-acts">
                  {s.phone && (
                    <a className="h-st-abtn" href={telHref(s.phone)} title="חיוג" aria-label={'חיוג ל' + s.name}>
                      📞
                    </a>
                  )}
                  {wa && (
                    <a className={h('st-abtn wa')} href={wa.href} {...(wa.app ? {} : { target: '_blank', rel: 'noopener noreferrer' })} title="וואטסאפ" aria-label={'וואטסאפ ל' + s.name}>
                      💬
                    </a>
                  )}
                  <button type="button" className="h-st-abtn" title="עריכה" aria-label={'עריכת ' + s.name} onClick={() => ui.open({ k: 'staffEdit', id: s.id })}>
                    ✏️
                  </button>
                  {env.canDelete && (
                    <button type="button" className={h('st-abtn del')} title="הסר" aria-label={'הסרת ' + s.name} onClick={() => ui.confirm('להסיר את ' + s.name + ' מהצוות? השיבוצים שלו יתרוקנו.', () => del(s.id), 'הסרה')}>
                      ✕
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="h-panel">
          <div className="h-empty">אין צוות עדיין — הוסיפו את איש-הצוות הראשון 👨‍🍳</div>
        </div>
      )}
    </HModal>
  );
}

export function StaffEditDialog(props: { id: string | null }) {
  const d = useHostData();
  const env = useHostEnv();
  const ui = useHostUi();
  const upsert = useApp((s) => s.upsertHostRecord);
  const del = useApp((s) => s.deleteHostRecord);
  const toast = useApp((s) => s.toast);
  const s0 = props.id ? d.staff.find((x) => x.id === props.id) : undefined;
  const [name, setName] = useState(s0?.name ?? '');
  const [role, setRole] = useState(s0?.role ?? 'טבח');
  const [phone, setPhone] = useState(s0?.phone ?? '');
  const roles: string[] = [...K_ROLES];
  if (role && !roles.includes(role)) roles.push(role);
  function save() {
    const base: HostStaff = s0 ?? { id: '', kind: 'staff', name: '', role: '', phone: '', createdAt: '', updatedAt: '' };
    if (upsert({ ...base, name, role, phone }).ok) {
      ui.open({ k: 'staff' });
      toast('נשמר ✓');
    }
  }
  return (
    <HModal
      title={s0 ? 'עריכת ' + s0.name : 'איש-צוות חדש'}
      onClose={() => ui.open({ k: 'staff' })}
      footer={
        <>
          <button type="button" className={h('btn')} onClick={save}>
            שמירה
          </button>
          {s0 && env.canDelete && (
            <button
              type="button"
              className={h('btn ghost danger')}
              onClick={() =>
                ui.confirm(
                  'להסיר את ' + s0.name + ' מהצוות? השיבוצים שלו יתרוקנו.',
                  () => {
                    if (del(s0.id)) ui.open({ k: 'staff' });
                  },
                  'הסרה',
                )
              }
            >
              מחק
            </button>
          )}
        </>
      }
    >
      <FInput label="שם" value={name} onChange={setName} />
      <div className="h-frow">
        <FSelect label="תפקיד" value={role} onChange={setRole} options={roles} />
        <FInput label="טלפון" type="tel" value={phone} onChange={setPhone} />
      </div>
    </HModal>
  );
}

export function StaffCardDialog(props: { id: string }) {
  const d = useHostData();
  const env = useHostEnv();
  const ui = useHostUi();
  const s = d.staff.find((x) => x.id === props.id);
  if (!s) return null;
  const orders = staffActiveMeals(s.id, d.meals);
  const wa = env.wa && s.phone ? waHref(s.phone, '', env.waApp) : null;
  return (
    <HModal
      title={'👨‍🍳 ' + s.name}
      onClose={ui.close}
      footer={
        <>
          {wa && (
            <a className={h('btn')} href={wa.href} {...(wa.app ? {} : { target: '_blank', rel: 'noopener noreferrer' })} style={{ textDecoration: 'none' }}>
              💬 וואטסאפ
            </a>
          )}
          <button type="button" className={h('btn ghost')} onClick={ui.close}>
            סגור
          </button>
        </>
      }
    >
      <div className="h-detailgrid">
        <div className="h-dt">
          <div className="h-l">תפקיד</div>
          <div className="h-v">{s.role || '—'}</div>
        </div>
        <div className="h-dt">
          <div className="h-l">טלפון</div>
          <div className="h-v">
            {s.phone ? (
              <a href={telHref(s.phone)} style={{ color: 'var(--h-brand)' }}>
                {s.phone}
              </a>
            ) : (
              '—'
            )}
          </div>
        </div>
      </div>
      <div style={{ fontWeight: 800, fontSize: 13, margin: '8px 0 6px' }}>🍽️ הזמנות פעילות ({orders.length})</div>
      {orders.length ? (
        orders.map((o) => (
          <div
            key={o.id}
            className="h-fr"
            style={{ border: '1px solid var(--h-line)', borderRadius: 8, padding: '8px 11px', marginBottom: 6, display: 'flex', flexDirection: 'column', gap: 3, cursor: 'pointer' }}
            {...clickable(() => ui.open({ k: 'recipe', id: o.id }))}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>
                <b>{o.mealName || d.guestName(o.guestId) || '—'}</b>
              </span>
              <span className="h-mono">
                {o.date ? fmtDM(o.date) : ''} {o.time}
              </span>
            </div>
            <div style={{ fontSize: 11.5, color: 'var(--h-dim)' }}>{staffRoleIn(o, s.id).join(' · ')}</div>
          </div>
        ))
      ) : (
        <div className="h-empty">אין הזמנות פעילות</div>
      )}
    </HModal>
  );
}
