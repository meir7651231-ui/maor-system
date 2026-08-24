#!/usr/bin/env node
/** 🥇 רתמת-זהב · הצפנת-ענן doc-level — הישן (maor src/lib/cloudCrypto.ts מתורגם-חי,
 *  בשלמותו, מעל crypto.ts המתורגם) ≡ החדש (Genesis new/boxes/cloud-crypto.mjs).
 *  קורפוס-LCG seed=20260824 (בלי Date.now). ⚠️ AES-GCM מזריק IV/salt/DEK אקראיים
 *  ⇒ שוויון-בייטים בלתי-אפשרי-במכוון; האורקל הוא **אינטר-אופ**: מסמך/מעטפת של
 *  צד-אחד נפתחים בצד-השני (old↔new cross round-trip) + שוויון-בוליאני תו-בתו
 *  לבודקים המבניים (isEncDoc/isEncrypted). */
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { createRequire } from 'node:module';
import assert from 'node:assert';

const require = createRequire('/home/user/maor-system/');
const ts = require('typescript');
const tdir = fs.mkdtempSync(path.join(os.tmpdir(), 'cc-'));
const transpile = (src) => ts.transpileModule(src, { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ESNext } }).outputText;

// crypto.ts — טהור, בלי imports; מתורגם בשלמותו (מקור encryptDb/openDek/isEncrypted)
fs.writeFileSync(path.join(tdir, 'crypto.mjs'), transpile(fs.readFileSync('/home/user/maor-system/src/lib/crypto.ts', 'utf8')));
// cloudCrypto.ts — בשלמותו; ה-import מ-'./crypto' מופנה לקובץ-האחות המתורגם
let ccSrc = transpile(fs.readFileSync('/home/user/maor-system/src/lib/cloudCrypto.ts', 'utf8'));
ccSrc = ccSrc.replace(/'\.\/crypto'/g, "'./crypto.mjs'");
fs.writeFileSync(path.join(tdir, 'cloudCrypto.mjs'), ccSrc);

const OLD = await import(pathToFileURL(path.join(tdir, 'cloudCrypto.mjs')).href);
const OLDC = await import(pathToFileURL(path.join(tdir, 'crypto.mjs')).href);
const NEW = await import('/home/user/-ai-chat-server/new/boxes/cloud-crypto.mjs');
// שקעי-מודול-אחר לחדש = בדיוק פונקציות-crypto הישנות המתורגמות ⇒ אותם פרימיטיבים
const deps = { encryptDb: OLDC.encryptDb, openDek: OLDC.openDek };

let s = 20260824;
const rnd = () => (s = (s * 1664525 + 1013904223) >>> 0) / 2 ** 32;
const pick = (a) => a[Math.floor(rnd() * a.length)];

let n = 0;

// ── (1) בודקים מבניים ≡ תו-בתו על קורפוס ──
const structs = [
  { enc: 'a', iv: 'b' }, { enc: 7, iv: 'b' }, { enc: 'a', iv: 9 }, { enc: 'a' }, { iv: 'b' },
  { id: 'f1', name: 'משה' }, {}, null, undefined, 0, 'str', { $enc: 2 }, { $enc: 1 }, { $enc: 2, iter: 5 },
];
for (let i = 0; i < 300; i++) {
  const x = pick(structs);
  assert.strictEqual(NEW.isEncDoc(x), OLD.isEncDoc(x), `isEncDoc ${JSON.stringify(x)}`);
  assert.strictEqual(NEW.isEncrypted(x), OLD.isEncrypted(x), `isEncrypted ${JSON.stringify(x)}`);
  n += 2;
}

