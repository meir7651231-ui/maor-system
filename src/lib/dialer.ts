/**
 * מנוע חייגן-מונחה (assisted dialer) — טהור, בלי store/DOM. מכונת-מצב לקמפיין-
 * שיחות: תור לפי-סדר, "הנוכחי" בחזית, סיווג-תוצאה מקדם לבא, ומי-שלא-ענה חוזר
 * לסוף-התור (requeue). downstream לחלוטין: המנוע מנהל את הרשימה — החיוג עצמו
 * קורה על הטלפון הקיים (tel:) דרך telephony/driver. נבדק ביחידה.
 */
import type { DialerCampaign, DialLogEntry, DialOutcome } from '../types/domain';

/** תוצאות לא-סופיות — מחזירות את המתקשר לסוף-התור (עוד ניסיון). */
export const REQUEUE_OUTCOMES: readonly DialOutcome[] = ['noanswer', 'skip'];
/** תוצאות סופיות — סוגרות את המתקשר (יוצא מהתור). */
export const TERMINAL_OUTCOMES: readonly DialOutcome[] = ['donated', 'refused', 'callback', 'done'];

/** פתיחת קמפיין מרשימת-מזהים (דדופ + סינון-ריקים; הסדר נשמר). */
export function startCampaign(name: string, ids: string[], iso: string): DialerCampaign {
  const seen = new Set<string>();
  const queue: string[] = [];
  for (const id of ids) {
    if (!id || seen.has(id)) continue;
    seen.add(id);
    queue.push(id);
  }
  return { name, startedAt: iso, queue, total: queue.length, log: [] };
}

/** המזהה הנוכחי (חזית-התור), או null כשהתור ריק (הקמפיין הסתיים). */
export function currentId(c: DialerCampaign): string | null {
  return c.queue.length ? c.queue[0] : null;
}

/**
 * החלת תוצאה על המתקשר-הנוכחי: רושמת ליומן ומקדמת. תוצאה לא-סופית
 * (לא-ענה/דלג) מחזירה את המזהה לסוף-התור; תוצאה סופית מסירה אותו.
 * בלי מתקשר-נוכחי — no-op בטוח.
 */
export function applyOutcome(c: DialerCampaign, outcome: DialOutcome, note: string, iso: string): DialerCampaign {
  const id = currentId(c);
  if (!id) return c;
  const rest = c.queue.slice(1);
  const queue = REQUEUE_OUTCOMES.includes(outcome) ? [...rest, id] : rest;
  const entry: DialLogEntry = { id, outcome, at: iso };
  if (note && note.trim()) entry.note = note.trim();
  return { ...c, queue, log: [...c.log, entry] };
}

export interface DialerProgress {
  total: number;
  /** מזהים ייחודיים שעדיין בתור (כולל שחזרו על לא-ענה). */
  remaining: number;
  /** מזהים שנסגרו (תוצאה סופית). */
  finalized: number;
  /** ספירת-ניסיונות פר-תוצאה (לא-ענה/דלג = ניסיונות; שאר = פר-מזהה). */
  counts: Record<DialOutcome, number>;
}

const ZERO_COUNTS = (): Record<DialOutcome, number> => ({
  donated: 0,
  noanswer: 0,
  refused: 0,
  callback: 0,
  done: 0,
  skip: 0,
});

/** מדד-התקדמות: כמה נסגרו, כמה נותרו, וספירה פר-תוצאה. */
export function progress(c: DialerCampaign): DialerProgress {
  const pending = new Set(c.queue);
  const remaining = pending.size;
  const counts = ZERO_COUNTS();
  for (const e of c.log) counts[e.outcome]++;
  return { total: c.total, remaining, finalized: Math.max(0, c.total - remaining), counts };
}

/** האם הקמפיין הסתיים (אין עוד מי לחייג). */
export function isDone(c: DialerCampaign): boolean {
  return c.queue.length === 0;
}
