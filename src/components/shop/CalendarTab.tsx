/**
 * 📅 הלוח הייעודי של החנות (חנות 7) — קורא db.shopEvents בלבד; שום כתיבה
 * ללוח הראשי (בידוד — הכרעת בעלים 30.7). נפתח בעברי, מתג לועזי, ניווט
 * חודשים + "היום"; על הגנרי המשותף buildMonthGrid. בתאי חג — צ'יפ
 * "🎁 N ממתינות" (אותה שאלה של holidayDue ב-needsCare, פר-תא).
 */
import { useMemo, useState } from 'react';
import { useApp } from '../../store/useApp';
import { isoToday } from '../../lib/date-util';
import type { ShopEvent } from '../../types/domain';
import { Btn } from '../ui';
import { DAY_NAMES, PRIORITY_COLOR, SESSION_META } from '../calendar/calLib';
import { buildMonthGrid } from '../../lib/monthGrid';
import { assignmentRedeemed } from './lib';
import { ShopEventModal } from './ShopEventModal';

/** צבעי הסוגים — reuse מקבועי הלוח הראשי. */
function kindColors(kind: ShopEvent['kind']): { bg: string; c: string } {
  if (kind === 'meeting') return { bg: SESSION_META.bg, c: SESSION_META.c };
  if (kind === 'delivery') return { bg: '#fdeaea', c: PRIORITY_COLOR.red ?? '#b91c1c' };
  if (kind === 'holiday') return { bg: '#fdf1d4', c: PRIORITY_COLOR.orange ?? '#9a6414' };
  return { bg: '#e7edf5', c: '#3a5a86' };
}

const KIND_LABEL: Record<ShopEvent['kind'], string> = {
  meeting: 'פגישה',
  delivery: 'מסירה',
  holiday: 'חג',
  custom: 'אחר',
};

