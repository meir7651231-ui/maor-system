/**
 * 🎯 חלק `round` — עיגול לחומרא (פורק ממנוע הזמנים, חלק 8: זמן-סוף מעגלים למטה, זמן-התחלה למעלה).
 * לא יודע מה הוא מעגל: דקות, שקלים, מטרים. טהור, לא זורק.
 */

/** 'down' = לחומרא למטה (סוף) · 'up' = לחומרא למעלה (התחלה) · 'nearest' = לקרוב. */
export type RoundDir = 'down' | 'up' | 'nearest';

export const ROUND_DIRS: readonly RoundDir[] = ['down', 'up', 'nearest'];

/**
 * עיגול לכפולה של `step` בכיוון `dir`. עם step=1 זה בדיוק Math.floor/ceil/round של מנוע הזמנים.
 * צעד פגום (≤0) ⇒ 1. ערך לא-סופי ⇒ NaN.
 */
export function roundTo(value: number, step = 1, dir: RoundDir = 'nearest'): number {
  if (typeof value !== 'number' || !Number.isFinite(value)) return NaN;
  const st = typeof step === 'number' && Number.isFinite(step) && step > 0 ? step : 1;
  const q0 = value / st;
  // VERIFY 14.10: צעד לא-שלם — רעש נקודה-צפה (0.3 / 0.1 = 2.9999…) מקובע לשלם הקרוב, אחרת "למטה" יורד יחידה שלמה
  // (0.3 ⇒ 0.2, ₪351.15 ⇒ ₪351.10) ועיגול-פעמיים לא נותן אותו דבר. עם צעד 1 — בדיוק כמו Math.floor/ceil/round של המקור.
  const qi = Math.round(q0);
  const q = st !== 1 && Math.abs(q0 - qi) <= 1e-9 * Math.max(1, Math.abs(q0)) ? qi : q0;
  const r = dir === 'down' ? Math.floor(q) : dir === 'up' ? Math.ceil(q) : Math.round(q);
  const out = r * st;
  return st === 1 ? out : Number(out.toFixed(12));
}

/** אותו עיגול לרשימה (ערכים פגומים מדולגים). */
export function roundAll(values: readonly number[], step = 1, dir: RoundDir = 'nearest'): number[] {
  if (!Array.isArray(values)) return [];
  const out: number[] = [];
  for (const v of values) {
    const r = roundTo(v, step, dir);
    if (Number.isFinite(r)) out.push(r);
  }
  return out;
}
