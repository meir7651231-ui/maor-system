/**
 * 🕵️ מודיעין-עובדים (20.8, בקשת-בעלים "פר-עובד יכולת הכי מטורפת — מודיעין,
 * מעקב-מנהל, שיוך") — מנוע טהור בלבד: נגזרת דטרמיניסטית של לוג-הפעולות
 * (db.audit, טבעת-500 שרוכבת על הסנכרון) פר-עובד/ת. אין כאן React/store/
 * Date.now — היום מוזרק (todayIso), הכול נבדק ביחידה.
 *
 * מה נגזר פר-עובד/ת: סך-פעולות · פעיל-לאחרונה · ימי-פעילות · 7-הימים
 * האחרונים · פילוח לפי סוג-פעולה · הפעולות האחרונות · פרופיל-שעות.
 */
import type { AuditEntry } from '../../types/domain';

export interface WorkerIntel {
  email: string;
  /** סך הפעולות של העובד/ת בלוג (בטווח הטבעת). */
  actions: number;
  /** חותמת הפעולה האחרונה (ISO מלא) — '' כשאין. */
  lastAt: string;
  /** מספר ימים נפרדים עם פעילות. */
  daysActive: number;
  /** פעולות ב-7 הימים האחרונים (כולל היום). */
  last7: number;
  /** פעולות היום. */
  today: number;
  /** פילוח לפי סוג-פעולה, מהשכיח למועט. */
  byAct: { act: string; n: number }[];
  /** הפעולות האחרונות (עד limit), מהחדשה לישנה. */
  recent: AuditEntry[];
  /** שעת-השיא (0–23) של העובד/ת, או null כשאין נתונים. */
  peakHour: number | null;
}

const RECENT_LIMIT = 6;

/** ‎YYYY-MM-DD מ-ISO מלא. */
const dayOf = (iso: string): string => iso.slice(0, 10);

/** האם iso בתוך חלון N-הימים שמסתיים ב-todayIso (כולל). דטרמיניסטי. */
function withinDays(iso: string, todayIso: string, days: number): boolean {
  const d = new Date(dayOf(iso) + 'T12:00:00').getTime();
  const t = new Date(todayIso + 'T12:00:00').getTime();
  const diff = (t - d) / 86400000;
  return diff >= 0 && diff < days;
}

/** נרמול-מייל להשוואה (הלוג כותב את המייל המחובר כמו-שהוא). */
const norm = (e: string): string => e.trim().toLowerCase();

/** מודיעין לעובד/ת אחת — סריקה אחת על הלוג. */
export function workerIntel(audit: AuditEntry[], email: string, todayIso: string): WorkerIntel {
  const me = norm(email);
  const mine = audit.filter((a) => norm(a.who) === me);
  const byActMap: Record<string, number> = {};
  const days = new Set<string>();
  const hours: number[] = Array.from({ length: 24 }, () => 0);
  let last7 = 0;
  let today = 0;
  let lastAt = '';
  for (const a of mine) {
    byActMap[a.act] = (byActMap[a.act] ?? 0) + 1;
    days.add(dayOf(a.at));
    if (a.at > lastAt) lastAt = a.at;
    if (withinDays(a.at, todayIso, 7)) last7++;
    if (dayOf(a.at) === todayIso) today++;
    const h = Number(a.at.slice(11, 13));
    if (Number.isFinite(h) && h >= 0 && h < 24) hours[h]++;
  }
  const byAct = Object.entries(byActMap)
    .map(([act, n]) => ({ act, n }))
    .sort((a, b) => b.n - a.n || a.act.localeCompare(b.act, 'he'));
  const recent = [...mine].sort((a, b) => b.at.localeCompare(a.at)).slice(0, RECENT_LIMIT);
  const peak = hours.reduce((best, n, h) => (n > hours[best] ? h : best), 0);
  return {
    email,
    actions: mine.length,
    lastAt,
    daysActive: days.size,
    last7,
    today,
    byAct,
    recent,
    peakHour: mine.length ? peak : null,
  };
}

/** מודיעין-צוות: כרטיס לכל מייל, ממוין לפי פעילות-השבוע (ואז סך-הכול). */
export function teamIntel(audit: AuditEntry[], emails: string[], todayIso: string): WorkerIntel[] {
  const uniq = [...new Set(emails.map((e) => e.trim()).filter(Boolean))];
  return uniq
    .map((e) => workerIntel(audit, e, todayIso))
    .sort((a, b) => b.last7 - a.last7 || b.actions - a.actions || a.email.localeCompare(b.email));
}

/** שורת-סיכום לצוות: סך-פעולות-השבוע + המובילה + כמה פעילים היום. */
export function teamSummary(list: WorkerIntel[]): { week: number; activeToday: number; top: string } {
  const week = list.reduce((t, w) => t + w.last7, 0);
  const activeToday = list.filter((w) => w.today > 0).length;
  const top = list.find((w) => w.last7 > 0)?.email ?? '';
  return { week, activeToday, top };
}

/** תווית "לפני N ימים / היום / אתמול" — דטרמיניסטית מול todayIso. */
export function agoLabel(lastAt: string, todayIso: string): string {
  if (!lastAt) return 'ללא פעילות';
  const d = new Date(dayOf(lastAt) + 'T12:00:00').getTime();
  const t = new Date(todayIso + 'T12:00:00').getTime();
  const diff = Math.round((t - d) / 86400000);
  if (diff <= 0) return 'היום';
  if (diff === 1) return 'אתמול';
  return `לפני ${diff} ימים`;
}