// ── (2) מסמכים doc-level: אינטר-אופ + passthrough ──
// DEK-אמת יחיד (AES-GCM 256) שהצדדים חולקים; encryptDoc/decryptDoc מקבלים dek כפרמטר.
const dekRaw = new Uint8Array(32).map((_, i) => (i * 7 + 3) & 0xff);
const dek = await crypto.subtle.importKey('raw', dekRaw, 'AES-GCM', true, ['encrypt', 'decrypt']);
const payloads = [
  { id: 's7', ils: 120, name: 'שרה' }, { id: 'f1', tags: ['א', 'ב'], n: 0 },
  { txt: 'עברית עם "גרשיים" ו-\n שורה', amount: -5.5 }, { nested: { a: { b: [1, 2, 3] } } },
  { empty: '' }, { unicode: '🚚🙏 שלום', bool: true, nul: null }, { big: 'x'.repeat(500) },
];
for (let i = 0; i < 70; i++) {
  const p = pick(payloads);
  // new→old ו-old→new: מסמך שהוצפן בצד-אחד מפוענח בצד-השני לזהה
  const encNew = await NEW.encryptDoc(p, dek);
  assert.ok(NEW.isEncDoc(encNew) && typeof encNew.enc === 'string' && typeof encNew.iv === 'string', 'encNew צורה');
  assert.deepStrictEqual(await OLD.decryptDoc(encNew, dek), p, 'new→old round-trip');
  const encOld = await OLD.encryptDoc(p, dek);
  assert.deepStrictEqual(await NEW.decryptDoc(encOld, dek), p, 'old→new round-trip');
  // IV-טרי בשני הצדדים
  assert.notStrictEqual((await NEW.encryptDoc(p, dek)).iv, encNew.iv, 'IV טרי');
  // plaintext-passthrough ≡ (אותה רפרנס בכל צד)
  const pt = { id: 'p' + i, name: 'משה' };
  assert.strictEqual(await NEW.decryptDoc(pt, dek), pt, 'new passthrough רפרנס');
  n += 4;
}
// DEK-שגוי ⇒ שני הצדדים דוחים
const dekBad = await crypto.subtle.importKey('raw', new Uint8Array(32).fill(9), 'AES-GCM', true, ['encrypt', 'decrypt']);
const someEnc = await NEW.encryptDoc({ x: 1 }, dek);
for (const M of [NEW, OLD]) { let rej = false; try { await M.decryptDoc(someEnc, dekBad); } catch { rej = true; } assert.ok(rej, 'DEK-שגוי נדחה'); n++; }

// ── (3) envelope-מפתח: אינטר-אופ מלא (PBKDF2-כבד ⇒ מעט סבבים) ──
const secrets = [['סוד7', 'REC-ALPHA-42'], ['pw שני', 'REC-BET-99'], ['p@ss:w/rd', 'ZZ-77']];
for (const [pw, rec] of secrets) {
  const { env: envNew, dek: dekN } = await NEW.createCloudKey(pw, rec, deps);
  assert.ok(NEW.isEncrypted(envNew), 'envNew מעטפת');
  // ה-DEK החי אכן פותח: הצפן→פענח
  const rt = await NEW.decryptDoc(await NEW.encryptDoc({ ok: 1 }, dekN), dekN);
  assert.deepStrictEqual(rt, { ok: 1 }, 'dek חי עובד');
  // openCloudKey (חדש) פותח את envNew בסיסמה ובמפתח-שחזור; סוד-שגוי⇒null
  assert.ok((await NEW.openCloudKey(envNew, pw, 'pass', deps)) !== null, 'open pass');
  assert.ok((await NEW.openCloudKey(envNew, rec, 'rec', deps)) !== null, 'open rec');
  assert.strictEqual(await NEW.openCloudKey(envNew, 'לא-נכון', 'pass', deps), null, 'סוד-שגוי⇒null');
  // אינטר-אופ צולב: מעטפת של הישן נפתחת בחדש, ומעטפת-החדש בישן
  const envOld = await OLD.createCloudKey(pw, rec);
  assert.ok((await NEW.openCloudKey(envOld.env, pw, 'pass', deps)) !== null, 'new פותח מעטפת-old');
  assert.ok((await OLD.openCloudKey(envNew, pw, 'pass')) !== null, 'old פותח מעטפת-new');
  n += 6;
}

fs.rmSync(tdir, { recursive: true, force: true });
console.log(`🥇 זהב-הצפנת-ענן: ישן≡חדש על ${n} השוואות (300× בודקים-מבניים תו-בתו + 70× מסמכים אינטר-אופ new↔old + IV-טרי + passthrough + DEK-שגוי + 3× envelope אינטר-אופ צולב pass/rec/שגוי)`);
