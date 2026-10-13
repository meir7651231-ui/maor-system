/**
 * 🏡 🗂️ מרכז ההזמנות (viewRes של המקור): 5 KPI, חיפוש (אורח/יחידה/טלפון), צ׳יפי-סטטוס עם מונים, כרטיסי-CRM עם
 * סרט-סטטוס, תאריכים, לילות, נפשות, סה״כ וחוב/שולם; ✓ צ׳ק-אין · 🚪 צ׳ק-אאוט · 💬 (הרחבת-וואטסאפ) · 📄 כרטיס.
 * זיכרון-סינון (useRemembered); הכרטיס נפתח כמודאל מעל הרשימה (המיקום נשמר מעצמו).
 */
import { useMemo } from 'react';
import { useApp } from '../../store/useApp';
import { useRemembered } from '../../lib/filterMemory';
import { waHref } from '../../lib/wa';
import { useHostData, useHostEnv, useToday } from './hooks';
import { Kpi, clickable, cssVar, h, useHostUi } from './hui';
import { HOST_BOOKING_FILTERS, bookingBalance, bookingCounts, bookingParty, bookingTotal, bookingsKpis, bookingsView, fmtDM, initialsOf, money, nightsBetween, roomsLabel, type HostBookingFilter } from './lib';
import { RES_ST, tint } from './labels';
import { StayHebDates } from './SwitchPanels';

