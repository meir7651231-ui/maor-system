/**
 * דו"ח נוכחות יומי מפורט לחוג — טהור: מהתחלה עד סיום, מפגש-מפגש,
 * מי פעיל בכל מפגש כולל חיסורים. שורה ראשונה = כותרות. days = מספר ימי הפעילות.
 */
import type { Course, Db } from '../types/domain';
import type { Cell } from './csvx';
import { hebDateFull } from './hebrew';

const DAY_NAMES = ['ראשון', 'שני', 'שלישי', 'רביעי', 'חמישי', 'שישי', 'שבת'];

function isoOf(d: Date): string {
  const p2 = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p2(d.getMonth() + 1)}-${p2(d.getDate())}`;
}

function fmtD(iso: string): string {
  const [y, m, d] = iso.split('-');
  return `${d}/${m}/${y}`;
}

export function buildCourseDailyRows(c: Course, db: Db): { rows: Cell[][]; days: number } {
  const rows: Cell[][] = [
    ['תאריך עברי', 'תאריך לועזי', 'יום', 'קבוצה/שעה', 'סטטוס יום', 'תלמידה פעילה', 'משפחה', 'סטטוס נוכחות'],
  ];
  if (!c.start || !c.end) return { rows, days: 0 };

  // אינדקס בן-משפחה → שם פרטי + שם משפחה
  const memberFam = new Map<string, { first: string; famName: string }>();
  for (const f of db.families) for (const m of f.members) memberFam.set(m.id, { first: m.first, famName: f.name });

  const enrolls = db.enrollments.filter((e) => e.courseId === c.id);
  const sessions = c.sessions && c.sessions.length ? c.sessions : [{ day: c.weekday, time: c.time, label: '' }];

  const start = new Date(c.start + 'T12:00:00');
  const end = new Date(c.end + 'T12:00:00');
  // תקרת בטיחות: קורס לגיטימי הוא שנתי/דו-שנתי (עד ~100 ימי מפגש). טווח ענק
  // (טעות הקלדה בשנת הסיום, למשל 2202) היה מייצר עשרות אלפי שורות עם hebDateFull
  // (Intl) יקר לכל שורה — הקפאה של הדפדפן. עוצרים ומסמנים קטיעה.
  const MAX_DAYS = 500;
  let days = 0;
  let truncated = false;
  for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
    const iso = isoOf(d);
    const dow = d.getDay();
    const sess = sessions.filter((ss) => ss.day === dow);
    if (!sess.length) continue;
    if (days >= MAX_DAYS) {
      truncated = true;
      break;
    }
    days++;
    for (const ss of sess) {
      const slot = (ss.label || 'קבוצה') + ' · ' + (ss.time || '');
      // תלמידה "פעילה" במפגש — לא הסתיים, שובצה עד היום, ושייכת לקבוצת המפגש
      const active = enrolls.filter(
        (e) =>
          e.status !== 'ended' &&
          (!e.enrolledAt || e.enrolledAt <= iso) &&
          (!ss.label || !e.group || e.group === ss.label),
      );
      if (!active.length) {
        rows.push([hebDateFull(iso), fmtD(iso), DAY_NAMES[dow], slot, 'אין רשומות', '', '', '']);
        continue;
      }
      for (const e of active) {
        const mf = memberFam.get(e.memberId);
        const abs = e.absences.find((a) => a.date === iso);
        const dayStatus = e.status === 'paused' ? 'מוקפא' : 'מתקיים';
        const attend =
          e.status === 'paused'
            ? 'מוקפא'
            : abs
              ? abs.noshow
                ? 'לא הופיעה'
                : 'חיסור' + (abs.reason ? ' · ' + abs.reason : '')
              : 'פעיל';
        rows.push([hebDateFull(iso), fmtD(iso), DAY_NAMES[dow], slot, dayStatus, mf?.first || '', mf?.famName || '', attend]);
      }
    }
  }
  if (truncated) {
    rows.push(['—', '—', '—', '—', `הדוח נקטע ב-${MAX_DAYS} ימי מפגש — בדקו את תאריך הסיום של החוג`, '', '', '']);
  }
  return { rows, days };
}
