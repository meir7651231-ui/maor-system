// בניית קובץ עדכון חתום לכרטיס: node tools/make-update.mjs <גרסה> <קובץ-תוכנה> [הערות] [מספר-רישום]
// מפתח: ~/.kupa/update-key.json (או KUPA_UPDATE_KEY=נתיב). פלט: KUPA-UPDATE.json בתיקייה הנוכחית.
import { readFileSync, writeFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';
import { webcrypto } from 'node:crypto';
import { makeManifest, signedMessage, bytesToB64, UPDATE_FILE } from '../engine/update.mjs';

const [version, payloadPath, notes = '', regNo = ''] = process.argv.slice(2);
if (!/^\d+\.\d+\.\d+$/.test(version || '') || !payloadPath) {
  console.error('שימוש: node tools/make-update.mjs 1.1.0 dist/firmware.bin "תיאור" "מספר-רישום"');
  process.exit(1);
}
const keyFile = process.env.KUPA_UPDATE_KEY || join(homedir(), '.kupa', 'update-key.json');
const { pkcs8 } = JSON.parse(readFileSync(keyFile, 'utf8'));
const key = await webcrypto.subtle.importKey('pkcs8', Buffer.from(pkcs8, 'base64'), { name: 'Ed25519' }, false, ['sign']);
const payload = new Uint8Array(readFileSync(payloadPath));
const p = (n) => String(n).padStart(2, '0');
const d = new Date();
const manifest = makeManifest({ version, notes, regNo, created: `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}` }, payload);
const sig = new Uint8Array(await webcrypto.subtle.sign('Ed25519', key, signedMessage(manifest)));
writeFileSync(UPDATE_FILE, JSON.stringify({ manifest, payload: bytesToB64(payload), sig: bytesToB64(sig) }));
console.log(`נוצר ${UPDATE_FILE}: גרסה ${version}, ${payload.length} בתים, טביעה ${manifest.sha256.slice(0, 16)}…`);
