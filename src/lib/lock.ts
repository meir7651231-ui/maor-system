/**
 * נעילת גישה — גיבוב וקידוד של קודי הכניסה (ראשית/משנית).
 *
 * הקוד נשמר מגובב (SHA-256 עם מלח קבוע) ולא כטקסט גלוי, כדי שלא יופיע גלוי
 * בקובץ הגיבוי או בענן. זו הגנת-גישה מפני עיון מזדמן — לא הצפנת נתונים:
 * קוד קצר ניתן לפיצוח בכוח מול הגיבוב, ולכן אין להסתמך עליה מול תוקף נחוש.
 */
import { nsLsKey } from '../store/persist';

/** אזורים שהנעילה המשנית ("מנהל") יכולה להגן עליהם. */
export type LockZone = 'wizard' | 'settings' | 'supporters' | 'reports';

export const LOCK_ZONES: { key: LockZone; label: string }[] = [
  { key: 'wizard', label: 'אשף ההרכבה' },
  { key: 'settings', label: 'הגדרות' },
  { key: 'supporters', label: 'תורמים' },
  { key: 'reports', label: 'דוחות' },
];

/** ברירת מחדל להגנת המנהל: האשף וההגדרות (הקונפיגורציה). */
export const DEFAULT_LOCK_ZONES: LockZone[] = ['wizard', 'settings'];

const SALT = 'maor.lock.v1::';

/**
 * קודי הנעילה נשמרים במכשיר בלבד (localStorage) — לא ב-db, ולכן לא בגיבוי
 * ולא בסנכרון הענן. כך: גיבוי לא "מחזיר" נעילה, ו"שכחתי קוד" = איפוס מקומי
 * בלי לאבד נתונים. הקוד מגובב; זו הרתעה מפני עיון מזדמן, לא הצפנת נתונים.
 */
export interface LockCfg {
  primary?: string;
  secondary?: string;
  zones?: string[];
}

const LOCK_BASE = 'maor_lock';

/** מפתח הנעילה בתחום הנוכחי (פר-ארגון, הכרעת בעלים 5.3). default ⇒ 'maor_lock'
 *  (ביט-זהה להיום); ארגון-פלטפורמה ⇒ 'maor_lock:{slug}'. */
export function lockKey(): string {
  return nsLsKey(LOCK_BASE);
}

export function readLock(): LockCfg {
  try {
    const key = lockKey();
    let raw = localStorage.getItem(key);
    // מיגרציה רכה: ארגון ממורחב-שם ללא נעילה משלו — קורא את הנעילה הישנה
    // (bare 'maor_lock') כדי לא לאבד PIN קיים; הכתיבה הבאה תעביר לתחום.
    if (raw == null && key !== LOCK_BASE) raw = localStorage.getItem(LOCK_BASE);
    return raw ? (JSON.parse(raw) as LockCfg) : {};
  } catch {
    return {};
  }
}

export function writeLock(cfg: LockCfg): void {
  try {
    const key = lockKey();
    if (!cfg.primary && !cfg.secondary) localStorage.removeItem(key);
    else localStorage.setItem(key, JSON.stringify(cfg));
  } catch {
    /* localStorage חסום (מצב פרטי) — הנעילה תפעל לסשן הנוכחי בלבד */
  }
}

/** קוד תקין: 4–8 ספרות. */
export function isValidPin(pin: string): boolean {
  return /^\d{4,8}$/.test(pin);
}

/** גיבוב הקוד ל-hex של SHA-256 (עם מלח). */
export async function hashPin(pin: string): Promise<string> {
  const data = new TextEncoder().encode(SALT + pin);
  const buf = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

/** בדיקת קוד מול גיבוב שמור. גיבוב חסר/ריק → תמיד false. */
export async function verifyPin(pin: string, hash: string | undefined): Promise<boolean> {
  if (!hash) return false;
  return (await hashPin(pin)) === hash;
}
