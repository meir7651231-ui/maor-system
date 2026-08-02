/**
 * הצפנת-ענן במנוחה (opt-in) — doc-level, בגבול-החוט. מבוסס העיצוב
 * `knowledge/DESIGN-CLOUD-ENCRYPTION-2026-08-01.md`. בונה על `crypto.ts` הקיים
 * (envelope: DEK עטוף בסיסמה + מפתח-שחזור) בלי לגעת בו.
 *
 * המיזוג כבר doc-level (applyEntityPartial = upsert-by-id) ⇒ הצפנה ברמת-המסמך
 * לא מאבדת גרעיניות. ה-diff/merge נשארים על plaintext; ההצפנה חיה רק כאן.
 *
 * טהור (בלי store/DOM) — נבדק ביחידה.
 */
import { encryptDb, isEncrypted, openDek, type EncEnvelope } from './crypto';

const encoder = new TextEncoder();
const decoder = new TextDecoder();

const b64 = (buf: ArrayBuffer | Uint8Array): string => {
  const bytes = buf instanceof Uint8Array ? buf : new Uint8Array(buf);
  let s = '';
  for (const b of bytes) s += String.fromCharCode(b);
  return btoa(s);
};
const unb64 = (s: string): Uint8Array => Uint8Array.from(atob(s), (c) => c.charCodeAt(0));

/** מסמך-ישות מוצפן בחוט: ה-id נשאר מפתח-המסמך (plaintext); enc+iv בלבד. */
export interface EncDoc {
  enc: string; // base64(ciphertext)
  iv: string; // base64(iv, 12 בייט — חדש בכל כתיבה)
}

export function isEncDoc(d: unknown): d is EncDoc {
  return !!d && typeof d === 'object' && typeof (d as EncDoc).enc === 'string' && typeof (d as EncDoc).iv === 'string';
}

/** הצפנת מסמך (אובייקט) ל-{enc,iv} עם ה-DEK. IV אקראי לכל כתיבה (חובה ל-GCM). */
export async function encryptDoc(plain: unknown, dek: CryptoKey): Promise<EncDoc> {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const ct = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv: iv as BufferSource },
    dek,
    encoder.encode(JSON.stringify(plain)) as BufferSource,
  );
  return { enc: b64(ct), iv: b64(iv) };
}

/**
 * פענוח מסמך שנקרא מהחוט. **תאימות-לאחור:** מסמך בלי enc/iv (plaintext ישן)
 * מוחזר כמו-שהוא — כך ארגון יכול להכיל מסמכים מעורבים בזמן מיגרציה.
 */
export async function decryptDoc(d: Record<string, unknown>, dek: CryptoKey): Promise<Record<string, unknown>> {
  if (!isEncDoc(d)) return d; // plaintext — לא מוצפן
  const buf = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv: unb64(d.iv) as BufferSource },
    dek,
    unb64(d.enc) as BufferSource,
  );
  return JSON.parse(decoder.decode(buf)) as Record<string, unknown>;
}

/**
 * יצירת envelope-מפתח לענן: DEK אקראי עטוף בסיסמה + מפתח-שחזור. מחזיר גם את
 * ה-DEK החי (לשימוש מיידי). ה-envelope נשמר ב-`orgs/{slug}/_enc/envelope`.
 * (משתמש ב-encryptDb עם json ריק — רק העטיפות נחוצות; ה-data מתעלמים ממנו.)
 */
export async function createCloudKey(password: string, recoveryKey: string): Promise<{ env: EncEnvelope; dek: CryptoKey }> {
  const env = await encryptDb('', password, recoveryKey);
  const dek = await openDek(env, password, 'pass');
  if (!dek) throw new Error('יצירת מפתח-הצפנה נכשלה');
  return { env, dek };
}

/** חילוץ ה-DEK מ-envelope בעזרת סיסמה או מפתח-שחזור. null = סוד שגוי. */
export function openCloudKey(env: EncEnvelope, secret: string, via: 'pass' | 'rec'): Promise<CryptoKey | null> {
  return openDek(env, secret, via);
}

export { isEncrypted };
