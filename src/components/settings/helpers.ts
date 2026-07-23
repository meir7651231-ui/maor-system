/**
 * עזרים טהורים למודול ההגדרות (פורמט תאריכים ורשימת ציוד) — הופרדו מ-lib.tsx
 * כדי שקובץ ה-lib יישאר רכיבים בלבד (Section/Toggle) ו-Fast-Refresh יעבוד נקי.
 */
import { isoToday as isoTodayLocal } from '../../lib/date-util';

/** תאריך ISO ‏→ DD/MM/YYYY לתצוגה. */
export function fmtDate(iso: string): string {
  if (!iso) return '—';
  const p = iso.slice(0, 10).split('-');
  if (p.length !== 3) return iso;
  return `${p[2]}/${p[1]}/${p[0]}`;
}

/** חותמת זמן ISO ‏→ DD/MM/YYYY HH:MM לתצוגה. */
export function fmtDateTime(iso: string): string {
  if (!iso) return '—';
  const time = iso.length > 15 ? iso.slice(11, 16) : '';
  return fmtDate(iso) + (time ? ' ' + time : '');
}

/** היום בפורמט ISO ‏(YYYY-MM-DD) — מקומי. */
export function isoToday(): string {
  return isoTodayLocal();
}

/** רשימת הציוד הסטנדרטית לחדרים — כמו במערכת המקורית. */
export const ROOM_EQUIPMENT: readonly string[] = [
  'מקרן',
  'הגברה',
  'מזגן',
  'פסנתר',
  'מראות',
  'מטבח מאובזר',
  'מחשבים',
  'שולחנות מתקפלים',
];
