// עדכון תוכנה דרך כרטיס הזיכרון.
// קובץ KUPA-UPDATE.json בכרטיס = { manifest, payload (base64), sig (base64) }.
// החתימה: Ed25519 על התוכן הקנוני של ה-manifest (שכולל SHA-256 של ה-payload).
// המפתח הפרטי נמצא רק אצל הבעלים (מחוץ לריפו); בקופה רק המפתח הציבורי ⇒
// אי אפשר לזייף עדכון גם עם גישה פיזית לקופה או לכרטיס.
// כללים: רק אותו מוצר, רק גרסה חדשה יותר (אין חזרה לגרסה ישנה), תוכן זהה לטביעה, חתימה תקינה.
// ⚠ לפי הוראות ניהול ספרים, כל גרסה חדשה היא תוכנה חדשה שדורשת רישום ⇒ ה-manifest נושא מספר רישום.
import { sha256, hex, canon } from './sign.mjs';

export const PRODUCT = 'kupa';
export const VERSION = '1.0.0'; // גרסת התוכנה הנוכחית
export const UPDATE_FILE = 'KUPA-UPDATE.json';
// המפתח הציבורי לאימות עדכונים (base64 של 32 בתים). null = עדכונים כבויים עד שהבעלים יוצר מפתח
// (tools/update-keygen.mjs) ומדביק כאן את הציבורי.
export const UPDATE_PUBKEY = null;

export function cmpVersion(a, b) {
  const pa = String(a).split('.').map(Number), pb = String(b).split('.').map(Number);
  for (let i = 0; i < 3; i++) { const d = (pa[i] || 0) - (pb[i] || 0); if (d) return Math.sign(d); }
  return 0;
}

export function b64ToBytes(b64) {
  const bin = atob(b64);
  return Uint8Array.from(bin, (c) => c.charCodeAt(0));
}
export function bytesToB64(bytes) {
  let s = '';
  for (const b of bytes) s += String.fromCharCode(b);
  return btoa(s);
}

// בניית עדכון (בצד הבעלים) — לפני חתימה
export function makeManifest({ version, notes = '', regNo = '', created }, payload) {
  return { product: PRODUCT, version, created, notes, regNo, size: payload.length, sha256: hex(sha256(payload)) };
}
export function signedMessage(manifest) {
  return new TextEncoder().encode(canon(manifest));
}

export function parseUpdate(text) {
  let u;
  try { u = JSON.parse(text); } catch { return { error: 'קובץ העדכון פגום' }; }
  if (!u || typeof u !== 'object' || !u.manifest || typeof u.payload !== 'string' || typeof u.sig !== 'string') return { error: 'קובץ העדכון פגום' };
  return { update: u };
}

// בדיקות שלא דורשות חתימה (סינכרוני, טהור)
export function checkUpdate(update, current = VERSION) {
  const m = update.manifest;
  if (m.product !== PRODUCT) return { error: 'העדכון שייך למוצר אחר' };
  if (!/^\d+\.\d+\.\d+$/.test(String(m.version))) return { error: 'מספר גרסה לא תקין' };
  if (cmpVersion(m.version, current) <= 0) return { error: `הגרסה ${m.version} לא חדשה מהמותקנת (${current})`, old: true };
  let payload;
  try { payload = b64ToBytes(update.payload); } catch { return { error: 'קובץ העדכון פגום' }; }
  if (payload.length !== m.size || hex(sha256(payload)) !== m.sha256) return { error: 'תוכן העדכון לא תואם לטביעה — נפגם או שונה' };
  return { ok: true, payload };
}

// אימות חתימה (אסינכרוני — WebCrypto Ed25519). subtle מוזרק (דפדפן / Node / מכשיר)
export async function verifyUpdate(update, pubKeyB64, subtle = globalThis.crypto?.subtle) {
  if (!pubKeyB64) return { error: 'לא הוגדר מפתח עדכונים בקופה' };
  try {
    const key = await subtle.importKey('raw', b64ToBytes(pubKeyB64), { name: 'Ed25519' }, false, ['verify']);
    const ok = await subtle.verify('Ed25519', key, b64ToBytes(update.sig), signedMessage(update.manifest));
    return ok ? { ok: true } : { error: 'חתימת העדכון לא תקינה — העדכון נדחה' };
  } catch {
    return { error: 'חתימת העדכון לא תקינה — העדכון נדחה' };
  }
}
