/**
 * הוכחת-אמולטור · G1 (6.11.2026) — backupNightly מצלם גם את הלקוח-החי (שורש).
 * הרצה (אמולטור בלבד, אפס-ענן): npm run test:backup-emu
 * זורע נתוני-בדיקה סינתטיים בשורש + ארגון-פלטפורמה, מריץ את ה-handler האמיתי
 * (exports.backupNightly.run) ובודק: backups/root/{date}.json קיים ומכיל meta/envelope/
 * את כל אוספי-השורש; backups/acme/{date}.json ללא-שינוי-התנהגות ולא מערבב נתוני-שורש;
 * טבעת-30 נאכפת גם לשורש.
 */
import { createRequire } from 'node:module';
import assert from 'node:assert/strict';
const require = createRequire(import.meta.url);

for (const k of ['FIRESTORE_EMULATOR_HOST', 'FIREBASE_STORAGE_EMULATOR_HOST']) {
  if (!process.env[k]) throw new Error(k + ' חסר — מריצים רק דרך firebase emulators:exec');
}
process.env.GCLOUD_PROJECT ||= 'demo-maor';
process.env.FIREBASE_CONFIG ||= JSON.stringify({ projectId: 'demo-maor', storageBucket: 'demo-maor.appspot.com' });

const fns = require('./index.js');
const { getFirestore } = require('firebase-admin/firestore');
const { getStorage } = require('firebase-admin/storage');
const db = getFirestore();
const bucket = getStorage().bucket();

// ── זריעה סינתטית ──
await db.doc('meta/org').set({ orgName: 'שורש-בדיקה', seq: 7, donationSeq: 3 });
await db.doc('_enc/envelope').set({ v: 1, wrapped: 'test' });
await db.doc('families/f1').set({ name: 'משפחת-בדיקה' });
await db.doc('supporters/s1').set({ name: 'תורם-בדיקה' });
await db.doc('warehouse/w1').set({ name: 'מחסן' });
await db.doc('donations/D-1').set({ rid: 'D-1', amount: 10 });
await db.doc('platformOrgs/acme').set({ config: {} });
await db.doc('orgs/acme/meta/org').set({ orgName: 'אקמה' });
await db.doc('orgs/acme/families/a1').set({ name: 'משפחת-אקמה' });
// טבעת: 31 צילומי-שורש ישנים ⇒ אחרי הריצה נשארים 30
for (let i = 1; i <= 31; i++) {
  await bucket.file('backups/root/2000-01-' + String(i).padStart(2, '0') + '.json').save('{}');
}

await fns.backupNightly.run({});

const today = new Date().toISOString().slice(0, 10);
const read = async (p) => JSON.parse((await bucket.file(p).download())[0].toString('utf8'));
const root = await read('backups/root/' + today + '.json');
assert.equal(root.slug, 'root');
assert.equal(root.meta.orgName, 'שורש-בדיקה');
assert.deepEqual(root.envelope, { v: 1, wrapped: 'test' });
assert.deepEqual(Object.keys(root.collections).sort(), ['donations', 'families', 'supporters', 'warehouse']);
assert.equal(root.collections.families[0].id, 'f1');
assert.equal(root.collections.donations[0].rid, 'D-1');

const acme = await read('backups/acme/' + today + '.json');
assert.equal(acme.slug, 'acme');
assert.equal(acme.meta.orgName, 'אקמה');
assert.deepEqual(Object.keys(acme.collections), ['families']);
assert.equal(acme.collections.families[0].id, 'a1');

const [rootFiles] = await bucket.getFiles({ prefix: 'backups/root/' });
assert.equal(rootFiles.length, 30, 'טבעת-30 לשורש');
assert.ok(rootFiles.some((f) => f.name.endsWith(today + '.json')));
assert.ok(!rootFiles.some((f) => f.name.endsWith('2000-01-01.json')), 'הישן ביותר נמחק');

console.log('✅ G1 backup-root emulator: root snapshot', JSON.stringify({
  file: 'backups/root/' + today + '.json',
  collections: Object.fromEntries(Object.entries(root.collections).map(([k, v]) => [k, v.length])),
  meta: !!root.meta, envelope: !!root.envelope, rootRing: rootFiles.length,
  acmeCollections: Object.keys(acme.collections),
}));
process.exit(0);
