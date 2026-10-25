// יצירת זוג מפתחות לעדכוני תוכנה (פעם אחת, אצל הבעלים).
// המפתח הפרטי נשמר מחוץ לריפו (ברירת מחדל: ~/.kupa/update-key.json) — לא לשתף, לגבות במקום בטוח.
// את המפתח הציבורי מדביקים ב-engine/update.mjs ⇒ UPDATE_PUBKEY.
import { writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { homedir } from 'node:os';
import { join, dirname } from 'node:path';
import { webcrypto } from 'node:crypto';

const out = process.argv[2] || join(homedir(), '.kupa', 'update-key.json');
if (existsSync(out)) { console.error('קיים כבר מפתח ב-' + out + ' — לא דורסים'); process.exit(1); }
const k = await webcrypto.subtle.generateKey({ name: 'Ed25519' }, true, ['sign', 'verify']);
const priv = await webcrypto.subtle.exportKey('pkcs8', k.privateKey);
const pub = await webcrypto.subtle.exportKey('raw', k.publicKey);
mkdirSync(dirname(out), { recursive: true });
writeFileSync(out, JSON.stringify({ pkcs8: Buffer.from(priv).toString('base64'), pub: Buffer.from(pub).toString('base64') }), { mode: 0o600 });
console.log('נשמר מפתח פרטי:', out);
console.log('מפתח ציבורי (להדביק ב-UPDATE_PUBKEY):', Buffer.from(pub).toString('base64'));