export function CalendarTab() {
  const db = useApp((s) => s.db);
  const shopEvents = useApp((s) => s.db.shopEvents);
  // נפתח בעברי — כמו הלוח הראשי בקובץ החי
  const [heb, setHeb] = useState(true);
  const [anchor, setAnchor] = useState(isoToday());
  const [dayIso, setDayIso] = useState<string | null>(null);
  const [modal, setModal] = useState<{ ev: ShopEvent | null; date: string } | null>(null);

  const grid = useMemo(() => buildMonthGrid(shopEvents, anchor, heb), [shopEvents, anchor, heb]);
  const dayEvents = dayIso ? shopEvents.filter((e) => e.date === dayIso) : [];

  // "🎁 N ממתינות" לתא-חג — שיוך פעיל עם מתנת-חג שטרם מומשה לאותו חג
  function pendingGifts(iso: string, holiday: string): number {
    let n = 0;
    for (const a of db.shopAssignments) {
      if (a.status !== 'active') continue;
      const p = db.shopProducts.find((x) => x.id === a.productId);
      for (const c of p?.components ?? [])
        if (c.kind === 'holidayGift' && !assignmentRedeemed(a, c.id, { iso, name: holiday })) n++;
    }
    return n;
  }

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10, flexWrap: 'wrap' }}>
        <Btn sm onClick={() => setAnchor(grid.prevIso)}>‹ הקודם</Btn>
        <Btn sm onClick={() => setAnchor(isoToday())}>היום</Btn>
        <Btn sm onClick={() => setAnchor(grid.nextIso)}>הבא ›</Btn>
        <div style={{ fontWeight: 800, fontSize: 16 }}>{grid.label}</div>
        <div style={{ fontSize: 12.5, color: 'var(--ink-faint)' }}>{grid.subLabel}</div>
        <span style={{ marginInlineStart: 'auto' }}>
          <Btn sm onClick={() => setHeb((v) => !v)}>{heb ? 'ללועזי' : 'לעברי'}</Btn>
        </span>
      </div>

      <div className="card" style={{ padding: 8 }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 4, fontSize: 11.5, fontWeight: 700, color: 'var(--ink-faint)', marginBottom: 4 }}>
          {DAY_NAMES.map((d) => (
            <div key={d} style={{ textAlign: 'center' }}>{d}</div>
          ))}
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 4 }}>
          {grid.cells.map((cell) => {
            const gifts = cell.holiday ? pendingGifts(cell.iso, cell.holiday) : 0;
            return (
              <button
                key={cell.iso}
                type="button"
                onClick={() => setDayIso(cell.iso)}
                style={{
                  minHeight: 64,
                  border: '1px solid var(--line)',
                  borderRadius: 8,
                  padding: 4,
                  textAlign: 'right',
                  background: cell.iso === isoToday() ? '#fdf1d4' : 'var(--panel)',
                  opacity: cell.inMonth ? 1 : 0.45,
                  cursor: 'pointer',
                }}
                title={cell.holiday ?? undefined}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11 }}>
                  <b>{heb ? cell.hebDay : cell.dayNum}</b>
                  <span style={{ color: 'var(--ink-faint)' }}>{heb ? cell.dayNum : cell.hebDay}</span>
                </div>
                {cell.holiday && (
                  <div style={{ fontSize: 10, color: cell.fullHoliday ? '#b91c1c' : '#9a6414', overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>
                    {cell.holiday}
                  </div>
                )}
                {gifts > 0 && (
                  <div style={{ fontSize: 10.5, fontWeight: 700, background: '#fdeaea', color: '#b91c1c', borderRadius: 5, padding: '1px 4px', marginTop: 2 }}>
                    {'🎁 ' + gifts + ' ממתינות'}
                  </div>
                )}
                {cell.events.slice(0, 3).map((ev) => {
                  const col = kindColors(ev.kind);
                  return (
                    <div
                      key={ev.id}
                      style={{
                        fontSize: 10.5,
                        fontWeight: 600,
                        background: col.bg,
                        color: col.c,
                        borderRadius: 5,
                        padding: '1px 4px',
                        marginTop: 2,
                        overflow: 'hidden',
                        whiteSpace: 'nowrap',
                        textOverflow: 'ellipsis',
                        textDecoration: ev.done ? 'line-through' : undefined,
                      }}
                    >
                      {(ev.time ? ev.time + ' · ' : '') + ev.title}
                    </div>
                  );
                })}
                {cell.events.length > 3 && <div style={{ fontSize: 10, color: 'var(--ink-faint)' }}>+{cell.events.length - 3}</div>}
              </button>
            );
          })}
        </div>
      </div>

      {dayIso && (
        <section className="card" style={{ marginTop: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
            <h2 style={{ fontSize: 15, fontWeight: 800 }}>{dayIso}</h2>
            <Btn kind="primary" sm onClick={() => setModal({ ev: null, date: dayIso })}>
              ➕ הוספת אירוע
            </Btn>
          </div>
          {dayEvents.length === 0 && <div style={{ fontSize: 12.5, color: 'var(--ink-faint)' }}>אין אירועים ביום זה</div>}
          {dayEvents.map((ev) => {
            const col = kindColors(ev.kind);
            return (
              <button
                key={ev.id}
                type="button"
                onClick={() => setModal({ ev, date: ev.date })}
                style={{ display: 'flex', gap: 8, alignItems: 'center', width: '100%', textAlign: 'right', padding: '6px 8px', border: '1px solid var(--line)', borderRadius: 8, marginBottom: 4, cursor: 'pointer', background: 'var(--panel)' }}
              >
                <span style={{ fontSize: 11.5, fontWeight: 700, background: col.bg, color: col.c, borderRadius: 99, padding: '2px 8px' }}>
                  {KIND_LABEL[ev.kind]}
                </span>
                <span style={{ fontSize: 13, textDecoration: ev.done ? 'line-through' : undefined }}>
                  {(ev.time ? ev.time + ' · ' : '') + ev.title}
                </span>
              </button>
            );
          })}
        </section>
      )}

      {modal && <ShopEventModal ev={modal.ev} date={modal.date} onClose={() => setModal(null)} />}
    </div>
  );
}
