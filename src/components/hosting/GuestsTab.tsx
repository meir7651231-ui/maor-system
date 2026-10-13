/**
 * 👪 אורחים / משפחות מתארחות (viewGuests של המקור): 4 KPI (רשומות · חוזרים · הוצאה כוללת · ממוצע), חיפוש (שם/טלפון/
 * מייל), כרטיסים ממוינים לפי הוצאה — ⭐ חוזר, מבוגרים/ילדים, שהיות, ביקור-אחרון, הערות/רגישויות; 📞 חיוג · 💬
 * וואטסאפ (הרחבה) · ✏️ עריכה. + עריכת-אורח (מחיקה = hosting.delete, נחסמת כשיש הזמנות).
 */
import { useMemo, useState } from 'react';
import { useApp } from '../../store/useApp';
import { useRemembered } from '../../lib/filterMemory';
import { waHref } from '../../lib/wa';
import { useHostData, useHostEnv } from './hooks';
import { FInput, FText, HModal, Kpi, clickable, cssVar, h, useHostUi } from './hui';
import { fmtDM, guestsView, initialsOf, money, telHref } from './lib';
import { tint } from './labels';

export function GuestsTab() {
  const d = useHostData();
  const env = useHostEnv();
  const ui = useHostUi();
  const [q, setQ] = useRemembered<string>('hosting.guests.q', '');
  const all = useMemo(() => guestsView(d.guests, d.bookings, ''), [d.guests, d.bookings]);
  const list = useMemo(() => (q.trim() ? guestsView(d.guests, d.bookings, q) : all), [q, all, d.guests, d.bookings]);
  const t = env.terms;
  const fam = d.prefs.familyTerm === true;
  const total = all.length;
  const repeat = all.filter((x) => x.s.stays > 1).length;
  const spend = all.reduce((s, x) => s + x.s.spend, 0);
  const sc = 'var(--h-violet)';

  return (
    <>
      <h1 className="h-vh">👪 {fam && t.guests === 'משפחות' ? 'משפחות מתארחות' : t.guests}</h1>
      <div className="h-vsub">{d.guests.length} רשומות · לחיצה לכרטיס</div>
      <div className="h-kpis">
        <Kpi kc="var(--h-violet)" lab={'👪 ' + t.guests} val={total} sub="רשומות" />
        <Kpi kc="var(--h-brand)" lab="⭐ חוזרים" val={repeat} sub="2+ שהיות" />
        <Kpi kc="var(--h-good)" lab="💰 הוצאה כוללת" val={money(spend)} />
        <Kpi kc="var(--h-info)" lab="📊 ממוצע" val={money(total ? spend / total : 0)} sub={'ל' + t.guest} />
      </div>
      <div className="h-fbar">
        <input className="h-fsearch" aria-label={'חיפוש ' + t.guests} placeholder="🔍 חיפוש לפי שם, טלפון או מייל…" value={q} onChange={(e) => setQ(e.target.value)} />
        <button type="button" className={h('btn')} onClick={() => ui.open({ k: 'guest', id: null })}>
          ＋ {t.guest} {fam && t.guest === 'משפחה מתארחת' ? 'חדשה' : 'חדש'}
        </button>
      </div>
      <div className="h-crmgrid">
        {list.length ? (
          list.map(({ g, s }) => {
            const wa = env.wa && g.phone ? waHref(g.phone, '', env.waApp) : null;
            return (
              <div key={g.id} className="h-crmc" style={cssVar('sc', sc)} {...clickable(() => ui.open({ k: 'guest', id: g.id }))}>
                <div className="h-crm-top">
                  <div className="h-crm-av" style={cssVar('sc', sc)}>
                    {initialsOf(g.name)}
                  </div>
                  <div>
                    <div className="h-crm-nm">{g.name}</div>
                    <div className="h-crm-sub">{g.phone ? '📱 ' + g.phone : 'ללא טלפון'}</div>
                  </div>
                  {s.stays > 1 && (
                    <span className="h-crm-rib" style={{ color: 'var(--h-brand)', background: tint('var(--h-brand)', 15) }}>
                      ⭐ חוזר
                    </span>
                  )}
                </div>
                <div className="h-crm-meta">
                  <span>
                    👤 <b>{g.adults}</b> · 🧒 <b>{g.kids}</b>
                  </span>
                  <span>
                    🛏️ <b>{s.stays}</b> שהיות
                  </span>
                  {s.last && <span>🕐 {fmtDM(s.last)}</span>}
                </div>
                {g.notes && (
                  <div className="h-crm-meta" style={{ color: 'var(--h-amber)' }}>
                    <span>📝 {g.notes}</span>
                  </div>
                )}
                <div className="h-crm-foot">
                  <span className="h-crm-tot">{money(s.spend)}</span>
                  <span className="h-crm-bal" style={{ color: 'var(--h-dim)', background: 'var(--h-panel)' }}>
                    סה״כ הוצאה
                  </span>
                </div>
                <div className="h-crm-acts">
                  {g.phone && (
                    <a className="h-crm-ab" href={telHref(g.phone)}>
                      📞 חיוג
                    </a>
                  )}
                  {wa && (
                    <a className={h('crm-ab wa')} href={wa.href} {...(wa.app ? {} : { target: '_blank', rel: 'noopener noreferrer' })}>
                      💬 וואטסאפ
                    </a>
                  )}
                  <button type="button" className="h-crm-ab" onClick={() => ui.open({ k: 'guest', id: g.id })}>
                    ✏️ עריכה
                  </button>
                </div>
              </div>
            );
          })
        ) : (
          <div className="h-repempty" style={{ gridColumn: '1/-1' }}>
            אין רשומות תואמות 📭
          </div>
        )}
      </div>
    </>
  );
}

