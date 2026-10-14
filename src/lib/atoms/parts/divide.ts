/**
 * ✂️ חלק `divide` — חלוקה לחלקים שווים (פורק ממנוע הזמנים, חלק 7: 12 שעות זמניות).
 * לא יודע מה הוא מחלק: דקות, שקלים, מטרים — שני מספרים. טהור, דטרמיניסטי, לא זורק.
 */

/** טווח: התחלה וסוף (כל יחידה). */
export interface Span {
  from: number;
  to: number;
}

/** חלק שנחתך מטווח. */
export interface Piece {
  from: number;
  to: number;
  length: number;
}

export interface DivideOpts {
  /** לכמה חלקים שווים (גובר על size). */
  parts?: number;
  /** או: גודל קבוע לכל חלק. */
  size?: number;
  /** הפסקה בין חלק לחלק (רק עם size). */
  gap?: number;
  /** מה עושים עם שארית שלא נכנסת בחלק שלם (רק עם size): 'drop' זורקים · 'shorten' חלק אחרון קצר יותר. */
  remainder?: 'drop' | 'shorten';
}

/** תקרת-בטיחות — קלט שגוי לא יוצר מיליוני חלקים. */
export const DIVIDE_MAX_PIECES = 10_000;

const fin = (v: unknown): v is number => typeof v === 'number' && Number.isFinite(v);

function validSpan(span: unknown): span is Span {
  const s = span as Span | null;
  return !!s && fin(s.from) && fin(s.to) && s.to >= s.from;
}

/**
 * חלוקת טווח. לפי מספר: `parts` חלקים שווים (הגבול ה-k = from + (to−from)/parts·k — אותה נוסחה
 * כמו השעה הזמנית). לפי גודל: חלקים בגודל `size` עם `gap` ביניהם; שארית — נזרקת או מקוצרת.
 * קלט פגום ⇒ [].
 */
export function divideSpan(span: Span, opts: DivideOpts = {}): Piece[] {
  if (!validSpan(span)) return [];
  const o = opts ?? {};
  const len = span.to - span.from;
  if (o.parts !== undefined) {
    const n = Math.floor(Number(o.parts));
    if (!fin(n) || n < 1 || n > DIVIDE_MAX_PIECES) return [];
    const unit = len / n;
    const out: Piece[] = [];
    for (let k = 0; k < n; k++) {
      const from = k === 0 ? span.from : span.from + unit * k;
      const to = k === n - 1 ? span.to : span.from + unit * (k + 1);
      out.push({ from, to, length: to - from });
    }
    return out;
  }
  const size = Number(o.size);
  if (!fin(size) || size <= 0) return [];
  const gap = fin(o.gap) && o.gap > 0 ? o.gap : 0;
  const shorten = o.remainder === 'shorten';
  const out: Piece[] = [];
  let cur = span.from;
  while (cur < span.to && out.length < DIVIDE_MAX_PIECES) {
    const end = cur + size;
    if (end > span.to) {
      if (shorten) out.push({ from: cur, to: span.to, length: span.to - cur });
      break;
    }
    out.push({ from: cur, to: end, length: size });
    cur = end + gap;
  }
  return out;
}

/**
 * נקודות בתוך טווח שחולק ל-`parts`: למשל 3, 4 ו-6 מתוך 12 (סוף ק״ש, סוף תפילה, חצות). גם שבר (10.75).
 * החישוב = from + ((to−from)/parts)·at — בדיוק כמו `sr + k·gra` במנוע הזמנים. פגום ⇒ מדולג.
 */
export function pointsAt(span: Span, parts: number, at: readonly number[]): number[] {
  if (!validSpan(span) || !fin(parts) || parts <= 0 || !Array.isArray(at)) return [];
  const unit = (span.to - span.from) / parts;
  const out: number[] = [];
  for (const a of at) if (fin(a)) out.push(span.from + a * unit);
  return out;
}

/** מספר ספרות אחרי הנקודה בצעד (0.01 ⇒ 2), עד 10. */
function decimalsOf(step: number): number {
  const s = String(step);
  const e = /e-(\d+)$/.exec(s);
  if (e) return Math.min(10, Number(e[1]));
  const i = s.indexOf('.');
  return i < 0 ? 0 : Math.min(10, s.length - i - 1);
}

/**
 * חלוקת סכום ל-`parts` חלקים, כל חלק מעוגל ל-`step` (ברירה 1). הסכום יוצא בדיוק `total`:
 * השארית שלא מתחלקת הולכת לחלק הראשון. שלילי — בסדר (חיתוך לכיוון אפס). פגום ⇒ [].
 */
export function divideAmount(total: number, parts: number, step = 1): number[] {
  const n = Math.floor(Number(parts));
  if (!fin(total) || !fin(n) || n < 1 || n > DIVIDE_MAX_PIECES) return [];
  const st = fin(step) && step > 0 ? step : 1;
  const dec = decimalsOf(st);
  const fix = (v: number): number => Number(v.toFixed(dec));
  const units = Math.round(total / st);
  const base = fix(Math.trunc(units / n) * st);
  const out: number[] = Array.from({ length: n }, () => base);
  out[0] = fix(total - base * (n - 1));
  return out;
}
