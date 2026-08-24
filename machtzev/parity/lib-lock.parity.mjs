#!/usr/bin/env node
/** 🥇 רתמת-זהב · lib-lock — הישן (maor/src/lib/lock.ts, מתורגם-חי ב-typescript של
 *  מאור) ≡ החדש (Genesis new/boxes/lib-lock.mjs) על קורפוס-LCG (seed=20260824):
 *  PIN-ים (חוקיים/פסולים/עברית/ריק) × מרחבי-שם (default/demo/or-rishon) ×
 *  תצורות-נעילה × מיגרציה-רכה. crypto.subtle אמיתי · בלי Date.now. אפס-סטייה.
 *
 *  שני שקעי-הצבה מוזרקים כך ששני הצדדים חולקים אותה סמנטיקה:
 *  ‏(1) nsLsKey — המקור מייבא מ-persist; מוזרק כדיספצ׳ר גלובלי שגם החדש מקבל.
 *  ‏(2) localStorage — המקור משתמש בגלובל; מוקם למפה-משותפת שהחדש מקבל כפרמטר. */
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { createRequire } from 'node:module';
import assert from 'node:assert';

// ── localStorage-דמה משותף (הישן קורא לגלובל; החדש מקבלו מוזרק) ──
const store = new Map();
const storage = {
  getItem: (k) => (store.has(k) ? store.get(k) : null),
  setItem: (k, v) => { store.set(k, String(v)); },
  removeItem: (k) => { store.delete(k); },
};
globalThis.localStorage = storage;

// ── שקע-nsLsKey מוזרק כדיספצ׳ר: המקור מפנה אליו, נשלט פר-סבב ──
let ns = (b) => b;
globalThis.__lockNs = (b) => ns(b);

// ── טרנספילציה-חיה של המקור עם ה-typescript של מאור ──
const require = createRequire('/home/user/maor-system/');
const ts = require('typescript');
const tdir = fs.mkdtempSync(path.join(os.tmpdir(), 'lk-'));
const srcTs = fs.readFileSync('/home/user/maor-system/src/lib/lock.ts', 'utf8')
  .replace(
    "import { nsLsKey } from '../store/persist';",
    'const nsLsKey = (b) => globalThis.__lockNs(b);',
  );
fs.writeFileSync(
  path.join(tdir, 'lock.mjs'),
  ts.transpileModule(srcTs, { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ESNext } }).outputText,
);
const OLD = await import(pathToFileURL(path.join(tdir, 'lock.mjs')).href);
const NEW = await import('/home/user/-ai-chat-server/new/boxes/lib-lock.mjs');

// ── קורפוס-LCG דטרמיניסטי ──
let s = 20260824;
const rnd = () => (s = (s * 1664525 + 1013904223) >>> 0) / 2 ** 32;
const pick = (a) => a[Math.floor(rnd() * a.length)];
const pins = ['1234', '0000', '87654321', '5', '123', '999999', '00001111', '12a4', '', 'שלום', '1234567', '123456789'];
const nsFns = [(b) => b, (b) => `${b}:demo`, (b) => `${b}:or-rishon`, (b) => `${b}:קהילה`];
const cfgs = [
  {}, { primary: 'p1' }, { secondary: 's1' }, { primary: 'p1', secondary: 's1' },
  { primary: 'p1', zones: ['wizard'] }, { primary: '', secondary: '' }, { zones: [] },
];

// קבועי-האזורים ביט-זהים
assert.deepStrictEqual(NEW.LOCK_ZONES, OLD.LOCK_ZONES, 'LOCK_ZONES');
assert.deepStrictEqual(NEW.DEFAULT_LOCK_ZONES, OLD.DEFAULT_LOCK_ZONES, 'DEFAULT_LOCK_ZONES');

let n = 0;
for (let i = 0; i < 260; i++) {
  const pin = pick(pins);
  const nsFn = pick(nsFns);
  const cfg = pick(cfgs);
  ns = nsFn; // הישן קורא דרך הדיספצ׳ר; החדש מקבל את nsFn ישירות

  // 1) lockKey — מפתח-תחום זהה
  assert.strictEqual(NEW.lockKey(nsFn), OLD.lockKey(), `lockKey#${i}`);
  n++;

  // 2) isValidPin — דין-האורך זהה
  assert.strictEqual(NEW.isValidPin(pin), OLD.isValidPin(pin), `isValidPin(${JSON.stringify(pin)})#${i}`);
  n++;

  // 3) hashPin — גיבוב hex זהה (crypto.subtle אמיתי, אותו מלח)
  const hNew = await NEW.hashPin(pin);
  const hOld = await OLD.hashPin(pin);
  assert.strictEqual(hNew, hOld, `hashPin(${JSON.stringify(pin)})#${i}`);
  n++;

  // 4) verifyPin — נכון/שגוי/חסר, שרשרת-המלח זהה
  assert.strictEqual(await NEW.verifyPin(pin, hNew), await OLD.verifyPin(pin, hOld), `verifyPin-match#${i}`);
  assert.strictEqual(await NEW.verifyPin(pin, 'deadbeef'), await OLD.verifyPin(pin, 'deadbeef'), `verifyPin-miss#${i}`);
  assert.strictEqual(await NEW.verifyPin(pin, undefined), await OLD.verifyPin(pin, undefined), `verifyPin-undef#${i}`);
  n++;

  // 5) writeLock ⇒ תמונת-אחסון זהה (ישן וחדש כותבים אותו דבר) + readLock round-trip
  store.clear();
  OLD.writeLock(cfg);
  const snapOld = JSON.stringify([...store.entries()].sort());
  store.clear();
  NEW.writeLock(nsFn, storage, cfg);
  const snapNew = JSON.stringify([...store.entries()].sort());
  assert.strictEqual(snapNew, snapOld, `writeLock snapshot#${i} cfg=${JSON.stringify(cfg)}`);
  assert.deepStrictEqual(NEW.readLock(nsFn, storage), OLD.readLock(), `readLock round-trip#${i}`);
  n++;

  // 6) מיגרציה-רכה: נעילה ישנה תחת bare 'maor_lock', תחום בלי מפתח-משלו ⇒ נפילה
  store.clear();
  store.set('maor_lock', JSON.stringify({ primary: 'legacy' }));
  assert.deepStrictEqual(NEW.readLock(nsFn, storage), OLD.readLock(), `migration#${i}`);
  n++;
}

fs.rmSync(tdir, { recursive: true, force: true });
console.log(`🥇 זהב-lib-lock: ישן≡חדש על ${n} השוואות (260 סבבים: lockKey + isValidPin + hashPin(subtle) + verifyPin + writeLock-snapshot/round-trip + מיגרציה-רכה)`);
