/**
 * 🧯 לוכד-שגיאות-לקוח (סגירת-פערים 15.10.2026) — עד היום קריסת-מסך אצל לקוח
 * נרשמה רק ב-console של הדפדפן שלו (ErrorBoundary) ושגיאות-חלון לא-תפוסות לא
 * נרשמו בכלל ⇒ הבעלים לא ידע. כאן: כל שגיאה נלכדת, מסוננת-כפילויות ומוגבלת-קצב,
 * ונכנסת ל**לוג-הפעולות הקיים** (`logAccess` ⇒ db.audit — רוכב על meta בסנכרון
 * הענן) ⇒ מופיעה למנהל במסך "🧾 לוג פעולות" כמו כל פעולה אחרת. אפס שרת, אפס
 * שירות-חיצוני, אפס סכמה חדשה.
 *
 * מגבלות-ביטחון: הודעה חצובה ל-160 תווים (בלי stack מלא, בלי נתוני-טופס);
 * אותה הודעה נרשמת פעם ב-6 שעות; לכל היותר 10 רישומים ביממה למכשיר — לולאת-קריסה
 * לא מציפה את טבעת-ה-500 של הלוג.
 */
import { nsLsKey } from '../store/persist';

export const ERR_MSG_MAX = 160;
export const ERR_SAME_GAP_MS = 6 * 60 * 60 * 1000;
export const ERR_DAY_CAP = 10;
const KEY_BASE = 'maor_errlog_seen';

/** מצב-הסינון השמור: הודעה ⇒ מתי נרשמה לאחרונה (ms). */
export type ErrSeen = Record<string, number>;

/** טהור — הודעה קצרה ובטוחה מכל דבר שנזרק. */
export function errorText(err: unknown): string {
  let msg = '';
  if (err instanceof Error) msg = (err.name && err.name !== 'Error' ? err.name + ': ' : '') + err.message;
  else if (typeof err === 'string') msg = err;
  else if (err == null) msg = '';
  else {
    try { msg = JSON.stringify(err) ?? String(err); } catch { msg = String(err); }
  }
  msg = msg.replace(/\s+/g, ' ').trim() || 'שגיאה לא-מזוהה';
  return msg.length > ERR_MSG_MAX ? msg.slice(0, ERR_MSG_MAX - 1) + '…' : msg;
}

/** טהור — האם לרשום עכשיו, והמצב המעודכן (מנקה רשומות בנות-יותר-מיממה). */
export function shouldRecord(seen: ErrSeen, msg: string, now: number): { ok: boolean; next: ErrSeen } {
  const next: ErrSeen = {};
  for (const [k, t] of Object.entries(seen)) if (now - t < 24 * 60 * 60 * 1000) next[k] = t;
  const last = next[msg];
  if (last !== undefined && now - last < ERR_SAME_GAP_MS) return { ok: false, next };
  if (Object.keys(next).length >= ERR_DAY_CAP && last === undefined) return { ok: false, next };
  next[msg] = now;
  return { ok: true, next };
}

function readSeen(): ErrSeen {
  try {
    const v = JSON.parse(localStorage.getItem(nsLsKey(KEY_BASE)) || '{}');
    return v && typeof v === 'object' ? (v as ErrSeen) : {};
  } catch {
    return {};
  }
}

/** מחזיר true אם נרשם בפועל (false = המאגר עוד לא נטען — לא נוגעים בו). */
export type ErrorSink = (act: string, what: string) => boolean;
let sink: ErrorSink | null = null;

/** main.tsx מחבר את הלוג (logAccess של ה-store) — בלי ייבוא-מעגלי של ה-store לכאן. */
export function setErrorSink(fn: ErrorSink | null): void {
  sink = fn;
}

/** לוכד שגיאה אחת. `where`: 'מסך' (ErrorBoundary) / 'חלון' / 'הבטחה'. לעולם לא זורק. */
export function recordError(err: unknown, where: string, now = Date.now()): void {
  try {
    const msg = errorText(err);
    const { ok, next } = shouldRecord(readSeen(), msg, now);
    if (!ok || !sink) return;
    // נרשם-בפועל בלבד מסומן "נראה" — שגיאה לפני טעינת-המאגר לא נבלעת ל-6 שעות
    if (!sink('🧯 שגיאה · ' + where, msg + ' · ' + (typeof location !== 'undefined' ? location.hash || '/' : ''))) return;
    try { localStorage.setItem(nsLsKey(KEY_BASE), JSON.stringify(next)); } catch { /* storage חסום */ }
  } catch {
    /* לוכד-השגיאות לעולם לא מפיל את האפליקציה */
  }
}

let installed = false;

/** מתקין מאזינים גלובליים פעם אחת (main.tsx). */
export function installErrorCapture(): void {
  if (installed || typeof window === 'undefined') return;
  installed = true;
  window.addEventListener('error', (e) => {
    // שגיאת-טעינת-משאב (img/script) — לא קריסת-קוד; ResizeObserver — רעש-דפדפן ידוע
    if (!(e instanceof ErrorEvent) || !e.message || /ResizeObserver loop/.test(e.message)) return;
    recordError(e.error ?? e.message, 'חלון');
  });
  window.addEventListener('unhandledrejection', (e) => recordError(e.reason, 'הבטחה'));
}
