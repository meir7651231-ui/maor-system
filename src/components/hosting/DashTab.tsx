/**
 * 🏡 📊 לוח בקרה (viewDash של המקור): ברכה לפי שעה + שעון-חי, טבעת-תפוסה מונפשת + 4 צ׳יפים בספירה-עולה, 6 KPI,
 * מפת-יחידות, הכנסות 6 חודשים, הגעות/עזיבות (+ באיחור — F8), יחידות לניקיון, יתרות פתוחות (כולל אחרי עזיבה — F6).
 */
import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { useApp } from '../../store/useApp';
import { useHostData, useHostEnv, useNowMs, useToday } from './hooks';
import { BigEmpty, CountUp, Kpi, LiveClock, Pill, clickable, cssVar, h, useHostUi } from './hui';
import { bookingBalance, dashboardOf, greetingOf, initialsOf, money } from './lib';
import { U_LABEL } from './labels';
import { TodayPanel } from './SwitchPanels';
import type { HostBooking } from '../../types/domain';

const fmtDay = new Intl.DateTimeFormat('he-IL', { weekday: 'long', day: 'numeric', month: 'long' });

export function DashTab(props: { biz: string }) {
  const d = useHostData();
  const env = useHostEnv();
  const ui = useHostUi();
  const today = useToday();
  const nowMs = useNowMs(60_000);
  const setStatus = useApp((s) => s.setHostBookingStatus);
  const setUnitStatus = useApp((s) => s.setHostUnitStatus);
  const toast = useApp((s) => s.toast);
  const dash = useMemo(() => dashboardOf(d.units, d.bookings, d.records, today), [d.units, d.bookings, d.records, today]);
  const [drawn, setDrawn] = useState(false);
  useEffect(() => {
    const r = requestAnimationFrame(() => requestAnimationFrame(() => setDrawn(true)));
    return () => cancelAnimationFrame(r);
  }, []);

  const hour = new Date(nowMs).getHours();
  const [greet, sun] = greetingOf(hour);
  const C = 2 * Math.PI * 34;
  const off = C * (1 - dash.occPct / 100);
  const n = (v: number) => String(Math.round(v));
  const mx = Math.max(1, ...dash.series.map((s) => s.paid));

  const drow = (b: HostBooking, tag: ReactNode, av = '', sub?: ReactNode) => (
    <div key={b.id} className="h-drow" {...clickable(() => ui.open({ k: 'booking', id: b.id }))}>
      <div className={'h-avat' + (av ? ' h-' + av : '')}>{initialsOf(d.guestName(b.guestId))}</div>
      <div className="h-dinfo">
        <b>{d.guestName(b.guestId)}</b>
        <span>
          🏠 {d.unitName(b.unitId)}
          {sub}
        </span>
      </div>
      <div className="h-dact">{tag}</div>
    </div>
  );
  const none = <div className="h-empty">אין רשומות להיום</div>;

  return (
    <div className="h-dashfx">
      <div className="h-greet">
        <span className="h-sun">{sun}</span>
        <span className="h-gtxt">{greet + ', ' + props.biz}</span>
      </div>
      <div className="h-vsub" style={{ display: 'flex', alignItems: 'center', gap: 11, flexWrap: 'wrap' }}>
        {fmtDay.format(nowMs)} · תמונת-מצב חיה <LiveClock />
      </div>
      <div className="h-hero">
        <div className="h-hero-ring">
          <svg width="98" height="98" viewBox="0 0 98 98" role="img" aria-label={'תפוסה עכשיו ' + dash.occPct + '%'}>
            <defs>
              <linearGradient id="hst-occg" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0" stopColor="var(--h-brand)" />
                <stop offset="1" stopColor="var(--h-a2)" />
              </linearGradient>
            </defs>
            <circle cx="49" cy="49" r="34" fill="none" stroke="var(--h-line2)" strokeWidth="9" />
            <circle
              className="h-occ-arc"
              cx="49"
              cy="49"
              r="34"
              fill="none"
              stroke="url(#hst-occg)"
              strokeWidth="9"
              strokeLinecap="round"
              strokeDasharray={C.toFixed(1)}
              strokeDashoffset={(drawn ? off : C).toFixed(1)}
              transform="rotate(-90 49 49)"
            />
            <text x="49" y="54" textAnchor="middle" fontSize="21" fontWeight="800" fill="var(--h-ink)" fontFamily="JetBrains Mono, monospace">
              <CountUp to={dash.occPct} fmt={(v) => n(v) + '%'} />
            </text>
          </svg>
          <div className="h-hero-ringlab">תפוסה עכשיו</div>
        </div>
        <div className="h-hero-stats">
          <Stat em="🛏️" v={<CountUp to={dash.staying.length} fmt={n} />} l={env.terms.guests + ' כרגע'} />
          <Stat em="🛬" v={<CountUp to={dash.arrivals.length} fmt={n} />} l="הגעות היום" />
          <Stat em="🛫" v={<CountUp to={dash.departures.length} fmt={n} />} l="עזיבות היום" />
          <Stat em="💰" v={<CountUp to={dash.monthRevenue} fmt={money} />} l="הכנסות החודש" />
        </div>
      </div>
      <TodayPanel />
      <div className="h-kpis">
        <Kpi kc="var(--h-brand)" lab="תפוסה היום" val={<CountUp to={dash.occPct} fmt={(v) => n(v) + '%'} />} sub={dash.occN + ' מתוך ' + dash.unitsN + ' ' + env.terms.units} />
        <Kpi kc="var(--h-good)" lab="צ׳ק-אין היום" val={<CountUp to={dash.arrivals.length} fmt={n} />} sub="הגעות מתוכננות" />
        <Kpi kc="var(--h-info)" lab="צ׳ק-אאוט היום" val={<CountUp to={dash.departures.length} fmt={n} />} sub="עזיבות" />
        <Kpi kc="var(--h-warn)" lab={env.terms.units + ' לניקיון'} val={<CountUp to={dash.dirtyUnits.length} fmt={n} />} sub={dash.openTasks + ' משימות פתוחות'} />
        <Kpi kc="var(--h-crit)" lab="תשלומים פתוחים" val={<CountUp to={dash.openBal.length} fmt={n} />} sub={money(dash.openBalSum)} />
        <Kpi kc="var(--h-violet)" lab="הכנסות החודש" val={<CountUp to={dash.monthRevenue} fmt={money} />} sub="התקבל בפועל" />
      </div>
      <div className="h-two">
        <div className="h-panel">
          <h2>🗺️ מפת {env.terms.units}</h2>
          {d.units.length ? (
            <>
              <div className="h-umap">
                {d.units.map((u) => {
                  const s = dash.live[u.id];
                  return (
                    <div key={u.id} className={h('utile ' + U_LABEL[s][1])} {...clickable(() => ui.open({ k: 'unit', id: u.id }))}>
                      <b>{u.name}</b>
                      <small>{U_LABEL[s][0]}</small>
                    </div>
                  );
                })}
              </div>
              <div className="h-umap-lg">
                <span>
                  <i style={{ background: 'var(--h-good)' }} />
                  פנויה
                </span>
                <span>
                  <i style={{ background: 'var(--h-info)' }} />
                  תפוסה
                </span>
                <span>
                  <i style={{ background: 'var(--h-warn)' }} />
                  לניקיון
                </span>
                <span>
                  <i style={{ background: 'var(--h-crit)' }} />
                  חסומה
                </span>
              </div>
            </>
          ) : (
            <BigEmpty
              icon="🏠"
              title={'אין ' + env.terms.units + ' עדיין'}
              action={
                <button type="button" className={h('btn sm')} onClick={() => ui.open({ k: 'unit', id: null })}>
                  ＋ {env.terms.unit} ראשונה
                </button>
              }
            />
          )}
        </div>
        <div className="h-panel">
          <h2>📈 הכנסות · 6 חודשים</h2>
          <div className="h-spark">
            {dash.series.map((s, i) => {
              const hh = Math.max(4, Math.round((s.paid / mx) * 100));
              const hot = s.paid === mx && mx > 0 && s.paid > 0;
              return (
                <div key={s.ym} className="h-spark-col">
                  <div className="h-spark-val">{s.paid ? Math.round(s.paid / 1000) + 'K' : ''}</div>
                  <div className={'h-spark-b' + (hot ? ' h-hot' : '')} style={cssVar('h', hh + '%', cssVar('d', (i * 0.09).toFixed(2) + 's'))} title={money(s.paid)} />
                  <div className="h-spark-lab">{s.label}</div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
      <div className="h-two" style={{ marginTop: 16 }}>
        <div className="h-panel">
          <h2>🛬 הגעות היום</h2>
          {dash.arrivals.length
            ? dash.arrivals.map(({ b, late }) =>
                drow(
                  b,
                  <button
                    type="button"
                    className={h('btn sm')}
                    onClick={() => {
                      setStatus(b.id, 'in');
                    }}
                  >
                    צ׳ק-אין ←
                  </button>,
                  '',
                  late ? <LateTag txt={'באיחור · הגעה ' + b.checkIn.slice(8, 10) + '/' + +b.checkIn.slice(5, 7)} /> : null,
                ),
              )
            : none}
        </div>
        <div className="h-panel">
          <h2>🛫 עזיבות היום</h2>
          {dash.departures.length
            ? dash.departures.map(({ b, overdue }) =>
                drow(
                  b,
                  <button type="button" className={h('btn sm warnb')} onClick={() => setStatus(b.id, 'done')}>
                    צ׳ק-אאוט ←
                  </button>,
                  'v2',
                  overdue ? <LateTag txt={'עזיבה שעבר מועדה · ' + b.checkOut.slice(8, 10) + '/' + +b.checkOut.slice(5, 7)} /> : null,
                ),
              )
            : none}
        </div>
      </div>
      <div className="h-two" style={{ marginTop: 16 }}>
        <div className="h-panel">
          <h2>🧹 {env.terms.units} לניקיון</h2>
          {dash.dirtyUnits.length ? (
            dash.dirtyUnits.map((u) => (
              <div
                key={u.id}
                className="h-drow"
                {...clickable(() => {
                  if (setUnitStatus(u.id, 'free')) toast('סומן נקייה ✓');
                })}
              >
                <div className="h-avat h-v2">{initialsOf(u.name)}</div>
                <div className="h-dinfo">
                  <b>{u.name}</b>
                  <span>ממתינה לניקיון</span>
                </div>
                <div className="h-dact">
                  <Pill cls="u-dirty" color="var(--h-warn)">
                    מלוכלכת
                  </Pill>
                </div>
              </div>
            ))
          ) : (
            <div className="h-empty">כל ה{env.terms.units} נקיות ✨</div>
          )}
        </div>
        <div className="h-panel">
          <h2>💳 יתרות פתוחות</h2>
          {dash.openBal.length ? (
            dash.openBal.map((b) =>
              drow(
                b,
                <b className="h-mono" style={{ color: 'var(--h-crit)', fontSize: 14 }}>
                  {money(bookingBalance(b))}
                </b>,
                'v3',
                b.status === 'done' ? ' · אחרי עזיבה' : null,
              ),
            )
          ) : (
            <div className="h-empty">אין חובות פתוחים ✨</div>
          )}
        </div>
      </div>
    </div>
  );
}

function Stat(props: { em: string; v: ReactNode; l: string }) {
  return (
    <div className="h-statchip">
      <div className="h-em">{props.em}</div>
      <div className="h-v">{props.v}</div>
      <div className="h-l">{props.l}</div>
    </div>
  );
}

function LateTag(props: { txt: string }) {
  return <span style={{ color: 'var(--h-crit)', fontWeight: 800 }}>{' · ⏰ ' + props.txt}</span>;
}
