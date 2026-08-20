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

/** תוויות-תצוגה לתוצאות — לסיכום ה-CSV ולרישום ההערה בכרטיס (20.8). */
export const OUTCOME_LABELS: Record<DialOutcome, string> = {
  donated: 'תרם/ה',
  noanswer: 'לא ענה',
  refused: 'סירב/ה',
  callback: 'לחזור',
  done: 'טופל',
  skip: 'דילוג',
};

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

/**
 * מדד-התקדמות: כמה נסגרו, כמה נותרו, וספירה פר-תוצאה.
 * תיקון (20.8): לא-ענה/דלג נספרים **פר-אדם** (ייחודי) ולא פר-ניסיון —
 * מי שלא ענה 3 פעמים הציג "📵 3" והטעה כאילו 3 אנשים לא ענו.
 */
export function progress(c: DialerCampaign): DialerProgress {
  const pending = new Set(c.queue);
  const remaining = pending.size;
  const counts = ZERO_COUNTS();
  const seen: Partial<Record<DialOutcome, Set<string>>> = {};
  for (const e of c.log) {
    if (REQUEUE_OUTCOMES.includes(e.outcome)) {
      const s = (seen[e.outcome] ??= new Set());
      if (s.has(e.id)) continue;
      s.add(e.id);
    }
    counts[e.outcome]++;
  }
  return { total: c.total, remaining, finalized: Math.max(0, c.total - remaining), counts };
}

/** האם הקמפיין הסתיים (אין עוד מי לחייג). */
export function isDone(c: DialerCampaign): boolean {
  return c.queue.length === 0;
}

/**
 * ↩ ביטול הסיווג האחרון (20.8) — מחזיר את המתקשר לחזית-התור ומוחק את רשומת-
 * היומן. תוצאה-סופית ⇒ המזהה חוזר לחזית; לא-ענה/דלג ⇒ מוסר מסוף-התור (לשם
 * requeue שלח אותו) וחוזר לחזית. בלי יומן — no-op בטוח. טהור.
 */
export function undoLast(c: DialerCampaign): DialerCampaign {
  const last = c.log[c.log.length - 1];
  if (!last) return c;
  let queue = c.queue;
  if (REQUEUE_OUTCOMES.includes(last.outcome)) {
    const at = queue.lastIndexOf(last.id);
    queue = at >= 0 ? [...queue.slice(0, at), ...queue.slice(at + 1)] : queue;
  }
  return { ...c, queue: [last.id, ...queue], log: c.log.slice(0, -1) };
}

/**
 * שורות-CSV לסיכום הקמפיין (20.8) — שורה פר-ניסיון (כולל לא-ענה שחזרו),
 * בסדר-כרונולוגי; nameOf ממופה ב-caller (המנוע לא מכיר את ה-store). טהור.
 */
export function campaignCsvRows(
  c: DialerCampaign,
  nameOf: (id: string) => string,
): (string | number)[][] {
  const rows: (string | number)[][] = [['שם', 'תוצאה', 'הערה', 'מתי']];
  for (const e of c.log) {
    rows.push([nameOf(e.id), OUTCOME_LABELS[e.outcome], e.note ?? '', e.at]);
  }
  return rows;
}
