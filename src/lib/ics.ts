/**
 * ייצוא ליומן (INTEGRATIONS גל א׳, הרחבת `gcal`) — מנוע ICS (RFC 5545) טהור.
 * ‏Google Calendar / Outlook / Apple בולעים את הקובץ בייבוא אחד. אין RRULE
 * ללוח העברי ⇒ המופעים החוזרים (יארצייט/נישואין/יום-הולדת) נפרסים מראש
 * כאירועים קונקרטיים (ההרחבה ב-calLib.icsWindowEvents — כאן רק הפורמט).
 *
 * דיוקי-תקן שנלעסו: CRLF בין שורות; קיפול-שורות 75 אוקטטים (בטוח-UTF8 —
 * עברית = 2 בייט לתו!); escaping ל-\ ; , ושורות-חדשות; שעה = זמן-מקומי צף
 * (עמותה חד-אזורית); בלי-שעה = אירוע יום-שלם; DTSTAMP מוזרק (טהור, ללא Date.now).
 */
import { guardExport } from './exportGate';

/** מופע-יומן אחד לייצוא — קונקרטי (אחרי פריסת חזרות עבריות). */
export interface IcsOccurrence {
  uid: string;
  title: string;
  /** ISO לועזי YYYY-MM-DD. */
  date: string;
  /** HH:MM או '' (ריק = אירוע יום-שלם). */
  time: string;
  notes?: string;
  location?: string;
}

/** escaping לפי RFC 5545: קודם \\, אחר-כך ; , ושורות-חדשות → ‎\n ליטרלי. */
export function icsEscape(s: string): string {
  return (s || '')
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\r?\n/g, '\\n');
}

const enc = new TextEncoder();

/**
 * קיפול-שורה ל-≤75 אוקטטים (שורת-המשך נפתחת ברווח = אוקטט אחד משלה).
 * נמדד בבייטים של UTF-8 — תו עברי = 2 בייט; לעולם לא חוצים תו באמצע.
 */
export function foldIcsLine(line: string): string[] {
  const out: string[] = [];
  let cur = '';
  let curBytes = 0;
  let limit = 75; // השורה הראשונה; שורות-המשך: 74 + רווח מוביל
  for (const ch of line) {
    const b = enc.encode(ch).length;
    if (curBytes + b > limit) {
      out.push(cur);
      cur = ' ' + ch;
      curBytes = 1 + b;
      limit = 75;
    } else {
      cur += ch;
      curBytes += b;
    }
  }
  if (cur) out.push(cur);
  return out.length ? out : [''];
}

/** YYYYMMDD מ-ISO. */
function basicDate(iso: string): string {
  return iso.replace(/-/g, '');
}

/** תאריך+שעה מקומיים בפורמט בסיסי צף: YYYYMMDDTHHMMSS. */
function basicLocal(d: Date): string {
  const p = (n: number, w = 2) => String(n).padStart(w, '0');
  return (
    String(d.getFullYear()) + p(d.getMonth() + 1) + p(d.getDate()) +
    'T' + p(d.getHours()) + p(d.getMinutes()) + p(d.getSeconds())
  );
}

/** DTSTAMP ב-UTC: YYYYMMDDTHHMMSSZ. */
function stampUtc(now: Date): string {
  const p = (n: number) => String(n).padStart(2, '0');
  return (
    String(now.getUTCFullYear()) + p(now.getUTCMonth() + 1) + p(now.getUTCDate()) +
    'T' + p(now.getUTCHours()) + p(now.getUTCMinutes()) + p(now.getUTCSeconds()) + 'Z'
  );
}

/** יום-המחרת של ISO (ל-DTEND של אירוע יום-שלם). */
function nextIso(iso: string): string {
  const d = new Date(iso + 'T12:00:00');
  d.setDate(d.getDate() + 1);
  const p = (n: number) => String(n).padStart(2, '0');
  return String(d.getFullYear()) + '-' + p(d.getMonth() + 1) + '-' + p(d.getDate());
}

/**
 * בניית קובץ ICS שלם. `now` מוזרק (DTSTAMP) — הפונקציה טהורה ודטרמיניסטית.
 * אירוע-עם-שעה: DTSTART מקומי-צף + DTEND שעה אחת אחריו (כולל גלגול-חצות).
 */
export function buildIcs(occurrences: IcsOccurrence[], calName: string, now: Date): string {
  const lines: string[] = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//maor-system//he//',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'X-WR-CALNAME:' + icsEscape(calName),
  ];
  const stamp = stampUtc(now);
  for (const oc of occurrences) {
    lines.push('BEGIN:VEVENT');
    lines.push('UID:' + icsEscape(oc.uid));
    lines.push('DTSTAMP:' + stamp);
    // שעה שאינה HH:MM (ייבוא-JSON ידני, '9:00') ⇒ Invalid Date ⇒ VEVENT מושחת
    // שמפיל את **כל** הקובץ ביבואן. נפילה בטוחה: אירוע יום-שלם. (ביקורת 4.8.)
    // 🐛 נחיל-עמוק (13.8): '25:00'/'12:60' עברו את הרגקס אך יצרו Invalid Date —
    // כעת מאמתים גם את הערך בפועל (isNaN), לא רק את הפורמט.
    const parsedStart = oc.time && /^\d{2}:\d{2}$/.test(oc.time) ? new Date(oc.date + 'T' + oc.time + ':00') : null;
    if (parsedStart && !Number.isNaN(parsedStart.getTime())) {
      const end = new Date(parsedStart.getTime() + 3600e3); // שעה — כולל גלגול-חצות
      lines.push('DTSTART:' + basicLocal(parsedStart));
      lines.push('DTEND:' + basicLocal(end));
    } else {
      lines.push('DTSTART;VALUE=DATE:' + basicDate(oc.date));
      lines.push('DTEND;VALUE=DATE:' + basicDate(nextIso(oc.date)));
    }
    lines.push('SUMMARY:' + icsEscape(oc.title));
    if (oc.notes) lines.push('DESCRIPTION:' + icsEscape(oc.notes));
    if (oc.location) lines.push('LOCATION:' + icsEscape(oc.location));
    lines.push('END:VEVENT');
  }
  lines.push('END:VCALENDAR');
  return lines.flatMap(foldIcsLine).join('\r\n') + '\r\n';
}

/** הורדת קובץ ICS — mime יומן, בלי BOM (בניגוד ל-CSV — יומנים לא אוהבים BOM). */
export function downloadIcs(filename: string, text: string): void {
  if (!guardExport()) return; // 🔐 שער יציאת-מידע (core.export כבוי בכרטיס-העובד)
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([text], { type: 'text/calendar;charset=utf-8' }));
  a.download = filename;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 5000);
}
