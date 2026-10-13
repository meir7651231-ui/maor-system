/**
 * 🍳 הזמנת-מטבח (koModal / koEditModal של המקור) + כרטיס-המתכון (koDetailModal).
 * הזמנה: שם, שיוך-הזמנה (⇒ חיוב "הזמנת מטבח (N מנות)" בתיק-השהייה), משפחות סועדות עם מבוגרים/ילדים, מס׳ סועדים, תאריך,
 * שעת-הגשה, מכין/מגיש/מפנה/מסדר, מנות×כמות×טבח, אלרגיות — עם הסנכרונים האוטומטיים של המקור (סכום-המשפחות ⇒ סועדים
 * וכמויות שלא שונו; שיוך-הזמנה ⇒ המשפחה וגודלה; מכין ⇒ כל המנות שטרם שובצו). עריכה: + 🔄 סנכרון להזמנה, סטטוס,
 * התחלת-הכנה מומלצת, "להזמין חומרים עד"; 🗑 מחק (hosting.delete, מסיר את החיוב).
 */
import { useMemo, useState } from 'react';
import { useApp } from '../../store/useApp';
import { isoToday } from '../../lib/date-util';
import type { HostDiner, HostMeal, HostMealItem } from '../../types/domain';
import { useHostData, useHostEnv, useToday } from './hooks';
import { FInput, FSelect, HModal, Pill, clickable, cssVar, h, useHostUi } from './hui';
import { bookingParty, fmtDM, money, telHref } from './lib';
import { dishOf, mealFactor, mealLeadMinutes, mealNextStatus, mealStartTime, orderByDate, orderDue, parseIng, scaleQty, dinerNames } from './kitchen';
import { HOST_MEAL_CHAIN } from './model';
import { KO_ST, ktMeta } from './labels';

type ItemRow = { on: boolean; qty: string; by: string };
type DinerRow = { on: boolean; adults: string; kids: string };

