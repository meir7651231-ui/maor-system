#!/usr/bin/env node
/** 🥇 רתמת-זהב · lib-crypto — הישן (maor/src/lib/crypto.ts, מתורגם-חי ב-typescript
 *  של מאור) ≡ החדש (Genesis new/boxes/lib-crypto.mjs) על קורפוס-LCG (seed=20260824):
 *  json/סיסמה/מפתח-שחזור עברית/יוניקוד/ריק/JSON-מקונן (20 סבבים; PBKDF2@600K ⇒ קורפוס-עומק על-פני כמות). אפס-סטייה.
 *
 *  אנטרופיה = הפיגמנט הלא-דטרמיניסטי היחיד ⇒ crypto.getRandomValues מוחלף
 *  בזרם-LCG דטרמיניסטי, מאופס (reseed) לפני כל קריאת ישן/חדש כך ששניהם צורכים
 *  את אותו זרם ⇒ מעטפות ביט-זהות. crypto.subtle נשאר אמיתי. בלי Date.now. */
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { createRequire } from 'node:module';
import assert from 'node:assert';

// ── זרם-אנטרופיה דטרמיניסטי (LCG בייטים) המחליף את crypto.getRandomValues ──
let ent = 0;
const reseed = (s) => { ent = s >>> 0; };
const detFill = (arr) => {
  for (let i = 0; i < arr.length; i++) { ent = (ent * 1664525 + 1013904223) >>> 0; arr[i] = (ent >>> 16) & 0xff; }
  return arr;
};
Object.defineProperty(globalThis.crypto, 'getRandomValues', { value: detFill, configurable: true, writable: true });

// ── טרנספילציה-חיה של המקור עם ה-typescript של מאור ──
const require = createRequire('/home/user/maor-system/');
const ts = require('typescript');
const tdir = fs.mkdtempSync(path.join(os.tmpdir(), 'cx-'));
const srcTs = fs.readFileSync('/home/user/maor-system/src/lib/crypto.ts', 'utf8');
fs.writeFileSync(
  path.join(tdir, 'crypto.mjs'),
  ts.transpileModule(srcTs, { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ESNext } }).outputText,
);
const OLD = await import(pathToFileURL(path.join(tdir, 'crypto.mjs')).href);
const NEW = await import('/home/user/-ai-chat-server/new/boxes/lib-crypto.mjs');

// ── קורפוס-LCG לקלטים ──
let s = 20260824;
const rnd = () => (s = (s * 1664525 + 1013904223) >>> 0) / 2 ** 32;
const pick = (a) => a[Math.floor(rnd() * a.length)];
const jsons = [
  '{}', '{"a":1}', '[]', '"סתם מחרוזת"', '{"שָׁלוֹם":"עולם"}', '{"emoji":"😀🔒","n":-3.14}',
  '{"nested":{"x":[1,2,{"y":true}]},"רשימה":["א","ב","ג"]}', 'null', '12345', '{"ריק":""}',
];
const secrets = ['pw', 'סיסמה-חזקה!', 'A', '', 'סוד עם רווחים', '😀-key', 'longpassword-1234567890'];

let n = 0;
for (let i = 0; i < 20; i++) {
  const json = pick(jsons);
  const password = pick(secrets);
  // 0) genRecoveryKey — אותו זרם ⇒ מפתח זהה
  reseed(1000 + i); const rkOld = OLD.genRecoveryKey();
  reseed(1000 + i); const rkNew = NEW.genRecoveryKey();
  assert.strictEqual(rkNew, rkOld, `genRecoveryKey#${i}`);
  n++;
  const recoveryKey = rkNew;

  // 1) encryptDb — מעטפות ביט-זהות תחת אותו זרם-אנטרופיה
  reseed(7000 + i); const envOld = await OLD.encryptDb(json, password, recoveryKey);
  reseed(7000 + i); const envNew = await NEW.encryptDb(json, password, recoveryKey);
  assert.deepStrictEqual(envNew, envOld, `encryptDb envelope#${i} json=${json}`);
  n++;

  // 2) isEncrypted מסכים על מעטפת ועל לא-מעטפת
  assert.strictEqual(NEW.isEncrypted(envNew), OLD.isEncrypted(envOld), `isEncrypted#${i}`);
  assert.strictEqual(NEW.isEncrypted({ x: 1 }), OLD.isEncrypted({ x: 1 }), `isEncrypted-neg#${i}`);
  n++;

  // 3) אינטרופ צולב + round-trip: DEK של החדש ≡ פענוח הישן, ולהפך
  const dekNew = await NEW.openDek(envNew, password, 'pass');
  const dekOldViaNewEnv = await OLD.openDek(envNew, password, 'pass');
  assert.ok(dekNew && dekOldViaNewEnv, `openDek non-null#${i}`);
  assert.strictEqual(await NEW.decryptDb(envNew, dekNew), json, `NEW round-trip#${i}`);
  assert.strictEqual(await OLD.decryptDb(envNew, dekOldViaNewEnv), json, `OLD פותח מעטפת-חדשה#${i}`);
  const dekNewViaOldEnv = await NEW.openDek(envOld, recoveryKey, 'rec');
  assert.strictEqual(await NEW.decryptDb(envOld, dekNewViaOldEnv), json, `CHDASH פותח מעטפת-ישנה (rec)#${i}`);
  n++;

  // 4) סוד-שגוי ⇒ שניהם null
  assert.strictEqual(await NEW.openDek(envNew, password + 'x', 'pass'), await OLD.openDek(envOld, password + 'x', 'pass'), `wrong-secret null#${i}`);
  n++;

  // 5) reencryptDb — אותו זרם ⇒ מעטפות זהות + פענוח נכון
  const json2 = pick(jsons);
  reseed(9000 + i); const reOld = await OLD.reencryptDb(envOld, dekOldViaNewEnv, json2);
  reseed(9000 + i); const reNew = await NEW.reencryptDb(envNew, dekNew, json2);
  assert.deepStrictEqual(reNew, reOld, `reencryptDb#${i}`);
  assert.strictEqual(await NEW.decryptDb(reNew, dekNew), json2, `reencrypt round-trip#${i}`);
  n++;

  // 6) rewrapPassword — אותו זרם ⇒ מעטפות זהות; סיסמה-חדשה פותחת, מפתח-שחזור שורד
  const newPw = pick(secrets) + '#new';
  reseed(11000 + i); const rwOld = await OLD.rewrapPassword(envOld, dekOldViaNewEnv, newPw);
  reseed(11000 + i); const rwNew = await NEW.rewrapPassword(envNew, dekNew, newPw);
  assert.deepStrictEqual(rwNew, rwOld, `rewrapPassword#${i}`);
  const dekAfter = await NEW.openDek(rwNew, newPw, 'pass');
  assert.strictEqual(await NEW.decryptDb(rwNew, dekAfter), json, `rewrap: סיסמה-חדשה פותחת#${i}`);
  const dekRec = await NEW.openDek(rwNew, recoveryKey, 'rec');
  assert.strictEqual(await NEW.decryptDb(rwNew, dekRec), json, `rewrap: מפתח-שחזור שורד#${i}`);
  n++;
}

fs.rmSync(tdir, { recursive: true, force: true });
console.log(`🥇 זהב-lib-crypto: ישן≡חדש על ${n} השוואות (20 סבבים: genKey + מעטפת ביט-בית + isEncrypted + אינטרופ-round-trip + סוד-שגוי + reencrypt + rewrap)`);
