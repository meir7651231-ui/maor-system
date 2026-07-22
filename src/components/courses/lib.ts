/**
 * עזרי מודול הקורסים — ימים, מפגשים, תוויות מסלול ויתרות תשלום.
 * עזרים מקומיים בלבד — אין כאן גישה ל-store או ל-DOM.
 */
import type { CSSProperties } from 'react';
import type { Course, CourseSession, Db, Enrollment, PricingModel } from '../../types/domain';

/** תצוגת תאריך DD/MM/YYYY (פנימית נשמר ISO). */
export function fmtDate(iso: string): string {
  if (!iso) return '—';
  const [y, m, d] = iso.slice(0, 10).split('-');
  if (!y || !m || !d) return '—';
  return `${d}/${m}/${y}`;
}

export function isoToday(): string {
  return new Date().toISOString().slice(0, 10);
}

/** גיל בשנים מלאות מתאריך לידה, או null אם אין תאריך. */
export function ageOf(birth: string): number | null {
  if (!birth) return null;
  const d = new Date(birth);
  if (isNaN(d.getTime())) return null;
  const n = new Date();
  let a = n.getFullYear() - d.getFullYear();
  const md = n.getMonth() - d.getMonth();
  if (md < 0 || (md === 0 && n.getDate() < d.getDate())) a--;
  return a;
}

/** שמות ימי הפעילות 0=ראשון … 5=שישי (אין פעילות בשבת). */
export const DAY_NAMES = ['ראשון', 'שני', 'שלישי', 'רביעי', 'חמישי', 'שישי'] as const;
export const DAY_LETTERS = ['א׳', 'ב׳', 'ג׳', 'ד׳', 'ה׳', 'ו׳'] as const;

/** המפגשים בפועל — fallback למפגש יחיד מהשדות הראשיים (כמו sessionsOf במקור). */
export function sessionsOf(c: Course): CourseSession[] {
  return c.sessions && c.sessions.length ? c.sessions : [{ day: c.weekday, time: c.time, label: '' }];
}

/** תווית קבוצה — label או "קבוצה N" לפי המיקום. */
export function groupLabelOf(ss: CourseSession, i: number): string {
  return ss.label || 'קבוצה ' + (i + 1);
}

/** אפשרויות שיוך קבוצה — רק כשיש יותר ממפגש אחד. */
export function groupOptionsOf(c: Course): { v: string; t: string }[] {
  const ss = sessionsOf(c);
  if (ss.length <= 1) return [];
  return ss.map((s, i) => {
    const v = groupLabelOf(s, i);
    return { v, t: `${v} · יום ${DAY_NAMES[s.day]} ${s.time || ''}`.trim() };
  });
}

/** שם המסלול (יחיד) — פורט מ-planWord באב-הטיפוס. */
export function planWord(model: PricingModel): string {
  return model === 'punch'
    ? 'כרטיסייה'
    : model === 'half_year'
      ? 'מנוי חצי-שנתי'
      : model === 'year'
        ? 'מנוי שנתי'
        : 'מנוי חודשי';
}

/** סיומת תקופת המחיר — "לחודש" / "לחצי שנה" / "לשנה" (פורט מ-pricePer). */
export function priceSuffix(model: PricingModel): string {
  return model === 'half_year' ? 'לחצי שנה' : model === 'year' ? 'לשנה' : model === 'punch' ? '' : 'לחודש';
}

/** תווית + צבעי מסלול התמחור. */
export function modelMeta(c: Course): { label: string; bg: string; c: string } {
  if (c.model === 'punch') return { label: 'כרטיסייה · ' + c.size + ' ניקובים', bg: '#fdf1d4', c: '#9a6414' };
  if (c.model === 'half_year') return { label: 'מנוי חצי-שנתי', bg: '#e7edf5', c: '#3a5a86' };
  if (c.model === 'year') return { label: 'מנוי שנתי', bg: '#efe7f3', c: '#7c3aed' };
  return { label: 'מנוי חודשי', bg: '#e4f5ea', c: '#12803c' };
}

/** סכום ששולם עד כה על השיבוץ. */
export function paidOf(e: Enrollment): number {
  return e.payments.reduce((a, p) => a + p.amount, 0);
}

/** יתרת חוב — max(0, סה"כ עסקה - שולם). */
export function payBal(e: Enrollment): number {
  return Math.max(0, (e.totalDue || 0) - paidOf(e));
}

/** מספר המשובצים לקורס (כולל מוקפאים — כמו במקור, לצורך תפוסה). */
export function enrollCount(db: Db, courseId: string): number {
  return db.enrollments.filter((e) => e.courseId === courseId).length;
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

/** ערכי הבחירה בטופס — verbatim מהמקור; '__other' פותח הקלדה חופשית. */
export const OTHER = '__other';
export const OTHER_LABEL = 'אחר — הקלדה חופשית…';
export const ADD_TEACHER = '__add';
export const CAT_OPTIONS = ['מלאכה', 'אמנות', 'העשרה', 'ספורט', 'מוזיקה', 'רווחה', 'טיפוח', 'קולינרי', 'קהילה'];
export const SEMESTER_OPTIONS = ['שנתי', 'חצי שנתי'];
export const PAY_METHODS = ['מזומן', 'העברה בנקאית', "צ'ק", 'אשראי', 'ביט'];

/** גווני רקע לכרטיסי הקורסים (כמו tints במקור). */
export const TINTS = ['#f6ead1', '#e3eddc', '#dfe8f2', '#f2e0e4', '#e9dff0', '#ece8d9'];

/** תוויות סטטוס שיבוץ. */
export function enrollStatusMeta(e: Enrollment): { label: string; bg: string; c: string } {
  if (e.status === 'paused') return { label: 'מוקפא', bg: '#fdf1d4', c: '#9a6414' };
  if (e.status === 'ended') return { label: 'הסתיים', bg: '#eceae2', c: '#8b8474' };
  return { label: 'פעיל', bg: '#e4f5ea', c: '#12803c' };
}

/** תווית המסלול בשורת תלמיד — כולל הקפאה/סיום, חיסורים ויתרת חוב (כמו planLabel במקור). */
export function planLabelOf(e: Enrollment): string {
  let s = e.plan === 'punch' ? 'כרטיסייה · ' + e.purchased : planWord(e.plan);
  if (e.status === 'paused') s += ' · מוקפא ⏸';
  else if (e.status === 'ended') s += ' · הסתיים';
  if (e.absences.length) s += ' · ' + e.absences.length + ' חיס׳';
  const bal = payBal(e);
  if (bal > 0) s += ' · 💳 ₪' + bal;
  return s;
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
