/**
 * מנוע-גאנט · תזמון-משימות עם תלויות (ורטיקל-הסטודיו) — טהור ודטרמיניסטי.
 *
 * כל שורת-פרויקט (AyinName) עם `days` היא משימה; `deps` = מזהי-משימות-קודמות
 * ("אחרי"). המנוע מחשב התחלה-מוקדמת (ES) לפי longest-path על הגרף, משך-הפרויקט
 * הכולל, ונתיב-קריטי (משימות ללא-מרווח). חסין-מחזורים (dep-מעגלי מטופל כ-0).
 * additive-only, אפס-מיגרציה; מגודר supporters.ayin.gantt + הקשר-מסחרי.
 */
import type { AyinName, Id } from '../types/domain';

export interface ScheduledTask {
  id: Id;
  name: string;
  /** יום-התחלה (0 = תחילת-הפרויקט) ויום-סיום (start + days). */
  start: number;
  end: number;
  days: number;
  deps: Id[];
  /** על הנתיב-הקריטי (אין מרווח — עיכוב כאן מעכב את כל הפרויקט). */
  critical: boolean;
}

export interface ProjectSchedule {
  tasks: ScheduledTask[];
  /** משך-הפרויקט הכולל בימים. */
  total: number;
}

/** רק שורות עם days>0 הן משימות-מתוזמנות. */
function isTask(n: AyinName): boolean {
  return typeof n.days === 'number' && n.days > 0;
}

/**
 * מתזמן את משימות-הפרויקט. מעבר-קדימה (ES/EF) עם memo + חסימת-מחזור, ואז מעבר-
 * אחורה (LF/LS) לנתיב-הקריטי. O(V+E). deps שמצביעות לשורה-שאינה-משימה מסוננות.
 */
export function scheduleTasks(names: readonly AyinName[]): ProjectSchedule {
  const tasks = names.filter(isTask);
  const ids = new Set(tasks.map((t) => t.id));
  const byId = new Map(tasks.map((t) => [t.id, t]));
  const deps = (t: AyinName): Id[] => (t.deps || []).filter((d) => ids.has(d) && d !== t.id);

  // מעבר-קדימה: ES = max(EF של התלויות). memo + visiting למניעת-מחזור.
  const es = new Map<Id, number>();
  const visiting = new Set<Id>();
  function earliest(id: Id): number {
    if (es.has(id)) return es.get(id)!;
    if (visiting.has(id)) return 0; // מחזור — עוצרים, נחשב כ-0 (בלי לולאה אינסופית)
    visiting.add(id);
    const t = byId.get(id)!;
    let start = 0;
    for (const d of deps(t)) start = Math.max(start, earliest(d) + (byId.get(d)!.days || 0));
    visiting.delete(id);
    es.set(id, start);
    return start;
  }
  for (const t of tasks) earliest(t.id);

  const total = tasks.reduce((m, t) => Math.max(m, (es.get(t.id) || 0) + (t.days || 0)), 0);

  // מעבר-אחורה: LF = min(LS של היורשים) או total; LS = LF - days.
  const successors = new Map<Id, Id[]>();
  for (const t of tasks) for (const d of deps(t)) successors.set(d, [...(successors.get(d) || []), t.id]);
  const ls = new Map<Id, number>();
  const visitingB = new Set<Id>();
  function latestStart(id: Id): number {
    if (ls.has(id)) return ls.get(id)!;
    if (visitingB.has(id)) return es.get(id) || 0;
    visitingB.add(id);
    const t = byId.get(id)!;
    const succ = successors.get(id) || [];
    let lf = total;
    if (succ.length) { lf = Infinity; for (const s of succ) lf = Math.min(lf, latestStart(s)); }
    visitingB.delete(id);
    const v = lf - (t.days || 0);
    ls.set(id, v);
    return v;
  }
  for (const t of tasks) latestStart(t.id);

  const out: ScheduledTask[] = tasks.map((t) => {
    const start = es.get(t.id) || 0;
    return {
      id: t.id, name: t.name, start, end: start + (t.days || 0), days: t.days || 0,
      deps: deps(t), critical: start === (ls.get(t.id) || 0),
    };
  });
  // מיון לתצוגה: לפי התחלה, ואז לפי סיום.
  out.sort((a, b) => a.start - b.start || a.end - b.end);
  return { tasks: out, total };
}
