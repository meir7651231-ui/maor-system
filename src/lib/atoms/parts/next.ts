/**
 * ⏭️ חלק `next` — מה הבא? (פורק ממנוע הזמנים, חלק 14: הזמן הבא שעוד לא הגיע).
 * לא יודע מה הוא מחפש: שעות, תאריכים, משבצות פנויות. טהור, לא זורק.
 */
import type { Run } from './merge';

/** רגע: מספר (דקות, מילישניות) או מחרוזת שמסתדרת לפי סדר (HH:MM, ISO). */
export type Moment = number | string;

const ok = (v: unknown, kind: string): v is Moment =>
  typeof v === kind && (kind !== 'number' || Number.isFinite(v as number)) && (kind !== 'string' || (v as string) !== '');

/**
 * `count` הרגעים הראשונים שאחרי `now` (אחרי — לא כולל; כמו "הזמן הבא" בלוח הזמנים), מהקרוב לרחוק.
 * רגעים מסוג אחר מ-`now` או פגומים — מדולגים.
 */
export function nextAfter<M extends Moment>(times: readonly M[], now: M, count = 1): M[] {
  if (!Array.isArray(times)) return [];
  const kind = typeof now;
  if (!ok(now, kind)) return [];
  const n = typeof count === 'number' && Number.isFinite(count) ? Math.max(0, Math.floor(count)) : 1;
  const after = times.filter((t) => ok(t, kind) && t > now);
  after.sort((a, b) => (a < b ? -1 : a > b ? 1 : 0));
  return after.slice(0, n);
}

/**
 * הרצף הראשון באורך `minLength` לפחות, החל מ-`fromIndex` (רצף שכבר התחיל נחתך מ-fromIndex —
 * "הפנוי הבא מהיום"). אין ⇒ null.
 */
export function firstRun(runs: readonly Run[], minLength = 1, fromIndex = 0): Run | null {
  if (!Array.isArray(runs)) return null;
  const min = typeof minLength === 'number' && Number.isFinite(minLength) ? Math.max(1, minLength) : 1;
  const at = typeof fromIndex === 'number' && Number.isFinite(fromIndex) ? fromIndex : 0;
  for (const r of runs) {
    if (!r || !Number.isFinite(r.from) || !Number.isFinite(r.to) || r.to < at) continue;
    const from = Math.max(r.from, at);
    const length = r.to - from + 1;
    if (length >= min) return { from, to: r.to, length };
  }
  return null;
}