/** `hebDates` (ENGINEBOX-SOCKETS, ברירה false): התאריכים העבריים של השהייה מהלוח של אורביט (calendar.dayInfo) לצד הרגילים. */
export function BookingsTab(props: { hebDates?: boolean } = {}) {
  const d = useHostData();
  const env = useHostEnv();
  const ui = useHostUi();
  const today = useToday();
  const toast = useApp((s) => s.toast);
  const setStatus = useApp((s) => s.setHostBookingStatus);
  const [q, setQ] = useRemembered<string>('hosting.res.q', '');
  const [filter, setFilter] = useRemembered<HostBookingFilter>('hosting.res.f', 'all');
  const k = useMemo(() => bookingsKpis(d.bookings, today), [d.bookings, today]);
  const counts = useMemo(() => bookingCounts(d.bookings), [d.bookings]);
  const list = useMemo(() => bookingsView(d.bookings, filter, q, d.guestOf, d.unitOf), [d.bookings, filter, q, d.guestOf, d.unitOf]);
  const t = env.terms;

  function newBooking() {
    if (!d.units.length) {
      toast('הוסיפו ' + t.unit + ' קודם');
      ui.go('units');
      return;
    }
    if (!d.guests.length) {
      toast('הוסיפו ' + t.guest + ' קודם');
      ui.go('guests');
      return;
    }
    ui.open({ k: 'booking', id: null });
  }

  return (
    <>
      <h1 className="h-vh">🗂️ מרכז ה{t.bookings}</h1>
      <div className="h-vsub">
        {d.bookings.length} {t.bookings} · לחיצה לכרטיס מלא
      </div>
      <div className="h-kpis">
        <Kpi kc="var(--h-good)" lab="🛬 הגעות היום" val={k.arrivals} sub="ממתינות לצ׳ק-אין" />
        <Kpi kc="var(--h-warn)" lab="🛫 עזיבות היום" val={k.departures} sub="לצ׳ק-אאוט" />
        <Kpi kc="var(--h-info)" lab="🏠 בבית כעת" val={k.inHouse} sub="שוהים" />
        <Kpi kc="var(--h-brand)" lab="💰 הכנסת החודש" val={money(k.monthCharged)} />
        <Kpi kc="var(--h-crit)" lab="🧾 לגבייה" val={money(k.owed)} sub="יתרות פתוחות" />
      </div>
      <div className="h-fbar">
        <input
          className="h-fsearch"
          aria-label={'חיפוש ' + t.bookings}
          placeholder={'🔍 חיפוש לפי ' + t.guest + ', ' + t.unit + ' או טלפון…'}
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
        <button type="button" className={h('btn')} onClick={newBooking}>
          ＋ {t.booking} חדשה
        </button>
      </div>
      <div className="h-repchips">
        {HOST_BOOKING_FILTERS.map(([f, lab]) => (
          <button key={f} type="button" className={'h-repchip' + (filter === f ? ' h-on' : '')} onClick={() => setFilter(f)}>
            {lab} <span style={{ opacity: 0.6, fontFamily: 'JetBrains Mono, monospace' }}>{counts[f]}</span>
          </button>
        ))}
      </div>
      <div className="h-crmgrid">
        {list.length ? (
          list.map((b) => {
            const st = RES_ST[b.status];
            const sc = st[2];
            const g = d.guestOf(b.guestId);
            const u = d.unitOf(b.unitId);
            const rl = roomsLabel(u, b.roomIds);
            const bal = bookingBalance(b);
            const wa = env.wa && g?.phone ? waHref(g.phone, '', env.waApp) : null;
            const inWindow = b.checkIn <= today && b.checkOut > today;
            return (
              <div key={b.id} className="h-crmc" style={cssVar('sc', sc)} {...clickable(() => ui.open({ k: 'booking', id: b.id }))}>
                <div className="h-crm-top">
                  <div className="h-crm-av" style={cssVar('sc', sc)}>
                    {initialsOf(g?.name ?? '—')}
                  </div>
                  <div>
                    <div className="h-crm-nm">{g?.name ?? '—'}</div>
                    <div className="h-crm-sub">
                      🏠 {u?.name ?? '—'}
                      {rl ? ' · ' + rl : ''}
                    </div>
                  </div>
                  <span className="h-crm-rib" style={{ color: sc, background: tint(sc, 15) }}>
                    {st[0]}
                  </span>
                </div>
                <div className="h-crm-meta">
                  <span>
                    📅 <b>{fmtDM(b.checkIn) + ' – ' + fmtDM(b.checkOut)}</b>
                    {props.hebDates === true && <StayHebDates b={b} />}
                  </span>
                  <span>
                    🌙 <b>{nightsBetween(b.checkIn, b.checkOut)}</b> לילות
                  </span>
                  <span>
                    👪 <b>{bookingParty(b)}</b>
                  </span>
                </div>
                <div className="h-crm-foot">
                  <span className="h-crm-tot">{money(bookingTotal(b))}</span>
                  {bal > 0 ? (
                    <span className="h-crm-bal" style={{ color: 'var(--h-crit)', background: tint('var(--h-crit)', 14) }}>
                      חוב {money(bal)}
                    </span>
                  ) : (
                    <span className="h-crm-bal" style={{ color: 'var(--h-good)', background: tint('var(--h-good)', 14) }}>
                      שולם ✓
                    </span>
                  )}
                </div>
                <div className="h-crm-acts">
                  {b.status === 'confirmed' && inWindow ? (
                    <button type="button" className={h('crm-ab g')} onClick={() => setStatus(b.id, 'in')}>
                      ✓ צ׳ק-אין
                    </button>
                  ) : b.status === 'in' ? (
                    <button type="button" className={h('crm-ab g')} onClick={() => setStatus(b.id, 'done')}>
                      🚪 צ׳ק-אאוט
                    </button>
                  ) : null}
                  {wa && (
                    <a className={h('crm-ab wa')} href={wa.href} {...(wa.app ? {} : { target: '_blank', rel: 'noopener noreferrer' })} aria-label={'וואטסאפ אל ' + (g?.name ?? '')}>
                      💬
                    </a>
                  )}
                  <button type="button" className="h-crm-ab" onClick={() => ui.open({ k: 'booking', id: b.id })}>
                    📄 כרטיס
                  </button>
                </div>
              </div>
            );
          })
        ) : (
          <div className="h-repempty" style={{ gridColumn: '1/-1' }}>
            אין {t.bookings} תואמות 📭
          </div>
        )}
      </div>
    </>
  );
}