export function MealDialog(props: { id: string | null; bookingId?: string }) {
  const d = useHostData();
  const env = useHostEnv();
  const ui = useHostUi();
  const upsert = useApp((s) => s.upsertHostMeal);
  const del = useApp((s) => s.deleteHostMeal);
  const toast = useApp((s) => s.toast);
  const m = props.id ? d.meals.find((x) => x.id === props.id) : undefined;
  const pre = !m && props.bookingId ? d.bookingOf(props.bookingId) : undefined;
  const linked = m?.bookingId ? d.bookingOf(m.bookingId) : undefined;
  const t = env.terms;

  const [f, setF] = useState(() => {
    const preN = pre ? bookingParty(pre) : 2;
    const diners: Record<string, DinerRow> = {};
    for (const g of d.guests) diners[g.id] = { on: false, adults: String(g.adults), kids: String(g.kids) };
    const src: HostDiner[] = m ? m.diners : pre ? [{ guestId: pre.guestId, adults: pre.adults, kids: pre.kids }] : [];
    for (const x of src) diners[x.guestId] = { on: true, adults: String(x.adults), kids: String(x.kids) };
    const items: Record<string, ItemRow> = {};
    for (const dish of d.dishes) {
      const ex = m?.items.find((i) => (i.dishId ? i.dishId === dish.id : i.name === dish.name));
      items[dish.id] = { on: !!ex, qty: String(ex?.qty || (m ? m.dinerCount : preN) || 1), by: ex ? ex.by : dish.defBy };
    }
    return {
      mealName: m?.mealName ?? '',
      bookingId: m?.bookingId ?? pre?.id ?? '',
      diners,
      dinerCount: String(m ? m.dinerCount : preN),
      date: m ? m.date : pre?.checkIn || isoToday(),
      time: m ? m.time : d.settings.checkin || '19:00',
      cook: m?.cook ?? '',
      server: m?.server ?? '',
      clearer: m?.clearer ?? '',
      tableSetter: m?.tableSetter ?? '',
      items,
      allergens: m?.allergens ?? '',
      status: m?.status ?? 'new',
    };
  });
  type F = typeof f;

  /** הכמויות שלא שונו ידנית (= הסועדים הקודמים, או ריקות) ⇒ המספר החדש (כמו `recount` במקור). */
  function withCount(x: F, n: number): F {
    const prev = Number(x.dinerCount);
    const items: Record<string, ItemRow> = {};
    for (const [k, r] of Object.entries(x.items)) items[k] = Number(r.qty) === prev || !Number(r.qty) ? { ...r, qty: String(n) } : r;
    return { ...x, dinerCount: String(n), items };
  }
  function setDiners(diners: Record<string, DinerRow>) {
    setF((x) => {
      const sum = Object.values(diners).reduce((s, r) => s + (r.on ? (Number(r.adults) || 0) + (Number(r.kids) || 0) : 0), 0);
      const next = { ...x, diners };
      return sum ? withCount(next, sum) : next;
    });
  }
  function setBooking(id: string) {
    const b = d.bookingOf(id);
    if (!b) {
      setF((x) => ({ ...x, bookingId: '' }));
      return;
    }
    setF((x) => {
      const diners: Record<string, DinerRow> = {};
      for (const [k, r] of Object.entries(x.diners)) diners[k] = { ...r, on: k === b.guestId };
      diners[b.guestId] = { on: true, adults: String(b.adults), kids: String(b.kids) };
      return withCount({ ...x, bookingId: id, diners }, bookingParty(b));
    });
    toast('סונכרן ל-' + d.guestName(b.guestId) + ' · ' + bookingParty(b) + ' סועדים');
  }
  function setCook(v: string) {
    // כמו המקור: כל שורת-מנה בלי טבח (מסומנת או לא) מקבלת את המכין
    const n = v ? Object.values(f.items).filter((r) => !r.by).length : 0;
    setF((x) => {
      const items: Record<string, ItemRow> = {};
      for (const [k, r] of Object.entries(x.items)) items[k] = v && !r.by ? { ...r, by: v } : r;
      return { ...x, cook: v, items };
    });
    if (n) toast('שויך לכל ' + n + ' המנות שטרם שובצו');
  }

  if (props.id && !m) return null;

  function save() {
    const picked: HostMealItem[] = [];
    for (const dish of d.dishes) {
      const r = f.items[dish.id];
      if (r?.on) picked.push({ name: dish.name, dishId: dish.id, price: dish.price, qty: Number(r.qty) || Number(f.dinerCount) || 1, alg: dish.allergens, by: r.by });
    }
    if (!picked.length) {
      toast('בחרו לפחות מנה אחת');
      return;
    }
    const pickedAlg = new Set(picked.map((p) => p.alg).filter(Boolean));
    const manual = f.allergens
      .split(' · ')
      .map((x) => x.trim())
      .filter((x) => x && !pickedAlg.has(x));
    const allergens = [...new Set([...manual, ...pickedAlg])].join(' · ');
    const diners: HostDiner[] = Object.entries(f.diners)
      .filter(([, r]) => r.on)
      .map(([guestId, r]) => ({ guestId, adults: Number(r.adults) || 0, kids: Number(r.kids) || 0 }));
    const base: HostMeal = m ?? {
      id: '',
      kind: 'meal',
      mealName: '',
      bookingId: '',
      unitId: '',
      guestId: diners[0]?.guestId ?? '',
      diners: [],
      dinerCount: 0,
      date: '',
      time: '',
      cook: '',
      server: '',
      clearer: '',
      tableSetter: '',
      items: [],
      status: 'new',
      allergens: '',
      notes: '',
      seatPlan: { people: [], tables: [] },
      createdAt: '',
      updatedAt: '',
    };
    const r = upsert({
      ...base,
      mealName: f.mealName,
      bookingId: f.bookingId,
      diners,
      dinerCount: Number(f.dinerCount) || 0,
      date: f.date,
      time: f.time,
      cook: f.cook,
      server: f.server,
      clearer: f.clearer,
      tableSetter: f.tableSetter,
      items: picked,
      allergens,
      status: f.status,
    });
    if (!r.ok) return;
    ui.close();
    toast(m ? 'ההזמנה עודכנה ✓' : 'נשלח למטבח ✓' + (f.bookingId ? ' · חויב בתיק' : ''));
  }

  const staffOpts = [['', '— לא שויך —'] as const, ...d.staff.map((s) => [s.id, s.name + (s.role ? ' · ' + s.role : '')] as const)];
  const resOpts = [['', '— ללא ' + t.booking + ' משויכת —'] as const, ...d.bookings.filter((b) => b.status !== 'cancelled').map((b) => [b.id, d.guestName(b.guestId) + ' · ' + d.unitName(b.unitId)] as const)];
  const draftMeal = { items: d.dishes.filter((x) => f.items[x.id]?.on).map((x) => ({ name: x.name, dishId: x.id })), time: f.time, date: f.date, status: f.status };
  const start = m ? mealStartTime({ items: draftMeal.items.map((i) => ({ ...i, price: 0, qty: 1, alg: '', by: '' })), time: f.time }, d.dishes) : null;
  const lead = mealLeadMinutes({ items: draftMeal.items.map((i) => ({ ...i, price: 0, qty: 1, alg: '', by: '' })) }, d.dishes);
  const ob = m ? orderByDate({ date: f.date }, d.settings.orderLeadDays) : null;

  return (
    <HModal
      title={m ? '✏️ עריכת הזמנת מטבח' : 'הזמנת מטבח חדשה' + (pre ? ' · ' + d.guestName(pre.guestId) : '')}
      onClose={ui.close}
      maxWidth={600}
      footer={
        <>
          <button type="button" className={h('btn')} onClick={save}>
            {m ? 'שמירה' : 'שלח למטבח'}
          </button>
          {m && env.canDelete && (
            <button
              type="button"
              className={h('btn ghost danger')}
              onClick={() =>
                ui.confirm('למחוק את הזמנת-המטבח?', () => {
                  if (del(m.id)) {
                    ui.close();
                    toast('נמחק');
                  }
                })
              }
            >
              🗑 מחק
            </button>
          )}
        </>
      }
    >
      <FInput label="🍲 שם הארוחה" value={f.mealName} onChange={(v) => setF((x) => ({ ...x, mealName: v }))} placeholder="ארוחת ערב שבת · בר מצווה · ארוחת בוקר..." />
      {!m && <FSelect label={'שיוך ל' + t.booking + ' (לחיוב בתיק-שהייה)'} value={f.bookingId} onChange={setBooking} options={resOpts} />}
      <div className="h-field">
        <label>👪 מי הסועדים · בחרו משפחות</label>
        <div style={{ maxHeight: 150, overflow: 'auto', border: '1px solid var(--h-line)', borderRadius: 9, padding: '8px 11px' }}>
          {d.guests.length ? (
            d.guests.map((g) => {
              const r = f.diners[g.id] ?? { on: false, adults: String(g.adults), kids: String(g.kids) };
              const upd = (p: Partial<DinerRow>) => setDiners({ ...f.diners, [g.id]: { ...r, ...p } });
              return (
                <div key={g.id} style={{ display: 'flex', alignItems: 'center', gap: 7, flexWrap: 'wrap', padding: '6px 2px', borderBottom: '1px solid var(--h-line)' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 7, flex: 1, minWidth: 110, fontSize: 13, margin: 0, fontWeight: 400, color: 'var(--h-ink)' }}>
                    <input type="checkbox" style={{ width: 'auto' }} checked={r.on} onChange={(e) => upd({ on: e.target.checked })} />
                    {g.name}
                  </label>
                  <span style={{ color: 'var(--h-dim)', fontSize: 11 }}>👤</span>
                  <input type="number" aria-label={'מבוגרים · ' + g.name} min={0} value={r.adults} onChange={(e) => upd({ adults: e.target.value })} style={{ width: 52, padding: '3px 5px' }} />
                  <span style={{ color: 'var(--h-dim)', fontSize: 11 }}>🧒</span>
                  <input type="number" aria-label={'ילדים · ' + g.name} min={0} value={r.kids} onChange={(e) => upd({ kids: e.target.value })} style={{ width: 52, padding: '3px 5px' }} />
                </div>
              );
            })
          ) : (
            <div style={{ color: 'var(--h-dim)', fontSize: 12 }}>אין {t.guests} — הוסיפו קודם</div>
          )}
        </div>
      </div>
      <div className="h-frow" style={{ gridTemplateColumns: '1fr 1fr 1fr' }}>
        <FInput label="מס׳ סועדים (סה״כ)" type="number" min={1} value={f.dinerCount} onChange={(v) => setF((x) => ({ ...x, dinerCount: v }))} />
        <FInput label="תאריך הארוחה" type="date" value={f.date} onChange={(v) => setF((x) => ({ ...x, date: v }))} />
        <FInput label="שעת הגשה" type="time" value={f.time} onChange={(v) => setF((x) => ({ ...x, time: v }))} />
      </div>
      {linked && (
        <div className="h-okbox" style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          👪 מקושר ל{t.booking} של <b>{d.guestName(linked.guestId)}</b> · {bookingParty(linked)} משתתפים ({linked.adults} מבוגרים · {linked.kids} ילדים)
          <button
            type="button"
            className={h('btn sm')}
            style={{ marginInlineStart: 'auto' }}
            onClick={() => {
              setF((x) => withCount(x, bookingParty(linked)));
              toast('סונכרן ל-' + bookingParty(linked) + ' משתתפים');
            }}
          >
            🔄 סנכרן ל-{bookingParty(linked)} סועדים
          </button>
        </div>
      )}
      <div className="h-frow">
        <FSelect label="👨‍🍳 מי מכין (טבח אחראי)" value={f.cook} onChange={setCook} options={staffOpts} />
        {m && <FSelect label="סטטוס" value={f.status} onChange={(v) => setF((x) => ({ ...x, status: v as typeof x.status }))} options={HOST_MEAL_CHAIN.map((k) => [k, KO_ST[k][0]] as const)} />}
      </div>
      <div className="h-frow" style={{ gridTemplateColumns: '1fr 1fr 1fr' }}>
        <FSelect label="🍽️ מי מגיש" value={f.server} onChange={(v) => setF((x) => ({ ...x, server: v }))} options={staffOpts} />
        <FSelect label="🧹 מי מוריד/מפנה" value={f.clearer} onChange={(v) => setF((x) => ({ ...x, clearer: v }))} options={staffOpts} />
        <FSelect label="🪑 מסדר שולחן" value={f.tableSetter} onChange={(v) => setF((x) => ({ ...x, tableSetter: v }))} options={staffOpts} />
      </div>
      {start && (
        <div className="h-okbox">
          🔥 התחלת-הכנה מומלצת: {start} (שעת-הגשה {f.time || '—'} פחות {lead} דק׳ הכנה+בישול)
        </div>
      )}
      {ob && (
        <div className="h-okbox" style={{ background: 'color-mix(in srgb,var(--h-warn) 14%,transparent)', borderColor: 'var(--h-warn)' }}>
          🛒 מומלץ להזמין חומרים עד: {fmtDM(ob)} ({d.settings.orderLeadDays} ימים לפני הארוחה)
        </div>
      )}
      <div className="h-field">
        <label>מנות · וכמה מכל אחת</label>
        <div style={{ maxHeight: 190, overflow: 'auto', border: '1px solid var(--h-line)', borderRadius: 9, padding: '8px 11px' }}>
          {d.dishes.map((dish) => {
            const r = f.items[dish.id] ?? { on: false, qty: f.dinerCount, by: dish.defBy };
            const upd = (p: Partial<ItemRow>) => setF((x) => ({ ...x, items: { ...x.items, [dish.id]: { ...r, ...p } } }));
            return (
              <div key={dish.id} style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '5px 2px', fontSize: 13, flexWrap: 'wrap' }}>
                <input type="checkbox" aria-label={dish.name} style={{ width: 'auto' }} checked={r.on} onChange={(e) => upd({ on: e.target.checked })} />
                <span style={{ flex: 1, minWidth: 80, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {dish.name} <span style={{ color: 'var(--h-dim)', fontSize: 11 }}>{money(dish.price)}</span>
                </span>
                <span style={{ color: 'var(--h-dim)', fontSize: 11 }}>×</span>
                <input type="number" min={1} aria-label={'כמה מנות · ' + dish.name} title="כמה מנות מהפריט" value={r.qty} onChange={(e) => upd({ qty: e.target.value })} style={{ width: 52, padding: '4px 6px' }} />
                <select aria-label={'מי מכין · ' + dish.name} title="מי מכין את המנה" value={r.by} onChange={(e) => upd({ by: e.target.value })} style={{ maxWidth: 140, padding: '4px 6px', fontSize: 12 }}>
                  {staffOpts.map(([v, l]) => (
                    <option key={v} value={v}>
                      {l}
                    </option>
                  ))}
                </select>
              </div>
            );
          })}
        </div>
      </div>
      <FInput label="אלרגיות / הערות" value={f.allergens} onChange={(v) => setF((x) => ({ ...x, allergens: v }))} placeholder="בוטנים · ללא גלוטן..." />
    </HModal>
  );
}

