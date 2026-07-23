/**
 * הצפנת נתונים במנוחה (opt-in) — AES-GCM 256 עם מפתח נתונים אקראי (DEK)
 * שעטוף פעמיים: פעם בסיסמה (PBKDF2) ופעם ב"מפתח שחזור" אקראי שמוצג פעם אחת.
 *
 * יתרון העטיפה הכפולה: שינוי סיסמה = עטיפה מחדש של ה-DEK בלבד (לא הצפנה
 * מחדש של כל הנתונים), ומפתח השחזור תמיד פותח — גם אם הסיסמה נשכחה.
 *
 * זו הצפנה אמיתית: בלי הסיסמה או מפתח השחזור אי אפשר לקרוא את הנתונים.
 * שכחת את שניהם = הנתונים אבודים לצמיתות (אין דלת אחורית).
 */

const PBKDF2_ITER = 210_000;
const enc = new TextEncoder();
const dec = new TextDecoder();

/** מעטפת הנתונים המוצפנת שנשמרת במקום ה-JSON הגלוי. */
export interface EncEnvelope {
  $enc: 2;
  iter: number;
  saltPass: string; // מלח גזירת המפתח מהסיסמה
  saltRec: string; // מלח גזירת המפתח ממפתח השחזור
  wrapPass: string; // ה-DEK עטוף בסיסמה (iv:ct)
  wrapRec: string; // ה-DEK עטוף במפתח השחזור (iv:ct)
  data: string; // הנתונים המוצפנים ב-DEK (iv:ct)
}

const b64 = (buf: ArrayBuffer | Uint8Array): string => {
  const bytes = buf instanceof Uint8Array ? buf : new Uint8Array(buf);
  let s = '';
  for (const b of bytes) s += String.fromCharCode(b);
  return btoa(s);
};
const unb64 = (s: string): Uint8Array => Uint8Array.from(atob(s), (c) => c.charCodeAt(0));
const rand = (n: number): Uint8Array => crypto.getRandomValues(new Uint8Array(n));

/** גזירת מפתח-עטיפה (AES-GCM) מסוד טקסטואלי + מלח, דרך PBKDF2-SHA256. */
async function deriveWrapKey(secret: string, salt: Uint8Array, iter: number): Promise<CryptoKey> {
  const base = await crypto.subtle.importKey('raw', enc.encode(secret), 'PBKDF2', false, ['deriveKey']);
  return crypto.subtle.deriveKey(
    { name: 'PBKDF2', salt: salt as BufferSource, iterations: iter, hash: 'SHA-256' },
    base,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt'],
  );
}

/** הצפנה: iv אקראי → "iv:ct" ב-base64. */
async function aesEnc(key: CryptoKey, plain: Uint8Array): Promise<string> {
  const iv = rand(12);
  const ct = await crypto.subtle.encrypt({ name: 'AES-GCM', iv: iv as BufferSource }, key, plain as BufferSource);
  return b64(iv) + ':' + b64(ct);
}

/** פענוח "iv:ct" — זורק אם המפתח שגוי או הנתונים שונו. */
async function aesDec(key: CryptoKey, blob: string): Promise<Uint8Array> {
  const [ivB, ctB] = blob.split(':');
  const buf = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv: unb64(ivB) as BufferSource },
    key,
    unb64(ctB) as BufferSource,
  );
  return new Uint8Array(buf);
}

/** מפתח שחזור קריא: 6 קבוצות של 4 תווים (base32 ללא תווים מבלבלים). */
export function genRecoveryKey(): string {
  const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // בלי I,O,0,1
  const bytes = rand(24);
  const chars = [...bytes].map((b) => ALPHABET[b % ALPHABET.length]);
  const groups: string[] = [];
  for (let i = 0; i < chars.length; i += 4) groups.push(chars.slice(i, i + 4).join(''));
  return groups.join('-');
}

/** יצירת מעטפת מוצפנת חדשה: DEK אקראי, עטוף בסיסמה ובמפתח השחזור. */
export async function encryptDb(json: string, password: string, recoveryKey: string): Promise<EncEnvelope> {
  const dekRaw = rand(32);
  const dek = await crypto.subtle.importKey('raw', dekRaw as BufferSource, 'AES-GCM', true, [
    'encrypt',
    'decrypt',
  ]);
  const saltPass = rand(16);
  const saltRec = rand(16);
  const kPass = await deriveWrapKey(password, saltPass, PBKDF2_ITER);
  const kRec = await deriveWrapKey(recoveryKey, saltRec, PBKDF2_ITER);
  return {
    $enc: 2,
    iter: PBKDF2_ITER,
    saltPass: b64(saltPass),
    saltRec: b64(saltRec),
    wrapPass: await aesEnc(kPass, dekRaw),
    wrapRec: await aesEnc(kRec, dekRaw),
    data: await aesEnc(dek, enc.encode(json)),
  };
}

/** האם הערך הוא מעטפת מוצפנת. */
export function isEncrypted(raw: unknown): raw is EncEnvelope {
  return !!raw && typeof raw === 'object' && (raw as { $enc?: unknown }).$enc === 2;
}

/** חילוץ ה-DEK מהמעטפת בעזרת סיסמה או מפתח שחזור. null = סוד שגוי. */
export async function openDek(
  env: EncEnvelope,
  secret: string,
  via: 'pass' | 'rec',
): Promise<CryptoKey | null> {
  try {
    const salt = unb64(via === 'pass' ? env.saltPass : env.saltRec);
    const wrap = via === 'pass' ? env.wrapPass : env.wrapRec;
    const wrapKey = await deriveWrapKey(secret, salt, env.iter);
    const dekRaw = await aesDec(wrapKey, wrap);
    return crypto.subtle.importKey('raw', dekRaw as BufferSource, 'AES-GCM', true, ['encrypt', 'decrypt']);
  } catch {
    return null; // סוד שגוי או מעטפת פגומה
  }
}

/** פענוח הנתונים בעזרת DEK שכבר חולץ. */
export async function decryptDb(env: EncEnvelope, dek: CryptoKey): Promise<string> {
  return dec.decode(await aesDec(dek, env.data));
}

/** הצפנת JSON חדש עם DEK קיים (שמירה שוטפת) — שומר על אותה מעטפת/עטיפות. */
export async function reencryptDb(env: EncEnvelope, dek: CryptoKey, json: string): Promise<EncEnvelope> {
  return { ...env, data: await aesEnc(dek, enc.encode(json)) };
}

/** החלפת סיסמה בלי להצפין מחדש את הנתונים — עוטף מחדש את ה-DEK בלבד. */
export async function rewrapPassword(env: EncEnvelope, dek: CryptoKey, newPassword: string): Promise<EncEnvelope> {
  const dekRaw = await crypto.subtle.exportKey('raw', dek);
  const saltPass = rand(16);
  const kPass = await deriveWrapKey(newPassword, saltPass, env.iter);
  return { ...env, saltPass: b64(saltPass), wrapPass: await aesEnc(kPass, new Uint8Array(dekRaw)) };
}
