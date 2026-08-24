#!/usr/bin/env node
/** 🥇 רתמת-זהב · cloud-diff — הישן (maor/src/lib/cloud-diff.ts, מתורגם-חי) ≡ החדש
 *  (Genesis new/boxes/cloud-diff.mjs) על קורפוס-LCG seed=20260824: מצבי-DB
 *  אקראיים (23 אוספים · דילוג-רפרנס · שינויי-meta · תרומות-תומך) × נתיבים.
 *  אפס-סטייה, אפס Date.now (תאריכים קבועים 't#'). */
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { createRequire } from 'node:module';
import assert from 'node:assert';

const require = createRequire('/home/user/maor-system/');
const ts = require('typescript');
const tdir = fs.mkdtempSync(path.join(os.tmpdir(), 'cd-'));
// המקור המלא — `import type { Db }` נמחק בטרנספילציה (אין תלות-ריצה).
const src = fs.readFileSync('/home/user/maor-system/src/lib/cloud-diff.ts', 'utf8');
fs.writeFileSync(path.join(tdir, 'cd.mjs'), ts.transpileModule(src, {
  compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ESNext },
}).outputText);
const OLD = await import(pathToFileURL(path.join(tdir, 'cd.mjs')).href);
const NEW = await import('/home/user/-ai-chat-server/new/boxes/cloud-diff.mjs');

// ── קורפוס-LCG דטרמיניסטי ──
let s = 20260824;
const rnd = () => (s = (s * 1664525 + 1013904223) >>> 0) / 2 ** 32;
const pick = (a) => a[Math.floor(rnd() * a.length)];
const int = (n) => Math.floor(rnd() * n);

const NAMES = ['כהן', 'לוי', 'ברק', 'Cohen', '', null];
const randItem = () => {
  const it = { id: 'id' + int(6), v: int(100), name: pick(NAMES), nested: { a: int(3) } };
  const don = pick([undefined, [], [{ rid: int(50) }], [{ rid: 1 }, { rid: 2 }]]);
  if (don !== undefined) it.donations = don; // תומכים (וגם אחרים) עשויים לשאת donations
  return it;
};
const randList = () => Array.from({ length: int(5) }, randItem); // ids עשויים לחזור — Map מכריע זהה בשני-הצדדים
const randMeta = () => ({
  orgName: pick(['מאור', 'חסד', null]),
  orgSite: pick(['s1', '', undefined]),
  orgDonate: pick(['d1', null]),
  orgGoal: int(1000),
  budget: int(500),
  usdRate: pick([3.5, 3.7]),
  audit: pick([[], [{ a: 1 }]]),
  notif: pick([{}, { x: 1 }]),
  reports: pick([{}, null]),
  ui: pick([{}, { t: int(3) }]),
  seq: int(20),
  receiptSeq: int(20),
  donationSeq: int(20),
  shopReceiptSeq: int(20),
  attnDone: pick([{}, { d: 1 }]),
  savedAt: 't' + int(5),
});
const randDb = () => {
  const db = { ...randMeta() };
  for (const col of NEW.ENTITY_COLLECTIONS) db[col] = randList();
  return db;
};
// next = שכפול-רדוד של prev (רפרנסים משותפים ⇒ דילוג-===), ואז מוטציות אקראיות
const nextOf = (prev) => {
  const nx = { ...prev };
  for (const col of NEW.ENTITY_COLLECTIONS) {
    const r = rnd();
    if (r < 0.3) nx[col] = randList();                 // רשימה חדשה ⇒ diff פר-ישות
    else if (r < 0.55) nx[col] = prev[col].map((x) => ({ ...x })); // עותק שווה-ערך ⇒ אפס-רעש
    // אחרת — אותה רפרנס ⇒ דילוג-===
  }
  const mm = randMeta();
  if (rnd() < 0.5) nx.seq = mm.seq;
  if (rnd() < 0.4) nx.orgName = mm.orgName;
  if (rnd() < 0.4) nx.ui = mm.ui;
  if (rnd() < 0.5) nx.savedAt = mm.savedAt; // רעש — לא אמור להדליק meta
  return nx;
};

const J = (x) => JSON.stringify(x);
let n = 0;

// קבועים
assert.strictEqual(J(NEW.ENTITY_COLLECTIONS), J(OLD.ENTITY_COLLECTIONS), 'ENTITY_COLLECTIONS'); n++;
assert.strictEqual(NEW.DONATIONS_COL, OLD.DONATIONS_COL, 'DONATIONS_COL'); n++;

const SLUGS = ['acme', '', 'חסד', 'org-2'];
const COLS = ['families', 'supporters', 'warehouse'];
for (let i = 0; i < 400; i++) {
  const prev = randDb();
  const next = nextOf(prev);

  // diffDb — תו-בתו (sets/deletes/meta)
  assert.strictEqual(J(NEW.diffDb(prev, next)), J(OLD.diffDb(prev, next)), 'diffDb'); n++;
  // fullDbDiff
  const nf = NEW.fullDbDiff(prev), of = OLD.fullDbDiff(prev);
  assert.strictEqual(J(nf), J(of), 'fullDbDiff'); n++;
  // emptyDiff (על diff-אמת)
  assert.strictEqual(NEW.emptyDiff(nf), OLD.emptyDiff(of), 'emptyDiff'); n++;
  // metaOf
  assert.strictEqual(J(NEW.metaOf(prev)), J(OLD.metaOf(prev)), 'metaOf'); n++;
  // stripSupporterDonations (על diff מלא — יש מסמכי-supporters)
  assert.strictEqual(J(NEW.stripSupporterDonations(of)), J(OLD.stripSupporterDonations(of)), 'strip'); n++;

  // נתיבים
  const slug = pick(SLUGS), cr = pick([true, false]), col = pick(COLS);
  assert.strictEqual(NEW.colPath(slug, cr, col), OLD.colPath(slug, cr, col), 'colPath'); n++;
  assert.strictEqual(NEW.metaPath(slug, cr), OLD.metaPath(slug, cr), 'metaPath'); n++;
  assert.strictEqual(NEW.envPath(slug, cr), OLD.envPath(slug, cr), 'envPath'); n++;
  assert.strictEqual(NEW.donationsPath(slug, cr), OLD.donationsPath(slug, cr), 'donationsPath'); n++;
}
fs.rmSync(tdir, { recursive: true, force: true });
console.log(`🥇 זהב-cloud-diff: ישן≡חדש על ${n} השוואות (400 סבבים: diffDb/fullDbDiff/emptyDiff/metaOf/strip תו-בתו + 4 נתיבים)`);
