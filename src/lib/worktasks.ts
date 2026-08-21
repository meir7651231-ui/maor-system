/**
 * 📋 מנוע משימות-העבודה (WORKPREP, 20.8) — פונקציות טהורות בלבד:
 * סינון פר-עובד/ת, מיון עדיפות→יעד→יצירה, איחור, סטטיסטיקה למנהל,
 * ובניית-שיבוץ-המוני מתורמים-שעבר-יעדם. אין React/store/Date.now.
 */
import type { Supporter, WorkTask } from '../types/domain';

/** נרמול-זהות: מייל-lowercase; ריק ⇒ 'מקומי' (ארגון בלי ענן). */
export function taskIdentity(email: string | undefined | null): string {
  const e = (email ?? '').trim().toLowerCase();
  return e || 'מקומי';
}

/** המשימות הפתוחות של עובד/ת — ממוינות: עדיפות ⇒ יעד-קרוב ⇒ ותיקה-קודם. */
export function openTasksFor(tasks: WorkTask[], identity: string): WorkTask[] {
  const me = taskIdentity(identity);
  return tasks
    .filter((t) => !t.doneAt && taskIdentity(t.assignee) === me)
    .sort(
      (a, b) =>
        a.pri - b.pri ||
        (a.due || '9999').localeCompare(b.due || '9999') ||
        a.createdAt.localeCompare(b.createdAt),
    );
}

/** המשימות שבוצעו היום ע"י עובד/ת (לחיווי "כמה סגרת היום"). */
export function doneTodayFor(tasks: WorkTask[], identity: string, todayIso: string): number {
  const me = taskIdentity(identity);
  return tasks.filter((t) => taskIdentity(t.assignee) === me && (t.doneAt ?? '').slice(0, 10) === todayIso).length;
}

/** האם משימה באיחור — יש יעד והוא לפני היום, והיא עוד פתוחה. */
export function taskOverdue(t: WorkTask, todayIso: string): boolean {
  return !t.doneAt && !!t.due && t.due < todayIso;
}

/** סטטיסטיקת-מנהל פר-עובד/ת: פתוחות / באיחור / בוצעו (סה"כ ובשבוע האחרון). */
export interface TaskStats {
  open: number;
  overdue: number;
  done: number;
  doneWeek: number;
}
export function taskStatsFor(tasks: WorkTask[], identity: string, todayIso: string): TaskStats {
  const me = taskIdentity(identity);
  const mine = tasks.filter((t) => taskIdentity(t.assignee) === me);
  const t0 = new Date(todayIso + 'T12:00:00').getTime();
  let open = 0, overdue = 0, done = 0, doneWeek = 0;
  for (const t of mine) {
    if (!t.doneAt) {
      open++;
      if (taskOverdue(t, todayIso)) overdue++;
    } else {
      done++;
      const d = new Date((t.doneAt ?? '').slice(0, 10) + 'T12:00:00').getTime();
      const diff = (t0 - d) / 86400000;
      if (diff >= 0 && diff < 7) doneWeek++;
    }
  }
  return { open, overdue, done, doneWeek };
}

/** תוויות-עדיפות לתצוגה. */
export const PRI_LABELS: Record<1 | 2 | 3, string> = { 1: '🔴 דחוף', 2: '🟡 רגיל', 3: '⚪ בהמשך' };

/**
 * שיבוץ-המוני: תורמים-שעבר-יעד-הקשר שלהם ⇒ שורות-משימה מוכנות (בלי ids —
 * ה-store מקצה דרך nextId). דדופ מול משימות-פתוחות-קיימות של אותה עובדת
 * לאותו תורם (שלא ישבצו פעמיים בטעות).
 */
export function overdueContactTaskDrafts(
  supporters: Supporter[],
  existing: WorkTask[],
  assignee: string,
  todayIso: string,
): Omit<WorkTask, 'id' | 'createdAt' | 'by'>[] {
  const me = taskIdentity(assignee);
  const already = new Set(
    existing
      .filter((t) => !t.doneAt && taskIdentity(t.assignee) === me && t.ref?.kind === 'supporter')
      .map((t) => t.ref!.id),
  );
  return supporters
    .filter((sp) => sp.nextDate && sp.nextDate <= todayIso && !already.has(sp.id))
    .map((sp) => ({
      assignee: me,
      title: '📞 להתקשר — ' + sp.name,
      ref: { kind: 'supporter' as const, id: sp.id },
      pri: 1 as const,
      due: todayIso,
    }));
}
