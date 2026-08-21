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
  /** התפרעות-מלאה (20.8): פעולות בשבוע-שעבר (ימים 7–13 אחורה) — למגמה. */
  prevWeek: number;
  /** פס-פעילות 14-יום: פעולות פר-יום, מהישן (אינדקס 0 = לפני 13 ימים) לחדש. */
  spark14: number[];
  /** כמה ימים העובד/ת שקטה (0 = פעילה היום; 99+ = מעולם). */
  quietDays: number;
}

/** חץ-מגמה: שבוע-נוכחי מול שבוע-קודם. */
export function trendOf(w: WorkerIntel): '▲' | '▼' | '＝' {
  if (w.last7 > w.prevWeek) return '▲';
  if (w.last7 < w.prevWeek) return '▼';
  return '＝';
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

/** נרמול-מייל להשוואה (הלוג כותב את המייל המחובר כמו-שהוא).
 *  תיקון 21.8 (ממצא-נחיל): מקבל unknown — רשומת-לוג ממוזגת-ענן בלי `who`
 *  (cloud-merge מציב meta.audit בלי ולידציה) הפילה את norm ב-TypeError
 *  והלבינה את כל פאנל-המנהל. */
const norm = (e: unknown): string => String(e ?? '').trim().toLowerCase();

/** סינון-מגן על לוג שהגיע מהענן: רק אובייקטים עם חותמת-`at` מחרוזתית נספרים
 *  (בלעדיה חישובי-הימים היו קורסים). רשומה עקומה מדולגת — לא מפילה מסך. */
function safeAudit(audit: unknown): AuditEntry[] {
  if (!Array.isArray(audit)) return [];
  return audit.filter(
    (a): a is AuditEntry => !!a && typeof a === 'object' && typeof (a as { at?: unknown }).at === 'string',
  );
}

/** מודיעין לעובד/ת אחת — סריקה אחת על הלוג. */
export function workerIntel(audit: AuditEntry[], email: string, todayIso: string): WorkerIntel {
  const me = norm(email);
  const mine = safeAudit(audit).filter((a) => norm((a as { who?: unknown }).who) === me);
  const byActMap: Record<string, number> = {};
  const days = new Set<string>();
  const hours: number[] = Array.from({ length: 24 }, () => 0);
  const spark14: number[] = Array.from({ length: 14 }, () => 0);
  const t = new Date(todayIso + 'T12:00:00').getTime();
  let last7 = 0;
  let prevWeek = 0;
  let today = 0;
  let lastAt = '';
  for (const a of mine) {
    byActMap[a.act] = (byActMap[a.act] ?? 0) + 1;
    days.add(dayOf(a.at));
    if (a.at > lastAt) lastAt = a.at;
    if (withinDays(a.at, todayIso, 7)) last7++;
    if (dayOf(a.at) === todayIso) today++;
    // שבוע-קודם + פס-14-יום — אותו חישוב-ימים דטרמיניסטי (צהריים מקומי)
    const diff = Math.round((t - new Date(dayOf(a.at) + 'T12:00:00').getTime()) / 86400000);
    if (diff >= 7 && diff < 14) prevWeek++;
    if (diff >= 0 && diff < 14) spark14[13 - diff]++;
    const h = Number(a.at.slice(11, 13));
    if (Number.isFinite(h) && h >= 0 && h < 24) hours[h]++;
  }
  const quietDays = lastAt ? Math.max(0, Math.round((t - new Date(dayOf(lastAt) + 'T12:00:00').getTime()) / 86400000)) : 99;
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
    prevWeek,
    spark14,
    quietDays,
  };
}

/** מודיעין-צוות: כרטיס לכל מייל, ממוין לפי פעילות-השבוע (ואז סך-הכול). */
export function teamIntel(audit: AuditEntry[], emails: string[], todayIso: string): WorkerIntel[] {
  const uniq = [...new Set((Array.isArray(emails) ? emails : []).map((e) => String(e ?? '').trim()).filter(Boolean))];
  return uniq
    .map((e) => workerIntel(safeAudit(audit), e, todayIso))
    .sort((a, b) => b.last7 - a.last7 || b.actions - a.actions || a.email.localeCompare(b.email));
}

/** שורת-סיכום לצוות: סך-פעולות-השבוע + המובילה + כמה פעילים היום. */
export function teamSummary(list: WorkerIntel[]): { week: number; activeToday: number; top: string } {
  if (!Array.isArray(list)) return { week: 0, activeToday: 0, top: '' }; // מגן-קלט (21.8)
  const week = list.reduce((t, w) => t + w.last7, 0);
  const activeToday = list.filter((w) => w.today > 0).length;
  const top = list.find((w) => w.last7 > 0)?.email ?? '';
  return { week, activeToday, top };
}

/** העובדות השקטות — quietDays ≥ הסף וגם לא-חדשות-לגמרי בלי כלום מעולם. */
export function quietWorkers(list: WorkerIntel[], minDays = 3): WorkerIntel[] {
  return list.filter((w) => w.quietDays >= minDays);
}

/**
 * 🎯 התקדמות מול יעד-שבועי: אחוז-חסום-ל-100 + סטטוס. goal≤0/חסר ⇒ null.
 */
export function goalProgress(w: WorkerIntel, goal: number | undefined): { pct: number; done: boolean } | null {
  if (!goal || goal <= 0) return null;
  const pct = Math.min(100, Math.round((w.last7 / goal) * 100));
  return { pct, done: w.last7 >= goal };
}

/** שורות-CSV לדוח-הצוות (שורה ראשונה = כותרות) — לייצוא דרך downloadCsv. */
export function teamCsvRows(list: WorkerIntel[], goals: Record<string, number | undefined>): (string | number)[][] {
  const rows: (string | number)[][] = [
    ['עובד/ת', 'סה"כ פעולות', 'השבוע', 'שבוע-קודם', 'מגמה', 'ימי-פעילות', 'שקט (ימים)', 'שעת-שיא', 'יעד-שבועי', 'עמידה-ביעד', 'פעולה-מובילה'],
  ];
  for (const w of list) {
    const g = goals[w.email];
    const gp = goalProgress(w, g);
    rows.push([
      w.email,
      w.actions,
      w.last7,
      w.prevWeek,
      trendOf(w),
      w.daysActive,
      w.quietDays >= 99 ? '' : w.quietDays,
      w.peakHour == null ? '' : String(w.peakHour).padStart(2, '0') + ':00',
      g ?? '',
      gp ? gp.pct + '%' : '',
      w.byAct[0]?.act ?? '',
    ]);
  }
  return rows;
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
