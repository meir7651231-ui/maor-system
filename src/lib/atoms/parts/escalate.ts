/**
 * 📣 חלק `escalate` — ניתוב עם הסלמה (פורק ממנוע "מה צריך?", חלק 8: קודם לבעלי המקצוע, ואם
 * אין תשובה תוך 3 שעות — שעה בדחוף — לכל הקהילה). לא יודע מה מחכה: בקשה, הזמנה, שאלה.
 * טהור — "עכשיו" מוזרק. לא זורק.
 */

/** שלב: למי שולחים, וכמה דקות מחכים לתשובה לפני שעוברים לשלב הבא. */
export interface EscStep {
  to: readonly string[];
  waitMin: number;
}

export interface EscInput {
  createdMs: number;
  steps: readonly EscStep[];
  /** מתי נענתה (אם נענתה) — מהרגע הזה לא מתקדמים. */
  answeredMs?: number | null;
  urgent?: boolean;
  /** בדחוף: ההמתנה בכל שלב לכל היותר כך (ברירה 60). */
  urgentWaitMin?: number;
  nowMs: number;
}

export interface EscState {
  /** השלב הנוכחי (‎-1 = אין שלבים). */
  stepIndex: number;
  currentTo: string[];
  /** מתי עוברים לשלב הבא — null כשלא עוברים יותר. */
  nextMoveMs: number | null;
  /** אין יותר תנועה: נענתה, או הגיעה לשלב האחרון. */
  done: boolean;
}

export interface EscPlanRow {
  stepIndex: number;
  to: string[];
  /** מתי השלב מתחיל — null כשהתשובה הגיעה לפני. */
  atMs: number | null;
}

export const ESC_DEFAULT_WAIT_MIN = 180;
export const ESC_DEFAULT_URGENT_MIN = 60;
const MIN = 60_000;

const fin = (v: unknown): v is number => typeof v === 'number' && Number.isFinite(v);

function cleanSteps(steps: unknown): { to: string[]; waitMin: number }[] {
  if (!Array.isArray(steps)) return [];
  return steps.map((s) => ({
    to: Array.isArray(s?.to) ? (s.to as unknown[]).filter((x): x is string => typeof x === 'string') : [],
    waitMin: fin(s?.waitMin) && s.waitMin > 0 ? s.waitMin : 0,
  }));
}

/** ההמתנה האפקטיבית של שלב: שלב בלי מקבלים — אפס (עוברים מיד); בדחוף — לכל היותר urgentWaitMin. */
function waitOf(step: { to: string[]; waitMin: number }, input: Partial<EscInput>): number {
  if (!step.to.length) return 0;
  if (input.urgent === true) {
    const u = fin(input.urgentWaitMin) && input.urgentWaitMin >= 0 ? input.urgentWaitMin : ESC_DEFAULT_URGENT_MIN;
    return Math.min(step.waitMin, u);
  }
  return step.waitMin;
}

/**
 * כל השלבים עם רגע-ההתחלה שלהם. יצירה לא-סופית ⇒ נחשבת ישנה: כל השלבים "כבר התחילו"
 * (לא נתקעים לעולם — כמו המקור). שלב שמתחיל אחרי התשובה ⇒ atMs=null.
 */
export function escalationPlan(input: Omit<EscInput, 'nowMs'> & { nowMs?: number }): EscPlanRow[] {
  const steps = cleanSteps(input?.steps);
  const created = fin(input?.createdMs) ? input.createdMs : -Infinity;
  const answered = fin(input?.answeredMs) ? input.answeredMs : null;
  const out: EscPlanRow[] = [];
  let at = created;
  for (let i = 0; i < steps.length; i++) {
    const reached = i === 0 || answered === null || at <= answered;
    out.push({ stepIndex: i, to: steps[i].to, atMs: reached ? (Number.isFinite(at) ? at : null) : null });
    at += waitOf(steps[i], input) * MIN;
  }
  return out;
}

/** איפה זה עומד עכשיו: השלב, למי זה אצלו, ומתי עובר הלאה. */
export function escalationState(input: EscInput): EscState {
  const steps = cleanSteps(input?.steps);
  if (!steps.length) return { stepIndex: -1, currentTo: [], nextMoveMs: null, done: true };
  const now = fin(input?.nowMs) ? input.nowMs : 0;
  const answered = fin(input?.answeredMs) && input.answeredMs! <= now ? input.answeredMs! : null;
  const stopAt = answered ?? now;
  const created = fin(input?.createdMs) ? input.createdMs : -Infinity;
  let i = 0;
  let at = created;
  for (; i < steps.length - 1; i++) {
    const next = at + waitOf(steps[i], input) * MIN;
    // שלב בלי מקבלים לא מחזיק אף פעם — גם כשנענתה ממש ברגע היצירה.
    if (stopAt < next && steps[i].to.length) break;
    at = next;
  }
  const last = i === steps.length - 1;
  if (answered !== null || last) return { stepIndex: i, currentTo: steps[i].to, nextMoveMs: null, done: true };
  return { stepIndex: i, currentTo: steps[i].to, nextMoveMs: at + waitOf(steps[i], input) * MIN, done: false };
}
