/**
 * בורר-תאריך בסגנון הלוח המרכזי (בקשת-בעלים) — לוח-שנה גדול וריק לבחירת
 * תאריך (ואופציונלית שעה), לועזי או עברי. במקום הבוררים הקטנים: מודאל עם
 * גריד-חודש מלא (7 עמודות), ניווט חודש ‹ ›, החלפת לוח, וציון היום והבחירה.
 *
 * מנוע הגריד = buildMonthGrid המשותף (אותו חישוב של הלוח הראשי, קופות וחנות),
 * מוזן ברשימת-אירועים ריקה ⇒ "לוח ריק". הערך כלפי חוץ תמיד ISO לועזי.
 */
import { useState, type JSX } from 'react';
import { buildMonthGrid } from '../lib/monthGrid';
import { DAY_NAMES } from './calendar/calLib';
import { isoToday } from '../lib/date-util';
import { hebDateFull } from '../lib/hebrew';
import { Btn, Chip, Modal } from './ui';

function fmtGreg(iso: string): string {
  const [y, m, d] = iso.split('-');
  return `${d}/${m}/${y}`;
}

export function CalendarPicker(props: {
  value: string;
  onPick: (iso: string) => void;
  onClose: () => void;
  /** אם מוגדר (כולל '') — מוצגת שורת-שעה; onTime מחזיר 'HH:MM'. */
  time?: string;
  onTime?: (t: string) => void;
  title?: string;
}): JSX.Element {
  const withTime = props.time !== undefined;
  const [hebMode, setHebMode] = useState(true);
  const [sel, setSel] = useState(props.value || '');
  const [time, setTime] = useState(props.time ?? '');
  // עוגן-החודש המוצג — מתחיל בבחירה/היום, זז עם הניווט.
  const [anchor, setAnchor] = useState(props.value || isoToday());
  const grid = buildMonthGrid([], anchor, hebMode);
  const today = isoToday();

  const pickDay = (iso: string) => {
    setSel(iso);
    // בלי שעה — בחירת יום סוגרת מיד; עם שעה — נשארים לבחירת השעה ואישור.
    if (!withTime) {
      props.onPick(iso);
      props.onClose();
    }
  };

  const confirm = () => {
    if (sel) props.onPick(sel);
    if (withTime) props.onTime?.(time);
    props.onClose();
  };

  return (
    <Modal wide title={props.title ?? '📅 בחירת תאריך מהלוח'} onClose={props.onClose}>
      <div style={{ display: 'flex', gap: 6, marginBottom: 10 }}>
        <Chip on={hebMode} onClick={() => setHebMode(true)}>
          עברי
        </Chip>
        <Chip on={!hebMode} onClick={() => setHebMode(false)}>
          לועזי
        </Chip>
      </div>

      {/* כותרת החודש + ניווט (‹ הבא · הקודם › בכיווניות עברית) */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
        <Btn sm onClick={() => setAnchor(grid.nextIso)} title="החודש הבא">
          ›
        </Btn>
        <div style={{ flex: 1, textAlign: 'center' }}>
          <div style={{ fontSize: 15, fontWeight: 800 }}>{grid.label}</div>
          <div style={{ fontSize: 12, color: 'var(--ink-faint)' }}>{grid.subLabel}</div>
        </div>
        <Btn sm onClick={() => setAnchor(grid.prevIso)} title="החודש הקודם">
          ‹
        </Btn>
      </div>

      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)' }}>
          {DAY_NAMES.map((n) => (
            <div
              key={n}
              style={{
                padding: 6,
                textAlign: 'center',
                fontSize: 12,
                fontWeight: 600,
                color: 'var(--ink-faint)',
                background: '#faf8f2',
              }}
            >
              {n}
            </div>
          ))}
          {grid.cells.map((cell) => {
            const isSel = cell.iso === sel;
            const isToday = cell.iso === today;
            return (
              <button
                key={cell.iso}
                type="button"
                onClick={() => pickDay(cell.iso)}
                title={hebDateFull(cell.iso) + ' · ' + fmtGreg(cell.iso)}
                style={{
                  minHeight: 52,
                  border: '1px solid var(--line-soft)',
                  background: isSel ? 'var(--accent)' : cell.inMonth ? 'var(--panel)' : 'var(--bg)',
                  color: isSel ? 'var(--dark, #211d17)' : cell.inMonth ? 'var(--ink)' : 'var(--ink-faint)',
                  cursor: 'pointer',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 1,
                  padding: 4,
                  opacity: cell.inMonth ? 1 : 0.5,
                  outline: isToday && !isSel ? '2px solid var(--accent)' : undefined,
                  outlineOffset: -2,
                }}
              >
                <span style={{ fontSize: 15, fontWeight: 800 }}>{hebMode ? cell.hebDay : cell.dayNum}</span>
                <span style={{ fontSize: 10, opacity: 0.75 }}>{hebMode ? cell.dayNum : cell.hebDay}</span>
                {cell.holiday && (
                  <span
                    style={{
                      fontSize: 8.5,
                      lineHeight: 1.1,
                      fontWeight: 700,
                      color: isSel ? 'inherit' : cell.fullHoliday ? 'var(--red)' : 'var(--accent-deep, var(--accent))',
                      maxWidth: '100%',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {cell.holiday}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {withTime && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 12 }}>
          <span style={{ fontSize: 13, fontWeight: 700 }}>🕐 שעה</span>
          <input
            type="time"
            dir="ltr"
            value={time}
            onChange={(e) => setTime(e.target.value)}
            style={{ fontSize: 14, padding: '6px 8px' }}
          />
        </div>
      )}

      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 12 }}>
        <div style={{ flex: 1, fontSize: 13, color: 'var(--ink-soft)', fontWeight: 600 }}>
          {sel ? hebDateFull(sel) + ' · ' + fmtGreg(sel) + (withTime && time ? ' · ' + time : '') : 'בחרו יום מהלוח'}
        </div>
        <Btn sm onClick={() => { setAnchor(today); setSel(today); if (!withTime) { props.onPick(today); props.onClose(); } }}>
          היום
        </Btn>
        {withTime && (
          <Btn sm kind="primary" onClick={confirm} disabled={!sel}>
            בחירה
          </Btn>
        )}
      </div>
    </Modal>
  );
}
