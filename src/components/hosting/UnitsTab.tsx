/**
 * 🏠 יחידות אירוח (viewUnits של המקור): 4 KPI (תפוסה · פנויות · לניקיון · חסומות), כרטיס לכל יחידה — סוג/מיטות/
 * קיבולת/חדרים, סטטוס-חי (תפוסה עד צ׳ק-אאוט — F8), מאירח-עכשיו / הבא / פנויה, מחיר-ללילה, הכנסת-החודש; ✏️ עריכה ·
 * 🚪 חדרים · 🧹 נקייה (סוגרת גם את משימת-העזיבה — F11) · 🔓 שחרר / 🚫 חסום. + עריכת-יחידה וחדרים.
 */
import { useMemo, useState } from 'react';
import { useApp } from '../../store/useApp';
import { useHostData, useHostEnv, useToday } from './hooks';
import { BigEmpty, FInput, FSelect, HModal, Kpi, cssVar, h, useHostUi } from './hui';
import { HOST_UNIT_TYPES } from './model';
import { currentStay, fmtDM, money, nextStay, unitLiveStatus, unitMonthRevenue, type HostLiveStatus } from './lib';
import { U_LABEL, U_SC, tint } from './labels';

export function UnitsTab() {
  const d = useHostData();
  const env = useHostEnv();
  const ui = useHostUi();
  const today = useToday();
  const setUnitStatus = useApp((s) => s.setHostUnitStatus);
  const toast = useApp((s) => s.toast);
  const t = env.terms;
  const live = useMemo(() => {
    const m: Record<string, HostLiveStatus> = {};
    for (const u of d.units) m[u.id] = unitLiveStatus(u, d.bookings, today);
    return m;
  }, [d.units, d.bookings, today]);
  const cnt = (s: HostLiveStatus) => d.units.filter((u) => live[u.id] === s).length;
  const occN = cnt('occupied');
  const tot = d.units.length;

  return (
    <>
      <h1 className="h-vh">🏠 {t.units} אירוח</h1>
      <div className="h-vsub">
        {tot} {t.units}
      </div>
      {tot > 0 && (
        <div className="h-kpis">
          <Kpi kc="var(--h-info)" lab="📊 תפוסה עכשיו" val={(tot ? Math.round((occN / tot) * 100) : 0) + '%'} sub={occN + ' מתוך ' + tot} />
          <Kpi kc="var(--h-good)" lab="✓ פנויות" val={cnt('free')} />
          <Kpi kc="var(--h-amber)" lab="🧹 לניקיון" val={cnt('dirty')} />
          <Kpi kc="var(--h-crit)" lab="🚫 חסומות" val={cnt('blocked')} />
        </div>
      )}
      {tot > 0 ? (
        <>
          <div className="h-fbar">
            <span style={{ flex: 1 }} />
            <button type="button" className={h('btn')} onClick={() => ui.open({ k: 'unit', id: null })}>
              ＋ {t.unit} חדשה
            </button>
          </div>
          <div className="h-crmgrid">
            {d.units.map((u) => {
              const ls = live[u.id];
              const sc = U_SC[ls];
              const nr = u.subRooms.length;
              const cur = currentStay(u, d.bookings, today);
              const next = nextStay(u, d.bookings, today);
              return (
                <div key={u.id} className="h-crmc" style={cssVar('sc', sc, { cursor: 'default' })}>
                  <div className="h-crm-top">
                    <div className="h-crm-av" style={cssVar('sc', sc, { fontSize: 20 })}>
                      🏠
                    </div>
                    <div>
                      <div className="h-crm-nm">{u.name}</div>
                      <div className="h-crm-sub">
                        {u.type} · {u.beds} מיטות · עד {u.cap}
                        {nr ? ' · 🚪 ' + nr + ' חדרים' : ''}
                      </div>
                    </div>
                    <span className="h-crm-rib" style={{ color: sc, background: tint(sc, 15) }}>
                      {U_LABEL[ls][0]}
                    </span>
                  </div>
                  <div className="h-crm-meta" style={{ fontSize: 12 }}>
                    {cur ? (
                      <span style={{ color: 'var(--h-info)' }}>
                        🏠 מאירח: <b>{d.guestName(cur.guestId)}</b> · עד {fmtDM(cur.checkOut)}
                        {cur.checkOut <= today ? ' (באיחור)' : ''}
                      </span>
                    ) : next ? (
                      <span style={{ color: 'var(--h-dim)' }}>
                        ➡️ הבא: <b>{d.guestName(next.guestId)}</b> · {fmtDM(next.checkIn)}
                      </span>
                    ) : (
                      <span style={{ color: 'var(--h-good)' }}>✓ פנויה להזמנה</span>
                    )}
                  </div>
                  <div className="h-crm-foot">
                    <span className="h-crm-tot">
                      {money(u.rate)} <span style={{ fontSize: 11, color: 'var(--h-dim)', fontFamily: 'Heebo, sans-serif' }}>/ לילה</span>
                    </span>
                    <span className="h-crm-bal" style={{ color: 'var(--h-brand)', background: tint('var(--h-brand)', 12) }}>
                      החודש {money(unitMonthRevenue(u, d.bookings, today))}
                    </span>
                  </div>
                  <div className="h-crm-acts">
                    <button type="button" className="h-crm-ab" onClick={() => ui.open({ k: 'unit', id: u.id })}>
                      ✏️ עריכה
                    </button>
                    <button type="button" className="h-crm-ab" onClick={() => ui.open({ k: 'rooms', id: u.id })}>
                      🚪 חדרים ({nr})
                    </button>
                    {u.status === 'dirty' && (
                      <button
                        type="button"
                        className={h('crm-ab g')}
                        onClick={() => {
                          if (setUnitStatus(u.id, 'free')) toast('סומן נקייה ✓');
                        }}
                      >
                        🧹 נקייה
                      </button>
                    )}
                    {u.status === 'blocked' ? (
                      <button type="button" className={h('crm-ab g')} onClick={() => setUnitStatus(u.id, 'free')}>
                        🔓 שחרר
                      </button>
                    ) : (
                      <button type="button" className="h-crm-ab" onClick={() => setUnitStatus(u.id, 'blocked')}>
                        🚫 חסום
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </>
      ) : (
        <BigEmpty
          icon="🏠"
          title={'אין עדיין ' + t.units}
          sub={'הוסיפו את ' + t.unit + '-האירוח הראשונה כדי להתחיל'}
          action={
            <button type="button" className={h('btn')} onClick={() => ui.open({ k: 'unit', id: null })}>
              ＋ {t.unit} ראשונה
            </button>
          }
        />
      )}
    </>
  );
}

/** עריכת-יחידה (unitModal): שם · סוג · מחיר/לילה · מיטות · קיבולת; מחיקה = hosting.delete (נחסמת כשיש הזמנות). */
export function UnitDialog(props: { id: string | null }) {
  const d = useHostData();
  const env = useHostEnv();
  const ui = useHostUi();
  const upsert = useApp((s) => s.upsertHostUnit);
  const del = useApp((s) => s.deleteHostUnit);
  const toast = useApp((s) => s.toast);
  const u = props.id ? d.unitOf(props.id) : undefined;
  const t = env.terms;
  const [f, setF] = useState(() => ({
    name: u?.name ?? '',
    type: u?.type ?? 'צימר',
    rate: String(u?.rate ?? 600),
    beds: String(u?.beds ?? 2),
    cap: String(u?.cap ?? 2),
  }));
  const set = (p: Partial<typeof f>) => setF((x) => ({ ...x, ...p }));
  const types: string[] = [...HOST_UNIT_TYPES];
  if (f.type && !types.includes(f.type)) types.push(f.type);
  function save() {
    const base = u ?? { id: '', status: 'free' as const, subRooms: [], createdAt: '', updatedAt: '' };
    const r = upsert({ ...base, name: f.name, type: f.type, rate: Number(f.rate), beds: Number(f.beds), cap: Number(f.cap) });
    if (r.ok) {
      ui.close();
      toast('נשמר ✓');
    }
  }
  return (
    <HModal
      title={u ? 'עריכת ' + t.unit : t.unit + ' חדשה'}
      onClose={ui.close}
      footer={
        <>
          <button type="button" className={h('btn')} onClick={save}>
            שמירה
          </button>
          {u && env.canDelete && (
            <button
              type="button"
              className={h('btn ghost danger')}
              onClick={() =>
                ui.confirm('למחוק את ' + u.name + '?', () => {
                  if (del(u.id)) ui.close();
                })
              }
            >
              מחק
            </button>
          )}
        </>
      }
    >
      <FInput label={'שם ה' + t.unit} value={f.name} onChange={(v) => set({ name: v })} />
      <div className="h-frow">
        <FSelect label="סוג" value={f.type} onChange={(v) => set({ type: v })} options={types} />
        <FInput label="מחיר / לילה (₪)" type="number" value={f.rate} onChange={(v) => set({ rate: v })} />
      </div>
      <div className="h-frow">
        <FInput label="מיטות" type="number" value={f.beds} onChange={(v) => set({ beds: v })} />
        <FInput label={'קיבולת ' + t.guests} type="number" value={f.cap} onChange={(v) => set({ cap: v })} />
      </div>
    </HModal>
  );
}

/** 🚪 חדרים (roomsModal): הוספה (שם/מיטות/מחיר = חצי ממחיר-היחידה), טבלה, מחיקה (נחסמת כשחדר מוזמן). */
export function RoomsDialog(props: { id: string }) {
  const d = useHostData();
  const env = useHostEnv();
  const ui = useHostUi();
  const add = useApp((s) => s.addHostRoom);
  const del = useApp((s) => s.deleteHostRoom);
  const toast = useApp((s) => s.toast);
  const u = d.unitOf(props.id);
  const [name, setName] = useState('');
  const [beds, setBeds] = useState('2');
  const [rate, setRate] = useState(() => String(Math.round((u?.rate || 600) / 2)));
  if (!u) return null;
  return (
    <HModal
      title={'🚪 חדרים · ' + u.name}
      onClose={ui.close}
      footer={
        <button type="button" className={h('btn ghost')} onClick={ui.close}>
          סגור
        </button>
      }
    >
      <div className="h-hint" style={{ marginBottom: 12 }}>
        הגדרת חדרים הופכת את ה{env.terms.unit} ל<b>משותפת</b> — משפחות שונות יכולות להזמין חדרים שונים באותם תאריכים. {env.terms.unit} ללא חדרים מוזמנת כשלמה.
      </div>
      <div className="h-frow">
        <FInput label="שם החדר" value={name} onChange={setName} placeholder="חדר הורים / חדר ילדים" />
        <FInput label="מיטות" type="number" value={beds} onChange={setBeds} />
      </div>
      <FInput label="מחיר החדר / לילה (₪)" type="number" value={rate} onChange={setRate} />
      <button
        type="button"
        className={h('btn sm')}
        style={{ marginBottom: 12 }}
        onClick={() => {
          if (add(u.id, { name, beds: Number(beds), rate: Number(rate) })) {
            setName('');
            toast('חדר נוסף ✓');
          }
        }}
      >
        ＋ הוסף חדר
      </button>
      <div className="h-tblwrap">
        <table className="h-tbl">
          <thead>
            <tr>
              <th>חדר</th>
              <th>מיטות</th>
              <th>מחיר/לילה</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {u.subRooms.length ? (
              u.subRooms.map((rm) => (
                <tr key={rm.id}>
                  <td>
                    <b>{rm.name}</b>
                  </td>
                  <td className="h-mono">{rm.beds}</td>
                  <td className="h-mono">{money(rm.rate)}</td>
                  <td>
                    <button type="button" className={h('btn ghost sm danger')} aria-label={'הסרת ' + rm.name} onClick={() => del(u.id, rm.id)}>
                      ✕
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={4} className="h-empty">
                  אין חדרים — ה{env.terms.unit} מוזמנת כשלמה
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </HModal>
  );
}
