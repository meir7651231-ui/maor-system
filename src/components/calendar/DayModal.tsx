/**
 * תצוגת יום — מודאל הנפתח בלחיצה על תא ברשת החודש: כותרת עברית ולועזית,
 * באנר יום חסום, כל שכבות היום (חג · אירועים · ימי הולדת · הצטרפויות ·
 * הרשמות · מפגשי חוגים) לפי הפילטרים, חצי יום קודם/הבא והוספת אירוע חדש.
 */
import { useMemo, type CSSProperties } from 'react';
import { useApp } from '../../store/useApp';
import { featureOn } from '../../lib/config';
import { Btn, Empty, Modal } from '../ui';
import { hebDateFull, holidayOf } from '../../lib/hebrew';
import type { OrgEvent } from '../../types/domain';
import {
  allowItem,
  blockReason,
  dayItems,
  HOLIDAY_META,
  isoOf,
  type CalFilters,
  type DayItem,
} from './calLib';

const fmtLong = new Intl.DateTimeFormat('he', {
  weekday: 'long',
  day: 'numeric',
  month: 'long',
  year: 'numeric',
});
const fmtWeekday = new Intl.DateTimeFormat('he', { weekday: 'long' });

const rowChip = (bg: string, c: string, prC: string): CSSProperties => ({
  display: 'inline-block',
  padding: '3px 10px',
  borderRadius: 8,
  fontSize: 12.5,
  fontWeight: 700,
  background: bg,
  color: c,
  borderRight: '3px solid ' + prC,
  maxWidth: '100%',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
});

