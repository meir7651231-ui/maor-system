/**
 * יומן חדרים ונוכחות — בחירת חדר (חדרים פעילים) ותאריך; לוח היום של החדר
 * במשבצות לפי הגדרות החדר; פאנל נוכחות לכל מפגש; ניצולת שבועית לכל חדר;
 * ואזהרה על חוגים המשויכים לחדר לא פעיל.
 */
import { useState } from 'react';
import { useApp } from '../../store/useApp';
import { featureOn } from '../../lib/config';
import { hebDateFull } from '../../lib/hebrew';
import { Btn, Chip, Empty, PageHead, TextInput } from '../ui';
import {
  DAY_NAMES,
  buildSlots,
  blockReason,
  chipStyle,
  enrollmentsForSession,
  fmtDate,
  inactiveRoomCourses,
  isoToday,
  localIso,
  roomInfoLabel,
  weeklyRoomSessions,
} from './lib';
import { AttendancePanel } from './AttendancePanel';
import { EventModal } from '../calendar/EventModal';

/** הזמנת משבצת פנויה — הנתונים המוזרקים למודאל האירוע. */
interface Booking {
  date: string;
  time: string;
  roomId: string;
  roomName: string;
}

export function DiaryView() {
  const db = useApp((s) => s.db);
  const selectCourse = useApp((s) => s.selectCourse);
  const cfg = useApp((s) => s.config);

  const bookingOn = featureOn(cfg, 'diary.booking');
  const utilizationOn = featureOn(cfg, 'diary.utilization');

  const [roomSel, setRoomSel] = useState('');
  const [date, setDate] = useState(isoToday());
  const [openKey, setOpenKey] = useState<string | null>(null);
  const [booking, setBooking] = useState<Booking | null>(null);

  const activeRooms = db.rooms.filter((r) => r.active);
  const room = activeRooms.find((r) => r.id === roomSel) ?? activeRooms[0];

  const d = new Date(date + 'T12:00:00');
  const validDate = !isNaN(d.getTime());
  const blocked = validDate ? blockReason(d) : null;
  const slots = room && validDate ? buildSlots(db, room, date, blocked) : [];
  const warn = inactiveRoomCourses(db, validDate ? date : isoToday());
  const maxWeekly = Math.max(1, ...db.rooms.map((r) => weeklyRoomSessions(db, r.id, date)));

  function shiftDay(n: number) {
    const nd = validDate ? new Date(d) : new Date();
    nd.setDate(nd.getDate() + n);
    setDate(localIso(nd));
    setOpenKey(null);
  }

  const dateLabel = validDate
    ? `יום ${DAY_NAMES[d.getDay()]}, ${hebDateFull(date)} · ${fmtDate(date)}`
    : '—';

  return (
    <div>
      <PageHead title="יומן חדרים" sub="נוכחות ולוח יומי לכל חדר — בחרו חדר ותאריך" />

      {warn.length > 0 && (
        <div
          style={{
            background: '#fdeaea',
            color: '#b91c1c',
            border: '1px solid #f5c9c9',
            borderRadius: 10,
            padding: '8px 12px',
            fontSize: 13,
            fontWeight: 600,
            marginBottom: 12,
          }}
        >
          ⚠ חוגים המשויכים לחדר לא פעיל — עדכנו את שיוך החדר בכרטיס החוג או הפעילו את החדר מחדש:{' '}
          {warn.map((w, i) => (
            <span key={w.course.id}>
              {i > 0 && ' · '}
              <button
                style={{ textDecoration: 'underline', fontWeight: 700, color: 'inherit', cursor: 'pointer' }}
                onClick={() => selectCourse(w.course.id)}
              >
                {w.course.name}
              </button>{' '}
              ({w.roomName})
            </span>
          ))}
        </div>
      )}

      <div className="card" style={{ marginBottom: 14 }}>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 12 }}>
          {activeRooms.length === 0 ? (
            <span style={{ color: 'var(--ink-faint)', fontSize: 14 }}>אין חדרים פעילים</span>
          ) : (
            activeRooms.map((r) => (
              <Chip
                key={r.id}
                on={room?.id === r.id}
                onClick={() => {
                  setRoomSel(r.id);
                  setOpenKey(null);
                }}
              >
                {r.name}
              </Chip>
            ))
          )}
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
          <Btn sm onClick={() => shiftDay(-1)} title="יום קודם">
            › יום קודם
          </Btn>
          <div style={{ width: 170 }}>
            <TextInput
              type="date"
              value={date}
              onChange={(v) => {
                setDate(v || isoToday());
                setOpenKey(null);
              }}
            />
          </div>
          <Btn sm onClick={() => shiftDay(1)} title="יום הבא">
            יום הבא ‹
          </Btn>
          <Btn
            sm
            onClick={() => {
              setDate(isoToday());
              setOpenKey(null);
            }}
          >
            היום
          </Btn>
          <span style={{ fontSize: 13, color: 'var(--ink-faint)', fontWeight: 600 }}>{dateLabel}</span>
        </div>
      </div>

      {!room ? (
        <Empty>אין חדרים פעילים — הפעילו חדר בהגדרות החדרים כדי להשתמש ביומן</Empty>
      ) : (
        <div className="card" style={{ marginBottom: 14 }}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, flexWrap: 'wrap', marginBottom: 10 }}>
            <h2 style={{ fontSize: 17, fontWeight: 800 }}>יומן — {room.name}</h2>
            <span style={{ fontSize: 12.5, color: 'var(--ink-faint)', fontWeight: 600 }}>{roomInfoLabel(room)}</span>
          </div>

          {blocked && (
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
              היום חסום לתזמון חוגים: {blocked}
            </div>
          )}

          <div style={{ border: '1px solid var(--line)', borderRadius: 14, overflow: 'hidden' }}>
            {slots.length === 0 && <Empty>אין משבצות להצגה — בדקו את שעות הפעילות של החדר</Empty>}
            {slots.map((sl) => {
              const enrolledCount =
                sl.course && sl.sessionIndex != null
                  ? enrollmentsForSession(db, sl.course, sl.sessionIndex).length
                  : 0;
              const open = openKey === sl.key;
              return (
                <div key={sl.key} style={{ borderBottom: '1px solid #ece7db' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '8px 14px' }}>
                    <span style={{ width: 46, flex: 'none', fontWeight: 800, fontSize: 13 }}>{sl.time}</span>
                    {sl.kind === 'free' && bookingOn ? (
                      <button
                        type="button"
                        style={{
                          ...chipStyle(sl.bg, sl.c),
                          flex: 1,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          textAlign: 'right',
                          cursor: 'pointer',
                          border: '1px dashed #9cc9ab',
                        }}
                        title="הזמנת המשבצת — פתיחת אירוע חדש בחדר ובשעה האלה"
                        onClick={() =>
                          setBooking({ date, time: sl.time, roomId: room.id, roomName: room.name })
                        }
                      >
                        {sl.label} · + הזמנה
                      </button>
                    ) : (
                      <span
                        style={{
                          ...chipStyle(sl.bg, sl.c),
                          flex: 1,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                        }}
                        title={sl.label}
                      >
                        {sl.label}
                        {sl.course && sl.session?.label ? ' · ' + sl.session.label : ''}
                      </span>
                    )}
                    {sl.course && (
                      <Btn sm onClick={() => setOpenKey(open ? null : sl.key)} title="פתיחת פאנל נוכחות למפגש">
                        👥 נוכחות ({enrolledCount}) {open ? '▴' : '▾'}
                      </Btn>
                    )}
                  </div>
                  {open && sl.course && sl.sessionIndex != null && (
                    <div style={{ padding: '0 14px' }}>
                      <AttendancePanel course={sl.course} sessionIndex={sl.sessionIndex} />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {utilizationOn && (
      <div className="card">
        <h2 style={{ fontSize: 16, fontWeight: 800, marginBottom: 10 }}>ניצולת חדרים — מפגשים בשבוע</h2>
        {db.rooms.length === 0 ? (
          <Empty>אין חדרים במערכת</Empty>
        ) : (
          db.rooms.map((r) => {
            const n = weeklyRoomSessions(db, r.id, date);
            return (
              <div key={r.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '5px 0' }}>
                <span style={{ width: 140, flex: 'none', fontSize: 13.5, fontWeight: 600 }}>
                  {r.name}
                  {!r.active && <span style={{ ...chipStyle('#eceae2', '#8b8474'), marginInlineStart: 6 }}>מושבת</span>}
                </span>
                <div style={{ flex: 1, background: '#ece7db', borderRadius: 999, height: 8, overflow: 'hidden' }}>
                  <div
                    style={{
                      width: `${Math.round((n / maxWeekly) * 100)}%`,
                      background: n === 0 ? 'transparent' : r.active ? 'var(--amber-deep)' : 'var(--ink-faint)',
                      height: '100%',
                      borderRadius: 999,
                    }}
                  />
                </div>
                <span style={{ width: 120, flex: 'none', fontSize: 12.5, color: 'var(--ink-faint)', fontWeight: 600 }}>
                  {n} מפגשים בשבוע
                </span>
              </div>
            );
          })
        )}
      </div>
      )}

      {booking && (
        <EventModal
          ev={null}
          date={booking.date}
          prefill={{
            time: booking.time,
            roomId: booking.roomId,
            type: 'org',
            notes: 'חדר: ' + booking.roomName,
          }}
          saveToast="ההזמנה נכנסה — המשבצת מסומנת תפוסה ביומן"
          onClose={() => setBooking(null)}
        />
      )}
    </div>
  );
}
