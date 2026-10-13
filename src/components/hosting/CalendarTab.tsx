/**
 * 🏡 📅 יומן תפוסה (renderCal של המקור): גריד יחידות×ימים, שישי-שבת מודגשים, פס לכל הזמנה בצבע-הסטטוס עם נתיבים
 * לחפיפות-חדרים, לחיצה על פס ⇒ כרטיס, על תא ריק ⇒ הזמנה חדשה ביחידה+תאריך. ⬆ שבת/יו״ט מהלוח העברי הקיים
 * (calendarMonth מעל lib/monthGrid) + מעבר עברי↔לועזי. hosting.calendar.
 */
import { useMemo } from 'react';
import { useApp } from '../../store/useApp';
import { useRemembered } from '../../lib/filterMemory';
import { useHostData, useHostEnv, useToday } from './hooks';
import { BigEmpty, clickable, h, useHostUi } from './hui';
import { calendarBars, calendarMonth } from './lib';

export function CalendarTab() {
  const d = useHostData();
  const env = useHostEnv();
  const ui = useHostUi();
  const today = useToday();
  const toast = useApp((s) => s.toast);
  const [anchor, setAnchor] = useRemembered<string>('hosting.cal.anchor', today);
  const [heb, setHeb] = useRemembered<boolean>('hosting.cal.heb', false);
  const month = useMemo(() => calendarMonth(anchor, heb, today), [anchor, heb, today]);
  const isos = useMemo(() => month.days.map((x) => x.iso), [month]);
  const { bars, lanes } = useMemo(() => calendarBars(d.units, d.bookings, isos, d.guestName), [d.units, d.bookings, isos, d.guestName]);
  const t = env.terms;

  function newBooking(pre?: { unitId?: string; checkIn?: string }) {
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
    ui.open({ k: 'booking', id: null, pre });
  }

  if (!d.units.length) {
    return (
      <>
        <h1 className="h-vh">יומן תפוסה</h1>
        <BigEmpty
          icon="📅"
          title={'אין ' + t.units + ' להצגה'}
          sub={'הוסיפו ' + t.units + ' כדי לראות את לוח-התפוסה'}
          action={
            <button type="button" className={h('btn')} onClick={() => ui.open({ k: 'unit', id: null })}>
              ＋ הוסף {t.unit}
            </button>
          }
        />
      </>
    );
  }

  const days = month.days.length;
  return (
    <>
      <h1 className="h-vh">יומן תפוסה</h1>
      <div className="h-rowbtn">
        <button type="button" className={h('btn ghost sm')} onClick={() => setAnchor(month.prevIso)}>
          ‹ קודם
        </button>
        <b style={{ minWidth: 150, textAlign: 'center' }}>{month.label}</b>
        <button type="button" className={h('btn ghost sm')} onClick={() => setAnchor(month.nextIso)}>
          הבא ›
        </button>
        <button type="button" className={h('btn sm')} onClick={() => setAnchor(today)}>
          היום
        </button>
        <button type="button" className={h('btn ghost sm')} onClick={() => setHeb(!heb)} title="מעבר בין לוח עברי ללועזי">
          {heb ? '📅 לועזי' : '✡️ עברי'}
        </button>
        <span style={{ flex: 1 }} />
        <button type="button" className={h('btn')} onClick={() => newBooking()}>
          ＋ {t.booking} חדשה
        </button>
      </div>
      <div className="h-cal">
        <div className="h-calgrid" style={{ gridTemplateColumns: '90px repeat(' + days + ',1fr)' }}>
          <div className="h-hd" style={{ position: 'sticky', right: 0, zIndex: 3 }}>
            {t.unit}
          </div>
          {month.days.map((x) => (
            <div
              key={x.iso}
              className={'h-hd' + (x.weekend ? ' h-wknd' : '') + (x.sacred ? ' h-sacred' : '') + (x.today ? ' h-today' : '')}
              title={x.sacred || x.holiday || undefined}
            >
              {x.head}
              <small>{x.sub}</small>
            </div>
          ))}
          {d.units.map((u) => {
            const rowH = Math.max(38, (lanes[u.id] ?? 1) * 19 + 6);
            const ubars = bars.filter((b) => b.unitId === u.id);
            return [
              <div key={u.id + ':n'} className="h-unitname" style={{ minHeight: rowH }}>
                {u.name}
                <small>
                  {u.type} · {u.cap} {t.guests}
                  {u.subRooms.length ? ' · ' + u.subRooms.length + ' חדרים' : ''}
                </small>
              </div>,
              ...month.days.map((x, i) => (
                <div
                  key={u.id + ':' + x.iso}
                  className={'h-cell' + (x.weekend ? ' h-wknd' : '') + (x.sacred ? ' h-sacred' : '')}
                  style={{ minHeight: rowH }}
                  aria-label={t.booking + ' חדשה · ' + u.name + ' · ' + x.iso}
                  {...clickable(() => newBooking({ unitId: u.id, checkIn: x.iso }))}
                >
                  {ubars
                    .filter((b) => b.start === i)
                    .map((b) => (
                      <div
                        key={b.id}
                        className={'h-calbar h-b-' + b.status}
                        style={{
                          right: 3,
                          width: 'calc(' + b.span * 100 + '% + ' + (b.span - 1) + 'px - 6px)',
                          top: 4 + b.lane * 19,
                          bottom: 'auto',
                          height: 15,
                        }}
                        title={b.label}
                        {...clickable(() => ui.open({ k: 'booking', id: b.id }))}
                      >
                        {b.label}
                      </div>
                    ))}
                </div>
              )),
            ];
          })}
        </div>
      </div>
    </>
  );
}
