/**
 * נעילת גישה — גיבוב וקידוד של קודי הכניסה (ראשית/משנית).
 *
 * הקוד נשמר מגובב (SHA-256 עם מלח קבוע) ולא כטקסט גלוי, כדי שלא יופיע גלוי
 * בקובץ הגיבוי או בענן. זו הגנת-גישה מפני עיון מזדמן — לא הצפנת נתונים:
 * קוד קצר ניתן לפיצוח בכוח מול הגיבוב, ולכן אין להסתמך עליה מול תוקף נחוש.
 */

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
