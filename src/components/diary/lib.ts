/**
 * עזרי יומן החדרים — משבצות זמן לפי הגדרות החדר, חסימות לוח (שבת/חג),
 * מפגשי היום וחישובי ניצולת. עזרים מקומיים בלבד — אין כאן גישה ל-store או ל-DOM.
 */
import type { CSSProperties } from 'react';
import type { Course, CourseSession, Db, Enrollment, OrgEvent, Room } from '../../types/domain';
import { HOLIDAYS, hebParts } from '../../lib/hebrew';
import { planWord } from '../courses/lib';

/** תצוגת תאריך DD/MM/YYYY (פנימית נשמר ISO). */
export function fmtDate(iso: string): string {
  if (!iso) return '—';
  const [y, m, d] = iso.slice(0, 10).split('-');
  if (!y || !m || !d) return '—';
  return `${d}/${m}/${y}`;
}

/** ISO מקומי (לא UTC) — למניעת גלישת יום בסביבות אזורי-זמן. */
export function localIso(d: Date): string {
  const p = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

export function isoToday(): string {
  return localIso(new Date());
}

export const DAY_NAMES = ['ראשון', 'שני', 'שלישי', 'רביעי', 'חמישי', 'שישי', 'שבת'] as const;

export function pad2(n: number): string {
  return String(n).padStart(2, '0');
}

/** "HH:MM" → דקות מחצות; מחרוזת לא תקינה → NaN. */
export function timeToMin(t: string): number {
  const m = /^(\d{1,2}):(\d{2})$/.exec(String(t || '').trim());
  if (!m) return NaN;
  return +m[1] * 60 + +m[2];
}

export function minToHM(min: number): string {
  return pad2(Math.floor(min / 60)) + ':' + pad2(min % 60);
}

/** המפגשים בפועל — fallback למפגש יחיד מהשדות הראשיים (כמו sessionsOf במקור). */
export function sessionsOf(c: Course): CourseSession[] {
  return c.sessions && c.sessions.length ? c.sessions : [{ day: c.weekday, time: c.time, label: '' }];
}

/** תווית קבוצה — label או "קבוצה N" לפי המיקום (כמו במודול הקורסים). */
export function groupLabelOf(ss: CourseSession, i: number): string {
  return ss.label || 'קבוצה ' + (i + 1);
}

/** המפגש הקרוב הבא של הקורס (לזכאות השלמה בחיסור — 48 שעות). */
export function nextSessionDate(c: Course): Date | null {
  const n = new Date();
  let best: Date | null = null;
  for (const ss of sessionsOf(c)) {
    const t = (ss.time || '17:00').split(':');
    const d = new Date(n.getFullYear(), n.getMonth(), n.getDate(), +t[0], +(t[1] ?? 0) || 0);
    let add = (ss.day - d.getDay() + 7) % 7;
    if (add === 0 && d <= n) add = 7;
    d.setDate(d.getDate() + add);
    if (!best || d < best) best = d;
  }
  return best;
}

/** חגים שבהם אין פעילות כלל (מתוך לוח החגים המשותף). */
const FULL_HOLIDAYS = [
  'ראש השנה',
  'ראש השנה ב׳',
  'יום כיפור',
  'סוכות',
  'שמחת תורה',
  'פסח',
  'שביעי של פסח',
  'שבועות',
  'תשעה באב',
];

/** סיבת חסימת היום לתזמון חוגים — שבת, שישי, חג מלא או חול המועד (כמו במקור). */
export function blockReason(d: Date): string | null {
  const dow = d.getDay();
  if (dow === 6) return 'שבת';
  if (dow === 5) return 'יום שישי (שעתיים לפני שבת)';
  const hp = hebParts(d);
  const hol = HOLIDAYS[`${hp.month} ${hp.day}`];
  if (hol && FULL_HOLIDAYS.includes(hol)) return hol;
  if ((hp.month === 'Tishri' && hp.day >= 16 && hp.day <= 21) || (hp.month === 'Nisan' && hp.day >= 16 && hp.day <= 20))
    return 'חול המועד';
  return null;
}

/** שורת משבצת ביומן היום של חדר. */
export interface DiarySlot {
  key: string;
  time: string;
  kind: 'free' | 'blocked' | 'cleaning' | 'course' | 'event';
  label: string;
  bg: string;
  c: string;
  course?: Course;
  session?: CourseSession;
  sessionIndex?: number;
  event?: OrgEvent;
  /** מפגש שמתקיים מחוץ לשעות הפעילות המוגדרות של החדר. */
  outOfHours?: boolean;
}

/** האם הקורס פעיל בתאריך הנתון (טווח start–end, כמו במקור). */
function courseOnDate(c: Course, iso: string): boolean {
  return (!c.start || iso >= c.start) && (!c.end || iso <= c.end);
}

/**
 * בונה את משבצות היום לחדר: מ-room.from עד room.to בקפיצות של room.slot דקות.
 * 15:00–16:00 — ניקיון יומי קבוע בכל החדרים (כמו במקור). מפגשים מחוץ לשעות
 * הפעילות מתווספים בסוף כדי שרישום נוכחות תמיד יהיה נגיש.
 */
export function buildSlots(db: Db, room: Room, iso: string, blocked: string | null): DiarySlot[] {
  const from = Number.isNaN(timeToMin(room.from)) ? 8 * 60 : timeToMin(room.from);
  const to = Number.isNaN(timeToMin(room.to)) ? 20 * 60 : timeToMin(room.to);
  const step = room.slot > 0 ? room.slot : 60;
  const wd = new Date(iso + 'T12:00:00').getDay();
  const slots: DiarySlot[] = [];
  const covered: { c: Course; i: number }[] = [];

  const dayCourses = db.courses.filter((c) => c.roomId === room.id && courseOnDate(c, iso));

  for (let t = from, guard = 0; t < to && guard < 96; t += step, guard++) {
    const hh = minToHM(t);
    // ניקיון יומי 15:00–16:00 — קבוע בכל החדרים (כמו במקור)
    if (t >= 900 && t < 960) {
      slots.push({ key: 'clean' + hh, time: hh, kind: 'cleaning', label: 'ניקיון יומי (15:00–16:00)', bg: '#eceae2', c: '#4d463c' });
      continue;
    }
    let occupied = false;
    for (const c of dayCourses) {
      const ss = sessionsOf(c);
      for (let i = 0; i < ss.length; i++) {
        const tm = timeToMin(ss[i].time || '');
        if (ss[i].day === wd && !Number.isNaN(tm) && tm >= t && tm < t + step) {
          occupied = true;
          covered.push({ c, i });
          slots.push({
            key: `crs|${hh}|${c.id}|${i}`,
            time: ss[i].time || hh,
            kind: 'course',
            label: 'חוג: ' + c.name,
            bg: '#fdf1d4',
            c: '#9a6414',
            course: c,
            session: ss[i],
            sessionIndex: i,
          });
        }
      }
    }
    if (occupied) continue;
    const oe = db.events.find((ev) => {
      if (ev.done || ev.roomId !== room.id || ev.date !== iso) return false;
      const tm = timeToMin(ev.time || '');
      return !Number.isNaN(tm) && tm >= t && tm < t + step;
    });
    if (oe) {
      slots.push({ key: 'ev|' + hh + '|' + oe.id, time: oe.time || hh, kind: 'event', label: 'אירוע: ' + oe.title, bg: '#e7edf5', c: '#3a5a86', event: oe });
    } else if (blocked) {
      slots.push({ key: 'blk' + hh, time: hh, kind: 'blocked', label: 'חסום — ' + blocked, bg: '#fdeaea', c: '#b91c1c' });
    } else {
      slots.push({ key: 'free' + hh, time: hh, kind: 'free', label: 'פנוי', bg: '#e4f5ea', c: '#12803c' });
    }
  }

  // מפגשים של היום שנופלים מחוץ לשעות הפעילות של החדר — עדיין מוצגים לרישום נוכחות
  for (const c of dayCourses) {
    const ss = sessionsOf(c);
    for (let i = 0; i < ss.length; i++) {
      if (ss[i].day !== wd) continue;
      if (covered.some((x) => x.c.id === c.id && x.i === i)) continue;
      slots.push({
        key: `out|${c.id}|${i}`,
        time: ss[i].time || '—',
        kind: 'course',
        label: 'חוג: ' + c.name + ' · מחוץ לשעות הפעילות של החדר',
        bg: '#fdf1d4',
        c: '#9a6414',
        course: c,
        session: ss[i],
        sessionIndex: i,
        outOfHours: true,
      });
    }
  }
  return slots;
}

/**
 * המשובצים למפגש: כל שיבוצי הקורס; כשיש כמה קבוצות — רק מי ששויך/ה לקבוצה
 * של המפגש הזה, בתוספת מי שעדיין ללא שיוך קבוצה (כדי שלא ייעלמו מהיומן).
 */
export function enrollmentsForSession(db: Db, c: Course, sessionIndex: number): Enrollment[] {
  const all = db.enrollments.filter((e) => e.courseId === c.id);
  const ss = sessionsOf(c);
  if (ss.length <= 1) return all;
  const label = groupLabelOf(ss[Math.min(sessionIndex, ss.length - 1)], sessionIndex);
  return all.filter((e) => !e.group || e.group === label);
}

/** ניצולת שבועית — מספר המפגשים השבועיים המשויכים לחדר (חוגים שלא הסתיימו). */
export function weeklyRoomSessions(db: Db, roomId: string, iso: string): number {
  return db.courses
    .filter((c) => c.roomId === roomId && (!c.end || iso <= c.end))
    .reduce((a, c) => a + sessionsOf(c).length, 0);
}

/** חוגים (שלא הסתיימו) המשויכים לחדר לא פעיל או לחדר שאינו קיים. */
export function inactiveRoomCourses(db: Db, iso: string): { course: Course; roomName: string }[] {
  const out: { course: Course; roomName: string }[] = [];
  for (const c of db.courses) {
    if (c.end && iso > c.end) continue;
    if (!c.roomId) continue;
    const room = db.rooms.find((r) => r.id === c.roomId);
    if (!room) out.push({ course: c, roomName: 'חדר לא קיים' });
    else if (!room.active) out.push({ course: c, roomName: room.name });
  }
  return out;
}

/** תווית מסלול קצרה לשורת תלמיד/ה ביומן — עקבי עם מודול הקורסים (planWord). */
export function planLabelOf(e: Enrollment): string {
  return e.plan === 'punch'
    ? `כרטיסייה · יתרה ${Math.max(0, e.purchased - e.used)}/${e.purchased}`
    : planWord(e.plan);
}

/** תוויות סטטוס שיבוץ (כמו במודול הקורסים). */
export function enrollStatusMeta(e: Enrollment): { label: string; bg: string; c: string } | null {
  if (e.status === 'paused') return { label: 'מוקפא', bg: '#fdf1d4', c: '#9a6414' };
  if (e.status === 'ended') return { label: 'הסתיים', bg: '#eceae2', c: '#8b8474' };
  return null;
}

/** צ'יפ קטן בסגנון אחיד. */
export function chipStyle(bg: string, c: string): CSSProperties {
  return {
    display: 'inline-block',
    padding: '3px 10px',
    borderRadius: 999,
    fontSize: 12,
    fontWeight: 700,
    background: bg,
    color: c,
    whiteSpace: 'nowrap',
  };
}

/** שורת המידע על החדר — כמו slotLabel במקור. */
export function roomInfoLabel(room: Room): string {
  const eqOn = Object.entries(room.eq || {})
    .filter(([, v]) => v)
    .map(([k]) => k);
  return (
    'משבצות של ' +
    (room.slot || 60) +
    ' דק׳' +
    (room.cap ? ' · עד ' + room.cap + ' משתתפים' : '') +
    (room.access ? ' · נגיש' : '') +
    (eqOn.length ? ' · ' + eqOn.slice(0, 3).join(', ') : '')
  );
}