/** עריכת-אורח (guestModal): שם · טלפון · מייל · מבוגרים · ילדים · הערות/רגישויות. */
export function GuestDialog(props: { id: string | null }) {
  const d = useHostData();
  const env = useHostEnv();
  const ui = useHostUi();
  const upsert = useApp((s) => s.upsertHostRecord);
  const del = useApp((s) => s.deleteHostRecord);
  const toast = useApp((s) => s.toast);
  const g = props.id ? d.guestOf(props.id) : undefined;
  const t = env.terms;
  const [f, setF] = useState(() => ({
    name: g?.name ?? '',
    phone: g?.phone ?? '',
    email: g?.email ?? '',
    adults: String(g?.adults ?? 2),
    kids: String(g?.kids ?? 0),
    notes: g?.notes ?? '',
  }));
  const set = (p: Partial<typeof f>) => setF((x) => ({ ...x, ...p }));
  function save() {
    const base = g ?? { id: '', kind: 'guest' as const, createdAt: '', updatedAt: '' };
    const r = upsert({ ...base, kind: 'guest', name: f.name, phone: f.phone, email: f.email, adults: Number(f.adults), kids: Number(f.kids), notes: f.notes });
    if (r.ok) {
      ui.close();
      toast('נשמר ✓');
    }
  }
  return (
    <HModal
      title={g ? 'עריכת ' + t.guest : t.guest + ' ' + (t.guest === 'משפחה מתארחת' ? 'חדשה' : 'חדש')}
      onClose={ui.close}
      footer={
        <>
          <button type="button" className={h('btn')} onClick={save}>
            שמירה
          </button>
          {g && env.canDelete && (
            <button
              type="button"
              className={h('btn ghost danger')}
              onClick={() =>
                ui.confirm('למחוק את ' + g.name + '?', () => {
                  if (del(g.id)) ui.close();
                })
              }
            >
              מחק
            </button>
          )}
        </>
      }
    >
      <FInput label="שם" value={f.name} onChange={(v) => set({ name: v })} />
      <div className="h-frow">
        <FInput label="טלפון" type="tel" value={f.phone} onChange={(v) => set({ phone: v })} />
        <FInput label="מייל" type="email" value={f.email} onChange={(v) => set({ email: v })} />
      </div>
      <div className="h-frow">
        <FInput label="מבוגרים" type="number" value={f.adults} onChange={(v) => set({ adults: v })} />
        <FInput label="ילדים" type="number" value={f.kids} onChange={(v) => set({ kids: v })} />
      </div>
      <FText label="הערות / רגישויות" value={f.notes} onChange={(v) => set({ notes: v })} />
    </HModal>
  );
}
