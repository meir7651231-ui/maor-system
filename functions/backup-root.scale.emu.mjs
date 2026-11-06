/**
 * מדידת-קנה-מידה · G1 — backupNightly על שורש בגודל הלקוח-החי (~16k תורמים, ~34MB).
 * אמולטור בלבד, נתונים סינתטיים: npm run test:backup-scale (SCALE=16000 ברירת-מחדל).
 * מדפיס זמן-ריצה, שיא-RSS/heap וגודל-הצילום. לא שער — כלי-מדידה.
 */
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
for (const k of ['FIRESTORE_EMULATOR_HOST', 'FIREBASE_STORAGE_EMULATOR_HOST']) {
  if (!process.env[k]) throw new Error(k + ' חסר — מריצים רק דרך firebase emulators:exec');
}
process.env.GCLOUD_PROJECT ||= 'demo-maor';
process.env.FIREBASE_CONFIG ||= JSON.stringify({ projectId: 'demo-maor', storageBucket: 'demo-maor.appspot.com' });
const SCALE = Number(process.env.SCALE || 16000);
const HIST = Number(process.env.HIST || 18);

const fns = require('./index.js');
const { getFirestore } = require('firebase-admin/firestore');
const { getStorage } = require('firebase-admin/storage');
const db = getFirestore();
const bucket = getStorage().bucket();

await db.doc('meta/org').set({ orgName: 'שורש-קנה-מידה', seq: SCALE });
const w = db.bulkWriter();
for (let i = 0; i < SCALE; i++) {
  const hist = Array.from({ length: HIST }, (_, j) => ({ d: '2025-0' + ((j % 9) + 1) + '-15', a: 100 + j, c: '₪', note: 'תרומה סינתטית מספר ' + j + ' לבדיקת-נפח' }));
  w.set(db.doc('supporters/s' + i), { id: 's' + i, name: 'תורם סינתטי ' + i, phone: '05' + String(i).padStart(8, '0'), city: 'עיר-בדיקה', email: 's' + i + '@example.invalid', notes: 'הערה סינתטית '.repeat(8), hist });
}
await w.close();

if (global.gc) { global.gc(); global.gc(); }
let peakRss = 0, peakHeap = 0;
const tick = setInterval(() => { const m = process.memoryUsage(); peakRss = Math.max(peakRss, m.rss); peakHeap = Math.max(peakHeap, m.heapUsed); }, 20);
const baseRss = process.memoryUsage().rss;
const baseHeap = process.memoryUsage().heapUsed;
const t0 = Date.now();
await fns.backupNightly.run({});
const ms = Date.now() - t0;
clearInterval(tick);
const today = new Date().toISOString().slice(0, 10);
const [meta] = await bucket.file('backups/root/' + today + '.json').getMetadata();
const MB = (b) => (b / 1048576).toFixed(1) + 'MB';
console.log('📏 G1 scale', JSON.stringify({ supporters: SCALE, hist: HIST, snapshot: MB(Number(meta.size)), ms, baseRss: MB(baseRss), baseHeap: MB(baseHeap), peakRss: MB(peakRss), peakHeap: MB(peakHeap) }));
process.exit(0);
