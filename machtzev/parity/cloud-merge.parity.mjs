#!/usr/bin/env node
/** 🥇 רתמת-זהב · cloud-merge — הישן (maor/src/lib/cloud-merge.ts, מתורגם-חי) ≡ החדש
 *  (Genesis new/boxes/cloud-merge.mjs) על קורפוס-LCG seed=20260824: מסמכים-נכנסים
 *  פגומים/חלקיים · אוספים עם/בלי שדות-רשימה · מחיקות · תרומות-תומך לפי rid ·
 *  meta עם מונים/undefined/עברית. אפס-סטייה, אפס Date.now (מזהים קבועים). */
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { createRequire } from 'node:module';
import assert from 'node:assert';

const require = createRequire('/home/user/maor-system/');
const ts = require('typescript');
const tdir = fs.mkdtempSync(path.join(os.tmpdir(), 'cm-'));
const tp = (s) => ts.transpileModule(s, { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ESNext } }).outputText;

// cloud-diff.ts — ENTITY_COLLECTIONS (import type Db נמחק בטרנספילציה).
fs.writeFileSync(path.join(tdir, 'cloud-diff.mjs'), tp(fs.readFileSync('/home/user/maor-system/src/lib/cloud-diff.ts', 'utf8')));
// cloud-merge.ts — רק תיקון-נתיב-ESM: './cloud-diff' ⇒ './cloud-diff.mjs' (אין שינוי-לוגיקה).
const mergeSrc = fs.readFileSync('/home/user/maor-system/src/lib/cloud-merge.ts', 'utf8').replace("from './cloud-diff'", "from './cloud-diff.mjs'");
fs.writeFileSync(path.join(tdir, 'cloud-merge.mjs'), tp(mergeSrc));

const OLD = await import(pathToFileURL(path.join(tdir, 'cloud-merge.mjs')).href);
const NEW = await import('/home/user/-ai-chat-server/new/boxes/cloud-merge.mjs');

// ── קורפוס-LCG דטרמיניסטי ──
let s = 20260824;
const rnd = () => (s = (s * 1664525 + 1013904223) >>> 0) / 2 ** 32;
const pick = (a) => a[Math.floor(rnd() * a.length)];
const int = (n) => Math.floor(rnd() * n);

const COLS = ['families', 'enrollments', 'supporters', 'shopItems', 'rooms', 'courses', 'ghosts', 'tzBoxes'];
const RIDS = ['A', 'B', 'C', 'D', null, undefined];
const NAMES = ['כהן', 'לוי', 'Cohen', '', null];

const randDon = () => pick([undefined, [], 'notarray', [{ rid: pick(RIDS), amt: int(100) }], [{ rid: 'A' }, { rid: 'B' }]]);
const randDoc = () => {
  const data = { name: pick(NAMES), v: int(50) };
  if (rnd() < 0.5) data.donations = randDon();
  if (rnd() < 0.3) data.members = pick([undefined, [], 'x', [{ n: 1 }]]);
  if (rnd() < 0.3) data.count = pick([undefined, 0, int(10), 'bad']);
  if (rnd() < 0.3) data.id = 'id' + int(4); // data נושא id משלו — בוחן סדר-מפתחות
  return { id: 'id' + int(4), data, deleted: rnd() < 0.25 };
};
const randListItem = () => {
  const it = { id: 'id' + int(4), name: pick(NAMES), count: pick([undefined, int(10), 'bad']) };
  if (rnd() < 0.5) it.donations = pick([[], [{ rid: 'A' }], [{ rid: 'C' }]]);
  return it;
};
const randDb = () => ({
  families: Array.from({ length: int(4) }, randListItem),
  enrollments: Array.from({ length: int(3) }, randListItem),
  supporters: Array.from({ length: int(4) }, randListItem),
  shopItems: Array.from({ length: int(3) }, randListItem),
  rooms: Array.from({ length: int(3) }, randListItem),
  courses: Array.from({ length: int(3) }, randListItem),
  tzBoxes: Array.from({ length: int(2) }, randListItem),
  seq: int(20), receiptSeq: int(20), donationSeq: int(20), shopReceiptSeq: int(20),
  orgName: pick(NAMES), orgSite: pick(['s', '', undefined]), budget: pick([undefined, 0, int(999)]),
  usdRate: pick([undefined, 3.6, int(5)]), ui: pick([undefined, {}, { a: int(3) }]), attnDone: pick([undefined, [], ['x']]),
});
const randMeta = () => ({
  orgName: pick([...NAMES, undefined]), orgSite: pick(['s', '', undefined]), orgDonate: pick(['d', undefined]),
  orgGoal: pick([undefined, int(9)]), budget: pick([undefined, 0, int(999)]), usdRate: pick([undefined, 3.6]),
  audit: pick([undefined, [], [{ t: 1 }]]), notif: pick([undefined, {}]), reports: pick([undefined, { r: 1 }]),
  ui: pick([undefined, { a: int(3) }]), attnDone: pick([undefined, ['x']]),
  seq: pick([undefined, int(30), 'bad', -1]), receiptSeq: pick([undefined, int(30)]),
  donationSeq: pick([undefined, int(30)]), shopReceiptSeq: pick([undefined, int(30)]),
});

let n = 0;
for (let i = 0; i < 400; i++) {
  const col = pick(COLS);
  // 1) sanitizeIncoming — מסמך גולמי
  const item = randDoc().data;
  assert.deepStrictEqual(NEW.sanitizeIncoming(col, item), OLD.sanitizeIncoming(col, item), `sanitize ${col}`); n++;
  // 2) mergeDonationsPreserving — local מול incoming
  const local = randListItem(), incoming = randListItem();
  assert.deepStrictEqual(NEW.mergeDonationsPreserving(col, local, incoming), OLD.mergeDonationsPreserving(col, local, incoming), `merge ${col}`); n++;
  // 3) applyEntityPartial — DB שלם מול חבילת-docs
  const db = randDb();
  const docs = Array.from({ length: int(4) }, randDoc);
  assert.deepStrictEqual(NEW.applyEntityPartial(db, col, docs), OLD.applyEntityPartial(db, col, docs), `entity ${col}`); n++;
  // 4) applyMetaPartial — DB מול meta (אותו meta לשני-הצדדים!)
  const meta = randMeta();
  assert.deepStrictEqual(NEW.applyMetaPartial(db, meta), OLD.applyMetaPartial(db, meta), 'meta'); n++;
}

fs.rmSync(tdir, { recursive: true, force: true });
console.log(`🥇 זהב-מיזוג-הענן: ישן≡חדש על ${n} השוואות (400 סבבים: sanitize + merge-donations + entity-partial + meta-partial, כולל מסמכים-פגומים/מחיקות/rid/עברית)`);
