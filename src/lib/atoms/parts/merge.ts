/**
 * 🔗 חלק `merge` — מיזוג רצפים (פורק ממנוע הזמנים, חלק 13: שבת ליד חג = חלון סגור אחד).
 * לא יודע מה הוא ממזג: ימים, משבצות, לילות — פריטים מסודרים, כל אחד כן/לא. טהור, לא זורק.
 */

/** רצף שנמצא: מאינדקס `from` עד `to` (כולל), ו-`length` = כמה פריטים הוא תופס. */
export interface Run {
  from: number;
  to: number;
  length: number;
}

export interface MergeOpts {
  /** כמה פריטים "לא" ברצף מותר לבלוע בתוך רצף (ברירה 0 — רק צמודים). */
  maxGap?: number;
  /** רצף קצר מזה — לא מוחזר (ברירה 1). */
  minLength?: number;
}

const nonNeg = (v: unknown, d: number): number => (typeof v === 'number' && Number.isFinite(v) && v >= 0 ? Math.floor(v) : d);

/**
 * מוצא את הרצפים של פריטים "כן" (`on`). רווח של עד `maxGap` פריטים "לא" לא שובר רצף; רווחים
 * בקצה לא נכללים (רצף מתחיל ונגמר בפריט "כן"). `on` חסר ⇒ ערך-האמת של הפריט עצמו.
 */
export function mergeRuns<T>(items: readonly T[], on?: (item: T, index: number) => boolean, opts: MergeOpts = {}): Run[] {
  if (!Array.isArray(items)) return [];
  const test = typeof on === 'function' ? on : (x: T): boolean => !!x;
  const maxGap = nonNeg(opts?.maxGap, 0);
  const minLength = Math.max(1, nonNeg(opts?.minLength, 1));
  const out: Run[] = [];
  let start = -1;
  let last = -1;
  const close = (): void => {
    if (start >= 0 && last - start + 1 >= minLength) out.push({ from: start, to: last, length: last - start + 1 });
    start = -1;
  };
  for (let i = 0; i < items.length; i++) {
    if (!test(items[i], i)) continue;
    if (start >= 0 && i - last - 1 > maxGap) close();
    if (start < 0) start = i;
    last = i;
  }
  close();
  return out;
}
