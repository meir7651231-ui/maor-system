/**
 * 🍳 תחנת הפיקוד · המטבח (viewKitchen של המקור): כותרת + שעון-חי; מדים — להכין עכשיו (אזעקה) · בהכנה · מוכן · הבא
 * עם ספירה-לאחור; ＋ הזמנת מטבח · ☰/▦ תצוגה · 🔄 סנכרן הכל · 📖 תפריט · 👨‍🍳 צוות · 🛒 קניות · 🍽️ מערך שולחן ·
 * 🌡️ טמפרטורה; לוח KDS 4 עמודות (כרטיסיות עם טיימר-חי, מנות+טבח, אלרגיות, מסילת-סטטוס) או תצוגת-רשימה (התראות
 * 🔴/🛒, צ׳יפי-תפקידים); עומס-תחנות לכל איש-צוות. hosting.kitchen.
 */
import { useEffect, useMemo, useState, type CSSProperties, type ReactNode } from 'react';
import { useApp } from '../../store/useApp';
import { useRemembered } from '../../lib/filterMemory';
import type { HostMeal, HostMealStatus } from '../../types/domain';
import { useHostData, useNowMs, useToday } from './hooks';
import { LiveClock, Pill, clickable, cssVar, h, useHostUi } from './hui';
import { countdown, dinerNames, isMealActive, mealDueNow, mealNextStatus, mealServeAt, mealStartTime, orderByDate, orderDue, staffActiveMeals } from './kitchen';
import { HOST_MEAL_CHAIN } from './model';
import { fmtDM } from './lib';
import { KO_ST, tint } from './labels';

/** טיימר-חי לכרטיסייה (startKitchenTimers): "⏱ 12:04" / "עבר ב-…". */
export function KTimer(props: { serveAt: string; style?: CSSProperties }) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (!props.serveAt) return;
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, [props.serveAt]);
  if (!props.serveAt) return <span className="h-ktimer" style={props.style}>—</span>;
  const at = Date.parse(props.serveAt);
  if (Number.isNaN(at)) return <span className="h-ktimer" style={props.style}>—</span>;
  const c = countdown(at - now);
  return (
    <span className={'h-ktimer' + (c.over ? ' h-over' : '')} style={props.style}>
      {c.over ? 'עבר ב-' + c.text : '⏱ ' + c.text}
    </span>
  );
}

/** מסילת-הסטטוס (korail) — עם/בלי תוויות. */
export function StatusRail(props: { status: HostMealStatus; labels?: boolean; style?: CSSProperties }) {
  const idx = (HOST_MEAL_CHAIN as readonly string[]).indexOf(props.status);
  return (
    <>
      {props.labels && (
        <div className="h-kraillab">
          {HOST_MEAL_CHAIN.map((k) => (
            <span key={k} className={k === props.status ? 'h-cur' : undefined}>
              {KO_ST[k][0]}
            </span>
          ))}
        </div>
      )}
      <div className="h-korail" style={props.style}>
        {HOST_MEAL_CHAIN.map((k, i) => (
          <div key={k} className={'h-kseg' + (i <= idx ? ' h-on' : '') + (k === props.status ? ' h-cur' : '')} style={cssVar('sc', KO_ST[k][1])} />
        ))}
      </div>
    </>
  );
}

