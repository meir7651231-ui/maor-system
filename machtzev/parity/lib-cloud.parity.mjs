#!/usr/bin/env node
/** 🥇 רתמת-זהב · lib-cloud — הישן (maor cloud.ts + cloud-diff.ts, מתורגם-חי) ≡ החדש
 *  (Genesis new/boxes/lib-cloud.mjs) על קורפוס-LCG: קודי-שגיאת-Auth × תחומים ×
 *  זוגות-מונים. אפס-סטייה. בלי Date.now (הכרעות טהורות בלבד — תאריכים לא מעורבים). */
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { createRequire } from 'node:module';
import assert from 'node:assert';

const require = createRequire('/home/user/maor-system/');
const ts = require('typescript');
const tdir = fs.mkdtempSync(path.join(os.tmpdir(), 'lc-'));
const emit = (name, tsSrc) => {
  const js = ts.transpileModule(tsSrc, { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ESNext } }).outputText;
  const p = path.join(tdir, name);
  fs.writeFileSync(p, js);
  return pathToFileURL(p).href;
};

const cloud = fs.readFileSync('/home/user/maor-system/src/lib/cloud.ts', 'utf8').split('\n');
const diff = fs.readFileSync('/home/user/maor-system/src/lib/cloud-diff.ts', 'utf8').split('\n');
const L = (arr, a, b) => arr.slice(a - 1, b).join('\n'); // 1-based כולל

// ── מודול-נתיבים חי מ-cloud-diff.ts:45-69 ──
const OLDP = await import(emit('paths.mjs', L(diff, 45, 69)));

// ── מודול-Auth/מונים חי מ-cloud.ts (פונקציה + מיפויים עטופים + מיזוג-מונים) ──
const authSrc = [
  L(cloud, 278, 296),                                   // function hebrewAuthError
  'export function signUpMap(e){',   L(cloud, 329, 334), '}',
  'export function resetMap(e){',    L(cloud, 351, 354), '}',
  'export function changeCurMap(e){',L(cloud, 368, 371), '}',
  'export function changeNextMap(e){',L(cloud, 376, 378), '}',
  "const META_COUNTER_KEYS = ['seq', 'receiptSeq', 'donationSeq', 'shopReceiptSeq'];",
  'export function mergeMeta(existing, meta){', L(cloud, 411, 416), 'return safe;', '}',
  'export { hebrewAuthError };',
].join('\n');
const OLDA = await import(emit('auth.mjs', authSrc));

const NEW = await import('/home/user/-ai-chat-server/new/boxes/lib-cloud.mjs');

// עוזר: הודעת-Error מ-מיפוי-זורק (הישן) מול Error-מוחזר (החדש)
const thrownMsg = (fn, e) => { try { fn(e); return '<no-throw>'; } catch (x) { return x.message; } };

let s = 20260824;
const rnd = () => (s = (s * 1664525 + 1013904223) >>> 0) / 2 ** 32;
const pick = (a) => a[Math.floor(rnd() * a.length)];
const codes = [
  'auth/invalid-credential', 'auth/invalid-login-credentials', 'auth/wrong-password',
  'auth/user-not-found', 'auth/invalid-email', 'auth/network-request-failed',
  'auth/too-many-requests', 'auth/user-disabled', 'auth/email-already-in-use',
  'auth/weak-password', 'auth/operation-not-allowed', 'auth/zzz-unknown', '',
];
const slugs = ['default', 'acme', 'or-rishon', 'x'];
const nums = [undefined, 0, 3, 5, 9, 12, 100];

let n = 0;
for (let i = 0; i < 400; i++) {
  // ── שגיאה: אובייקט-קוד או null ──
  const e = rnd() < 0.1 ? null : { code: pick(codes) };
  assert.strictEqual(NEW.hebrewAuthError(e).message, OLDA.hebrewAuthError(e).message, 'hebrewAuthError'); n++;
  assert.strictEqual(NEW.signUpError(e).message, thrownMsg(OLDA.signUpMap, e), 'signUpError'); n++;
  assert.strictEqual(NEW.resetPasswordError(e).message, thrownMsg(OLDA.resetMap, e), 'resetPasswordError'); n++;
  assert.strictEqual(NEW.changePasswordCurrentError(e).message, thrownMsg(OLDA.changeCurMap, e), 'changePwCur'); n++;
  assert.strictEqual(NEW.changePasswordNextError(e).message, thrownMsg(OLDA.changeNextMap, e), 'changePwNext'); n++;

  // ── נתיבים מתוחמים ≡ cloud-diff הישן ──
  const scope = { slug: pick(slugs), cloudRoot: rnd() < 0.5 };
  const col = pick(['families', 'supporters', 'events', 'auditlog', 'smsOutbox']);
  assert.strictEqual(NEW.scopedCol(scope, col), OLDP.colPath(scope.slug, scope.cloudRoot, col), 'scopedCol'); n++;
  assert.strictEqual(NEW.scopedMeta(scope), OLDP.metaPath(scope.slug, scope.cloudRoot), 'scopedMeta'); n++;
  assert.strictEqual(NEW.scopedEnv(scope), OLDP.envPath(scope.slug, scope.cloudRoot), 'scopedEnv'); n++;
  assert.strictEqual(NEW.scopedDonations(scope), OLDP.donationsPath(scope.slug, scope.cloudRoot), 'scopedDonations'); n++;

  // ── מיזוג-בטוח-למונים ≡ הלולאה הישנה ──
  const existing = {};
  const meta = { orgName: 'א' + i };
  for (const k of ['seq', 'receiptSeq', 'donationSeq', 'shopReceiptSeq']) {
    const ev = pick(nums), mv = pick(nums);
    if (ev !== undefined) existing[k] = ev;
    if (mv !== undefined) meta[k] = mv;
  }
  assert.deepStrictEqual(NEW.mergeMetaCounters(existing, meta), OLDA.mergeMeta(existing, meta), 'mergeMetaCounters'); n++;
}

fs.rmSync(tdir, { recursive: true, force: true });
console.log(`🥇 זהב-lib-cloud: ישן≡חדש על ${n} השוואות (400 סבבים: מילון-Auth + 4 מיפויי-שגיאה + 4 נתיבים + מיזוג-מונים — תו-בתו)`);
