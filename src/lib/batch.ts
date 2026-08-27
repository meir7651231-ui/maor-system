/**
 * runBatch — מנוע עיבוד-צובר טהור (בלי store/DOM/רשת).
 *
 * למה: פעולות-צובר (שליחת-מייל מרוכזת, סנכרון פר-רשומה, ייבוא) רצו עד היום
 * בלולאה סדרתית `for … await` — איטי, בלי ניסיון-חוזר, והמשתמש רואה גלגל
 * סתום בלי מושג כמה נשאר. המנוע הזה נותן לכל לולאה כזו, בחינם:
 *   • מקביליות מבוקרת (concurrency) — מהיר יותר בלי להציף.
 *   • ניסיונות-חוזרים עם השהיה-מדורגת (backoff) — התאוששות אוטומטית.
 *     ברירת-המחדל מנסה-שוב **רק** על שגיאות-מעבר (חסימת-קצב / זמנית) שקורות
 *     *לפני* שהכתיבה נקלטה — ⇒ בטוח לכתיבות: אין סיכון-שכפול על שגיאה גנרית.
 *   • דיווח-התקדמות חי (onProgress) — "נשלח 34 / 60".
 *
 * טהור ודטרמיניסטי: אין Date.now / Math.random. סדר-התוצאות = סדר-הקלט
 * (results[i]/errors[i] תואמים ל-items[i]), גם כשרצים במקביל.
 */

export interface BatchOptions {
  /** כמה עבודות במקביל. ברירת-מחדל 4. */
  concurrency?: number;
  /** מספר ניסיונות-חוזרים (מעבר לניסיון הראשון). ברירת-מחדל 2. */
  retries?: number;
  /** בסיס ההשהיה-המדורגת (ms). ברירת-מחדל 400. */
  minDelayMs?: number;
  /** תקרת ההשהיה-המדורגת (ms). ברירת-מחדל 4000. */
  maxDelayMs?: number;
  /** האם שווה לנסות-שוב על השגיאה. ברירת-מחדל: isTransientError. */
  shouldRetry?: (err: unknown) => boolean;
  /** נקרא אחרי כל פריט שהוכרע — done עולה מונוטונית מ-0 עד total. */
  onProgress?: (done: number, total: number) => void;
}

export interface BatchResult<R> {
  /** כמה הצליחו. */
  ok: number;
  /** כמה נכשלו (אחרי מיצוי הניסיונות). */
  fail: number;
  /** תוצאה פר-אינדקס (undefined היכן שנכשל). */
  results: (R | undefined)[];
  /** שגיאה פר-אינדקס (undefined היכן שהצליח). */
  errors: unknown[];
}

/**
 * שגיאת-מעבר: חסימת-קצב או תקלה-זמנית שקרתה *לפני* קליטת-הפעולה ⇒ בטוח
 * לנסות-שוב (אין קליטה חלקית ⇒ אין שכפול). שגיאה גנרית אחרת = לא-בטוח.
 */
export function isTransientError(err: unknown): boolean {
  const msg = (err instanceof Error ? err.message : String(err ?? '')).toLowerCase();
  const code =
    err && typeof err === 'object' && 'code' in err
      ? String((err as { code: unknown }).code).toLowerCase()
      : '';
  return (
    msg.includes('429') ||
    msg.includes('rate limit') ||
    msg.includes('ratelimit') ||
    msg.includes('quota') ||
    msg.includes('resource-exhausted') ||
    msg.includes('unavailable') ||
    msg.includes('deadline') ||
    msg.includes('network') ||
    msg.includes('timeout') ||
    code === 'resource-exhausted' ||
    code === 'unavailable' ||
    code === 'deadline-exceeded'
  );
}

function backoffMs(attempt: number, min: number, max: number): number {
  // attempt 1-based: min, min*2, min*4 … עד max.
  return Math.min(max, min * 2 ** (attempt - 1));
}

function sleep(ms: number): Promise<void> {
  return ms > 0 ? new Promise((r) => setTimeout(r, ms)) : Promise.resolve();
}

/**
 * מריץ את `worker` על כל פריט ב-`items` במקביל-מבוקר, עם ניסיונות-חוזרים
 * ודיווח-התקדמות. לעולם לא זורק — כשלים נספרים ב-`fail` ונרשמים ב-`errors`.
 */
export async function runBatch<T, R>(
  items: readonly T[],
  worker: (item: T, index: number) => Promise<R>,
  opts: BatchOptions = {},
): Promise<BatchResult<R>> {
  const concurrency = Math.max(1, opts.concurrency ?? 4);
  const retries = Math.max(0, opts.retries ?? 2);
  const minDelayMs = opts.minDelayMs ?? 400;
  const maxDelayMs = opts.maxDelayMs ?? 4000;
  const shouldRetry = opts.shouldRetry ?? isTransientError;
  const onProgress = opts.onProgress;

  const total = items.length;
  const results: (R | undefined)[] = Array.from({ length: total }, () => undefined);
  const errors: unknown[] = Array.from({ length: total }, () => undefined);
  let ok = 0;
  let fail = 0;
  let done = 0;
  let cursor = 0;

  onProgress?.(0, total);

  async function processOne(index: number): Promise<void> {
    let lastErr: unknown;
    let settled = false;
    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        results[index] = await worker(items[index], index);
        ok += 1;
        settled = true;
        break;
      } catch (err) {
        lastErr = err;
        if (attempt < retries && shouldRetry(err)) {
          await sleep(backoffMs(attempt + 1, minDelayMs, maxDelayMs));
          continue;
        }
        break;
      }
    }
    if (!settled) {
      errors[index] = lastErr;
      fail += 1;
    }
    done += 1;
    onProgress?.(done, total);
  }

  async function runner(): Promise<void> {
    while (cursor < total) {
      const index = cursor;
      cursor += 1;
      await processOne(index);
    }
  }

  const runners: Promise<void>[] = [];
  for (let i = 0; i < Math.min(concurrency, total); i++) runners.push(runner());
  await Promise.all(runners);

  return { ok, fail, results, errors };
}