/** כרטיס-המתכון (koDetailModal): פרטים, משפחות, מכין+טלפון, תפקידים, הזמנת-חומרים, אלרגיות, מתכונים מוכפלים. */
export function RecipeDialog(props: { id: string }) {
  const d = useHostData();
  const ui = useHostUi();
  const today = useToday();
  const setStatus = useApp((s) => s.setHostMealStatus);
  const m = d.meals.find((x) => x.id === props.id);
  const dnames = useMemo(() => (m ? dinerNames(m, d.guestName) : []), [m, d.guestName]);
  if (!m) return null;
  const st = KO_ST[m.status];
  const nx = mealNextStatus(m.status);
  const who = d.staff.find((s) => s.id === m.cook);
  const start = mealStartTime(m, d.dishes);
  const ob = orderByDate(m, d.settings.orderLeadDays);
  const od = orderDue(m, d.settings.orderLeadDays, today);
  const rc = (lbl: string, sid: string) => {
    const s = d.staff.find((x) => x.id === sid);
    return s ? (
      <div key={lbl} className="h-dt">
        <div className="h-l">{lbl}</div>
        <div className="h-v" style={{ fontSize: 13.5 }}>
          <b style={{ color: 'var(--h-brand)', cursor: 'pointer' }} {...clickable(() => ui.open({ k: 'staffCard', id: s.id }))}>
            {s.name}
          </b>
        </div>
      </div>
    ) : null;
  };
  const roles = [rc('🍽️ מגיש', m.server), rc('🧹 מוריד/מפנה', m.clearer), rc('🪑 מסדר שולחן', m.tableSetter)].filter(Boolean);
  return (
    <HModal
      title={(m.mealName ? m.mealName + ' · ' : '') + 'הזמנת מטבח · ' + d.guestName(m.guestId)}
      onClose={ui.close}
      maxWidth={640}
      footer={
        <>
          {nx && (
            <button type="button" className={h('btn')} onClick={() => setStatus(m.id, nx)}>
              {KO_ST[nx][0]} ←
            </button>
          )}
          <button type="button" className={h('btn ghost')} onClick={() => ui.open({ k: 'meal', id: m.id })}>
            ✏️ ערוך
          </button>
          <button type="button" className={h('btn ghost')} onClick={() => ui.open({ k: 'seating', id: m.id })}>
            🪑 הושבה
          </button>
          {m.status !== 'cancelled' && m.status !== 'served' && (
            <button type="button" className={h('btn ghost danger')} onClick={() => ui.confirm('לבטל את הזמנת-המטבח?', () => setStatus(m.id, 'cancelled'), 'ביטול הזמנה')}>
              בטל
            </button>
          )}
        </>
      }
    >
      {start && (
        <div className="h-okbox">
          🔥 התחלת-הכנה מומלצת: {start} · הגשה {m.time || '—'} ({mealLeadMinutes(m, d.dishes)} דק׳ הכנה+בישול)
        </div>
      )}
      <div className="h-detailgrid">
        <div className="h-dt">
          <div className="h-l">מתי · תאריך</div>
          <div className="h-v" style={{ fontSize: 14 }}>
            {m.date ? fmtDM(m.date) : '—'} · {m.time || '—'}
          </div>
        </div>
        <div className="h-dt">
          <div className="h-l">סטטוס · סועדים</div>
          <div className="h-v">
            <Pill color={st[1]}>{st[0]}</Pill> · {m.dinerCount}
          </div>
        </div>
      </div>
      {dnames.length > 0 && (
        <div className="h-dt" style={{ marginBottom: 10 }}>
          <div className="h-l">👪 מי הסועדים</div>
          <div className="h-v" style={{ fontSize: 13.5 }}>
            {dnames.join(' · ')}
          </div>
        </div>
      )}
      {who && (
        <div className="h-dt" style={{ marginBottom: 10 }}>
          <div className="h-l">👨‍🍳 מי מכין</div>
          <div className="h-v" style={{ fontSize: 14 }}>
            <b style={{ color: 'var(--h-brand)', cursor: 'pointer' }} {...clickable(() => ui.open({ k: 'staffCard', id: who.id }))}>
              {who.name}
            </b>
            {who.role ? ' · ' + who.role : ''}
            {who.phone && (
              <>
                {' · '}
                <a href={telHref(who.phone)} style={{ color: 'var(--h-brand)' }}>
                  {who.phone}
                </a>
              </>
            )}
          </div>
        </div>
      )}
      {roles.length > 0 && (
        <div className="h-detailgrid" style={{ marginBottom: 10 }}>
          {roles}
        </div>
      )}
      {ob && (
        <div className={od ? 'h-warnbox' : 'h-okbox'} style={od ? undefined : { background: 'color-mix(in srgb,var(--h-warn) 12%,transparent)', borderColor: 'var(--h-warn)' }}>
          🛒 מומלץ להזמין חומרים עד: {fmtDM(ob)} ({d.settings.orderLeadDays} ימים לפני הארוחה){od ? ' — חלון-ההזמנה כבר נפתח' : ''}
        </div>
      )}
      {m.allergens && <div className="h-warnbox">⚠ אלרגיות: {m.allergens}</div>}
      <div style={{ fontWeight: 800, fontSize: 13, margin: '8px 0 2px' }}>📋 שלב הכנה · מתכונים (כמויות לפי סועדים)</div>
      {m.items.map((it, i) => {
        const dish = dishOf(it, d.dishes);
        const fct = mealFactor(m, dish, it);
        const portions = it.qty || m.dinerCount;
        const meta = ktMeta(dish?.type ?? '');
        const by = it.by ? d.staffName(it.by) : '';
        return (
          <div key={i} className="h-recipe" style={cssVar('bc', meta[1])}>
            <div className="h-rc-head">
              <span className="h-rc-badge">
                {meta[0]} {dish?.type || 'מנה'}
              </span>
              {by && (
                <span className="h-rc-chef" {...clickable(() => ui.open({ k: 'staffCard', id: it.by }))}>
                  👨‍🍳 {by}
                </span>
              )}
            </div>
            <div className="h-rc-title">
              {it.name}
              {it.qty ? <span className="h-rc-x"> ×{it.qty}</span> : null}
            </div>
            <div className="h-rc-params">
              {dish?.prepTime && <span className="h-rc-chip">⏱ הכנה {dish.prepTime}ד׳</span>}
              {dish?.cookTime && <span className="h-rc-chip">🔥 בישול {dish.cookTime}ד׳</span>}
              {dish?.cookTemp && <span className="h-rc-chip">🌡 {dish.cookTemp}°</span>}
              <span className="h-rc-chip">🍽️ {portions} מנות</span>
            </div>
            {dish && dish.ingredients.length > 0 && (
              <>
                <div className="h-rc-sub">
                  🥕 רכיבים · ל-{portions} מנות{Math.abs(fct - 1) > 1e-6 && <span className="h-rc-mult">×{Math.round(fct * 10) / 10}</span>}
                </div>
                <div className="h-rc-ings">
                  {dish.ingredients.map((g, j) => {
                    const p = parseIng(g);
                    return (
                      <div key={j} className="h-rc-ing">
                        <span className="h-rc-idot" />
                        <span className="h-rc-in">{p.name}</span>
                        {p.qty && <span className="h-rc-iq">{scaleQty(p.qty, fct)}</span>}
                      </div>
                    );
                  })}
                </div>
              </>
            )}
            {dish && dish.steps.length > 0 && (
              <>
                <div className="h-rc-sub">👨‍🍳 שלבי הכנה ובישול</div>
                <div className="h-rc-steps">
                  {dish.steps.map((s, j) => (
                    <div key={j} className="h-rc-step">
                      <span className="h-rc-num">{j + 1}</span>
                      <span className="h-rc-stx">{s}</span>
                    </div>
                  ))}
                </div>
              </>
            )}
            {(!dish || (!dish.ingredients.length && !dish.steps.length)) && <div className="h-rc-empty">אין מתכון עדיין — ערכו את המנה בתפריט 📖</div>}
            {dish?.notes && <div className="h-rc-note">📝 {dish.notes}</div>}
          </div>
        );
      })}
    </HModal>
  );
}