export function DayModal(props: {
  /** היום המוצג (ISO). */
  iso: string;
  /** פילטרי השכבות של הלוח — תצוגת היום מכבדת אותם. */
  filters: CalFilters;
  onClose: () => void;
  /** מעבר ליום אחר (חצים קודם/הבא). */
  onShift: (iso: string) => void;
  /** פתיחת אירוע חדש עם התאריך הזה. */
  onAdd: (iso: string) => void;
  /** פתיחת עריכת אירוע קיים. */
  onEdit: (ev: OrgEvent) => void;
}) {
  const { iso, filters, onClose, onShift, onAdd, onEdit } = props;
  const db = useApp((s) => s.db);
  const config = useApp((s) => s.config);
  const selectCourse = useApp((s) => s.selectCourse);
  const selectFamily = useApp((s) => s.selectFamily);

  const d = useMemo(() => new Date(iso + 'T12:00:00'), [iso]);
  const items = useMemo(() => dayItems(db, d).filter((it) => allowItem(it, filters)), [db, d, filters]);
  // שכבת החגים — מכובדת גם בתצוגת היום (מוסתרת כשהשכבה כבויה)
  const holiday = filters.holidays ? holidayOf(d) : null;
  // calendar.blocking כבוי — באנר "יום חסום" מוסתר
  const block = featureOn(config, 'calendar.blocking') ? blockReason(d, 'course') : null;

  // "כל היום": חג + השכבות ללא שעה (ימי הולדת · הצטרפויות · הרשמות)
  const allDay = items.filter((it) => it.sort === 2 || it.sort === 2.4 || it.sort === 2.6);
  // שעת הפריט — משדה האירוע או מתחילת התווית (HH:MM · …), כמו במקור
  const timeKey = (it: DayItem): string => {
    if (it.ev) return it.ev.time || '99:99';
    const m = /^(\d{1,2}:\d{2}) · /.exec(it.label);
    return m ? m[1] : '99:99';
  };
  // שורות עם שעה: אירועים (כולל דחופים) ומפגשי חוגים, ממוינות לפי השעה
  const rows = items
    .filter((it) => it.sort === 0.5 || it.sort === 1 || it.sort === 3)
    .sort((a, b) => timeKey(a).localeCompare(timeKey(b)));
  const count = allDay.length + rows.length + (holiday ? 1 : 0);

  function shift(n: number) {
    const nd = new Date(d);
    nd.setDate(nd.getDate() + n);
    onShift(isoOf(nd));
  }

  function go(it: DayItem) {
    if (it.ev) {
      onEdit(it.ev);
      return;
    }
    if (it.layer === 'enroll' || it.courseId) {
      if (it.courseId) selectCourse(it.courseId);
      onClose();
      return;
    }
    if (it.famId) {
      selectFamily(it.famId);
      onClose();
    }
  }

  return (
    <Modal title={fmtLong.format(d)} onClose={onClose}>
      <div style={{ fontSize: 13.5, fontWeight: 700, color: '#9a6414', marginBottom: 10 }}>
        <span style={{ color: 'var(--amber-deep)' }}>✦</span> {fmtWeekday.format(d)}, {hebDateFull(iso)}
      </div>

      <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap', marginBottom: 12 }}>
        <Btn sm onClick={() => shift(-1)} title="יום קודם">
          › יום קודם
        </Btn>
        <Btn sm onClick={() => shift(1)} title="יום הבא">
          יום הבא ‹
        </Btn>
        <span style={{ fontSize: 12.5, color: 'var(--ink-faint)', fontWeight: 600 }}>
          {count} אירועים ביום זה
        </span>
        <span style={{ flex: 1 }} />
        <Btn kind="primary" sm onClick={() => onAdd(iso)}>
          + אירוע חדש
        </Btn>
      </div>

      {block && (
        <div
          style={{
            background: '#fdeaea',
            color: '#b91c1c',
            border: '1px solid #f5c9c9',
            borderRadius: 10,
            padding: '8px 12px',
            fontSize: 12.5,
            fontWeight: 700,
            marginBottom: 10,
          }}
        >
          היום חסום לתזמון חוגים: {block}
        </div>
      )}

      {(holiday || allDay.length > 0) && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 12 }}>
          {holiday && (
            <span style={rowChip(HOLIDAY_META.bg, HOLIDAY_META.c, 'transparent')} title={holiday}>
              {holiday}
            </span>
          )}
          {allDay.map((it) => (
            <button
              key={it.key}
              type="button"
              title={it.title}
              onClick={() => go(it)}
              style={{ ...rowChip(it.bg, it.c, 'transparent'), cursor: 'pointer' }}
            >
              {it.label}
            </button>
          ))}
        </div>
      )}

      <div style={{ border: '1px solid var(--line)', borderRadius: 14, overflow: 'hidden' }}>
        {rows.length === 0 && !holiday && allDay.length === 0 && <Empty>אין אירועים ביום זה</Empty>}
        {rows.map((it) => (
          <div
            key={it.key}
            style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '8px 14px', borderBottom: '1px solid #ece7db' }}
          >
            <span style={{ width: 46, flex: 'none', fontWeight: 800, fontSize: 13 }}>
              {timeKey(it) === '99:99' ? '—' : timeKey(it)}
            </span>
            <span
              style={{ ...rowChip(it.bg, it.c, it.prC), flex: 1, cursor: 'pointer', textAlign: 'right',
                ...(it.skipped || it.ev?.done ? { textDecoration: 'line-through', opacity: 0.55 } : null) }}
              title={it.title}
              role="button"
              tabIndex={0}
              onClick={() => go(it)}
              onKeyDown={(e) => e.key === 'Enter' && go(it)}
            >
              {it.label}
            </span>
            <span style={{ fontSize: 11, color: 'var(--ink-faint)', fontWeight: 600, whiteSpace: 'nowrap' }}>
              {it.typeLabel}
            </span>
            {it.ev && (
              <Btn sm onClick={() => onEdit(it.ev as OrgEvent)} title="עריכת האירוע">
                עריכה
              </Btn>
            )}
            {!it.ev && it.courseId && (
              <Btn
                sm
                onClick={() => {
                  selectCourse(it.courseId as string);
                  onClose();
                }}
                title="מעבר לכרטיס החוג"
              >
                לניקוב ←
              </Btn>
            )}
          </div>
        ))}
      </div>
    </Modal>
  );
}
