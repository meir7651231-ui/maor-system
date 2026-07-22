/**
 * עזרי מודול המשפחות — פורמט תאריכים, גיל, דרגות אמינות ותוויות משותפות.
 * עזרים מקומיים בלבד — אין כאן גישה ל-store או ל-DOM.
 */
import type { CSSProperties } from 'react';
import type { Db, Enrollment, Family, FamilyStatus } from '../../types/domain';
import { isoToday as isoTodayLocal } from '../../lib/date-util';

/** תצוגת תאריך DD/MM/YYYY (פנימית נשמר ISO). */
export function fmtDate(iso: string): string {
  if (!iso) return '—';
  const [y, m, d] = iso.slice(0, 10).split('-');
  if (!y || !m || !d) return '—';
  return `${d}/${m}/${y}`;
}

export function isoToday(): string {
  return isoTodayLocal();
}

/** גיל בשנים מלאות מתאריך לידה, או null אם אין תאריך. */
export function ageOf(birth: string): number | null {
  if (!birth) return null;
  // צהריים מקומי — new Date('YYYY-MM-DD') הוא חצות UTC, ובאזור זמן ממערב ל-UTC
  // הוא נופל ליום הקודם מקומית וגורם לגיל לסטות ביום סביב יום ההולדת.
  const d = new Date(birth.slice(0, 10) + 'T12:00:00');
  if (isNaN(d.getTime())) return null;
  const n = new Date();
  let a = n.getFullYear() - d.getFullYear();
  const md = n.getMonth() - d.getMonth();
  if (md < 0 || (md === 0 && n.getDate() < d.getDate())) a--;
  return a;
}

export const STATUS_META: Record<FamilyStatus, { label: string; bg: string; c: string }> = {
  active: { label: 'פעילה', bg: '#e4f5ea', c: '#12803c' },
  pending: { label: 'ממתינה', bg: '#fdf1d4', c: '#9a6414' },
  inactive: { label: 'לא פעילה', bg: '#eceae2', c: '#8b8474' },
};

export interface Tier {
  key: 'titan' | 'lion' | 'pale' | 'red';
  label: string;
  bg: string;
  c: string;
  dot: string;
}

/** דרגת מדד האמינות — זהה לחלוקה במקור (950/800/500). */
export function tierOf(score: number): Tier {
  if (score >= 950) return { key: 'titan', label: 'טיטאן', bg: '#fdf3dd', c: '#9a6414', dot: '#f3c76b' };
  if (score >= 800) return { key: 'lion', label: 'לביאה', bg: '#e4f5ea', c: '#12803c', dot: '#16a34a' };
  if (score >= 500) return { key: 'pale', label: 'טעון שיפור', bg: '#fdf1d4', c: '#9a6414', dot: '#d97706' };
  return { key: 'red', label: 'סיכון נטישה', bg: '#fdeaea', c: '#b91c1c', dot: '#dc2626' };
}

/** כל השיבוצים של בני המשפחה. */
export function famEnrollments(db: Db, fam: Family): Enrollment[] {
  const ids = new Set(fam.members.map((m) => m.id));
  return db.enrollments.filter((e) => ids.has(e.memberId));
}

/**
 * התאמת מספר לתחביר סינון עמודות — "3" בדיוק, "3+" לפחות, "2-4" טווח.
 * קלט לא-מספרי אינו מסנן (מחזיר true), כמו במקור.
 */
export function numMatch(q: string, n: number): boolean {
  q = String(q || '').trim();
  if (!q) return true;
  let m = q.match(/^(\d+)\s*\+$/);
  if (m) return n >= +m[1];
  m = q.match(/^(\d+)\s*-\s*(\d+)$/);
  if (m) return n >= +m[1] && n <= +m[2];
  if (/^\d+$/.test(q)) return n === +q;
  return true;
}

/** רשומת היסטוריה משפחתית — נגזרת מהנתונים הקיימים, לא נשמרת בנפרד. */
export interface FamHistoryEntry {
  date: string;
  tag: string;
  bg: string;
  c: string;
  text: string;
}