export function KitchenTab() {
  const d = useHostData();
  const ui = useHostUi();
  const today = useToday();
  const nowMs = useNowMs(30_000);
  const setStatus = useApp((s) => s.setHostMealStatus);
  const sync = useApp((s) => s.syncHostKitchen);
  const toast = useApp((s) => s.toast);
  const [view, setView] = useRemembered<'board' | 'list'>('hosting.kview', 'board');
  const nowD = new Date(nowMs);
  const nowMin = nowD.getHours() * 60 + nowD.getMinutes();
  const lead = d.settings.orderLeadDays;

  const active = useMemo(
    () => d.meals.filter(isMealActive).sort((a, b) => ((a.date || '') + (a.time || '') < (b.date || '') + (b.time || '') ? -1 : 1)),
    [d.meals],
  );
  const cnt = (s: HostMealStatus) => d.meals.filter((m) => m.status === s).length;
  const due = (m: HostMeal) => mealDueNow(m, d.dishes, today, nowMin);
  const dueN = active.filter(due).length;
  const next = active.filter((m) => mealServeAt(m)).sort((a, b) => (mealServeAt(a) < mealServeAt(b) ? -1 : 1))[0];
  const title = (m: HostMeal) => m.mealName || d.guestName(m.guestId) || 'ארוחה';
  const families = (m: HostMeal) => {
    const n = dinerNames(m, d.guestName);
    return n.length ? n.join(' · ') : d.guestName(m.guestId);
  };
  const staffChip = (sid: string, emoji: string) => {
    const nm = d.staffName(sid);
    if (!nm) return null;
    return (
      <span key={emoji + sid} style={{ display: 'inline-flex', alignItems: 'center', gap: 3, background: 'var(--h-panel)', border: '1px solid var(--h-line)', borderRadius: 6, padding: '1px 7px', fontSize: 11.5 }}>
        <b style={{ color: 'var(--h-brand)', cursor: 'pointer' }} {...clickable(() => ui.open({ k: 'staffCard', id: sid }))}>
          {emoji} {nm}
        </b>
      </span>
    );
  };
  function newMeal() {
    if (!d.dishes.length) {
      toast('הוסיפו מנות לתפריט קודם');
      ui.open({ k: 'menu' });
      return;
    }
    ui.open({ k: 'meal', id: null });
  }
  function cancelMeal(m: HostMeal) {
    ui.confirm('לבטל את הזמנת-המטבח "' + title(m) + '"? (חיוב-המטבח יורד מהתיק)', () => setStatus(m.id, 'cancelled'), 'ביטול הזמנה');
  }
  const advance = (m: HostMeal): ReactNode => {
    const nx = mealNextStatus(m.status);
    return nx ? (
      <button type="button" className={h('btn sm')} onClick={() => setStatus(m.id, nx)}>
        {KO_ST[nx][0]} ←
      </button>
    ) : null;
  };

  const ticket = (m: HostMeal) => {
    const st = KO_ST[m.status];
    const start = mealStartTime(m, d.dishes);
    return (
      <div key={m.id} className={'h-kticket' + (due(m) ? ' h-due' : '')}>
        <div className="h-kt-h">
          <b>{title(m)}</b>
          <i style={{ background: st[1], color: st[1] }} />
        </div>
        <div className="h-kt-m">
          👪 {families(m)} · {m.dinerCount} סועדים
        </div>
        <div className="h-kt-t">
          🍽️ {m.time || '—'}
          {m.date ? ' · ' + fmtDM(m.date) : ''}
          {start ? ' · 🔥 ' + start : ''}
          <KTimer serveAt={mealServeAt(m)} />
        </div>
        {m.items.length > 0 && (
          <div className="h-kt-d">
            {m.items.map((it, i) => (
              <span key={i} className="h-kdish">
                {it.name}
                {it.qty > 1 ? ' ×' + it.qty : ''}
                {it.by && d.staffName(it.by) ? (
                  <>
                    {' · '}
                    <b {...clickable(() => ui.open({ k: 'staffCard', id: it.by }))}>{d.staffName(it.by)}</b>
                  </>
                ) : null}
              </span>
            ))}
          </div>
        )}
        {m.allergens && <div className="h-kt-alg">⚠ {m.allergens}</div>}
        <StatusRail status={m.status} style={{ margin: '9px 0 7px' }} />
        <div className="h-kt-act">
          {advance(m) ?? <span style={{ color: 'var(--h-good)', fontWeight: 800, fontSize: 12 }}>✓ להגשה</span>}
          <button type="button" className="h-iconbtn2" title="מתכון" aria-label="מתכון" onClick={() => ui.open({ k: 'recipe', id: m.id })}>
            📋
          </button>
          <button type="button" className="h-iconbtn2" title="ערוך" aria-label="ערוך" onClick={() => ui.open({ k: 'meal', id: m.id })}>
            ✏️
          </button>
          <button type="button" className="h-iconbtn2" title="הושבה" aria-label="הושבה" onClick={() => ui.open({ k: 'seating', id: m.id })}>
            🪑
          </button>
          <button type="button" className={h('iconbtn2 danger')} title="בטל" aria-label="בטל" onClick={() => cancelMeal(m)}>
            ✕
          </button>
        </div>
      </div>
    );
  };

  const card = (m: HostMeal) => {
    const st = KO_ST[m.status];
    const start = mealStartTime(m, d.dishes);
    const isDue = due(m);
    const od = orderDue(m, lead, today);
    const ob = orderByDate(m, lead);
    const roles = [staffChip(m.cook, '👨‍🍳'), staffChip(m.server, '🍽️'), staffChip(m.clearer, '🧹'), staffChip(m.tableSetter, '🪑')].filter(Boolean);
    return (
      <div key={m.id} className="h-card" style={isDue ? { borderColor: 'var(--h-crit)', boxShadow: '0 0 0 1px var(--h-crit)' } : undefined}>
        <h3>
          {m.mealName ? m.mealName : '🍽️ ' + d.guestName(m.guestId)}{' '}
          <Pill color={st[1]} style={{ marginInlineStart: 'auto' }}>
            {st[0]}
          </Pill>
        </h3>
        <div className="h-meta">
          👪 {families(m)} · {d.unitName(m.unitId)} · {m.dinerCount} סועדים
        </div>
        <div className="h-meta" style={{ marginTop: 2 }}>
          📅 {m.date ? fmtDM(m.date) : '—'} · 🍽️ הגשה {m.time || '—'}
          {start ? ' · 🔥 התחלה ' + start : ''}
        </div>
        {isDue ? (
          <div style={{ fontSize: 12, color: '#fff', background: 'var(--h-crit)', borderRadius: 6, padding: '3px 9px', marginTop: 6, fontWeight: 800, display: 'inline-block' }}>🔴 להתחיל להכין עכשיו</div>
        ) : od && ob ? (
          <div style={{ fontSize: 12, color: '#fff', background: 'var(--h-warn)', borderRadius: 6, padding: '3px 9px', marginTop: 6, fontWeight: 800, display: 'inline-block' }}>🛒 להזמין חומרים · עד {fmtDM(ob)}</div>
        ) : null}
        {roles.length > 0 && <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, marginTop: 7 }}>{roles}</div>}
        <div style={{ fontSize: 12.5, marginTop: 7, display: 'flex', flexDirection: 'column', gap: 2 }}>
          {m.items.map((it, i) => (
            <div key={i}>
              🍽️ {it.name}
              {it.qty > 1 && <b style={{ color: 'var(--h-brand)' }}> ×{it.qty}</b>}
              {it.by && d.staffName(it.by) && (
                <span style={{ color: 'var(--h-dim)' }}>
                  {' — 👨‍🍳 '}
                  <b style={{ color: 'var(--h-brand)', cursor: 'pointer' }} {...clickable(() => ui.open({ k: 'staffCard', id: it.by }))}>
                    {d.staffName(it.by)}
                  </b>
                </span>
              )}
            </div>
          ))}
        </div>
        {m.allergens && <div style={{ fontSize: 12, color: 'var(--h-crit)', fontWeight: 700, marginTop: 4 }}>⚠ {m.allergens}</div>}
        <StatusRail status={m.status} labels />
        <div className="h-rowbtn" style={{ margin: '10px 0 0' }}>
          {advance(m)}
          <button type="button" className={h('btn ghost sm')} onClick={() => ui.open({ k: 'meal', id: m.id })}>
            ✏️ ערוך
          </button>
          <button type="button" className={h('btn ghost sm')} onClick={() => ui.open({ k: 'recipe', id: m.id })}>
            📋 מתכון
          </button>
          <button type="button" className={h('btn ghost sm')} onClick={() => ui.open({ k: 'seating', id: m.id })}>
            🪑 הושבה
          </button>
          <button type="button" className={h('btn ghost sm danger')} onClick={() => cancelMeal(m)}>
            בטל
          </button>
        </div>
      </div>
    );
  };

  const gauge = (em: string, l: string, v: ReactNode, gc: string, alarm = false) => (
    <div className={'h-gauge' + (alarm ? ' h-alarm' : '')} style={cssVar('gc', gc)}>
      <div className="h-em">{em}</div>
      <div className="h-v">{v}</div>
      <div className="h-l">{l}</div>
    </div>
  );
  const maxLoad = 4;
  return (
    <div className="h-dashfx">
      <div className="h-kpass">
        <div className="h-kpass-t">
          <span className="h-ke">🍳</span> תחנת הפיקוד · המטבח <LiveClock />
        </div>
        <div className="h-kgauges">
          {gauge('🔴', 'להכין עכשיו', dueN, 'var(--h-crit)', dueN > 0)}
          {gauge('🔥', 'בהכנה', cnt('prep') + cnt('qc'), 'var(--h-info)')}
          {gauge('✅', 'מוכן להגשה', cnt('ready'), 'var(--h-good)')}
          <div className="h-gauge h-wide" style={cssVar('gc', 'var(--h-a2)')}>
            <div className="h-em">⏭️</div>
            <div className="h-v" style={{ fontSize: 15, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {next ? title(next) : '—'}
            </div>
            <div className="h-l">
              הבא: <KTimer serveAt={next ? mealServeAt(next) : ''} style={{ margin: 0 }} />
            </div>
          </div>
        </div>
      </div>
      <div className="h-rowbtn">
        <button type="button" className={h('btn')} onClick={newMeal}>
          ＋ הזמנת מטבח
        </button>
        <button type="button" className={h('btn ghost')} onClick={() => setView(view === 'board' ? 'list' : 'board')}>
          {view === 'board' ? '☰ תצוגת רשימה' : '▦ תצוגת לוח'}
        </button>
        <button type="button" className={h('btn ghost')} onClick={() => sync()}>
          🔄 סנכרן הכל
        </button>
        <button type="button" className={h('btn ghost')} onClick={() => ui.open({ k: 'menu' })}>
          📖 תפריט
        </button>
        <button type="button" className={h('btn ghost')} onClick={() => ui.open({ k: 'staff' })}>
          👨‍🍳 צוות
        </button>
        <button type="button" className={h('btn ghost')} onClick={() => ui.open({ k: 'shop' })}>
          🛒 רשימת קניות
        </button>
        <button type="button" className={h('btn ghost')} onClick={() => ui.open({ k: 'tableset' })}>
          🍽️ מערך שולחן
        </button>
        <button type="button" className={h('btn ghost')} onClick={() => ui.open({ k: 'temp' })}>
          🌡️ טמפרטורה
        </button>
      </div>
      {active.length ? (
        view === 'list' ? (
          <div className="h-cards">{active.map(card)}</div>
        ) : (
          <div className="h-kboard">
            {(['new', 'prep', 'qc', 'ready'] as const).map((k) => {
              const li = active.filter((m) => m.status === k);
              const st = KO_ST[k];
              return (
                <div key={k} className="h-kcol">
                  <div className="h-kcol-head" style={{ background: tint(st[1], 14), color: st[1] }}>
                    <i style={{ width: 8, height: 8, borderRadius: '50%', background: st[1], boxShadow: '0 0 8px ' + st[1] }} />
                    {st[0]}
                    <span className="h-cnt">{li.length}</span>
                  </div>
                  {li.length ? li.map(ticket) : <div className="h-kcol-empty">—</div>}
                </div>
              );
            })}
          </div>
        )
      ) : (
        <div className="h-panel">
          <div className="h-empty">אין הזמנות פעילות. הוסיפו הזמנת-מטבח או הפעילו חבילת-שבת.</div>
        </div>
      )}
      <div className="h-panel" style={{ marginTop: 16 }}>
        <h2>👨‍🍳 עומס תחנות · הצוות</h2>
        <div className="h-kload">
          {d.staff.length ? (
            d.staff.map((s) => {
              const n = staffActiveMeals(s.id, d.meals).length;
              return (
                <div key={s.id} className="h-kload-row" {...clickable(() => ui.open({ k: 'staffCard', id: s.id }))}>
                  <span className="h-kl-nm">{s.name}</span>
                  <div className="h-kl-bar">
                    <i style={{ width: Math.min(100, (n * 100) / maxLoad) + '%' }} />
                  </div>
                  <span className="h-kl-n">{n}</span>
                </div>
              );
            })
          ) : (
            <div className="h-empty">אין צוות — הוסיפו טבחים</div>
          )}
        </div>
      </div>
    </div>
  );
}
