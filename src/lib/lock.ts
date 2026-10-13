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

/**
 * 🛡️ ביקורת-האמון 24.8: הגיבוב הישן היה SHA-256 חד-סיבובי עם מלח גלובלי קבוע —
 * קוד 4–8 ספרות נפרץ-אופליין במילישניות ממי שקרא את localStorage. הדור החדש:
 * PBKDF2-SHA256 ‏310K איטרציות עם מלח אקראי פר-קוד, בפורמט `v2:{salt}:{hash}`.
 * גיבובים ישנים (hex-64) ממשיכים להיפתח — ומשודרגים בשקט בפתיחה מוצלחת.
 */
const PIN_ITER = 310_000;

function toHex(buf: ArrayBuffer | Uint8Array): string {
  return Array.from(buf instanceof Uint8Array ? buf : new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

async function pbkdf2Pin(pin: string, saltHex: string): Promise<string> {
  const salt = new Uint8Array((saltHex.match(/../g) ?? []).map((h) => parseInt(h, 16)));
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(SALT + pin), 'PBKDF2', false, ['deriveBits']);
  const bits = await crypto.subtle.deriveBits({ name: 'PBKDF2', hash: 'SHA-256', salt, iterations: PIN_ITER }, key, 256);
  return toHex(bits);
}

/** גיבוב קוד — פורמט v2 (PBKDF2 + מלח אקראי). קודים חדשים נשמרים כך בלבד. */
export async function hashPin(pin: string): Promise<string> {
  const saltHex = toHex(crypto.getRandomValues(new Uint8Array(16)));
  return 'v2:' + saltHex + ':' + (await pbkdf2Pin(pin, saltHex));
}

/** גיבוב-לגאסי (SHA-256 חד-סיבובי) — נשמר רק לאימות קודים ישנים. */
async function legacyHashPin(pin: string): Promise<string> {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(SALT + pin));
  return toHex(buf);
}

/** האם הגיבוב השמור בפורמט הישן — פתיחה מוצלחת צריכה לשדרג אותו. */
export function pinNeedsRehash(hash: string | undefined): boolean {
  return !!hash && !hash.startsWith('v2:');
}

/** בדיקת קוד מול גיבוב שמור (v2 או לגאסי). גיבוב חסר/ריק → תמיד false. */
export async function verifyPin(pin: string, hash: string | undefined): Promise<boolean> {
  if (!hash) return false;
  if (hash.startsWith('v2:')) {
    const [, saltHex, digest] = hash.split(':');
    if (!saltHex || !digest) return false;
    return (await pbkdf2Pin(pin, saltHex)) === digest;
  }
  return (await legacyHashPin(pin)) === hash;
}

/**
 * 🛡️ מונה-כשלונות מתמיד (ביקורת-האמון 24.8): המונה הישן חי ב-useState —
 * רענון-דף איפס את ההשהיה וניחוש-המוני חזר לאפס-עלות. עכשיו הוא שורד רענון
 * (localStorage, פר-ארגון). משרת גם את מסכי פתיחת-ההצפנה (מקומית וענן).
 */
export interface PinFails {
  n: number;
  until: number;
}

function failsKey(scope: string): string {
  return nsLsKey('maor_lockfails_' + scope);
}

export function readPinFails(scope: string): PinFails {
  try {
    const raw = localStorage.getItem(failsKey(scope));
    const p = raw ? (JSON.parse(raw) as PinFails) : null;
    return p && typeof p.n === 'number' && typeof p.until === 'number' ? p : { n: 0, until: 0 };
  } catch {
    return { n: 0, until: 0 };
  }
}

/** רישום כישלון: מונה+1 והשהיה לפי cooldownForFails. מחזיר את המצב החדש. */
export function notePinFail(scope: string, now: number): PinFails {
  const cur = readPinFails(scope);
  const n = cur.n + 1;
  const st: PinFails = { n, until: now + cooldownForFails(n) };
  try {
    localStorage.setItem(failsKey(scope), JSON.stringify(st));
  } catch {
    /* מצב פרטי — ההשהיה תחיה בזיכרון הרכיב בלבד */
  }
  return st;
}

export function clearPinFails(scope: string): void {
  try {
    localStorage.removeItem(failsKey(scope));
  } catch {
    /* noop */
  }
}

/** השהיה גדֵלה אחרי כשלונות: 3→5ש׳, 4→15ש׳, 5+→30ש׳ (זהה ללוח שנבדק ב-ratchet). */
export function cooldownForFails(fails: number): number {
  return fails >= 5 ? 30000 : fails >= 4 ? 15000 : fails >= 3 ? 5000 : 0;
}