/**
 * היסטוריית הפעולות של המשפחה (כמו famHistoryOf במקור) — נגזרת מהנתונים:
 * הצטרפות · לוג מדד האמינות · מסמכים · שיבוצים · תשלומים · היעדרויות.
 * ממוינת מהחדש לישן, עד 40 הפעולות האחרונות.
 */
export function famHistoryOf(db: Db, fam: Family): FamHistoryEntry[] {
  const out: FamHistoryEntry[] = [];
  const push = (date: string, tag: string, bg: string, c: string, text: string) => {
    if (date) out.push({ date, tag, bg, c, text });
  };
  if (fam.createdAt) push(fam.createdAt, 'הצטרפות', '#e7edf5', '#3a5a86', 'המשפחה הצטרפה');
  for (const l of fam.cred?.log ?? []) {
    push(l.date, 'אמינות', '#f6ead1', '#9a6414', l.reason + ' (' + (l.delta > 0 ? '+' : '') + l.delta + ' נק׳)');
  }
  for (const d of fam.docs) push(d.addedAt, 'מסמך', '#eceae2', '#4d463c', 'מסמך נוסף: ' + d.name);
  const ids = new Set(fam.members.map((m) => m.id));
  for (const e of db.enrollments) {
    if (!ids.has(e.memberId)) continue;
    const first = fam.members.find((x) => x.id === e.memberId)?.first ?? '';
    const cname = db.courses.find((x) => x.id === e.courseId)?.name ?? '';
    push(
      e.enrolledAt,
      'שיבוץ',
      '#eef7e6',
      '#3f6212',
      'נרשמ/ה ' + first + ' ל' + cname + (e.group ? ' · ' + e.group : ''),
    );
    for (const p of e.payments) {
      push(p.date, 'תשלום', '#e4f5ea', '#12803c', 'תשלום ₪' + p.amount + ' (' + p.method + ') — ' + cname + ' · ' + p.rid);
    }
    for (const a of e.absences) {
      push(
        a.date,
        a.noshow ? 'No-Show' : 'היעדרות',
        '#fdeaea',
        '#b91c1c',
        'היעדרות — ' + cname + (a.reason ? ' · ' + a.reason : '') + (a.makeup ? ' · זכאי/ת השלמה' : ''),
      );
    }
  }
  return out.sort((a, b) => b.date.localeCompare(a.date)).slice(0, 40);
}

/** ערכי הבחירה בטופס — verbatim מהמקור; '__other' פותח הקלדה חופשית. */
export const MARITAL_OPTIONS = ['נשואים', 'גרושים', 'אלמן/ה', 'פרודים'];
export const LANGUAGE_OPTIONS = ['עברית', 'יידיש', 'רוסית', 'צרפתית', 'אנגלית'];
export const OTHER = '__other';
export const OTHER_LABEL = 'אחר — הקלדה חופשית…';

/** תוויות/צבעי סוגי אירועים (כמו evMeta במקור). */
export const EVENT_META: Record<string, { label: string; bg: string; c: string }> = {
  reminder: { label: 'תזכורת', bg: '#efe7f3', c: '#7c3aed' },
  call: { label: 'טלפון', bg: '#dff0ec', c: '#0f766e' },
  wedding: { label: 'חתונה', bg: '#fdeee0', c: '#b45309' },
  memorial: { label: 'אזכרה', bg: '#eceae2', c: '#4d463c' },
  anniversary: { label: 'יום נישואים', bg: '#fbeef3', c: '#be185d' },
  bday: { label: 'יום הולדת', bg: '#fbeef3', c: '#be185d' },
  org: { label: 'אירוע', bg: '#e7edf5', c: '#3a5a86' },
  custom: { label: 'אירוע', bg: '#e7edf5', c: '#3a5a86' },
};

/** צ'יפ סטטוס/דרגה קטן בסגנון אחיד. */
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
